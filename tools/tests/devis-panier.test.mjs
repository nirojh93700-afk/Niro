// Devis dans le panier (02/11/2026) : lignes, produit principal, articles proposés.
import assert from "node:assert/strict";
import { products } from "@/lib/products";
import { lignesDevisPanier, produitPrincipal, devisPanierPossible, articlesAssortis } from "@/lib/devisPanier";
import { nouvelEtatPort, ajouterLignePort } from "@/lib/panierPort";

const index = new Map();
for (const p of products) for (const v of p.variants || []) index.set(v.id, { product: p, variant: v });
let ok = 0; const t = (n, f) => { f(); ok++; console.log("✓", n); };

const dev1531 = { type: "devis", status: "envoye", total: 28.11, items: [
  { desc: "Bracelet Homme Identité (Gourmette) — acier inoxydable", qty: 1, price: 25.11, stockId: "gourm", weight: 72, variantId: "gourm-sans" },
  { desc: "Gravure de la plaque : les noms entourés d'un cœur", qty: 1, price: 3 } ] };

t("DEV-1531 passe par le panier", () => assert.equal(devisPanierPossible(dev1531, index), true));
t("produit principal = la gourmette", () => assert.equal(produitPrincipal(dev1531.items, index).product.slug, index.get("gourm-sans").product.slug));
t("ligne de gravure sans poids : suit le bijou, 0 g", () => {
  const l = lignesDevisPanier(dev1531.items, index);
  assert.equal(l.length, 2); assert.equal(l[1].unitGrams, 0); assert.equal(l[1].product.letter, true);
});
t("port : reste en lettre (bijou seul), sous-total 28,11", () => {
  const e = nouvelEtatPort(); for (const l of lignesDevisPanier(dev1531.items, index)) ajouterLignePort(e, l);
  assert.equal(e.letterOnly, true); assert.equal(Math.round(e.subtotal * 100), 2811); assert.equal(e.totalGrams, 72);
});
t("une ligne « Livraison » saisie à la main : pas de panier", () => assert.equal(devisPanierPossible({ ...dev1531, items: [...dev1531.items, { desc: "Livraison Express Chronopost", qty: 1, price: 14.9 }] }, index), false));
t("payé, facture ou désactivé : pas de panier", () => {
  assert.equal(devisPanierPossible({ ...dev1531, status: "paye" }, index), false);
  assert.equal(devisPanierPossible({ ...dev1531, type: "facture" }, index), false);
  assert.equal(devisPanierPossible({ ...dev1531, panierOff: true }, index), false);
});
t("ligne libre sans poids ni produit : pas de panier", () => assert.equal(devisPanierPossible({ total: 10, items: [{ desc: "Clé USB", qty: 1, price: 10 }] }, index), false));
t("articles proposés : même rayon, sans le bijou du devis, 6 au plus, un petit cadeau", () => {
  const cat = products.filter((p) => !p.hidden);
  const a = articlesAssortis(cat, produitPrincipal(dev1531.items, index));
  assert.ok(a.length > 0 && a.length <= 6);
  assert.ok(!a.some((p) => p.slug === index.get("gourm-sans").product.slug));
  assert.ok(a.slice(0, 3).every((p) => p.category === "bijoux"));
});
console.log(`\n${ok} vérifications OK`);
