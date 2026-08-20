import { isAdmin, getCagnotte, getSettings, logOrderEmail } from "@/lib/stock";
import { getSiteOrder } from "@/lib/firebase";
import { sendClientMail, brandedMessage } from "@/lib/clientMail";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

// Remplace les balises {prenom} {nom} {ref} {solde} {gagne} par les infos de la cliente.
// {solde} = TOTAL de sa cagnotte · {gagne} = cashback gagné sur CETTE commande.
function fill(tpl, { name = "", ref = "", solde = 0, gagne = 0 } = {}) {
  const prenom = String(name || "").split(" ")[0];
  return String(tpl || "")
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, name || "")
    .replace(/\{ref\}/gi, ref || "")
    .replace(/\{solde\}/gi, euro(solde))
    .replace(/\{gagne\}/gi, euro(gagne));
}

// Envoi IMMÉDIAT d'un message à une cliente (bouton « Envoyer maintenant »).
// S'adapte à la cliente choisie (prénom, réf de commande, solde de cagnotte).
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  const to = String(body?.to || "").trim();
  const subjectRaw = String(body?.subject || "").trim();
  const bodyRaw = String(body?.body || "").trim();
  const name = String(body?.name || "").trim();
  const ref = String(body?.ref || "").trim();
  const orderId = String(body?.orderId || "").trim(); // commande liée (pour le journal)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  if (!subjectRaw || !bodyRaw) return Response.json({ error: "Sujet et message obligatoires." }, { status: 400 });

  // Solde de cagnotte de la cliente (pour la balise {solde}).
  let solde = 0;
  try { solde = (await getCagnotte(to)).balance; } catch { /* 0 */ }

  // Cashback gagné sur CETTE commande (balise {gagne}). On prend la valeur
  // enregistrée sur la commande ; pour les commandes plus anciennes (avant que
  // nous l'enregistrions), on la recalcule comme au moment du paiement :
  // (total payé − livraison) × pourcentage de cashback.
  let gagne = 0;
  if (orderId) {
    try {
      const cmd = await getSiteOrder(orderId);
      if (cmd) {
        if (Number(cmd.cashbackEarned) > 0) {
          gagne = Number(cmd.cashbackEarned);
        } else {
          const pct = Number((await getSettings())?.cashbackPercent) || 0;
          const produits = Math.max(0, Number(cmd.total || 0) - Number(cmd.shippingPrice || 0));
          if (pct > 0 && produits > 0) gagne = Math.round(produits * pct) / 100;
        }
      }
    } catch { /* la balise vaudra 0,00 € */ }
  }

  const ctx = { name, ref, solde, gagne };
  const subject = fill(subjectRaw, ctx);
  const html = brandedMessage(subject, fill(bodyRaw, ctx));
  const r = await sendClientMail({ to, subject, html, bcc: BRAND.contact });
  if (r?.ok) {
    // Journalise dans le fil de la commande si une commande est liée.
    if (orderId) {
      try {
        await logOrderEmail(orderId, { subject, text: fill(bodyRaw, ctx), customerEmail: to, customerName: name, ref });
      } catch { /* le journal ne doit jamais bloquer l'envoi */ }
    }
    return Response.json({ ok: true, via: r.via });
  }
  return Response.json({ error: r?.error || "Envoi impossible (Gmail non connecté ?)." }, { status: 500 });
}
