# -*- coding: utf-8 -*-
# VIDÉOS 20 (bijoux) et 21 (blocs de cristal) — « GROS PLANS » (03/10/2026).
# Demande du gérant : « deux vidéos… une avec des bijoux, l'autre que des blocs de cristal… refais pas
# les mêmes produits ». Constat (planches contact) : toutes les photos gravées du site sont DÉJÀ passées
# dans les vidéos 10, 13, 14, 15, 17, 19 — aucune nouvelle photo. Réponse : mêmes pièces, traitées
# autrement : chaque plan DÉMARRE en gros plan sur la gravure (le prénom, la date, le visage dans le
# cristal) puis RECULE pour révéler la pièce entière. Verticale 1080x1920 + version légère 720x1280, sans son.
#
# RÈGLE : uniquement des photos où la gravure est VISIBLE. ⚠️ `collier-double-coeur-5.jpg` (or rose)
# est une photo SANS gravure (plaque vierge) : elle était pourtant dans les vidéos 17 et 19 — ÉCARTÉE ici.
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

OUT = "/tmp/claude-0/-home-user-Niro/8c34bee5-87e4-524d-be1e-7cc50fe3894e/scratchpad/videos"
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); CREAM = (250, 246, 238); INK = (30, 26, 22); WHITE = (255, 255, 255); INK2 = (46, 40, 33)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SANSB_U = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def F(p, s): return ImageFont.truetype(p, s)
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "produits")
PASTILLE = "GRAVÉ"
TOP_SAFE = 210
BOTTOM_SAFE = H - 460
FW, FH = W - 80, int(H * 0.44)          # zone photo
ASP = FW / FH
SEG_DUR, HOLD, INTRO_DUR, OUTRO_DUR = 3.1, 0.55, 2.2, 2.6

VIDEOS = {
    20: dict(nom="bijoux-gros-plans", ruban="✦  GRAVURE EN GROS PLAN  ✦",
             intro=("Chaque détail, gravé", "Un prénom, une date, un mot : regardez de près"),
             outro=("Un bijou qui leur ressemble", "Chaque pièce est gravée à la commande"),
             produits=[
                 ('collier-3coeurs-3.jpg', (0.25, 0.55, 0.78, 0.93), 'Collier 3 Cœurs entrelacés', 'Un prénom au creux du cœur'),
                 ('bracelet-cordon-plaque-4.jpg', (0.15, 0.55, 0.62, 0.90), 'Bracelet cordon à plaque', 'Initiales et motif, gravés sur la plaque'),
                 ('collier-double-coeur-6.jpg', (0.55, 0.50, 0.88, 0.90), 'Collier Double Cœur', 'Un message et une date, sur le second cœur'),
                 ('bracelet-femme-acier-grave.jpg', (0.22, 0.50, 0.88, 0.75), 'Bracelet Femme Acier', 'Un mot gravé au poignet'),
                 ('collier-coeur-plaques-2.jpg', (0.28, 0.55, 0.62, 0.90), 'Collier Cœur & 2 plaques', 'Prénoms et dates, plaque par plaque'),
                 ('collier-double-coeur-3.jpg', (0.52, 0.50, 0.88, 0.88), 'Collier Double Cœur', 'Un mot et une date, sur le second cœur'),
                 ('collier-coeur-grave-2.jpg', (0.18, 0.38, 0.85, 0.74), 'Collier Cœur à graver', 'Un prénom, une date, un message'),
                 ('collier-coeur-plaques-1.jpg', (0.30, 0.33, 0.62, 0.88), 'Collier Cœur & 2 plaques', 'Un prénom par plaque'),
                 ('collier-coeur-grave-1.jpg', (0.22, 0.45, 0.56, 0.78), 'Collier Cœur à graver', 'Initiales et date, gravées au détail près'),
             ]),
    21: dict(nom="cristal-gros-plans", ruban="✦  CRISTAL PHOTO 3D  ✦",
             intro=("Votre photo, dans le cristal", "Un souvenir gravé en 3D : regardez de près"),
             outro=("Un souvenir qui ne s'efface pas", "Chaque bloc est gravé à la commande"),
             produits=[
                 ('cristal-h-famille.jpg', (0.20, 0.12, 0.88, 0.90), 'Cristal Photo 3D — Horizontal', '« Toujours ensemble », gravé sous la photo'),
                 ('cristal-v-enfant-chat.jpg', (0.28, 0.08, 0.72, 0.95), 'Cristal Photo 3D — Vertical', '« Amour inconditionnel »'),
                 ('cristal-h-couple.jpg', (0.20, 0.12, 0.85, 0.80), 'Cristal Photo 3D — Horizontal', 'Un couple, gravé dans le cristal'),
                 ('cristal-v-femme.jpg', (0.32, 0.10, 0.70, 0.85), 'Cristal Photo 3D — Vertical', 'Un portrait, gravé pour toujours'),
                 ('cristal-h-amis.jpg', (0.25, 0.15, 0.80, 0.75), 'Cristal Photo 3D — Horizontal', 'Une bande d\'amis, gravée en 3D'),
                 ('cristal-v-enfant-chien.jpg', (0.28, 0.08, 0.72, 0.95), 'Cristal Photo 3D — Vertical', 'Un compagnon, gravé en 3D'),
                 ('cristal-h-demo-couple.jpg', (0.20, 0.12, 0.85, 0.88), 'Cristal Photo 3D — Horizontal', 'Chaque visage, gravé dans le détail'),
                 ('cristal-v-jeunes.jpg', (0.10, 0.05, 0.92, 0.80), 'Cristal Photo 3D — Vertical', 'Toute une bande, gravée en 3D'),
                 ('cristal-v-couple.jpg', (0.32, 0.10, 0.70, 0.88), 'Cristal Photo 3D — Vertical', 'Un couple, gravé en 3D'),
             ]),
}

def wrap(d, t, f, mw):
    o = []; c = ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o

def fond_global(im):
    iw, ih = im.size
    s = max(W / iw, H / ih); bg = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS)
    bx, by = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((bx, by, bx + W, by + H)).filter(ImageFilter.GaussianBlur(28))
    return Image.blend(bg, Image.new("RGB", (W, H), (20, 16, 12)), 0.35)

def canevas(im):
    """Photo ENTIÈRE posée sur un canevas de la proportion de la zone photo (marges = la photo floutée)."""
    iw, ih = im.size
    cw = int(max(iw, ih * ASP)); ch = int(cw / ASP)
    s = max(cw / iw, ch / ih); bg = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS)
    bx, by = (bg.width - cw) // 2, (bg.height - ch) // 2
    bg = bg.crop((bx, by, bx + cw, by + ch)).filter(ImageFilter.GaussianBlur(24))
    bg = Image.blend(bg, Image.new("RGB", (cw, ch), (20, 16, 12)), 0.25)
    ox, oy = (cw - iw) // 2, (ch - ih) // 2
    bg.paste(im, (ox, oy))
    return bg, (ox, oy, iw, ih)

def fenetre_detail(box, place, cw, ch):
    ox, oy, iw, ih = place
    x0, y0, x1, y1 = ox + box[0] * iw, oy + box[1] * ih, ox + box[2] * iw, oy + box[3] * ih
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    w = max(x1 - x0, (y1 - y0) * ASP, 0.45 * cw)   # jamais moins de 45 % : pas de pixels géants
    w = min(w, cw); h = w / ASP
    x = min(max(cx - w / 2, 0), cw - w); y = min(max(cy - h / 2, 0), ch - h)
    return (x, y, w, h)

def ease(t): return t * t * (3 - 2 * t)

def overlay(name, sub, ruban):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1000) / (H - 1000)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H)))
    im = Image.alpha_composite(im, dark); d = ImageDraw.Draw(im)
    fS = F(SANS, 34); lignes = wrap(d, sub, fS, W - 120)
    y_sub_top = BOTTOM_SAFE - len(lignes) * 44
    ft = F(SERIFB, 58)
    for taille in range(58, 40, -2):
        ft = F(SERIFB, taille)
        if d.textlength(name, font=ft) <= W - 120: break
    y_name = y_sub_top - 12 - 68
    fp = F(SANSB, 26); wp = d.textlength(PASTILLE, font=fp); y_pastille = y_name - 10 - 42
    d.rounded_rectangle([60, y_pastille, 60 + wp + 36, y_pastille + 42], radius=21, fill=INK2 + (255,))
    d.text((78, y_pastille + 6), PASTILLE, font=fp, fill=GOLD)
    d.text((60, y_name), name, font=ft, fill=GOLD)
    yy = y_sub_top
    for ln in lignes: d.text((60, yy), ln, font=fS, fill=WHITE); yy += 44
    fr = F(SANSB_U, 32); wr = d.textlength(ruban, font=fr); ph = 84
    d.rectangle([0, TOP_SAFE - ph, W, TOP_SAFE], fill=INK + (255,))
    d.rectangle([0, TOP_SAFE, W, TOP_SAFE + 6], fill=GOLD + (255,))
    d.text(((W - wr) // 2, TOP_SAFE - ph + (ph - 34) // 2 - 4), ruban, font=fr, fill=GOLD)
    return im

def card(big, small, big2, haut):
    im = Image.new("RGB", (W, H), INK); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    fh = F(SANSB_U, 38); wh = d.textlength(haut, font=fh); d.text(((W - wh) // 2, H // 2 - 300), haut, font=fh, fill=GOLD)
    fB = F(SERIFB, 100)
    for taille in range(100, 52, -4):
        fB = F(SERIFB, taille)
        if d.textlength(big, font=fB) <= W - 100: break
    wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50); y = H // 2 - 20
    for ln in wrap(d, small, fS, W - 140):
        ws = d.textlength(ln, font=fS); d.text(((W - ws) // 2, y), ln, font=fS, fill=(245, 238, 222)); y += 62
    f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2); d.text(((W - w2) // 2, y + 20), big2, font=f2, fill=GOLD)
    return im

def rendre(num):
    V = VIDEOS[num]; nom = V["nom"]
    segs = [("card", card(V["intro"][0], V["intro"][1], "NiV CRÉATION", V["ruban"]), INTRO_DUR)]
    for f, box, name, sub in V["produits"]:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        can, place = canevas(im)
        segs.append(("prod", dict(bg=fond_global(im), can=can, win=fenetre_detail(box, place, can.width, can.height),
                                  ov=overlay(name, sub, V["ruban"])), SEG_DUR))
    segs.append(("card", card(V["outro"][0], V["outro"][1], "nivcreation.fr  ·  Gravé en France", V["ruban"]), OUTRO_DUR))
    brut = f"{OUT}/{num}-{nom}-brut.mp4"
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM); apercus = []
    for kind, data, dur in segs:
        nf = max(1, int(round(dur * FPS)))
        for fi in range(nf):
            if kind == "card": frame = data.copy()
            else:
                t = fi / FPS
                p = 0.0 if t < HOLD else min(1.0, (t - HOLD) / (dur - HOLD - 0.35))
                e = ease(p)
                can = data["can"]; x, y, w, h = data["win"]
                X, Y, Wd, Hd = x * (1 - e), y * (1 - e), w + (can.width - w) * e, h + (can.height - h) * e
                crop = can.crop((int(X), int(Y), int(X + Wd), int(Y + Hd))).resize((FW, FH), Image.LANCZOS)
                frame = data["bg"].copy()
                d = ImageDraw.Draw(frame)
                px, py = 40, int(H * 0.44) - FH // 2
                d.rectangle([px - 6, py - 6, px + FW + 6, py + FH + 6], fill=GOLD)
                frame.paste(crop, (px, py))
                frame = Image.alpha_composite(frame.convert("RGBA"), data["ov"]).convert("RGB")
                if fi in (int(0.2 * FPS), nf - 12): apercus.append(frame.resize((270, 480)))
            FA = int(0.16 * FPS); a = 1.0
            if fi < FA: a = fi / FA
            elif fi > nf - FA: a = max(0, (nf - fi) / FA)
            if a < 1.0: frame = Image.blend(cream, frame, a)
            wri.append_data(np.asarray(frame))
    wri.close()
    full = f"{OUT}/{num}-{nom}-1080x1920.mp4"; leg = f"{OUT}/{num}-{nom}-720x1280.mp4"
    subprocess.run([FF, "-y", "-i", brut, "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
                    "-an", "-movflags", "+faststart", full], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p",
                    "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", leg], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(brut)
    # planche d'aperçu : début (gros plan) et fin (pièce entière) de chaque plan
    cols = 8; rows = (len(apercus) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 274, rows * 484), (30, 30, 30))
    for i, a in enumerate(apercus): sh.paste(a, ((i % cols) * 274 + 2, (i // cols) * 484 + 2))
    sh.save(f"{OUT}/apercu-{num}.jpg", quality=80)
    print(f"Vidéo {num} — {nom} : {sum(s[2] for s in segs):.1f} s · pleine {os.path.getsize(full)//1024} Ko · légère {os.path.getsize(leg)//1024} Ko")

if __name__ == "__main__":
    for n in (int(a) for a in sys.argv[1:]) or (20, 21): rendre(n)
