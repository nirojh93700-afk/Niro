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
// Nombre + boîte au choix (27/10/2026, gérant : « comment le client choisit s'il veut plusieurs marque-pages sans la
// boîte ? » → « Combien de marque-pages ? » puis « Boîte cadeau ? »). Identifiants « n<k> » (sans boîte) et « n<k>b »
// (avec boîte), k = 1 à MP_MAX. Les anciens identifiants ci-dessus restent lus (paniers en cours).
export const MP_MAX = 8;
/** Boîtes pour n marque-pages : la moins chère qui les range tous (1 → 1 place, 2 → 2, 3 ou 4 → 4, au-delà 4 + le reste). */
export function mpBoitesPour(n) {
  const out = [];
  let r = n;
  while (r > 4) { out.push(4); r -= 4; }
  if (r > 0) out.push(r === 3 ? 4 : r);
  return out;
}
/** Le format d'un identifiant (nouveau ou ancien) : { id, n, boites:[tailles], box (1re boîte, compat), titre }. */
export function mpFormat(id) {
  const m = /^n([1-9])(b?)$/.exec(String(id || ""));
  if (m) {
    const n = Math.min(MP_MAX, Number(m[1]));
    const boites = m[2] ? mpBoitesPour(n) : [];
    const titre = `${n} marque-page${n > 1 ? "s" : ""}` + (boites.length ? " en boîte cadeau" : " sans boîte");
    return { id: `n${n}${m[2]}`, n, boites, box: boites[0] || 0, titre };
  }
  const f = MP_FORMATS.find((x) => x.id === id);
  return f ? { ...f, boites: f.box ? [f.box] : [] } : null;
}
/** « boîte de 4 places + boîte de 1 place » */
export function mpBoitesTexte(boites) {
  return boites.map((b) => `boîte de ${b} place${b > 1 ? "s" : ""}`).join(" + ");
}

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
  const fmt = mpFormat(raw.format);
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
  const fmt = mpFormat(mp.format);
  const lesBoites = fmt.boites.map((b) => MP_BOITES[b]);
  const boite = lesBoites[0] || null;
  const vById = new Map((product.variants || []).map((x) => [x.id, x]));
  const pieces = mp.slots.map((s) => {
    const variant = vById.get(s.c);
    const promo = promos[variant.id];
    const base = typeof promo === "number" && promo < variant.price ? promo : variant.price;
    const grav = mpPrixGravure(s.v);
    return { variant, base, grav, prix: r2(base + grav) };
  });
  const prixBoites = lesBoites.reduce((a, b) => a + b.prix, 0);
  const total = r2(pieces.reduce((a, p) => a + p.prix, 0) + prixBoites);
  const stock = new Map();
  for (const p of pieces) { const sid = p.variant.stockId || p.variant.id; stock.set(sid, (stock.get(sid) || 0) + 1); }
  for (const b of lesBoites) stock.set(b.stockId, (stock.get(b.stockId) || 0) + 1);
  const grams = pieces.reduce((a, p) => a + (Number(p.variant.weight) || Number(product.weight) || 30), 0) + lesBoites.reduce((a, b) => a + b.poids, 0);
  return { fmt, boite, boites: lesBoites, prixBoites: r2(prixBoites), pieces, total, stock: [...stock.entries()], grams, enBoite: lesBoites.length > 0 };
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
  const morceaux = [c.fmt.titre + (c.fmt.boites.length ? ` (${mpBoitesTexte(c.fmt.boites)}, bleu nuit)` : "")];
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
