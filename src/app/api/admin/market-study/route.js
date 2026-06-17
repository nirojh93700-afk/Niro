import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ÉTUDE DE MARCHÉ AUTOMATIQUE (réservée admin)
// 1) Recherche web GRATUITE via Tavily (TAVILY_API_KEY) — 1000 requêtes/mois offertes.
//    (Repli : recherche web intégrée d'Anthropic si Tavily non configuré.)
// 2) Synthèse PROFESSIONNELLE par Claude → tableau comparatif exploitable.

// --- Recherche Tavily : renvoie quelques extraits (titre, url, contenu) -------
async function tavily(query, key) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        max_results: 4,
        search_depth: "basic",
        include_answer: false,
        country: "france",
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r) => ({ title: r.title, url: r.url, content: (r.content || "").slice(0, 500) }));
  } catch { return []; }
}

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Clé ANTHROPIC_API_KEY manquante (à configurer)." }, { status: 500 });
  }

  let products = [];
  try { products = await getCatalogAdmin(); } catch { /* ignore */ }
  products = (products || []).filter((p) => !p.hidden);
  const priceOf = (p) => (p.variants?.[0]?.price != null ? p.variants[0].price + "€" : "?");

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const tavilyKey = process.env.TAVILY_API_KEY;

  const system =
    "Tu es analyste pricing e-commerce spécialiste du marché FRANÇAIS des cadeaux personnalisés (gravure laser : bijoux acier, verres, cristal 3D, déco mariage, clés USB). " +
    "Tu réponds UNIQUEMENT par un tableau JSON valide (aucun texte avant/après).";
  const rule =
    "Renvoie un OBJET JSON avec EXACTEMENT 2 clés : " +
    `{"rows": [...], "synthese": [...]}. ` +
    `"rows" = un tableau d'objets {"categorie","produit","prix","bas","typique","haut","position","reco"} ` +
    "(\"position\" vaut \"Sous-évalué\", \"Bien placé\" ou \"Trop cher\" ; \"reco\" = action courte ; si pas de prix fiable, \"n.d.\"). " +
    "\"synthese\" = un tableau de 5 à 8 phrases d'analyse professionnelle (où elle laisse de l'argent / produits sous-évalués, où elle est trop chère, tendances du marché, conseil prix et conseil livraison). " +
    "Réponds par l'OBJET JSON seul, rien d'autre.";

  let resp;
  try {
    if (tavilyKey) {
      // 1) recherche gratuite Tavily, un appel par produit
      const found = await inBatches(products, 6, async (p) => {
        const q = `${p.name} ${p.category} personnalisé gravé prix € France`;
        const results = await tavily(q, tavilyKey);
        return { name: p.name, category: p.category, price: priceOf(p), results };
      });
      const dossier = found
        .map((f) => {
          const ex = f.results.map((r) => `   • ${r.title} — ${r.content}`).join("\n") || "   (pas de résultat)";
          return `### ${f.name} | ${f.category} | prix actuel ${f.price}\n${ex}`;
        })
        .join("\n\n");
      resp = await client.messages.create({
        model, max_tokens: 8000, system,
        messages: [{
          role: "user",
          content: `Voici, pour chaque produit de la boutique « Niv Création », des extraits de pages concurrentes françaises (résultats de recherche).\n\n${dossier}\n\nÀ partir de ces extraits, déduis pour chaque produit la fourchette de prix du marché (bas / typique / haut), le positionnement et une reco. ${rule}`,
        }],
      });
    } else {
      // SÉCURITÉ « rien ne te prélève sans prévenir » : pas de clé Tavily = on ne
      // lance PAS la recherche payante d'Anthropic. On demande d'ajouter la clé gratuite.
      return Response.json({
        error: "Recherche gratuite non configurée. Ajoute la clé TAVILY_API_KEY (gratuite) dans Firebase pour lancer l'analyse — rien n'est facturé tant que ce n'est pas fait.",
      }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ error: "Analyse impossible : " + (e?.message || String(e)) }, { status: 500 });
  }

  const text = (resp.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  let rows = [], synthese = [];
  try {
    const m = text.match(/\{[\s\S]*\}/);
    const obj = JSON.parse(m ? m[0] : text);
    rows = Array.isArray(obj.rows) ? obj.rows : (Array.isArray(obj) ? obj : []);
    synthese = Array.isArray(obj.synthese) ? obj.synthese : [];
  } catch {
    // repli : ancien format (tableau simple)
    try { const a = text.match(/\[[\s\S]*\]/); rows = JSON.parse(a ? a[0] : text); } catch { /* ignore */ }
  }
  if (!rows.length) {
    return Response.json({ error: "Réponse non exploitable, réessaie.", raw: text.slice(0, 2000) }, { status: 200 });
  }
  return Response.json({ rows, synthese, date: new Date().toISOString(), source: tavilyKey ? "tavily" : "anthropic" });
}
