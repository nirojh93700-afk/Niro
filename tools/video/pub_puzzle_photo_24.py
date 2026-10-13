# -*- coding: utf-8 -*-
# VIDEO 24 (13/10/2026) — « Puzzle photo gravé » seulement (silencieuse, verticale 1080x1920).
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
    ("puzzle-photo-bureau.jpg", "Puzzle photo gravé", "Votre photo, gravée sur bois"),
    ("puzzle-photo-famille.jpg", "Puzzle photo gravé", "Trois générations, un seul puzzle"),
    ("puzzle-photo-enfants.jpg", "Puzzle photo gravé", "Les enfants, à reconstituer ensemble"),
    ("puzzle-photo-amis.jpg", "Puzzle photo gravé", "Le groupe d’amis, gravé pièce par pièce"),
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

def rendre24():
    segs = [("card", card("NiV CRÉATION", "Votre photo, gravée en puzzle de bois"), None, INTRO_DUR + 0.3)]
    for f, name, sub in PHOTOS:
        img = charger_p(f)
        segs.append(("prod", fond_flou(img).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay(name, sub), PLAN_DUR))
        segs.append(("zoom", fond_flou(gros_plan(img)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay(name, "24 à 120 pièces, gravées dans notre atelier"), GROS_DUR))
    segs.append(("card", card("nivcreation.fr", "Envoyez votre photo, nous la gravons", "Gravé en France"), None, OUTRO_DUR))
    brut = f"{OUT}/24-puzzle-photo-1080x1920.mp4"; final = f"{OUT}/24-puzzle-photo-720x1280.mp4"
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
    print(f"Vidéo 24 : {sum(s[3] for s in segs):.1f} s, 1080p {os.path.getsize(brut)//1024} Ko, 720p {os.path.getsize(final)//1024} Ko → {final}")

rendre24()
