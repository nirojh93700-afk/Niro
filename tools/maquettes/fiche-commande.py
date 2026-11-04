# -*- coding: utf-8 -*-
# MAQUETTE « FICHE COMMANDE » de Gestion (04/11/2026) — gérant : « la page commande c'est trop mélangé, rangé
# n'importe comment… il faut que tu m'aides par étape… cherche dans les grands logiciels du monde entier,
# mélange le meilleur de tous ». Rien n'est supprimé : TOUT ce que la fiche actuelle montre est rangé ici,
# une seule fois, à une place fixe. Données = EXEMPLES (prénoms d'exemple, jamais une vraie cliente).
#
# Usage : python3 fiche-commande.py <dossier css> <sortie.html>
#   <dossier css> = les 3 feuilles du site en ligne (curl nivcreation.fr/_next/static/css/*.css) :
#   la maquette réutilise les VRAIES classes de Gestion (.ash-*), seul le bloc .fc-* est neuf.
#
# D'où vient chaque idée (recherche du 04/11/2026) :
#   Shopify : en-tête à deux statuts (paiement / expédition), articles à gauche, cliente · adresse · notes ·
#             étiquettes à droite, historique en bas avec notes internes, « Plus d'actions ».
#   Stripe  : fil d'Ariane, page à deux colonnes, actions de page en haut à droite, chronologie des événements.
#   Etsy    : « À expédier avant le … » en évidence, personnalisation sur la commande, cadeau, délai modifiable.
#   Zendesk : conversation au milieu, contexte cliente à droite ; les blocs obligatoires ne disparaissent jamais.
#   Amazon  : cadeau / message cadeau à part, coordonnées seulement quand on en a besoin.
#   Linear  : J / K pour passer à la commande suivante, Échap pour fermer, tout au clavier.
#   GotPhoto, FastSpring (2025-2026) : actions dans le coin haut droit, journal des événements lié.
#   Katana / Etsy « top tasks » : liste de contrôle par commande (gravée, contrôlée, emballée, étiquette, expédiée).
#   Clispot : ne jamais cacher une information critique derrière un « voir plus » (alertes TOUJOURS en haut).
import base64, glob, io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
css_dir, out = sys.argv[1], sys.argv[2]
CSS_SITE = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(css_dir, "*.css"))))

from PIL import Image

def uri(path, w=420):
    """Photo du site réduite (jamais recadrée) en data-URI webp."""
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "WEBP", quality=78)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()

def raw_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

P = lambda n: os.path.join(ROOT, "public", "produits", n)
M = lambda n: os.path.join(ROOT, "public", "materiel", n)
IMG = {
    "logo": raw_uri(os.path.join(ROOT, "docs", "maquettes", "assets", "logo-source.jpg"), "image/jpeg"),  # copie octet pour octet du logo du site
    "vin": uri(P("verre_vin_exemple_dale.jpg")),
    "vinv": uri(P("verre_vin_vierge.jpg"), 360),
    "coeur": uri(P("collier-coeur-grave-1.jpg")),
    "cristal": uri(P("cristal-v-couple.jpg")),
    "gourm": uri(P("bracelet-gourmette-plaque-1.jpg")),
    "carton": uri(M("carton-25x20x15.webp"), 160),
    "chips": uri(M("chips-calage.webp"), 160),
    "fragile": uri(M("etiquettes-fragile.webp"), 160),
    "boitec": uri(M("emb-boite-carree.webp"), 160),
    "sac": uri(M("emb-sac.webp"), 160),
    "bulles": uri(M("bulles-abricot.webp"), 160),
}

CSS = r"""
/* ====== Fiche commande (maquette) — préfixe .fc- ====== */
.fc{--fc-r:14px;color:var(--ash-ink);font-size:14px;line-height:1.45}
.fc *{box-sizing:border-box;min-width:0}
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
.fc svg{width:16px;height:16px;flex:none;vertical-align:-3px}
.fc h1,.fc h2,.fc h3,.fc h4{margin:0}
.fc button{font:inherit;color:inherit;cursor:pointer}
.fc kbd{font:600 11px/1 system-ui,sans-serif;padding:3px 6px;border-radius:6px;background:var(--ash-sunk);border:1px solid var(--ash-line-2);color:var(--ash-muted)}
.fc .mono{font-variant-numeric:tabular-nums}
.fc .muted{color:var(--ash-muted)}
.fc .faint{color:var(--ash-faint);font-size:12px}
.fc .nowrap{white-space:nowrap}
.fc-sr{position:absolute;left:-9999px}

/* boutons */
.fc-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:10px;border:1px solid var(--ash-line-2);background:#fff;font-weight:600;font-size:13px;line-height:1;white-space:nowrap;min-height:38px}
.fc-btn:hover{background:var(--ash-sunk)}
.fc-btn.pri{background:var(--ash-ink);color:#fff;border-color:var(--ash-ink)}
.fc-btn.pri:hover{background:#000}
.fc-btn.gold{background:var(--ash-gold-2);color:#fff;border-color:var(--ash-gold-2)}
.fc-btn.ghost{border-color:transparent;background:transparent}
.fc-btn.ghost:hover{background:var(--ash-sunk)}
.fc-btn.sm{padding:6px 10px;min-height:30px;font-size:12px;border-radius:8px}
.fc-btn.danger{color:var(--ash-bad)}
.fc-btn[disabled]{opacity:.45;cursor:not-allowed}
.fc-btn svg{width:15px;height:15px;flex:none}
.fc-ibtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--ash-line-2);background:#fff;display:inline-flex;align-items:center;justify-content:center}
.fc-ibtn svg{width:16px;height:16px}
.fc-lnk{background:none;border:0;padding:0;color:var(--ash-gold-ink);text-decoration:underline;text-underline-offset:2px;font-weight:600;font-size:inherit}

/* pastilles */
.fc-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;line-height:1.4;border:1px solid transparent;white-space:nowrap}
.fc-pill i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.fc-pill.ok{background:var(--ash-ok-bg);color:var(--ash-ok)}
.fc-pill.warn{background:var(--ash-warn-bg);color:var(--ash-warn)}
.fc-pill.bad{background:var(--ash-bad-bg);color:var(--ash-bad)}
.fc-pill.info{background:var(--ash-info-bg);color:var(--ash-info)}
.fc-pill.gold{background:var(--ash-gold-bg);color:var(--ash-gold-ink)}
.fc-pill.grey{background:var(--ash-sunk);color:var(--ash-muted)}
.fc-pill.lock{background:#fff;border-color:var(--ash-line-2);color:var(--ash-muted);font-weight:600}

/* en-tête collé */
.fc-head{position:sticky;top:0;z-index:20;background:var(--ash-bg);margin:-20px -24px 0;padding:12px 24px 10px;border-bottom:1px solid var(--ash-line)}
.fc-head .row1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fc-back{display:inline-flex;align-items:center;gap:6px;color:var(--ash-muted);font-weight:600;text-decoration:none;font-size:13px}
.fc-back svg{width:15px;height:15px}
.fc-ref{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.fc-ref h1{font-family:Georgia,"Playfair Display",serif;font-weight:500;font-size:24px;letter-spacing:.01em}
.fc-ref .who{font-size:14px;color:var(--ash-muted)}
.fc-ref .who b{color:var(--ash-ink)}
.fc-nav{display:flex;gap:4px;margin-left:auto}
.fc-head .row2{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.fc-head .row2 .sep{width:1px;height:18px;background:var(--ash-line-2)}
.fc-acts{display:flex;gap:8px;align-items:center;margin-left:auto;position:relative;flex-wrap:wrap}
.fc-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--ash-line-2);border-radius:12px;box-shadow:var(--ash-shadow),0 12px 30px rgba(28,22,13,.12);min-width:280px;padding:6px;z-index:30}
.fc-menu[hidden]{display:none}
.fc-menu .g{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ash-faint);padding:8px 10px 4px;font-weight:700}
.fc-menu button{display:flex;width:100%;text-align:left;gap:10px;align-items:center;padding:9px 10px;border:0;background:none;border-radius:8px;font-size:13px}
.fc-menu button:hover{background:var(--ash-sunk)}
.fc-menu button.danger{color:var(--ash-bad)}
.fc-menu button svg{width:15px;height:15px;color:var(--ash-muted)}
.fc-menu hr{border:0;border-top:1px solid var(--ash-line);margin:6px 0}

/* alertes */
.fc-alerts{display:flex;flex-direction:column;gap:6px;margin:14px 0 0}
.fc-alert{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:12px;border:1px solid;font-size:13px}
.fc-alert svg{width:18px;height:18px;flex:none;margin-top:1px}
.fc-alert b{font-weight:700}
.fc-alert .act{margin-left:auto;flex:none}
.fc-alert.bad{background:var(--ash-bad-bg);border-color:#f0c4bd;color:#6e1f16}
.fc-alert.warn{background:var(--ash-warn-bg);border-color:#ebd3a8;color:#5e3a08}
.fc-alert.gold{background:var(--ash-gold-bg);border-color:#e6d3a3;color:var(--ash-gold-ink)}
.fc-alert.info{background:var(--ash-info-bg);border-color:#c3d2e6;color:#24415f}

/* étapes */
.fc-steps{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:14px}
.fc-card{background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:var(--fc-r);box-shadow:var(--ash-shadow)}
.fc-card>.ch{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--ash-line)}
.fc-card>.ch h2,.fc-card>.ch h3{font-size:14px;font-weight:700;letter-spacing:.01em}
.fc-card>.ch .grow{flex:1}
.fc-card>.cb{padding:14px 16px}
.fc-card>.ch svg{width:16px;height:16px;color:var(--ash-muted)}
.fc-timeline{display:flex;gap:0;padding:14px 16px 10px;overflow-x:auto}
.fc-timeline li{list-style:none;flex:1;min-width:110px;position:relative;text-align:center;padding-top:26px;font-size:12px;color:var(--ash-faint)}
.fc-timeline li::before{content:"";position:absolute;left:0;right:0;top:9px;height:2px;background:var(--ash-line-2)}
.fc-timeline li:first-child::before{left:50%}.fc-timeline li:last-child::before{right:50%}
.fc-timeline li::after{content:"";position:absolute;left:50%;top:3px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#fff;border:2px solid var(--ash-line-2)}
.fc-timeline li.done{color:var(--ash-muted)}
.fc-timeline li.done::before,.fc-timeline li.done::after{background:var(--ash-ok);border-color:var(--ash-ok)}
.fc-timeline li.now{color:var(--ash-ink);font-weight:700}
.fc-timeline li.now::after{background:var(--ash-gold);border-color:var(--ash-gold);box-shadow:0 0 0 4px var(--ash-gold-bg)}
.fc-timeline li small{display:block;font-weight:400;color:var(--ash-faint);margin-top:2px}
.fc-deadline{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--ash-line);flex-wrap:wrap}
.fc-deadline .big{font-size:15px;font-weight:700}
.fc-deadline .ok{color:var(--ash-ok)}.fc-deadline .warn{color:var(--ash-warn)}.fc-deadline .bad{color:var(--ash-bad)}
.fc-chk{list-style:none;margin:0;padding:0}
.fc-chk li{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--ash-line)}
.fc-chk li:last-child{border-bottom:0}
.fc-chk button{width:24px;height:24px;border-radius:7px;border:2px solid var(--ash-line-2);background:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}
.fc-chk button svg{width:14px;height:14px;opacity:0}
.fc-chk li.on button{background:var(--ash-ok);border-color:var(--ash-ok);color:#fff}
.fc-chk li.on button svg{opacity:1}
.fc-chk li.on span{color:var(--ash-muted);text-decoration:line-through}
.fc-chk li small{margin-left:auto;color:var(--ash-faint);font-size:11px}
.fc-next{margin-top:12px;padding-top:12px;border-top:1px solid var(--ash-line);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.fc-next .lead{font-weight:700}
.fc-confirm{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 12px;border-radius:10px;background:var(--ash-gold-bg);border:1px solid #e6d3a3;font-size:13px;width:100%}
.fc-confirm input{flex:1;min-width:160px;padding:8px 10px;border-radius:8px;border:1px solid var(--ash-line-2);font:inherit}

/* raccourcis internes */
.fc-jump{position:sticky;top:96px;z-index:10;display:flex;gap:4px;margin:14px 0 0;padding:6px;background:var(--ash-surface);border:1px solid var(--ash-line);border-radius:12px;overflow-x:auto;scrollbar-width:none}
.fc-jump a{text-decoration:none;color:var(--ash-muted);font-weight:600;font-size:13px;padding:7px 12px;border-radius:8px;white-space:nowrap}
.fc-jump a.on,.fc-jump a:hover{background:var(--ash-sunk);color:var(--ash-ink)}
.fc-jump a b{display:inline-block;min-width:18px;height:18px;line-height:18px;border-radius:9px;background:var(--ash-bad);color:#fff;font-size:11px;text-align:center;margin-left:4px}

/* colonnes */
.fc-cols{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;margin-top:14px;align-items:start}
.fc-main,.fc-side{display:flex;flex-direction:column;gap:14px;min-width:0}
.fc-side .fc-card>.cb{padding:12px 14px}
.fc-side h3{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ash-faint)}
.fc-side .fc-card>.ch{padding:10px 14px}
.fc-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px}
.fc-kv dt{color:var(--ash-muted)}
.fc-kv dd{margin:0;font-weight:600;overflow-wrap:anywhere}
.fc-kv dd.money{text-align:right;font-variant-numeric:tabular-nums}
.fc-addr{line-height:1.5;font-size:13px}
.fc-addr b{display:block}
.fc-copy{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--ash-muted);border:1px solid var(--ash-line-2);background:#fff;border-radius:6px;padding:2px 7px;vertical-align:middle;margin-left:6px}
.fc-copy svg{width:11px;height:11px}
.fc-mode{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--ash-sunk);font-weight:600}
.fc-mode .ic{width:34px;height:34px;border-radius:9px;background:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}
.fc-mode .ic svg{width:18px;height:18px}
.fc-mode small{display:block;font-weight:500;color:var(--ash-muted)}
.fc-mode.bad{background:var(--ash-bad-bg);color:var(--ash-bad)}
.fc-flags{display:flex;flex-wrap:wrap;gap:6px}
.fc-flags button{border:1px solid var(--ash-line-2);background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--ash-muted)}
.fc-flags button.on{background:var(--ash-gold-bg);border-color:#e6d3a3;color:var(--ash-gold-ink)}
.fc-note{width:100%;min-height:72px;border:1px dashed var(--ash-line-2);border-radius:10px;padding:10px;font:inherit;background:#fffdf8;resize:vertical}
.fc-money{width:100%;border-collapse:collapse;font-size:13px}
.fc-money td{padding:5px 0;border-bottom:1px dashed var(--ash-line)}
.fc-money td:last-child{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.fc-money tr.tot td{border-bottom:0;font-weight:800;font-size:15px;padding-top:8px}
.fc-money tr.neg td:last-child{color:var(--ash-ok)}
.fc-gain{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--ash-ok-bg);color:var(--ash-ok);font-weight:700;margin-top:10px}
.fc-gain small{display:block;font-weight:500;color:#3d6b4b;font-size:11px}
.fc-gain b{font-size:18px;white-space:nowrap;font-variant-numeric:tabular-nums}

/* articles */
.fc-art{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;padding:14px 16px;border-bottom:1px solid var(--ash-line)}
.fc-art:last-child{border-bottom:0}
.fc-art img{width:96px;height:96px;border-radius:10px;object-fit:cover;border:1px solid var(--ash-line)}
.fc-art .nm{font-weight:700;font-size:15px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fc-art .nm .q{display:inline-flex;min-width:26px;height:24px;padding:0 7px;align-items:center;justify-content:center;border-radius:7px;background:var(--ash-ink);color:#fff;font-size:12px}
.fc-var{display:inline-block;padding:2px 8px;border-radius:7px;background:var(--ash-gold-bg);color:var(--ash-gold-ink);font-size:12px;font-weight:700}
.fc-var.bad{background:var(--ash-bad-bg);color:var(--ash-bad)}
.fc-art .price{font-variant-numeric:tabular-nums;font-weight:700;text-align:right;white-space:nowrap}
.fc-art .price small{display:block;color:var(--ash-faint);font-weight:500;font-size:11px}
.fc-faces{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:10px}
.fc-face{border:1px solid var(--ash-line);border-radius:10px;padding:10px 12px;background:#fffdf8}
.fc-face h4{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash-gold-ink);margin-bottom:6px;display:flex;gap:8px;align-items:center}
.fc-face h4 .n{display:inline-flex;width:18px;height:18px;border-radius:50%;background:var(--ash-gold-2);color:#fff;font-size:11px;align-items:center;justify-content:center}
.fc-face .big{font-family:Georgia,"Playfair Display",serif;font-size:22px;line-height:1.15;margin:2px 0 6px;overflow-wrap:anywhere}
.fc-face .big.script{font-family:"Great Vibes","Allura",cursive;font-size:26px}
.fc-face dl{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px;margin:0}
.fc-face dt{color:var(--ash-muted)}.fc-face dd{margin:0;font-weight:600}
.fc-face.empty{background:var(--ash-sunk);color:var(--ash-muted);font-style:italic}
.fc-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
.fc-sold{margin-top:10px;padding:8px 12px;border-radius:10px;background:var(--ash-warn-bg);border:1px solid #ebd3a8;font-size:13px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.fc-sold b{color:var(--ash-warn)}
.fc-sold img{width:34px;height:34px;border-radius:7px;object-fit:cover;border:1px solid #ebd3a8}
.fc-apercu{display:grid;grid-template-columns:120px 1fr;gap:12px;margin-top:10px;padding:10px;border-radius:10px;border:1px solid var(--ash-line);background:#fff}
.fc-apercu .vis{position:relative;width:120px;height:120px;border-radius:8px;overflow:hidden;background:#fff}
.fc-apercu .vis img{width:100%;height:100%;object-fit:cover}
.fc-apercu .vis span{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-family:"Great Vibes","Allura",cursive;font-size:22px;color:#777;text-shadow:0 0 1px #fff}
.fc-apercu .lines{font-size:12px;color:var(--ash-muted)}
.fc-apercu .lines b{display:block;color:var(--ash-ink);margin-bottom:4px}
.fc-apercu .lines ol{margin:0;padding-left:18px}
.fc-sub{font-size:12px;color:var(--ash-muted);margin-top:6px}
.fc-rate{margin-top:8px;padding:8px 12px;border-radius:10px;background:var(--ash-bad-bg);font-size:12px;color:var(--ash-bad)}

/* conditionnement */
.fc-kit{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.fc-kit label{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--ash-line);border-radius:10px;cursor:pointer;font-size:12px;position:relative}
.fc-kit label.on{border-color:var(--ash-gold-2);background:var(--ash-gold-bg)}
.fc-kit img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#fff}
.fc-kit input{position:absolute;right:10px;top:10px}
.fc-kit b{font-weight:700}
.fc-kit small{color:var(--ash-muted)}
.fc-calc{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:12px}
.fc-calc div{padding:8px 10px;border-radius:10px;background:var(--ash-sunk);font-size:12px;color:var(--ash-muted)}
.fc-calc div b{display:block;font-size:15px;color:var(--ash-ink);font-variant-numeric:tabular-nums}
.fc-calc div.ok b{color:var(--ash-ok)}
.fc-boxtal{font-size:13px}
.fc-boxtal dl{display:grid;grid-template-columns:auto 1fr auto;gap:6px 10px;align-items:center;margin:0}
.fc-boxtal dt{color:var(--ash-muted)}.fc-boxtal dd{margin:0;font-weight:600}
.fc-boxtal .fc-copy{margin:0}

/* messages */
.fc-msgs{display:flex;flex-direction:column;gap:10px}
.fc-day{text-align:center;font-size:11px;color:var(--ash-faint);text-transform:uppercase;letter-spacing:.06em;margin:4px 0}
.fc-msg{max-width:78%;padding:10px 12px;border-radius:12px 12px 12px 4px;background:var(--ash-sunk);font-size:13px;line-height:1.5}
.fc-msg small{display:block;color:var(--ash-faint);font-size:11px;margin-bottom:3px}
.fc-msg.me{align-self:flex-end;background:#f6ecd4;border-radius:12px 12px 4px 12px}
.fc-msg.doc{background:#fff;border:1px solid var(--ash-line)}
.fc-msg img{width:120px;border-radius:8px;display:block;margin-top:6px;border:1px solid var(--ash-line)}
.fc-msg .tag{display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px;background:var(--ash-info-bg);color:var(--ash-info);margin-right:4px;vertical-align:middle}
.fc-write{margin-top:12px;border-top:1px solid var(--ash-line);padding-top:12px}
.fc-write textarea{width:100%;min-height:76px;border:1px solid var(--ash-line-2);border-radius:10px;padding:10px;font:inherit;resize:vertical}
.fc-write .fc-row{margin-top:8px}
.fc-draft{padding:10px 12px;border-radius:10px;border:1px solid #c3d2e6;background:var(--ash-info-bg);font-size:13px;margin-bottom:10px}
.fc-draft b{display:block;margin-bottom:4px;color:var(--ash-info)}

/* historique */
.fc-tl{list-style:none;margin:0;padding:0 0 0 18px;border-left:2px solid var(--ash-line-2)}
.fc-tl li{position:relative;padding:0 0 12px 14px;font-size:13px}
.fc-tl li::before{content:"";position:absolute;left:-24px;top:5px;width:10px;height:10px;border-radius:50%;background:#fff;border:2px solid var(--ash-line-2)}
.fc-tl li.ok::before{background:var(--ash-ok);border-color:var(--ash-ok)}
.fc-tl li.gold::before{background:var(--ash-gold);border-color:var(--ash-gold)}
.fc-tl li.bad::before{background:var(--ash-bad);border-color:var(--ash-bad)}
.fc-tl li small{display:block;color:var(--ash-faint);font-size:11px}
.fc-tl li.note{background:#fffdf8;border:1px dashed var(--ash-line-2);border-radius:8px;padding:8px 10px;margin-left:-4px}
.fc-tl li.note::before{left:-28px;background:var(--ash-gold-bg);border-color:var(--ash-gold)}
.fc-tl-write{display:flex;gap:8px;margin-top:6px}
.fc-tl-write input{flex:1;padding:8px 10px;border-radius:9px;border:1px solid var(--ash-line-2);font:inherit}

/* détails repliés (jamais pour une info critique) */
.fc details{border:1px solid var(--ash-line);border-radius:10px;padding:0;background:#fff}
.fc details summary{cursor:pointer;padding:9px 12px;font-weight:600;font-size:13px;color:var(--ash-muted);list-style:none;display:flex;align-items:center;gap:8px}
.fc details summary::before{content:"▸";font-size:11px}
.fc details[open] summary::before{content:"▾"}
.fc details .in{padding:0 12px 12px;font-size:13px}
.fc pre{font-size:11px;white-space:pre-wrap;background:var(--ash-sunk);border-radius:8px;padding:10px;margin:0;overflow-wrap:anywhere}

.fc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:var(--ash-ink);color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;opacity:0;transition:.2s;z-index:60;pointer-events:none;white-space:nowrap;max-width:92vw}
.fc-toast.on{opacity:1;transform:translateX(-50%)}
.fc-bottom{display:none}
.fc-src{margin-top:24px}
.fc-src table{width:100%;border-collapse:collapse;font-size:13px}
.fc-src td,.fc-src th{text-align:left;padding:7px 8px;border-bottom:1px solid var(--ash-line);vertical-align:top}
.fc-src th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ash-faint)}

@media (max-width:1100px){.fc-cols{grid-template-columns:minmax(0,1fr) 300px}}
@media (max-width:900px){
  .fc-head{margin:-14px -12px 0;padding:10px 12px 8px;position:static}
  .fc-btn{white-space:normal;text-align:left}
  .fc-acts{margin-left:0;width:100%}
  .fc-cols{grid-template-columns:1fr}
  .fc-steps{grid-template-columns:1fr}
  .fc-jump{top:0;position:static}
  .fc-art{grid-template-columns:72px minmax(0,1fr)}
  .fc-art img{width:72px;height:72px}
  .fc-art .price{grid-column:2;text-align:left}
  .fc-art .price small{display:inline;margin-left:6px}
  .fc-apercu{grid-template-columns:96px 1fr}.fc-apercu .vis{width:96px;height:96px}
  .fc-head .row1 .fc-nav{display:none}
  .fc-acts .fc-btn.hidem{display:none}
  .fc-bottom{display:flex;position:fixed;left:0;right:0;bottom:calc(60px + env(safe-area-inset-bottom));padding:10px 12px;background:#fff;border-top:1px solid var(--ash-line-2);gap:8px;z-index:25;box-shadow:0 -6px 20px rgba(28,22,13,.08)}
  .fc-bottom .fc-btn{flex:1;justify-content:center}
  .fc{padding-bottom:70px}
  .fc-msg{max-width:92%}
}
@media (max-width:480px){.fc-ref h1{font-size:20px}.fc-kit{grid-template-columns:repeat(2,1fr)}}
"""

ICONS = {
  "back": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  "next": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  "check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  "truck": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  "print": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>',
  "more": '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  "bolt": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  "alert": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  "gift": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>',
  "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M22 6l-10 7L2 6"/></svg>',
  "copy": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  "box": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>',
  "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  "home": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  "user": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  "card": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>',
  "pen": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  "tag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8z"/><path d="M7 7h.01"/></svg>',
  "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  "x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  "dl": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  "img": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  "undo": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-15-6.7L3 13"/></svg>',
  "spark": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>',
  "flag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>',
  "search": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  "orders": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l3 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/><path d="M3 8h18M16 12a4 4 0 01-8 0"/></svg>',
  "sun": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  "shop": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5M3 9h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22v-6h6v6"/></svg>',
  "chart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3v18h18M7 14l4-4 4 4 5-6"/></svg>',
  "set": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  "mega": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-7v16L3 13z"/><path d="M7 13v5a2 2 0 002 2h1"/></svg>',
  "coin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9.5a3 3 0 00-6 0c0 3 6 2 6 5a3 3 0 01-6 0M12 6v1.5M12 16.5V18"/></svg>',
  "tree": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l5 7h-3l4 6h-4l3 5H7l3-5H6l4-6H7z"/><path d="M12 20v2"/></svg>',
  "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg>',
}
def I(n): return ICONS[n]

NAV = [("sun", "Aujourd'hui"), ("orders", "Commandes", True), ("mail", "Messages"), ("user", "Clients"), ("tag", "Catalogue"), ("box", "Stock & achats"), ("mega", "Marketing"), ("coin", "Finances"), ("set", "Réglages"), ("tree", "Fêtes")]
BADGE = '<span class="ash-badge">3</span>'
nav_html = "".join(f'<a class="ash-item{" on" if len(x) > 2 else ""}" href="#">{I(x[0])}<span class="ash-txt">{x[1]}</span>{BADGE if len(x) > 2 else ""}</a>' for x in NAV)

# ------------------------------------------------------------------ données d'EXEMPLE (3 commandes) ----
import json
ORDERS = [
  dict(ref="3K7QX2LM", st="prep", nom="Camille Durand", email="camille.durand@exemple.fr", tel="06 12 34 56 78", date="mar. 3 nov. 2026, 18 h 42", total=96.61, sub=93.51, remise=0, cagnotte=0, livr="Express Chronopost", livrPrix=14.90, mode="express",
       adr=["Camille Durand", "12 rue des Lilas", "Appartement 3", "69003 Lyon", "France"], pays="FR", relais="", nCmd=2, cashback=4.83, promo="",
       limite=dict(txt="mar. 10 nov.", cal="dim. 8 nov.", reste="encore 4 j ouvrés", cls="ok", ecoule="1 j ouvré · 1 j calendaire"), immediate=True,
       alerts=[("bad", "bolt", "<b>Express Chronopost payé (14,90 €)</b> — à graver EN PRIORITÉ : engagement 24 / 48 h après la confection.", ""),
               ("info", "mail", "<b>Nouvelle réponse de Camille</b> (il y a 2 h) : elle renvoie sa photo en meilleure qualité. Une réponse est préparée par l'assistant.", "Voir le message"),
               ("gold", "gift", "<b>Cadeau promis à cette cliente</b> — code GRAVURE-A7K2 (e-mail du 20/09) : glisser un cadeau surprise dans le colis.", "")],
       items=[
         dict(img="vin", ap="vinv", q=1, nom="Verre à vin gravé", var="36 cl · Lot de 2", warn=False, prix=39.90, base="33,90 € le lot + gravure 6 €", lot=True,
              faces=[("Verre 1 / 2 — face avant", "big", "Camille", [("Modèle", "n° 10 (banderole, prénom + date)"), ("Date", "12.06.2026 (+3 €)"), ("Écriture", "celle du modèle"), ("Où", "centré, 3,5 cm de haut")]),
                     ("Verre 2 / 2 — face avant", "script", "Paul", [("Mode", "texte seul"), ("Écriture", "Great Vibes"), ("Taille", "≈ 1,5 cm"), ("Où", "centré sur la coupe")])],
              sold=[("sac", "Rien de plus")], photo=False, apercu=True, lignes=["Camille", "12.06.2026"]),
         dict(img="coeur", q=1, nom="Collier Cœur gravé", var="Doré", warn=False, prix=28.41, base="22,41 € + 2 faces × 3 €",
              faces=[("Recto", "script", "Léa", [("Écriture", "Allura"), ("Sens", "horizontal, centré")]), ("Verso", "big", "12.06.2026", [("Écriture", "Playfair"), ("Sens", "horizontal, centré")])],
              sold=[("boitec", "Boîte cadeau carrée · 3,90 €"), ("sac", "Sac de Noël à anses · 4,90 €")], photo=False, apercu=True, lignes=["Léa"]),
       ],
       kit=["carton", "chips", "fragile", "boitec"], chk=[False, False, False, False, False],
       msgs=[("3 nov.", "me", "Niv Création · 19 h 02", "Bonjour Camille, merci pour votre commande. Nous gravons à partir de la photo reçue sur la fiche. Belle soirée.", None),
             ("Aujourd'hui", "", "Camille · 9 h 14 · par le bouton Répondre", "Bonjour, je vous renvoie la photo en meilleure qualité pour la gravure du verre 2. Merci !", "vinv")],
       draft="Bonjour Camille, merci pour votre photo, elle est bien nette : c'est celle-ci que nous utiliserons pour la gravure du verre 2.",
       hist=[("ok", "Payée par carte (Stripe) · 96,61 €", "mar. 3 nov., 18 h 42"), ("ok", "E-mail de confirmation envoyé à la cliente", "18 h 42"), ("ok", "Alerte 🛎️ reçue à l'atelier", "18 h 42"),
             ("gold", "Photo relue : aucune date dans l'image", "18 h 43"), ("", "Camille a répondu par le bouton « Répondre » (photo jointe)", "aujourd'hui, 9 h 14"), ("", "Réponse préparée par l'assistant, à valider", "9 h 15")],
       boxtal=dict(l="25 × 20 × 15 cm", poids="1 150 g", valeur="96,61 €", desc="Verres gravés et bijou"), gain=dict(enc=96.61, cout=14.12, mat=1.88, etiq=14.90, rate=0)),
  dict(ref="3G2NR6BE", st="grav", nom="Paul Mercier", email="paul.mercier@exemple.be", tel="+32 470 12 34 56", date="dim. 1 nov. 2026, 11 h 05", total=98.70, sub=79.80, remise=0, cagnotte=0, livr="Point relais Mondial Relay", livrPrix=18.90, mode="relais",
       adr=["Paul Mercier", "Rue de la Gare 8", "", "1300 Wavre", "Belgique"], pays="BE", relais="Mondial Relay n° 2411 — Librairie du Centre, rue de Nivelles 14, 1300 Wavre (Belgique)", nCmd=1, cashback=3.99, promo="",
       limite=dict(txt="ven. 6 nov.", cal="ven. 6 nov.", reste="encore 2 j ouvrés", cls="warn", ecoule="3 j ouvrés · 3 j calendaires"), immediate=False,
       alerts=[("bad", "flag", "<b>À ENVOYER EN BELGIQUE</b> — hors de France : étiquette internationale, pas un timbre France.", ""),
               ("warn", "img", "<b>Date dans l'image</b> — la photo du cristal contient « 14.02.2024 » et la case n'a pas été cochée : à regarder avant de graver.", "Voir la photo")],
       items=[dict(img="cristal", q=1, nom="Cristal Photo 3D — vertical", var="Moyen 6 × 9 cm", warn=False, prix=79.80, base="59,90 € + socle LED 19,90 €",
              faces=[("Photo 3D", "big", "Couple, photo envoyée", [("Place du texte", "en bas"), ("Texte", "Paul & Marie (+5 €)"), ("Écriture", "Playfair")])],
              sold=[("sac", "Socle LED grand (noir, multicolore) · 19,90 €")], photo=True, apercu=False, lignes=[])],
       kit=["carton", "chips", "fragile"], chk=[True, False, False, False, False],
       msgs=[("1 nov.", "me", "Niv Création · 11 h 40", "Bonjour Paul, merci pour votre commande. Votre photo est bien reçue, nous la préparons pour la gravure 3D.", None)],
       draft="",
       hist=[("ok", "Payée par carte (Stripe) · 98,70 €", "dim. 1 nov., 11 h 05"), ("ok", "E-mail de confirmation envoyé", "11 h 05"), ("bad", "Photo relue : une date trouvée dans l'image (14.02.2024), case non cochée", "11 h 06"), ("gold", "Passée « En fabrication »", "lun. 2 nov., 9 h 30"), ("", "Liste de contrôle : « Gravée » cochée", "mar. 3 nov., 16 h 10")],
       boxtal=dict(l="25 × 20 × 15 cm", poids="1 350 g", valeur="98,70 €", desc="Bloc de verre gravé + socle"), gain=dict(enc=98.70, cout=27.70, mat=1.88, etiq=12.40, rate=0)),
  dict(ref="3D4HS2KW", st="exp", nom="Inès Martin", email="ines.martin@exemple.fr", tel="07 98 76 54 32", date="jeu. 29 oct. 2026, 20 h 15", total=27.81, sub=30.90, remise=3.09, cagnotte=0, livr="Lettre suivie — offerte (code BIENVENUE10)", livrPrix=0, mode="lettre",
       adr=["Inès Martin", "5 avenue Victor Hugo", "", "33000 Bordeaux", "France"], pays="FR", relais="", nCmd=1, cashback=1.39, promo="BIENVENUE10",
       limite=dict(txt="jeu. 5 nov.", cal="mar. 3 nov.", reste="expédiée en 2 j ouvrés · dans les temps", cls="ok", ecoule="2 j ouvrés · 3 j calendaires"), immediate=False,
       alerts=[], tracking="1A01234567890",
       items=[dict(img="gourm", q=1, nom="Bracelet gourmette à plaque gravée", var="Noir", warn=False, prix=30.81, base="27,81 € + plaque 3 €",
              faces=[("Plaque", "big", "THOMAS", [("Écriture", "Cinzel"), ("Sens", "horizontal, centré")])], sold=[("boitec", "Boîte allongée · 3,90 €")], photo=False, apercu=True, lignes=["THOMAS"])],
       kit=["bulles", "boitec"], chk=[True, True, True, True, True],
       msgs=[("30 oct.", "me", "Niv Création · 10 h 02", "Bonjour Inès, votre bracelet est gravé et part aujourd'hui en lettre suivie. Vous recevrez le numéro de suivi par e-mail.", None)],
       draft="",
       hist=[("ok", "Payée par carte (Stripe) · 27,81 € — code BIENVENUE10 (−3,09 €)", "jeu. 29 oct., 20 h 15"), ("gold", "Passée « En fabrication »", "ven. 30 oct., 8 h 50"), ("ok", "Liste de contrôle : 5 / 5", "ven. 30 oct., 9 h 58"), ("ok", "Expédiée — suivi La Poste 1A01234567890, cliente prévenue par e-mail", "ven. 30 oct., 10 h 02"), ("", "Note : « Boîte allongée, lettre suivie La Poste »", "10 h 03")],
       boxtal=dict(l="lettre suivie", poids="152 g", valeur="27,81 €", desc="Bijou en boîte"), gain=dict(enc=27.81, cout=6.40, mat=1.21, etiq=4.45, rate=0)),
]

for o in ORDERS:
    for it in o["items"]:
        it["img"] = IMG[it["img"]]
        if it.get("ap"): it["ap"] = IMG[it["ap"]]
        it["sold"] = [(IMG[a], b) for a, b in it["sold"]]
    o["msgs"] = [(d, me, w, t, IMG[im] if im else None) for d, me, w, t, im in o["msgs"]]
KIT = {"carton": ("Carton 25 × 20 × 15", "1,12 €", IMG["carton"]), "chips": ("Chips de calage ≈ 2 L", "0,71 €", IMG["chips"]), "fragile": ("Étiquette FRAGILE", "0,05 €", IMG["fragile"]), "boitec": ("Boîte cadeau carrée", "0,97 €", IMG["boitec"]), "sac": ("Sac cadeau", "1,00 €", IMG["sac"]), "bulles": ("Enveloppe à bulles 25 × 20", "0,26 €", IMG["bulles"])}

JS = r"""
const ORDERS = %ORDERS%; const KIT = %KIT%; const ICON = %ICONS%;
const I = (n) => ICON[n] || "";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const eur = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const STEPS = [["pay", "Payée"], ["prep", "À préparer"], ["grav", "En fabrication"], ["exp", "Expédiée"], ["liv", "Livrée"]];
const STNOW = { prep: 1, grav: 2, exp: 3, liv: 4 };
const CHK = ["Gravée", "Contrôlée (comparée à l'aperçu de la cliente)", "Emballée (matériel coché)", "Étiquette imprimée", "Expédiée, suivi saisi"];
const FLAGS = [["urgent", "🚨 Urgent"], ["attend", "⏳ Accepte d'attendre"], ["cadeau", "🎁 Cadeau promis"], ["gravure_offerte", "🎨 Gravure offerte"], ["attente_client", "❓ En attente du client"], ["appel", "📞 À rappeler"]];
const state = { i: 0, confirm: "", menu: false, flags: { 0: ["cadeau"], 1: [], 2: [] }, notes: { 0: "Photo du verre 2 : prendre celle renvoyée le 4/11 (plus nette).", 1: "", 2: "Boîte allongée, lettre suivie La Poste" }, kit: {}, edit: false, histNotes: { 0: [], 1: [], 2: [] } };
ORDERS.forEach((o, i) => state.kit[i] = new Set(o.kit));
let toastT;
function toast(t) { const el = document.getElementById("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2200); }

function pills(o) {
  const pay = `<span class="fc-pill ok">${I("check")} Payée · Stripe</span>`;
  const fab = o.st === "prep" ? `<span class="fc-pill warn"><i></i> À préparer</span>` : o.st === "grav" ? `<span class="fc-pill gold"><i></i> En fabrication</span>` : `<span class="fc-pill ok">${I("check")} Fabriquée</span>`;
  const env = o.st === "exp" ? `<span class="fc-pill info">${I("truck")} Expédiée · suivi ${o.tracking}</span>` : o.st === "liv" ? `<span class="fc-pill ok">${I("check")} Livrée</span>` : `<span class="fc-pill grey">${I("truck")} Pas encore expédiée</span>`;
  const lock = o.st === "prep" ? `<span class="fc-pill lock">${I("clock")} Annulable par la cliente (encore 5 h)</span>` : `<span class="fc-pill lock">🔒 Verrouillée — fabrication lancée</span>`;
  return pay + fab + env + lock + (o.immediate ? `<span class="fc-pill bad">${I("bolt")} Fabrication immédiate</span>` : "");
}
function modeBlock(o) {
  const m = { express: ["bolt", "Express Chronopost — 24 / 48 h", "Chrono 18 sur Boxtal · " + eur(o.livrPrix) + " payés"], relais: ["pin", "Point relais Mondial Relay", "Étiquette Mondial Relay sur Boxtal · " + eur(o.livrPrix) + " payés"], lettre: ["mail", "Lettre suivie La Poste", "Étiquette d'adresse 45 × 45 · offerte"], home: ["home", "Livraison à domicile", eur(o.livrPrix)] }[o.mode];
  return `<div class="fc-mode ${o.mode === "express" ? "bad" : ""}"><span class="ic">${I(m[0])}</span><span>${m[1]}<small>${m[2]}</small></span></div>`;
}
function render() {
  const i = state.i, o = ORDERS[i], now = STNOW[o.st];
  const prev = ORDERS[i - 1], next = ORDERS[i + 1];
  const chk = o.chk, done = chk.filter(Boolean).length;
  const flags = state.flags[i];
  const primary = o.st === "prep" ? ["pen", "Commencer la fabrication", "grav"] : o.st === "grav" ? ["truck", "Expédier avec un n° de suivi", "exp"] : o.st === "exp" ? ["check", "Marquer livrée", "liv"] : null;
  const confirmBox = state.confirm === "grav" ? `<div class="fc-confirm">Passer <b>${o.ref}</b> en fabrication ? La cliente ne pourra plus annuler.<button class="fc-btn sm pri" data-ok="grav">Oui, je commence</button><button class="fc-btn sm" data-no>Non</button></div>`
    : state.confirm === "exp" ? `<div class="fc-confirm">${I("truck")} N° de suivi <input id="trk" placeholder="ex. 1A01234567890 ou 74550444" autocomplete="off"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked> prévenir la cliente par e-mail</label><button class="fc-btn sm pri" data-ok="exp">Expédiée</button><button class="fc-btn sm" data-no>Annuler</button></div>`
    : state.confirm === "liv" ? `<div class="fc-confirm">Marquer <b>${o.ref}</b> livrée ? <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked> envoyer la demande d'avis</label><button class="fc-btn sm pri" data-ok="liv">Oui, livrée</button><button class="fc-btn sm" data-no>Non</button></div>`
    : state.confirm === "cancel" ? `<div class="fc-confirm" style="background:var(--ash-bad-bg);border-color:#f0c4bd">Annuler la commande <b>${o.ref}</b> ? Le stock est rendu, la cagnotte reprise. <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" checked> prévenir la cliente</label><button class="fc-btn sm danger" data-ok="cancel">Oui, annuler la commande</button><button class="fc-btn sm" data-no>Non</button></div>`
    : state.confirm === "refund" ? `<div class="fc-confirm" style="background:var(--ash-bad-bg);border-color:#f0c4bd">Rembourser <b>${eur(o.total)}</b> par Stripe ? ${o.st === "prep" ? "Intégral possible (fabrication pas lancée)." : "Fabrication lancée : pièce personnalisée, remboursement seulement si vous le décidez."} <button class="fc-btn sm danger" data-ok="refund">Rembourser</button><button class="fc-btn sm" data-no>Non</button></div>` : "";
  const menu = `<div class="fc-menu" ${state.menu ? "" : "hidden"} id="menu">
    <div class="g">Documents</div>
    <button data-t="Fiche atelier envoyée à l'impression (1 page A4)">${I("print")} Imprimer la fiche atelier</button>
    <button data-t="Étiquettes d'adresse : commande cochée">${I("tag")} Étiquette d'adresse La Poste</button>
    <button data-t="Champs Boxtal copiés dans l'ordre">${I("copy")} Copier pour Boxtal</button>
    <div class="g">Commande</div>
    ${o.st !== "prep" ? `<button data-t="Remise « À préparer »">${I("undo")} Remettre à préparer</button>` : ""}
    ${o.st === "exp" ? `<button data-t="Suivi modifié">${I("truck")} Modifier le n° de suivi</button>` : ""}
    <button data-t="Remise en main propre notée">🤝 Remise en main propre</button>
    <button data-t="Marquée comme commande test">🧪 Marquer comme test</button>
    <hr>
    <div class="g">Argent — avec confirmation</div>
    <button class="danger" data-confirm="refund">${I("undo")} Rembourser…</button>
    <button class="danger" data-confirm="cancel">${I("x")} Annuler la commande…</button>
    <button class="danger" data-t="Suppression refusée dans la maquette">🗑 Supprimer…</button>
  </div>`;
  const head = `<div class="fc-head"><div class="row1">
      <a class="fc-back" href="#">${I("back")} Commandes</a>
      <div class="fc-ref"><h1>${o.ref}</h1><button class="fc-copy" data-copy="${o.ref}">${I("copy")} copier</button><span class="who"><b>${esc(o.nom)}</b> · ${o.date} · ${eur(o.total)}</span></div>
      <div class="fc-nav"><button class="fc-ibtn" data-go="${i - 1}" ${prev ? "" : "disabled"} title="Commande précédente (K)">${I("back")}</button><button class="fc-ibtn" data-go="${i + 1}" ${next ? "" : "disabled"} title="Commande suivante (J)">${I("next")}</button></div>
    </div>
    <div class="row2">${pills(o)}
      <div class="fc-acts">${primary ? `<button class="fc-btn pri" data-confirm="${primary[2]}">${I(primary[0])} ${primary[1]}</button>` : `<span class="fc-pill ok">${I("check")} Terminée</span>`}
        <button class="fc-btn hidem" data-t="Fiche atelier envoyée à l'impression (1 page A4)">${I("print")} Imprimer</button>
        <button class="fc-btn" data-menu>${I("more")} Plus d'actions</button>${menu}</div>
    </div>${confirmBox ? `<div style="margin-top:8px">${confirmBox}</div>` : ""}</div>`;
  const alerts = o.alerts.length ? `<div class="fc-alerts">${o.alerts.map(([c, ic, t, a]) => `<div class="fc-alert ${c}">${I(ic)}<span>${t}</span>${a ? `<button class="fc-btn sm act" data-jump="${a.includes("message") ? "messages" : "articles"}">${a}</button>` : ""}</div>`).join("")}</div>` : "";
  const steps = `<div class="fc-steps">
    <div class="fc-card"><div class="ch">${I("clock")}<h2>Où en est la commande</h2><span class="grow"></span><span class="faint">Payée → Livrée</span></div>
      <ol class="fc-timeline">${STEPS.map(([k, l], n) => `<li class="${n < now ? "done" : n === now ? "now" : ""}">${l}<small>${n < now ? ["3 nov.", "3 nov.", "2 nov.", "30 oct.", ""][n] || "" : n === now ? "maintenant" : ""}</small></li>`).join("")}</ol>
      <div class="fc-deadline">${I("flag")}<span>À expédier au plus tard : <b class="big ${o.limite.cls}">${o.limite.txt}</b> <span class="faint">(jours ouvrés)</span> · ${o.limite.cal} <span class="faint">(calendaires)</span></span><span class="faint" style="margin-left:auto">${o.limite.reste} · écoulés : ${o.limite.ecoule}</span></div>
    </div>
    <div class="fc-card"><div class="ch">${I("check")}<h2>Ce qu'il reste à faire</h2><span class="grow"></span><span class="faint">${done} / 5</span></div>
      <div class="cb"><ul class="fc-chk">${CHK.map((c, n) => `<li class="${chk[n] ? "on" : ""}"><button data-chk="${n}" aria-label="${c}">${I("check")}</button><span>${c}</span>${chk[n] ? `<small>fait</small>` : ""}</li>`).join("")}</ul>
      <div class="fc-next">${primary ? `<span class="lead">Prochaine étape :</span><button class="fc-btn pri" data-confirm="${primary[2]}">${I(primary[0])} ${primary[1]}</button>` : `<span class="lead">Commande terminée.</span><button class="fc-btn" data-t="Demande d'avis envoyée par e-mail">${I("mail")} Demander un avis</button>`}</div></div>
    </div></div>`;
  const jump = `<nav class="fc-jump" id="jump">${[["articles", "À graver"], ["envoi", "Emballage & envoi"], ["messages", "Messages" + (i === 0 ? "<b>1</b>" : "")], ["histo", "Historique"], ["cliente", "Cliente"], ["argent", "Argent"]].map(([k, l], n) => `<a href="#fc-${k}" class="${n === 0 ? "on" : ""}">${l}</a>`).join("")}</nav>`;
  const faceHtml = (f) => `<div class="fc-face"><h4>${f[0]}</h4><div class="big ${f[1] === "script" ? "script" : ""}">${esc(f[2])}</div><dl>${f[3].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`;
  const articles = `<section class="fc-card" id="fc-articles"><div class="ch">${I("pen")}<h2>À graver — à l'identique de ce que la cliente a vu</h2><span class="grow"></span><button class="fc-btn sm" data-t="Fichiers de gravure téléchargés (photo, aperçu face / fond)">${I("dl")} Fichiers à graver</button></div>
    ${o.items.map((it, n) => `<div class="fc-art"><img src="${it.img}" alt=""><div>
      <div class="nm"><span class="q">${it.q}×</span>${esc(it.nom)}<span class="fc-var">${esc(it.var)}</span>${it.lot ? `<span class="fc-pill bad">${I("alert")} 2 verres, CHACUN DIFFÉRENT</span>` : ""}</div>
      <div class="fc-faces">${it.faces.map(faceHtml).join("")}${it.nom.startsWith("Verre") && !it.lot ? "" : it.nom.startsWith("Collier") ? "" : ""}</div>
      ${it.apercu ? `<div class="fc-apercu"><div class="vis"><img src="${it.ap || it.img}" alt=""><span>${esc(it.lignes[0] || "")}</span></div><div class="lines"><b>📐 Disposition vue par la cliente sur l'aperçu — graver ligne par ligne, centré</b><ol>${it.lignes.map((l) => `<li>${esc(l)}</li>`).join("")}</ol><div class="fc-sub">Police, taille et place = celles de l'aperçu enregistré à la commande. Jamais le seul texte tapé.</div></div></div>` : ""}
      ${it.photo ? `<div class="fc-row"><button class="fc-btn sm">${I("dl")} Télécharger la photo de la cliente (3,2 Mo)</button><span class="faint">relue : date trouvée « 14.02.2024 »</span></div>` : ""}
      ${i === 0 && n === 0 ? `<div class="fc-row"><button class="fc-btn sm">${I("dl")} Photo renvoyée par e-mail le 4/11 (plus nette)</button><span class="faint">à comparer avec celle de la commande : la plus récente est la bonne</span></div>` : ""}
      <div class="fc-sold"><b>🧾 Vendu en plus</b>${it.sold.map(([im, t]) => t === "Rien de plus" ? `<span class="muted">rien de plus</span>` : `<span style="display:inline-flex;gap:6px;align-items:center"><img src="${im}" alt="">${esc(t)}</span>`).join("")}</div>
      <div class="fc-row"><button class="fc-btn sm" data-t="Fenêtre « Raté » : quantité, ligne de stock, coût perdu">✗ Raté — à refaire</button><button class="fc-btn sm ghost" data-t="Tous les réglages bruts (JSON) affichés">Tous les réglages (brut)</button></div>
      ${i === 1 ? `<div class="fc-rate">✗ 1 raté le 2 nov. · stock bloc Moyen 7 → 6 · −10,20 € · « bulle dans le verre » <button class="fc-lnk" data-t="Raté annulé, stock rendu">Annuler</button></div>` : ""}
    </div><div class="price">${eur(it.prix)}<small>${esc(it.base)}</small></div></div>`).join("")}
    <div class="cb" style="border-top:1px solid var(--ash-line);display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="faint">✉️ Ce que la cliente a écrit par e-mail, à lire avant de graver :</span>${i === 0 ? `<span>« Je vous renvoie la photo en meilleure qualité pour la gravure du verre 2. »</span>` : `<span class="muted">rien reçu par e-mail.</span>`}</div>
  </section>`;
  const kit = state.kit[i]; const matCost = [...kit].reduce((s, k) => s + parseFloat(KIT[k][1].replace(",", ".")), 0);
  const g = o.gain; const gain = g.enc - g.cout - matCost - g.etiq - g.rate - (g.enc * .015 + .25);
  const envoi = `<section class="fc-card" id="fc-envoi"><div class="ch">${I("box")}<h2>Emballage & envoi</h2><span class="grow"></span><span class="fc-pill ${o.st === "exp" || o.st === "liv" ? "ok" : "grey"}">${o.st === "exp" || o.st === "liv" ? I("check") + " Conditionné le 30 oct." : "À faire"}</span></div>
    <div class="cb">
      ${modeBlock(o)}
      ${o.relais ? `<div class="fc-row">${I("pin")}<b>Point relais choisi :</b> ${esc(o.relais)}<button class="fc-copy" data-copy="${esc(o.relais)}">${I("copy")} copier</button></div>` : ""}
      <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ash-faint);margin:14px 0 8px">Matériel utilisé — cochez, le stock baisse à « Valider »</h3>
      <div class="fc-kit">${Object.entries(KIT).map(([k, [n, p, im]]) => `<label class="${kit.has(k) ? "on" : ""}"><input type="checkbox" data-kit="${k}" ${kit.has(k) ? "checked" : ""}><img src="${im}" alt=""><b>${n}</b><small>${p} l'unité</small></label>`).join("")}</div>
      <div class="fc-calc"><div>Encaissé<b>${eur(g.enc)}</b></div><div>Coût des produits<b>−${eur(g.cout)}</b></div><div>Matériel coché<b>−${eur(matCost)}</b></div><div>Étiquette d'envoi<b>−${eur(g.etiq)}</b><small>modifiable</small></div><div>Stripe<b>−${eur(g.enc * .015 + .25)}</b></div><div class="ok">Gain de la commande<b>${eur(gain)}</b></div></div>
      <div class="fc-row"><button class="fc-btn" data-t="Matériel validé : stock mis à jour">${I("check")} Valider le matériel</button><button class="fc-btn ghost" data-t="Kit « colis verre » appliqué">Kit colis verre</button><button class="fc-btn ghost" data-t="Kit « pack collier » appliqué">Kit pack collier</button></div>
      <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ash-faint);margin:16px 0 8px">Étiquette</h3>
      <div class="fc-row">${o.mode === "lettre" ? `<button class="fc-btn">${I("tag")} Étiquette d'adresse La Poste (45 × 45)</button>` : `<button class="fc-btn">${I("copy")} Copier pour Boxtal, champ par champ</button>`}<button class="fc-btn ghost" data-boxtal>Voir les champs Boxtal</button></div>
      <div class="fc-boxtal" id="boxtal" ${state.boxtal ? "" : "hidden"} style="margin-top:10px;padding:12px;border:1px solid var(--ash-line);border-radius:10px"><dl>
        ${[["Référence", o.ref], ["Prénom", o.nom.split(" ")[0]], ["Nom", o.nom.split(" ").slice(1).join(" ")], ["Adresse", o.adr[1] + (o.adr[2] ? " · " + o.adr[2] : "")], ["CP / ville", o.adr[3]], ["Pays", o.adr[4]], ["E-mail", o.email], ["Mobile", o.tel], ["Colis", o.boxtal.l + " · " + o.boxtal.poids], ["Valeur", o.boxtal.valeur], ["Description", o.boxtal.desc]].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd><button class="fc-copy" data-copy="${esc(v)}">${I("copy")} copier</button>`).join("")}
      </dl><div class="faint" style="margin-top:8px">Départ (atelier) : 7 lignes fixes, déjà dans Boxtal. Express payé = <b>Chrono 18</b>, jamais une offre « Relais ».</div></div>
      ${o.tracking ? `<div class="fc-row" style="margin-top:14px">${I("truck")}<b>Suivi ${o.tracking}</b><button class="fc-lnk">suivre sur La Poste</button><button class="fc-lnk" data-t="Suivi modifié">modifier</button><span class="faint">la cliente a reçu le lien</span></div>` : ""}
    </div></section>`;
  const messages = `<section class="fc-card" id="fc-messages"><div class="ch">${I("mail")}<h2>Messages avec ${esc(o.nom.split(" ")[0])}</h2><span class="grow"></span><span class="faint">e-mails, bouton « Répondre », aperçus (BAT), devis : tout au même endroit</span></div>
    <div class="cb"><div class="fc-msgs">${o.msgs.map(([d, me, w, t, im], n) => `${n === 0 || o.msgs[n - 1][0] !== d ? `<div class="fc-day">${d}</div>` : ""}<div class="fc-msg ${me}"><small>${esc(w)}</small>${esc(t)}${im ? `<img src="${im}" alt="">` : ""}</div>`).join("")}
      ${i === 1 ? `<div class="fc-day">1 nov.</div><div class="fc-msg doc"><small>Niv Création · 11 h 05</small><span class="tag">Devis</span> DEV-1540 · 98,70 € · payé par cette commande <button class="fc-lnk">Ouvrir le devis →</button></div>` : ""}</div>
      ${o.draft ? `<div class="fc-draft" style="margin-top:12px"><b>${I("spark")} Réponse préparée par l'assistant — à relire, rien ne part sans vous</b>${esc(o.draft)}<div class="fc-row"><button class="fc-btn sm pri" data-t="Réponse envoyée par le site, dans le fil de Camille">${I("check")} Envoyer telle quelle</button><button class="fc-btn sm" data-t="Texte copié dans la zone d'écriture">Modifier</button><button class="fc-btn sm ghost" data-t="Réponse classée sans envoi">Classer sans répondre</button></div></div>` : ""}
      <div class="fc-write"><textarea placeholder="Écrire à ${esc(o.nom.split(" ")[0])} — part par le site, avec le bouton « Répondre à ce message » et la signature Niv Création."></textarea>
      <div class="fc-row"><button class="fc-btn pri" data-t="Message envoyé par le site">${I("mail")} Envoyer</button><button class="fc-btn" data-t="Aperçu joint : la cliente valide ou demande une modification">${I("img")} Joindre un aperçu à valider (BAT)</button><button class="fc-btn ghost" data-t="Photo jointe dans le même e-mail">${I("img")} Joindre une photo</button></div></div>
    </div></section>`;
  const hn = state.histNotes[i];
  const histo = `<section class="fc-card" id="fc-histo"><div class="ch">${I("clock")}<h2>Historique</h2><span class="grow"></span><span class="faint">tout ce qui est arrivé à cette commande, dans l'ordre</span></div>
    <div class="cb"><ul class="fc-tl">${[...o.hist.map(([c, t, w]) => `<li class="${c}">${esc(t)}<small>${esc(w)}</small></li>`), ...hn.map((t) => `<li class="note">📝 ${esc(t)}<small>vous · à l'instant</small></li>`)].join("")}</ul>
    <div class="fc-tl-write"><input id="hnote" placeholder="Ajouter une note interne à l'historique (jamais vue par la cliente)…"><button class="fc-btn" data-hnote>Noter</button></div></div></section>`;
  const cliente = `<section class="fc-card" id="fc-cliente"><div class="ch">${I("user")}<h3>Cliente</h3><span class="grow"></span><button class="fc-lnk" data-t="Dossier de la cliente ouvert (CRM)">dossier →</button></div>
    <div class="cb"><dl class="fc-kv"><dt>Nom</dt><dd>${esc(o.nom)}</dd><dt>E-mail</dt><dd>${esc(o.email)}<button class="fc-copy" data-copy="${esc(o.email)}">${I("copy")}</button></dd><dt>Téléphone</dt><dd>${esc(o.tel)}</dd><dt>Commandes</dt><dd>${o.nCmd} ${o.nCmd > 1 ? "(dont celle-ci)" : "(la première)"}</dd><dt>Cagnotte</dt><dd>+ ${eur(o.cashback)} gagnés avec cette commande</dd></dl>
    ${i === 2 ? `<div class="fc-alert warn" style="margin-top:10px;padding:8px 10px">${I("alert")}<span>Adresse e-mail <b>corrigée</b> : tapée « ines.martin@gmail.comn », remplacée par « …@exemple.fr » (DNS vérifié).</span></div>` : ""}</div></section>`;
  const livraison = `<section class="fc-card" id="fc-livraison"><div class="ch">${I("truck")}<h3>Livraison</h3><span class="grow"></span><button class="fc-lnk" data-edit>${state.edit ? "fermer" : "corriger"}</button></div>
    <div class="cb">${modeBlock(o)}
      <div class="fc-addr" style="margin-top:10px">${o.pays !== "FR" ? `<span class="fc-pill bad" style="margin-bottom:6px">🇧🇪 À ENVOYER EN BELGIQUE</span>` : `<span class="faint">🇫🇷 France</span>`}<b>${esc(o.adr[0])}</b>${o.adr.slice(1).filter(Boolean).map(esc).join("<br>")}<button class="fc-copy" data-copy="${esc(o.adr.filter(Boolean).join(", "))}">${I("copy")} copier l'adresse</button></div>
      ${o.relais ? `<div class="fc-sub">${I("pin")} Point relais : ${esc(o.relais)}</div>` : ""}
      ${i === 0 ? `<div class="fc-sub">Livré au nom de la cliente ✓ (pas d'autre nom)</div>` : ""}
      ${state.edit ? `<div style="margin-top:10px;display:grid;gap:6px">${["Nom", "Société / établissement", "Adresse", "Complément", "Code postal", "Ville", "Téléphone"].map((l) => `<input placeholder="${l}" style="padding:8px 10px;border:1px solid var(--ash-line-2);border-radius:8px;font:inherit">`).join("")}<div class="fc-row"><button class="fc-btn sm pri" data-t="Adresse enregistrée dans la commande (l'ancienne est gardée)">Enregistrer dans la commande</button></div></div>` : ""}
    </div></section>`;
  const argent = `<section class="fc-card" id="fc-argent"><div class="ch">${I("card")}<h3>Paiement</h3><span class="grow"></span><span class="faint">Stripe · carte</span></div>
    <div class="cb"><table class="fc-money"><tr><td>Sous-total produits</td><td>${eur(o.sub)}</td></tr>${o.remise ? `<tr class="neg"><td>Remise — code ${o.promo}</td><td>−${eur(o.remise)}</td></tr>` : ""}${o.cagnotte ? `<tr class="neg"><td>Cagnotte utilisée</td><td>−${eur(o.cagnotte)}</td></tr>` : ""}<tr><td>Livraison — ${esc(o.livr)}</td><td>${o.livrPrix ? eur(o.livrPrix) : "offerte"}</td></tr><tr class="tot"><td>Total payé</td><td>${eur(o.total)}</td></tr></table>
    ${o.remise ? `<div class="fc-sub">Cette remise vous a coûté ${eur(o.remise)}.</div>` : ""}
    <div class="fc-gain"><span>Gain estimé<small>après produits, matériel, étiquette, Stripe</small></span><b>${eur(gain)}</b></div>
    <div class="fc-sub">Remboursement : ${o.st === "prep" ? "<b>intégral possible</b> (fabrication pas lancée, encore 5 h pour la cliente)" : "<b>non</b> — fabrication lancée, pièce personnalisée"} · dans « Plus d'actions ».</div></div></section>`;
  const notes = `<section class="fc-card" id="fc-notes"><div class="ch">${I("flag")}<h3>Étiquettes & note interne</h3></div>
    <div class="cb"><div class="fc-flags">${FLAGS.map(([k, l]) => `<button class="${flags.includes(k) ? "on" : ""}" data-flag="${k}">${l}</button>`).join("")}</div>
    <textarea class="fc-note" id="note" placeholder="📝 Note interne (choix de la cliente, consigne pour l'atelier) — jamais vue par la cliente">${esc(state.notes[i])}</textarea>
    <div class="fc-row"><button class="fc-btn sm" data-note>Enregistrer la note</button><span class="faint">visible aussi sur la file de production et la fiche papier</span></div></div></section>`;
  const cadeau = i === 0 ? `<section class="fc-card" id="fc-cadeau"><div class="ch">${I("gift")}<h3>Cadeau & geste</h3></div><div class="cb"><div class="fc-alert gold" style="padding:8px 10px">${I("gift")}<span><b>Cadeau PROMIS</b> — code GRAVURE-A7K2, e-mail du 20/09. Préférence : surprise. Commande ≥ 80 € → <b>deux</b> cadeaux.</span></div><div class="fc-sub" style="margin-top:8px">Geste promis : aucun.</div></div></section>`
    : i === 1 ? `<section class="fc-card"><div class="ch">${I("gift")}<h3>Cadeau & geste</h3></div><div class="cb"><div class="fc-sub">Aucun cadeau promis. Geste promis : aucun.</div></div></section>` : `<section class="fc-card"><div class="ch">${I("gift")}<h3>Cadeau & geste</h3></div><div class="cb"><div class="fc-sub">Aucun cadeau promis. Aucun geste.</div></div></section>`;
  const devis = i === 1 ? `<section class="fc-card"><div class="ch">${I("orders")}<h3>Devis & documents</h3></div><div class="cb"><dl class="fc-kv"><dt>Devis</dt><dd>DEV-1540 · payé par cette commande <button class="fc-lnk">ouvrir</button></dd><dt>Demande</dt><dd class="muted" style="font-weight:500">« Un cristal avec notre photo de mariage et nos prénoms en bas »</dd><dt>Images</dt><dd>1 reçue de la cliente · 1 envoyée (aperçu)</dd></dl></div></section>` : `<section class="fc-card"><div class="ch">${I("orders")}<h3>Devis & documents</h3></div><div class="cb"><div class="fc-sub">Commande passée sur le site, sans devis. ${i === 0 ? "Images : 1 reçue de la cliente (4/11)." : "Aucune image échangée."}</div></div></section>`;
  const sources = `<details class="fc-src"><summary>D'où vient chaque idée (recherche du 4 nov. 2026 sur les grands logiciels)</summary><div class="in"><table><tr><th>Dans la maquette</th><th>Repris de</th></tr>
    ${[["En-tête collé : n° de commande, cliente, trois statuts (payée · fabrication · envoi), UNE grande action, « Plus d'actions »", "Shopify (deux statuts + More actions), Stripe (actions de page en haut à droite), GotPhoto 2025"], ["Frise Payée → Livrée + « À expédier au plus tard » en évidence", "Etsy (ship-by date), Shopify (timeline)"], ["« Ce qu'il reste à faire » : 5 cases à cocher, la grande action change avec l'étape", "Etsy Top Tasks, Katana, votre maquette Gestion v3 (liste de contrôle)"], ["Alertes TOUJOURS en haut, jamais repliées (Express, pays, cadeau promis, date dans l'image, réponse cliente)", "Clispot (ne pas cacher l'info critique), Amazon (cadeau à part)"], ["Articles à graver à gauche, une carte par face, aperçu de la cliente, « Vendu en plus » et « Raté » DANS l'article", "Shopify (articles à gauche), Etsy (personnalisation sur la commande), votre règle « à l'identique de ce que la cliente a vu »"], ["Colonne de droite : Cliente · Livraison · Paiement · Étiquettes & note · Cadeau · Devis", "Shopify (Customer, Shipping address, Notes, Tags), Zendesk (contexte à droite, blocs jamais supprimés)"], ["Messages : e-mails, bouton Répondre, aperçus BAT et devis dans UN seul fil + réponse de l'assistant à relire", "Zendesk, Gorgias, Front (fil unifié)"], ["Historique en bas avec notes internes datées", "Shopify Timeline (commentaires internes), Stripe (événements), FastSpring 2026"], ["Actions dangereuses (rembourser, annuler, supprimer) dans le menu, avec confirmation EN LIGNE (jamais une fenêtre système)", "Stripe (refund via menu), votre règle Gestion v2"], ["J / K = commande suivante / précédente, Échap ferme, raccourcis « Aller à »", "Linear, Gmail, Stripe (breadcrumb)"], ["Téléphone : une colonne, grande action collée en bas, boutons au pouce", "Shopify mobile, Etsy Seller app"]].map(([a, b]) => `<tr><td>${a}</td><td class="muted">${b}</td></tr>`).join("")}</table></div></details>`;
  const bottom = primary ? `<div class="fc-bottom"><button class="fc-btn pri" data-confirm="${primary[2]}">${I(primary[0])} ${primary[1]}</button><button class="fc-btn" data-menu>${I("more")}</button></div>` : "";
  document.getElementById("app").innerHTML = `<div class="fc">${head}${alerts}${steps}${jump}<div class="fc-cols"><div class="fc-main">${articles}${envoi}${messages}${histo}</div><div class="fc-side">${cliente}${livraison}${argent}${notes}${cadeau}${devis}</div></div>${sources}${bottom}</div>`;
  document.title = `${o.ref} · ${o.nom} — Gestion`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-confirm],[data-ok],[data-no],[data-menu],[data-t],[data-chk],[data-flag],[data-note],[data-copy],[data-kit],[data-edit],[data-boxtal],[data-hnote],[data-jump]");
  if (!t) { if (state.menu && !e.target.closest("#menu")) { state.menu = false; render(); } return; }
  const o = ORDERS[state.i];
  if (t.dataset.go !== undefined) { state.i = +t.dataset.go; state.confirm = ""; state.menu = false; state.edit = false; render(); window.scrollTo(0, 0); return; }
  if (t.dataset.confirm) { state.confirm = t.dataset.confirm; state.menu = false; render(); return; }
  if (t.dataset.no !== undefined) { state.confirm = ""; render(); return; }
  if (t.dataset.ok) { const k = t.dataset.ok; state.confirm = "";
    if (k === "grav") { o.st = "grav"; o.hist.push(["gold", "Passée « En fabrication »", "à l'instant"]); toast("Commande passée en fabrication"); }
    else if (k === "exp") { const n = (document.getElementById("trk") || {}).value || "1A01234567890"; o.st = "exp"; o.tracking = n; o.chk = [true, true, true, true, true]; o.hist.push(["ok", `Expédiée — suivi ${n}, cliente prévenue par e-mail`, "à l'instant"]); toast("Expédiée, cliente prévenue"); }
    else if (k === "liv") { o.st = "liv"; o.hist.push(["ok", "Livrée — demande d'avis envoyée", "à l'instant"]); toast("Livrée, demande d'avis envoyée"); }
    else if (k === "cancel") { toast("Commande annulée (maquette : rien n'est touché)"); }
    else if (k === "refund") { toast("Remboursement Stripe lancé (maquette)"); }
    render(); return; }
  if (t.dataset.menu !== undefined) { state.menu = !state.menu; render(); return; }
  if (t.dataset.chk !== undefined) { const n = +t.dataset.chk; o.chk[n] = !o.chk[n]; if (n === 4 && o.chk[4] && o.st !== "exp" && o.st !== "liv") { state.confirm = "exp"; } render(); return; }
  if (t.dataset.flag) { const f = state.flags[state.i]; const k = t.dataset.flag; f.includes(k) ? f.splice(f.indexOf(k), 1) : f.push(k); render(); toast("Étiquettes enregistrées"); return; }
  if (t.dataset.note !== undefined) { state.notes[state.i] = document.getElementById("note").value; toast("Note enregistrée"); return; }
  if (t.dataset.hnote !== undefined) { const v = document.getElementById("hnote").value.trim(); if (v) { state.histNotes[state.i].push(v); render(); toast("Note ajoutée à l'historique"); } return; }
  if (t.dataset.copy !== undefined) { try { navigator.clipboard && navigator.clipboard.writeText(t.dataset.copy); } catch {} toast("Copié : " + t.dataset.copy.slice(0, 40)); return; }
  if (t.dataset.kit) { const s = state.kit[state.i]; s.has(t.dataset.kit) ? s.delete(t.dataset.kit) : s.add(t.dataset.kit); render(); return; }
  if (t.dataset.edit !== undefined) { state.edit = !state.edit; render(); return; }
  if (t.dataset.boxtal !== undefined) { state.boxtal = !state.boxtal; render(); return; }
  if (t.dataset.jump) { const el = document.getElementById("fc-" + t.dataset.jump); el && el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  if (t.dataset.t) { toast(t.dataset.t); state.menu = false; render(); return; }
});
document.addEventListener("change", (e) => { if (e.target.dataset.kit) { const s = state.kit[state.i]; e.target.checked ? s.add(e.target.dataset.kit) : s.delete(e.target.dataset.kit); render(); } });
document.addEventListener("keydown", (e) => { if (e.target.matches("input,textarea")) return; if (e.key === "j" && ORDERS[state.i + 1]) { state.i++; state.confirm = ""; render(); window.scrollTo(0, 0); } if (e.key === "k" && ORDERS[state.i - 1]) { state.i--; state.confirm = ""; render(); window.scrollTo(0, 0); } if (e.key === "Escape") { state.confirm = ""; state.menu = false; render(); } });
window.addEventListener("scroll", () => { const ids = ["articles", "envoi", "messages", "histo"]; let cur = ids[0]; for (const k of ids) { const el = document.getElementById("fc-" + k); if (el && el.getBoundingClientRect().top < 180) cur = k; } document.querySelectorAll("#jump a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#fc-" + cur)); }, { passive: true });
render();
"""
JS = JS.replace("%ORDERS%", json.dumps(ORDERS, ensure_ascii=False)).replace("%KIT%", json.dumps(KIT, ensure_ascii=False)).replace("%ICONS%", json.dumps(ICONS))

HTML = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Fiche commande Gestion</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,400&family=Inter:wght@400;600;700&family=Great+Vibes&family=Allura&display=swap">
<style>{CSS_SITE}</style>
<style>{CSS}</style>
</head><body>
<!-- Le plein écran de Gestion (globals.css) masque tout enfant du body sauf <main> : la coquille vit donc dans <main>, comme sur le site. -->
<main style="display:contents">
<div class="ash">
  <aside class="ash-side">
    <div class="ash-brand"><img class="ash-logo" src="{IMG['logo']}" alt="Niv Création"><div class="ash-brand-txt"><div class="ash-brand-t">Gestion</div><div class="ash-brand-s">nivcreation.fr</div></div></div>
    <button type="button" class="ash-sfind">{I('search')}<span class="ash-txt">Rechercher…</span><kbd>Ctrl K</kbd></button>
    <div class="ash-glabel">Boutique</div>
    <nav class="ash-nav">{nav_html}</nav>
  </aside>
  <div class="ash-main">
    <header class="ash-top">
      <button type="button" class="ash-burger" aria-label="Menu">{I('menu')}</button>
      <div class="ash-crumb"><span class="ash-crumb-g">Commandes</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t">Fiche commande</span><span class="ash-crumb-back">‹ File de production</span></div>
      <button type="button" class="ash-search ash-search-btn"><span>{I('search')} Rechercher une commande, une cliente, un produit…</span><kbd>Ctrl K</kbd></button>
      <div class="ash-top-actions"><button type="button" class="ash-ibtn ash-pin">{I('pin')}<span>Épingler</span></button><a class="ash-todo" href="#">3 à traiter</a><a class="ash-assist" href="#">{I('spark')}<span>Assistant</span></a></div>
    </header>
    <nav class="ash-subs"><a class="ash-subtab" href="#">File de production</a><a class="ash-subtab on" href="#">Fiches</a><a class="ash-subtab" href="#">Atelier</a><a class="ash-subtab" href="#">Étiquettes</a><a class="ash-subtab" href="#">Devis</a></nav>
    <main class="ash-content"><div id="app"></div></main>
    <nav class="ash-tabs"><a class="ash-tab" href="#">{I('sun')}<span>Aujourd'hui</span></a><a class="ash-tab on" href="#">{I('orders')}<span>Commandes</span><b>3</b></a><a class="ash-tab" href="#">{I('mail')}<span>Messages</span></a><a class="ash-tab" href="#">{I('tag')}<span>Produits</span></a><button type="button" class="ash-tab">{I('menu')}<span>Plus</span></button></nav>
  </div>
</div>
<div class="fc-toast" id="toast"></div>
</main>
<script>{JS}</script>
</body></html>"""
open(out, "w", encoding="utf-8").write(HTML)
print(out, len(HTML) // 1024, "Ko")
