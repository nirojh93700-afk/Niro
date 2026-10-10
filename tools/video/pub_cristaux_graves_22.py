# -*- coding: utf-8 -*-
# VIDEO 22 (10/10/2026) — « Cristaux deja graves + zodiaque + puzzles en bois » (silencieuse, verticale 1080x1920).
# 2e version (10/10, « avec les [cristaux] et puzzle en bois ») : les 9 puzzles a prenom + les 4 photos du puzzle photo grave
# (planche contact regardee : toutes montrent la gravure) ; segments raccourcis pour tenir ~70 s.
# Demande du gerant : « fais-moi une video » → theme choisi : cristaux deja graves + zodiaque.
# Reutilise les fonctions de pub_cristaux_silencieuse.py (fond flou, overlay, cartes, rendu).
# REGLES : uniquement des pieces ou la GRAVURE est visible (planche contact regardee le 10/10) ;
# « Fillette au ballon » ECARTEE (reference Banksy, droits d'auteur, question posee au gerant) ;
# les 12 signes sont des rendus de gravure (figure + constellation + nom + date + ville) sur fond noir,
# recadres sur leur contenu ; Gemeaux et Bouddha = les 2 photos de blocs recadrees du titre de la page.
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, "pub_cristaux_silencieuse.py"), encoding="utf-8").read().split("def rendre")[0]
exec(compile(_src, "pub_cristaux_silencieuse", "exec"), globals())
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "docs", "videos")
os.makedirs(OUT, exist_ok=True)
CG = os.path.join(SRC, "cristaux-graves")
ZOD = os.path.join(HERE, "..", "..", "docs", "maquettes", "assets", "cristaux-graves", "zodiaque")

BLOCS = [
    ("hero-gemeaux.webp", "Cristal 3D · Gémeaux", "Votre signe, votre prénom, votre date"),
    ("ange.jpg", "Cristal 3D · Ange gardien", "Des ailes gravées dans le cristal"),
    ("ourson.jpg", "Cristal 3D · Ourson à la rose", "Le cadeau qui dit « je t’aime »"),
    ("cheval.jpg", "Cristal 3D · Cheval de feu", "Une crinière en flammes, gravée en 3D"),
    ("chat-sapin.jpg", "Cristal 3D · Chaton et sapin", "Un souvenir de Noël dans le cristal"),
    ("hero-bouddha.webp", "Cristal 3D · Bouddha au lotus", "Le calme, gravé pour durer"),
    ("coeur.jpg", "Cristal 3D · Cœur dans le cœur", "Deux cœurs, un seul bloc"),
    ("colibri.jpg", "Cristal 3D · Colibri et sa fleur", "Plume par plume, en plein vol"),
    ("panda.jpg", "Cristal 3D · Panda et bambou", "Un cadeau tendre pour toute la famille"),
    ("perroquets.jpg", "Cristal 3D · Envol de perroquets", "Trois oiseaux figés dans la lumière"),
    ("genie.jpg", "Cristal 3D · Génie de la lampe", "Une légende, gravée dans le cristal"),
    ("lys-dragon.jpg", "Cristal 3D · Dragon et lys", "Un petit dragon au pied d’un lys"),
    ("rose.jpg", "Cristal 3D · Rose éternelle", "Une rose qui ne fanera jamais"),
    ("tour-eiffel.jpg", "Cristal 3D · Tour Eiffel", "Paris, dans tous ses détails"),
]
PUZZLES = [
    ("puzzle-savane.jpg", "Puzzle en bois · Savane", "Gravé au prénom de votre enfant"),
    ("puzzle-foret.jpg", "Puzzle en bois · Forêt", "Les animaux de la forêt, gravés et découpés"),
    ("puzzle-dinosaures.jpg", "Puzzle en bois · Dinosaures", "Un puzzle qui porte son prénom"),
    ("puzzle-vehicules-secours.jpg", "Puzzle bois · Véhicules de secours", "Pompiers, police, ambulance"),
    ("puzzle-australie.jpg", "Puzzle en bois · Australie", "Koala, kangourou, cacatoès"),
    ("puzzle-animaux-amerique.jpg", "Puzzle en bois · Grand Nord", "Bison, ours, aigle, castor"),
    ("puzzle-camping.jpg", "Puzzle en bois · Camping", "Pour les petits aventuriers"),
    ("puzzle-jardin-enchante.jpg", "Puzzle en bois · Jardin enchanté", "Fée, papillon, coccinelle"),
    ("puzzle-fruits-legumes.jpg", "Puzzle en bois · Fruits & légumes", "Gravé, découpé, personnalisé"),
    ("puzzle-photo-bureau.jpg", "Puzzle photo gravé", "Votre photo de famille, gravée en puzzle"),
    ("puzzle-photo-famille.jpg", "Puzzle photo gravé", "Trois générations, un seul puzzle"),
    ("puzzle-photo-enfants.jpg", "Puzzle photo gravé", "Les enfants, à reconstituer ensemble"),
    ("puzzle-photo-amis.jpg", "Puzzle photo gravé", "Le groupe d’amis, gravé sur bois"),
]
SIGNES = ["belier", "taureau", "gemeaux", "cancer", "lion", "vierge", "balance", "scorpion",
          "sagittaire", "capricorne", "verseau", "poissons"]
NOMS = {"belier": "Bélier", "taureau": "Taureau", "gemeaux": "Gémeaux", "cancer": "Cancer", "lion": "Lion",
        "vierge": "Vierge", "balance": "Balance", "scorpion": "Scorpion", "sagittaire": "Sagittaire",
        "capricorne": "Capricorne", "verseau": "Verseau", "poissons": "Poissons"}

def zodiaque(k):
    """Rendu de gravure sur fond noir, recadre sur son contenu (+ marge) pour remplir le cadre."""
    im = Image.open(os.path.join(ZOD, k + ".png")).convert("RGBA")
    bg = Image.new("RGBA", im.size, (0, 0, 0, 255)); bg.alpha_composite(im); im = bg.convert("RGB")
    g = im.convert("L").point(lambda v: 255 if v > 28 else 0)
    box = g.getbbox() or (0, 0) + im.size
    px, py = int((box[2] - box[0]) * 0.12), int((box[3] - box[1]) * 0.08)
    box = (max(0, box[0] - px), max(0, box[1] - py), min(im.width, box[2] + px), min(im.height, box[3] + py))
    return im.crop(box)

def charger(f):
    return Image.open(os.path.join(CG, f)).convert("RGB")

D_BLOC, D_ZOD, D_PUZ = 1.8, 1.2, 1.8

def charger_p(f):
    return Image.open(os.path.join(SRC, f)).convert("RGB")

def rendre22():
    segs = [("card", card("NiV CRÉATION", "Des cristaux déjà gravés, prêts à offrir"), None, INTRO_DUR)]
    for f, name, sub in BLOCS:
        segs.append(("prod", fond_flou(charger(f)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay(name, sub), D_BLOC))
    segs.append(("card", card("Votre signe du zodiaque", "Sa constellation, son prénom, sa date, sa ville", "Un cristal unique par signe"), None, 2.0))
    for k in SIGNES:
        segs.append(("prod", fond_flou(zodiaque(k)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS),
                     overlay("Zodiaque · " + NOMS[k], "Votre constellation, gravée dans le cristal"), D_ZOD))
    segs.append(("card", card("Les puzzles en bois", "Gravés et découpés dans notre atelier", "Au prénom de l’enfant, ou avec votre photo"), None, 2.0))
    for f, name, sub in PUZZLES:
        segs.append(("prod", fond_flou(charger_p(f)).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay(name, sub), D_PUZ))
    segs.append(("card", card("nivcreation.fr", "Choisissez le vôtre", "Gravé en France"), None, OUTRO_DUR))
    nom = "cristaux-zodiaque-puzzles"
    brut = f"{OUT}/22-{nom}-1080x1920.mp4"; final = f"{OUT}/22-{nom}-720x1280.mp4"
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
            wri.append_data(np.asarray(frame))
    wri.close()
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"Vidéo 22 (cristaux + zodiaque + puzzles) : {sum(s[3] for s in segs):.1f} s, 1080p {os.path.getsize(brut)//1024} Ko, 720p {os.path.getsize(final)//1024} Ko → {final}")

rendre22()
