// LEUR outil « Number Box with Living Hinge » (Atomm) ouvert dans le navigateur : exporte les fichiers de plusieurs chiffres et réglages,
// pour voir comment la boîte est faite (fond à encoches, bande à fentes en 1 à 4 morceaux, couronne, couvercle et sa cale, dos).
//   NODE_PATH=$(npm root -g) node tools/maquettes/boite-atomm-releve.cjs <dossier de sortie>
// Rien de leur programme n'est lancé sur la machine : c'est LEUR page, dans le navigateur.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const S = process.argv[2] || '.';
(async () => {
  const nav = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 950 }, locale: 'en-US', acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 200)));
  await p.goto('https://number-box-with-living-hinge.generator.atommapps.com/', { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(4500);
  await p.getByText('2D preview', { exact: true }).click(); await p.waitForTimeout(600);
  const sel = async (id, v) => p.evaluate(([id, v]) => { const e = document.getElementById(id); if (e.type === 'checkbox') { if (e.checked !== v) e.click(); return; } e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
  const stats = async () => p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').match(/Size \(W.*Total pieces: \d+/)?.[0] || '?');
  const exporter = async (nom) => { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.locator('#tb_btnExport').click()]); const f = path.join(S, 'x-' + nom + '.svg'); await d.saveAs(f); await p.screenshot({ path: path.join(S, 'x-' + nom + '.png') }); console.log(nom, '|', await stats(), '|', d.suggestedFilename(), fs.statSync(f).size); };
  for (const c of ['0', '8', '1', '4']) { await p.getByRole('button', { name: c, exact: true }).click(); await p.waitForTimeout(700); await exporter('ch' + c); }
  await p.getByRole('button', { name: '4', exact: true }).click(); await sel('tb_chkFlat', true); await p.waitForTimeout(700); await exporter('ch4-base');
  await sel('tb_chkFlat', false); await sel('tb_selParts', '2'); await p.waitForTimeout(700); await exporter('ch4-2p');
  await sel('tb_selCover', 'none'); await p.waitForTimeout(700); await exporter('ch4-2p-sansfond');
  await sel('tb_selParts', '1'); await sel('tb_selCover', 'back'); await sel('tb_iPitch', '3'); await sel('tb_iPad', '0'); await sel('tb_iK', '0.15'); await p.waitForTimeout(700); await exporter('ch4-pas3-pad0-kerf');
  await p.getByText('3D Preview', { exact: true }).click(); await p.waitForTimeout(800); await p.getByRole('button', { name: '8', exact: true }).click(); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(S, 'x-3d-8.png') });
  await nav.close();
})();
