# -*- coding: utf-8 -*-
# MAQUETTE « Gardien du site + rapport des agents sur l'accueil de Gestion » (16/11/2026, gérant : « un autre agent qui contrôle
# pour pas que j'aie des problèmes comme avec les photos, connexion, paiement… un rapport sur la page d'accueil, une fenêtre
# tout est OK ou une fenêtre par agent, il doit me dire tout ce qu'ils font »). RIEN en ligne.
# Usage : python3 tools/maquettes/surveillance-agents.py <dossier css de Gestion> <sortie.html>
import sys
from gestion_coquille import shell, css_site, I

css_dir, sortie = sys.argv[1], sys.argv[2]

# Les contrôles du Gardien (ce qu'il vérifie, toutes les 15 minutes).
CTRL = [
  ("img",   "Photos", "Chaque photo des fiches, de l'accueil et des guides s'affiche (412 photos), aucune hébergée ailleurs, aucun refus 429."),
  ("user",  "Connexion", "Gestion (mot de passe et Face ID), lien de connexion de l'espace client, base de données joignable."),
  ("card",  "Paiement", "Stripe répond, le webhook reçoit les paiements, chaque paiement a bien sa commande, page de paiement testée sans prélèvement."),
  ("shop",  "Pages du site", "Accueil, boutique, 91 fiches, panier, guides : toutes répondent, temps de chargement normal."),
  ("mail",  "E-mails", "Gmail connecté, Resend actif, aucun e-mail client refusé (rebond) depuis 24 h."),
  ("truck", "Livraison", "Points relais Boxtal, tarifs de livraison, suivi des colis."),
  ("box",   "Stock et prix", "Aucun produit en vente sans prix, sans photo ou avec un stock négatif."),
  ("clock", "Tâches automatiques", "Battement du site, envois programmés, rangement du soir : rien en retard, rien en échec."),
  ("bolt",  "Mise en ligne", "Dernier déploiement réussi, le site en ligne est bien la dernière version."),
]

# Problème d'exemple (bouton « Voir avec un problème »).
PB = {"ctrl": "Photos", "titre": "3 photos ne s'affichent plus",
      "detail": "Fiche « Collier Papillon » : photos 2, 3 et 4 (erreur 404 depuis 14 h 12).",
      "quoi": "Remettre les photos dans Gestion → Produits → Collier Papillon, ou me demander de regarder."}

AGENTS = [
  ("shield", "Gardien du site", "Nouveau", "ok", "toutes les 15 min · dernière il y a 4 min",
   ["9 contrôles passés, aucun problème", "412 photos vérifiées", "3 paiements du jour : 3 commandes enregistrées"]),
  ("mail", "Agent e-mail", "", "warn", "à chaque message reçu",
   ["4 réponses préparées aujourd'hui", "1 à valider : Bailly (bracelets motocross)", "Rien n'est parti sans toi"]),
  ("search", "Boîte mail surveillée", "", "ok", "toutes les 15 min · il y a 6 min",
   ["23 e-mails lus aujourd'hui", "6 rangés dans le dossier de leur commande", "Etsy et publicités ignorés"]),
  ("orders", "Rangement du soir", "", "ok", "chaque soir à 21 h · hier",
   ["47 commandes repassées", "3 messages ajoutés aux fils", "Gmail en lecture seule"]),
  ("tag", "Santé du catalogue", "", "ok", "chaque jour · ce matin",
   ["91 produits vérifiés", "0 problème important", "2 fiches sans prix d'achat (pour Bénéfices)"]),
  ("clock", "Envois programmés", "", "ok", "en continu",
   ["7 demandes d'avis prévues mer. 18/11 à 10 h", "0 envoi en échec", "2 rappels noms de domaine (mars 2027)"]),
  ("gift", "Offre gravure offerte", "", "off", "en pause depuis le 25/09",
   ["Aucun e-mail envoyé", "53 codes encore valables", "Se relance quand tu coches « Activer »"]),
  ("sun", "Résumé du matin", "", "off", "éteint",
   ["Pas d'e-mail le matin", "S'allume dans Réglages › Notifications"]),
]

ICO_EXTRA = {
  "shield": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
}
def ic(n): return ICO_EXTRA.get(n) or I(n)

def ctrl_rows(pb):
  out = []
  for icon, nom, txt in CTRL:
    bad = pb and nom == PB["ctrl"]
    st = '<span class="sv-st bad">Problème</span>' if bad else '<span class="sv-st ok">OK</span>'
    det = f'<div class="sv-ctxt bad">{PB["detail"]}</div>' if bad else f'<div class="sv-ctxt">{txt}</div>'
    out.append(f'<li class="sv-c{" is-bad" if bad else ""}"><span class="sv-cic">{ic(icon)}</span><div class="sv-cbody"><div class="sv-cn">{nom}</div>{det}</div>{st}</li>')
  return "".join(out)

def agent_cards(pb):
  out = []
  for icon, nom, badge, st, quand, lignes in AGENTS:
    s = st
    lg = list(lignes)
    if pb and nom == "Gardien du site":
      s = "bad"; lg = ["1 problème : " + PB["titre"], "8 autres contrôles OK", "Notification envoyée sur ton téléphone"]
    lab = {"ok": "Tout va bien", "warn": "À regarder", "bad": "Problème", "off": "Éteint"}[s]
    b = f'<span class="sv-new">{badge}</span>' if badge else ""
    li = "".join(f"<li>{x}</li>" for x in lg)
    out.append(f'''<article class="sv-ag {s}"><header><span class="sv-agic">{ic(icon)}</span><div class="sv-agt"><div class="sv-agn">{nom}{b}</div><div class="sv-agq">{quand}</div></div><span class="sv-dot {s}" title="{lab}"></span></header><ul>{li}</ul><footer><span class="sv-lab {s}">{lab}</span><a href="#" data-go="det">Voir le détail ›</a></footer></article>''')
  return "".join(out)

def vue_accueil(pb):
  if pb:
    banner = f'''<section class="sv-win bad"><div class="sv-wic">{I('alert')}</div><div class="sv-wbody"><div class="sv-wt">1 problème sur le site : {PB["titre"]}</div><div class="sv-ws">{PB["detail"]}</div><div class="sv-wq"><b>Quoi faire :</b> {PB["quoi"]}</div></div><div class="sv-wact"><a class="sv-btn" href="#" data-go="det">Voir le rapport</a><a class="sv-btn ghost" href="#">Vu, je m'en occupe</a></div></section>'''
  else:
    banner = f'''<section class="sv-win ok"><div class="sv-wic">{ic('shield')}</div><div class="sv-wbody"><div class="sv-wt">Tout est OK sur le site</div><div class="sv-ws">Le Gardien a fait ses 9 contrôles il y a 4 min : photos, connexion, paiement, pages, e-mails, livraison, stock, tâches, mise en ligne.</div></div><div class="sv-wact"><a class="sv-btn ghost" href="#" data-go="det">Voir le rapport</a></div></section>'''
  return f'''
<div class="sv-hello"><div><div class="sv-h1">Bonsoir</div><div class="sv-date">Lundi 16 novembre</div></div></div>
{banner}
<div class="sv-sec" id="sv-une" hidden>
  <section class="sv-one"><header><span>{ic('spark')}</span><div><div class="sv-ot">Ce que font tes agents</div><div class="sv-os">8 agents · 6 au travail · 2 éteints</div></div></header>
  <ul class="sv-olist">
    <li><span class="sv-dot {'bad' if pb else 'ok'}"></span><b>Gardien du site</b> — {('1 problème : ' + PB['titre']) if pb else '9 contrôles, aucun problème'}</li>
    <li><span class="sv-dot warn"></span><b>Agent e-mail</b> — 4 réponses préparées, 1 à valider (Bailly)</li>
    <li><span class="sv-dot ok"></span><b>Boîte mail</b> — 23 e-mails lus, 6 rangés</li>
    <li><span class="sv-dot ok"></span><b>Rangement du soir</b> — 47 commandes, 3 messages ajoutés</li>
    <li><span class="sv-dot ok"></span><b>Santé du catalogue</b> — 0 problème important</li>
    <li><span class="sv-dot ok"></span><b>Envois programmés</b> — 7 avis mer. 10 h, 0 échec</li>
    <li><span class="sv-dot off"></span><b>Offre gravure</b> — en pause</li>
    <li><span class="sv-dot off"></span><b>Résumé du matin</b> — éteint</li>
  </ul><a class="sv-more" href="#" data-go="det">Voir le rapport complet ›</a></section>
</div>
<div class="sv-sec" id="sv-par">
  <div class="sv-sech"><div class="sv-st2">Tes agents</div><div class="sv-sts">ce que chacun a fait aujourd'hui</div></div>
  <div class="sv-grid">{agent_cards(pb)}</div>
</div>
<div class="sv-rest">Puis l'accueil continue comme aujourd'hui : À faire, messages, dernières commandes…</div>'''

def vue_detail(pb):
  hist = [("20 h 15", "9 contrôles", "OK"), ("20 h 00", "9 contrôles", "OK"), ("19 h 45", "9 contrôles", "OK"),
          ("14 h 15", "Photos", "Problème : 3 photos du Collier Papillon (corrigé à 14 h 40)")]
  if pb: hist[0] = ("20 h 15", "Photos", "Problème : " + PB["titre"])
  h = "".join(f'<li><span class="sv-ht">{a}</span><span class="sv-hc">{b}</span><span class="sv-hr{" bad" if "Problème" in c else ""}">{c}</span></li>' for a, b, c in hist)
  return f'''
<div class="sv-dhead"><span class="sv-agic big">{ic('shield')}</span><div><div class="sv-h1">Gardien du site</div><div class="sv-date">Vérifie tout le site toutes les 15 minutes · dernière vérification à 20 h 15</div></div></div>
<div class="sv-rules"><b>Ce qu'il fait quand il trouve un problème :</b> fenêtre rouge sur l'accueil + notification sur ton téléphone + e-mail. <b>Il ne corrige rien tout seul</b> : il te dit où est le problème et quoi faire.</div>
<div class="sv-sech"><div class="sv-st2">Les 9 contrôles</div></div>
<ul class="sv-clist">{ctrl_rows(pb)}</ul>
<div class="sv-sech"><div class="sv-st2">Historique</div><div class="sv-sts">les dernières vérifications</div></div>
<ul class="sv-hist">{h}</ul>
<div class="sv-sech"><div class="sv-st2">Réglages</div></div>
<div class="sv-set"><label><input type="checkbox" checked> Fenêtre rouge sur l'accueil</label><label><input type="checkbox" checked> Notification sur le téléphone</label><label><input type="checkbox" checked> E-mail à l'atelier</label><label><input type="checkbox"> Me prévenir aussi la nuit (23 h – 7 h)</label></div>
<a class="sv-btn ghost" href="#" data-go="acc">‹ Retour à l'accueil</a>'''

CSS = r'''
.ash-item svg,.ash-tab svg,.ash-sfind svg,.ash-search svg,.ash-ibtn svg,.ash-assist svg,.ash-burger svg{width:18px!important;height:18px!important;flex:0 0 18px}.ash-tab svg{width:22px!important;height:22px!important}
:root{--sv-ok:#2f7d4f;--sv-okb:#eaf5ee;--sv-bad:#b3261e;--sv-badb:#fdecea;--sv-warn:#a8680a;--sv-warnb:#fdf3e1;--sv-off:#8a8478;--sv-gold:#a98935;--sv-line:#ece3d2;--sv-card:#fff;--sv-ink:#241a0c;--sv-mut:#7a7268}
.sv-bar{position:sticky;top:0;z-index:50;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px;background:#1a1206;color:#f3e8d3;font:600 12px/1.3 Inter,system-ui,sans-serif}
.sv-bar b{color:#e2c67e;margin-right:4px}.sv-bar button{font:inherit;border:1px solid #5b4a2a;background:transparent;color:#f3e8d3;border-radius:999px;padding:6px 11px;cursor:pointer}
.sv-bar button.on{background:#c9a24b;color:#1a1206;border-color:#c9a24b}
.sv-hello{display:flex;justify-content:space-between;margin:4px 0 14px}.sv-h1{font:500 1.6rem/1.15 "Playfair Display",Georgia,serif;color:var(--sv-ink)}.sv-date{color:var(--sv-mut);font-size:.88rem;margin-top:2px}
.sv-win{display:flex;gap:14px;align-items:flex-start;border-radius:16px;padding:16px 18px;margin-bottom:18px;border:1px solid}
.sv-win.ok{background:var(--sv-okb);border-color:#bfe0cb}.sv-win.bad{background:var(--sv-badb);border-color:#f2b8b3}
.sv-wic{flex:0 0 42px;height:42px;border-radius:12px;display:grid;place-items:center;color:#fff}.sv-win.ok .sv-wic{background:var(--sv-ok)}.sv-win.bad .sv-wic{background:var(--sv-bad)}
.sv-wic svg,.sv-agic svg,.sv-cic svg,.sv-one header span svg{width:22px;height:22px}
.sv-wbody{flex:1;min-width:0}.sv-wt{font-weight:700;font-size:1.05rem;color:var(--sv-ink)}.sv-win.bad .sv-wt{color:var(--sv-bad)}
.sv-ws{margin-top:3px;color:#3b342a;font-size:.92rem;line-height:1.45}.sv-wq{margin-top:8px;font-size:.92rem;line-height:1.45}
.sv-wact{display:flex;flex-direction:column;gap:6px}
.sv-btn{display:inline-block;text-decoration:none;background:linear-gradient(180deg,#c9a24b,#a98935);color:#fff;font-weight:700;font-size:.86rem;padding:9px 14px;border-radius:10px;text-align:center;white-space:nowrap}
.sv-btn.ghost{background:#fff;color:var(--sv-ink);border:1px solid var(--sv-line)}
.sv-sech{display:flex;align-items:baseline;gap:10px;margin:22px 0 10px}.sv-st2{font:600 1.05rem/1.2 Inter,system-ui,sans-serif;color:var(--sv-ink)}.sv-sts{color:var(--sv-mut);font-size:.85rem}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.sv-ag{background:var(--sv-card);border:1px solid var(--sv-line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;border-top:4px solid var(--sv-ok)}
.sv-ag.warn{border-top-color:var(--sv-warn)}.sv-ag.bad{border-top-color:var(--sv-bad);background:#fffafa}.sv-ag.off{border-top-color:#d6cfc2;opacity:.82}
.sv-ag header{display:flex;gap:10px;align-items:center}.sv-agic{flex:0 0 36px;height:36px;border-radius:10px;background:#f6efe1;color:var(--sv-gold);display:grid;place-items:center}
.sv-agic.big{flex-basis:52px;height:52px}.sv-agt{flex:1;min-width:0}.sv-agn{font-weight:700;color:var(--sv-ink);font-size:.95rem}.sv-agq{color:var(--sv-mut);font-size:.78rem;margin-top:1px}
.sv-new{display:inline-block;margin-left:6px;background:#c9a24b;color:#1a1206;font-size:.66rem;font-weight:700;padding:2px 7px;border-radius:999px;vertical-align:2px}
.sv-dot{width:11px;height:11px;border-radius:50%;flex:0 0 11px;display:inline-block}.sv-dot.ok{background:var(--sv-ok)}.sv-dot.warn{background:var(--sv-warn)}.sv-dot.bad{background:var(--sv-bad);box-shadow:0 0 0 4px #f8cfcb}.sv-dot.off{background:#cfc8bb}
.sv-ag ul{margin:0;padding-left:18px;color:#3b342a;font-size:.88rem;line-height:1.5}
.sv-ag footer{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px;border-top:1px solid #f3ecdf;font-size:.82rem}
.sv-ag footer a{color:var(--sv-gold);font-weight:600;text-decoration:none}
.sv-lab{font-weight:700}.sv-lab.ok{color:var(--sv-ok)}.sv-lab.warn{color:var(--sv-warn)}.sv-lab.bad{color:var(--sv-bad)}.sv-lab.off{color:var(--sv-off)}
.sv-one{background:#fff;border:1px solid var(--sv-line);border-radius:16px;padding:16px 18px}
.sv-one header{display:flex;gap:10px;align-items:center;margin-bottom:8px}.sv-one header>span{width:36px;height:36px;border-radius:10px;background:#f6efe1;color:var(--sv-gold);display:grid;place-items:center}
.sv-ot{font-weight:700;color:var(--sv-ink)}.sv-os{color:var(--sv-mut);font-size:.82rem}
.sv-olist{list-style:none;margin:0;padding:0}.sv-olist li{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid #f3ecdf;font-size:.9rem;color:#3b342a;line-height:1.4}
.sv-more{display:inline-block;margin-top:10px;color:var(--sv-gold);font-weight:600;text-decoration:none;font-size:.88rem}
.sv-rest{margin:22px 0 8px;padding:14px;border:1px dashed #d6c9ad;border-radius:12px;color:var(--sv-mut);font-size:.88rem;text-align:center}
.sv-dhead{display:flex;gap:14px;align-items:center;margin:4px 0 14px}
.sv-rules{background:#faf6ee;border:1px solid var(--sv-line);border-radius:12px;padding:12px 14px;font-size:.9rem;line-height:1.5;color:#3b342a}
.sv-clist,.sv-hist{list-style:none;margin:0;padding:0;background:#fff;border:1px solid var(--sv-line);border-radius:14px;overflow:hidden}
.sv-c{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-top:1px solid #f3ecdf}.sv-c:first-child{border-top:0}.sv-c.is-bad{background:#fffafa}
.sv-cic{flex:0 0 34px;height:34px;border-radius:9px;background:#f6efe1;color:var(--sv-gold);display:grid;place-items:center}.sv-c.is-bad .sv-cic{background:var(--sv-badb);color:var(--sv-bad)}
.sv-cbody{flex:1;min-width:0}.sv-cn{font-weight:700;font-size:.92rem;color:var(--sv-ink)}.sv-ctxt{font-size:.85rem;color:#5b5348;line-height:1.45;margin-top:2px}.sv-ctxt.bad{color:var(--sv-bad);font-weight:600}
.sv-st{font-size:.78rem;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap}.sv-st.ok{background:var(--sv-okb);color:var(--sv-ok)}.sv-st.bad{background:var(--sv-badb);color:var(--sv-bad)}
.sv-hist li{display:flex;flex-wrap:wrap;gap:4px 12px;padding:10px 14px;border-top:1px solid #f3ecdf;font-size:.88rem}.sv-hist li:first-child{border-top:0}
.sv-ht{font-variant-numeric:tabular-nums;color:var(--sv-mut);min-width:58px}.sv-hc{font-weight:600;min-width:90px}.sv-hr{color:var(--sv-ok)}.sv-hr.bad{color:var(--sv-bad)}
.sv-set{display:grid;gap:8px;background:#fff;border:1px solid var(--sv-line);border-radius:14px;padding:14px;margin-bottom:18px;font-size:.92rem}
.sv-set label{display:flex;gap:9px;align-items:center}
@media (max-width:640px){.sv-win{flex-wrap:wrap}.sv-wact{flex-direction:row;flex-wrap:wrap;width:100%}.sv-wact .sv-btn{flex:1}.sv-grid{grid-template-columns:1fr}}
'''

body = f'''<div id="v-acc-ok">{vue_accueil(False)}</div><div id="v-acc-pb" hidden>{vue_accueil(True)}</div>
<div id="v-det-ok" hidden>{vue_detail(False)}</div><div id="v-det-pb" hidden>{vue_detail(True)}</div>'''

bar = '''<div class="sv-bar"><b>Maquette</b>
<button data-k="v" data-v="acc" class="on">Accueil</button><button data-k="v" data-v="det">Page du Gardien</button>
<span style="width:8px"></span>
<button data-k="p" data-v="ok" class="on">Tout va bien</button><button data-k="p" data-v="pb">Avec un problème</button>
<span style="width:8px"></span>
<button data-k="m" data-v="par" class="on">Une fenêtre par agent</button><button data-k="m" data-v="une">Une seule fenêtre</button></div>'''

JS = r'''
const S={v:"acc",p:"ok",m:"par"};
function maj(){for(const v of ["acc","det"])for(const p of ["ok","pb"])document.getElementById("v-"+v+"-"+p).hidden=!(S.v===v&&S.p===p);
document.querySelectorAll("#sv-une").forEach(e=>e.hidden=S.m!=="une");document.querySelectorAll("#sv-par").forEach(e=>e.hidden=S.m!=="par");
document.querySelectorAll(".sv-bar button").forEach(b=>b.classList.toggle("on",S[b.dataset.k]===b.dataset.v));window.scrollTo(0,0);}
document.querySelectorAll(".sv-bar button").forEach(b=>b.onclick=()=>{S[b.dataset.k]=b.dataset.v;maj();});
document.addEventListener("click",e=>{const a=e.target.closest("[data-go]");if(a){e.preventDefault();S.v=a.dataset.go;maj();}});
maj();
'''

html = shell(title="Gardien du site", crumb="Aujourd'hui", subtab="", css_site_txt=css_site(css_dir), css=CSS, body=body, js=JS)
html = html.replace('<span class="ash-crumb-g">Commandes</span><span class="ash-crumb-sep">›</span>', "")
html = html.replace('<a class="ash-item on" href="#">', '<a class="ash-item" href="#">', 1).replace('<a class="ash-item" href="#">', '<a class="ash-item on" href="#">', 1)
html = html.replace('<a class="ash-tab on" href="#">', '<a class="ash-tab" href="#">', 1).replace('<a class="ash-tab" href="#">', '<a class="ash-tab on" href="#">', 1)
import re
html = re.sub(r'<nav class="ash-subs">.*?</nav>', "", html, flags=re.S)
html = html.replace('<main style="display:contents">', '<main style="display:contents">' + bar, 1)
if JS.strip() not in html:
    html = html.replace("</body>", f"<script>{JS}</script></body>")
open(sortie, "w", encoding="utf-8").write(html)
print("ok", len(html) // 1024, "Ko")
