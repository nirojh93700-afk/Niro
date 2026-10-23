# -*- coding: utf-8 -*-
# VIDEO 24, 2e version (16/10/2026) — « Puzzle photo gravé » avec les PRIX ACTUELS.
# Demande du gerant : « refais la video que t'as fait en dernier, il y a eu des changements de prix sur le puzzle ».
# Depuis le 14/10 : 24 / 48 / 80 / 100 pieces (plus de 120) a 29,90 / 32,90 / 34,90 / 37,90 € (relus en ligne
# le 16/10), photo « bureau » retiree de la fiche. Version 1 : pub_puzzle_photo_24.py (13/10).
# Demande du gerant : « fais-moi une video sur le puzzle avec la photo » (pas les puzzles enfants a prenom).
# 4 photos de la fiche puzzle-photo-grave (planche contact regardee le 13/10 : toutes montrent la gravure),
# chacune en plan large puis en gros plan sur les visages graves.
import os, sys, subprocess
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, "pub_cristaux_graves_22.py"), encoding="utf-8").read().split("D_BLOC, D_ZOD")[0]
exec(compile(_src.replace("\nrendre22()", ""), "pub_cristaux_graves_22", "exec"), globals())

PHOTOS = [
    ("puzzle-photo-enfants.jpg", "Puzzle photo gravé", "Votre photo, gravée sur bois", "24 pièces · 29,90 €"),
    ("puzzle-photo-famille.jpg", "Puzzle photo gravé", "Trois générations, un seul puzzle", "48 pièces · 32,90 €"),
    ("puzzle-photo-amis.jpg", "Puzzle photo gravé", "Le groupe d’amis, gravé pièce par pièce", "80 pièces · 34,90 €"),
]
PLAN_DUR = 2.6   # plan large
GROS_DUR = 2.6   # gros plan

def charger_p(f):
    return Image.open(os.path.join(SRC, f)).convert("RGB")

def gros_plan(img, frac=0.62):
    """Recadre le centre de la photo (les visages) et le pose entier sur fond flou."""
    w, h = img.size
    cw, ch = int(w * frac), int(h * frac)
    x, y = (w - cw) // 2, int((h - ch) * 0.45)
    return img.crop((x, y, x + cw, y + ch))

from PIL import ImageDraw
def overlay_prix(name, sub, prix):
    im = overlay(name, sub)
    d = ImageDraw.Draw(im)
    fp = F(SANSB, 40); wp = d.textlength(prix, font=fp)
    d.rounded_rectangle([60, H - 438, 60 + wp + 48, H - 378], radius=30, fill=GOLD + (255,))
    d.text((84, H - 431), prix, font=fp, fill=(26, 18, 6))
    return im

def rendre24():
    segs = [("card", card("NiV CRÉATION", "Votre photo, gravée en puzzle de bois"), None, INTRO_DUR + 0.3)]
    for i, (f, name, sub, prix) in enumerate(PHOTOS):
        img = charger_p(f)
        segs.append(("prod", fond_flou(img).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay_prix(name, sub, "dès 29,90 €"), PLAN_DUR))
        segs.append(("zoom", fond_flou(gros_plan(img)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay_prix(name, "24 à 100 pièces, gravées dans notre atelier", prix), GROS_DUR))
    # Plan supplémentaire pour le 4e choix (100 pièces), sur la photo des enfants en gros plan.
    img = charger_p(PHOTOS[0][0])
    segs.append(("zoom", fond_flou(gros_plan(img, 0.5)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay_prix("Puzzle photo gravé", "Jusqu’à 100 pièces", "100 pièces · 37,90 €"), GROS_DUR))
    segs.append(("card", card("nivcreation.fr", "Puzzle photo gravé dès 29,90 €", "24 à 100 pièces · Gravé en France"), None, OUTRO_DUR))
    brut = f"{OUT}/24-puzzle-photo-v2-1080x1920.mp4"; final = f"{OUT}/24-puzzle-photo-v2-720x1280.mp4"
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM)
    for kind, img, ov, dur in segs:
        nf = max(1, int(round(dur * FPS)))
        for fi in range(nf):
            prog = fi / max(1, nf - 1)
            if kind == "card": frame = img.convert("RGBA")
            else:
                z = (1.12 - 0.12 * prog) if kind == "prod" else (1.0 + 0.10 * prog)  # large : dézoom ; gros plan : zoom lent
                cw, ch = int(W * z), int(H * z); x = (img.size[0] - cw) // 2; y = (img.size[1] - ch) // 2
                frame = Image.alpha_composite(img.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS).convert("RGBA"), ov)
            frame = frame.convert("RGB")
            FA = int(0.16 * FPS); a = 1.0
            if fi < FA: a = fi / FA
            elif fi > nf - FA: a = max(0, (nf - fi) / FA)
            if a < 1.0: frame = Image.blend(cream, frame, a)
            wri.append_data(np.asarray(frame))
    wri.close()
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"Vidéo 24 v2 : {sum(s[3] for s in segs):.1f} s, 1080p {os.path.getsize(brut)//1024} Ko, 720p {os.path.getsize(final)//1024} Ko → {final}")

rendre24()
