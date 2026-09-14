// =============================================================================
// MAQUETTES « APERÇU 3D — CŒUR » — une page par produit.
//
//   npm run maquette-coeur3d
//
// Génère docs/maquettes/apercu3d-<slug>.html pour les bijoux à cœur. Chaque page
// est AUTONOME (three.js et les photos sont intégrés dedans) : elle s'ouvre sur
// un téléphone sans connexion et sans rien installer.
//
// ⛔ MAQUETTE — rien de tout ça ne touche le site. Les prix, les options et les
// champs de gravure sont LUS dans src/lib/products.js pour que la maquette dise
// exactement la même chose que la fiche réelle.
// =============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../../src/lib/products.js";
import { roundTo90 } from "../../src/lib/format.js";
import { FONTS } from "../../src/lib/fonts.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "docs", "maquettes");

// --- three.js en un seul morceau, sans import ni export (voir README du tool) --
function bundleThree() {
  const NS = "__THREE_NS__";
  const core = readFileSync(join(ROOT, "node_modules/three/build/three.core.min.js"), "utf8").trimEnd();
  const mod = readFileSync(join(ROOT, "node_modules/three/build/three.module.min.js"), "utf8").trimEnd();
  const pairs = (b) => b.split(",").map((s) => s.trim()).filter(Boolean)
    .map((s) => (s.includes(" as ") ? s.split(" as ").map((x) => x.trim()) : [s, s]));
  const m = /export\{([^}]*)\};?\s*$/.exec(core);
  const p1 = `{\n${core.slice(0, m.index)}\nObject.assign(${NS},{${pairs(m[1]).map(([l, p]) => `${p}:${l}`)}});\n}\n`;
  const i = mod.indexOf("import{"), j = mod.indexOf('}from"./three.core.min.js";', i);
  const imp = pairs(mod.slice(i + 7, j)).map(([p, l]) => (p === l ? p : `${p}:${l}`)).join(",");
  let body = mod.slice(j + '}from"./three.core.min.js";'.length);
  const assigns = [];
  body = body.replace(/export\{([^}]*)\}(from"\.\/three\.core\.min\.js")?;/g, (_, list, fromCore) => {
    if (!fromCore) assigns.push(pairs(list).map(([l, p]) => `${p}:${l}`).join(","));
    return "";
  });
  return `const ${NS} = {};\n${p1}{\nconst {${imp}} = ${NS};\n${body}\nObject.assign(${NS},{${assigns.join(",")}});\n}\n`;
}

// --- photos intégrées ---------------------------------------------------------
const cachePhoto = new Map();
function photo(url) {
  if (!url || !url.startsWith("/produits/")) return null;
  if (cachePhoto.has(url)) return cachePhoto.get(url);
  const f = join(ROOT, "public", url);
  const d = existsSync(f) ? `data:image/jpeg;base64,${readFileSync(f).toString("base64")}` : null;
  cachePhoto.set(url, d);
  return d;
}

const paye = (prix) => {
  const barre = roundTo90(prix * 0.9);
  return { barre, paye: Math.round(barre * 0.9 * 100) / 100 };
};
const finitionDe = (titre) => {
  const t = (titre || "").toLowerCase();
  if (t.includes("rose")) return "rose";
  if (t.includes("argent")) return "silver";
  if (t.includes("multicolore")) return "gold";
  return t.includes("dor") ? "gold" : "gold";
};

// --- Quelle scène 3D pour quel bijou ? ----------------------------------------
// surfaces : une entrée par zone gravable, dans l'ordre des champs de la fiche.
const SCENES = {
  "collier-double-coeur":      { layout: "coeur", chaine: true,  surfaces: [["recto", "recto"], ["verso", "verso"]] },
  "collier-coeur-grave":       { layout: "coeur", chaine: true,  surfaces: [["recto", "recto"], ["verso", "verso"]] },
  "bracelet-coeur-a-graver-ot":{ layout: "coeur", chaine: false, surfaces: [["recto", "recto"], ["verso", "verso"]] },
  "bracelet-coeur-chaine":     { layout: "coeur", chaine: false, surfaces: [["recto", "recto"], ["verso", "verso"]] },
  "collier-coeur-zircon":      { layout: "coeur", chaine: true,  surfaces: [["texte", "recto"]], zircon: true },
  "bracelet-femme-coeur":      { layout: "coeur", chaine: false, surfaces: [["texte", "recto"]] },
  "collier-coeur-plaques":     { layout: "coeurPlaques", chaine: true, surfaces: [["coeur", "coeur"], ["plaque1", "plaque1"], ["plaque2", "plaque2"]] },
  "collier-3coeurs":           { layout: "troisCoeurs", chaine: true, surfaces: [["coeur1", "c1"], ["coeur2", "c2"], ["coeur3", "c3"]] },
  "collier-couple-coeur-lot2": { layout: "paire", chaine: true, surfaces: [["texte1", "p1"], ["texte2", "p2"]] },
};

const gabarit = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "coeur3d.template.html"), "utf8");
const THREE_JS = bundleThree();
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

let n = 0;
for (const [slug, scene] of Object.entries(SCENES)) {
  const p = products.find((x) => x.slug === slug);
  if (!p) { console.log("⚠️  produit introuvable :", slug); continue; }

  const variants = p.variants.map((v) => ({
    id: v.id, titre: v.title, ...paye(v.price),
    finition: finitionDe(v.title),
    photo: photo(v.image) || photo(p.images?.[0]),
  }));
  const champs = (p.personalizationFields || [])
    .filter((f) => f.type === undefined || f.type === "text" || f.type === "textarea")
    .map((f) => {
      const s = scene.surfaces.find(([k]) => k === f.key);
      return { key: f.key, label: f.label, max: f.maxLength || 20, surface: s ? s[1] : "recto",
               optional: !!f.optional, sup: p.engravingPricing?.textKeys?.includes(f.key) ? (p.engravingPricing.textExtra || 0) : 0 };
    });
  const note = (p.personalizationFields || []).find((f) => f.type === "note")?.text || "";

  const cfg = {
    slug, nom: p.name, titre: p.title, tagline: p.tagline,
    categorie: "Bijoux", note,
    photos: (p.images || []).map(photo).filter(Boolean).slice(0, 5),
    variants, champs,
    layout: scene.layout, chaine: !!scene.chaine, zircon: !!scene.zircon,
    polices: FONTS.map((f) => ({ key: f.key, label: f.label.split(" — ")[0], css: cssFont(f.key) })),
  };

  const html = gabarit
    .replace("/*__THREE__*/", () => THREE_JS)
    .replace("/*__CONFIG__*/", () => JSON.stringify(cfg))
    .replace(/__TITRE__/g, escapeHtml(p.name));
  const f = join(OUT, `apercu3d-${slug}.html`);
  writeFileSync(f, html, "utf8");
  n++;
  console.log(`✓ ${f.replace(ROOT + "/", "")}  (${(html.length / 1024 / 1024).toFixed(2)} Mo)`);
}
console.log(`\n${n} maquette(s) générée(s). Rien n'a été publié ni poussé.`);

function cssFont(key) {
  return {
    playfair: "'Playfair Display', Georgia, serif",
    cinzel: "'Cinzel', Georgia, serif",
    "cinzel-deco": "'Cinzel Decorative', Georgia, serif",
    montserrat: "'Montserrat', Arial, sans-serif",
    inter: "'Inter', Arial, sans-serif",
    "great-vibes": "'Great Vibes', cursive",
    allura: "'Allura', cursive",
    pacifico: "'Pacifico', cursive",
  }[key] || "Georgia, serif";
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
