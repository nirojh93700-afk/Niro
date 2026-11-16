// Garde de taille des sections comms / bat (16/11/2026) : npm run test-taille-section
import { reduireSection, octets, LIMITE_SECTION } from "../../src/lib/tailleSection.js";
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) ok++; else { ko++; console.error("✗", nom); } };
const maintenant = Date.UTC(2026, 10, 16);
const long = "x".repeat(3000);
const comms = {};
for (let i = 0; i < 150; i++) {
  comms[`c${i}@ex.fr`] = { name: "C" + i, updatedAt: i, messages: Array.from({ length: 14 }, (_, j) => ({ id: `m${i}-${j}`, from: "cliente", at: maintenant - (j * 10 + 1) * 86400000, text: long })) };
}
comms["olivier@ex.fr"] = { updatedAt: 9e12, messages: [{ id: "p", from: "cliente", at: maintenant - 2 * 86400000, text: long, photos: ["uz0EvfjuBILBqOyA2CLF"] }] };
const avant = JSON.stringify(comms);
t("le jeu d'essai dépasse 1 Mo", octets(comms) > 1_048_576);
const r = reduireSection(comms, { maintenant });
t("réduit", r.reduit);
t("sous la limite", octets(r.valeur) <= LIMITE_SECTION);
t("l'original n'est pas modifié", JSON.stringify(comms) === avant);
t("la photo d'Olivier est gardée", r.valeur["olivier@ex.fr"]?.messages?.[0]?.photos?.[0] === "uz0EvfjuBILBqOyA2CLF");
t("aucun dossier perdu à ce niveau", Object.keys(r.valeur).length === Object.keys(comms).length);
const petit = { "a@b.fr": { messages: [{ text: "bonjour" }] } };
const r2 = reduireSection(petit);
t("petite section intacte", !r2.reduit && r2.valeur === petit);
// Cas extrême : un dossier à image très gros n'empêche pas d'aboutir sous la limite.
const enorme = {};
for (let i = 0; i < 400; i++) enorme[`k${i}`] = { updatedAt: i, messages: Array.from({ length: 300 }, () => ({ at: 1, text: long, image: "/api/img/abcdefgh" })) };
const r3 = reduireSection(enorme, { maintenant });
t("cas extrême sous la limite", octets(r3.valeur) <= LIMITE_SECTION);
t("le dossier le plus récent reste", !!r3.valeur.k399);
console.log(`taille-section : ${ok} ok, ${ko} en échec`);
process.exit(ko ? 1 : 0);
