// =============================================================================
// ÉTIQUETTES D'ADRESSE (13/10/2026, maquette validée par le gérant : « pour une fois t'as bien fait »).
// Pour les envois par La Poste : l'adresse s'imprime sur les planches A4 de 20 étiquettes carrées
// 45 × 45 mm (4 colonnes × 5 lignes ; marges haut 26, bas 26, gauche 7, droite 8 mm → 5 mm entre les
// cases). Le gérant grise les cases déjà décollées : l'impression va sur les cases libres suivantes.
// Fonctions PURES (testées par `npm run test-etiquettes`) : l'écran est /gestion/etiquettes.
// =============================================================================
import { nomLivraison } from "@/lib/nomLivraison";

export const FEUILLE = { cols: 4, rows: 5, w: 45, h: 45, mt: 26, mb: 26, ml: 7, mr: 8, largeur: 210, hauteur: 297 };
FEUILLE.gx = (FEUILLE.largeur - FEUILLE.ml - FEUILLE.mr - FEUILLE.cols * FEUILLE.w) / (FEUILLE.cols - 1);
FEUILLE.gy = (FEUILLE.hauteur - FEUILLE.mt - FEUILLE.mb - FEUILLE.rows * FEUILLE.h) / (FEUILLE.rows - 1);
export const NB_CASES = FEUILLE.cols * FEUILLE.rows;

// Coin haut-gauche de chaque case, en mm (case 0 = en haut à gauche, puis ligne par ligne).
export function positions() {
  const out = [];
  for (let i = 0; i < NB_CASES; i++) {
    const c = i % FEUILLE.cols, r = Math.floor(i / FEUILLE.cols);
    out.push({ x: FEUILLE.ml + c * (FEUILLE.w + FEUILLE.gx), y: FEUILLE.mt + r * (FEUILLE.h + FEUILLE.gy) });
  }
  return out;
}

const PAYS = { BE: "BELGIQUE", CH: "SUISSE", LU: "LUXEMBOURG", DE: "ALLEMAGNE", ES: "ESPAGNE", IT: "ITALIE", PT: "PORTUGAL", NL: "PAYS-BAS", MC: "MONACO", GB: "ROYAUME-UNI", AT: "AUTRICHE", IE: "IRLANDE" };
export const EXPEDITEUR_DEFAUT = "Niv Création\n6 rue d'Armaillé\n75017 PARIS";

// Mode d'envoi : une étiquette La Poste n'a de sens que pour un envoi à domicile.
// Point relais / Express Chronopost → étiquette Boxtal ; retrait → rien à envoyer.
export function modeEnvoi(o) {
  const m = String(o?.shippingMethod || "");
  if (/retrait|main propre/i.test(m)) return { ok: false, chip: "Retrait" };
  if (o?.relaisPoint || /relais/i.test(m)) return { ok: false, chip: "Point relais (Boxtal)" };
  if (/express|chrono/i.test(m)) return { ok: false, chip: "Chronopost (Boxtal)" };
  const a = o?.shippingAddress || {};
  if (!a.line1 || !a.postal_code) return { ok: false, chip: "Adresse manquante" };
  return { ok: true, chip: /lettre/i.test(m) ? "Lettre suivie" : "Domicile" };
}

// Adresse telle que La Poste la demande : nom, rue, complément, CODE POSTAL + VILLE en majuscules
// sur la dernière ligne, pays seulement hors France.
export function adresseEtiquette(o) {
  const a = o?.shippingAddress || {};
  const pays = String(a.country || "FR").toUpperCase();
  return {
    nom: nomLivraison(o).complet || "",
    lignes: [a.line1, a.line2].map((x) => String(x || "").trim()).filter(Boolean),
    cpVille: `${String(a.postal_code || "").trim()} ${String(a.city || "").trim()}`.trim().toUpperCase(),
    pays: pays && pays !== "FR" ? (PAYS[pays] || pays) : "",
    ref: o?.ref || "",
  };
}

// Liste des étiquettes à imprimer, dans l'ordre des commandes cochées.
// mode : "meme" (expéditeur en bas de l'étiquette) · "apart" (une étiquette en plus) · "non".
export function travaux(orders, mode) {
  const out = [];
  for (const o of orders || []) {
    if (!modeEnvoi(o).ok) continue;
    const ad = adresseEtiquette(o);
    out.push({ type: "dest", ad, exp: mode === "meme" });
    if (mode === "apart") out.push({ type: "exp", ad });
  }
  return out;
}

// Cases où chaque étiquette tombera : les premières cases LIBRES, dans l'ordre.
export function placer(jobs, used) {
  const libres = [];
  for (let i = 0; i < NB_CASES; i++) if (!used?.[i]) libres.push(i);
  const places = [];
  jobs.forEach((j, k) => { if (k < libres.length) places.push({ ...j, case: libres[k] }); });
  return { places, manque: Math.max(0, jobs.length - libres.length), libresApres: Math.max(0, libres.length - jobs.length) };
}

const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const lignesExpediteur = (txt) => String(txt || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 5);

export function contenuEtiquette(p, expTxt) {
  if (p.type === "exp") {
    const l = lignesExpediteur(expTxt);
    return `<div class="to">Expéditeur</div>${l.map((x, i) => `<div class="${i ? "l" : "nm"}">${esc(x)}</div>`).join("")}<div class="ref">Commande #${esc(p.ad.ref)}</div>`;
  }
  const a = p.ad;
  return `<div class="to">Destinataire</div><div class="nm">${esc(a.nom)}</div>${a.lignes.map((x) => `<div class="l">${esc(x)}</div>`).join("")}`
    + `<div class="cp">${esc(a.cpVille)}</div>${a.pays ? `<div class="cp">${esc(a.pays)}</div>` : ""}`
    + (p.exp ? `<div class="exp">Exp. : ${lignesExpediteur(expTxt).map(esc).join(" · ")}</div>` : `<div class="ref">Commande #${esc(a.ref)}</div>`);
}

// Document A4 complet, prêt à imprimer : page sans marge, chaque étiquette posée au millimètre.
export function feuilleHtml(places, expTxt) {
  const pos = positions();
  const cases = places.map((p) => {
    const { x, y } = pos[p.case];
    return `<div class="etq" style="left:${x}mm;top:${y}mm">${contenuEtiquette(p, expTxt)}</div>`;
  }).join("");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Étiquettes d'adresse</title><style>
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
.page{position:relative;width:210mm;height:296mm;overflow:hidden}
.etq{position:absolute;width:${FEUILLE.w}mm;height:${FEUILLE.h}mm;padding:3mm 3mm 2.6mm;display:flex;flex-direction:column;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.to{font-size:6pt;letter-spacing:.06em;text-transform:uppercase;color:#555;margin-bottom:.8mm}
.nm{font-weight:700;font-size:10pt;line-height:1.15;overflow-wrap:anywhere}
.l{font-size:9pt;line-height:1.2;overflow-wrap:anywhere}
.cp{font-weight:700;font-size:9.5pt;line-height:1.2;overflow-wrap:anywhere}
.exp{margin-top:auto;border-top:.25mm solid #000;padding-top:.8mm;font-size:6.2pt;line-height:1.2;color:#222;overflow-wrap:anywhere}
.ref{margin-top:auto;font-size:5.6pt;color:#777}
@media screen{body{background:#e9e3d6}.page{margin:10mm auto;background:#fff;box-shadow:0 2mm 6mm rgba(0,0,0,.2)}}
</style></head><body><div class="page">${cases}</div></body></html>`;
}

// -----------------------------------------------------------------------------
// LA MÊME FEUILLE EN PDF (14/10/2026). Le gérant imprime depuis son iPhone (site ajouté à
// l'écran d'accueil) : là, une nouvelle fenêtre n'a ni bouton retour ni impression qui se
// lance — il restait bloqué sur une page blanche. Sur iPhone / iPad, on fabrique donc un PDF
// A4 aux mêmes millimètres et on l'ouvre dans le menu « Partager » d'Apple → « Imprimer ».
// Polices standard du PDF (Helvetica) : seuls les caractères d'Europe de l'Ouest existent,
// les autres perdent leur accent (« ł » → « l ») plutôt que de sortir en signes illisibles.
// -----------------------------------------------------------------------------
const CP1252 = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
const SANS_ACCENT = { "Ł": "L", "ł": "l", "Đ": "D", "đ": "d", "Ħ": "H", "ħ": "h", "ı": "i", "ŀ": "l", "Ŀ": "L" };
export function textePdf(s) {
  return [...String(s || "")].map((c) => {
    if (c.charCodeAt(0) <= 0xff || CP1252.has(c)) return c;
    if (SANS_ACCENT[c]) return SANS_ACCENT[c];
    const sans = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return [...sans].every((x) => x.charCodeAt(0) <= 0xff) ? sans : "?";
  }).join("");
}

const PT = 25.4 / 72; // 1 point en mm

// Coupe un texte à la largeur voulue comme le fait la page : aux espaces, et APRÈS un trait
// d'union (« BONNIÈRES- / SUR-SEINE », jamais « BONNIÈRES-SUR / -SEINE ») ; un mot trop long
// pour une ligne est coupé lettre par lettre.
function couperLignes(doc, texte, largeur) {
  const mots = String(texte).split(/(?<=-)|(?= )/).map((m) => m);
  const lignes = [];
  let cur = "";
  const pose = (m) => {
    const essai = cur + m;
    if (!cur || doc.getTextWidth(essai.trimStart()) <= largeur) { cur = essai; return; }
    lignes.push(cur.trim()); cur = m.trimStart();
  };
  for (const m of mots) {
    if (doc.getTextWidth(m.trim()) > largeur) {
      for (const c of m) { if (cur && doc.getTextWidth((cur + c).trimStart()) > largeur) { lignes.push(cur.trim()); cur = ""; } cur += c; }
    } else pose(m);
  }
  if (cur.trim()) lignes.push(cur.trim());
  return lignes.length ? lignes : [""];
}

export function feuillePdf(JsPDF, places, expTxt) {
  const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: "Étiquettes d'adresse — Niv Création" });
  const pos = positions();
  const P = 3, Pb = 2.6, L = FEUILLE.w - 2 * P;
  for (const p of places) {
    const { x, y } = pos[p.case];
    const exp = lignesExpediteur(expTxt).map(textePdf);
    // Blocs du haut (ce qui se lit) et du bas (expéditeur ou n° de commande), en points.
    const haut = [], bas = [];
    if (p.type === "exp") {
      haut.push({ t: "EXPÉDITEUR", s: 6, g: 85 });
      exp.forEach((l, i) => haut.push({ t: l, s: i ? 9 : 10, b: !i }));
      bas.push({ t: `Commande #${textePdf(p.ad.ref)}`, s: 5.6, g: 119 });
    } else {
      const a = p.ad;
      haut.push({ t: "DESTINATAIRE", s: 6, g: 85 });
      haut.push({ t: textePdf(a.nom), s: 10, b: true });
      a.lignes.forEach((l) => haut.push({ t: textePdf(l), s: 9 }));
      haut.push({ t: textePdf(a.cpVille), s: 9.5, b: true });
      if (a.pays) haut.push({ t: textePdf(a.pays), s: 9.5, b: true });
      if (p.exp) bas.push({ t: `Exp. : ${exp.join(" · ")}`, s: 6.2, g: 34, trait: true });
      else bas.push({ t: `Commande #${textePdf(a.ref)}`, s: 5.6, g: 119 });
    }
    // Découpe en lignes à la largeur de l'étiquette ; si tout ne tient pas, on réduit.
    const couper = (blocs, k) => blocs.flatMap((bl) => {
      doc.setFont("helvetica", bl.b ? "bold" : "normal"); doc.setFontSize(bl.s * k);
      return couperLignes(doc, bl.t, L).map((t, i) => ({ ...bl, t, s: bl.s * k, trait: bl.trait && i === 0 }));
    });
    const haute = (ls) => ls.reduce((h, l) => h + l.s * PT * 1.2, 0);
    let k = 1, H, B;
    for (; k > 0.6; k -= 0.05) {
      H = couper(haut, k); B = couper(bas, k);
      if (haute(H) + 0.8 + haute(B) + (B.some((l) => l.trait) ? 1.2 : 0) + 1.5 <= FEUILLE.h - P - Pb) break;
    }
    let cy = y + P;
    H.forEach((l, i) => {
      doc.setFont("helvetica", l.b ? "bold" : "normal"); doc.setFontSize(l.s); doc.setTextColor(l.g ?? 0);
      if (i === 1 && haut[0].s === 6) cy += 0.8;
      cy += l.s * PT; doc.text(l.t, x + P, cy); cy += l.s * PT * 0.2;
    });
    let by = y + FEUILLE.h - Pb - haute(B);
    if (B.some((l) => l.trait)) {
      doc.setDrawColor(0); doc.setLineWidth(0.25); doc.line(x + P, by - 0.8, x + FEUILLE.w - P, by - 0.8);
    }
    B.forEach((l) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(l.s); doc.setTextColor(l.g ?? 0);
      by += l.s * PT; doc.text(l.t, x + P, by); by += l.s * PT * 0.2;
    });
  }
  return doc;
}
