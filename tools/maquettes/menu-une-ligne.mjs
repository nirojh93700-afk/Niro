import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const D = "/tmp/claude-0/-home-user-Niro/8c34bee5-87e4-524d-be1e-7cc50fe3894e/scratchpad/menu/";
const NOUVEAU = `
<a href="/boutique">Boutique</a>
<a href="/boutique/bijoux">Bijoux</a>
<a href="/cristaux" style="color:#a5822f;font-weight:700">💎 Cristal Photo 3D</a>
<a href="/boutique/verres">Verres &amp; Carafes</a>
<a href="/boutique/enfants">Bébé &amp; Enfant</a>
<a href="/boutique/mariage">Mariage</a>
<a href="/boutique/maison">Maison &amp; Déco</a>
<a href="/boutique/marque-pages">Marque-pages</a>
<a href="/boutique/cadeaux">Petits cadeaux</a>
<span class="mn-offrir"><a href="/offrir" class="mn-btn">Offrir <span aria-hidden="true">▾</span></a>
  <span class="mn-pan"><a href="/offrir">🎁 Trouver un cadeau</a><a href="/carte-cadeau">💳 Carte cadeau</a><a href="/idees">💡 Idées &amp; conseils</a></span></span>
<a href="/offres" style="color:#b4452f;font-weight:600">Promotions</a>`;
const CSS = `.mn-offrir{position:relative;display:inline-flex}
.mn-pan{display:none;position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%);background:#fff;border:1px solid #e8dfcb;border-radius:14px;box-shadow:0 12px 30px rgba(26,18,6,.12);padding:8px;min-width:210px;z-index:50;flex-direction:column}
.mn-offrir.ouvert .mn-pan,.mn-offrir:hover .mn-pan{display:flex}
.mn-pan a{padding:10px 12px;border-radius:9px;font-size:.9rem!important}
.mn-pan a:hover{background:#faf6ee}`;
const b = await chromium.launch();
const res = {};
for (const [nom, w, h, mobile] of [["pc-1280", 1280, 420, false], ["pc-1440", 1440, 420, false], ["pc-1100", 1100, 420, false], ["tel", 390, 844, true]]) {
  for (const etat of ["avant", "apres"]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await p.goto("https://nivcreation.fr/", { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(3500);
    await p.getByText("Non merci").click({ timeout: 4000 }).catch(() => {});
    await p.evaluate(() => { document.querySelectorAll("button[aria-label*=ermer], button[aria-label*=lose]").forEach((b) => { const box = b.closest("[class*=toast],[class*=Toast],[class*=nouv],[class*=new]"); if (box) box.remove(); }); [...document.querySelectorAll("*")].filter((e) => /NOUVEAUTÉ/.test(e.textContent || "") && getComputedStyle(e).position === "fixed").forEach((e) => e.remove()); document.querySelectorAll(".flot-btn").forEach((e) => (e.style.display = "none")); });
    if (etat === "apres") await p.evaluate(([html, css]) => { const n = document.querySelector("nav.nav"); n.innerHTML = html; const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }, [NOUVEAU, CSS]);
    if (mobile) { await p.click(".menu-toggle").catch(() => {}); await p.waitForTimeout(500); }
    else if (etat === "apres" && nom === "pc-1280") { await p.evaluate(() => document.querySelector(".mn-offrir").classList.add("ouvert")); }
    const m = await p.evaluate(() => { const n = document.querySelector("nav.nav"); const ys = new Set([...n.children].map((c) => Math.round(c.getBoundingClientRect().top))); return { lignes: ys.size, liens: n.querySelectorAll(":scope > a, :scope > span > a.mn-btn").length, hauteurNav: Math.round(n.getBoundingClientRect().height) }; });
    res[`${nom}-${etat}`] = m;
    await p.screenshot({ path: `${D}${nom}-${etat}.png`, clip: mobile ? undefined : { x: 0, y: 0, width: w, height: nom === "pc-1280" && etat === "apres" ? 400 : 260 } });
    await p.close();
  }
}
console.log(JSON.stringify(res, null, 1));
await b.close();
