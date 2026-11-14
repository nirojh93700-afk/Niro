// =============================================================================
// LE FICHIER À GRAVER DE CHAQUE ARTICLE, FABRIQUÉ DANS GESTION (14/11/2026)
// -----------------------------------------------------------------------------
// Gérant, verre à whisky Fête des pères « élu Papa de l'année » (textes « Dad Est. / 2026 /
// Sibyle 22.05.2026 ») : « je peux toujours pas télécharger le fichier pour graver… pour les
// nouvelles commandes à chaque fois y a pas ». Jusqu'ici, seul un texte traduit avait son fichier.
//
// Ici : la gravure SEULE (sans la photo du produit), en noir, à la TAILLE RÉELLE, dessinée avec
// les mêmes règles que l'aperçu de la fiche (ModeleArt, ApercuClient), puis :
//   · SVG : le dessin repassé en tracés (contours), en millimètres : aucune police à installer ;
//   · PNG : la même image, 20 points par mm (508 ppp), taille écrite dans le fichier ;
//   · PDF : la page fait exactement la taille de la gravure.
// Une photo de cliente reste une IMAGE (niveaux de gris) : on ne trace pas une photo.
// Navigateur seulement (canvas). Le traceur est celui de public/atelier-outils/fabrique.js.
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { MODELES, imageDesign } from "@/lib/modeles";
import { getFontClass } from "@/lib/fonts";
import { texteAvecDecor } from "@/lib/decorTexte";
import { aEmplacement, cotesDeLArticle, contenuCote, emplacementDe } from "@/lib/apercuCote";
import { consignesGravure } from "@/lib/consignesGravure";

export const R = 20; // points par millimètre
const MAX_PX = 14e6; // une image plus grande que ça ne passe pas sur un iPhone
const TAILLE_TEXTE_SEUL_MM = 6; // hauteur de départ d'un texte sans taille connue (à ajuster dans le logiciel)

/** Millimètres représentés par toute la largeur de la photo du produit (mêmes règles que l'éditeur de la fiche). */
export function mmParCadre(p, side = "face") {
  const cfg = side === "fond" ? p?.engraveFond : p?.engrave;
  if (!cfg) return null;
  const box = cfg.box || { width: 0.6 };
  return (cfg.widthMm || 65) / (cfg.maxWidthFrac || box.width || 0.6);
}

const lignes = (t) => String(t || "").split("\n").map((l) => l.trim()).filter(Boolean);
const aModeleImage = (f) => Boolean(String(f.numstyle || "").trim() || String(f.noelModele || "").trim() || String(f.lettreFleurie || "").trim()
  || String(f.gravureExemple || "").trim() || ["modele", "lettre", "noel"].includes(f.mode));

/** Lignes de texte d'un verre « à message » (comme l'aperçu de la fiche, sans le texte du fond). */
function lignesVerre(item, p) {
  const f = item.fields || {};
  return (p?.personalizationFields || [])
    .filter((x) => (x.type === "text" || x.type === "textarea" || !x.type) && !x.noPreview && x.key !== "texteFond")
    .flatMap((x) => lignes(f[x.key]).map((l, i) => (i === 0 ? texteAvecDecor(x.key, l, f) : l)));
}

/**
 * Ce qu'on peut fabriquer pour cet article : [{ id, titre, sorte, side, note }].
 *  sorte : "modele" (modèle Fête des pères…), "cote" (photo / texte posés sur le verre), "textes" (textes seuls).
 */
export function fichiersPossibles(item) {
  if (!item) return [];
  const p = getProductBySlug(item.slug);
  const f = item.fields || {};
  if (p?.gobeletParcours || p?.marquePages || p?.carnet) return []; // leurs compositions ont leur propre aperçu
  const out = [];
  const tpl = item.modele && MODELES[item.modeleTemplate];
  if (tpl) {
    out.push({ id: "modele", titre: "Face avant — le modèle", sorte: "modele", side: "face" });
    if (emplacementDe(item) === "deux" && f.fondType === "texte" && String(f.texteFond || "").trim()) {
      out.push({ id: "fond", titre: "Fond du verre — le texte", sorte: "textes", side: "fond", lignes: lignes(f.texteFond), police: f.police });
    }
    return out;
  }
  if (aEmplacement(p)) {
    for (const side of cotesDeLArticle(item)) {
      const c = contenuCote(item, side, p);
      if (c.photo || c.lines.length) out.push({ id: side, titre: side === "fond" ? "Fond du verre" : "Face avant", sorte: "cote", side });
    }
    return out;
  }
  if (p?.engrave && !aModeleImage(f) && !p.crystal3d) {
    const ls = lignesVerre(item, p);
    if (item.photoSrc || ls.length) return [{ id: "face", titre: item.emplacement === "fond" ? "Fond du verre" : "Face avant", sorte: "cote", side: "face", verre: true }];
  }
  // Tout le reste (bijoux, bois, verre avec un modèle numéroté…) : les textes à graver, face par face,
  // dans l'écriture choisie. Les images du modèle sont dans « Images d'origine ».
  const c = consignesGravure(item);
  const blocs = c.faces.length
    ? c.faces.map((fc) => ({ nom: fc.nom, ls: fc.lignes.filter((l) => l.texte).map((l) => String(l.v)) }))
    : [{ nom: "", ls: c.autres.filter((l) => l.texte).map((l) => String(l.v)) }];
  blocs.forEach((b, i) => {
    const ls = b.ls.flatMap(lignes);
    if (!ls.length) return;
    out.push({ id: `textes-${i}`, titre: b.nom ? `${b.nom} — le texte` : "Le texte", sorte: "textes", side: "face", lignes: ls, police: f.police,
      note: `Taille de départ : lettres de ${TAILLE_TEXTE_SEUL_MM} mm. Le fichier est en tracés : agrandissez-le ou réduisez-le dans le logiciel du laser sans perte.` });
  });
  return out;
}

/* ------------------------------ outils de dessin ------------------------------ */
function charger(src) {
  return new Promise((ok, ko) => {
    const im = new window.Image();
    im.crossOrigin = "anonymous";
    im.onload = () => ok(im);
    im.onerror = () => ko(new Error("image introuvable : " + String(src).slice(0, 80)));
    im.src = src;
  });
}
const familles = {};
function famille(cls) {
  const k = cls || "fnt-playfair";
  if (familles[k]) return familles[k];
  const s = document.createElement("span");
  s.className = k; s.style.cssText = "position:absolute;visibility:hidden;left:-9999px"; s.textContent = "Ag";
  document.body.appendChild(s);
  const fam = getComputedStyle(s).fontFamily || "serif";
  s.remove();
  return (familles[k] = fam);
}
async function police(cls, px, gras, texte) {
  const fam = famille(cls);
  const font = `${gras ? "700 " : ""}${Math.max(1, px)}px ${fam}`;
  try { await document.fonts.load(font, texte || "Ag"); } catch { /* police du système */ }
  return font;
}
const motifs = {};
async function motif(id) {
  if (!motifs[id]) motifs[id] = charger(`/motifs/${id}.png`).catch(() => null);
  return motifs[id];
}
// Motif teinté en noir (le PNG est noir sur transparent : on garde sa forme).
async function dessinerMotif(ctx, id, cx, cy, s) {
  const im = await motif(id);
  if (!im) return;
  const c = document.createElement("canvas"); c.width = c.height = Math.max(2, Math.round(s));
  const g = c.getContext("2d");
  g.drawImage(im, 0, 0, c.width, c.height);
  g.globalCompositeOperation = "source-in"; g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(c, cx - s / 2, cy - s / 2, s, s);
}
// Texte centré sur x, avec un espacement entre les lettres (CSS letter-spacing) dessiné lettre par lettre.
function texteCentre(ctx, t, x, y, espace = 0) {
  if (!espace) { ctx.textAlign = "center"; ctx.fillText(t, x, y); return ctx.measureText(t).width; }
  const ch = [...t];
  const w = ch.reduce((a, c) => a + ctx.measureText(c).width, 0) + espace * (ch.length - 1);
  let cx = x - w / 2;
  ctx.textAlign = "left";
  for (const c of ch) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + espace; }
  return w;
}
function largeurTexte(ctx, t, espace = 0) {
  const ch = [...t];
  return espace ? ch.reduce((a, c) => a + ctx.measureText(c).width, 0) + espace * (ch.length - 1) : ctx.measureText(t).width;
}
const em = (v, fs) => (typeof v === "string" && v.endsWith("em") ? parseFloat(v) * fs : 0);

/* ------------------------------ le modèle (comme ModeleArt) ------------------------------ */
async function dessinerModele(item, b) {
  const tpl = MODELES[item.modeleTemplate];
  const mv = item.modele || {};
  const text = mv.text || {}, fonts = mv.fonts || {};
  const layout = mv.layout || tpl.layout || tpl.style || "stack";
  const get = (k) => {
    const l = tpl.lines.find((x) => x.key === k);
    const raw = String(text[k] || "").trim();
    return l && raw ? { txt: raw, cls: fonts[k] || l.font, em: l.em || 1, bold: l.bold, spacing: l.spacing } : null;
  };
  const sub = tpl.lines.find((l) => l.below);
  const subTxt = sub && mv.addText !== false ? String(text[sub.key] || "").trim() : "";
  // Rangées : { k, h (hauteur), w (largeur), draw(ctx, cx, y) }
  const rows = [];
  const mesure = document.createElement("canvas").getContext("2d");
  const ligne = async (r, fs, mt = 0) => {
    const font = await police(r.cls, fs, r.bold, r.txt);
    mesure.font = font;
    const sp = em(r.spacing, fs);
    rows.push({ h: fs * 1.05 + mt, w: largeurTexte(mesure, r.txt, sp), draw: (ctx, cx, y) => { ctx.font = font; ctx.textBaseline = "middle"; texteCentre(ctx, r.txt, cx, y + mt + fs * 0.525, sp); } });
  };
  const subRow = async () => { if (subTxt) await ligne({ txt: subTxt, cls: fonts[sub.key] || sub.font }, b * (sub.em || 0.5), b * 0.16); };
  const fleuron = () => rows.push({ h: b * 0.5, w: b * 4, draw: (ctx, cx, y) => {
    const k = b * 0.04, fy = y + b * 0.25, x0 = cx - b * 2;
    ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(x0 + 6 * k, fy); ctx.lineTo(x0 + 94 * k, fy); ctx.stroke();
    for (const px of [6, 94]) { ctx.beginPath(); ctx.arc(x0 + px * k, fy, 2.4 * k, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(cx, fy - 4 * k); ctx.lineTo(cx + 3.5 * k, fy); ctx.lineTo(cx, fy + 4 * k); ctx.lineTo(cx - 3.5 * k, fy); ctx.closePath(); ctx.fill();
  } });
  const design = imageDesign(tpl, layout);
  if (design) {
    const im = await charger(design.dark);
    const W = b * 6.2, H = W * (im.naturalHeight / im.naturalWidth);
    rows.push({ h: H, w: W, draw: (ctx, cx, y) => ctx.drawImage(im, cx - W / 2, y, W, H) });
    await subRow();
  } else if (layout === "badge") {
    const S = b * 6.2;
    const t = get("top"), m = get("mid"), bo = get("bot");
    const plein = mv.bg === "plein";
    const fT = t ? await police(t.cls, 30, true, t.txt) : "", fM = m ? await police(m.cls, 46, true, m.txt) : "", fB = bo ? await police(bo.cls, 26, false, bo.txt) : "";
    rows.push({ h: S, w: S, draw: (ctx, cx, y) => badge(ctx, cx - S / 2, y, S / 300, { t, m, bo, fT, fM, fB, plein }) });
    await subRow();
  } else if (layout === "classic") {
    const t = get("top"), m = get("mid"), bo = get("bot");
    if (t) await ligne(t, b * (t.em || 0.85));
    fleuron();
    {
      const etoile = b * 0.5, gap = b * 0.28;
      let font = "", sp = 0, w = 0;
      if (m) { font = await police(m.cls, b, m.bold, m.txt); mesure.font = font; sp = em(m.spacing, b); w = largeurTexte(mesure, m.txt, sp); }
      const total = w + (etoile + gap) * 2;
      rows.push({ h: b * 1.05, w: total, draw: async (ctx, cx, y) => {
        const my = y + b * 0.525;
        await dessinerMotif(ctx, "etoile", cx - total / 2 + etoile / 2, my, etoile);
        await dessinerMotif(ctx, "etoile", cx + total / 2 - etoile / 2, my, etoile);
        if (m) { ctx.font = font; ctx.textBaseline = "middle"; texteCentre(ctx, m.txt, cx, my, sp); }
      } });
    }
    fleuron();
    if (bo) await ligne(bo, b * (bo.em || 0.42));
    if (mv.motif && mv.motif !== "aucun") { const s = b * 0.95, mt = b * 0.15; rows.push({ h: s + mt, w: s, draw: (ctx, cx, y) => dessinerMotif(ctx, mv.motif, cx, y + mt + s / 2, s) }); }
    await subRow();
  } else {
    for (const l of tpl.lines.filter((x) => !x.below)) { const r = get(l.key); if (r) await ligne(r, b * (r.em || 1)); }
    if (mv.motif && mv.motif !== "aucun") { const s = b * 1.15, mt = b * 0.12; rows.push({ h: s + mt, w: s, draw: (ctx, cx, y) => dessinerMotif(ctx, mv.motif, cx, y + mt + s / 2, s) }); }
    await subRow();
  }
  const W = Math.max(...rows.map((r) => r.w), b) + b * 2;
  const H = rows.reduce((a, r) => a + r.h, 0) + b * 2;
  const c = toile(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000"; ctx.strokeStyle = "#000";
  let y = b;
  for (const r of rows) { await r.draw(ctx, W / 2, y); ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; y += r.h; }
  return c;
}

// Médaillon rond (RoundBadge), dans son repère de 300 × 300, échelle k.
function badge(ctx, x0, y0, k, { t, m, bo, fT, fM, fB, plein }) {
  ctx.save(); ctx.translate(x0, y0); ctx.scale(k, k);
  const etoile = (cx, cy, r, inner = 0.42) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r; ctx[i ? "lineTo" : "moveTo"](cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } ctx.closePath(); };
  ctx.fillStyle = "#000"; ctx.strokeStyle = "#000";
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * 2 * Math.PI, a2 = ((i + 0.5) / 22) * 2 * Math.PI;
    etoile(150 + 142 * Math.cos(a), 150 + 142 * Math.sin(a), 8); ctx.fill();
    etoile(150 + 128 * Math.cos(a2), 150 + 128 * Math.sin(a2), 6.5); ctx.fill();
  }
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(150, 150, 120, 0, 7); if (plein) ctx.fill(); else ctx.stroke();
  // Sur un médaillon plein, les textes et les lignes sont « en réserve » (non gravés).
  const reserve = () => { ctx.globalCompositeOperation = plein ? "destination-out" : "source-over"; };
  reserve(); ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(150, 150, 72, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.rect(14, 126, 272, 48); if (plein) ctx.fill(); else { reserve(); ctx.stroke(); }
  reserve();
  ctx.lineWidth = 2.2; etoile(40, 150, 13); if (plein) ctx.fill(); else ctx.stroke();
  etoile(260, 150, 13); if (plein) ctx.fill(); else ctx.stroke();
  const arc = (txt, font, r, haut, espace) => {
    ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const ch = [...txt], ws = ch.map((c) => ctx.measureText(c).width);
    const tot = ws.reduce((a, w) => a + w, 0) + espace * (ch.length - 1);
    let s = -tot / 2;
    ch.forEach((c, i) => {
      const sc = s + ws[i] / 2, th = haut ? -Math.PI / 2 + sc / r : Math.PI / 2 - sc / r;
      ctx.save(); ctx.translate(150 + r * Math.cos(th), 150 + r * Math.sin(th)); ctx.rotate(haut ? th + Math.PI / 2 : th - Math.PI / 2);
      ctx.fillText(c, 0, 0); ctx.restore();
      s += ws[i] + espace;
    });
  };
  if (t) arc(t.txt, fT, 92, true, 30 * 0.12);
  if (bo) arc(bo.txt, fB, 106, false, 0);
  if (m) { ctx.font = fM; ctx.textBaseline = "middle"; texteCentre(ctx, m.txt, 150, 151, 46 * 0.03); }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

/* ------------------------------ un côté : photo et texte posés sur le verre ------------------------------ */
async function dessinerCote(item, side, verre) {
  const p = getProductBySlug(item.slug);
  const c = verre
    ? { glass: (p?.variants || []).find((v) => v.id === item.variantId)?.engraveImage || p?.engraveImage, box: p?.engrave?.box, photo: item.photoSrc || null,
        photoLayout: item.layout?.photo || null, textLayout: item.layout?.text || null, lines: lignesVerre(item, p), fontKey: (item.fields || {}).police || "playfair" }
    : contenuCote(item, side, p);
  const mmF = mmParCadre(p, verre ? "face" : side) || 100;
  const g = c.glass ? await charger(c.glass).catch(() => null) : null;
  const Fw = mmF * R, Fh = g ? Fw * (g.naturalHeight / g.naturalWidth) : Fw;
  const box = c.box || { left: 0.2, top: 0.2, width: 0.6, height: 0.6 };
  const els = [];
  if (c.photo) {
    const im = await charger(c.photo);
    const pL = c.photoLayout || {};
    const w = (pL.size ?? box.width * 0.75) * Fw, h = w * (im.naturalHeight / im.naturalWidth);
    const x = (pL.cx ?? box.left + box.width / 2) * Fw, y = (pL.cy ?? box.top + box.height / 2) * Fh;
    els.push({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2, draw: (ctx, ox, oy) => ctx.drawImage(im, x - w / 2 - ox, y - h / 2 - oy, w, h) });
  }
  if (c.lines.length) {
    const tL = c.textLayout || {};
    const fs = Math.max(4, (tL.fitScale || tL.scale || 0.05) * Fw), lh = fs * 1.2;
    const font = await police(getFontClass(c.fontKey), fs, false, c.lines.join(""));
    const m = document.createElement("canvas").getContext("2d"); m.font = font;
    const w = Math.max(...c.lines.map((l) => m.measureText(l).width));
    const x = (tL.cx ?? box.left + box.width / 2) * Fw, y = (tL.cy ?? box.top + box.height * 0.85) * Fh;
    const h = lh * c.lines.length;
    els.push({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2, texte: true, draw: (ctx, ox, oy) => {
      ctx.font = font; ctx.fillStyle = "#000"; ctx.textBaseline = "middle";
      c.lines.forEach((l, i) => texteCentre(ctx, l, x - ox, y - h / 2 + lh * (i + 0.5) - oy));
    } });
  }
  if (!els.length) return { toile: null, photo: false };
  const marge = 4 * R;
  const ox = Math.min(...els.map((e) => e.x0)) - marge, oy = Math.min(...els.map((e) => e.y0)) - marge;
  const W = Math.max(...els.map((e) => e.x1)) - ox + marge, H = Math.max(...els.map((e) => e.y1)) - oy + marge;
  const cv = toile(W, H);
  const ctx = cv.getContext("2d");
  for (const e of els) await e.draw(ctx, ox, oy);
  return { toile: cv, photo: Boolean(c.photo) };
}

/* ------------------------------ textes seuls ------------------------------ */
async function dessinerTextes(ls, policeKey) {
  const fs = TAILLE_TEXTE_SEUL_MM * R / 0.7, lh = fs * 1.25; // 0,7 ≈ hauteur d'une majuscule pour 1 de corps
  const font = await police(getFontClass(policeKey || "playfair"), fs, false, ls.join(""));
  const m = document.createElement("canvas").getContext("2d"); m.font = font;
  const W = Math.max(...ls.map((l) => m.measureText(l).width)) + fs * 2, H = lh * ls.length + fs * 2;
  const cv = toile(W, H);
  const ctx = cv.getContext("2d");
  ctx.font = font; ctx.fillStyle = "#000"; ctx.textBaseline = "middle";
  ls.forEach((l, i) => texteCentre(ctx, l, W / 2, fs + lh * (i + 0.5)));
  return cv;
}

/* ------------------------------ toile, recadrage, tracé ------------------------------ */
let echelle = 1; // réduite si l'image serait trop grande pour l'appareil
function toile(W, H) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(W)); c.height = Math.max(1, Math.ceil(H));
  return c;
}
// Recadre sur ce qui est dessiné ; met une photo en niveaux de gris, et le reste en noir pur.
function recadrer(src, photo) {
  const ctx = src.getContext("2d");
  const { width: W, height: H } = src;
  const d = ctx.getImageData(0, 0, W, H), p = d.data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0, k = 0; y < H; y++) for (let x = 0; x < W; x++, k += 4) {
    const a = p[k + 3];
    if (a < 8) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return null;
  const c = toile(x1 - x0 + 1, y1 - y0 + 1), g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  const tmp = toile(c.width, c.height);
  tmp.getContext("2d").putImageData(ctx.getImageData(x0, y0, c.width, c.height), 0, 0);
  g.drawImage(tmp, 0, 0);
  if (photo) {
    const q = g.getImageData(0, 0, c.width, c.height), b = q.data;
    for (let k = 0; k < b.length; k += 4) { const v = (b[k] * 77 + b[k + 1] * 150 + b[k + 2] * 29) >> 8; b[k] = b[k + 1] = b[k + 2] = v; b[k + 3] = 255; }
    g.putImageData(q, 0, 0);
  }
  return c;
}

// Contours (carrés mobiles au demi-ton) : la matière noire toujours à droite. Repris de fabrique.js.
function contours(G, W, H) {
  const Wn = W + 2, Hn = H + 2, suiv = new Map();
  for (let y = 0; y < Hn - 1; y++) {
    for (let x = 0, i = y * Wn; x < Wn - 1; x++, i++) {
      const cas = (G[i] < 128 ? 8 : 0) | (G[i + 1] < 128 ? 4 : 0) | (G[i + Wn + 1] < 128 ? 2 : 0) | (G[i + Wn] < 128 ? 1 : 0);
      if (cas === 0 || cas === 15) continue;
      const T = 2 * i, B = 2 * (i + Wn), L = 2 * i + 1, D = 2 * (i + 1) + 1;
      let moy;
      switch (cas) {
        case 1: suiv.set(L, B); break; case 2: suiv.set(B, D); break; case 3: suiv.set(L, D); break; case 4: suiv.set(D, T); break;
        case 6: suiv.set(B, T); break; case 7: suiv.set(L, T); break; case 8: suiv.set(T, L); break; case 9: suiv.set(T, B); break;
        case 11: suiv.set(T, D); break; case 12: suiv.set(D, L); break; case 13: suiv.set(D, B); break; case 14: suiv.set(B, L); break;
        case 5: moy = (G[i] + G[i + 1] + G[i + Wn] + G[i + Wn + 1]) / 4; if (moy < 128) { suiv.set(L, T); suiv.set(D, B); } else { suiv.set(D, T); suiv.set(L, B); } break;
        case 10: moy = (G[i] + G[i + 1] + G[i + Wn] + G[i + Wn + 1]) / 4; if (moy < 128) { suiv.set(T, D); suiv.set(B, L); } else { suiv.set(T, L); suiv.set(B, D); } break;
        default: break;
      }
    }
  }
  const pt = (k) => {
    const n = k >> 1, v0 = G[n], nx = n % Wn, ny = (n - nx) / Wn;
    if (k & 1) { const v1 = G[n + Wn]; return [nx - 0.5, ny - 0.5 + (v0 - 127.5) / (v0 - v1)]; }
    const v1 = G[n + 1]; return [nx - 0.5 + (v0 - 127.5) / (v0 - v1), ny - 0.5];
  };
  const boucles = [];
  for (const k0 of [...suiv.keys()]) {
    if (!suiv.has(k0)) continue;
    const pts = []; let k = k0, garde = 0;
    do { pts.push(pt(k)); const nx = suiv.get(k); suiv.delete(k); k = nx; } while (k !== undefined && k !== k0 && ++garde < 8e6);
    if (pts.length >= 4) boucles.push(pts);
  }
  return boucles;
}
function aire(p) { let a = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(a) / 2; }
function alleger(pts, tol) {
  const n = pts.length; if (n < 8) return pts;
  let loin = 0, dm = -1;
  for (let i = 1; i < n; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > dm) { dm = d; loin = i; } }
  const garde = new Uint8Array(n); garde[0] = garde[loin] = 1;
  const pile = [0, loin, loin, n];
  while (pile.length) {
    const b = pile.pop(), a = pile.pop(), A = pts[a], Bp = pts[b % n], dx = Bp[0] - A[0], dy = Bp[1] - A[1], Lg = Math.hypot(dx, dy);
    let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Lg < 1e-6 ? Math.hypot(pts[i][0] - A[0], pts[i][1] - A[1]) : Math.abs((pts[i][0] - A[0]) * dy - (pts[i][1] - A[1]) * dx) / Lg;
      if (d > mx) { mx = d; mi = i; }
    }
    if (mx > tol) { garde[mi] = 1; pile.push(a, mi, mi, b); }
  }
  return pts.filter((_, i) => garde[i]);
}
function tracer(c, r) {
  const W = c.width, H = c.height, Wn = W + 2, G = new Uint8Array(Wn * (H + 2)).fill(255);
  const d = c.getContext("2d").getImageData(0, 0, W, H).data;
  for (let y = 0; y < H; y++) { const o = (y + 1) * Wn + 1; for (let x = 0, k = y * W * 4; x < W; x++, k += 4) G[o + x] = (d[k] * 77 + d[k + 1] * 150 + d[k + 2] * 29) >> 8; }
  const f = (v) => Math.round((v / r) * 1000) / 1000;
  return contours(G, W, H).filter((b) => aire(b) > 6)
    .map((b) => alleger(b, 0.3).map((q, i) => `${i ? "L" : "M"}${f(q[0])} ${f(q[1])}`).join("") + "Z").join("");
}

// PNG avec sa taille réelle écrite dedans (bloc pHYs : points par mètre).
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
async function pngTailleReelle(c, r) {
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  const src = new Uint8Array(await blob.arrayBuffer());
  const ppm = Math.round(r * 1000);
  const corps = new Uint8Array(13); const v = new DataView(corps.buffer);
  corps.set([0x70, 0x48, 0x59, 0x73]); v.setUint32(4, ppm); v.setUint32(8, ppm); corps[12] = 1;
  const bloc = new Uint8Array(21); const bv = new DataView(bloc.buffer);
  bv.setUint32(0, 9); bloc.set(corps, 4); bv.setUint32(17, crc32(corps));
  const fin = 8 + 25; // signature + IHDR
  const out = new Uint8Array(src.length + 21);
  out.set(src.subarray(0, fin)); out.set(bloc, fin); out.set(src.subarray(fin), fin + 21);
  return new Blob([out], { type: "image/png" });
}

/**
 * Fabrique le fichier d'un élément de fichiersPossibles(item).
 * → { mmL, mmH, apercu (dataURL), svg (texte), png (Blob), photo (bool) }
 */
export async function fabriquerFichier(item, f) {
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* rien */ } }
  let brut = null, photo = false;
  if (f.sorte === "modele") {
    const p = getProductBySlug(item.slug);
    const lay = item.layout?.modele || {};
    const b = Math.max(4, (lay.scale ?? 0.08) * (mmParCadre(p, "face") || 130) * R);
    brut = await dessinerModele(item, b);
  } else if (f.sorte === "cote") {
    const r = await dessinerCote(item, f.side, f.verre);
    brut = r.toile; photo = r.photo;
  } else {
    brut = await dessinerTextes(f.lignes, f.police);
  }
  if (!brut) throw new Error("rien à graver de ce côté");
  const c = recadrer(brut, photo);
  if (!c) throw new Error("rien à graver de ce côté");
  const r = R * echelle;
  const mmL = c.width / r, mmH = c.height / r;
  const png = await pngTailleReelle(c, r);
  let svg;
  const tete = `<svg xmlns="http://www.w3.org/2000/svg" width="${mmL.toFixed(2)}mm" height="${mmH.toFixed(2)}mm" viewBox="0 0 ${mmL.toFixed(3)} ${mmH.toFixed(3)}">`;
  if (photo) {
    svg = `${tete}\n<image width="${mmL.toFixed(3)}" height="${mmH.toFixed(3)}" href="${c.toDataURL("image/png")}"/>\n</svg>\n`;
  } else {
    svg = `${tete}\n<path fill="#000000" fill-rule="evenodd" d="${tracer(c, r)}"/>\n</svg>\n`;
  }
  // Aperçu léger pour l'écran.
  const k = Math.min(1, 600 / Math.max(c.width, c.height));
  const a = toile(c.width * k, c.height * k); a.getContext("2d").drawImage(c, 0, 0, a.width, a.height);
  return { mmL, mmH, apercu: a.toDataURL("image/png"), svg, png, photo };
}

export { MAX_PX };
