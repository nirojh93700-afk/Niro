// =============================================================================
// Marque-pages (mise en vente du 27/10/2026, gérant : « mets en vente, sur le site, les maquettes »).
// UN SEUL calcul pour la fiche ET le paiement (pur, sans dépendance serveur) : formats, boîtes,
// gravure à quatre emplacements, stock décompté, résumé atelier. Maquettes reproduites :
// modèle 1 v17 · modèle 2 v16 · métal v4 (CLAUDE.md, « LES TROIS MAQUETTES MARQUE-PAGES »).
// =============================================================================
import { getFontLabel } from "./fonts";

// Formats : seul, en boîte cadeau (1), coffret de 2, coffret de 4 (boîtes bleu nuit, 4,90 / 5,90 / 7,90 €).
export const MP_FORMATS = [
  { id: "seul", n: 1, box: 0, titre: "Seul" },
  { id: "boite1", n: 1, box: 1, titre: "En boîte cadeau" },
  { id: "coffret2", n: 2, box: 2, titre: "Coffret de 2" },
  { id: "coffret4", n: 4, box: 4, titre: "Coffret de 4" },
];
// Boîtes : stock commun aux trois modèles (10 de chaque reçues le 27/10/2026). Poids estimés (emballées).
export const MP_BOITES = {
  1: { prix: 4.9, stockId: "mp-boite-1", poids: 60, titre: "Boîte cadeau bleu nuit · 1 marque-page", image: "/marque-pages/m1/boite1.jpg" },
  2: { prix: 5.9, stockId: "mp-boite-2", poids: 90, titre: "Boîte cadeau bleu nuit · 2 marque-pages", image: "/marque-pages/m1/boite2.jpg" },
  4: { prix: 7.9, stockId: "mp-boite-4", poids: 140, titre: "Boîte cadeau bleu nuit · 4 marque-pages", image: "/marque-pages/m1/boite4.jpg" },
};

// Gravure (23/10/2026) : texte +3 €, dessin / cadre +4 € (+3 € si un texte s'écrit dans le cadre), photo +4 €.
export const MP_PRIX = { texte: 3, dessin: 4, texteCadre: 3, photo: 4 };
export const MP_EMPLACEMENTS = [["face", "haut"], ["face", "bas"], ["dos", "haut"], ["dos", "bas"]];
export const MP_NUMS_OK = [...Array.from({ length: 74 }, (_, i) => i + 1), 88, 89, 90, 91, 92, 93, 94, 96, 98, 100, 101, 102];
const NUMS = new Set(MP_NUMS_OK);
export const MP_POLICES = ["playfair", "cinzel", "cinzel-deco", "montserrat", "inter", "great-vibes", "allura", "pacifico"];

const LIBELLE_EMP = {
  1: { "face|haut": "Face, en haut (sous le trou)", "face|bas": "Face, au milieu", "dos|haut": "Dos, en haut", "dos|bas": "Dos, au milieu" },
  2: { "face|haut": "Face, au-dessus de la fenêtre", "face|bas": "Face, à côté de la fenêtre", "dos|haut": "Dos, en haut", "dos|bas": "Dos, au milieu" },
};

/** Ce qu'un emplacement accepte : modèle 1 tout ; modèle 2 face en haut = texte ou photo, face à côté = texte, dos = tout ; métal rien. */
export function mpAutorise(modele, side, zone) {
  if (modele === 1) return ["texte", "dessin", "photo"];
  if (modele === 2) return side === "face" ? (zone === "haut" ? ["texte", "photo"] : ["texte"]) : ["texte", "dessin", "photo"];
  return [];
}

const r2 = (n) => Math.round(n * 100) / 100;
const txt = (s, max = 24) => String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const estPhoto = (s) => typeof s === "string" && /^(\/api\/img\/[A-Za-z0-9_-]{4,80}|https:\/\/res\.cloudinary\.com\/[^\s"'<>]{4,300})$/.test(s);

/** Gravure d'un marque-page nettoyée (seules les combinaisons permises sont gardées). */
export function mpGravureNette(modele, v) {
  const out = {};
  for (const [side, zone] of MP_EMPLACEMENTS) {
    const key = `${side}|${zone}`;
    const e = (v && typeof v === "object" && v[key]) || {};
    const ok = mpAutorise(modele, side, zone);
    const k = ok.includes(e.k) ? e.k : "";
    const n = k === "dessin" && NUMS.has(Number(e.n)) ? Number(e.n) : 0;
    const t = k === "texte" || (k === "dessin" && n >= 75) ? txt(e.t) : "";
    const src = k === "photo" && estPhoto(e.src) ? e.src : null;
    out[key] = { k, t, n, src };
  }
  return out;
}

/** Prix de la gravure d'un marque-page (emplacements remplis seulement). */
export function mpPrixGravure(v) {
  let p = 0;
  for (const key of Object.keys(v || {})) {
    const e = v[key] || {};
    if (e.k === "texte" && String(e.t || "").trim()) p += MP_PRIX.texte;
    else if (e.k === "dessin" && e.n) { p += MP_PRIX.dessin; if (e.n >= 75 && String(e.t || "").trim()) p += MP_PRIX.texteCadre; }
    else if (e.k === "photo") p += MP_PRIX.photo;
  }
  return p;
}

/**
 * Normalise ce qu'envoie la fiche : { format, police, slots:[{ c: variantId, v: {…} }] }.
 * Renvoie null si le format ou une couleur n'existe pas.
 */
export function mpNormaliser(product, raw) {
  const cfg = product?.marquePages;
  if (!cfg || !raw || typeof raw !== "object") return null;
  const fmt = MP_FORMATS.find((f) => f.id === raw.format);
  if (!fmt) return null;
  const slots = Array.isArray(raw.slots) ? raw.slots.slice(0, fmt.n) : [];
  if (slots.length !== fmt.n) return null;
  const ids = new Set((product.variants || []).map((x) => x.id));
  const out = [];
  for (const s of slots) {
    if (!s || !ids.has(s.c)) return null;
    out.push({ c: s.c, v: cfg.gravure ? mpGravureNette(cfg.modele, s.v) : {} });
  }
  const police = MP_POLICES.includes(raw.police) ? raw.police : "playfair";
  return { format: fmt.id, police, slots: out };
}

/**
 * Calcul complet d'une commande de marque-pages (une ligne du panier, pour UNE unité).
 * promos = { variantId: prix promo } (facultatif).
 */
export function mpCalcul(product, mp, promos = {}) {
  const fmt = MP_FORMATS.find((f) => f.id === mp.format);
  const boite = fmt.box ? MP_BOITES[fmt.box] : null;
  const vById = new Map((product.variants || []).map((x) => [x.id, x]));
  const pieces = mp.slots.map((s) => {
    const variant = vById.get(s.c);
    const promo = promos[variant.id];
    const base = typeof promo === "number" && promo < variant.price ? promo : variant.price;
    const grav = mpPrixGravure(s.v);
    return { variant, base, grav, prix: r2(base + grav) };
  });
  const total = r2(pieces.reduce((a, p) => a + p.prix, 0) + (boite ? boite.prix : 0));
  const stock = new Map();
  for (const p of pieces) { const sid = p.variant.stockId || p.variant.id; stock.set(sid, (stock.get(sid) || 0) + 1); }
  if (boite) stock.set(boite.stockId, (stock.get(boite.stockId) || 0) + 1);
  const grams = pieces.reduce((a, p) => a + (Number(p.variant.weight) || Number(product.weight) || 30), 0) + (boite ? boite.poids : 0);
  return { fmt, boite, pieces, total, stock: [...stock.entries()], grams, enBoite: Boolean(boite) };
}

/** Une ligne par emplacement gravé : [{ key, libelle, valeur, texte, img }]. */
export function mpLignes(modele, v) {
  const L = LIBELLE_EMP[modele] || LIBELLE_EMP[1];
  const out = [];
  for (const [side, zone] of MP_EMPLACEMENTS) {
    const key = `${side}|${zone}`;
    const e = (v || {})[key] || {};
    if (e.k === "texte" && String(e.t || "").trim()) out.push({ key, side, libelle: L[key], valeur: `Texte « ${e.t.trim()} »`, texte: true });
    else if (e.k === "dessin" && e.n) {
      const cadre = e.n >= 75;
      out.push({ key, side, libelle: L[key], valeur: (cadre ? `Cadre n° ${e.n}` : `Dessin n° ${e.n}`) + (cadre && String(e.t || "").trim() ? `, texte au milieu « ${e.t.trim()} »` : ""), texte: cadre && Boolean(String(e.t || "").trim()), img: `/marque-pages/dessins/${String(e.n).padStart(3, "0")}.png` });
    } else if (e.k === "photo") out.push({ key, side, libelle: L[key], valeur: e.src ? "Photo envoyée (gravée en noir et blanc)" : "Photo à envoyer", img: e.src || undefined });
  }
  return out;
}

/** Résumé court (panier, e-mails, Stripe). */
export function mpResume(product, mp) {
  const c = mpCalcul(product, mp);
  const morceaux = [c.fmt.titre + (c.boite ? ` (${c.boite.titre.replace(/^Boîte cadeau /, "boîte ")})` : "")];
  const gravure = Boolean(product.marquePages?.gravure);
  c.pieces.forEach((p, i) => {
    const lignes = gravure ? mpLignes(product.marquePages.modele, mp.slots[i].v) : [];
    const nom = mp.slots.length > 1 ? `Marque-page ${i + 1} : ${p.variant.title}` : p.variant.title;
    morceaux.push(lignes.length ? `${nom} — ${lignes.map((l) => `${l.libelle.toLowerCase()} : ${l.valeur}`).join(" ; ")}` : (gravure ? `${nom} — sans gravure` : nom));
  });
  if (gravure && mp.slots.some((s) => mpLignes(product.marquePages.modele, s.v).some((l) => l.texte))) morceaux.push(`Écriture : ${getFontLabel(mp.police) || mp.police}`);
  return morceaux.join(" · ");
}

/** Coût d'une gravure « offerte » (code gravure) : la première gravure payante trouvée. */
export function mpPremiereGravure(mp) {
  for (const s of mp.slots || []) {
    for (const key of Object.keys(s.v || {})) {
      const e = s.v[key];
      if (e.k === "texte" && String(e.t || "").trim()) return MP_PRIX.texte;
      if ((e.k === "dessin" && e.n) || e.k === "photo") return MP_PRIX.dessin;
    }
  }
  return 0;
}
