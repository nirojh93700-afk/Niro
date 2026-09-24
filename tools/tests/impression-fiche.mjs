// =============================================================================
// LA FICHE ATELIER S'IMPRIME-T-ELLE ? — une seule page A4, et PAS blanche.
//   node tools/tests/impression-fiche.mjs
// -----------------------------------------------------------------------------
// 🔴 Écrit après la panne du 24/09/2026 : la fiche est sortie de l'imprimante
// COMPLÈTEMENT BLANCHE. Cause — elle est rendue dans un portail, donc c'est un
// enfant direct du <body>, et le plein écran de l'admin masque tous les enfants
// du body sauf <main> avec `!important`. La règle qui la ré-affiche avait perdu
// son `!important` lors d'une réorganisation du CSS.
//
// Le test reconstruit une feuille avec le VRAI bloc CSS de globals.css ET la
// règle de plein écran de l'admin, puis vérifie trois choses :
//   1. la feuille est mesurable (sinon la mise à l'échelle est fausse) ;
//   2. elle est visible en média impression ;
//   3. elle porte vraiment de l'encre (sinon : feuille blanche).
// Retirez le `!important` et les 4 cas passent au rouge.
// =============================================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Playwright n'est PAS une dépendance du site (il alourdirait le déploiement) :
// le test se contente de passer son tour si le navigateur n'est pas là.
let chromium;
try { ({ chromium } = await import("playwright-core")); }
catch {
  console.log("↷ Test sauté : playwright-core absent. Pour le lancer :\n"
    + "   npm i --no-save playwright-core   (Chromium est déjà dans /opt/pw-browsers)");
  process.exit(0);
}

const RACINE = path.resolve(import.meta.dirname, "../..");
const CHROME = process.env.CHROME_BIN || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const L = Math.round((210 - 20) * 96 / 25.4);   // laize utile d'une A4, en px CSS
const H = Math.round((297 - 20) * 96 / 25.4);   // hauteur utile

// --- le vrai CSS du site : le bloc d'impression + le plein écran de l'admin ---
function cssDuSite() {
  const g = fs.readFileSync(path.join(RACINE, "src/app/globals.css"), "utf-8");
  const a = g.indexOf(".zone-impression { display: none; }");
  let k = g.indexOf("@media print {", a), d = 0;
  for (;; k++) {
    if (g[k] === "{") d++;
    else if (g[k] === "}" && --d === 0) break;
  }
  // ⚠️ UNIQUEMENT les vraies règles : une ligne de commentaire citant le
  // sélecteur casse la feuille de style et la panne ne se reproduit plus.
  const plein = g.split("\n").filter((l) => l.startsWith("body:has(.ash)"));
  if (plein.length !== 2) throw new Error("règles de plein écran admin introuvables");
  return `${g.slice(a, k + 1)}\n${plein.join("\n")}\n`;
}

// --- des feuilles de test, de la plus légère à la plus chargée ---
const REGLAGES = Array.from({ length: 8 }, (_, i) =>
  `<div style="display:flex;gap:8px;padding:3px 0;font-size:0.85rem"><span style="min-width:130px;color:#777;flex-shrink:0">Réglage ${i + 1}</span><span style="font-weight:600">Valeur assez longue pour occuper la colonne</span></div>`).join("");
const GRAVER = (n) => `<div class="fp-graver-item"><h3>À graver — Article ${n}</h3><table><tbody>${
  ["Texte au recto", "Texte au verso", "Modèle numéroté", "Police"].map((f) =>
    `<tr><td>${f}</td><td>Une valeur à graver</td></tr>`).join("")}</tbody></table></div>`;
const VISUEL = (n) => `<div class="fp-visuel"><div style="width:300px;height:400px;background:#ddd"></div><div class="fp-legende">Article ${n}</div><div class="fp-reglages">${REGLAGES}</div></div>`;

function feuille(nbArticles, lourd) {
  const enc = lourd ? Array.from({ length: 4 }, (_, i) =>
    `<div class="fp-encadre${i < 2 ? " alerte" : ""}"><strong>Encadré ${i + 1}</strong><div class="fp-pre">Deux lignes de texte libre écrites par la cliente, assez longues pour occuper la largeur de la colonne de gauche.</div></div>`).join("") : "";
  const arts = Array.from({ length: nbArticles }, (_, i) =>
    `<tr><td><strong>2× Article ${i + 1}</strong><div class="fp-detail">Lot de 2 — Personnalisation — Emballage</div></td><td class="fp-prix">49,90 €</td></tr>`).join("");
  return `<div class="zone-impression">
<header class="fp-tete"><div><h2>Fiche atelier — à graver à l'identique</h2><p class="fp-sous">24/09/2026 · Niv Création</p></div><div class="fp-ref"><b>#TEST1234</b>À préparer · 129,80 €</div></header>
<div class="fp-corps"><div class="fp-col">${enc}
<section class="fp-bloc fp-graver">${Array.from({ length: nbArticles }, (_, i) => GRAVER(i + 1)).join("")}</section>
<section class="fp-bloc"><h3>Articles</h3><table class="fp-table fp-articles"><tbody>${arts}</tbody></table></section>
<section class="fp-bloc"><h3>Client &amp; livraison</h3><table class="fp-table"><tbody>${
  [["Cliente", "Prénom NOM"], ["Téléphone", "06 12 34 56 78"], ["E-mail", "cliente@example.com"], ["Livrer à", "14 rue des Acacias, 95100 Argenteuil, FR"], ["Mode", "Mondial Relay — TABAC LE BALTO, Argenteuil"]]
    .map(([k, v]) => `<tr><td class="fp-cle">${k}</td><td>${v}</td></tr>`).join("")}</tbody></table></section>
<section class="fp-bloc"><h3>Détail du prix</h3><table class="fp-table fp-argent"><tbody><tr><td class="fp-cle">Sous-total</td><td>114,90 €</td></tr><tr class="fp-total"><td class="fp-cle">Total payé</td><td>129,80 €</td></tr></tbody></table></section>
</div><div class="fp-col">${Array.from({ length: nbArticles }, (_, i) => VISUEL(i + 1)).join("")}${
  lourd ? '<div class="fp-photos"><figure style="width:320px"><div style="width:100%;height:260px;background:#ccc"></div><figcaption>photo.jpg</figcaption></figure></div>' : '<div class="fp-photos"></div>'}</div></div>
<footer class="fp-pied"><span>Niv Création — fiche interne.</span><span>#TEST1234</span></footer></div>`;
}

// Copie fidèle de l'algorithme de src/lib/impression.js, joué dans la page.
const ALGO = `(() => {
  const L = ${L}, H = ${H}, PLANCHER = 0.58, CONFORT = 0.75, VISUELS = [1, 0.85, 0.72, 0.6, 0.45];
  const el = document.querySelector(".zone-impression");
  const hauteurA = (w) => { const a = el.getAttribute("style") || "";
    el.setAttribute("style", a + ";width:" + Math.round(w) + "px;max-width:none;zoom:1;");
    const h = el.scrollHeight; el.setAttribute("style", a); return h; };
  const essai = (v) => { el.style.setProperty("--fp-vis", String(v));
    const h1 = hauteurA(L); if (!h1 || h1 <= H) return 1;
    let e = H / h1;
    for (let i = 0; i < 3; i++) { const h = hauteurA(L / e); if (!h) break;
      const s = H / h; if (Math.abs(s - e) < 0.004) { e = s; break; } e = s; }
    return Math.min(1, Math.round(e * 0.99 * 1000) / 1000); };
  document.body.classList.add("impression-mesure");
  let best = { echelle: 0, visuels: 1 };
  for (const v of VISUELS) { const e = essai(v);
    if (e > best.echelle) best = { echelle: e, visuels: v };
    if (e >= CONFORT) { best = { echelle: e, visuels: v }; break; } }
  const mesurable = el.scrollHeight;
  document.body.classList.remove("impression-mesure");
  el.style.setProperty("--fp-vis", String(best.visuels));
  el.style.setProperty("--impr-echelle", String(Math.max(PLANCHER, best.echelle || 1)));
  return { echelle: Math.max(PLANCHER, best.echelle || 1), visuels: best.visuels, mesurable };
})()`;

const CAS = [
  { nom: "1 article", n: 1, lourd: false },
  { nom: "2 articles", n: 2, lourd: true },
  { nom: "3 articles", n: 3, lourd: true },
  { nom: "devis", n: 0, lourd: false },
];

const css = cssDuSite();
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "impr-"));
const nav = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"] });
let ko = 0;

for (const cas of CAS) {
  const f = path.join(dossier, `${cas.nom.replace(/\s/g, "-")}.html`);
  fs.writeFileSync(f, `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>body{margin:0;font-family:Arial,Helvetica,sans-serif}</style><style>${css}</style></head>
<body class="impression-fiche"><main><div class="ash">écran admin</div></main>
${feuille(cas.n, cas.lourd)}</body></html>`);

  const page = await nav.newPage({ viewport: { width: L, height: H } });
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e)));
  await page.goto(`file://${f}`);
  const r = await page.evaluate(ALGO);              // mesure en média ÉCRAN, comme en vrai
  await page.emulateMedia({ media: "print" });

  const vu = await page.evaluate(() => {
    const el = document.querySelector(".zone-impression");
    return { display: getComputedStyle(el).display, hauteur: Math.round(el.getBoundingClientRect().height) };
  });
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: L, height: H }, scale: "css" });
  // IMPR_GARDER=<dossier> pour regarder les feuilles à l'œil après coup.
  if (process.env.IMPR_GARDER) {
    fs.mkdirSync(process.env.IMPR_GARDER, { recursive: true });
    fs.writeFileSync(path.join(process.env.IMPR_GARDER, `${cas.nom.replace(/\s/g, "-")}.png`), png);
  }
  const encre = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const p = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < p.length; i += 4) if (p[i] < 240 || p[i + 1] < 240 || p[i + 2] < 240) n++;
    return Math.round((n / (p.length / 4)) * 1000) / 10;
  }, png.toString("base64"));

  const pdf = path.join(dossier, "p.pdf");
  await page.pdf({ path: pdf, format: "A4", printBackground: true, margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" } });
  const pages = (fs.readFileSync(pdf).toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;

  const soucis = [];
  if (!r.mesurable) soucis.push("feuille NON MESURABLE (mise à l'échelle faussée)");
  if (vu.display === "none") soucis.push("MASQUÉE à l'impression");
  if (encre < 2) soucis.push(`FEUILLE BLANCHE (${encre} % d'encre)`);
  if (pages !== 1) soucis.push(`${pages} pages au lieu d'une`);
  if (erreurs.length) soucis.push("erreur JS : " + erreurs[0]);
  if (soucis.length) ko++;

  console.log(`${soucis.length ? "✗ ÉCHEC" : "✓ OK   "} ${cas.nom.padEnd(11)} visuels ${r.visuels} · échelle ${r.echelle} · ${vu.hauteur}px · encre ${encre} % · ${pages} page${pages > 1 ? "s" : ""}${soucis.length ? "  → " + soucis.join(" · ") : ""}`);
  await page.close();
}

await nav.close();
fs.rmSync(dossier, { recursive: true, force: true });
console.log(ko ? `\n${ko} cas en défaut.` : "\nLes 4 fiches s'impriment sur UNE page, avec de l'encre dessus.");
process.exit(ko ? 1 : 0);
