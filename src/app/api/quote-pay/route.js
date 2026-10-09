import Stripe from "stripe";
import { getQuote } from "@/lib/firebase";
import { toCents } from "@/lib/format";
import { verifierCodeDevis } from "@/lib/promoDevis";
import { getSettings } from "@/lib/stock";
import { livraisonActive, portDevis } from "@/lib/portDevis";
import { indexVariantes } from "@/lib/indexVariantes";

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
  const stockPairs = q.items.filter((it) => it.stockId).map((it) => [it.stockId, it.qty]);
  const stripe = new Stripe(secret);
  // Pays livrés (mêmes que la boutique) — pour collecter l'adresse de livraison.
  const SHIPPING_COUNTRIES = ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "PT", "MC"];
  // Code promo saisi sur le lien du devis (03/10/2026) : revérifié ICI côté serveur (jamais
  // confiance au navigateur), puis coupon Stripe d'un montant fixe sur les lignes d'articles.
  // Livraison choisie par le client sur le lien du devis (03/10/2026) : prix recalculé ICI,
  // côté serveur, d'après le poids des lignes. Devis sans poids = comportement d'avant.
  let shippingOpts, relaisMeta = {}, countries = SHIPPING_COUNTRIES;
  const index = await indexVariantes();
  if (livraisonActive(q.items, index)) {
    const method = body?.deliveryMethod === "relais" ? "relais" : "domicile";
    const r = portDevis(q, await getSettings(), index, method, body?.relaisPoint);
    if (!r.ok) return Response.json({ error: r.error || "Livraison indisponible." }, { status: 400 });
    if (method === "relais" && !r.relaisFull) return Response.json({ error: "Choisissez votre point relais." }, { status: 400 });
    // À domicile : port standard + Express Chronopost (si ouvert) — la cliente choisit sur la page Stripe.
    shippingOpts = method === "domicile" && Array.isArray(r.options) ? r.options : [r.option];
    countries = ["FR", "MC"];
    if (r.relaisFull) relaisMeta = { relaisPoint: r.relaisFull };
  }
  let discounts, promoMeta = {};
  const promoCode = String(body?.promoCode || "").trim().toUpperCase();
  if (promoCode && q.type !== "facture") {
    const promoEmail = String(body?.promoEmail || q.client?.email || "").trim().toLowerCase();
    const r = await verifierCodeDevis(promoCode, promoEmail, q.items);
    if (!r.valid) return Response.json({ error: "Ce code promo n'est pas valable pour ce devis." }, { status: 400 });
    try {
      const coupon = await stripe.coupons.create({ amount_off: toCents(r.remise), currency: "eur", duration: "once", name: `Code ${r.code}` });
      discounts = [{ coupon: coupon.id }];
      promoMeta = { promoCode: r.code, ...(r.email ? { promoEmail: r.email } : {}) };
    } catch (err) {
      console.error("quote-pay coupon:", err);
      return Response.json({ error: "Erreur de paiement. Réessayez." }, { status: 500 });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      currency: "eur",
      customer_email: q.client?.email || undefined,
      // Commande sur mesure : on récupère l'adresse + le téléphone du client pour
      // que la commande créée soit directement expédiable.
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: countries },
      ...(shippingOpts ? { shipping_options: shippingOpts } : {}),
      ...(discounts ? { discounts } : {}),
      line_items: q.items.map((it) => ({
        quantity: it.qty,
        price_data: {
          currency: "eur",
          unit_amount: toCents(it.price),
          product_data: { name: it.desc },
        },
      })),
      // `stock` : les articles du stock vendus par ce devis → le webhook les décompte
      // (même mécanisme que la boutique). Les lignes sans stockId ne touchent à rien.
      metadata: {
        quoteId: id,
        quoteNumber: q.number || "",
        ...promoMeta,
        ...relaisMeta,
        ...(stockPairs.length ? { stock: JSON.stringify(stockPairs).slice(0, 480) } : {}),
      },
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/document/${id}`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("quote-pay:", err);
    return Response.json({ error: "Erreur de paiement. Réessayez." }, { status: 500 });
  }
}
