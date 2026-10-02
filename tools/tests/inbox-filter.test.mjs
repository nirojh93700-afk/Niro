// Filtre de la boîte surveillée : pubs évidentes + expéditeurs marqués « Pub ».
//   node tools/tests/inbox-filter.test.mjs
import { pubEvidente, cleBlocage, expediteurIgnore, aEcarter } from "../../src/lib/inboxFilter.js";
let ok = 0, ko = 0;
const v = (nom, a, b) => { const p = a === b; p ? ok++ : ko++; if (!p) console.log("KO", nom, a, "≠", b); };

// Les vrais expéditeurs vus dans « Messages à traiter » le 02/10/2026
v("metro", pubEvidente("idam@emails.metro.fr"), true);
v("dpd predict", pubEvidente("predict@information.dpd.fr"), true);
v("dpd enquête", pubEvidente("enquetes@voc.dpd.fr"), true);
v("médias", pubEvidente("contact@medias-france.fr"), true);
// Jamais une vraie cliente
v("gmail", pubEvidente("marie.dupont@gmail.com"), false);
v("mail.com", pubEvidente("jean@mail.com"), false);
v("orange", pubEvidente("paul@orange.fr"), false);
// Clé de blocage : domaine pro → tout le domaine ; webmail → l'adresse seule
v("clé pro", cleBlocage("news@boutique-xyz.fr"), "@boutique-xyz.fr");
v("clé gmail", cleBlocage("Spam@Gmail.com"), "spam@gmail.com");
const blocage = { "@boutique-xyz.fr": {}, "spam@gmail.com": {} };
v("domaine bloqué", expediteurIgnore("autre@boutique-xyz.fr", blocage), true);
v("sous-domaine", expediteurIgnore("a@mail.boutique-xyz.fr", blocage), true);
v("adresse gmail bloquée", expediteurIgnore("spam@gmail.com", blocage), true);
v("autre gmail libre", expediteurIgnore("cliente@gmail.com", blocage), false);
v("aEcarter pub", aEcarter("idam@emails.metro.fr", {}), true);
v("aEcarter cliente", aEcarter("cliente@gmail.com", blocage), false);
console.log(`${ok} vérifications OK, ${ko} KO`);
process.exit(ko ? 1 : 0);
