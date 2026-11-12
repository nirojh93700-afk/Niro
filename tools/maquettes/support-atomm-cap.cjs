const { chromium } = require('playwright'); const fs=require('fs');
async function setRange(p, idx, v){ await p.evaluate(([idx,v])=>{const el=[...document.querySelectorAll('input[type=range]')][idx];const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,String(v));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},[idx,v]); }
async function setCheck(p, label, on){ await p.evaluate(([label,on])=>{const el=document.querySelector(`input[aria-label="${label}"]`)||null;if(el&&el.checked!==on)el.click();},[label,on]); }
async function device(p, nom){ await p.getByText(/· e\.g\./).first().click(); await p.waitForTimeout(250); await p.getByText(nom,{exact:false}).last().click(); await p.waitForTimeout(400); }
async function dl(p){ const w=p.waitForEvent('download',{timeout:15000}); await p.getByText('Download SVG',{exact:true}).click(); const d=await w; const f=await d.path(); return {name:d.suggestedFilename(), svg:fs.readFileSync(f,'utf8')}; }
module.exports={setRange,setCheck,device,dl};
if (require.main===module) (async()=>{
 const b = await chromium.launch(); const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1440,height:950}}); const p=await ctx.newPage();
 await p.goto('https://phone-stand-generator.generator.atommapps.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(6000);
 await device(p,'Large phone'); await p.getByText('Cat head',{exact:true}).click(); await p.waitForTimeout(300);
 await p.getByText('Cut out',{exact:true}).click({force:true}); await p.waitForTimeout(300);
 await p.getByText('Stars',{exact:true}).click(); await p.waitForTimeout(300);
 await setRange(p,1,0.8); await setRange(p,0,16); await p.waitForTimeout(600);
 let r=await dl(p); fs.writeFileSync('t1.svg',r.svg); console.log(r.name, r.svg.length);
 await setCheck(p,'Cable slot',false); await p.waitForTimeout(400); r=await dl(p); fs.writeFileSync('t2.svg',r.svg); console.log(r.name, r.svg.length);
 const t=await p.evaluate(()=>document.body.innerText); console.log((t.match(/Foot plate \d+mm/)||[])[0], (t.match(/\d+ × \d+ mm/)||[])[0]);
 await b.close();})();
