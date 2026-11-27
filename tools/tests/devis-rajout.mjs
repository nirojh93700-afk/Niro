// Devis de rajout (27/11/2026) : règles pures.
import assert from "node:assert/strict";
import { estRajout, fraisRajout, LIGNE_FRAIS_RAJOUT } from "../../src/lib/devisRajout.js";
import { estLignePort } from "../../src/lib/remiseDevis.js";
import { devisPanierPossible } from "../../src/lib/devisPanier.js";

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(estRajout({ type: "devis", rajout: true, commandeLiee: "1XIZ5BKM" }), "rajout reconnu");
ok(!estRajout({ type: "devis", rajout: true }), "sans commande : pas un rajout");
ok(!estRajout({ type: "devis", commandeLiee: "1XIZ5BKM" }), "complément simple : pas un rajout");
ok(!estRajout({ type: "facture", rajout: true, commandeLiee: "1XIZ5BKM" }), "une facture n'est pas un rajout");
ok(!estRajout(null), "rien");
ok(fraisRajout("1,60") === 1.6 && fraisRajout(1.6) === 1.6, "frais avec virgule ou point");
ok(fraisRajout("") === 0 && fraisRajout(-3) === 0 && fraisRajout("abc") === 0, "frais vides ou faux = 0");
ok(estLignePort(LIGNE_FRAIS_RAJOUT), "la ligne de frais est une ligne de livraison (jamais remisée, pas de choix de livraison)");
ok(!devisPanierPossible({ type: "devis", status: "envoye", rajout: true, commandeLiee: "1XIZ5BKM", items: [{ desc: "Verre", qty: 1, price: 19.9, variantId: "verre-whisky-grave" }] }, new Map()), "pas de panier sur un rajout");
console.log(`devis-rajout : ${n} vérifications OK`);
