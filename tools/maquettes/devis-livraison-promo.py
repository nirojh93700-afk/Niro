# -*- coding: utf-8 -*-
"""Maquette « page du devis côté client » : livraison (domicile / point relais) + code promo (03/10/2026).
Demande du gérant (dossier Simon Pascal, clé USB 64 Go) : « il faut que je puisse mettre l'adresse
comme sur le site… le code promo c'est à lui de le mettre » → le client s'inscrit sur le site, reçoit
son code de bienvenue, puis le saisit LUI-MÊME sur le lien du devis ; il choisit aussi domicile ou
point relais (même carte que le panier). Rien n'est en ligne.
Part du VRAI CSS du site (curl nivcreation.fr). Usage : python3 tools/maquettes/devis-livraison-promo.py
"""
import glob, os

S = os.environ.get("NIV_SCRATCH", "/tmp/claude-0/-home-user-Niro/8c34bee5-87e4-524d-be1e-7cc50fe3894e/scratchpad")
OUT = "/home/user/Niro/docs/maquettes/devis-livraison-promo.html"
css = "".join(open(f, encoding="utf8").read() for f in sorted(glob.glob(f"{S}/site_*.css")))
import re
css = re.sub(r"@font-face\{[^}]*\}", "", css)

PAGE = r'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Devis client — livraison et code promo</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>__CSS__</style>
<style>
html{--font-display:"Playfair Display",serif;--font-body:"Inter",sans-serif}
.mq-bar{background:#1d1811;color:#f3e8d3;font:600 .8rem/1.45 "Inter",system-ui;padding:9px 16px}
.mq-bar b{background:#d6b25a;color:#1d1811;border-radius:6px;padding:2px 8px;font-size:.72rem;letter-spacing:.06em;margin-right:8px}
.mq-bar span{opacity:.92;font-weight:500}
.mq-hdr{background:var(--paper);border-bottom:1px solid var(--line);padding:14px 20px;font-family:var(--font-display),serif;font-size:1.5rem}
.mq-hdr em{font-style:italic;color:var(--gold-dark)}
.mq-new{position:relative;border:2px dashed #d6b25a;border-radius:14px;padding:16px 14px 14px;margin-top:22px}
.mq-new>.mq-tag{position:absolute;top:-11px;left:12px;background:#d6b25a;color:#1d1811;font-size:.66rem;font-weight:800;letter-spacing:.06em;padding:3px 9px;border-radius:999px;text-transform:uppercase}
.rl-btns{display:flex;flex-wrap:wrap;gap:8px}
.rl-btn{flex:1 1 45%;padding:12px 10px;border:1.5px solid var(--line);background:#fff;border-radius:10px;cursor:pointer;font:inherit;text-align:center}
.rl-btn.on{border-color:var(--gold-dark,#b8860b);background:rgba(184,134,11,.08);font-weight:600}
.rl-btn small{display:block;font-weight:400;color:var(--ink-soft);font-size:.78rem;margin-top:2px}
.rl-map{height:230px;border-radius:12px;margin-top:12px;overflow:hidden;border:1px solid var(--line);position:relative;background:#e9eee4}
.rl-map svg{width:100%;height:100%;display:block}
.rl-pin{cursor:pointer}
.rl-list{margin-top:12px;display:grid;gap:8px}
.rl-pt{text-align:left;padding:10px 12px;border:1.5px solid var(--line);background:#fff;border-radius:10px;cursor:pointer;font:inherit}
.rl-pt.on{border-color:var(--gold-dark,#b8860b);background:rgba(184,134,11,.08)}
.rl-pt .l1{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.rl-pt .l1 b{font-size:.95rem}.rl-pt .p{font-size:.86rem;font-weight:700;color:var(--gold-dark,#a98935);white-space:nowrap}
.rl-pt .l2{font-size:.84rem;color:var(--ink-soft)}.rl-pt .l3{font-size:.76rem;color:var(--ink-soft);margin-top:2px}
.rl-form{display:flex;gap:8px;flex-wrap:wrap}
.rl-form input,.pr-in{padding:10px 12px;border:1px solid var(--line);border-radius:10px;font:inherit;min-width:0;box-sizing:border-box}
.rl-form input{flex:1 1 140px}
.rl-ok{margin:12px 0 0;font-size:.9rem;color:#256b34;font-weight:600}
.rl-note{font-size:.82rem;color:var(--ink-soft);margin:10px 0 0;line-height:1.5}
.pr-box{border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--paper)}
.pr-row{display:flex;gap:8px;flex-wrap:wrap}.pr-row .pr-in{flex:1 1 180px}
.pr-link{background:none;border:0;padding:0;color:var(--gold-dark);text-decoration:underline;cursor:pointer;font:inherit;font-weight:600}
.pr-msg{margin-top:8px;font-size:.85rem;color:#b4552f}
.pr-ok{background:#eef7ee;border:1px solid #bcd9bc;border-radius:10px;padding:12px 14px;font-size:.92rem}
.recap{margin-top:18px;border:1px solid #e7d3a1;border-radius:12px;background:linear-gradient(135deg,#fbf4e6,#fffdf9);padding:6px 14px}
.recap .r{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #e7d3a1;font-size:.9rem}
.recap .r:last-child{border-bottom:0}.recap .r span{color:var(--ink-soft)}
.recap .tot b{font-size:1.15rem;color:var(--gold-dark)}
.recap .rem b{color:#256b34}
.btn[disabled]{opacity:.45;cursor:not-allowed;filter:grayscale(.6);box-shadow:none}
.pay-hint{font-size:.78rem;color:#b4552f;background:#fff5ee;border:1px solid #f2cdb6;border-radius:10px;padding:8px 12px;margin:10px 0 0}
.mq-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#fff;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:80;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw;text-align:center}.mq-toast.on{opacity:1}
[hidden]{display:none!important}
@media(max-width:560px){.doc-sheet{padding:22px 16px!important}.doc-sheet td,.doc-sheet th{font-size:.84rem}.doc-sheet td:nth-child(n+3),.recap .r b{white-space:nowrap}}
</style></head><body>
<div class="mq-bar"><b>MAQUETTE</b><span>Rien n'est en ligne. Voici la page du devis telle que la verrait Simon : <u>livraison au choix</u> (domicile ou point relais, même carte que le panier) et <u>code promo saisi par lui</u> après son inscription sur le site. Les points relais de la carte sont des exemples. Essayez : « Point relais », puis le code <b style="background:#fff;color:#1d1811">BIENVENUE10</b>.</span></div>
<div class="mq-hdr">Niv <em>Création</em></div>
<section class="section"><div class="container" style="max-width:720px">
<div class="doc-sheet" style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 28px;box-shadow:var(--shadow)">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <div style="font-size:.82rem;color:var(--ink-soft);line-height:1.5"><strong style="font-size:1rem;color:var(--ink)">Niv Création</strong> — Atelier de personnalisation<br>6 rue d'Armaillé, 75017 Paris<br>contact.nivcreation@gmail.com</div>
    <div style="text-align:right"><h1 style="margin:0;color:var(--gold-dark);font-size:1.6rem">Devis</h1><div style="font-weight:700">DEV-1514</div><div style="font-size:.85rem;color:var(--ink-soft)">3 octobre 2026</div></div>
  </div>
  <div style="margin-top:24px;font-size:.92rem"><strong>Adressé à :</strong><br>Simon Pascal<br>pascal.smn.ps@gmail.com</div>
  <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:.92rem">
    <thead><tr style="text-align:left;color:var(--ink-soft);border-bottom:2px solid var(--line)"><th style="padding:8px 6px">Désignation</th><th style="padding:8px 6px;text-align:center">Qté</th><th style="padding:8px 6px;text-align:right">P.U.</th><th style="padding:8px 6px;text-align:right">Total</th></tr></thead>
    <tbody><tr style="border-bottom:1px solid var(--line)"><td style="padding:8px 6px">Clé USB 64 Go en bois et cristal, coffret en bambou, gravée « Suzanne &amp; Louis 60 ans de mariage »</td><td style="padding:8px 6px;text-align:center">1</td><td style="padding:8px 6px;text-align:right">44,90 €</td><td style="padding:8px 6px;text-align:right">44,90 €</td></tr></tbody>
  </table>
  <div style="text-align:right;margin-top:14px;font-size:1.05rem"><strong>Total des articles : 44,90 €</strong></div>
  <div style="text-align:right;font-size:.78rem;color:var(--ink-soft)">TVA non applicable, art. 293 B du CGI</div>

  <div class="mq-new" style="margin-top:28px"><span class="mq-tag">Nouveau — livraison au choix du client</span>
    <label style="display:block;font-size:.92rem;font-weight:600;margin-bottom:8px">Mode de livraison</label>
    <div class="rl-btns">
      <button type="button" class="rl-btn on" data-m="domicile">🏠 À domicile<small>6,90 €</small></button>
      <button type="button" class="rl-btn" data-m="relais">📍 Point relais<small>à partir de 4,90 €</small></button>
    </div>
    <div id="dom" class="rl-note">Votre adresse de livraison et votre téléphone vous seront demandés à l'étape suivante (paiement sécurisé).</div>
    <div id="rel" hidden>
      <form class="rl-form" id="rform" style="margin-top:12px"><input type="text" inputmode="numeric" id="zip" placeholder="Code postal (ex. 95350)"><input type="text" id="city" placeholder="Ville (facultatif)"><button type="submit" class="btn btn-outline">Voir la carte</button></form>
      <div id="relres" hidden>
        <div class="rl-map"><svg viewBox="0 0 600 230" preserveAspectRatio="xMidYMid slice" aria-label="Carte des points relais (exemple)">
          <rect width="600" height="230" fill="#e9eee4"/><path d="M0 150 C120 120 200 190 330 140 S520 90 600 120" stroke="#fff" stroke-width="14" fill="none"/><path d="M90 0 C110 80 80 150 130 230" stroke="#fff" stroke-width="10" fill="none"/><path d="M420 0 C400 70 470 140 450 230" stroke="#fff" stroke-width="10" fill="none"/><path d="M0 60 C150 70 260 30 600 60" stroke="#f6f1e1" stroke-width="7" fill="none"/>
          <rect x="160" y="20" width="90" height="60" rx="8" fill="#d6e4cf"/><rect x="500" y="150" width="70" height="60" rx="8" fill="#d6e4cf"/>
          <g class="rl-pin" data-i="0"><circle cx="215" cy="130" r="13" fill="#a98935"/><text x="215" y="135" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">1</text></g>
          <g class="rl-pin" data-i="1"><circle cx="330" cy="95" r="13" fill="#a98935"/><text x="330" y="100" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">2</text></g>
          <g class="rl-pin" data-i="2"><circle cx="440" cy="150" r="13" fill="#a98935"/><text x="440" y="155" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">3</text></g>
        </svg></div>
        <div class="rl-list" id="rlist"></div>
      </div>
      <p class="rl-ok" id="rok" hidden></p>
      <p class="rl-note">Votre colis sera livré au point relais choisi ; à l'étape suivante, vous indiquerez seulement vos coordonnées (nom, téléphone).</p>
    </div>
  </div>

  <div class="mq-new" style="margin-top:22px"><span class="mq-tag">Nouveau — code promo saisi par le client</span>
    <div id="prlink"><button type="button" class="pr-link" id="propen">J'ai un code promo</button></div>
    <div id="prform" hidden class="pr-box">
      <label for="prcode" style="display:block;font-weight:600;font-size:.88rem;margin-bottom:6px">Code promo</label>
      <div class="pr-row"><input class="pr-in" id="prcode" placeholder="Ex : BIENVENUE10" autocapitalize="characters" autocomplete="off"><button type="button" class="btn btn-outline" id="prapply">Appliquer</button></div>
      <div class="pr-msg" id="prmsg" hidden role="alert"></div>
      <p class="rl-note" style="margin-top:8px">Pas encore de code ? Rendez-vous sur <u>nivcreation.fr</u> : une fenêtre vous propose de vous inscrire à notre newsletter, et vous recevez votre code de bienvenue par e-mail.</p>
    </div>
    <div id="prok" hidden class="pr-ok"><strong id="prtitle"></strong><div style="margin-top:4px;font-size:.88rem;color:var(--ink-soft)">La remise s'applique sur vos articles, pas sur la livraison.</div><button type="button" class="pr-link" id="prdel" style="font-weight:400;font-size:.82rem;margin-top:6px;color:var(--ink-soft)">Retirer le code</button></div>
  </div>

  <div class="recap" id="recap">
    <div class="r"><span>Articles</span><b>44,90 €</b></div>
    <div class="r rem" id="rrem" hidden><span id="rremt">Remise</span><b id="rremv"></b></div>
    <div class="r"><span id="rlivt">Livraison à domicile</span><b id="rliv">6,90 €</b></div>
    <div class="r tot"><span>Total à payer</span><b id="rtot">51,80 €</b></div>
  </div>
  <div class="doc-actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
    <button class="btn btn-gold" id="pay">Accepter et payer en ligne</button>
    <button class="btn btn-outline" type="button">Imprimer / Enregistrer en PDF</button>
  </div>
  <p class="pay-hint" id="payhint" hidden>Choisissez votre point relais pour continuer.</p>
</div></div></section>
<div class="mq-toast" id="toast"></div>
<script>
(function(){
  var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
  var ART=44.90,DOM=6.90;
  var PTS=[{n:"Tabac Presse Le Balto",s:"12 rue de la Gare",z:"95350",c:"Saint-Brice-sous-Forêt",car:"Mondial Relay",p:4.90},{n:"Bureau de Poste",s:"3 place de la Mairie",z:"95350",c:"Saint-Brice-sous-Forêt",car:"Relais Colis",p:5.50},{n:"Épicerie du Centre",s:"28 avenue Jean Jaurès",z:"95400",c:"Villiers-le-Bel",car:"Chrono Shop2Shop",p:5.90}];
  var eur=function(n){return n.toFixed(2).replace(".",",")+" €"};
  var st={m:"domicile",pt:null,promo:null};
  function pct(){return st.promo?Math.round(ART*10)/100:0}
  function liv(){return st.m==="relais"?(st.pt?st.pt.p:null):DOM}
  function refresh(){
    var l=liv(),r=pct();
    $("#rrem").hidden=!r; if(r){$("#rremt").textContent="Remise "+st.promo+" (−10 %)";$("#rremv").textContent="−"+eur(r);}
    $("#rlivt").textContent=st.m==="relais"?(st.pt?"Livraison en point relais ("+st.pt.car+")":"Livraison en point relais"):"Livraison à domicile";
    $("#rliv").textContent=l==null?"à choisir":eur(l);
    $("#rtot").textContent=l==null?"—":eur(ART-r+l);
    var bloque=st.m==="relais"&&!st.pt; $("#pay").disabled=bloque; $("#payhint").hidden=!bloque;
    $$(".rl-btn").forEach(function(b){b.classList.toggle("on",b.dataset.m===st.m)});
    $("#dom").hidden=st.m!=="domicile"; $("#rel").hidden=st.m!=="relais";
  }
  $$(".rl-btn").forEach(function(b){b.addEventListener("click",function(){st.m=b.dataset.m;refresh()})});
  function pick(i){st.pt=PTS[i];$$(".rl-pt").forEach(function(x,k){x.classList.toggle("on",k===i)});var o=$("#rok");o.hidden=false;o.textContent="✓ Point relais choisi : "+st.pt.n+" — "+st.pt.z+" "+st.pt.c+" ("+st.pt.car+" — "+eur(st.pt.p)+")";refresh()}
  $("#rform").addEventListener("submit",function(e){e.preventDefault();$("#relres").hidden=false;
    $("#rlist").innerHTML=PTS.map(function(p,i){return '<button type="button" class="rl-pt" data-i="'+i+'"><div class="l1"><b>📍 '+p.n+'</b><span class="p">'+eur(p.p)+'</span></div><div class="l2">'+p.s+' — '+p.z+' '+p.c+'</div><div class="l3">via '+p.car+'</div></button>'}).join("");
    $$(".rl-pt").forEach(function(b){b.addEventListener("click",function(){pick(+b.dataset.i)})});
    $$(".rl-pin").forEach(function(g){g.addEventListener("click",function(){pick(+g.dataset.i)})});});
  $("#propen").addEventListener("click",function(){$("#prlink").hidden=true;$("#prform").hidden=false;$("#prcode").focus()});
  function appliquer(){var c=$("#prcode").value.trim().toUpperCase(),m=$("#prmsg");m.hidden=true;
    if(!c){m.textContent="Saisissez votre code promo.";m.hidden=false;return}
    if(c!=="BIENVENUE10"){m.textContent="Ce code n'est pas valable pour ce devis.";m.hidden=false;return}
    st.promo=c;$("#prform").hidden=true;$("#prok").hidden=false;$("#prtitle").textContent="Code "+c+" appliqué (−10 %) : −"+eur(pct())+" sur vos articles.";refresh()}
  $("#prapply").addEventListener("click",appliquer);$("#prcode").addEventListener("keydown",function(e){if(e.key==="Enter")appliquer()});
  $("#prdel").addEventListener("click",function(){st.promo=null;$("#prok").hidden=true;$("#prform").hidden=false;$("#prcode").value="";refresh()});
  $("#pay").addEventListener("click",function(){if($("#pay").disabled)return;var t=$("#toast");t.textContent="Maquette : le client serait envoyé vers la page de paiement sécurisé Stripe ("+$("#rtot").textContent+").";t.classList.add("on");setTimeout(function(){t.classList.remove("on")},3200)});
  refresh();
})();
</script></body></html>'''

open(OUT, "w", encoding="utf8").write(PAGE.replace("__CSS__", css))
print("écrit", OUT, os.path.getsize(OUT) // 1024, "Ko")
