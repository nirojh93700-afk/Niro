import Stripe from "stripe";
import { getQuote } from "@/lib/firebase";
import { toCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return Response.json({ error: "Paiement non configuré." }, { status: 500 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const id = body?.id;
  if (!id) return Response.json({ error: "Document introuvable." }, { status: 400 });

  const q = await getQuote(id);
  if (!q) return Response.json({ error: "Document introuvable." }, { status: 404 });
  if (q.status === "paye") return Response.json({ error: "Ce document est déjà payé." }, { status: 400 });
  if (!(q.total > 0)) return Response.json({ error: "Montant invalide." }, { status: 400 });

  function resolveSiteUrl() {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
    for (const c of [raw, raw && `https://${raw}`]) {
      try { if (c) return new URL(c).origin; } catch {}
    }
    return new URL(req.url).origin;
  }
  const siteUrl = resolveSiteUrl();
  const stripe = new Stripe(secret);
  // Pays livrés (mêmes que la boutique) — pour collecter l'adresse de livraison.
  const SHIPPING_COUNTRIES = ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "PT", "MC"];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      currency: "eur",
      customer_email: q.client?.email || undefined,
      // Commande sur mesure : on récupère l'adresse + le téléphone du client pour
      // que la commande créée soit directement expédiable.
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      line_items: q.items.map((it) => ({
        quantity: it.qty,
        price_data: {
          currency: "eur",
          unit_amount: toCents(it.price),
          product_data: { name: it.desc },
        },
      })),
      metadata: { quoteId: id, quoteNumber: q.number || "" },
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/document/${id}`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("quote-pay:", err);
    return Response.json({ error: "Erreur de paiement. Réessayez." }, { status: 500 });
  }
}
