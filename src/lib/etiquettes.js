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
// Gérant, 29/10/2026 : « pour toutes les commandes il faut que j'imprime l'adresse » → toute commande qui a une
// adresse se coche (point relais, Express et retrait compris : c'est l'adresse de la cliente qui s'imprime).
export function modeEnvoi(o) {
  const m = String(o?.shippingMethod || "");
  const a = o?.shippingAddress || {};
  if (!a.line1 || !a.postal_code) return { ok: false, chip: "Adresse manquante" };
  if (/retrait|main propre/i.test(m)) return { ok: true, chip: "Retrait" };
  if (o?.relaisPoint || /relais/i.test(m)) return { ok: true, chip: "Point relais" };
  if (/express|chrono/i.test(m)) return { ok: true, chip: "Chronopost" };
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
// avecRef : le n° de commande en petit en bas. Par défaut NON (gérant, 14/10/2026 : « une case sans le
// numéro de commande, que l'adresse et avec le logo » ; le n° seulement quand il en a besoin).
export function travaux(orders, mode, avecRef = false) {
  const out = [];
  for (const o of orders || []) {
    if (!modeEnvoi(o).ok) continue;
    const ad = adresseEtiquette(o);
    out.push({ type: "dest", ad, exp: mode === "meme", ref: !!avecRef });
    if (mode === "apart") out.push({ type: "exp", ad, ref: !!avecRef });
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

// Logo du site, en petit, en bas à droite de chaque étiquette (14/10/2026, gérant : « sur les tickets, tu
// peux mettre le logo en petit »). C'est le fichier d'origine du site, servi tel quel par /api/logo ;
// s'il ne charge pas, l'étiquette sort sans logo.
// Taille de l'adresse (17/10/2026, gérant : « quand j'imprime, la taille est trop petite ») : l'adresse part
// 1,4 fois plus grande qu'avant et ne se resserre que si elle ne tient pas dans la case.
export const AGRANDI = 1.4;
export const LOGO_ETQ = { w: 12, h: 6.7 }; // cadre en mm ; le logo y tient sans être déformé

// Bas de l'étiquette : l'expéditeur et/ou le n° de commande à gauche, le logo à droite (rien d'autre
// si aucun des deux n'est demandé).
function pied(p, expTxt, logo) {
  const img = logo ? `<img class="logo" src="${esc(logo)}" alt="Niv Création">` : "";
  const exp = p.type === "dest" && p.exp ? `<div class="exp">Exp. : ${lignesExpediteur(expTxt).map(esc).join(" · ")}</div>` : "";
  const ref = p.ref ? `<div class="ref">Commande #${esc(p.ad.ref)}</div>` : "";
  if (!exp && !ref && !img) return "";
  return `<div class="pied${exp ? " trait" : ""}"><div class="txt">${exp}${ref}</div>${img}</div>`;
}

export function contenuEtiquette(p, expTxt, logo, modele = "actuel") {
  if (modeleValide(modele) !== "actuel") return contenuStyle(p, expTxt, logo, modele);
  if (p.type === "exp") {
    const l = lignesExpediteur(expTxt);
    return `<div class="to">Expéditeur</div>${l.map((x, i) => `<div class="${i ? "l" : "nm"}">${esc(x)}</div>`).join("")}${pied(p, expTxt, logo)}`;
  }
  const a = p.ad;
  return `<div class="to">Destinataire</div><div class="nm">${esc(a.nom)}</div>${a.lignes.map((x) => `<div class="l">${esc(x)}</div>`).join("")}`
    + `<div class="cp">${esc(a.cpVille)}</div>${a.pays ? `<div class="cp">${esc(a.pays)}</div>` : ""}`
    + pied(p, expTxt, logo);
}

// Document A4 complet, prêt à imprimer : page sans marge, chaque étiquette posée au millimètre.
export function feuilleHtml(places, expTxt, logo, modele = "actuel") {
  const pos = positions();
  const cases = places.map((p) => {
    const { x, y } = pos[p.case];
    return `<div class="etq" style="left:${x}mm;top:${y}mm">${contenuEtiquette(p, expTxt, logo, modele)}</div>`;
  }).join("");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Étiquettes d'adresse</title><style>
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
.page{position:relative;width:210mm;height:296mm;overflow:hidden}
.etq{position:absolute;width:${FEUILLE.w}mm;height:${FEUILLE.h}mm;padding:3mm 3mm 2.6mm;display:flex;flex-direction:column;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.to{font-size:6pt;letter-spacing:.06em;text-transform:uppercase;color:#555;margin-bottom:.8mm}
.nm{font-weight:700;font-size:calc(${(10 * AGRANDI).toFixed(2)}pt * var(--k, 1));line-height:1.15;overflow-wrap:anywhere}
.l{font-size:calc(${(9 * AGRANDI).toFixed(2)}pt * var(--k, 1));line-height:1.2;overflow-wrap:anywhere}
.cp{font-weight:700;font-size:calc(${(9.5 * AGRANDI).toFixed(2)}pt * var(--k, 1));line-height:1.2;overflow-wrap:anywhere}
.pied{margin-top:auto;display:flex;align-items:flex-end;gap:1.5mm}
.pied.trait{border-top:.25mm solid #000;padding-top:.8mm}
.txt{flex:1;min-width:0}
.exp{font-size:6.2pt;line-height:1.2;color:#222;overflow-wrap:anywhere}
.ref{font-size:5.6pt;line-height:1.2;color:#777}
.logo{flex:none;width:${LOGO_ETQ.w}mm;height:${LOGO_ETQ.h.toFixed(2)}mm;object-fit:contain;display:block}
@media screen{body{background:#e9e3d6}.page{margin:10mm auto;background:#fff;box-shadow:0 2mm 6mm rgba(0,0,0,.2)}}
.etq{--u:1mm}
${cssModeles()}
</style></head><body><div class="page">${cases}</div><script>(${resserrerEtiquettes.toString()})(document);</script></body></html>`;
}

// =============================================================================
// STYLES D'ÉTIQUETTE (14/10/2026). Maquette https://claude.ai/artifact/Djpa5zALNmWwYzpum1YQE1 ; le gérant :
// « garde tout ce que tu m'as fait dans cette maquette, je choisirai quand j'ai envie de changer…
// tu gardes l'autre version actuelle aussi ». Quatre modèles au choix dans /gestion/etiquettes,
// retenus sur l'appareil. L'adresse reste TOUJOURS en noir, CP + VILLE en gras majuscules ; l'or
// n'habille que le tour ; le logo d'origine reste en bas (son choix du 14/10).
// Le même CSS sert à l'écran (--u = var(--mm)) et à l'impression (--u = 1mm).
// =============================================================================
export const MODELES = [
  { id: "actuel", nom: "Simple", desc: "La version d'aujourd'hui : l'adresse, le logo en bas à droite." },
  { id: "ecrin", nom: "Écrin", desc: "Double filet doré tout autour, logo centré en bas." },
  { id: "bandeau", nom: "Bandeau", desc: "Pied crème avec le logo, « Gravé pour vous dans notre atelier » et nivcreation.fr." },
  { id: "sobre", nom: "Sobre", desc: "Coin doré, « Merci pour votre commande », logo à droite." },
];
export const modeleValide = (m) => (MODELES.some((x) => x.id === m) ? m : "actuel");

const OR = "#a98935", OR_CLAIR = "#d8bf7e", CREME = "#f7efdc", BRUN = "#5b4718";
const U = (n) => `calc(${n} * var(--u, 1mm))`;
const T = (pt) => `calc(${(pt * 0.3528).toFixed(3)} * var(--u, 1mm) * var(--k, 1))`;
// Mentions décoratives (DESTINATAIRE, « Gravé pour vous… ») : taille fixe, elles ne se resserrent pas.
const T0 = (pt) => `calc(${(pt * 0.3528).toFixed(3)} * var(--u, 1mm))`;
const SERIF = `var(--font-display, Georgia), Georgia, "Times New Roman", serif`;

function contenuStyle(p, expTxt, logo, m) {
  const isExp = p.type === "exp";
  const to = isExp ? "Expéditeur" : "Destinataire";
  const expL = lignesExpediteur(expTxt);
  const adr = isExp
    ? expL.map((x, i) => `<div class="${!i ? "nm" : i === expL.length - 1 ? "cp" : "l"}">${esc(x)}</div>`).join("")
    : `<div class="nm">${esc(p.ad.nom)}</div>${p.ad.lignes.map((x) => `<div class="l">${esc(x)}</div>`).join("")}`
      + `<div class="cp">${esc(p.ad.cpVille)}</div>${p.ad.pays ? `<div class="cp">${esc(p.ad.pays)}</div>` : ""}`;
  const meta = (!isExp && p.exp ? `<div class="exp">Exp. : ${expL.map(esc).join(" · ")}</div>` : "")
    + (p.ref ? `<div class="ref">Commande #${esc(p.ad.ref)}</div>` : "");
  const img = logo ? `<img class="logo" src="${esc(logo)}" alt="Niv Création">` : "";
  if (m === "ecrin") {
    const foot = meta ? `<div class="meta"><div class="t">${meta}</div>${img}</div>` : `<div class="orn"><i></i></div>${img}`;
    return `<div class="mz mz-ecrin"><div class="to">${to}</div>${adr}<div class="foot">${foot}</div></div>`;
  }
  if (m === "bandeau") {
    return `<div class="mz mz-bandeau"><div class="main"><div class="to">${to}</div>${adr}${meta ? `<div class="extra">${meta}</div>` : ""}</div>`
      + `<div class="band">${img}<div class="t"><span class="tag">Gravé pour vous dans notre atelier</span><span class="site">nivcreation.fr</span></div></div></div>`;
  }
  const t = meta || `<span class="merci">${isExp ? "Atelier de personnalisation" : "Merci pour votre commande"}</span>`;
  return `<div class="mz mz-sobre"><div class="to">${to}</div>${adr}<div class="foot"><div class="t">${t}</div>${img}</div></div>`;
}

export function cssModeles() {
  return `
.mz{position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.mz .to{font-size:${T0(4.6)};letter-spacing:.16em;text-transform:uppercase;color:${OR};font-weight:700;line-height:1.3;margin:0}
.mz .nm{font-family:${SERIF};font-weight:700;font-size:${T(9.6 * AGRANDI)};line-height:1.12;overflow-wrap:anywhere}
.mz .l{font-size:${T(7.8 * AGRANDI)};line-height:1.22;overflow-wrap:anywhere;font-weight:400}
.mz .cp{font-size:${T(8.2 * AGRANDI)};font-weight:700;line-height:1.22;overflow-wrap:anywhere}
.mz .exp{font-size:${T(4.9)};line-height:1.25;color:#3d3426;overflow-wrap:anywhere}
.mz .ref{font-size:${T(4.8)};line-height:1.25;color:#7a6e5a}
.mz img.logo{display:block;object-fit:contain;flex:none;max-width:none}
.mz-ecrin{padding:${U(3.1)} ${U(3.4)} ${U(2.4)}}
.mz-ecrin::before{content:"";position:absolute;inset:${U(1.1)};border:${U(0.28)} solid ${OR};border-radius:${U(1.2)};pointer-events:none}
.mz-ecrin::after{content:"";position:absolute;inset:${U(1.75)};border:${U(0.12)} solid ${OR_CLAIR};border-radius:${U(0.8)};pointer-events:none}
.mz-ecrin .to{display:flex;align-items:center;gap:${U(1)};margin-bottom:${U(0.9)}}
.mz-ecrin .to::after{content:"";flex:1;height:${U(0.12)};background:${OR_CLAIR}}
.mz-ecrin .foot{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:${U(0.5)};padding-top:${U(0.8)}}
.mz-ecrin .orn{display:flex;align-items:center;gap:${U(1.2)};width:100%}
.mz-ecrin .orn::before,.mz-ecrin .orn::after{content:"";flex:1;height:${U(0.12)};background:${OR_CLAIR}}
.mz-ecrin .orn i{width:${U(1.1)};height:${U(1.1)};background:${OR};transform:rotate(45deg);display:block}
.mz-ecrin img.logo{width:${U(13)};height:${U(7.2)}}
.mz-ecrin .meta{display:flex;align-items:flex-end;gap:${U(1.5)};width:100%;border-top:${U(0.12)} solid ${OR_CLAIR};padding-top:${U(0.7)}}
.mz-ecrin .meta .t{flex:1;min-width:0}
.mz-ecrin .meta img.logo{width:${U(11)};height:${U(6.1)}}
.mz-bandeau .main{padding:${U(3)} ${U(3.2)} ${U(1.4)};display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden}
.mz-bandeau .to{margin-bottom:${U(0.8)}}
.mz-bandeau .extra{margin-top:auto;padding-top:${U(0.6)}}
.mz-bandeau .band{flex:none;box-sizing:border-box;height:${U(9.4)};background:${CREME};border-top:${U(0.3)} solid ${OR};display:flex;align-items:center;gap:${U(1.5)};padding:0 ${U(2.6)}}
.mz-bandeau img.logo{width:${U(12)};height:${U(6.7)}}
.mz-bandeau .band .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:${U(0.2)};text-align:right}
.mz-bandeau .tag{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:${T0(5.4)};color:${BRUN};line-height:1.15}
.mz-bandeau .site{font-size:${T0(4.6)};letter-spacing:.12em;text-transform:uppercase;color:${OR};font-weight:700;line-height:1.2}
.mz-sobre{padding:${U(3.2)} ${U(3.2)} ${U(2.4)}}
.mz-sobre::before{content:"";position:absolute;left:0;top:0;width:${U(5.2)};height:${U(5.2)};background:linear-gradient(135deg,${OR} 0 50%,transparent 50%)}
.mz-sobre::after{content:"";position:absolute;left:0;top:0;width:${U(7)};height:${U(7)};background:linear-gradient(135deg,transparent 0 58%,${OR_CLAIR} 58% 61%,transparent 61%)}
.mz-sobre .to{padding-left:${U(3)};margin-bottom:${U(0.9)}}
.mz-sobre .foot{margin-top:auto;display:flex;align-items:flex-end;gap:${U(1.5)};border-top:${U(0.15)} solid ${OR_CLAIR};padding-top:${U(0.9)}}
.mz-sobre .foot .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:${U(0.3)}}
.mz-sobre .merci{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:${T0(5.6)};color:${BRUN}}
.mz-sobre img.logo{width:${U(12)};height:${U(6.7)}}
`;
}

// Adresse trop longue : le texte se resserre (jusqu’à ~50 % au pire) pour tenir dans la case.
// Fonction autonome : elle est aussi recopiée telle quelle dans la feuille imprimée.
export function resserrerEtiquettes(root) {
  var serrer = function (e, c) {
    var k = 1;
    e.style.removeProperty("--k");
    while (c.scrollHeight > c.clientHeight + 1 && k > 0.36) { k -= 0.04; e.style.setProperty("--k", k.toFixed(2)); }
  };
  root.querySelectorAll(".mz").forEach(function (e) { serrer(e, e.querySelector(".main") || e); });
  // Style « Simple » : la case elle-même (feuille imprimée) ou son contenu (aperçu de la page).
  root.querySelectorAll(".etq, .etq-cell .lab").forEach(function (e) { if (!e.querySelector(".mz")) serrer(e, e); });
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

// logo = { data: « data:image/jpeg;base64,… », w, h } (taille en pixels, pour garder ses proportions).
export function feuillePdf(JsPDF, places, expTxt, logo, modele = "actuel") {
  const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: "Étiquettes d'adresse — Niv Création" });
  const pos = positions();
  const P = 3, Pb = 2.6, L = FEUILLE.w - 2 * P;
  // Logo posé dans son cadre en gardant ses proportions.
  let lw = 0, lh = 0;
  if (logo?.data && logo.w > 0 && logo.h > 0) {
    const k = Math.min(LOGO_ETQ.w / logo.w, LOGO_ETQ.h / logo.h);
    lw = logo.w * k; lh = logo.h * k;
  }
  const Lbas = lw ? L - lw - 1.5 : L;
  const m = modeleValide(modele);
  for (const p of places) {
    const { x, y } = pos[p.case];
    if (m !== "actuel") { dessinerStyle(doc, p, x, y, expTxt, logo, m); continue; }
    const exp = lignesExpediteur(expTxt).map(textePdf);
    // Blocs du haut (ce qui se lit) et du bas (expéditeur ou n° de commande), en points.
    const haut = [], bas = [];
    if (p.type === "exp") {
      haut.push({ t: "EXPÉDITEUR", s: 6, g: 85, fixe: true });
      exp.forEach((l, i) => haut.push({ t: l, s: (i ? 9 : 10) * AGRANDI, b: !i }));
    } else {
      const a = p.ad;
      haut.push({ t: "DESTINATAIRE", s: 6, g: 85, fixe: true });
      haut.push({ t: textePdf(a.nom), s: 10 * AGRANDI, b: true });
      a.lignes.forEach((l) => haut.push({ t: textePdf(l), s: 9 * AGRANDI }));
      haut.push({ t: textePdf(a.cpVille), s: 9.5 * AGRANDI, b: true });
      if (a.pays) haut.push({ t: textePdf(a.pays), s: 9.5 * AGRANDI, b: true });
      if (p.exp) bas.push({ t: `Exp. : ${exp.join(" · ")}`, s: 6.2, g: 34, trait: true });
    }
    if (p.ref) bas.push({ t: `Commande #${textePdf(p.ad.ref)}`, s: 5.6, g: 119 });
    // Découpe en lignes à la largeur de l'étiquette ; si tout ne tient pas, on réduit.
    const couper = (blocs, k, larg = L) => blocs.flatMap((bl) => {
      const s = bl.fixe ? bl.s : bl.s * k;
      doc.setFont("helvetica", bl.b ? "bold" : "normal"); doc.setFontSize(s);
      return couperLignes(doc, bl.t, larg).map((t, i) => ({ ...bl, t, s, trait: bl.trait && i === 0 }));
    });
    const haute = (ls) => ls.reduce((h, l) => h + l.s * PT * 1.2, 0);
    let k = 1, H, B;
    for (; k > 0.4; k -= 0.05) {
      H = couper(haut, k); B = couper(bas, k, Lbas);
      if (haute(H) + 0.8 + Math.max(haute(B), lh) + (B.some((l) => l.trait) ? 1.2 : 0) + 1.5 <= FEUILLE.h - P - Pb) break;
    }
    let cy = y + P;
    H.forEach((l, i) => {
      doc.setFont("helvetica", l.b ? "bold" : "normal"); doc.setFontSize(l.s); doc.setTextColor(l.g ?? 0);
      if (i === 1 && haut[0].s === 6) cy += 0.8;
      cy += l.s * PT; doc.text(l.t, x + P, cy); cy += l.s * PT * 0.2;
    });
    const bas0 = y + FEUILLE.h - Pb; // bas du contenu
    let by = bas0 - haute(B);
    if (B.some((l) => l.trait)) {
      const t = bas0 - Math.max(haute(B), lh) - 0.8;
      doc.setDrawColor(0); doc.setLineWidth(0.25); doc.line(x + P, t, x + FEUILLE.w - P, t);
    }
    if (lw) {
      try { doc.addImage(logo.data, /^data:image\/png/.test(logo.data) ? "PNG" : "JPEG", x + FEUILLE.w - P - lw, bas0 - lh, lw, lh, "logo"); } catch { /* sans logo */ }
    }
    B.forEach((l) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(l.s); doc.setTextColor(l.g ?? 0);
      by += l.s * PT; doc.text(l.t, x + P, by); by += l.s * PT * 0.2;
    });
  }
  return doc;
}

// ---- Les modèles Écrin / Bandeau / Sobre dans le PDF (iPhone) : mêmes mesures que le CSS ----
const RGB = { or: [169, 137, 53], clair: [216, 191, 126], creme: [247, 239, 220], brun: [91, 71, 24] };
function cadreLogo(logo, fw, fh) {
  if (!logo?.data || !(logo.w > 0) || !(logo.h > 0)) return null;
  const k = Math.min(fw / logo.w, fh / logo.h);
  return { w: logo.w * k, h: logo.h * k };
}
function poserLogo(doc, logo, d, x, y) {
  try { doc.addImage(logo.data, /^data:image\/png/.test(logo.data) ? "PNG" : "JPEG", x, y, d.w, d.h, "logo"); } catch { /* sans logo */ }
}
function texteEspace(doc, t, x, y, esp, droite) {
  const w = doc.getTextWidth(t) + esp * Math.max(0, t.length - 1);
  doc.text(t, droite ? x - w : x, y, { charSpace: esp });
  return w;
}

function dessinerStyle(doc, p, x, y, expTxt, logo, m) {
  const W = FEUILLE.w, isExp = p.type === "exp";
  const expL = lignesExpediteur(expTxt).map(textePdf);
  const P = m === "ecrin" ? { t: 3.1, s: 3.4, b: 2.4 } : m === "bandeau" ? { t: 3, s: 3.2, b: 1.4 } : { t: 3.2, s: 3.2, b: 2.4 };
  const x0 = x + P.s, L = W - 2 * P.s;
  // Ce qui se lit : nom (serif gras), lignes, CP + VILLE (gras).
  const adr = isExp
    ? expL.map((t, i) => ({ t, s: (!i ? 9.6 : i === expL.length - 1 ? 8.2 : 7.8) * AGRANDI, f: !i ? "times" : "helvetica", b: !i || i === expL.length - 1 }))
    : [{ t: textePdf(p.ad.nom), s: 9.6 * AGRANDI, f: "times", b: true },
      ...p.ad.lignes.map((t) => ({ t: textePdf(t), s: 7.8 * AGRANDI, f: "helvetica" })),
      { t: textePdf(p.ad.cpVille), s: 8.2 * AGRANDI, f: "helvetica", b: true },
      ...(p.ad.pays ? [{ t: textePdf(p.ad.pays), s: 8.2 * AGRANDI, f: "helvetica", b: true }] : [])];
  const meta = [];
  if (!isExp && p.exp) meta.push({ t: `Exp. : ${expL.join(" · ")}`, s: 4.9, f: "helvetica", c: [61, 52, 38] });
  if (p.ref) meta.push({ t: `Commande #${textePdf(p.ad.ref)}`, s: 4.8, f: "helvetica", c: [122, 110, 90] });
  const pied = meta.length ? meta : m === "sobre" ? [{ t: isExp ? "Atelier de personnalisation" : "Merci pour votre commande", s: 5.6, f: "times", i: true, c: RGB.brun, fixe: true }] : [];

  const couper = (blocs, k, larg) => blocs.flatMap((bl) => {
    const s = bl.fixe ? bl.s : bl.s * k;
    doc.setFont(bl.f, bl.b ? "bold" : bl.i ? "italic" : "normal"); doc.setFontSize(s);
    return couperLignes(doc, bl.t, larg).map((t) => ({ ...bl, t, s }));
  });
  const haute = (ls, lh = 1.2) => ls.reduce((h, l) => h + l.s * PT * lh, 0);
  const toH = 4.6 * PT * 1.3 + (m === "bandeau" ? 0.8 : 0.9);
  const dl = { ecrin: meta.length ? cadreLogo(logo, 11, 6.1) : cadreLogo(logo, 13, 7.2), bandeau: cadreLogo(logo, 12, 6.7), sobre: cadreLogo(logo, 12, 6.7) }[m];
  const largPied = m === "bandeau" ? L : L - (dl ? dl.w + 1.5 : 0);
  const bas = m === "bandeau" ? y + W - 9.4 - P.b : y + W - P.b;
  let k = 1, A, B, footH;
  for (; k > 0.4; k -= 0.04) {
    A = couper(adr, k, L); B = couper(pied, k, largPied);
    if (m === "ecrin") footH = meta.length ? 0.8 + 0.7 + Math.max(haute(B, 1.25), dl ? dl.h : 0) : 0.8 + 1.1 + 0.5 + (dl ? dl.h : 0);
    else if (m === "bandeau") footH = B.length ? 0.6 + haute(B, 1.25) : 0;
    else footH = 0.9 + Math.max(haute(B, 1.25), dl ? dl.h : 0);
    if (P.t + toH + haute(A, 1.18) + footH <= bas - y) break;
  }

  // Décor
  doc.setLineCap("butt");
  if (m === "ecrin") {
    doc.setDrawColor(...RGB.or); doc.setLineWidth(0.28); doc.roundedRect(x + 1.1, y + 1.1, W - 2.2, W - 2.2, 1.2, 1.2, "S");
    doc.setDrawColor(...RGB.clair); doc.setLineWidth(0.12); doc.roundedRect(x + 1.75, y + 1.75, W - 3.5, W - 3.5, 0.8, 0.8, "S");
  } else if (m === "bandeau") {
    doc.setFillColor(...RGB.creme); doc.rect(x, y + W - 9.4, W, 9.4, "F");
    doc.setDrawColor(...RGB.or); doc.setLineWidth(0.3); doc.line(x, y + W - 9.4, x + W, y + W - 9.4);
  } else {
    doc.setFillColor(...RGB.or); doc.triangle(x, y, x + 5.2, y, x, y + 5.2, "F");
    doc.setDrawColor(...RGB.clair); doc.setLineWidth(0.3); doc.line(x + 1.33, y + 7, x + 7, y + 1.33);
  }

  // « DESTINATAIRE » / « EXPÉDITEUR » en or espacé
  let cy = y + P.t + 4.6 * PT;
  const tx = m === "sobre" ? x0 + 3 : x0;
  doc.setFont("helvetica", "bold"); doc.setFontSize(4.6); doc.setTextColor(...RGB.or);
  const tw = texteEspace(doc, isExp ? "EXPÉDITEUR" : "DESTINATAIRE", tx, cy, 0.26);
  if (m === "ecrin") { doc.setDrawColor(...RGB.clair); doc.setLineWidth(0.12); doc.line(tx + tw + 1, cy - 0.55, x0 + L, cy - 0.55); }
  cy += 4.6 * PT * 0.3 + (m === "bandeau" ? 0.8 : 0.9);

  // Adresse, en noir
  A.forEach((l) => {
    doc.setFont(l.f, l.b ? "bold" : "normal"); doc.setFontSize(l.s); doc.setTextColor(17);
    cy += l.s * PT; doc.text(l.t, x0, cy); cy += l.s * PT * 0.18;
  });

  const ecrirePied = (lignes, px, yBas) => {
    let by = yBas - haute(lignes, 1.25);
    lignes.forEach((l) => {
      doc.setFont(l.f, l.i ? "italic" : "normal"); doc.setFontSize(l.s); doc.setTextColor(...(l.c || [0, 0, 0]));
      by += l.s * PT; doc.text(l.t, px, by); by += l.s * PT * 0.25;
    });
  };
  const fond = y + W - P.b;
  if (m === "ecrin") {
    if (meta.length) {
      const h = Math.max(haute(B, 1.25), dl ? dl.h : 0);
      doc.setDrawColor(...RGB.clair); doc.setLineWidth(0.12); doc.line(x0, fond - h - 0.7, x0 + L, fond - h - 0.7);
      ecrirePied(B, x0, fond);
      if (dl) poserLogo(doc, logo, dl, x0 + L - dl.w, fond - dl.h);
    } else {
      const ly = fond - (dl ? dl.h : 0) - 0.5 - 0.55, cx = x + W / 2, h = 0.78;
      doc.setDrawColor(...RGB.clair); doc.setLineWidth(0.12);
      doc.line(x0, ly, cx - 1.9, ly); doc.line(cx + 1.9, ly, x0 + L, ly);
      doc.setFillColor(...RGB.or); doc.lines([[h, h], [-h, h], [-h, -h]], cx, ly - h, [1, 1], "F", true);
      if (dl) poserLogo(doc, logo, dl, cx - dl.w / 2, fond - dl.h);
    }
  } else if (m === "bandeau") {
    if (B.length) ecrirePied(B, x0, bas);
    const by0 = y + W - 9.4, mid = by0 + 0.15 + (9.4 - 0.15) / 2;
    if (dl) poserLogo(doc, logo, dl, x + 2.6, mid - dl.h / 2);
    const xr = x + W - 2.6, lt = W - 5.2 - (dl ? dl.w + 1.5 : 0);
    doc.setFont("times", "italic"); doc.setFontSize(5.4);
    const tag = couperLignes(doc, "Gravé pour vous dans notre atelier", lt);
    const hTot = tag.length * 5.4 * PT * 1.15 + 0.2 + 4.6 * PT * 1.2;
    let ty = mid - hTot / 2;
    doc.setTextColor(...RGB.brun);
    tag.forEach((t) => { ty += 5.4 * PT; doc.text(t, xr, ty, { align: "right" }); ty += 5.4 * PT * 0.15; });
    ty += 0.2 + 4.6 * PT;
    doc.setFont("helvetica", "bold"); doc.setFontSize(4.6); doc.setTextColor(...RGB.or);
    texteEspace(doc, "NIVCREATION.FR", xr, ty, 0.2, true);
  } else {
    const h = Math.max(haute(B, 1.25), dl ? dl.h : 0);
    doc.setDrawColor(...RGB.clair); doc.setLineWidth(0.15); doc.line(x0, fond - h - 0.9, x0 + L, fond - h - 0.9);
    ecrirePied(B, x0, fond);
    if (dl) poserLogo(doc, logo, dl, x0 + L - dl.w, fond - dl.h);
  }
  doc.setTextColor(0);
}
