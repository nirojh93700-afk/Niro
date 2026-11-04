// DEVIS DANS LE PANIER (02/11/2026, maquette https://claude.ai/artifact/Lo8LopW8uKma8KuAgriD6a, « applique ») :
// sur la page du devis, la cliente choisit un emballage cadeau et peut ajouter d'autres articles du site ;
// le devis entre alors dans le panier comme UNE ligne et tout se paie ensemble (une commande, une livraison).
// Ce fichier est PUR (aucun accès base) : il reçoit l'index des variantes du catalogue en direct.
// ⛔ Le prix du devis n'est JAMAIS celui du navigateur : `/api/checkout` relit le devis et passe ici.
import { estLignePort } from "@/lib/remiseDevis";
import { PRODUCT_DATES } from "@/lib/productDates";

const PRODUIT_LIBRE = { letter: false, freeShipping: false, freeShipThreshold: 0, category: "", pickup: false };

// Produit « principal » du devis = celui de la première ligne rattachée à une fiche du site.
// Il donne les emballages proposés (bijoux) et les règles de port des lignes de gravure.
export function produitPrincipal(items, index) {
  for (const it of Array.isArray(items) ? items : []) {
    const m = it?.variantId && index ? index.get(it.variantId) : null;
    if (m) return m;
  }
  return null;
}

// Lignes du devis au format du calcul de port partagé (`panierPort.js`), ou null si le devis
// ne peut pas entrer dans le panier : une ligne « Livraison » saisie à la main (le panier calcule
// lui-même la livraison), ou une ligne qu'on ne sait pas peser.
// Une ligne sans produit ni poids (ex. « Gravure des noms ») suit le produit principal, à 0 g.
export function lignesDevisPanier(items, index) {
  const tout = Array.isArray(items) ? items : [];
  if (!tout.length || tout.some((it) => estLignePort(it?.desc))) return null;
  const principal = produitPrincipal(tout, index);
  const lignes = [];
  for (const it of tout) {
    const m = it?.variantId && index ? index.get(it.variantId) : null;
    const poids = Number(it?.weight) > 0 ? Number(it.weight) : 0;
    let product, unitGrams;
    if (m) {
      product = m.product;
      unitGrams = poids || Number(m.variant.weight) || Number(m.product.weight) || 200;
    } else if (poids) {
      product = principal ? principal.product : PRODUIT_LIBRE; unitGrams = poids;
    } else if (principal) {
      product = principal.product; unitGrams = 0;
    } else return null;
    lignes.push({
      product, unitGrams, unitPrice: Number(it?.price) || 0, quantity: Math.max(1, Number(it?.qty) || 1),
      pkgBoite: Boolean(it?.boite) && Boolean(product.letter),
    });
  }
  return lignes;
}

// Le devis peut-il passer par le panier ? (devis, pas payé, pas désactivé dans Gestion, lignes calculables)
export function devisPanierPossible(q, index) {
  if (!q || q.type === "facture" || q.status === "paye" || q.status === "annule" || q.panierOff === true) return false;
  return lignesDevisPanier(q.items, index) !== null && Number(q.total) > 0;
}

// Articles proposés sous le devis : même univers que le produit principal (même sous-catégorie d'abord),
// en vente, jamais le produit du devis lui-même ; complété par un petit cadeau. 6 au plus.
const PETITS_CADEAUX = ["porte-cles-cuir-a-graver", "piece-ronde-laiton"];

// « Compléter votre commande » (04/11/2026, gérant : « si le client sélectionne du cristal, tu dois mettre des bijoux ») :
// on propose D'AUTRES familles que celle du devis, jamais la même. Familles du catalogue (champ `category`).
const FAMILLE = { bijoux: "bijoux", cristal: "cristal", verres: "verres", deco: "maison", naissance: "maison", jeux: "maison", mariage: "maison", cadeaux: "cadeaux" };
// Ordre des 5 premières places selon la famille du devis ; la 6ᵉ place reste au petit cadeau.
const PLAN = {
  cristal: ["bijoux", "verres", "bijoux", "maison", "bijoux"],
  bijoux: ["cristal", "verres", "cristal", "maison", "verres"],
  verres: ["bijoux", "cristal", "bijoux", "maison", "cristal"],
  maison: ["bijoux", "cristal", "verres", "bijoux", "cristal"],
  cadeaux: ["bijoux", "cristal", "verres", "bijoux", "maison"],
  "": ["bijoux", "cristal", "verres", "bijoux", "maison"],
};
const dateDe = (p) => Date.parse(PRODUCT_DATES[p.slug] || "") || 0;
const graveD = (p) => (p.personalizationFields || []).some((f) => f && f.type !== "note");

export function articlesAssortis(catalog, principal, max = 6) {
  const enVente = (Array.isArray(catalog) ? catalog : []).filter((p) => !p.hidden && !p.soldOut && !p.marquePages && !p.pageDediee && (p.images || []).length);
  const slugP = principal?.product?.slug || "";
  const famP = FAMILLE[principal?.product?.category || ""] || "";
  const out = [];
  const pris = (p) => out.some((x) => x.slug === p.slug);
  const pousser = (p) => { if (p && p.slug !== slugP && !pris(p) && out.length < max) out.push(p); };
  // Dans chaque famille : les pièces gravées d'abord, les plus récentes en tête ; bijoux femme / homme en alternance.
  const parFamille = {};
  for (const p of enVente) {
    const f = FAMILLE[p.category];
    if (!f || f === famP || PETITS_CADEAUX.includes(p.slug)) continue;
    (parFamille[f] ||= []).push(p);
  }
  for (const f of Object.keys(parFamille)) parFamille[f].sort((a, b) => (graveD(b) - graveD(a)) || (dateDe(b) - dateDe(a)));
  const derniereSub = {};
  const prendre = (f) => {
    const liste = (parFamille[f] || []).filter((p) => !pris(p));
    if (!liste.length) return null;
    if (f === "bijoux" && derniereSub.bijoux) {
      const autre = liste.find((p) => p.subcategory && p.subcategory !== derniereSub.bijoux);
      if (autre) { derniereSub.bijoux = autre.subcategory; return autre; }
    }
    derniereSub[f] = liste[0].subcategory || "";
    return liste[0];
  };
  for (const f of PLAN[famP] || PLAN[""]) pousser(prendre(f));
  // Une famille vide : on complète avec les autres familles, toujours hors famille du devis.
  for (const f of ["bijoux", "cristal", "verres", "maison"]) { let x; while (out.length < max - 1 && (x = prendre(f))) pousser(x); }
  pousser(enVente.find((p) => PETITS_CADEAUX.includes(p.slug) && p.slug !== slugP));
  enVente.filter((p) => (FAMILLE[p.category] || "") !== famP || !famP).forEach(pousser);
  return out;
}

// Emballage + « Compléter votre commande » (02/11/2026) : ce que reçoit <DevisPanier>, ou null.
export function donneesPanier(q, index, catalog) {
  if (!devisPanierPossible(q, index)) return null;
  const pr = produitPrincipal(q.items, index);
  const prod = pr ? catalog.find((p) => p.slug === pr.product.slug) || pr.product : null;
  const prix = (p) => {
    const prices = (p.variants || []).map((v) => Number(v.price)).filter((x) => Number.isFinite(x) && x > 0);
    const base = prices[0] || 0;
    const promo = Number(p.salePrice) > 0 && Number(p.salePrice) < base;
    return { price: promo ? Number(p.salePrice) : base, des: !promo && new Set(prices).size > 1 && base === Math.min(...prices) };
  };
  const articles = articlesAssortis(catalog, pr).map((p) => ({
    slug: p.slug, name: p.name, sub: p.type || "", image: p.images[0], badge: p.badge === "Nouveau" ? "Nouveau" : "", ...prix(p),
  }));
  const grams = (lignesDevisPanier(q.items, index) || []).reduce((s, l) => s + l.unitGrams * l.quantity, 0);
  const premier = String(q.items?.[0]?.desc || "");
  return {
    id: q.id, number: q.number || "", grams, articles,
    resume: (q.items?.length > 1 ? `${premier} + ${q.items.length - 1} ligne${q.items.length > 2 ? "s" : ""}` : premier).slice(0, 160),
    principal: prod ? {
      slug: prod.slug, category: prod.category || "", letter: Boolean(prod.letter),
      image: pr.variant?.image || prod.images?.[0] || null,
      packaging: prod.packaging || null, packagingNoel: prod.packagingNoel || null,
    } : null,
  };
}
