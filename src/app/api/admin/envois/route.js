import { isAdmin, getEnvois, ajouterEnvoi, majEnvoi, supprimerEnvoi, getStockMap, ajouterJournal, ENVOI_STATUTS, ENVOI_MOTIFS } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Gestion → Commandes → « Envois à faire » (20/11/2026) : produits manquants, remplacements, renvois gratuits.
// GET : les envois + les commandes récentes (pour rattacher et reprendre l'adresse) + les lignes de stock.
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const [envois, orders, stock, products] = await Promise.all([
    getEnvois(true).catch(() => []),
    getSiteOrders(300).catch(() => []),
    getStockMap(true).catch(() => ({})),
    getCatalogAdmin().catch(() => []),
  ]);
  const lignes = []; const vus = new Set();
  const ajoute = (id, nom) => { if (!id || vus.has(id)) return; vus.add(id); lignes.push({ id, nom, stock: typeof stock[id] === "number" ? stock[id] : null }); };
  for (const p of products || []) {
    for (const v of p.variants || []) ajoute(v.stockId || v.id, `${p.name}${v.title ? " · " + v.title : ""}`);
    for (const e of p.engravingPricing?.flatExtras || []) {
      for (const id of [e.stockId, ...Object.values(e.stockIdByVariant || {})].filter(Boolean)) ajoute(id, `${p.name} · option ${e.label || e.key || ""}`.trim());
    }
  }
  // Lignes de stock qui ne sont rattachées à aucune fiche (nouveaux socles, accessoires…).
  for (const id of Object.keys(stock || {})) if (!vus.has(id)) ajoute(id, id);
  lignes.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const cmd = (orders || []).filter((o) => o && !o.test).map((o) => {
    const a = o.shippingAddress || {};
    return {
      id: o.id, ref: o.ref || "", at: o.createdAt || null, client: o.customerName || o.shippingName || "", email: o.customerEmail || "",
      tel: o.customerPhone || "", methode: o.shippingMethod || "", relais: o.relaisPoint || "",
      adresse: { nom: o.shippingName || o.customerName || "", societe: o.shippingCompany || "", line1: a.line1 || "", line2: a.line2 || "", cp: a.postal_code || "", ville: a.city || "", pays: a.country || "FR", tel: o.customerPhone || "" },
    };
  });
  return Response.json({ envois, commandes: cmd, lignes, statuts: ENVOI_STATUTS, motifs: ENVOI_MOTIFS });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "ajouter") {
      const rec = await ajouterEnvoi(b);
      await ajouterJournal({ type: "envoi", cible: rec.ref || rec.client, label: `Envoi à faire ajouté : ${rec.articles.map((a) => `${a.qty} × ${a.nom}`).join(", ")}`, apres: rec.statut, source: "envois" });
      return Response.json({ ok: true, envoi: rec });
    }
    if (b.action === "maj") {
      const rec = await majEnvoi(String(b.id || ""), b);
      if (!rec) return Response.json({ error: "Envoi introuvable." }, { status: 404 });
      if (b.statut) await ajouterJournal({ type: "envoi", cible: rec.ref || rec.client, label: `Envoi « ${rec.articles.map((a) => a.nom).join(", ")} » : ${ENVOI_STATUTS[rec.statut]}`, apres: rec.statut, source: "envois" });
      return Response.json({ ok: true, envoi: rec });
    }
    if (b.action === "supprimer") {
      const rec = await supprimerEnvoi(String(b.id || ""));
      if (!rec) return Response.json({ error: "Envoi introuvable." }, { status: 404 });
      await ajouterJournal({ type: "envoi", cible: rec.ref || rec.client, label: "Envoi à faire supprimé (stock rendu)", avant: rec.statut, source: "envois" });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message || "Erreur." }, { status: 400 });
  }
}
