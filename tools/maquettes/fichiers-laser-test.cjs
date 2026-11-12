// Fichiers laser de TEST des trois maquettes (support de téléphone, arbre de vie, décoration à suspendre) — 12/11/2026.
// Gérant : « fais-moi de ces trois trucs un test… pour que j'essaie sur la machine si ça marche, les découpes, la gravure ».
// Ouvre chaque maquette, règle un exemple, relit son « fichier de l'atelier » et en fait un vrai SVG pour le laser :
//   taille réelle en mm · rouge #FF0000 = découpe (tracés vectoriels) · noir = gravure (tracés pleins, textes compris).
// Les contours exacts des maquettes (formes Atomm du support, cadre de la décoration, pied de l'arbre) sont gardés tels quels ;
// ce qui n'est pas un tracé (noms soudés, pièces découpées autour d'un dessin, textes gravés) est rendu à 25 points par mm
// puis vectorisé par potrace (précision ≈ 0,04 mm). Chaque matière a son fichier (on ne découpe pas l'acrylique et le
// contreplaqué sur la même planche).
//   node tools/maquettes/fichiers-laser-test.cjs <support.html> <dossier du site de l'arbre> <decoration.html> <sortie>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {execFileSync,spawn}=require('child_process');
const [SUP,ARB,DECO,OUT]=process.argv.slice(2).map(p=>path.resolve(p));
const R=25,TMP=path.join(OUT,'.tmp');fs.mkdirSync(TMP,{recursive:true});
const FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@400;600&family=Inter:wght@400;600&family=Great+Vibes&family=Allura&family=Pacifico&display=swap">';

/* ---- potrace : PNG → tracés en mm (coordonnées absolues, aucune transformation) ---- */
function tracer(png,nom){
 const pbm=path.join(TMP,nom+'.pbm'),svg=path.join(TMP,nom+'.svg');
 execFileSync('python3',['-I','-c','import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("L").point(lambda v:0 if v<128 else 255,"1")\nim.save(sys.argv[2])',png,pbm]);
 execFileSync('potrace',['-b','svg','-t','4','-O','0.2','-o',svg,pbm]);
 const s=fs.readFileSync(svg,'utf8'),H=+s.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1];
 const ds=[...s.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);
 const T=(x,y)=>[(x/10)/R,(H-y/10)/R];
 return ds.map(d=>aplatir(d,T)).filter(Boolean)}
function aplatir(d,T){const tk=d.match(/[MmLlCcZz]|-?[\d.]+/g);let i=0,cx=0,cy=0,sx=0,sy=0,cmd='',o=[];
 const n=()=>+tk[i++],f=v=>Math.round(v*1000)/1000,p=(x,y)=>{const q=T(x,y);return f(q[0])+' '+f(q[1])};
 while(i<tk.length){if(/[A-Za-z]/.test(tk[i]))cmd=tk[i++];
  if(cmd==='M'||cmd==='m'){let x=n(),y=n();if(cmd==='m'){x+=cx;y+=cy}cx=sx=x;cy=sy=y;o.push('M'+p(x,y));cmd=cmd==='m'?'l':'L'}
  else if(cmd==='L'||cmd==='l'){let x=n(),y=n();if(cmd==='l'){x+=cx;y+=cy}cx=x;cy=y;o.push('L'+p(x,y))}
  else if(cmd==='C'||cmd==='c'){const a=[n(),n(),n(),n(),n(),n()];if(cmd==='c')for(let k=0;k<6;k+=2){a[k]+=cx;a[k+1]+=cy}
   o.push('C'+p(a[0],a[1])+' '+p(a[2],a[3])+' '+p(a[4],a[5]));cx=a[4];cy=a[5]}
  else if(cmd==='Z'||cmd==='z'){o.push('Z');cx=sx;cy=sy;i+=0;cmd='';if(i<tk.length&&!/[A-Za-z]/.test(tk[i]))cmd='l'}
  else i++}
 return o.join('')}

(async()=>{
 const srv=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:ARB,stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
 const b=await chromium.launch();
 const raster=await b.newPage({viewport:{width:800,height:800}});
 await raster.setContent('<html><head>'+FONTS+'</head><body style="margin:0;background:#fff"><div id="lzr"></div></body></html>');await raster.waitForTimeout(800);
 async function rendre(markup,w,h,nom){const W=Math.ceil(w*R),H=Math.ceil(h*R);await raster.setViewportSize({width:W,height:H});
  await raster.evaluate(([m,w,h,W,H])=>{document.getElementById('lzr').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+w+' '+h+'" style="display:block;background:#fff">'+m+'</svg>'},[markup,w,h,W,H]);
  await raster.evaluate(()=>document.fonts.ready);await raster.waitForTimeout(700);
  const f=path.join(TMP,nom+'.png');await raster.screenshot({path:f,clip:{x:0,y:0,width:W,height:H}});return f}
 const fichiers=[];
 /* assemble le fichier final dans la page de rendu, mesure la boîte de tout le contenu et la cale à 5 mm du bord */
 async function ecrire(nom,f){
  const cut=[],grav=[];
  if(f.plein){const t=tracer(await rendre(f.plein,f.w,f.h,nom+'-c'),nom+'-c');cut.push(...t)}
  if(f.grav){const t=tracer(await rendre(f.grav,f.w,f.h,nom+'-g'),nom+'-g');grav.push(...t)}
  const svg=await raster.evaluate(([vect,cut,grav])=>{const NS='http://www.w3.org/2000/svg';
   const z=document.getElementById('lzr');z.innerHTML='<svg xmlns="'+NS+'" width="1000" height="1000"><g id="tout"><g id="decoupe" fill="none" stroke="#FF0000" stroke-width="0.1">'+vect
    +cut.map(d=>'<path d="'+d+'"/>').join('')+'</g><g id="gravure" fill="#000000" stroke="none">'+grav.map(d=>'<path d="'+d+'"/>').join('')+'</g></g></svg>';
   z.querySelectorAll('#decoupe [stroke-width],#decoupe [stroke],#decoupe [fill]').forEach(e=>{e.removeAttribute('stroke-width');e.removeAttribute('stroke');e.removeAttribute('fill');e.setAttribute('vector-effect','non-scaling-stroke')});
   const bb=document.getElementById('tout').getBBox(),r=v=>Math.round(v*100)/100,W=r(bb.width+10),H=r(bb.height+10);
   const g=document.getElementById('tout');g.setAttribute('transform','translate('+r(5-bb.x)+' '+r(5-bb.y)+')');
   return {w:W,h:H,s:'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="'+NS+'" width="'+W+'mm" height="'+H+'mm" viewBox="0 0 '+W+' '+H+'">\n'+g.outerHTML+'\n</svg>\n'}},[f.vect||'',cut,grav]);
  const fn=path.join(OUT,nom+'.svg');fs.writeFileSync(fn,svg.s);
  fichiers.push({fichier:nom+'.svg',w:svg.w,h:svg.h,coupe:cut.length+(f.vect?(f.vect.match(/<path/g)||[]).length:0),gravure:grav.length,titre:f.titre,matiere:f.matiere,note:f.note||''});
  console.log(nom,svg.w+' × '+svg.h+' mm','découpe',cut.length,'gravure',grav.length)}

 const p=await b.newPage({viewport:{width:1280,height:900}});const err=[];p.on('pageerror',e=>err.push(e.message));
 async function apercu(nom){const loc=p.locator('#scene');await loc.scrollIntoViewIfNeeded();await p.addStyleTag({content:'.sc-mur,.sc-vue,#astuce,.sc-tag,.gallery-arrow,#scene [stroke-dasharray]{display:none!important}'});
  await loc.screenshot({path:path.join(OUT,nom+'-apercu.png')})}

 /* ===== 1. support de téléphone : standard · rectangle · 13° · câble · « Camille » gravé ===== */
 const utf=f=>{const c=path.join(TMP,path.basename(f));fs.writeFileSync(c,'<meta charset="utf-8">'+fs.readFileSync(f,'utf8'));return c};
 await p.route('http://127.0.0.1:8765/index.html',async r=>{const res=await r.fetch();r.fulfill({response:res,headers:{...res.headers(),'content-type':'text/html; charset=utf-8'}})});
 await p.goto('file://'+utf(SUP));await p.waitForTimeout(2500);
 await p.evaluate(()=>{scDemo({forme:'rectangle',taille:'standard'});const S=scEtat().S;S.els=S.els.filter(e=>e.type==='texte');S.els[0].texte='Camille';});
 await p.evaluate(()=>document.querySelector('#formes [data-v="rectangle"],#formes .sc-forme.on')?.click());await p.waitForTimeout(1200);
 const sup=await p.evaluate(()=>{const F=document.getElementById('fichier'),vb=F.getAttribute('viewBox').split(' ').map(Number);
  const vect=[...F.children].filter(g=>g.tagName==='g'&&g.querySelector('path[stroke="#FF0000"]')).map(g=>g.outerHTML).join('');
  const c=F.cloneNode(true);[...c.children].filter(g=>g.tagName==='g'&&!g.getAttribute('clip-path')).forEach(g=>g.remove());
  c.querySelectorAll('[fill="#111"]').forEach(e=>e.setAttribute('fill','#000'));
  return {w:vb[2],h:vb[3],vect,grav:c.innerHTML,fnom:document.getElementById('fnom').textContent}});
 await apercu('support-standard-rectangle-camille');
 await ecrire('support-standard-rectangle-camille',{...sup,titre:'Support de téléphone · standard · rectangle arrondi · 13° · « Camille » gravé',matiere:'Contreplaqué 3 mm'});

 /* ===== 2. arbre de vie : 2 prénoms dans des cœurs + pied gravé ===== */
 await p.goto('http://127.0.0.1:8765/index.html');await p.waitForTimeout(3000);
 await p.evaluate(()=>{const S=abEtat().S;S.arbre='life';S.forme='heart';S.noms=['Léa','Tom'];S.police='pacifico';S.pied={grave:true,texte:'Léa & Tom',police:'pacifico',ou:'deux'}});
 await p.evaluate(()=>document.querySelector('#formesNoms .sc-style.on')?.click());await p.waitForTimeout(4000);
 await p.evaluate(()=>document.querySelector('#formesNoms .sc-style.on')?.click());await p.waitForTimeout(1500);
 const arb=await p.evaluate(()=>{const F=document.getElementById('fichier'),vb=F.getAttribute('viewBox').split(' ').map(Number),k=[...F.children];
  const a=k.find(g=>g.tagName==='g'&&g.querySelector('g[filter]'));const ac=a.cloneNode(true),fg=ac.querySelector('g[filter]');ac.querySelector('filter').remove();fg.removeAttribute('filter');
  ac.querySelectorAll('[fill]').forEach(e=>{if(e.getAttribute('fill')!=='none')e.setAttribute('fill','#000')});ac.querySelectorAll('[stroke]').forEach(e=>{if(e.getAttribute('stroke')!=='none')e.setAttribute('stroke','#000')});
  const pied=k.find(g=>g.tagName==='g'&&g.getAttribute('transform')&&g.getAttribute('transform').indexOf('translate(200')===0);
  const pv=pied.cloneNode(true);pv.querySelectorAll('rect,text').forEach(e=>e.remove());pv.querySelectorAll('g').forEach(g=>{[...g.children].forEach(c=>{if(!(c.tagName==='path'&&c.getAttribute('stroke')==='#FF0000'))c.remove()})});
  const pg=pied.cloneNode(true);pg.querySelectorAll(':scope > rect, :scope > text, path[stroke="#FF0000"]').forEach(e=>e.remove());
  pg.querySelectorAll('[fill]').forEach(e=>{if(e.getAttribute('fill')!=='none')e.setAttribute('fill','#000')});
  return {arbre:{w:190,h:190,plein:ac.outerHTML},pied:{w:vb[2],h:vb[3],vect:pv.outerHTML,grav:pg.outerHTML},n:abEtat().slots}});
 await apercu('arbre-de-vie-lea-tom');
 await ecrire('arbre-de-vie-coeurs-lea-tom',{...arb.arbre,titre:'Arbre de vie · cœurs · « Léa » et « Tom » (prénoms soudés à l\'arbre)',matiere:'Contreplaqué 3 mm',note:'Une seule découpe : l\'arbre et les prénoms forment une seule pièce.'});
 await ecrire('arbre-pied-grave-lea-tom',{...arb.pied,titre:'Pied de l\'arbre · 2 pièces à emboîter · « Léa & Tom » gravé',matiere:'Contreplaqué 3 mm'});

 /* ===== 3. décoration : « Flocons de neige » (classique, prénom en acrylique bleu) et « Pour Mamie » (plaque pleine) ===== */
 await p.goto('file://'+utf(DECO));await p.waitForTimeout(2500);
 async function deco(i,nom,titre){
  await p.evaluate(i=>document.querySelector('.sc-mod[data-m="'+i+'"]').click(),i);await p.waitForTimeout(1200);
  await apercu(nom);
  const r=await p.evaluate(()=>{const F=document.getElementById('fichier'),vb=F.getAttribute('viewBox').split(' ').map(Number),cl=scEtat().S.style==='classique';
   const out={};
   if(!cl){const vect=F.querySelector('g[data-piece="1"]').outerHTML;const c=F.cloneNode(true);c.querySelector('g[data-piece="1"]').remove();
    c.querySelectorAll('[fill="#111"]').forEach(e=>e.setAttribute('fill','#000'));c.querySelectorAll('feFlood[flood-color="#111"]').forEach(e=>e.setAttribute('flood-color','#000'));
    out.contreplaque={w:vb[2],h:vb[3],vect,grav:c.innerHTML};return out}
   const mats=[...new Set([...F.querySelectorAll('g[data-mat]')].map(g=>g.getAttribute('data-mat')))];
   mats.forEach(m=>{const vect=m==='contreplaque'?F.querySelector('g[data-piece="1"]').outerHTML:'';
    const pieces=[...F.querySelectorAll('g[data-mat="'+m+'"]')].filter(g=>g.getAttribute('data-piece')!=='1');
    const plein=pieces.map(g=>{const c=g.cloneNode(true);
     c.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]').forEach(e=>e.remove());
     c.querySelectorAll('[fill="#111"],image[filter^="url(#t"]').forEach(e=>e.remove());
     c.querySelectorAll('[fill="#fff"],[stroke="#fff"]').forEach(e=>{if(e.closest('mask'))return;if(e.getAttribute('fill')==='#fff')e.setAttribute('fill','#000');if(e.getAttribute('stroke')==='#fff')e.setAttribute('stroke','#000')});
     c.querySelectorAll('[id]').forEach(e=>e.id='c'+e.id);c.querySelectorAll('[mask],[filter],[href],[clip-path]').forEach(e=>['mask','filter','clip-path'].forEach(a=>{const v=e.getAttribute(a);if(v&&v.indexOf('url(#')===0)e.setAttribute(a,'url(#c'+v.slice(5))}));
     c.querySelectorAll('textPath').forEach(t=>t.setAttribute('href','#c'+t.getAttribute('href').slice(1)));
     return c.outerHTML}).join('');
    const grav=pieces.map(g=>{const c=g.cloneNode(true);c.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]').forEach(e=>e.remove());
     c.querySelectorAll('[fill="#111"]').forEach(e=>e.setAttribute('fill','#000'));c.querySelectorAll('feFlood[flood-color="#111"]').forEach(e=>e.setAttribute('flood-color','#000'));return c.outerHTML}).join('');
    const hasGrav=pieces.some(g=>g.querySelector('[fill="#111"],feFlood[flood-color="#111"]'));
    out[m]={w:vb[2],h:vb[3],vect,plein:plein||null,grav:hasGrav?grav:null}});
   return out});
  const noms={contreplaque:'Contreplaqué 3 mm','acr-bleu':'Acrylique bleu 3 mm','acr-rouge':'Acrylique rouge 3 mm','acr-blanc':'Acrylique blanc 3 mm','acr-noir':'Acrylique noir 3 mm'};
  for(const m in r)await ecrire(nom+'-'+m,{...r[m],titre:titre+' · '+noms[m].toLowerCase().replace(' 3 mm',''),matiere:noms[m],
   note:m==='contreplaque'&&Object.keys(r).length>1?'Le cadre et les petites pièces en bois. Le prénom est dans le fichier acrylique.':(m!=='contreplaque'?'À découper dans la plaque d\'acrylique, puis à coller sur le cadre comme sur l\'aperçu.':'')})}
 await deco(0,'decoration-boule-flocons-camille','Décoration · boule · « Flocons de neige »');
 await deco(4,'decoration-cadeau-mamie','Décoration · cadeau · « Pour Mamie » (plaque pleine)');

 fs.writeFileSync(path.join(OUT,'fichiers.json'),JSON.stringify(fichiers,null,1));
 console.log('erreurs',JSON.stringify(err));await b.close();srv.kill();fs.rmSync(TMP,{recursive:true,force:true})})();
