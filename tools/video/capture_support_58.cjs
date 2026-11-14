// Vidéo 58 (14/11/2026) : la fiche « Créez votre support de téléphone » filmée en vue téléphone, une photo par geste.
//   node tools/video/capture_support_58.cjs <adresse du site> <dossier de sortie> <photo d'exemple.jpg>
// (adresse = un `next start` local de la version en ligne, ou https://nivcreation.fr). Rien n'est envoyé : le panier est simulé.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [SITE, OUT, PHOTO] = process.argv.slice(2);
const DPR = 2.2, VW = 390, VH = 640;
(async () => {
  const dir = path.join(OUT, 'support'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR, hasTouch: true });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('niv-welcome-session', '1'); } catch (e) {} });
  await ctx.route('**/api/upload', (r) => r.fulfill({ json: { ok: true, ref: 'Video58' + Date.now() } }));
  await ctx.route('**/api/img/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(PHOTO) }));
  await ctx.route('**/api/stock', (r) => r.fulfill({ json: { stock: {} } }));
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  const p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
  await p.goto(SITE + '/produit/support-telephone-bois-grave', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.scSite && document.querySelectorAll('#formes button').length === 4);
  await p.addStyleTag({ content: '.niv-ok,.flot-btn,.qw-btn,[class*="question"]{display:none!important} *{caret-color:transparent!important}' });
  // Aucun prix dans la vidéo (gérant, 14/11 : « mets pas les prix ») : prix masqués, phrases de prix retirées, partout (panier compris).
  await p.addStyleTag({ content: '.price-lead,.pd-totbox,.pd-nfois,.prc-sumtot,.sc-taille em,.sc-item small,.drawer-total,.cart-item-price,.ci-price,[class*="price"]{visibility:hidden!important}' });
  await p.evaluate(() => {
    const PH = [[/\s*:\s*chaque élément gravé coûte \+\s?3\s?€\./g, '.'], [/\s*·\s*\+\s?3\s?€ par élément/g, ''], [/\s*·\s*\+\s?3\s?€/g, ''],
      [/\s*[—–-]\s*\+?\s?\d+(,\d+)?\s?€/g, ''], [/\s*\(dès \d+\s?€\)/g, ''], [/\+?\s?\d+(,\d+)?\s?€/g, '']];
    const net = (r) => { const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { let t = n.nodeValue; for (const [re, by] of PH) t = t.replace(re, by); if (t !== n.nodeValue) n.nodeValue = t; } };
    net(document.body); new MutationObserver(() => net(document.body)).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await p.waitForTimeout(1500);
  const liste = []; let n = 0;
  const shot = async (dur = 1, tap = null, extra = {}) => { const f = String(n++).padStart(4, '0') + '.png'; await p.screenshot({ path: path.join(dir, f) }); liste.push({ f, dur, tap, ...extra }); };
  const centre = async (sel) => { const r = await p.locator(sel).first().boundingBox(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; };
  // amène l'élément juste sous l'aperçu collé en haut
  const voir = async (sel, marge = 14) => {
    await p.evaluate(([s, m]) => {
      const e = document.querySelector(s); if (!e) throw new Error('introuvable ' + s);
      const st = document.getElementById('stage'); const bas = st ? st.getBoundingClientRect().bottom : 0;
      window.scrollBy(0, e.getBoundingClientRect().top - Math.max(bas, 0) - m);
    }, [sel, marge]); await p.waitForTimeout(600);
  };
  const toucher = async (sel, dur = 1.1, extra = {}) => { const c = await centre(sel); await shot(0.45, c, extra); await p.locator(sel).first().click(); await p.waitForTimeout(900); await shot(dur, c); };
  const taper = async (sel, texte) => {
    const c = await centre(sel); await p.locator(sel).first().click(); await p.fill(sel, ''); await p.waitForTimeout(300); await shot(0.35, c);
    for (const ch of texte) { await p.type(sel, ch); await p.waitForTimeout(350); await shot(0.28, c); }
  };

  await shot(1.6, null, { etape: 'arrivee' });
  await voir('#formes', 10); await shot(0.6, null, { etape: 'forme' });
  await toucher('#formes [data-v="chat"]', 1.0);
  await toucher('#formes [data-v="arche"]', 1.2);
  await voir('#tailles', 10); await toucher('#tailles [data-v="standard"]', 1.0, { etape: 'taille' });
  // gravure : un texte
  await voir('#modes', 10); await shot(0.8, null, { etape: 'gravure' });
  await voir('.sc-ajouts', 10); await toucher('.sc-ajout[data-a="texte"]', 0.6, { etape: 'texte' });
  await voir('#ntexte', 10); await taper('#ntexte', 'Camille');
  const pol = '#panneau .prc-pol[data-pol="great-vibes"]';
  if (await p.$(pol)) await toucher(pol, 0.9);
  await toucher('#okTexte', 1.2);
  // un dessin
  await voir('.sc-ajouts', 10); await toucher('.sc-ajout[data-a="dessin"]', 0.7, { etape: 'dessin' });
  await voir('#panneau', 10); await shot(0.8);
  await toucher('#panneau [data-n="27"]', 1.3);
  // une photo
  await voir('.sc-ajouts', 10); await toucher('.sc-ajout[data-a="photo"]', 0.7, { etape: 'photo' });
  await p.setInputFiles('#fphoto', PHOTO);
  await p.waitForFunction(() => window.scSite.S.els.length === 3); await p.waitForTimeout(900);
  await shot(1.4);
  // glisser la photo au doigt
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
  await voir('#formes', 10);
  const pos = await p.evaluate(() => { const g = [...document.querySelectorAll('#scene .sc-el')].pop(); const r = g.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await shot(0.6, pos, { etape: 'glisser' });
  await p.mouse.move(pos[0], pos[1]); await p.mouse.down();
  for (let i = 1; i <= 10; i++) { const y = pos[1] - 26 * i / 10; const x = pos[0] + 6 * Math.sin(i / 3); await p.mouse.move(x, y, { steps: 2 }); await p.waitForTimeout(60); await shot(0.12, [x, y]); }
  await p.mouse.up(); await p.waitForTimeout(500); await shot(1.0);
  // motif ajouré
  await voir('#modes', 10); await toucher('#modes [data-m="ajoure"]', 1.0, { etape: 'ajoure' });
  await voir('#motifs', 10); await toucher('#motifs [data-v="coeurs"]', 1.3);
  // 3D tournée au doigt
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await voir('#formes', 10);
  await toucher('#vueBtns [data-vue="3d"]', 1.0, { etape: '3d' });
  await p.waitForFunction(() => typeof window.THREE !== 'undefined'); await p.waitForTimeout(1500);
  await shot(0.8);
  const cv = await p.evaluate(() => { const c = document.getElementById('vue3d').getBoundingClientRect(); return [c.x + c.width / 2, c.y + c.height / 2, c.width]; });
  const amp = Math.min(110, cv[2] * 0.32);
  await p.mouse.move(cv[0] - amp, cv[1]); await p.mouse.down();
  for (let i = 0; i < 34; i++) { const x = cv[0] - amp + 2 * amp * (i / 33); await p.mouse.move(x, cv[1], { steps: 2 }); await p.waitForTimeout(60); await shot(0.08, [x, cv[1]], { glisse: true }); }
  await p.mouse.up(); await p.waitForTimeout(400); await shot(1.0);
  await toucher('#vueBtns [data-vue="2d"]', 0.8);
  // résumé et panier
  await p.evaluate(() => document.getElementById('resume').scrollIntoView({ block: 'start' })); await p.waitForTimeout(700);
  await shot(1.8, null, { etape: 'resume' });
  await p.evaluate(() => document.getElementById('ajouter').scrollIntoView({ block: 'center' })); await p.waitForTimeout(600);
  const cb = await centre('#ajouter'); await shot(0.6, cb, { etape: 'panier' });
  await p.click('#ajouter');
  await p.waitForFunction(() => /Ajouté/.test(document.getElementById('ajouter').textContent), null, { timeout: 30000 });
  await shot(0.9, cb);
  await p.waitForTimeout(1600); await shot(2.0, null, { etape: 'ajoute' });
  fs.writeFileSync(path.join(dir, 'liste.json'), JSON.stringify({ dpr: DPR, vw: VW, vh: VH, liste }, null, 1));
  console.log('support', liste.length, 'photos', 'erreurs', err.slice(0, 3));
  await b.close();
})().catch((e) => { console.error('ERREUR', String(e).slice(0, 400)); process.exit(1); });
