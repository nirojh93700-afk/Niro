# -*- coding: utf-8 -*-
# MAQUETTE « FILE DE PRODUCTION » de Gestion (04/11/2026) — gérant, après la maquette de la fiche commande :
# « Fais exactement ce que t'as fait pour l'autre maquette pour celui de cette page ». Même méthode : inventaire de
# la page actuelle (/gestion/commandes), recherche dans les grands logiciels, rien supprimé, coquille et classes
# RÉELLES de Gestion (.ash-*), seul le bloc .fq-* est neuf. Données = EXEMPLES (prénoms d'exemple, jamais une vraie cliente).
#
# Usage : python3 file-production.py <dossier css> <sortie.html>
#
# D'où vient chaque idée (recherche du 04/11/2026) :
#   Shopify  : vues enregistrées en onglets avec compteur, barre unique recherche + tri + filtres, cases à cocher →
#              barre d'actions groupées, « Plus d'actions » par ligne, toast « Annuler » après une action.
#   Etsy     : « À expédier avant le … » sur chaque commande, tri par date limite, onglets Ouvertes / Terminées,
#              personnalisation lisible sur la ligne, cadeau marqué.
#   Amazon Seller Central : onglets En attente / À expédier / Expédiées, filtre « à expédier aujourd'hui »,
#              confirmation d'expédition avec n° de suivi + transporteur reconnu.
#   Tableaux kanban (Dispatch, Trello, Katana) : colonnes À préparer → En fabrication → Expédiées, cartes compactes,
#              ordre de traitement numéroté, retard en rouge sur le bord de la carte.
#   Sendcloud « Pack & Go », Pirate Ship : impression groupée (fiches + étiquettes) = « Tournée du jour ».
#   Linear   : J / K pour passer d'une carte à l'autre, Entrée pour ouvrir, « / » pour chercher, « ? » = aide.
#   Clispot / Baymard : une information critique (Express, retard, pays, réponse cliente) ne se cache jamais
#              derrière un « voir plus » ; sur téléphone, jamais plus de deux lignes de pastilles : un rail qui glisse.
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import I, ICONS, css_site, shell

css_dir, out = sys.argv[1], sys.argv[2]
CSS_SITE = css_site(css_dir)
FICHE = "https://claude.ai/artifact/43E3za7KKg1G87cSCtPowq"  # la maquette de la fiche commande (04/11), ouverte depuis chaque carte

CSS = r"""
/* ====== File de production (maquette) — préfixe .fq- ====== */
.fq{color:var(--ash-ink);font-size:14px;line-height:1.45}
.fq *{box-sizing:border-box;min-width:0}
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
.fq svg{width:16px;height:16px;flex:none;vertical-align:-3px}
.fq h1,.fq h2,.fq h3{margin:0}
.fq button{font:inherit;color:inherit;cursor:pointer}
.fq kbd{font:600 11px/1 system-ui,sans-serif;padding:3px 6px;border-radius:6px;background:var(--ash-sunk);border:1px solid var(--ash-line-2);color:var(--ash-muted)}
.fq .mono{font-variant-numeric:tabular-nums}
.fq .muted{color:var(--ash-muted)}

.fq-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:10px;border:1px solid var(--ash-line-2);background:#fff;font-weight:600;font-size:13px;line-height:1.1;white-space:nowrap;min-height:36px}
.fq-btn:hover{background:var(--ash-sunk)}
.fq-btn.pri{background:var(--ash-ink);color:#fff;border-color:var(--ash-ink)}
.fq-btn.pri:hover{background:#000}
.fq-btn.gold{background:var(--ash-gold-2);color:#fff;border-color:var(--ash-gold-2)}
.fq-btn.ok{background:var(--ash-ok);color:#fff;border-color:var(--ash-ok)}
.fq-btn.ghost{border-color:transparent;background:transparent}
.fq-btn.ghost:hover{background:var(--ash-sunk)}
.fq-btn.sm{padding:5px 9px;min-height:28px;font-size:12px;border-radius:8px}
.fq-btn.danger{color:var(--ash-bad)}
.fq-btn svg{width:15px;height:15px;flex:none}
.fq-ibtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--ash-line-2);background:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}
.fq-ibtn svg{width:16px;height:16px}
.fq-lnk{background:none;border:0;padding:0;color:var(--ash-gold-ink);text-decoration:underline;text-underline-offset:2px;font-weight:600;font-size:inherit}

.fq-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:11.5px;font-weight:700;line-height:1.5;border:1px solid transparent;white-space:nowrap}
.fq-pill svg{width:12px;height:12px}
.fq-pill.ok{background:var(--ash-ok-bg);color:var(--ash-ok)}
.fq-pill.warn{background:var(--ash-warn-bg);color:var(--ash-warn)}
.fq-pill.bad{background:var(--ash-bad-bg);color:var(--ash-bad)}
.fq-pill.info{background:var(--ash-info-bg);color:var(--ash-info)}
.fq-pill.gold{background:var(--ash-gold-bg);color:var(--ash-gold-ink)}
.fq-pill.grey{background:var(--ash-sunk);color:var(--ash-muted)}
.fq-pill.line{background:#fff;border-color:var(--ash-line-2);color:var(--ash-muted);font-weight:600}

/* en-tête de page + chiffres (cliquables = filtres) */
.fq-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.fq-head h1{font-family:Georgia,"Playfair Display",serif;font-weight:500;font-size:24px;letter-spacing:.01em}
.fq-head .sub{color:var(--ash-muted);font-size:13px;margin-top:3px;max-width:720px}
.fq-head .acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.fq-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:14px}
.fq-kpi{background:#fff;border:1px solid var(--ash-line);border-radius:12px;padding:10px 12px;text-align:left;display:flex;flex-direction:column;gap:1px}
.fq-kpi b{font-size:22px;font-variant-numeric:tabular-nums;line-height:1.15}
.fq-kpi span{font-size:12px;color:var(--ash-muted);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fq-kpi small{font-size:11px;color:var(--ash-faint)}
.fq-kpi:hover{border-color:var(--ash-line-2);background:var(--ash-sunk)}
.fq-kpi.on{border-color:var(--ash-ink);box-shadow:inset 0 0 0 1px var(--ash-ink)}
.fq-kpi.bad b{color:var(--ash-bad)}
.fq-kpi.warn b{color:var(--ash-warn)}
.fq-kpi.info b{color:var(--ash-info)}
.fq-kpi.gold b{color:var(--ash-gold-ink)}

/* barre d'outils collée : vues · recherche · tri · filtres */
.fq-tools{position:sticky;top:0;z-index:15;background:var(--ash-bg);margin:14px -24px 0;padding:6px 24px 8px;border-bottom:1px solid var(--ash-line)}
.fq-views{display:flex;gap:2px;border-bottom:1px solid var(--ash-line);overflow-x:auto;scrollbar-width:none}
.fq-views::-webkit-scrollbar{display:none}
.fq-view{padding:9px 11px;border:0;background:none;font-weight:600;font-size:13px;color:var(--ash-muted);border-bottom:2px solid transparent;white-space:nowrap;display:inline-flex;gap:6px;align-items:center;margin-bottom:-1px;flex:none}
.fq-view.on{color:var(--ash-ink);border-bottom-color:var(--ash-ink)}
.fq-view b{font-size:11px;background:var(--ash-sunk);border-radius:999px;padding:1px 7px;font-variant-numeric:tabular-nums}
.fq-view.on b{background:var(--ash-ink);color:#fff}
.fq-row2{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}
.fq-search{display:flex;align-items:center;gap:8px;flex:1 1 220px;min-width:180px;max-width:360px;background:#fff;border:1px solid var(--ash-line-2);border-radius:10px;padding:0 10px;height:36px}
.fq-search input{border:0;outline:0;flex:1;font:inherit;font-size:13px;background:none}
.fq-search svg{color:var(--ash-muted)}
.fq-select{flex:none;height:36px;border:1px solid var(--ash-line-2);border-radius:10px;background:#fff;padding:0 8px;font:inherit;font-size:13px;font-weight:600;color:var(--ash-ink)}
.fq-chipbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.fq-chip{flex:none;border:1px solid var(--ash-line-2);background:#fff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600;display:inline-flex;gap:5px;align-items:center;white-space:nowrap}
.fq-chip svg{width:13px;height:13px}
.fq-chip.on{background:var(--ash-ink);color:#fff;border-color:var(--ash-ink)}
.fq-count{margin-left:auto;font-size:12px;color:var(--ash-muted);white-space:nowrap}

/* tableau à 3 colonnes (PC) · listes · groupes par date limite */
.fq-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start;margin-top:14px}
.fq-col{background:var(--ash-sunk);border:1px solid var(--ash-line);border-radius:16px;padding:10px;min-height:120px}
.fq-col-h{display:flex;align-items:center;gap:8px;margin:2px 4px 10px;font-weight:700;font-size:13px}
.fq-col-h i{width:9px;height:9px;border-radius:50%;flex:none}
.fq-col-h i.prep{background:var(--ash-gold-2)}.fq-col-h i.fab{background:var(--ash-info)}.fq-col-h i.exp{background:var(--ash-ok)}
.fq-col-h b{margin-left:auto;font-size:12px;color:var(--ash-muted);font-weight:600}
.fq-list{display:flex;flex-direction:column;gap:10px}
.fq-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px;align-items:start}
.fq-group{margin-top:16px}
.fq-group h2{font-size:13px;font-weight:700;display:flex;gap:8px;align-items:center;margin-bottom:8px}
.fq-group h2 i{width:9px;height:9px;border-radius:50%;background:var(--ash-muted);flex:none}
.fq-group h2 i.late{background:var(--ash-bad)}.fq-group h2 i.today{background:var(--ash-warn)}.fq-group h2 i.week{background:var(--ash-gold-2)}.fq-group h2 i.done{background:var(--ash-ok)}
.fq-group h2 b{font-weight:600;color:var(--ash-muted)}
.fq-empty{color:var(--ash-muted);font-size:13px;padding:14px;text-align:center;background:#fff;border:1px dashed var(--ash-line-2);border-radius:12px}

/* la carte */
.fq-card{background:#fff;border:1px solid var(--ash-line-2);border-radius:14px;padding:11px 12px 10px;position:relative;display:flex;flex-direction:column;gap:7px;outline:0;border-left-width:4px;border-left-color:var(--ash-line-2)}
.fq-card.late,.fq-card.express{border-left-color:var(--ash-bad)}
.fq-card.today{border-left-color:var(--ash-warn)}
.fq-card.focus{box-shadow:0 0 0 2px var(--ash-gold)}
.fq-card.sel{background:var(--ash-gold-bg)}
.fq-c1{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fq-selbox{width:18px;height:18px;margin:0;accent-color:var(--ash-ink);flex:none;cursor:pointer}
.fq-pos{min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--ash-ink);color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none;font-variant-numeric:tabular-nums}
.fq-ref{font-weight:700;font-variant-numeric:tabular-nums;color:var(--ash-ink);text-decoration:none}
.fq-ref:hover{text-decoration:underline}
.fq-tot{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}
.fq-who{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;color:var(--ash-muted)}
.fq-who b{color:var(--ash-ink)}
.fq-who .dot{opacity:.5}
.fq-mode{display:inline-flex;gap:4px;align-items:center;font-weight:600}
.fq-mode svg{width:14px;height:14px}
.fq-mode.express{color:var(--ash-bad)}
.fq-chips{display:flex;gap:5px;flex-wrap:wrap}.fq-chips .fq-pill{white-space:normal;text-align:left}
.fq-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;font-size:13px}
.fq-items li{display:flex;gap:7px;align-items:flex-start}
.fq-items .q{flex:none;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ash-muted);min-width:20px}
.fq-items .var{color:var(--ash-muted)}
.fq-items .perso{display:block;color:var(--ash-gold-ink);font-size:12px}
.fq-items .perso svg{width:12px;height:12px}
.fq-dead{display:flex;gap:7px;align-items:flex-start;font-size:12.5px;font-weight:600;padding:6px 9px;border-radius:9px;background:var(--ash-sunk);color:var(--ash-muted)}
.fq-dead svg{width:14px;height:14px;margin-top:2px}.fq-dead span{min-width:0}
.fq-dead.late{background:var(--ash-bad-bg);color:var(--ash-bad)}
.fq-dead.today{background:var(--ash-warn-bg);color:var(--ash-warn)}
.fq-dead.week{background:var(--ash-gold-bg);color:var(--ash-gold-ink)}
.fq-dead.done{background:var(--ash-ok-bg);color:var(--ash-ok)}
.fq-dead small{font-weight:500;opacity:.85}
.fq-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px}
.fq-note{flex:1 1 140px;color:var(--ash-muted);font-style:italic;background:none;border:1px dashed transparent;border-radius:8px;padding:3px 6px;text-align:left;font:inherit;font-size:12px;cursor:text;display:inline-flex;gap:5px;align-items:center}
.fq-note:hover{border-color:var(--ash-line-2)}
.fq-note.empty{color:var(--ash-faint)}
.fq-note-edit{width:100%;font:inherit;font-size:12px;border:1px solid var(--ash-line-2);border-radius:8px;padding:6px 8px;resize:vertical;min-height:54px}
.fq-acts{display:flex;gap:6px;align-items:center;margin-top:2px;position:relative}
.fq-acts .pri,.fq-acts .ok{flex:1 1 0;justify-content:center;min-width:0;overflow:hidden;text-overflow:ellipsis}
@media (min-width:901px){.fq-col .fq-acts .ghost{display:none}}
.fq-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--ash-line-2);border-radius:12px;box-shadow:var(--ash-shadow),0 12px 30px rgba(28,22,13,.12);min-width:260px;padding:6px;z-index:30}
.fq-menu[hidden]{display:none}
.fq-menu .g{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ash-faint);padding:8px 10px 4px;font-weight:700}
.fq-menu button,.fq-menu a{display:flex;width:100%;text-align:left;gap:10px;align-items:center;padding:9px 10px;border:0;background:none;border-radius:8px;font-size:13px;color:inherit;text-decoration:none;font-weight:500}
.fq-menu button:hover,.fq-menu a:hover{background:var(--ash-sunk)}
.fq-menu button.danger{color:var(--ash-bad)}
.fq-menu svg{width:15px;height:15px;color:var(--ash-muted)}
.fq-menu hr{border:0;border-top:1px solid var(--ash-line);margin:6px 0}
.fq-ship{border:1px solid var(--ash-line-2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;background:var(--ash-sunk)}
.fq-ship h3{font-size:13px}
.fq-ship input[type=text]{height:34px;border:1px solid var(--ash-line-2);border-radius:8px;padding:0 10px;font:inherit;font-size:13px;width:100%;background:#fff}
.fq-ship label{display:flex;gap:7px;align-items:center;font-size:12.5px}
.fq-ship .r{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
.fq-ship .car{font-size:12px;color:var(--ash-muted)}
.fq-ship .car b{color:var(--ash-ink)}
.fq-flagpick{display:flex;gap:5px;flex-wrap:wrap;padding:8px;border:1px solid var(--ash-line-2);border-radius:10px;background:var(--ash-sunk)}
.fq-confirm{border:1px solid #f0c4bd;background:var(--ash-bad-bg);border-radius:10px;padding:10px;font-size:13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:#6e1f16}
.fq-confirm .r{margin-left:auto;display:flex;gap:6px}
.fq-kit{display:inline-flex;gap:5px;align-items:center;border:1px solid var(--ash-line-2);background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600}
.fq-kit.ok{border-color:var(--ash-ok);color:var(--ash-ok);background:var(--ash-ok-bg)}
.fq-kit svg{width:13px;height:13px}

/* terminées / annulées, repliées */
.fq-done{margin-top:16px;border:1px solid var(--ash-line);border-radius:14px;background:#fff}
.fq-done summary{padding:12px 14px;font-weight:700;cursor:pointer;list-style:none;display:flex;gap:8px;align-items:center;font-size:13px}
.fq-done summary::-webkit-details-marker{display:none}
.fq-done summary b{font-weight:600;color:var(--ash-muted);margin-left:auto}
.fq-done .body{padding:0 10px 10px;overflow-x:auto}
.fq-done table{width:100%;border-collapse:collapse;font-size:13px;min-width:520px}
.fq-done td,.fq-done th{padding:7px 8px;border-top:1px solid var(--ash-line);text-align:left;vertical-align:top}
.fq-done th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash-faint);border-top:0}

/* barre d'actions groupées (sélection) */
.fq-bulk{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:40;background:var(--ash-ink);color:#fff;border-radius:14px;padding:8px 10px 8px 14px;display:flex;gap:8px;align-items:center;box-shadow:0 12px 30px rgba(0,0,0,.25);max-width:calc(100% - 32px);flex-wrap:wrap;font-size:13px;font-weight:600}
.fq-bulk[hidden]{display:none}
.fq-bulk .fq-btn{background:rgba(255,255,255,.12);border-color:transparent;color:#fff}
.fq-bulk .fq-btn:hover{background:rgba(255,255,255,.22)}
.fq-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:var(--ash-ink);color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;opacity:0;transition:.2s;z-index:60;white-space:nowrap;max-width:92vw;display:flex;gap:12px;align-items:center;pointer-events:none}
.fq-toast.on{opacity:1;transform:translateX(-50%);pointer-events:auto}
.fq-toast button{background:none;border:0;color:var(--ash-gold);font-weight:700;text-decoration:underline;cursor:pointer;font:inherit}
.fq-help{position:fixed;inset:0;background:rgba(28,22,13,.45);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.fq-help[hidden]{display:none}
.fq-help .box{background:#fff;border-radius:16px;padding:18px 20px;max-width:440px;width:100%}
.fq-help dl{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;margin:12px 0 0;font-size:13px;align-items:center}
.fq-help dd{margin:0}

/* sources */
.fq-src{margin-top:26px}
.fq-src summary{cursor:pointer;font-weight:700;font-size:13px;list-style:none;display:flex;gap:8px;align-items:center}
.fq-src summary::-webkit-details-marker{display:none}
.fq-src table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
.fq-src td,.fq-src th{text-align:left;padding:7px 8px;border-bottom:1px solid var(--ash-line);vertical-align:top}
.fq-src th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash-faint)}

@media (max-width:1100px){.fq-grid{grid-template-columns:1fr}.fq-kpis{grid-template-columns:repeat(3,1fr)}}
@media (max-width:900px){
  .fq-head h1{font-size:21px}
  .fq-kpis{display:flex;overflow-x:auto;gap:8px;scrollbar-width:none;margin:12px -12px 0;padding:0 12px}
  .fq-kpis::-webkit-scrollbar{display:none}
  .fq-kpi{flex:0 0 122px}
  .fq-tools{margin:12px -12px 0;padding:4px 12px 8px}
  .fq-row2{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:8px -12px 0;padding:0 12px}
  .fq-row2::-webkit-scrollbar{display:none}
  .fq-search{flex:0 0 190px;min-width:190px}
  .fq-search kbd{display:none}
  .fq-chipbar{flex-wrap:nowrap}
  .fq-count{display:none}
  .fq-board{grid-template-columns:1fr}
  .fq-acts .fq-btn{white-space:normal}
  .fq-bulk{bottom:calc(88px + env(safe-area-inset-bottom,0px));width:calc(100% - 20px);justify-content:center;padding:8px 10px}
  .fq-toast{bottom:calc(92px + env(safe-area-inset-bottom,0px))}
}
"""

# ------------------------------------------------------------------ données d'EXEMPLE (aujourd'hui = mer. 4 nov. 2026) ----
# dead.k : late (dépassée) · today (dernier jour) · week (cette semaine) · later · done (partie)
ORDERS = [
    {"id": "3K7QX2LM", "name": "Camille Durand", "email": "camille.d@exemple.fr", "total": "72,80 €", "n": 72.8, "date": "2026-11-03T17:42", "age": "il y a 18 h", "st": "prep",
     "mode": "express", "pays": "FR", "immediate": True, "items": [
        {"q": 1, "name": "Verre à vin gravé", "var": "36 cl · Lot de 2", "perso": "Modèle n° 10 · « Camille » · 12.06.2027 · Verre 2 : « Julien »"},
        {"q": 1, "name": "Collier Cœur gravé", "var": "Doré", "perso": "Recto « Maman » · Allura"}],
     "dead": {"k": "today", "t": "jeu. 5 nov.", "s": "Express : à graver EN PRIORITÉ · encore 1 j ouvré"},
     "chips": ["express", "reponse", "cadeau"], "flags": [], "note": "", "kit": None},
    {"id": "3B2LK9MW", "name": "Thomas Roux", "email": "t.roux@exemple.fr", "total": "79,80 €", "n": 79.8, "date": "2026-10-26T10:12", "age": "il y a 9 j", "st": "prep",
     "mode": "domicile", "pays": "FR", "items": [
        {"q": 1, "name": "Cristal Photo 3D vertical", "var": "Moyen 8 × 5 × 5 cm", "perso": "Photo de couple · socle LED grand"}],
     "dead": {"k": "late", "t": "lun. 2 nov.", "s": "dépassé de 2 j ouvrés · 9 j calendaires écoulés"},
     "chips": ["alerte"], "alerte": "Photo trop sombre : attendre la nouvelle photo (mail du 30/10)", "flags": ["attente_client"], "note": "Elle renvoie une photo ce week-end", "kit": None},
    {"id": "3H8TA1PQ", "name": "Léa Bernard", "email": "lea.b@exemple.fr", "total": "36,51 €", "n": 36.51, "date": "2026-11-02T09:05", "age": "il y a 2 j", "st": "prep",
     "mode": "relais", "relais": "Mondial Relay · Tabac de la Gare, 69003 Lyon", "pays": "FR", "items": [
        {"q": 1, "name": "Collier 3 Cœurs", "var": "Argenté · boîte cadeau carrée", "perso": "1er cœur « Léa » · 2e cœur « Mia » · Playfair"}],
     "dead": {"k": "week", "t": "lun. 9 nov.", "s": "encore 3 j ouvrés"},
     "chips": [], "flags": ["gravure_offerte"], "note": "", "kit": None},
    {"id": "3M5WD8KA", "name": "Nathan Blanc", "email": "nathan@lecomptoir-exemple.fr", "total": "98,60 €", "n": 98.6, "date": "2026-11-01T15:30", "age": "il y a 3 j", "st": "prep",
     "mode": "domicile", "pays": "FR", "devis": "DEV-1538", "items": [
        {"q": 4, "name": "Verre à whisky 30 cl", "var": "sur devis", "perso": "Logo du bar + « Le Comptoir » sur chaque verre (photos reçues par e-mail)"}],
     "dead": {"k": "week", "t": "lun. 9 nov.", "s": "encore 3 j ouvrés"},
     "chips": ["surmesure", "photos"], "flags": ["appel"], "note": "Rappeler pour la taille du logo", "kit": None},
    {"id": "3G2NR6BE", "name": "Paul Mercier", "email": "p.mercier@exemple.be", "total": "45,90 €", "n": 45.9, "date": "2026-10-30T11:20", "age": "il y a 5 j", "st": "fab",
     "mode": "domicile", "pays": "BE", "items": [
        {"q": 2, "name": "Verre à whisky portrait", "var": "Lot de 2", "perso": "Photo « Papa » sur la face · 2e verre : texte seul « Papi »"}],
     "dead": {"k": "today", "t": "jeu. 5 nov.", "s": "encore 1 j ouvré"},
     "chips": ["pays", "dateimage"], "flags": ["urgent"], "note": "", "kit": None},
    {"id": "3F6ME4RT", "name": "Sarah Lopez", "email": "sarah.l@exemple.fr", "total": "34,90 €", "n": 34.9, "date": "2026-10-29T18:00", "age": "il y a 6 j", "st": "fab",
     "mode": "retrait", "pays": "FR", "items": [
        {"q": 1, "name": "Couverts enfants gravés", "var": "4 pièces", "perso": "« Noah » · lapin sur la cuillère, renard sur la fourchette"}],
     "dead": {"k": "today", "t": "jeu. 5 nov.", "s": "encore 1 j ouvré"},
     "chips": [], "flags": [], "note": "Rendez-vous samedi 11 h à l'atelier", "kit": "none"},
    {"id": "3C4NZ2HB", "name": "Emma Fontaine", "email": "emma.f@exemple.fr", "total": "30,81 €", "n": 30.81, "date": "2026-10-31T08:45", "age": "il y a 4 j", "st": "fab",
     "mode": "domicile", "pays": "FR", "items": [
        {"q": 1, "name": "Bracelet gourmette à plaque gravée", "var": "Noir · sac cadeau", "perso": "Plaque « Lucas · 2026 » · Montserrat"}],
     "dead": {"k": "week", "t": "ven. 6 nov.", "s": "encore 2 j ouvrés"},
     "chips": ["cadeau"], "flags": ["cadeau"], "note": "", "kit": {"gain": "11,20 €", "det": "sac cadeau · lettre suivie"}},
    {"id": "3D4HS2KW", "name": "Inès Martin", "email": "ines.m@exemple.fr", "total": "22,90 €", "n": 22.9, "date": "2026-10-29T14:10", "age": "il y a 6 j", "st": "exp",
     "mode": "domicile", "pays": "FR", "shipped": "mar. 3 nov.", "track": "1A12345678901", "carrier": "La Poste", "items": [
        {"q": 1, "name": "Verre à vin gravé", "var": "47 cl · À l'unité", "perso": "Modèle n° 3 · « Inès »"}],
     "dead": {"k": "done", "t": "expédiée en 3 j ouvrés", "s": "dans les temps"},
     "chips": [], "flags": [], "note": "", "kit": {"gain": "4,10 €", "det": "carton 25 × 20 × 15 · chips"}},
    {"id": "3J1CR7XN", "name": "Hugo Petit", "email": "hugo.p@exemple.fr", "total": "33,51 €", "n": 33.51, "date": "2026-10-27T12:00", "age": "il y a 8 j", "st": "exp",
     "mode": "relais", "relais": "Mondial Relay · Pressing du Centre, 44000 Nantes", "pays": "FR", "shipped": "lun. 2 nov.", "track": "74550444", "carrier": "Mondial Relay", "items": [
        {"q": 1, "name": "Collier Enveloppe", "var": "Doré", "perso": "Recto « Je t'aime » · verso « H. »"}],
     "dead": {"k": "done", "t": "expédiée en 4 j ouvrés", "s": "dans les temps"},
     "chips": [], "flags": [], "note": "", "kit": {"gain": "12,05 €", "det": "sac cadeau · lettre suivie"}},
    {"id": "3P9VB3LS", "name": "Chloé Girard", "email": "chloe.g@exemple.fr", "total": "119,80 €", "n": 119.8, "date": "2026-10-29T09:30", "age": "il y a 6 j", "st": "exp",
     "mode": "express", "pays": "FR", "shipped": "ven. 30 oct.", "track": "XY123456789FR", "carrier": "Chronopost", "items": [
        {"q": 1, "name": "Cristal Photo 3D horizontal", "var": "Grand 12 × 8 × 5 cm", "perso": "Photo de famille · socle LED grand"}],
     "dead": {"k": "done", "t": "expédiée en 1 j ouvré", "s": "dans les temps"},
     "chips": ["reponse"], "flags": [], "note": "", "kit": {"gain": "38,40 €", "det": "carton 30 × 23 × 10 · chips · FRAGILE"}},
]
DONE = [
    {"id": "3A1ZE5TD", "name": "Manon Petit", "st": "liv", "when": "livrée le 28 oct.", "items": "1× Porte-clés cuir gravé", "total": "9,90 €"},
    {"id": "3E2YF8GC", "name": "Julien Morel", "st": "liv", "when": "livrée le 27 oct.", "items": "1× Flûte à champagne · Lot de 2", "total": "36,90 €"},
    {"id": "3N7UB4JV", "name": "Alice Leroy", "st": "annul", "when": "annulée et remboursée le 29 oct.", "items": "1× Verre à whisky 30 cl", "total": "24,90 €"},
]
FLAGS = {"urgent": ("Urgente", "bad"), "attend": ("Accepte d'attendre", "grey"), "cadeau": ("Cadeau promis", "gold"), "gravure_offerte": ("Gravure offerte", "info"), "attente_client": ("Attente cliente", "warn"), "appel": ("À rappeler", "warn")}

JS = r"""
const ORDERS = %ORDERS%, DONE = %DONE%, FLAGS = %FLAGS%, IC = %ICONS%, FICHE = %FICHE%;
const $ = (s, r = document) => r.querySelector(s);
const state = { view: "tout", q: "", sort: "ordre", filters: new Set(), sel: new Set(), menu: null, ship: null, note: null, flagpick: null, confirm: null, focus: null, doneOpen: false };
let undo = null, toastT = null;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const STATUS = { prep: ["À préparer", "gold"], fab: ["En fabrication", "info"], exp: ["Expédiée", "ok"], liv: ["Livrée", "grey"], annul: ["Annulée", "bad"] };
const MODE = { express: [IC.bolt, "Express Chronopost", "express"], domicile: [IC.home, "Domicile", ""], relais: [IC.pin, "Point relais", ""], retrait: [IC.user, "Retrait à l'atelier", ""] };
const PAYS = { BE: "🇧🇪 Belgique", CH: "🇨🇭 Suisse", DE: "🇩🇪 Allemagne" };
const DEADRANK = { late: 0, today: 1, week: 2, later: 3, done: 4 };
function toast(msg, undoFn) {
  const t = $("#toast"); clearTimeout(toastT); undo = undoFn || null;
  t.innerHTML = esc(msg) + (undoFn ? '<button type="button" id="undo">Annuler</button>' : "");
  t.classList.add("on"); toastT = setTimeout(() => t.classList.remove("on"), undoFn ? 10000 : 2400);
}
function active() { return ORDERS.filter((o) => o.st === "prep" || o.st === "fab"); }
function ordre(a, b) { // ordre de traitement : Express / urgentes d'abord, puis premières arrivées (FIFO)
  const ua = a.mode === "express" || a.flags.includes("urgent") ? 0 : 1, ub = b.mode === "express" || b.flags.includes("urgent") ? 0 : 1;
  return ua - ub || a.date.localeCompare(b.date);
}
function positions() { const p = {}; active().sort(ordre).forEach((o, i) => (p[o.id] = i + 1)); return p; }
function matches(o) {
  const q = state.q.trim().toLowerCase();
  if (q && !(o.id + " " + o.name + " " + o.email + " " + o.items.map((i) => i.name + " " + i.perso).join(" ")).toLowerCase().includes(q)) return false;
  for (const f of state.filters) {
    if (f === "express" && o.mode !== "express") return false;
    if (f === "relais" && o.mode !== "relais") return false;
    if (f === "cadeau" && !o.chips.includes("cadeau") && !o.flags.includes("cadeau")) return false;
    if (f === "reponse" && !o.chips.includes("reponse")) return false;
    if (f === "etranger" && o.pays === "FR") return false;
    if (f === "alerte" && !(o.chips.includes("alerte") || o.chips.includes("dateimage") || o.flags.includes("urgent"))) return false;
    if (f === "late" && o.dead.k !== "late") return false;
  }
  return true;
}
function sorted(list) {
  const l = [...list];
  if (state.sort === "ordre") l.sort(ordre);
  if (state.sort === "limite") l.sort((a, b) => DEADRANK[a.dead.k] - DEADRANK[b.dead.k] || a.date.localeCompare(b.date));
  if (state.sort === "recent") l.sort((a, b) => b.date.localeCompare(a.date));
  if (state.sort === "montant") l.sort((a, b) => b.n - a.n);
  return l;
}
function pill(txt, k, ico) { return `<span class="fq-pill ${k}">${ico || ""}${txt}</span>`; }
function chips(o) {
  const c = [];
  if (o.mode === "express" && o.st !== "exp") c.push(pill("Express · à graver en priorité", "bad", IC.bolt));
  if (o.pays !== "FR") c.push(pill("À envoyer en " + PAYS[o.pays].replace(/^\S+ /, "").toUpperCase(), "bad", IC.flag));
  if (o.chips.includes("reponse")) c.push(pill("Nouvelle réponse de la cliente", "info", IC.mail));
  if (o.chips.includes("cadeau")) c.push(pill("Cadeau promis dans le colis", "gold", IC.gift));
  if (o.chips.includes("dateimage")) c.push(pill("Date dans l'image non cochée", "warn", IC.alert));
  if (o.chips.includes("alerte")) c.push(pill(esc(o.alerte), "bad", IC.alert));
  if (o.chips.includes("surmesure")) c.push(pill("Sur mesure · devis " + o.devis, "gold", IC.pen));
  if (o.chips.includes("photos")) c.push(pill("Photos reçues par e-mail", "grey", IC.img));
  if (o.chips.includes("emailfix")) c.push(pill("E-mail corrigé", "warn", IC.mail));
  return c.length ? `<div class="fq-chips">${c.join("")}</div>` : "";
}
function card(o, pos, inBoard) {
  const [stl, stk] = STATUS[o.st]; const m = MODE[o.mode];
  const cls = ["fq-card", o.st !== "exp" && o.dead.k, o.mode === "express" && o.st !== "exp" && "express", state.sel.has(o.id) && "sel", state.focus === o.id && "focus"].filter(Boolean).join(" ");
  const items = o.items.map((i) => `<li><span class="q">${i.q}×</span><span><b>${esc(i.name)}</b> <span class="var">· ${esc(i.var)}</span>${i.perso ? `<span class="perso">${IC.pen} ${esc(i.perso)}</span>` : ""}</span></li>`).join("");
  const dead = o.st === "exp"
    ? `<div class="fq-dead done">${IC.check}<span>${esc(o.dead.t)} <small>· ${esc(o.dead.s)} · ${esc(o.carrier)} <span class="mono">${esc(o.track)}</span> · ${esc(o.shipped)}</small></span></div>`
    : `<div class="fq-dead ${o.dead.k}">${IC.clock}<span>À expédier avant <b>${esc(o.dead.t)}</b> <small>· ${esc(o.dead.s)}</small></span></div>`;
  const flags = o.flags.map((f) => pill(FLAGS[f][0], FLAGS[f][1], IC.tag)).join("");
  const kit = o.kit === "none" ? "" : o.kit
    ? `<button type="button" class="fq-kit ok" data-kit="${o.id}">${IC.check} Conditionnement validé · gain ${esc(o.kit.gain)}</button>`
    : `<button type="button" class="fq-kit" data-kit="${o.id}">${IC.box} Conditionnement · à faire</button>`;
  const note = state.note === o.id
    ? `<textarea class="fq-note-edit" data-noteedit="${o.id}" placeholder="Note interne (jamais vue par la cliente)">${esc(o.note)}</textarea><div class="r" style="display:flex;gap:6px"><button type="button" class="fq-btn sm pri" data-notesave="${o.id}">Enregistrer</button><button type="button" class="fq-btn sm ghost" data-notecancel>Annuler</button></div>`
    : `<button type="button" class="fq-note${o.note ? "" : " empty"}" data-note="${o.id}">${IC.pen} ${o.note ? esc(o.note) : "Ajouter une note interne"}</button>`;
  let pri = "";
  if (o.st === "prep") pri = `<button type="button" class="fq-btn pri" data-go="fab" data-id="${o.id}">${IC.pen} Commencer la fabrication</button>`;
  if (o.st === "fab") pri = `<button type="button" class="fq-btn pri" data-ship="${o.id}">${IC.truck} Expédier…</button>`;
  if (o.st === "exp") pri = `<button type="button" class="fq-btn ok" data-go="liv" data-id="${o.id}">${IC.check} Livrée</button>`;
  const menu = state.menu === o.id ? `<div class="fq-menu" data-menuof="${o.id}">
      <div class="g">Cette commande</div>
      <a href="${FICHE}" target="_blank" rel="noopener">${IC.next} Ouvrir la fiche complète</a>
      <button type="button" data-act="print">${IC.print} Imprimer la fiche atelier</button>
      <button type="button" data-act="etiq">${IC.tag} Étiquette d'adresse</button>
      <button type="button" data-act="kit">${IC.box} Conditionnement</button>
      <button type="button" data-act="rate">${IC.x} Raté — à refaire</button>
      <hr>
      <div class="g">Organiser</div>
      <button type="button" data-act="flags">${IC.flag} Étiqueter (urgente, cadeau…)</button>
      <button type="button" data-act="note">${IC.pen} Note interne</button>
      <button type="button" data-act="comms">${IC.mail} Communications & aperçu</button>
      <button type="button" data-act="copy">${IC.copy} Copier l'e-mail de la cliente</button>
      <hr>
      <button type="button" class="danger" data-act="cancel">${IC.x} Annuler la commande…</button>
    </div>` : "";
  const ship = state.ship === o.id ? `<div class="fq-ship" data-shipof="${o.id}"><h3>${IC.truck} Expédier ${o.id}</h3>
      <input type="text" data-track placeholder="N° de suivi (La Poste, Mondial Relay, Chronopost…)" value="">
      <div class="car" data-car>Transporteur reconnu : <b>—</b> · le lien de suivi sera le bon</div>
      <label><input type="checkbox" checked data-notify> Prévenir la cliente par e-mail (lien de suivi)</label>
      ${o.mode === "relais" ? `<div class="car">${IC.pin} ${esc(o.relais)}</div>` : ""}${o.pays !== "FR" ? `<div class="car" style="color:var(--ash-bad);font-weight:700">${PAYS[o.pays]} : étiquette internationale</div>` : ""}
      <div class="r"><button type="button" class="fq-btn ghost" data-shipcancel>Annuler</button><button type="button" class="fq-btn pri" data-shipok="${o.id}">${IC.check} Confirmer l'expédition</button></div></div>` : "";
  const flagpick = state.flagpick === o.id ? `<div class="fq-flagpick">${Object.entries(FLAGS).map(([k, [l]]) => `<button type="button" class="fq-chip${o.flags.includes(k) ? " on" : ""}" data-flag="${k}" data-id="${o.id}">${l}</button>`).join("")}<button type="button" class="fq-btn sm ghost" data-flagdone>Fermer</button></div>` : "";
  const confirm = state.confirm === o.id ? `<div class="fq-confirm">${IC.alert} <span>Annuler la commande <b>${o.id}</b> ? La cliente reçoit l'e-mail d'annulation, le stock est rendu.</span><span class="r"><button type="button" class="fq-btn sm" data-no>Non</button><button type="button" class="fq-btn sm danger" data-cancelok="${o.id}">Oui, annuler</button></span></div>` : "";
  return `<article class="${cls}" data-card="${o.id}" tabindex="0">
    <div class="fq-c1"><input type="checkbox" class="fq-selbox" data-sel="${o.id}" ${state.sel.has(o.id) ? "checked" : ""} aria-label="Sélectionner">${pos ? `<span class="fq-pos" title="Ordre de traitement">${pos}</span>` : ""}<a class="fq-ref" href="${FICHE}" target="_blank" rel="noopener">#${o.id}</a>${inBoard ? "" : pill(stl, stk)}<span class="fq-tot mono">${o.total}</span></div>
    <div class="fq-who"><b>${esc(o.name)}</b><span class="dot">·</span><span>${o.age}</span><span class="dot">·</span><span class="fq-mode ${m[2]}">${m[0]} ${m[1]}</span>${o.mode === "relais" ? `<span class="dot">·</span><span>${esc(o.relais)}</span>` : ""}${o.pays !== "FR" ? `<span class="dot">·</span><b style="color:var(--ash-bad)">${PAYS[o.pays]}</b>` : ""}</div>
    ${chips(o)}
    <ul class="fq-items">${items}</ul>
    ${dead}
    <div class="fq-meta">${flags}${kit}${note}</div>
    ${flagpick}${ship}${confirm}
    <div class="fq-acts">${pri}<a class="fq-btn ghost" href="${FICHE}" target="_blank" rel="noopener">Fiche</a><button type="button" class="fq-ibtn" data-menu="${o.id}" aria-label="Plus d'actions">${IC.more}</button>${menu}</div>
  </article>`;
}
function cards(list, pos, inBoard) { return list.length ? list.map((o) => card(o, pos[o.id], inBoard)).join("") : `<div class="fq-empty">Rien ici : tout est traité ✓</div>`; }
function render() {
  const pos = positions();
  const vis = ORDERS.filter(matches);
  const prep = sorted(vis.filter((o) => o.st === "prep")), fab = sorted(vis.filter((o) => o.st === "fab")), exp = sorted(vis.filter((o) => o.st === "exp"));
  const nPrep = ORDERS.filter((o) => o.st === "prep").length, nFab = ORDERS.filter((o) => o.st === "fab").length, nExp = ORDERS.filter((o) => o.st === "exp").length;
  const nRep = ORDERS.filter((o) => o.chips.includes("reponse")).length, nLate = active().filter((o) => o.dead.k === "late").length, nExpress = active().filter((o) => o.mode === "express").length;
  const kpi = (v, n, l, s, k, on) => `<button type="button" class="fq-kpi ${k}${on ? " on" : ""}" data-kpi="${v}"><b>${n}</b><span>${l}</span>${s ? `<small>${s}</small>` : ""}</button>`;
  const views = [["tout", "Tout", active().length + nExp], ["prep", "À préparer", nPrep], ["fab", "En fabrication", nFab], ["exp", "Expédiées", nExp], ["dead", "Par date limite", active().length], ["fin", "Terminées", DONE.length]];
  const chip = (f, l, ico) => `<button type="button" class="fq-chip${state.filters.has(f) ? " on" : ""}" data-filter="${f}">${ico}${l}</button>`;
  let body = "";
  if (state.view === "tout") {
    body = `<div class="fq-board">
      <section class="fq-col"><h2 class="fq-col-h"><i class="prep"></i>À préparer<b>${prep.length}</b></h2><div class="fq-list">${cards(prep, pos, true)}</div></section>
      <section class="fq-col"><h2 class="fq-col-h"><i class="fab"></i>En fabrication<b>${fab.length}</b></h2><div class="fq-list">${cards(fab, pos, true)}</div></section>
      <section class="fq-col"><h2 class="fq-col-h"><i class="exp"></i>Expédiées (7 jours)<b>${exp.length}</b></h2><div class="fq-list">${cards(exp, pos, true)}</div></section></div>`;
  } else if (state.view === "dead") {
    const act = sorted([...prep, ...fab]).sort((a, b) => DEADRANK[a.dead.k] - DEADRANK[b.dead.k] || a.date.localeCompare(b.date));
    const g = (k, t) => { const l = act.filter((o) => o.dead.k === k); return l.length ? `<section class="fq-group"><h2><i class="${k}"></i>${t}<b>· ${l.length}</b></h2><div class="fq-grid" style="margin-top:0">${cards(l, pos)}</div></section>` : ""; };
    body = g("late", "En retard") + g("today", "À expédier demain au plus tard") + g("week", "Cette semaine") + g("later", "Plus tard") + (exp.length ? `<section class="fq-group"><h2><i class="done"></i>Parties cette semaine<b>· ${exp.length}</b></h2><div class="fq-grid" style="margin-top:0">${cards(exp, pos)}</div></section>` : "");
    if (!act.length && !exp.length) body = `<div class="fq-empty" style="margin-top:14px">Rien ici : tout est traité ✓</div>`;
  } else if (state.view === "fin") {
    body = `<div class="fq-done" style="margin-top:14px"><div class="body" style="padding-top:4px">${doneTable()}</div></div>`;
  } else {
    const l = { prep, fab, exp }[state.view];
    body = `<div class="fq-grid">${cards(l, pos)}</div>`;
  }
  const done = state.view === "fin" ? "" : `<details class="fq-done" ${state.doneOpen ? "open" : ""} data-done><summary>${IC.check} Terminées, annulées et remboursées <b>${DONE.length} · repliées pour ne pas se mélanger</b></summary><div class="body">${doneTable()}</div></details>`;
  $("#app").innerHTML = `<div class="fq">
    <div class="fq-head"><div><h1>File de production</h1><div class="sub">Dans l'ordre de traitement : Express et urgentes d'abord, puis les premières arrivées. Une carte = une commande ; toucher la référence ouvre la fiche.</div></div>
      <div class="acts"><button type="button" class="fq-btn" data-tour>${IC.print} Tournée du jour</button><button type="button" class="fq-btn" data-refresh>${IC.undo} Actualiser</button><button type="button" class="fq-ibtn" data-help aria-label="Aide clavier">?</button></div></div>
    <div class="fq-kpis">
      ${kpi("prep", nPrep, "À préparer", "ordre de traitement", "gold", state.view === "prep")}
      ${kpi("fab", nFab, "En fabrication", "", "info", state.view === "fab")}
      ${kpi("late", nLate, "En retard", "date limite dépassée", nLate ? "bad" : "", state.filters.has("late"))}
      ${kpi("express", nExpress, "Express", "à graver en priorité", nExpress ? "bad" : "", state.filters.has("express"))}
      ${kpi("reponse", nRep, "Réponses clientes", "non lues", nRep ? "info" : "", state.filters.has("reponse"))}
      ${kpi("exp", nExp, "Expédiées", "7 derniers jours", "", state.view === "exp")}
    </div>
    <div class="fq-tools">
      <div class="fq-views">${views.map(([v, l, n]) => `<button type="button" class="fq-view${state.view === v ? " on" : ""}" data-view="${v}">${l}<b>${n}</b></button>`).join("")}</div>
      <div class="fq-row2">
        <label class="fq-search">${IC.search}<input type="search" id="q" placeholder="Réf., cliente, produit, gravure…" value="${esc(state.q)}"><kbd>/</kbd></label>
        <select class="fq-select" id="sort" aria-label="Trier"><option value="ordre"${state.sort === "ordre" ? " selected" : ""}>Tri : ordre de traitement</option><option value="limite"${state.sort === "limite" ? " selected" : ""}>Tri : date limite</option><option value="recent"${state.sort === "recent" ? " selected" : ""}>Tri : plus récentes</option><option value="montant"${state.sort === "montant" ? " selected" : ""}>Tri : montant</option></select>
        <div class="fq-chipbar">${chip("express", "Express", IC.bolt)}${chip("relais", "Point relais", IC.pin)}${chip("cadeau", "Cadeau", IC.gift)}${chip("reponse", "Réponse cliente", IC.mail)}${chip("etranger", "Hors France", IC.flag)}${chip("alerte", "Alerte", IC.alert)}${state.filters.size || state.q ? `<button type="button" class="fq-chip" data-clear>${IC.x} Effacer</button>` : ""}</div>
        <span class="fq-count">${vis.length} commande${vis.length > 1 ? "s" : ""} affichée${vis.length > 1 ? "s" : ""}</span>
      </div>
    </div>
    ${body}
    ${done}
    <details class="fq-src"><summary>${IC.spark} D'où vient chaque idée (recherche du 4 novembre 2026)</summary>
      <table><tr><th>Dans la maquette</th><th>Repris de</th></tr>
      <tr><td>Vues en onglets avec compteur (Tout · À préparer · En fabrication · Expédiées · Par date limite · Terminées), une seule barre recherche + tri + filtres</td><td>Shopify (vues enregistrées des commandes), Amazon Seller Central (onglets En attente / À expédier / Expédiées)</td></tr>
      <tr><td>« À expédier avant le … » sur chaque carte, en couleur, tri par date limite, groupes En retard / Demain / Cette semaine</td><td>Etsy (ship-by date, tri « par date d'expédition »), Amazon (« à expédier aujourd'hui »)</td></tr>
      <tr><td>Chiffres du haut cliquables = filtres (Express, retard, réponses…)</td><td>Stripe, Shopify (compteurs qui filtrent)</td></tr>
      <tr><td>Tableau à 3 colonnes sur ordinateur, ordre de traitement numéroté, retard et Express en rouge sur le bord de la carte, une seule liste sur téléphone</td><td>Tableaux kanban de préparation de commandes (Dispatch, Katana, Trello)</td></tr>
      <tr><td>Une seule grande action par carte (Commencer la fabrication → Expédier… → Livrée) + « ··· » pour le reste ; expédition confirmée dans la carte (n° de suivi, transporteur reconnu, case « prévenir ») — jamais de fenêtre système</td><td>Amazon (« Confirmer l'expédition »), Shopify (More actions), règle de la fiche commande du 04/11</td></tr>
      <tr><td>Cases à cocher → barre d'actions groupées (imprimer les fiches, étiquettes, passer en fabrication) ; « Tournée du jour » = fiches + étiquettes des commandes à préparer</td><td>Shopify (bulk actions), Sendcloud « Pack &amp; Go », Pirate Ship (impression groupée)</td></tr>
      <tr><td>Toast « Annuler » 10 s après une action, au lieu d'une confirmation avant</td><td>Shopify, Gmail</td></tr>
      <tr><td>J / K · Entrée · « / » · « ? »</td><td>Linear, Gmail</td></tr>
      <tr><td>Alertes toujours visibles sur la carte (Express, pays, réponse, cadeau, date dans l'image), jamais derrière un « voir plus » ; sur téléphone, les pastilles glissent sur une ligne</td><td>Clispot, Baymard (règle des 3 refus du 09/10)</td></tr>
      <tr><td>Terminées / annulées / remboursées repliées en bas</td><td>Etsy (Completed), la file actuelle</td></tr>
      </table></details>
  </div>`;
  $("#bulk").hidden = !state.sel.size; $("#bulkn").textContent = state.sel.size + " sélectionnée" + (state.sel.size > 1 ? "s" : "");
}
function doneTable() {
  return `<table><tr><th>Commande</th><th>Cliente</th><th>Articles</th><th>État</th><th>Total</th><th></th></tr>${DONE.map((d) => `<tr><td class="mono"><a class="fq-ref" href="${FICHE}" target="_blank" rel="noopener">#${d.id}</a></td><td>${esc(d.name)}</td><td>${esc(d.items)}</td><td>${pill(STATUS[d.st][0], STATUS[d.st][1])} <span class="muted">${esc(d.when)}</span></td><td class="mono">${d.total}</td><td><a class="fq-lnk" href="${FICHE}" target="_blank" rel="noopener">Fiche</a> · <button type="button" class="fq-lnk" data-rate="${d.id}">Raté</button></td></tr>`).join("")}</table>`;
}
function carrier(n) { n = n.trim().toUpperCase(); if (/^\d{8}$/.test(n)) return "Mondial Relay"; if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(n)) return "Chronopost"; if (/^\d[A-Z]\d{11}$/.test(n) || /^\d{14}[A-Z]$/.test(n)) return "La Poste"; return n ? "inconnu (lien Boxtal + La Poste)" : "—"; }
function setStatus(o, st, msg) {
  const before = o.st; o.st = st; render(); toast(msg, () => { o.st = before; render(); toast("Annulé : " + o.id + " est revenue en « " + STATUS[before][0] + " »"); });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-view],[data-kpi],[data-filter],[data-clear],[data-sel],[data-go],[data-ship],[data-shipcancel],[data-shipok],[data-menu],[data-act],[data-no],[data-cancelok],[data-note],[data-notesave],[data-notecancel],[data-flag],[data-flagdone],[data-kit],[data-tour],[data-refresh],[data-help],[data-helpclose],[data-bulk],[data-rate],#undo,[data-card]");
  if (!t) { if (state.menu) { state.menu = null; render(); } return; }
  const o = ORDERS.find((x) => x.id === (t.dataset.id || t.dataset.go && t.dataset.id || t.dataset.sel || t.dataset.ship || t.dataset.shipok || t.dataset.menu || t.dataset.cancelok || t.dataset.note || t.dataset.notesave || t.dataset.kit || t.dataset.card)) || (state.menu && ORDERS.find((x) => x.id === state.menu));
  if (t.dataset.view) { state.view = t.dataset.view; state.filters.delete("late"); render(); return; }
  if (t.dataset.kpi) { const k = t.dataset.kpi; if (k === "prep" || k === "fab" || k === "exp") state.view = state.view === k ? "tout" : k; else { state.filters.has(k) ? state.filters.delete(k) : state.filters.add(k); if (k === "late" || k === "express") state.view = "tout"; } render(); return; }
  if (t.dataset.filter) { const f = t.dataset.filter; state.filters.has(f) ? state.filters.delete(f) : state.filters.add(f); render(); return; }
  if (t.hasAttribute("data-clear")) { state.filters.clear(); state.q = ""; render(); return; }
  if (t.dataset.sel) { state.sel.has(t.dataset.sel) ? state.sel.delete(t.dataset.sel) : state.sel.add(t.dataset.sel); render(); return; }
  if (t.dataset.go) { setStatus(o, t.dataset.go, t.dataset.go === "fab" ? o.id + " : fabrication commencée" : o.id + " marquée livrée"); return; }
  if (t.dataset.ship) { state.ship = t.dataset.ship; state.menu = null; render(); $(`[data-shipof="${state.ship}"] [data-track]`)?.focus(); return; }
  if (t.hasAttribute("data-shipcancel")) { state.ship = null; render(); return; }
  if (t.dataset.shipok) { const box = t.closest(".fq-ship"); const n = box.querySelector("[data-track]").value.trim(); const notify = box.querySelector("[data-notify]").checked;
    if (!n) { box.querySelector("[data-track]").focus(); toast("Il manque le numéro de suivi"); return; }
    o.track = n; o.carrier = carrier(n); o.shipped = "aujourd'hui"; o.dead = { k: "done", t: "expédiée aujourd'hui", s: "dans les temps" }; state.ship = null;
    setStatus(o, "exp", o.id + " expédiée (" + o.carrier + ")" + (notify ? " · e-mail de suivi envoyé" : " · sans e-mail")); return; }
  if (t.dataset.menu) { state.menu = state.menu === t.dataset.menu ? null : t.dataset.menu; state.ship = null; render(); return; }
  if (t.dataset.act) { const a = t.dataset.act; const id = state.menu; state.menu = null;
    if (a === "flags") state.flagpick = id; else if (a === "note") state.note = id; else if (a === "cancel") state.confirm = id; else if (a === "kit") toast("Ouvre la fenêtre Conditionnement de " + id + " (celle qui existe déjà)"); else if (a === "print") toast("Fiche atelier de " + id + " : impression sur une page"); else if (a === "etiq") toast("Étiquettes d'adresse : " + id + " cochée sur la feuille"); else if (a === "rate") toast("Raté — à refaire : fenêtre de " + id + " (RatesCommande)"); else if (a === "comms") toast("Communications & aperçu de " + id); else if (a === "copy") toast("E-mail copié : " + o.email);
    render(); return; }
  if (t.hasAttribute("data-no")) { state.confirm = null; render(); return; }
  if (t.dataset.cancelok) { state.confirm = null; const i = ORDERS.indexOf(o); const copy = { ...o }; ORDERS.splice(i, 1); DONE.unshift({ id: o.id, name: o.name, st: "annul", when: "annulée à l'instant", items: o.items.map((x) => x.q + "× " + x.name).join(", "), total: o.total }); render(); toast(o.id + " annulée · e-mail envoyé à la cliente", () => { DONE.shift(); ORDERS.splice(i, 0, copy); render(); toast("Annulation annulée : " + o.id + " est de retour"); }); return; }
  if (t.dataset.note) { state.note = t.dataset.note; render(); $(`[data-noteedit="${state.note}"]`)?.focus(); return; }
  if (t.dataset.notesave) { o.note = $(`[data-noteedit="${o.id}"]`).value.trim(); state.note = null; render(); toast("Note enregistrée"); return; }
  if (t.hasAttribute("data-notecancel")) { state.note = null; render(); return; }
  if (t.dataset.flag) { const f = t.dataset.flag; const i = o.flags.indexOf(f); i >= 0 ? o.flags.splice(i, 1) : o.flags.push(f); render(); return; }
  if (t.hasAttribute("data-flagdone")) { state.flagpick = null; render(); toast("Étiquettes enregistrées"); return; }
  if (t.dataset.kit) { toast(o.kit ? "Conditionnement de " + o.id + " : " + o.kit.det + " · Corriger possible" : "Ouvre la fenêtre Conditionnement de " + o.id); return; }
  if (t.hasAttribute("data-tour")) { const n = ORDERS.filter((x) => x.st === "prep").length; toast("Tournée du jour : " + n + " fiches atelier + " + n + " étiquettes dans un seul PDF"); return; }
  if (t.hasAttribute("data-refresh")) { toast("Liste actualisée"); return; }
  if (t.hasAttribute("data-help")) { $("#help").hidden = false; return; }
  if (t.hasAttribute("data-helpclose")) { $("#help").hidden = true; return; }
  if (t.dataset.rate) { toast("Raté — à refaire : fenêtre de " + t.dataset.rate); return; }
  if (t.dataset.bulk) { const b = t.dataset.bulk; const ids = [...state.sel];
    if (b === "none") { state.sel.clear(); render(); return; }
    if (b === "fab") { let n = 0; ids.forEach((id) => { const x = ORDERS.find((y) => y.id === id); if (x && x.st === "prep") { x.st = "fab"; n++; } }); state.sel.clear(); render(); toast(n + " commande" + (n > 1 ? "s" : "") + " passée" + (n > 1 ? "s" : "") + " en fabrication"); return; }
    toast((b === "print" ? "Fiches atelier" : "Étiquettes d'adresse") + " : " + ids.length + " commande" + (ids.length > 1 ? "s" : "") + " dans un seul PDF"); return; }
  if (t.id === "undo") { if (undo) { const u = undo; undo = null; u(); } return; }
  if (t.dataset.card) { state.focus = t.dataset.card; document.querySelectorAll(".fq-card").forEach((c) => c.classList.toggle("focus", c.dataset.card === state.focus)); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") { state.q = e.target.value; const pos = e.target.selectionStart; render(); const q = $("#q"); q.focus(); q.setSelectionRange(pos, pos); }
  if (e.target.hasAttribute("data-track")) { const box = e.target.closest(".fq-ship"); box.querySelector("[data-car] b").textContent = carrier(e.target.value); }
});
document.addEventListener("change", (e) => { if (e.target.id === "sort") { state.sort = e.target.value; render(); } if (e.target.closest("[data-done]")) state.doneOpen = e.target.open; });
document.addEventListener("toggle", (e) => { if (e.target.hasAttribute("data-done")) state.doneOpen = e.target.open; }, true);
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if (e.key === "Escape") { if (!$("#help").hidden) { $("#help").hidden = true; return; } if (state.menu || state.ship || state.confirm || state.flagpick) { state.menu = state.ship = state.confirm = state.flagpick = null; render(); } if (typing) e.target.blur(); return; }
  if (typing) return;
  if (e.key === "/") { e.preventDefault(); $("#q").focus(); return; }
  if (e.key === "?") { $("#help").hidden = !$("#help").hidden; return; }
  if (e.key === "j" || e.key === "k") { const all = [...document.querySelectorAll(".fq-card")]; if (!all.length) return; let i = all.findIndex((c) => c.dataset.card === state.focus); i = e.key === "j" ? Math.min(all.length - 1, i + 1) : Math.max(0, i - 1); state.focus = all[i].dataset.card; all.forEach((c) => c.classList.toggle("focus", c === all[i])); all[i].scrollIntoView({ block: "nearest" }); all[i].focus(); return; }
  if (e.key === "Enter" && state.focus) { window.open(FICHE, "_blank"); return; }
  if (e.key === "x" && state.focus) { state.sel.has(state.focus) ? state.sel.delete(state.focus) : state.sel.add(state.focus); render(); }
});
render();
"""
JS = (JS.replace("%ORDERS%", json.dumps(ORDERS, ensure_ascii=False)).replace("%DONE%", json.dumps(DONE, ensure_ascii=False))
        .replace("%FLAGS%", json.dumps(FLAGS, ensure_ascii=False)).replace("%ICONS%", json.dumps(ICONS)).replace("%FICHE%", json.dumps(FICHE)))

EXTRA = f"""<div class="fq-bulk" id="bulk" hidden><span id="bulkn">0 sélectionnée</span><button type="button" class="fq-btn sm" data-bulk="print">{I('print')} Imprimer les fiches</button><button type="button" class="fq-btn sm" data-bulk="etiq">{I('tag')} Étiquettes</button><button type="button" class="fq-btn sm" data-bulk="fab">{I('pen')} Passer en fabrication</button><button type="button" class="fq-btn sm" data-bulk="none">{I('x')}</button></div>
<div class="fq-toast" id="toast"></div>
<div class="fq-help" id="help" hidden><div class="box fq"><h2 style="font-size:16px">Raccourcis clavier</h2><dl><dt><kbd>J</kbd> / <kbd>K</kbd></dt><dd>commande suivante / précédente</dd><dt><kbd>Entrée</kbd></dt><dd>ouvrir la fiche de la commande</dd><dt><kbd>X</kbd></dt><dd>cocher / décocher la commande</dd><dt><kbd>/</kbd></dt><dd>chercher</dd><dt><kbd>Échap</kbd></dt><dd>fermer un menu, une expédition en cours</dd><dt><kbd>?</kbd></dt><dd>cette aide</dd></dl><div style="margin-top:14px;text-align:right"><button type="button" class="fq-btn pri" data-helpclose>Fermer</button></div></div></div>"""

HTML = shell(title="File de production Gestion", crumb="File de production", subtab="File de production", css_site_txt=CSS_SITE, css=CSS, body='<div id="app"></div>', js=JS, extra=EXTRA)
open(out, "w", encoding="utf-8").write(HTML)
print(out, len(HTML) // 1024, "Ko")
