// Vérifications « vendu en plus » (npm run test-options) — pures, sans navigateur.
import { nomLivraison, ressembleAUneAdresse } from "../../src/lib/nomLivraison.js";
import { optionsArticle, optionsCommande, livraisonCommande } from "../../src/lib/optionsVendues.js";
let n = 0, ko = 0;
const check = (nom, cond) => { n++; if (!cond) { ko++; console.log("❌", nom); } else console.log("✅", nom); };
const has = (opts, re) => opts.some((o) => re.test(`${o.libelle} : ${o.detail}`));

// Carafe + coffret 2 verres + date + sac cadeau
const carafe = optionsArticle({ slug: "carafe-a-whisky-gravee", variantId: "carafe-whisky-gravee", packaging: "Sac cadeau", fields: { mode: "modele", numstyle: "5", prenom: "Stephan", date: "1989", coffret: "2verres" } });
check("carafe : emballage listé comme objet", has(carafe, /Emballage : Sac cadeau/) && carafe.find((o) => /Emballage/.test(o.libelle)).physique);
check("carafe : coffret 2 verres = objet, +35,80 €", (() => { const o = carafe.find((x) => /Coffret/i.test(x.libelle)); return o && o.physique && Math.abs(o.montant - 35.8) < 0.01 && /2 verres/.test(o.detail); })());
check("carafe : date +3 €, pas un objet", (() => { const o = carafe.find((x) => /Date/.test(x.libelle)); return o && !o.physique && o.montant === 3 && /1989/.test(o.detail); })());
check("carafe sans rien : aucune option", optionsArticle({ slug: "carafe-a-whisky-gravee", fields: { mode: "modele", numstyle: "29" } }).length === 0);

// Cristal vertical avec socle LED (prix selon la taille)
const cv = optionsArticle({ slug: "cristal-photo-3d-vertical", variantId: "cristal-v-petit", fields: { socle: "oui", photo: "/api/img/x" } });
check("cristal petit + socle : objet à 14,90 €", (() => { const o = cv.find((x) => /socle/i.test(x.libelle)); return o && o.physique && Math.abs(o.montant - 14.9) < 0.01; })());

// Bijou recto/verso (+3 € la face)
const bijou = optionsArticle({ slug: "collier-double-coeur", fields: { recto: "Léa", verso: "12.06.24" } });
check("bijou recto + verso : 2 lignes à +3 €", bijou.filter((o) => o.montant === 3).length === 2 && has(bijou, /« Léa »/) && has(bijou, /12\.06\.24/));

// Verre à whisky : gravure face + fond (+7 €)
const whisky = optionsArticle({ slug: "verre-a-whisky-grave", fields: { emplacement: "deux", texte: "Papa" } });
check("whisky face+fond : +7 € listé, texte +3 €", (() => { const d = whisky.find((x) => x.montant === 7); const t = whisky.find((x) => x.montant === 3); return d && t; })());

// Commande complète : appariement des lignes + livraison express
const order = {
  shippingMethod: "Express Chronopost — 24/48 h après confection", relaisPoint: "",
  items: [{ name: "Carafe à whisky gravée", slug: "carafe-a-whisky-gravee", quantity: 2, total: 109.8 }, { name: "Vieux produit", details: "Lot de 2 — Emballage : Boîte cadeau — Personnalisation : x", quantity: 1, total: 20 }],
  spec: [{ slug: "carafe-a-whisky-gravee", name: "Carafe", variantTitle: "Carafe gravée", packaging: "Sac cadeau", fields: { mode: "lettre", lettreFleurie: "S", coffret: "4verres" } }],
};
const oc = optionsCommande(order);
check("commande : 2 articles, le 1er apparié à ses réglages", oc.articles.length === 2 && !oc.articles[0].sansReglages && oc.articles[0].quantite === 2);
check("commande : coffret 4 verres +71,60 € sur l'article 1", oc.articles[0].options.some((o) => Math.abs(o.montant - 71.6) < 0.01));
check("commande : ligne sans réglages → emballage relu dans la description Stripe", oc.articles[1].sansReglages && oc.articles[1].options.some((o) => /Boîte cadeau/.test(o.detail) && o.physique));
check("livraison express détectée", oc.livraison.express === true && livraisonCommande({ shippingMethod: "Livraison à domicile" }).express === false);
check("point relais prioritaire dans le texte", livraisonCommande({ shippingMethod: "Point relais", relaisPoint: "Mondial Relay — Tabac du centre" }).texte.includes("Tabac"));
check("commande vide : rien ne casse", optionsCommande({}).articles.length === 0 && optionsCommande(null).nbOptions === 0);

// Nom de livraison (incident 0GTB1LZ5 : adresse tapée dans le champ « nom »)
check("adresse reconnue comme adresse", ressembleAUneAdresse("23quater avenue du president coty les manoirs de la cote app D15"));
check("vrais noms jamais pris pour une adresse", !ressembleAUneAdresse("Lorenzo Franchi") && !ressembleAUneAdresse("Marie-Claire Dupont") && !ressembleAUneAdresse("Jean de la Rue"));
check("0GTB1LZ5 : prénom Lorenzo / nom Franchi (correction connue)", (() => { const r = nomLivraison({ ref: "0GTB1LZ5", shippingName: "23quater avenue du president coty les manoirs de la cote app D15" }); return r.prenom === "Lorenzo" && r.nom === "Franchi" && !r.suspect; })());
check("devis : on prend le nom du devis si le champ nom est une adresse", (() => { const r = nomLivraison({ ref: "ZZZ", shippingName: "12 rue des Lilas", quoteClientName: "Anne Martin" }); return r.complet === "Anne Martin" && r.source === "nom du devis"; })());
check("adresse sans aucun nom de repli : gardée mais signalée", nomLivraison({ ref: "ZZZ", shippingName: "12 rue des Lilas" }).suspect === true);
check("commande normale inchangée", (() => { const r = nomLivraison({ shippingName: "Sophie Berardo" }); return r.prenom === "Sophie" && r.nom === "Berardo" && !r.suspect; })());

console.log(`\n${n - ko}/${n} vérifications au vert`);
process.exit(ko ? 1 : 0);
