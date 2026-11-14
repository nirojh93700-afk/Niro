#!/usr/bin/env python3
"""Vidéo 56 — « Créez le vôtre » : comment ça marche, pour les clientes (14/11/2026).

Tutoriel vertical, sans voix : les vraies pages des créateurs filmées en vue téléphone
(captures Playwright, une photo par geste), posées dans un téléphone, avec l'étape écrite
au-dessus et un rond doré là où le doigt touche.

  python3 tools/video/tuto_creez_56.py <dossier des polices> <dossier des captures> <sortie> [--apercu]

<dossier des captures> contient un sous-dossier par création (lettre, deco, arbre, maison, fleur),
chacun avec ses PNG et un liste.json : {dpr, vw, vh, liste:[{f, dur, tap:[x,y]|null, etape?}]}.
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import imageio_ffmpeg

FD, CAP, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
APERCU = "--apercu" in sys.argv
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
CREME = (251, 247, 238); SABLE = (243, 232, 211); OR = (201, 162, 75); OR_F = (124, 97, 32)
ENCRE = (26, 18, 6); GRIS = (107, 93, 72); BLANC = (255, 255, 255)


def police(nom, taille, poids):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille)
    try: f.set_variation_by_axes([poids])
    except Exception: pass
    return f
PLAY = lambda s, w=700: police("PlayfairDisplay", s, w)
INTER = lambda s, w=600: police("Inter", s, w)
def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]


def lignes(d, texte, f, largeur):
    mots, out, cur = texte.split(), [], ""
    for m in mots:
        essai = (cur + " " + m).strip()
        if lg(d, essai, f) <= largeur or not cur: cur = essai
        else: out.append(cur); cur = m
    if cur: out.append(cur)
    return out


# ---------------------------------------------------------------- fond commun
FOND = Image.new("RGB", (W, H), CREME)
_d = ImageDraw.Draw(FOND)
for y in range(H):
    t = y / H
    _d.line([(0, y), (W, y)], fill=tuple(int(CREME[i] * (1 - t) + SABLE[i] * t) for i in range(3)))
_halo = Image.new("L", (W, H), 0); ImageDraw.Draw(_halo).ellipse((-300, 900, W + 300, 2600), fill=90)
_halo = _halo.filter(ImageFilter.GaussianBlur(160))
FOND = Image.composite(Image.new("RGB", (W, H), (236, 218, 178)), FOND, _halo)

# ---------------------------------------------------------------- le téléphone
TOP = 372                       # hauteur réservée aux textes du haut
BAS = 1920 - 78                 # bas du téléphone
ECRAN_H = BAS - TOP - 2 * 16
ECRAN_W = None                  # calculé avec la 1re capture


def ecran_taille(vw, vh):
    h = ECRAN_H; w = round(h * vw / vh)
    return w, h


def telephone(img_ecran):
    """Pose une capture dans un téléphone (bord noir arrondi, ombre)."""
    w, h = img_ecran.size; b = 16
    tel = Image.new("RGBA", (w + 2 * b, h + 2 * b), (0, 0, 0, 0))
    m = Image.new("L", tel.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, tel.width - 1, tel.height - 1), 58, fill=255)
    tel.paste((22, 18, 14, 255), (0, 0), m)
    m2 = Image.new("L", (w, h), 0); ImageDraw.Draw(m2).rounded_rectangle((0, 0, w - 1, h - 1), 44, fill=255)
    tel.paste(img_ecran.convert("RGB"), (b, b), m2)
    return tel


OMBRE = None


def poser(cadre, tel, x0, y0):
    global OMBRE
    if OMBRE is None or OMBRE.size != tel.size:
        o = Image.new("L", (tel.width + 120, tel.height + 120), 0)
        ImageDraw.Draw(o).rounded_rectangle((60, 80, tel.width + 60, tel.height + 60), 60, fill=110)
        OMBRE = o.filter(ImageFilter.GaussianBlur(30))
    cadre.paste((90, 66, 30), (x0 - 60, y0 - 60), OMBRE)
    cadre.paste(tel, (x0, y0), tel)


def doigt(cadre, x, y, t):
    """Rond doré qui pulse là où le doigt touche (t = 0..1 sur la durée de la photo)."""
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    r = 34
    d.ellipse((x - r, y - r, x + r, y + r), fill=(201, 162, 75, 120), outline=(255, 255, 255, 230), width=5)
    rr = r + 10 + 46 * ease(t)
    a = int(200 * (1 - ease(t)))
    d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=(201, 162, 75, a), width=5)
    cadre.alpha_composite(ov)


# ---------------------------------------------------------------- textes du haut
def entete(cadre, titre, legende, num=None, apparition=1.0):
    d = ImageDraw.Draw(cadre)
    fp = INTER(30, 700)
    pill = titre.upper()
    pw = lg(d, pill, fp) + 56
    x = (W - pw) // 2; y = 70
    d.rounded_rectangle((x, y, x + pw, y + 58), 29, fill=ENCRE)
    d.text((W // 2, y + 29), pill, font=fp, fill=(226, 198, 126), anchor="mm")
    f = PLAY(54, 700)
    ls = lignes(d, legende, f, W - 140)
    if len(ls) > 3: f = PLAY(46, 700); ls = lignes(d, legende, f, W - 120)
    yy = 168 + (3 - len(ls)) * 30
    a = ease(apparition)
    col = tuple(int(CREME[i] * (1 - a) + ENCRE[i] * a) for i in range(3))
    for k, l in enumerate(ls):
        d.text((W // 2, yy + k * 66 + int(18 * (1 - a))), l, font=f, fill=col, anchor="mt")


# ---------------------------------------------------------------- cartes plein écran
def carte_intro(t):
    c = FOND.copy().convert("RGBA"); d = ImageDraw.Draw(c)
    a = ease(t / 0.6)
    d.text((W // 2, 560), "NiV CRÉATION", font=INTER(34, 600), fill=OR_F, anchor="mm")
    d.line([(W // 2 - 90, 610), (W // 2 + 90, 610)], fill=OR, width=3)
    f = PLAY(118, 800)
    d.text((W // 2, 760 + int(30 * (1 - a))), "Créez", font=f, fill=ENCRE, anchor="mm")
    d.text((W // 2, 890 + int(30 * (1 - a))), "le vôtre", font=PLAY(118, 500), fill=OR_F, anchor="mm")
    b = ease((t - 0.5) / 0.7)
    if b > 0:
        for k, l in enumerate(["Votre cadeau, dessiné par vous.", "Gravé et découpé par nous."]):
            d.text((W // 2, 1060 + k * 64 + int(20 * (1 - b))), l, font=INTER(44, 500), fill=GRIS, anchor="mm")
        d.rounded_rectangle((W // 2 - 250, 1260, W // 2 + 250, 1340), 40, fill=ENCRE)
        d.text((W // 2, 1300), "Comment ça marche ?", font=INTER(38, 700), fill=(226, 198, 126), anchor="mm")
    return c


ETAPES = [("1", "Choisissez votre création", "lettre, décoration, arbre de vie, maisonnette, fleur…"),
          ("2", "Personnalisez-la", "prénom, date, couleur, dessin : l'aperçu change à chaque geste"),
          ("3", "Regardez-la en 3D, puis commandez", "nous la gravons, la découpons et l'assemblons à l'atelier")]


def carte_etapes(t):
    c = FOND.copy().convert("RGBA"); d = ImageDraw.Draw(c)
    d.text((W // 2, 360), "En 3 étapes", font=PLAY(86, 800), fill=ENCRE, anchor="mm")
    for k, (n, ti, so) in enumerate(ETAPES):
        a = ease((t - 0.25 - k * 0.45) / 0.5)
        if a <= 0: continue
        y = 560 + k * 330 + int(40 * (1 - a))
        col = lambda rgb: tuple(int(CREME[i] * (1 - a) + rgb[i] * a) for i in range(3))
        d.rounded_rectangle((90, y, W - 90, y + 270), 34, fill=col(BLANC), outline=col((231, 214, 176)), width=3)
        d.ellipse((130, y + 75, 250, y + 195), fill=col(OR))
        d.text((190, y + 135), n, font=PLAY(70, 800), fill=col(BLANC), anchor="mm")
        lt = lignes(d, ti, INTER(42, 700), W - 90 - 290 - 40)
        ys = y + (70 if len(lt) == 1 else 40)
        for j, l in enumerate(lt): d.text((290, ys + j * 52), l, font=INTER(42, 700), fill=col(ENCRE))
        ys += len(lt) * 52 + 10
        for j, l in enumerate(lignes(d, so, INTER(34, 500), W - 90 - 290 - 40)[:3]):
            d.text((290, ys + j * 44), l, font=INTER(34, 500), fill=col(GRIS))
    return c


def carte_titre(titre, sous, t):
    c = FOND.copy().convert("RGBA"); d = ImageDraw.Draw(c)
    a = ease(t / 0.5)
    d.text((W // 2, 820), "Autre création", font=INTER(36, 600), fill=OR_F, anchor="mm")
    for k, l in enumerate(lignes(d, titre, PLAY(96, 800), W - 160)):
        d.text((W // 2, 930 + k * 110 + int(30 * (1 - a))), l, font=PLAY(96, 800), fill=ENCRE, anchor="mm")
    d.text((W // 2, 1180), sous, font=INTER(40, 500), fill=GRIS, anchor="mm")
    return c


def carte_fin(t):
    c = FOND.copy().convert("RGBA"); d = ImageDraw.Draw(c)
    a = ease(t / 0.6)
    d.text((W // 2, 520), "Et nous ?", font=INTER(40, 600), fill=OR_F, anchor="mm")
    for k, l in enumerate(["Nous gravons,", "découpons et", "assemblons votre", "création à l'atelier."]):
        d.text((W // 2, 640 + k * 100 + int(30 * (1 - a))), l, font=PLAY(80, 800), fill=ENCRE, anchor="mm")
    b = ease((t - 0.8) / 0.6)
    if b > 0:
        d.text((W // 2, 1140), "Elle arrive prête à offrir.", font=INTER(44, 500), fill=GRIS, anchor="mm")
        pul = 1 + 0.04 * (1 - abs(((t * 1.4) % 2) - 1))
        bw, bh = int(560 * pul), int(110 * pul)
        d.rounded_rectangle((W // 2 - bw // 2, 1300 - bh // 2, W // 2 + bw // 2, 1300 + bh // 2), bh // 2, fill=OR)
        d.text((W // 2, 1300), "Créez le vôtre", font=INTER(48, 800), fill=BLANC, anchor="mm")
        d.text((W // 2, 1440), "Bientôt sur nivcreation.fr", font=INTER(42, 600), fill=ENCRE, anchor="mm")
    return c


# ---------------------------------------------------------------- séquences filmées
SEQ = [
    ("lettre", "Lettre de naissance", {
        None: "Exemple : la lettre de naissance",
        "prenom": "Écrivez le prénom : la lettre se dessine toute seule",
        "date": "Ajoutez la date, l'heure, la taille et le poids",
        "couleur": "Choisissez la couleur",
        "dessin": "Choisissez un petit dessin",
        "doigt": "Une place ne vous plaît pas ? Glissez avec le doigt",
        "3d": "Regardez-la en 3D, sous tous les angles",
        "boite": "Sa boîte est comprise : la lettre en est le couvercle",
        "panier": "Vérifiez le résumé, puis ajoutez au panier",
    }),
    ("deco", "Décoration à suspendre", {
        None: "La décoration à suspendre",
        "forme": "Choisissez la forme",
        "nom": "Écrivez le prénom",
        "dessin": "Ajoutez des dessins, ou tirez-les au hasard",
        "3d": "Regardez-la en 3D",
    }),
    ("arbre", "Arbre de vie", {
        None: "L'arbre de vie",
        "prenoms": "Un prénom, un cœur",
        "ajout": "Ajoutez autant de prénoms que vous voulez, jusqu'à 6",
        "arbre": "Choisissez votre arbre",
        "3d": "Regardez-le en 3D",
    }),
    ("maison", "Maisonnette", {
        None: "La maisonnette en bois",
        "dessin": "Choisissez le dessin de la façade",
        "decoupes": "Et les petites découpes autour",
        "3d": "Regardez-la en 3D",
    }),
    ("fleur", "Fleur à prénom", {
        None: "La fleur à prénom",
        "prenom": "Écrivez le prénom",
        "fleur": "Choisissez sa fleur",
        "ecriture": "Choisissez l'écriture",
        "3d": "Regardez-la en 3D",
    }),
]
SOUS = {"deco": "Même principe, en quelques gestes", "arbre": "Un prénom par cœur", "maison": "Votre dessin sur la façade", "fleur": "Une fleur qui ne fane pas"}
CACHE = {}
VITESSE = 0.72                  # les gestes défilent un peu plus vite que la capture


def image_ecran(dossier, f):
    k = (dossier, f)
    if k not in CACHE:
        im = Image.open(os.path.join(CAP, dossier, f)).convert("RGB")
        CACHE.clear(); CACHE[k] = im.resize(ecran_taille(*CAP_TAILLE[dossier]), Image.LANCZOS)
    return CACHE[k]


CAP_TAILLE = {}


def sequence(dossier, titre, legendes):
    meta = json.load(open(os.path.join(CAP, dossier, "liste.json")))
    CAP_TAILLE[dossier] = (meta["vw"], meta["vh"])
    ew, eh = ecran_taille(meta["vw"], meta["vh"])
    ech = ew / meta["vw"]
    x0 = (W - (ew + 32)) // 2; y0 = TOP
    leg, depuis = legendes[None], 0
    t0 = 0; k_rafale = 0
    for item in meta["liste"]:
        if item.get("etape") and item["etape"] in legendes and legendes[item["etape"]] != leg:
            leg, depuis = legendes[item["etape"]], t0
        rafale = item["dur"] < 0.1
        if rafale:
            k_rafale += 1
            if k_rafale % 2: continue        # une photo sur deux : la 3D tourne plus vite
        n = max(1, round((0.1 if rafale else item["dur"] * VITESSE) * FPS))
        ecran = image_ecran(dossier, item["f"])
        base = FOND.copy().convert("RGBA"); poser(base, telephone(ecran), x0, y0)
        for i in range(n):
            c = base.copy()
            if item.get("tap"):
                tx, ty = item["tap"]
                doigt(c, x0 + 16 + tx * ech, y0 + 16 + ty * ech, i / max(1, n - 1))
            entete(c, titre, leg, apparition=(t0 + i / FPS - depuis) / 0.45)
            yield c
        t0 += n / FPS


def carte(fn, duree):
    n = round(duree * FPS)
    for i in range(n): yield fn(i / FPS)


def tout():
    yield from carte(carte_intro, 2.8)
    yield from carte(carte_etapes, 4.2)
    for k, (dossier, titre, legs) in enumerate(SEQ):
        if not os.path.exists(os.path.join(CAP, dossier, "liste.json")): continue
        if k > 0: yield from carte(lambda t, ti=titre, d=dossier: carte_titre(ti, SOUS.get(d, ""), t), 1.2)
        yield from sequence(dossier, titre, legs)
    yield from carte(carte_fin, 4.0)


def main():
    if APERCU:
        n = 0
        for fr in tout():
            if n % 60 == 0: fr.convert("RGB").resize((360, 640)).save(os.path.join(OUT, "ap-%04d.jpg" % n), quality=85)
            n += 1
        print(n, "images", round(n / FPS, 1), "s")
        return
    plein = os.path.join(OUT, "56-tuto-creez-le-votre-1080x1920.mp4")
    pr = subprocess.Popen([FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium", "-movflags", "+faststart", plein],
                          stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = 0; prec = None
    for fr in tout():
        rgb = fr.convert("RGB")
        pr.stdin.write(rgb.tobytes()); n += 1
    pr.stdin.close(); pr.wait()
    leger = os.path.join(OUT, "56-tuto-creez-le-votre-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", plein, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-preset", "medium",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", leger], stderr=subprocess.DEVNULL, check=True)
    print(n, "images", round(n / FPS, 1), "s")


main()
