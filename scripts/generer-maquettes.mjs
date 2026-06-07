#!/usr/bin/env node
// =============================================================================
// generer-maquettes.mjs  ◆  Maquettes de la plateforme + flyer commercial (PNG)
// =============================================================================
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SORTIE = "docs/REVENDRE-SITES/maquettes";
mkdirSync(SORTIE, { recursive: true });

const OR = "#a98935", OR_FONCE = "#8a6f2b", CREME = "#faf6ee", ENCRE = "#26221c";
const FOND = "#f4f5f7", SOMBRE = "#2b2620";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: ${ENCRE}; }
  .app { display: flex; height: 900px; background: ${FOND}; }
  /* Sidebar */
  .side { width: 250px; background: ${SOMBRE}; color: #e9e2d4; padding: 26px 18px; display: flex; flex-direction: column; }
  .logo { display: flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; color: #fff; margin-bottom: 34px; }
  .logo .dot { width: 34px; height: 34px; border-radius: 9px; background: ${OR}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; }
  .nav a { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 10px; color: #cfc6b4; text-decoration: none; font-size: 15px; margin-bottom: 4px; }
  .nav a.on { background: rgba(169,137,53,.22); color: #fff; font-weight: 600; }
  .nav .ic { width: 18px; height: 18px; opacity: .9; }
  .side .foot { margin-top: auto; font-size: 12px; color: #9a917f; }
  /* Main */
  .main { flex: 1; padding: 30px 38px; overflow: hidden; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .top h1 { font-size: 25px; }
  .top .sub { color: #7a7468; font-size: 14px; margin-top: 3px; }
  .pill { background: #fff; border: 1px solid #e3e0d8; border-radius: 30px; padding: 8px 16px; font-size: 14px; color: #5c5648; display: flex; align-items: center; gap: 8px; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: ${OR}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  /* Stat cards */
  .cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-bottom: 26px; }
  .card { background: #fff; border: 1px solid #ebe9e3; border-radius: 16px; padding: 20px; }
  .card .lab { color: #8a8475; font-size: 13px; }
  .card .val { font-size: 30px; font-weight: 700; margin-top: 8px; }
  .card .val small { font-size: 15px; font-weight: 600; color: #9a917f; }
  .card .tag { font-size: 12px; margin-top: 8px; }
  .up { color: #2e7d32; } .warn { color: #c77700; }
  /* Table */
  .panel { background: #fff; border: 1px solid #ebe9e3; border-radius: 16px; padding: 8px 0 4px; }
  .panel h2 { font-size: 16px; padding: 18px 22px 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #9a917f; padding: 10px 22px; border-bottom: 1px solid #efede7; }
  td { padding: 15px 22px; border-bottom: 1px solid #f3f1ec; font-size: 15px; }
  tr:last-child td { border-bottom: none; }
  .shop { display: flex; align-items: center; gap: 12px; font-weight: 600; }
  .shop .sq { width: 36px; height: 36px; border-radius: 9px; background: ${CREME}; border: 1px solid #ece1c8; display: flex; align-items: center; justify-content: center; color: ${OR_FONCE}; font-weight: 700; }
  .dom { color: #7a7468; font-size: 13px; font-weight: 400; }
  .badge { font-size: 12.5px; padding: 5px 11px; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .b-green { background: #e7f5ea; color: #2e7d32; }
  .b-amber { background: #fdf2dd; color: #b9770b; }
  .b-red { background: #fde8e6; color: #c0392b; }
  .b-gray { background: #eef0f2; color: #6b6f76; }
  .dotg { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .btn { background: ${OR}; color: #fff; border: none; border-radius: 9px; padding: 9px 15px; font-size: 14px; font-weight: 600; }
  .btn.ghost { background: #fff; color: ${OR_FONCE}; border: 1px solid ${OR}; }
`;

function sidebar(active) {
  const items = [
    ["Tableau de bord", "▦"],
    ["Mes clientes", "❖"],
    ["Abonnements", "€"],
    ["Surveillance", "◉"],
    ["Réglages", "⚙"],
  ];
  return `<aside class="side">
    <div class="logo"><span class="dot">M</span> Ma Plateforme</div>
    <nav class="nav">
      ${items.map(([t, ic]) => `<a class="${t === active ? "on" : ""}"><span class="ic">${ic}</span>${t}</a>`).join("")}
    </nav>
    <div class="foot">Connectée — Niro<br>Votre espace privé</div>
  </aside>`;
}

function topbar(title, sub) {
  return `<div class="top"><div><h1>${title}</h1><div class="sub">${sub}</div></div>
    <div style="display:flex;gap:12px;align-items:center">
      <div class="pill">◉ 8 sites en ligne</div>
      <div class="avatar">N</div>
    </div></div>`;
}

// ---- Écran 1 : Vue d'ensemble ----------------------------------------------
const ecran1 = `<div class="app">${sidebar("Tableau de bord")}
  <main class="main">
    ${topbar("Bonjour Niro 👋", "Voici l'état de toutes vos boutiques aujourd'hui.")}
    <div class="cards">
      <div class="card"><div class="lab">Sites en ligne</div><div class="val">8</div><div class="tag up">● tous actifs</div></div>
      <div class="card"><div class="lab">Abonnements actifs</div><div class="val">6</div><div class="tag up">+1 ce mois</div></div>
      <div class="card"><div class="lab">Revenus du mois</div><div class="val">1 240<small> €</small></div><div class="tag up">▲ +18 %</div></div>
      <div class="card"><div class="lab">Alertes</div><div class="val">1</div><div class="tag warn">● 1 à valider</div></div>
    </div>
    <div class="panel">
      <h2>Mes clientes</h2>
      <table>
        <tr><th>Boutique</th><th>Site</th><th>Abonnement</th><th>Action</th></tr>
        ${[
          ["B", "Boutique Marie", "boutique-marie.fr", "b-green", "● En ligne", "b-green", "Active — 59 €/mois"],
          ["A", "Atelier du Bois", "atelierdubois.fr", "b-green", "● En ligne", "b-green", "Sérénité — 29 €/mois"],
          ["L", "Savonnerie Lou", "savonnerie-lou.fr", "b-green", "● En ligne", "b-amber", "Paiement en retard"],
          ["C", "Céramique Claire", "ceramique-claire.fr", "b-amber", "● Maintenance", "b-green", "Premium — 99 €/mois"],
          ["F", "Fleurs de Sel", "fleursdesel.fr", "b-gray", "● En préparation", "b-gray", "À configurer"],
        ].map(([i, n, d, sc, st, ac, ab]) => `<tr>
          <td><div class="shop"><span class="sq">${i}</span>${n}</div></td>
          <td><span class="badge ${sc}"><span class="dotg"></span>${st.replace("● ", "")}</span><div class="dom">${d}</div></td>
          <td><span class="badge ${ac}">${ab}</span></td>
          <td><button class="btn ghost">Ouvrir l'admin</button></td>
        </tr>`).join("")}
      </table>
    </div>
  </main></div>`;

// ---- Écran 2 : Fiche cliente + Coffre à clés -------------------------------
const ecran2 = `<div class="app">${sidebar("Mes clientes")}
  <main class="main">
    ${topbar("Boutique Marie", "boutique-marie.fr — cliente depuis mars 2026")}
    <div style="display:flex;gap:10px;margin-bottom:22px">
      ${["Infos", "Clés & secrets", "Apparence", "Produits", "Abonnement"].map((t, i) => `<div class="badge ${i === 1 ? "b-green" : "b-gray"}" style="padding:9px 16px;font-size:14px">${t}</div>`).join("")}
    </div>
    <div class="panel" style="padding:22px 26px">
      <h2 style="padding:0 0 6px">🔒 Coffre à clés — chiffré et sécurisé</h2>
      <p style="color:#7a7468;font-size:14px;margin-bottom:18px">Vous remplissez une fois, l'application s'en sert automatiquement. Vous ne touchez plus à rien.</p>
      ${[
        ["Stripe (paiement)", "sk_live_•••••••••••••••••••• 4Xb2", "b-green", "Connecté"],
        ["Resend (e-mails)", "re_•••••••••••••••••• 9Kp", "b-green", "Connecté"],
        ["Nom de domaine", "boutique-marie.fr — DNS configuré", "b-green", "Actif"],
        ["E-mail professionnel", "contact@boutique-marie.fr", "b-green", "Vérifié"],
        ["Cloudinary (photos)", "non renseigné", "b-amber", "Optionnel"],
      ].map(([n, v, c, s]) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:15px 0;border-bottom:1px solid #f3f1ec">
        <div><div style="font-weight:600;font-size:15px">${n}</div><div style="color:#9a917f;font-size:13px;font-family:monospace;margin-top:4px">${v}</div></div>
        <span class="badge ${c}"><span class="dotg"></span>${s}</span>
      </div>`).join("")}
      <div style="display:flex;gap:12px;margin-top:20px"><button class="btn">Enregistrer</button><button class="btn ghost">Tester les connexions</button></div>
    </div>
  </main></div>`;

// ---- Écran 3 : Surveillance & agents ---------------------------------------
const ecran3 = `<div class="app">${sidebar("Surveillance")}
  <main class="main">
    ${topbar("Surveillance des sites", "Un gardien vérifie vos boutiques en continu et répare les soucis simples tout seul.")}
    <div class="cards" style="grid-template-columns:repeat(3,1fr)">
      <div class="card"><div class="lab">Sites surveillés</div><div class="val">8</div><div class="tag up">● 7 OK</div></div>
      <div class="card"><div class="lab">Réparés automatiquement</div><div class="val">3</div><div class="tag up">cette semaine</div></div>
      <div class="card"><div class="lab">À valider par vous</div><div class="val">1</div><div class="tag warn">● en attente</div></div>
    </div>
    <div class="panel">
      <h2>Journal du gardien</h2>
      <table>
        <tr><th>Boutique</th><th>Évènement</th><th>État</th><th></th></tr>
        ${[
          ["Boutique Marie", "Paiement Stripe temporairement en échec", "b-green", "Réparé automatiquement ✓", ""],
          ["Atelier du Bois", "Site lent — cache vidé et re-publié", "b-green", "Réparé automatiquement ✓", ""],
          ["Savonnerie Lou", "Certificat de sécurité à renouveler", "b-green", "Renouvelé automatiquement ✓", ""],
          ["Céramique Claire", "Erreur sur la page panier — solution prête", "b-amber", "À valider", "btn"],
        ].map(([n, e, c, s, b]) => `<tr>
          <td style="font-weight:600">${n}</td>
          <td style="color:#5c5648">${e}</td>
          <td><span class="badge ${c}">${s}</span></td>
          <td>${b ? '<button class="btn">Valider en 1 clic</button>' : '<span style="color:#bdb6a6">—</span>'}</td>
        </tr>`).join("")}
      </table>
    </div>
  </main></div>`;

// ---- Flyer commercial (portrait, à envoyer) --------------------------------
const flyer = `<div style="width:1080px;height:1350px;background:linear-gradient(165deg,${CREME} 0%,#efe4cb 100%);font-family:'Helvetica Neue',Arial,sans-serif;color:${ENCRE};padding:80px 70px;position:relative">
  <div style="text-align:center">
    <div style="display:inline-flex;align-items:center;gap:14px;font-size:26px;font-weight:800;color:${OR_FONCE}">
      <span style="width:54px;height:54px;border-radius:14px;background:${OR};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:28px">★</span>
      Création de boutiques en ligne
    </div>
  </div>
  <h1 style="font-size:62px;line-height:1.12;text-align:center;color:${OR_FONCE};margin:48px 0 18px">Votre boutique en ligne,<br>clé en main</h1>
  <p style="text-align:center;font-size:27px;color:#6b6253;line-height:1.5;margin:0 40px 54px">Je crée, je mets en ligne et je gère votre site de A à Z. Vous vendez, je m'occupe de tout le reste.</p>

  <!-- schéma : tout passe par moi -->
  <div style="display:flex;align-items:center;justify-content:center;gap:26px;margin:0 0 56px">
    <div style="text-align:center">
      <div style="width:130px;height:130px;border-radius:24px;background:#fff;border:3px solid ${OR};display:flex;align-items:center;justify-content:center;font-size:54px">🧑‍🎨</div>
      <div style="margin-top:12px;font-size:20px;font-weight:600">Vous</div>
    </div>
    <div style="font-size:46px;color:${OR}">→</div>
    <div style="text-align:center">
      <div style="width:160px;height:160px;border-radius:50%;background:${OR};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(169,137,53,.4)">
        <span style="font-size:24px;font-weight:800">MOI</span><span style="font-size:15px;opacity:.9;margin-top:4px">je gère tout</span>
      </div>
    </div>
    <div style="font-size:46px;color:${OR}">→</div>
    <div style="text-align:center">
      <div style="width:130px;height:130px;border-radius:24px;background:#fff;border:3px solid ${OR};display:flex;align-items:center;justify-content:center;font-size:54px">🛍️</div>
      <div style="margin-top:12px;font-size:20px;font-weight:600">Boutique en ligne</div>
    </div>
  </div>

  <div style="background:#fff;border-radius:28px;padding:42px 50px;box-shadow:0 10px 30px rgba(0,0,0,.06)">
    ${[
      ["Boutique professionnelle", "Élégante, rapide, parfaite sur téléphone"],
      ["Paiement 100 % sécurisé", "Vos clients paient par carte en toute confiance"],
      ["Tout est géré pour vous", "Domaine, e-mails, mises à jour, dépannage"],
      ["Formule tranquillité", "Un abonnement, et je m'occupe de tout chaque mois"],
    ].map(([t, d]) => `<div style="display:flex;align-items:flex-start;gap:20px;margin:22px 0">
      <span style="flex:0 0 42px;width:42px;height:42px;border-radius:50%;background:${CREME};color:${OR_FONCE};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800">✓</span>
      <div><div style="font-size:25px;font-weight:700">${t}</div><div style="font-size:20px;color:#7a7468;margin-top:3px">${d}</div></div>
    </div>`).join("")}
  </div>

  <div style="text-align:center;margin-top:54px;font-size:25px;color:${OR_FONCE};font-weight:700">Contactez-moi pour lancer votre boutique</div>
  <div style="text-align:center;margin-top:10px;font-size:20px;color:#8a8475">votre nom · votre e-mail · votre téléphone</div>
</div>`;

const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });

async function shot(html, file, w, h) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`, { waitUntil: "networkidle0" });
  await p.screenshot({ path: join(SORTIE, file) });
  await p.close();
  console.log("✓ " + join(SORTIE, file));
}

await shot(ecran1, "maquette-1-tableau-de-bord.png", 1440, 900);
await shot(ecran2, "maquette-2-coffre-cles.png", 1440, 900);
await shot(ecran3, "maquette-3-surveillance.png", 1440, 900);
await shot(flyer, "flyer-service.png", 1080, 1350);

await b.close();
console.log("\nMaquettes générées dans " + SORTIE);
