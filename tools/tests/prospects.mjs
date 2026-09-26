// Vérifications de la logique « Restaurants & bars » (npm run test-prospects).
import assert from "node:assert/strict";
import { trouverProspect, demandeStop, lireListe, messageProspect, PROSPECTS_LOT1, TARIFS_PRO } from "../../src/lib/prospects.js";

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const P = {
  "contact@cactusbar.fr": { threadIds: ["t-cactus"] },
  "baraupassage@gmail.com": { threadIds: ["t-passage"] },
};
ok(trouverProspect(P, { email: "Contact@CactusBar.fr " }) === "contact@cactusbar.fr", "adresse exacte, casse/espaces");
ok(trouverProspect(P, { email: "patron@hotmail.com", threadId: "t-passage" }) === "baraupassage@gmail.com", "même fil Gmail depuis une autre boîte");
ok(trouverProspect(P, { email: "direction@cactusbar.fr" }) === "contact@cactusbar.fr", "même domaine professionnel");
ok(trouverProspect(P, { email: "autre@gmail.com" }) === "", "jamais par domaine Gmail");
ok(trouverProspect(P, { email: "cliente@orange.fr", threadId: "autre" }) === "", "une cliente n'est pas un prospect");
ok(trouverProspect({}, { email: "x@y.fr" }) === "", "liste vide");

ok(demandeStop("STOP"), "STOP seul");
ok(demandeStop("  stop merci"), "stop en minuscules");
ok(demandeStop("Bonjour,\nSTOP\nCordialement"), "STOP seul sur sa ligne");
ok(!demandeStop("Bonjour, pas de stop pour nous, on veut un devis"), "le mot stop dans une phrase");
ok(demandeStop("Merci de nous désinscrire de votre liste"), "désinscrire");
ok(demandeStop("Je ne souhaite plus recevoir vos messages"), "ne plus recevoir");
ok(demandeStop("Retirez notre adresse de votre fichier svp"), "retirez notre adresse");
ok(!demandeStop("Bonjour, combien pour 24 verres à cocktail avec notre logo ?"), "vraie demande ≠ STOP");
ok(!demandeStop("On ne s'arrête jamais, envoyez vos tarifs"), "pas de faux positif");
ok(!demandeStop("Bonjour\n\n> Si vous ne souhaitez plus recevoir de message de notre part, répondez STOP".replace(/^/, "Intéressés, merci ! ")), "notre mention citée plus bas ne compte pas");

const l1 = lireListe("ville;etablissement;type;email;source\nLyon;Mon Bar;Bar;contact@monbar.fr;https://monbar.fr\nParis;Sans mail;Bar;;");
ok(l1.length === 1 && l1[0].name === "Mon Bar" && l1[0].ville === "Lyon" && l1[0].source === "https://monbar.fr", "CSV avec en-tête");
const l2 = lireListe("Nice\tLa Shounga\tcontact@shounga.bar");
ok(l2.length === 1 && l2[0].email === "contact@shounga.bar" && l2[0].name === "La Shounga", "tabulations sans en-tête");
ok(lireListe("").length === 0, "texte vide");

ok(PROSPECTS_LOT1.length === 30 && new Set(PROSPECTS_LOT1.map((p) => p.email)).size === 30, "lot 1 : 30 adresses distinctes");
const m = messageProspect("Cactus Bar");
ok(m.includes("l'équipe de Cactus Bar") && m.includes("6 rue d'Armaillé") && m.includes("STOP"), "message : nom, adresse, STOP");
ok(messageProspect("Le Bistro du Sommelier").includes("l'équipe du Bistro du Sommelier") && messageProspect("Les Luschtig").includes("l'équipe des Luschtig") && messageProspect("La Shounga").includes("l'équipe de La Shounga"), "message : du / des / de");
ok(!/SIRET|€|\d+,\d0/.test(m), "message : ni SIRET ni prix");
ok(!/aussit[oô]t|au plus vite|rapidement|laser|machine|aper[çc]u/i.test(m), "message : aucune promesse de délai ni d'aperçu, pas de machine");
ok(TARIFS_PRO.every((t) => t.des24 < t.des12), "tarifs : dégressifs");
console.log(`✔ ${n} vérifications au vert`);
