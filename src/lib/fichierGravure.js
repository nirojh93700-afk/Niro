// Fichier à graver d'un texte traduit (07/11/2026, maquette v5 : « il faut que je l'aie en format pour graver »).
// Le texte est mis en forme par HarfBuzz (voyelles tamoules, arabe lié, droite à gauche) puis chaque lettre
// devient un TRACÉ : un SVG en millimètres, aucune police à installer dans le logiciel du laser.
// Mêmes lignes que l'aperçu : texte, puis date plus petite (×0,62), décor compris. Serveur seulement.
import { sousEnsemble } from "@/lib/policeGravure";

const DECORS = /[♥★✿◆•❤]/u;
let hbPromesse = null;
// HarfBuzz (WebAssembly). Le fichier hb.wasm est cherché à côté du paquet, sinon dans le serveur, sinon
// sur le site (/vendor/hb.wasm, copie du même fichier) : en ligne, le premier chemin peut manquer.
async function wasmHarfbuzz() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  for (const p of [path.join(process.cwd(), "node_modules/harfbuzzjs/hb.wasm"), path.join(process.cwd(), "public/vendor/hb.wasm")]) {
    try { return fs.readFileSync(p); } catch { /* suivant */ }
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr";
  const r = await fetch(`${base.replace(/\/$/, "")}/vendor/hb.wasm`, { cache: "no-store" });
  if (!r.ok) throw new Error("hb.wasm introuvable");
  return Buffer.from(await r.arrayBuffer());
}
async function harfbuzz() {
  if (!hbPromesse) {
    hbPromesse = (async () => {
      const [factory, hbjs, wasmBinary] = await Promise.all([
        import("harfbuzzjs/hb.js").then((m) => m.default || m),
        import("harfbuzzjs/hbjs.js").then((m) => m.default || m),
        wasmHarfbuzz(),
      ]);
      return hbjs(await factory({ wasmBinary }));
    })().catch((e) => { hbPromesse = null; throw e; });
  }
  return hbPromesse;
}

function ouvrir(hb, buf) {
  const blob = hb.createBlob(buf), face = hb.createFace(blob, 0), font = hb.createFont(face);
  return { blob, face, font, upem: face.upem, fermer() { font.destroy(); face.destroy(); blob.destroy(); } };
}
function former(hb, f, texte) {
  const b = hb.createBuffer(); b.addText(texte); b.guessSegmentProperties(); hb.shape(f.font, b);
  const gl = b.json(); b.destroy();
  return gl;
}

/**
 * lignes : ["texte", "date"] (vides retirées) ; langue : ta | ar | he | zh.
 * → SVG (chaîne) ou null si les polices n'ont pas pu être chargées.
 */
export async function svgGravure({ lignes, langue, largeurMm = 60, hauteurMm = 30 }) {
  const ls = (lignes || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3);
  if (!ls.length) return null;
  const tout = ls.join("");
  const [bufP, bufL, bufS] = await Promise.all([
    sousEnsemble(langue, tout.replace(/[♥★✿◆•❤]/gu, "")),
    sousEnsemble("latin", tout.replace(/[^\u0000-ɏ]/g, "")),
    DECORS.test(tout) ? sousEnsemble("symboles", tout.replace(/[^♥★✿◆•❤]/gu, "")) : null,
  ]);
  if (!bufP) return null;
  const hb = await harfbuzz();
  const P = ouvrir(hb, bufP), L = bufL ? ouvrir(hb, bufL) : null, S = bufS ? ouvrir(hb, bufS) : null;
  const upem = P.upem;
  // La police principale a-t-elle cette lettre ? (sinon : latin, ou symboles pour le décor)
  const aLettre = new Map();
  const policeDe = (ch) => {
    if (DECORS.test(ch)) return S || P;
    if (/\s/.test(ch)) return P;
    if (!aLettre.has(ch)) aLettre.set(ch, former(hb, P, ch).every((g) => g.g !== 0));
    return aLettre.get(ch) || !L ? P : L;
  };
  const rangs = ls.map((t, i) => {
    const f = ls.length > 1 && i === ls.length - 1 ? 0.62 : 1;
    // morceaux d'une même police, dans l'ordre logique ; une ligne de droite à gauche est retournée
    const morceaux = [];
    // Ligne de droite à gauche : les nombres (« 50 », « 12.06 ») restent écrits de gauche à droite.
    const rtl = /[֐-ࣿ]/.test(t);
    const nums = new Set(rtl ? [...t.matchAll(/\d+(?:[.,:/-]\d+)*/g)].flatMap((m) => [...Array(m[0].length).keys()].map((j) => m.index + j)) : []);
    [...t].forEach((ch, i) => {
      const p = policeDe(ch), num = nums.has(i);
      const der = morceaux[morceaux.length - 1];
      if (der && der.p === p && der.num === num) der.t += ch; else morceaux.push({ p, t: ch, num });
    });
    const ordre = rtl ? morceaux.slice().reverse() : morceaux;
    let x = 0; const parts = [];
    for (const m of ordre) {
      const k = upem / m.p.upem;
      for (const g of former(hb, m.p, m.t, m.num)) {
        const d = m.p.font.glyphToPath(g.g);
        if (d) parts.push(`<path transform="translate(${((x + g.dx * k)).toFixed(1)} ${(-g.dy * k).toFixed(1)}) scale(${k.toFixed(4)} ${(-k).toFixed(4)})" d="${d}"/>`);
        x += g.ax * k;
      }
    }
    return { w: x * f, f, parts };
  });
  P.fermer(); L?.fermer(); S?.fermer();
  const H = rangs.reduce((h, r) => h + upem * 1.3 * r.f, 0);
  const W = Math.max(...rangs.map((r) => r.w));
  const k = Math.min((largeurMm * 0.94) / W, (hauteurMm * 0.94) / H);
  let y = (hauteurMm - H * k) / 2;
  const groupes = rangs.map((r) => {
    const x0 = (largeurMm - r.w * k) / 2, y0 = y + upem * 1.02 * r.f * k; y += upem * 1.3 * r.f * k;
    return `<g transform="translate(${x0.toFixed(3)} ${y0.toFixed(3)}) scale(${(k * r.f).toFixed(6)})">${r.parts.join("")}</g>`;
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeurMm}mm" height="${hauteurMm}mm" viewBox="0 0 ${largeurMm} ${hauteurMm}" fill="#000">\n${groupes}\n</svg>\n`;
}
