// npm run test-date-image — « Mon image contient une date » (26/10/2026) : prix et comparaison case / lecture.
import { products } from "../../src/lib/products.js";
import { prixGravureVerres } from "../../src/lib/prixVerres.js";
import { engravingExtra } from "../../src/lib/engravingPrice.js";
import { ecartDate, idPhoto, lignesAlerteImage } from "../../src/lib/lectureImage.js";
import { consignesGravure } from "../../src/lib/consignesGravure.js";
let ok = 0, ko = 0;
const t = (nom, cond, info = "") => { if (cond) { ok++; console.log("✅", nom); } else { ko++; console.log("✗", nom, info); } };
const P = (s) => products.find((p) => p.slug === s);

const vin = P("verre-a-vin-grave"), lot4 = vin.variants.find((v) => v.id === "verre-vin-4");
t("vin lot de 4 : image seule = 9 €", prixGravureVerres(vin, lot4, 1, { mode: "photo", photo: "/api/img/abcdef" }).total === 9);
t("vin lot de 4 : image + date de l'image = 18 € (comme Doriane)", prixGravureVerres(vin, lot4, 1, { mode: "photo", photo: "/api/img/abcdef", dateImage: "oui" }).total === 18);
const unite = vin.variants.find((v) => v.id === "verre-vin-1");
t("vin à l'unité : image + date de l'image = 3 €", prixGravureVerres(vin, unite, 1, { mode: "photo", photo: "/api/img/abcdef", dateImage: "oui" }).total === 3);
for (const s of ["verre-a-whisky-grave", "verre-a-cocktail-grave", "flute-a-champagne-gravee", "carafe-a-whisky-gravee"]) {
  const p = P(s);
  t(`${s} : la case existe et coûte 3 €`, p.personalizationFields.some((f) => f.key === "dateImage" && f.type === "imageDate" && f.photoKey === "photo")
    && engravingExtra(p, { dateImage: "oui" }).amount === 3);
}
const wh = P("verre-a-whisky-grave");
t("whisky : date dans l'image du fond = 3 €", engravingExtra(wh, { dateImageFond: "oui" }).amount === 3);
t("whisky : case vide = 0 €", engravingExtra(wh, { dateImage: "" }).amount === 0);

t("comparaison : date vue, case non cochée = oubli", ecartDate(false, { verifiee: true, date: "12.06.2027", certain: true })?.type === "oubli");
t("comparaison : date vue, pas sûre, non cochée = doute", ecartDate(false, { verifiee: true, date: "2027", certain: false })?.type === "doute");
t("comparaison : date vue et cochée = rien", ecartDate(true, { verifiee: true, date: "12.06.2027", certain: true }) === null);
t("comparaison : rien vu, rien coché = rien", ecartDate(false, { verifiee: true, date: "", certain: true }) === null);
t("comparaison : cochée sans date vue = en trop", ecartDate(true, { verifiee: true, date: "" })?.type === "en-trop");
t("comparaison : image non lue = non vérifiée", ecartDate(false, { verifiee: false })?.type === "non-verifiee");
t("adresse : seules les photos du site sont lues", idPhoto("/api/img/AbC123xyz") === "AbC123xyz" && idPhoto("https://nivcreation.fr/api/img/AbC123xyz") === "AbC123xyz" && idPhoto("https://exemple.com/x.png") === null);
t("ligne d'alerte lisible", /verre 2 \(fond du verre\) : date/.test(lignesAlerteImage([{ nom: "Verre à whisky", verre: 2, cote: "fond du verre", texte: "date « 2027 »" }])[0]));

const c = consignesGravure({ slug: "verre-a-vin-grave", fields: { mode: "photo", photo: "/api/img/abcdef", dateImage: "oui" } });
const tout = JSON.stringify(c);
t("atelier : la date de l'image apparaît dans « À graver »", /date écrite dans l'image/i.test(tout), tout.slice(0, 300));

console.log(`\n${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
