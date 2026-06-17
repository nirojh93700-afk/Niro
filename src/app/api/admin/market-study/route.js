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
    "Renvoie un JSON : un tableau d'objets avec EXACTEMENT ces clés : " +
    `{"categorie","produit","prix","bas","typique","haut","position","reco"}. ` +
    "\"position\" vaut \"Sous-évalué\", \"Bien placé\" ou \"Trop cher\". \"reco\" = action courte. " +
    "Si pas de prix fiable, mets \"n.d.\". Réponds par le JSON seul.";

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
      // repli : recherche web intégrée d'Anthropic
      const list = products.map((p) => `- ${p.name} | ${p.category} | ${priceOf(p)}`).join("\n");
      resp = await client.messages.create({
        model, max_tokens: 8000, system,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 12 }],
        messages: [{ role: "user", content: `Produits :\n${list}\n\nCherche les prix du marché français pour chaque produit. ${rule}` }],
      });
    }
  } catch (e) {
    return Response.json({ error: "Analyse impossible : " + (e?.message || String(e)) }, { status: 500 });
  }

  const text = (resp.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  let rows = [];
  try {
    const m = text.match(/\[[\s\S]*\]/);
    rows = JSON.parse(m ? m[0] : text);
  } catch {
    return Response.json({ error: "Réponse non exploitable, réessaie.", raw: text.slice(0, 2000) }, { status: 200 });
  }
  return Response.json({ rows, date: new Date().toISOString(), source: tavilyKey ? "tavily" : "anthropic" });
}
