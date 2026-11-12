const { chromium } = require('playwright'); const fs=require('fs'); const {setRange,setCheck,device,dl}=require('./support-atomm-cap.cjs');
const TAILLES={petit:'Small phone',standard:'Standard phone',grand:'Large phone'};
const FORMES={rectangle:'Rounded rect',arche:'Round arch',chat:'Cat head',ours:'Bear ears'};
const MOTIFS={coeurs:'Hearts',pattes:'Paw prints',soleil:'Sunburst',nid:'Honeycomb',losanges:'Diamonds',persienne:'Louvre',fenetre:'Window',etoiles:'Stars'};
const ANGLES=[10,13,16,20], DENS={moins:0.2,moyen:0.5,plus:0.8};
const OUT='donnees.json'; let D=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT)):{};
function garde(k,svg){ const g=[...svg.matchAll(/<g id="cut"[^>]*>([\s\S]*?)<\/g>\s*<\/g>|<g id="cut"[^>]*>([\s\S]*?)\n<g id="engrave"/g)];
  const cut = svg.split('<g id="engrave"')[0];
  const parts=[...cut.matchAll(/<g transform="translate\(([\d.]+) ([\d.]+)\)"><path d="([^"]+)"/g)].map(m=>({x:+m[1],y:+m[2],d:m[3]}));
  const vb=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); D[k]={lw:+vb[1],lh:+vb[2],dos:parts[0],pied:parts[1]}; }
(async()=>{
 const b = await chromium.launch(); const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1440,height:950}}); const p=await ctx.newPage();
 await p.goto('https://phone-stand-generator.generator.atommapps.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(6000);
 let n=0; const t0=Date.now();
 async function prendre(k){ if(D[k]) return; await p.waitForTimeout(350); const r=await dl(p); garde(k,r.svg); n++; if(n%20===0){fs.writeFileSync(OUT,JSON.stringify(D)); console.log(n,k,Math.round((Date.now()-t0)/1000)+'s');} }
 for (const [ta,tn] of Object.entries(TAILLES)) {
  await device(p,tn);
  // A : gravé (sans motif) — contour + fentes + pied, par forme, câble, inclinaison
  await p.getByText('Engrave',{exact:true}).click({force:true}); await p.waitForTimeout(200);
  for (const [fo,fn] of Object.entries(FORMES)) { await p.getByText(fn,{exact:true}).click(); await p.waitForTimeout(200);
   for (const c of [true,false]) { await setCheck(p,'Cable slot',c);
    for (const a of ANGLES) { await setRange(p,0,a); await prendre(`A|${ta}|${fo}|${c?1:0}|${a}`); } } }
  await setCheck(p,'Cable slot',true);
  // B/C : ajouré — motifs du dossier (par forme, à 13°) et du pied (par inclinaison, forme rectangle)
  await p.getByText('Cut out',{exact:true}).click({force:true}); await p.waitForTimeout(300);
  await setCheck(p,'Pattern on foot plate',true);
  for (const [mo,mn] of Object.entries(MOTIFS)) { await p.getByText(mn,{exact:true}).click(); await p.waitForTimeout(200);
   for (const [de,dv] of Object.entries(DENS)) { await setRange(p,1,dv);
    for (const [fo,fn] of Object.entries(FORMES)) { await p.getByText(fn,{exact:true}).click(); await p.waitForTimeout(150);
     if (fo==='rectangle') { for (const a of ANGLES) { await setRange(p,0,a); await prendre(`B|${ta}|${fo}|${mo}|${de}|${a}`); } await setRange(p,0,13); }
     else { await setRange(p,0,13); await prendre(`B|${ta}|${fo}|${mo}|${de}|13`); } } } }
 }
 fs.writeFileSync(OUT,JSON.stringify(D)); console.log('FIN',n,Object.keys(D).length,Math.round((Date.now()-t0)/1000)+'s');
 await b.close();})().catch(e=>{fs.writeFileSync(OUT,JSON.stringify(D));console.log('ERREUR',e.message);process.exit(1)});
