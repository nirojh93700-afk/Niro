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
 const slug=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'x';
 /* Un fichier = une liste d'OBJETS, chacun déplaçable d'un bloc dans le logiciel du laser :
      {id, type:'vect', markup}  contour exact de la maquette, gardé tel quel (découpe)
      {id, type:'cut',  markup}  silhouette noire → son contour devient UN tracé rouge (découpe)
      {id, type:'grav', markup}  dessin noir → UN tracé noir plein (gravure)
    Tout est mesuré puis calé à 5 mm du bord. */
 async function ecrire(nom,f){
  const objs=[];let n=0;
  for(const o of f.objets){n++;
   if(o.type==='vect'){objs.push({...o});continue}
   const ds=tracer(await rendre(o.markup,f.w,f.h,nom+'-'+n),nom+'-'+n);if(ds.length)objs.push({id:o.id,type:o.type,d:ds.join(' ')})}
  const svg=await raster.evaluate(([objs])=>{const NS='http://www.w3.org/2000/svg',esc=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
   const z=document.getElementById('lzr');
   z.innerHTML='<svg xmlns="'+NS+'" width="1000" height="1000"><g id="tout">'+objs.map(o=>o.type==='vect'?'<g id="'+esc(o.id)+'" data-v="1">'+o.markup+'</g>'
     :o.type==='cut'?'<path id="'+esc(o.id)+'" fill="none" stroke="#FF0000" stroke-width="0.1" d="'+o.d+'"/>':'<path id="'+esc(o.id)+'" fill="#000000" stroke="none" d="'+o.d+'"/>').join('')+'</g></svg>';
   z.querySelectorAll('g[data-v] path').forEach(e=>{e.setAttribute('fill','none');e.setAttribute('stroke','#FF0000');e.setAttribute('stroke-width','0.1');e.setAttribute('vector-effect','non-scaling-stroke');e.removeAttribute('fill-rule')});
   z.querySelectorAll('g[data-v]').forEach(e=>{e.removeAttribute('data-v');e.querySelectorAll('[data-mat],[data-piece],[data-nom]').forEach(x=>{x.removeAttribute('data-mat');x.removeAttribute('data-piece');x.removeAttribute('data-nom')})});
   const g=document.getElementById('tout'),bb=g.getBBox(),r=v=>Math.round(v*100)/100,W=r(bb.width+10),H=r(bb.height+10);
   g.setAttribute('transform','translate('+r(5-bb.x)+' '+r(5-bb.y)+')');g.removeAttribute('id');
   return {w:W,h:H,s:'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="'+NS+'" width="'+W+'mm" height="'+H+'mm" viewBox="0 0 '+W+' '+H+'">\n'+g.outerHTML.replace(/></g,'>\n<')+'\n</svg>\n'}},[objs]);
  fs.writeFileSync(path.join(OUT,nom+'.svg'),svg.s);
  const liste=objs.map(o=>({id:o.id,quoi:o.type==='grav'?'gravure':'découpe'}));
  fichiers.push({fichier:nom+'.svg',w:svg.w,h:svg.h,titre:f.titre,matiere:f.matiere,note:f.note||'',gravure:objs.some(o=>o.type==='grav'),objets:liste});
  console.log(nom,svg.w+' × '+svg.h+' mm ·',liste.map(o=>o.id+(o.quoi==='gravure'?' (gravure)':'')).join(', '))}

 const p=await b.newPage({viewport:{width:1280,height:900}});const err=[];p.on('pageerror',e=>err.push(e.message));
 async function apercu(nom){const loc=p.locator('#scene');await loc.scrollIntoViewIfNeeded();await p.addStyleTag({content:'.sc-mur,.sc-vue,#astuce,.sc-tag,.gallery-arrow,#scene [stroke-dasharray]{display:none!important}'});
  await loc.screenshot({path:path.join(OUT,nom+'-apercu.png')})}
 const utf=f=>{const c=path.join(TMP,path.basename(f));fs.writeFileSync(c,'<meta charset="utf-8">'+fs.readFileSync(f,'utf8'));return c};
 await p.route('http://127.0.0.1:8765/index.html',async r=>{const res=await r.fetch();r.fulfill({response:res,headers:{...res.headers(),'content-type':'text/html; charset=utf-8'}})});

 /* ===== 1. support de téléphone : standard · rectangle · 13° · câble · « Camille » gravé ===== */
 await p.goto('file://'+utf(SUP));await p.waitForTimeout(2500);
 await p.evaluate(()=>{scDemo({forme:'rectangle',taille:'standard'});const S=scEtat().S;S.els=S.els.filter(e=>e.type==='texte');S.els[0].texte='Camille';});
 await p.evaluate(()=>document.querySelector('#formes [data-v="rectangle"],#formes .sc-forme.on')?.click());await p.waitForTimeout(1200);
 const sup=await p.evaluate(()=>{const F=document.getElementById('fichier'),vb=F.getAttribute('viewBox').split(' ').map(Number),S=scEtat().S;
  const gs=[...F.children].filter(g=>g.tagName==='g'&&g.querySelector('path[stroke="#FF0000"]'));
  const objets=gs.map((g,i)=>({id:i?'pied':'dossier',type:'vect',markup:g.outerHTML}));
  const clip=F.querySelector('clipPath').outerHTML,gg=F.querySelector('g[clip-path]');
  [...gg.children].forEach((c,i)=>{const k=c.cloneNode(true);if(k.getAttribute('fill')==='#111')k.setAttribute('fill','#000');
   const e=S.els[i]||{};objets.push({id:'gravure-'+(k.tagName==='text'?k.textContent:'element-'+(i+1)),type:'grav',markup:clip+'<g clip-path="url(#fclip)">'+k.outerHTML+'</g>'})});
  return {w:vb[2],h:vb[3],objets}});
 sup.objets.forEach(o=>o.id=slug(o.id));
 await apercu('support-standard-rectangle-camille');
 await ecrire('support-standard-rectangle-camille',{...sup,titre:'Support de téléphone · standard · rectangle arrondi · 13° · « Camille » gravé',matiere:'Contreplaqué 3 mm',
  note:'3 objets : le dossier, le pied, et « Camille » (gravure) que vous pouvez déplacer.'});

 /* ===== 2. arbre de vie : 2 prénoms dans des cœurs + pied gravé ===== */
 await p.goto('http://127.0.0.1:8765/index.html');await p.waitForTimeout(3000);
 await p.evaluate(()=>{const S=abEtat().S;S.arbre='life';S.forme='heart';S.noms=['Léa','Tom'];S.police='pacifico';S.pied={grave:true,texte:'Léa & Tom',police:'pacifico',ou:'deux'}});
 await p.evaluate(()=>document.querySelector('#formesNoms .sc-style.on')?.click());await p.waitForTimeout(4000);
 await p.evaluate(()=>document.querySelector('#formesNoms .sc-style.on')?.click());await p.waitForTimeout(1500);
 const arb=await p.evaluate(()=>{const F=document.getElementById('fichier'),vb=F.getAttribute('viewBox').split(' ').map(Number),k=[...F.children],S=abEtat().S;
  const noir=c=>{c.querySelectorAll('[fill]').forEach(e=>{if(e.getAttribute('fill')!=='none')e.setAttribute('fill','#000')});c.querySelectorAll('[stroke]').forEach(e=>{if(e.getAttribute('stroke')!=='none')e.setAttribute('stroke','#000')});return c};
  const a=k.find(g=>g.tagName==='g'&&g.querySelector('g[filter]')),tr=a.getAttribute('transform');
  /* fichier modifiable : le prénom dépasse de 0,8 mm sur le bois tout autour du cœur → « Unir » le ressoude à l'arbre */
  const libre=(c,i)=>{const cp=c.querySelector('clipPath'),d=cp?cp.querySelector('path').getAttribute('d'):'';if(!d)return c;
   const K=+((a.getAttribute('transform').match(/scale\(([\d.]+)/)||[0,1])[1]),NS='http://www.w3.org/2000/svg',m=document.createElementNS(NS,'mask');
   m.setAttribute('id','mh'+i);m.setAttribute('maskUnits','userSpaceOnUse');m.setAttribute('x','-50');m.setAttribute('y','-50');m.setAttribute('width','500');m.setAttribute('height','500');
   m.innerHTML='<path d="'+d+'" fill="#fff" stroke="#fff" stroke-width="'+(1.6/K).toFixed(2)+'" stroke-linejoin="round"/>';
   c.removeAttribute('clip-path');c.setAttribute('mask','url(#mh'+i+')');c.insertBefore(m,c.firstChild);return c};
  const ac=a.cloneNode(true),fg=ac.querySelector('g[filter]');ac.querySelector('filter').remove();fg.removeAttribute('filter');noir(ac);
  const src=a.querySelector('g[filter]'),enf=[...src.children];
  const arbreSeul='<g transform="'+tr+'">'+enf[0].outerHTML+'</g>';
  const prenoms=enf.slice(1).map((c,i)=>({id:'prenom-'+(S.noms[i]||i+1),type:'cut',markup:'<g transform="'+tr+'">'+libre(noir(c.cloneNode(true)),i).outerHTML+'</g>'}));
  const pied=k.find(g=>g.tagName==='g'&&g.getAttribute('transform')&&g.getAttribute('transform').indexOf('translate(200')===0),pt=pied.getAttribute('transform');
  const pieces=[...pied.children].filter(g=>g.tagName==='g');const po=[];
  pieces.forEach((g,i)=>{const v=g.cloneNode(true);[...v.children].forEach(c=>{if(!(c.tagName==='path'&&c.getAttribute('stroke')==='#FF0000'))c.remove()});
   po.push({id:'pied-piece-'+(i?'b':'a'),type:'vect',markup:'<g transform="'+pt+'">'+v.outerHTML+'</g>'})});
  pieces.forEach((g,i)=>{const v=g.cloneNode(true);v.querySelectorAll('path[stroke="#FF0000"]').forEach(e=>e.remove());if(!v.querySelector('text'))return;noir(v);
   po.push({id:'gravure-piece-'+(i?'b':'a')+'-'+S.pied.texte,type:'grav',markup:'<g transform="'+pt+'">'+v.outerHTML+'</g>'})});
  return {pret:{w:190,h:190,objets:[{id:'arbre-et-prenoms',type:'cut',markup:ac.outerHTML}]},
   modif:{w:190,h:190,objets:[{id:'arbre',type:'vect',markup:arbreSeul}].concat(prenoms)},pied:{w:vb[2],h:vb[3],objets:po}}});
 for(const k of ['pret','modif','pied'])arb[k].objets.forEach(o=>o.id=slug(o.id));
 await apercu('arbre-de-vie-lea-tom');
 await ecrire('arbre-de-vie-coeurs-lea-tom-pret-a-decouper',{...arb.pret,titre:'Arbre de vie · prêt à découper · « Léa » et « Tom » soudés à l\'arbre',matiere:'Contreplaqué 3 mm',note:'1 seul objet : l\'arbre et les prénoms forment une seule pièce. À découper tel quel.'});
 await ecrire('arbre-de-vie-coeurs-lea-tom-modifiable',{...arb.modif,titre:'Arbre de vie · modifiable · l\'arbre et chaque prénom séparés',matiere:'Contreplaqué 3 mm',
  note:'3 objets : l\'arbre, « Léa », « Tom ». Déplacez un prénom dans son cœur, puis sélectionnez tout et faites Combiner → Unir avant de découper.'});
 await ecrire('arbre-pied-grave-lea-tom',{...arb.pied,titre:'Pied de l\'arbre · 2 pièces à emboîter · « Léa & Tom » gravé',matiere:'Contreplaqué 3 mm',note:'4 objets : les 2 pièces du pied et les 2 textes gravés, que vous pouvez déplacer.'});

 /* ===== 3. décoration : « Flocons de neige » (classique, prénom en acrylique bleu) et « Pour Mamie » (plaque pleine) ===== */
 await p.goto('file://'+utf(DECO));await p.waitForTimeout(2500);
 async function deco(i,nom,titre){
  await p.evaluate(i=>document.querySelector('.sc-mod[data-m="'+i+'"]').click(),i);await p.waitForTimeout(1200);
  await apercu(nom);
  const r=await p.evaluate(()=>{const F=document.getElementById('fichier'),vb=F.getAttribute('viewBox').split(' ').map(Number),cl=scEtat().S.style==='classique';
   const out={},nomDe=g=>'piece-'+g.getAttribute('data-piece')+'-'+(g.getAttribute('data-nom')||'');
   const cadre={id:cl?'cadre':'plaque',type:'vect',markup:F.querySelector('g[data-piece="1"]').outerHTML};
   const gravDe=g=>{const c=g.cloneNode(true);c.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]').forEach(e=>e.remove());
    c.querySelectorAll('[fill="#111"]').forEach(e=>e.setAttribute('fill','#000'));c.querySelectorAll('feFlood[flood-color="#111"]').forEach(e=>e.setAttribute('flood-color','#000'));return c.outerHTML};
   if(!cl){const clip=F.querySelector('clipPath').outerHTML;
    out.contreplaque={w:vb[2],h:vb[3],objets:[cadre].concat([...F.querySelectorAll('g[clip-path] > g[data-piece]')].map(g=>({id:'gravure-'+nomDe(g),type:'grav',markup:clip+'<g clip-path="url(#fclip)">'+gravDe(g)+'</g>'})))};return out}
   const mats=[...new Set([...F.querySelectorAll('g[data-mat]')].map(g=>g.getAttribute('data-mat')))];
   mats.forEach(m=>{const objets=m==='contreplaque'?[cadre]:[];
    [...F.querySelectorAll('g[data-mat="'+m+'"]')].filter(g=>g.getAttribute('data-piece')!=='1').forEach(g=>{const c=g.cloneNode(true);
     c.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]').forEach(e=>e.remove());
     c.querySelectorAll('[fill="#111"],image[filter^="url(#t"]').forEach(e=>e.remove());
     c.querySelectorAll('[fill="#fff"],[stroke="#fff"]').forEach(e=>{if(e.closest('mask'))return;if(e.getAttribute('fill')==='#fff')e.setAttribute('fill','#000');if(e.getAttribute('stroke')==='#fff')e.setAttribute('stroke','#000')});
     objets.push({id:nomDe(g),type:'cut',markup:c.outerHTML});
     if(g.querySelector('[fill="#111"],feFlood[flood-color="#111"]'))objets.push({id:'gravure-'+nomDe(g),type:'grav',markup:gravDe(g)})});
    out[m]={w:vb[2],h:vb[3],objets}});
   return out});
  const noms={contreplaque:'Contreplaqué 3 mm','acr-bleu':'Acrylique bleu 3 mm','acr-rouge':'Acrylique rouge 3 mm','acr-blanc':'Acrylique blanc 3 mm','acr-noir':'Acrylique noir 3 mm'};
  for(const m in r){r[m].objets.forEach(o=>o.id=slug(o.id));const nb=r[m].objets.length;
   await ecrire(nom+'-'+m,{...r[m],titre:titre+' · '+noms[m].toLowerCase().replace(' 3 mm',''),matiere:noms[m],
   note:nb+' objet'+(nb>1?'s séparés, que vous pouvez déplacer un par un':'')+'. '+(m==='contreplaque'&&Object.keys(r).length>1?'Le prénom est dans le fichier acrylique.':(m!=='contreplaque'?'À découper dans l\'acrylique, puis à coller sur le cadre comme sur l\'aperçu.':''))})}}
 await deco(0,'decoration-boule-flocons-camille','Décoration · boule · « Flocons de neige »');
 await deco(4,'decoration-cadeau-mamie','Décoration · cadeau · « Pour Mamie » (plaque pleine)');

 fs.writeFileSync(path.join(OUT,'fichiers.json'),JSON.stringify(fichiers,null,1));
 console.log('erreurs',JSON.stringify(err));await b.close();srv.kill();fs.rmSync(TMP,{recursive:true,force:true})})();
