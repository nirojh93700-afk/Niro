// Validation du moteur d'analyse sur des cas réalistes (arnaques FR + messages légitimes).
// node verify.mjs  → doit afficher "TOUS LES TESTS PASSENT".
import { analyzeSMS, classifyNumber, Level } from "./engine.mjs";

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}  (obtenu: ${got}${ok ? "" : `, attendu: ${want}`})`);
}

console.log("── SMS frauduleux (doivent être FRAUD) ──");
const frauds = [
  ["36930", "Votre colis est en attente de livraison. Réglez les frais de douane: http://colissimo-suivi.xyz/pay"],
  ["+33712345678", "AMELI: votre carte vitale expire. Mettez à jour vos informations sous 24h: https://ameli-fr.top/maj"],
  ["Info", "IMPOTS: vous avez droit à un remboursement fiscal de 258€. Cliquez ici: https://impots-remboursement.icu"],
  ["06 11 22 33 44", "CPF: vos droits formation vont expirer. Confirmez immédiatement sur https://mon-compte-cpf.buzz"],
  ["38200", "Chronopost: adresse incomplète. Réexpédition, veuillez cliquer: https://bit.ly/xk29a"],
  ["Banque", "Opération suspecte sur votre carte bancaire. Confirmez votre code confidentiel: http://secure-boursorama.online"],
  ["ANTAI", "Amende impayée. Dernier avertissement avant majoration. Régularisez: https://antai-paiement.click"],
];
for (const [s, b] of frauds) {
  const v = analyzeSMS(s, b);
  check(`fraude "${b.slice(0, 32)}…"`, v.level, Level.FRAUD);
}

console.log("\n── SMS légitimes (doivent être SAFE) ──");
const legit = [
  ["Free Mobile", "Votre code de vérification est 481920. Ne le communiquez à personne."],
  ["La Poste", "Votre colis sera livré demain entre 9h et 12h. Suivi: https://www.laposte.fr/suivi"],
  ["31337", "Votre code de confirmation est 220044."],
  ["Maman", "Tu peux passer acheter du pain en rentrant ? Merci"],
];
for (const [s, b] of legit) {
  const v = analyzeSMS(s, b);
  check(`légitime "${b.slice(0, 32)}…"`, v.level, Level.SAFE);
}

console.log("\n── Numéros ──");
check("démarchage ARCEP 0162", classifyNumber("0162345678").label, "Démarchage (ARCEP)");
check("démarchage ARCEP 09 48", classifyNumber("09 48 12 34 56").label, "Démarchage (ARCEP)");
check("surtaxé 0899", classifyNumber("0899701234").label, "Numéro surtaxé");
check("mobile normal 0612", classifyNumber("0612345678").level, Level.SAFE);
check("liste blanche", classifyNumber("0612345678", { allowlist: ["0612345678"] }).level, Level.SAFE);
check("liste noire", classifyNumber("0612345678", { blocklist: ["06 12 34 56 78"] }).level, Level.FRAUD);
check("masqué", classifyNumber("").level, Level.SUSPECT);

console.log(`\n${fail === 0 ? "✅ TOUS LES TESTS PASSENT" : "❌ ÉCHECS"} — ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
