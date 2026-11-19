// OPTIONS À COCHER SUR LA PAGE D'UN DEVIS DE CRISTAL (06/11/2026, maquette
// https://claude.ai/artifact/1D7veQp2RzCVybjz9dr6te, gérant : « tu peux appliquer »).
// La cliente peut ajouter elle-même le socle lumineux LED et / ou un texte gravé en plus, aux
// prix de la fiche du cristal (lus dans le catalogue en direct : socle selon la taille, texte +5 €).
// ⛔ Règle du gérant : une option déjà écrite dans le devis (« Socle… », « Texte… ») n'est JAMAIS
// proposée une deuxième fois.
// Pur : utilisé par la page du devis (affichage) ET par le serveur (port, code promo, paiement) ;
// le prix n'est jamais celui du navigateur.

import { engravingExtra } from "@/lib/engravingPrice";

const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const contientSocle = (items) => items.some((it) => /socle/i.test(String(it?.desc || "")));
const contientTexte = (items) => items.some((it) => /texte/i.test(String(it?.desc || "")));

/** Options proposées pour ce devis, ou null. `index` = indexVariantes() (catalogue en direct). */
export function optionsDisponibles(q, index) {
  if (!q || q.type === "facture" || q.status === "paye" || !index) return null;
  const items = Array.isArray(q.items) ? q.items : [];
  let vid = "", product = null;
  for (const it of items) {
    const m = it?.variantId ? index.get(it.variantId) : null;
    if (m?.product?.crystal3d) { vid = it.variantId; product = m.product; break; }
  }
  if (!product) return texteAuDos(items, index);
  const extras = product.engravingPricing?.flatExtras || [];
  const out = {};
  const s = extras.find((e) => e.key === "socle");
  if (s && !contientSocle(items)) {
    const note = (product.personalizationFields || []).find((f) => f.key === "note-socle");
    out.socle = {
      price: r2(s.amountByVariant?.[vid] ?? s.amount),
      weight: Number(s.weightByVariant?.[vid] ?? s.weight) || 300,
      stockId: s.stockIdByVariant?.[vid] || s.stockId || "",
      image: note?.imageByVariant?.[vid] || note?.image || "",
      nom: /carre/i.test(String(s.stockIdByVariant?.[vid] || s.stockId || "")) ? "petit socle carré" : "grand socle rectangle",
    };
  }
  const t = extras.find((e) => e.key === "texte");
  if (t && !contientTexte(items)) out.texte = { price: r2(t.amount) };
  return out.socle || out.texte ? out : null;
}

// TEXTE AU DOS D'UN BIJOU (16/11/2026, maquette https://claude.ai/artifact/Kmd7VSfhSzUygPaoFtAiiU,
// collier plaque d'Alicia, gérant : « elle peut choisir et graver dans le devis »). Proposé quand la
// ligne principale est un bijou dont la fiche grave un verso, et que le devis ne parle pas déjà du dos.
// Prix = celui de la fiche : ce qu'ajoute un texte au verso à la gravure déjà prévue au devis (photo ou
// texte au recto), avec la règle « le moins cher compris » (photo seule offerte + texte = +8 €).
const contientDos = (items) => items.some((it) => /verso|au dos|derri[eè]re/i.test(String(it?.desc || "")));
function texteAuDos(items, index) {
  let vid = "", product = null;
  for (const it of items) {
    const m = it?.variantId ? index.get(it.variantId) : null;
    if (m?.product?.category === "bijoux") { vid = it.variantId; product = m.product; break; }
  }
  const ep = product?.engravingPricing;
  const champ = (product?.personalizationFields || []).find((f) => f.key === "verso");
  if (!product || !champ || !(ep?.textKeys || []).includes("verso") || contientDos(items)) return null;
  const avecPhoto = ep.photoKey && items.some((it) => /photo/i.test(String(it?.desc || "")));
  const deja = avecPhoto ? { [ep.photoKey]: "photo" } : (ep.textKeys.includes("recto") ? { recto: "texte" } : {});
  const prix = r2(engravingExtra(product, { ...deja, verso: "texte" }, vid).amount - engravingExtra(product, deja, vid).amount);
  if (!(prix > 0)) return null;
  // Avec une photo déjà prévue, le texte ajouté devient la gravure offerte et la photo se paie :
  // on l'écrit tel quel (gérant, 16/11 : « c'est le moins cher qui est pris en compte »).
  const photoPrix = avecPhoto ? r2(ep.photoSurcharge || 0) : 0;
  const echange = avecPhoto && photoPrix === prix;
  return { texte: { price: prix, dos: true, max: Number(champ.maxLength) || 30, ...(echange ? { photoPrix } : {}) } };
}

/** Libellé de la ligne « texte » ajoutée au devis (page, paiement, commande, atelier). */
export function libelleTexte(opts, texte, police) {
  const t = opts?.texte || {};
  const base = `Option : texte gravé ${t.dos ? "au dos" : "en plus"} « ${texte} » (écriture ${POLICES_DEVIS[police] || POLICES_DEVIS.playfair})`;
  return t.photoPrix ? `${base} : le texte est offert, la gravure de la photo passe à ${String(t.photoPrix.toFixed(2)).replace(".", ",")} €` : base;
}

export const POLICES_DEVIS = {
  playfair: "Playfair", cinzel: "Cinzel", "cinzel-deco": "Cinzel Decorative", montserrat: "Montserrat",
  inter: "Inter", "great-vibes": "Great Vibes", allura: "Allura", pacifico: "Pacifico",
};

/** Choix envoyé par le navigateur, nettoyé : { socle, texte, police }. */
export function nettoyerChoix(c, max = 40) {
  const texte = String(c?.texte || "").replace(/\s+/g, " ").trim().slice(0, max);
  const police = POLICES_DEVIS[c?.police] ? c.police : "playfair";
  return { socle: c?.socle === true, texte, police };
}

/** Lignes ajoutées au devis pour ce choix (mêmes champs que les lignes du devis). */
export function lignesOptions(opts, choix) {
  if (!opts) return [];
  const c = nettoyerChoix(choix, opts.texte?.max || 40);
  const out = [];
  if (c.socle && opts.socle) {
    out.push({ desc: `Option : socle lumineux LED (${opts.socle.nom})`, qty: 1, price: opts.socle.price, weight: opts.socle.weight,
      ...(opts.socle.stockId ? { stockId: opts.socle.stockId } : {}), option: "socle" });
  }
  if (c.texte && opts.texte) {
    out.push({ desc: libelleTexte(opts, c.texte, c.police), qty: 1, price: opts.texte.price, weight: 1, option: "texte" });
  }
  return out;
}

/** Applique le choix à un devis déjà calculé ({ items, total, stock }). */
export function appliquerOptions(app, opts, choix) {
  const plus = lignesOptions(opts, choix);
  if (!plus.length) return { ...app, options: [] };
  const items = [...app.items, ...plus];
  return {
    ...app,
    items,
    total: r2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)),
    stock: [...(app.stock || []), ...plus.filter((l) => l.stockId).map((l) => [l.stockId, 1])],
    options: plus,
  };
}
