// Export (JSON) de ce dont la maquette « Fêtes » a besoin : le parcours guidé du verre à vin.
// Lancé par fetes-noel.py : node --import tools/alias-register.mjs tools/maquettes/fetes-noel-export.mjs
const { products } = await import("../../src/lib/products.js");
const p = products.find((x) => x.slug === "verre-a-vin-grave");
const pg = p.parcoursGuide;
process.stdout.write(JSON.stringify({ groupes: pg.groupes, modeles: pg.modeles, styleImages: p.styleImages, prix: p.variants[0].price, textExtra: p.engravingPricing.textExtra }));
