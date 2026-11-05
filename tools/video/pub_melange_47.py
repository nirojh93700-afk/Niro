# -*- coding: utf-8 -*-
# VIDÉO 47 (05/11/2026) — gérant : « une vidéo avec les gobelets, bijoux, marque-pages, verres et cristal, un truc qui change tout le temps :
# tu mets une image de bijoux, après cristal, après ça revient… un truc de montage ». Familles alternées, 20 pièces GRAVÉES, chaque pièce
# entre d'une façon différente (chute, glissé gauche / droite, zoom, rotation) avec un éclair doré entre deux. Effets de la 41.
# ⛔ Aucun prix, aucun nombre. Usage : python3 tools/video/pub_melange_47.py <dossier de sortie> [--apercu]
# (base : VIDÉO 46 (03/11/2026) — gérant : « une vidéo avec des nouveaux produits, pas les mêmes photos, pas de déco ni de mariage, juste les verres,
# marque-pages, bijoux, surtout pas les mêmes bijoux, les nouveaux ». Verres = tumbler et cocktail (exemples gravés du site, jamais vus en
# vidéo) ; bijoux = Collier Quatre Mots et Gourmette à plaque (photos vierges du fournisseur + prénom d'EXEMPLE posé dessus :
# tools/video/assets46/) ; marque-pages = exemples et tableaux pas encore montrés (métal jamais écrit « gravé »).
# Effets de la 41, habillage encre et or sans Noël (comme 43 et 44). ⛔ Aucun prix, aucun nombre, aucune date.
# Usage : python3 tools/video/pub_nouveautes_46.py <dossier de sortie> [--apercu]
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "..", "..", "public", "produits")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (214, 176, 92); GOLD2 = (240, 214, 150); CREAM = (250, 246, 238); NUIT = (12, 22, 38); ROUGE = (150, 28, 30)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANSB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
F = lambda p, s: ImageFont.truetype(p, s)
random.seed(47)

def carte(img, cw, ch, rayon=36, fond=(255, 255, 255)):
    """Photo ENTIÈRE posée dans une carte blanche arrondie (jamais recadrée)."""
    c = Image.new("RGB", (cw, ch), fond)
    im = img.copy(); im.thumbnail((cw - 40, ch - 40), Image.LANCZOS)
    c.paste(im, ((cw - im.width) // 2, (ch - im.height) // 2))
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, ch - 1), rayon, fill=255)
    out = Image.new("RGBA", (cw, ch)); out.paste(c, (0, 0), m)
    return out

# ---------------------------------------------------------------- fond : nuit, lumières floues dorées, neige
def fond_bokeh():
    g = np.zeros((H, W, 3), np.float32)
    yy = np.linspace(0, 1, H)[:, None]
    for i, (a, b) in enumerate(zip((14, 20, 30), (30, 22, 14))):
        g[..., i] = a * (1 - yy) + b * yy
    im = Image.fromarray(g.clip(0, 255).astype(np.uint8))
    lum = Image.new("RGB", (W, H)); d = ImageDraw.Draw(lum)
    for _ in range(46):
        r = random.randint(30, 110); x = random.randint(-50, W + 50); y = random.randint(-50, H + 50)
        col = random.choice([(214, 176, 92), (240, 200, 120), (180, 140, 80), (255, 230, 170)])
        k = random.uniform(0.25, 0.7); d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(c * k) for c in col))
    lum = lum.filter(ImageFilter.GaussianBlur(26))
    return ImageChops.add(im, lum)

BOKEH = fond_bokeh()
FLOCONS = [[random.uniform(0, W), random.uniform(-H, H), random.uniform(2, 7), random.uniform(60, 190), random.uniform(0, 6.28)] for _ in range(150)]

def neige(im, t, force=1.0):
    """Poussière dorée qui monte doucement (remplace la neige de Noël)."""
    d = ImageDraw.Draw(im, "RGBA")
    for x, y0, r, v, ph in FLOCONS:
        y = (y0 - v * 0.35 * t) % (H + 40) - 20
        xx = x + 14 * math.sin(t * 0.9 + ph)
        rr = r * 0.45
        a = int(150 * force * (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 2.2 + ph))))
        d.ellipse((xx - rr, y - rr, xx + rr, y + rr), fill=(255, 226, 160, min(255, a)))
    return im

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def rebond(x):
    x = max(0.0, min(1.0, x))
    return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2

def texte_centre(im, y, txt, font, fill, ombre=True, alpha=255):
    if alpha <= 0: return  # Pillow dessine en plein un texte à transparence 0
    d = ImageDraw.Draw(im, "RGBA"); w = d.textlength(txt, font=font)
    if ombre: d.text(((W - w) / 2 + 3, y + 3), txt, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
    d.text(((W - w) / 2, y), txt, font=font, fill=fill + (alpha,))

def pilule(im, cx, y, txt, font, fond, coul, s=1.0, alpha=255):
    if alpha <= 0: return
    d0 = ImageDraw.Draw(im); w = d0.textlength(txt, font=font); hh = font.size + 30
    pw, ph = int(w + 64), hh
    p = Image.new("RGBA", (pw, ph)); d = ImageDraw.Draw(p)
    d.rounded_rectangle((0, 0, pw - 1, ph - 1), ph // 2, fill=fond + (alpha,))
    d.text((32, 13), txt, font=font, fill=coul + (alpha,))
    if s != 1.0 and s > 0.05: p = p.resize((max(1, int(pw * s)), max(1, int(ph * s))), Image.LANCZOS)
    if s > 0.05: im.paste(p, (int(cx - p.width / 2), int(y + (ph - p.height) / 2)), p)

def coller(im, c, cx, cy, s=1.0, rot=0.0, alpha=1.0):
    if s <= 0.02 or alpha <= 0.01: return
    x = c if s == 1 else c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = x.split()[3].point(lambda v: int(v * alpha)); x = x.copy(); x.putalpha(a)
    sh = Image.new("RGBA", x.size, (0, 0, 0, 0)); sh.putalpha(x.split()[3].point(lambda v: int(v * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    im.paste(sh, (int(cx - x.width / 2) + 10, int(cy - x.height / 2) + 22), sh)
    im.paste(x, (int(cx - x.width / 2), int(cy - x.height / 2)), x)


FT_TITRE = F(SERIFB, 80); FT_SOUS = F(SERIF, 46); FT_NOM = F(SERIFB, 60); FT_PIL = F(SANSB, 36); FT_PETIT = F(SANS, 34)
FT_TAMPON = F(SANSB, 44); FT_URL = F(SERIFB, 66); FT_MARQUE = F(SERIFB, 54)

def ph(f): return Image.open(os.path.join(PUB, "..", f)).convert("RGB")
def rogne(img, marge=30):
    """Retire seulement le fond crème vide autour des marque-pages (le produit n'est jamais coupé)."""
    import numpy as np
    a = np.asarray(img).astype(int); fond = np.median(a[:, :40].reshape(-1, 3), axis=0)
    m = (np.abs(a - fond).sum(axis=2) > 60)
    xs = np.where(m.mean(axis=0) > 0.05)[0]; ys = np.where(m.mean(axis=1) > 0.05)[0]
    if not len(xs): return img
    return img.crop((max(0, xs.min() - marge), max(0, ys.min() - marge), min(img.width, xs.max() + marge), min(img.height, ys.max() + marge)))
BRUN = (96, 66, 30); VERT = (32, 52, 40); ENCRE = (26, 18, 6); ROSE = (120, 60, 70)
CW, CH = 960, 1060
def carte_auto(img, cw=CW, hmax=1100):
    """Carte à la forme de la photo (photo entière, jamais recadrée)."""
    h = min(hmax, int((cw - 40) * img.height / img.width) + 40)
    return carte(img, cw, h)
GOB = os.path.join(PUB, "gobelet")
def g(f): return Image.open(os.path.join(GOB, f)).convert("RGB")
# Familles alternées : gobelet, bijou, cristal, verre, marque-page… et ça revient (gérant, 05/11 : « un truc qui change tout le temps »).
FAM = {"gob": ("Gobelet isotherme", (40, 70, 110)), "bij": ("Bijou gravé", VERT), "cri": ("Cristal gravé", (70, 90, 120)),
       "ver": ("Verre gravé", ROSE), "mp": ("Marque-page", BRUN)}
def C(img, w=900, hmax=1150): return carte_auto(img, w, hmax)
P = {
 "gob1": (C(g("ex1-creme-papillon-camille.jpg"), 820), "gob", "Un dessin et un prénom"),
 "gob2": (C(g("ex3-rose-rose-lea.jpg"), 820), "gob", "Une rose et « Léa »"),
 "gob3": (C(g("ex2-marine-cheval-paul.jpg"), 820), "gob", "Un cheval et « Paul »"),
 "gob4": (C(g("ex5-creme-photo-meilleur-ami.jpg"), 820), "gob", "Votre photo gravée"),
 "gob5": (C(g("ex4-blanc-colibri-ines.jpg"), 820), "gob", "Un colibri et « Inès »"),
 "gob6": (C(g("ex6-marine-texte-super-papy.jpg"), 820), "gob", "Votre texte"),
 "bij1": (C(ph("produits/collier-coeur-plaques-2.jpg")), "bij", "Un prénom et une date"),
 "bij2": (C(ph("produits/bracelet-cordon-plaque-4.jpg")), "bij", "Vos initiales"),
 "bij3": (C(ph("produits/collier-coeur-grave-2.jpg")), "bij", "Un prénom sur le cœur"),
 "cri1": (C(ph("produits/cristaux-graves/cheval.jpg")), "cri", "Un cheval gravé en 3D"),
 "cri2": (C(ph("produits/cristal-v-couple.jpg"), 760), "cri", "Votre photo dans le cristal"),
 "cri3": (C(ph("produits/cristaux-graves/colibri.jpg")), "cri", "Un colibri en 3D"),
 "cri4": (C(ph("produits/cristaux-graves/panda.jpg")), "cri", "Un panda en 3D"),
 "ver1": (C(ph("produits/flute-grav-01.jpg")), "ver", "Des flûtes gravées"),
 "ver2": (C(ph("produits/verre_a_whisky_logo_bourbon.webp")), "ver", "Votre logo gravé"),
 "ver3": (C(ph("produits/verre_vin_exemple_dale.jpg")), "ver", "Une initiale et un nom"),
 "mp1": (C(rogne(ph("marque-pages/m1/exemple-ex4.jpg")), 620, 1250), "mp", "Un texte et un prénom"),
 "mp2": (C(rogne(ph("marque-pages/m2/exemple-ex1.jpg")), 620, 1250), "mp", "Le modèle ajouré"),
 "mp3": (C(ph("marque-pages/metal/11-iris-van-gogh-pompon-dore.jpg"), 820), "mp", "En métal : Les Iris de Van Gogh"),
 "mp4": (C(rogne(ph("marque-pages/m1/exemple-ex7.jpg")), 620, 1250), "mp", "Une photo gravée"),
}
ORDRE = ["gob1", "bij1", "cri1", "ver1", "mp1", "gob2", "bij2", "cri2", "ver2", "mp2", "gob3", "bij3", "cri3", "ver3", "mp3", "gob4", "cri4", "mp4", "gob5", "gob6"]
MIX = [P[k] for k in ORDRE]
C_AMB = P["gob1"][0]

def s_intro(im, t, d):
    titre = ["Gravé pour vous,", "de toutes les façons"]
    n = int(len("".join(titre)) * ease(t / 1.3))
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, 720 + i * 110, ligne[:k], FT_TITRE, CREAM)
    mots = ["Gobelets", "Bijoux", "Cristal", "Verres", "Marque-pages"]
    for k, m in enumerate(mots):
        u = (t - 1.3 - 0.16 * k) / 0.35
        if u > 0: pilule(im, W / 2, 980 + 92 * k, m, FT_PIL, FAM[["gob", "bij", "cri", "ver", "mp"][k]][1], CREAM, s=rebond(u))

def chute(u):
    """0 → 1 : tombe d'en haut puis rebondit un peu."""
    u = max(0.0, min(1.0, u))
    if u < 0.7: return (u / 0.7) ** 2
    v = (u - 0.7) / 0.3
    return 1 - 0.06 * math.sin(v * math.pi) * (1 - v)

ENTREES = ["chute", "gauche", "zoom", "droite", "rotation"]
def place(entree, u):
    """Position (dx, dy, échelle, rotation) pendant l'entrée, u de 0 à 1."""
    e = ease(u)
    if entree == "chute": return 0, -1900 * (1 - chute(u)), 1.0, 7 * (1 - min(1, u))
    if entree == "gauche": return -1300 * (1 - rebond(u)), 0, 1.0, -5 * (1 - e)
    if entree == "droite": return 1300 * (1 - rebond(u)), 0, 1.0, 5 * (1 - e)
    if entree == "zoom": return 0, 0, max(0.05, 0.25 + 0.75 * rebond(u)), 0
    return 0, 0, max(0.05, rebond(u)), -180 * (1 - e)

def s_mix(im, t, d):
    pas = d / len(MIX); i = min(len(MIX) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, fam, pil = MIX[i]
    nomfam, col = FAM[fam]
    cy = 960
    if i > 0 and u < 0.22:  # le précédent sort vite de l'autre côté
        cp = MIX[i - 1][0]; k = ease(u / 0.22); sens = 1 if i % 2 else -1
        coller(im, cp, W / 2 + sens * 1300 * k, cy, s=1 - 0.2 * k, rot=sens * 8 * k, alpha=1 - k)
    dx, dy, sc, rot = place(ENTREES[i % len(ENTREES)], min(1.0, u / 0.34))
    coller(im, c, W / 2 + dx, cy + dy, s=sc * (1 + 0.035 * max(0, u - 0.34)), rot=rot)
    a = int(255 * ease((u - 0.18) / 0.15))
    pilule(im, W / 2, 170, nomfam, FT_PIL, col, CREAM, s=rebond(max(0, (u - 0.12) / 0.25)), alpha=a)
    pilule(im, W / 2, 1650, pil, FT_PIL, (26, 18, 6), GOLD2, s=rebond(max(0, (u - 0.24) / 0.3)), alpha=a)
    if u < 0.07 and i > 0:  # éclair doré entre deux pièces
        fl = Image.new("RGBA", (W, H), (255, 236, 190, int(150 * (1 - u / 0.07)))); im.alpha_composite(fl)

TAMPONS = [("Gravé à la commande", ROSE), ("Dans notre atelier", VERT), ("Un cadeau unique", (120, 88, 30))]
def s_tampons(im, t, d):
    coller(im, P["cri2"][0], W / 2 - 230, 760, s=0.5, rot=-6)
    coller(im, P["gob4"][0], W / 2 + 230, 760, s=0.5, rot=6)
    for k, (txt, col) in enumerate(TAMPONS):
        u = (t - 0.3 - 0.45 * k) / 0.4
        if u > 0: pilule(im, W / 2, 1300 + 120 * k, txt, FT_TAMPON, col, CREAM, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 640, "Un prénom, une photo,", FT_TITRE, CREAM, alpha=int(255 * ease(t / 0.5)))
    texte_centre(im, 750, "un dessin…", FT_TITRE, CREAM, alpha=int(255 * ease((t - 0.3) / 0.5)))
    texte_centre(im, 900, "on le grave pour vous", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1080, "nivcreation.fr", FT_URL, GOLD, ENCRE, s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1330, "NiV CRÉATION", FT_MARQUE, GOLD2, alpha=int(200 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1410, "Gravé en France", FT_PETIT, CREAM, alpha=int(200 * ease((t - 1.4) / 0.5)))

SCENES = [(3.0, s_intro), (24.0, s_mix), (2.6, s_tampons), (3.6, s_fin)]
def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "47-melange-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out],
                         stdin=subprocess.PIPE)
    for f in range(nf):
        t = f / FPS; acc = 0
        for d, fn in SCENES:
            if t < acc + d or fn is SCENES[-1][1]: break
            acc += d
        im = BOKEH.copy().convert("RGBA")
        lt = t - acc
        fn(im, lt, d)
        # fondu au noir entre les scènes (0,18 s)
        neige(im, t)
        rgb = im.convert("RGB")
        k = min(lt / 0.18, (d - lt) / 0.18, 1.0) if fn is not s_intro or lt > 0.2 else lt / 0.2
        if fn is SCENES[-1][1]: k = min(1.0, lt / 0.18)
        if k < 1: rgb = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), rgb, max(0.0, k))
        p.stdin.write(rgb.tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "47-melange-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2] == "--apercu":
        for ts in [2.6, 3.3, 3.9, 4.5, 5.6, 7.0, 8.6, 10.6, 12.2, 14.6, 16.4, 18.8, 21.0, 23.6, 25.8, 28.4, 31.0]:
            acc = 0
            for d, fn in SCENES:
                if ts < acc + d: break
                acc += d
            im = BOKEH.copy().convert("RGBA"); fn(im, ts - acc, d); neige(im, ts)
            im.convert("RGB").resize((360, 640)).save(os.path.join(OUT, f"apercu-{ts:05.1f}.jpg"), quality=85)
        print("ok")
    else:
        main()
