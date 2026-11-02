import { isAdmin } from "@/lib/stock";
import { createQuote, listQuotes, updateQuoteStatus, getQuote, deleteQuote, setQuoteCounter, updateQuoteQuantite, updateQuotePanier } from "@/lib/firebase";
import { quoteEmail } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";

export const dynamic = "force-dynamic";

function siteOrigin(req) {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  for (const c of [raw, raw && `https://${raw}`]) {
    try { if (c) return new URL(c).origin; } catch {}
  }
  try { return new URL(req.url).origin; } catch { return ""; }
}

// « La cliente peut changer le nombre » (01/11/2026) : { modifiable, min, max } ou rien.
function nettoyerQte(qte) {
  if (!qte || qte.modifiable !== true) return null;
  const min = Math.max(1, Math.min(50, parseInt(qte.min, 10) || 1));
  const max = Math.max(min, Math.min(50, parseInt(qte.max, 10) || 12));
  return { modifiable: true, min, max };
}
const prixOuNull = (v) => (v === "" || v == null || !(parseFloat(v) >= 0) ? null : Math.round(parseFloat(v) * 100) / 100);

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const quotes = await listQuotes(150);
  return Response.json({ quotes: quotes || [], firebase: quotes !== null });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  if (body.action === "status") {
    const ok = await updateQuoteStatus(body.id, String(body.status || "").slice(0, 20));
    return Response.json({ ok });
  }

  // Monter le compteur de numérotation (le prochain devis/facture portera value+1).
  // Jamais vers le bas : impossible de créer deux documents au même numéro.
  if (body.action === "counter") {
    const r = await setQuoteCounter(body.type === "facture" ? "facture" : "devis", body.value);
    if (!r) return Response.json({ error: "Valeur invalide ou connexion à la base requise." }, { status: 400 });
    if (!r.ok) return Response.json({ error: `Le compteur est déjà à ${r.current} : on ne redescend jamais.` }, { status: 400 });
    return Response.json({ ok: true, current: r.current });
  }

  // Activer / régler la quantité modifiable d'un devis déjà créé.
  if (body.action === "quantite") {
    const q = await getQuote(body.id);
    if (!q) return Response.json({ error: "Document introuvable." }, { status: 404 });
    if (q.status === "paye") return Response.json({ error: "Ce devis est déjà payé." }, { status: 400 });
    const qte = nettoyerQte(body.qte);
    const lignes = (Array.isArray(body.lignes) ? body.lignes : []).map((l) => ({ suit: l?.suit === true, prixSuivant: prixOuNull(l?.prixSuivant) }));
    if (qte && !lignes.some((l) => l.suit)) return Response.json({ error: "Cochez au moins une ligne qui suit le nombre." }, { status: 400 });
    const ok = await updateQuoteQuantite(body.id, qte, qte ? lignes : []);
    return Response.json({ ok });
  }

  // Page du devis : emballage + « Compléter votre commande » proposés ou non (02/11/2026, actif par défaut).
  if (body.action === "panier") {
    const ok = await updateQuotePanier(body.id, body.off === true);
    return Response.json({ ok });
  }

  if (body.action === "delete") {
    if (!body.id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
    const ok = await deleteQuote(body.id);
    return Response.json({ ok });
  }

  // Envoi du devis / de la facture par e-mail à la cliente (avec lien pour payer).
  if (body.action === "send") {
    const q = await getQuote(body.id);
    if (!q) return Response.json({ error: "Document introuvable." }, { status: 404 });
    const to = (body.email || q.client?.email || "").trim();
    if (!to) return Response.json({ error: "Aucune adresse e-mail pour ce document." }, { status: 400 });
    const link = `${siteOrigin(req)}/document/${body.id}`;
    const mail = quoteEmail(q, link);
    // Gmail en priorité (arrive vers toute adresse), Resend en secours.
    const r = await sendClientMail({ to, subject: mail.subject, html: mail.html });
    return Response.json({ ok: r.ok, to, error: r.ok ? undefined : (r.error || "L'envoi de l'e-mail a échoué.") });
  }

  // Création d'un devis ou d'une facture
  const type = body.type === "facture" ? "facture" : "devis";
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((it) => ({
      desc: String(it.desc || "").slice(0, 200),
      qty: Math.max(1, parseInt(it.qty, 10) || 1),
      price: Math.max(0, Math.round((parseFloat(it.price) || 0) * 100) / 100),
      // Article du stock à décompter au paiement (facultatif, 02/10/2026).
      ...(String(it.stockId || "").trim() ? { stockId: String(it.stockId).trim().slice(0, 80) } : {}),
      // Poids d'UNE pièce en grammes (03/10/2026) : sert au calcul de la livraison choisie par le client.
      ...(parseInt(it.weight, 10) > 0 ? { weight: Math.min(30000, parseInt(it.weight, 10)) } : {}),
      // Produit du site auquel la ligne est rattachée (règles de livraison du site) + emballage en boîte rigide.
      ...(String(it.variantId || "").trim() ? { variantId: String(it.variantId).trim().slice(0, 80) } : {}),
      ...(it.boite === true ? { boite: true } : {}),
      // Ligne qui suit le nombre choisi par la cliente + prix de chaque pièce en plus (01/11/2026).
      ...(it.suit === true ? { suit: true, ...(prixOuNull(it.prixSuivant) != null ? { prixSuivant: prixOuNull(it.prixSuivant) } : {}) } : {}),
    }))
    .filter((it) => it.desc);
  if (!items.length) return Response.json({ error: "Ajoute au moins une ligne." }, { status: 400 });
  const total = Math.round(items.reduce((s, it) => s + it.qty * it.price, 0) * 100) / 100;

  const data = {
    type,
    client: {
      name: String(body.client?.name || "").slice(0, 100),
      email: String(body.client?.email || "").slice(0, 120),
      address: String(body.client?.address || "").slice(0, 300),
    },
    items,
    total,
    note: String(body.note || "").slice(0, 500),
    ...(nettoyerQte(body.qte) && items.some((it) => it.suit) ? { qte: nettoyerQte(body.qte) } : {}),
  };
  const created = await createQuote(data);
  if (!created) return Response.json({ error: "Connexion à la base requise (Firebase)." }, { status: 500 });
  return Response.json({ ok: true, ...created });
}
