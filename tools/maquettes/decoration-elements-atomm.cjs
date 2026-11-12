// Analyse de la partie « Element » du générateur Ornament d'Atomm : catégories, dessins, réglages d'un élément posé.
const {chromium}=require('playwright');const fs=require('fs');const D=__dirname+'/';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1440,height:950}});const p=await ctx.newPage();
const reps=[];
p.on('response',async r=>{try{const u=r.url();const ct=r.headers()['content-type']||'';
 if(ct.includes('json')){const t=await r.text();if(/0205|element|Element|reindeer|snowflake/i.test(t))reps.push({u,t:t.slice(0,400000)})}}catch(e){}});
await p.goto('https://www.atomm.com/creativetools/generator/ornament/',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(12000);
try{await p.getByText('Skip',{exact:true}).click();}catch(e){}
const fr=p.frames().map(f=>f.url());fs.writeFileSync(D+'frames.txt',fr.join('\n'));
await p.getByText('Element',{exact:true}).first().click();await p.waitForTimeout(4000);
await p.screenshot({path:D+'e1.png'});
// toutes les images de tuiles visibles dans le panneau, par catégorie
const cats=['All','Christmas','Candle','Christmas Tree','Gifts','Bell','Snowflakes','Reindeer','Butterfly','Egg','Leaf','Others','Rabbit','Cross','Flower','Base','Socks','Christmas Hats'];
const res={};
for(const c of cats){try{await p.getByText(c,{exact:true}).first().click();await p.waitForTimeout(2500);
 const imgs=await p.evaluate(()=>[...document.querySelectorAll('img')].map(i=>i.currentSrc||i.src).filter(s=>/atomm|xtool/.test(s)));
 res[c]=[...new Set(imgs)];}catch(e){res[c]='err '+e.message}}
fs.writeFileSync(D+'cats.json',JSON.stringify(res,null,1));
fs.writeFileSync(D+'reps.json',JSON.stringify(reps.map(x=>({u:x.u,n:x.t.length,t:x.t}))));
console.log(Object.entries(res).map(([k,v])=>k+':'+(Array.isArray(v)?v.length:v)).join(' | '));
console.log(reps.map(x=>x.u+' '+x.t.length).join('\n'));
await b.close()})();
