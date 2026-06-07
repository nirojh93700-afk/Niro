#!/usr/bin/env node
// =============================================================================
// generer-guide-pdf.mjs  ◆  Génère LE guide débutant illustré (PDF)
// =============================================================================
// Un seul document, visuel, pas-à-pas, avec des illustrations (SVG) intégrées.
// Rendu via Chromium (puppeteer) pour un PDF fidèle et joli.
// Utilisation : node scripts/generer-guide-pdf.mjs
// =============================================================================

import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SORTIE = "docs/REVENDRE-SITES/pdf";
mkdirSync(SORTIE, { recursive: true });

// ---- Couleurs de la charte --------------------------------------------------
const OR = "#a98935";
const OR_FONCE = "#8a6f2b";
const CREME = "#faf6ee";
const ENCRE = "#2b2620";

// ---- Petites illustrations SVG (simples, amicales) --------------------------
const ico = {
  panneau: `<svg viewBox="0 0 80 80" width="64" height="64"><rect x="34" y="40" width="6" height="34" fill="#9c8a6a"/><rect x="14" y="16" width="52" height="30" rx="4" fill="${CREME}" stroke="${OR}" stroke-width="3"/><text x="40" y="36" font-size="13" fill="${OR_FONCE}" text-anchor="middle" font-family="Arial" font-weight="bold">.fr</text></svg>`,
  maison: `<svg viewBox="0 0 80 80" width="64" height="64"><path d="M40 14 L70 38 H62 V68 H18 V38 H10 Z" fill="${CREME}" stroke="${OR}" stroke-width="3" stroke-linejoin="round"/><rect x="34" y="48" width="12" height="20" fill="${OR}"/><rect x="24" y="44" width="9" height="9" fill="${OR}" opacity=".6"/><rect x="47" y="44" width="9" height="9" fill="${OR}" opacity=".6"/></svg>`,
  carte: `<svg viewBox="0 0 80 80" width="64" height="64"><rect x="12" y="26" width="56" height="36" rx="5" fill="${CREME}" stroke="${OR}" stroke-width="3"/><rect x="12" y="34" width="56" height="8" fill="${OR}"/><rect x="20" y="50" width="20" height="5" rx="2" fill="${OR}" opacity=".6"/></svg>`,
  enveloppe: `<svg viewBox="0 0 80 80" width="64" height="64"><rect x="12" y="22" width="56" height="38" rx="4" fill="${CREME}" stroke="${OR}" stroke-width="3"/><path d="M14 26 L40 46 L66 26" fill="none" stroke="${OR}" stroke-width="3"/></svg>`,
  discussion: `<svg viewBox="0 0 80 80" width="56" height="56"><rect x="10" y="16" width="42" height="30" rx="6" fill="${CREME}" stroke="${OR}" stroke-width="3"/><path d="M22 46 l0 8 l10 -8" fill="${CREME}" stroke="${OR}" stroke-width="3" stroke-linejoin="round"/><rect x="30" y="34" width="40" height="26" rx="6" fill="${OR}" opacity=".15" stroke="${OR}" stroke-width="3"/></svg>`,
  acompte: `<svg viewBox="0 0 80 80" width="56" height="56"><circle cx="32" cy="40" r="16" fill="${CREME}" stroke="${OR}" stroke-width="3"/><text x="32" y="46" font-size="18" fill="${OR_FONCE}" text-anchor="middle" font-family="Arial" font-weight="bold">€</text><circle cx="50" cy="40" r="16" fill="${OR}" opacity=".25" stroke="${OR}" stroke-width="3"/></svg>`,
  outils: `<svg viewBox="0 0 80 80" width="56" height="56"><path d="M30 22 a10 10 0 1 0 8 16 l16 16 6 -6 -16 -16 a10 10 0 0 0 -14 -10z" fill="${CREME}" stroke="${OR}" stroke-width="3" stroke-linejoin="round"/></svg>`,
  cle: `<svg viewBox="0 0 80 80" width="56" height="56"><circle cx="28" cy="32" r="12" fill="none" stroke="${OR}" stroke-width="3"/><path d="M37 41 L60 64 M54 58 l6 -6 M48 52 l6 -6" stroke="${OR}" stroke-width="3" fill="none"/></svg>`,
  oeil: `<svg viewBox="0 0 80 80" width="56" height="56"><path d="M12 40 q28 -24 56 0 q-28 24 -56 0z" fill="${CREME}" stroke="${OR}" stroke-width="3"/><circle cx="40" cy="40" r="8" fill="${OR}"/></svg>`,
  fusee: `<svg viewBox="0 0 80 80" width="56" height="56"><path d="M40 12 C52 22 52 40 44 52 H36 C28 40 28 22 40 12z" fill="${CREME}" stroke="${OR}" stroke-width="3"/><circle cx="40" cy="30" r="5" fill="${OR}"/><path d="M36 52 l-6 12 6 -4 6 4 -6 -12" fill="${OR}"/></svg>`,
  argent: `<svg viewBox="0 0 80 80" width="56" height="56"><rect x="14" y="30" width="52" height="28" rx="4" fill="${CREME}" stroke="${OR}" stroke-width="3"/><circle cx="40" cy="44" r="9" fill="none" stroke="${OR}" stroke-width="3"/><text x="40" y="49" font-size="12" fill="${OR_FONCE}" text-anchor="middle" font-family="Arial" font-weight="bold">€</text></svg>`,
  calendrier: `<svg viewBox="0 0 80 80" width="56" height="56"><rect x="14" y="18" width="52" height="48" rx="5" fill="${CREME}" stroke="${OR}" stroke-width="3"/><rect x="14" y="18" width="52" height="14" fill="${OR}"/><circle cx="28" cy="46" r="4" fill="${OR}"/><circle cx="40" cy="46" r="4" fill="${OR}"/><circle cx="52" cy="46" r="4" fill="${OR}"/><circle cx="28" cy="58" r="4" fill="${OR}" opacity=".5"/><circle cx="40" cy="58" r="4" fill="${OR}" opacity=".5"/></svg>`,
};

// Illustration de couverture : une vitrine + un cœur, simple et chaleureuse.
const hero = `<svg viewBox="0 0 320 150" width="280" height="132">
  <rect x="40" y="40" width="240" height="90" rx="8" fill="${CREME}" stroke="${OR}" stroke-width="4"/>
  <path d="M40 40 L60 18 H260 L280 40 Z" fill="${OR}" opacity=".85"/>
  <rect x="64" y="62" width="58" height="48" rx="5" fill="#fff" stroke="${OR}" stroke-width="3"/>
  <rect x="131" y="62" width="58" height="48" rx="5" fill="#fff" stroke="${OR}" stroke-width="3"/>
  <rect x="198" y="62" width="58" height="48" rx="5" fill="#fff" stroke="${OR}" stroke-width="3"/>
  <path d="M160 84 c-4 -6 -14 -3 -14 4 c0 6 14 14 14 14 c0 0 14 -8 14 -14 c0 -7 -10 -10 -14 -4z" fill="${OR}"/>
</svg>`;

// Graphe simple de revenus qui montent (effet boule de neige).
const graphe = `<svg viewBox="0 0 360 160" width="340" height="150">
  <line x1="40" y1="20" x2="40" y2="130" stroke="#cbb98f" stroke-width="2"/>
  <line x1="40" y1="130" x2="340" y2="130" stroke="#cbb98f" stroke-width="2"/>
  ${[
    [70, 70], [130, 60], [190, 48], [250, 34], [310, 20],
  ].map(([x, h]) => `<rect x="${x}" y="${130 - (130 - 40 - h)}" width="34" height="${130 - 40 - h}" rx="3" fill="${OR}" opacity=".85"/>`).join("")}
  <polyline points="87,86 147,70 207,55 267,40 327,28" fill="none" stroke="${OR_FONCE}" stroke-width="3"/>
  <text x="55" y="148" font-size="11" fill="#7a7268" font-family="Arial">Mois 1</text>
  <text x="285" y="148" font-size="11" fill="#7a7268" font-family="Arial">Mois 12</text>
</svg>`;

// ---- Contenu : on construit le HTML ----------------------------------------
function carteEtape(num, icone, titre, texte) {
  return `<div class="etape">
    <div class="num">${num}</div>
    <div class="etape-ico">${icone}</div>
    <div class="etape-txt"><h3>${titre}</h3><p>${texte}</p></div>
  </div>`;
}

function bloc(icone, titre, texte) {
  return `<div class="bloc"><div class="bloc-ico">${icone}</div><div><h3>${titre}</h3>${texte}</div></div>`;
}

const HTML = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>
  @page { margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: ${ENCRE}; margin: 0; font-size: 12pt; line-height: 1.6; }
  .page { padding: 38px 46px; min-height: 100vh; }
  .cover { background: linear-gradient(160deg, ${CREME} 0%, #f3ead4 100%); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 100vh; page-break-after: always; }
  .cover h1 { font-size: 30pt; color: ${OR_FONCE}; margin: 18px 40px 6px; line-height: 1.2; }
  .cover .sub { font-size: 14pt; color: #6b6253; margin: 0 50px; }
  .cover .pas { margin-top: 22px; font-size: 12pt; color: ${OR_FONCE}; letter-spacing: 2px; text-transform: uppercase; }
  h2 { color: ${OR_FONCE}; font-size: 18pt; margin: 8px 0 14px; padding-bottom: 8px; border-bottom: 3px solid ${OR}; }
  h3 { font-size: 13pt; margin: 0 0 4px; color: ${ENCRE}; }
  p { margin: 6px 0; }
  .lead { font-size: 13pt; color: #5c5345; }
  .bloc { display: flex; gap: 16px; align-items: flex-start; background: ${CREME}; border: 1px solid #ece1c8; border-radius: 12px; padding: 16px 18px; margin: 12px 0; }
  .bloc-ico { flex: 0 0 56px; }
  .grid4 { display: flex; gap: 12px; margin: 16px 0; }
  .grid4 .case { flex: 1; background: #fff; border: 1px solid #ece1c8; border-radius: 12px; padding: 14px; text-align: center; }
  .grid4 .case h3 { font-size: 11pt; margin-top: 8px; color: ${OR_FONCE}; }
  .grid4 .case p { font-size: 9.5pt; color: #6b6253; }
  .etape { display: flex; gap: 16px; align-items: center; background: #fff; border: 1px solid #ece1c8; border-left: 6px solid ${OR}; border-radius: 12px; padding: 14px 18px; margin: 10px 0; page-break-inside: avoid; }
  .num { flex: 0 0 40px; height: 40px; width: 40px; background: ${OR}; color: #fff; border-radius: 50%; font-size: 18pt; font-weight: bold; display: flex; align-items: center; justify-content: center; }
  .etape-ico { flex: 0 0 56px; }
  .etape-txt h3 { color: ${OR_FONCE}; }
  .astuce { background: #fff8e7; border: 1px solid ${OR}; border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: 11pt; }
  .astuce b { color: ${OR_FONCE}; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 11pt; }
  th { background: ${OR}; color: #fff; text-align: left; padding: 9px 12px; }
  td { border: 1px solid #ece1c8; padding: 9px 12px; }
  tr:nth-child(even) td { background: ${CREME}; }
  .center { text-align: center; }
  .pagebreak { page-break-before: always; }
  .footer { text-align: center; color: #b3a684; font-size: 9pt; margin-top: 30px; }
</style></head><body>

<!-- COUVERTURE -->
<section class="cover">
  <div class="center">${hero}</div>
  <div class="pas">Guide pas à pas pour débuter</div>
  <h1>Vendre des sites internet</h1>
  <p class="sub">Tout compris, expliqué simplement, avec des images — même si vous n'y connaissez rien.</p>
</section>

<!-- 1. C'EST QUOI -->
<section class="page">
  <h2>1. C'est quoi « vendre un site » ?</h2>
  <p class="lead">Vous savez fabriquer de jolies boutiques en ligne. Quelqu'un qui ne sait pas faire de site vous demande de lui en faire un, et <b>il vous paie pour ça</b>. Vous vendez votre <b>travail</b>, pas un objet.</p>
  ${bloc(ico.argent, "L'argent rentre à deux moments", `<p><b>1. Au départ :</b> on vous paie pour <b>créer</b> le site (ex. 900 €, une seule fois).<br><b>2. Chaque mois (au choix) :</b> on vous paie pour <b>vous occuper</b> du site. C'est l'<b>abonnement</b> (voir page 4).</p>`)}
  <div class="astuce"><b>À retenir :</b> au début vous ne dépensez presque rien. L'adresse et l'hébergement sont payés par votre client, pas par vous.</div>
</section>

<!-- 2. COMPARAISON -->
<section class="page pagebreak">
  <h2>2. Un site, c'est comme une boutique en ville</h2>
  <p class="lead">Pour comprendre les mots techniques, comparons avec une vraie boutique. Un site a besoin de 4 choses :</p>
  <div class="grid4">
    <div class="case">${ico.panneau}<h3>Le nom de domaine</h3><p>L'adresse qu'on tape (ex. boutique-marie.fr). ~12 €/an.</p></div>
    <div class="case">${ico.maison}<h3>L'hébergement</h3><p>Le « local » où le site habite pour être visible. Gratuit (Netlify).</p></div>
    <div class="case">${ico.carte}<h3>Stripe</h3><p>La machine à carte bancaire qui encaisse l'argent.</p></div>
    <div class="case">${ico.enveloppe}<h3>Resend</h3><p>Le « facteur » qui envoie les e-mails de confirmation.</p></div>
  </div>
  <div class="astuce"><b>Le plus important :</b> un site a juste besoin d'une <b>adresse</b> (le domaine) et d'un <b>local</b> (l'hébergement) pour exister sur internet. Le reste, ce sont des outils.</div>
  ${bloc(ico.outils, "Ce qu'il vous faut, vous, pour démarrer", `<p>Un ordinateur, une connexion internet, le modèle de site (vous l'avez déjà), et des comptes <b>gratuits</b> : Netlify, GitHub, Stripe, Resend. C'est tout.</p>`)}
</section>

<!-- 3. LES 8 ETAPES -->
<section class="page pagebreak">
  <h2>3. Le parcours avec un client, pas à pas</h2>
  <p class="lead">De « je discute avec une cliente » jusqu'à « son site est en ligne et elle me paie » :</p>
  ${carteEtape(1, ico.discussion, "Vous discutez", "Qu'est-ce qu'elle vend ? Quelles couleurs ? Combien de produits ? Vous notez tout et vous donnez un prix (ex. 900 €).")}
  ${carteEtape(2, ico.acompte, "Vous demandez un acompte", "On demande souvent la moitié à l'avance (ex. 450 €), le reste à la livraison. C'est normal et rassurant.")}
  ${carteEtape(3, ico.outils, "Vous créez le site", "Vous adaptez le modèle : son nom, ses couleurs, ses produits. L'agent Claude fait le gros du technique pour vous.")}
  ${carteEtape(4, ico.cle, "La cliente crée SES comptes", "Elle crée son propre compte Stripe : ainsi l'argent de ses ventes va directement chez elle, jamais chez vous.")}
  ${carteEtape(5, ico.oeil, "Vous lui montrez", "Vous envoyez un lien de test. Elle regarde, demande des changements, vous ajustez jusqu'à ce qu'elle soit contente.")}
  ${carteEtape(6, ico.fusee, "Mise en ligne", "On achète le nom de domaine et on publie le site. La boutique est ouverte sur internet !")}
  ${carteEtape(7, ico.argent, "Elle vous paie le reste", "La cliente règle le solde. Le site lui appartient.")}
  ${carteEtape(8, ico.calendrier, "Vous proposez l'abonnement", "« Voulez-vous que je m'occupe de votre site chaque mois ? » Les revenus réguliers commencent.")}
</section>

<!-- 4. ABONNEMENT -->
<section class="page pagebreak">
  <h2>4. C'est quoi un « abonnement » ?</h2>
  <p class="lead">Une fois créé, le site <b>ne s'entretient pas tout seul</b>. Il faut le garder en ligne, à jour, sécurisé, ajouter des produits, réparer si besoin. La cliente ne sait pas faire ça&nbsp;: elle vous paie un petit montant <b>chaque mois</b> pour que vous le fassiez. <b>Ça, c'est l'abonnement.</b></p>
  ${bloc(ico.calendrier, "Pourquoi c'est génial pour vous", `<p>Au lieu d'être payée <b>une seule fois</b>, vous êtes payée <b>tous les mois</b>. Avec 10 clientes à 50 €/mois = <b>500 €/mois</b> qui rentrent automatiquement, même sans créer de nouveau site.</p>`)}
  <table>
    <tr><th>Formule</th><th>Prix / mois</th><th>Ce que la cliente reçoit</th></tr>
    <tr><td><b>Sérénité</b></td><td>29 €</td><td>Le site reste en ligne, sauvegardé, à jour et sécurisé.</td></tr>
    <tr><td><b>Active</b></td><td>59 €</td><td>Pareil + vous ajoutez ou modifiez jusqu'à 5 produits par mois.</td></tr>
    <tr><td><b>Premium</b></td><td>99 €</td><td>Produits illimités + petites améliorations + réponse rapide.</td></tr>
  </table>
  <div class="astuce"><b>Revenu récurrent :</b> c'est de l'argent qui rentre chaque mois automatiquement. C'est la base d'une activité solide — l'effet « boule de neige ».</div>
</section>

<!-- 5. COMBIEN CA RAPPORTE -->
<section class="page pagebreak">
  <h2>5. Combien ça peut rapporter ?</h2>
  <p class="lead">Exemple : 1 site par mois à 900 €, en gardant les clientes en abonnement à 50 €/mois. Les revenus mensuels montent tout seuls :</p>
  <div class="center">${graphe}</div>
  <table>
    <tr><th>Moment</th><th>Création</th><th>Abonnements cumulés</th><th>Total du mois</th></tr>
    <tr><td>Mois 1</td><td>900 €</td><td>50 €</td><td><b>950 €</b></td></tr>
    <tr><td>Mois 6</td><td>900 €</td><td>300 €</td><td><b>1 200 €</b></td></tr>
    <tr><td>Mois 12</td><td>900 €</td><td>600 €</td><td><b>1 500 €</b></td></tr>
  </table>
  <div class="astuce"><b>Et les papiers ?</b> Pour facturer en règle, créez le statut <b>auto-entrepreneur</b> (gratuit, 15 min sur autoentrepreneur.urssaf.fr). Si vous l'avez déjà pour votre boutique, il est sûrement réutilisable.</div>
</section>

<!-- 6. PAR OU COMMENCER + GLOSSAIRE -->
<section class="page pagebreak">
  <h2>6. Par où commencer cette semaine ?</h2>
  ${carteEtape(1, ico.discussion, "Trouvez 1 personne", "Une amie créatrice, une commerçante du coin… Proposez-lui un petit prix de lancement en échange d'être votre première référence.")}
  ${carteEtape(2, ico.outils, "Faites son site", "Tranquillement, avec l'aide de l'agent Claude. Votre premier site fait = votre première vitrine pour convaincre les suivants.")}
  ${carteEtape(3, ico.fusee, "Mettez-le en ligne", "Puis montrez-le autour de vous.")}
  ${carteEtape(4, ico.calendrier, "Proposez l'abonnement", "Pour garder un revenu chaque mois.")}

  <h2 style="margin-top:26px">Les mots compliqués, en simple</h2>
  <table>
    <tr><th>Le mot</th><th>Ce que ça veut dire</th></tr>
    <tr><td>Nom de domaine</td><td>L'adresse du site qu'on tape (boutique-marie.fr).</td></tr>
    <tr><td>Hébergement</td><td>L'endroit où le site « habite » pour être visible.</td></tr>
    <tr><td>Netlify</td><td>Le service gratuit qui met le site en ligne.</td></tr>
    <tr><td>GitHub</td><td>Le « coffre-fort » qui garde le code en sécurité.</td></tr>
    <tr><td>Stripe</td><td>La « machine à carte » du site, pour encaisser.</td></tr>
    <tr><td>Déployer</td><td>Publier le site pour qu'il soit visible par tous.</td></tr>
    <tr><td>Abonnement</td><td>Petit paiement mensuel pour entretenir le site.</td></tr>
    <tr><td>Acompte</td><td>Une partie du prix payée à l'avance.</td></tr>
  </table>
  <p class="footer">Guide débutant — Vendre des sites internet · Le plus dur, c'est le premier. Après, tout va plus vite.</p>
</section>

</body></html>`;

const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const p = await b.newPage();
await p.setContent(HTML, { waitUntil: "networkidle0" });
const chemin = join(SORTIE, "GUIDE-DEBUTANT-ILLUSTRE.pdf");
await p.pdf({ path: chemin, format: "A4", printBackground: true });
await b.close();
console.log("✓ PDF généré : " + chemin);
