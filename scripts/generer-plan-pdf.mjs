#!/usr/bin/env node
// =============================================================================
// generer-plan-pdf.mjs  ◆  Génère le PLAN de la plateforme en PDF illustré
// =============================================================================
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SORTIE = "docs/REVENDRE-SITES/pdf";
mkdirSync(SORTIE, { recursive: true });

const OR = "#a98935", OR_FONCE = "#8a6f2b", CREME = "#faf6ee", ENCRE = "#2b2620";

// Schéma : votre application au centre, reliée à 5 briques autour.
const schema = `<svg viewBox="0 0 480 300" width="440" height="275">
  ${[
    ["Domaines", 40, 30], ["Hébergement", 330, 30], ["Paiements", 15, 152],
    ["Inscriptions", 355, 152], ["Abonnements", 185, 256],
  ].map(([t, x, y]) => `
    <line x1="240" y1="150" x2="${x + 55}" y2="${y + 18}" stroke="${OR}" stroke-width="2" opacity=".5"/>
    <rect x="${x}" y="${y}" width="110" height="36" rx="18" fill="#fff" stroke="${OR}" stroke-width="2"/>
    <text x="${x + 55}" y="${y + 23}" font-size="13" fill="${OR_FONCE}" text-anchor="middle" font-family="Arial">${t}</text>
  `).join("")}
  <circle cx="240" cy="150" r="58" fill="${OR}"/>
  <text x="240" y="144" font-size="14" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="bold">VOTRE</text>
  <text x="240" y="162" font-size="14" fill="#fff" text-anchor="middle" font-family="Arial" font-weight="bold">APPLICATION</text>
</svg>`;

// Frise des 5 phases.
function phase(n, titre, txt, couleur) {
  return `<div class="ph"><div class="ph-n" style="background:${couleur}">${n}</div>
    <div><h3>${titre}</h3><p>${txt}</p></div></div>`;
}

const HTML = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>
  @page { margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: ${ENCRE}; margin: 0; font-size: 12pt; line-height: 1.6; }
  .page { padding: 38px 46px; }
  .cover { background: linear-gradient(160deg, ${CREME} 0%, #f0e6cd 100%); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 100vh; page-break-after: always; padding: 0 50px; }
  .cover h1 { font-size: 27pt; color: ${OR_FONCE}; margin: 14px 0 6px; line-height: 1.2; }
  .cover .sub { font-size: 13pt; color: #6b6253; }
  .cover .pas { font-size: 11pt; color: ${OR_FONCE}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
  h2 { color: ${OR_FONCE}; font-size: 17pt; margin: 6px 0 12px; padding-bottom: 8px; border-bottom: 3px solid ${OR}; }
  h3 { font-size: 12.5pt; margin: 0 0 3px; }
  .lead { font-size: 12.5pt; color: #5c5345; }
  .ok { background: #eef7e9; border: 1px solid #9ccb86; border-radius: 10px; padding: 14px 18px; margin: 14px 0; font-size: 12pt; }
  .ok b { color: #4f7a35; }
  .astuce { background: #fff8e7; border: 1px solid ${OR}; border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: 11pt; }
  .astuce b { color: ${OR_FONCE}; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10.8pt; }
  th { background: ${OR}; color: #fff; text-align: left; padding: 8px 11px; }
  td { border: 1px solid #ece1c8; padding: 8px 11px; }
  tr:nth-child(even) td { background: ${CREME}; }
  .center { text-align: center; }
  .pagebreak { page-break-before: always; }
  .two { display: flex; gap: 14px; margin: 12px 0; }
  .two .col { flex: 1; background: ${CREME}; border: 1px solid #ece1c8; border-radius: 12px; padding: 14px 16px; }
  .two .col h3 { color: ${OR_FONCE}; }
  .ph { display: flex; gap: 14px; align-items: center; background: #fff; border: 1px solid #ece1c8; border-left: 6px solid ${OR}; border-radius: 12px; padding: 12px 16px; margin: 9px 0; page-break-inside: avoid; }
  .ph-n { flex: 0 0 36px; height: 36px; width: 36px; color: #fff; border-radius: 50%; font-size: 16pt; font-weight: bold; display: flex; align-items: center; justify-content: center; }
  .footer { text-align: center; color: #b3a684; font-size: 9pt; margin-top: 26px; }
</style></head><body>

<section class="cover">
  <div class="center">${schema}</div>
  <div class="pas">Le plan, expliqué simplement</div>
  <h1>Votre plateforme pour gérer<br>et vendre des sites</h1>
  <p class="sub">Domaines, inscriptions, abonnements, création de sites — tout piloté depuis une seule application qui est à vous.</p>
</section>

<section class="page">
  <h2>La réponse courte : OUI, c'est possible</h2>
  <p class="lead">Tout ce que vous imaginez existe déjà dans le monde de la technologie. Ce ne sont pas des rêves, ce sont des « briques » connues qu'on assemble :</p>
  <table>
    <tr><th>Ce que vous voulez</th><th>Possible ?</th></tr>
    <tr><td>Acheter un nom de domaine depuis l'application</td><td>✔ Oui</td></tr>
    <tr><td>Créer et mettre un site en ligne d'un seul clic</td><td>✔ Oui</td></tr>
    <tr><td>Inscrire une cliente et lui ouvrir son espace</td><td>✔ Oui</td></tr>
    <tr><td>Encaisser les abonnements chaque mois automatiquement</td><td>✔ Oui</td></tr>
    <tr><td>Tout régler depuis un seul tableau de bord</td><td>✔ Oui</td></tr>
  </table>
  <div class="ok"><b>Bonne nouvelle :</b> vous ne partez pas de zéro. Votre site a déjà un espace d'administration complet, le paiement Stripe branché, et Firebase installé (la base de données et les comptes). On va relier ces morceaux et ajouter l'application qui chapeaute le tout.</div>
</section>

<section class="page pagebreak">
  <h2>À quoi ressemblera votre application</h2>
  <p class="lead">Un seul site privé : votre « centre de commande ». Quand vous vous connectez, vous voyez tout, et vous pilotez tout.</p>
  <div class="center" style="margin:16px 0">${schema}</div>
  <table>
    <tr><th>Vous pouvez…</th><th>Comment ça marche (la « brique »)</th></tr>
    <tr><td>Acheter un domaine</td><td>L'app passe par un vendeur de domaines (OVH, Gandi…) et le configure seule.</td></tr>
    <tr><td>Publier un site d'un clic</td><td>L'app passe par Netlify pour créer et mettre en ligne.</td></tr>
    <tr><td>Gérer les inscriptions</td><td>Firebase (déjà installé) : chaque cliente a son compte.</td></tr>
    <tr><td>Encaisser pour vos clientes</td><td>Stripe Connect : leur argent va chez elles, vous prenez une commission.</td></tr>
    <tr><td>Facturer chaque mois</td><td>Stripe Billing : la facture part toute seule.</td></tr>
  </table>
</section>

<section class="page pagebreak">
  <h2>Deux façons de construire</h2>
  <div class="two">
    <div class="col"><h3>Façon A — Un site par cliente</h3><p>Chaque cliente a sa copie du site, et votre application sert de « télécommande » pour les créer et les suivre.</p><p><b>+</b> Simple, rapide à démarrer.<br><b>–</b> Plus lourd avec beaucoup de clientes.</p></div>
    <div class="col"><h3>Façon B — Une seule grande app</h3><p>Un seul programme fait tourner tous les sites en même temps (le vrai modèle « Shopify »).</p><p><b>+</b> Le plus puissant sur le long terme.<br><b>–</b> Demande de reconstruire le cœur.</p></div>
  </div>
  <div class="astuce"><b>Ma recommandation :</b> commencer par la <b>Façon A</b> (résultats rapides, peu de risques), puis basculer vers la <b>Façon B</b> quand vous aurez assez de clientes. C'est le chemin qu'ont suivi beaucoup de plateformes.</div>
</section>

<section class="page pagebreak">
  <h2>Le plan, étape par étape</h2>
  <p class="lead">On livre <b>une phase à la fois</b>. Chacune fonctionne et rapporte déjà, même si les suivantes ne sont pas encore faites.</p>
  ${phase(1, "Votre tableau de bord", "Une page privée : toutes vos clientes, leurs sites, l'état des abonnements, un accès rapide à chaque admin. Utile immédiatement.", "#6aa84f")}
  ${phase(2, "Les abonnements automatiques", "Stripe facture chaque cliente tous les mois automatiquement. Vos revenus deviennent réguliers.", OR)}
  ${phase(3, "La création de site assistée", "Un bouton « Nouveau site » qui prépare 80 % du site en quelques minutes. Vous produisez beaucoup plus vite.", OR)}
  ${phase(4, "Le domaine automatique", "Depuis l'app, on achète et on branche le domaine de la cliente, sans manipulation technique.", "#c98a2b")}
  ${phase(5, "L'inscription en libre-service", "La cliente s'inscrit seule, choisit sa formule, paie, et son site se crée tout seul. La plateforme complète.", "#b5651d")}
</section>

<section class="page pagebreak">
  <h2>Coûts et délais</h2>
  <p class="lead">Pour construire, votre dépense principale, c'est le temps de développement. Les outils sont presque tous gratuits au départ :</p>
  <table>
    <tr><th>Outil</th><th>Coût</th></tr>
    <tr><td>Firebase (comptes + base)</td><td>Gratuit au début, puis quelques € selon l'usage</td></tr>
    <tr><td>Netlify (hébergement)</td><td>Gratuit au début</td></tr>
    <tr><td>Stripe (paiements + abonnements)</td><td>Pas d'abonnement : une commission par transaction</td></tr>
    <tr><td>Domaines (OVH, Gandi…)</td><td>~10–15 € / domaine / an (payé par la cliente)</td></tr>
  </table>
  <div class="astuce"><b>Délais, honnêtement :</b> la Phase 1 est rapide (quelques sessions). Les Phases 2 à 4 sont moyennes. La Phase 5 (plateforme complète) est la plus longue — on la garde pour la fin. Le secret : avancer par petits pas qui marchent.</div>
  <h2 style="margin-top:24px">Ma recommandation</h2>
  ${phase(1, "On commence par le tableau de bord", "Utile tout de suite, aucun risque pour vos sites existants.", "#6aa84f")}
  ${phase(2, "On ajoute les abonnements", "Dès que vous avez 1–2 clientes qui paient.", OR)}
  ${phase(3, "On continue phase par phase", "À votre rythme et selon vos besoins réels.", OR)}
  <p class="footer">Plan plateforme — Vous n'avez pas à tout décider maintenant. On construit la première marche, vous voyez le résultat, et on décide ensemble de la suite.</p>
</section>

</body></html>`;

const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const p = await b.newPage();
await p.setContent(HTML, { waitUntil: "networkidle0" });
const chemin = join(SORTIE, "PLAN-PLATEFORME.pdf");
await p.pdf({ path: chemin, format: "A4", printBackground: true });
await b.close();
console.log("✓ PDF généré : " + chemin);
