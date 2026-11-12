const {chromium}=require('playwright');const fs=require('fs');const D=(process.argv[3]||'.')+'/';
const PAPER=fs.readFileSync(process.argv[2],'utf8');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await b.newContext({viewport:{width:1440,height:950},locale:'en-US'});const p=await ctx.newPage();
 await p.route('**/paper-full.min.js',r=>r.fulfill({contentType:'application/javascript',body:PAPER}));
 p.on('pageerror',e=>console.log('ERR',e.message.slice(0,200)));
 await p.goto('https://create-your-stack.generator.atommapps.com/',{waitUntil:'load',timeout:60000});await p.waitForTimeout(6000);
 await p.screenshot({path:D+'a2-0-coeur.png'});
 const info=async()=>p.evaluate(()=>{const s=document.querySelector('#previewContainer svg');if(!s)return null;return {vb:s.getAttribute('viewBox'),paths:s.querySelectorAll('path').length,texts:[...s.querySelectorAll('text')].map(t=>t.textContent+'@'+t.getAttribute('font-size'))}});
 console.log('défaut',JSON.stringify(await info()));
 console.log('export',await p.evaluate(()=>{const e=document.querySelector('[data-atomm-export-button]');return e?e.outerHTML.slice(0,400):'-'}));
 // toutes les formes
 const shapes=await p.$$eval('.shape-card',c=>c.map(x=>x.dataset.shape));console.log('formes',shapes.join(' '));
 for(const s of shapes){await p.click('.shape-card[data-shape="'+s+'"]');await p.waitForTimeout(350);const el=await p.$('#previewContainer');await el.screenshot({path:D+'f-'+s+'.png'});console.log(s,JSON.stringify(await info()))}
 // vue SVG
 await p.click('.shape-card[data-shape="heart"]');await p.click('.view-btn[data-view="svgs"]');await p.waitForTimeout(400);await p.screenshot({path:D+'a2-1-svg.png'});
 fs.writeFileSync(D+'coeur-svg.svg',await p.evaluate(()=>document.querySelector('#previewContainer').innerHTML));
 await p.click('.view-btn[data-view="visualisation"]');
 const set=async(id,v)=>{await p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},[id,v]);await p.waitForTimeout(350)};
 await set('spacingRange',-20);await p.screenshot({path:D+'a2-2-serre.png'});console.log('serré',JSON.stringify(await info()));
 await set('spacingRange',0);await set('backScaleRange',1.4);await p.screenshot({path:D+'a2-3-fond14.png'});console.log('fond 1.4',JSON.stringify(await info()));
 await set('backScaleRange',1.0);await set('fontSizeRange',0.2);console.log('police mini',JSON.stringify(await info()));await set('fontSizeRange',1);console.log('police maxi',JSON.stringify(await info()));await set('fontSizeRange',0.85);
 // texte long, beaucoup de noms, accents, vide
 await p.fill('#namesInput','Élodie\nJean-Baptiste\nZoé\nMaximilien\nLéa\nTom\nInès\nPaul');await p.waitForTimeout(500);await p.screenshot({path:D+'a2-4-huit.png'});console.log('8 noms',JSON.stringify(await info()));
 await p.fill('#namesInput','');await p.waitForTimeout(400);console.log('vide',JSON.stringify(await info()),await p.evaluate(()=>document.querySelector('#previewContainer').innerHTML.length));
 await p.fill('#namesInput','Camille');await p.waitForTimeout(400);await p.screenshot({path:D+'a2-5-un.png'});console.log('1 nom',JSON.stringify(await info()));
 // police script
 await p.fill('#namesInput','Emma\nPeter\nZoe');await p.click('.atomm-select-trigger');await p.click('.atomm-select-option[data-value*="Pacifico"]');await p.waitForTimeout(1200);await p.screenshot({path:D+'a2-6-pacifico.png'});console.log('pacifico',JSON.stringify(await info()));
 await b.close()})();
