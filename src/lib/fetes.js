// =============================================================================
// 🎄 Fêtes de l'année (Noël d'abord) — règles PURES, partagées fiche + paiement + Gestion.
// Maquette enregistrée : https://claude.ai/artifact/215micVgntigmyRFXsG49e (v1 à v13, 28-29/10/2026).
// -----------------------------------------------------------------------------
// Gérant : « dès que je décoche, tout ce qui a rapport avec Noël doit disparaître, ça doit revenir
// normal… une alerte deux mois avant… il faut des numéros sur les images ».
//   · settings.fetes.noel.on = false (ou absent) → RIEN ne change sur le site ;
//   · allumée → sur les produits gravés cochés, une carte À PART « Un modèle de Noël » (27 images,
//     « Noël n° X », jamais mélangées aux modèles habituels) ; l'image = la 1re gravure, OFFERTE ;
//     prénoms / texte et date en plus +3 € chacun, comme d'habitude (règle du 29/10) ;
//   · sur chaque bijou, une ligne repliée « Ajouter un emballage de Noël » : seulement les emballages
//     où le bijou (ou son emballage habituel) RENTRE ; boîtes et pack = colis ; étiquette offerte.
// Réglages : settings.fetes = { noel: { on, images:{[n]:{masquee}}, produits:{[slug]:bool},
//   emballages:{[id]:{prix, poids, fit:{…}}} } } — toujours modifiés clé par clé (setFetes).
// Stock des emballages de Noël = la carte de stock du site (identifiants « noel-<id> »).
// =============================================================================
import { engravingExtra } from "./engravingPrice.js";

const jour = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export function paques(an) {
  const a = an % 19, b = Math.floor(an / 100), c = an % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31), j = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(an, mois - 1, j));
}
const dimanche = (an, mois, n) => { // n-ième dimanche (n = -1 : le dernier)
  if (n < 0) { const d = new Date(Date.UTC(an, mois, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; }
  const d = new Date(Date.UTC(an, mois - 1, 1)); d.setUTCDate(1 + ((7 - d.getUTCDay()) % 7) + 7 * (n - 1)); return d;
};
const DATES = {
  noel: (an) => new Date(Date.UTC(an, 11, 25)),
  valentin: (an) => new Date(Date.UTC(an, 1, 14)),
  paques: (an) => paques(an),
  meres: (an) => { // dernier dimanche de mai, sauf s'il tombe le jour de la Pentecôte → 1er dimanche de juin
    const d = dimanche(an, 5, -1), pente = paques(an); pente.setUTCDate(pente.getUTCDate() + 49);
    return d.getTime() === pente.getTime() ? dimanche(an, 6, 1) : d;
  },
  peres: (an) => dimanche(an, 6, 3),
};
export const FETES = [
  { k: "noel", nom: "Noël", ico: "🎄" },
  { k: "valentin", nom: "Saint-Valentin", ico: "♥" },
  { k: "paques", nom: "Pâques", ico: "🐣" },
  { k: "meres", nom: "Fête des mères", ico: "✿" },
  { k: "peres", nom: "Fête des pères", ico: "♛" },
];
/** Prochaine date de la fête (aujourd'hui compris) + date d'alerte (2 mois avant) + jours restants. */
export function prochaineFete(k, maintenant = new Date()) {
  const auj = jour(maintenant);
  let d = DATES[k](auj.getUTCFullYear());
  if (d < auj) d = DATES[k](auj.getUTCFullYear() + 1);
  const alerte = new Date(d); alerte.setUTCMonth(alerte.getUTCMonth() - 2);
  return { date: d, alerte, jours: Math.round((d - auj) / 86400000), enAlerte: auj >= alerte };
}
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const dateFr = (d) => `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

// ------------------------------------------------------------------ les 27 images de Noël (n° = Gestion ET fiches)
// mots = lettrage « mots de Noël » ; texte = un texte fait partie de l'image (elle reste OFFERTE, 29/10) ;
// droits = personnage protégé (à trancher par le gérant) ; gris = niveaux de gris.
const I = (n, nom, f = "", ext = "jpg") => ({ n, nom, src: `/produits/noel/noel-${String(n).padStart(2, "0")}.${ext}`, trace: `/produits/noel/noel-${String(n).padStart(2, "0")}-trace.png`, blanc: `/produits/noel/noel-${String(n).padStart(2, "0")}-blanc.png`, mots: /mots/.test(f), texte: /texte|mots/.test(f), droits: /droits/.test(f), gris: /gris/.test(f) });
export const NOEL_IMAGES = [
  I(1, "Cloches de Noël au ruban"), I(2, "Gnomes « Merry Christmas »", "texte"), I(3, "Père Noël, sapin et cadeaux"),
  I(4, "Forêt, cerfs et flocon"), I(5, "Père Noël, bras croisés", "gris"), I(6, "Crèche de la Nativité"),
  I(7, "Couronne « Merry Christmas · Noël »", "texte"), I(8, "Tom et Jerry", "droits"), I(9, "Cerfs et traîneau « Merry Christmas »", "texte"),
  I(10, "Cœur, traîneau et sapins"), I(11, "Renne au bonnet"), I(12, "Père Noël sous la lune"),
  I(13, "Mickey et Minnie, boule à neige", "droits texte"), I(14, "Village et traîneau devant la lune"), I(15, "Le Grinch à la cheminée", "droits"),
  I(16, "Médaillon aux cerfs « Merry Christmas »", "texte"), I(17, "« Douce magie d'hiver »", "mots"), I(18, "« Noël tout en douceur »", "mots"),
  I(19, "« Sous les étoiles de Noël »", "mots"), I(20, "« Mon beau sapin »", "mots"), I(21, "« Un soupçon de magie »", "mots"),
  I(22, "« Esprit d'hiver »", "mots"), I(23, "« Joyeux Noël »", "mots"), I(24, "« Petits bonheurs de Noël »", "mots"), I(25, "« La saison des merveilles »", "mots"),
  I(26, "Renne aux bois décorés"), I(27, "Père Noël à lunettes, signe de paix"),
];

// Produits gravés qui peuvent recevoir la carte « Un modèle de Noël » (fiches à parcours guidé). Jamais bijoux ni mariage.
export const NOEL_PRODUITS = [
  { slug: "verre-a-vin-grave", nom: "Verre à vin gravé (36 et 47 cl)" },
  { slug: "flute-a-champagne-gravee", nom: "Flûte à champagne gravée" },
  { slug: "verre-a-whisky-grave", nom: "Verre à whisky portrait" },
  { slug: "verre-tumbler-cristal-grave", nom: "Verre tumbler en cristal" },
  { slug: "verre-a-cocktail-grave", nom: "Verre à cocktail" },
  { slug: "carafe-a-whisky-gravee", nom: "Carafe à whisky" },
  { slug: "cristal-deja-grave", nom: "Cristaux déjà gravés (page /cristaux-graves)" },
];

// ------------------------------------------------------------------ emballages de Noël pour les BIJOUX (commande Temu reçue le 28/10)
// Prix validés par le gérant (28/10 soir, puis 29/10 : sac 4,90, pochette 3,90, pack 7,90 barré 8,80).
// fit = dans quoi le bijou peut être pour rentrer dedans (seul / microfibre · sac cadeau · boîte carrée ·
// boîte allongée · Pack boîte cadeau) — règle par défaut d'après les dimensions, réglable dans Gestion.
// Poids ESTIMÉS (rien n'est pesé). Le pack prend une boîte à ruban + un sac de Noël dans le stock.
const P = "/produits/noel/emballages/";
export const NOEL_EMBALLAGES = [
  { id: "sachet", nom: "Sachet rouge de Noël", d: "12 × 17 cm · plat, fermeture adhésive", prix: 0.9, cout: 0.13, poids: 5, photo: P + "7-sachet-rouge-O-remise.jpg", colis: false, fit: { seul: true }, stock: ["noel-sachet"] },
  { id: "pochette", nom: "Pochette à languette dorée", d: "Bordeaux et or · pour un collier ou un bracelet", prix: 3.9, cout: 0.8, poids: 20, photo: P + "1-pochette-F.jpg", colis: false, fit: { seul: true }, stock: ["noel-pochette"] },
  { id: "sac", nom: "Sac de Noël à anses", d: "Bordeaux, liseré or, nœud satin · 19 × 15 × 7 cm · plié à plat", prix: 4.9, cout: 1.38, poids: 25, photo: P + "2-sac-M.jpg", colis: false, fit: { seul: true, sac: true, carree: true }, stock: ["noel-sac"] },
  { id: "ruban", nom: "Boîte à ruban « Merry Christmas »", d: "11,5 × 7 × 4,5 cm · aimantée · vert sapin ou bleu nuit", prix: 3.9, cout: 0.72, poids: 60, photo: P + "3-5-boite-ruban-C-vert-recadree.jpg", colis: true, couleurs: true, fit: { seul: true }, stock: ["noel-ruban"] },
  { id: "rouge", nom: "Boîte rouge au sapin doré", d: "12 × 6 × 4 cm · ruban rouge et or", prix: 3.9, cout: 0.62, poids: 45, photo: P + "4-boite-rouge-G.jpg", colis: true, fit: { seul: true }, stock: ["noel-rouge"] },
  { id: "pack", nom: "Pack de Noël", d: "Boîte à ruban (vert ou bleu nuit) + sac de Noël + étiquette", prix: 7.9, barre: 8.8, cout: 2.15, poids: 90, photo: P + "2-sac-M.jpg", colis: true, couleurs: true, meil: true, fit: { seul: true }, stock: ["noel-ruban", "noel-sac"] },
];
export const NOEL_ETIQUETTE = { id: "etiquette", nom: "Étiquette rouge « Merry Christmas » + ficelle", d: "5,4 × 9 cm · offerte avec chaque emballage de Noël", cout: 0.05, photo: P + "6-etiquettes-I.jpg", stock: "noel-etiquette" };
export const NOEL_COULEURS = [
  { id: "vert", nom: "Vert sapin", hex: "#1f5a3a", photo: P + "3-5-boite-ruban-C-vert-recadree.jpg" },
  { id: "bleu", nom: "Bleu nuit", hex: "#1f3561", photo: P + "3-5-boite-ruban-J-bleu-recadree.jpg" },
];
// Stock de départ = quantités reçues le 28/10 (posé une fois dans la carte de stock par Gestion → Fêtes).
export const NOEL_STOCK_DEPART = { "noel-sachet": 52, "noel-pochette": 40, "noel-sac": 20, "noel-ruban": 48, "noel-rouge": 20, "noel-etiquette": 50 };
export const FITS = [["seul", "bijou seul / microfibre"], ["sac", "sac cadeau"], ["carree", "boîte carrée (colliers)"], ["allongee", "boîte allongée (bracelets)"], ["pack", "Pack boîte cadeau"]];

/** Catégorie de l'emballage HABITUEL choisi (ids de Gestion → Emballages) : dans quoi est le bijou. */
export function categorieEmballage(pkgIds) {
  const id = String((Array.isArray(pkgIds) ? pkgIds[0] : pkgIds) || "");
  if (!id || /microfibre/i.test(id)) return "seul";
  if (/pack/i.test(id)) return "pack";
  if (/allong/i.test(id)) return "allongee";
  if (/boite|boîte/i.test(id)) return "carree";
  if (/sac/i.test(id)) return "sac";
  return "seul";
}

const num = (x, def) => (Number.isFinite(Number(x)) && x !== "" && x !== null ? Number(x) : def);

/** Réglages de Noël fusionnés avec le code (ce qui n'est pas enregistré garde la valeur du code). */
export function configNoel(settings) {
  const s = settings?.fetes?.noel || {};
  const imagesReg = s.images || {};
  const produitsReg = s.produits || {};
  const embReg = s.emballages || {};
  return {
    on: s.on === true,
    images: NOEL_IMAGES.map((m) => ({ ...m, masquee: imagesReg[m.n]?.masquee === true })),
    produits: NOEL_PRODUITS.map((p) => ({ ...p, on: produitsReg[p.slug] !== false })),
    emballages: NOEL_EMBALLAGES.map((e) => {
      const r = embReg[e.id] || {};
      const fit = {}; for (const [k] of FITS) fit[k] = r.fit && typeof r.fit === "object" && k in r.fit ? r.fit[k] === true : e.fit[k] === true;
      return { ...e, prix: Math.max(0, num(r.prix, e.prix)), poids: Math.max(0, num(r.poids, e.poids)), fit, masque: r.masque === true };
    }),
  };
}

/** Les deux champs de texte d'un modèle de Noël, avec les clés que CETTE fiche fait payer (prix réels). */
export function champsNoel(product) {
  const payee = (k) => (engravingExtra(product, { mode: "modele", [k]: "x" }).amount || 0) > 0;
  const nom = ["prenom", "texte"].find(payee) || "prenom";
  const date = ["date", product?.parcoursGuide?.dateKey, "texte2"].filter(Boolean).find((k) => k !== nom && payee(k)) || "date";
  return [
    { key: nom, label: "Prénoms / nom / texte", ph: "Ex. Camille · Elli & Ben · « Joyeux Noël »", max: 40 },
    { key: date, label: "Date ou année", ph: "Ex. 2026 · 25.12.26", max: 20 },
  ];
}

/** Ce que la fiche d'un produit gravé reçoit quand Noël est allumé (null sinon). */
export function noelPourProduit(product, cfg) {
  if (!cfg?.on || !product?.parcoursGuide) return null;
  const p = cfg.produits.find((x) => x.slug === product.slug);
  if (!p || !p.on) return null;
  const images = cfg.images.filter((m) => !m.masquee).map(({ n, nom, src, trace, mots }) => ({ n, nom, src, trace, mots }));
  return images.length ? { images, champs: champsNoel(product) } : null;
}

/** Les dessins de Noël de la page « Cristaux déjà gravés » (null si Noël éteint ou la page décochée). */
export function noelPourCristaux(cfg) {
  if (!cfg?.on) return null;
  const p = cfg.produits.find((x) => x.slug === "cristal-deja-grave");
  if (!p || !p.on) return null;
  const images = cfg.images.filter((m) => !m.masquee).map(({ n, nom, src, blanc, mots }) => ({ n, nom, src, blanc, mots }));
  return images.length ? images : null;
}

/** Emballages de Noël proposés sur un bijou (null si Noël éteint ou pas un bijou). */
export function emballagesNoelPourProduit(product, cfg) {
  if (!cfg?.on || product?.category !== "bijoux" || product?.marquePages) return null;
  const options = cfg.emballages.filter((e) => !e.masque).map(({ id, nom, d, prix, barre, poids, photo, colis, couleurs, meil, fit, stock }) => ({ id, nom, d, prix, barre, poids, photo, colis: Boolean(colis), couleurs: Boolean(couleurs), meil: Boolean(meil), fit, stock }));
  return options.length ? { options, couleurs: NOEL_COULEURS, etiquette: { nom: NOEL_ETIQUETTE.nom, photo: NOEL_ETIQUETTE.photo, stock: NOEL_ETIQUETTE.stock } } : null;
}

/** Les emballages de Noël où le bijou rentre, selon son emballage habituel. */
export function emballagesNoelDispo(product, pkgIds) {
  const cat = categorieEmballage(pkgIds);
  return (product?.packagingNoel?.options || []).filter((o) => o.fit?.[cat]);
}

/**
 * Supplément d'un emballage de Noël choisi (recalcul de confiance au paiement).
 * sel = { id, couleur }. Un choix qui ne rentre plus avec l'emballage habituel est ignoré.
 */
export function packagingNoelExtra(product, sel, pkgIds) {
  const vide = { amount: 0, weight: 0, colis: false, label: "", stockIds: [], id: null };
  if (!sel || !sel.id) return vide;
  const o = emballagesNoelDispo(product, pkgIds).find((x) => x.id === sel.id);
  if (!o) return vide;
  const coul = o.couleurs ? (NOEL_COULEURS.find((c) => c.id === sel.couleur) || NOEL_COULEURS[0]) : null;
  const etq = product.packagingNoel?.etiquette?.stock;
  return {
    amount: Math.round((Number(o.prix) || 0) * 100) / 100,
    weight: Number(o.poids) || 0,
    colis: o.colis,
    label: `Emballage de Noël : ${o.nom}${coul ? ` · ${coul.nom.toLowerCase()}` : ""} (+${(Number(o.prix) || 0).toFixed(2)} €) · étiquette « Merry Christmas » offerte`,
    stockIds: [...(o.stock || []), ...(etq ? [etq] : [])],
    id: o.id,
    couleur: coul?.id || null,
  };
}

/** Champs de la fiche quand Noël est allumé : le choix « Un modèle de Noël » + le n° choisi (libellés de commande lisibles). */
export function champsFicheAvecNoel(fields, noel) {
  if (!noel || !Array.isArray(fields)) return fields;
  const out = fields.map((f) => (f.key === "mode" && Array.isArray(f.options) && !f.options.some((o) => o.value === "noel")
    ? { ...f, options: [...f.options, { value: "noel", label: "Un modèle de Noël" }] } : f));
  if (!out.some((f) => f.key === "noelModele")) {
    out.push({ key: "noelModele", type: "select", label: "Modèle de Noël", optional: true,
      options: noel.images.map((m) => ({ value: String(m.n), label: `Noël n° ${m.n} — ${m.nom}` })) });
  }
  return out;
}
