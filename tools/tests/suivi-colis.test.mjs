// Lien de suivi des colis (14/10/2026). `npm run test-suivi`.
import { lienSuivi, estNumeroLaPoste } from "@/lib/suiviColis";
let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log("✗", m); } };
v(estNumeroLaPoste("1L01234567890"), "lettre suivie reconnue");
v(estNumeroLaPoste("6A 1234 5678 901"), "Colissimo avec espaces reconnu");
v(estNumeroLaPoste("ll123456789fr"), "format international en minuscules reconnu");
v(!estNumeroLaPoste("12345678"), "Mondial Relay (8 chiffres) : pas La Poste");
const l = lienSuivi("6A12345678901");
v(l.nom === "La Poste" && l.url === "https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901", "lien La Poste avec le numéro dedans");
v(lienSuivi("ABC123").nom === "Boxtal", "autre numéro → Boxtal comme avant");
v(lienSuivi("") === null && lienSuivi(null) === null, "pas de numéro → pas de lien");
v(lienSuivi("87001500427259Z").nom === "La Poste", "lettre suivie 14 chiffres + lettre (0ZH3LP9M) → La Poste");
v(lienSuivi("ABC123").autre?.nom === "La Poste", "numéro inconnu : lien La Poste proposé à côté");
v(!lienSuivi("6A12345678901").autre, "numéro La Poste : pas de 2e lien");
console.log(`${ok}/${ok + ko} vérifications au vert`);
if (ko) process.exit(1);

// --- Mondial Relay (26/10/2026, commande 15HSMV8X) ---------------------------------------------
import { lienSuiviClient, estNumeroMondialRelay, codePostalCommande } from "@/lib/suiviColis";
let ok2 = 0, ko2 = 0;
const w = (c, m) => { if (c) ok2++; else { ko2++; console.log("✗", m); } };
const cmd = { tracking: "74550444", shippingMethod: "Point relais Mondial Relay — U EXPRESS, TOURVES",
  relaisPoint: "Mondial Relay — U EXPRESS — AVENUE GAMBETTA — 83170 TOURVES", shippingAddress: { postal_code: "83170", city: "Tourves" } };
w(estNumeroMondialRelay("74550444"), "8 chiffres = Mondial Relay");
w(estNumeroMondialRelay("7455 0444"), "8 chiffres avec espace");
w(!estNumeroMondialRelay("1234567890"), "10 chiffres sans contexte : pas Mondial Relay");
w(estNumeroMondialRelay("1234567890", cmd), "10 chiffres + commande Mondial Relay : oui");
w(codePostalCommande(cmd) === "83170", "code postal lu dans l'adresse");
w(codePostalCommande({ relaisPoint: "Mondial Relay — U EXPRESS — 83170 TOURVES" }) === "83170", "code postal lu dans le point relais à défaut");
const mr = lienSuivi("74550444", cmd);
w(mr.nom === "Mondial Relay" && mr.url === "https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=74550444&codePostal=83170", "Gestion : lien Mondial Relay avec le code postal");
w(!mr.autre, "Mondial Relay reconnu : plus de « suivre sur La Poste » à côté");
w(lienSuivi("74550444").nom === "Mondial Relay" && !lienSuivi("74550444").url.includes("codePostal"), "sans commande : lien Mondial Relay sans code postal");
w(lienSuivi("6A12345678901", cmd).nom === "La Poste", "La Poste prime même sur une commande relais");
w(lienSuivi("ABC123", cmd).nom === "Boxtal" && lienSuivi("ABC123", cmd).autre?.nom === "La Poste", "inconnu : Boxtal + La Poste comme avant");
const cl = lienSuiviClient("74550444", cmd);
w(cl.nom === "Mondial Relay" && cl.url.includes("codePostal=83170"), "cliente : lien Mondial Relay");
w(lienSuiviClient("6A12345678901", cmd).nom === "La Poste", "cliente : lien La Poste");
w(lienSuiviClient("ABC123", cmd).url === "https://parcelsapp.com/fr/tracking/ABC123", "cliente : inconnu → parcelsapp (jamais Boxtal)");
w(lienSuiviClient("", cmd) === null, "cliente : pas de numéro → null");
console.log(`${ok2}/${ok2 + ko2} vérifications Mondial Relay au vert`);
if (ko2) process.exit(1);

// --- Plusieurs colis pour une commande (07/11/2026) ---
const { numerosSuivi, joindreSuivis } = await import("@/lib/suiviColis");
const { shippedEmail } = await import("@/lib/email");
let ok3 = 0, ko3 = 0;
const p3 = (c, m) => { if (c) ok3++; else { ko3++; console.error("✗", m); } };
p3(JSON.stringify(numerosSuivi("6A12345678901")) === '["6A12345678901"]', "un seul numéro : inchangé (anciennes commandes)");
p3(JSON.stringify(numerosSuivi("6A12345678901, 74550444")) === '["6A12345678901","74550444"]', "deux numéros séparés par une virgule");
p3(numerosSuivi("6A12345678901;74550444\n87001500427259Z").length === 3, "point-virgule et retour à la ligne acceptés");
p3(numerosSuivi("6A 1234 5678 901, 6A12345678901").length === 1, "doublon (même numéro avec espaces) retiré");
p3(numerosSuivi("").length === 0 && numerosSuivi(null).length === 0, "vide → aucun numéro");
p3(joindreSuivis(["6A12345678901", " ", "74550444"]) === "6A12345678901, 74550444", "liste du formulaire → texte enregistré");
p3(joindreSuivis("  6A12345678901  ") === "6A12345678901", "un numéro seul reste tel quel");
const m1 = shippedEmail({ ref: "X1", customerName: "Léa Martin", items: [] }, "6A12345678901");
p3(!m1.html.includes("Colis 1") && m1.html.includes("Suivre mon colis"), "e-mail un colis : comme avant");
const m2 = shippedEmail({ ref: "X2", customerName: "Léa Martin", items: [] }, "6A12345678901, 6A12345678902");
p3(m2.html.includes("en <strong>2 colis</strong>") && m2.html.includes("Suivre le colis 1") && m2.html.includes("Suivre le colis 2") && m2.html.includes("6A12345678902"), "e-mail deux colis : un bouton par colis");
console.log(`${ok3}/${ok3 + ko3} vérifications plusieurs colis au vert`);
if (ko3) process.exit(1);
