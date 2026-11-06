import { products } from "@/lib/products";
import { MOTIFS } from "@/lib/motifs";
import { MODELES } from "@/lib/modeles";
import { NOEL_IMAGES } from "@/lib/fetes";
import { CG_DESSINS, CG_ZODIAQUE, CG_DOSSIER } from "@/lib/cristauxGraves";
import fs from "fs";
const L = new Map();
const add = (src, famille, titre) => { if (typeof src === "string" && src.startsWith("/") && !src.startsWith("/api/")) { if (!L.has(src)) L.set(src, { src, famille, titre }); } };
// Pas des dessins : photos de lettres en bois (plaque de porte), photos de verres gravés.
const PHOTOS = (src) => /^\/lettering\//.test(src); // photos de lettres en bois (plaque de porte enfant) : pas des dessins
for (const p of products) {
  for (const [n, s] of Object.entries(p.styleImages || {})) add(s, "modeles-" + p.slug, `${p.name} · modèle ${n}`);
  for (const f of p.personalizationFields || []) {
    if (f.type === "lettreFleurie") add(f.image || p.parcoursGuide?.alphabet || "/produits/alphabet-fleuri.jpg", "alphabet", "Alphabet fleuri");
    for (const o of f.options || []) if (o.image) add(o.image, "options-" + p.slug, `${p.name} · ${o.label || o.value}`);
  }
  if (p.parcoursGuide?.alphabet) add(p.parcoursGuide.alphabet, "alphabet", "Alphabet fleuri");
}
for (const m of MOTIFS) if (m.kind === "image") add(m.url, "motifs", m.label);
JSON.stringify(MODELES, (k, v) => { if (v && typeof v === "object" && typeof v.dark === "string") add(v.dark, "modeles-fete-des-peres", v.name || v.id); return v; });
for (const n of NOEL_IMAGES) add(n.src, "noel", `Noël n° ${n.n} ${n.nom}`);
for (const d of CG_DESSINS) add(`${CG_DOSSIER}/dessin-${d.k}.webp`, "cristal-dessins", d.nom);
for (const z of CG_ZODIAQUE) { add(`/origines/zodiaque/${z.k}.png`, "zodiaque", z.nom); L.get(`/origines/zodiaque/${z.k}.png`).vec = `${CG_DOSSIER}/zodiaque-${z.k}.webp`; }
for (const f of fs.readdirSync("public/produits/gobelet/dessins")) add(`/produits/gobelet/dessins/${f}`, "gobelet-dessins", `Gobelet dessin ${f}`);
for (const f of fs.readdirSync("public/marque-pages/dessins")) if (/^\d+\.png$/.test(f) && +f.slice(0,3) >= 75) add(`/marque-pages/dessins/${f}`, "cadres", `Cadre ${f}`);
const out = [...L.values()].filter((x) => fs.existsSync("public" + x.src) && !PHOTOS(x.src));
const manque = [...L.values()].filter((x) => !fs.existsSync("public" + x.src));
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const c = {}; for (const x of out) c[x.famille] = (c[x.famille] || 0) + 1;
console.log(out.length, c, "absents:", manque.map((m) => m.src).slice(0, 10));
