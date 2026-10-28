const { chromium } = require('playwright'); const fs = require('fs');
const S = process.argv[2]; const PORT = 'docs/maquettes/assets/marque-pages/exemples/portraits/';
const EX = [
  { id: 'c17-modele22', taille: '17', mode: /mod/i, n: 22, champs: ['Camille & Paul'] },
  { id: 'c17-modele27', taille: '17', mode: /mod/i, n: 27, champs: ['Léa & Paul'] },
  { id: 'c17-modele24', taille: '17', mode: /mod/i, n: 24, champs: ['Inès'] },
  { id: 'c17-texte', taille: '17', mode: /texte/i, texte: 'Santé !', police: 'Great Vibes', grand: true },
];
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const e of EX.filter(x => !process.env.ONLY || x.id === process.env.ONLY)) {
    const ctx = await b.newContext({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => { try { localStorage.setItem('niv-welcome-seen', '1'); localStorage.setItem('niv-popup-seen','1'); } catch (x) {} });
    const p = await ctx.newPage(); p.on('pageerror', x => errs.push(String(x)));
    await p.route('**/api/upload', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ref: 'demo-' + e.id }) }));
    await p.route('**/api/img/demo-*', r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(PORT + (e.photo || 'couple.jpg')) }));
    await p.route('**/api/lecture-image', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, date: false }) }));
    await p.goto('http://localhost:3140/produit/verre-a-cocktail-grave', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
    for (const sel of ['[aria-label="Fermer"]', 'button:has-text("Non merci")']) { const l = p.locator(sel); if (await l.count()) { try { await l.first().click({ timeout: 800 }); } catch (x) {} } }
    if (e.taille === '39') { await p.locator('button:has-text("39 cl")').first().click(); await p.waitForTimeout(800); }
    await p.locator('.prc-card').filter({ hasText: e.mode }).first().click(); await p.waitForTimeout(600);
    if (e.n) {
      await p.locator(`[aria-label^="Modèle n° ${e.n} "]`).first().click(); await p.waitForTimeout(600);
      const inps = p.locator('.prc-fields input'); const k = await inps.count();
      for (let i = 0; i < Math.min(k, e.champs.length); i++) await inps.nth(i).fill(e.champs[i]);
    }
    if (e.photo) {
      await p.locator('input[type=file]').first().setInputFiles(PORT + e.photo); await p.waitForTimeout(3500);
    }
    if (e.texte) { const t = p.locator('.prc-mode input[type=text]').first(); if (await t.count()) await t.fill(e.texte); }
    if (e.date) { const d = p.locator('.prc-mode input[type=text]').nth(1); if (await d.count()) await d.fill(e.date); }
    if (e.police) { const c = p.locator('.prc-pol', { hasText: e.police }); if (await c.count()) await c.first().click(); }
    await p.waitForTimeout(1500);
    if (e.grand) { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600); const rs = p.locator('.ee-toolbar input[type=range]'); const k = await rs.count(); for (let i = 0; i < k; i++) { await rs.nth(i).focus(); for (let j = 0; j < 40; j++) await p.keyboard.press('ArrowRight'); } await p.waitForTimeout(500); }
    if (false) await p.evaluate(() => { document.querySelectorAll('.ee-toolbar input[type=range]').forEach(i => { const v = Number(i.min) + (Number(i.max) - Number(i.min)) * 0.9; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, String(v)); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }); });
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1200);
    await p.addStyleTag({ content: '.ee-toolbar,.mtz-arrows,.gallery-arrow,.gallery-main button{display:none!important}' });
    await p.waitForTimeout(400);
    await p.locator('.gallery-main').first().screenshot({ path: `${S}/exc/${e.id}.png` });
    await ctx.close();
  }
  console.log(JSON.stringify({ errs })); await b.close();
})();
