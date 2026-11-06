// Fichier à graver : texte mis en forme par HarfBuzz (ligatures, voyelles tamoules, arabe lié, droite à gauche)
// puis chaque lettre convertie en TRACÉ vectoriel → SVG en millimètres, sans police nécessaire.
const fs = require("fs"), path = require("path");
const FONTS = { ta: "NotoSerifTamil.ttf", ar: "NotoNaskhArabic.ttf", he: "NotoSerifHebrew.ttf", zh: "NotoSerifSC.ttf", fr: "NotoSerifTamil.ttf" };
module.exports = async function fichier({ lignes, langue, police, largeurMm = 60, hauteurMm = 30 }) {
  const hb = await require(process.env.HB || "harfbuzzjs");
  const buf = fs.readFileSync(police || path.join(process.env.HOME, ".fonts", FONTS[langue]));
  const blob = hb.createBlob(buf), face = hb.createFace(blob, 0), font = hb.createFont(face);
  const upem = face.upem, asc = upem * 0.95, interligne = upem * 1.35;
  const ls = lignes.filter(Boolean);
  const rangs = ls.map((t, i) => {
    const f = ls.length > 1 && i === ls.length - 1 ? 0.62 : 1; // dernière ligne (date) plus petite, comme sur l'aperçu
    const b = hb.createBuffer(); b.addText(t); b.guessSegmentProperties(); hb.shape(font, b);
    const gl = b.json(); b.destroy();
    let x = 0; const parts = [];
    for (const g of gl) { const d = font.glyphToPath(g.g); if (d) parts.push(`<path transform="translate(${x + g.dx} ${-g.dy}) scale(1 -1)" d="${d}"/>`); x += g.ax; }
    return { w: x * f, f, parts };
  });
  font.destroy(); face.destroy(); blob.destroy();
  const H = rangs.reduce((h, r) => h + upem * 1.3 * r.f, 0), W = Math.max(...rangs.map((r) => r.w));
  const k = Math.min((largeurMm * 0.94) / W, (hauteurMm * 0.94) / H); // unités de police → mm, centré
  let y = (hauteurMm - H * k) / 2;
  const groupes = rangs.map((r) => {
    const x0 = (largeurMm - r.w * k) / 2, y0 = y + upem * 1.02 * r.f * k; y += upem * 1.3 * r.f * k;
    return `<g transform="translate(${x0.toFixed(3)} ${y0.toFixed(3)}) scale(${(k * r.f).toFixed(6)})">${r.parts.join("")}</g>`;
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeurMm}mm" height="${hauteurMm}mm" viewBox="0 0 ${largeurMm} ${hauteurMm}" fill="#000">\n${groupes}\n</svg>\n`;
};
if (require.main === module) (async () => {
  const f = module.exports, out = process.argv[2];
  const cas = [
    ["tamoul", "ta", ["பிறந்தநாள்", "வாழ்த்துகள்", "12.06.2026"]],
    ["arabe", "ar", ["عيد ميلاد سعيد", "12.06.2026"]],
    ["hebreu", "he", ["יום הולדת שמח", "12.06.2026"]],
    ["chinois", "zh", ["生日快乐", "12.06.2026"]],
  ];
  for (const [nom, l, lignes] of cas) fs.writeFileSync(`${out}/gravure-exemple-${nom}.svg`, await f({ lignes, langue: l }));
  console.log("ok");
})();
