# Maquette « Offre gravure offerte → Suivi des codes » (18/10/2026).
# Usage : python3 tools/maquettes/offre-gravure-suivi.py <sortie.html>
# Reprend les VRAIES feuilles de style du site (.next/static/css après `npm run build`) et les classes
# de Gestion (PageHead .ph-*, .card, .og-*). Seule la partie .ogs-* est nouvelle. Données FICTIVES.
import glob, sys, html
css = "\n".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(".next/static/css/*.css")))
lignes = [
  ("marie.l…@gmail.com", "GRAVURE-K7M2P", "20/09", "20/10", ("0XK3LM2Q", "02/10", "3,00 €", "Collier Cœur à graver")),
  ("julien.b…@orange.fr", "GRAVURE-R4TQ9", "20/09", "20/10", None),
  ("sandra.p…@hotmail.fr", "GRAVURE-A2HXE", "22/09", "20/10", ("1BQ7WE4N", "05/10", "5,00 €", "Cristal Photo 3D — Vertical")),
  ("c.dupont…@yahoo.fr", "GRAVURE-9WNCF", "24/09", "20/10", None),
  ("nadia.r…@gmail.com", "GRAVURE-UPM3V", "25/09", "25/10", None),
]
def ligne(e, code, env, fin, u):
    if u == "expire":
        etat = '<span class="ogs-chip off">Expiré, non utilisé</span>'
    elif u:
        ref, le, mt, prod = u
        etat = f'<span class="ogs-chip on">✓ Utilisé le {le}</span><a class="ogs-ref" href="#">Commande #{ref} →</a><small>{html.escape(prod)} · {mt} offerts</small>'
    else:
        etat = '<span class="ogs-chip wait">Pas encore utilisé</span>'
    return f'''<div class="ogs-row"><div class="ogs-c"><b>{html.escape(e)}</b><small>Envoyé le {env} · valable jusqu'au {fin}</small></div>
<div class="ogs-code">{code}</div><div class="ogs-etat">{etat}</div></div>'''
rows = "\n".join(ligne(*l) for l in lignes)
page = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suivi des codes — maquette</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
<style>{css}
body{{margin:0;background:#f6f1e7;font-family:Inter,system-ui,sans-serif}}
.mq{{max-width:1100px;margin:0 auto;padding:22px 16px 60px}}
.mq-tag{{display:inline-block;background:#1a1206;color:#e2c67e;font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;margin-bottom:12px}}
.ogs h2{{font-family:"Playfair Display",Georgia,serif;font-size:1.35rem;margin:0}}
.ogs-top{{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}}
.ogs-filtres{{display:flex;flex-wrap:wrap;gap:6px}}
.ogs-f{{border:1px solid rgba(26,18,6,.15);background:#fff;border-radius:999px;padding:7px 13px;font-size:.85rem;font-weight:600;color:#3a2e1c}}
.ogs-f.sel{{background:#1a1206;color:#fff;border-color:#1a1206}}
.ogs-f b{{font-weight:700;opacity:.65;margin-left:4px}}
.ogs-search{{flex:1 1 220px;max-width:320px;border:1px solid rgba(26,18,6,.18);border-radius:10px;padding:9px 12px;font:inherit;box-sizing:border-box;min-width:0}}
.ogs-head,.ogs-row{{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,.8fr) minmax(0,1.3fr);gap:12px;align-items:center}}
.ogs-head{{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:#6b5f4b;padding:0 4px 6px;border-bottom:1px solid rgba(26,18,6,.1)}}
.ogs-row{{padding:12px 4px;border-bottom:1px solid rgba(26,18,6,.08)}}
.ogs-c b{{display:block;font-weight:600;overflow-wrap:anywhere}}
.ogs-c small,.ogs-etat small{{display:block;color:#6b5f4b;font-size:.8rem;margin-top:2px}}
.ogs-code{{font-family:ui-monospace,Menlo,monospace;font-weight:700;color:#7c6120;letter-spacing:.04em;font-size:.9rem}}
.ogs-chip{{display:inline-block;border-radius:999px;padding:4px 10px;font-size:.78rem;font-weight:700}}
.ogs-chip.on{{background:#e3f1e3;color:#24692c}}.ogs-chip.wait{{background:#f3e8d3;color:#7c6120}}.ogs-chip.off{{background:#eee;color:#777}}
.ogs-ref{{display:inline-block;margin-left:8px;font-weight:600;color:#a98935;text-decoration:none;font-size:.85rem}}
.ogs-note{{font-size:.85rem;color:#6b5f4b;margin:0}}
@media (max-width:720px){{.ogs-head{{display:none}}.ogs-row{{grid-template-columns:1fr;gap:6px}}.ogs-ref{{margin-left:0;display:block;margin-top:6px}}}}
</style></head><body><div class="mq">
<span class="mq-tag">MAQUETTE — Gestion → Marketing → Offre gravure offerte</span>
<div class="ph"><div class="ph-row"><div class="ph-txt"><div class="ph-eyebrow">Marketing</div><h1 class="ph-title">Offre gravure offerte</h1>
<p class="ph-sub">E-mail ciblé aux inscrites qui n'ont jamais commandé. Rien n'apparaît sur le site : ni bandeau, ni encart de fiche.</p></div></div>
<div class="ph-kpis">
<div class="ph-kpi"><small>État</small><b>Éteinte</b></div>
<div class="ph-kpi"><small>Déjà reçu l'offre</small><b>52</b></div>
<div class="ph-kpi good"><small>Codes utilisés</small><b>2</b><span>sur 52 envoyés</span></div>
<div class="ph-kpi"><small>Gravures offertes</small><b>8,00 €</b><span>remises accordées</span></div>
<div class="ph-kpi"><small>Ventes avec un code</small><b>61,80 €</b><span>total des 2 commandes</span></div>
</div></div>
<div class="card og-card ogs">
<div class="ogs-top"><h2>Suivi des codes</h2><input class="ogs-search" placeholder="Rechercher une adresse ou un code…"></div>
<div class="ogs-filtres"><span class="ogs-f sel">Tous <b>52</b></span><span class="ogs-f">Utilisés <b>2</b></span><span class="ogs-f">Pas encore <b>50</b></span><span class="ogs-f">Expirés <b>0</b></span></div>
<div><div class="ogs-head"><span>Cliente</span><span>Son code</span><span>Utilisé ?</span></div>
{rows}</div>
<p class="ogs-note">Un code ne marche qu'avec l'adresse à laquelle il a été envoyé : un code « utilisé » l'a forcément été par sa destinataire. La commande s'ouvre d'un clic. Après sa date limite, un code jamais utilisé passe en « Expiré, non utilisé ».</p>
</div>
<p class="ogs-note" style="margin-top:14px">(Le reste de la page — case « Activer », dates, préfixe, boutons — ne change pas : il se trouve en dessous.)</p>
</div></body></html>'''
open(sys.argv[1], "w", encoding="utf-8").write(page)
