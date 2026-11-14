# -*- coding: utf-8 -*-
# VIDÉO 59 (14/11/2026) — gérant : « refais une vidéo pour les produits que les gens aiment bien », style « pellicule de cinéma »
# (celui de la vidéo 55, qu'il aimait) avec LES PRODUITS QUI SE VENDENT LE PLUS (commandes lues le 14/11 : verres à vin, tumbler,
# verres à whisky, flûtes, cristal photo 3D, bracelet empreinte, collier Enveloppe, bracelet cordon, carnet).
# Style « pellicule de cinéma » : une bande de film VERTICALE défile du haut vers le bas de l'écran (perforations, numéros
# de bord), chaque photo est une image du film, la bande s'arrête sur chaque image ; décompte d'amorce 3-2-1 au début,
# images-titres pour chaque univers, flash de projecteur et lueur orangée entre les univers, grain et léger scintillement.
# Photos du site regardées en grand (planche) : GRAVÉES, sans badge « EXEMPLE », sans texte anglais, sans bijou vierge.
# ⛔ Aucun prix, aucun nombre de produits. Sans son, 1080 × 1920.
# Usage : python3 tools/video/pellicule_59.py <polices> <sortie> <dossier des photos préparées> [--apercu]   (depuis la racine du dépôt)
# Photos préparées : verres à vin = aperçu de la vraie fiche (repères masqués) ; tumbler = photo de la fiche, badge « EXEMPLE » effacé.
import os, sys, math, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

FD, OUT, PREP = sys.argv[1], sys.argv[2], sys.argv[3]
APERCU = "--apercu" in sys.argv
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
random.seed(59)
FOND = (26, 21, 17); PELL = (14, 12, 11); OR = (214, 176, 92); CREME = (246, 238, 222); ORANGE = (226, 128, 52)

def police(nom, taille, poids=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille)
    if poids:
        try: f.set_variation_by_axes([poids])
        except Exception: pass
    return f
PLAY = lambda s, w=600: police("PlayfairDisplay", s, w)
INTER = lambda s, w=500: police("Inter", s, w)
def ease(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

UNIVERS = [
  ("Verres gravés", [("@vin-1.jpg", "Leur silhouette, gravée sur le verre"),
                     ("@vin-texte.jpg", "Vos prénoms et votre date"),
                     ("@verre_tumbler_37_ex_maries.jpg", "Un dessin à vos prénoms"),
                     ("@verre_tumbler_39_ex_photo.jpg", "Votre photo sur un grand verre"),
                     ("produits/verre_a_whisky_exemple_face.jpg", "Votre photo, gravée sur le verre"),
                     ("produits/verre_whisky_papa_monde_banniere.jpg", "Le meilleur papa du monde"),
                     ("produits/flute-grav-01.jpg", "Pour trinquer le grand jour"),
                     ("produits/flute-grav-05.webp", "Vos prénoms sur la flûte")]),
  ("Cristal photo 3D", [("produits/cristal-h-famille.jpg", "Votre famille, sculptée dans le cristal"),
                        ("produits/cristal-h-demo-couple.jpg", "Vos parents, pour toujours"),
                        ("produits/cristal-v-couple.jpg", "Votre couple, en trois dimensions"),
                        ("produits/cristal-v-enfant-chat.jpg", "Votre enfant et son chat")]),
  ("Bijoux", [("produits/bracelet_empreinte_de_pied_de_bebe_a_graver_dore.jpg", "Ses petits pieds, à votre poignet"),
              ("produits/catalogue/il_fullxfull.7864685306_sefx.jpg", "Un mot doux glissé dans l'enveloppe"),
              ("produits/bracelet-cordon-plaque-4.jpg", "Vos initiales sur un bracelet")]),
  ("Papeterie", [("carnet/exemple-ex1.jpg", "Un carnet à son prénom")]),
]


# ---------------------------------------------------------------- géométrie de la pellicule
SX0, SX1 = 70, W - 70                       # bords de la bande
FH = 820                                    # hauteur d'une image du film (pas)
IMX0, IMX1 = SX0 + 92, SX1 - 92             # zone image (entre les perforations)
IMH = FH - 70
PERF_W, PERF_H, PERF_PAS = 46, 30, 64

def image_photo(chemin):
    img = Image.open(os.path.join(PREP, chemin[1:]) if chemin.startswith("@") else os.path.join("public", chemin)).convert("RGB")
    bw, bh = IMX1 - IMX0, IMH
    fond = img.resize((bw, bh)).filter(ImageFilter.GaussianBlur(28)).point(lambda v: int(v * 0.45))
    k = min(bw / img.width, bh / img.height)
    ph = img.resize((max(1, int(img.width * k)), max(1, int(img.height * k))), Image.LANCZOS)
    fond.paste(ph, ((bw - ph.width) // 2, (bh - ph.height) // 2))
    return fond

def image_titre(num, titre, sous=None):
    bw, bh = IMX1 - IMX0, IMH
    im = Image.new("RGB", (bw, bh), (34, 27, 21)); d = ImageDraw.Draw(im)
    for r in range(0, 420, 3):  # halo doux
        a = int(26 * (1 - r / 420)); d.ellipse((bw // 2 - r, bh // 2 - r, bw // 2 + r, bh // 2 + r), outline=(34 + a, 27 + a // 1, 21 + a // 2))
    if num:
        f = INTER(30, 600); t = num; d.text(((bw - lg(d, t, f)) // 2, bh // 2 - 150), t, font=f, fill=OR)
    f = PLAY(96 if len(titre) < 12 else 80, 700)
    d.text(((bw - lg(d, titre, f)) // 2, bh // 2 - 80), titre, font=f, fill=CREME)
    d.line((bw // 2 - 60, bh // 2 + 60, bw // 2 + 60, bh // 2 + 60), fill=OR, width=3)
    if sous:
        f = INTER(32, 400); d.text(((bw - lg(d, sous, f)) // 2, bh // 2 + 90), sous, font=f, fill=(210, 196, 170))
    return im

def image_decompte(n):
    bw, bh = IMX1 - IMX0, IMH
    im = Image.new("RGB", (bw, bh), (196, 186, 170)); d = ImageDraw.Draw(im)
    cx, cy = bw // 2, bh // 2
    for r in (250, 210): d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(60, 52, 44), width=6)
    d.line((cx, 40, cx, bh - 40), fill=(60, 52, 44), width=4); d.line((40, cy, bw - 40, cy), fill=(60, 52, 44), width=4)
    f = INTER(300, 700); t = str(n); b = d.textbbox((0, 0), t, font=f)
    d.text((cx - (b[2] - b[0]) // 2 - b[0], cy - (b[3] - b[1]) // 2 - b[1]), t, font=f, fill=(30, 26, 22))
    return im

# ---------------------------------------------------------------- le film : liste des images + durée d'arrêt
film = []   # (image, arrêt en s, légende (univers, texte) ou None, flash avant ?)
for n in (3, 2, 1): film.append((image_decompte(n), 0.35, None, False))
film.append((image_titre("", "Nos coups de cœur", "les créations que vous préférez"), 1.0, None, False))
for i, (nom, items) in enumerate(UNIVERS):
    film.append((image_titre(f"CHAPITRE {i + 1:02d}", nom), 0.65, None, True))
    for chemin, leg in items: film.append((image_photo(chemin), 1.15, (nom, leg), False))
film.append((image_titre("", "Votre histoire,", "gravée pour toujours"), 1.4, None, True))
film.append((image_titre("", "nivcreation.fr", "Personnalisé en France"), 2.2, None, False))
TR = 0.32  # durée d'un défilement d'une image à la suivante

# calendrier : temps de début du défilement vers l'image k
cal = []; t = 0.0
for k, (_, arret, _, _) in enumerate(film):
    cal.append(t); t += (TR if k else 0) + arret
DUREE = t
if APERCU: DUREE = min(DUREE, 9.0)

def position(tc):
    """Position (en images) de la bande au temps tc : entier pendant les arrêts, défilement doux entre deux."""
    for k in range(len(film) - 1, -1, -1):
        if tc >= cal[k]:
            if k == 0: return 0.0, 0
            dt = tc - cal[k]
            if dt < TR: return (k - 1) + ease(dt / TR), k
            return float(k), k
    return 0.0, 0

# ---------------------------------------------------------------- éléments fixes
grains = []
for g in range(4):
    n = Image.effect_noise((W // 2, H // 2), 34).resize((W, H)).convert("L")
    grains.append(n.point(lambda v: int(max(0, v - 128) * 0.55)))
vign = Image.new("L", (W, H), 0); dv = ImageDraw.Draw(vign)
for r in range(0, 900, 6): dv.ellipse((W // 2 - 1300 + r, H // 2 - 1500 + r, W // 2 + 1300 - r, H // 2 + 1500 - r), fill=min(255, int(r * 0.28)))
vign = vign.filter(ImageFilter.GaussianBlur(60)).point(lambda v: int((255 - v) * 0.55))  # sombre seulement sur les bords
F_BORD = INTER(18, 600); F_UNI = INTER(30, 700); F_LEG = PLAY(54, 600); F_HAUT = INTER(26, 600)

def bande(decalage_y):
    """La pellicule sur toute la hauteur, décalée de decalage_y (pixels), images comprises."""
    calque = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(calque)
    d.rectangle((SX0, 0, SX1, H), fill=PELL + (255,))
    # perforations
    off = int(decalage_y) % PERF_PAS
    for y in range(-PERF_PAS + off, H + PERF_PAS, PERF_PAS):
        for x in (SX0 + 24, SX1 - 24 - PERF_W):
            d.rounded_rectangle((x, y, x + PERF_W, y + PERF_H), 7, fill=(58, 50, 42, 255))
    return calque, d

def frame(tc):
    pos, k = position(tc)
    img = Image.new("RGB", (W, H), FOND)
    jit = random.choice((-1, 0, 0, 0, 1))  # léger tremblement du projecteur
    centre = H / 2 + jit
    calque, d = bande(pos * FH)
    # images visibles : celle au centre et les voisines
    for j in range(int(pos) - 2, int(pos) + 3):
        if not (0 <= j < len(film)): continue
        y = centre + (j - pos) * FH - IMH / 2
        if y > H or y + IMH < 0: continue
        calque.paste(film[j][0], (IMX0, int(y)))
        # numéro de bord, côté gauche, tourné
        t = f"NIV  {j + 1:02d}A  ▸"
        tl = Image.new("RGBA", (220, 26), (0, 0, 0, 0)); ImageDraw.Draw(tl).text((0, 2), t, font=F_BORD, fill=ORANGE + (200,))
        tl = tl.rotate(90, expand=True); calque.alpha_composite(tl, (SX0 + 78 - 26 - 10, int(y + IMH / 2 - 110)))
    img.paste(calque, (0, 0), calque)
    # lueur orangée + flash quand on entre dans un univers
    _, arret, leg, flash = film[k]
    dt = tc - cal[k]
    if flash and dt < TR + 0.25:
        a = math.sin(min(1, dt / (TR + 0.25)) * math.pi)
        lueur = Image.new("RGB", (W, H), (255, 150, 70))
        m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).ellipse((-300, -200, W + 200, H // 2), fill=int(150 * a))
        img.paste(lueur, (0, 0), m.filter(ImageFilter.GaussianBlur(120)))
        if 0.18 < dt < 0.30: img = Image.blend(img, Image.new("RGB", (W, H), (255, 246, 230)), 0.55)
    # scintillement + grain + vignettage
    fl = 1 + 0.025 * math.sin(tc * 41) + random.uniform(-0.012, 0.012)
    img = img.point(lambda v: min(255, int(v * fl)))
    img.paste((255, 240, 220), (0, 0), grains[int(tc * FPS) % 4])
    img.paste((8, 6, 5), (0, 0), vign)
    d = ImageDraw.Draw(img)
    # haut : marque discrète, sur un bandeau sombre (ne chevauche jamais un titre)
    hb = Image.new("RGBA", (W, 130), (0, 0, 0, 0)); dh = ImageDraw.Draw(hb)
    for yy in range(130): dh.line((0, yy, W, yy), fill=(12, 10, 8, int(250 * min(1, (130 - yy) / 50))))
    img.paste(hb, (0, 0), hb); d = ImageDraw.Draw(img)
    t = "NiV CRÉATION"; d.text(((W - lg(d, t, F_HAUT)) // 2, 40), t, font=F_HAUT, fill=OR)
    # légende : apparaît pendant l'arrêt sur une photo
    if leg and dt > TR + 0.05:
        a = ease((dt - TR - 0.05) / 0.35)
        uni, texte = leg
        bar = Image.new("RGBA", (W, 400), (0, 0, 0, 0)); db = ImageDraw.Draw(bar)
        for yy in range(400): db.line((0, yy, W, yy), fill=(12, 10, 8, int(252 * min(1, yy / 60) * a)))
        img.paste(bar, (0, H - 400), bar); d = ImageDraw.Draw(img)
        u = uni.upper(); col = tuple(int(c * a + 10 * (1 - a)) for c in OR)
        d.text(((W - lg(d, u, F_UNI)) // 2, H - 235 + int(18 * (1 - a))), u, font=F_UNI, fill=col)
        f = F_LEG
        while lg(d, texte, f) > W - 120: f = PLAY(f.size - 4, 600)
        colt = tuple(int(c * a + 10 * (1 - a)) for c in CREME)
        d.text(((W - lg(d, texte, f)) // 2, H - 180 + int(18 * (1 - a))), texte, font=f, fill=colt)
    return img

def rendre(nom, w, h, crf):
    chemin = os.path.join(OUT, nom)
    cmd = [FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-vf", f"scale={w}:{h}", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", str(crf), "-preset", "medium",
           "-movflags", "+faststart", chemin]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = int(DUREE * FPS)
    for i in range(n):
        p.stdin.write(frame(i / FPS).tobytes())
    p.stdin.close(); p.wait()
    return chemin

if __name__ == "__main__":
    if "--image" in sys.argv:
        for tc in [float(x) for x in sys.argv[sys.argv.index("--image") + 1].split(",")]:
            frame(tc).save(os.path.join(OUT, f"image-{tc:05.2f}.jpg"), quality=85)
        print("durée", round(DUREE, 1)); sys.exit()
    print("durée", round(DUREE, 1))
    print(rendre("59-meilleures-ventes-1080x1920.mp4", 1080, 1920, 20))
    if not APERCU: print(rendre("59-meilleures-ventes-720x1280.mp4", 720, 1280, 26))
