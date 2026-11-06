# -*- coding: utf-8 -*-
# VIDÉO 48 (06/11/2026) — gérant : « une vidéo pour les communautés tamoul avec les tags qui correspondent au tamoul…
# tu écris en français, comme sur les visuels pour les bijoux, et en bas tu mets [la traduction] en français ».
# Pièces = les 18 images « réseaux » de tools/maquettes/tamoul-reseaux.py (aperçus du site, gobelets, bijoux gravés en tamoul),
# on garde la zone photo (produit entier) et on écrit sur la vidéo : la phrase tamoule en or, son sens en français dessous.
# Effets de la vidéo 41 (sans neige ni Noël) : fond encre et lumières dorées floues, titre écrit lettre par lettre,
# carrousel sur le même produit, cartes qui pivotent, écran partagé, tampons qui rebondissent, bouton qui pulse.
# ⛔ Aucun prix, aucun nombre de produits, aucune date. Sans son, 1080 × 1920.
# Usage : python3 tools/video/tamoul_48.py <dossier images réseaux> <dossier polices> <dossier de sortie> [--apercu]
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import imageio_ffmpeg

SRC, FD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (214, 176, 92); GOLD2 = (240, 214, 150); CREAM = (250, 246, 238); ENCRE = (26, 18, 6); BRUN = (92, 60, 24)
random.seed(48)

def police(nom, taille, axes=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille, layout_engine=ImageFont.Layout.RAQM)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f
TAM = lambda s: police("NotoSerifTamil", s, [600, 100])
PLAY = lambda s: police("PlayfairDisplay", s, [600])
PLAYI = lambda s: police("PlayfairDisplay", s, [500])
INTER = lambda s: police("Inter", s, [600])

PH = {  # phrase tamoule, sens en français (les mêmes que les visuels)
  "anniv": ("பிறந்தநாள் வாழ்த்துகள்", "Joyeux anniversaire"), "noel": ("இனிய கிறிஸ்துமஸ் வாழ்த்துகள்", "Joyeux Noël"),
  "deepa": ("இனிய தீபாவளி நல்வாழ்த்துகள்", "Joyeux Deepavali"), "puthandu": ("இனிய தமிழ் புத்தாண்டு நல்வாழ்த்துகள்", "Bonne année tamoule"),
  "mariage": ("திருமண நல்வாழ்த்துகள்", "Félicitations pour votre mariage"), "nandri": ("நன்றி", "Merci"), "amma": ("அம்மா", "Maman"),
  "appa": ("அப்பா", "Papa"), "best-appa": ("உலகின் சிறந்த அப்பா", "Le meilleur papa du monde"), "anbu": ("அன்பு", "Amour"),
  "anbe": ("என் அன்பே", "Mon amour"), "kadhal": ("உன்னை காதலிக்கிறேன்", "Je t'aime"),
}

ZH = 790  # hauteur de la zone photo des images réseaux (le bandeau en dessous n'est pas repris)
def photo(nom): return Image.open(os.path.join(SRC, nom)).convert("RGB").crop((0, 0, 1080, ZH))

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

def tamoul(im, y, txt, alpha=255, taille=78):
    """Phrase tamoule en or : une ligne si elle tient, sinon deux lignes coupées à un espace."""
    d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    f = ajuste(txt, TAM, taille, 56)
    if lg(d, txt, f) <= W - 120:
        texte_centre(im, y, txt, f, GOLD2, alpha); return y + int(f.size * 1.55)
    mots = txt.split(" "); best = None
    for k in range(1, len(mots)):
        a, b = " ".join(mots[:k]), " ".join(mots[k:]); m = max(lg(d, a, TAM(66)), lg(d, b, TAM(66)))
        if best is None or m < best[0]: best = (m, a, b)
    f = ajuste(max(best[1], best[2], key=lambda s: lg(d, s, TAM(66))), TAM, 66, 44)
    texte_centre(im, y, best[1], f, GOLD2, alpha); texte_centre(im, y + int(f.size * 1.5), best[2], f, GOLD2, alpha)
    return y + int(f.size * 3.05)

def phrase(im, y, cle, alpha=255):
    ta, fr = PH[cle]
    y2 = tamoul(im, y, ta, alpha)
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

# ---------------------------------------------------------------- pièces
CW, CH = 960, 720  # carte = photo 1080 × 790 réduite, entière
def C(nom): return carte(photo(nom), CW, CH)
CARROUSEL = [("01-whisky-2l-anniv.jpg", "anniv"), ("07-whisky-court-appa.jpg", "appa")]  # même verre, deux phrases
FETES = [("03-vin-2l-deepa.jpg", "deepa", "Verre à vin"), ("06-tumbler-2l-puthandu.jpg", "puthandu", "Verre tumbler en cristal"),
         ("04-flute-2l-mariage.jpg", "mariage", "Flûte à champagne"), ("02-cocktail-2l-noel.jpg", "noel", "Verre à cocktail"),
         ("08-tumbler-court-nandri.jpg", "nandri", "Verre tumbler en cristal")]
GOBELETS = [("11-gobelet-marine-appa-appa.jpg", "appa"), ("12-gobelet-rose-amma-amma.jpg", "amma")]
BIJOUX = [("14-plaque-amma.jpg", "amma", "Collier plaque acier"), ("16-chaine-best-appa.jpg", "best-appa", "Bracelet chaîne acier"),
          ("18-papillon-anbe.jpg", "anbe", "Bracelet papillon"), ("19-coeur-ouvrable-kadhal.jpg", "kadhal", "Médaillon cœur ouvrable"),
          ("20-coeur-grave-anbu.jpg", "anbu", "Collier cœur gravé"), ("15-gourmette-appa.jpg", "appa", "Bracelet gourmette")]
C_CAR = [(C(n), k) for n, k in CARROUSEL]
C_FETES = [(C(n), k, p) for n, k, p in FETES]
C_GOB = [(carte(photo(n), 500, 640), k) for n, k in GOBELETS]
C_BIJ = [(C(n), k, p) for n, k, p in BIJOUX]
C_TAMP = C("09-vin-court-anbu.jpg")
FT_TITRE = PLAY(80); FT_SOUS = PLAYI(48); FT_NOM = PLAY(62); FT_PIL = INTER(34); FT_TAMPON = INTER(40); FT_URL = PLAY(64); FT_MARQUE = PLAY(54)

# ---------------------------------------------------------------- scènes
def s_intro(im, t, d):
    titre = ["Vos mots en tamoul,", "gravés pour toujours"]
    n = int(len("".join(titre)) * ease(t / 1.7)); y = 640
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, y + i * 108, ligne[:k], FT_TITRE, CREAM)
    a = int(255 * ease((t - 1.7) / 0.6))
    if a > 0:
        texte_centre(im, 920, "அன்பு", TAM(120), GOLD2, a)
        texte_centre(im, 1110, "« Amour »", FT_SOUS, CREAM, a)
    if t > 2.3: pilule(im, W / 2, 1260, "Un cadeau qui parle votre langue", FT_PIL, GOLD, ENCRE, s=rebond((t - 2.3) / 0.5))

def s_carrousel(im, t, d):
    texte_centre(im, 230, "Un même verre,", FT_NOM, CREAM)
    texte_centre(im, 310, "les mots de votre choix", FT_NOM, CREAM)
    pas = d / len(C_CAR); i = min(len(C_CAR) - 1, int(t / pas)); u = (t - i * pas) / pas
    cx, cy = W / 2, 860
    if i > 0 and u < 0.25:
        coller(im, C_CAR[i - 1][0], cx, cy, alpha=1 - u / 0.25); coller(im, C_CAR[i][0], cx, cy, s=0.94 + 0.06 * ease(u / 0.25), alpha=u / 0.25)
    else: coller(im, C_CAR[i][0], cx, cy)
    phrase(im, 1300, C_CAR[i][1], alpha=int(255 * ease(u / 0.25)))
    pilule(im, W / 2, 1620, "Verre à whisky", FT_PIL, BRUN, CREAM, s=rebond(min(1, u / 0.3)))

def s_fetes(im, t, d):
    texte_centre(im, 230, "Pour chaque fête", FT_NOM, CREAM, int(255 * ease(t / 0.4)))
    pas = d / len(C_FETES); i = min(len(C_FETES) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, cle, nom = C_FETES[i]
    e = ease(u / 0.28)
    if e < 1: coller(im, c.resize((max(2, int(CW * e)), CH), Image.BILINEAR), W / 2, 860, rot=(1 - e) * 8)
    else: coller(im, c, W / 2 - 16 * (u - 0.28), 860, s=1 + 0.03 * (u - 0.28))
    if i > 0 and u < 0.2: coller(im, C_FETES[i - 1][0], W / 2 - W * ease(u / 0.2), 860, alpha=1 - u / 0.2)
    a = int(255 * ease((u - 0.2) / 0.2))
    phrase(im, 1300, cle, alpha=a)
    pilule(im, W / 2, 1620, nom, FT_PIL, BRUN, CREAM, alpha=a)

def s_gobelets(im, t, d):
    e = ease(t / 0.8); (c1, k1), (c2, k2) = C_GOB
    coller(im, c1, -300 + (W / 2 - 262 + 300) * e, 860, rot=-3 * e)
    coller(im, c2, W + 300 - (W + 300 - (W / 2 + 262)) * e, 890, rot=3 * e)
    a = int(255 * ease((t - 0.6) / 0.5))
    texte_centre(im, 250, "Pour Appa et Amma", FT_NOM, CREAM, a)
    for cx, cle in ((W / 2 - 262, k1), (W / 2 + 262, k2)):
        ta, fr = PH[cle]; dd = ImageDraw.Draw(im, "RGBA")
        for y, txt, f, col in ((1250, ta, TAM(78), GOLD2), (1385, fr, PLAYI(52), CREAM)):
            b = dd.textbbox((0, 0), txt, font=f); w = b[2] - b[0]
            dd.text((cx - w / 2 - b[0] + 3, y + 3), txt, font=f, fill=(0, 0, 0, int(a * 0.55)))
            dd.text((cx - w / 2 - b[0], y), txt, font=f, fill=col + (a,))
    pilule(im, W / 2, 1560, "Gobelet isotherme gravé", FT_PIL, BRUN, CREAM, alpha=int(255 * ease((t - 1.0) / 0.5)))

def s_bijoux(im, t, d):
    texte_centre(im, 230, "Et sur vos bijoux", FT_NOM, CREAM, int(255 * ease(t / 0.4)))
    pas = d / len(C_BIJ); i = min(len(C_BIJ) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, cle, nom = C_BIJ[i]
    if i > 0 and u < 0.3:
        e = ease(u / 0.3)
        coller(im, C_BIJ[i - 1][0], W / 2, 860 + 80 * e, s=1 - 0.1 * e, alpha=1 - e)
        coller(im, c, W / 2, 860, s=0.85 + 0.15 * e, rot=(1 - e) * -6, alpha=e)
    else: coller(im, c, W / 2, 860, s=1 + 0.02 * u)
    a = int(255 * ease((u - 0.15) / 0.2)) if i else int(255 * ease(u / 0.2))
    phrase(im, 1300, cle, alpha=a)
    pilule(im, W / 2, 1620, nom, FT_PIL, BRUN, CREAM, alpha=a)

TAMPONS = [("Votre texte écrit en tamoul", GOLD, ENCRE), ("Gravé dans notre atelier", BRUN, CREAM), ("Pour toute la famille", (60, 40, 18), GOLD2)]
def s_tampons(im, t, d):
    coller(im, C_TAMP, W / 2, 760, s=0.78)
    for k, (txt, col, coul) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1250 + 125 * k, txt, FT_TAMPON, col, coul, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 600, "Offrez des mots", FT_TITRE, CREAM, int(255 * ease(t / 0.5)))
    texte_centre(im, 710, "qui viennent du cœur", FT_TITRE, CREAM, int(255 * ease((t - 0.3) / 0.5)))
    texte_centre(im, 860, "நன்றி", TAM(96), GOLD2, int(255 * ease((t - 0.5) / 0.5)))
    texte_centre(im, 1010, "« Merci »", FT_SOUS, CREAM, int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1150, "nivcreation.fr", FT_URL, GOLD, ENCRE, s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1380, "NiV CRÉATION", FT_MARQUE, GOLD2, int(220 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1460, "Gravé en France", INTER(34), CREAM, int(220 * ease((t - 1.4) / 0.5)))

SCENES = [(3.6, s_intro), (4.6, s_carrousel), (11.0, s_fetes), (3.8, s_gobelets), (12.6, s_bijoux), (2.8, s_tampons), (3.8, s_fin)]

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
    out = os.path.join(OUT, "48-tamoul-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(nf): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "48-tamoul-720x1280.mp4")
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
        for x in (2.9, 6.0, 12.0, 21.5, 28.0, 39.0, 41.0):
            image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", len(ims))
    else:
        main()
