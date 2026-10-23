# -*- coding: utf-8 -*-
# VIDÉOS 25 ET 26 (17/10/2026) — demande du gérant : « fais-moi deux vidéos avec mes produits, plus avec les verres ».
# Verticales 1080x1920, sans son (même habillage que la vidéo 19).
#  25 = Verres & carafes gravés (uniquement les verres : carafe, whisky, vin, flûte, cocktail).
#  26 = Nos créations gravées : les verres en majorité, entre des bijoux, des cristaux et des puzzles.
# RÈGLE : uniquement des photos où la gravure est VISIBLE (planche contact regardée le 17/10/2026). Écartées : toutes les
# photos de verres vierges (carafe_vierge/ambiance/bar/produit, flute_*, verre_vin_grave/set/vierge/47_*, whisky
# grave_ambiance/grave_vide/fond/fond_clair, cocktail vierge/garni/ambiance/fond_vierge) et flute-grav-04 (gravure illisible).
# Usage : python3 tools/video/pub_verres_25_26.py <dossier de sortie>
import os, sys, subprocess
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, "pub_bijoux_cristal_19.py"), encoding="utf-8").read()
_src = _src.split("\ndef rendre():")[0]
exec(compile(_src, "pub_bijoux_cristal_19", "exec"), globals())
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "docs", "videos")
os.makedirs(OUT, exist_ok=True)

VERRES = [
    ("carafe_gravee.jpg", "Carafe à whisky gravée", "Un modèle décoré, gravé sur le verre"),
    ("verre_a_whisky_exemple_face.jpg", "Verre à whisky photo", "Votre photo et un texte, gravés"),
    ("flute-grav-03.webp", "Flûtes à champagne gravées", "Vos prénoms et la date du grand jour"),
    ("verre_vin_exemple_dale.jpg", "Verre à vin gravé", "Une initiale, un nom, une date"),
    ("verre_a_cocktail_exemple_logo.jpg", "Verre à cocktail gravé", "Le logo de votre établissement"),
    ("verre_whisky_papa_monde_banniere.jpg", "Verre à whisky · Fête des pères", "« Meilleur papa du monde »"),
    ("flute-grav-06.webp", "Flûtes à champagne gravées", "Deux prénoms pour trinquer"),
    ("carafe_whiskey_1892.jpg", "Carafe à whisky gravée", "Votre nom sur une étiquette d’époque"),
    ("verre_a_cocktail_exemple_nom.jpg", "Verre à cocktail gravé", "Le nom de votre bar"),
    ("verre_a_whisky_exemple_fond.jpg", "Verre à whisky · gravé au fond", "La photo apparaît à travers le verre"),
    ("verre_vin_geniet.jpg", "Verres à vin gravés", "Un mot à vous, sur chaque verre"),
    ("flute-grav-01.jpg", "Flûtes à champagne gravées", "Le toast des mariés"),
    ("verre_a_whisky_logo_bourbon.webp", "Verre à whisky gravé", "Un logo, une date, un nom"),
    ("verre_a_cocktail_fond_exemple.jpg", "Verre à cocktail · gravé au fond", "Votre logo, au fond du verre"),
    ("verre_whisky_papa_monde_moustache.jpg", "Verre à whisky · Fête des pères", "Le cadeau qui fait sourire papa"),
    ("flute-grav-05.webp", "Flûte à champagne gravée", "Des prénoms et une date"),
    ("verre_a_cocktail_exemple_couleur.jpg", "Verre à cocktail gravé", "Gravé pour vos plus beaux cocktails"),
    ("verre_a_whisky_card.jpg", "Verre à whisky gravé", "« L’authentique papa poule »"),
    ("flute-grav-02.webp", "Flûte à champagne gravée", "Un dessin tout en finesse"),
]

MIX = [
    ("carafe_whiskey_1892.jpg", "Carafe à whisky gravée", "Votre nom sur une étiquette d’époque"),
    ("collier-coeur-grave-1.jpg", "Collier Cœur à graver", "Recto-verso, initiales et date"),
    ("verre_a_whisky_exemple_face.jpg", "Verre à whisky photo", "Votre photo et un texte, gravés"),
    ("flute-grav-06.webp", "Flûtes à champagne gravées", "Deux prénoms pour trinquer"),
    ("cristal-v-femme.jpg", "Cristal Photo 3D · Vertical", "Un portrait, gravé pour toujours"),
    ("verre_vin_exemple_dale.jpg", "Verre à vin gravé", "Une initiale, un nom, une date"),
    ("verre_a_cocktail_exemple_nom.jpg", "Verre à cocktail gravé", "Le nom de votre bar"),
    ("puzzle-savane.jpg", "Puzzle en bois · Savane", "Gravé au prénom de votre enfant"),
    ("verre_whisky_papa_monde_moustache.jpg", "Verre à whisky · Fête des pères", "Le cadeau qui fait sourire papa"),
    ("flute-grav-03.webp", "Flûtes à champagne gravées", "Vos prénoms et la date du grand jour"),
    ("collier-3coeurs-3.jpg", "Collier 3 Cœurs entrelacés", "Un prénom gravé au cœur"),
    ("carafe_gravee.jpg", "Carafe à whisky gravée", "Un modèle décoré, gravé sur le verre"),
    ("verre_a_cocktail_exemple_logo.jpg", "Verre à cocktail gravé", "Le logo de votre établissement"),
    ("cristaux-graves/ange.jpg", "Cristal 3D · Ange gardien", "Des ailes gravées dans le cristal"),
    ("verre_a_whisky_exemple_fond.jpg", "Verre à whisky · gravé au fond", "La photo apparaît à travers le verre"),
    ("bracelet-cordon-plaque-4.jpg", "Bracelet cordon à plaque", "Vos initiales sur la plaque"),
    ("verre_vin_geniet.jpg", "Verres à vin gravés", "Un mot à vous, sur chaque verre"),
    ("cristal-h-famille.jpg", "Cristal Photo 3D · Horizontal", "« Toujours ensemble »"),
    ("puzzle-photo-famille.jpg", "Puzzle photo gravé", "Trois générations, un seul puzzle"),
]

VIDEOS = {
    25: dict(nom="verres-carafes", liste=VERRES, ruban="✦  VERRES & CARAFES GRAVÉS  ✦",
             intro=("Gravé pour trinquer", "Carafes, verres à whisky, à vin, flûtes et verres à cocktail"),
             outro=("Levez votre verre", "Un prénom, une photo, un logo : gravé à la commande")),
    26: dict(nom="creations-gravees", liste=MIX, ruban="✦  NOS CRÉATIONS GRAVÉES  ✦",
             intro=("Gravé pour eux", "Verres, carafes, bijoux, cristal et bois, gravés dans notre atelier"),
             outro=("Un cadeau qui leur ressemble", "Chaque pièce est personnalisée, gravée à la commande")),
}

def rendre(num):
    global RUBAN
    v = VIDEOS[num]; RUBAN = v["ruban"]
    segs = [("card", card(v["intro"][0], v["intro"][1], "NiV CRÉATION", haut=RUBAN, ink_bg=True), None, INTRO_DUR + 0.4)]
    for f, name, sub in v["liste"]:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        segs.append(("prod", fond_flou(im).resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card(v["outro"][0], v["outro"][1], "nivcreation.fr  ·  Gravé en France", haut=RUBAN, ink_bg=True), None, OUTRO_DUR))
    brut = f"{OUT}/{num}-{v['nom']}-1080x1920.mp4"; final = f"{OUT}/{num}-{v['nom']}-720x1280.mp4"
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM); apercus = []
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
            if fi == nf // 2: apercus.append(frame.resize((180, 320)))
            wri.append_data(np.asarray(frame))
    wri.close()
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    cols = 7; rows = (len(apercus) + cols - 1) // cols
    planche = Image.new("RGB", (cols * 180, rows * 320), "white")
    for i, a in enumerate(apercus): planche.paste(a, ((i % cols) * 180, (i // cols) * 320))
    planche.save(f"{OUT}/planche-{num}.jpg", quality=80)
    print(f"Vidéo {num} : {sum(s[3] for s in segs):.1f} s, 1080p {os.path.getsize(brut)//1024} Ko, 720p {os.path.getsize(final)//1024} Ko → {final}")

for n in (sys.argv[2:] or ["25", "26"]):
    rendre(int(n))
