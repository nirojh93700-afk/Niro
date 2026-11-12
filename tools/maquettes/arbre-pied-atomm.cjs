const {chromium}=require('playwright');const fs=require('fs');/* Le pied de l'arbre de vie : les 2 pièces du « Card Stand Generator » d'Atomm, calculées par LEUR outil ouvert dans le navigateur
   (rien de leur code ne tourne sur la machine), à la taille choisie pour l'arbre de 18 cm : 100 × 90 mm, bois 3 mm.
   node tools/maquettes/arbre-pied-atomm.cjs <dossier de sortie>  →  pied-100x90.json (+ pied-nest.svg) */
const D=(process.argv[2]||'.').replace(/\/?$/,'/');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('https://card-stand.generator.atommapps.com/');await p.waitForTimeout(5000);
const r=await p.evaluate(()=>{const C=window.CardStand;const L=C.computeStand(C.normalize({material:3,height:100,width:90}));const n=C.nest(L);
 return {L,n,svg:C.buildSvg(n,''),svgApart:C.buildSvg(L,'')}});
fs.writeFileSync(D+'pied-100x90.json',JSON.stringify(r));fs.writeFileSync(D+'pied-nest.svg',r.svg);
console.log(Object.keys(r.n),JSON.stringify(r.n.nesting).slice(0,400),JSON.stringify(r.n.placements).slice(0,600));
console.log(JSON.stringify(r.L.outline).slice(0,300));console.log(r.svg.slice(0,1500));
await b.close()})();
