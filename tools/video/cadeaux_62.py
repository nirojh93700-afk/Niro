# Vidéo 62 (16/11/2026) — tous nos produits, style NEUF « boîte cadeau » : une boîte tombe, le ruban saute, le couvercle
# s'envole et la création gravée sort de la boîte. Fond qui change de couleur à chaque univers. Sans son, aucun prix.
# Usage (racine du dépôt) : python3 tools/video/cadeaux_62.py <polices> <sortie> [--apercu]
import os, sys, math, subprocess, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import imageio_ffmpeg
sys.path.insert(0, os.path.dirname(__file__))
from porte_cles_63_prep import composer

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
random.seed(62)
def font(n, s, w):
    f = ImageFont.truetype(os.path.join(FD, n + ".ttf"), s)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f
PLAY = lambda s, w=700: font("PlayfairDisplay", s, w); INTER = lambda s, w=600: font("Inter", s, w)
def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def easeio(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def rebond(x): x = max(0.0, min(1.0, x)); return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

ENCRE = (40, 28, 18); OR = (201, 162, 75)
# (photo, univers, phrase, couleur du fond, couleur de la boîte, couleur du ruban)
P = lambda n: os.path.join("public", n)
SCENES = [
  (P("produits/cristal-v-couple.jpg"), "Cristal photo 3D", "Votre photo, gravée dans le cristal", (232, 226, 240), (54, 48, 86), (201, 162, 75)),
  (P("produits/collier-3coeurs-3.jpg"), "Bijoux", "Un cœur pour chaque enfant", (246, 226, 228), (176, 60, 82), (250, 235, 215)),
  (P("produits/verre_a_whisky_exemple_face.jpg"), "Verres", "Pour le meilleur papa", (236, 228, 214), (40, 64, 52), (201, 162, 75)),
  (P("carnet/exemple-ex1.jpg"), "Papeterie", "Un carnet de voyage à son nom", (238, 230, 218), (120, 80, 50), (240, 225, 200)),
  (P("produits/gobelet/ex7-rose-photo-couple.jpg"), "Gobelets", "Votre photo sur son gobelet", (247, 230, 232), (196, 120, 140), (255, 255, 255)),
  (P("produits/bracelet-cordon-plaque-4.jpg"), "Bijoux", "Vos initiales, sur un bracelet", (226, 230, 236), (40, 46, 60), (201, 162, 75)),
  (P("produits/puzzle-photo-enfants.jpg"), "Puzzles en bois", "Leur photo, en puzzle gravé", (236, 230, 216), (90, 120, 80), (250, 240, 210)),
  ("PORTECLES", "Porte-clés cristal", "Il s'illumine d'une simple pression", (30, 22, 30), (150, 50, 120), (232, 200, 120)),
  (P("produits/cristal-h-famille.jpg"), "Cristal photo 3D", "Toujours ensemble", (230, 228, 238), (54, 48, 86), (232, 200, 120)),
  (P("produits/bracelet_empreinte_de_pied_de_bebe_a_graver_dore.jpg"), "Bijoux", "Ses premiers pas, au poignet", (228, 236, 246), (60, 90, 140), (250, 240, 215)),
  (P("produits/gobelet/ex6-marine-texte-super-papy.jpg"), "Gobelets", "Super papy, depuis 2026", (226, 232, 240), (34, 52, 90), (201, 162, 75)),
  (P("marque-pages/m1/exemple-ex1.jpg"), "Marque-pages", "Un prénom au fil des pages", (240, 232, 220), (140, 96, 60), (250, 240, 215)),
]
DS = 2.9; T_INTRO = 2.2; T_FIN = 3.4
TOTAL = T_INTRO + len(SCENES) * DS + T_FIN

def arrondi(img, r):
    m = Image.new("L", img.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width, img.height), r, fill=255)
    o = img.convert("RGBA"); o.putalpha(m); return o
def carte(img, cote=760):
    im = ImageOps.contain(img.convert("RGB"), (cote - 36, cote - 36), Image.LANCZOS)
    c = Image.new("RGB", (cote, cote), (255, 255, 255))
    flou = ImageOps.fit(img.convert("RGB"), (cote, cote)).filter(ImageFilter.GaussianBlur(28))
    c = Image.blend(c, flou, 0.35); c.paste(im, ((cote - im.width) // 2, (cote - im.height) // 2))
    return arrondi(c, 38)
CARTES = []
for s in SCENES:
    src = composer("coeur", "couple", "rose") if s[0] == "PORTECLES" else Image.open(s[0])
    CARTES.append(carte(src))

def coller(base, img, cx, cy, ang=0, a=1.0, sc=1.0, ombre=True):
    if sc != 1: img = img.resize((max(1, int(img.width * sc)), max(1, int(img.height * sc))), Image.LANCZOS)
    r = img.rotate(ang, resample=Image.BICUBIC, expand=True) if ang else img
    if a < 1: r = r.copy(); r.putalpha(r.getchannel("A").point(lambda v: int(v * a)))
    if ombre:
        s = Image.new("RGBA", r.size, (0, 0, 0, 0)); s.putalpha(r.getchannel("A").point(lambda v: int(v * .3 * a)))
        base.alpha_composite(s.filter(ImageFilter.GaussianBlur(20)), (int(cx - r.width / 2 + 8), int(cy - r.height / 2 + 26)))
    base.alpha_composite(r, (int(cx - r.width / 2), int(cy - r.height / 2)))

def boite(d, cx, by, couleur, ruban, ouverture, angle_couv):
    """Boîte vue de face : corps (by = bas), couvercle qui se soulève, ruban et nœud."""
    w, h = 560, 360
    x0, y0 = cx - w / 2, by - h
    fonce = tuple(int(c * .8) for c in couleur)
    d.rectangle((x0, y0, x0 + w, by), fill=couleur)
    d.rectangle((cx - 34, y0, cx + 34, by), fill=ruban)
    d.rectangle((x0, y0, x0 + w, y0 + 24), fill=fonce)
    # couvercle
    cy = y0 - 40 - ouverture * 520; cxx = cx + ouverture * 260
    cw = w + 50
    lid = Image.new("RGBA", (int(cw + 260), 400), (0, 0, 0, 0)); ld = ImageDraw.Draw(lid)
    lx = 130; ld.rectangle((lx, 170, lx + cw, 250), fill=couleur); ld.rectangle((lx + cw / 2 - 36, 170, lx + cw / 2 + 36, 250), fill=ruban)
    # nœud
    nb = lx + cw / 2
    ld.ellipse((nb - 130, 80, nb - 10, 180), fill=ruban); ld.ellipse((nb + 10, 80, nb + 130, 180), fill=ruban)
    ld.ellipse((nb - 30, 130, nb + 30, 185), fill=tuple(int(c * .85) for c in ruban))
    return lid.rotate(angle_couv, resample=Image.BICUBIC, center=(nb, 210)), (cxx, cy + 10)

def image(t):
    if t < T_INTRO:
        im = Image.new("RGBA", (W, H), (244, 236, 222)); d = ImageDraw.Draw(im)
        k = ease(t / 0.8)
        f1 = PLAY(96, 700); f2 = PLAY(96, 700)
        for i, (txt, c) in enumerate([("Un cadeau", ENCRE), ("unique,", ENCRE), ("gravé à son nom", (150, 116, 40))]):
            kk = ease((t - i * 0.18) / 0.6)
            d.text(((W - lg(d, txt, f1)) / 2, 640 + i * 120 + (1 - kk) * 60), txt, font=f1, fill=c + (int(255 * kk),))
        f3 = INTER(40, 500); s = "Gravé dans notre atelier, en France"
        d.text(((W - lg(d, s, f3)) / 2, 1080), s, font=f3, fill=(110, 92, 70, int(255 * ease((t - .7) / .6))))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < len(SCENES) * DS:
        i = int(t2 // DS); u = t2 - i * DS
        src, univ, phr, fondc, bc, rc = SCENES[i]
        prev = SCENES[i - 1][3] if i else (244, 236, 222)
        mix = easeio(u / 0.35); fc = tuple(int(prev[k] * (1 - mix) + fondc[k] * mix) for k in range(3))
        im = Image.new("RGBA", (W, H), fc + (255,)); d = ImageDraw.Draw(im)
        sombre = sum(fondc) < 200
        sortie = easeio((u - DS + 0.32) / 0.32)
        by = 1560 - (1 - rebond(u / 0.45)) * 900 + sortie * 900
        ouv = easeio((u - 0.5) / 0.45)
        # la carte sort de la boîte
        mont = ease((u - 0.65) / 0.6)
        if mont > 0:
            coller(im, CARTES[i], W / 2, by - 200 - mont * 560 - sortie * 0, (1 - mont) * 6 * (1 if i % 2 else -1), a=min(1, mont * 1.6), sc=0.35 + 0.65 * mont)
        lid, (lx, ly) = boite(d, W / 2, by, bc, rc, ouv, -35 * ouv)
        im.alpha_composite(lid, (int(lx - lid.width / 2), int(ly - 210)))
        # étincelles à l'ouverture
        if 0.5 < u < 1.4:
            rr = random.Random(i)
            for k in range(26):
                a = rr.random() * math.tau; v = 200 + rr.random() * 500; e = (u - 0.5) / 0.9
                x = W / 2 + math.cos(a) * v * e; y = by - 380 + math.sin(a) * v * e - 200 * e
                r = 7 * (1 - e)
                if r > 0: d.ellipse((x - r, y - r, x + r, y + r), fill=(232, 200, 120, int(255 * (1 - e))))
        # univers + phrase
        a_t = ease((u - 1.0) / 0.4) * (1 - sortie)
        coul = (245, 236, 220) if sombre else ENCRE
        f1 = INTER(34, 700); lab = univ.upper(); wl = lg(d, lab, f1) + 64; x0 = (W - wl) / 2
        d.rounded_rectangle((x0, 170, x0 + wl, 240), 35, fill=OR + (int(255 * a_t),))
        d.text((x0 + 32, 183), lab, font=f1, fill=(255, 255, 255, int(255 * a_t)))
        f2 = PLAY(60, 600)
        d.text(((W - lg(d, phr, f2)) / 2, 1660), phr, font=f2, fill=coul + (int(255 * a_t),))
        return im.convert("RGB")
    u = t2 - len(SCENES) * DS
    im = Image.new("RGBA", (W, H), (34, 26, 20, 255)); d = ImageDraw.Draw(im)
    for k, c in enumerate(CARTES):
        col, row = k % 3, k // 3; e = ease((u - k * 0.05) / 0.5)
        coller(im, c, 195 + col * 345, 470 + row * 300, a=e, sc=0.38 * (0.8 + 0.2 * e), ombre=False)
    f = PLAY(66, 700)
    for k, (txt, cc) in enumerate([("Il ne reste plus", (245, 236, 220)), ("qu'à l'offrir", (232, 200, 120))]):
        d.text(((W - lg(d, txt, f)) / 2, 100 + k * 84), txt, font=f, fill=cc)
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, 1700 - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(255, 255, 255))
    return im.convert("RGB")

if APERCU:
    for k, tt in enumerate([1.4, T_INTRO + 0.4, T_INTRO + 0.9, T_INTRO + 1.8, T_INTRO + 7 * DS + 1.8, TOTAL - 1.2]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu-{k}.jpg"), quality=85)
    sys.exit(0)
out = os.path.join(OUT, "62-boite-cadeau-1080x1920.mp4"); leger = os.path.join(OUT, "62-boite-cadeau-720x1280.mp4")
p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
for f in range(int(TOTAL * FPS)): p.stdin.write(image(f / FPS).tobytes())
p.stdin.close(); p.wait()
subprocess.run([FF, "-y", "-loglevel", "error", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True)
print("ok", round(TOTAL, 1), "s")
