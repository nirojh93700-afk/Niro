# -*- coding: utf-8 -*-
# VIDÉO 49 (06/11/2026) — gérant : « tu me fais une vidéo avec la tamoule [et] toutes les langues que je te donne » (arabe,
# hébreu, chinois, d'après le rapport « Marché tamoul »). Pièces = les images réseaux tamoules (tools/maquettes/tamoul-reseaux.py)
# et celles des autres langues (tools/maquettes/langues-reseaux.py) : aperçus du site. À l'écran : textes en français, la phrase
# dans sa langue en or, son sens en français dessous.
# Effets de la vidéo 41 (sans neige ni Noël) : fond encre et lumières dorées floues, titre écrit lettre par lettre,
# carrousel sur le même produit, cartes qui pivotent, écran partagé, tampons qui rebondissent, bouton qui pulse.
# ⛔ Aucun prix, aucun nombre de produits, aucune date. Sans son, 1080 × 1920.
# Usage : python3 tools/video/langues_49.py <images tamoules> <images autres langues> <dossier polices> <sortie> [--apercu]
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import imageio_ffmpeg

SRC, SRC2, FD, OUT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (214, 176, 92); GOLD2 = (240, 214, 150); CREAM = (250, 246, 238); ENCRE = (26, 18, 6); BRUN = (92, 60, 24)
random.seed(49)

def police(nom, taille, axes=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille, layout_engine=ImageFont.Layout.RAQM)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f
TAM = lambda s: police("NotoSerifTamil", s, [600, 100])
AR = lambda s: police("NotoNaskhArabic", s, [700])
HE = lambda s: police("NotoSansHebrew", s, [600, 100])
ZH = lambda s: police("NotoSansSC", s, [600])
ECR = {"ta": TAM, "ar": AR, "he": HE, "zh": ZH}
PLAY = lambda s: police("PlayfairDisplay", s, [600])
PLAYI = lambda s: police("PlayfairDisplay", s, [500])
INTER = lambda s: police("Inter", s, [600])

ZONE = 790  # hauteur de la zone photo des images réseaux (le bandeau en dessous n'est pas repris)
def photo(dossier, nom): return Image.open(os.path.join(dossier, nom)).convert("RGB").crop((0, 0, 1080, ZONE))

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

def mots(im, y, lang, txt, alpha=255, taille=84):
    """Phrase dans sa langue, en or : une ligne si elle tient, sinon deux lignes coupées à un espace."""
    fab = ECR[lang]; d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f = ajuste(txt, fab, taille, 56)
    if lg(d, txt, f) <= W - 120:
        texte_centre(im, y, txt, f, GOLD2, alpha); return y + int(f.size * 1.6)
    ms = txt.split(" "); best = None
    for k in range(1, len(ms)):
        a, b = " ".join(ms[:k]), " ".join(ms[k:]); m = max(lg(d, a, fab(66)), lg(d, b, fab(66)))
        if best is None or m < best[0]: best = (m, a, b)
    f = ajuste(max(best[1], best[2], key=lambda x: lg(d, x, fab(66))), fab, 66, 44)
    texte_centre(im, y, best[1], f, GOLD2, alpha); texte_centre(im, y + int(f.size * 1.5), best[2], f, GOLD2, alpha)
    return y + int(f.size * 3.05)

def phrase(im, y, lang, txt, fr, alpha=255):
    y2 = mots(im, y, lang, txt, alpha)
    texte_centre(im, y2, fr, ajuste(fr, PLAYI, 56, 40), CREAM, alpha)

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

# ---------------------------------------------------------------- pièces (une section par langue)
CW, CH = 960, 720  # carte = photo 1080 × 790 réduite, entière
T, L = SRC, SRC2
SECTIONS = [  # (titre, langue, [(dossier, image, phrase, sens, produit)])
  ("En tamoul", "ta", [
    (T, "01-whisky-2l-anniv.jpg", "பிறந்தநாள் வாழ்த்துகள்", "Joyeux anniversaire", "Verre à whisky"),
    (T, "03-vin-2l-deepa.jpg", "இனிய தீபாவளி நல்வாழ்த்துகள்", "Joyeux Deepavali", "Verre à vin"),
    (T, "12-gobelet-rose-amma-amma.jpg", "அம்மா", "Maman", "Gobelet isotherme"),
    (T, "18-papillon-anbe.jpg", "என் அன்பே", "Mon amour", "Bracelet papillon")]),
  ("En arabe", "ar", [
    (L, "02-ar-vin.jpg", "أحبك", "Je t'aime", "Verre à vin"),
    (L, "01-ar-whisky.jpg", "عيد مبارك", "Bonne fête de l'Aïd", "Verre à whisky"),
    (L, "03-ar-chaine.jpg", "أبي", "Mon papa", "Bracelet chaîne acier")]),
  ("En hébreu", "he", [
    (L, "04-he-flute.jpg", "מזל טוב", "Félicitations", "Flûte à champagne"),
    (L, "05-he-tumbler.jpg", "שנה טובה", "Bonne année", "Verre tumbler en cristal"),
    (L, "06-he-papillon.jpg", "אהבה", "Amour", "Bracelet papillon")]),
  ("En chinois", "zh", [
    (L, "07-zh-cocktail.jpg", "新年快乐", "Bonne année", "Verre à cocktail"),
    (L, "09-zh-silicone.jpg", "爸爸", "Papa", "Bracelet acier & silicone"),
    (L, "08-zh-vin.jpg", "生日快乐", "Joyeux anniversaire", "Verre à vin")]),
]
C_SEC = [(titre, lang, [(carte(photo(dos, n), CW, CH), ta, fr, p) for dos, n, ta, fr, p in items]) for titre, lang, items in SECTIONS]
C_TAMP = carte(photo(T, "09-vin-court-anbu.jpg"), CW, CH)
FT_TITRE = PLAY(80); FT_SOUS = PLAYI(48); FT_NOM = PLAY(66); FT_PIL = INTER(34); FT_TAMPON = INTER(40); FT_URL = PLAY(64); FT_MARQUE = PLAY(54)
AMOUR = [("ta", "அன்பு"), ("ar", "حب"), ("he", "אהבה"), ("zh", "爱")]
MERCI = [("ta", "நன்றி"), ("ar", "شكرا"), ("he", "תודה"), ("zh", "谢谢")]

def ligne_mots(im, y, liste, taille, alpha):
    """Les mots de plusieurs langues côte à côte, séparés par un point doré, centrés."""
    d = ImageDraw.Draw(Image.new("RGB", (1, 1))); fs = [ECR[l](taille) for l, _ in liste]
    sep = 46; tot = sum(lg(d, t, f) for (_, t), f in zip(liste, fs)) + sep * (len(liste) - 1)
    assert tot <= W - 80, "ligne trop large"
    x = (W - tot) / 2; dd = ImageDraw.Draw(im, "RGBA")
    for i, ((l, t), f) in enumerate(zip(liste, fs)):
        b = dd.textbbox((0, 0), t, font=f); hh = b[3] - b[1]
        dd.text((x - b[0] + 3, y + (taille - hh) / 2 - b[1] + 3), t, font=f, fill=(0, 0, 0, int(alpha * .55)))
        dd.text((x - b[0], y + (taille - hh) / 2 - b[1]), t, font=f, fill=GOLD2 + (alpha,))
        x += b[2] - b[0]
        if i < len(liste) - 1: dd.ellipse((x + sep / 2 - 5, y + taille / 2 - 5, x + sep / 2 + 5, y + taille / 2 + 5), fill=GOLD + (alpha,)); x += sep

# ---------------------------------------------------------------- scènes
def s_intro(im, t, d):
    titre = ["Vos mots dans votre langue,", "gravés pour toujours"]
    n = int(len("".join(titre)) * ease(t / 1.8)); y = 600
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, y + i * 108, ligne[:k], ajuste(ligne, PLAY, 80, 56), CREAM)
    a = int(255 * ease((t - 1.8) / 0.6))
    if a > 0:
        ligne_mots(im, 900, AMOUR, 92, a)
        texte_centre(im, 1060, "« Amour »", FT_SOUS, CREAM, a)
    if t > 2.5: pilule(im, W / 2, 1210, "Tamoul · arabe · hébreu · chinois", FT_PIL, GOLD, ENCRE, s=rebond((t - 2.5) / 0.5))

# Les langues TOURNENT : jamais deux images de la même langue à la suite (gérant, 06/11/2026 :
# « tu commences par le tamoul, l'image d'après l'arabe ou le chinois… chaque langue ça tourne »).
TOURS = [("ta", "ar", "zh", "he"), ("ta", "zh", "he", "ar"), ("ta", "he", "ar", "zh"), ("ta",)]
def _rotation():
    pile = {lang: [(titre, lang) + x for x in cartes] for titre, lang, cartes in C_SEC}
    out = [pile[l].pop(0) for tour in TOURS for l in tour if pile[l]]
    assert sum(len(v) for v in pile.values()) == 0, "carte oubliée"
    assert all(a[1] != b[1] for a, b in zip(out, out[1:])), "deux fois la même langue de suite"
    assert all(a[5] != b[5] for a, b in zip(out, out[1:])), "deux fois le même produit de suite"
    return out
ROTATION = _rotation()  # (titre, langue, carte, phrase, sens, produit)
PAS = 2.5

def s_tour(im, t, d):
    i = min(len(ROTATION) - 1, int(t / PAS)); u = (t - i * PAS) / PAS
    titre, lang, c, ta, fr, nom = ROTATION[i]
    if i == 0:  # la 1re carte pivote en entrant
        e = ease(u / 0.3)
        if e < 1: coller(im, c.resize((max(2, int(CW * e)), CH), Image.BILINEAR), W / 2, 860, rot=(1 - e) * 8)
        else: coller(im, c, W / 2, 860, s=1 + 0.03 * (u - 0.3))
        texte_centre(im, 230, titre, FT_NOM, CREAM, int(255 * ease(u / 0.15)))
    elif u < 0.25:  # la précédente glisse à gauche, la nouvelle arrive de droite, le titre de langue change
        e = ease(u / 0.25); prev = ROTATION[i - 1]
        coller(im, prev[2], W / 2 - W * e, 860, alpha=1 - e)
        coller(im, c, W / 2 + W * (1 - e), 860, rot=(1 - e) * -4)
        if e < 0.5: texte_centre(im, 230, prev[0], FT_NOM, CREAM, int(255 * (1 - 2 * e)))
        else: texte_centre(im, 230, titre, FT_NOM, CREAM, int(255 * (2 * e - 1)))
    else:
        coller(im, c, W / 2, 860, s=1 + 0.02 * (u - 0.25))
        texte_centre(im, 230, titre, FT_NOM, CREAM)
    a = int(255 * ease((u - 0.2) / 0.2)) if i else int(255 * ease((u - 0.25) / 0.2))
    phrase(im, 1300, lang, ta, fr, alpha=a)
    pilule(im, W / 2, 1640, nom, FT_PIL, BRUN, CREAM, alpha=a)

TAMPONS = [("Votre texte dans votre langue", GOLD, ENCRE), ("Gravé dans notre atelier", BRUN, CREAM), ("Pour toute la famille", (60, 40, 18), GOLD2)]
def s_tampons(im, t, d):
    coller(im, C_TAMP, W / 2, 760, s=0.78)
    for k, (txt, col, coul) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1250 + 125 * k, txt, FT_TAMPON, col, coul, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 560, "Offrez des mots", FT_TITRE, CREAM, int(255 * ease(t / 0.5)))
    texte_centre(im, 670, "qui viennent du cœur", FT_TITRE, CREAM, int(255 * ease((t - 0.3) / 0.5)))
    ligne_mots(im, 840, MERCI, 76, int(255 * ease((t - 0.5) / 0.5)))
    texte_centre(im, 975, "« Merci »", FT_SOUS, CREAM, int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1120, "nivcreation.fr", FT_URL, GOLD, ENCRE, s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1350, "NiV CRÉATION", FT_MARQUE, GOLD2, int(220 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1430, "Gravé en France", INTER(34), CREAM, int(220 * ease((t - 1.4) / 0.5)))

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
    out = os.path.join(OUT, "49-langues-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(nf): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "49-langues-720x1280.mp4")
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
        for x in (3.5, 6.0, 15.0, 22.0, 30.0, 38.0, 43.0):
            image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", len(ims))
    else:
        main()
