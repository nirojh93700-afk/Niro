// Rend le film image par image : node rendu.cjs <film.html> <dossier> [instants séparés par des virgules = aperçu]
const { chromium } = require("playwright");
const [html, out, apercu] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  if (apercu) { for (const t of apercu.split(",").map(Number)) { await p.evaluate((x) => window.render(x), t); await p.screenshot({ path: `${out}/a-${String(t).replace(".", "_")}.jpg`, type: "jpeg", quality: 80 }); } }
  else { const D = await p.evaluate(() => window.DUREE), n = Math.round(D * 30); for (let i = 0; i < n; i++) { await p.evaluate((x) => window.render(x), i / 30); await p.screenshot({ path: `${out}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 93 }); } console.log(n, "images"); }
  if (errs.length) console.log("ERREURS", errs.slice(0, 3));
  await b.close();
})();
