// LIVRAISON D'UN DEVIS — choisie par le client sur le lien du devis (03/10/2026, maquette validée
// `docs/maquettes/devis-livraison-promo.html`). Le calcul est CELUI DU PANIER (`panierPort.js`, partagé :
// seuils de livraison offerte, lettre / colis, verres, bijou en boîte, grille au poids) — jamais un
// prix envoyé par le navigateur.
//
// Chaque ligne d'article du devis est :
//  · rattachée à un produit du site (`variantId`) → ses règles (lettre/colis, seuil offert, verres…) ;
//    poids = celui saisi par le gérant (`weight`, g, une pièce — il peut le corriger pour une grosse
//    commande) sinon celui de la fiche ;
//  · ou « libre » (ex. clé USB 64 Go) → il faut un poids ; calculée comme un colis, sans gratuité.
// Le choix n'existe que si TOUTES les lignes sont calculables et qu'aucune ligne « Livraison » n'a été
// ajoutée à la main → les anciens devis restent exactement comme avant. France + Monaco, sans express
// ni retrait ; point relais seulement si l'option est activée dans Gestion → Livraison.
import { nouvelEtatPort, ajouterLignePort, optionsPort } from "@/lib/panierPort";
import { estLignePort } from "@/lib/remiseDevis";

const PRODUIT_LIBRE = { letter: false, freeShipping: false, freeShipThreshold: 0, category: "", pickup: false };

// Lignes au format du calcul partagé, ou null si le port ne peut pas être calculé.
export function lignesPort(items, index) {
  const tout = Array.isArray(items) ? items : [];
  if (!tout.length || tout.some((it) => estLignePort(it?.desc))) return null; // ligne livraison déjà saisie à la main
  const lignes = [];
  for (const it of tout) {
    const m = it?.variantId && index ? index.get(it.variantId) : null;
    const poidsSaisi = Number(it?.weight) > 0 ? Number(it.weight) : 0;
    let product, unitGrams;
    if (m) {
      product = m.product;
      unitGrams = poidsSaisi || Number(m.variant.weight) || Number(m.product.weight) || 200; // même repli que le panier
    } else if (poidsSaisi) {
      product = PRODUIT_LIBRE; unitGrams = poidsSaisi;
    } else return null;
    lignes.push({
      product, unitGrams, unitPrice: Number(it.price) || 0, quantity: Math.max(1, Number(it.qty) || 1),
      pkgBoite: Boolean(it.boite) && Boolean(product.letter),
    });
  }
  return lignes;
}

export function livraisonActive(items, index) {
  return lignesPort(items, index) !== null;
}

function etat(items, index) {
  const lignes = lignesPort(items, index);
  if (!lignes) return null;
  const e = nouvelEtatPort();
  for (const l of lignes) ajouterLignePort(e, l);
  return e;
}

export function poidsDevis(items, index) {
  return etat(items, index)?.totalGrams || 0;
}

// Nettoie le point relais reçu du navigateur (mêmes champs que /api/checkout).
export function nettoyerRelais(rp) {
  if (!rp || typeof rp !== "object") return null;
  const name = String(rp.name || "").slice(0, 80);
  if (!name) return null;
  return {
    carrier: String(rp.carrier || "").toUpperCase().slice(0, 8), carrierName: String(rp.carrierName || "").slice(0, 40), name,
    city: String(rp.city || "").slice(0, 40), street: String(rp.street || "").slice(0, 80), zipCode: String(rp.zipCode || "").slice(0, 10),
  };
}

// Renvoie { ok, price, option, relaisOk, relaisFull, error } — `option` = entrée `shipping_options` Stripe.
export function portDevis(q, settings, index, method = "domicile", rp = null) {
  const relaisOk = Boolean(settings?.boxtal?.enabled);
  const e = etat(q?.items, index);
  if (!e) return { ok: false, relaisOk, error: "Ce devis n'a pas de choix de livraison." };
  const base = { settings, country: "FR", express: false, retraitOk: false };
  if (method === "relais") {
    if (!relaisOk) return { ok: false, relaisOk, error: "Le point relais n'est pas disponible." };
    const p = nettoyerRelais(rp);
    const opts = optionsPort(e, {
      ...base, deliveryMethod: "relais", relaisCarrier: p?.carrier || "",
      relaisLabel: p ? [p.name.slice(0, 45), p.city.slice(0, 25)].filter(Boolean).join(", ") : "",
    });
    return {
      ok: true, relaisOk, price: opts[0].shipping_rate_data.fixed_amount.amount / 100, option: opts[0],
      relaisFull: p ? [p.carrierName, p.name, p.street, [p.zipCode, p.city].filter(Boolean).join(" ")].filter(Boolean).join(" — ").slice(0, 240) : "",
    };
  }
  const opts = optionsPort(e, { ...base, deliveryMethod: "domicile" });
  return { ok: true, relaisOk, price: opts[0].shipping_rate_data.fixed_amount.amount / 100, option: opts[0], relaisFull: "" };
}
