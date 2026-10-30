// Socles lumineux : bascule automatique vers le nouveau modèle dès que l'ancien est à 0 (npm run test-socles).
import assert from "node:assert/strict";
import { products } from "@/lib/products";
import { appliquerSocles, socleEnVente, soclesPourPage } from "@/lib/socles";
import { engravingExtra } from "@/lib/engravingPrice";

let ok = 0;
const t = (nom, fn) => { fn(); ok++; console.log("✓", nom); };
const fiche = (slug, st) => appliquerSocles(products.find((p) => p.slug === slug), st);
const socle = (slug, v, st) => engravingExtra(fiche(slug, st), { socle: "oui" }, v);

t("ancien en stock = ancien vendu", () => assert.equal(socleEnVente("socle-led-carre", { "socle-led-carre": 3 }), "socle-led-carre"));
t("ancien non suivi = ancien vendu", () => assert.equal(socleEnVente("socle-led-rectangle", {}), "socle-led-rectangle"));
t("ancien à 0 = nouveau vendu", () => assert.equal(socleEnVente("socle-led-carre", { "socle-led-carre": 0 }), "socle-led-carre-gris"));
t("le petit bascule seul", () => {
  const st = { "socle-led-carre": 0, "socle-led-rectangle": 8 };
  assert.deepEqual(socle("cristal-photo-3d-vertical", "cristal-v-petit", st).stockIds, ["socle-led-carre-gris"]);
  assert.deepEqual(socle("cristal-photo-3d-vertical", "cristal-v-grand", st).stockIds, ["socle-led-carre-gris"]);
  assert.deepEqual(socle("cristal-photo-3d-vertical", "cristal-v-xl", st).stockIds, ["socle-led-rectangle"]);
});
t("le grand bascule : horizontal Petit compris, prix inchangé", () => {
  const st = { "socle-led-rectangle": 0 };
  const r = socle("cristal-photo-3d-horizontal", "cristal-h-petit", st);
  assert.deepEqual(r.stockIds, ["socle-led-rectangle-noir"]);
  assert.equal(r.amount, 19.9);
  assert.deepEqual(socle("cristal-deja-grave", "cristal-grave-v-xl", st).stockIds, ["socle-led-rectangle-noir"]);
  assert.equal(socle("cristal-deja-grave", "cristal-grave-v-petit", st).amount, 14.9);
});
t("photo et texte de la fiche suivent le socle en vente", () => {
  const p = fiche("cristal-photo-3d-vertical", { "socle-led-carre": 0 });
  const n = p.personalizationFields.find((f) => f.key === "note-socle");
  assert.equal(n.imageByVariant["cristal-v-petit"], "/produits/socle-led-carre-gris.jpg");
  assert.match(n.textByVariant["cristal-v-petit"], /piles AAA/);
  assert.equal(n.imageByVariant["cristal-v-grand"], "/produits/socle-led-carre-gris.jpg");
  assert.equal(n.imageByVariant["cristal-v-xl"], "/produits/socle-led-rectangle.jpg");
});
t("vertical : petit socle sauf XL", () => {
  for (const v of ["cristal-v-petit","cristal-v-moyen","cristal-v-grand"]) { const r = socle("cristal-photo-3d-vertical", v, {}); assert.equal(r.amount, 14.9); assert.deepEqual(r.stockIds, ["socle-led-carre"]); }
  const x = socle("cristal-photo-3d-vertical", "cristal-v-xl", {}); assert.equal(x.amount, 19.9); assert.deepEqual(x.stockIds, ["socle-led-rectangle"]);
  assert.equal(socle("cristal-deja-grave", "cristal-grave-v-grand", {}).amount, 14.9);
  assert.equal(socle("cristal-deja-grave", "cristal-grave-v-xl", {}).amount, 19.9);
  assert.equal(socle("cristal-photo-3d-horizontal", "cristal-h-moyen", {}).amount, 19.9);
});
t("page cristaux déjà gravés", () => {
  const s = soclesPourPage({ "socle-led-carre": 0, "socle-led-rectangle": 0 });
  assert.equal(s.carre.image, "/produits/socle-led-carre-gris.jpg");
  assert.equal(s.rect.image, "/produits/socle-led-rectangle-noir.jpg");
});
console.log(`\n${ok} vérifications au vert`);
