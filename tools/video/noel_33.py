# -*- coding: utf-8 -*-
# VIDÉO 33 (28/10/2026) — NOËL, cadeaux gravés (silencieuse, verticale 1080x1920), gérant : « fais-moi une vidéo pour Noël ».
# Même recette et même habillage Noël que la vidéo 13 (pub_cristaux_silencieuse.py) : ruban « IDÉE CADEAU DE NOËL » sur CHAQUE
# plan, pastille « NOËL 2026 », cartes rouge & or. Pièces DIFFÉRENTES des vidéos 13/14/15 + les nouveautés (cristaux déjà gravés,
# puzzle photo, marque-pages, verre à cocktail). UNIQUEMENT des pièces GRAVÉES (planche contact regardée le 28/10), toutes en vente.
# ⚠️ Marque-pages en bois : APERÇUS de la maquette (pas encore de photo gravée de l'atelier). ⛔ Aucune date, aucun prix, aucun nombre.
# Usage : python3 tools/video/noel_33.py <dossier de sortie>
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
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SANSB_U = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def F(p, s): return ImageFont.truetype(p, s)
SRC = os.path.join(HERE, "..", "..", "public")

VIDEOS = {
  33: ("Cadeaux de Noël", "Un prénom, une photo, un souvenir : gravés dans notre atelier", "noel-33", [
    ("produits/cristaux-graves/sapin.jpg", "Cristal déjà gravé", "Un sapin de Noël, gravé dans le cristal"),
    ("produits/puzzle-photo-famille.jpg", "Puzzle photo gravé", "Toute la famille, à reconstituer"),
    ("produits/collier-double-coeur-6.jpg", "Collier Double Cœur", "Un prénom, une date, gravés pour elle"),
    ("produits/carafe_whiskey_1892.jpg", "Carafe à whisky gravée", "Son étiquette, son année"),
    ("marque-pages/m1/exemple-ex7.jpg", "Marque-page en bois gravé", "Un portrait et un mot pour Mamie"),
    ("produits/verre_a_cocktail_exemple_nom.jpg", "Verre à cocktail gravé", "Un nom gravé, pour l’apéritif des fêtes"),
    ("produits/cristaux-graves/chat-sapin.jpg", "Cristal déjà gravé", "Le chat au pied du sapin"),
    ("produits/verre_whisky_papa_monde_moustache.jpg", "Verre à whisky gravé", "Pour le meilleur papa du monde"),
    ("produits/collier-coeur-plaques-2.jpg", "Collier Cœur & plaques", "Les prénoms de ceux qu’elle aime"),
    ("produits/puzzle-savane.jpg", "Puzzle en bois", "Pour les petits, gravé à leur prénom"),
    ("produits/bracelet-cordon-plaque-4.jpg", "Bracelet à plaque gravée", "Ses initiales, pour lui"),
    ("produits/cristaux-graves/ange.jpg", "Cristal déjà gravé", "Un ange, prêt à offrir"),
    ("marque-pages/m1/exemple-ex1.jpg", "Marque-page en bois gravé", "Un prénom et des papillons"),
  ], True),
}
# Habillage Noël (vidéo 13, remarque du gérant 26/09 : « dans la vidéo on sait pas que c'est pour
# des cadeaux pour Noël ») : ruban doré « IDÉE CADEAU DE NOËL » sur CHAQUE plan, cartes rouge & or.
ROUGE = (122, 21, 18); ROUGE2 = (156, 31, 26)
RUBAN = "✦  IDÉE CADEAU DE NOËL  ✦"

SEG_DUR, INTRO_DUR, OUTRO_DUR = 2.2, 1.9, 2.3

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

def overlay(name, sub, noel=False):
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
    if noel:
        fr = F(SANSB_U, 38); wr = d.textlength(RUBAN, font=fr); ph = 96
        d.rectangle([0, 0, W, ph], fill=ROUGE + (255,)); d.rectangle([0, ph, W, ph + 6], fill=GOLD + (255,))
        d.text(((W - wr) // 2, (ph - 40) // 2 - 4), RUBAN, font=fr, fill=GOLD)
        # pastille « Noël 2026 » près du nom
        fp = F(SANSB, 30); t = "NOËL 2026"; wp = d.textlength(t, font=fp)
        d.rounded_rectangle([60, H - 420, 60 + wp + 40, H - 372], radius=24, fill=ROUGE2 + (255,))
        d.text((80, H - 414), t, font=fp, fill=GOLD)
    return im

def card(big, small, big2=None, noel=False, haut=None):
    im = Image.new("RGB", (W, H), ROUGE if noel else CREAM); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    if haut:
        fh = F(SANSB_U, 38); wh = d.textlength(haut, font=fh); d.text(((W - wh) // 2, H // 2 - 300), haut, font=fh, fill=GOLD if noel else (120, 100, 60))
    fB = F(SERIFB, 100)
    for taille in range(100, 60, -4):
        fB = F(SERIFB, taille)
        if d.textlength(big, font=fB) <= W - 100: break
    wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50)
    y = H // 2 - 20
    for ln in wrap(d, small, fS, W - 140):
        ws = d.textlength(ln, font=fS); d.text(((W - ws) // 2, y), ln, font=fS, fill=(250, 240, 220) if noel else INK); y += 62
    if big2:
        f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2); d.text(((W - w2) // 2, y + 20), big2, font=f2, fill=GOLD if noel else (120, 100, 60))
    return im

def rendre(num):
    theme, accroche, nom, P = VIDEOS[num][:4]; noel = len(VIDEOS[num]) > 4 and VIDEOS[num][4]
    if noel: segs = [("card", card(theme, accroche, "NiV CRÉATION", noel=True, haut="✦  NOËL 2026  ✦"), None, INTRO_DUR + 0.4)]
    else: segs = [("card", card("NiV CRÉATION", accroche), None, INTRO_DUR)]
    for f, name, sub in P:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        base = fond_flou(im)
        ZW, ZH = int(W * 1.12), int(H * 1.12)
        segs.append(("prod", base.resize((ZW, ZH), Image.LANCZOS), overlay(name, sub, noel), SEG_DUR))
    if noel: segs.append(("card", card("Commandez tôt pour Noël", "Chaque pièce est gravée une par une, à la commande", "nivcreation.fr  ·  Gravé en France", noel=True, haut="✦  VOS CADEAUX DE NOËL  ✦"), None, OUTRO_DUR + 0.5))
    else: segs.append(("card", card("nivcreation.fr", "Personnalisez le vôtre", "Gravé en France"), None, OUTRO_DUR))
    brut = f"{OUT}/{nom}-brut.mp4"; final = f"{OUT}/33-noel-720x1280.mp4"; plein = f"{OUT}/33-noel-1080x1920.mp4"
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
    os.replace(brut, plein)
    mi.resize((360, 640)).save(f"{OUT}/apercu-{nom}.jpg", quality=80)
    print(f"Vidéo {num} — {theme} : {sum(s[3] for s in segs):.1f} s, {os.path.getsize(final)//1024} Ko → {final}")

rendre(33)
