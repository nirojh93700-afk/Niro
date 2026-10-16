// npm run test-email-typo — adresse e-mail mal tapée (16/10/2026, commande 10OPUHMO « gmail.comn »).
import { suggestionEmail, formeEmailValide } from "../../src/lib/emailTypo.js";
import { verifierEmailCommande } from "../../src/lib/emailTypoServeur.js";
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) ok++; else { ko++; console.log("✗", nom); } };

t("gmail.comn → gmail.com", suggestionEmail("Naulinceline71@gmail.comn") === "Naulinceline71@gmail.com");
t("gmial.com → gmail.com", suggestionEmail("a.b@gmial.com") === "a.b@gmail.com");
t("gmail.con → gmail.com", suggestionEmail("x@gmail.con") === "x@gmail.com");
t("gmail.fr → gmail.com", suggestionEmail("x@gmail.fr") === "x@gmail.com");
t("hotmial.fr → hotmail.fr", suggestionEmail("x@hotmial.fr") === "x@hotmail.fr");
t("orange.f → orange.fr", suggestionEmail("x@orange.f") === "x@orange.fr");
t("yahoo.frr → yahoo.fr", suggestionEmail("x@yahoo.frr") === "x@yahoo.fr");
t("outlok.com → outlook.com", suggestionEmail("x@outlok.com") === "x@outlook.com");
t("icloud.cm → icloud.com", suggestionEmail("x@icloud.cm") === "x@icloud.com");
t("adresse juste : rien", suggestionEmail("x@gmail.com") === null);
t("yahoo.it (vraie) : rien", suggestionEmail("x@yahoo.it") === null);
t("hotmail.be (vraie) : rien", suggestionEmail("x@hotmail.be") === null);
t("domaine pro : rien", suggestionEmail("contact@nivcreation.fr") === null);
t("domaine pro proche d'aucun : rien", suggestionEmail("marie@cabinet-dupont.fr") === null);
t("partie avant @ jamais touchée", suggestionEmail("Jean.Paul+test@gmaill.com") === "Jean.Paul+test@gmail.com");
t("forme invalide", !formeEmailValide("x@gmail") && formeEmailValide("x@gmail.com"));

const r1 = await verifierEmailCommande("Naulinceline71@gmail.comn", async (d) => d === "gmail.com");
t("domaine mort → corrigé automatiquement", r1.email === "naulinceline71@gmail.com" && r1.corrigeeDe === "Naulinceline71@gmail.comn" && /Corrigée/.test(r1.alerte));
const r2 = await verifierEmailCommande("x@gmial.com", async () => true);
t("domaine qui existe → gardé + alerte", r2.email === "x@gmial.com" && !r2.corrigeeDe && /Rien n'a été changé/.test(r2.alerte));
const r3 = await verifierEmailCommande("x@gmail.comn", async () => null);
t("DNS injoignable → rien corrigé", r3.email === "x@gmail.comn" && !r3.corrigeeDe);
const r5 = await verifierEmailCommande("x@gmail.comn", async () => false);
t("DNS qui dit « rien n'existe » → rien corrigé", r5.email === "x@gmail.comn" && !r5.corrigeeDe);
const r4 = await verifierEmailCommande("x@gmail.com", async () => { throw new Error("pas appelé"); });
t("adresse juste → rien, pas de DNS", r4.email === "x@gmail.com" && !r4.alerte);

console.log(`${ok} vérifications au vert, ${ko} en échec`);
if (ko) process.exit(1);
