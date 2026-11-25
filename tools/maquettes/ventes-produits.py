#!/usr/bin/env python3
"""Maquette « Ventes par produit » (Gestion › Finances › Ventes), 25/11/2026.

Gérant : « un tableau précis, professionnel, dans admin, pour savoir quel produit j'ai vendu à combien ».
Les ventes viennent des VRAIES commandes (export /api/admin/orders) passées par src/lib/ventesProduits.js
(ventesDesCommandes) : une ligne par article vendu, avec variante, prix payé, options, remise, coût d'achat.

Usage :
  node --import ./tools/alias-register.mjs <scratch>/ventes-calc.mjs <scratch>   (écrit ventes-tableau.json)
  python3 tools/maquettes/ventes-produits.py <dossier css de Gestion> <ventes-tableau.json> <sortie.html>
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import shell, css_site, I

css_dir, data_path, out = sys.argv[1:4]
T = json.load(open(data_path, encoding="utf-8"))
ventes = []
for l in T["lignes"]:
    for va in l["variantes"]:
        for v in va["ventes"]:
            ventes.append({k: v[k] for k in ("ref", "date", "cliente", "slug", "produit", "image", "categorie", "variante",
                                              "qte", "prixUnitaire", "options", "emballage", "remise", "encaisse", "cout")})
# Pas de photos lourdes : les vignettes du site (adresse relative) ne s'affichent pas dans l'aperçu → on garde l'initiale.
for v in ventes:
    v.pop("image", None)

CSS = r"""
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
.vp{display:flex;flex-direction:column;gap:18px;min-width:0}
.vp-head{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between}
.vp-head h1{font:500 1.7rem/1.15 "Playfair Display",Georgia,serif;margin:0;color:var(--ash-ink,#1a1206)}
.vp-head p{margin:4px 0 0;color:#6b5f4d;font-size:.92rem;max-width:62ch}
.vp-exp{display:flex;gap:8px;flex-wrap:wrap}
.vp-btn{border:1px solid #e3d6bb;background:#fff;color:#1a1206;border-radius:10px;padding:8px 12px;font:600 .82rem system-ui,sans-serif;cursor:pointer;min-height:38px}
.vp-btn:hover{border-color:#c9a24b}
.vp-btn.gold{background:linear-gradient(180deg,#d9b866,#c9a24b);border-color:#b8913d;color:#241a0c}
.vp-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.vp-kpi{background:#fff;border:1px solid #eadfca;border-left:3px solid #c9a24b;border-radius:12px;padding:12px 14px;min-width:0}
.vp-kpi b{display:block;font:600 1.35rem/1.2 Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#1a1206}
.vp-kpi span{font-size:.74rem;letter-spacing:.04em;text-transform:uppercase;color:#7c6120;font-weight:600}
.vp-kpi small{display:block;color:#6b5f4d;font-size:.78rem;margin-top:3px}
.vp-bar{position:sticky;top:0;z-index:3;background:#fbf7ee;padding:10px 0;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid #eadfca}
.vp-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.vp-seg{display:inline-flex;background:#f3e8d3;border-radius:10px;padding:3px;gap:2px;flex-wrap:wrap}
.vp-seg button{border:0;background:none;padding:7px 11px;border-radius:8px;font:600 .8rem system-ui,sans-serif;color:#5d5142;cursor:pointer}
.vp-seg button.on{background:#fff;color:#1a1206;box-shadow:0 1px 2px rgba(26,18,6,.12)}
.vp-dates{display:none;gap:6px;align-items:center;font-size:.82rem;color:#5d5142}
.vp-dates.on{display:inline-flex}
.vp-dates input{border:1px solid #e3d6bb;border-radius:8px;padding:6px 8px;font:inherit;background:#fff;box-sizing:border-box;min-width:0}
.vp-find{flex:1 1 200px;min-width:0;border:1px solid #e3d6bb;border-radius:10px;padding:9px 12px;font:.88rem system-ui,sans-serif;background:#fff;box-sizing:border-box}
.vp-sel{border:1px solid #e3d6bb;border-radius:10px;padding:8px 10px;font:600 .82rem system-ui,sans-serif;background:#fff;color:#1a1206;box-sizing:border-box;min-width:0}
.vp-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.vp-chips button{flex:0 0 auto;border:1px solid #e3d6bb;background:#fff;border-radius:999px;padding:6px 12px;font:600 .78rem system-ui,sans-serif;color:#5d5142;cursor:pointer}
.vp-chips button.on{background:#1a1206;border-color:#1a1206;color:#fbf7ee}
.vp-chips button i{font-style:normal;opacity:.6;margin-left:4px}
.vp-tablewrap{overflow-x:auto;background:#fff;border:1px solid #eadfca;border-radius:14px}
table.vp-t{width:100%;border-collapse:collapse;font:.82rem Inter,system-ui,sans-serif;min-width:860px}
.vp-t th{position:sticky;top:0;background:#faf4e7;text-align:right;font:700 .7rem system-ui,sans-serif;letter-spacing:.02em;text-transform:uppercase;color:#7c6120;padding:10px 8px;border-bottom:1px solid #eadfca;white-space:nowrap;cursor:pointer;user-select:none}
.vp-t th:first-child{text-align:left}
.vp-t th.sorted::after{content:" ▾"}
.vp-t th.sorted.asc::after{content:" ▴"}
.vp-t td{padding:10px 8px;border-bottom:1px solid #f1e8d6;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;color:#1a1206}
.vp-t td:first-child{text-align:left;white-space:normal}
.vp-t tr.p{cursor:pointer}
.vp-t tr.p:hover td{background:#fdf9f0}
.vp-t tr.p.open td{background:#fbf3e1}
.vp-name{display:flex;gap:8px;align-items:center;min-width:190px}
.vp-av{flex:0 0 34px;height:34px;border-radius:9px;background:#f3e8d3;color:#7c6120;display:grid;place-items:center;font:700 .85rem "Playfair Display",serif}
.vp-name b{display:block;font-weight:600}
.vp-name small{color:#8a7c66;font-size:.74rem}
.vp-car{display:inline-block;width:14px;color:#a98935;transition:transform .15s}
tr.open .vp-car{transform:rotate(90deg)}
.vp-t tr.va td{background:#fffdf8;font-size:.83rem;color:#3d3223}
.vp-t tr.va td:first-child{padding-left:58px}
.vp-t tr.va{cursor:pointer}
.vp-t tr.ve td{background:#fff;font-size:.8rem;color:#5d5142}
.vp-t tr.ve td:first-child{padding-left:82px}
.vp-ref{font-weight:600;color:#7c6120}
.vp-pill{display:inline-block;border-radius:999px;padding:2px 8px;font:600 .7rem system-ui,sans-serif;white-space:nowrap}
.vp-pill.warn{background:#fff3d6;color:#6b4e10}
.vp-pill.dv{background:#e7eef8;color:#294766}
.vp-gain{color:#2f5a2a;font-weight:600}
.vp-neg{color:#a33}
.vp-mute{color:#9c8f79}
.vp-marge{display:inline-flex;align-items:center;gap:6px;justify-content:flex-end}
.vp-marge i{display:inline-block;width:30px;height:6px;border-radius:3px;background:#f1e8d6;overflow:hidden}
.vp-marge i em{display:block;height:100%;background:#c9a24b}
.vp-t tfoot td{background:#faf4e7;font-weight:700;border-top:2px solid #eadfca;border-bottom:0}
.vp-empty{padding:30px;text-align:center;color:#6b5f4d}
.vp-note{background:#fff;border:1px solid #eadfca;border-radius:12px;padding:12px 14px;font-size:.85rem;color:#5d5142;line-height:1.55}
.vp-note b{color:#1a1206}
.vp-maq{background:#1a1206;color:#f3e8d3;border-radius:12px;padding:12px 14px;font-size:.84rem;line-height:1.5}
.vp-maq b{color:#e2c67e}
.vp-toast{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#1a1206;color:#fbf7ee;padding:10px 16px;border-radius:10px;font:600 .84rem system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s;z-index:50;max-width:calc(100vw - 32px)}
.vp-toast.on{opacity:1}
@media (max-width:720px){
  .vp-head h1{font-size:1.4rem}
  .vp-kpis{grid-template-columns:1fr 1fr}
  .vp-bar{position:static}
  .vp-cards{display:flex;flex-direction:column;gap:10px}
  .vp-tablewrap.desk{display:none}
}
@media (min-width:721px){.vp-cards{display:none}}
.vp-card{background:#fff;border:1px solid #eadfca;border-radius:14px;overflow:hidden}
.vp-card>button{all:unset;box-sizing:border-box;width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px;cursor:pointer}
.vp-card>button b{font-weight:600;font-size:.92rem;display:block}
.vp-card>button small{color:#8a7c66;font-size:.76rem}
.vp-card .amt{text-align:right;font-variant-numeric:tabular-nums}
.vp-card .amt b{font-size:1rem}
.vp-cgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:0 12px 12px;font-size:.76rem;color:#6b5f4d}
.vp-cgrid div b{display:block;color:#1a1206;font-size:.86rem;font-variant-numeric:tabular-nums}
.vp-cdet{border-top:1px solid #f1e8d6;padding:8px 12px 12px;display:none;font-size:.8rem}
.vp-card.open .vp-cdet{display:block}
.vp-cva{padding:8px 0;border-bottom:1px dashed #eadfca}
.vp-cva:last-child{border:0}
.vp-cva .h{display:flex;justify-content:space-between;gap:8px;font-weight:600;color:#1a1206}
.vp-cva ul{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:3px;color:#5d5142}
.vp-cva li{display:flex;justify-content:space-between;gap:8px}
.vp-cva li span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
"""

body = f"""
<div class="vp">
  <div class="vp-maq"><b>Maquette, rien n'est en ligne.</b> Ce tableau utilise vos vraies commandes (export du 25/11/2026) : il se mettra à jour tout seul une fois branché dans Gestion. Les tests, commandes annulées et remboursées ne sont pas comptés.</div>
  <div class="vp-head">
    <div><h1>Ventes par produit</h1><p>Ce que vous avez vendu, à quel prix, et ce qu'il vous reste après le coût d'achat. Touchez un produit pour voir chaque taille ou couleur, puis chaque vente.</p></div>
    <div class="vp-exp"><button class="vp-btn" data-exp="Excel">Excel</button><button class="vp-btn" data-exp="CSV">CSV</button><button class="vp-btn" data-exp="PDF">PDF</button></div>
  </div>
  <div class="vp-kpis" id="kpis"></div>
  <div class="vp-bar">
    <div class="vp-row">
      <div class="vp-seg" id="per"><button data-p="tout" class="on">Depuis le début</button><button data-p="mois">Ce mois</button><button data-p="prec">Mois dernier</button><button data-p="30">30 jours</button><button data-p="dates">Dates…</button></div>
      <span class="vp-dates" id="dates">du <input type="date" id="du"> au <input type="date" id="au"></span>
    </div>
    <div class="vp-row">
      <input class="vp-find" id="q" placeholder="Rechercher un produit, une taille, une cliente, une commande…">
      <select class="vp-sel" id="tri"><option value="encaisse">Trier : montant encaissé</option><option value="qte">Pièces vendues</option><option value="gain">Gain</option><option value="marge">Marge %</option><option value="prixMoyen">Prix moyen</option><option value="produit">Nom</option></select>
    </div>
    <div class="vp-chips" id="cats"></div>
  </div>
  <div class="vp-tablewrap desk"><table class="vp-t" id="tab"><thead><tr>
    <th data-k="produit">Produit</th><th data-k="qte">Pièces</th><th data-k="commandes">Cdes</th><th data-k="prixMoyen">Prix moyen</th><th data-k="options">Options</th><th data-k="remise">Remises</th><th data-k="encaisse" class="sorted">Encaissé</th><th data-k="cout">Coût</th><th data-k="gain">Gain</th><th data-k="marge">Marge</th>
  </tr></thead><tbody></tbody><tfoot></tfoot></table></div>
  <div class="vp-cards" id="cards"></div>
  <div class="vp-note"><b>Comment c'est calculé.</b> <b>Encaissé</b> = ce que la cliente a payé pour l'article, options comprises, remise déduite, <b>sans la livraison</b>. <b>Dont options</b> = gravures, textes, socles et emballages payés en plus. <b>Remises</b> = codes promo et cartes cadeaux. <b>Coût d'achat</b> = le prix d'achat de la pièce (verre, bloc, bijou) ; quand il n'est pas connu, la ligne porte « coût inconnu » et son gain n'est pas compté (jamais 0 € en silence). Le matériel d'emballage, les étiquettes, Stripe et les pièces ratées restent dans Bénéfices.</div>
</div>
<div class="vp-toast" id="toast"></div>
"""

JS = r"""
const V = __DATA__;
const CAT = {bijoux:"Bijoux",cristal:"Cristal",verres:"Verres & carafes",cadeaux:"Petits cadeaux",deco:"Maison & mariage",devis:"Sur devis",jeux:"Jeux",mariage:"Mariage",naissance:"Bébé"};
const eur = (x)=> x==null ? "—" : x.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const r2 = (x)=> Math.round(x*100)/100;
const fdate = (d)=> new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"2-digit"});
const esc = (s)=> String(s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const st = {per:"tout", du:"", au:"", q:"", cat:"tout", tri:"encaisse", asc:false, open:new Set(), openVa:new Set()};

function bornes(){
  const now=new Date();
  if(st.per==="mois") return [new Date(now.getFullYear(),now.getMonth(),1), null];
  if(st.per==="prec") return [new Date(now.getFullYear(),now.getMonth()-1,1), new Date(now.getFullYear(),now.getMonth(),1)];
  if(st.per==="30") return [new Date(now-30*864e5), null];
  if(st.per==="dates") return [st.du?new Date(st.du):null, st.au?new Date(new Date(st.au).getTime()+864e5):null];
  return [null,null];
}
function filtrees(sansCat){
  const [a,b]=bornes(); const q=st.q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  return V.filter(v=>{
    const t=new Date(v.date);
    if(a&&t<a) return false; if(b&&t>=b) return false;
    if(!sansCat && st.cat!=="tout" && v.categorie!==st.cat) return false;
    if(q){ const h=(v.produit+" "+v.variante+" "+v.cliente+" "+v.ref).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); if(!q.split(/\s+/).every(m=>h.includes(m))) return false; }
    return true;
  });
}
function vide(){return {qte:0,encaisse:0,options:0,remise:0,cout:0,coutManquant:false,encConnu:0,refs:new Set()}}
function add(a,v){a.qte+=v.qte;a.encaisse=r2(a.encaisse+v.encaisse);a.options=r2(a.options+v.options+v.emballage);a.remise=r2(a.remise+v.remise);
  if(v.cout==null)a.coutManquant=true; else {a.cout=r2(a.cout+v.cout);a.encConnu=r2(a.encConnu+v.encaisse)} a.refs.add(v.ref);}
function fin(a){a.commandes=a.refs.size;a.prixMoyen=a.qte?r2(a.encaisse/a.qte):0;
  a.gain=a.coutManquant?null:r2(a.encaisse-a.cout); a.marge=a.gain!=null&&a.encaisse>0?Math.round(a.gain/a.encaisse*100):null; return a;}
function grouper(list){
  const m=new Map();
  for(const v of list){const k=v.slug||("devis:"+v.produit);
    if(!m.has(k))m.set(k,Object.assign(vide(),{cle:k,produit:v.slug?v.produit:"Lignes de devis (sur mesure)",categorie:v.categorie,va:new Map()}));
    const p=m.get(k); add(p,v); const vk=v.variante;
    if(!p.va.has(vk))p.va.set(vk,Object.assign(vide(),{variante:vk,ventes:[]})); const x=p.va.get(vk); add(x,v); x.ventes.push(v);}
  // toutes les lignes de devis sous un seul produit
  return [...m.values()].map(p=>{fin(p);p.vas=[...p.va.values()].map(fin).sort((a,b)=>b.encaisse-a.encaisse);p.vas.forEach(x=>x.ventes.sort((a,b)=>b.date.localeCompare(a.date)));return p;});
}
function fusionDevis(ps){
  const d=ps.filter(p=>p.categorie==="devis"); if(d.length<2) return ps;
  const g=Object.assign(vide(),{cle:"devis",produit:"Lignes de devis (sur mesure)",categorie:"devis",vas:[]});
  for(const p of d){ for(const x of p.vas) for(const v of x.ventes) add(g,v); g.vas.push(...p.vas); }
  fin(g); g.vas.sort((a,b)=>b.encaisse-a.encaisse);
  return ps.filter(p=>p.categorie!=="devis").concat([g]);
}
function trier(ps){
  const k=st.tri, s=st.asc?1:-1;
  return ps.sort((a,b)=>{ if((a.categorie==="devis")!==(b.categorie==="devis")) return a.categorie==="devis"?1:-1; if(k==="produit") return s*-1*a.produit.localeCompare(b.produit,"fr");
    const A=a[k]==null?-1e9:a[k], B=b[k]==null?-1e9:b[k]; return s*(A-B); });
}
function margeHtml(m){ if(m==null) return '<span class="vp-mute">—</span>'; const w=Math.max(0,Math.min(100,m));
  return `<span class="vp-marge">${m} %<i><em style="width:${w}%"></em></i></span>`; }
function coutHtml(a){ return a.coutManquant ? (a.cout>0?`${eur(a.cout)}<br><span class="vp-pill warn">en partie inconnu</span>`:'<span class="vp-pill warn">coût inconnu</span>') : eur(a.cout); }
function gainHtml(a){ return a.gain==null?'<span class="vp-mute">—</span>':`<span class="${a.gain<0?'vp-neg':'vp-gain'}">${eur(a.gain)}</span>`; }
function kpis(list, ps){
  const t=fin(list.reduce((a,v)=>(add(a,v),a),vide()));
  const gainConnu=r2(t.encConnu-t.cout); const best=ps.filter(p=>p.categorie!=="devis").sort((a,b)=>b.encaisse-a.encaisse)[0];
  const sansCout=r2(t.encaisse-t.encConnu);
  document.getElementById("kpis").innerHTML=`
   <div class="vp-kpi"><span>Encaissé (articles)</span><b>${eur(t.encaisse)}</b><small>${t.commandes} commande${t.commandes>1?"s":""} · hors livraison</small></div>
   <div class="vp-kpi"><span>Pièces vendues</span><b>${t.qte}</b><small>${ps.length} produit${ps.length>1?"s":""} différent${ps.length>1?"s":""}</small></div>
   <div class="vp-kpi"><span>Prix moyen d'une pièce</span><b>${eur(t.prixMoyen)}</b><small>dont options ${eur(t.options)}</small></div>
   <div class="vp-kpi"><span>Gain sur coût connu</span><b>${eur(gainConnu)}</b><small>${sansCout>0?eur(sansCout)+" vendus sans coût d'achat":"tous les coûts sont connus"}</small></div>
   <div class="vp-kpi"><span>Produit n° 1</span><b style="font-size:1rem;line-height:1.3">${best?esc(best.produit):"—"}</b><small>${best?eur(best.encaisse)+" · "+best.qte+" pièce"+(best.qte>1?"s":""):""}</small></div>`;
  return t;
}
function chips(){
  const base=filtrees(true); const n={}; base.forEach(v=>n[v.categorie]=(n[v.categorie]||0)+v.qte);
  const keys=Object.keys(CAT).filter(k=>n[k]);
  document.getElementById("cats").innerHTML=[`<button data-c="tout" class="${st.cat==="tout"?"on":""}">Tout<i>${base.reduce((s,v)=>s+v.qte,0)}</i></button>`]
   .concat(keys.map(k=>`<button data-c="${k}" class="${st.cat===k?"on":""}">${CAT[k]}<i>${n[k]}</i></button>`)).join("");
}
function rendre(){
  chips();
  const list=filtrees(false); const ps=trier(fusionDevis(grouper(list))); const t=kpis(list,ps);
  const tb=document.querySelector("#tab tbody"); const cards=document.getElementById("cards");
  if(!ps.length){ tb.innerHTML=`<tr><td colspan="10" class="vp-empty">Aucune vente sur cette période.</td></tr>`; cards.innerHTML=`<div class="vp-empty">Aucune vente sur cette période.</div>`; document.querySelector("#tab tfoot").innerHTML=""; return; }
  let h="";
  for(const p of ps){
    const o=st.open.has(p.cle);
    h+=`<tr class="p${o?" open":""}" data-p="${esc(p.cle)}"><td><div class="vp-name"><span class="vp-car">›</span><span class="vp-av">${esc(p.produit[0])}</span><div><b>${esc(p.produit)}</b><small>${CAT[p.categorie]||p.categorie} · ${p.vas.length} variante${p.vas.length>1?"s":""}</small></div></div></td>
      <td>${p.qte}</td><td>${p.commandes}</td><td>${eur(p.prixMoyen)}</td><td>${eur(p.options)}</td><td>${p.remise?"− "+eur(p.remise):'<span class="vp-mute">—</span>'}</td><td><b>${eur(p.encaisse)}</b></td><td>${coutHtml(p)}</td><td>${gainHtml(p)}</td><td>${margeHtml(p.marge)}</td></tr>`;
    if(!o) continue;
    for(const x of p.vas){ const vk=p.cle+"|"+x.variante; const ov=st.openVa.has(vk);
      h+=`<tr class="va" data-va="${esc(vk)}"><td><span class="vp-car" style="${ov?"transform:rotate(90deg)":""}">›</span> ${esc(x.variante)}</td><td>${x.qte}</td><td>${x.commandes}</td><td>${eur(x.prixMoyen)}</td><td>${eur(x.options)}</td><td>${x.remise?"− "+eur(x.remise):'<span class="vp-mute">—</span>'}</td><td>${eur(x.encaisse)}</td><td>${coutHtml(x)}</td><td>${gainHtml(x)}</td><td>${margeHtml(x.marge)}</td></tr>`;
      if(ov) for(const v of x.ventes){ const g=v.cout==null?null:r2(v.encaisse-v.cout);
        h+=`<tr class="ve"><td>${fdate(v.date)} · <span class="vp-ref">#${esc(v.ref)}</span> · ${esc(v.cliente)}</td><td>${v.qte}</td><td></td><td>${eur(r2(v.encaisse/v.qte))}</td><td>${eur(r2(v.options+v.emballage))}</td><td>${v.remise?"− "+eur(v.remise):'<span class="vp-mute">—</span>'}</td><td>${eur(v.encaisse)}</td><td>${v.cout==null?'<span class="vp-pill warn">inconnu</span>':eur(v.cout)}</td><td>${g==null?'<span class="vp-mute">—</span>':`<span class="${g<0?'vp-neg':'vp-gain'}">${eur(g)}</span>`}</td><td></td></tr>`; }
    }
  }
  tb.innerHTML=h;
  document.querySelector("#tab tfoot").innerHTML=`<tr><td>Total · ${ps.length} produits</td><td>${t.qte}</td><td>${t.commandes}</td><td>${eur(t.prixMoyen)}</td><td>${eur(t.options)}</td><td>${t.remise?"− "+eur(t.remise):"—"}</td><td>${eur(t.encaisse)}</td><td>${coutHtml(t)}</td><td>${eur(r2(t.encConnu-t.cout))}*</td><td></td></tr>`;
  document.querySelectorAll("#tab th").forEach(th=>{th.classList.toggle("sorted",th.dataset.k===st.tri);th.classList.toggle("asc",th.dataset.k===st.tri&&st.asc);});
  // cartes (téléphone)
  cards.innerHTML=ps.map(p=>{const o=st.open.has(p.cle);
    return `<div class="vp-card${o?" open":""}"><button data-p="${esc(p.cle)}"><span class="vp-av">${esc(p.produit[0])}</span><span><b>${esc(p.produit)}</b><small>${p.qte} pièce${p.qte>1?"s":""} · ${CAT[p.categorie]||""}</small></span><span class="amt"><b>${eur(p.encaisse)}</b><br>${gainHtml(p)}</span></button>
     <div class="vp-cgrid"><div>Prix moyen<b>${eur(p.prixMoyen)}</b></div><div>Coût<b>${p.coutManquant?"inconnu":eur(p.cout)}</b></div><div>Marge<b>${p.marge==null?"—":p.marge+" %"}</b></div></div>
     <div class="vp-cdet">${p.vas.map(x=>`<div class="vp-cva"><div class="h"><span>${esc(x.variante)} · ${x.qte}</span><span>${eur(x.encaisse)}</span></div><ul>${x.ventes.map(v=>`<li><span>${fdate(v.date)} · #${esc(v.ref)} · ${esc(v.cliente)}</span><span>${eur(v.encaisse)}</span></li>`).join("")}</ul></div>`).join("")}</div></div>`;}).join("");
}
document.getElementById("per").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.per=b.dataset.p;
  document.querySelectorAll("#per button").forEach(x=>x.classList.toggle("on",x===b)); document.getElementById("dates").classList.toggle("on",st.per==="dates"); rendre();});
["du","au"].forEach(id=>document.getElementById(id).addEventListener("change",e=>{st[id]=e.target.value;rendre();}));
document.getElementById("q").addEventListener("input",e=>{st.q=e.target.value;rendre();});
document.getElementById("tri").addEventListener("change",e=>{st.tri=e.target.value;st.asc=st.tri==="produit";rendre();});
document.getElementById("cats").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.cat=b.dataset.c;rendre();});
document.querySelector("#tab thead").addEventListener("click",e=>{const th=e.target.closest("th");if(!th)return;const k=th.dataset.k;
  if(st.tri===k) st.asc=!st.asc; else {st.tri=k; st.asc=k==="produit";} document.getElementById("tri").value=["encaisse","qte","gain","marge","prixMoyen","produit"].includes(k)?k:"encaisse"; rendre();});
document.querySelector("#tab tbody").addEventListener("click",e=>{const p=e.target.closest("tr.p"),va=e.target.closest("tr.va");
  if(p){const k=p.dataset.p; st.open.has(k)?st.open.delete(k):st.open.add(k); rendre();}
  else if(va){const k=va.dataset.va; st.openVa.has(k)?st.openVa.delete(k):st.openVa.add(k); rendre();}});
document.getElementById("cards").addEventListener("click",e=>{const b=e.target.closest("button[data-p]");if(!b)return;const k=b.dataset.p;st.open.has(k)?st.open.delete(k):st.open.add(k);rendre();});
document.querySelectorAll("[data-exp]").forEach(b=>b.addEventListener("click",()=>{const t=document.getElementById("toast");
  t.textContent=`Dans Gestion, ce bouton téléchargera le tableau en ${b.dataset.exp} (période et filtres choisis).`;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),2600);}));
rendre();
"""

css_txt = css_site(css_dir)
html = shell(title="Ventes par produit", crumb="Ventes par produit", subtab="", css_site_txt=css_txt, css=CSS, body=body,
             js=JS.replace("__DATA__", json.dumps(ventes, ensure_ascii=False)))
# Coquille : ranger dans Finances (la coquille commune est écrite pour Commandes).
html = html.replace('<span class="ash-crumb-g">Commandes</span>', '<span class="ash-crumb-g">Finances</span>')
subs_fin = "".join(f'<a class="ash-subtab{" on" if s == "Ventes" else ""}" href="#">{s}</a>' for s in ["Ventes", "Bénéfices", "Comptabilité", "Visiteurs"])
import re
html = re.sub(r'<nav class="ash-subs">.*?</nav>', f'<nav class="ash-subs">{subs_fin}</nav>', html, count=1, flags=re.S)
# Menu : Finances allumé (au lieu de Commandes).
html = html.replace('<a class="ash-item on" href="#">', '<a class="ash-item" href="#">', 1).replace('<span class="ash-badge">3</span>', '', 1)
html = html.replace('<a class="ash-tab on" href="#">', '<a class="ash-tab" href="#">', 1).replace('<b>3</b></a>', '</a>', 1)
html = re.sub(r'<a class="ash-item" href="#">(<svg(?:(?!</a>).)*?<span class="ash-txt">Finances</span>)', r'<a class="ash-item on" href="#">\1', html, count=1, flags=re.S)
open(out, "w", encoding="utf-8").write(html)
print(out, len(html) // 1024, "Ko,", len(ventes), "ventes")
