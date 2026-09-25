# -*- coding: utf-8 -*-
# VIDEOS PUB SILENCIEUSES — 10 = tous les blocs de cristal, 11 = toute la deco bois (ni musique ni voix), verticales 1080x1920.
# Demande du gerant (25/09/2026) : « trois videos, que des cristaux, que les BLOCS
# de cristal » — pas de porte-cles, pas de pyramide, pas de socle, pas d'USB.
# REGLE : uniquement des blocs ou la GRAVURE (la photo dans le cristal) est
# visible — verifie sur planche contact le 25/09. Blocs vierges ecartes.
# Les photos sont en paysage : on les pose ENTIERES sur un fond flou (jamais de
# recadrage qui couperait le bloc), c'est le rendu classique des reels.
# cristal-v-bebe.jpg (512 px) ecarte : trop petit, flou une fois agrandi.
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

OUT = "/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad/videos"
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); CREAM = (250, 246, 238); INK = (30, 26, 22); WHITE = (255, 255, 255)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p, s): return ImageFont.truetype(p, s)
SRC = os.path.join(os.path.dirname(__file__), "..", "..", "public", "produits")

# UNE SEULE VIDEO avec TOUS les blocs graves (gerant, 25/09 : « une video ou il y a
# tous les blocs, comme une pub pour les reseaux sociaux » — pas trois par theme).
VIDEOS = {
  10: ("Cristal 3D — tous les blocs", "Votre photo gravée dans le cristal", "cristal-3d-tous-les-blocs", [
    ("cristal-h-couple.jpg", "Cristal 3D horizontal", "Votre couple, gravé pour toujours"),
    ("cristal-v-enfant-chat.jpg", "Cristal 3D vertical", "Votre enfant et son chat"),
    ("cristal-h-famille.jpg", "Cristal 3D horizontal", "Toute la famille dans un bloc"),
    ("cristal-v-femme.jpg", "Cristal 3D vertical", "Un portrait sculpté dans le cristal"),
    ("cristal-h-amis.jpg", "Cristal 3D horizontal", "Le groupe, gravé en relief"),
    ("cristal-v-couple.jpg", "Cristal 3D vertical", "Une photo, deux visages, la lumière"),
    ("cristal-video-horizontal-poster.jpg", "Cristal 3D horizontal", "Trois générations, une photo"),
    ("cristal-v-enfant-chien.jpg", "Cristal 3D vertical", "Le meilleur ami, en 3D"),
    ("cristal-h-demo-couple.jpg", "Cristal 3D horizontal", "Le cadeau d’anniversaire de mariage"),
    ("cristal-v-jeunes.jpg", "Cristal 3D vertical", "Les amis, la photo qui reste"),
    ("cristal-video-vertical-poster.jpg", "Cristal 3D vertical", "Un souvenir qui prend la lumière"),
  ]),
  # DECO : tous les objets en bois graves / decoupes (planche contact du 25/09).
  # Ecartes : support-telephone-vierge (rien de grave), couverts et USB (pas de la deco).
  11: ("Déco — bois gravé", "Du bois, une gravure, votre idée", "deco-bois-grave", [
    ('bougeoir-mandala-2.jpg', 'Bougeoir Mandala', 'Bois gravé, découpé au laser'),
    ('support-telephone-photo.jpg', 'Support téléphone', 'Votre photo gravée dans le bois'),
    ('porte-serviettes-colombes-1.jpg', 'Porte-serviettes Colombes', 'Gravé pour la table de fête'),
    ('numero_table_arche_geometrique_relief_bois.jpeg', 'Numéro de table', 'Mariage : arche gravée, votre date'),
    ('bougeoir-lotus-1.jpg', 'Bougeoir Fleur de Lotus', 'La lumière à travers le bois'),
    ('etiquette_serviette_fleur_initiales_blanc.webp', 'Étiquette de serviette', 'Vos initiales, gravées'),
    ('support-ajoure-2.jpg', 'Support téléphone ajouré', 'Dentelle de bois découpée'),
    ('porte-stylo-coq-2.jpg', 'Porte-stylo Coupe du monde', 'Gravé, découpé, personnalisé'),
    ('numero_table_rectangulaire_feuillage_bois.png', 'Numéro de table', 'Feuillage gravé, une par table'),
    ('porte-serviettes-2.jpg', 'Porte-serviettes fleuri', 'Découpe fine, bois naturel'),
    ('psg-lampe-couleur.jpg', 'Lampe gravée', 'Le logo gravé, éclairé la nuit'),
    ('support-telephone-lettre.jpg', 'Support téléphone', 'Votre lettre fleurie gravée'),
  ]),
}
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
    return im

def card(big, small, big2=None):
    im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    fB = F(SERIFB, 100); wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50)
    y = H // 2 - 20
    for ln in wrap(d, small, fS, W - 140):
        ws = d.textlength(ln, font=fS); d.text(((W - ws) // 2, y), ln, font=fS, fill=INK); y += 62
    if big2:
        f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2); d.text(((W - w2) // 2, y + 20), big2, font=f2, fill=(120, 100, 60))
    return im

def rendre(num):
    theme, accroche, nom, P = VIDEOS[num]
    segs = [("card", card("NiV CRÉATION", accroche), None, INTRO_DUR)]
    for f, name, sub in P:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        base = fond_flou(im)
        ZW, ZH = int(W * 1.12), int(H * 1.12)
        segs.append(("prod", base.resize((ZW, ZH), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card("nivcreation.fr", "Personnalisez le vôtre", "Gravé en France"), None, OUTRO_DUR))
    brut = f"{OUT}/{nom}-brut.mp4"; final = f"{OUT}/niv-{nom}.mp4"
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
    mi.resize((360, 640)).save(f"{OUT}/apercu-{nom}.jpg", quality=80)
    print(f"Vidéo {num} — {theme} : {sum(s[3] for s in segs):.1f} s, {os.path.getsize(final)//1024} Ko → {final}")

for n in (int(a) for a in (sys.argv[1:] or ["10", "11"])): rendre(n)
