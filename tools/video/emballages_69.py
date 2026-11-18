# Vidéo 69 (18/11/2026) — les bijoux gravés dans LEURS VRAIS emballages Niv Création (photos de Gestion › Emballages :
# sac, boîte carrée, boîte allongée, pochette microfibre, pack collier, pack bracelet). Style NEUF « déballage » : sur un fond
# crème chaud, la photo de l'emballage arrive, puis le bijou gravé en sort et se pose au-dessus ; nom de l'emballage + du bijou.
# Les photos des emballages sont celles du gérant (assets-69), posées ENTIÈRES. Sans son, aucun prix.
# Usage (racine) : python3 tools/video/emballages_69.py <polices> <sortie> [--apercu]
import os, sys, math
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, arrondi, coller, encoder, OR)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
A = lambda n: os.path.join(os.path.dirname(__file__), "assets-69", n)
P = lambda n: os.path.join("public", "produits", n)
# (emballage, nom de l'emballage, bijou gravé, nom du bijou)
SCENES = [
  (A("carree.jpg"), "Dans sa boîte cadeau", P("collier-3coeurs-3.jpg"), "Collier 3 Cœurs, « Naomi »"),
  (A("allongee.jpg"), "La boîte des bracelets", P("bracelet-cordon-plaque-4.jpg"), "Bracelet cordon, vos initiales"),
  (A("pack-collier.jpg"), "Le pack complet", P("collier-coeur-plaques-1.jpg"), "Collier cœur & plaques"),
  (A("microfibre.jpg"), "Sa pochette douce", P("catalogue/il_fullxfull.8007460526_h2kk.jpg"), "Médaillon cœur ouvrable"),
  (A("pack-bracelet.jpg"), "Prêt à offrir", P("bracelet-femme-acier-porte.jpg"), "Bracelet gravé"),
  (A("sac.jpg"), "Son sac cadeau", P("collier-double-coeur-3.jpg"), "Collier double cœur"),
]
DS = 4.0; T_INTRO = 3.0; T_FIN = 4.2
TOTAL = T_INTRO + len(SCENES) * DS + T_FIN
ENCRE = (52, 38, 22); OR_F = (169, 137, 53)


def carte_paysage(img, w=900):
    img = img.convert("RGB"); h = int(w * img.height / img.width)
    im = img.resize((w, h), Image.LANCZOS)
    o = arrondi(im, 30); d = ImageDraw.Draw(o)
    d.rounded_rectangle((2, 2, w - 3, h - 3), 28, outline=(255, 255, 255, 255), width=8)
    return o


def carte_bijou(img, s=560):
    im = ImageOps.fit(img.convert("RGB"), (s, s), Image.LANCZOS, centering=(0.5, 0.45))
    o = arrondi(im, 280 if False else 30); d = ImageDraw.Draw(o)
    d.rounded_rectangle((2, 2, s - 3, s - 3), 28, outline=(232, 200, 120, 255), width=8)
    return o


EMB = [carte_paysage(Image.open(e)) for e, *_ in SCENES]
BIJ = [carte_bijou(Image.open(b)) for _, _, b, _ in SCENES]
INTRO_IMG = carte_paysage(Image.open(A("pack-collier.jpg")), 960)

FOND = Image.new("RGBA", (W, H)); dF = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H
    dF.line((0, y, W, y), fill=(int(247 - 14 * k), int(239 - 20 * k), int(226 - 28 * k), 255))
lum = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(lum).ellipse((W / 2 - 700, 500, W / 2 + 700, 1700), fill=(255, 250, 240, 140))
FOND.alpha_composite(lum.filter(ImageFilter.GaussianBlur(150)))


def ruban(d, y, a):
    d.line((W / 2 - 160, y, W / 2 - 20, y), fill=OR + (int(255 * a),), width=3)
    d.line((W / 2 + 20, y, W / 2 + 160, y), fill=OR + (int(255 * a),), width=3)
    d.polygon([(W / 2, y - 9), (W / 2 + 9, y), (W / 2, y + 9), (W / 2 - 9, y)], fill=OR + (int(255 * a),))


def bouton(d, u, cy):
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, cy - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(255, 255, 255))


def image(t):
    im = FOND.copy(); d = ImageDraw.Draw(im)
    if t < T_INTRO:
        e = ease(t / 0.9); z = 1.0 + 0.04 * t / T_INTRO
        coller(im, INTRO_IMG, W / 2, 1180 + (1 - e) * 120, a=e, sc=z)
        d = ImageDraw.Draw(im); f1 = PLAY(96, 700); f2 = INTER(34, 700)
        for j, (txt, c) in enumerate([("Votre bijou gravé,", ENCRE), ("prêt à offrir", OR_F)]):
            k = ease((t - 0.3 - j * 0.25) / 0.7)
            d.text(((W - lg(d, txt, f1)) / 2, 380 + j * 118 + (1 - k) * 40), txt, font=f1, fill=c + (int(255 * k),))
        k = ease((t - 0.9) / 0.6); s = "LES EMBALLAGES NIV CRÉATION"
        d.text(((W - lg(d, s, f2)) / 2, 300), s, font=f2, fill=OR_F + (int(255 * k),)); ruban(d, 650, k)
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < len(SCENES) * DS:
        i = int(t2 // DS); u = t2 - i * DS
        _, nom_e, _, nom_b = SCENES[i]
        dep = easeio((u - DS + 0.45) / 0.45)
        e_emb = ease(u / 0.6)
        x_emb = W / 2 + (1 - e_emb) * 900 - dep * 900
        y_emb = 1300
        coller(im, EMB[i], x_emb, y_emb, ang=(1 - e_emb) * 6, a=1 - dep * 0.3)
        # le bijou sort de l'emballage et monte se poser au-dessus
        s = ease((u - 0.8) / 0.9)
        if s > 0:
            y_b = y_emb - s * 660
            sc = 0.45 + 0.55 * s
            coller(im, BIJ[i], x_emb, y_b, ang=(1 - s) * -10 + math.sin(u * 2) * 1.2 * s, a=min(1.0, s * 1.6) * (1 - dep), sc=sc)
        d = ImageDraw.Draw(im)
        a1 = ease((u - 0.4) / 0.4) * (1 - dep); a2 = ease((u - 1.5) / 0.5) * (1 - dep)
        f1 = INTER(32, 700); f2 = PLAY(60, 600)
        if a1 > 0:
            t1 = nom_e.upper(); d.text(((W - lg(d, t1, f1)) / 2, 1660), t1, font=f1, fill=OR_F + (int(255 * a1),))
        if a2 > 0:
            d.text(((W - lg(d, nom_b, f2)) / 2, 1712), nom_b, font=f2, fill=ENCRE + (int(255 * a2),))
        return im.convert("RGB")
    u = t2 - len(SCENES) * DS
    # fin : les 4 emballages en mosaïque, puis le bouton
    noms = ["Sac cadeau", "Boîte cadeau", "Pochette microfibre", "Pack complet"]
    srcs = [EMB[5], EMB[0], EMB[3], EMB[2]]
    for k, (c, n) in enumerate(zip(srcs, noms)):
        e = ease((u - k * 0.12) / 0.5)
        x = 290 + (k % 2) * 500; y = 640 + (k // 2) * 520
        coller(im, c, x, y + (1 - e) * 60, a=e, sc=0.5)
        d = ImageDraw.Draw(im); f = INTER(30, 700); n2 = n.upper()
        d.text((x - lg(d, n2, f) / 2, y + 190), n2, font=f, fill=OR_F + (int(255 * e),))
    d = ImageDraw.Draw(im); f = PLAY(70, 700)
    for k, (txt, cc) in enumerate([("À choisir avec", ENCRE), ("votre bijou gravé", OR_F)]):
        d.text(((W - lg(d, txt, f)) / 2, 140 + k * 92), txt, font=f, fill=cc)
    bouton(d, u, 1720)
    return im.convert("RGB")


if APERCU:
    for k, tt in enumerate([2.4, T_INTRO + 0.5, T_INTRO + 1.3, T_INTRO + 2.6, T_INTRO + DS + 2.6, T_INTRO + 3 * DS + 2.6, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu69-{k}.jpg"), quality=85)
    sys.exit(0)
print(encoder(image, TOTAL, OUT, "69-emballages-bijoux"), round(TOTAL, 1), "s")
