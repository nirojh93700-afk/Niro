# Maquette « Messages à traiter » (02/10/2026) : avant (18 lignes) / après (compact + Pub / Traité).
# Reprend le VRAI CSS compilé du site (.next/static/css) et les mêmes classes .dq-* que DashBlocks.jsx.
import glob, json, pathlib
css = "\n".join(pathlib.Path(p).read_text() for p in sorted(glob.glob(".next/static/css/*.css")))
# nom, détail, chip, âge, type (pub / sans-suite / reel / commande)
L = [
 ("METRO", "Code de vérification · idam@emails.metro.fr", "réponse préparée", "il y a 6 j", "pub", "metro.fr"),
 ("DPD", "Votre colis arrive demain · predict@information.dpd.fr", "réponse préparée", "il y a 5 j", "pub", "dpd.fr"),
 ("DPD", "Donnez votre avis · enquetes@voc.dpd.fr", "réponse préparée", "il y a 4 j", "pub", "dpd.fr"),
 ("Médias France", "Proposition de partenariat publicitaire", "réponse préparée", "il y a 4 j", "pub", "medias-france.fr"),
 ("Simon Zuccarelli", "Partenariat dropshipping", "réponse préparée", "il y a 13 j", "sans", ""),
 ("CSE IDM", "Objet moulé en verre — classé sans suite", "réponse préparée", "il y a 14 j", "sans", ""),
 ("Marie Claire", "Newsletter · invitation", "réponse préparée", "il y a 3 j", "pub", "marieclaire.fr"),
 ("Faustine Dominguez", "Commande #1JBVZMWX · photo de la carafe", "réponse préparée", "il y a 2 j", "fait", ""),
 ("Olivier Chesta", "Commande #1LTYHZ6D · « Je préfère la version 1 »", "réponse non lue", "il y a 1 j", "reel", ""),
 ("Lorenzo Franchi", "Commande #0GTB1LZ5 · point relais ou lettre suivie", "réponse non lue", "il y a 20 h", "reel", ""),
 ("Mme Monhardt", "2 commandes · colis groupé « ce serait parfait »", "réponse non lue", "il y a 14 h", "reel", ""),
 ("Ludovic Noel", "Commande #16HGINEA · gravure des verres", "réponse non lue", "il y a 9 h", "reel", ""),
 ("Rose Catarino", "Commande #1Z17IKQ8 · nouvelle version de la photo", "réponse préparée", "il y a 8 h", "reel", ""),
 ("Cécilia Herrera", "Commande #00CUYR2U · question sur les deux lots", "réponse préparée", "il y a 5 h", "reel", ""),
 ("Audrey Duquennec", "Dimensions du collier plaque acier", "réponse préparée", "il y a 2 h", "reel", ""),
]
rows = [dict(i=i, nom=a, det=b, chip=c, age=d, t=e, dom=f) for i,(a,b,c,d,e,f) in enumerate(L)]
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Messages à traiter</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap">
<style>{css}
body{{background:#f6f1e6;margin:0;padding:20px 16px 60px;font-family:Inter,system-ui,sans-serif}}
.mq-wrap{{max-width:980px;margin:0 auto}}
.mq-bar{{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;align-items:center}}
.mq-bar button{{font:600 .82rem system-ui;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:#fff;cursor:pointer}}
.mq-bar button.on{{background:#241a0c;color:#fff;border-color:#241a0c}}
.mq-note{{margin:0 0 14px;padding:10px 14px;border-radius:10px;background:#e3efe4;border:1px solid #bcd9c1;color:#2f6b3d;font-size:.86rem}}
.mq-note.off{{display:none}}
.mq-tag{{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8a6d1f;margin:0 0 8px}}
.dq-row[hidden]{{display:none!important}}
.mq-old .dq-row{{grid-template-columns:38px 1fr auto auto;padding:12px 18px}}
.mq-toast{{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#fff;padding:11px 16px;border-radius:12px;font-size:.86rem;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw}}
.mq-toast.on{{opacity:1}}
</style></head><body><div class="mq-wrap">
<h1 style="font-family:'Playfair Display',serif;margin:0 0 4px">Messages à traiter</h1>
<p style="margin:0 0 14px;color:#6b5f4a;font-size:.9rem">Maquette interactive — clique « Pub » ou « Traité » pour voir ce que fait la page. Exemple avec des lignes réelles de ta liste.</p>
<div class="mq-bar"><button id="b-avant">Avant</button><button id="b-apres" class="on">Après</button></div>
<p class="mq-note" id="note">🤖 L'agent a déjà retiré tout seul 7 messages : 4 pubs / notifications (METRO, DPD ×2, Médias France), 1 newsletter, 2 dossiers classés sans suite.</p>
<p class="mq-tag" id="tag">Après : lignes compactes, 5 visibles, boutons Pub / Traité</p>
<div class="dash-panel dq-msgs" id="panel">
 <div class="dash-ph"><h3>📬 Messages à traiter <span class="dq-count" id="count"></span></h3><a href="#" style="font:600 .8rem system-ui;color:var(--gold-dark);text-decoration:none">Tous les messages →</a></div>
 <div id="rows"></div>
 <button type="button" class="dq-more" id="more"></button>
</div></div><div class="mq-toast" id="toast"></div>
<script>
const D={json.dumps(rows, ensure_ascii=False)};
let mode="apres", tout=false, state=D.map(()=>true), agentHid=D.map(r=>r.t==="pub"||r.t==="sans"||r.t==="fait");
const $=s=>document.querySelector(s);
function visible(){{ return D.filter((r,i)=>state[i] && (mode==="avant"||!agentHid[i])); }}
function toast(t){{const e=$("#toast");e.textContent=t;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),2600);}}
function render(){{
  const v=visible(), old=mode==="avant", lim=old?999:5, show=(tout||old)?v:v.slice(0,lim);
  $("#panel").classList.toggle("mq-old",old);
  $("#count").textContent=v.length; $("#note").classList.toggle("off",old);
  $("#tag").textContent=old?"Avant : tout est affiché, rien ne se retire tout seul":"Après : lignes compactes, 5 visibles, boutons Pub / Traité";
  $("#rows").innerHTML=show.map(r=>`<div class="dq-row${{r.age.includes("j")&&parseInt(r.age.replace(/\\D/g,""))>=1?" late":""}}"><div class="dq-av">${{r.nom[0]}}</div><div class="who"><b>${{r.nom}}</b><small>${{r.det}}</small></div>`
   +(old?`<span class="dq-kind ${{r.chip.includes("non lue")?"rep":""}}">${{r.chip}}</span>`:``)
   +`<span class="dq-age">${{r.age}}</span><div class="dq-right">`
   +((!old&&r.chip==="réponse préparée")?`<button class="dq-mini pub" data-a="pub" data-i="${{r.i}}">🚫 Pub</button><button class="dq-mini" data-a="traite" data-i="${{r.i}}">✓ Traité</button>`:``)
   +`<a class="dq-go${{r.chip==="réponse préparée"?"":" l"}}" href="#">${{r.chip==="réponse préparée"?"Relire et envoyer":"Ouvrir la commande"}}</a></div></div>`).join("")||'<p class="dq-vide">Aucun message en attente — tout est traité.</p>';
  const reste=v.length-show.length;
  $("#more").style.display=(!old&&v.length>5)?"block":"none"; $("#more").textContent=tout?"Replier la liste":`Voir les ${{reste}} autres`;
}}
document.addEventListener("click",e=>{{
  const b=e.target.closest("[data-a]"); if(!b)return; e.preventDefault();
  const i=+b.dataset.i, r=D[i];
  if(b.dataset.a==="pub"){{ let n=0; D.forEach((x,k)=>{{ if(state[k]&&x.dom&&x.dom===r.dom){{state[k]=false;n++;}} }}); if(!n) state[i]=false;
    toast(`🚫 « ${{r.nom}} » est marqué pub — l'agent l'ignorera désormais${{r.dom?` (tout @${{r.dom}})`:""}}.`); }}
  else {{ state[i]=false; toast("✓ Retiré de la liste (rien n'est bloqué)."); }}
  render();
}});
$("#b-avant").onclick=()=>{{mode="avant";$("#b-avant").classList.add("on");$("#b-apres").classList.remove("on");render();}};
$("#b-apres").onclick=()=>{{mode="apres";$("#b-apres").classList.add("on");$("#b-avant").classList.remove("on");render();}};
$("#more").onclick=()=>{{tout=!tout;render();}};
render();
</script></body></html>'''
pathlib.Path("docs/maquettes/messages-a-traiter.html").write_text(html)
print(len(html)//1024, "Ko")
