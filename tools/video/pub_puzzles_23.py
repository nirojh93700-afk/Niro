# -*- coding: utf-8 -*-
# VIDEO 23 (10/10/2026) — « Puzzles en bois » seulement (silencieuse, verticale 1080x1920).
# Demande du gerant : « fais-moi une video que sur les bois puzzle ». 9 puzzles a prenom + 4 photos du puzzle photo grave
# (listes PUZZLES de pub_cristaux_graves_22.py ; planche contact regardee le 10/10 : toutes montrent la gravure).
import os, sys, subprocess
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, "pub_cristaux_graves_22.py"), encoding="utf-8").read().split("D_BLOC, D_ZOD")[0]
exec(compile(_src.replace("\nrendre22()", ""), "pub_cristaux_graves_22", "exec"), globals())

def charger_p(f):
    return Image.open(os.path.join(SRC, f)).convert("RGB")

def rendre23():
    segs = [("card", card("NiV CRÉATION", "Des puzzles en bois, gravés et découpés dans notre atelier"), None, INTRO_DUR + 0.3)]
    for f, name, sub in PUZZLES:
        segs.append(("prod", fond_flou(charger_p(f)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card("nivcreation.fr", "Au prénom de l’enfant, ou avec votre photo", "Gravé en France"), None, OUTRO_DUR))
    brut = f"{OUT}/23-puzzles-bois-1080x1920.mp4"; final = f"{OUT}/23-puzzles-bois-720x1280.mp4"
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM)
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
            wri.append_data(np.asarray(frame))
    wri.close()
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"Vidéo 23 : {sum(s[3] for s in segs):.1f} s, 1080p {os.path.getsize(brut)//1024} Ko, 720p {os.path.getsize(final)//1024} Ko → {final}")

rendre23()
