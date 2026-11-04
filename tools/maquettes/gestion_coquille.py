# -*- coding: utf-8 -*-
# COQUILLE partagée des maquettes de GESTION (04/11/2026) : icônes au trait (une seule famille), photos en data-URI,
# barre latérale + barre du haut + sous-onglets + onglets téléphone = les VRAIES classes .ash-* du site
# (le dossier css passé au générateur = les 3 feuilles de nivcreation.fr). Utilisée par fiche-commande.py et
# file-production.py (fiche-commande.py garde encore sa propre copie des icônes, 04/11). Le logo = copie octet pour octet de docs/maquettes/assets/logo-source.jpg, jamais retouché.
import base64, glob, io, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
P = lambda n: os.path.join(ROOT, "public", "produits", n)
M = lambda n: os.path.join(ROOT, "public", "materiel", n)

def css_site(css_dir):
    return "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(css_dir, "*.css"))))

def uri(path, w=420):
    """Photo du site réduite (jamais recadrée) en data-URI webp."""
    from PIL import Image
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "WEBP", quality=78)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()

def raw_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

def logo_uri():
    return raw_uri(os.path.join(ROOT, "docs", "maquettes", "assets", "logo-source.jpg"), "image/jpeg")

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
SUBTABS = ["File de production", "Fiches", "Atelier", "Étiquettes", "Devis"]
BADGE = '<span class="ash-badge">3</span>'

def nav_html():
    return "".join(f'<a class="ash-item{" on" if len(x) > 2 else ""}" href="#">{I(x[0])}<span class="ash-txt">{x[1]}</span>{BADGE if len(x) > 2 else ""}</a>' for x in NAV)

def shell(*, title, crumb, subtab, css_site_txt, css, body, js, back="", extra="", fonts="Playfair+Display:ital,wght@0,500;1,400&family=Inter:wght@400;600;700"):
    """Page complète : coquille de Gestion + contenu. `body` = le HTML de .ash-content, `extra` = ce qui vit hors du contenu (toast…)."""
    subs = "".join(f'<a class="ash-subtab{" on" if s == subtab else ""}" href="#">{s}</a>' for s in SUBTABS)
    back_html = f'<span class="ash-crumb-back">‹ {back}</span>' if back else ""
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={fonts}&display=swap">
<style>{css_site_txt}</style>
<style>{css}</style>
</head><body>
<!-- Le plein écran de Gestion (globals.css) masque tout enfant du body sauf <main> : la coquille vit donc dans <main>, comme sur le site. -->
<main style="display:contents">
<div class="ash">
  <aside class="ash-side">
    <div class="ash-brand"><img class="ash-logo" src="{logo_uri()}" alt="Niv Création"><div class="ash-brand-txt"><div class="ash-brand-t">Gestion</div><div class="ash-brand-s">nivcreation.fr</div></div></div>
    <button type="button" class="ash-sfind">{I('search')}<span class="ash-txt">Rechercher…</span><kbd>Ctrl K</kbd></button>
    <div class="ash-glabel">Boutique</div>
    <nav class="ash-nav">{nav_html()}</nav>
  </aside>
  <div class="ash-main">
    <header class="ash-top">
      <button type="button" class="ash-burger" aria-label="Menu">{I('menu')}</button>
      <div class="ash-crumb"><span class="ash-crumb-g">Commandes</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t">{crumb}</span>{back_html}</div>
      <button type="button" class="ash-search ash-search-btn"><span>{I('search')} Rechercher une commande, une cliente, un produit…</span><kbd>Ctrl K</kbd></button>
      <div class="ash-top-actions"><button type="button" class="ash-ibtn ash-pin">{I('pin')}<span>Épingler</span></button><a class="ash-todo" href="#">3 à traiter</a><a class="ash-assist" href="#">{I('spark')}<span>Assistant</span></a></div>
    </header>
    <nav class="ash-subs">{subs}</nav>
    <main class="ash-content">{body}</main>
    <nav class="ash-tabs"><a class="ash-tab" href="#">{I('sun')}<span>Aujourd'hui</span></a><a class="ash-tab on" href="#">{I('orders')}<span>Commandes</span><b>3</b></a><a class="ash-tab" href="#">{I('mail')}<span>Messages</span></a><a class="ash-tab" href="#">{I('tag')}<span>Produits</span></a><button type="button" class="ash-tab">{I('menu')}<span>Plus</span></button></nav>
  </div>
</div>
{extra}
</main>
<script>{js}</script>
</body></html>"""
