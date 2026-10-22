// =============================================================================
// AUDIT DES PHOTOS DE PRODUITS SUR TOUTES LES PAGES — Niv Création (22/10/2026)
// -----------------------------------------------------------------------------
// Gérant : « je peux même pas cliquer sur les photos pour aller directement dans
// les articles, et il y a un article que j'ai même pas mis sur le site, t'as
// laissé la photo ». Ce contrôle manquait à tools/audit-site.mjs. Il lit le plan
// du site EN LIGNE, ouvre chaque page et cherche :
//   ❌ une photo d'un produit qui n'est PAS en vente (masqué / retiré) ;
//   ⚠️ une photo de produit sur laquelle on ne peut pas cliquer (hors galerie de
//      la fiche elle-même et hors tuiles de choix connues : « Pour qui », « Occasion »).
//
//   node --import ./tools/alias-register.mjs tools/audit-photos.mjs [--site https://…]
//
// Lecture seule. Lancé aussi par « vérifie mon site » (voir CLAUDE.md).
// =============================================================================
import { products } from "../src/lib/products.js";

const arg = process.argv.indexOf("--site");
const SITE = (arg > 0 ? process.argv[arg + 1] : "https://nivcreation.fr").replace(/\/$/, "");

// Photo → produits qui l'utilisent (toutes les photos déclarées dans le code).
const photos = new Map();
for (const p of products) {
  const imgs = [p.cardImage, ...(p.images || []),
    ...(p.variants || []).flatMap((v) => [v.image, ...(v.gallery || [])]),
    ...((p.tailles && p.tailles.options) || []).flatMap((o) => [o.image, ...(o.gallery || [])])].filter(Boolean);
  for (const i of imgs) { if (!photos.has(i)) photos.set(i, new Set()); photos.get(i).add(p.slug); }
}

const norm = (src) => {
  let s = src.replace(/&amp;/g, "&");
  const m = /[?&]url=([^&]+)/.exec(s);
  if (m) s = decodeURIComponent(m[1]);
  return s.split("?")[0].replace(/^https?:\/\/[^/]+/, "");
};

// Lit les <img> d'une page et, pour chacune, les liens <a href> qui l'entourent.
function imagesAvecLiens(html) {
  const out = [];
  const pile = [];
  const vides = new Set(["br", "hr", "meta", "link", "input", "source", "path", "circle", "rect", "use", "line", "polyline", "polygon", "stop", "img", "wbr"]);
  const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, fin, tagBrut, attrs] = m;
    const tag = tagBrut.toLowerCase();
    if (tag === "script" || tag === "style") {
      if (!fin) { const close = html.indexOf(`</${tag}`, re.lastIndex); if (close > 0) re.lastIndex = close; }
      continue;
    }
    if (fin) { for (let i = pile.length - 1; i >= 0; i--) if (pile[i].tag === tag) { pile.length = i; break; } continue; }
    if (tag === "img") {
      const src = (/\ssrc="([^"]+)"/.exec(attrs) || [])[1] || "";
      const classe = (/\sclass="([^"]+)"/.exec(attrs) || [])[1] || "";
      out.push({ src, classe, liens: pile.filter((x) => x.tag === "a" && x.href).map((x) => x.href), parents: pile.map((x) => x.classe).join(" ") });
      continue;
    }
    if (vides.has(tag) || /\/\s*$/.test(attrs)) continue;
    pile.push({ tag, href: tag === "a" ? (/\shref="([^"]+)"/.exec(attrs) || [])[1] || "" : "", classe: (/\sclass="([^"]+)"/.exec(attrs) || [])[1] || "" });
  }
  return out;
}

// Tuiles de choix volontairement sans lien vers une fiche (le clic choisit, il ne navigue pas).
const TUILES_DE_CHOIX = /\b(ft|ft-ph|cg-tile|cg-img|cg-xtal|cg-bloc|cg-fmts|variant-swatch|cgb-|mxhero|laser)\b/;

const plan = await (await fetch(`${SITE}/sitemap.xml`)).text();
const pages = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, "") || "/");
const enVente = new Set(pages.filter((u) => u.startsWith("/produit/")).map((u) => u.split("/produit/")[1]));

const masques = new Map();
const nonCliquables = new Map();
let lues = 0;
for (const page of pages) {
  let html = "";
  try { html = await (await fetch(SITE + page)).text(); lues++; } catch { continue; }
  for (const im of imagesAvecLiens(html)) {
    const slugs = photos.get(norm(im.src));
    if (!slugs) continue;
    const vivants = [...slugs].filter((s) => enVente.has(s));
    if (!vivants.length) {
      const k = `${norm(im.src)} (${[...slugs].join(", ")})`;
      if (!masques.has(k)) masques.set(k, new Set());
      masques.get(k).add(page);
      continue;
    }
    if (page.startsWith("/produit/")) continue; // galerie de la fiche
    if (im.liens.length) continue;
    if (TUILES_DE_CHOIX.test(`${im.classe} ${im.parents}`)) continue;
    if (!nonCliquables.has(page)) nonCliquables.set(page, new Set());
    nonCliquables.get(page).add(`${norm(im.src)} → ${vivants.join(", ")}`);
  }
}

console.log(`\nAUDIT DES PHOTOS — ${SITE} — ${lues}/${pages.length} pages lues, ${enVente.size} produits en vente\n`);
if (!masques.size) console.log("✅ Aucune photo de produit masqué ou retiré");
for (const [k, p] of masques) console.log(`❌ Photo d'un produit qui n'est pas en vente : ${k}\n   sur ${p.size} page(s), ex. ${[...p].slice(0, 4).join(" · ")}`);
if (!nonCliquables.size) console.log("✅ Toutes les photos de produits mènent à leur fiche");
for (const [page, s] of nonCliquables) console.log(`⚠️  ${page} : photo(s) sans lien vers la fiche : ${[...s].join(" · ")}`);
process.exit(masques.size ? 1 : 0);
