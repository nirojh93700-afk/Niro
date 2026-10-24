# -*- coding: utf-8 -*-
# VIDÉO 30 (24/10/2026) — TEASER « Bientôt : les marque-pages » avec LES TROIS MODÈLES (silencieuse, verticale 1080x1920).
# Gérant : « tu me fais une vidéo comme t'as fait tout à l'heure pour les marque-pages [vidéo 29], mais tu laisses les trois
# modèles, métal aussi ». Même recette que la 29 (ruban « NOUVEAUTÉ · BIENTÔT », pastille, carte finale lettre d'information),
# + les exemples avec une PHOTO de personne gravée (validés le 24/10 soir) + le modèle 3 « métal, peintures célèbres » (SANS
# gravure : on ne dit jamais « gravé » sur ses plans). ⛔ Aucune date, aucun prix, aucun nombre, jamais le nom du gérant.
# ⚠️ Bois : APERÇUS des maquettes (pas encore de pièce gravée). Métal : photos du fournisseur recadrées sur le marque-page ;
# le Papillon : caractères chinois du coffret floutés, titre anglais « Butterfly Oil Painting » gardé (il chevauche les ailes).
# À REFAIRE avec les vraies photos de l'atelier à la réception (règle du 22/09).
NUM = 30
NOM = "teaser-marque-pages-3-modeles"
THEME = "Teaser — les trois marque-pages (bois pompon, bois ajouré, métal peintures), bientôt"
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "docs", "videos")
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); CREAM = (250, 246, 238); INK = (30, 26, 22); WHITE = (255, 255, 255)
INK2 = (46, 40, 33)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SANSB_U = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"  # glyphe ✦
def F(p, s): return ImageFont.truetype(p, s)
MQ = os.path.join(HERE, "..", "..", "docs", "maquettes", "assets")
M1 = os.path.join(MQ, "marque-pages"); M2 = os.path.join(MQ, "marque-pages-fenetre"); EX = os.path.join(M1, "exemples")
M3 = os.path.join(MQ, "marque-pages-metal")

RUBAN = "✦  NOUVEAUTÉ  ·  BIENTÔT  ✦"
PASTILLE = "BIENTÔT"
ACCROCHE = "Des marque-pages en bois gravés à votre prénom ou à votre photo, et en métal doré, aux couleurs des grands peintres"

# (fichier, nom du produit, légende, recadrage éventuel dans la photo d'origine)
PRODUITS = [
    (os.path.join(M1, "groupe.jpg"), "Marque-pages en bois", "Pompon doré, plusieurs teintes de bois", None),
    (os.path.join(EX, "m1", "ex1.jpg"), "Gravé à votre prénom", "Un texte, un dessin, un cadre", None),
    (os.path.join(EX, "m1", "ex5.jpg"), "Ou à votre photo", "Gravée en noir et blanc, sur la face ou au dos", None),
    (os.path.join(M1, "eventail.jpg"), "Vous choisissez la teinte", "Du blond clair au gris anthracite", None),
    (os.path.join(M2, "groupe.jpg"), "Ajouré, oiseau et magnolia", "La fenêtre découpée, le dessin imprimé", None),
    (os.path.join(EX, "m2", "ex4.jpg"), "Un portrait au-dessus de la fenêtre", "Et un prénom gravé au dos", None),
    (os.path.join(EX, "m2", "ex1.jpg"), "Votre prénom sur la face", "Un dessin au dos", None),
    (os.path.join(M3, "10-roses-blanches-van-gogh-pompon-dore.jpg"), "En métal doré", "Les Roses blanches de Van Gogh", (300, 150, 1300, 1553)),
    (os.path.join(M3, "11-iris-van-gogh-pompon-dore.jpg"), "Les grands peintres", "Les Iris de Van Gogh, pompon doré", (300, 120, 1250, 1553)),
    (os.path.join(M3, "14-nympheas-monet-pompon-dore.jpg"), "Les Nymphéas de Monet", "Émaillés, comme une petite toile", (300, 120, 1250, 1553)),
    (os.path.join(M3, "01-amandier-en-fleurs-van-gogh.jpg"), "L’Amandier en fleurs", "D’après Van Gogh", (400, 60, 1150, 1460)),
    (os.path.join(M3, "22-nympheas-papillon-monet-coffret.jpg"), "Le papillon", "Dans son coffret, prêt à offrir", "papillon"),
    (os.path.join(M1, "boite4.jpg"), "En coffret cadeau", "Dans leur boîte bleu nuit, prêts à offrir", None),
    (os.path.join(EX, "m1", "ex7.jpg"), "Pour offrir", "Un portrait, un mot, au dos un souvenir", None),
]

def charger(f, crop):
    im = Image.open(f).convert("RGB")
    if crop == "papillon":  # caractères chinois du coffret floutés (fondu), cadrage sur le papillon
        b = (790, 935, 975, 1005); bl = im.filter(ImageFilter.GaussianBlur(14))
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle(b, radius=20, fill=255); m = m.filter(ImageFilter.GaussianBlur(10))
        return Image.composite(bl, im, m).crop((470, 540, 1240, 1150))
    if crop: return im.crop(crop)
    if os.sep + "exemples" + os.sep in f: return im.crop((230, 0, 670, 900))  # aperçus : les deux marque-pages seuls
    return im

SEG_DUR, INTRO_DUR, OUTRO_DUR = 2.2, 1.9, 2.4

def fond_flou(im):
    iw, ih = im.size
    s = max(W / iw, H / ih); bg = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS)
    bx, by = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((bx, by, bx + W, by + H)).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (20, 16, 12)), 0.35)
    portrait = ih > iw * 1.3  # les aperçus face + dos : plus hauts que larges → plus grands, posés un peu plus haut
    s2 = min((W - 80) / iw, (H * (0.50 if portrait else 0.42)) / ih); fg = im.resize((int(iw * s2), int(ih * s2)), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, int(H * (0.40 if portrait else 0.44)) - fg.height // 2))
    return bg

def wrap(d, t, f, mw):
    o = []; c = ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o

TOP_SAFE = 210
BOTTOM_SAFE = H - 460

def overlay(name, sub):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1000) / (H - 1000)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H)))
    im = Image.alpha_composite(im, dark); d = ImageDraw.Draw(im)
    fS = F(SANS, 34)
    lignes = wrap(d, sub, fS, W - 120)
    y_sub_top = BOTTOM_SAFE - len(lignes) * 44
    ft = F(SERIFB, 58)
    for taille in range(58, 40, -2):
        ft = F(SERIFB, taille)
        if d.textlength(name, font=ft) <= W - 120: break
    y_name = y_sub_top - 12 - 68
    fp = F(SANSB, 26); wp = d.textlength(PASTILLE, font=fp)
    y_pastille = y_name - 10 - 42
    d.rounded_rectangle([60, y_pastille, 60 + wp + 36, y_pastille + 42], radius=21, fill=INK2 + (255,))
    d.text((78, y_pastille + 6), PASTILLE, font=fp, fill=GOLD)
    d.text((60, y_name), name, font=ft, fill=GOLD)
    yy = y_sub_top
    for ln in lignes:
        d.text((60, yy), ln, font=fS, fill=WHITE); yy += 44
    fr = F(SANSB_U, 32); wr = d.textlength(RUBAN, font=fr); ph = 84
    d.rectangle([0, TOP_SAFE - ph, W, TOP_SAFE], fill=INK + (255,))
    d.rectangle([0, TOP_SAFE, W, TOP_SAFE + 6], fill=GOLD + (255,))
    d.text(((W - wr) // 2, TOP_SAFE - ph + (ph - 34) // 2 - 4), RUBAN, font=fr, fill=GOLD)
    return im

def card(big, small, big2=None, haut=None, ink_bg=False):
    im = Image.new("RGB", (W, H), INK if ink_bg else CREAM); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    if haut:
        fh = F(SANSB_U, 38); wh = d.textlength(haut, font=fh)
        d.text(((W - wh) // 2, H // 2 - 300), haut, font=fh, fill=GOLD if ink_bg else (120, 100, 60))
    fB = F(SERIFB, 100)
    for taille in range(100, 60, -4):
        fB = F(SERIFB, taille)
        if d.textlength(big, font=fB) <= W - 100: break
    wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50)
    y = H // 2 - 20
    for ln in wrap(d, small, fS, W - 140):
        ws = d.textlength(ln, font=fS)
        d.text(((W - ws) // 2, y), ln, font=fS, fill=(245, 238, 222) if ink_bg else INK); y += 62
    if big2:
        f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2)
        d.text(((W - w2) // 2, y + 20), big2, font=f2, fill=GOLD)
    return im

def rendre():
    segs = [("card", card("Bientôt dans l’atelier", ACCROCHE, "NiV CRÉATION", haut=RUBAN, ink_bg=True), None, INTRO_DUR + 0.6)]
    for f, name, sub, crop in PRODUITS:
        base = fond_flou(charger(f, crop))
        ZW, ZH = int(W * 1.12), int(H * 1.12)
        segs.append(("prod", base.resize((ZW, ZH), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card("Ils arrivent bientôt", "Inscrivez-vous à la lettre d’information sur nivcreation.fr : vous recevrez l’annonce de leur arrivée",
                               "nivcreation.fr  ·  Gravé en France", haut=RUBAN, ink_bg=True), None, OUTRO_DUR + 0.6))
    brut = f"{OUT}/{NUM}-{NOM}-brut.mp4"; hd = f"{OUT}/{NUM}-{NOM}-1080x1920.mp4"; final = f"{OUT}/{NUM}-{NOM}-720x1280.mp4"
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM); mi = None
    for kind, img, ov, dur in segs:
        nf = max(1, int(round(dur * FPS)))
        for fi in range(nf):
            prog = fi / max(1, nf - 1)
            if kind == "card": frame = img.convert("RGBA")
            else:
                z = 1.12 - 0.12 * prog
                cw, ch = int(W * z), int(H * z); x = (img.size[0] - cw) // 2; y = (img.size[1] - ch) // 2
                frame = Image.alpha_composite(img.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS).convert("RGBA"), ov)
            frame = frame.convert("RGB")
            FA = int(0.16 * FPS); a = 1.0
            if fi < FA: a = fi / FA
            elif fi > nf - FA: a = max(0, (nf - fi) / FA)
            if a < 1.0: frame = Image.blend(cream, frame, a)
            if kind == "prod" and fi == nf // 2 and mi is None: mi = frame.copy()
            wri.append_data(np.asarray(frame))
    wri.close()
    # 1080p pleine qualité (crf 22, taille raisonnable) + 720p légère.
    subprocess.run([FF, "-y", "-i", brut, "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "22",
                    "-preset", "medium", "-an", "-movflags", "+faststart", hd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(brut)
    mi.resize((360, 640)).save(f"{OUT}/apercu-{NUM}-{NOM}.jpg", quality=80)
    print(f"Vidéo {NUM} — {THEME} : {sum(s[3] for s in segs):.1f} s, 1080p {os.path.getsize(hd)//1024} Ko, 720p {os.path.getsize(final)//1024} Ko → {final}")

rendre()
