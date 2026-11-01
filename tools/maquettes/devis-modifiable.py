#!/usr/bin/env python3
"""Maquette « devis modifiable par la cliente » (01/11/2026).

Gérant : « si elle veut modifier sur le devis… plusieurs verres… donner le choix » puis
« fais la maquette pour les prix : le texte ou texte plus image, c'est pas le même prix ».

Usage : python3 tools/maquettes/devis-modifiable.py <dossier css du site> <dossier images> <sortie.html>
  - dossier css : les feuilles de nivcreation.fr (curl), inlinées telles quelles ;
  - dossier images : modele.jpg (image de la cliente), verre.jpg, logo.jpg.
Rien du site n'est modifié : c'est une page autonome.
"""
import base64, glob, os, sys

css_dir, img_dir, out = sys.argv[1:4]
site_css = "\n".join(open(p, encoding="utf-8").read() for p in sorted(glob.glob(os.path.join(css_dir, "*.css"))))

def uri(name):
    with open(os.path.join(img_dir, name), "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

MODELE, VERRE, LOGO = uri("modele.jpg"), uri("verre.jpg"), uri("logo.jpg")

CSS = r"""
:root{--ok:#2f7a4f;--warn:#b4452f;--sand:#f3e8d3;color-scheme:light}
body{background:#f4f1ea;color:var(--ink);font-family:Inter,system-ui,sans-serif;margin:0}
.mq-bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:#17120b;color:#f3e8d3;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.mq-bar b{font-family:'Playfair Display',serif;font-weight:600;margin-right:6px}
.mq-tab{border:1px solid #6b5a33;background:transparent;color:#f3e8d3;border-radius:999px;padding:8px 14px;font:inherit;font-size:.86rem;cursor:pointer;min-height:40px}
.mq-tab[aria-selected=true]{background:#d6b25a;color:#17120b;border-color:#d6b25a;font-weight:600}
.mq-note{max-width:760px;margin:16px auto 0;padding:0 16px;font-size:.85rem;color:var(--ink-soft)}
.dm-vue{padding:16px 16px 60px}
.dm-vue[hidden]{display:none!important}
.sheet{max-width:720px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:14px;padding:28px 24px;box-shadow:var(--shadow)}
.dv-head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
.dv-head img{height:58px;border-radius:8px}
.dv-head small{display:block;font-size:.8rem;color:var(--ink-soft);margin-top:8px;line-height:1.5}
.dv-head h1{margin:0;color:var(--gold-dark);font-family:'Playfair Display',serif;font-size:1.6rem;text-align:right}
.dv-head .num{text-align:right;font-weight:700}.dv-head .dt{text-align:right;font-size:.85rem;color:var(--ink-soft)}
.dv-to{margin-top:18px;font-size:.92rem}
.dv-intro{margin:20px 0 0;background:var(--cream);border-radius:10px;padding:12px 14px;font-size:.9rem;line-height:1.5}
.paliers small{display:block}
@media (max-width:400px){.paliers{gap:6px}.pal{padding:8px 4px}}
.dv-art{display:grid;grid-template-columns:120px 1fr;gap:16px;margin-top:22px;align-items:start}
.dv-art img{width:120px;height:120px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
.dv-art h2{font-family:'Playfair Display',serif;font-size:1.15rem;margin:0 0 4px}
.dv-art p{margin:0;font-size:.85rem;color:var(--ink-soft);line-height:1.5}
.st{margin-top:22px}
.st h3{font-size:.95rem;margin:0 0 10px;display:flex;gap:8px;align-items:center}
.st h3 .dm-n{width:24px;height:24px;border-radius:50%;background:var(--gold);color:#fff;display:inline-grid;place-items:center;font-size:.8rem;flex:none}
.qty{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.qbox{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;overflow:hidden}
.qbox button{width:44px;height:44px;border:0;background:var(--cream);font-size:1.2rem;cursor:pointer;color:var(--ink)}
.qbox button:disabled{opacity:.35;cursor:default}
.qbox output{min-width:46px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.qty small{font-size:.8rem;color:var(--ink-soft)}
.choix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ch{border:1.5px solid var(--line);border-radius:12px;padding:12px;cursor:pointer;background:#fff;text-align:left;font:inherit;color:inherit;display:flex;flex-direction:column;gap:6px;min-width:0}
.ch[aria-pressed=true]{border-color:var(--gold-dark);background:#fffaf0;box-shadow:0 0 0 3px rgba(194,161,78,.18)}
.ch .vis{height:84px;border-radius:8px;background:#1d1811;display:grid;place-items:center;overflow:hidden;position:relative}
.ch .vis img{width:100%;height:100%;object-fit:cover}
.ch .vis .masque{position:absolute;left:0;right:0;bottom:0;height:34%;background:#1d1811}
.ch .vis .masque2{position:absolute;left:0;right:0;top:0;height:66%;background:#1d1811}
.ch .vis .nom{color:#f4e6c4;font-family:'Playfair Display',serif;letter-spacing:.08em;font-size:1rem}
.ch b{font-size:.9rem}
.ch .px{font-size:.78rem;color:var(--ink-soft);line-height:1.45}
.ch .px em{font-style:normal;font-weight:700;color:var(--gold-dark)}
.ch .tag{font-size:.7rem;font-weight:700;color:var(--ok)}
.fld{display:flex;flex-direction:column;gap:6px;margin-top:12px;font-size:.88rem}
.fld input,.fld select{border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit;min-height:44px;box-sizing:border-box;min-width:0;width:100%;background:#fff}
.chk{display:flex;gap:10px;align-items:flex-start;font-size:.9rem;margin-top:12px;cursor:pointer;line-height:1.45}
.chk input{width:20px;height:20px;margin-top:1px;accent-color:var(--gold-dark);flex:none}
.chk small{display:block;color:var(--ink-soft);font-size:.8rem}
.pv{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.dm-pv-row{display:grid;grid-template-columns:70px minmax(0,1fr) minmax(0,1fr) 64px;gap:8px;align-items:center;background:var(--cream);border-radius:10px;padding:8px 10px;font-size:.85rem}
.dm-pv-row select,.dm-pv-row input{border:1px solid var(--line);border-radius:8px;padding:8px;font:inherit;font-size:.82rem;min-width:0;width:100%;box-sizing:border-box;min-height:40px;background:#fff}
.dm-pv-row .dm-p{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.opt{border:1px dashed var(--gold);border-radius:12px;padding:12px 14px;margin-top:4px}
.opt .fld{margin-top:8px}
.paliers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}
.pal{border:1.5px solid var(--line);border-radius:12px;padding:10px;text-align:center;font-size:.8rem;line-height:1.35;background:#fff}
.pal b{display:block;font-size:.95rem;font-variant-numeric:tabular-nums}
.pal s{color:var(--ink-soft);font-size:.78rem}
.pal .rm{display:inline-block;margin-top:4px;background:#e8f3ec;color:var(--ok);border-radius:999px;padding:2px 8px;font-weight:700;font-size:.74rem}
.pal.on{border-color:var(--gold-dark);background:#fffaf0;box-shadow:0 0 0 3px rgba(194,161,78,.18)}
.nudge{margin-top:10px;background:#e8f3ec;color:#225c3b;border-radius:10px;padding:10px 12px;font-size:.86rem}
.dm-rem td{color:var(--ok);font-weight:600}
.eco{display:flex;justify-content:flex-end;gap:10px;align-items:center;margin-top:4px;font-size:.9rem}
.eco s{color:var(--ink-soft)}
.eco span{background:#e8f3ec;color:var(--ok);border-radius:999px;padding:3px 10px;font-weight:700;font-size:.82rem}
.rec{margin-top:24px;border-top:2px solid var(--line);padding-top:12px}
.rec table{width:100%;border-collapse:collapse;font-size:.9rem}
.rec td{padding:7px 4px;border-bottom:1px solid var(--line);vertical-align:top}
.rec td:last-child{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.rec .dm-off{color:var(--ok);font-weight:600}
.tot{display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;font-size:1.25rem}
.tot strong{font-variant-numeric:tabular-nums}
.tva{text-align:right;font-size:.76rem;color:var(--ink-soft)}
.dm-pay{margin-top:16px;width:100%;min-height:52px;border:0;border-radius:999px;background:linear-gradient(180deg,#d1b061,#a98935);color:#fff;font:inherit;font-weight:700;font-size:1rem;cursor:pointer}
.pay-msg{text-align:center;font-size:.82rem;color:var(--ink-soft);margin-top:8px}
details.dm-grid{margin-top:16px;font-size:.85rem}
details.dm-grid summary{cursor:pointer;color:var(--gold-dark);font-weight:600;min-height:32px}
.tbl{overflow-x:auto}
.tbl table{border-collapse:collapse;width:100%;min-width:420px;margin-top:8px;font-variant-numeric:tabular-nums}
.tbl th,.tbl td{border:1px solid var(--line);padding:7px 8px;text-align:right}
.tbl th:first-child,.tbl td:first-child{text-align:left}
.tbl thead th{background:var(--cream)}
.foot{margin-top:16px;font-size:.8rem;color:var(--ink-soft)}
/* ===== Gestion ===== */
.adm{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.adm .crumb{font-size:.8rem;color:#7a6c55}
.adm h1{font-family:'Playfair Display',serif;font-size:1.5rem;margin:2px 0 0}
.dm-card{background:#fff;border:1px solid #e5dccb;border-radius:14px;padding:16px}
.dm-card h2{font-size:1rem;margin:0 0 10px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center}
.dm-card h2 span{font-size:.75rem;font-weight:600;color:#7a6c55}
.dm-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.dm-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dm-lab{display:flex;flex-direction:column;gap:5px;font-size:.8rem;color:#5a5247;min-width:0}
.dm-lab input,.dm-lab select{border:1px solid #ddd2bd;border-radius:9px;padding:9px 10px;font:inherit;font-size:.88rem;color:var(--ink);min-height:42px;box-sizing:border-box;min-width:0;width:100%;background:#fff}
.ligne{border:1px solid #e5dccb;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px;background:#fdfbf6}
.ligne-h{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.ligne-h img{width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid #e5dccb}
.ligne-h div{flex:1;min-width:0}
.ligne-h b{display:block}
.ligne-h small{color:#7a6c55;font-size:.78rem}
.pill{display:inline-flex;gap:6px;align-items:center;background:#eef6f0;color:var(--ok);border-radius:999px;padding:4px 10px;font-size:.75rem;font-weight:600}
.pill.or{background:#f8efd9;color:#7c6120}
.box-on{border:1px solid #e5dccb;border-radius:10px;padding:10px 12px;background:#fff}
.box-on .chk{margin-top:0}
.dm-sub{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px;padding-left:30px}
.gr{display:grid;gap:6px;margin-top:8px;padding-left:30px}
.gr label{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:.85rem;background:#faf6ef;border-radius:8px;padding:8px 10px}
.gr label input{width:18px;height:18px;accent-color:var(--gold-dark)}
.gr label span:last-child{font-size:.75rem;color:#7a6c55;text-align:right}
.voit{background:#17120b;color:#f3e8d3;border-radius:14px;padding:16px}
.voit h2{color:#d6b25a;font-size:1rem;margin:0 0 6px}
.voit p{margin:0;font-size:.85rem;line-height:1.55;color:#e9dcc0}
.voit ul{margin:8px 0 0;padding-left:18px;font-size:.85rem;line-height:1.6;color:#e9dcc0}
.btns{display:flex;gap:10px;flex-wrap:wrap}
.b{border-radius:999px;padding:10px 16px;font:inherit;font-size:.88rem;font-weight:600;min-height:44px;cursor:pointer;border:1px solid #c9b48a;background:#fff;color:var(--ink)}
.b.gold{background:linear-gradient(180deg,#d1b061,#a98935);border:0;color:#fff}
.dm-add{border:1.5px dashed #c9b48a;border-radius:12px;padding:12px;text-align:center;color:#7c6120;font-weight:600;font-size:.88rem}
@media (max-width:640px){
 .sheet{padding:20px 16px}
 .dv-head h1,.dv-head .num,.dv-head .dt{text-align:left}
 .dv-art{grid-template-columns:84px 1fr}.dv-art img{width:84px;height:84px}
 .choix{grid-template-columns:1fr}
 .ch{flex-direction:row;align-items:center}
 .ch .vis{width:84px;height:64px;flex:none}
 .dm-pv-row{grid-template-columns:56px minmax(0,1fr) 64px}
 .dm-pv-row .dm-nm{grid-column:1 / 4;grid-row:2}
 .ligne-h div{flex:1 1 150px}
 .dm-g2,.dm-g3,.dm-sub{grid-template-columns:1fr}
 .dm-sub,.gr{padding-left:0}
}
"""

HTML = f"""<title>Devis modifiable</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@500;600&display=swap">
<style>{site_css}</style>
<style>{CSS}</style>
<div class="mq-bar" role="tablist">
  <b>Maquette · devis modifiable</b>
  <button class="mq-tab" role="tab" aria-selected="true" data-v="client">① Ce que voit la cliente</button>
  <button class="mq-tab" role="tab" aria-selected="false" data-v="gestion">② Gestion → Devis (vous)</button>
</div>
<p class="mq-note">Exemple réel : devis DEV-1528 (Santos, verre à whisky, rose des vents + « Eugenio »). La cliente ne change que la quantité ; le prix se calcule à partir des lignes du devis (comme sur le site : remise au lot de 2 (37,90 €) et au lot de 4 (71,90 €), pas de lot de 3, le reste à 19,90 € l'unité ; la remise est montrée à la cliente ; l'image est comprise, le prénom se paie sur chaque verre). Rien n'est sur le site.</p>

<section class="dm-vue" id="v-client">
 <div class="sheet">
  <div class="dv-head">
   <div><img src="{LOGO}" alt="Niv Création"><small>Niv Création — Atelier de personnalisation<br>6 rue d'Armaillé, 75017 Paris</small></div>
   <div><h1>Devis</h1><div class="num">DEV-1528</div><div class="dt">01 novembre 2026</div></div>
  </div>
  <div class="dv-to"><strong>Adressé à :</strong><br>Santos</div>

  <div class="dv-art">
   <img src="{MODELE}" alt="Votre modèle : rose des vents et prénom">
   <div><h2>Verre à whisky gravé</h2><p>Rose des vents (N, O, E, S) et trait de vagues, d'après l'image que vous nous avez envoyée, prénom « Eugenio » gravé dessous. Gravure blanche dépolie sur la face du verre.</p></div>
  </div>

  <div class="st">
   <h3>Nombre de verres</h3>
   <div class="qty">
    <div class="qbox"><button type="button" id="moins" aria-label="Un verre de moins">−</button><output id="qte">1</output><button type="button" id="plus" aria-label="Un verre de plus">+</button></div>
    <small>Même gravure sur chaque verre. Le total se met à jour tout seul.</small>
   </div>
   <div class="paliers" id="paliers"></div>
   <div class="nudge" id="nudge" hidden></div>
  </div>

  <div class="rec">
   <table><thead><tr style="text-align:left;color:var(--ink-soft);font-size:.82rem"><th style="padding:6px 4px">Désignation</th><th style="padding:6px 4px;text-align:right">Total</th></tr></thead><tbody id="lignes"></tbody></table>
   <div class="tot"><span>Total des articles</span><strong id="total">22,90 €</strong></div>
   <div class="eco" id="eco" hidden><s id="avant"></s><span id="ecoTxt"></span></div>
   <div class="tva">TVA non applicable, art. 293 B du CGI · livraison choisie à l'étape suivante</div>
   <button type="button" class="dm-pay" id="pay">Valider et payer</button>
   <div class="pay-msg" id="payMsg">Le devis et la fiche de l'atelier reprennent le nombre de verres choisi.</div>
  </div>
  <p class="foot">Devis valable 30 jours. La fabrication démarre après le paiement.</p>
 </div>
</section>

<section class="dm-vue" id="v-gestion" hidden>
 <div class="adm">
  <div><div class="crumb">Gestion › Commandes › Devis &amp; factures</div><h1>Devis DEV-1528 · Santos</h1></div>
  <div class="dm-card">
   <h2>Lignes du devis <span>comme aujourd'hui</span></h2>
   <div class="dm-g2" style="grid-template-columns:minmax(0,3fr) minmax(0,1fr) minmax(0,1fr)">
    <label class="dm-lab">Désignation<input value="Verre à whisky gravé — rose des vents (image)"></label>
    <label class="dm-lab">Qté<input value="1"></label>
    <label class="dm-lab">Prix<input value="19,90"></label>
    <label class="dm-lab">Désignation<input value="Prénom « Eugenio » gravé"></label>
    <label class="dm-lab">Qté<input value="1"></label>
    <label class="dm-lab">Prix<input value="3,00"></label>
   </div>
   <div class="box-on" style="margin-top:14px">
    <label class="chk"><input type="checkbox" checked id="aQte"><span><b>La cliente peut changer le nombre de verres</b><small>Boutons − 1 + sur son devis. Le prix se recalcule à partir de ces lignes : prix des lots de la fiche pour les verres, image comprise, prénom payé sur chaque verre.</small></span></label>
    <div class="dm-sub" id="aQteSub">
     <label class="dm-lab">Au moins<input type="number" value="1" min="1"></label>
     <label class="dm-lab">Au plus<input type="number" value="12" min="1"></label>
    </div>
   </div>
  </div>
  <div class="voit">
   <h2>Ce que la cliente pourra payer</h2>
   <div class="tbl"><table style="min-width:0"><thead><tr><th style="text-align:left;color:#d6b25a;background:transparent">Verres</th><th style="color:#d6b25a;background:transparent">Remise</th><th style="color:#d6b25a;background:transparent">Total</th></tr></thead><tbody id="aGrille"></tbody></table></div>
   <ul>
    <li>Le paiement est recalculé par le site : impossible de payer un autre prix.</li>
    <li>La commande garde le nombre de verres : la fiche atelier l'affiche.</li>
   </ul>
  </div>
  <div class="btns"><button class="b">Enregistrer</button><button class="b gold">Envoyer le devis</button></div>
 </div>
</section>

<script>
(function(){{
 var LOT={{1:19.9,2:37.9,4:71.9}}, MIN=1, MAX=12, PRENOM1=3, SUIVANT=5;
 function eur(n){{return n.toLocaleString('fr-FR',{{minimumFractionDigits:2,maximumFractionDigits:2}})+' €';}}
 // Comme la fiche : lot de 2 et lot de 4 seulement (pas de lot de 3) ; le reste au prix de l'unité.
 function parts(n){{var c4=Math.floor(n/4),r=n%4;return {{c4:c4,c2:r===2?1:0,c1:r===2?0:r}};}}
 function prixVerres(n){{var x=parts(n);return Math.round((x.c4*LOT[4]+x.c2*LOT[2]+x.c1*LOT[1])*100)/100;}}
 function decomp(n){{var x=parts(n),a=[];if(x.c4)a.push(x.c4>1?x.c4+' lots de 4':'lot de 4');if(x.c2)a.push('lot de 2');if(x.c1)a.push(x.c1+' à l\\'unité');return a.join(' + ');}}
 function total(n){{return Math.round((prixVerres(n)+PRENOM1+SUIVANT*(n-1))*100)/100;}}
 function remise(n){{return Math.round((n*LOT[1]-prixVerres(n))*100)/100;}}
 function nomRemise(n){{var x=parts(n),a=[];if(x.c4)a.push(x.c4>1?x.c4+' lots de 4':'lot de 4');if(x.c2)a.push('lot de 2');return 'Remise '+a.join(' + ');}}
 var n=1, $=function(id){{return document.getElementById(id);}};
 function render(){{
  $('qte').textContent=n;$('moins').disabled=n<=MIN;$('plus').disabled=n>=MAX;
  var L=[];
  var rm=remise(n);
  L.push(['Verre à whisky gravé — rose des vents (image comprise) × '+n+(n>1?' <small>(19,90 € × '+n+')</small>':''),eur(n*LOT[1])]);
  if(rm>0)L.push(['<span class="dm-r">'+nomRemise(n)+'</span>','−'+eur(rm),'dm-rem']);
  L.push(['Prénom « Eugenio » gravé — verre 1',eur(PRENOM1)]);
  if(n>1)L.push(['Image + prénom, verres 2 à '+n+' <small>('+eur(SUIVANT)+' × '+(n-1)+')</small>',eur(SUIVANT*(n-1))]);
  $('lignes').innerHTML=L.map(function(l){{return '<tr'+(l[2]?' class="'+l[2]+'"':'')+'><td>'+l[0]+'</td><td>'+l[1]+'</td></tr>';}}).join('');
  $('eco').hidden=!(rm>0);$('avant').textContent=eur(total(n)+rm);$('ecoTxt').textContent='Vous économisez '+eur(rm);
  var P=[[1,'1 verre'],[2,'Lot de 2'],[4,'Lot de 4']];
  $('paliers').innerHTML=P.map(function(q){{var k=q[0],r=remise(k);var on=(k===4&&n>=4)||(k===2&&parts(n).c2>0&&n<4)||(k===1&&n===1)||(k===1&&n===3);
   return '<div class="pal'+(on?' on':'')+'">'+q[1]+'<b>'+eur(prixVerres(k))+'</b>'+(r>0?'<s>'+eur(k*LOT[1])+'</s><br><span class="rm">−'+eur(r)+'</span>':'<span style="display:block;font-size:.74rem;color:var(--ink-soft);margin-top:6px">prix de base</span>')+'</div>';}}).join('');
  var nd='';if(n===1)nd='Avec un 2ᵉ verre, vous profitez du lot de 2 : remise de '+eur(remise(2))+'.';else if(n===3)nd='Avec 1 verre de plus, vous profitez du lot de 4 : remise de '+eur(remise(4))+'.';
  $('nudge').hidden=!nd;$('nudge').textContent=nd;
  $('total').textContent=eur(total(n));$('pay').textContent='Valider et payer '+eur(total(n));
 }}
 $('moins').onclick=function(){{if(n>MIN){{n--;render();}}}};
 $('plus').onclick=function(){{if(n<MAX){{n++;render();}}}};
 $('pay').onclick=function(){{$('payMsg').textContent='Maquette : ici, la page de paiement s\\'ouvre avec ce total exact.';}};
 render();
 $('aGrille').innerHTML=[1,2,3,4,5,6,8,12].map(function(k){{return '<tr><td style="color:#e9dcc0">'+k+' verre'+(k>1?'s':'')+'</td><td style="color:#9fd8b5">'+(remise(k)>0?'−'+eur(remise(k)):'—')+'</td><td style="color:#fff">'+eur(total(k))+'</td></tr>';}}).join('');
 $('aQte').onchange=function(){{$('aQteSub').hidden=!this.checked;}};
 document.querySelectorAll('.mq-tab').forEach(function(t){{t.onclick=function(){{document.querySelectorAll('.mq-tab').forEach(function(x){{x.setAttribute('aria-selected',String(x===t));}});
  $('v-client').hidden=t.dataset.v!=='client';$('v-gestion').hidden=t.dataset.v!=='gestion';window.scrollTo(0,0);}};}});
}})();
</script>
"""

with open(out, "w", encoding="utf-8") as f:
    f.write(HTML)
print(out, len(HTML) // 1024, "Ko")
