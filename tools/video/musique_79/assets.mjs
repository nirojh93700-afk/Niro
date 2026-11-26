// Vidéo 79 : les dessins de la plaque et du porte-clés, tirés du MÊME calcul que la fiche (src/lib/musiqueCreateur.js).
//   node --import ./tools/alias-register.mjs tools/video/musique_79/assets.mjs <sortie.json>
import { writeFileSync } from "node:fs";
import { musApercu, musMatrice, MUS_EXEMPLE } from "@/lib/musiqueCreateur";
const m = musMatrice(MUS_EXEMPLE);
const base = { lien: MUS_EXEMPLE, modele: "plaque", tl: "m", titre: "Notre chanson", dedi: "Léa & Tom · 14.06.2025", police: "playfair", scan: true };
const plein = musApercu(base, m, "avant", "");
// le bois seul : même dessin, sans le QR code, sans la ligne, sans les textes
const vide = plein.html.replace(/<path d="M[^"]*" fill="#3a2614" fill-opacity="\.92"\/>/, "").replace(/<line [^>]*\/>/g, "").replace(/<text [^>]*>[^<]*<\/text>/g, "");
const svg = (a, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.viewBox}">${h}</svg>`;
const porte = musApercu({ ...base, modele: "porte", tl: "g" }, m, "avant", "");
writeFileSync(process.argv[2], JSON.stringify({ plein: svg(plein, plein.html), vide: svg(plein, vide), porte: svg(porte, porte.html), g: { w: plein.g.w, h: plein.g.h, qr: plein.g.qr }, viewBox: plein.viewBox }));
console.log("dessins écrits");
