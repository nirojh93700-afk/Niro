import Stripe from "stripe";
import { MONTANTS_CARTE } from "@/lib/carteCadeau";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// ACHAT D'UNE CARTE CADEAU — crée la session de paiement Stripe dédiée.
// Le montant est validé côté serveur (jamais le chiffre envoyé tel quel), et
// TOUT ce qu'il faut au webhook voyage dans les metadata : c'est LUI qui crée
// le code et envoie les e-mails, seulement une fois le paiement encaissé.
// =============================================================================
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  const montant = Number(body?.montant);
  if (!MONTANTS_CARTE.includes(montant)) return Response.json({ error: "Choisissez un montant." }, { status: 400 });

  const destEmail = String(body?.destEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destEmail)) {
    return Response.json({ error: "L'adresse e-mail du destinataire est invalide." }, { status: 400 });
  }
  const destName = String(body?.destName || "").trim().slice(0, 60);
  const message = String(body?.message || "").trim().slice(0, 180);

  // Date d'envoi choisie (facultative) : vide = tout de suite après paiement.
  // Une date seule (AAAA-MM-JJ) part le matin (vers 9 h, heure de Paris).
  let sendAt = 0;
  if (body?.sendAt) {
    const brut = String(body.sendAt);
    const t = /^\d{4}-\d{2}-\d{2}$/.test(brut) ? Date.parse(`${brut}T07:00:00.000Z`) : new Date(brut).getTime();
    if (Number.isFinite(t) && t > Date.now()) sendAt = t;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return Response.json({ error: "Paiement indisponible pour le moment." }, { status: 500 });
  const stripe = new Stripe(secret);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || BRAND.siteUrl || "").replace(/\/$/, "");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(montant * 100),
          product_data: {
            name: `Carte cadeau Niv Création — ${montant} €`,
            description: destName ? `Pour ${destName} · envoyée par e-mail avec votre petit mot` : "Envoyée par e-mail avec votre petit mot",
          },
        },
      }],
      metadata: {
        giftcard: "1",
        giftMontant: String(montant),
        giftDestName: destName,
        giftDestEmail: destEmail,
        giftMessage: message,
        giftSendAt: sendAt ? String(sendAt) : "",
      },
      success_url: `${siteUrl}/carte-cadeau/merci`,
      cancel_url: `${siteUrl}/carte-cadeau`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    console.error("Carte cadeau — session Stripe:", e.message);
    return Response.json({ error: "Le paiement n'a pas pu être préparé. Réessayez." }, { status: 500 });
  }
}
