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
<p class="mq-note">Exemple réel : devis DEV-1528 (Santos, verre à whisky, rose des vents + « Eugenio »). Prix lus sur la fiche du verre à whisky : 19,90 € l'unité, 37,90 € les 2, 71,90 € les 4, règle de gravure des verres. Rien n'est sur le site.</p>

<section class="dm-vue" id="v-client">
 <div class="sheet">
  <div class="dv-head">
   <div><img src="{LOGO}" alt="Niv Création"><small>Niv Création — Atelier de personnalisation<br>6 rue d'Armaillé, 75017 Paris</small></div>
   <div><h1>Devis</h1><div class="num">DEV-1528</div><div class="dt">01 novembre 2026</div></div>
  </div>
  <div class="dv-to"><strong>Adressé à :</strong><br>Santos</div>
  <p class="dv-intro">Vous pouvez ajuster ce devis avant de le régler : le nombre de verres et ce que nous gravons. Le total se met à jour tout seul.</p>

  <div class="dv-art">
   <img src="{MODELE}" alt="Votre modèle : rose des vents et prénom">
   <div><h2>Verre à whisky gravé</h2><p>Rose des vents (N, O, E, S) et trait de vagues, d'après l'image que vous nous avez envoyée. Gravure blanche dépolie sur la face du verre.</p></div>
  </div>

  <div class="st">
   <h3><span class="dm-n">1</span>Nombre de verres</h3>
   <div class="qty">
    <div class="qbox"><button type="button" id="moins" aria-label="Un verre de moins">−</button><output id="qte">1</output><button type="button" id="plus" aria-label="Un verre de plus">+</button></div>
    <small id="lotTxt">À l'unité : 19,90 €</small>
   </div>
  </div>

  <div class="st">
   <h3><span class="dm-n">2</span>Que gravons-nous ?</h3>
   <div class="choix" id="choix">
    <button type="button" class="ch" data-c="both" aria-pressed="true">
     <span class="vis"><img src="{MODELE}" alt=""></span>
     <span><b>Image + prénom</b><span class="tag"> · votre modèle</span><br><span class="px" data-px="both"></span></span>
    </button>
    <button type="button" class="ch" data-c="img" aria-pressed="false">
     <span class="vis"><img src="{MODELE}" alt=""><span class="masque"></span></span>
     <span><b>Image seule</b><br><span class="px" data-px="img"></span></span>
    </button>
    <button type="button" class="ch" data-c="txt" aria-pressed="false">
     <span class="vis"><span class="nom">EUGENIO</span></span>
     <span><b>Prénom seul</b><br><span class="px" data-px="txt"></span></span>
    </button>
   </div>
   <label class="fld" id="fldPrenom">Prénom à graver
    <input id="prenom" value="EUGENIO" maxlength="20" autocomplete="off">
   </label>
   <label class="chk" id="chkDiff" hidden><input type="checkbox" id="diff"><span>Chaque verre est différent<small>Un prénom ou une gravure différente sur chaque verre.</small></span></label>
   <div class="pv" id="pv" hidden></div>
  </div>

  <div class="st">
   <h3><span class="dm-n">3</span>En option</h3>
   <div class="opt">
    <label class="chk" style="margin-top:0"><input type="checkbox" id="fond"><span>Graver aussi le fond du verre, vu à travers le verre <b>(+7 € par verre)</b><small>Par exemple une date ou un petit mot.</small></span></label>
    <label class="fld" id="fldFond" hidden>Texte du fond<input id="texteFond" placeholder="Ex. 12.06.2027" maxlength="30"></label>
   </div>
  </div>

  <div class="rec">
   <table><tbody id="lignes"></tbody></table>
   <div class="tot"><span>Total des articles</span><strong id="total">22,90 €</strong></div>
   <div class="tva">TVA non applicable, art. 293 B du CGI · livraison choisie à l'étape suivante</div>
   <button type="button" class="dm-pay" id="pay">Valider et payer</button>
   <div class="pay-msg" id="payMsg">Le devis enregistré suit vos choix ; la fiche de l'atelier aussi.</div>
  </div>

  <details class="dm-grid"><summary>Voir tous les prix</summary>
   <div class="tbl"><table><thead><tr><th>Verres</th><th>Image + prénom</th><th>Image seule</th><th>Prénom seul</th></tr></thead><tbody id="grille"></tbody></table></div>
   <p class="foot">Verre 1 : l'image est offerte, ou le prénom s'il n'y a pas d'image ; avec les deux, le prénom fait +3 €. Chaque verre en plus : image + prénom +5 €, image seule ou prénom seul +3 €.</p>
  </details>
  <p class="foot">Devis valable 30 jours. La fabrication démarre après le paiement.</p>
 </div>
</section>

<section class="dm-vue" id="v-gestion" hidden>
 <div class="adm">
  <div><div class="crumb">Gestion › Commandes › Devis &amp; factures</div><h1>Devis DEV-1528 · Santos</h1></div>

  <div class="dm-card">
   <h2>Lignes du devis <span>prix calculés comme sur la fiche</span></h2>
   <div class="ligne">
    <div class="ligne-h">
     <img src="{MODELE}" alt="">
     <div><b>Verre à whisky portrait personnalisé</b><small>Produit du catalogue · prix des lots et règle de gravure des verres appliqués d'office</small></div>
     <span class="pill">✓ lié à la fiche</span>
    </div>
    <div class="dm-g3">
     <label class="dm-lab">Image de la cliente<select><option>Photo du 01/11 (rose des vents)</option><option>Aucune</option></select></label>
     <label class="dm-lab">Prénom proposé<input value="EUGENIO"></label>
     <label class="dm-lab">Gravure proposée d'office<select id="aDef"><option value="both">Image + prénom</option><option value="img">Image seule</option><option value="txt">Prénom seul</option></select></label>
    </div>
    <div class="box-on">
     <label class="chk"><input type="checkbox" checked id="aQte"><span><b>La cliente peut changer le nombre</b><small>Boutons − 1 + sur son devis. Les prix des lots de la fiche s'appliquent.</small></span></label>
     <div class="dm-sub" id="aQteSub">
      <label class="dm-lab">Au moins<input type="number" value="1" min="1"></label>
      <label class="dm-lab">Au plus<input type="number" value="12" min="1"></label>
     </div>
    </div>
    <div class="box-on">
     <label class="chk"><input type="checkbox" checked id="aGrav"><span><b>La cliente peut choisir ce que l'on grave</b><small>Le prix change selon son choix, verre par verre.</small></span></label>
     <div class="gr" id="aGr">
      <label><input type="checkbox" checked><span>Image + prénom</span><span>verre 1 +3 € · suivants +5 €</span></label>
      <label><input type="checkbox" checked><span>Image seule</span><span>verre 1 offert · suivants +3 €</span></label>
      <label><input type="checkbox" checked><span>Prénom seul</span><span>verre 1 offert · suivants +3 €</span></label>
     </div>
    </div>
    <div class="box-on">
     <label class="chk"><input type="checkbox" checked><span><b>Proposer « chaque verre différent »</b><small>Un prénom et une gravure par verre ; tout part à la fiche atelier.</small></span></label>
    </div>
   </div>

   <div class="ligne" style="margin-top:12px">
    <div class="ligne-h">
     <div><b>Gravure au fond du verre</b><small>Option de la fiche « face + fond » · 7 € par verre</small></div>
     <span class="pill or">facultative</span>
    </div>
    <div class="box-on"><label class="chk"><input type="checkbox" checked><span><b>Ligne facultative</b><small>Décochée par défaut chez la cliente ; elle la coche si elle la veut.</small></span></label></div>
   </div>

   <div class="dm-add" style="margin-top:12px">+ Ajouter une ligne (produit du catalogue ou ligne libre à prix fixe)</div>
  </div>

  <div class="voit">
   <h2>Ce que la cliente pourra payer</h2>
   <p id="aRes"></p>
   <ul>
    <li>Le paiement est recalculé par le site : impossible de payer un autre prix que celui de la fiche.</li>
    <li>La commande garde le nombre de verres, la gravure de chaque verre et les prénoms : la fiche atelier les affiche.</li>
    <li>Même système pour les autres produits : chaque ligne reprend les suppléments de sa fiche (bijoux +3 € par texte, cristal texte +5 €…).</li>
   </ul>
  </div>

  <div class="btns"><button class="b">Enregistrer</button><button class="b gold">Envoyer le devis</button></div>
 </div>
</section>

<script>
(function(){{
 var LOT={{1:19.9,2:37.9,4:71.9}}, MIN=1, MAX=12;
 var NOMS={{both:'Image + prénom',img:'Image seule',txt:'Prénom seul'}};
 function eur(n){{return n.toLocaleString('fr-FR',{{minimumFractionDigits:2,maximumFractionDigits:2}})+' €';}}
 function prixVerres(n){{var t=0,r=n;while(r>=4){{t+=LOT[4];r-=4;}}while(r>=2){{t+=LOT[2];r-=2;}}if(r)t+=LOT[1];return Math.round(t*100)/100;}}
 function decomp(n){{var a=[],r=n,c4=0,c2=0,c1=0;while(r>=4){{c4++;r-=4;}}while(r>=2){{c2++;r-=2;}}c1=r;if(c4)a.push(c4>1?c4+' lots de 4':'lot de 4');if(c2)a.push('lot de 2');if(c1)a.push(c1+' à l\\'unité');return a.join(' + ');}}
 function grav(i,c){{if(i===0)return c==='both'?3:0;return c==='both'?5:3;}}
 var st={{n:1,c:'both',diff:false,per:[],fond:false}};
 var $=function(id){{return document.getElementById(id);}};
 function choixVerre(i){{return st.diff&&st.per[i]?st.per[i].c:st.c;}}
 function calc(){{
  var n=st.n,v=prixVerres(n),g=[],tg=0;
  for(var i=0;i<n;i++){{var x=grav(i,choixVerre(i));g.push(x);tg+=x;}}
  var f=st.fond?7*n:0;
  return {{v:v,g:g,tg:tg,f:f,t:Math.round((v+tg+f)*100)/100}};
 }}
 function render(){{
  var n=st.n,r=calc();
  $('qte').textContent=n;$('moins').disabled=n<=MIN;$('plus').disabled=n>=MAX;
  $('lotTxt').textContent=(n===1?'À l\\'unité : ':decomp(n)+' : ')+eur(r.v);
  document.querySelectorAll('.ch').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.c===st.c));}});
  var px={{both:'Verre 1 : <em>+3 €</em>',img:'Verre 1 : <em>offerte</em>',txt:'Verre 1 : <em>offert</em>'}};
  var nx={{both:'+5 €',img:'+3 €',txt:'+3 €'}};
  document.querySelectorAll('[data-px]').forEach(function(s){{var c=s.dataset.px;s.innerHTML=px[c]+(n>1?' · verres suivants : <em>'+nx[c]+'</em>':'');}});
  $('fldPrenom').hidden=st.diff||st.c==='img';
  $('chkDiff').hidden=n<2; if(n<2)st.diff=false; $('diff').checked=st.diff;
  var pv=$('pv'); pv.hidden=!st.diff; pv.innerHTML='';
  if(st.diff){{for(var i=0;i<n;i++){{
   if(!st.per[i])st.per[i]={{c:st.c,p:$('prenom').value}};
   var d=document.createElement('div');d.className='dm-pv-row';
   d.innerHTML='<b>Verre '+(i+1)+'</b><select aria-label="Gravure du verre '+(i+1)+'"><option value="both">Image + prénom</option><option value="img">Image seule</option><option value="txt">Prénom seul</option></select><input class="dm-nm" aria-label="Prénom du verre '+(i+1)+'" maxlength="20"><span class="dm-p">'+(r.g[i]?'+'+eur(r.g[i]):'offert')+'</span>';
   var sel=d.querySelector('select'),inp=d.querySelector('input');sel.value=st.per[i].c;inp.value=st.per[i].p;inp.disabled=st.per[i].c==='img';inp.placeholder=st.per[i].c==='img'?'sans prénom':'Prénom';
   (function(k,s,ip){{s.onchange=function(){{st.per[k].c=s.value;render();}};ip.oninput=function(){{st.per[k].p=ip.value;}};}})(i,sel,inp);
   pv.appendChild(d);
  }}}}
  $('fldFond').hidden=!st.fond;
  var L=[];
  L.push(['Verre à whisky gravé × '+n+(n>1?' <small>('+decomp(n)+')</small>':''),eur(r.v)]);
  if(!st.diff){{
   var c=st.c;
   L.push(['Gravure verre 1 : '+NOMS[c].toLowerCase(),r.g[0]?eur(r.g[0]):'<span class="dm-off">offerte</span>']);
   if(n>1)L.push(['Gravure verres 2 à '+n+' : '+NOMS[c].toLowerCase()+' ('+eur(r.g[1])+' × '+(n-1)+')',eur(r.g[1]*(n-1))]);
  }}else{{for(var i=0;i<n;i++)L.push(['Gravure verre '+(i+1)+' : '+NOMS[choixVerre(i)].toLowerCase(),r.g[i]?eur(r.g[i]):'<span class="dm-off">offerte</span>']);}}
  if(st.fond)L.push(['Gravure au fond du verre (7 € × '+n+')',eur(r.f)]);
  $('lignes').innerHTML=L.map(function(l){{return '<tr><td>'+l[0]+'</td><td>'+l[1]+'</td></tr>';}}).join('');
  $('total').textContent=eur(r.t);$('pay').textContent='Valider et payer '+eur(r.t);
 }}
 function grille(){{var h='';[1,2,3,4,6].forEach(function(n){{var row='<tr><td>'+n+' verre'+(n>1?'s':'')+'</td>';['both','img','txt'].forEach(function(c){{var t=prixVerres(n);for(var i=0;i<n;i++)t+=grav(i,c);row+='<td>'+eur(Math.round(t*100)/100)+'</td>';}});h+=row+'</tr>';}});$('grille').innerHTML=h;}}
 $('moins').onclick=function(){{if(st.n>MIN){{st.n--;render();}}}};
 $('plus').onclick=function(){{if(st.n<MAX){{st.n++;render();}}}};
 document.querySelectorAll('.ch').forEach(function(b){{b.onclick=function(){{st.c=b.dataset.c;st.per=st.per.map(function(p){{return {{c:st.c,p:p.p}};}});render();}};}});
 $('diff').onchange=function(){{st.diff=this.checked;render();}};
 $('fond').onchange=function(){{st.fond=this.checked;render();}};
 $('pay').onclick=function(){{$('payMsg').textContent='Maquette : ici, la page de paiement s\\'ouvre avec ce total exact.';}};
 grille();render();
 // Gestion
 function aRes(){{var c=$('aDef').value;var a=prixVerres(1)+grav(0,c),b=prixVerres(12);for(var i=0;i<12;i++)b+=grav(i,'both');
  $('aRes').innerHTML='Proposé d\\'office : 1 verre, '+NOMS[c].toLowerCase()+' = <b>'+eur(a)+'</b>. Selon ses choix, de <b>'+eur(prixVerres(1))+'</b> (1 verre, prénom ou image seule) à <b>'+eur(Math.round((b+84)*100)/100)+'</b> (12 verres, image + prénom, fond gravé).';}}
 $('aDef').onchange=function(){{aRes();st.c=this.value;render();}};
 $('aQte').onchange=function(){{$('aQteSub').hidden=!this.checked;}};
 $('aGrav').onchange=function(){{$('aGr').hidden=!this.checked;}};
 aRes();
 document.querySelectorAll('.mq-tab').forEach(function(t){{t.onclick=function(){{document.querySelectorAll('.mq-tab').forEach(function(x){{x.setAttribute('aria-selected',String(x===t));}});
  $('v-client').hidden=t.dataset.v!=='client';$('v-gestion').hidden=t.dataset.v!=='gestion';window.scrollTo(0,0);}};}});
}})();
</script>
"""

with open(out, "w", encoding="utf-8") as f:
    f.write(HTML)
print(out, len(HTML) // 1024, "Ko")
