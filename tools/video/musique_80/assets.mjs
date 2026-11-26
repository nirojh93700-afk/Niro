// Vidéo 80 : tous les dessins (plaques, cartes, plaques avec photo, porte-clés recto et dos), tirés du MÊME calcul que la
// fiche (src/lib/musiqueCreateur.js).
//   node --import ./tools/alias-register.mjs tools/video/musique_80/assets.mjs <photos.json> <sortie.json>
// photos.json = { couple, enfant, maman } : les photos déjà passées en nuances de brun (PNG en données).
import { readFileSync, writeFileSync } from "node:fs";
import { musApercu, musMatrice, MUS_EXEMPLE } from "@/lib/musiqueCreateur";
const ph = JSON.parse(readFileSync(process.argv[2], "utf8"));
const m = musMatrice(MUS_EXEMPLE);
const L = { lien: MUS_EXEMPLE, scan: true };
const LISTE = {
  p0: [{ ...L, modele: "plaque", tl: "m", titre: "Notre chanson", dedi: "Léa & Tom · 14.06.2025", police: "playfair" }],
  p1: [{ ...L, modele: "carte", tl: "m", titre: "Pour Papa", dedi: "Bonne fête, on t'aime", police: "pacifico" }],
  p2: [{ ...L, modele: "plaque", tl: "m", titre: "Nos 20 ans", dedi: "Sophie & Marc · 2006 – 2026", police: "cinzel" }],
  f0: [{ ...L, modele: "plaque", tl: "g", ph: "oui", titre: "Nos 10 ans", dedi: "Camille & Hugo", police: "playfair" }, "couple"],
  f1: [{ ...L, modele: "carte", tl: "g", ph: "oui", titre: "Mon petit cœur", dedi: "Jules · été 2026", police: "montserrat" }, "enfant"],
  f2: [{ ...L, modele: "plaque", tl: "g", ph: "oui", titre: "Pour Maman", dedi: "Ta chanson préférée", police: "great-vibes" }, "maman"],
  k0: [{ ...L, modele: "porte", tl: "g", ph: "oui" }, "enfant", "avant"],
  k1: [{ ...L, modele: "porte", tl: "g", ph: "oui" }, "enfant", "dos"],
};
// chaque dessin a ses propres identifiants (plusieurs SVG dans la même page)
const unique = (h, k) => h.replace(/id="(bois|fil|omb|cpA)"/g, `id="$1-${k}"`).replace(/url\(#(bois|fil|omb|cpA)\)/g, `url(#$1-${k})`);
// le bois seul : sans le QR code, la ligne, la note, les textes, la photo
const nu = (h) => h.replace(/<path d="M[^"]*" fill="#3a2614" fill-opacity="\.92"\/>/, "").replace(/<line [^>]*\/>/g, "").replace(/<text [^>]*>[^<]*<\/text>/g, "")
  .replace(/<path transform="[^"]*" d="[^"]*" fill="#3a2614"\/>/g, "").replace(/<clipPath[^>]*>.*?<\/clipPath><image [^>]*\/>/g, "");
const svg = (a, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.viewBox}">${h}</svg>`;
const out = {};
for (const [k, [etat, photo, cote]] of Object.entries(LISTE)) {
  const a = musApercu(etat, m, cote || "avant", photo ? ph[photo] : "");
  const vb = a.viewBox.split(" ").map(Number);
  out[k] = { plein: svg(a, unique(a.html, k)), vide: svg(a, unique(nu(a.html), k + "v")), vb, max: a.maxW, qr: a.g.qr };
}
writeFileSync(process.argv[3], JSON.stringify(out));
console.log("dessins écrits :", Object.keys(out).join(" "));
