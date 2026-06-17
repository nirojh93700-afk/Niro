import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ÉTUDE DE MARCHÉ AUTOMATIQUE (réservée admin)
// Compare TOUS les produits du catalogue aux prix des concurrents français,
// via Claude + recherche web. Renvoie un tableau exploitable par la page.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Clé ANTHROPIC_API_KEY manquante (à configurer)." }, { status: 500 });
  }

  let products = [];
  try { products = await getCatalogAdmin(); } catch { /* ignore */ }
  const list = (products || [])
    .filter((p) => !p.hidden)
    .map((p) => {
      const price = p.variants?.[0]?.price;
      return `- ${p.name} | ${p.category}${p.subcategory ? "/" + p.subcategory : ""} | ${price != null ? price + "€" : "?"}`;
    })
    .join("\n");

  const client = new Anthropic();
  const system =
    "Tu es analyste pricing e-commerce spécialiste du marché FRANÇAIS des cadeaux personnalisés (gravure laser : bijoux acier, verres, cristal 3D, déco mariage, clés USB). " +
    "Tu compares les prix de la boutique « Niv Création » aux concurrents français réels (Amikado, Cadeau Malin, KDO Magic, Histoire d'Or, Etsy France, Bobijoo, etc.). " +
    "Utilise la recherche web pour trouver de VRAIS prix. Sois concis et rigoureux. " +
    "Tu réponds UNIQUEMENT par un tableau JSON valide (aucun texte avant/après).";
  const prompt =
    `Produits de la boutique (Nom | catégorie | prix actuel) :\n${list}\n\n` +
    "Pour chaque produit, recherche la fourchette de prix du marché français pour un article équivalent. " +
    "Renvoie un JSON : un tableau d'objets avec EXACTEMENT ces clés : " +
    `{"categorie": "...", "produit": "...", "prix": "27,90 €", "bas": "15 €", "typique": "20-25 €", "haut": "33 €", "position": "Sous-évalué" | "Bien placé" | "Trop cher", "reco": "action courte"}. ` +
    "Regroupe par catégorie dans l'ordre des produits. Si tu ne trouves pas de prix fiable, mets \"n.d.\". Réponds par le JSON seul.";

  let resp;
  try {
    resp = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
      max_tokens: 8000,
      system,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 12 }],
      messages: [{ role: "user", content: prompt }],
    });
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
  return Response.json({ rows, date: new Date().toISOString() });
}
