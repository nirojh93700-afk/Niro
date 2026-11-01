import { products } from "@/lib/products";
import { configQuantite, appliquerQuantite, paliersRemise } from "@/lib/devisQuantite";
const index = new Map(); for (const p of products) for (const v of p.variants||[]) index.set(v.id,{product:p,variant:v});
const q = { type:"devis", qte:{modifiable:true,min:1,max:12}, items:[
 {desc:"Verre à whisky gravé — rose des vents",qty:1,price:19.9,weight:600,variantId:"verre-whisky-grave",suit:true},
 {desc:"Prénom « Eugenio » gravé",qty:1,price:3,suit:true,prixSuivant:5}]};
const cfg = configQuantite(q, index); console.log(JSON.stringify(cfg));
const att = {1:22.9,2:45.9,3:72.7,4:89.9,5:114.8,6:137.8,7:164.6,8:181.8};
let ok=0; for (const n of Object.keys(att)) { const r=appliquerQuantite(q,cfg,n); const good = r.total===att[n] && Math.abs(r.items.reduce((s,i)=>s+i.qty*i.price,0)-r.total)<0.001; ok+=good; console.log(n, r.total, r.remise, good?"✓":"✗", JSON.stringify(r.stock)); }
console.log(appliquerQuantite(q,cfg,6).items.map(i=>`${i.desc} ×${i.qty} ${i.price} w${i.weight||""}`).join("\n"));
console.log(paliersRemise(cfg));
console.log("sans config:", appliquerQuantite({items:q.items},null).total, configQuantite({items:q.items},index));
if (ok!==8) { console.error("ECHEC devis-quantite"); process.exit(1); } console.log("devis-quantite : 8/8 totaux comme le site ✓");
