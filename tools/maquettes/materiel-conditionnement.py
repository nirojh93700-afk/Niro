# -*- coding: utf-8 -*-
# MAQUETTE « Conditionnement » (11/10/2026) — le gérant coche, sur chaque commande, le matériel utilisé
# (cartons, calage, étiquettes, emballages bijoux, bois) ; le stock baisse, le coût et le gain de la commande
# se calculent. Usage : python3 materiel-conditionnement.py <dossier css> <fichier de sortie>
# Le dossier css contient les 3 feuilles du site en ligne (curl nivcreation.fr/_next/static/css/*.css) : la
# maquette réutilise donc les VRAIES classes de l'admin (.ash-*, .file-*), seul le bloc .mp-* est neuf.
# Photos = recadrées dans les captures Amazon du gérant (docs/maquettes/assets/materiel/).
import base64, glob, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "..", "docs", "maquettes", "assets", "materiel")
css_dir, out = sys.argv[1], sys.argv[2]
CSS = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(css_dir, "*.css"))))

def uri(name):
    b = open(os.path.join(ASSETS, name + ".webp"), "rb").read()
    return "data:image/webp;base64," + base64.b64encode(b).decode()

# --- Données : achats vus dans les captures Amazon + emballages bijoux déjà dans Gestion → Emballages ---
# cout = coût d'UNE utilisation (pièce, ou portion pour le calage). stock = en unités de décompte.
ITEMS = [
  # Cartons & boîtes d'expédition
  dict(id="carton15", cat="exp", nom="Carton blanc 25,4 × 20,3 × 15,3 cm", lot="Lot de 15 · 27,99 €", cout=1.87, usage="1 carton", stock=15, seuil=5, img="carton-blanc-25x20x15-x15", sug=1),
  dict(id="carton25", cat="exp", nom="Carton blanc 25,4 × 20,4 × 15,3 cm", lot="Lot de 25 · 27,99 €", cout=1.12, usage="1 carton", stock=25, seuil=8, img="carton-25x20x15"),
  dict(id="boiteb", cat="exp", nom="Boîte postale blanche 30,5 × 22,9 × 10,2 cm", lot="Lot de 20 · 39,99 €", cout=2.00, usage="1 boîte", stock=20, seuil=6, img="boite-blanche-30x23x10"),
  dict(id="boitek", cat="exp", nom="Boîte postale kraft 30,5 × 22,9 × 7,6 cm", lot="Lot de 20 · 32,99 €", cout=1.65, usage="1 boîte", stock=20, seuil=6, img="boite-kraft-30x23x8"),
  dict(id="bulles", cat="exp", nom="Enveloppes à bulles abricot 25 × 20 cm", lot="Lot de 30 · 7,74 € (Temu)", cout=0.26, usage="1 enveloppe", stock=30, seuil=8, img="bulles-abricot"),
  # Calage
  dict(id="chips", cat="cal", nom="Chips de calage biodégradables, blanc", lot="100 litres · 35,44 €", cout=0.71, usage="1 poignée ≈ 2 L", stock=50, seuil=10, img="chips-calage", sug=1),
  dict(id="raffia", cat="cal", nom="Papier déchiqueté raffia", lot="200 g · 10,99 €", cout=0.55, usage="1 poignée ≈ 10 g", stock=20, seuil=5, img="raffia"),
  dict(id="soie", cat="cal", nom="Papier de soie motif plantes dorées 50,8 × 35,6 cm", lot="60 feuilles · 8,99 € (Temu, à confirmer)", cout=0.15, usage="1 feuille", stock=60, seuil=15, img="papier-soie"),
  # Étiquettes
  dict(id="fragile", cat="eti", nom="Étiquettes FRAGILE 9 × 5 cm", lot="168 étiquettes · 7,99 €", cout=0.05, usage="1 étiquette", stock=168, seuil=30, img="etiquettes-fragile", sug=1),
  # Emballages bijoux (déjà dans Gestion → Emballages : coûts d'achat saisis)
  dict(id="sac", cat="bij", nom="Sac cadeau", lot="Emballage bijoux", cout=1.00, usage="1 sac", stock=None, seuil=None, img="emb-sac"),
  dict(id="boitec", cat="bij", nom="Boîte cadeau carrée 9 × 9 cm", lot="Colliers et bracelets fins", cout=0.97, usage="1 boîte", stock=None, seuil=None, img="emb-boite-carree"),
  dict(id="boitea", cat="bij", nom="Boîte cadeau allongée", lot="Bracelets homme et longs", cout=0.95, usage="1 boîte", stock=None, seuil=None, img="emb-boite-allongee"),
  dict(id="micro", cat="bij", nom="Pochette microfibre", lot="Protection et voyage", cout=1.00, usage="1 pochette", stock=None, seuil=None, img="emb-microfibre"),
  dict(id="poch50", cat="bij", nom="Pochettes à cordon aspect lin, crème 10 × 14 cm", lot="Lot de 50 · 8,78 € (Temu)", cout=0.18, usage="1 pochette", stock=50, seuil=10, img="pochettes-lin-50"),
  dict(id="poch24", cat="bij", nom="Pochettes cadeaux lin beige 10 × 14 cm", lot="Lot de 24 · 6,29 € (Temu)", cout=0.26, usage="1 pochette", stock=24, seuil=6, img="pochettes-lin-24"),
  # Bois à graver
  dict(id="a45", cat="bois", nom="Contreplaqué bouleau A4, 5 mm", lot="Lot de 10 · 34,95 €", cout=3.50, usage="1 planche", stock=10, seuil=3, img="panneaux-a4-5mm"),
  dict(id="a410", cat="bois", nom="Contreplaqué bouleau A4, 10 mm", lot="Lot de 10 · 49,95 €", cout=5.00, usage="1 planche", stock=10, seuil=3, img="panneaux-a4-10mm"),
  dict(id="boisb", cat="bois", nom="Petites boîtes en bois brut 20 × 10 × 5 cm, fermoir métal", lot="Lot de 6 · 26,99 € (Amazon)", cout=4.50, usage="1 boîte", stock=6, seuil=2, img="boites-bois-20x10"),
  dict(id="a53", cat="bois", nom="Contreplaqué tilleul A5, 3 mm", lot="Lot de 12 · 9,99 €", cout=0.83, usage="1 feuille", stock=12, seuil=4, img="panneaux-a5-3mm"),
]
# Détails affichés sous chaque photo : taille, matière, pour quels produits (indicatif), où et quand acheté.
# « pour » = déduit des dimensions des produits du site (verre 47 cl, flûte Ø6,3 × H21,4, whisky Ø7,9 × H9,3, cocktail H12,5, puzzles 18,5 × 13,5 et 21 × 15 cm) : à vérifier.
DETAIL = dict(
  carton15=dict(dim="25,4 × 20,3 × 15,3 cm (L × l × h)", mat="Carton ondulé blanc, boîte pliante", pour="Verre à vin, flûte (couchée, 21,4 cm), verres whisky et cocktail : 1 à 2 pièces avec calage", achat="Amazon, RLAVBL (vendu par ArtersEU) · dernier achat 27/07/2026"),
  carton25=dict(dim="25,4 × 20,4 × 15,3 cm", mat="Carton ondulé blanc, caisse à rabats", pour="Mêmes usages que le carton 25,4 × 20,3 : verres et flûtes, 1 à 2 pièces", achat="Amazon · 27,99 € le lot de 25 (à confirmer : même produit que le lot de 15 ?)"),
  boiteb=dict(dim="30,5 × 22,9 × 10,2 cm", mat="Boîte postale blanche à rabat, carton ondulé", pour="Puzzles en bois (18,5 × 13,5 et 21 × 15 cm), planches A4 (30 × 21 cm), petits cadeaux à plat", achat="Amazon, RLAVBL (vendu par ArtersEU) · dernier achat 22/09/2026"),
  boitek=dict(dim="30,5 × 22,9 × 7,6 cm", mat="Boîte postale kraft à rabat, carton ondulé", pour="Puzzles en bois à plat, plaques et objets fins (jusqu'à 7 cm d'épaisseur)", achat="Amazon, HORLIMER (vendu par WallArters) · dernier achat 17/08/2026"),
  bulles=dict(dim="25 × 20 cm (9,8 × 7,8 pouces)", mat="Enveloppe à bulles de mode, couleur abricot, anti-chute", pour="Bijoux en boîte, porte-clés, petits objets plats (à vérifier selon la pièce)", achat="Temu · lot de 30 · livraison 5 jours ouvrés, importation prise en charge par Temu"),
  chips=dict(dim="Sac de 100 litres (existe en 50 et 200 L)", mat="Chips de calage bio, biodégradables, blanc, fabriqués en Europe", pour="Caler verres, carafes et cristaux dans les cartons", achat="Amazon, Verpacking · 35,44 € pour 100 L"),
  raffia=dict(dim="200 g, sachet 32 × 32 × 3 cm", mat="Papier déchiqueté raffia, blanc crème", pour="Calage décoratif des coffrets et boîtes cadeau", achat="Amazon, KdmNzoo (vendu par GoooodGift) · dernier achat 29/09/2026"),
  soie=dict(dim="50,8 × 35,6 cm la feuille", mat="Papier fin imprimé de plantes dorées", pour="Envelopper verres, cristaux et coffrets avant le calage", achat="Temu · l'offre propose 10, 30 ou 60 feuilles (60 retenues, à confirmer)"),
  fragile=dict(dim="9 × 5 cm l'étiquette", mat="Autocollants rouge et blanc, texte anglais « Handle with care »", pour="Tous les colis fragiles : verres, flûtes, carafes, cristaux", achat="Amazon, KAHZOR (vendu par anqingxinuo) · dernier achat 27/07/2026"),
  sac=dict(dim="Taille à saisir (non renseignée dans Emballages)", mat="Sac carton beige, logo Niv Création", pour="Tous les bijoux (colliers et bracelets)", achat="Fournisseur emballages bijoux · poids 28 g · vendu 1,70 € au client"),
  boitec=dict(dim="9 × 9 cm", mat="Boîte carton, logo Niv Création", pour="Colliers et bracelets fins (Femme Cœur, Papillon, Acier)", achat="Fournisseur emballages bijoux · poids 59 g · vendue 3,90 € au client"),
  boitea=dict(dim="Format bracelet, taille à saisir", mat="Boîte carton à tiroir, logo Niv Création", pour="Bracelets homme et bracelets longs", achat="Fournisseur emballages bijoux · poids 80 g · vendue 5,90 € au client"),
  micro=dict(dim="Taille à saisir (non renseignée dans Emballages)", mat="Pochette microfibre, logo Niv Création", pour="Protection et voyage, tous les bijoux", achat="Fournisseur emballages bijoux · poids 15 g · vendue 2,70 € au client"),
  poch50=dict(dim="10 × 14 cm", mat="Tissu aspect lin crème, cordon de serrage", pour="Colliers, bracelets, porte-clés en pochette", achat="Temu · lot de 50 · livraison gratuite, importation prise en charge par Temu"),
  poch24=dict(dim="10 × 14 cm", mat="Tissu imitation lin beige, cordon", pour="Colliers, bracelets, porte-clés en pochette", achat="Temu · lot de 24 · livraison 5 jours ouvrés"),
  a45=dict(dim="30 × 21 cm (A4), 5 mm d'épaisseur", mat="Contreplaqué de bouleau brut", pour="Découpe et gravure laser : supports, plaques, petits objets", achat="Amazon, Creative Deco · dernier achat 12/04/2026"),
  a410=dict(dim="30 × 21 cm (A4), 10 mm d'épaisseur", mat="Contreplaqué de bouleau brut", pour="Pièces épaisses : socles, supports, plaques", achat="Amazon, Creative Deco · dernier achat 25/03/2026"),
  a53=dict(dim="21 × 15 cm (A5), 3 mm d'épaisseur", mat="Contreplaqué de tilleul", pour="Puzzles en bois (plateau 18,5 × 13,5 cm), marque-pages, petites pièces", achat="Amazon, TAFONUP (vendu par Systems Ironworks) · 9,99 €"),
  boisb=dict(dim="20 × 10 × 5 cm", mat="Bois brut (paulownia), fermoir métal bronze", pour="Coffret à graver ou emballage cadeau gravé (à préciser)", achat="Amazon, Sixfolo · dernier achat 06/04/2026 · 4,50 € la pièce"),
)
for it in ITEMS:
    it.update(DETAIL[it["id"]])

COURT = dict(carton15="Carton 25×20×15", carton25="Carton 25×20×15 (25)", boiteb="Boîte blanche 30×23", boitek="Boîte kraft 30×23",
             chips="Chips de calage", raffia="Raffia", fragile="Étiquette FRAGILE", sac="Sac cadeau", boitec="Boîte carrée",
             boitea="Boîte allongée", micro="Microfibre", bulles="Enveloppe à bulles", soie="Papier de soie", poch50="Pochette lin (50)", poch24="Pochette lin (24)", boisb="Boîte bois 20×10", a45="Bouleau A4 5 mm", a410="Bouleau A4 10 mm", a53="Tilleul A5 3 mm")
for it in ITEMS:
    it["court"] = COURT[it["id"]]
    if it.get("img"): it["photo"] = uri(it["img"])
CATS = [("exp", "Cartons, boîtes & enveloppes"), ("cal", "Calage & papier"), ("eti", "Étiquettes"), ("bij", "Emballages bijoux"), ("bois", "Bois à graver")]
KITS = [
  dict(id="colis", nom="Colis verre", detail="carton + chips + FRAGILE", items={"carton15": 1, "chips": 1, "fragile": 1}),
  dict(id="packc", nom="Pack collier", detail="sac + boîte + microfibre", items={"sac": 1, "boitec": 1, "micro": 1}),
  dict(id="packb", nom="Pack bracelet", detail="sac + boîte allongée + microfibre", items={"sac": 1, "boitea": 1, "micro": 1}),
]
# La commande d'exemple = la VRAIE commande 1ZNESNSV du 11/10/2026 (verre à vin 36 cl « AMOUR », point relais).
ORDER = dict(ref="1ZNESNSV", encaisse=19.21, produit=3.24, etiquette=6.12, stripe=0.54)

ICO = {
  "sac": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M10 16h28l3 26H7z"/><path d="M17 16v-3a7 7 0 0 1 14 0v3"/></svg>',
  "boite": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 17 24 9l18 8v20L24 45 6 37z"/><path d="M6 17l18 8 18-8M24 25v20"/></svg>',
  "pochette": '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="9" y="12" width="30" height="26" rx="5"/><path d="M9 20h30M21 26h6"/></svg>',
}

PAGE_CSS = r"""
:root{--font-display:'Playfair Display',Georgia,serif;--font-body:'Inter',system-ui,sans-serif;color-scheme:light}
html,body{background:#f4f1ea;margin:0}
body{font-family:var(--font-body);color:var(--ink)}
#mp-app{display:block}
.mp-banner{background:#1d1811;color:#f1e3b8;font-size:.78rem;padding:8px 14px;text-align:center;line-height:1.4}
.mp-banner b{color:#d6b25a}
.mp-seg{display:flex;gap:6px;margin:0 0 16px;padding:4px;background:#fff;border:1px solid var(--line);border-radius:12px;width:max-content;max-width:100%}
.mp-seg button{border:0;background:transparent;padding:9px 14px;border-radius:9px;font:600 .88rem var(--font-body);color:var(--ink-soft);cursor:pointer;min-height:44px}
.mp-seg button.on{background:#1d1811;color:#f1e3b8}
.mp-h1{font-family:var(--font-display);font-size:1.5rem;margin:0 0 4px;color:var(--ash-ink)}
.mp-sub{color:var(--ink-soft);font-size:.9rem;margin:0 0 16px}
.mp-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 18px}
.mp-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.mp-kpi small{display:block;color:var(--ink-soft);font-size:.74rem;text-transform:uppercase;letter-spacing:.05em}
.mp-kpi b{font-size:1.3rem;font-variant-numeric:tabular-nums}
.mp-kpi b.warn{color:#b32b2b}
.mp-pack{border:1px solid #e6d7aa;background:linear-gradient(180deg,#fffaf0,#fff);border-radius:12px;padding:12px;margin:10px 0}
.mp-pack-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.mp-pill{font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:99px;background:#f3e6c2;color:#7a5a12}
.mp-pill.ok{background:#dff1e0;color:#1f6b2c}
.mp-used{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.mp-used span{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);border-radius:99px;padding:3px 10px 3px 3px;font-size:.8rem}
.mp-used img{width:26px;height:26px;border-radius:50%;object-fit:cover}
.mp-used .ic{width:26px;height:26px;border-radius:50%;background:#f3ece0;display:grid;place-items:center;color:#7a5a12}
.mp-used .ic svg{width:16px;height:16px}
.mp-cost{font-size:.88rem;margin:0 0 8px;color:var(--ink)}
.mp-cost b{font-variant-numeric:tabular-nums}
.mp-cost .g{color:#1f6b2c;font-weight:800}
.mp-cost .r{color:#b32b2b;font-weight:800}
.mp-scrim{position:fixed;inset:0;background:rgba(20,15,8,.55);z-index:90;display:none}
.mp-scrim.open{display:block}
.mp-sheet{position:fixed;z-index:91;left:0;right:0;bottom:0;max-height:94vh;background:#fffdf9;border-radius:22px 22px 0 0;box-shadow:0 -18px 60px rgba(0,0,0,.35);display:none;flex-direction:column}
.mp-sheet.open{display:flex}
.mp-sh{flex:0 0 auto;padding:14px 16px 10px;border-bottom:1px solid var(--line);position:relative}
.mp-sh h2{font-family:var(--font-display);font-size:1.2rem;margin:0 36px 2px 0}
.mp-sh p{margin:0;font-size:.84rem;color:var(--ink-soft)}
.mp-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#fff;font-size:1.1rem;cursor:pointer}
.mp-kits{flex:0 0 auto;display:flex;gap:8px;overflow-x:auto;padding:10px 16px 2px;scrollbar-width:none}
.mp-kit{flex:0 0 auto;border:1px dashed #cdb26a;background:#fffaf0;border-radius:12px;padding:8px 12px;text-align:left;cursor:pointer;min-height:44px;font-family:var(--font-body)}
.mp-kit b{display:block;font-size:.84rem}.mp-kit small{color:var(--ink-soft);font-size:.72rem}
.mp-filters{flex:0 0 auto;display:flex;gap:6px;overflow-x:auto;padding:10px 16px;scrollbar-width:none}
.mp-filters input{flex:1 1 150px;min-width:150px;border:1px solid var(--line);border-radius:99px;padding:8px 14px;font:500 .84rem var(--font-body);min-height:40px;background:#fff}
.mp-filters button{flex:0 0 auto;border:1px solid var(--line);background:#fff;border-radius:99px;padding:8px 13px;font:600 .8rem var(--font-body);cursor:pointer;min-height:40px;color:var(--ink-soft)}
.mp-filters button.on{background:#1d1811;border-color:#1d1811;color:#f1e3b8}
.mp-body{overflow-y:auto;padding:0 16px 12px;flex:1}
.mp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mp-it{position:relative;background:#fff;border:1.5px solid var(--line);border-radius:14px;overflow:hidden;text-align:left;cursor:pointer;padding:0;display:flex;flex-direction:column;font-family:var(--font-body)}
.mp-it.on{border-color:var(--gold);background:#fffaf0;box-shadow:0 0 0 3px rgba(194,161,78,.22)}
.mp-ph{aspect-ratio:4/3;background:#fff;display:grid;place-items:center;border-bottom:1px solid var(--line)}
.mp-ph img{width:100%;height:100%;object-fit:contain}
.mp-ph .ic{width:46%;color:#9c6b3f}
.mp-sug{position:absolute;top:8px;left:8px;background:#1d1811;color:#f1e3b8;font-size:.66rem;font-weight:700;padding:3px 8px;border-radius:99px}
.mp-chk{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;background:var(--gold);color:#fff;display:none;place-items:center;font-weight:800}
.mp-it.on .mp-chk{display:grid}
.mp-tx{padding:9px 10px 6px;flex:1}
.mp-tx b{display:block;font-size:.82rem;line-height:1.25;margin-bottom:3px}
.mp-tx small{display:block;color:var(--ink-soft);font-size:.72rem;line-height:1.3}
.mp-tx small.dt{margin-top:3px}
.mp-tx small.dt u,.mp-row small.dt u{text-decoration:none;font-weight:700;color:var(--ink);margin-right:4px}
.mp-row small.dt{display:block;margin-top:2px}
.mp-tx .c{color:var(--ink);font-weight:700;font-variant-numeric:tabular-nums}
.mp-st{font-size:.72rem;margin-top:4px;color:var(--ink-soft)}
.mp-st.low{color:#b32b2b;font-weight:700}
.mp-qty{display:none;align-items:center;justify-content:space-between;padding:6px 10px 10px}
.mp-it.on .mp-qty{display:flex}
.mp-qty button{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#fff;font-size:1.2rem;cursor:pointer}
.mp-qty span{font-weight:800;font-variant-numeric:tabular-nums;font-size:1rem}
.mp-ft{flex:0 0 auto;border-top:1px solid var(--line);padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px));background:#fff}
.mp-calc{display:none;font-size:.82rem;margin:0 0 8px}
.mp-calc.open{display:block}
.mp-calc div{display:flex;justify-content:space-between;padding:2px 0;font-variant-numeric:tabular-nums}
.mp-calc div.t{border-top:1px solid var(--line);margin-top:4px;padding-top:5px;font-weight:800}
.mp-sum{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mp-sum .l{font-size:.86rem}.mp-sum .l b{font-variant-numeric:tabular-nums}
.mp-sum .l button{background:none;border:0;color:#7a5a12;text-decoration:underline;font-size:.78rem;cursor:pointer;padding:6px 0}
.mp-sum .r{display:flex;gap:8px}
.mp-list{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:0 0 18px}
.mp-list h3{margin:0;padding:10px 14px;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);background:#faf6ef;border-bottom:1px solid var(--line)}
.mp-row{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 14px;border-bottom:1px solid #f0e8d9}
.mp-row:last-child{border-bottom:0}
.mp-row .ph{width:52px;height:52px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff;display:grid;place-items:center}
.mp-row .ph img{width:100%;height:100%;object-fit:contain}.mp-row .ph .ic{width:60%;color:#9c6b3f}
.mp-row b{display:block;font-size:.9rem}.mp-row small{color:var(--ink-soft);font-size:.78rem}
.mp-bar{width:130px;text-align:right}
.mp-bar i{display:block;height:7px;border-radius:99px;background:#eee4d2;overflow:hidden;margin-top:5px}
.mp-bar i u{display:block;height:100%;background:var(--gold);text-decoration:none}
.mp-bar.low i u{background:#c0392b}.mp-bar.low b{color:#b32b2b}
.mp-note{background:#fffaf0;border:1px solid #e6d7aa;border-radius:12px;padding:12px 14px;font-size:.86rem;margin:0 0 16px}
.mp-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#1d1811;color:#f1e3b8;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:99;display:none;max-width:90vw;text-align:center}
.mp-toast.show{display:block}
@media (min-width:900px){
 .mp-sheet{left:50%;right:auto;bottom:auto;top:50%;transform:translate(-50%,-50%);width:min(1040px,94vw);max-height:90vh;border-radius:22px}
 .mp-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media (max-width:420px){.mp-bar{width:96px}.mp-row{gap:10px}}
"""

HTML = r"""
<title>Matériel et conditionnement</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>__CSS__</style>
<style>__PAGE_CSS__</style>
<main id="mp-app">
<div class="mp-banner"><b>MAQUETTE</b> · rien n'est en ligne · commande réelle #__REF__ du 11/10 · stocks de départ = quantités achetées (à corriger) · portions de calage à régler par vous</div>
<div class="ash">
 <aside class="ash-side">
  <div class="ash-brand"><div class="ash-logo">NiV</div><div class="ash-brand-txt"><div class="ash-brand-t">Niv Création</div><div class="ash-brand-s">Espace gestion</div></div></div>
  <nav class="ash-nav">
   <div class="ash-group"><div class="ash-glabel">Commandes</div>
    <a class="ash-item" id="nav1" href="#" data-go="s1"><span class="ash-ico">▤</span><span class="ash-txt">File de production</span><span class="ash-badge">4</span></a>
    <a class="ash-item" href="#"><span class="ash-ico">◈</span><span class="ash-txt">Atelier · fichiers</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Catalogue</div>
    <a class="ash-item" href="#"><span class="ash-ico">◧</span><span class="ash-txt">Produits &amp; stock</span></a>
    <a class="ash-item" id="nav2" href="#" data-go="s2"><span class="ash-ico">▢</span><span class="ash-txt">Matériel &amp; emballages</span></a>
    <a class="ash-item" href="#"><span class="ash-ico">⇩</span><span class="ash-txt">Achats &amp; factures</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Finances</div>
    <a class="ash-item" href="#"><span class="ash-ico">€</span><span class="ash-txt">Bénéfices</span></a></div>
  </nav>
 </aside>
 <div class="ash-main">
  <header class="ash-top">
   <div class="ash-crumb"><span class="ash-crumb-g" id="crG">Commandes</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t" id="crT">File de production</span></div>
   <div class="ash-top-actions"><a class="ash-assist" href="#">✦ Assistant</a></div>
  </header>
  <main class="ash-content">
   <div class="mp-seg" role="tablist"><button class="on" data-go="s1">① File de production</button><button data-go="s2">② Matériel &amp; stock</button></div>

   <section id="s1">
    <h1 class="mp-h1">File de production</h1>
    <p class="mp-sub">Chaque commande a maintenant un bloc « Conditionnement » : vous cochez le matériel utilisé, le coût et le gain se calculent.</p>
    <div class="mp-kpis">
      <div class="mp-kpi"><small>À préparer</small><b>4</b></div>
      <div class="mp-kpi"><small>Matériel utilisé aujourd'hui</small><b id="kToday">0,00 €</b></div>
      <div class="mp-kpi"><small>Gain estimé aujourd'hui</small><b id="kGain">—</b></div>
    </div>
    <div class="file-cols">
     <div class="file-col"><div class="file-col-h"><span>À préparer</span><span class="n">1</span></div>
      <div class="file-card">
       <div class="file-card-top">
        <div><span class="file-pos">1</span><span class="file-ref">#__REF__</span><span class="dash-chip prep" style="margin-left:8px">À préparer</span></div>
        <div style="text-align:right"><div style="font-weight:800">19,21 €</div><div class="file-age">il y a 2 h · 11/10 17:30</div></div>
       </div>
       <div class="file-who"><strong>Lorraine Allain</strong> <span>· Point relais Mondial Relay — Locker 24/7 Intermarché, Montbron</span></div>
       <ul class="file-items"><li><span class="q">1×</span><span>Verre à vin gravé<span class="d">À l'unité — Personnalisation : AMOUR</span><span class="d">✍️ Texte « AMOUR », écriture Allura, face avant</span></span></li></ul>
       <div class="file-chips"><span class="file-chip red">⚡ Fabrication immédiate</span><span class="file-chip on">Code BIENVENUE10</span></div>

       <div class="mp-pack" id="pack">
        <div class="mp-pack-h"><b>📦 Conditionnement</b><span class="mp-pill" id="packPill">À faire</span></div>
        <div id="packBody"><p class="mp-cost" style="color:var(--ink-soft)">Matériel non renseigné. Le gain de cette commande n'est pas encore calculé.</p></div>
        <button class="btn btn-gold" id="openSheet" type="button">Choisir le matériel utilisé</button>
       </div>

       <div class="file-actions">
        <button class="btn btn-gold" type="button">✏️ Commencer la fabrication</button>
        <button class="btn btn-outline" type="button">📦 Expédiée (n° de suivi)</button>
        <a class="btn btn-outline" href="#">Fiche complète →</a>
       </div>
      </div>
     </div>
     <div class="file-col"><div class="file-col-h"><span>En fabrication</span><span class="n">0</span></div><div class="file-empty">Aucune commande.</div></div>
     <div class="file-col"><div class="file-col-h"><span>Expédiées récentes</span><span class="n">0</span></div><div class="file-empty">Aucune commande.</div></div>
    </div>
   </section>

   <section id="s2" hidden>
    <h1 class="mp-h1">Matériel &amp; emballages</h1>
    <p class="mp-sub">Tout ce que vous achetez pour fabriquer et expédier, au même endroit : stock, coût par utilisation, alerte quand il faut racheter.</p>
    <div class="mp-kpis">
      <div class="mp-kpi"><small>Valeur du stock</small><b id="kVal">—</b></div>
      <div class="mp-kpi"><small>À racheter</small><b id="kLow">0</b></div>
      <div class="mp-kpi"><small>Matériel moyen par commande</small><b>2,63 €</b></div>
    </div>
    <div class="mp-note">➕ <b>Un achat arrive ?</b> Importez la facture ou la capture dans <b>Achats &amp; factures</b> : l'IA lit les lignes et le stock s'ajoute tout seul, comme pour les verres. Tout est dans une seule liste, sans catégories : emballages bijoux (sac, boîtes, microfibre, repris de la page Emballages actuelle), cartons, calage, étiquettes et bois.</div>
    <div id="rows"></div>
   </section>
  </main>
  <nav class="ash-tabs" aria-label="Navigation principale">
   <a class="ash-tab on" href="#"><i>▤</i><span>Commandes</span></a><a class="ash-tab" href="#"><i>✉</i><span>Messages</span></a><a class="ash-tab" href="#"><i>◧</i><span>Produits</span></a><a class="ash-tab" href="#"><i>☰</i><span>Plus</span></a>
  </nav>
 </div>
</div>

<div class="mp-scrim" id="scrim"></div>
<div class="mp-sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Conditionnement de la commande">
 <div class="mp-sh"><h2>Conditionnement · #__REF__</h2><p>Verre à vin gravé × 1 · point relais · 19,21 € encaissés</p><button class="mp-x" id="closeSheet" aria-label="Fermer">✕</button></div>
 <div class="mp-kits" id="kits"></div>
 <div class="mp-filters" id="filters"></div>
 <div class="mp-body"><div class="mp-grid" id="grid"></div></div>
 <div class="mp-ft">
  <div class="mp-calc" id="calc"></div>
  <div class="mp-sum">
   <div class="l">Matériel <b id="fMat">0,00 €</b> · Gain estimé <b id="fGain">—</b><br><button type="button" id="toggleCalc">Voir le calcul</button></div>
   <div class="r"><button class="btn btn-outline" type="button" id="cancel">Annuler</button><button class="btn btn-gold" type="button" id="validate">Valider</button></div>
  </div>
 </div>
</div>
<div class="mp-toast" id="toast"></div>
<script>
const ITEMS=__ITEMS__, CATS=__CATS__, KITS=__KITS__, ORDER=__ORDER__, ICO=__ICO__;
const $=(s)=>document.querySelector(s);
const eur=(n)=>n.toFixed(2).replace('.',',')+' €';
const stock0={}; ITEMS.forEach(i=>stock0[i.id]=i.stock);
let stock={...stock0}, sel={}, filt='tous', query='', done=null;
const norm=(t)=>String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
ITEMS.forEach(i=>{ if(i.sug) sel[i.id]=1; });
function ph(i){return i.photo?`<img src="${i.photo}" alt="">`:`<span class="ic">${ICO[i.ico]}</span>`;}
function mat(){return ITEMS.reduce((s,i)=>s+(sel[i.id]||0)*i.cout,0);}
function gain(m){return ORDER.encaisse-ORDER.produit-ORDER.etiquette-ORDER.stripe-m;}
function stockTxt(i){ if(i.stock==null) return '<div class="mp-st">stock : à saisir</div>';
  const q=sel[i.id]||0, left=stock[i.id]-q, low=left<=i.seuil;
  return `<div class="mp-st${low?' low':''}">stock ${stock[i.id]}${q?` → ${left}`:''}${low?' · à racheter':''}</div>`;}
function renderKits(){ $('#kits').innerHTML=KITS.map(k=>`<button class="mp-kit" data-k="${k.id}"><b>${k.nom}</b><small>${k.detail}</small></button>`).join(''); }
function renderFilters(){ const f=[['tous','Tout le matériel'],['sug','Suggérés pour cette commande']]; $('#filters').innerHTML=f.map(([k,n])=>`<button data-f="${k}" class="${filt===k?'on':''}">${n}</button>`).join('')+`<input id="q" type="search" placeholder="Rechercher un matériel…" value="${query}" aria-label="Rechercher un matériel" autocomplete="off">`; }
function renderGrid(){
  const list=ITEMS.filter(i=>(filt==='tous'||i.sug)&&(!query||norm(i.nom+' '+i.mat+' '+i.pour+' '+i.lot).includes(norm(query))));
  if(!list.length){ $('#grid').innerHTML='<p class="mp-st" style="grid-column:1/-1;padding:18px 0">Aucun matériel à ce nom.</p>'; totals(); return; }
  $('#grid').innerHTML=list.map(i=>{const q=sel[i.id]||0; return `<div class="mp-it${q?' on':''}" data-i="${i.id}" tabindex="0" role="button" aria-pressed="${q?'true':'false'}">
    ${i.sug?'<span class="mp-sug">Suggéré</span>':''}<span class="mp-chk">✓</span><div class="mp-ph">${ph(i)}</div>
    <div class="mp-tx"><b>${i.nom}</b><small>${i.lot}</small><small><span class="c">${eur(i.cout)}</span> · ${i.usage}</small><small class="dt"><u>Taille</u> ${i.dim}</small><small class="dt"><u>Matière</u> ${i.mat}</small><small class="dt"><u>Pour</u> ${i.pour}</small><small class="dt"><u>Acheté</u> ${i.achat}</small>${stockTxt(i)}</div>
    <div class="mp-qty"><button data-m="${i.id}" aria-label="Moins">−</button><span>${q}</span><button data-p="${i.id}" aria-label="Plus">+</button></div></div>`;}).join('');
  totals();
}
function totals(){
  const m=mat(), g=gain(m);
  $('#fMat').textContent=eur(m); $('#fGain').textContent=eur(g);
  $('#calc').innerHTML=`<div><span>Encaissé (avec le port)</span><span>${eur(ORDER.encaisse)}</span></div>
   <div><span>− Le verre (coût Metro)</span><span>${eur(ORDER.produit)}</span></div>
   <div><span>− Matériel coché</span><span>${eur(m)}</span></div>
   <div><span>− Étiquette Mondial Relay</span><span>${eur(ORDER.etiquette)}</span></div>
   <div><span>− Frais Stripe</span><span>${eur(ORDER.stripe)}</span></div>
   <div class="t"><span>Votre gain</span><span>${eur(g)}</span></div>`;
}
function openS(){ $('#scrim').classList.add('open'); $('#sheet').classList.add('open'); document.body.style.overflow='hidden'; renderKits(); renderFilters(); renderGrid(); }
function closeS(){ $('#scrim').classList.remove('open'); $('#sheet').classList.remove('open'); document.body.style.overflow=''; }
function toast(t){ const e=$('#toast'); e.textContent=t; e.classList.add('show'); setTimeout(()=>e.classList.remove('show'),3800); }
function packView(){
  if(!done){ $('#packPill').textContent='À faire'; $('#packPill').className='mp-pill'; $('#openSheet').textContent='Choisir le matériel utilisé';
    $('#packBody').innerHTML='<p class="mp-cost" style="color:var(--ink-soft)">Matériel non renseigné. Le gain de cette commande n\'est pas encore calculé.</p>'; $('#kToday').textContent='0,00 €'; $('#kGain').textContent='—'; return; }
  const used=ITEMS.filter(i=>done[i.id]).map(i=>`<span>${i.photo?`<img src="${i.photo}" alt="">`:`<span class="ic">${ICO[i.ico]}</span>`}${i.court} ×${done[i.id]}</span>`).join('');
  const m=ITEMS.reduce((s,i)=>s+(done[i.id]||0)*i.cout,0), g=gain(m);
  $('#packPill').textContent='✓ Conditionné'; $('#packPill').className='mp-pill ok'; $('#openSheet').textContent='Corriger';
  $('#packBody').innerHTML=`<div class="mp-used">${used}</div><p class="mp-cost">Matériel <b>${eur(m)}</b> · Gain de la commande <span class="${g>=0?'g':'r'}">${eur(g)}</span></p>`;
  $('#kToday').textContent=eur(m); $('#kGain').textContent=eur(g);
}
function rows(){
  let val=0, low=0;
  const l=ITEMS;
  const html=`<div class="mp-list"><h3>Tout le matériel · ${l.length} articles</h3>${l.map(i=>{
    const has=i.stock!=null, left=has?stock[i.id]:null, isLow=has&&left<=i.seuil; if(has){val+=left*i.cout; if(isLow)low++;}
    const pct=has?Math.min(100,Math.round(left/stock0[i.id]*100)):0;
    return `<div class="mp-row"><div class="ph">${ph(i)}</div><div><b>${i.nom}</b><small>${i.lot} · ${eur(i.cout)} / utilisation (${i.usage})</small><small class="dt"><u>Taille</u> ${i.dim}</small><small class="dt"><u>Matière</u> ${i.mat}</small><small class="dt"><u>Pour</u> ${i.pour}</small><small class="dt"><u>Acheté</u> ${i.achat}</small></div>
      <div class="mp-bar${isLow?' low':''}">${has?`<b>${left}</b><small> restants${isLow?' · à racheter':''}</small><i><u style="width:${pct}%"></u></i>`:'<small>stock à saisir</small>'}</div></div>`;}).join('')}</div>`;
  $('#rows').innerHTML=html; $('#kVal').textContent=eur(val); $('#kLow').textContent=low; $('#kLow').className=low?'warn':'';
}
function go(id){ ['s1','s2'].forEach(s=>{$('#'+s).hidden=(s!==id);}); document.querySelectorAll('.mp-seg button').forEach(b=>b.classList.toggle('on',b.dataset.go===id));
  $('#nav1').classList.toggle('on',id==='s1'); $('#nav2').classList.toggle('on',id==='s2');
  $('#crG').textContent=id==='s1'?'Commandes':'Catalogue'; $('#crT').textContent=id==='s1'?'File de production':'Matériel & emballages'; if(id==='s2') rows(); window.scrollTo(0,0); }
document.addEventListener('click',(e)=>{
  const t=e.target.closest('[data-go]'); if(t){ e.preventDefault(); go(t.dataset.go); return; }
  if(e.target.closest('#openSheet')){ if(done){ sel={...done}; } openS(); return; }
  if(e.target.closest('#closeSheet')||e.target.closest('#cancel')||e.target===$('#scrim')){ closeS(); return; }
  const f=e.target.closest('[data-f]'); if(f){ filt=f.dataset.f; renderFilters(); renderGrid(); return; }
  const k=e.target.closest('[data-k]'); if(k){ const kit=KITS.find(x=>x.id===k.dataset.k); sel={}; Object.assign(sel,kit.items); renderGrid(); return; }
  const p=e.target.closest('[data-p]'); if(p){ e.stopPropagation(); const id=p.dataset.p; if((sel[id]||0)<stock[id]||stock[id]==null) sel[id]=(sel[id]||0)+1; renderGrid(); return; }
  const m=e.target.closest('[data-m]'); if(m){ e.stopPropagation(); const id=m.dataset.m; sel[id]=Math.max(0,(sel[id]||0)-1); if(!sel[id]) delete sel[id]; renderGrid(); return; }
  const it=e.target.closest('[data-i]'); if(it){ const id=it.dataset.i; if(sel[id]) delete sel[id]; else sel[id]=1; renderGrid(); return; }
  if(e.target.closest('#toggleCalc')){ $('#calc').classList.toggle('open'); return; }
  if(e.target.closest('#validate')){
    if(!Object.keys(sel).length){ toast('Cochez au moins un matériel, ou annulez.'); return; }
    if(done){ ITEMS.forEach(i=>{ if(i.stock!=null) stock[i.id]+= (done[i.id]||0); }); }
    ITEMS.forEach(i=>{ if(i.stock!=null && sel[i.id]) stock[i.id]-=sel[i.id]; });
    done={...sel}; closeS(); packView();
    const l=ITEMS.filter(i=>done[i.id]&&i.stock!=null).map(i=>`${i.court} −${done[i.id]}`).join(' · ');
    toast('Enregistré · stock mis à jour : '+l); return; }
});
document.addEventListener('input',(e)=>{ if(e.target.id==='q'){ query=e.target.value; renderGrid(); } });
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeS(); if((e.key==='Enter'||e.key===' ')&&e.target.dataset&&e.target.dataset.i){ e.preventDefault(); e.target.click(); } });
packView();
</script>
</main>
"""
html = (HTML.replace("__CSS__", CSS).replace("__PAGE_CSS__", PAGE_CSS).replace("__REF__", ORDER["ref"])
        .replace("__ITEMS__", json.dumps(ITEMS, ensure_ascii=False)).replace("__CATS__", json.dumps(CATS, ensure_ascii=False))
        .replace("__KITS__", json.dumps(KITS, ensure_ascii=False)).replace("__ORDER__", json.dumps(ORDER))
        .replace("__ICO__", json.dumps(ICO)))
open(out, "w", encoding="utf-8").write(html)
print(f"{out} : {len(html)//1024} Ko")
