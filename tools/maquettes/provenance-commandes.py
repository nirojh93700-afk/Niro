# -*- coding: utf-8 -*-
# MAQUETTE « D'OÙ VIENNENT LES CLIENTES » (08/11/2026, gérant : « quand j'ai des commandes, est-ce que je peux savoir les clients,
# ils viennent de quel lien de Google ou de Insta ou TikTok ? » → « Fais la maquette »). RIEN en ligne.
# Usage : python3 tools/maquettes/provenance-commandes.py <dossier css du site> <sortie.html>
#   (dossier css = les 3 feuilles de nivcreation.fr : vraies classes .ash-* / .fq-* ; seul .pv-* est neuf)
# Trois vues : ① la file de production avec la pastille « Venue de … » et un filtre · ② le bloc « Provenance » de la fiche
# commande · ③ l'écran « D'où viennent les ventes » (Marketing) + les liens marqués à mettre en bio. Données = EXEMPLES.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import css_site, shell, I

css_dir, sortie = sys.argv[1], sys.argv[2]

# Provenances : (clé, libellé, couleur de la pastille, lettre de l'icône)
SRC = {
    "instagram": ("Instagram", "#b4366b"),
    "tiktok": ("TikTok", "#1c160d"),
    "google": ("Google · recherche", "#2f6db5"),
    "shopping": ("Google · Shopping", "#2f6db5"),
    "facebook": ("Facebook", "#3b5ba5"),
    "pinterest": ("Pinterest", "#b3262d"),
    "email": ("E-mail · newsletter", "#7c6120"),
    "directe": ("Directe", "#6c6253"),
    "inconnue": ("Inconnue", "#958a77"),
}

def pastille(k, extra=""):
    lib, col = SRC[k]
    return f'<span class="fq-pill line pv-src" title="D\'où vient la cliente"><i style="background:{col}"></i>Venue de : <b>{lib}</b>{extra}</span>'

CARTES = [
    dict(ref="0LQ7PZ2K", tot="27,81 €", nom="Camille Durand", age="il y a 2 h", mode="Lettre suivie · 4,90 €",
         src="instagram", extra=" · lien de la bio", items=[("1×", "Collier Cœur gravé", "Doré", "Recto : « Léa »")], st="a_preparer"),
    dict(ref="0M2ABQ9T", tot="45,90 €", nom="Paul Mercier", age="il y a 5 h", mode="Point relais · 4,90 €",
         src="tiktok", extra="", items=[("1×", "Verre à whisky gravé", "Lot de 2", "Face : « Papa » + date")], st="a_preparer"),
    dict(ref="0M5CDE3R", tot="64,80 €", nom="Inès Martin", age="hier", mode="Domicile · 6,90 €",
         src="google", extra=" · puis revenue par Instagram", items=[("1×", "Cristal photo 3D vertical", "Moyen + socle", "Photo envoyée")], st="en_gravure"),
    dict(ref="0M8XYZ1A", tot="19,71 €", nom="Sarah Benali", age="hier", mode="Lettre suivie · 4,90 €",
         src="inconnue", extra="", items=[("1×", "Collier Quatre Mots", "Argenté", "Face 1 : « Maman »")], st="a_preparer"),
]

def carte(c):
    items = "".join(f'<li><span class="q">{q}</span><span><b>{n}</b><span class="var"> · {v}</span><span class="perso">{I("pen")} {p}</span></span></li>' for q, n, v, p in c["items"])
    act = f'<button type="button" class="fq-btn pri">{I("pen")} Commencer la fabrication</button>' if c["st"] == "a_preparer" else f'<button type="button" class="fq-btn pri">{I("truck")} Expédier…</button>'
    return f'''<article class="fq-card" data-src="{c['src']}">
  <div class="fq-c1"><a class="fq-ref" href="#" data-open="fiche">#{c['ref']}</a><span class="fq-tot mono">{c['tot']}</span></div>
  <div class="fq-who"><b>{c['nom']}</b><span class="dot">·</span><span>{c['age']}</span><span class="dot">·</span><span class="fq-mode">{c['mode']}</span></div>
  <div class="fq-chips">{pastille(c['src'], c['extra'])}</div>
  <ul class="fq-items">{items}</ul>
  <div class="fq-acts">{act}<button type="button" class="fq-btn ghost" data-open="fiche">Fiche</button></div>
</article>'''

filtres = '<button type="button" class="fq-chip on" data-f="tout">Toutes</button>' + "".join(
    f'<button type="button" class="fq-chip" data-f="{k}"><i class="pv-dot" style="background:{SRC[k][1]}"></i>{SRC[k][0]}</button>'
    for k in ["instagram", "tiktok", "google", "inconnue"])

VUE_FILE = f'''
<div class="pv-note">Exemple de la <b>file de production</b> : chaque carte dit d'où vient la cliente. Le filtre « Provenance » ne garde que celles d'une source.</div>
<div class="pv-filtres"><span class="pv-flab">Provenance</span>{filtres}</div>
<div class="pv-cards">{"".join(carte(c) for c in CARTES)}</div>
'''

LIGNES_FICHE = [
    ("Première visite", f'{pastille("google")}<span class="pv-sub">mar. 4 nov. à 21 h 14 · arrivée sur la fiche <b>Cristal photo 3D vertical</b></span>'),
    ("Revenue avant d'acheter", f'{pastille("instagram", " · lien de la bio")}<span class="pv-sub">ven. 7 nov. à 18 h 02 · arrivée sur l\'<b>accueil</b></span>'),
    ("Achat", '<span class="pv-sub" style="margin:0">ven. 7 nov. à 18 h 21 · <b>3 visites</b> en tout · <b>3 jours</b> entre la 1<sup>re</sup> visite et l\'achat</span>'),
    ("Lien marqué", '<span class="pv-sub" style="margin:0"><span class="mono">utm_source=instagram · utm_medium=bio</span></span>'),
]

VUE_FICHE = f'''
<div class="pv-note">Exemple dans la <b>fiche commande #0M5CDE3R</b> (Inès Martin) : un bloc de plus, dans la colonne de droite, sous « Paiement ».</div>
<div class="pv-fiche">
  <section class="pv-box">
    <h3>{I("pin")} Provenance de la cliente</h3>
    <dl>{"".join(f"<dt>{a}</dt><dd>{b}</dd>" for a, b in LIGNES_FICHE)}</dl>
    <p class="pv-small"><b>Ce que le site ne peut pas savoir :</b> les mots tapés dans Google, le nom du compte Instagram ou TikTok qui a partagé le lien,
    et la provenance d'une cliente qui a bloqué le suivi (« Inconnue »).</p>
  </section>
  <section class="pv-box pv-ghost">
    <h3>{I("card")} Paiement</h3><p class="pv-small">(bloc déjà présent, inchangé)</p>
  </section>
</div>
'''

DONNEES = [  # (clé, commandes, CA)
    ("instagram", 9, 312.40), ("google", 7, 268.90), ("directe", 5, 154.20), ("tiktok", 4, 121.60),
    ("email", 3, 98.50), ("shopping", 2, 71.80), ("facebook", 1, 22.41), ("inconnue", 2, 59.80),
]
TOT_C = sum(d[1] for d in DONNEES); TOT_E = sum(d[2] for d in DONNEES); MAXE = max(d[2] for d in DONNEES)
fr = lambda x: f"{x:,.2f}".replace(",", " ").replace(".", ",") + " €"

lignes_tab = "".join(f'''<tr><td><span class="pv-name"><i class="pv-dot" style="background:{SRC[k][1]}"></i>{SRC[k][0]}</span></td>
<td class="n">{c}</td><td class="n">{fr(e)}</td><td class="n">{fr(e / c)}</td><td class="pv-barcell"><span class="pv-bar"><span style="width:{e / MAXE * 100:.0f}%"></span></span><span class="n">{e / TOT_E * 100:.0f} %</span></td></tr>''' for k, c, e in DONNEES)

LIENS = [
    ("Bio Instagram", "https://nivcreation.fr/?utm_source=instagram&utm_medium=bio"),
    ("Bio TikTok", "https://nivcreation.fr/?utm_source=tiktok&utm_medium=bio"),
    ("Page Facebook", "https://nivcreation.fr/?utm_source=facebook&utm_medium=page"),
    ("Pinterest", "https://nivcreation.fr/?utm_source=pinterest&utm_medium=epingle"),
]
liens = "".join(f'<div class="pv-link"><span class="pv-ll">{a}</span><input readonly value="{u}"><button type="button" class="fq-btn sm" data-copy="{u}">{I("copy")} Copier</button></div>' for a, u in LIENS)

VUE_STATS = f'''
<div class="pv-note">Nouvel écran <b>Marketing › D'où viennent les ventes</b>. Les chiffres ci-dessous sont des <b>exemples</b>.</div>
<div class="pv-per">{"".join(f'<button type="button" class="fq-chip{" on" if p == "Ce mois" else ""}">{p}</button>' for p in ["7 jours", "Ce mois", "30 jours", "Depuis le début"])}</div>
<div class="pv-kpis">
  <div class="pv-kpi"><span>Commandes</span><b>{TOT_C}</b></div>
  <div class="pv-kpi"><span>Chiffre d'affaires</span><b>{fr(TOT_E)}</b></div>
  <div class="pv-kpi"><span>1<sup>re</sup> source</span><b>Instagram</b><em>9 commandes · 27 %</em></div>
  <div class="pv-kpi"><span>Provenance connue</span><b>94 %</b><em>2 commandes « Inconnue »</em></div>
</div>
<div class="pv-tablewrap"><table class="pv-table">
<thead><tr><th>D'où vient la cliente</th><th class="n">Commandes</th><th class="n">Chiffre d'affaires</th><th class="n">Panier moyen</th><th>Part du chiffre</th></tr></thead>
<tbody>{lignes_tab}</tbody></table></div>
<div class="pv-switch"><label><input type="radio" name="pvm" checked> Compter la <b>1<sup>re</sup> visite</b> (qui l'a fait découvrir)</label>
<label><input type="radio" name="pvm"> Compter la <b>dernière visite</b> avant l'achat (qui l'a décidée)</label></div>

<section class="pv-box pv-liens">
  <h3>{I("tag")} Vos liens à mettre en bio</h3>
  <p class="pv-small">Les applis Instagram et TikTok cachent souvent d'où vient la visite. Avec ces liens, le site sait que c'est elles, à coup sûr.
  Les liens des e-mails et des newsletters seront marqués tout seuls.</p>
  {liens}
  <div class="pv-mk">
    <span class="pv-ll">Lien pour une publication précise</span>
    <div class="pv-mk-row">
      <select id="mk-src"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="facebook">Facebook</option><option value="pinterest">Pinterest</option></select>
      <input id="mk-nom" value="reel-noel-cristal" aria-label="Nom de la publication">
      <select id="mk-page"><option value="">Accueil</option><option value="produit/cristal-photo-3d-vertical">Cristal vertical</option><option value="produit/collier-coeur-grave">Collier Cœur gravé</option><option value="boutique/verres">Verres & carafes</option></select>
    </div>
    <div class="pv-link"><input id="mk-out" readonly><button type="button" class="fq-btn sm" id="mk-copy">{I("copy")} Copier</button></div>
    <p class="pv-small">Dans le tableau, cette publication aura sa propre ligne : vous verrez quel réel ou quelle vidéo a vraiment fait vendre.</p>
  </div>
</section>

<section class="pv-box pv-how">
  <h3>{I("spark")} Comment c'est relevé</h3>
  <ul>
    <li>À l'arrivée sur le site, la page d'où vient la visiteuse (Google, Instagram, TikTok…) et le lien marqué sont notés <b>dans son navigateur</b>, 30 jours.</li>
    <li>Au paiement, cette information part avec la commande : c'est elle que vous voyez dans Gestion.</li>
    <li>Rien n'est envoyé à Instagram, TikTok ni Google ; aucune donnée en plus n'est demandée à la cliente.</li>
    <li>Une ligne s'ajoute à la page <b>Confidentialité</b> : « Nous notons le site ou le réseau social qui vous a menée chez nous, pour savoir quelles publications fonctionnent. »</li>
  </ul>
</section>
'''

BODY = f'''<div class="fq">
<div class="ph-row"><div class="ph-txt"><div class="ph-eyebrow">Maquette · rien en ligne</div><h1 class="ph-title">D'où viennent les clientes</h1>
<div class="ph-sub">Google, Instagram, TikTok, e-mail… pour chaque commande, et en chiffres.</div></div></div>
<nav class="fq-views pv-tabs" role="tablist">
  <button type="button" class="fq-view on" data-v="file">① File de production</button>
  <button type="button" class="fq-view" data-v="fiche">② Fiche commande</button>
  <button type="button" class="fq-view" data-v="stats">③ D'où viennent les ventes</button>
</nav>
<div class="pv-v" data-v="file">{VUE_FILE}</div>
<div class="pv-v" data-v="fiche" hidden>{VUE_FICHE}</div>
<div class="pv-v" data-v="stats" hidden>{VUE_STATS}</div>
</div>'''

CSS = r'''
body,.ash{font-family:Inter,system-ui,-apple-system,sans-serif}
.ph-title{font-family:"Playfair Display",Georgia,serif}
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
.fq{color:var(--ash-ink);font-size:14px;line-height:1.45}
.fq svg{width:16px;height:16px;flex:none;vertical-align:-3px}
.fq .fq-pill svg,.fq .perso svg{width:12px;height:12px}
.fq button{font:inherit;cursor:pointer}
.pv-tabs{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;margin:14px 0 16px;padding-bottom:2px}
.pv-tabs .fq-view{white-space:nowrap}
.pv-note{background:var(--ash-gold-bg);color:var(--ash-gold-ink);border-radius:10px;padding:10px 14px;font-size:13.5px;line-height:1.5;margin-bottom:14px}
.pv-filtres,.pv-per{display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow-x:auto;margin-bottom:14px;padding-bottom:2px}
.pv-filtres .fq-chip,.pv-per .fq-chip{white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.pv-flab{font-size:12px;font-weight:700;color:var(--ash-muted);text-transform:uppercase;letter-spacing:.06em;margin-right:4px}
.pv-dot{display:inline-block;width:9px;height:9px;border-radius:50%;flex:0 0 auto}
.pv-src i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:2px}
.pv-src b{color:var(--ash-ink)}
.pv-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;align-items:start}
.pv-cards .fq-card{min-width:0}
.pv-cards .fq-card[hidden]{display:none}
.pv-fiche{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;max-width:620px}
.pv-box{background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:14px;padding:16px 18px;box-shadow:var(--ash-shadow);min-width:0}
.pv-box h3{display:flex;align-items:center;gap:8px;font-size:15px;margin:0 0 12px;color:var(--ash-ink)}
.pv-box h3 svg{width:17px;height:17px;color:var(--ash-gold-2)}
.pv-box dl{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px 14px;margin:0 0 12px}
.pv-box dt{font-size:12.5px;color:var(--ash-muted);font-weight:600;padding-top:3px}
.pv-box dd{margin:0;min-width:0}
.pv-sub{display:block;font-size:13px;color:var(--ash-muted);margin-top:5px;line-height:1.45}
.pv-small{font-size:12.5px;color:var(--ash-muted);line-height:1.5;margin:8px 0 0}
.pv-ghost{opacity:.55;border-style:dashed;box-shadow:none}
.pv-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
.pv-kpi{background:var(--ash-surface);border:1px solid var(--ash-line);border-left:3px solid var(--ash-gold);border-radius:12px;padding:12px 14px;min-width:0}
.pv-kpi span{display:block;font-size:12px;color:var(--ash-muted);font-weight:600}
.pv-kpi b{display:block;font-size:21px;margin-top:4px;color:var(--ash-ink);font-variant-numeric:tabular-nums}
.pv-kpi em{display:block;font-style:normal;font-size:12px;color:var(--ash-muted);margin-top:2px}
.pv-tablewrap{overflow-x:auto;background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:14px;margin-bottom:12px}
.pv-table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:620px}
.pv-table th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash-muted);padding:10px 14px;border-bottom:1px solid var(--ash-line);background:var(--ash-sunk)}
.pv-table td{padding:10px 14px;border-bottom:1px solid var(--ash-line)}
.pv-table tr:last-child td{border-bottom:0}
.pv-table .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pv-name{display:inline-flex;align-items:center;gap:8px;font-weight:600}
.pv-barcell{display:flex;align-items:center;gap:10px;min-width:170px}
.pv-bar{flex:1;height:8px;background:var(--ash-sunk);border-radius:99px;overflow:hidden}
.pv-bar span{display:block;height:100%;background:var(--ash-gold);border-radius:99px}
.pv-switch{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--ash-ink);margin:0 0 18px}
.pv-liens,.pv-how{margin-bottom:14px}
.pv-link{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}
.pv-ll{font-size:12.5px;font-weight:700;color:var(--ash-ink);min-width:110px}
.pv-link input{flex:1 1 220px;min-width:0;box-sizing:border-box;font:inherit;font-size:12.5px;padding:7px 10px;border:1px solid var(--ash-line-2);border-radius:8px;background:var(--ash-bg);color:var(--ash-ink)}
.pv-mk{margin-top:16px;padding-top:14px;border-top:1px dashed var(--ash-line-2)}
.pv-mk-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.pv-mk-row select,.pv-mk-row input{font:inherit;font-size:13px;padding:7px 10px;border:1px solid var(--ash-line-2);border-radius:8px;background:#fff;min-width:0;box-sizing:border-box;flex:1 1 140px}
.pv-how ul{margin:0;padding-left:18px;font-size:13.5px;line-height:1.6;color:var(--ash-ink)}
.pv-copied{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--ash-ink);color:#fff;padding:9px 16px;border-radius:99px;font-size:13px;z-index:99}
@media (max-width:760px){.pv-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pv-box dl{grid-template-columns:minmax(0,1fr);gap:4px}.pv-box dd{margin-bottom:8px}}
'''

JS = r'''
document.querySelectorAll('.pv-tabs .fq-view').forEach(b=>b.onclick=()=>montrer(b.dataset.v));
function montrer(v){document.querySelectorAll('.pv-tabs .fq-view').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
 document.querySelectorAll('.pv-v').forEach(x=>x.hidden=x.dataset.v!==v);window.scrollTo(0,0);}
document.querySelectorAll('[data-open="fiche"]').forEach(a=>a.onclick=e=>{e.preventDefault();montrer('fiche');});
document.querySelectorAll('.pv-filtres .fq-chip').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.pv-filtres .fq-chip').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('.pv-cards .fq-card').forEach(c=>c.hidden=!(b.dataset.f==='tout'||c.dataset.src===b.dataset.f));});
document.querySelectorAll('.pv-per .fq-chip').forEach(b=>b.onclick=()=>document.querySelectorAll('.pv-per .fq-chip').forEach(x=>x.classList.toggle('on',x===b)));
function bulle(t){const d=document.createElement('div');d.className='pv-copied';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800);}
async function copier(u,inp){try{await navigator.clipboard.writeText(u);bulle('Lien copié');}catch(e){if(inp){inp.select();}bulle('Sélectionné : faites Copier');}}
document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copier(b.dataset.copy,b.previousElementSibling));
const mk=()=>{const s=document.getElementById('mk-src').value,n=(document.getElementById('mk-nom').value||'').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),p=document.getElementById('mk-page').value;
 document.getElementById('mk-out').value='https://nivcreation.fr/'+p+'?utm_source='+s+'&utm_medium=publication'+(n?'&utm_campaign='+n:'');};
['mk-src','mk-nom','mk-page'].forEach(i=>document.getElementById(i).addEventListener('input',mk));mk();
document.getElementById('mk-copy').onclick=()=>copier(document.getElementById('mk-out').value,document.getElementById('mk-out'));
'''

html = shell(title="Provenance des clientes", crumb="D'où viennent les clientes", subtab="File de production",
             css_site_txt=css_site(css_dir), css=CSS, body=BODY, js=JS)
open(sortie, "w", encoding="utf-8").write(html)
print("écrit", sortie, len(html) // 1024, "Ko")
