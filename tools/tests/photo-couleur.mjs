// Photo de la COULEUR commandée (27/11/2026, commande 0KCDY9UA : bracelet « Argenté · cœur » montré avec la
// photo dorée dans Gestion, un bracelet perdu). Gestion doit montrer la photo de l'option commandée, ou dire
// en rouge qu'elle n'en a pas. Un nouveau produit à couleurs sans photo par couleur fait ÉCHOUER ce test.
import assert from "node:assert/strict";
import { products } from "../../src/lib/products.js";
import { photoCommandee, detaillerCommande, couleursSansPhoto } from "../../src/lib/detailProduit.js";

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const fin = (u) => String(u || "").split("/").pop();

const a = photoCommandee(null, "bracelet-plaque-breloque", "Argenté · cœur");
ok(fin(a.image) === "bracelet-plaque-breloque-argente-coeur.jpg" && !a.autreCouleur, "bracelet à breloque argenté cœur : sa photo argentée");
const cmd = detaillerCommande({ items: [{ slug: "bracelet-plaque-breloque", name: "Bracelet", image: "https://nivcreation.fr/produits/nihao/bracelet-plaque-breloque-dore-coeur.jpg", details: "Argenté · cœur — 1 gravure(s) en plus (+3.00 €) — Personnalisation : Arthur&Mathilde" }] });
ok(fin(cmd.items[0].image) === "bracelet-plaque-breloque-argente-coeur.jpg", "commande 0KCDY9UA : la photo dorée enregistrée est remplacée par l'argentée");
ok(fin(cmd.items[0].imageProduit) === "bracelet-plaque-breloque-dore-coeur.jpg", "l'ancienne photo est gardée à part");
ok(photoCommandee(null, "bracelet-femme-coeur", "Or rose").autreCouleur, "bracelet femme cœur or rose : aucune photo de cette couleur, c'est dit");
ok(!photoCommandee(null, "bracelet-femme-coeur", "Doré").autreCouleur, "bracelet femme cœur doré : la première photo est la dorée");
ok(!photoCommandee(null, "verre-a-vin-grave", "Lot de 2").autreCouleur, "un lot de verres n'est pas une couleur");
ok(fin(photoCommandee(null, "carnet-a5-grave", "Couleur Noir · Couverture (+7 €)").image) === "couverture-noir.jpg", "carnet : la couleur est lue dans le détail");
ok(fin(photoCommandee(null, "collier-plaque-acier", "Argenté").image).includes("argente"), "collier plaque acier argenté : sa photo");

// Chaque option qui porte une photo la retrouve bien.
for (const p of products) for (const v of p.variants || []) {
  if (!v.image) continue;
  const r = photoCommandee(null, p.slug, v.title);
  const memeTitre = (p.variants || []).filter((x) => x.title === v.title).length;
  if (memeTitre === 1) ok(r.image === v.image, `${p.slug} · ${v.title} : la photo de l'option`);
}

// Liste FERMÉE des produits qui n'ont pas une photo par couleur. Un nouveau produit n'a pas le droit d'y entrer :
// il lui faut `image` sur chaque option. Quand le gérant donne les photos d'un de ces quatre, le retirer d'ici.
const CONNUS = ["bracelet-femme-coeur", "bracelet-homme-acier-silicone", "collier-enveloppe-message-secret", "collier-medaillon-coeur-ouvrable"];
const sans = products.filter((p) => couleursSansPhoto(p).length).map((p) => p.slug).sort();
assert.deepEqual(sans, [...CONNUS].sort(), `Produits à couleurs sans photo par couleur : ${sans.join(", ")}`); n++;
console.log(`photo-couleur : ${n} vérifications OK`);
