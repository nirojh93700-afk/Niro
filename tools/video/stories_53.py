# -*- coding: utf-8 -*-
# VIDÉO 53 (07/11/2026) — gérant, après la 52 (« j'aime bien aussi ce style ») : « fais-moi une autre vidéo et fais attention aux
# photos » + « enlève le football et la clé USB, mets plusieurs photos de bijoux, pas les mêmes produits ».
# Troisième style, « stories » : chaque photo plein écran sur son propre fond flou, photo ENTIÈRE dans un cadre arrondi, barres
# de progression en haut (une par univers), étiquette d'univers en autocollant, nom de la pièce qui s'écrit mot à mot, passage
# d'une photo à l'autre par glissement avec zoom (comme on fait défiler des stories). Couleur d'accent prise dans chaque photo.
# Photos du site, toutes regardées en grand : GRAVÉES, sans badge « EXEMPLE », sans texte anglais, sans logo de marque,
# différentes de la vidéo 52 ; le marque-page en métal (vendu tel quel) n'est jamais dit « gravé ».
# ⛔ Aucun prix, aucun nombre. Sans son, 1080 × 1920.
# Usage : python3 tools/video/stories_53.py <polices> <sortie> [--apercu]   (depuis la racine du dépôt)
import os, sys, math, random, subprocess, colorsys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageStat
import imageio_ffmpeg

FD, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
BLANC = (255, 255, 255); ENCRE = (28, 22, 16)
random.seed(53)

def police(nom, taille, axes=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f
PLAY = lambda s, w=600: police("PlayfairDisplay", s, [w])
INTER = lambda s, w=600: police("Inter", s, [w])

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def rebond(x): x = max(0.0, min(1.0, x)); return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

# ---------------------------------------------------------------- les pièces, par univers
UNIVERS = [
  ("Cristal", [("produits/cristal-h-couple.jpg", "Votre photo de couple, en 3D"),
               ("produits/cristaux-graves/colibri.jpg", "Un colibri déjà gravé"),
               ("produits/porte-cles-coeur-demo.jpg", "Un porte-clés qui s'illumine")]),
  ("Bijoux", [("produits/catalogue/il_fullxfull.8007460522_d3ji.jpg", "Un médaillon cœur qui s'ouvre"),
              ("produits/bracelet-femme-acier-grave.jpg", "Un prénom sur son bracelet"),
              ("produits/bracelet-cordon-plaque-4.jpg", "Vos initiales sur un cordon"),
              ("produits/bracelet-femme-acier-porte.jpg", "Une date à porter sur soi")]),
  ("Verres & carafe", [("produits/verre_whisky_papa_monde_banniere.jpg", "Le meilleur papa du monde"),
                       ("produits/carafe_whiskey_1892.jpg", "Une carafe pour les grandes occasions"),
                       ("produits/gobelet/ex2-marine-cheval-paul.jpg", "Un gobelet à son prénom")]),
  ("Papeterie", [("marque-pages/m2/exemple-ex1.jpg", "Un marque-page ajouré, à son prénom"),
                 ("carnet/exemple-ex1.jpg", "Un carnet de voyage gravé"),
                 ("marque-pages/metal/02-iris-van-gogh.jpg", "Les Iris, en marque-page de métal")]),
  ("Bébé & enfant", [("produits/puzzle-savane.jpg", "Un puzzle en bois, à son prénom"),
                     ("produits/couverts_enfants_ex_animaux.jpg", "Ses couverts, avec ses animaux"),
                     ("produits/plaque-naissance-garcon-1.jpg", "Sa plaque de naissance")]),
  ("Maison & mariage", [("produits/numero_table_rectangulaire_feuillage_bois.png", "Les numéros de table du mariage"),
                        ("produits/support-telephone-photo.jpg", "Un support de téléphone à sa photo"),
                        ("produits/porte-serviettes-1.jpg", "Un porte-serviettes en bois")]),
]

def accent_de(img):
    """Couleur d'accent : la teinte la plus présente de la photo, éclaircie et saturée."""
    p = img.resize((40, 40)).convert("RGB").quantize(6).convert("RGB")
    cols = sorted(p.getcolors(1600), reverse=True)
    for n, c in cols:
        h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c])
        if s > 0.15 and 0.15 < l < 0.85:
            r, g, b = colorsys.hls_to_rgb(h, 0.62, min(1, s + 0.35)); return (int(r * 255), int(g * 255), int(b * 255))
    return (214, 176, 92)

def plan(chemin):
    """Fond plein écran = la photo floutée ; la photo ENTIÈRE dans un cadre arrondi au-dessus (jamais recadrée)."""
    img = Image.open(os.path.join("public", chemin)).convert("RGB")
    r = max(W / img.width, H / img.height)
    fond = img.resize((int(img.width * r) + 2, int(img.height * r) + 2), Image.LANCZOS)
    fond = fond.crop(((fond.width - W) // 2, (fond.height - H) // 2, (fond.width - W) // 2 + W, (fond.height - H) // 2 + H))
    fond = fond.filter(ImageFilter.GaussianBlur(40)).point(lambda v: int(v * 0.62))
    cw, ch = 940, 1080
    k = min(cw / img.width, ch / img.height); ph = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    m = Image.new("L", ph.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, ph.width - 1, ph.height - 1), 34, fill=255)
    carte = Image.new("RGBA", ph.size); carte.paste(ph, (0, 0), m)
    return fond.convert("RGBA"), carte, accent_de(img)

PLANS = []  # (univers, n° univers, fond, carte, accent, légende)
for u, (nom, pieces) in enumerate(UNIVERS):
    for chemin, leg in pieces:
        f, c, a = plan(chemin); PLANS.append((nom, u, f, c, a, leg))

FT_STICK = INTER(46, 700); FT_LEG = PLAY(60); FT_PETIT = INTER(30, 500)

def coller(im, c, cx, cy, s=1.0, rot=0.0, alpha=1.0):
    if s <= 0.02 or alpha <= 0.01: return
    x = c if s == 1 else c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = x.split()[3].point(lambda v: int(v * alpha)); x = x.copy(); x.putalpha(a)
    sh = Image.new("RGBA", x.size, (0, 0, 0, 0)); sh.putalpha(x.split()[3].point(lambda v: int(v * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    im.alpha_composite(sh, (int(cx - x.width / 2) + 6, int(cy - x.height / 2) + 26))
    im.alpha_composite(x, (int(cx - x.width / 2), int(cy - x.height / 2)))

def autocollant(im, txt, accent, x, y, s, rot=-4):
    d0 = ImageDraw.Draw(Image.new("RGB", (1, 1))); w = lg(d0, txt, FT_STICK)
    p = Image.new("RGBA", (w + 72, 100)); d = ImageDraw.Draw(p)
    d.rounded_rectangle((0, 0, w + 71, 99), 24, fill=BLANC + (255,))
    d.ellipse((22, 40, 42, 60), fill=accent + (255,))
    b = d.textbbox((0, 0), txt, font=FT_STICK); d.text((54 - b[0], 50 - (b[3] + b[1]) / 2), txt, font=FT_STICK, fill=ENCRE + (255,))
    if s <= 0.05: return
    p = p.resize((max(1, int(p.width * s)), max(1, int(p.height * s))), Image.LANCZOS).rotate(rot, resample=Image.BICUBIC, expand=True)
    if x is None: x = (W - p.width) / 2
    im.alpha_composite(p, (int(x), int(y)))

def legende(im, txt, u, alpha=255):
    """La légende apparaît mot à mot, sur deux lignes au besoin, en bas de l'écran."""
    d = ImageDraw.Draw(im, "RGBA"); mots = txt.split(" ")
    lignes = [mots]
    if lg(d, txt, FT_LEG) > W - 140:
        best = min(range(1, len(mots)), key=lambda k: max(lg(d, " ".join(mots[:k]), FT_LEG), lg(d, " ".join(mots[k:]), FT_LEG)))
        lignes = [mots[:best], mots[best:]]
    n = int(len(mots) * ease(u / 0.5) + 0.999); vu = 0
    for li, lm in enumerate(lignes):
        tot = lg(d, " ".join(lm), FT_LEG); assert tot <= W - 80, f"légende trop large : {txt}"
        x = (W - tot) / 2; y = 1560 + li * 84
        for m in lm:
            if vu < n:
                d.text((x + 3, y + 3), m, font=FT_LEG, fill=(0, 0, 0, int(alpha * 0.5)))
                d.text((x, y), m, font=FT_LEG, fill=BLANC + (int(alpha),))
            x += lg(d, m + " ", FT_LEG); vu += 1

def barres(im, iu, frac):
    """Barres de progression des stories : une par univers."""
    n = len(UNIVERS); gap = 10; x0 = 40; w = (W - 2 * x0 - gap * (n - 1)) / n; y = 70
    d = ImageDraw.Draw(im, "RGBA")
    for k in range(n):
        x = x0 + k * (w + gap); d.rounded_rectangle((x, y, x + w, y + 8), 4, fill=(255, 255, 255, 90))
        f = 1 if k < iu else (frac if k == iu else 0)
        if f > 0: d.rounded_rectangle((x, y, x + w * f, y + 8), 4, fill=(255, 255, 255, 240))

# ---------------------------------------------------------------- scènes
PAS = 1.75
def s_intro(im, t, d):
    f, c, a = PLANS[0][2], PLANS[0][3], PLANS[0][4]
    im.alpha_composite(f.point(lambda v: int(v * 0.6)))
    for i, (txt, fnt) in enumerate([("Des cadeaux", PLAY(104)), ("qui portent", PLAY(104, 500)), ("leur histoire", PLAY(104))]):
        u = ease((t - 0.22 * i) / 0.45)
        if u <= 0: continue
        dd = ImageDraw.Draw(im, "RGBA"); w = lg(dd, txt, fnt); x = (W - w) / 2 + (1 - u) * 140 * (1 if i % 2 else -1)
        dd.text((x, 640 + i * 150), txt, font=fnt, fill=(BLANC if i != 1 else (240, 214, 150)) + (int(255 * u),))
    if t > 1.2: autocollant(im, "Gravé dans notre atelier", (214, 176, 92), None, 1160, rebond((t - 1.2) / 0.5), rot=3)

def s_plans(im, t, d):
    i = min(len(PLANS) - 1, int(t / PAS)); u = (t - i * PAS) / PAS
    nom, iu, f, c, a, leg = PLANS[i]
    debut_u = [k for k, p in enumerate(PLANS) if p[1] == iu][0]; nb_u = sum(1 for p in PLANS if p[1] == iu)
    frac = (i - debut_u + u) / nb_u
    T = 0.22  # durée du glissement
    if i > 0 and u < T:
        e = ease(u / T); pf, pc = PLANS[i - 1][2], PLANS[i - 1][3]
        im.alpha_composite(pf); fond = f.copy(); fa = fond.split()[3].point(lambda v: int(v * e)); fond.putalpha(fa); im.alpha_composite(fond)
        coller(im, pc, W / 2 - W * e * 0.9, 820, s=1 - 0.15 * e, rot=6 * e, alpha=1 - e * 0.6)
        coller(im, c, W / 2 + W * (1 - e) * 0.9, 820, s=0.85 + 0.15 * e, rot=-6 * (1 - e))
    else:
        im.alpha_composite(f)
        coller(im, c, W / 2, 820, s=1 + 0.035 * u)
    barres(im, iu, frac)
    nouvel_univers = (i == debut_u)
    if nouvel_univers: autocollant(im, nom, a, 50, 120, rebond(u / 0.35))
    else: autocollant(im, nom, a, 50, 120, 1)
    if u > 0.12: legende(im, leg, (u - 0.12) / 0.75)

def s_fin(im, t, d):
    im.alpha_composite(PLANS[-1][2].point(lambda v: int(v * 0.55)))
    # les photos de chaque univers en éventail
    choix = [PLANS[[k for k, p in enumerate(PLANS) if p[1] == u][0]][3] for u in range(len(UNIVERS))]
    for k, c in enumerate(choix):
        e = ease((t - 0.07 * k) / 0.5)
        ang = (k - (len(choix) - 1) / 2) * 9; cx = W / 2 + (k - (len(choix) - 1) / 2) * 120
        coller(im, c, cx, 760 + abs(k - 2.5) * 22 + (1 - e) * 600, s=0.36, rot=-ang, alpha=e)
    dd = ImageDraw.Draw(im, "RGBA")
    for txt, y, fnt, coul, dl in [("Offrez un cadeau", 1150, PLAY(84), BLANC, 0.5), ("qui leur ressemble", 1255, PLAY(84, 500), (240, 214, 150), 0.7)]:
        a = int(255 * ease((t - dl) / 0.5)); w = lg(dd, txt, fnt); dd.text(((W - w) / 2, y), txt, font=fnt, fill=coul + (a,))
    if t > 1.1: autocollant(im, "nivcreation.fr", (214, 176, 92), None, 1440, rebond((t - 1.1) / 0.5) * (1 + 0.03 * math.sin((t - 1.1) * 5)), rot=-2)
    a = int(220 * ease((t - 1.5) / 0.5)); txt = "NiV CRÉATION · Gravé en France"; w = lg(dd, txt, FT_PETIT)
    dd.text(((W - w) / 2, 1620), txt, font=FT_PETIT, fill=BLANC + (a,))

SCENES = [(2.4, s_intro), (PAS * len(PLANS), s_plans), (3.8, s_fin)]
def image(t):
    acc = 0
    for d, fn in SCENES:
        if t < acc + d or fn is SCENES[-1][1]: break
        acc += d
    im = Image.new("RGBA", (W, H), (0, 0, 0, 255)); lt = t - acc; fn(im, lt, d)
    rgb = im.convert("RGB")
    if fn is s_intro and lt < 0.25: rgb = Image.blend(Image.new("RGB", (W, H)), rgb, lt / 0.25)
    if fn is s_fin and lt < 0.25: rgb = Image.blend(Image.new("RGB", (W, H), (255, 255, 255)), rgb, lt / 0.25)
    return rgb

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "53-stories-tous-produits-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(nf): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "53-stories-tous-produits-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if "--apercu" in sys.argv:
        total = sum(d for d, _ in SCENES)
        ts = [2.0] + [2.4 + PAS * k + PAS * 0.7 for k in range(len(PLANS))] + [2.4 + PAS * 3 + 0.2, total - 0.3]
        ims = [image(x).resize((216, 384)) for x in ts]
        cols = 9; rows = math.ceil(len(ims) / cols)
        pl = Image.new("RGB", (cols * 216, rows * 384))
        for i, x in enumerate(ims): pl.paste(x, ((i % cols) * 216, (i // cols) * 384))
        pl.save(os.path.join(OUT, "apercu-planche.jpg"), quality=82)
        for x in (2.0, 2.4 + PAS * 3 + 0.2, 2.4 + PAS * 4.7, total - 0.3):
            image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", len(ims), f"{total:.1f} s")
    else:
        main()
