// Vérifications de l'appariement « ligne de commande → réglages de gravure ».
//   node tools/tests/orderSpec.test.mjs
import { apparierSpec, eclaterParVerre } from "../../src/lib/orderSpec.js";
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

// ---------------------------------------------------------------------------
// LOT « CHACUN DIFFÉRENT » — commande #1LTYHZ6D (30/09/2026) : 4 verres à
// cocktail, 4 photos et 4 textes. Les champs de tête ne portent que le verre 1.
// ---------------------------------------------------------------------------
const lot = {
  slug: "verre-a-cocktail-grave", name: "Verre à cocktail personnalisé", variantTitle: "Lot de 4 — livraison offerte",
  emplacement: "face", deuxEmplacement: false,
  photoSrc: "/api/img/A", previewImage: "/api/img/PREVIEW", artworkImage: "/api/img/A",
  layout: { photo: { cx: 0.5, cy: 0.4 } },
  fields: { emplacement: "face", photo: "/api/img/A", texte: "Toujours boire avec la famille", texte2: "23-08-2025", decor: "◆", police: "cinzel-deco" },
  perGlass: [
    { emplacement: "face", photo: "/api/img/A", texte: "Toujours boire avec la famille", texte2: "23-08-2025", decor: "◆", police: "cinzel-deco" },
    { photo: "/api/img/B", texte: "Toujours être bien entouré ", police: "cinzel-deco", decor: "◆" },
    { photo: "/api/img/C", texte: "À la santé de mon filleul", texte2: "12-04-2021", decor: "♥", police: "cinzel-deco" },
    { photo: "/api/img/D", texte: "À la Chesta Family", decor: "♥", police: "cinzel-deco", emplacement: "face" },
  ],
  personalization: "Verre 1 : photo/logo fourni · « Toujours boire avec la famille » · date 23-08-2025  |  Verre 2 : photo/logo fourni · « Toujours être bien entouré »  |  Verre 3 : photo/logo fourni · « À la santé de mon filleul » · date 12-04-2021  |  Verre 4 : photo/logo fourni · « À la Chesta Family »",
};
const verres = eclaterParVerre(lot);
v("4 verres → 4 articles", verres.length, 4);
v("numérotés 1..4 sur 4", verres.map((x) => `${x.verre}/${x.verres}`), ["1/4", "2/4", "3/4", "4/4"]);
v("chaque verre a SA photo", verres.map((x) => x.photoSrc), ["/api/img/A", "/api/img/B", "/api/img/C", "/api/img/D"]);
v("chaque verre a SON texte", verres.map((x) => x.fields.texte.trim()),
  ["Toujours boire avec la famille", "Toujours être bien entouré", "À la santé de mon filleul", "À la Chesta Family"]);
v("un résumé par verre", verres.map((x) => x.personalization.startsWith(`Verre ${x.verre} :`)), [true, true, true, true]);
v("la capture ne vaut que pour le verre actif", verres.map((x) => x.previewImage), ["/api/img/PREVIEW", null, null, null]);
v("artwork = la photo propre à chaque verre", verres.map((x) => x.artworkImage), ["/api/img/A", "/api/img/B", "/api/img/C", "/api/img/D"]);
v("les articles virtuels ne se ré-éclatent pas", verres.map((x) => eclaterParVerre(x).length), [1, 1, 1, 1]);
v("emplacement hérité quand le verre ne le précise pas", verres.map((x) => x.emplacement), ["face", "face", "face", "face"]);
v("« les deux » → face + 2e gravure", eclaterParVerre({ ...lot, perGlass: [{ emplacement: "deux", texte: "a" }, { texte: "b" }] })
  .map((x) => [x.emplacement, x.deuxEmplacement]), [["face", true], ["face", false]]);
v("lot uniforme → l'article tel quel", eclaterParVerre({ ...lot, perGlass: null }).map((x) => x.photoSrc), ["/api/img/A"]);
v("un seul verre dans perGlass → tel quel", eclaterParVerre({ ...lot, perGlass: [lot.perGlass[0]] }).length, 1);
v("réglage vide", eclaterParVerre(null), []);
v("apparier puis éclater : 2 lignes × 4 verres",
  apparierSpec([{ slug: "verre-a-cocktail-grave" }, { slug: "verre-a-cocktail-grave" }], [lot, { ...lot, perGlass: lot.perGlass.slice(0, 2) }])
    .flatMap((s) => eclaterParVerre(s)).map((x) => x.verres), [4, 4, 4, 4, 2, 2]);

console.log(`${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
