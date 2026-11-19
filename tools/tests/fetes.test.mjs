// 🎄 Fêtes / Noël (29/10/2026) : dates et alertes, carte « Un modèle de Noël » (prix réels de chaque fiche),
// emballages de Noël des bijoux (ce qui rentre, prix, colis, stock), atelier. `npm run test-fetes`.
import { products } from "@/lib/products";
import { prochaineFete, dateFr, configNoel, noelPourProduit, emballagesNoelPourProduit, packagingNoelExtra, champsFicheAvecNoel, categorieEmballage } from "@/lib/fetes";
import { parcoursEtat } from "@/lib/parcoursGuide";
import { prixGravureVerres } from "@/lib/prixVerres";
import { consignesGravure } from "@/lib/consignesGravure";
import { oubliesAtelier } from "@/lib/controleAtelier";
import { optionsArticle } from "@/lib/optionsVendues";

let ok = 0, ko = 0;
const chk = (c, m) => { c ? ok++ : ko++; console.log((c ? "✓ " : "✗ ") + m); };
const ref = new Date(Date.UTC(2026, 9, 29));

// Dates (vérifiées par le calcul, comme la maquette)
const n = prochaineFete("noel", ref);
chk(dateFr(n.date) === "ven. 25 déc. 2026" && dateFr(n.alerte) === "dim. 25 oct. 2026" && n.jours === 57 && n.enAlerte, `Noël ${dateFr(n.date)}, alerte ${dateFr(n.alerte)}, J-${n.jours}`);
chk(dateFr(prochaineFete("paques", ref).date) === "dim. 28 mars 2027", "Pâques 2027 = 28 mars");
chk(dateFr(prochaineFete("meres", ref).date) === "dim. 30 mai 2027", "Fête des mères 2027 = 30 mai");
chk(dateFr(prochaineFete("peres", ref).date) === "dim. 20 juin 2027", "Fête des pères 2027 = 20 juin");
chk(!prochaineFete("valentin", ref).enAlerte, "Saint-Valentin : pas encore d'alerte le 29/10");

// Éteint = rien
const off = configNoel({});
const vin = products.find((p) => p.slug === "verre-a-vin-grave");
chk(!off.on && noelPourProduit(vin, off) === null, "Noël éteint : aucune image sur le verre à vin");
const collier = { ...products.find((p) => p.slug === "collier-coeur-grave"), packaging: { on: true, options: [] } };
chk(emballagesNoelPourProduit(collier, off) === null, "Noël éteint : aucun emballage de Noël sur le collier");

// Allumé
const on = configNoel({ fetes: { noel: { on: true, images: { 8: { masquee: true } }, produits: { "carafe-a-whisky-gravee": false } } } });
const nv = noelPourProduit(vin, on);
chk(nv && nv.images.length === 26 && !nv.images.some((m) => m.n === 8), "allumé : 26 images (n° 8 masquée)");
chk(noelPourProduit(products.find((p) => p.slug === "carafe-a-whisky-gravee"), on) === null, "carafe décochée : pas de Noël");
chk(noelPourProduit(collier, on) === null, "jamais de modèle de Noël sur un bijou");
const whisky = products.find((p) => p.slug === "verre-a-whisky-grave");
const cw = noelPourProduit(whisky, on).champs.map((c) => c.key).join("+");
chk(cw === "texte+texte2", `whisky : champs payés de la fiche (${cw})`);
chk(noelPourProduit(vin, on).champs.map((c) => c.key).join("+") === "prenom+date", "verre à vin : prénom + date");
const fields = champsFicheAvecNoel(vin.personalizationFields, nv);
chk(fields.find((f) => f.key === "mode").options.some((o) => o.value === "noel") && fields.some((f) => f.key === "noelModele"), "fiche : choix « Un modèle de Noël » + n° lisible");

// Parcours + prix (verre 1 : l'image de Noël est offerte, texte et date +3 € chacun)
const vinN = { ...vin, noel: nv, personalizationFields: fields };
const fv = { mode: "noel", noelModele: "7", prenom: "Camille", date: "2026" };
const et = parcoursEtat(vinN, fv);
chk(et.ok && /Modèle de Noël n° 7/.test(et.grav), `état : ${et.grav} · ${et.detail}`);
const v1 = vin.variants.find((v) => v.id === "verre-vin-1");
chk(prixGravureVerres(vinN, v1, 1, { mode: "noel", noelModele: "7" }).total === 0, "Noël n° 7 seul : gravure offerte");
chk(prixGravureVerres(vinN, v1, 1, fv).total === 6, "Noël n° 7 + prénom + date : +6 €");
const v2 = vin.variants.find((v) => v.id === "verre-vin-2");
chk(prixGravureVerres(vinN, v2, 1, { mode: "noel", noelModele: "7", prenom: "Léa" }).total === 8, "lot de 2 identiques, image + prénom : 3 + 5 = 8 €");

// Atelier
const item = { slug: "verre-a-vin-grave", variantTitle: "À l'unité", fields: fv };
const c = consignesGravure(item);
const g = c.general.find((x) => x.k === "Modèle de Noël");
chk(g && /Noël n° 7 — Couronne/.test(g.v) && /noel-07/.test(g.img || ""), `atelier : ${g?.v} (vignette ${g?.img})`);
chk(oubliesAtelier(item).length === 0, "atelier : rien de caché (n° de Noël, prénom, date)");

// Emballages de Noël
const col = { ...collier, packagingNoel: emballagesNoelPourProduit(collier, on) };
chk(categorieEmballage([]) === "seul" && categorieEmballage(["boite-carree"]) === "carree" && categorieEmballage(["pack-collier"]) === "pack" && categorieEmballage(["sac"]) === "sac", "catégories d'emballage habituel");
const pk = packagingNoelExtra(col, { id: "pack", couleur: "bleu" }, []);
chk(pk.amount === 7.9 && pk.colis && pk.stockIds.join(",") === "noel-ruban,noel-sac,noel-etiquette" && /bleu nuit/.test(pk.label), `pack bleu : +${pk.amount} €, colis, stock ${pk.stockIds.join(",")}`);
chk(packagingNoelExtra(col, { id: "pack" }, ["boite-carree"]).amount === 0, "pack + boîte carrée : ne rentre pas → rien facturé");
const sc = packagingNoelExtra(col, { id: "sac" }, ["boite-carree"]);
chk(sc.amount === 4.9 && !sc.colis, "boîte carrée dans le sac de Noël : +4,90 €");
chk(packagingNoelExtra(col, { id: "sachet" }, []).weight === 5 && !packagingNoelExtra(col, { id: "sachet" }, []).colis, "sachet : lettre suivie, 5 g");
const reg = configNoel({ fetes: { noel: { on: true, emballages: { sac: { prix: 5.9, fit: { allongee: true } } } } } });
const col2 = { ...collier, packagingNoel: emballagesNoelPourProduit(collier, reg) };
chk(packagingNoelExtra(col2, { id: "sac" }, ["boite-allongee"]).amount === 5.9, "prix et « convient si » réglés dans Gestion : suivis");
const ov = optionsArticle({ slug: "collier-coeur-grave", fields: {}, packagingNoel: "Pack de Noël · bleu nuit" });
chk(ov.some((o) => /Emballage de Noël/.test(o.libelle) && /Merry Christmas/.test(o.detail)), "« Vendu en plus » : emballage de Noël + étiquette");

console.log(`\n${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
