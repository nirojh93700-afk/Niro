#!/usr/bin/env node
// Prix d'une fiche TELS QU'EN LIGNE (réglages de Gestion compris), à lancer AVANT d'écrire un prix
// dans un mail client ou un devis (règle du 25/10/2026, après le 15,90 € annoncé à Nicky au lieu de 17,90 €).
//   node tools/prix-fiche.mjs verre-a-vin-grave [autre-slug …]
// Lit la page publique https://nivcreation.fr/produit/<slug> : options + prix, et les suppléments de gravure.
const SITE = process.env.SITE || "https://nivcreation.fr";
const slugs = process.argv.slice(2);
if (!slugs.length) { console.error("Usage : node tools/prix-fiche.mjs <slug> [slug …]"); process.exit(1); }

const eur = (n) => Number(n).toFixed(2).replace(".", ",") + " €";

function objetApres(txt, cle) {
  // Renvoie le texte JSON de l'objet qui suit "cle":{ … } (accolades équilibrées).
  const i = txt.indexOf(`"${cle}":{`);
  if (i < 0) return null;
  let j = txt.indexOf("{", i), n = 0;
  for (let k = j; k < txt.length; k++) {
    if (txt[k] === "{") n++;
    else if (txt[k] === "}" && --n === 0) return txt.slice(j, k + 1);
  }
  return null;
}

for (const slug of slugs) {
  const r = await fetch(`${SITE}/produit/${slug}`);
  if (!r.ok) { console.log(`\n✗ ${slug} : page ${r.status}`); continue; }
  const txt = (await r.text()).replace(/\\"/g, '"');
  const nom = (txt.match(/<h1[^>]*>([^<]+)</) || [])[1] || slug;
  console.log(`\n== ${nom}  (${SITE}/produit/${slug})`);
  const vus = new Set();
  for (const m of txt.matchAll(/"id":"([^"]+)"(?:,"stockId":"[^"]*")?(?:,"taille":"([^"]*)")?,"title":"([^"]+)","price":([0-9.]+)/g)) {
    const cle = m[1] + m[4];
    if (vus.has(cle)) continue; vus.add(cle);
    console.log(`  ${(m[2] ? m[2] + " cl · " : "") + m[3]}`.padEnd(48) + eur(m[4]));
  }
  if (!vus.size) console.log("  (aucune option lue : vérifier la fiche à la main)");
  const ep = objetApres(txt, "engravingPricing");
  console.log("  Gravure : " + (ep || "aucun supplément déclaré"));
}
console.log("\n⚠️ Tout texte gravé se compte (règle des verres : prixVerres.js). Port en plus, au poids.");
