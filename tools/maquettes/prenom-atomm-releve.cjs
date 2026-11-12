// Relevé des formes du générateur « Personalized Holiday Name Ornament » d'Atomm, avec LEUR outil ouvert dans le navigateur :
// pour chaque modèle (4) × police d'initiale (4) × lettre (A–Z), le fond, le devant et les décors (mm, lettre de 80 mm).
const {chromium}=require('playwright');const fs=require('fs');const D=__dirname+'/brut/';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:950},locale:'en-US'});const p=await ctx.newPage();
 await p.goto('https://personalized-holiday-name-ornament.generator.atommapps.com/',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(7000);
 const AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
 await p.fill('#names',AZ.map(l=>l+l.toLowerCase()).join('\n'));await p.waitForTimeout(4000);
 const lire=()=>p.evaluate(()=>[...document.querySelectorAll('#preview g[data-ornament]')].map(g=>({nom:g.getAttribute('aria-label'),p:[...g.querySelectorAll('path')].map(x=>({f:x.getAttribute('fill'),s:x.getAttribute('stroke')||'',t:x.getAttribute('transform')||'',d:x.getAttribute('d')}))})));
 let avant='';
 const MOD=['renne','bonnet','lapin','cornes'],POL=['lilita','titan','paytone','alfa'];
 for(let m=0;m<4;m++){await p.locator('button.thumb').nth(m).click();await p.waitForTimeout(2500);
  for(const f of POL){await p.selectOption('#initialFont',f);
   const cle=x=>x.length+':'+x.map(o=>o.p.length+'/'+(o.p[1]?o.p[1].d.length+o.p[1].d.slice(0,60):0)).join(',');
   let r=[],sig='',vu=false;for(let t=0;t<60;t++){await p.waitForTimeout(600);r=await lire();const s2=cle(r);
    if(!vu){if(s2!==avant||t>25){vu=true;sig=s2}continue}
    if(r.length===26&&s2===sig)break;sig=s2}
   avant=cle(r);
   fs.writeFileSync(D+MOD[m]+'-'+f+'.json',JSON.stringify(r));
   console.log(MOD[m],f,r.length,'ornements',Math.round(JSON.stringify(r).length/1024),'Ko',r[0]?r[0].p.map(x=>x.f.replace('var(--color-','').replace(')','')).join(' '):'')}}
 await b.close()})();
