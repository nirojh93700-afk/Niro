import Anthropic from "@anthropic-ai/sdk";
import { isAdmin, getStockMap, adjustStockMany, getPurchases, addPurchase, setProductOverride, getSettings, setSettings } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// =============================================================================
// ACHATS FOURNISSEURS : une facture / un devis (PDF, photo, CSV, texte) →
// l'agent lit les lignes, les rapproche des produits du catalogue et PROPOSE
// des quantités à mettre en stock. Le gérant corrige et valide ; rien n'est
// écrit avant « apply ».
//   POST { action:"analyze", file:{ name, type, data(base64) }, text }
//   POST { action:"apply", supplier, invoiceNumber, date, shipping, total,
//          lines:[{ stockId, qty, unitPrice, label }], addExpense, updateCost }
//   GET  → { purchases } (historique)
// =============================================================================

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_FILE_BYTES = 12 * 1024 * 1024;

// Toutes les lignes de stock possibles : variantes + accessoires en option.
async function stockRows() {
  const products = await getCatalogAdmin();
  const map = await getStockMap();
  const rows = []; const seen = new Set();
  for (const p of products) {
    for (const v of p.variants || []) {
      const sk = v.stockId || v.id;
      if (seen.has(sk)) continue; seen.add(sk);
      rows.push({ stockId: sk, slug: p.slug, product: p.name, variant: v.title || "", category: p.category || "", stock: typeof map[sk] === "number" ? map[sk] : null, cost: Number(p.cost) > 0 ? Number(p.cost) : null });
    }
    for (const e of p.engravingPricing?.flatExtras || []) {
      const ids = [e.stockId, ...Object.values(e.stockIdByVariant || {})].filter(Boolean);
      for (const sid of ids) {
        if (seen.has(sid)) continue; seen.add(sid);
        rows.push({ stockId: sid, slug: p.slug, product: p.name, variant: `Option : ${e.label || e.key || sid}`, category: p.category || "", stock: typeof map[sid] === "number" ? map[sid] : null, cost: null });
      }
    }
  }
  return rows;
}

const PROPOSAL_TOOL = {
  name: "proposition_achat",
  description: "Lignes de la facture fournisseur rapprochées des produits du catalogue.",
  input_schema: {
    type: "object",
    properties: {
      supplier: { type: "string", description: "Nom du fournisseur" },
      invoiceNumber: { type: "string", description: "Numéro de facture / commande" },
      date: { type: "string", description: "Date au format AAAA-MM-JJ" },
      currency: { type: "string" },
      shipping: { type: "number", description: "Frais de port / import / douane, en euros (0 si absent)" },
      total: { type: "number", description: "Total payé, en euros" },
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Désignation telle qu'écrite sur la facture" },
            qty: { type: "number" },
            unitPrice: { type: "number", description: "Prix unitaire HT ou TTC tel que facturé, en euros" },
            stockId: { type: "string", description: "Identifiant de stock du catalogue le plus probable, ou chaîne vide si aucun ne correspond" },
            confidence: { type: "number", description: "0 à 1" },
            note: { type: "string", description: "Pourquoi ce rapprochement, ou pourquoi aucun (très court)" },
          },
          required: ["label", "qty", "unitPrice", "stockId", "confidence"],
        },
      },
    },
    required: ["supplier", "lines"],
  },
};

async function analyze({ file, text }) {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "Clé Claude absente : l'analyse automatique n'est pas disponible." };
  const rows = await stockRows();
  const catalogue = rows.map((r) => `${r.stockId} | ${r.product}${r.variant ? " — " + r.variant : ""}${r.category ? " (" + r.category + ")" : ""}`).join("\n");

  const content = [];
  if (file?.data) {
    const type = String(file.type || "").toLowerCase();
    const data = String(file.data).replace(/^data:[^;]+;base64,/, "");
    if (Buffer.byteLength(data, "base64") > MAX_FILE_BYTES) return { error: "Fichier trop lourd (12 Mo max)." };
    if (type === "application/pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    else if (/^image\/(jpeg|png|webp|gif)$/.test(type)) content.push({ type: "image", source: { type: "base64", media_type: type, data } });
    else if (/^text\/|csv|json/.test(type) || /\.(csv|txt|tsv)$/i.test(file.name || "")) content.push({ type: "text", text: `Contenu du fichier ${file.name || ""} :\n${Buffer.from(data, "base64").toString("utf-8").slice(0, 60000)}` });
    else return { error: "Format non pris en charge : PDF, photo (JPG/PNG/WebP), CSV ou texte." };
  }
  if (text && String(text).trim()) content.push({ type: "text", text: `Texte de la facture (collé) :\n${String(text).slice(0, 60000)}` });
  if (!content.length) return { error: "Ajoute un fichier ou colle le texte de la facture." };
  content.push({
    type: "text",
    text: `Tu es l'assistant d'achats d'une petite boutique artisanale (bijoux, verres gravés, cristaux, déco bois).
Lis cette facture / ce devis fournisseur et extrais CHAQUE ligne d'article (désignation, quantité, prix unitaire).
Puis rapproche chaque ligne du produit du catalogue ci-dessous (identifiant de stock). Une ligne = un identifiant au plus.
Règles : les couleurs comptent (doré / argenté / or rose = variantes différentes) ; si plusieurs variantes partagent
la même désignation sans couleur, choisis la plus probable et baisse la confiance ; si rien ne correspond, stockId = "" et
explique en 5 mots. Les frais de port / import / douane vont dans "shipping", jamais dans une ligne. Convertis en euros si
la facture est dans une autre devise (indique la devise d'origine dans "currency"). Ne devine JAMAIS une quantité : si
elle n'est pas lisible, mets 0.

CATALOGUE (identifiant | produit — variante) :
${catalogue}`,
  });

  const client = new Anthropic();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    tools: [PROPOSAL_TOOL],
    tool_choice: { type: "tool", name: PROPOSAL_TOOL.name },
    messages: [{ role: "user", content }],
  });
  const block = resp.content.find((b) => b.type === "tool_use");
  if (!block) return { error: "L'agent n'a pas pu lire la facture." };
  const inp = block.input || {};
  const valid = new Set(rows.map((r) => r.stockId));
  const lines = (Array.isArray(inp.lines) ? inp.lines : []).map((l) => ({
    label: String(l.label || "").slice(0, 160),
    qty: Math.max(0, Math.round(Number(l.qty) || 0)),
    unitPrice: Math.max(0, Math.round((Number(l.unitPrice) || 0) * 100) / 100),
    stockId: valid.has(String(l.stockId || "")) ? String(l.stockId) : "",
    confidence: Math.max(0, Math.min(1, Number(l.confidence) || 0)),
    note: String(l.note || "").slice(0, 120),
  }));
  return {
    proposal: {
      supplier: String(inp.supplier || "").slice(0, 80),
      invoiceNumber: String(inp.invoiceNumber || "").slice(0, 60),
      date: /^\d{4}-\d{2}-\d{2}/.test(String(inp.date || "")) ? String(inp.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      currency: String(inp.currency || "EUR").slice(0, 8),
      shipping: Math.max(0, Math.round((Number(inp.shipping) || 0) * 100) / 100),
      total: Math.max(0, Math.round((Number(inp.total) || 0) * 100) / 100),
      lines,
    },
    rows,
  };
}

async function apply(body) {
  const rows = await stockRows();
  const bySid = new Map(rows.map((r) => [r.stockId, r]));
  const lines = (Array.isArray(body.lines) ? body.lines : [])
    .map((l) => ({ stockId: String(l.stockId || ""), qty: Math.max(0, Math.round(Number(l.qty) || 0)), unitPrice: Math.max(0, Math.round((Number(l.unitPrice) || 0) * 100) / 100), label: String(l.label || "").slice(0, 160) }))
    .filter((l) => l.stockId && bySid.has(l.stockId) && l.qty > 0);
  if (!lines.length) return { error: "Aucune ligne valide (produit choisi + quantité > 0)." };

  const shipping = Math.max(0, Number(body.shipping) || 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const total = Math.max(0, Number(body.total) || 0) || Math.round((subtotal + shipping) * 100) / 100;
  const coef = subtotal > 0 ? 1 + shipping / subtotal : 1; // port réparti au prorata

  // 1) Stock (une seule écriture).
  const applied = await adjustStockMany(lines.map((l) => ({ stockId: l.stockId, qty: l.qty })));

  // 2) Coût d'achat du produit (port inclus), moyenne pondérée par produit.
  const costs = [];
  if (body.updateCost !== false) {
    const perSlug = {};
    for (const l of lines) {
      if (!l.unitPrice) continue;
      const slug = bySid.get(l.stockId).slug;
      perSlug[slug] = perSlug[slug] || { q: 0, v: 0 };
      perSlug[slug].q += l.qty; perSlug[slug].v += l.qty * l.unitPrice * coef;
    }
    for (const [slug, a] of Object.entries(perSlug)) {
      if (!a.q) continue;
      const cost = Math.round((a.v / a.q) * 100) / 100;
      try { await setProductOverride(slug, { cost }); costs.push({ slug, cost }); } catch { /* ignore */ }
    }
  }

  // 3) Dépense dans Bénéfices.
  let expense = null;
  if (body.addExpense !== false && total > 0) {
    try {
      const s = await getSettings();
      const label = `Achat fournisseur ${body.supplier || ""}${body.invoiceNumber ? " " + body.invoiceNumber : ""}`.trim().slice(0, 80);
      expense = { id: "dep_" + Math.random().toString(36).slice(2, 8), label, amount: Math.round(total * 100) / 100, date: /^\d{4}-\d{2}-\d{2}/.test(String(body.date || "")) ? String(body.date).slice(0, 10) : new Date().toISOString().slice(0, 10), category: "achat" };
      await setSettings({ expenses: [expense, ...(Array.isArray(s.expenses) ? s.expenses : [])].slice(0, 500) });
    } catch { expense = null; }
  }

  // 4) Historique.
  const rec = await addPurchase({
    supplier: String(body.supplier || "").slice(0, 80), invoiceNumber: String(body.invoiceNumber || "").slice(0, 60),
    date: String(body.date || "").slice(0, 10), fileName: String(body.fileName || "").slice(0, 120),
    shipping, total, expenseId: expense?.id || "",
    lines: lines.map((l) => { const r = bySid.get(l.stockId); const a = applied.find((x) => x.stockId === l.stockId); return { ...l, product: r.product, variant: r.variant, before: a?.before ?? 0, after: a?.after ?? 0 }; }),
  });
  return { ok: true, purchase: rec, applied, costs, expense };
}

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ purchases: await getPurchases() });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  try {
    if (body?.action === "analyze") {
      const r = await analyze({ file: body.file, text: body.text });
      return Response.json(r, { status: r.error ? 400 : 200 });
    }
    if (body?.action === "apply") {
      const r = await apply(body);
      return Response.json(r, { status: r.error ? 400 : 200 });
    }
  } catch (e) {
    return Response.json({ error: e?.status === 401 ? "Clé Claude invalide." : (e?.message || "Erreur.") }, { status: 500 });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
