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

// Personnalisation par type + ville (26/09/2026, demande du gérant).
const mCocktail = messageProspect("Cactus Bar", { type: "Bar à cocktails", ville: "Lyon" });
ok(mCocktail.includes("verres à cocktail") && mCocktail.includes("à Lyon"), "type cocktail + ville reprises");
const mVin = messageProspect("Cave des Arceaux", { type: "Caviste / bar à vins", ville: "Montpellier" });
ok(mVin.includes("verres à vin") && mVin.includes("à Montpellier"), "type vin/caviste + ville reprises");
const mResto = messageProspect("Le Bistro du Sommelier", { type: "Bistrot", ville: "Bordeaux" });
ok(mResto.includes("servis à table") && mResto.includes("à Bordeaux"), "type restaurant/bistrot + ville reprises");
const mMixte = messageProspect("Neta", { type: "Restaurant et bar à cocktails", ville: "Bordeaux" });
ok(mMixte.includes("verres à cocktail"), "type mixte → priorité cocktail");
const mSansVille = messageProspect("X", { type: "Bar à cocktails" });
ok(!/\bà\s*,|\bà\s*\./.test(mSansVille) && !mSansVille.includes(" à de graver"), "sans ville : pas de trou dans la phrase");
const mSansType = messageProspect("X", { ville: "Nice" });
ok(mSansType.includes("à Nice") && mSansType.includes("bars et aux restaurants"), "sans type : texte générique + ville");

// Lot 2 (26/09/2026, demande « trouve encore plus d'établissements »).
const { PROSPECTS_LOT2 } = await import("../../src/lib/prospects.js");
ok(PROSPECTS_LOT2.length >= 80, `lot 2 : au moins 80 adresses (${PROSPECTS_LOT2.length})`);
ok(new Set(PROSPECTS_LOT2.map((p) => p.email)).size === PROSPECTS_LOT2.length, "lot 2 : aucun doublon interne");
const emails1 = new Set(PROSPECTS_LOT1.map((p) => p.email));
ok(!PROSPECTS_LOT2.some((p) => emails1.has(p.email)), "lot 1 et lot 2 : aucune adresse en commun");
ok(PROSPECTS_LOT2.every((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) && p.ville && p.name), "lot 2 : e-mail, ville, nom présents partout");

// Détection des avis de non-distribution (bounces) — incident du 26/09/2026 :
// 3 adresses mortes comptées à tort comme « a répondu ».
const { estAvisNonDistribution } = await import("../../src/lib/prospects.js");
ok(estAvisNonDistribution("mailer-daemon@googlemail.com"), "bounce Google reconnu");
ok(estAvisNonDistribution("postmaster@free.fr"), "postmaster reconnu");
ok(!estAvisNonDistribution("contact@cactusbar.fr"), "une vraie adresse n'est jamais un bounce");
ok(!estAvisNonDistribution("mailerdaemonpro@gmail.com"), "faux positif évité (pas d'arobase juste après)");

// Lot 3 (26/09/2026).
const { PROSPECTS_LOT3 } = await import("../../src/lib/prospects.js");
ok(PROSPECTS_LOT3.length >= 80, `lot 3 : au moins 80 adresses (${PROSPECTS_LOT3.length})`);
ok(new Set(PROSPECTS_LOT3.map((p) => p.email)).size === PROSPECTS_LOT3.length, "lot 3 : aucun doublon interne");
const emailsPrecedents = new Set([...PROSPECTS_LOT1, ...PROSPECTS_LOT2].map((p) => p.email));
ok(!PROSPECTS_LOT3.some((p) => emailsPrecedents.has(p.email)), "lot 3 : aucune adresse déjà dans les lots 1/2");
ok(PROSPECTS_LOT3.every((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) && p.ville && p.name), "lot 3 : e-mail, ville, nom présents partout");

// Lots 4, 5, 6 (26/09/2026, « et aussi dans des petites villes »).
const { PROSPECTS_LOT4, PROSPECTS_LOT5, PROSPECTS_LOT6 } = await import("../../src/lib/prospects.js");
for (const [nom, lot] of [["4", PROSPECTS_LOT4], ["5", PROSPECTS_LOT5], ["6", PROSPECTS_LOT6]]) {
  ok(lot.length > 0, `lot ${nom} : non vide (${lot.length})`);
  ok(new Set(lot.map((p) => p.email)).size === lot.length, `lot ${nom} : aucun doublon interne`);
  ok(lot.every((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) && p.ville && p.name), `lot ${nom} : e-mail, ville, nom présents partout`);
}
const emailsAvant = new Set([...PROSPECTS_LOT1, ...PROSPECTS_LOT2, ...PROSPECTS_LOT3].map((p) => p.email));
const emails456 = [...PROSPECTS_LOT4, ...PROSPECTS_LOT5, ...PROSPECTS_LOT6].map((p) => p.email);
ok(!emails456.some((e) => emailsAvant.has(e)), "lots 4/5/6 : aucune adresse déjà dans les lots 1/2/3");
ok(new Set(emails456).size === emails456.length, "lots 4/5/6 : aucun doublon entre eux");
console.log(`✔ ${n} vérifications au vert`);
