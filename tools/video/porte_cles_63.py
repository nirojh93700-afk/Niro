# Vidéo 63 (16/11/2026) — les porte-clés en cristal gravé, LED. Style NEUF « interrupteur » : la photo (polaroïd) entre dans le
# cristal, le porte-clés se balance au jour, puis la lumière s'éteint et il s'allume (LED). Sans son, aucun prix.
# Usage (racine du dépôt) : python3 tools/video/porte_cles_63.py <polices> <sortie> [--apercu]
import os, sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import imageio_ffmpeg
sys.path.insert(0, os.path.dirname(__file__))
from porte_cles_63_prep import composer, SUPPORTS, PORTRAITS

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
CREME = (246, 238, 224); ENCRE = (34, 24, 14); OR = (201, 162, 75); OR_C = (232, 200, 120); NUIT = (16, 12, 10)
F = lambda n, s, w: (lambda f: (f.set_variation_by_axes([w]) if True else None, f)[1])(ImageFont.truetype(os.path.join(FD, n + ".ttf"), s))
def font(n, s, w):
    f = ImageFont.truetype(os.path.join(FD, n + ".ttf"), s)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f
PLAY = lambda s, w=700: font("PlayfairDisplay", s, w); INTER = lambda s, w=600: font("Inter", s, w)
def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def easeio(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

# Les scènes : (support, portrait, couleur LED, nom, phrase)
SCENES = [
  ("coeur", "couple", "rose", "Le cœur", "Vos deux visages, partout avec vous"),
  ("rect", "enfant-chien", "bleu", "Le rectangle", "Son meilleur ami, gravé en 3D"),
  ("coeur", "maman", "violet", "Le cœur", "Le portrait de maman, en poche"),
  ("rect", "enfant-chat", "vert", "Le rectangle", "Un souvenir d'enfance qui s'allume"),
  ("coeur", "famille", "rose", "Le cœur", "Celles qu'on aime, au bout des clés"),
  ("rect", "couple", "blanc", "Le rectangle", "Votre plus belle photo, en cristal"),
]
DUREE_SCENE = 4.2
T_INTRO, T_FIN = 2.6, 3.4
TOTAL = T_INTRO + len(SCENES) * DUREE_SCENE + T_FIN

def carre(img, cote):
    return ImageOps.fit(img, (cote, cote), Image.LANCZOS, centering=(0.5, 0.55))
IMGS = []
for sup, por, led, nom, phr in SCENES:
    jour = carre(composer(sup, por, None), 900); nuit = carre(composer(sup, por, led), 900)
    src = Image.open(PORTRAITS[por][0]).convert("RGB"); b = PORTRAITS[por][1]
    if b: src = src.crop((int(b[0] * src.width), int(b[1] * src.height), int(b[2] * src.width), int(b[3] * src.height)))
    src = ImageOps.grayscale(src).convert("RGB")
    pol = Image.new("RGB", (330, 390), (252, 250, 246)); pol.paste(ImageOps.fit(src, (290, 290), Image.LANCZOS, centering=(0.5, 0.4)), (20, 20))
    IMGS.append((jour, nuit, pol))
# Mosaïque de fin.
FIN = [carre(composer(s, p, l), 330) for s, p, l, *_ in SCENES]

def fond(c1, c2):
    g = np.linspace(0, 1, H)[:, None, None]
    return Image.fromarray((np.array(c1) * (1 - g) + np.array(c2) * g).astype(np.uint8).repeat(W, 1))
FOND_JOUR = fond((250, 244, 233), (232, 220, 200)); FOND_NUIT = fond((20, 15, 12), (8, 6, 5))

def coller_rot(base, img, cx, cy, ang, a=1.0, ombre=True):
    r = img.convert("RGBA").rotate(ang, resample=Image.BICUBIC, expand=True)
    if a < 1: r.putalpha(r.getchannel("A").point(lambda v: int(v * a)))
    if ombre:
        s = Image.new("RGBA", r.size, (0, 0, 0, 0)); s.putalpha(r.getchannel("A").point(lambda v: int(v * .28 * a)))
        s = s.filter(ImageFilter.GaussianBlur(18)); base.alpha_composite(s, (int(cx - r.width / 2 + 10), int(cy - r.height / 2 + 22)))
    base.alpha_composite(r, (int(cx - r.width / 2), int(cy - r.height / 2)))

def arrondi(img, r):
    m = Image.new("L", img.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width, img.height), r, fill=255)
    o = img.convert("RGBA"); o.putalpha(m); return o

def texte_centre(d, y, t, f, c):
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=c)

def image(t):
    if t < T_INTRO:
        k = ease(t / 0.9)
        im = FOND_JOUR.copy().convert("RGBA"); d = ImageDraw.Draw(im)
        coller_rot(im, arrondi(IMGS[0][0], 40).resize((640, 640)), W / 2, 1180 + (1 - k) * 200, math.sin(t * 2.2) * 3, a=k)
        texte_centre(d, 420 - (1 - k) * 40, "Votre photo,", PLAY(92, 600), ENCRE)
        texte_centre(d, 530 - (1 - k) * 40, "toujours sur vous", PLAY(92, 700), (150, 116, 40))
        texte_centre(d, 680, "Porte-clés en cristal, gravé en 3D", INTER(40, 500), (90, 74, 56))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < len(SCENES) * DUREE_SCENE:
        i = int(t2 // DUREE_SCENE); u = t2 - i * DUREE_SCENE
        jour, nuit, pol = IMGS[i]; sup, por, led, nom, phr = SCENES[i]
        allume = easeio((u - 2.35) / 0.45)            # l'interrupteur
        im = Image.blend(FOND_JOUR, FOND_NUIT, allume).convert("RGBA")
        balance = math.sin((u + i) * 2.4) * 4.5 * (1 - 0.6 * allume)
        entree = ease(u / 0.6)
        carte = Image.blend(jour, nuit, allume)
        coller_rot(im, arrondi(carte, 46).resize((820, 820)), W / 2 + (1 - entree) * (W if i % 2 == 0 else -W), 1010, balance)
        # le polaroïd de la photo vole dans le cristal (0,3 → 1,4 s)
        p = (u - 0.25) / 1.15
        if 0 <= p <= 1:
            e = easeio(p); sc = 1 - 0.8 * e
            px = (180 if i % 2 == 0 else W - 180) * (1 - e) + W / 2 * e; py = 520 * (1 - e) + 1060 * e
            coller_rot(im, pol.resize((int(330 * sc) + 1, int(390 * sc) + 1)), px, py, (-8 if i % 2 == 0 else 8) * (1 - e), a=1 - max(0, (p - .75) / .25))
        d = ImageDraw.Draw(im)
        # étiquette du haut + phrase du bas
        a_txt = ease((u - 0.5) / 0.5) * (1 - ease((u - DUREE_SCENE + 0.35) / 0.35))
        coul = tuple(int(ENCRE[k] * (1 - allume) + 245 * allume) for k in range(3))
        f1 = INTER(34, 700); lab = nom.upper()
        wl = lg(d, lab, f1) + 64; x0 = (W - wl) / 2
        d.rounded_rectangle((x0, 300, x0 + wl, 370), 35, fill=OR + (int(255 * a_txt),))
        d.text((x0 + 32, 313), lab, font=f1, fill=(255, 255, 255, int(255 * a_txt)))
        f2 = PLAY(54, 600)
        for k, ligne in enumerate(couper(d, phr, f2, W - 140)):
            d.text(((W - lg(d, ligne, f2)) / 2, 1500 + k * 78), ligne, font=f2, fill=coul + (int(255 * a_txt),))
        if allume > 0.5:
            f3 = INTER(36, 500); s = "Il s'illumine d'une simple pression"
            d.text(((W - lg(d, s, f3)) / 2, 1700), s, font=f3, fill=(OR_C + (int(255 * a_txt * (allume - .5) * 2),)))
        return im.convert("RGB")
    u = t2 - len(SCENES) * DUREE_SCENE
    im = FOND_NUIT.copy().convert("RGBA"); d = ImageDraw.Draw(im)
    for k, v in enumerate(FIN):
        c, r = k % 3, k // 3; e = ease((u - k * 0.08) / 0.5)
        x = 60 + c * 330 + c * 15 + 165; y = 520 + r * 345 + 165
        coller_rot(im, arrondi(v, 26).resize((int(320 * (0.7 + .3 * e)) + 1,) * 2), x, y + (1 - e) * 60, 0, a=e, ombre=False)
    texte_centre(d, 200, "Le cœur ou le rectangle,", PLAY(70, 600), (245, 236, 220))
    texte_centre(d, 290, "avec la photo de votre choix", PLAY(70, 600), OR_C)
    pul = 1 + 0.04 * math.sin(u * 5)
    f = INTER(52, 700); s = "nivcreation.fr"; wb = lg(d, s, f) + 120; hb = 110
    bw, bh = wb * pul, hb * pul; x0, y0 = (W - bw) / 2, 1330 - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, f)) / 2, y0 + (bh - 60) / 2), s, font=f, fill=(255, 255, 255))
    texte_centre(d, 1450, "Gravé dans notre atelier, en France", INTER(38, 500), (215, 200, 175))
    return im.convert("RGB")

def couper(d, t, f, wmax):
    mots, lignes, cur = t.split(), [], ""
    for m in mots:
        x = (cur + " " + m).strip()
        if lg(d, x, f) <= wmax: cur = x
        else: lignes.append(cur); cur = m
    return lignes + [cur]

if APERCU:
    for k, tt in enumerate([1.5, T_INTRO + 0.9, T_INTRO + 1.8, T_INTRO + 3.4, T_INTRO + 2 * DUREE_SCENE + 3.5, TOTAL - 1.5]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu-{k}.jpg"), quality=85)
    sys.exit(0)
out = os.path.join(OUT, "63-porte-cles-cristal-1080x1920.mp4"); leger = os.path.join(OUT, "63-porte-cles-cristal-720x1280.mp4")
p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
for f in range(int(TOTAL * FPS)): p.stdin.write(image(f / FPS).tobytes())
p.stdin.close(); p.wait()
subprocess.run([FF, "-y", "-loglevel", "error", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True)
print("ok", round(TOTAL, 1), "s")
