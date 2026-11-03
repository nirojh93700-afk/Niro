# -*- coding: utf-8 -*-
# VIDÉO 46 (03/11/2026) — gérant : « une vidéo avec des nouveaux produits, pas les mêmes photos, pas de déco ni de mariage, juste les verres,
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
random.seed(46)

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
A46 = os.path.join(HERE, "assets46")
def ph46(f): return Image.open(os.path.join(A46, f)).convert("RGB")
VERRES = [("produits/verre_tumbler_37_ex_fee.jpg", "Verre tumbler en cristal", "Un dessin et un prénom"),
          ("produits/verre_tumbler_39_ex_photo.jpg", "Grand tumbler en cristal", "Votre photo gravée"),
          ("produits/verre_a_cocktail_ex_maries.jpg", "Verre à cocktail", "Deux prénoms, un modèle"),
          ("produits/verre_tumbler_39_ex_texte.jpg", "Grand tumbler en cristal", "Votre texte, votre écriture"),
          ("produits/verre_a_cocktail_ex_texte.jpg", "Verre à cocktail", "Un mot, gravé dans le verre")]
BIJOUX = [(ph46("gourmette-plaque-or-exemple.jpg"), "Gourmette à plaque gravée", "Un prénom sur la plaque"),
          (ph46("collier-quatre-mots-exemple.jpg").crop((330, 440, 650, 960)).resize((640, 1040), Image.LANCZOS), "Collier Quatre Mots", "Un mot sur chaque face")]
MP = [("marque-pages/m1/exemple-ex2.jpg", "Un cadre et un prénom"), ("marque-pages/m1/exemple-ex3.jpg", "Un dessin au dos"),
      ("marque-pages/m1/exemple-ex6.jpg", "Une photo gravée"), ("marque-pages/m2/exemple-ex3.jpg", "Le modèle ajouré"),
      ("marque-pages/m2/exemple-ex5.jpg", "Un prénom et une photo")]
C_VER = [(carte_auto(ph(f), 860), nom, pil) for f, nom, pil in VERRES]
C_BIJ = [(carte_auto(im, CW), nom, pil) for im, nom, pil in BIJOUX]
C_MP = [(carte_auto(rogne(ph(f)), 620, 1250), "Marque-page ajouré" if "/m2/" in f else "Marque-page en bois", t) for f, t in MP]
C_METAL = [(carte_auto(ph("marque-pages/metal/01-amandier-en-fleurs-van-gogh.jpg"), 820), "Marque-page en métal", "L'Amandier en fleurs de Van Gogh"),
           (carte_auto(ph("marque-pages/metal/02-iris-van-gogh.jpg"), 820), "Marque-page en métal", "Les Iris de Van Gogh")]
C_AMB = carte_auto(ph("produits/verre_tumbler_37_ex_photo.jpg"), 780)
# 03/11 (gérant : « mélange un peu… le verre, après bijoux… il faut que ça mélange ») : un seul défilé, les familles alternées,
# chaque produit TOMBE dans l'image (chute + petit rebond), le précédent glisse vers le bas.
MIX = [C_VER[0], C_BIJ[0], C_MP[0], C_VER[1], C_METAL[0], C_BIJ[1], C_VER[2], C_MP[3], C_VER[3], C_MP[2], C_METAL[1], C_VER[4], C_MP[4]]
BIJ_IDS = {id(x) for x in C_BIJ}

def s_intro(im, t, d):
    titre = ["Nos nouveautés,", "gravées pour vous"]
    n = int(len("".join(titre)) * ease(t / 1.5))
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, 700 + i * 110, ligne[:k], FT_TITRE, CREAM)
    a = int(255 * ease((t - 1.5) / 0.6))
    if a > 0:
        texte_centre(im, 960, "Verres, bijoux et marque-pages", FT_SOUS, GOLD2, alpha=a)
        texte_centre(im, 1020, "à personnaliser", FT_SOUS, GOLD2, alpha=a)
    if t > 2.1: pilule(im, W / 2, 1160, "Gravé en France", FT_PIL, GOLD, ENCRE, s=rebond((t - 2.1) / 0.5))

def chute(u):
    """0 → 1 : tombe d'en haut puis rebondit un peu."""
    u = max(0.0, min(1.0, u))
    if u < 0.7: return (u / 0.7) ** 2
    v = (u - 0.7) / 0.3
    return 1 - 0.06 * math.sin(v * math.pi) * (1 - v)

def s_mix(im, t, d):
    pas = d / len(MIX); i = min(len(MIX) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, nom, pil = MIX[i]
    cy = 960
    if i > 0 and u < 0.3:  # le précédent part vers le bas
        cp = MIX[i - 1][0]; k = ease(u / 0.3)
        coller(im, cp, W / 2, cy + 1400 * k, rot=-6 * k, alpha=1 - k)
    e = chute(u / 0.32)
    sens = -1 if i % 2 else 1
    coller(im, c, W / 2, -900 + (cy + 900) * e, s=1 + 0.02 * max(0, u - 0.32), rot=sens * 7 * (1 - min(1, u / 0.32)))
    a = int(255 * ease((u - 0.22) / 0.18))
    texte_centre(im, 230, nom, FT_NOM, CREAM, alpha=a)
    col = VERT if id(MIX[i]) in BIJ_IDS else (BRUN if "Marque" in nom else ROSE)
    pilule(im, W / 2, 1640, pil, FT_PIL, col, GOLD2 if col == VERT else CREAM, s=rebond(max(0, (u - 0.25) / 0.3)), alpha=a)
    if id(MIX[i]) in BIJ_IDS: texte_centre(im, 1760, "Exemple de gravure", FT_PETIT, GOLD2, alpha=int(a * 0.8))

TAMPONS = [("Gravé à la commande", ROSE), ("Dans notre atelier", VERT), ("Un cadeau unique", (120, 88, 30))]
def s_tampons(im, t, d):
    coller(im, C_AMB, W / 2, 800)
    for k, (txt, col) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1300 + 120 * k, txt, FT_TAMPON, col, CREAM, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 640, "Nouveau dans", FT_TITRE, CREAM, alpha=int(255 * ease(t / 0.5)))
    texte_centre(im, 750, "notre atelier", FT_TITRE, CREAM, alpha=int(255 * ease((t - 0.3) / 0.5)))
    texte_centre(im, 900, "Verres, bijoux, marque-pages", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1080, "nivcreation.fr", FT_URL, GOLD, ENCRE, s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1330, "NiV CRÉATION", FT_MARQUE, GOLD2, alpha=int(200 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1410, "Gravé en France", FT_PETIT, CREAM, alpha=int(200 * ease((t - 1.4) / 0.5)))

SCENES = [(3.2, s_intro), (24.0, s_mix), (2.8, s_tampons), (3.6, s_fin)]

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "46-nouveautes-1080x1920.mp4")
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
    leger = os.path.join(OUT, "46-nouveautes-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2] == "--apercu":
        for ts in [3.7, 4.0, 4.4, 6.0, 8.0, 10.0, 12.0, 13.6, 15.5, 17.4, 19.2, 21.0, 23.0, 24.8, 26.7, 29.0]:
            acc = 0
            for d, fn in SCENES:
                if ts < acc + d: break
                acc += d
            im = BOKEH.copy().convert("RGBA"); fn(im, ts - acc, d); neige(im, ts)
            im.convert("RGB").resize((360, 640)).save(os.path.join(OUT, f"apercu-{ts:05.1f}.jpg"), quality=85)
        print("ok")
    else:
        main()
