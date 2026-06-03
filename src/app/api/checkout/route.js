import Stripe from "stripe";
import { products } from "@/lib/products";
import { toCents } from "@/lib/format";
import { buildShippingOptions } from "@/lib/shipping";
import { getPromos } from "@/lib/stock";

// Construit une table variantId -> { product, variant } pour valider côté serveur.
function buildVariantIndex() {
  const index = new Map();
  for (const product of products) {
    for (const variant of product.variants) {
      index.set(variant.id, { product, variant });
    }
  }
  return index;
}

// Pays vers lesquels nous expédions.
const SHIPPING_COUNTRIES = ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "PT", "MC"];

export async function POST(req) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json(
      {
        error:
          "Le paiement n'est pas encore configuré. Ajoutez votre clé STRIPE_SECRET_KEY.",
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return Response.json({ error: "Votre panier est vide." }, { status: 400 });
  }

  const variantIndex = buildVariantIndex();
  const promos = await getPromos();
  const lineItems = [];
  let totalGrams = 0;
  let subtotal = 0;
  let parcelQty = 0; // nombre d'articles "déco" (colis) dans le panier
  let letterOnly = true;
  let pickupEligible = false; // remise en main propre possible
  const boughtVariants = []; // pour décrémenter le stock après paiement

  for (const item of items) {
    const match = variantIndex.get(item.variantId);
    if (!match) {
      return Response.json(
        { error: "Un article du panier n'existe plus." },
        { status: 400 }
      );
    }
    const quantity = Math.min(Math.max(parseInt(item.quantity, 10) || 1, 1), 99);
    const { product, variant } = match;

    // Applique le prix promo s'il est défini et inférieur au prix normal.
    const promo = promos[variant.id];
    const unitPrice = typeof promo === "number" && promo < variant.price ? promo : variant.price;

    boughtVariants.push({ variantId: variant.id, qty: quantity });
    totalGrams += (product.weight || 200) * quantity;
    subtotal += unitPrice * quantity;
    if (!product.letter) {
      letterOnly = false;
      parcelQty += quantity;
    }
    if (product.pickup) pickupEligible = true;

    const descriptionParts = [variant.title];
    if (item.personalization) {
      descriptionParts.push(`Personnalisation : ${String(item.personalization).slice(0, 240)}`);
    }

    lineItems.push({
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: toCents(unitPrice), // prix de confiance (promo appliquée si définie)
        product_data: {
          name: product.name,
          description: descriptionParts.join(" — "),
          images: product.images.length ? [product.images[0]] : [],
        },
      },
    });
  }

  const stripe = new Stripe(secret);
  // Normalise l'URL du site : ajoute https:// si oublié dans la variable
  // d'environnement, et retombe sur l'origine de la requête en dernier recours.
  function resolveSiteUrl() {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
    for (const candidate of [raw, raw && `https://${raw}`]) {
      try {
        if (candidate) return new URL(candidate).origin;
      } catch {
        // on essaie le candidat suivant
      }
    }
    return new URL(req.url).origin;
  }
  const siteUrl = resolveSiteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        // sert à décrémenter le stock après paiement (variantId:quantité)
        stock: JSON.stringify(boughtVariants.map((b) => [b.variantId, b.qty])).slice(0, 480),
      },
      locale: "fr",
      currency: "eur",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      shipping_options: buildShippingOptions({ totalGrams, subtotal, parcelQty, letterOnly, pickupEligible }),
      custom_fields: [
        {
          key: "personnalisation",
          label: { type: "custom", custom: "Précisions de personnalisation (gravure)" },
          type: "text",
          optional: true,
        },
      ],
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/annule`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return Response.json(
      { error: "Erreur lors de la création du paiement. Réessayez." },
      { status: 500 }
    );
  }
}
