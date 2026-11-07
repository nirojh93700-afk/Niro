# -*- coding: utf-8 -*-
# VIDÉO 51 (07/11/2026) — gérant : « fais-moi une vidéo ». Le gobelet isotherme 40 oz gravé (édition limitée) : les 9 exemples
# gravés de la fiche + 2 photos d'ambiance gravées (crème, rose ; les photos marine / blanc portent des textes anglais de démo,
# écartées). Effets de la 41 / 50 sans neige. ⛔ Aucun prix, aucun nombre de stock. Sans son, 1080 × 1920.
# Usage : python3 tools/video/gobelet_51.py <polices> <sortie> [--apercu]   (depuis la racine du dépôt)
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import imageio_ffmpeg

FD, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (214, 176, 92); GOLD2 = (240, 214, 150); CREAM = (250, 246, 238); ENCRE = (26, 18, 6); BRUN = (92, 60, 24)
random.seed(51)

def police(nom, taille, axes=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille, layout_engine=ImageFont.Layout.RAQM)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f
PLAY = lambda s: police("PlayfairDisplay", s, [600])
PLAYI = lambda s: police("PlayfairDisplay", s, [500])
INTER = lambda s: police("Inter", s, [600])

def carte(img, cw, ch, rayon=36):
    """Photo ENTIÈRE posée dans une carte arrondie, fond = couleur de la photo (jamais recadrée)."""
    px = img.resize((1, 1), Image.BOX).getpixel((0, 0))
    bordc = [img.getpixel((x, y)) for x, y in ((2, 2), (img.width - 3, 2), (2, img.height - 3), (img.width - 3, img.height - 3))]
    fond = tuple(sorted(c[i] for c in bordc)[1] for i in range(3)) if bordc else px
    c = Image.new("RGB", (cw, ch), fond)
    im = img.copy(); im.thumbnail((cw - 24, ch - 24), Image.LANCZOS)
    c.paste(im, ((cw - im.width) // 2, (ch - im.height) // 2))
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, ch - 1), rayon, fill=255)
    out = Image.new("RGBA", (cw, ch)); out.paste(c, (0, 0), m)
    ImageDraw.Draw(out).rounded_rectangle((0, 0, cw - 1, ch - 1), rayon, outline=GOLD + (255,), width=3)
    return out

# ---------------------------------------------------------------- fond : encre chaude, lumières dorées floues, paillettes
def fond_bokeh():
    g = np.zeros((H, W, 3), np.float32); yy = np.linspace(0, 1, H)[:, None]
    for i, (a, b) in enumerate(zip((30, 21, 9), (14, 9, 4))): g[..., i] = a * (1 - yy) + b * yy
    im = Image.fromarray(g.clip(0, 255).astype(np.uint8))
    lum = Image.new("RGB", (W, H)); d = ImageDraw.Draw(lum)
    for _ in range(44):
        r = random.randint(30, 110); x = random.randint(-50, W + 50); y = random.randint(-50, H + 50)
        col = random.choice([(214, 176, 92), (240, 200, 120), (170, 90, 40), (255, 230, 170)])
        k = random.uniform(0.2, 0.6); d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(c * k) for c in col))
    return ImageChops.add(im, lum.filter(ImageFilter.GaussianBlur(26)))
BOKEH = fond_bokeh()
PAILLETTES = [[random.uniform(0, W), random.uniform(0, H), random.uniform(1.5, 4), random.uniform(18, 50), random.uniform(0, 6.28)] for _ in range(90)]

def paillettes(im, t):  # poussière dorée qui monte doucement et scintille
    d = ImageDraw.Draw(im, "RGBA")
    for x, y0, r, v, ph in PAILLETTES:
        y = (y0 - v * t) % (H + 40) - 20; xx = x + 14 * math.sin(t * 0.9 + ph)
        a = int(150 * (0.5 + 0.5 * math.sin(t * 3 + ph * 2)))
        d.ellipse((xx - r, y - r, xx + r, y + r), fill=GOLD2 + (a,))

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def rebond(x):
    x = max(0.0, min(1.0, x)); return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2

def lg(d, txt, f): b = d.textbbox((0, 0), txt, font=f); return b[2] - b[0]
def texte_centre(im, y, txt, font, fill, alpha=255, ombre=True):
    d = ImageDraw.Draw(im, "RGBA"); w = lg(d, txt, font)
    assert w <= W - 60, f"texte trop large : {txt} ({w} px)"
    b = d.textbbox((0, 0), txt, font=font); x = (W - w) / 2 - b[0]
    if ombre: d.text((x + 3, y + 3), txt, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
    d.text((x, y), txt, font=font, fill=fill + (alpha,))

def ajuste(txt, fabrique, taille, mini, maxw=W - 120):
    d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    while taille > mini and lg(d, txt, fabrique(taille)) > maxw: taille -= 2
    return fabrique(taille)

def pilule(im, cx, y, txt, font, fond, coul, s=1.0, alpha=255):
    d0 = ImageDraw.Draw(im); b = d0.textbbox((0, 0), txt, font=font); w = b[2] - b[0]; hh = font.size + 34
    pw, ph = int(w + 70), hh
    assert pw <= W - 40, f"pilule trop large : {txt}"
    p = Image.new("RGBA", (pw, ph)); d = ImageDraw.Draw(p)
    d.rounded_rectangle((0, 0, pw - 1, ph - 1), ph // 2, fill=fond + (alpha,))
    d.text((35 - b[0], (ph - font.size) / 2 - b[1] * 0.25), txt, font=font, fill=coul + (alpha,))
    if s != 1.0 and s > 0.05: p = p.resize((max(1, int(pw * s)), max(1, int(ph * s))), Image.LANCZOS)
    if s > 0.05: im.paste(p, (int(cx - p.width / 2), int(y + (ph - p.height) / 2)), p)

def coller(im, c, cx, cy, s=1.0, rot=0.0, alpha=1.0):
    if s <= 0.02 or alpha <= 0.01: return
    x = c if s == 1 else c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = x.split()[3].point(lambda v: int(v * alpha)); x = x.copy(); x.putalpha(a)
    sh = Image.new("RGBA", x.size, (0, 0, 0, 0)); sh.putalpha(x.split()[3].point(lambda v: int(v * 0.5)))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    im.paste(sh, (int(cx - x.width / 2) + 10, int(cy - x.height / 2) + 22), sh)
    im.paste(x, (int(cx - x.width / 2), int(cy - x.height / 2)), x)

# ---------------------------------------------------------------- pièces
CW, CH = 960, 900

def carte_photo(chemin, cw=CW, ch=CH, rayon=36):
    """Photo du site ENTIÈRE dans une carte : fond = la même photo floutée (jamais recadrée)."""
    img = Image.open(os.path.join("public", chemin)).convert("RGB")
    r = max(cw / img.width, ch / img.height)
    fond = img.resize((int(img.width * r) + 2, int(img.height * r) + 2), Image.LANCZOS)
    fond = fond.crop(((fond.width - cw) // 2, (fond.height - ch) // 2, (fond.width - cw) // 2 + cw, (fond.height - ch) // 2 + ch))
    fond = fond.filter(ImageFilter.GaussianBlur(28)).point(lambda v: int(v * 0.8))
    coins = [img.getpixel(xy) for xy in ((3, 3), (img.width - 4, 3), (3, img.height - 4), (img.width - 4, img.height - 4))]
    if all(min(c) > 240 for c in coins): fond = Image.new("RGB", (cw, ch), (255, 255, 255))  # photo sur fond blanc : carte blanche
    k = min((cw - 24) / img.width, (ch - 24) / img.height)
    im = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    fond.paste(im, ((cw - im.width) // 2, (ch - im.height) // 2))
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, ch - 1), rayon, fill=255)
    out = Image.new("RGBA", (cw, ch)); out.paste(fond, (0, 0), m)
    ImageDraw.Draw(out).rounded_rectangle((0, 0, cw - 1, ch - 1), rayon, outline=GOLD + (255,), width=3)
    return out

G = "produits/gobelet/"
# (titre, image, phrase, couleur du gobelet)
PIECES = [
  ("Un motif tout autour", "produits/gobelet-creme-grave.jpg", "Des fleurs gravées sur tout le gobelet", "Crème"),
  ("Un dessin et un prénom", G + "ex2-marine-cheval-paul.jpg", "Un cheval pour Paul", "Bleu marine"),
  ("Votre photo gravée", G + "ex7-rose-photo-couple.jpg", "Votre photo de couple et votre date", "Rose"),
  ("Un dessin et un prénom", G + "ex1-creme-papillon-camille.jpg", "Un papillon fleuri pour Camille", "Crème"),
  ("Votre texte", G + "ex6-marine-texte-super-papy.jpg", "Super Papy, depuis 2026", "Bleu marine"),
  ("Un dessin et un prénom", G + "ex3-rose-rose-lea.jpg", "Une rose pour Léa", "Rose"),
  ("Votre photo gravée", G + "ex8-blanc-photo-maman.jpg", "Le portrait de maman", "Blanc"),
  ("Votre photo gravée", G + "ex5-creme-photo-meilleur-ami.jpg", "Son meilleur ami, pour toujours", "Crème"),
  ("Plusieurs images", G + "ex9-marine-plusieurs-images.jpg", "Dessins, cadre et prénom ensemble", "Bleu marine"),
  ("Un dessin et un prénom", G + "ex4-blanc-colibri-ines.jpg", "Un colibri pour Inès", "Blanc"),
  ("Un dessin tout autour", "produits/gobelet-rose-grave.jpg", "Des fleurs gravées tout autour", "Rose"),
]
ROTATION = [(t, carte_photo(img), ph, coul) for t, img, ph, coul in PIECES]
assert all(a[3] != b[3] for a, b in zip(PIECES, PIECES[1:])), "deux fois la même couleur de suite"
C_TAMP = carte_photo(G + "ex1-creme-papillon-camille.jpg")
C_INTRO = [carte_photo("produits/gobelet-%s-grave.jpg" % c, 520, 520, 28) for c in ("creme", "rose")]
FT_TITRE = PLAY(80); FT_NOM = PLAY(64); FT_PIL = INTER(34); FT_TAMPON = INTER(40); FT_URL = PLAY(64); FT_MARQUE = PLAY(54)

# ---------------------------------------------------------------- scènes
def s_intro(im, t, d):
    titre = ["Votre gobelet isotherme,", "gravé pour vous"]
    n = int(len("".join(titre)) * ease(t / 1.6)); y = 330
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, y + i * 108, ligne[:k], ajuste(ligne, PLAY, 80, 56), CREAM)
    for j, c in enumerate(C_INTRO):
        u = (t - 1.0 - 0.35 * j) / 0.6
        if u > 0:
            cx = W / 2 + (-245 if j == 0 else 245)
            coller(im, c, cx + (1 - ease(u)) * (-500 if j == 0 else 500), 960, s=0.9, rot=(4 if j == 0 else -4) * ease(u), alpha=min(1, ease(u) * 1.5))
    if t > 2.4: pilule(im, W / 2, 1360, "Édition limitée", FT_PIL, GOLD, ENCRE, s=rebond((t - 2.4) / 0.5))
    texte_centre(im, 1520, "40 oz · 1,1 L · 4 couleurs", INTER(36), CREAM, int(230 * ease((t - 2.8) / 0.5)))

PAS = 2.4
def bas(im, r, alpha):
    texte_centre(im, 1450, r[2], ajuste(r[2], PLAYI, 58, 42), CREAM, alpha)
    pilule(im, W / 2, 1600, "Gobelet " + r[3].lower(), FT_PIL, BRUN, CREAM, alpha=alpha)

CY = 900
ENTREES = ["droite", "chute", "zoom", "gauche"]
def s_tour(im, t, d):
    i = min(len(ROTATION) - 1, int(t / PAS)); u = (t - i * PAS) / PAS
    r = ROTATION[i]; titre, c = r[0], r[1]
    if i == 0:
        e = ease(u / 0.3)
        if e < 1: coller(im, c.resize((max(2, int(CW * e)), CH), Image.BILINEAR), W / 2, CY, rot=(1 - e) * 8)
        else: coller(im, c, W / 2, CY, s=1 + 0.03 * (u - 0.3))
        texte_centre(im, 230, titre, FT_NOM, CREAM, int(255 * ease(u / 0.15)))
    elif u < 0.25:
        e = ease(u / 0.25); prev = ROTATION[i - 1]; mode = ENTREES[i % len(ENTREES)]
        coller(im, prev[1], W / 2 - W * e if mode != "gauche" else W / 2 + W * e, CY, alpha=1 - e)
        if mode == "droite": coller(im, c, W / 2 + W * (1 - e), CY, rot=(1 - e) * -4)
        elif mode == "gauche": coller(im, c, W / 2 - W * (1 - e), CY, rot=(1 - e) * 4)
        elif mode == "chute": coller(im, c, W / 2, CY - 1000 * (1 - rebond(u / 0.25)), alpha=min(1, e * 2))
        else: coller(im, c, W / 2, CY, s=0.3 + 0.7 * rebond(u / 0.25), alpha=min(1, e * 2))
        if e < 0.5: texte_centre(im, 230, prev[0], FT_NOM, CREAM, int(255 * (1 - 2 * e)))
        else: texte_centre(im, 230, titre, FT_NOM, CREAM, int(255 * (2 * e - 1)))
        if u < 0.08:
            fl = Image.new("RGBA", (W, H), GOLD2 + (int(90 * (1 - u / 0.08)),)); im.alpha_composite(fl)
    else:
        coller(im, c, W / 2, CY, s=1 + 0.02 * (u - 0.25))
        texte_centre(im, 230, titre, FT_NOM, CREAM)
    a = int(255 * ease((u - 0.2) / 0.2)) if i else int(255 * ease((u - 0.25) / 0.2))
    bas(im, r, a)

TAMPONS = [("Un dessin, un texte ou votre photo", GOLD, ENCRE), ("Gravé dans notre atelier", BRUN, CREAM), ("Un cadeau qu'on garde au quotidien", (60, 40, 18), GOLD2)]
def s_tampons(im, t, d):
    coller(im, C_TAMP, W / 2, 760, s=0.72)
    for k, (txt, col, coul) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1250 + 125 * k, txt, ajuste(txt, INTER, 40, 30, W - 160), col, coul, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 560, "Offrez un cadeau", FT_TITRE, CREAM, int(255 * ease(t / 0.5)))
    texte_centre(im, 670, "qui leur ressemble", FT_TITRE, CREAM, int(255 * ease((t - 0.3) / 0.5)))
    if t > 0.7: pilule(im, W / 2, 850, "Gobelet isotherme · édition limitée", FT_PIL, BRUN, CREAM, s=rebond((t - 0.7) / 0.5))
    if t > 1.0:
        s = 1 + 0.05 * math.sin((t - 1.0) * 5)
        pilule(im, W / 2, 1100, "nivcreation.fr", FT_URL, GOLD, ENCRE, s=rebond((t - 1.0) / 0.5) * s)
    texte_centre(im, 1330, "NiV CRÉATION", FT_MARQUE, GOLD2, int(220 * ease((t - 1.3) / 0.5)))
    texte_centre(im, 1410, "Gravé en France", INTER(34), CREAM, int(220 * ease((t - 1.5) / 0.5)))

SCENES = [(3.8, s_intro), (PAS * len(ROTATION) + 0.3, s_tour), (2.8, s_tampons), (4.0, s_fin)]

def image(t):
    acc = 0
    for d, fn in SCENES:
        if t < acc + d or fn is SCENES[-1][1]: break
        acc += d
    im = BOKEH.copy().convert("RGBA"); lt = t - acc
    fn(im, lt, d); paillettes(im, t)
    rgb = im.convert("RGB")
    k = lt / 0.2 if fn is s_intro else min(lt / 0.18, (d - lt) / 0.18, 1.0)
    if fn is SCENES[-1][1]: k = min(1.0, lt / 0.18)
    if k < 1: rgb = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), rgb, max(0.0, k))
    return rgb

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "51-gobelet-grave-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(nf): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "51-gobelet-grave-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if "--apercu" in sys.argv:
        total = sum(d for d, _ in SCENES); ts = [x * 0.8 for x in range(int(total / 0.8) + 1)]
        ims = [image(x).resize((216, 384)) for x in ts]
        cols = 10; rows = math.ceil(len(ims) / cols)
        pl = Image.new("RGB", (cols * 216, rows * 384))
        for i, x in enumerate(ims): pl.paste(x, ((i % cols) * 216, (i // cols) * 384))
        pl.save(os.path.join(OUT, "apercu-planche.jpg"), quality=82)
        for x in (3.5, 5.0, 7.4, 10.0, 14.0, 20.0, 27.0, 31.5, 33.5, 37.0):
            image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", len(ims))
    else:
        main()
