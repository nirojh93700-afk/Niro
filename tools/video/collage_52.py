# -*- coding: utf-8 -*-
# VIDÉO 52 (07/11/2026) — gérant : « je veux une vidéo avec TOUS les produits… change de style, fais autrement, tu mets tout
# le temps la même chose (le même fond), sois créative ». Nouveau style « magazine » : fonds CLAIRS, une couleur par
# univers, grand numéro de chapitre, photos en polaroïds qui tombent et forment un collage, volet de couleur en diagonale
# entre les univers, fin en mosaïque de toutes les photos. Plus de fond sombre à lumières floues, plus de paillettes.
# Photos du site regardées (planche) : gravées, sauf le marque-page en métal (vendu tel quel, jamais dit « gravé »).
# ⛔ Aucun prix, aucun nombre. Sans son, 1080 × 1920.
# Usage : python3 tools/video/collage_52.py <polices> <sortie> [--apercu]   (depuis la racine du dépôt)
import os, sys, math, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

FD, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
ENCRE = (34, 26, 18); OR = (176, 136, 52); BLANC = (255, 253, 248)
random.seed(52)

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

def texte(im, x, y, t, f, coul, alpha=255, centre=True):
    d = ImageDraw.Draw(im, "RGBA"); w = lg(d, t, f); b = d.textbbox((0, 0), t, font=f)
    assert w <= W - 60, f"texte trop large : {t}"
    xx = (W - w) / 2 - b[0] if centre else x - b[0]
    d.text((xx, y), t, font=f, fill=coul + (int(alpha),))

def ajuste(t, fab, taille, mini, maxw=W - 140):
    d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    while taille > mini and lg(d, t, fab(taille)) > maxw: taille -= 2
    return fab(taille)

def polaroid(chemin, larg):
    """Photo ENTIÈRE dans un cadre blanc de polaroïd (bord plus large en bas), jamais recadrée."""
    img = Image.open(os.path.join("public", chemin)).convert("RGB")
    k = larg / img.width; im = img.resize((larg, int(img.height * k)), Image.LANCZOS)
    if im.height > larg * 1.25:  # photo très haute : on la limite en hauteur
        k = larg * 1.25 / img.height; im = img.resize((int(img.width * k), int(larg * 1.25)), Image.LANCZOS)
    b = 22; bb = 70
    c = Image.new("RGBA", (im.width + 2 * b, im.height + b + bb), BLANC + (255,))
    c.paste(im, (b, b))
    return c

def coller(im, c, cx, cy, s=1.0, rot=0.0, alpha=1.0, ombre=True):
    if s <= 0.02 or alpha <= 0.01: return
    x = c if s == 1 else c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = x.split()[3].point(lambda v: int(v * alpha)); x = x.copy(); x.putalpha(a)
    if ombre:
        sh = Image.new("RGBA", x.size, (0, 0, 0, 0)); sh.putalpha(x.split()[3].point(lambda v: int(v * 0.28)))
        sh = sh.filter(ImageFilter.GaussianBlur(16))
        im.paste(sh, (int(cx - x.width / 2) + 8, int(cy - x.height / 2) + 18), sh)
    im.paste(x, (int(cx - x.width / 2), int(cy - x.height / 2)), x)

# ---------------------------------------------------------------- univers (couleur, titre, phrase, photos)
UNIVERS = [
  ((222, 233, 240), (70, 104, 128), "Cristal", "Votre photo, sculptée dans le verre",
   ["produits/cristal-h-famille.jpg", "produits/cristal-v-enfant-chien.jpg", "produits/cristaux-graves/bouddha.jpg", "produits/porte-cles-rect-demo-chien.jpg"]),
  ((244, 222, 216), (160, 82, 74), "Bijoux", "Un prénom, une date, un mot doux",
   ["produits/collier-3coeurs-3.jpg", "produits/collier-coeur-plaques-1.jpg", "produits/catalogue/il_fullxfull.7864685302_iebi.jpg", "produits/bracelet-coeur-ot-dore.jpg"]),
  ((222, 230, 214), (84, 108, 70), "Verres & carafe", "Gravés à votre style, pour trinquer",
   ["produits/verre_vin_exemple_dale.jpg", "produits/verre_a_whisky_exemple_face.jpg", "produits/carafe_gravee.jpg", "produits/gobelet/ex7-rose-photo-couple.jpg"]),
  ((240, 228, 206), (140, 102, 44), "Papeterie", "Marque-pages et carnets à votre nom",
   ["marque-pages/m1/exemple-ex1.jpg", "carnet/exemple-ex2.jpg", "marque-pages/m1/exemple-ex2.jpg", "marque-pages/metal/09-nympheas-monet-pompon.jpg"]),
  ((248, 228, 198), (176, 108, 40), "Bébé & enfant", "Leurs prénoms, leurs souvenirs",
   ["produits/puzzle-photo-enfants.jpg", "produits/couverts_enfants_ex_prenom.jpg", "produits/plaque-naissance-fille-1.jpg"]),
  ((236, 214, 200), (150, 84, 52), "Mariage & maison", "Pour la table et pour la maison",
   ["produits/numero_table_arche_geometrique_relief_bois.jpeg", "produits/porte-serviettes-colombes-1.jpg", "produits/etiquette_serviette_fleur_initiales_bleu.jpeg", "produits/porte-stylo-coq-1.jpg"]),
]
# position et angle de chaque polaroïd dans le collage (centre x, centre y, rotation, largeur de photo)
PLACES = {
  3: [(330, 960, -6, 470), (760, 1040, 5, 450), (540, 1450, -2, 500)],
  4: [(310, 950, -7, 420), (780, 910, 6, 400), (320, 1450, 4, 420), (770, 1460, -5, 420)],
}
CH = []
for fond, accent, titre, phrase, photos in UNIVERS:
    pl = PLACES[len(photos)]
    CH.append((fond, accent, titre, phrase, [(polaroid(p, pl[i][3]), pl[i]) for i, p in enumerate(photos)]))
TOUTES = [p for u in UNIVERS for p in u[4]]

# ---------------------------------------------------------------- scènes
FT_NUM = PLAY(220, 700); FT_TITRE = PLAY(96); FT_PH = PLAY(46, 500); FT_PETIT = INTER(32, 500)

def numero(im, k, accent, alpha):
    """Grand numéro de chapitre en CONTOUR (lettres évidées), en haut à droite."""
    t = f"{k:02d}"; m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m); b = d.textbbox((0, 0), t, font=FT_NUM)
    pos = (W - (b[2] - b[0]) - 70 - b[0], 40 - b[1])
    d.text(pos, t, font=FT_NUM, fill=255, stroke_width=4, stroke_fill=255)
    d.text(pos, t, font=FT_NUM, fill=0)
    m = m.point(lambda v: int(v * alpha / 255 * 0.8))
    im.paste(accent + (255,), (0, 0), m)

def s_intro(im, t, d):
    im.paste((248, 242, 232) + (255,), (0, 0, W, H))
    mots = [("Gravé", PLAY(150), ENCRE), ("pour", PLAY(150, 500), OR), ("vous", PLAY(150), ENCRE)]
    for i, (m, f, c) in enumerate(mots):
        u = (t - 0.25 * i) / 0.5
        if u <= 0: continue
        y = 560 + i * 190 + (1 - ease(u)) * 120
        texte(im, 0, y, m, f, c, 255 * ease(u))
    if t > 1.0:  # bandes de couleur des univers qui s'allongent
        for i, u in enumerate(UNIVERS):
            e = ease((t - 1.0 - 0.08 * i) / 0.5); w = int(W * e)
            ImageDraw.Draw(im).rectangle((0, 1220 + i * 34, w, 1220 + i * 34 + 22), fill=u[0])
    texte(im, 0, 1500, "Dans notre atelier, en France", FT_PETIT, ENCRE, 255 * ease((t - 1.6) / 0.5))

PAS = 5.2
def s_chapitres(im, t, d):
    i = min(len(CH) - 1, int(t / PAS)); u = t - i * PAS
    fond, accent, titre, phrase, pols = CH[i]
    im.paste(fond + (255,), (0, 0, W, H))
    numero(im, i + 1, accent, 255 * ease(u / 0.6))
    # titre qui glisse depuis la gauche + trait de couleur
    e = ease((u - 0.15) / 0.5)
    f = ajuste(titre, PLAY, 96, 64, W - 160)
    texte(im, 80 - (1 - e) * 300, 300, titre, f, ENCRE, 255 * e, centre=False)
    ImageDraw.Draw(im).rectangle((80, 430, 80 + int(220 * ease((u - 0.4) / 0.4)), 438), fill=accent)
    texte(im, 80, 460, phrase, ajuste(phrase, lambda s: PLAY(s, 500), 46, 34, W - 160), accent, 255 * ease((u - 0.5) / 0.5), centre=False)
    # polaroïds qui tombent l'un après l'autre et restent posés
    for k, (c, (cx, cy, rot, _)) in enumerate(pols):
        v = (u - 0.7 - 0.45 * k) / 0.55
        if v <= 0: continue
        dy = -1300 * (1 - rebond(v)); r = rot + (1 - ease(v)) * (18 if k % 2 else -18)
        derive = 0.012 * max(0, u - 2.5)
        coller(im, c, cx, cy + dy, s=0.98 + derive, rot=r)
    # volet de couleur en diagonale vers l'univers suivant
    if i < len(CH) - 1 and u > PAS - 0.55:
        e = ease((u - (PAS - 0.55)) / 0.55); nf = CH[i + 1][0]
        poly = [(-400 + (W + 1200) * e - 600, 0), (-400 + (W + 1200) * e, 0), (-400 + (W + 1200) * e - 600, H), (-400 + (W + 1200) * e - 1200, H)]
        dd = ImageDraw.Draw(im); dd.polygon([(0, 0), poly[1], (poly[1][0] - 600, H), (0, H)], fill=nf)

def s_mosaique(im, t, d):
    im.paste((248, 242, 232) + (255,), (0, 0, W, H))
    cols, cw = 5, 180; ch = 180; gap = 18
    rows = math.ceil(len(MOS) / cols); x0 = (W - (cols * cw + (cols - 1) * gap)) / 2; y0 = 420
    for n, m in enumerate(MOS):
        r, c = divmod(n, cols); v = ease((t - 0.04 * n) / 0.4)
        if v <= 0: continue
        cx = x0 + c * (cw + gap) + cw / 2; cy = y0 + r * (ch + gap) + ch / 2
        coller(im, m, cx, cy, s=0.6 + 0.4 * v, alpha=v, ombre=False)
    texte(im, 0, 1540, "Personnalisé pour vous", PLAY(76), ENCRE, 255 * ease((t - 1.2) / 0.5))

def vignette(chemin, taille=230):
    img = Image.open(os.path.join("public", chemin)).convert("RGB")
    r = taille / min(img.size); img = img.resize((int(img.width * r) + 1, int(img.height * r) + 1), Image.LANCZOS)
    img = img.crop(((img.width - taille) // 2, (img.height - taille) // 2, (img.width - taille) // 2 + taille, (img.height - taille) // 2 + taille))
    m = Image.new("L", (taille, taille), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, taille - 1, taille - 1), 26, fill=255)
    out = Image.new("RGBA", (taille, taille)); out.paste(img, (0, 0), m); return out
MOS = [vignette(p, 180) for p in TOUTES]

def s_fin(im, t, d):
    im.paste(ENCRE + (255,), (0, 0, W, H))
    for i, u in enumerate(UNIVERS):  # les couleurs des univers en bandes verticales qui montent
        e = ease((t - 0.06 * i) / 0.6); w = W / len(UNIVERS)
        ImageDraw.Draw(im).rectangle((i * w, H - int(260 * e), (i + 1) * w, H), fill=u[0])
    texte(im, 0, 600, "Offrez un cadeau", PLAY(84), BLANC, 255 * ease((t - 0.2) / 0.5))
    texte(im, 0, 710, "qui leur ressemble", PLAY(84, 500), (226, 196, 126), 255 * ease((t - 0.45) / 0.5))
    if t > 0.9:
        s = rebond((t - 0.9) / 0.5) * (1 + 0.04 * math.sin((t - 0.9) * 5))
        f = PLAY(66); dd = ImageDraw.Draw(Image.new("RGB", (1, 1))); w = lg(dd, "nivcreation.fr", f)
        p = Image.new("RGBA", (w + 90, 120)); pd = ImageDraw.Draw(p)
        pd.rounded_rectangle((0, 0, w + 89, 119), 60, fill=(226, 196, 126, 255))
        b = pd.textbbox((0, 0), "nivcreation.fr", font=f); pd.text((45 - b[0], (120 - (b[3] - b[1])) / 2 - b[1]), "nivcreation.fr", font=f, fill=ENCRE + (255,))
        coller(im, p, W / 2, 1000, s=s, ombre=False)
    texte(im, 0, 1180, "NiV CRÉATION · Gravé en France", FT_PETIT, BLANC, 230 * ease((t - 1.3) / 0.5))

SCENES = [(2.6, s_intro), (PAS * len(CH), s_chapitres), (2.8, s_mosaique), (3.6, s_fin)]
def image(t):
    acc = 0
    for d, fn in SCENES:
        if t < acc + d or fn is SCENES[-1][1]: break
        acc += d
    im = Image.new("RGBA", (W, H)); fn(im, t - acc, d)
    return im.convert("RGB")

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "52-tous-nos-produits-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(nf): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "52-tous-nos-produits-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if "--apercu" in sys.argv:
        total = sum(d for d, _ in SCENES); ts = [x * 0.7 for x in range(int(total / 0.7) + 1)]
        ims = [image(x).resize((216, 384)) for x in ts]
        cols = 10; rows = math.ceil(len(ims) / cols)
        pl = Image.new("RGB", (cols * 216, rows * 384))
        for i, x in enumerate(ims): pl.paste(x, ((i % cols) * 216, (i // cols) * 384))
        pl.save(os.path.join(OUT, "apercu-planche.jpg"), quality=82)
        for x in (2.4, 6.5, 10.0, 15.0, 22.0, 34.0, 36.5, 39.5):
            image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", len(ims), f"{total:.1f} s")
    else:
        main()
