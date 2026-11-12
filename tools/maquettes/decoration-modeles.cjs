// Fabrique les 5 « modèles prêts à personnaliser » de la maquette décoration (12/11/2026).
// Ouvre la maquette, compose chaque modèle avec le vrai placement automatique, garde les pièces posées,
// le prix et une image de l'aperçu → <dossier>/modeles-maquette.json (6e argument de decoration-createur.py).
//   node tools/maquettes/decoration-modeles.cjs <decoration-createur.html> <dossier>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const [page,dos]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
 const err=[];p.on('pageerror',e=>err.push(e.message));
 await p.goto('file://'+path.resolve(page));await p.waitForTimeout(2500);
 await p.addStyleTag({content:'.sc-mur,.sc-vue,#astuce,.sc-tag,.gallery-arrow{display:none!important}'});
 const n=await p.evaluate(()=>window.scComposer?1:0);if(!n)throw new Error('scComposer absent');
 const out={};const ids=['flocons','foret','etoile','couple','mamie'];
 for(let i=0;i<ids.length;i++){const r=await p.evaluate(i=>scComposer(i),i);await p.waitForTimeout(600);
  await p.locator('#scene').scrollIntoViewIfNeeded();const img=path.join(dos,'modele-'+ids[i]+'.png');
  await p.locator('#scene').screenshot({path:img});
  out[ids[i]]={els:r.els,total:r.total,img:path.resolve(img),flottant:r.els.filter(e=>e.flottant).length,n:r.els.length}}
 fs.writeFileSync(path.join(dos,'modeles-maquette.json'),JSON.stringify(out));
 for(const k in out)console.log(k,out[k].n,'pièces',out[k].flottant,'flottant(s)',out[k].total,'€');
 console.log('erreurs',JSON.stringify(err));await b.close()})();
