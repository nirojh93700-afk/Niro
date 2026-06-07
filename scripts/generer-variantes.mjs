#!/usr/bin/env node
// =============================================================================
// generer-variantes.mjs  ◆  3 traitements "Doré & nuit profonde" à comparer
// =============================================================================
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SORTIE = "docs/REVENDRE-SITES/maquettes";
mkdirSync(SORTIE, { recursive: true });

const GOLD = "#d9b25a", GOLD_DEEP = "#b9822f", GREEN = "#59d39a";

// ---- Contenu commun (skeleton) ---------------------------------------------
const navItems = [["Tableau de bord","◈",1],["Mes clientes","❖",0],["Abonnements","◎",0],["Agent IA","✦",0],["Coffre à clés","⬡",0],["Réglages","⚙",0]];
const rows = [
  ["Boutique Marie","boutique-marie.fr","En ligne","Active · 59 €",1],
  ["Atelier du Bois","atelierdubois.fr","En ligne","Sérénité · 29 €",1],
  ["Savonnerie Lou","savonnerie-lou.fr","En ligne","Retard",0],
  ["Céramique Claire","ceramique-claire.fr","Maintenance","Premium · 99 €",1],
];
const logs = [["Boutique Marie","Paiement relancé"],["Atelier du Bois","Site ré-accéléré"],["Savonnerie Lou","SSL renouvelé"]];

function chart(stroke) {
  return `<svg viewBox="0 0 460 140" width="100%" height="130" style="margin-top:auto">
    <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${stroke}" stop-opacity=".5"/><stop offset="100%" stop-color="${stroke}" stop-opacity="0"/></linearGradient>
    <filter id="gl"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M0,110 C60,100 90,60 150,72 C210,84 250,34 310,40 C370,46 410,18 460,14 L460,140 L0,140 Z" fill="url(#gg)"/>
    <path d="M0,110 C60,100 90,60 150,72 C210,84 250,34 310,40 C370,46 410,18 460,14" fill="none" stroke="${stroke}" stroke-width="2.5" filter="url(#gl)"/>
  </svg>`;
}

// ---- Thèmes (3 traitements) -------------------------------------------------
const themes = {
  // 1. LUXE MINIMAL — éditorial, titres serif, filets dorés fins, beaucoup d'air
  minimal: {
    titre: "Luxe minimal",
    bg: "radial-gradient(130% 120% at 50% -10%, #15130d 0%, #08070a 55%)",
    css: `
      .scene{color:#efe9dc}
      .card{background:#0d0c0a;border:1px solid rgba(217,178,90,.16);border-radius:6px;box-shadow:none}
      .side{background:#0b0a08;border:1px solid rgba(217,178,90,.14);border-radius:6px}
      h1{font-family:'Playfair Display',Georgia,serif;font-weight:600}
      .big{font-family:'Playfair Display',Georgia,serif;font-weight:600;color:${GOLD}}
      .lab{letter-spacing:.22em}
      .nav a.on{background:transparent;border:none;border-left:2px solid ${GOLD};border-radius:0;color:#fff}
      .brand .orb{border-radius:6px;background:transparent;border:1px solid ${GOLD};color:${GOLD};box-shadow:none}
      .btnglow{background:transparent;border:1px solid ${GOLD};color:${GOLD};box-shadow:none;border-radius:4px}
      .ava{border-radius:6px;background:transparent;border:1px solid rgba(217,178,90,.3)}
      .pill{border-radius:3px;background:transparent;border:1px solid rgba(217,178,90,.3);color:${GOLD}}
      .pill.green{border-color:rgba(89,211,154,.4);color:${GREEN}}
    `,
    accent: GOLD, glass: false,
  },
  // 2. GLASS AURORA OR — verre dépoli, halos uniquement dorés/ambrés
  glass: {
    titre: "Glass aurora doré",
    bg: "radial-gradient(120% 120% at 50% 0%, #131017 0%, #08070a 60%)",
    blobs: `<div class="blob" style="width:600px;height:600px;background:${GOLD};top:-200px;left:-120px;opacity:.32"></div>
            <div class="blob" style="width:520px;height:520px;background:${GOLD_DEEP};top:-140px;right:-80px;opacity:.30"></div>
            <div class="blob" style="width:480px;height:480px;background:#6a4a12;bottom:-220px;left:42%;opacity:.4"></div>`,
    css: `
      .scene{color:#efe9dc}
      .card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(22px);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08)}
      .side{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(22px);border-radius:24px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
      .big{background:linear-gradient(120deg,#fff,${GOLD});-webkit-background-clip:text;background-clip:text;color:transparent}
      .nav a.on{background:linear-gradient(100deg,rgba(217,178,90,.28),rgba(185,130,47,.12));border:1px solid rgba(255,255,255,.12);color:#fff}
      .brand .orb{background:linear-gradient(135deg,${GOLD},${GOLD_DEEP});color:#1a1404;box-shadow:0 0 22px rgba(217,178,90,.6)}
      .btnglow{background:linear-gradient(120deg,${GOLD},${GOLD_DEEP});color:#1a1404;box-shadow:0 8px 24px rgba(217,178,90,.45);border-radius:12px}
      .ava{background:rgba(217,178,90,.14);border:1px solid rgba(217,178,90,.3);border-radius:12px}
      .pill{background:rgba(217,178,90,.14);color:${GOLD};border:1px solid rgba(217,178,90,.3);border-radius:20px}
      .pill.green{background:rgba(89,211,154,.14);color:${GREEN};border:1px solid rgba(89,211,154,.3)}
    `,
    accent: GOLD, glass: true,
  },
  // 3. NEON HUD — cartes cernées d'un filet doré lumineux, vibe tech haut de gamme
  neon: {
    titre: "Neon doré (HUD)",
    bg: "radial-gradient(120% 120% at 50% 0%, #0c0b0f 0%, #060508 60%)",
    css: `
      .scene{color:#efe9dc}
      .card{background:rgba(20,17,12,.72);border:1px solid rgba(217,178,90,.35);border-radius:16px;box-shadow:0 0 22px rgba(217,178,90,.12),inset 0 0 18px rgba(217,178,90,.05)}
      .side{background:rgba(20,17,12,.7);border:1px solid rgba(217,178,90,.35);border-radius:16px;box-shadow:0 0 22px rgba(217,178,90,.12)}
      .lab{letter-spacing:.2em;color:${GOLD};font-family:'Courier New',monospace;opacity:.8}
      .big{color:#fff;text-shadow:0 0 18px rgba(217,178,90,.5)}
      .nav a.on{background:rgba(217,178,90,.10);border:1px solid rgba(217,178,90,.5);color:${GOLD};box-shadow:0 0 14px rgba(217,178,90,.25)}
      .brand .orb{background:transparent;border:1px solid ${GOLD};color:${GOLD};box-shadow:0 0 16px rgba(217,178,90,.6)}
      .btnglow{background:transparent;border:1px solid ${GOLD};color:${GOLD};box-shadow:0 0 16px rgba(217,178,90,.4);border-radius:10px}
      .ava{background:transparent;border:1px solid rgba(217,178,90,.5);border-radius:10px;box-shadow:0 0 10px rgba(217,178,90,.2)}
      .pill{background:transparent;border:1px solid rgba(217,178,90,.5);color:${GOLD};border-radius:6px;box-shadow:0 0 10px rgba(217,178,90,.15)}
      .pill.green{border-color:rgba(89,211,154,.6);color:${GREEN};box-shadow:0 0 10px rgba(89,211,154,.2)}
    `,
    accent: GOLD, glass: false,
  },
};

const baseCss = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-print-color-adjust:exact}
  body{background:#06050a}
  .scene{position:relative;width:1600px;height:1000px;overflow:hidden}
  .blob{position:absolute;border-radius:50%;filter:blur(90px)}
  .grain{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.02) 1px,transparent 1px);background-size:3px 3px}
  .wrap{position:relative;display:flex;height:100%;padding:22px;gap:22px}
  .side{width:248px;flex:0 0 248px;padding:26px 20px;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:12px;font-size:18px;font-weight:700;margin-bottom:36px}
  .brand .orb{width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:800}
  .nav a{display:flex;align-items:center;gap:13px;padding:13px 14px;border-radius:12px;color:#9a9488;font-size:15px;text-decoration:none;margin-bottom:5px}
  .nav .ic{width:20px;text-align:center}
  .side .foot{margin-top:auto;font-size:12px;color:#6e6a5e;line-height:1.6}
  .main{flex:1;display:flex;flex-direction:column;gap:22px;min-width:0}
  .top{display:flex;align-items:center;justify-content:space-between}
  .top h1{font-size:27px;letter-spacing:-.01em}
  .top .sub{color:#9a9488;font-size:14px;margin-top:4px}
  .av{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,${GOLD},${GOLD_DEEP});display:flex;align-items:center;justify-content:center;font-weight:700;color:#1a1404}
  .bento{flex:1;display:grid;grid-template-columns:1.5fr 1fr 1fr;grid-template-rows:auto auto 1fr;gap:22px}
  .lab{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8e8a7e}
  .big{font-size:44px;font-weight:800;letter-spacing:-.02em;margin-top:8px}
  .big small{font-size:20px;font-weight:600;-webkit-text-fill-color:#b6b1a4;color:#b6b1a4}
  .up{color:${GREEN};font-size:13px;margin-top:10px;display:inline-flex;align-items:center;gap:6px}
  .card{padding:24px}
  .revenue{grid-column:1;grid-row:1 / span 2;display:flex;flex-direction:column}
  .agent{grid-column:3;grid-row:1 / span 2;display:flex;flex-direction:column}
  .clients{grid-column:1 / span 2;grid-row:3;padding:20px 24px}
  .vault{grid-column:3;grid-row:3;display:flex;flex-direction:column;justify-content:center}
  .row{display:flex;align-items:center;gap:14px;padding:11px 0;border-top:1px solid rgba(255,255,255,.06)}
  .ava{width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:700;color:${GOLD}}
  .pill{font-size:12px;padding:4px 11px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .pulse{width:9px;height:9px;border-radius:50%;background:${GREEN};box-shadow:0 0 12px ${GREEN};display:inline-block}
  .logline{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#b6b1a4;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .tagok{color:${GREEN};font-size:12px;font-weight:600;white-space:nowrap}
  .cmd{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:12px;color:#b6b1a4;font-size:14px}
  .kbd{font-size:11px;padding:2px 7px;border-radius:6px;background:rgba(255,255,255,.08)}
`;

function build(theme) {
  const sd = `<aside class="side card">
    <div class="brand"><span class="orb">N</span> Nova<span style="color:${GOLD}">.</span></div>
    <nav class="nav">${navItems.map(([t,i,on])=>`<a class="${on?"on":""}"><span class="ic">${i}</span>${t}</a>`).join("")}</nav>
    <div class="foot">Niro — espace privé<br>Agent IA actif · 8 sites</div>
  </aside>`;
  const clientsRows = rows.map(([n,d,st,ab,ok])=>`<div class="row">
    <span class="ava">${n[0]}</span>
    <div style="flex:1"><div style="font-weight:600;font-size:15px">${n}</div><div style="color:#8e8a7e;font-size:12px">${d}</div></div>
    <span class="pill ${ok?"green":""}"><span class="dot" style="background:${ok?GREEN:GOLD};box-shadow:0 0 10px ${ok?GREEN:GOLD}"></span>${st}</span>
    <div style="width:130px;text-align:right;color:#b6b1a4;font-size:13px">${ab}</div></div>`).join("");
  const logLines = logs.map(([n,e])=>`<div class="logline"><span class="pulse" style="margin-top:4px"></span><div style="flex:1"><b style="color:#fff">${n}</b><br>${e}</div><span class="tagok">réparé ✓</span></div>`).join("");

  return `<div class="scene" style="background:${theme.bg}">
    ${theme.blobs||""}<div class="grain"></div>
    <div class="wrap">${sd}
      <div class="main">
        <div class="top"><div><h1>Bonjour Niro ✦</h1><div class="sub">Votre constellation de boutiques, en temps réel.</div></div>
          <div style="display:flex;gap:12px;align-items:center"><div class="cmd card" style="padding:11px 16px">⌘ Rechercher <span class="kbd">⌘K</span></div><div class="av">N</div></div></div>
        <div class="bento">
          <div class="card revenue"><div class="lab">Revenus récurrents · mois</div><div class="big">1 240 <small>€</small></div><div class="up">▲ +18 % · 6 abonnements actifs</div>${chart(theme.accent)}</div>
          <div class="card" style="grid-column:2;grid-row:1"><div class="lab">Sites en ligne</div><div class="big">8</div><div class="up"><span class="pulse"></span> tous actifs</div></div>
          <div class="card" style="grid-column:2;grid-row:2"><div class="lab">Santé moyenne</div><div class="big">97<small>%</small></div><div class="up">▲ stable</div></div>
          <div class="card agent"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div class="lab">✦ Agent IA — surveillance</div><span class="pill green"><span class="pulse"></span>live</span></div>
            <div style="font-size:13px;color:#9a9488;margin-bottom:8px">3 incidents réglés seuls</div>${logLines}
            <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center"><span class="pill">1 à valider</span><button class="btnglow" style="padding:11px 16px;font-weight:700;border:none;font-size:13px">Voir tout</button></div></div>
          <div class="card clients"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="lab">Mes clientes</div><button class="btnglow" style="padding:11px 16px;font-weight:700;border:none;font-size:13px">+ Nouveau site</button></div>${clientsRows}</div>
          <div class="card vault"><div style="font-size:30px;margin-bottom:8px;color:${GOLD};filter:drop-shadow(0 0 14px rgba(217,178,90,.6))">⬡</div><div class="lab">Coffre à clés</div><div style="font-size:17px;font-weight:600;margin-top:6px">Chiffré de bout en bout</div><div style="color:#8e8a7e;font-size:13px;margin-top:6px;line-height:1.5">Stripe, e-mails, domaines — rangés en sécurité.</div><div style="margin-top:14px"><span class="pill green"><span class="dot" style="background:${GREEN};box-shadow:0 0 10px ${GREEN}"></span>5 connexions</span></div></div>
        </div>
      </div>
    </div>
  </div>`;
}

const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
for (const [key, theme] of Object.entries(themes)) {
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
  await p.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}${theme.css}</style></head><body>${build(theme)}</body></html>`, { waitUntil: "networkidle0" });
  await new Promise(r=>setTimeout(r,300));
  const file = `variante-${key}.png`;
  await p.screenshot({ path: join(SORTIE, file) });
  await p.close();
  console.log(`✓ ${theme.titre} → ${file}`);
}
await b.close();
