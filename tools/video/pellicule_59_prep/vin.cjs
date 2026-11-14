// Images gravées du verre à vin, faites avec l'aperçu de la vraie fiche du site (serveur local).
// Repères de l'éditeur (Nom / Date, barre de taille, flèches) masqués : on garde le verre et sa gravure.
const { chromium } = require('playwright');
const CAS = [
  { sortie: 'vin-1', modele: '1' },
  { sortie: 'vin-14', modele: '14' },
  { sortie: 'vin-texte', texte: 'Camille & Paul', date: '14.06.2026' },
];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('niv-welcome-session', '1'); } catch (e) {} });
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  for (const c of CAS) {
    const p = await ctx.newPage();
    await p.goto('http://localhost:3140/produit/verre-a-vin-grave', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    if (c.modele) {
      await p.locator('button:has-text("Un modèle décoré")').first().click();
      await p.waitForTimeout(500);
      await p.locator('button').filter({ hasText: new RegExp('^n° ' + c.modele + '\\D') }).first().click();
    } else {
      await p.locator('button:has-text("Mon propre texte")').first().click();
      await p.waitForTimeout(500);
      const champs = p.locator('.prc input[type="text"]');
      await champs.nth(0).fill(c.texte);
      if (await champs.count() > 1) await champs.nth(1).fill(c.date);
    }
    await p.waitForTimeout(1500);
    await p.evaluate(() => {
      window.scrollTo(0, 0);
      const g = document.querySelector('.gallery-main');
      for (const e of g.querySelectorAll('.ee-toolbar, .gallery-arrow, .ee-ctrl')) e.style.visibility = 'hidden';
      for (const e of g.querySelectorAll('*')) {
        const t = (e.textContent || '').trim();
        if ((t === 'Nom' || t === 'Date') && e.children.length === 0) { let x = e; for (let i = 0; i < 2 && x.parentElement && x.parentElement !== g; i++) x = x.parentElement; x.style.visibility = 'hidden'; }
      }
      for (const e of g.querySelectorAll('svg line, [class*="ligne"], [class*="guide"], [class*="point"]')) e.style.visibility = 'hidden';
    });
    await p.waitForTimeout(500);
    await p.locator('.gallery-main').first().screenshot({ path: __dirname + '/' + c.sortie + '.png' });
    console.log(c.sortie);
    await p.close();
  }
  await b.close();
})();
