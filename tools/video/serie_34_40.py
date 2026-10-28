# -*- coding: utf-8 -*-
# VIDÉOS 34 À 40 (28/10/2026) — gérant : « 7 vidéos, tu fais pas la même chose, tu changes un peu » :
#   34 bijoux (surtout, un peu de cristal et de gravure à la fin) · 35 cristal (blocs) · 36 marque-pages et bois ·
#   37 verres · 38 verres → cristal → marque-pages · 39 verres → marque-pages → cristal · 40 bijoux → verres → cristal.
# Sans habillage Noël (pas demandé). Verticales 1080x1920, sans son. UNIQUEMENT des pièces GRAVÉES et EN VENTE
# (planches contact regardées le 28/10). ⚠️ Marque-pages en bois : aperçus de la maquette (pas encore de photo d'atelier).
# Quatre styles, pour que deux vidéos ne se ressemblent pas :
#   creme (fond flou, nom doré en bas, fondu crème) · ecrin (encre, photo dans un cadre doré, fondu enchaîné) ·
#   carte (papier crème, photo en haut, texte encre en bas, glissé vers le haut) · plein (photo agrandie, barre dorée,
#   compteur, balayage). Les mélanges ont des cartes de chapitre entre les familles.
# ⛔ Aucun prix, aucun nombre de produits, aucune date. Usage : python3 tools/video/serie_34_40.py <dossier> [34 35 …]
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "..", "..", "public")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "docs", "videos")
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); GOLD2 = (226, 198, 126); CREAM = (250, 246, 238); INK = (26, 18, 6); WHITE = (255, 255, 255)
GREY = (92, 80, 62)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SANSB_U = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = lambda p, s: ImageFont.truetype(p, s)

P = lambda f: os.path.join(PUB, "produits", f)
MP = lambda f: os.path.join(PUB, "marque-pages", f)
CG = lambda f: os.path.join(PUB, "produits", "cristaux-graves", f)

# --- Photos vérifiées (gravure visible) -------------------------------------------------------------
B = {
  "coeur2": (P("collier-coeur-grave-2.jpg"), "Collier Cœur gravé", "Une date, un mot, un prénom"),
  "double3": (P("collier-double-coeur-3.jpg"), "Collier Double Cœur", "Un message gravé au dos"),
  "3coeurs": (P("collier-3coeurs-3.jpg"), "Collier 3 Cœurs", "Un prénom sur chaque cœur"),
  "femme": (P("bracelet-femme-acier-grave.jpg"), "Bracelet femme gravé", "Un mot à porter tous les jours"),
  "plaques1": (P("collier-coeur-plaques-1.jpg"), "Collier Cœur & plaques", "Les prénoms de ceux qu’elle aime"),
  "cordon": (P("bracelet-cordon-plaque-4.jpg"), "Bracelet à plaque gravée", "Ses initiales, pour lui"),
  "enveloppe": (P("collier_enveloppe_a_graver_dore.jpg"), "Collier Enveloppe", "Un mot secret caché à l’intérieur"),
  "coeur1": (P("collier-coeur-grave-1.jpg"), "Collier Cœur gravé", "Deux initiales, une date"),
  "double6": (P("collier-double-coeur-6.jpg"), "Collier Double Cœur", "En or rose, gravé pour maman"),
  "plaques2": (P("collier-coeur-plaques-2.jpg"), "Collier à plaques gravées", "Une plaque par enfant"),
  "otdore": (P("bracelet-coeur-ot-dore.jpg"), "Bracelet Cœur doré", "Un message gravé sur le cœur"),
}
C = {
  "femme": (P("cristal-v-femme.jpg"), "Cristal photo 3D", "Son portrait, en relief dans le cristal"),
  "couple": (P("cristal-v-couple.jpg"), "Cristal photo 3D", "Votre couple, gravé pour toujours"),
  "chat": (P("cristal-v-enfant-chat.jpg"), "Cristal photo 3D", "L’enfant et son chat, avec un mot gravé"),
  "chien": (P("cristal-v-enfant-chien.jpg"), "Cristal photo 3D", "Le meilleur ami, en relief"),
  "famille": (P("cristal-h-famille.jpg"), "Cristal photo 3D", "Toute la famille, réunie dans le cristal"),
  "amis": (P("cristal-h-amis.jpg"), "Cristal photo 3D", "Les amis de toujours"),
  "hcouple": (P("cristal-h-couple.jpg"), "Cristal photo 3D", "Une vie à deux"),
  "sapin": (CG("sapin.jpg"), "Cristal déjà gravé", "Un sapin gravé dans le cristal"),
  "chatsapin": (CG("chat-sapin.jpg"), "Cristal déjà gravé", "Le chat au pied du sapin"),
  "ange": (CG("ange.jpg"), "Cristal déjà gravé", "Un ange, prêt à offrir"),
  "cr_coeur": (CG("coeur.jpg"), "Cristal déjà gravé", "Un cœur en relief"),
  "bouddha": (CG("bouddha.jpg"), "Cristal déjà gravé", "Le Bouddha sur son lotus"),
  "rose": (CG("rose.jpg"), "Cristal déjà gravé", "Une rose qui ne fane jamais"),
  "colibri": (CG("colibri.jpg"), "Cristal déjà gravé", "Le colibri en plein vol"),
  "eiffel": (CG("tour-eiffel.jpg"), "Cristal déjà gravé", "La tour Eiffel"),
  "panda": (CG("panda.jpg"), "Cristal déjà gravé", "Le panda et son bambou"),
  "cheval": (CG("cheval.jpg"), "Cristal déjà gravé", "Un cheval au galop"),
  "lys": (CG("lys-dragon.jpg"), "Cristal déjà gravé", "Le lys et le dragon"),
  "ours": (CG("ours-mandala.jpg"), "Cristal déjà gravé", "L’ours mandala"),
  "genie": (CG("genie.jpg"), "Cristal déjà gravé", "Le génie de la lampe"),
  "gemeaux": (CG("hero-gemeaux.webp"), "Cristal zodiaque", "Votre signe, votre prénom, votre date"),
}
V = {
  "wface": (P("verre_a_whisky_exemple_face.jpg"), "Verre à whisky gravé", "Une photo et un mot, gravés pour lui"),
  "wfond": (P("verre_a_whisky_exemple_fond.jpg"), "Gravé au fond du verre", "Une photo, vue à travers le whisky"),
  "papa1": (P("verre_whisky_papa_monde_moustache.jpg"), "Verre à whisky gravé", "Pour le meilleur papa du monde"),
  "papa2": (P("verre_whisky_papa_monde_banniere.jpg"), "Verre à whisky gravé", "Un message rien que pour lui"),
  "poule": (P("verre_a_whisky_card.jpg"), "Verre à whisky gravé", "L’authentique papa poule"),
  "bourbon": (P("verre_a_whisky_logo_bourbon.webp"), "Verre à whisky gravé", "Le logo de votre bar"),
  "cnom": (P("verre_a_cocktail_exemple_nom.jpg"), "Verre à cocktail gravé", "Le nom de votre établissement"),
  "clogo": (P("verre_a_cocktail_exemple_logo.jpg"), "Verre à cocktail gravé", "Votre logo sur chaque verre"),
  "cfond": (P("verre_a_cocktail_fond_exemple.jpg"), "Verre à cocktail gravé", "Gravé au fond, vu à travers le verre"),
  "ccoul": (P("verre_a_cocktail_exemple_couleur.jpg"), "Verre à cocktail gravé", "Pour l’apéritif entre amis"),
  "dale": (P("verre_vin_exemple_dale.jpg"), "Verre à vin gravé", "Monogramme et année"),
  "geniet": (P("verre_vin_geniet.jpg"), "Verres à vin gravés", "Deux verres, un même mot"),
  "fl3": (P("flute-grav-03.webp"), "Flûtes à champagne gravées", "Pour le grand jour"),
  "fl6": (P("flute-grav-06.webp"), "Flûtes à champagne gravées", "Les prénoms des mariés"),
  "fl2": (P("flute-grav-02.webp"), "Flûte à champagne gravée", "Un décor floral, tout en finesse"),
  "fl5": (P("flute-grav-05.webp"), "Flûte à champagne gravée", "Un souvenir à lever bien haut"),
  "carafe": (P("carafe_gravee.jpg"), "Carafe à whisky gravée", "Son prénom sur l’étiquette"),
  "c1892": (P("carafe_whiskey_1892.jpg"), "Carafe à whisky gravée", "Son année, son étiquette"),
}
M = {
  "m1e1": (MP("m1/exemple-ex1.jpg"), "Marque-page en bois gravé", "Un prénom et des papillons"),
  "m1e7": (MP("m1/exemple-ex7.jpg"), "Marque-page en bois gravé", "Un portrait et un mot pour Mamie"),
  "m1e2": (MP("m1/exemple-ex2.jpg"), "Marque-page en bois gravé", "Un prénom dans un cadre gravé"),
  "m1e4": (MP("m1/exemple-ex4.jpg"), "Marque-page en bois gravé", "« Bonne lecture » et un prénom au dos"),
  "m1e5": (MP("m1/exemple-ex5.jpg"), "Marque-page en bois gravé", "Une photo gravée au dos"),
  "m1e3": (MP("m1/exemple-ex3.jpg"), "Marque-page en bois gravé", "Un prénom, un papillon au dos"),
  "m1e6": (MP("m1/exemple-ex6.jpg"), "Marque-page en bois gravé", "Un prénom et une photo"),
  "m2e1": (MP("m2/exemple-ex1.jpg"), "Marque-page ajouré gravé", "L’oiseau, le magnolia et votre prénom"),
  "m2e4": (MP("m2/exemple-ex4.jpg"), "Marque-page ajouré gravé", "Un portrait au-dessus de la fenêtre"),
  "m2e5": (MP("m2/exemple-ex5.jpg"), "Marque-page ajouré gravé", "Une photo d’enfant au dos"),
  "m2e6": (MP("m2/exemple-ex6.jpg"), "Marque-page ajouré gravé", "Une année et un souvenir au dos"),
  "m2e2": (MP("m2/exemple-ex2.jpg"), "Marque-page ajouré gravé", "Deux prénoms, recto et verso"),
  "puzzlephoto": (P("puzzle-photo-enfants.jpg"), "Puzzle photo gravé", "Votre photo, en puzzle de bois"),
  "savane": (P("puzzle-savane.jpg"), "Puzzle en bois", "Gravé au prénom de l’enfant"),
  "dino": (P("puzzle-dinosaures.jpg"), "Puzzle en bois", "Les dinosaures, à encastrer"),
  "veilleuse": (P("veilleuse-prenom-1.jpg"), "Veilleuse au prénom", "Son prénom, allumé chaque soir"),
  "naissance": (P("plaque-naissance-coeur-1.jpg"), "Plaque de naissance", "Prénom et date de naissance"),
  "naissg": (P("plaque-naissance-garcon-1.jpg"), "Plaque de naissance", "Poids, taille et heure"),
  "support": (P("support-telephone-photo.jpg"), "Support téléphone gravé", "Votre photo, gravée dans le bois"),
  "couverts": (P("couverts_enfants_ex_prenom.jpg"), "Couverts enfant gravés", "Son prénom et un petit animal"),
  "table": (P("numero_table_arche_geometrique_relief_bois.jpeg"), "Numéro de table gravé", "Pour votre mariage"),
}

CH = "chapitre"
VIDEOS = {
  34: dict(nom="bijoux", style="creme", seg=2.0,
           titre="Bijoux gravés", accroche="Un prénom, une date, un mot : gravés pour celle ou celui que vous aimez",
           fin=("nivcreation.fr", "Choisissez le vôtre", "Gravé en France"),
           items=[B[k] for k in ["coeur2", "double3", "3coeurs", "femme", "plaques1", "cordon", "enveloppe", "coeur1",
                                  "double6", "plaques2", "otdore"]]
                 + [(CH, "Et aussi", "Cristal, verres et marque-pages gravés")]
                 + [C["couple"], V["wface"], M["m1e7"]]),
  35: dict(nom="cristal", style="ecrin", seg=2.2, ruban="✦  LE CRISTAL GRAVÉ  ✦",
           titre="Le cristal gravé", accroche="Votre photo en 3D, ou l’un de nos modèles déjà gravés",
           fin=("Votre photo dans le cristal", "Gravée en 3D dans notre atelier", "nivcreation.fr"),
           items=[C[k] for k in ["femme", "sapin", "famille", "ange", "chien", "rose", "hcouple", "colibri", "chat",
                                  "gemeaux", "cr_coeur", "cheval", "amis", "bouddha"]]),
  36: dict(nom="marque-pages-bois", style="carte", seg=2.1,
           titre="Marque-pages & bois gravé", accroche="Un prénom, un dessin, une photo : gravés dans le bois",
           fin=("nivcreation.fr", "Gravé à la commande dans notre atelier", "Gravé en France"),
           items=[M[k] for k in ["m1e1", "m1e7", "m2e1", "m1e2", "m2e4", "m1e4", "m2e5", "m1e5",
                                  "puzzlephoto", "savane", "veilleuse", "naissance", "support", "couverts", "table"]]),
  37: dict(nom="verres", style="plein", seg=1.9,
           titre="Verres & carafe gravés", accroche="Un prénom, un logo, une photo : pour trinquer à vos moments",
           fin=("Trinquez gravé", "Verres, flûtes et carafe personnalisés", "nivcreation.fr"),
           items=[V[k] for k in ["wface", "fl3", "cnom", "dale", "carafe", "wfond", "fl6", "clogo", "papa2", "geniet",
                                  "c1892", "bourbon", "cfond", "fl2"]]),
  38: dict(nom="verres-cristal-marque-pages", style="ecrin", seg=2.0, ruban="✦  GRAVÉ POUR VOUS  ✦",
           titre="Nos créations gravées", accroche="Verres, cristal et marque-pages",
           fin=("Une pièce, une histoire", "Gravée à la commande dans notre atelier", "nivcreation.fr"),
           items=[(CH, "Les verres", "Gravés à votre image")] + [V[k] for k in ["papa1", "fl5", "ccoul", "poule"]]
                 + [(CH, "Le cristal", "Votre photo, ou nos modèles")] + [C[k] for k in ["couple", "eiffel", "hcouple", "lys"]]
                 + [(CH, "Les marque-pages", "Pour les amoureux de lecture")] + [M[k] for k in ["m1e3", "m2e6", "m1e6"]]),
  39: dict(nom="verres-marque-pages-cristal", style="carte", seg=2.0,
           titre="Gravé pour vous", accroche="Verres, marque-pages et cristal",
           fin=("nivcreation.fr", "Personnalisez le vôtre", "Gravé en France"),
           items=[(CH, "01 · Les verres", "Pour trinquer")] + [V[k] for k in ["c1892", "fl6", "wfond", "cnom"]]
                 + [(CH, "02 · Les marque-pages", "Pour garder sa page")] + [M[k] for k in ["m1e1", "m2e2", "m1e4"]]
                 + [(CH, "03 · Le cristal", "Pour garder un souvenir")] + [C[k] for k in ["chat", "ours", "chatsapin", "amis"]]),
  40: dict(nom="bijoux-verres-cristal", style="plein", seg=1.9,
           titre="Offrir un cadeau gravé", accroche="Bijoux, verres et cristal",
           fin=("Un cadeau unique", "Gravé à la commande dans notre atelier", "nivcreation.fr"),
           items=[(CH, "Les bijoux", "Un prénom à porter")] + [B[k] for k in ["double3", "plaques1", "enveloppe", "otdore"]]
                 + [(CH, "Les verres", "Un message à partager")] + [V[k] for k in ["dale", "fl3", "papa2"]]
                 + [(CH, "Le cristal", "Un souvenir en relief")] + [C[k] for k in ["femme", "cr_coeur", "famille", "genie"]]),
}

# --- Outils ---------------------------------------------------------------------------------------
def wrap(d, t, f, mw):
    o, c = [], ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o

def ajuste(d, t, path, size, mw, mini=40):
    for s in range(size, mini - 1, -2):
        f = F(path, s)
        if d.textlength(t, font=f) <= mw: return f
    return F(path, mini)

def fit(im, mw, mh):
    s = min(mw / im.width, mh / im.height)
    return im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)

def flou(im, assombrir=0.35, teinte=(20, 16, 12)):
    s = max(W / im.width, H / im.height)
    bg = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    x, y = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(30))
    return Image.blend(bg, Image.new("RGB", (W, H), teinte), assombrir)

def centre(d, t, f, y, fill):
    d.text(((W - d.textlength(t, font=f)) // 2, y), t, font=f, fill=fill)

def halo(fond, coul, cx, cy, r, force):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).ellipse((cx - r, cy - r, cx + r, cy + r), fill=int(255 * force))
    m = m.filter(ImageFilter.GaussianBlur(r // 2))
    return Image.composite(Image.new("RGB", (W, H), coul), fond, m)

def ombre(base, box, rayon=26, force=110):
    m = Image.new("L", (W, H), 0); x0, y0, x1, y1 = box
    ImageDraw.Draw(m).rounded_rectangle((x0 + 6, y0 + 18, x1 + 6, y1 + 22), radius=rayon, fill=force)
    m = m.filter(ImageFilter.GaussianBlur(24))
    return Image.composite(Image.new("RGB", (W, H), (60, 45, 25)), base, m)

def arrondi(im, r):
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=r, fill=255)
    return m

# --- Styles : chaque plan = (fond fixe, photo, position, calque texte) ; le mouvement se fait au rendu --------
def plan_creme(path, nom, sous, k, n, cfg):
    im = Image.open(path).convert("RGB"); fond = flou(im)
    ph = fit(im, W - 80, int(H * 0.56)); pos = ((W - ph.width) // 2, int(H * 0.36) - ph.height // 2)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1120) / (H - 1120)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H))); ov = Image.alpha_composite(ov, dark)
    d = ImageDraw.Draw(ov)
    d.text((60, H - 360), nom, font=ajuste(d, nom, SERIFB, 74, W - 120, 48), fill=GOLD)
    y = H - 258
    for ln in wrap(d, sous, F(SANS, 44), W - 120): d.text((60, y), ln, font=F(SANS, 44), fill=WHITE); y += 54
    d.text((60, H - 90), "nivcreation.fr", font=F(SANSB, 34), fill=(235, 220, 180))
    return dict(fond=fond, photo=ph, pos=pos, ov=ov, zoom=(1.08, 1.0), mode="fond")

def plan_ecrin(path, nom, sous, k, n, cfg):
    im = Image.open(path).convert("RGB")
    fond = halo(Image.new("RGB", (W, H), INK), (70, 50, 18), W // 2, 820, 620, 0.55)
    ph = fit(im, 940, 1060); x0 = (W - ph.width) // 2; y0 = 800 - ph.height // 2
    d = ImageDraw.Draw(fond)
    for e, w in ((22, 3), (12, 2)):  # double filet doré
        d.rectangle((x0 - e, y0 - e, x0 + ph.width + e, y0 + ph.height + e), outline=GOLD, width=w)
    fr = F(SANSB_U, 34); centre(d, cfg.get("ruban", "✦  NIV CRÉATION  ✦"), fr, 150, GOLD)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d2 = ImageDraw.Draw(ov)
    ft = ajuste(d2, nom, SERIFB, 68, W - 120, 44); yb = y0 + ph.height + 70
    centre(d2, nom, ft, yb, GOLD2)
    y = yb + 92
    for ln in wrap(d2, sous, F(SERIF, 42), W - 160): centre(d2, ln, F(SERIF, 42), y, CREAM); y += 54
    centre(d2, "nivcreation.fr", F(SANSB, 30), H - 110, (200, 180, 130))
    return dict(fond=fond, photo=ph, pos=(x0, y0), ov=ov, zoom=(1.0, 1.06), mode="cadre")

def plan_carte(path, nom, sous, k, n, cfg):
    im = Image.open(path).convert("RGB")
    fond = Image.new("RGB", (W, H), CREAM)
    ph = fit(im, 960, 1120); x0 = (W - ph.width) // 2
    tmp = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    lignes = wrap(tmp, sous, F(SANS, 44), W - 160)
    bloc = ph.height + 80 + 100 + 56 * len(lignes)          # photo + filet + nom + sous-titre
    y0 = max(90, (H - 140 - bloc) // 2)
    fond = ombre(fond, (x0, y0, x0 + ph.width, y0 + ph.height))
    d = ImageDraw.Draw(fond); yt = y0 + ph.height + 70
    d.rectangle((80, yt, 200, yt + 6), fill=GOLD)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d2 = ImageDraw.Draw(ov)
    d2.text((80, yt + 34), nom, font=ajuste(d2, nom, SERIFB, 66, W - 160, 44), fill=INK)
    y = yt + 126
    for ln in lignes: d2.text((80, y), ln, font=F(SANS, 44), fill=GREY); y += 56
    d2.text((80, H - 120), "nivcreation.fr", font=F(SANSB, 32), fill=(169, 137, 53))
    d2.text((W - 80 - d2.textlength(f"{k:02d}", font=F(SERIFB, 40)), H - 128), f"{k:02d}", font=F(SERIFB, 40), fill=GOLD)
    return dict(fond=fond, photo=ph, pos=(x0, y0), ov=ov, zoom=(1.0, 1.0), mode="glisse", rayon=22)

def plan_plein(path, nom, sous, k, n, cfg):
    im = Image.open(path).convert("RGB"); fond = flou(im, 0.55, (10, 8, 5))
    ph = fit(im, W, int(H * 0.62)); pos = ((W - ph.width) // 2, int(H * 0.40) - ph.height // 2)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.text((60, 70), f"{k:02d}", font=F(SANSB, 64), fill=GOLD)
    d.text((60 + d.textlength(f"{k:02d}", font=F(SANSB, 64)) + 12, 92), f"/ {n:02d}", font=F(SANS, 34), fill=(220, 205, 170))
    d.rectangle((60, 1430, 70, 1640), fill=GOLD)
    t = nom.upper()
    d.text((100, 1430), t, font=ajuste(d, t, SANSB, 60, W - 160, 38), fill=WHITE)
    y = 1520
    for ln in wrap(d, sous, F(SANS, 46), W - 160): d.text((100, y), ln, font=F(SANS, 46), fill=GOLD2); y += 58
    d.text((60, H - 100), "NIVCREATION.FR", font=F(SANSB, 30), fill=(235, 220, 180))
    return dict(fond=fond, photo=ph, pos=pos, ov=ov, zoom=(1.0, 1.05), mode="balaye")

PLANS = dict(creme=plan_creme, ecrin=plan_ecrin, carte=plan_carte, plein=plan_plein)

def carte_titre(style, haut, grand, petit, bas=None):
    fonce = style in ("ecrin", "plein")
    im = Image.new("RGB", (W, H), INK if fonce else CREAM)
    if style == "ecrin": im = halo(im, (70, 50, 18), W // 2, H // 2, 700, 0.6)
    d = ImageDraw.Draw(im)
    txt = CREAM if fonce else INK
    if style in ("creme", "ecrin"):
        d.rectangle((0, 0, W, 14), fill=GOLD); d.rectangle((0, H - 14, W, H), fill=GOLD)
    if haut: centre(d, haut, F(SANSB_U, 36), H // 2 - 300, GOLD)
    if style == "plein":
        fb = ajuste(d, grand.upper(), SANSB, 92, W - 140, 50); centre(d, grand.upper(), fb, H // 2 - 150, WHITE)
        d.rectangle((W // 2 - 70, H // 2 - 20, W // 2 + 70, H // 2 - 12), fill=GOLD)
    else:
        fb = ajuste(d, grand, SERIFB, 96, W - 120, 56); centre(d, grand, fb, H // 2 - 160, GOLD)
    y = H // 2 + 10
    fs = F(SERIF if style == "ecrin" else SANS, 48)
    for ln in wrap(d, petit, fs, W - 160): centre(d, ln, fs, y, txt); y += 62
    if bas: centre(d, bas, F(SANSB, 42), y + 30, GOLD)
    return im

def rendre(num):
    cfg = VIDEOS[num]; st = cfg["style"]; seg = cfg["seg"]
    nprod = sum(1 for it in cfg["items"] if it[0] != CH)
    segs = [("carte", carte_titre(st, "✦  NIV CRÉATION  ✦", cfg["titre"], cfg["accroche"]), 2.3)]
    k = 0
    for it in cfg["items"]:
        if it[0] == CH:
            segs.append(("carte", carte_titre(st, None, it[1], it[2]), 1.2)); continue
        k += 1
        segs.append(("plan", PLANS[st](it[0], it[1], it[2], k, nprod, cfg), seg))
    f1, f2, f3 = cfg["fin"]
    segs.append(("carte", carte_titre(st, None, f1, f2, f3), 2.6))

    def image(kind, s, prog):
        if kind == "carte": return s
        z = s["zoom"][0] + (s["zoom"][1] - s["zoom"][0]) * prog
        fr = s["fond"].copy(); ph = s["photo"]; x, y = s["pos"]
        if s["mode"] == "cadre":   # la photo grossit DANS son cadre (le cadre ne bouge pas)
            cw, ch = int(ph.width / z), int(ph.height / z)
            part = ph.crop(((ph.width - cw) // 2, (ph.height - ch) // 2, (ph.width - cw) // 2 + cw, (ph.height - ch) // 2 + ch))
            fr.paste(part.resize(ph.size, Image.BILINEAR), (x, y))
        else:
            if z != 1.0:
                ph = ph.resize((int(ph.width * z), int(ph.height * z)), Image.BILINEAR)
                x -= (ph.width - s["photo"].width) // 2; y -= (ph.height - s["photo"].height) // 2
            if s["mode"] == "glisse": y += int(28 * (1 - prog))
            if s.get("rayon"): fr.paste(ph, (x, y), arrondi(ph, s["rayon"]))
            else: fr.paste(ph, (x, y))
        return Image.alpha_composite(fr.convert("RGBA"), s["ov"]).convert("RGB")

    brut = os.path.join(OUT, f"{num}-brut.mp4")
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    TR = int(0.3 * FPS); prec = None; cream = Image.new("RGB", (W, H), CREAM); mi = None
    for kind, s, dur in segs:
        nf = max(1, int(round(dur * FPS))); dernier = None
        for fi in range(nf):
            fr = image(kind, s, fi / max(1, nf - 1))
            if prec is not None and fi < TR:   # transition propre à chaque style
                a = (fi + 1) / TR
                if st == "creme":
                    fr = Image.blend(cream, fr, a)
                elif st == "ecrin":
                    fr = Image.blend(prec, fr, a)
                elif st == "carte":   # le nouveau plan monte depuis le bas
                    off = int(H * (1 - a) ** 2); comp = prec.copy(); comp.paste(fr.crop((0, 0, W, H - off)), (0, off)); fr = comp
                else:                  # balayage de gauche à droite
                    xw = int(W * a); comp = prec.copy(); comp.paste(fr.crop((0, 0, xw, H)), (0, 0)); fr = comp
            if kind == "plan" and mi is None and fi == nf // 2: mi = fr.copy()
            wri.append_data(np.asarray(fr)); dernier = fr
        prec = dernier
    wri.close()
    base = f"{num}-{cfg['nom']}"
    plein = os.path.join(OUT, f"{base}-1080x1920.mp4"); leger = os.path.join(OUT, f"{base}-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", brut, "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-pix_fmt", "yuv420p", "-an",
                    "-movflags", "+faststart", plein], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p",
                    "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", leger],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(brut)
    mi.resize((360, 640)).save(os.path.join(OUT, f"apercu-{base}.jpg"), quality=80)
    print(f"Vidéo {num} : {sum(x[2] for x in segs):.1f} s, {os.path.getsize(leger)//1024} Ko → {leger}", flush=True)

if __name__ == "__main__":
    nums = [int(a) for a in sys.argv[2:]] or sorted(VIDEOS)
    for n in nums: rendre(n)
