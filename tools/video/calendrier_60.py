# -*- coding: utf-8 -*-
# VIDÉO 60 (15/11/2026) — gérant : « Fais-moi une vidéo pour Insta TikTok » (sans thème = tous les univers, style neuf).
# Style NEUF « calendrier de l'Avent » : un calendrier en papier kraft, 12 portes numérotées (rouge baie, vert sapin, crème, or)
# rangées dans le désordre comme un vrai calendrier ; elles s'ouvrent dans l'ordre 1 → 12, une gerbe dorée jaillit, la photo sort
# de la porte, grandit au centre dans un cadre blanc (photo ENTIÈRE, jamais recadrée), avec une étiquette kraft suspendue
# (univers + phrase), puis retourne se ranger dans sa case. Fin : toutes les portes ouvertes + ruban « Offrez un cadeau unique ».
# Photos du site regardées sur planche : GRAVÉES, sans badge « EXEMPLE », sans texte anglais, différentes des vidéos 55 à 59.
# ⛔ Aucun prix, aucun nombre de produits. Sans son, 1080 × 1920.
# Usage : python3 tools/video/calendrier_60.py <polices> <sortie> [--apercu]   (depuis la racine du dépôt)
import os, sys, math, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

FD, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
random.seed(60)
ENCRE = (40, 28, 18); BLANC = (255, 255, 255); OR = (201, 162, 75); OR_C = (232, 200, 120)
ROUGE = (166, 36, 44); SAPIN = (30, 74, 56); CREME = (246, 236, 216)

def police(nom, taille, poids=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille)
    if poids:
        try: f.set_variation_by_axes([poids])
        except Exception: pass
    return f
PLAY = lambda s, w=700: police("PlayfairDisplay", s, w)
INTER = lambda s, w=600: police("Inter", s, w)
def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def easeio(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def rebond(x): x = max(0.0, min(1.0, x)); return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

# ---------------------------------------------------------------- les 12 portes (ordre d'ouverture)
PORTES = [
  ("produits/cristal-h-amis.jpg", "Cristal", "Votre photo, gravée en 3D dans le cristal"),
  ("produits/collier-coeur-plaques-2.jpg", "Bijoux", "Leurs prénoms, sur un collier"),
  ("produits/verre_whisky_papa_monde_moustache.jpg", "Verres", "Pour le meilleur papa du monde"),
  ("produits/catalogue/il_fullxfull.8007460526_h2kk.jpg", "Bijoux", "Un médaillon cœur, gravé pour elle"),
  ("carnet/exemple-ex2.jpg", "Papeterie", "Un carnet de recettes à son nom"),
  ("produits/cristal-v-femme.jpg", "Cristal", "Le portrait de maman, dans le cristal"),
  ("produits/verre_tumbler_37_ex_photo.jpg", "Verres", "Sa photo et son prénom sur un verre"),
  ("produits/gobelet/ex1-creme-papillon-camille.jpg", "Gobelets", "Un gobelet gravé à son prénom"),
  ("produits/collier-3coeurs-1.jpg", "Bijoux", "Un cœur pour chaque enfant"),
  ("marque-pages/m2/exemple-ex2.jpg", "Papeterie", "Un marque-page ajouré, gravé au dos"),
  ("produits/bracelet-coeur-ot-dore.jpg", "Bijoux", "Un bracelet cœur, gravé pour elle"),
  ("produits/cristaux-graves/chat-sapin.jpg", "Cristal", "Un cristal déjà gravé, prêt pour Noël"),
]
# numéros dans le désordre, comme un vrai calendrier (ligne par ligne)
GRILLE = [[7, 2, 11], [4, 12, 9], [1, 6, 3], [10, 5, 8]]
COULEURS = [ROUGE, SAPIN, CREME, OR, SAPIN, ROUGE, OR, CREME, ROUGE, CREME, SAPIN, OR]
X0, Y0, CW, CH, GAP = 60, 520, 300, 290, 30
POS = {}
for r, ligne in enumerate(GRILLE):
    for c, n in enumerate(ligne): POS[n] = (X0 + c * (CW + GAP), Y0 + r * (CH + GAP))

SANS_BADGE = {"produits/verre_tumbler_37_ex_photo.jpg"}   # étiquette « EXEMPLE » en haut à gauche, fond blanc
def charger(chemin):
    im = Image.open(os.path.join("public", chemin)).convert("RGB")
    if chemin in SANS_BADGE:
        px = im.load(); fond_c = px[im.width // 2, 10]
        ImageDraw.Draw(im).rectangle((14, 14, int(im.width * 0.205), int(im.height * 0.095)), fill=fond_c)
        for y in range(10, int(im.height * 0.10)):
            for x in range(int(im.width * 0.2), int(im.width * 0.235)):
                r, g, b = px[x, y]
                if max(r, g, b) - min(r, g, b) > 6 or (r + g + b) / 3 < 200: px[x, y] = fond_c
    return im
PHOTOS = [charger(p[0]) for p in PORTES]

def vignette(img):
    """La photo entière dans la case, sur fond crème (jamais recadrée)."""
    v = Image.new("RGB", (CW - 20, CH - 20), CREME)
    k = min(v.width / img.width, v.height / img.height); p = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    v.paste(p, ((v.width - p.width) // 2, (v.height - p.height) // 2))
    m = Image.new("L", v.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, v.width - 1, v.height - 1), 14, fill=255)
    o = Image.new("RGBA", v.size); o.paste(v, (0, 0), m); return o
VIGN = [vignette(p) for p in PHOTOS]

def carte(img):
    """Grand cadre blanc façon tirage photo, la photo entière dedans."""
    bw, bh = 860, 900
    k = min(bw / img.width, bh / img.height); p = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    b = 22; c = Image.new("RGBA", (p.width + 2 * b, p.height + 2 * b), (0, 0, 0, 0))
    ImageDraw.Draw(c).rounded_rectangle((0, 0, c.width - 1, c.height - 1), 26, fill=(255, 252, 245, 255))
    m = Image.new("L", p.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, p.width - 1, p.height - 1), 16, fill=255)
    c.paste(p, (b, b), m); return c
CARTES = [carte(p) for p in PHOTOS]

# ---------------------------------------------------------------- le calendrier
def flocon(d, cx, cy, r, coul, ep=3):
    for k in range(6):
        a = k * math.pi / 3; x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        d.line((cx, cy, x, y), fill=coul, width=ep)
        for s in (-1, 1):
            b = a + s * 0.6; d.line((cx + 0.55 * r * math.cos(a), cy + 0.55 * r * math.sin(a),
                                     cx + 0.55 * r * math.cos(a) + 0.3 * r * math.cos(b), cy + 0.55 * r * math.sin(a) + 0.3 * r * math.sin(b)), fill=coul, width=max(1, ep - 1))

def etoile(d, cx, cy, r, coul):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5; rr = r if k % 2 == 0 else r * 0.42
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=coul)

def fond():
    im = Image.new("RGB", (W, H), (205, 170, 126))
    # grain du papier kraft
    bruit = Image.effect_noise((W // 2, H // 2), 22).resize((W, H)).convert("L")
    kraft = Image.merge("RGB", [bruit.point(lambda v, o=o: max(0, min(255, v + o))) for o in (82, 46, 2)])
    im = Image.blend(im, kraft, 0.18)
    d = ImageDraw.Draw(im, "RGBA")
    # petits pois dorés
    for y in range(40, H, 70):
        for x in range(35 + (y // 70 % 2) * 35, W, 70): d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 240, 200, 60))
    # vignettage doux
    v = Image.new("L", (W, H), 0); ImageDraw.Draw(v).ellipse((-300, -200, W + 300, H + 200), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(160)); im = Image.composite(im, Image.blend(im, Image.new("RGB", (W, H), (90, 60, 30)), 0.45), v)
    return im.convert("RGBA")
FOND = fond()

def porte(n, coul):
    """La face avant d'une porte : couleur, double filet, numéro doré, petite étoile ou flocon."""
    p = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); d = ImageDraw.Draw(p)
    d.rounded_rectangle((0, 0, CW - 1, CH - 1), 18, fill=coul + (255,))
    clair = coul == CREME or coul == OR
    filet = (166, 120, 50) if clair else OR_C
    d.rounded_rectangle((12, 12, CW - 13, CH - 13), 12, outline=filet + (255,), width=3)
    d.rounded_rectangle((20, 20, CW - 21, CH - 21), 9, outline=filet + (130,), width=1)
    txt = str(n); f = PLAY(150, 800); b = d.textbbox((0, 0), txt, font=f)
    col = (130, 30, 36) if coul == OR else ((150, 108, 40) if coul == CREME else OR_C)
    d.text(((CW - (b[2] - b[0])) / 2 - b[0], (CH - (b[3] - b[1])) / 2 - b[1] - 6), txt, font=f, fill=col + (255,))
    if n % 2: etoile(d, CW - 46, 46, 16, filet + (230,))
    else: flocon(d, 46, CH - 46, 17, filet + (220,), 3)
    # petite poignée
    d.ellipse((CW - 36, CH / 2 - 8, CW - 20, CH / 2 + 8), fill=filet + (255,))
    return p
FACES = {n: porte(n, COULEURS[n - 1]) for n in range(1, 13)}
def dos_de(coul):
    c = tuple(int(v * 0.62) for v in coul)
    p = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); ImageDraw.Draw(p).rounded_rectangle((0, 0, CW - 1, CH - 1), 18, fill=c + (255,))
    return p
DOS = {n: dos_de(COULEURS[n - 1]) for n in range(1, 13)}

def ombre(im, x, y, w, h, a=110, flou=14, dy=10):
    s = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    ImageDraw.Draw(s).rounded_rectangle((40, 40, 40 + w, 40 + h), 18, fill=(40, 20, 5, a))
    s = s.filter(ImageFilter.GaussianBlur(flou)); im.alpha_composite(s, (int(x - 40), int(y - 40 + dy)))

def case_vide(im, n):
    """Le creux derrière une porte ouverte, puis la vignette posée dedans."""
    x, y = POS[n]; d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((x, y, x + CW, y + CH), 18, fill=(96, 62, 30, 255))
    d.rounded_rectangle((x + 4, y + 4, x + CW - 4, y + CH - 4), 15, fill=(245, 234, 212, 255))

def porte_ouverte(im, n, e):
    """La porte pivote sur sa charnière gauche (e de 0 à 1) puis s'efface : elle ne déborde jamais sur la case voisine."""
    if e >= 1: return
    x, y = POS[n]; c = math.cos(e * math.radians(86))
    w = max(2, int(c * CW))
    f = FACES[n].resize((w, CH), Image.BILINEAR)
    sh = Image.new("RGBA", f.size, (0, 0, 0, int(110 * (1 - c)))); f.alpha_composite(Image.composite(sh, Image.new("RGBA", f.size), f.split()[3]))
    if e > 0.65:
        a = f.split()[3].point(lambda v, k=1 - (e - 0.65) / 0.35: int(v * k)); f.putalpha(a)
    ombre(im, x, y, w, CH, a=int(90 * c), flou=10, dy=6)
    im.alpha_composite(f, (x, y))

def en_tete(im, u=1.0):
    d = ImageDraw.Draw(im, "RGBA")
    a = int(255 * u)
    t1 = "Le calendrier"; t2 = "des idées cadeaux"
    f1, f2 = PLAY(92, 800), PLAY(76, 500)
    d.text(((W - lg(d, t1, f1)) / 2, 170 - (1 - u) * 40), t1, font=f1, fill=ENCRE + (a,))
    d.text(((W - lg(d, t2, f2)) / 2, 280 - (1 - u) * 40), t2, font=f2, fill=(126, 28, 34, a))
    # ruban de petits drapeaux
    for k in range(9):
        x = 110 + k * 107; yy = 90 + 18 * math.sin(k * 0.8)
        coul = [ROUGE, OR, SAPIN][k % 3]
        d.polygon([(x - 22, yy), (x + 22, yy), (x, yy + 40)], fill=coul + (a,))
    d.line([(60, 82)] + [(110 + k * 107, 90 + 18 * math.sin(k * 0.8)) for k in range(9)] + [(1020, 82)], fill=(120, 85, 50, a), width=3)
    sous = "NOËL 2026 · GRAVÉ DANS NOTRE ATELIER"; fs = INTER(30, 600)
    d.text(((W - lg(d, sous, fs)) / 2, 400), sous, font=fs, fill=(110, 76, 40, int(a * 0.95)))
    etoile(d, (W - lg(d, sous, fs)) / 2 - 34, 418, 13, OR + (a,)); etoile(d, (W + lg(d, sous, fs)) / 2 + 34, 418, 13, OR + (a,))

def pied(im, a=1.0):
    d = ImageDraw.Draw(im, "RGBA"); t = "nivcreation.fr"; f = INTER(34, 700)
    d.text(((W - lg(d, t, f)) / 2, 1830), t, font=f, fill=(70, 45, 20, int(230 * a)))

def calendrier(im, ouvertes, en_cours=None, e=0.0, apparition=None):
    """ouvertes : numéros déjà ouverts (vignette visible) ; en_cours : la porte qui s'ouvre (e)."""
    for n in range(1, 13):
        x, y = POS[n]
        if apparition is not None:
            u = rebond((apparition - 0.06 * (n % 12)) / 0.45)
            if u <= 0.02: continue
            s = u; p = FACES[n].resize((max(1, int(CW * s)), max(1, int(CH * s))), Image.BILINEAR)
            ombre(im, x + CW * (1 - s) / 2, y + CH * (1 - s) / 2, p.width, p.height)
            im.alpha_composite(p, (int(x + (CW - p.width) / 2), int(y + (CH - p.height) / 2)))
            continue
        if n in ouvertes or n == en_cours:
            case_vide(im, n)
            if n in ouvertes: im.alpha_composite(VIGN[n - 1], (x + 10, y + 10))
            if n == en_cours: porte_ouverte(im, n, e)
        else:
            ombre(im, x, y, CW, CH); im.alpha_composite(FACES[n], (x, y))

def gerbe(im, n, u):
    """Gerbe dorée qui jaillit de la porte."""
    if u <= 0 or u >= 1: return
    x, y = POS[n]; cx, cy = x + CW / 2, y + CH / 2
    rnd = random.Random(n * 7); d = ImageDraw.Draw(im, "RGBA")
    for k in range(34):
        a = rnd.uniform(0, 2 * math.pi); v = rnd.uniform(160, 420); r = rnd.uniform(4, 10)
        px, py = cx + math.cos(a) * v * ease(u), cy + math.sin(a) * v * ease(u) + 220 * u * u
        al = int(255 * (1 - u)); coul = rnd.choice([OR, OR_C, (255, 246, 220)])
        if k % 3 == 0: etoile(d, px, py, r * 1.6 * (1 - u * 0.5), coul + (al,))
        else: d.ellipse((px - r, py - r, px + r, py + r), fill=coul + (al,))

# neige légère sur toute la vidéo
FLOCONS = [(random.uniform(0, W), random.uniform(0, H), random.uniform(2, 6), random.uniform(40, 110), random.uniform(0, 6.28)) for _ in range(70)]
def neige(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    for x, y, r, v, ph in FLOCONS:
        yy = (y + v * t) % (H + 20) - 10; xx = x + 18 * math.sin(t * 0.9 + ph)
        d.ellipse((xx - r, yy - r, xx + r, yy + r), fill=(255, 255, 255, 150))

def etiquette(im, n, u, cx, top):
    """Étiquette kraft suspendue par une ficelle : univers + phrase."""
    if u <= 0: return
    _, univ, phrase = PORTES[n - 1]
    d0 = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    fp = PLAY(52, 600); fu = INTER(28, 700)
    mots = phrase.split(" "); lignes = [phrase]
    if lg(d0, phrase, fp) > 760:
        k = min(range(1, len(mots)), key=lambda k: max(lg(d0, " ".join(mots[:k]), fp), lg(d0, " ".join(mots[k:]), fp)))
        lignes = [" ".join(mots[:k]), " ".join(mots[k:])]
    w = max(lg(d0, l, fp) for l in lignes) + 140; h = 92 + 66 * len(lignes)
    e = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(e)
    d.polygon([(30, 0), (w - 30, 0), (w, 30), (w, h), (0, h), (0, 30)], fill=(222, 190, 140, 255))
    d.polygon([(30, 0), (w - 30, 0), (w, 30), (w, h), (0, h), (0, 30)], outline=(150, 108, 60, 255), width=3)
    d.ellipse((w / 2 - 11, 14, w / 2 + 11, 36), fill=(120, 85, 50, 255))
    U = univ.upper(); d.text(((w - lg(d, U, fu)) / 2, 50), U, font=fu, fill=(126, 28, 34, 255))
    for i, l in enumerate(lignes): d.text(((w - lg(d, l, fp)) / 2, 88 + i * 70), l, font=fp, fill=ENCRE + (255,))
    s = rebond(u); e = e.resize((max(1, int(w * s)), max(1, int(h * s))), Image.BILINEAR).rotate(-2 + 3 * (1 - u), resample=Image.BICUBIC, expand=True)
    dd = ImageDraw.Draw(im, "RGBA"); dd.line((cx, top - 40, cx, top + 20), fill=(120, 85, 50, 230), width=3)
    ombre(im, cx - e.width / 2, top + 6, e.width, e.height, a=90, flou=12)
    im.alpha_composite(e, (int(cx - e.width / 2), int(top + 6)))

def coller(im, c, cx, cy, s, rot=0.0, alpha=1.0):
    if s <= 0.02: return
    x = c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1: a = x.split()[3].point(lambda v: int(v * alpha)); x = x.copy(); x.putalpha(a)
    sh = Image.new("RGBA", x.size, (0, 0, 0, 0)); sh.putalpha(x.split()[3].point(lambda v: int(v * 0.5)))
    sh = sh.filter(ImageFilter.GaussianBlur(24)); im.alpha_composite(sh, (int(cx - x.width / 2) + 8, int(cy - x.height / 2) + 30))
    im.alpha_composite(x, (int(cx - x.width / 2), int(cy - x.height / 2)))

# ---------------------------------------------------------------- scènes
T_INTRO, PAS, T_FIN = 2.6, 2.45, 3.8
def s_intro(im, t):
    en_tete(im, ease(t / 0.7)); calendrier(im, set(), apparition=t - 0.5); pied(im, ease((t - 1.6) / 0.5))

def s_portes(im, t):
    i = min(11, int(t / PAS)); u = (t - i * PAS) / PAS; n = i + 1; tt = u * PAS
    ouvertes = set(range(1, n))
    O, M, R = 0.42, 0.42, 0.36           # ouverture, montée, retour (s)
    tient = PAS - O - M - R
    en_tete(im); pied(im)
    if tt < O:                            # la porte s'ouvre
        calendrier(im, ouvertes, n, easeio(tt / O)); gerbe(im, n, (tt - O * 0.55) / 0.7)
        return
    calendrier(im, ouvertes, n, 1.0)
    gerbe(im, n, (tt - O * 0.55) / 0.7)
    x, y = POS[n]; dx, dy = x + CW / 2, y + CH / 2
    c = CARTES[n - 1]; s_case = (CW - 20) / max(c.width, c.height)
    cx, cy = W / 2, 820
    if tt < O + M: k = ease((tt - O) / M)
    elif tt < O + M + tient: k = 1
    else: k = 1 - easeio((tt - O - M - tient) / R)
    voile = int(150 * k); im.alpha_composite(Image.new("RGBA", (W, H), (30, 18, 8, voile)))
    s = s_case + (1 - s_case) * k * (1 + 0.025 * max(0, (tt - O - M)) if k == 1 else 1)
    coller(im, c, dx + (cx - dx) * k, dy + (cy - dy) * k, s, rot=(-3 if n % 2 else 3) * k)
    # badge numéro sur la carte
    if k > 0.6:
        d = ImageDraw.Draw(im, "RGBA"); a = int(255 * (k - 0.6) / 0.4)
        bx, by = cx - c.width * s / 2 + 20, cy - c.height * s / 2 + 10
        d.ellipse((bx - 56, by - 56, bx + 56, by + 56), fill=COULEURS[n - 1] + (a,), outline=OR_C + (a,), width=4)
        f = PLAY(62, 800); tx = str(n); b = d.textbbox((0, 0), tx, font=f)
        col = (130, 30, 36) if COULEURS[n - 1] == OR else ((150, 108, 40) if COULEURS[n - 1] == CREME else OR_C)
        d.text((bx - (b[2] - b[0]) / 2 - b[0], by - (b[3] - b[1]) / 2 - b[1]), tx, font=f, fill=col + (a,))
    if O + M * 0.5 < tt < O + M + tient:
        etiquette(im, n, (tt - O - M * 0.5) / 0.4, cx, cy + c.height / 2 + 30)

def s_fin(im, t):
    en_tete(im); calendrier(im, set(range(1, 13))); pied(im)
    k = ease((t - 0.3) / 0.6)
    im.alpha_composite(Image.new("RGBA", (W, H), (30, 18, 8, int(120 * k))))
    # ruban rouge en travers
    if k > 0:
        d = ImageDraw.Draw(im, "RGBA"); y = 980; h = 330
        xl = -40 + (1 - k) * -W
        d.polygon([(xl, y), (xl + W + 80, y), (xl + W + 80, y + h), (xl, y + h)], fill=ROUGE + (240,))
        d.line((xl, y + 14, xl + W + 80, y + 14), fill=OR_C + (255,), width=3); d.line((xl, y + h - 14, xl + W + 80, y + h - 14), fill=OR_C + (255,), width=3)
        for txt, yy, f, col, dl in [("Offrez un cadeau", y + 40, PLAY(86, 700), BLANC, 0.6), ("unique", y + 140, PLAY(96, 500), OR_C, 0.8)]:
            a = int(255 * ease((t - dl) / 0.5)); d.text(((W - lg(d, txt, f)) / 2, yy), txt, font=f, fill=col + (a,))
    if t > 1.3:
        u = rebond((t - 1.3) / 0.5) * (1 + 0.03 * math.sin((t - 1.3) * 5))
        p = Image.new("RGBA", (560, 120), (0, 0, 0, 0)); d = ImageDraw.Draw(p)
        d.rounded_rectangle((0, 0, 559, 119), 60, fill=(255, 250, 240, 255)); f = INTER(50, 800); tx = "nivcreation.fr"
        d.text(((560 - lg(d, tx, f)) / 2, 30), tx, font=f, fill=ENCRE + (255,))
        p = p.resize((max(1, int(560 * u)), max(1, int(120 * u))), Image.BILINEAR)
        im.alpha_composite(p, (int((W - p.width) / 2), int(1400 - p.height / 2)))
    if t > 1.8:
        d = ImageDraw.Draw(im, "RGBA"); a = int(240 * ease((t - 1.8) / 0.5)); tx = "NiV CRÉATION · Gravé en France"; f = INTER(34, 600)
        d.text(((W - lg(d, tx, f)) / 2, 1500), tx, font=f, fill=BLANC + (a,))

SCENES = [(T_INTRO, s_intro), (PAS * 12, s_portes), (T_FIN, s_fin)]
TOTAL = sum(d for d, _ in SCENES)
def image(t):
    acc = 0
    for d, fn in SCENES:
        if t < acc + d or fn is SCENES[-1][1]: break
        acc += d
    im = FOND.copy(); fn(im, t - acc); neige(im, t)
    rgb = im.convert("RGB")
    if t < 0.3: rgb = Image.blend(Image.new("RGB", (W, H)), rgb, t / 0.3)
    return rgb

def main():
    nf = int(TOTAL * FPS)
    out = os.path.join(OUT, "60-calendrier-cadeaux-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(nf): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "60-calendrier-cadeaux-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{TOTAL:.1f} s")

if __name__ == "__main__":
    if "--apercu" in sys.argv:
        ts = [1.0, 2.5] + [T_INTRO + PAS * k + v for k in (0, 4, 10) for v in (0.2, 0.5, 1.3, 2.3)] + [TOTAL - 2.5, TOTAL - 0.2]
        ims = [image(x).resize((270, 480)) for x in ts]
        cols = 8; rows = math.ceil(len(ims) / cols); pl = Image.new("RGB", (cols * 270, rows * 480))
        for i, x in enumerate(ims): pl.paste(x, ((i % cols) * 270, (i // cols) * 480))
        pl.save(os.path.join(OUT, "apercu-planche.jpg"), quality=82)
        for x in (2.5, T_INTRO + PAS * 4 + 1.3, TOTAL - 0.2): image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", f"{TOTAL:.1f} s")
    else:
        main()
