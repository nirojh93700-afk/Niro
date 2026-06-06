import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1500, height: 960, deviceScaleFactor: 2 });
let ok=false; for(let i=0;i<50;i++){try{const r=await fetch("http://localhost:3216/plateforme");if(r.ok){ok=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
if(!ok){console.log("injoignable");process.exit(1);}
await p.goto("http://localhost:3216/plateforme",{waitUntil:"networkidle0"});
await p.type('input[type=password]',"x");
await Promise.all([p.click('button[type=submit]'),new Promise(r=>setTimeout(r,1800))]);
await p.screenshot({path:"/tmp/lior2.png"});
await b.close();console.log("shot ok");
