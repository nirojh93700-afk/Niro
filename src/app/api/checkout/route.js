import Stripe from "stripe";
import { getCatalog, stripBijouxPromos } from "@/lib/catalog";
import { toCents } from "@/lib/format";
import { buildShippingOptions } from "@/lib/shipping";
import { getPromos, getSettings, getPromoCodes, hasUsedCode } from "@/lib/stock";
import { saveOrderSpec } from "@/lib/firebase";
import { engravingExtra } from "@/lib/engravingPrice";

// Nettoie une fiche de réglages avant de la stocker (taille maîtrisée en base) :
// on tronque les textes trop longs et on retire les images "data:" (jamais stockées).
function sanitizeSpec(spec) {
  if (!spec || typeof spec !== "object") return null;
  const clean = (val, depth = 0) => {
    if (val == null || depth > 6) return val;
    if (typeof val === "string") {
      if (val.startsWith("data:")) return "[image envoyée]";
      return val.length > 400 ? val.slice(0, 400) : val;
    }
    if (Array.isArray(val)) return val.slice(0, 40).map((x) => clean(x, depth + 1));
    if (typeof val === "object") {
      const out = {};
      for (const k of Object.keys(val).slice(0, 40)) out[k] = clean(val[k], depth + 1);
      return out;
    }
    return val;
  };
  return clean(spec);
}

// Le retrait en main propre n'est proposé que si le code postal de la cliente
// est dans la zone autorisée (réglée dans l'admin). Zone vide = pas de restriction.
function pickupAllowed(cp, zonesStr) {
  const zones = String(zonesStr || "").split(/[^0-9]+/).map((s) => s.trim()).filter(Boolean);
  if (!zones.length) return true; // aucune zone définie → pas de restriction
  const code = String(cp || "").replace(/\D/g, "");
  if (!code) return false; // zone définie mais pas de code postal fourni → pas de retrait
  return zones.some((z) => code.startsWith(z));
}

// Construit une table variantId -> { product, variant } pour valider côté serveur.
async function buildVariantIndex() {
  const index = new Map();
  const products = await getCatalog();
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

  const postalCode = String(body?.postalCode || "").trim();
  const promoCode = String(body?.promoCode || "").trim().toUpperCase();
  // Pays de livraison choisi sur le panier (défaut France). Détermine la zone de
  // tarif (France/Europe) et restreint l'adresse Stripe au pays choisi.
  const country = SHIPPING_COUNTRIES.includes(String(body?.country || "").toUpperCase())
    ? String(body.country).toUpperCase()
    : "FR";
  const isFrance = country === "FR" || country === "MC";
  const allowedCountries = isFrance ? ["FR", "MC"] : [country];

  // Choix de livraison fait sur le panier (avant Stripe).
  const deliveryMethod = ["relais", "domicile", "retrait"].includes(body?.deliveryMethod) ? body.deliveryMethod : "";
  const rp = body?.relaisPoint && typeof body.relaisPoint === "object" ? body.relaisPoint : null;
  // Transporteur du point relais choisi (Mondial Relay, Relais Colis, Colissimo…)
  // → sert à facturer le bon tarif au poids et à créer l'étiquette.
  const relaisCarrier = rp ? String(rp.carrier || "").toUpperCase().slice(0, 8) : "";
  const relaisCarrierName = rp ? String(rp.carrierName || "").slice(0, 40) : "";
  // Étiquette courte pour Stripe (nom + ville) et adresse complète pour la commande.
  const relaisLabel = rp
    ? [String(rp.name || "").slice(0, 45), String(rp.city || "").slice(0, 25)].filter(Boolean).join(", ")
    : "";
  const relaisFull = rp
    ? [relaisCarrierName, rp.name, rp.street, [rp.zipCode, rp.city].filter(Boolean).join(" ")].filter(Boolean).join(" — ").slice(0, 240)
    : "";
  const variantIndex = await buildVariantIndex();
  const promos = await stripBijouxPromos(await getPromos()); // bijoux : remise permanente uniquement
  const settings = await getSettings().catch(() => ({}));

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

  // Stripe exige des URLs d'image absolues : on préfixe les chemins locaux
  // (/produits/...) par l'adresse du site, et on ignore tout ce qui n'est pas une URL valide.
  function absoluteImage(src) {
    if (!src) return null;
    try {
      return new URL(src).href; // déjà absolue (https://...)
    } catch {}
    try {
      return new URL(src, siteUrl).href; // chemin local -> absolu
    } catch {}
    return null;
  }

  const lineItems = [];
  let totalGrams = 0;
  let subtotal = 0;
  let parcelQty = 0; // nombre d'articles "déco" (colis) dans le panier
  let glassQty = 0;  // nombre de verres (fragiles) — envoi croissant dédié
  let letterOnly = true;
  let allFreeShip = true; // tous les articles ont la livraison offerte
  let allPickup = true; // retrait proposé seulement si TOUS les articles sont éligibles (mariage)
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
    const basePrice = typeof promo === "number" && promo < variant.price ? promo : variant.price;
    // Recalcul de confiance du supplément de gravure (depuis les champs envoyés).
    const extra = engravingExtra(product, item.fields || {}, variant.id);
    const unitPrice = basePrice + extra.amount;

    boughtVariants.push({ variantId: variant.stockId || variant.id, qty: quantity });
    // Poids réel par TAILLE (variant.weight) + poids des options (ex. socle),
    // multiplié par la quantité → frais de port corrects pour n'importe quel panier.
    const unitGrams = (Number(variant.weight) || Number(product.weight) || 200) + (extra.weight || 0);
    totalGrams += unitGrams * quantity;
    subtotal += unitPrice * quantity;
    if (!product.letter) {
      letterOnly = false;
      parcelQty += quantity;
    }
    if (product.category === "verres") glassQty += quantity;
    if (!product.freeShipping) allFreeShip = false;
    if (!product.pickup) allPickup = false;

    const descriptionParts = [variant.title];
    if (extra.amount > 0) {
      descriptionParts.push(`${extra.pages} gravure(s) en plus (+${extra.amount.toFixed(2)} €)`);
    }
    if (item.personalization) {
      descriptionParts.push(`Personnalisation : ${String(item.personalization).slice(0, 220)}`);
    }

    lineItems.push({
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: toCents(unitPrice), // prix de confiance (promo appliquée si définie)
        product_data: {
          name: product.name,
          description: descriptionParts.join(" — "),
          images: (product.images.map(absoluteImage).filter(Boolean)).slice(0, 1),
          metadata: { slug: product.slug }, // pour l'e-mail « laisser un avis » (lien direct vers le produit)
        },
      },
    });
  }

  const stripe = new Stripe(secret);

  // IP de la visiteuse (pour limiter un code à une seule utilisation).
  const clientIp = (req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim();

  // Code promo géré dans l'admin → coupon Stripe créé à la volée (pas besoin du dashboard).
  let discounts;
  let appliedCode = "";
  if (promoCode && !(await hasUsedCode(promoCode, { ip: clientIp }))) {
    try {
      const codes = await getPromoCodes();
      const pc = codes[promoCode];
      if (pc && pc.value > 0) {
        appliedCode = promoCode;
        const coupon = await stripe.coupons.create(
          pc.type === "fixed"
            ? { amount_off: Math.round(pc.value * 100), currency: "eur", duration: "once", name: `Code ${promoCode}` }
            : { percent_off: Math.min(100, pc.value), duration: "once", name: `Code ${promoCode}` }
        );
        discounts = [{ coupon: coupon.id }];
      }
    } catch { /* code ignoré si souci */ }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        // sert à décrémenter le stock après paiement (variantId:quantité)
        stock: JSON.stringify(boughtVariants.map((b) => [b.variantId, b.qty])).slice(0, 480),
        promoCode: appliedCode,
        clientIp,
        // Point relais choisi sur le panier (adresse complète pour la commande).
        ...(relaisFull ? { relaisPoint: relaisFull } : {}),
      },
      locale: "fr",
      currency: "eur",
      // Panier abandonné : la session expire après 3 h ; Stripe génère alors un
      // lien de reprise (e-mail de relance envoyé par notre webhook).
      expires_at: Math.floor(Date.now() / 1000) + 3 * 60 * 60,
      after_expiration: { recovery: { enabled: true } },
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      // On collecte toujours l'adresse : Stripe n'affiche/ne facture les frais de
      // livraison (dont le point relais 4,90 €) que si l'adresse est demandée.
      // Pour un point relais, cette adresse sert de contact (le colis part au
      // relais choisi sur le panier, enregistré à part sur la commande).
      shipping_address_collection: { allowed_countries: allowedCountries },
      shipping_options: buildShippingOptions({
        totalGrams, subtotal, parcelQty, glassQty, letterOnly, freeShipping: allFreeShip,
        country, // France (+ Monaco) = tarifs habituels ; sinon grille Europe par zone/poids
        // Retrait proposé si un article mariage est marqué OU si le colis est
        // lourd (≥ 2 kg), et seulement dans la zone autorisée.
        pickupEligible: allPickup && pickupAllowed(postalCode, settings?.pickupZones),
        config: settings?.shipping, // tarifs personnalisés (admin)
        boxtal: settings?.boxtal, // option point relais (admin)
        deliveryMethod, // "domicile" ou "relais" (choisi sur le panier)
        relaisLabel,    // nom du point relais choisi (affiché dans Stripe)
        relaisCarrier,  // transporteur du point relais → tarif au poids correct
      }),
      custom_fields: [
        {
          key: "personnalisation",
          label: { type: "custom", custom: "Précisions de personnalisation (gravure)" },
          type: "text",
          optional: true,
        },
        {
          key: "fabrication",
          label: { type: "custom", custom: "Lancement de la fabrication" },
          type: "dropdown",
          dropdown: {
            options: [
              { label: "Garder 24 h pour modifier ma commande", value: "delai" },
              { label: "Lancer la fabrication tout de suite (plus rapide)", value: "immediate" },
            ],
          },
          optional: true,
        },
        {
          key: "message_cadeau",
          label: { type: "custom", custom: "Message cadeau (joint à la commande)" },
          type: "text",
          optional: true,
        },
      ],
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/annule`,
    });

    // Fiche atelier : on mémorise les réglages détaillés, liés à la session
    // (relus par le webhook pour les joindre à la commande). Sans risque si échec.
    try {
      const specs = items.map((it) => sanitizeSpec(it.spec)).filter(Boolean);
      if (specs.length) await saveOrderSpec(session.id, specs);
    } catch { /* ignore */ }

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return Response.json(
      { error: "Erreur lors de la création du paiement. Réessayez." },
      { status: 500 }
    );
  }
}
