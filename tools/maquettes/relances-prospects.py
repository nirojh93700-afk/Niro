# -*- coding: utf-8 -*-
# Maquette (25/11/2026) — Gestion › Clients › Restaurants & bars, avec les RELANCES À J+3, J+7 ET J+14
# et le rappel « À relancer aujourd'hui ». Gérant : « fais la maquette » (après la proposition des relances
# et des réponses aux objections). RIEN n'est construit dans le site : c'est une maquette.
# Usage : python3 tools/maquettes/relances-prospects.py <dossier css du site> <sortie.html>
#   (dossier css = les feuilles de https://nivcreation.fr/gestion/restaurants, mêmes classes .ash-* / .ph-* que le site ;
#    seul .rl-* est neuf). Les établissements sont des EXEMPLES inventés.
import sys, os, html, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import css_site, logo_uri, I, ICONS

CSS_DIR, OUT = sys.argv[1], sys.argv[2]

# Établissements d'exemple (inventés) : étape = nombre de messages déjà partis (1 = premier mail).
EX = [
  dict(id="a", nom="Le Comptoir des Halles", ville="Lyon", type="Bar à cocktails", mail="contact@comptoir-halles.fr", envoi="Envoyé le 22/11", etape=1, du="J+3", statut="relancer", depuis="il y a 3 jours"),
  dict(id="b", nom="La Table de Margaux", ville="Bordeaux", type="Restaurant bistronomique", mail="bonjour@tabledemargaux.fr", envoi="Envoyé le 18/11", etape=2, du="J+7", statut="relancer", depuis="il y a 7 jours"),
  dict(id="c", nom="Cave & Comptoir", ville="Nantes", type="Cave à vins", mail="cave@caveetcomptoir.fr", envoi="Envoyé le 11/11", etape=3, du="J+14", statut="relancer", depuis="il y a 14 jours"),
  dict(id="d", nom="L'Atelier Gourmand", ville="Lille", type="Restaurant", mail="contact@ateliergourmand.fr", envoi="Envoyé le 23/11", etape=1, du="J+3 le 26/11", statut="attente", depuis="il y a 2 jours"),
  dict(id="e", nom="Le Petit Zinc", ville="Toulouse", type="Bistrot", mail="lepetitzinc@orange.fr", envoi="Envoyé le 20/11", etape=2, du="J+7 le 27/11", statut="attente", depuis="il y a 5 jours"),
  dict(id="f", nom="Brasserie du Port", ville="La Rochelle", type="Brasserie", mail="contact@brasserieduport.fr", envoi="Envoyé le 19/11", etape=1, du="", statut="repondu", depuis="a répondu le 21/11", reponse="« Bonjour, ça nous intéresse. Vous pouvez nous envoyer des exemples ? »"),
  dict(id="g", nom="Maison Lumière", ville="Annecy", type="Restaurant gastronomique", mail="hello@maisonlumiere.fr", envoi="Envoyé le 28/10", etape=4, du="", statut="termine", depuis="3 relances sans réponse"),
]

MSG = {
  "J+3": ("Relance 1 — 3 jours après le premier mail",
          "Bonjour,\n\nJe me permets de revenir vers vous au sujet des verres gravés au logo de votre établissement.\n\nVoulez-vous que je vous envoie quelques photos de réalisations pour vous faire une idée ?"),
  "J+7": ("Relance 2 — 7 jours après le premier mail",
          "Bonjour,\n\nJe comprends que vous soyez très pris. Je reste disponible si vous souhaitez un exemple gravé à votre nom : il suffit de me répondre avec votre logo."),
  "J+14": ("Relance 3 — 14 jours après le premier mail (la dernière)",
           "Bonjour,\n\nC'est mon dernier message pour ne pas vous déranger. Si un jour vous cherchez des verres, des carafes ou des numéros de table à votre image, je serai ravi d'en parler."),
}

OBJ = [
  ("« C'est trop cher »", "Chaque pièce est gravée à la commande, dans notre atelier en France. Nous pouvons commencer par une petite quantité pour que vous voyiez le rendu."),
  ("« On a déjà des verres »", "La gravure se fait aussi sur des carafes, des numéros de table ou un menu en bois, pour compléter ce que vous avez déjà."),
  ("« Pas le temps de s'en occuper »", "Vous nous envoyez votre logo, nous nous occupons du reste."),
  ("« Ça passe au lave-vaisselle ? »", "Oui pour les verres et les carafes : la gravure fait partie du verre, elle ne s'efface pas."),
  ("« Il faut en commander beaucoup ? »", "Non, il n'y a pas de minimum industriel."),
]

STAPES = ["1er mail", "J+3", "J+7", "J+14"]

def frise(e):
    out = []
    for k, s in enumerate(STAPES):
        if k < e["etape"]: cls = "ok"
        elif e["statut"] == "relancer" and k == e["etape"]: cls = "now"
        elif e["statut"] in ("repondu", "termine"): cls = "off"
        else: cls = "todo"
        out.append(f'<li class="rl-st {cls}"><i></i><span>{s}</span></li>')
    return '<ol class="rl-frise">' + "".join(out) + "</ol>"

def pill(e):
    m = {"relancer": ("rl-p-now", "À relancer aujourd'hui"), "attente": ("rl-p-wait", "En attente"),
         "repondu": ("rl-p-ok", "A répondu"), "termine": ("rl-p-end", "Relances terminées")}
    c, t = m[e["statut"]]
    return f'<span class="rl-pill {c}">{t}</span>'

def ligne(e):
    act = ""
    if e["statut"] == "relancer":
        act = f'<button type="button" class="rl-btn rl-go" data-id="{e["id"]}" data-step="{e["du"]}">{I("mail")} Relancer ({e["du"]})</button><button type="button" class="rl-btn rl-soft" data-later="{e["id"]}">Demain</button>'
    elif e["statut"] == "attente":
        act = f'<span class="rl-next">{I("clock")} Prochaine relance : {html.escape(e["du"])}</span>'
    elif e["statut"] == "repondu":
        act = f'<span class="rl-rep">{html.escape(e["reponse"])}</span><span class="rl-next">Relances arrêtées toutes seules</span>'
    else:
        act = '<span class="rl-next">Plus de relance. Vous pouvez le remettre « À contacter » dans quelques mois.</span>'
    return f'''<article class="rl-row" data-statut="{e["statut"]}" id="row-{e["id"]}">
  <div class="rl-who"><div class="rl-name">{html.escape(e["nom"])}</div><div class="rl-meta">{html.escape(e["type"])} · {html.escape(e["ville"])} · {html.escape(e["mail"])}</div></div>
  <div class="rl-mid">{pill(e)}<span class="rl-when">{html.escape(e["envoi"])} · {html.escape(e["depuis"])}</span>{frise(e)}</div>
  <div class="rl-act">{act}</div>
</article>'''

n_rel = sum(e["statut"] == "relancer" for e in EX)
n_att = sum(e["statut"] == "attente" for e in EX)
n_rep = sum(e["statut"] == "repondu" for e in EX)
n_end = sum(e["statut"] == "termine" for e in EX)

tabs = [("tous", "Tous", len(EX)), ("relancer", "À relancer", n_rel), ("attente", "En attente", n_att), ("repondu", "Ont répondu", n_rep), ("termine", "Terminés", n_end)]
tabs_html = "".join(f'<button type="button" class="rl-tab{" on" if k == "relancer" else ""}" data-f="{k}">{t} <b>{n}</b></button>' for k, t, n in tabs)

msgs_html = "".join(f'''<div class="rl-tpl"><div class="rl-tpl-h"><b>{html.escape(t)}</b><span class="rl-day">{k}</span></div>
<textarea id="tpl-{k.replace("+", "")}" rows="5">{html.escape(m)}</textarea>
<div class="rl-tpl-f"><label class="rl-sw"><input type="checkbox" checked> Active</label><span>Envoyée {k[2:]} jours après le premier mail si l'établissement n'a pas répondu.</span></div></div>''' for k, (t, m) in MSG.items())

obj_html = "".join(f'''<div class="rl-obj"><div class="rl-obj-q">{html.escape(q)}</div><p>{html.escape(r)}</p><button type="button" class="rl-copy" data-copy="{html.escape(r)}">{I("copy")} Copier</button></div>''' for q, r in OBJ)

rows = "".join(ligne(e) for e in EX)

BODY = f'''
<div class="ph">
  <div class="ph-row">
    <div class="ph-txt"><div class="ph-eyebrow">Clients · Prospection</div><h1 class="ph-title">Restaurants &amp; bars</h1>
    <p class="ph-sub">Les établissements démarchés, leurs réponses, et maintenant les relances à J+3, J+7 et J+14. Une relance ne part jamais toute seule : vous la relisez et cliquez.</p></div>
    <div class="ph-actions"><button type="button" class="rl-btn rl-go" id="tout">{I("mail")} Relancer les {n_rel} du jour</button></div>
  </div>
  <div class="ph-kpis">
    <div class="ph-kpi warn"><small>À relancer aujourd'hui</small><b id="k-rel">{n_rel}</b><span>J+3, J+7 ou J+14 atteint</span></div>
    <div class="ph-kpi"><small>En attente de réponse</small><b>{n_att}</b><span>relance prévue plus tard</span></div>
    <div class="ph-kpi good"><small>Ont répondu</small><b>{n_rep}</b><span>relances arrêtées</span></div>
    <div class="ph-kpi"><small>Taux de réponse</small><b>14 %</b><span>sur les établissements contactés</span></div>
  </div>
</div>

<section class="rl-today">
  <div class="rl-today-ic">{I("bolt")}</div>
  <div><b>Rappel du jour : {n_rel} établissements à relancer</b><p>Chaque matin, la pastille du menu et le résumé du matin vous disent combien de relances attendent. Une réponse de l'établissement ou un « STOP » arrête ses relances tout seul.</p></div>
</section>

<nav class="rl-tabs" id="tabs">{tabs_html}</nav>
<div class="rl-list" id="list">{rows}</div>
<p class="rl-note">Établissements d'exemple : sur le site, ce seront vos vrais établissements démarchés.</p>

<div class="rl-cols">
  <section class="rl-box"><h2>Les 3 messages de relance</h2><p class="rl-box-s">Modifiables ici. Ils partent par le site, avec votre signature Niv Création et le bouton « Répondre ».</p>{msgs_html}</section>
  <section class="rl-box"><h2>Réponses aux objections</h2><p class="rl-box-s">Quand un établissement répond avec une hésitation : la réponse à copier dans votre message.</p>{obj_html}</section>
</div>
'''

MODAL = f'''<div class="rl-modal" id="modal" hidden><div class="rl-sheet" role="dialog" aria-modal="true" aria-labelledby="m-t">
  <div class="rl-sheet-h"><b id="m-t">Relance</b><button type="button" class="rl-x" id="m-x" aria-label="Fermer">{I("x")}</button></div>
  <div class="rl-field"><span>À</span><b id="m-to"></b></div>
  <div class="rl-field"><span>Objet</span><b>Le logo de votre établissement, gravé sur vos verres</b></div>
  <textarea id="m-txt" rows="8"></textarea>
  <p class="rl-sheet-n">Il part dans le même fil que votre premier mail, avec le bouton « Répondre ». S'il répond, ses relances s'arrêtent.</p>
  <div class="rl-sheet-a"><button type="button" class="rl-btn rl-soft" id="m-no">Ne plus relancer</button><button type="button" class="rl-btn rl-go" id="m-ok">{I("mail")} Envoyer la relance</button></div>
</div></div>
<div class="rl-toast" id="toast" hidden></div>'''

CSS = r'''
:root{--rl-gold:#a98935;--rl-gold-l:#f6eedb;--rl-ink:#1d1811;--rl-soft:#6f665a;--rl-line:#e8dfcc;--rl-bg:#fff;--rl-red:#b4412f;--rl-red-l:#fbece8;--rl-green:#2f7a4f;--rl-green-l:#e7f3ec;--rl-blue:#3c5b8a;--rl-blue-l:#eaf0f8}
.rl-btn{display:inline-flex;align-items:center;gap:7px;border-radius:10px;padding:9px 14px;font:600 .88rem/1.1 Inter,system-ui,sans-serif;cursor:pointer;border:1px solid transparent;min-height:40px}
.rl-btn svg{width:16px;height:16px}
.rl-go{background:var(--rl-ink);color:#fff}
.rl-go:hover{background:#3a3125}
.rl-soft{background:#fff;color:var(--rl-ink);border-color:var(--rl-line)}
.rl-btn:focus-visible,.rl-tab:focus-visible,.rl-copy:focus-visible{outline:2px solid var(--rl-gold);outline-offset:2px}
.rl-today{display:flex;gap:12px;align-items:flex-start;background:var(--rl-gold-l);border:1px solid #e6d3a3;border-radius:12px;padding:12px 14px;margin:16px 0 4px}
.rl-today-ic{width:34px;height:34px;border-radius:50%;background:var(--rl-gold);color:#fff;display:grid;place-items:center;flex:none}
.rl-today-ic svg{width:18px;height:18px}
.rl-today b{color:var(--rl-ink)}
.rl-today p{margin:3px 0 0;color:var(--rl-soft);font-size:.88rem}
.rl-tabs{display:flex;gap:6px;overflow-x:auto;margin:16px 0 10px;padding-bottom:2px;scrollbar-width:none}
.rl-tab{flex:none;border:1px solid var(--rl-line);background:#fff;border-radius:999px;padding:7px 13px;font:600 .85rem Inter,system-ui,sans-serif;color:var(--rl-soft);cursor:pointer;min-height:36px}
.rl-tab b{display:inline-block;min-width:20px;padding:1px 6px;border-radius:999px;background:#f2ece0;color:var(--rl-ink);font-size:.75rem;margin-left:3px}
.rl-tab.on{background:var(--rl-ink);color:#fff;border-color:var(--rl-ink)}
.rl-tab.on b{background:var(--rl-gold);color:#fff}
.rl-list{display:flex;flex-direction:column;gap:8px}
.rl-row{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.3fr) minmax(0,1.1fr);gap:14px;align-items:center;background:#fff;border:1px solid var(--rl-line);border-radius:12px;padding:12px 14px}
.rl-row[data-statut="relancer"]{border-left:4px solid var(--rl-red)}
.rl-name{font-weight:700;color:var(--rl-ink)}
.rl-meta{font-size:.8rem;color:var(--rl-soft);overflow-wrap:anywhere}
.rl-mid{display:flex;flex-direction:column;gap:6px;min-width:0}
.rl-when{font-size:.8rem;color:var(--rl-soft)}
.rl-pill{align-self:flex-start;font-size:.74rem;font-weight:700;padding:3px 9px;border-radius:999px}
.rl-p-now{background:var(--rl-red-l);color:var(--rl-red)}
.rl-p-wait{background:var(--rl-blue-l);color:var(--rl-blue)}
.rl-p-ok{background:var(--rl-green-l);color:var(--rl-green)}
.rl-p-end{background:#efebe4;color:var(--rl-soft)}
.rl-frise{display:flex;list-style:none;margin:2px 0 0;padding:0;gap:0}
.rl-st{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;font-size:.7rem;color:var(--rl-soft);min-width:0}
.rl-st::before{content:"";position:absolute;top:6px;left:-50%;width:100%;height:2px;background:var(--rl-line);z-index:0}
.rl-st:first-child::before{display:none}
.rl-st i{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--rl-line);position:relative;z-index:1}
.rl-st.ok i{background:var(--rl-gold);border-color:var(--rl-gold)}
.rl-st.ok::before{background:var(--rl-gold)}
.rl-st.now i{background:var(--rl-red);border-color:var(--rl-red);box-shadow:0 0 0 4px var(--rl-red-l)}
.rl-st.now span{color:var(--rl-red);font-weight:700}
.rl-st.off{opacity:.45}
.rl-act{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
.rl-next{display:inline-flex;gap:6px;align-items:center;font-size:.82rem;color:var(--rl-soft);text-align:right}
.rl-next svg{width:15px;height:15px;flex:none}
.rl-rep{font-size:.84rem;font-style:italic;color:var(--rl-ink);background:var(--rl-green-l);border-radius:8px;padding:6px 9px}
.rl-note{font-size:.8rem;color:var(--rl-soft);margin:8px 2px 0}
.rl-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}
.rl-box{background:#fff;border:1px solid var(--rl-line);border-radius:14px;padding:16px;min-width:0}
.rl-box h2{margin:0;font-family:Georgia,serif;font-weight:400;font-size:1.15rem;color:var(--rl-ink)}
.rl-box-s{margin:4px 0 12px;color:var(--rl-soft);font-size:.86rem}
.rl-tpl{border-top:1px solid var(--rl-line);padding-top:12px;margin-top:12px}
.rl-tpl-h{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:.9rem;color:var(--rl-ink)}
.rl-day{font-weight:700;color:var(--rl-gold);background:var(--rl-gold-l);border-radius:999px;padding:2px 9px;font-size:.75rem;flex:none}
.rl-tpl textarea,.rl-sheet textarea{width:100%;box-sizing:border-box;margin-top:8px;border:1px solid var(--rl-line);border-radius:10px;padding:10px;font:400 .88rem/1.5 Inter,system-ui,sans-serif;color:var(--rl-ink);background:#fffdf8;resize:vertical}
.rl-tpl-f{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:.8rem;color:var(--rl-soft);margin-top:6px}
.rl-sw{display:inline-flex;gap:6px;align-items:center;font-weight:600;color:var(--rl-ink)}
.rl-obj{border-top:1px solid var(--rl-line);padding:10px 0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:start}
.rl-obj-q{font-weight:700;color:var(--rl-ink);grid-column:1/-1}
.rl-obj p{margin:0;font-size:.88rem;color:var(--rl-soft)}
.rl-copy{display:inline-flex;gap:5px;align-items:center;border:1px solid var(--rl-line);background:#fff;border-radius:8px;padding:6px 9px;font:600 .78rem Inter,system-ui,sans-serif;cursor:pointer;color:var(--rl-ink)}
.rl-copy svg{width:14px;height:14px}
.rl-modal{position:fixed;inset:0;background:rgba(29,24,17,.45);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
.rl-sheet{background:#fff;border-radius:16px;max-width:560px;width:100%;padding:18px;box-sizing:border-box;max-height:90vh;overflow:auto}
.rl-sheet-h{display:flex;justify-content:space-between;align-items:center;font-size:1.05rem;color:var(--rl-ink);margin-bottom:10px}
.rl-x{border:0;background:#f2ece0;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;cursor:pointer}
.rl-x svg{width:16px;height:16px}
.rl-field{display:flex;gap:10px;font-size:.86rem;padding:6px 0;border-bottom:1px solid var(--rl-line);min-width:0}
.rl-field span{color:var(--rl-soft);width:52px;flex:none}
.rl-field b{overflow-wrap:anywhere;color:var(--rl-ink)}
.rl-sheet-n{font-size:.8rem;color:var(--rl-soft);margin:8px 0 12px}
.rl-sheet-a{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.rl-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(90px + env(safe-area-inset-bottom,0px));background:var(--rl-ink);color:#fff;border-radius:10px;padding:10px 14px;font-size:.88rem;z-index:60;max-width:calc(100% - 32px)}
.rl-row.done{opacity:.55}
[hidden]{display:none!important}
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
@media (max-width:900px){
  .rl-row{grid-template-columns:minmax(0,1fr);gap:10px}
  .rl-act{justify-content:flex-start}
  .rl-next{text-align:left}
  .rl-cols{grid-template-columns:minmax(0,1fr)}
  .rl-sheet{align-self:flex-end;border-radius:16px 16px 0 0;padding-bottom:calc(18px + env(safe-area-inset-bottom,0px))}
  .rl-modal{padding:0}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
'''

JS = r'''
(function(){
var MSG=__MSG__, EX=__EX__;
var tabs=document.querySelectorAll('.rl-tab'), rows=document.querySelectorAll('.rl-row'), cur='relancer';
function filtre(f){cur=f;tabs.forEach(function(t){t.classList.toggle('on',t.dataset.f===f)});rows.forEach(function(r){r.hidden=!(f==='tous'||r.dataset.statut===f)})}
tabs.forEach(function(t){t.addEventListener('click',function(){filtre(t.dataset.f)})});
filtre('relancer');
var modal=document.getElementById('modal'),txt=document.getElementById('m-txt'),to=document.getElementById('m-to'),mt=document.getElementById('m-t'),encours=null,file=[];
function toast(s){var t=document.getElementById('toast');t.textContent=s;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(function(){t.hidden=true},3200)}
function ouvrir(id){var e=EX.filter(function(x){return x.id===id})[0];if(!e)return;encours=e;var k=e.du;mt.textContent=MSG[k][0]+' — '+e.nom;to.textContent=e.nom+' <'+e.mail+'>';txt.value=MSG[k][1];modal.hidden=false;document.getElementById('m-ok').focus()}
function fermer(){modal.hidden=true;encours=null}
function fini(id,label){var r=document.getElementById('row-'+id);if(!r)return;r.dataset.statut='attente';r.classList.add('done');var a=r.querySelector('.rl-act');a.innerHTML='<span class="rl-next">'+label+'</span>';var p=r.querySelector('.rl-pill');p.className='rl-pill rl-p-wait';p.textContent='En attente';var k=document.getElementById('k-rel');k.textContent=Math.max(0,parseInt(k.textContent,10)-1);filtre(cur)}
document.querySelectorAll('[data-id]').forEach(function(b){b.addEventListener('click',function(){file=[];ouvrir(b.dataset.id)})});
document.querySelectorAll('[data-later]').forEach(function(b){b.addEventListener('click',function(){fini(b.dataset.later,'Reportée à demain');toast('Reportée à demain : elle reviendra dans « À relancer ».')})});
document.getElementById('tout').addEventListener('click',function(){file=EX.filter(function(e){var r=document.getElementById('row-'+e.id);return r&&r.dataset.statut==='relancer'}).map(function(e){return e.id});if(!file.length){toast('Plus rien à relancer aujourd’hui.');return}ouvrir(file.shift())});
document.getElementById('m-x').addEventListener('click',fermer);
modal.addEventListener('click',function(ev){if(ev.target===modal)fermer()});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&!modal.hidden)fermer()});
document.getElementById('m-ok').addEventListener('click',function(){if(!encours)return;fini(encours.id,'Relance '+encours.du+' envoyée (maquette)');fermer();toast('Maquette : rien n’est envoyé.');if(file.length)setTimeout(function(){ouvrir(file.shift())},350)});
document.getElementById('m-no').addEventListener('click',function(){if(!encours)return;var r=document.getElementById('row-'+encours.id);fini(encours.id,'Plus de relance');r.dataset.statut='termine';fermer();filtre(cur);toast('Cet établissement ne sera plus relancé.')});
document.querySelectorAll('.rl-copy').forEach(function(b){b.addEventListener('click',function(){var s=b.dataset.copy;try{navigator.clipboard.writeText(s).then(function(){toast('Réponse copiée.')},function(){toast('Copie refusée : sélectionnez le texte.')})}catch(e){toast('Copie refusée : sélectionnez le texte.')}})});
})();
'''.replace("__MSG__", json.dumps(MSG, ensure_ascii=False)).replace("__EX__", json.dumps(EX, ensure_ascii=False))

NAV = [("sun", "Aujourd'hui", 0), ("orders", "Commandes", 0), ("mail", "Messages", 0), ("user", "Clients", 1), ("tag", "Catalogue", 0), ("box", "Stock & achats", 0), ("mega", "Marketing", 0), ("coin", "Finances", 0), ("set", "Réglages", 0), ("tree", "Fêtes", 0)]
nav = "".join(f'<a class="ash-item{" on" if on else ""}" href="#">{I(ic)}<span class="ash-txt">{t}</span>{f"<span class=ash-badge>{n_rel}</span>" if on else ""}</a>' for ic, t, on in NAV)
SUBS = ["Clientes", "Avis", "Fidélité", "Favoris", "Connexions", "Restaurants & bars"]
subs = "".join(f'<a class="ash-subtab{" on" if s == "Restaurants & bars" else ""}" href="#">{html.escape(s)}</a>' for s in SUBS)

PAGE = f'''<title>Relances restaurants</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,400&family=Inter:wght@400;600;700&display=swap">
<style>{css_site(CSS_DIR)}</style>
<style>{CSS}</style>
<main style="display:contents">
<div class="ash">
  <aside class="ash-side">
    <div class="ash-brand"><img class="ash-logo" src="{logo_uri()}" alt="Niv Création"><div class="ash-brand-txt"><div class="ash-brand-t">Gestion</div><div class="ash-brand-s">nivcreation.fr</div></div></div>
    <div class="ash-glabel">Boutique</div>
    <nav class="ash-nav">{nav}</nav>
  </aside>
  <div class="ash-main">
    <header class="ash-top">
      <button type="button" class="ash-burger" aria-label="Menu">{I('menu')}</button>
      <div class="ash-crumb"><span class="ash-crumb-g">Clients</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t">Restaurants &amp; bars</span></div>
      <button type="button" class="ash-search ash-search-btn"><span>{I('search')} Rechercher une commande, une cliente, un produit…</span><kbd>Ctrl K</kbd></button>
      <div class="ash-top-actions"><a class="ash-todo" href="#">{n_rel} à relancer</a><a class="ash-assist" href="#">{I('spark')}<span>Assistant</span></a></div>
    </header>
    <nav class="ash-subs">{subs}</nav>
    <main class="ash-content">{BODY}</main>
    <nav class="ash-tabs"><a class="ash-tab" href="#">{I('sun')}<span>Aujourd'hui</span></a><a class="ash-tab" href="#">{I('orders')}<span>Commandes</span></a><a class="ash-tab" href="#">{I('mail')}<span>Messages</span></a><a class="ash-tab" href="#">{I('tag')}<span>Produits</span></a><button type="button" class="ash-tab on">{I('menu')}<span>Plus</span><b>{n_rel}</b></button></nav>
  </div>
</div>
{MODAL}
</main>
<script>{JS}</script>
'''
open(OUT, "w", encoding="utf-8").write(PAGE)
print(OUT, len(PAGE))
