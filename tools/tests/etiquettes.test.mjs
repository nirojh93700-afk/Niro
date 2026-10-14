// Étiquettes d'adresse (13/10/2026) : géométrie de la planche, choix des cases, contenu, et
// — si Chromium est là — la feuille imprimée réellement : 1 page A4, cases au bon millimètre.
import { FEUILLE, NB_CASES, positions, modeEnvoi, adresseEtiquette, travaux, placer, feuilleHtml, feuillePdf, textePdf } from "@/lib/etiquettes";
import { jsPDF } from "jspdf";

let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log("✗", m); } };

// 1. géométrie : 5 mm entre les cases, la dernière case finit à 8 mm du bord droit et 26 mm du bas
v(FEUILLE.gx === 5 && FEUILLE.gy === 5, "écart de 5 mm entre les cases");
const p = positions();
v(p.length === 20 && NB_CASES === 20, "20 cases");
v(p[0].x === 7 && p[0].y === 26, "case 1 à 7 mm / 26 mm");
v(p[3].x + 45 === 202, "case 4 finit à 202 mm (8 mm du bord droit)");
v(p[19].y + 45 === 271, "case 20 finit à 271 mm (26 mm du bas)");

// 2. mode d'envoi
const dom = { ref: "A1", shippingMethod: "Livraison à domicile", shippingName: "Léa Martin", shippingAddress: { line1: "3 rue X", line2: "Bât. B", postal_code: "75001", city: "Paris", country: "FR" } };
v(modeEnvoi(dom).ok, "domicile → étiquette");
v(!modeEnvoi({ ...dom, relaisPoint: "Mondial Relay — X" }).ok, "point relais → pas d'étiquette La Poste");
v(!modeEnvoi({ ...dom, shippingMethod: "Express Chronopost" }).ok, "express → Boxtal");
v(!modeEnvoi({ ...dom, shippingMethod: "Retrait en main propre" }).ok, "retrait → rien");
v(!modeEnvoi({ ...dom, shippingAddress: {} }).ok, "sans adresse → rien");

// 3. adresse au format La Poste
const a = adresseEtiquette({ ...dom, shippingAddress: { ...dom.shippingAddress, city: "Moliets-et-Maa", postal_code: "40660" } });
v(a.nom === "Léa Martin" && a.cpVille === "40660 MOLIETS-ET-MAA" && a.pays === "" && a.lignes.length === 2, "nom, 2 lignes, CP + VILLE en majuscules, pas de pays en France");
v(adresseEtiquette({ ...dom, shippingAddress: { ...dom.shippingAddress, country: "BE" } }).pays === "BELGIQUE", "pays hors France écrit en clair");

// 4. travaux + placement sur les cases libres
const b = { ...dom, ref: "B2" }, relais = { ...dom, ref: "R3", relaisPoint: "x" };
v(travaux([dom, relais, b], "meme").length === 2, "le point relais est ignoré");
v(travaux([dom, b], "apart").length === 4, "expéditeur à part = 2 cases par envoi");
const used = new Array(20).fill(false); used[0] = used[1] = used[2] = true; used[5] = true;
const pl = placer(travaux([dom, b, dom], "meme"), used);
v(pl.places.map((x) => x.case).join(",") === "3,4,6", "cases libres sautent les cases utilisées (4, 5, 7)");
v(pl.libresApres === 13 && pl.manque === 0, "13 cases libres après");
v(placer(travaux([dom, b], "apart"), new Array(20).fill(true).map((x, i) => i < 18)).manque === 2, "manque signalé quand la feuille est pleine");

// 5. le document imprimé : échappement + positions
const html = feuilleHtml(placer(travaux([{ ...dom, shippingName: "<b>Jo</b>" }], "meme"), used).places, "Niv Création\n6 rue d'Armaillé\n75017 PARIS");
v(html.includes("&lt;b&gt;Jo&lt;/b&gt;") && !html.includes("<b>Jo</b>"), "le nom est échappé");
v(html.includes("left:157mm;top:26mm"), "1re étiquette en case 4 (157 mm ; 26 mm)");
v(html.includes("@page{size:210mm 297mm;margin:0}"), "page A4 sans marge");

// 5 bis. le PDF de l'iPhone (14/10/2026) : A4, une page, texte posé dans la bonne case
v(textePdf("Łukasz Œuvre ’é") === "Lukasz Œuvre ’é", "caractères hors police : accent retiré, le reste gardé");
const dp = feuillePdf(jsPDF, placer(travaux([dom, b], "apart"), used).places, "Niv Création\n6 rue d'Armaillé\n75017 PARIS");
v(dp.getNumberOfPages() === 1, "PDF : 1 page");
v(Math.round(dp.internal.pageSize.getWidth()) === 210 && Math.round(dp.internal.pageSize.getHeight()) === 297, "PDF : format A4");
const src = dp.output();
v(/BT\s*\/F\d+ [\d.]+ Tf\s*[\d.]+ TL\s*[\d.]+ g\s*\(DESTINATAIRE\)/.test(src) || src.includes("(DESTINATAIRE)"), "PDF : étiquette destinataire écrite");
// case 4 (x = 157 mm + 3 mm de marge intérieure = 160 mm = 453,5 pt)
v(/453\.5\d* [\d.]+ Td\s*\(DESTINATAIRE\)/.test(src), "PDF : 1re étiquette en case 4 (160 mm du bord gauche)");
v(/EXP.{1,4}DITEUR/.test(src), "PDF : étiquette expéditeur à part");

// 6. rendu réel : Chromium imprime 1 page, et la 1re étiquette tombe à sa place
let pw = null;
try { pw = await import("playwright-core"); } catch { console.log("(Playwright absent : rendu réel non testé)"); }
if (pw) {
  const b2 = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => null);
  if (b2) {
    const page = await b2.newPage();
    const tout = feuilleHtml(placer(travaux(new Array(20).fill(dom), "meme"), new Array(20).fill(false)).places, "Niv Création\n6 rue d'Armaillé\n75017 PARIS");
    await page.setContent(tout);
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    v(pages === 1, `20 étiquettes = 1 seule page A4 (trouvé ${pages})`);
    const r = await page.evaluate(() => { const mm = 96 / 25.4; const e = [...document.querySelectorAll(".etq")]; return { n: e.length, x: e[19].getBoundingClientRect().left / mm, y: e[19].getBoundingClientRect().top / mm, w: e[0].getBoundingClientRect().width / mm, deb: e.some((x) => x.scrollHeight > x.clientHeight + 1) }; });
    v(r.n === 20 && Math.abs(r.x - 157) < 0.2 && Math.abs(r.y - 226) < 0.2 && Math.abs(r.w - 45) < 0.1, `case 20 à 157 / 226 mm, 45 mm de large (trouvé ${r.x.toFixed(1)} / ${r.y.toFixed(1)} / ${r.w.toFixed(1)})`);
    v(!r.deb, "aucune adresse ne déborde de son étiquette");
    await b2.close();
  }
}
console.log(`${ok}/${ok + ko} vérifications au vert`);
if (ko) process.exit(1);
