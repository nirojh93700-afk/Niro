# -*- coding: utf-8 -*-
# VIDÉO 54 (09/11/2026) — gérant : « dès que tout sera en ligne, tu me fais une vidéo pour la nouveauté » = la décoration de Noël
# ronde en cristal (fiche decoration-noel-verre-gravee). Style NEUF (différent de la 52 « magazine » et de la 53 « stories ») :
# « carte de vœux » — fond rouge de Noël et or, neige qui tombe, chaque exemple dans une carte à liseré doré qui entre en tournant,
# grande phrase en Playfair + petite ligne dorée, récapitulatif en éventail, fin avec le bouton nivcreation.fr qui respire.
# Photos = les 4 exemples de la fiche SANS l'étiquette « EXEMPLE »
#   (python3 tools/maquettes/deco-noel-cristal-exemples.py <dossier> --sans-etiquette).
# ⛔ Aucun prix, aucun nombre. Sans son, 1080 × 1920.
# Usage : python3 tools/video/noel_cristal_54.py <polices (PlayfairDisplay.ttf, Inter.ttf, GreatVibes.ttf)> <dossier exemples> <sortie>
import os, sys, math, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

FD, EX, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
OR = (226, 198, 126); OR2 = (201, 162, 75); CREME = (251, 247, 238)
random.seed(54)

def police(nom, taille, axes=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f
PLAY = lambda s, w=600: police("PlayfairDisplay", s, [w])
INTER = lambda s, w=600: police("Inter", s, [14, w])
GV = lambda s: police("GreatVibes", s)

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

# ------------------------------------------------------------------ fond rouge + neige
def fond():
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        c = tuple(int(a * (1 - t) + b * t) for a, b in zip((128, 22, 20), (52, 7, 6)))
        d.line([(0, y), (W, y)], fill=c)
    halo = Image.new("L", (W, H), 0); ImageDraw.Draw(halo).ellipse([W * .1, H * .18, W * .9, H * .62], fill=70)
    halo = halo.filter(ImageFilter.GaussianBlur(160))
    return Image.composite(Image.new("RGB", (W, H), (190, 70, 40)), im, halo)
FOND = fond()
FLOCONS = [(random.uniform(0, W), random.uniform(0, H), random.uniform(2, 7), random.uniform(40, 120), random.uniform(0, 6.28))
           for _ in range(90)]
def neige(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    for x0, y0, r, v, ph in FLOCONS:
        y = (y0 + v * t) % (H + 20) - 10
        x = x0 + 18 * math.sin(t * 0.9 + ph)
        a = int(110 + 120 * (r / 7))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, a))

def centre(d, y, txt, f, fill):
    d.text(((W - lg(d, txt, f)) / 2, y), txt, font=f, fill=fill)

def carte(photo, taille, angle):
    """Photo dans une carte à coins arrondis, liseré doré, ombre portée ; renvoie une image RGBA tournée."""
    p = photo.resize((taille, taille), Image.LANCZOS)
    b = 10; T = taille + 2 * b
    c = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    m = Image.new("L", (T, T), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, T - 1, T - 1], radius=44, fill=255)
    c.paste(Image.new("RGBA", (T, T), OR + (255,)), (0, 0), m)
    mi = Image.new("L", (taille, taille), 0); ImageDraw.Draw(mi).rounded_rectangle([0, 0, taille - 1, taille - 1], radius=36, fill=255)
    c.paste(p, (b, b), mi)
    S = T + 120
    s = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    om = Image.new("L", (S, S), 0); ImageDraw.Draw(om).rounded_rectangle([60, 80, 60 + T, 80 + T], radius=44, fill=150)
    s.paste((20, 0, 0, 255), (0, 0), om.filter(ImageFilter.GaussianBlur(26)))
    s.alpha_composite(c, (60, 60))
    return s.rotate(angle, resample=Image.BICUBIC, expand=True)

def poser(im, rgba, cx, cy, alpha=1.0):
    if alpha < 1:
        a = rgba.split()[-1].point(lambda v: int(v * alpha)); rgba = rgba.copy(); rgba.putalpha(a)
    im.paste(rgba, (int(cx - rgba.width / 2), int(cy - rgba.height / 2)), rgba)

# ------------------------------------------------------------------ contenu
SCENES = [
    ("exemple-dessin-camille.jpg", "Un prénom", "et un de nos dessins de Noël"),
    ("exemple-photo-couple.jpg", "Votre photo", "gravée en blanc givré dans le cristal"),
    ("exemple-mots-famille.jpg", "Un mot de Noël", "pour toute la famille"),
    ("exemple-photo-enfant.jpg", "Mon premier Noël", "un souvenir à ressortir chaque année"),
]
PHOTOS = [Image.open(os.path.join(EX, f)).convert("RGB") for f, _, _ in SCENES]

def seg_intro(t, D):
    im = FOND.copy(); neige(im, t); d = ImageDraw.Draw(im, "RGBA")
    a1, a2, a3, a4 = ease(t / .6), ease((t - .3) / .7), ease((t - .7) / .8), ease((t - 1.3) / .8)
    f = INTER(34, 700); txt = "N O U V E A U"
    centre(d, 640 - 30 * (1 - a1), txt, f, OR + (int(255 * a1),))
    centre(d, 720 - 40 * (1 - a2), "La décoration", PLAY(104, 600), CREME + (int(255 * a2),))
    centre(d, 840 - 40 * (1 - a2), "de Noël", PLAY(104, 600), CREME + (int(255 * a2),))
    centre(d, 960 - 30 * (1 - a3), "en cristal", GV(170), OR + (int(255 * a3),))
    L = 420 * a4; d.line([(W / 2 - L / 2, 1190), (W / 2 + L / 2, 1190)], fill=OR + (230,), width=3)
    centre(d, 1230, "à graver à votre façon", INTER(40, 500), CREME + (int(220 * a4),))
    return im

def seg_scene(i):
    photo, titre, sous = PHOTOS[i], SCENES[i][1], SCENES[i][2]
    def rendu(t, D):
        im = FOND.copy(); neige(im, t + 3 * i); d = ImageDraw.Draw(im, "RGBA")
        e = ease(t / .8)
        z = 1 + 0.06 * (t / D)  # zoom doux dans la photo
        w0 = photo.width; c = int(w0 / z); o = (w0 - c) // 2
        ph = photo.crop((o, o, o + c, o + c))
        ang = 9 * (1 - e) - 2 + (i % 2) * 4
        poser(im, carte(ph, 860, ang), W / 2 + 700 * (1 - e), 1010)
        a = ease((t - .35) / .6)
        centre(d, 300 - 30 * (1 - a), titre, PLAY(92, 600), CREME + (int(255 * a),))
        a2 = ease((t - .6) / .6)
        centre(d, 420, sous, INTER(40, 500), OR + (int(255 * a2),))
        for k in range(len(SCENES)):  # points de progression
            x = W / 2 + (k - 1.5) * 44; r = 9 if k == i else 6
            d.ellipse([x - r, 1560 - r, x + r, 1560 + r], fill=(OR + (255,)) if k == i else (255, 255, 255, 110))
        return im
    return rendu

def seg_recap(t, D):
    im = FOND.copy(); neige(im, t + 20); d = ImageDraw.Draw(im, "RGBA")
    pos = [(330, 820, -8), (750, 780, 6), (360, 1230, 5), (740, 1270, -6)]
    for k, (x, y, ang) in enumerate(pos):
        e = ease((t - k * .15) / .7)
        poser(im, carte(PHOTOS[k], 380, ang * e), x, y + 260 * (1 - e), alpha=e)
    a = ease((t - .5) / .6)
    centre(d, 330, "À suspendre au sapin", PLAY(80, 600), CREME + (int(255 * a),))
    centre(d, 440, "ruban bleu · disque de 10 cm", INTER(40, 500), OR + (int(255 * a),))
    return im

def seg_fin(t, D):
    im = FOND.copy(); neige(im, t + 30); d = ImageDraw.Draw(im, "RGBA")
    a = ease(t / .7)
    poser(im, carte(PHOTOS[0], 520, -3), W / 2, 760, alpha=a)
    a2 = ease((t - .4) / .6)
    centre(d, 1130, "Gravé dans notre atelier", PLAY(70, 600), CREME + (int(255 * a2),))
    centre(d, 1225, "Décoration de Noël en cristal", INTER(40, 500), OR + (int(255 * a2),))
    s = 1 + 0.035 * math.sin(max(0, t - 1) * 4)
    bw, bh = 560 * s, 120 * s
    a3 = ease((t - .8) / .6)
    d.rounded_rectangle([W / 2 - bw / 2, 1360 - bh / 2, W / 2 + bw / 2, 1360 + bh / 2], radius=60, fill=OR + (int(255 * a3),))
    f = INTER(50, 700); txt = "nivcreation.fr"
    d.text(((W - lg(d, txt, f)) / 2, 1360 - 32), txt, font=f, fill=(60, 10, 8, int(255 * a3)))
    return im

SEGMENTS = [(seg_intro, 3.0)] + [(seg_scene(i), 3.4) for i in range(4)] + [(seg_recap, 3.0), (seg_fin, 3.4)]
TOTAL = sum(D for _, D in SEGMENTS); FONDU = .35

def image(t):
    t0 = 0
    for k, (f, D) in enumerate(SEGMENTS):
        if t < t0 + D or k == len(SEGMENTS) - 1:
            lt = t - t0; im = f(lt, D)
            if k > 0 and lt < FONDU:
                pf, pD = SEGMENTS[k - 1]
                im = Image.blend(pf(pD - .001, pD), im, lt / FONDU)
            return im
        t0 += D

if "--apercu" in sys.argv:
    for s in [1.5, 3.6, 5.5, 8.9, 12.3, 15.6, 17.5, 20.5, 22.4]:
        image(s).resize((540, 960)).save(os.path.join(OUT, f"apercu-{s:05.1f}.jpg"), quality=80)
    sys.exit()

brut = os.path.join(OUT, "54-deco-noel-cristal-1080x1920.mp4")
p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", brut],
                     stdin=subprocess.PIPE)
n = int(TOTAL * FPS)
for k in range(n):
    p.stdin.write(image(k / FPS).tobytes())
p.stdin.close(); p.wait()
leger = os.path.join(OUT, "54-deco-noel-cristal-720x1280.mp4")
subprocess.run([FF, "-y", "-loglevel", "error", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-preset", "medium",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", leger], check=True)
print(brut, leger, f"{TOTAL:.1f} s")
