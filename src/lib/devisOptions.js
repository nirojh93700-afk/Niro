// OPTIONS À COCHER SUR LA PAGE D'UN DEVIS DE CRISTAL (06/11/2026, maquette
// https://claude.ai/artifact/1D7veQp2RzCVybjz9dr6te, gérant : « tu peux appliquer »).
// La cliente peut ajouter elle-même le socle lumineux LED et / ou un texte gravé en plus, aux
// prix de la fiche du cristal (lus dans le catalogue en direct : socle selon la taille, texte +5 €).
// ⛔ Règle du gérant : une option déjà écrite dans le devis (« Socle… », « Texte… ») n'est JAMAIS
// proposée une deuxième fois.
// Pur : utilisé par la page du devis (affichage) ET par le serveur (port, code promo, paiement) ;
// le prix n'est jamais celui du navigateur.

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
  if (!product) return null;
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

export const POLICES_DEVIS = {
  playfair: "Playfair", cinzel: "Cinzel", "cinzel-deco": "Cinzel Decorative", montserrat: "Montserrat",
  inter: "Inter", "great-vibes": "Great Vibes", allura: "Allura", pacifico: "Pacifico",
};

/** Choix envoyé par le navigateur, nettoyé : { socle, texte, police }. */
export function nettoyerChoix(c) {
  const texte = String(c?.texte || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const police = POLICES_DEVIS[c?.police] ? c.police : "playfair";
  return { socle: c?.socle === true, texte, police };
}

/** Lignes ajoutées au devis pour ce choix (mêmes champs que les lignes du devis). */
export function lignesOptions(opts, choix) {
  if (!opts) return [];
  const c = nettoyerChoix(choix);
  const out = [];
  if (c.socle && opts.socle) {
    out.push({ desc: `Option : socle lumineux LED (${opts.socle.nom})`, qty: 1, price: opts.socle.price, weight: opts.socle.weight,
      ...(opts.socle.stockId ? { stockId: opts.socle.stockId } : {}), option: "socle" });
  }
  if (c.texte && opts.texte) {
    out.push({ desc: `Option : texte gravé en plus « ${c.texte} » (écriture ${POLICES_DEVIS[c.police]})`, qty: 1, price: opts.texte.price, weight: 1, option: "texte" });
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
