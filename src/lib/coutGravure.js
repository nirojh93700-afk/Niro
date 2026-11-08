// =============================================================================
// COÛT RÉEL DE GRAVURE PAR PIÈCE (08/11/2026) — calcul PUR, sans accès aux données.
// -----------------------------------------------------------------------------
// Le gérant règle dans Catalogue › Tailles & coûts :
//   settings.coutGravure = { laser, heures, elec, main, minutes: { [slug]: minutesParPiece } }
//   · laser   = prix d'achat de la machine (€)
//   · heures  = durée de vie estimée (heures de gravure)
//   · elec    = électricité par heure de gravure (€/h)
//   · main    = sa propre heure de travail (€/h ; 0 = non comptée)
//   · minutes = temps de gravure par pièce, produit par produit
// Finances › Bénéfices déduit ce coût commande par commande.
// Sans réglage (null, ou aucune minute saisie) tout vaut 0 : le bénéfice reste
// calculé exactement comme avant.
// =============================================================================
import { apparierSpec } from "./orderSpec";

// Suggestions par famille, servies SEULEMENT comme placeholder dans le formulaire.
// ⛔ Jamais écrites dans les réglages sans que le gérant les ait saisies lui-même.
export const MINUTES_DEFAUT = {
  bijou: 4,
  verre: 9,
  cristal: 25,
  gobelet: 12,
  carnet: 10,
  puzzle: 15,
  "marque-page": 5,
  autre: 8,
};

export const FAMILLE_LABEL = {
  bijou: "Bijou",
  verre: "Verre / carafe",
  cristal: "Cristal",
  gobelet: "Gobelet",
  carnet: "Carnet",
  puzzle: "Puzzle",
  "marque-page": "Marque-page",
  autre: "Autre",
};

const num = (v) => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Famille d'un produit (slug, catégorie, type) → clé de MINUTES_DEFAUT. */
export function familleProduit(p) {
  if (!p) return "autre";
  const slug = String(p.slug || "").toLowerCase();
  const cat = String(p.category || "").toLowerCase();
  const type = String(p.type || "").toLowerCase();
  if (slug.includes("gobelet")) return "gobelet";
  if (slug.includes("carnet")) return "carnet";
  if (slug.includes("marque-page") || type.includes("marque-page")) return "marque-page";
  if (slug.includes("puzzle") || cat === "jeux" || type.includes("puzzle")) return "puzzle";
  if (cat === "cristal" || slug.includes("cristal") || slug.includes("pyramide") || type.includes("cristal")) return "cristal";
  if (["verres", "vin", "whisky", "champagne", "cocktail", "carafes"].includes(cat) || /verre|flute|carafe|tumbler/.test(slug)) return "verre";
  if (["bijoux", "femme", "homme", "medaillons", "couple"].includes(cat) || /collier|bracelet|medaillon|pendentif|gourmette/.test(slug) || /collier|bracelet/.test(type)) return "bijou";
  return "autre";
}

/** Minutes suggérées pour un produit (placeholder). */
export function minutesSuggerees(p) {
  return MINUTES_DEFAUT[familleProduit(p)] || MINUTES_DEFAUT.autre;
}

/** Coût d'une heure de gravure (€/h) : usure du laser + électricité + main d'œuvre. */
export function coutHoraire(c) {
  if (!c || typeof c !== "object") return 0;
  const laser = num(c.laser);
  const heures = Math.max(1, num(c.heures));
  return laser / heures + num(c.elec) + num(c.main);
}

/** Coût de gravure d'UNE pièce de ce produit (0 si pas de réglage ou pas de minutes). */
export function coutPiece(c, slug) {
  if (!c || typeof c !== "object" || !slug) return 0;
  const minutes = num((c.minutes || {})[slug]);
  if (!minutes) return 0;
  return (coutHoraire(c) * minutes) / 60;
}

/** Le réglage est-il utilisable (au moins un produit avec des minutes > 0) ? */
export function reglageActif(c) {
  if (!c || typeof c !== "object") return false;
  return Object.values(c.minutes || {}).some((m) => num(m) > 0);
}

/** Slug d'une ligne de commande : `it.slug`, sinon le réglage apparié (order.spec). */
function slugDeLigne(it, order, specs, i) {
  if (it && it.slug) return it.slug;
  const s = specs[i];
  return (s && s.slug) || "";
}

/** Coût de gravure de toute la commande = Σ coutPiece × quantité. */
export function coutCommande(c, order) {
  if (!reglageActif(c) || !order) return 0;
  const items = Array.isArray(order.items) ? order.items : [];
  const specs = apparierSpec(items, order.spec || []);
  let total = 0;
  items.forEach((it, i) => {
    const slug = slugDeLigne(it, order, specs, i);
    if (!slug) return;
    const qty = Math.max(1, Number(it?.quantity) || 1);
    total += coutPiece(c, slug) * qty;
  });
  return Math.round(total * 100) / 100;
}

const eur = (n, dec = 2) => (Math.round((Number(n) || 0) * Math.pow(10, dec)) / Math.pow(10, dec)).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** Résumé lisible du réglage : « 3 500 € ÷ 8 000 h + 0,25 €/h = 0,69 €/h ». */
export function resumeReglage(c) {
  if (!c || typeof c !== "object") return "Non réglé.";
  const laser = num(c.laser);
  const heures = Math.max(1, num(c.heures));
  const parts = [`${eur(laser, 0)} € ÷ ${eur(heures, 0)} h`];
  if (num(c.elec) > 0) parts.push(`${eur(c.elec)} €/h d'électricité`);
  if (num(c.main) > 0) parts.push(`${eur(c.main)} €/h de travail`);
  return `${parts.join(" + ")} = ${eur(coutHoraire(c))} €/h`;
}
