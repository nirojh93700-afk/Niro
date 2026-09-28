# -*- coding: utf-8 -*-
# VIDÉO PUB SILENCIEUSE — bijoux gravés, TOUS les colliers/bracelets à cœur dont on a
# une VRAIE photo gravée (demande du gérant, 28/09/2026 : « une vidéo avec des produits
# que t'as pas fait encore, les bijoux plus »).
# Verticale 1080x1920, sans son (comme les vidéos 10-13, 16).
#
# RÈGLE : uniquement des photos où la gravure est VISIBLE, vérifié par planche contact
# le 28/09 (public/produits — chaque candidat ouvert un par un, jamais fié au nom du
# fichier). Sur les ~140 photos de bijoux du dossier, SEULES 10 montrent une vraie
# gravure lisible — toutes reprises ici. Aucune n'était encore réunie dans une vidéo
# 100% bijoux (les vidéos 14/15 n'en montraient que 2-3 au milieu d'un thème Noël ;
# une ancienne vidéo bijoux, avant la règle du 22/09, montrait des produits VIERGES —
# non reprise ici).
NUM = 17
NOM = "bijoux-graves"
THEME = "Bijoux gravés — colliers & bracelets"

import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

OUT = "/tmp/claude-0/-home-user-Niro/8c34bee5-87e4-524d-be1e-7cc50fe3894e/scratchpad/videos"
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
SRC = os.path.join(os.path.dirname(__file__), "..", "..", "public", "produits")

RUBAN = "✦  BIJOUX GRAVÉS  ✦"
PASTILLE = "GRAVÉ"
ACCROCHE = "Un prénom, une date, un mot — gravé pour toujours dans votre bijou"

# (fichier, nom du produit, légende) — les 10 SEULES photos de bijoux vérifiées gravées.
PRODUITS = [
    ('collier-coeur-grave-1.jpg', 'Collier Cœur à graver', 'Recto-verso, initiales et date'),
    ('collier-coeur-plaques-1.jpg', 'Collier Cœur & 2 plaques', 'Deux prénoms, une date'),
    ('collier-3coeurs-3.jpg', 'Collier 3 Cœurs entrelacés', 'Un prénom gravé au cœur'),
    ('collier-double-coeur-3.jpg', 'Collier Double Cœur', 'Vos initiales et votre date'),
    ('bracelet-cordon-plaque-4.jpg', 'Bracelet cordon à plaque', 'Vos initiales sur la plaque'),
    ('collier-coeur-grave-2.jpg', 'Collier Cœur à graver', 'Un message, un prénom'),
    ('collier-coeur-plaques-2.jpg', 'Collier Cœur & 2 plaques', 'Chaque plaque, un souvenir'),
    ('bracelet-femme-acier-grave.jpg', 'Bracelet Femme Acier', 'Un mot gravé au poignet'),
    ('collier-double-coeur-5.jpg', 'Collier Double Cœur', 'Deux prénoms, un seul cœur'),
    ('collier-double-coeur-6.jpg', 'Collier Double Cœur', 'Gravé pour un souvenir qui dure'),
]

SEG_DUR, INTRO_DUR, OUTRO_DUR = 2.2, 1.9, 2.4

def fond_flou(im):
    """Photo entière, fond = la même photo zoomée et floutée. Centrée dans la zone
    SÛRE de TikTok/Insta (loin du haut = barre de l'appli, loin du bas = légende +
    icônes), même recette que la vidéo 16."""
    iw, ih = im.size
    s = max(W / iw, H / ih); bg = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS)
    bx, by = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((bx, by, bx + W, by + H)).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (20, 16, 12)), 0.35)
    s2 = min((W - 80) / iw, (H * 0.42) / ih); fg = im.resize((int(iw * s2), int(ih * s2)), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, int(H * 0.44) - fg.height // 2))
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
    y_sub_bottom = BOTTOM_SAFE
    y_sub_top = y_sub_bottom - len(lignes) * 44

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
    segs = [("card", card("Vos bijoux, gravés", ACCROCHE, "NiV CRÉATION", haut=RUBAN, ink_bg=True), None, INTRO_DUR + 0.4)]
    for f, name, sub in PRODUITS:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        base = fond_flou(im)
        ZW, ZH = int(W * 1.12), int(H * 1.12)
        segs.append(("prod", base.resize((ZW, ZH), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card("Gravé pour eux", "Chaque bijou est personnalisé, gravé à la commande",
                               "nivcreation.fr  ·  Gravé en France", haut=RUBAN, ink_bg=True), None, OUTRO_DUR))
    brut = f"{OUT}/{NOM}-brut.mp4"; final = f"{OUT}/niv-{NOM}.mp4"
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
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(brut)
    mi.resize((360, 640)).save(f"{OUT}/apercu-{NOM}.jpg", quality=80)
    print(f"Vidéo {NUM} — {THEME} : {sum(s[3] for s in segs):.1f} s, {os.path.getsize(final)//1024} Ko → {final}")

rendre()
