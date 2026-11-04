// =============================================================================
// Vignettes allégées des cartes et du mur (04/11/2026, audit : accueil 22 Mo).
// -----------------------------------------------------------------------------
// Le redimensionnement automatique de Next.js (/_next/image) ne fonctionne pas
// sur Firebase App Hosting (404) : les cartes servaient les photos d'ORIGINE
// (jusqu'à 5 Mo pour une tuile de 200 px). Ce script fabrique, pour chaque photo
// de carte / de mur du catalogue, une copie WebP de 480 px dans
// `public/vignettes/` et écrit la correspondance dans `src/lib/vignettes.json`.
// Les originaux ne sont JAMAIS modifiés ; une photo sans vignette est servie
// telle quelle (`vignette()` dans src/lib/vignettes.js).
//
//   npm run vignettes        → à relancer après tout ajout / changement de photo
//                               (le contrôle `npm run audit-photos` le rappelle).
// =============================================================================
import { getCatalog } from "@/lib/catalog";
import { rangerCatalogue } from "@/lib/univers";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const OUT = path.join(ROOT, "public", "vignettes");
const MANIFEST = path.join(ROOT, "src", "lib", "vignettes.json");
const LARGEUR = 480;

const cat = await getCatalog();
const R = rangerCatalogue(cat);
const sources = new Set();
for (const c of R.cartes || []) if (c.image && c.image.startsWith("/") && !c.image.startsWith("/api/")) sources.add(c.image);

fs.mkdirSync(OUT, { recursive: true });
const ancien = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const manifest = {};
const travaux = [];
for (const src of [...sources].sort()) {
  const fichier = path.join(ROOT, "public", decodeURIComponent(src));
  if (!fs.existsSync(fichier)) { console.warn("⚠️ photo introuvable :", src); continue; }
  const h = crypto.createHash("md5").update(fs.readFileSync(fichier)).digest("hex").slice(0, 8);
  const nom = path.basename(src).replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60);
  const dest = `/vignettes/${nom}-${h}.webp`;
  manifest[src] = dest;
  if (!fs.existsSync(path.join(ROOT, "public", dest))) travaux.push([fichier, path.join(ROOT, "public", dest)]);
}

if (travaux.length) {
  const py = `
import sys, json
from PIL import Image, ImageOps
for src, dest in json.load(open(sys.argv[1])):
    im = Image.open(src); im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); fond = Image.new("RGB", im.size, (255, 255, 255)); fond.paste(im, mask=im.split()[-1]); im = fond
    else:
        im = im.convert("RGB")
    im.thumbnail((${LARGEUR}, ${LARGEUR}), Image.LANCZOS)
    im.save(dest, "WEBP", quality=82, method=6)
print(len(sys.argv))`;
  const liste = path.join(OUT, ".travaux.json");
  fs.writeFileSync(liste, JSON.stringify(travaux));
  const r = spawnSync("/usr/bin/python3", ["-I", "-c", py, liste], { stdio: ["ignore", "inherit", "inherit"] });
  fs.unlinkSync(liste);
  if (r.status !== 0) { console.error("échec de la génération (Pillow)"); process.exit(1); }
}

// Vignettes orphelines (photo changée ou produit retiré) : supprimées.
const gardees = new Set(Object.values(manifest).map((d) => path.basename(d)));
let orphelines = 0;
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".webp") && !gardees.has(f)) { fs.unlinkSync(path.join(OUT, f)); orphelines++; }

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
const poids = (d) => fs.statSync(path.join(ROOT, "public", d)).size;
const avant = Object.keys(manifest).reduce((s, k) => s + poids(k), 0);
const apres = Object.values(manifest).reduce((s, k) => s + poids(k), 0);
const Mo = (x) => (x / 1048576).toFixed(1);
console.log(`${Object.keys(manifest).length} vignettes (${travaux.length} fabriquées, ${orphelines} retirées, ${Object.keys(ancien).length} avant) : ${Mo(avant)} Mo d'originaux → ${Mo(apres)} Mo de vignettes`);
