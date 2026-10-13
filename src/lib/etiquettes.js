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
