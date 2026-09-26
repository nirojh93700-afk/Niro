# -*- coding: utf-8 -*-
# VIDÉO PUB SILENCIEUSE — verres & carafes gravés, angle ENTREPRENEURS / bars / sociétés,
# pour TikTok & Instagram (demande du gérant, 26/09/2026 : « fais-moi des vidéos pour les
# entrepreneurs avec les verres pour TikTok Insta »).
# Verticale 1080x1920, sans son (comme les vidéos 10-12).
#
# RÈGLE : uniquement des photos où la gravure est VISIBLE (planche contact vérifiée le
# 26/09) — mêmes 10 photos que la vidéo 12 « Verres & carafes gravés » (whisky, vin,
# carafe ; pas de flûte, aucune photo gravée n'existe pour elle). On ne montre JAMAIS un
# faux logo ni la photo d'un autre bar/enseigne : ce sont de VRAIES gravures Niv Création
# (portraits, monogrammes, banderoles) recadrées par le TEXTE vers l'usage professionnel
# (logo de bar/société/restaurant), jamais par une fausse photo.
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

RUBAN = "✦  IDÉE CADEAU D'ENTREPRISE  ✦"
PASTILLE = "GRAVURE LOGO"

# Mêmes 10 photos que la vidéo 12 (toutes vérifiées gravées), légendes réécrites côté
# professionnel (bar, restaurant, société) — jamais un produit vierge, jamais un faux logo.
NUM = 16
NOM = "verres-graves-entreprise"
THEME = "Verres & carafes — pour les entrepreneurs"
ACCROCHE = "Le logo de votre bar, votre restaurant ou votre société, gravé sur nos verres"
PRODUITS = [
    ('verre_a_whisky_logo_bourbon.webp', 'Verre à whisky', 'Un badge, un nom, gravé comme un vrai logo'),
    ('carafe_gravee.jpg', 'Carafe à whisky gravée', 'Pour l’accueil de vos clients ou de vos associés'),
    ('verre_whisky_papa_monde_moustache.jpg', 'Verre à whisky', 'Un blason, une devise, à votre image'),
    ('verre_vin_exemple_dale.jpg', 'Verre à vin gravé', 'Monogramme ou initiales de votre société'),
    ('verre_a_whisky_card.jpg', 'Verre à whisky', 'Un écusson gravé, net et durable'),
    ('carafe_whiskey_1892.jpg', 'Carafe à whisky gravée', 'Une pièce d’exception pour votre bar'),
    ('verre_a_whisky_exemple_face.jpg', 'Verre à whisky', 'Votre logo ou une photo, gravés sur le verre'),
    ('verre_whisky_papa_monde_banniere.jpg', 'Verre à whisky', 'Banderole et nom d’établissement'),
    ('verre_a_whisky_exemple_fond.jpg', 'Verre à whisky', 'Ou gravé au fond, pour une touche discrète'),
    ('verre_vin_geniet.jpg', 'Verre à vin gravé', 'Un cadeau d’affaires qui sort de l’ordinaire'),
]

SEG_DUR, INTRO_DUR, OUTRO_DUR = 2.2, 1.9, 2.4

def fond_flou(im):
    """Photo entière au centre, fond = la même photo zoomée et floutée."""
    iw, ih = im.size
    s = max(W / iw, H / ih); bg = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS)
    bx, by = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((bx, by, bx + W, by + H)).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (20, 16, 12)), 0.35)
    s2 = min((W - 80) / iw, (H * 0.56) / ih); fg = im.resize((int(iw * s2), int(ih * s2)), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, int(H * 0.36) - fg.height // 2))
    return bg

def wrap(d, t, f, mw):
    o = []; c = ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o

def overlay(name, sub):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1120) / (H - 1120)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H)))
    im = Image.alpha_composite(im, dark); d = ImageDraw.Draw(im)
    ft = F(SERIFB, 74)
    for taille in range(74, 47, -2):
        ft = F(SERIFB, taille)
        if d.textlength(name, font=ft) <= W - 120: break
    d.text((60, H - 360), name, font=ft, fill=GOLD)
    y = H - 258
    for ln in wrap(d, sub, F(SANS, 44), W - 120): d.text((60, y), ln, font=F(SANS, 44), fill=WHITE); y += 54
    d.text((60, H - 90), "nivcreation.fr", font=F(SANSB, 34), fill=(235, 220, 180))
    # Ruban « idée cadeau d'entreprise » sur CHAQUE plan (même règle que Noël, 26/09) —
    # habillage encre & or, pas rouge (pas une fête, un usage professionnel).
    fr = F(SANSB_U, 36); wr = d.textlength(RUBAN, font=fr); ph = 96
    d.rectangle([0, 0, W, ph], fill=INK + (255,)); d.rectangle([0, ph, W, ph + 6], fill=GOLD + (255,))
    d.text(((W - wr) // 2, (ph - 38) // 2 - 4), RUBAN, font=fr, fill=GOLD)
    fp = F(SANSB, 28); wp = d.textlength(PASTILLE, font=fp)
    d.rounded_rectangle([60, H - 420, 60 + wp + 40, H - 372], radius=24, fill=INK2 + (255,))
    d.text((80, H - 414), PASTILLE, font=fp, fill=GOLD)
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
    segs = [("card", card("Vos verres, votre logo", ACCROCHE, "NiV CRÉATION", haut="✦  POUR LES ENTREPRENEURS  ✦", ink_bg=True), None, INTRO_DUR + 0.4)]
    for f, name, sub in PRODUITS:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        base = fond_flou(im)
        ZW, ZH = int(W * 1.12), int(H * 1.12)
        segs.append(("prod", base.resize((ZW, ZH), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card("Votre logo, gravé chez nous", "Bars, restaurants, sociétés — écrivez-nous pour un devis",
                               "nivcreation.fr  ·  Gravé en France", haut="✦  CADEAUX D'ENTREPRISE  ✦", ink_bg=True), None, OUTRO_DUR))
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
