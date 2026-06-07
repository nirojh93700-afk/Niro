#!/usr/bin/env node
// =============================================================================
// generer-maquette-futuriste.mjs  ◆  Maquette 2026 : dark glass + aurora + bento
// =============================================================================
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SORTIE = "docs/REVENDRE-SITES/maquettes";
mkdirSync(SORTIE, { recursive: true });

const GOLD = "#d9b25a", VIOLET = "#8b5cff", CYAN = "#34e7e4";

const base = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-print-color-adjust:exact}
  body{background:#07070c}
  .scene{position:relative;width:1600px;height:1000px;background:radial-gradient(120% 120% at 50% 0%,#0e0e1a 0%,#07070c 60%);overflow:hidden;color:#eceaf5}
  /* Aurora blobs */
  .blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55}
  .b1{width:620px;height:620px;background:${VIOLET};top:-180px;left:-120px}
  .b2{width:560px;height:560px;background:${GOLD};top:-160px;right:-80px;opacity:.45}
  .b3{width:520px;height:520px;background:${CYAN};bottom:-220px;left:38%;opacity:.30}
  .grain{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.025) 1px,transparent 1px);background-size:3px 3px;mix-blend-mode:overlay}
  /* Glass helper */
  .glass{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08)}
  .wrap{position:relative;display:flex;height:100%;padding:22px;gap:22px}
  /* Sidebar */
  .side{width:248px;flex:0 0 248px;padding:26px 20px;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:12px;font-size:18px;font-weight:700;margin-bottom:36px}
  .brand .orb{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,${GOLD},#a9772e);display:flex;align-items:center;justify-content:center;font-weight:800;color:#1a1404;box-shadow:0 0 22px rgba(217,178,90,.6)}
  .nav a{display:flex;align-items:center;gap:13px;padding:13px 14px;border-radius:14px;color:#a8a4c0;font-size:15px;text-decoration:none;margin-bottom:5px}
  .nav a.on{color:#fff;background:linear-gradient(100deg,rgba(139,92,255,.30),rgba(217,178,90,.16));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
  .nav .ic{width:20px;text-align:center;opacity:.9}
  .side .foot{margin-top:auto;font-size:12px;color:#6f6b86;line-height:1.6}
  .badgepro{margin-top:14px;padding:12px 14px;border-radius:14px;background:linear-gradient(120deg,rgba(139,92,255,.22),rgba(52,231,228,.12));border:1px solid rgba(255,255,255,.1);font-size:12px;color:#cfc9e6}
  /* Main */
  .main{flex:1;display:flex;flex-direction:column;gap:22px;min-width:0}
  .top{display:flex;align-items:center;justify-content:space-between}
  .top h1{font-size:26px;font-weight:700;letter-spacing:-.01em}
  .top .sub{color:#9c98b6;font-size:14px;margin-top:4px}
  .tools{display:flex;align-items:center;gap:12px}
  .cmd{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:14px;color:#b9b5d0;font-size:14px}
  .kbd{font-size:11px;padding:2px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}
  .av{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,${VIOLET},${GOLD});display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 0 20px rgba(139,92,255,.5)}
  /* Bento grid */
  .bento{flex:1;display:grid;grid-template-columns:1.5fr 1fr 1fr;grid-template-rows:auto auto 1fr;gap:22px}
  .lab{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8e8aa8}
  .big{font-size:44px;font-weight:800;letter-spacing:-.02em;margin-top:8px}
  .big small{font-size:20px;color:#b9b5d0;font-weight:600}
  .up{color:#46e09a;font-size:13px;margin-top:10px;display:inline-flex;align-items:center;gap:6px}
  .warn{color:${GOLD}}
  .card{padding:24px}
  .revenue{grid-column:1;grid-row:1 / span 2;display:flex;flex-direction:column}
  .glow-num{background:linear-gradient(120deg,#fff,${GOLD});-webkit-background-clip:text;background-clip:text;color:transparent}
  .ring{position:relative;width:62px;height:62px}
  .pulse{width:9px;height:9px;border-radius:50%;background:#46e09a;box-shadow:0 0 12px #46e09a;display:inline-block}
  .agent{grid-column:3;grid-row:1 / span 2;padding:22px;display:flex;flex-direction:column}
  .logline{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#c4c0da;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .tagok{color:#46e09a;font-size:12px;font-weight:600;white-space:nowrap}
  .clients{grid-column:1 / span 2;grid-row:3;padding:20px 24px}
  .vault{grid-column:3;grid-row:3;padding:22px;display:flex;flex-direction:column;justify-content:center}
  .row{display:flex;align-items:center;gap:14px;padding:11px 0}
  .ava{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-weight:700;color:${GOLD}}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .pill{font-size:12px;padding:4px 11px;border-radius:20px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
  .pill.green{background:rgba(70,224,154,.14);color:#5cf0a8;border:1px solid rgba(70,224,154,.3)}
  .pill.gold{background:rgba(217,178,90,.14);color:${GOLD};border:1px solid rgba(217,178,90,.3)}
  .btnglow{background:linear-gradient(120deg,${GOLD},#b9822f);color:#1a1404;border:none;border-radius:12px;padding:11px 16px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(217,178,90,.4)}
`;

function side() {
  const items = [["Tableau de bord","◈",1],["Mes clientes","❖",0],["Abonnements","◎",0],["Agent IA","✦",0],["Coffre à clés","⬡",0],["Réglages","⚙",0]];
  return `<aside class="side glass">
    <div class="brand"><span class="orb">N</span> Nova<span style="color:${GOLD}">.</span></div>
    <nav class="nav">${items.map(([t,i,on])=>`<a class="${on?"on":""}"><span class="ic">${i}</span>${t}</a>`).join("")}</nav>
    <div class="badgepro">✦ Agent IA actif<br><span style="color:#8e8aa8">surveille 8 sites en direct</span></div>
    <div class="foot">Niro — espace privé<br>Connectée · sécurisé</div>
  </aside>`;
}

// glowing area chart
const chart = `<svg viewBox="0 0 460 150" width="100%" height="150" style="margin-top:auto">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity=".55"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <path d="M0,120 C60,110 90,70 150,80 C210,90 250,40 310,46 C370,52 410,22 460,18 L460,150 L0,150 Z" fill="url(#g)"/>
  <path d="M0,120 C60,110 90,70 150,80 C210,90 250,40 310,46 C370,52 410,22 460,18" fill="none" stroke="${GOLD}" stroke-width="3" filter="url(#glow)"/>
  ${[[150,80],[310,46],[460,18]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" filter="url(#glow)"/>`).join("")}
</svg>`;

const ringSvg = `<svg class="ring" viewBox="0 0 62 62"><circle cx="31" cy="31" r="26" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6"/><circle cx="31" cy="31" r="26" fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="round" stroke-dasharray="163" stroke-dashoffset="20" transform="rotate(-90 31 31)" style="filter:drop-shadow(0 0 6px ${CYAN})"/></svg>`;

const clientsRows = [
  ["Boutique Marie","boutique-marie.fr","#46e09a","En ligne","green","Active · 59 €"],
  ["Atelier du Bois","atelierdubois.fr","#46e09a","En ligne","green","Sérénité · 29 €"],
  ["Savonnerie Lou","savonnerie-lou.fr","#46e09a","En ligne","gold","Retard"],
  ["Céramique Claire","ceramique-claire.fr",GOLD,"Maintenance","green","Premium · 99 €"],
].map(([n,d,dc,st,pc,ab])=>`<div class="row" style="border-top:1px solid rgba(255,255,255,.06)">
  <span class="ava">${n[0]}</span>
  <div style="flex:1"><div style="font-weight:600;font-size:15px">${n}</div><div style="color:#8e8aa8;font-size:12px">${d}</div></div>
  <span class="pill ${pc==="gold"?"gold":"green"}"><span class="dot" style="background:${dc};box-shadow:0 0 10px ${dc}"></span>${st}</span>
  <div style="width:140px;text-align:right;color:#b9b5d0;font-size:13px">${ab}</div>
</div>`).join("");

const logs = [
  ["Boutique Marie","Paiement relancé automatiquement"],
  ["Atelier du Bois","Cache vidé · site ré-accéléré"],
  ["Savonnerie Lou","Certificat SSL renouvelé"],
].map(([n,e])=>`<div class="logline"><span class="pulse" style="margin-top:4px"></span><div style="flex:1"><b style="color:#fff;font-weight:600">${n}</b><br><span>${e}</span></div><span class="tagok">réparé ✓</span></div>`).join("");

const HTML = `<div class="scene">
  <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grain"></div>
  <div class="wrap">
    ${side()}
    <div class="main">
      <div class="top">
        <div><h1>Bonjour Niro ✦</h1><div class="sub">Votre constellation de boutiques, en temps réel.</div></div>
        <div class="tools">
          <div class="cmd glass">⌘ Rechercher <span class="kbd">⌘K</span></div>
          <div class="av">N</div>
        </div>
      </div>
      <div class="bento">
        <div class="card glass revenue">
          <div class="lab">Revenus récurrents · mois</div>
          <div class="big glow-num">1 240 <small style="-webkit-text-fill-color:#b9b5d0">€</small></div>
          <div class="up">▲ +18 % vs mois dernier · 6 abonnements actifs</div>
          ${chart}
        </div>
        <div class="card glass" style="grid-column:2;grid-row:1">
          <div class="lab">Sites en ligne</div><div class="big">8</div><div class="up"><span class="pulse"></span> tous actifs</div>
        </div>
        <div class="card glass" style="grid-column:2;grid-row:2;display:flex;align-items:center;justify-content:space-between">
          <div><div class="lab">Santé moyenne</div><div class="big">97<small>%</small></div></div>${ringSvg}
        </div>
        <div class="card glass agent">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div class="lab">✦ Agent IA — surveillance</div><span class="pill green"><span class="pulse"></span>live</span>
          </div>
          <div style="font-size:13px;color:#9c98b6;margin-bottom:8px">3 incidents réglés seuls cette semaine</div>
          ${logs}
          <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between">
            <span class="pill gold">1 à valider</span><button class="btnglow">Voir tout</button>
          </div>
        </div>
        <div class="card glass clients">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div class="lab">Mes clientes</div><button class="btnglow">+ Nouveau site</button>
          </div>
          ${clientsRows}
        </div>
        <div class="card glass vault">
          <div style="font-size:30px;margin-bottom:8px;filter:drop-shadow(0 0 14px rgba(217,178,90,.7))">⬡</div>
          <div class="lab">Coffre à clés</div>
          <div style="font-size:17px;font-weight:600;margin-top:6px">Chiffré de bout en bout</div>
          <div style="color:#8e8aa8;font-size:13px;margin-top:6px;line-height:1.5">Stripe, e-mails, domaines — rangés en sécurité, utilisés automatiquement.</div>
          <div style="margin-top:14px"><span class="pill green"><span class="dot" style="background:#46e09a;box-shadow:0 0 10px #46e09a"></span>5 connexions actives</span></div>
        </div>
      </div>
    </div>
  </div>
</div>`;

const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
await p.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${HTML}</body></html>`, { waitUntil: "networkidle0" });
await new Promise(r=>setTimeout(r,400));
await p.screenshot({ path: join(SORTIE, "maquette-futuriste-nova.png") });
await b.close();
console.log("✓ " + join(SORTIE, "maquette-futuriste-nova.png"));
