// Vérifications de l'appariement « ligne de commande → réglages de gravure ».
//   node tools/tests/orderSpec.test.mjs
import { apparierSpec } from "../../src/lib/orderSpec.js";
let ok = 0, ko = 0;
const v = (nom, a, b) => { const p = JSON.stringify(a) === JSON.stringify(b); p ? ok++ : ko++; if (!p) console.log("KO", nom, JSON.stringify(a), "≠", JSON.stringify(b)); };

// LE CAS RÉEL : commande 00CUYR2U — deux lots de la MÊME flûte, gravés différemment.
const items = [{ slug: "flute-a-champagne-gravee" }, { slug: "flute-a-champagne-gravee" }];
const spec = [
  { slug: "flute-a-champagne-gravee", fields: { prenom: "Chloé & Nico" } },
  { slug: "flute-a-champagne-gravee", fields: { prenom: "Salomé & Bernard", numstyle: "15" } },
];
v("deux lots du même produit", apparierSpec(items, spec).map((s) => s.fields.prenom),
  ["Chloé & Nico", "Salomé & Bernard"]);

// Un article NON gravé au milieu : le paiement le retire du tableau des réglages.
v("article sans gravure au milieu",
  apparierSpec([{ slug: "a" }, { slug: "bougie" }, { slug: "a" }],
    [{ slug: "a", n: 1 }, { slug: "a", n: 2 }]).map((s) => (s ? s.n : null)),
  [1, null, 2]);

// Trois lots du même produit.
v("trois lots",
  apparierSpec([{ slug: "x" }, { slug: "x" }, { slug: "x" }],
    [{ slug: "x", n: 1 }, { slug: "x", n: 2 }, { slug: "x", n: 3 }]).map((s) => s.n),
  [1, 2, 3]);

// Ancienne commande : réglages sans identifiant produit → on suit l'ordre.
v("réglages sans slug",
  apparierSpec([{ slug: "a" }, { slug: "b" }], [{ n: 1 }, { n: 2 }]).map((s) => s.n), [1, 2]);

// Produits différents, réglages dans le désordre → chacun le sien.
v("produits différents",
  apparierSpec([{ slug: "b" }, { slug: "a" }], [{ slug: "a", n: 1 }, { slug: "b", n: 2 }]).map((s) => s.n),
  [2, 1]);

// Plus de lignes que de réglages : pas de réutilisation.
v("plus de lignes que de réglages",
  apparierSpec([{ slug: "a" }, { slug: "a" }], [{ slug: "a", n: 1 }]).map((s) => (s ? s.n : null)), [1, null]);

// Cas vides.
v("aucun réglage", apparierSpec([{ slug: "a" }], null), [null]);
v("aucune ligne", apparierSpec(null, [{ slug: "a" }]), []);
v("spec avec trous", apparierSpec([{ slug: "a" }], [null, { slug: "a", n: 7 }]).map((s) => s.n), [7]);

console.log(`${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
