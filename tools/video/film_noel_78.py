# Vidéo 78 (26/11/2026) — « Un cadeau pour chacun » (titre générique, gérant : « pas Le Noël de Thomas, un truc générique »), même style que la 77 (le gérant l'aime), autre histoire, AUCUN produit
# pour enfant (gérant : « pas les trucs des enfants »), AUCUN produit / coloris en rupture (vérifier /api/stock). Histoire racontée comme un film : générique d'ouverture, chapitres
# (« Pour Papi et Mamie », « Pour Papa »…), image cinéma entre deux bandes noires, sous-titres de film, grain, fondus au
# noir, puis « Fin » et un générique qui défile (« dans le rôle du cadeau de… »). Uniquement des photos de pièces GRAVÉES,
# entières (jamais recadrées). Sans son, aucun prix, aucun nombre de produits.
# Usage (racine) : python3 tools/video/film_noel_78.py <polices> <sortie> [--apercu]
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: n
random.seed(78); np.random.seed(78)

# (chapitre, titre, sous-titre 1, sous-titre 2, photo, badge EXEMPLE à effacer, nom du produit, rôle au générique)
SCENES = [
  ("Chapitre I", "Pour sa femme", "Des prénoms qui comptent,", "gravés tout près de son cœur.",
   "public/produits/collier-coeur-plaques-1.jpg", False, "Collier cœur & plaques gravées", "Le cadeau de sa femme"),
  ("Chapitre II", "Pour Papa", "Il le savait déjà.", "Maintenant, c'est gravé.",
   "public/produits/verre_whisky_papa_monde_banniere.jpg", False, "Verre à whisky gravé", "Le verre de Papa"),
  ("Chapitre III", "Pour Maman", "Son plus beau portrait,", "pris dans le cristal.",
   "public/produits/cristal-v-femme.jpg", False, "Cristal photo 3D", "Le portrait de Maman"),
  ("Chapitre IV", "Pour sa sœur", "Elle dévore les livres.", "Elle ne perdra plus sa page.",
   "public/marque-pages/m1/exemple-ex4.jpg", False, "Marque-page en bois gravé", "Le marque-page de sa sœur"),
  ("Chapitre V", "Pour la bande", "Vingt ans d'amitié,", "et toujours les mêmes fous rires.",
   "public/produits/cristal-h-amis.jpg", False, "Cristal photo 3D", "La photo de la bande"),
  ("Chapitre VI", "Pour sa collègue", "Elle adore Monet.", "Un tableau à glisser dans son livre.",
   "public/marque-pages/metal/14-nympheas-monet-pompon-dore.jpg", False, "Marque-page en métal", "Le marque-page de la collègue"),
  ("Chapitre VII", "Pour les fiancés", "Fiancés depuis l'été,", "deux verres pour trinquer.",
   "public/produits/verre_a_cocktail_ex_colombes.jpg", True, "Verre à cocktail gravé", "Les verres des fiancés"),
  ("Chapitre VIII", "Pour Marraine", "Trois cœurs,", "et son prénom tout contre eux.",
   "public/produits/collier-3coeurs-3.jpg", False, "Collier 3 Cœurs gravé", "Les cœurs de la marraine"),
]
FINAL = ("Épilogue", "Et pour lui ?", "Elle aussi avait un secret.", "Leur photo, gravée dans le cristal.",
         "public/produits/cristal-v-couple.jpg", False, "Cristal photo 3D", "Le cadeau de son mari")

NON_GRAVE = {"Marque-page en métal"}   # le métal ne se grave pas : jamais « gravé » sous ce produit
T_GEN = 6.0; DS = 4.2; T_EPI = 5.0; T_FIN = 2.6; T_CRED = 9.0; T_DER = 3.2
N = len(SCENES)
T0 = T_GEN; T_EPI0 = T0 + N * DS; T_FIN0 = T_EPI0 + T_EPI; T_CRED0 = T_FIN0 + T_FIN; TOTAL = T_CRED0 + T_CRED + T_DER

BAND = 330                              # bandes noires « cinéma » en haut et en bas
FY0, FY1 = BAND, H - BAND               # cadre de l'image : 1080 × 1260
FH = FY1 - FY0
NOIR = (8, 6, 5)

# --- photos préparées : fond flou de la photo + photo ENTIÈRE posée dessus, avec un léger étalonnage chaud
def etalon(im):
    a = np.asarray(im).astype(np.float32)
    a = a * np.array([1.04, 1.0, 0.93]) + np.array([6, 2, -4])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def plan(src, badge):
    im = Image.open(P(src)).convert("RGB")
    if badge: im = sans_badge(im)
    im = etalon(im)
    fond = ImageOps.fit(im, (W, FH), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
    fond = Image.blend(fond, Image.new("RGB", fond.size, (20, 14, 10)), .45)
    e = ImageOps.contain(im, (W, FH), Image.LANCZOS)
    fond.paste(e, ((W - e.width) // 2, (FH - e.height) // 2))
    return fond
PLANS = [plan(s[4], s[5]) for s in SCENES]; PLAN_FIN = plan(FINAL[4], FINAL[5])

GRAIN = [Image.fromarray(np.clip(np.random.normal(128, 22, (H // 2, W // 2)), 0, 255).astype(np.uint8)).resize((W, H)) for _ in range(6)]
VIG = Image.radial_gradient("L").resize((W, FH)).point(lambda v: int(min(255, max(0, (v - 120) * 1.3))))

def texte_c(im, t, f, y, c, ombre=True):
    if len(c) == 4 and c[3] <= 0: return
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x = (W - lg(d, t, f)) / 2
    if ombre: d.text((x + 3, y + 3), t, font=f, fill=(0, 0, 0, int((c[3] if len(c) == 4 else 255) * .7)))
    d.text((x, y), t, font=f, fill=c); im.alpha_composite(lay)

def ajuste(f_fn, t, largeur, taille):
    d = ImageDraw.Draw(Image.new("L", (1, 1))); f = f_fn(taille)
    while lg(d, t, f) > largeur and taille > 20: taille -= 2; f = f_fn(taille)
    return f

def grain(im, t):
    g = GRAIN[int(t * 24) % len(GRAIN)]
    rgb = im.convert("RGB")
    return Image.blend(rgb, Image.merge("RGB", (g, g, g)), .06)

def cadre(im, photo, tl, dur):
    """Pose la photo dans le cadre, avec une lente avancée de caméra et un vignettage."""
    z = 1.0 + .07 * easeio(tl / dur)
    w, h = int(W * z), int(FH * z)
    p = photo.resize((w, h), Image.BILINEAR).crop(((w - W) // 2, (h - FH) // 2, (w - W) // 2 + W, (h - FH) // 2 + FH))
    p = Image.composite(Image.new("RGB", p.size, (0, 0, 0)), p, VIG.point(lambda v: int(v * .55)))
    im.paste(p, (0, FY0))

def fondu(im, a):
    if a <= 0: return im
    return Image.blend(im, Image.new("RGB", im.size, NOIR), min(1, a))

def lueur(im, tl):
    """Petite lumière chaude qui traverse l'image en début de plan (fuite de lumière de pellicule)."""
    if tl > 1.2: return im
    x = int(-400 + 1900 * tl / 1.2)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.ellipse((x - 380, FY0 - 200, x + 380, FY1 + 200), fill=(255, 170, 80, 55))
    lay = lay.filter(ImageFilter.GaussianBlur(120))
    im = im.convert("RGBA"); im.alpha_composite(lay); return im.convert("RGB")

def scene(t_local, dur, sc, photo, dernier=False):
    im = Image.new("RGBA", (W, H), NOIR + (255,))
    cadre(im, photo, t_local, dur)
    chap, titre, s1, s2, *_ , nom, _ = sc
    a_t = ease((t_local - .25) / .6)
    texte_c(im, chap.upper(), INTER(30, 600), 120, OR + (int(230 * a_t),), ombre=False)
    texte_c(im, titre, ajuste(lambda s: PLAY(s, 600), titre, W - 120, 70), 172, CREME + (int(255 * a_t),), ombre=False)
    a_s = ease((t_local - .9) / .5) * (1 - ease((t_local - dur + .55) / .4))
    fs = PLAY(44, 400)
    texte_c(im, s1, fs, FY1 + 34, (255, 248, 230, int(255 * a_s)), ombre=False)
    texte_c(im, s2, fs, FY1 + 92, (255, 248, 230, int(255 * a_s)), ombre=False)
    a_n = ease((t_local - 1.4) / .6)
    texte_c(im, nom, INTER(32, 600), FY1 + 196, OR_CLAIR + (int(240 * a_n),), ombre=False)
    if nom not in NON_GRAVE:
        texte_c(im, "Gravé à la commande en France", INTER(26, 500), FY1 + 246, (190, 175, 150, int(200 * a_n)), ombre=False)
    out = lueur(im.convert("RGB"), t_local)
    a_f = max(1 - ease(t_local / .45), ease((t_local - dur + .4) / .4) if not dernier else 0)
    return fondu(out, a_f)

def generique_ouverture(t):
    im = Image.new("RGBA", (W, H), NOIR + (255,))
    a1 = ease((t - .3) / .8) * (1 - ease((t - 2.1) / .5))
    texte_c(im, "NIV CRÉATION", INTER(40, 700), 820, OR + (int(255 * a1),), ombre=False)
    texte_c(im, "présente", PLAY(46, 400), 885, CREME + (int(220 * a1),), ombre=False)
    a2 = ease((t - 2.7) / .9) * (1 - ease((t - T_GEN + .5) / .5))
    texte_c(im, "Un cadeau", PLAY(120, 700), 700, CREME + (int(255 * a2),), ombre=False)
    texte_c(im, "pour chacun", SCRIPT(150), 830, OR_CLAIR + (int(255 * a2),), ombre=False)
    texte_c(im, "Une histoire de Noël", INTER(34, 500), 1110, (200, 185, 160, int(220 * a2)), ombre=False)
    texte_c(im, "Cette année, pas de cadeau au hasard.", PLAY(40, 400), 1250, (230, 220, 200, int(200 * a2)), ombre=False)
    texte_c(im, "Chacun aura le sien, gravé pour lui.", PLAY(40, 400), 1305, (230, 220, 200, int(200 * a2)), ombre=False)
    return im.convert("RGB")

def carte_fin(t):
    im = Image.new("RGBA", (W, H), NOIR + (255,))
    a = ease(t / .8) * (1 - ease((t - T_FIN + .5) / .5))
    texte_c(im, "Fin", SCRIPT(220), 780, OR_CLAIR + (int(255 * a),), ombre=False)
    return im.convert("RGB")

ROLES = [(s[7], s[6]) for s in SCENES] + [(FINAL[7], FINAL[6])]
def generique_fin(t):
    im = Image.new("RGBA", (W, H), NOIR + (255,))
    lignes = [("titre", "Avec, dans les rôles principaux")]
    for r, n in ROLES: lignes += [("role", r), ("nom", n), ("vide", "")]
    lignes += [("role", "Gravé à la commande"), ("nom", "dans notre atelier en France")]
    haut = sum(110 if k == "titre" else 70 if k == "vide" else 56 for k, _ in lignes)
    y = H + 40 - (H + haut + 80) * (t / T_CRED)
    for k, s in lignes:
        if k == "titre": f, c, dy = PLAY(52, 600), CREME, 110
        elif k == "role": f, c, dy = INTER(30, 500), (175, 160, 138), 56
        elif k == "nom": f, c, dy = PLAY(46, 600), OR_CLAIR, 56
        else: dy = 70; y += dy; continue
        if -80 < y < H + 20:
            a = min(1, (y - 120) / 220, (H - 120 - y) / 220)
            texte_c(im, s, f, y, c + (int(255 * max(0, a)),), ombre=False)
        y += dy
    return im.convert("RGB")

def derniere(t):
    im = Image.new("RGBA", (W, H), NOIR + (255,))
    a = ease(t / .7)
    texte_c(im, "Leur prénom,", PLAY(64, 600), 720, CREME + (int(255 * a),), ombre=False)
    texte_c(im, "pour toujours.", SCRIPT(120), 800, OR_CLAIR + (int(255 * a),), ombre=False)
    texte_c(im, "nivcreation.fr", PLAY(80, 700), 1060, CREME + (int(255 * ease((t - .6) / .7)),), ombre=False)
    texte_c(im, "Commandez tôt pour Noël", INTER(38, 600), 1180, OR + (int(255 * ease((t - 1.0) / .7)),), ombre=False)
    return im.convert("RGB")

def image(t):
    if t < T0: out = generique_ouverture(t)
    elif t < T_EPI0:
        i = int((t - T0) // DS); out = scene(t - T0 - i * DS, DS, SCENES[i], PLANS[i])
    elif t < T_FIN0: out = scene(t - T_EPI0, T_EPI, FINAL, PLAN_FIN)
    elif t < T_CRED0: out = carte_fin(t - T_FIN0)
    elif t < T_CRED0 + T_CRED: out = generique_fin(t - T_CRED0)
    else: out = derniere(t - T_CRED0 - T_CRED)
    return grain(out, t)

if APERCU:
    for k, tt in enumerate([3.8] + [T0 + DS * i + 2.5 for i in range(len(SCENES))] + [T_EPI0 + 2.8, T_FIN0 + 1.2, T_CRED0 + 4.5, TOTAL - .5]):
        image(tt).save(os.path.join(OUT, f"apercu78-{k}.jpg"), quality=85)
    print(TOTAL)
else:
    print(encoder(image, TOTAL, OUT, "78-un-cadeau-pour-chacun"), TOTAL)
