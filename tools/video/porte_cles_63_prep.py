# Vidéo 63 (16/11/2026) — porte-clés cristal LED : pose une photo GRAVÉE (rendu cristal) dans les porte-clés vides du site,
# en lumière du jour et allumés (LED). Usage : python3 tools/video/porte_cles_63_prep.py <sortie> (depuis la racine du dépôt).
import os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageDraw

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
P = lambda n: os.path.join("public/produits", n)
PORT = lambda n: os.path.join("docs/maquettes/assets/marque-pages/exemples/portraits", n)
# Zone intérieure du cristal (pixels de la photo d'origine) et forme.
SUPPORTS = {
  "coeur": (P("cristal-pcles-coeur-creme.jpg"), (410, 600, 780, 1015), "coeur"),
  "rect":  (P("cristal-pcles-rect-creme.jpg"), (440, 525, 676, 880), "rect"),
}
# Portraits : (fichier, boîte de recadrage relative x0,y0,x1,y1 ou None).
PORTRAITS = {
  "couple": (PORT("couple.jpg"), None),
  "enfant-chien": (PORT("enfant-chien.jpg"), (0.0, 0.0, 1.0, 0.82)),
  "maman": (PORT("femme-visage.jpg"), None),
  "enfant-chat": (P("cristal-v-enfant-chat.jpg"), (0.405, 0.30, 0.585, 0.83)),
  "famille": (P("cristal-h-famille.jpg"), (0.50, 0.25, 0.88, 0.665)),
}
LED = {"rose": (255, 70, 200), "bleu": (70, 150, 255), "vert": (60, 230, 140), "violet": (170, 90, 255), "blanc": (235, 245, 255)}

def masque(w, h, forme):
    m = Image.new("L", (w, h), 0); d = ImageDraw.Draw(m)
    if forme == "rect": d.rounded_rectangle((w * .04, h * .03, w * .96, h * .97), radius=int(w * .06), fill=255)
    else:
        # cœur arrondi (le porte-clés est un cœur aux lobes très ronds) : deux cercles + triangle
        r = w * .27
        d.ellipse((w * .02, h * .02, w * .02 + 2 * r, h * .02 + 2 * r), fill=255)
        d.ellipse((w * .98 - 2 * r, h * .02, w * .98, h * .02 + 2 * r), fill=255)
        d.polygon([(w * .01, h * .30), (w * .99, h * .30), (w * .5, h * .99)], fill=255)
        d.rectangle((w * .1, h * .15, w * .9, h * .45), fill=255)
    return m.filter(ImageFilter.GaussianBlur(w * .05))

def gravure(portrait, box, w, h):
    im = Image.open(portrait).convert("L")
    if box: im = im.crop((int(box[0] * im.width), int(box[1] * im.height), int(box[2] * im.width), int(box[3] * im.height)))
    im = ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(0.5, 0.35))
    im = ImageOps.autocontrast(im, cutoff=2)
    a = np.asarray(im).astype(np.float32) / 255.0
    a = np.clip((a - 0.12) / 0.88, 0, 1) ** 1.15          # le noir du fond disparaît, la lumière = points gravés
    return a

def composer(support, portrait, led=None):
    src, (x0, y0, x1, y1), forme = SUPPORTS[support]
    base = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    w, h = x1 - x0, y1 - y0
    m = np.asarray(masque(w, h, forme)).astype(np.float32) / 255.0
    g = gravure(*PORTRAITS[portrait], w, h) * m
    zone = base[y0:y1, x0:x1]
    if led:
        c = np.array(LED[led], dtype=np.float32)
        base *= 0.22                                         # pièce sombre
        zone = base[y0:y1, x0:x1]
        lueur = (0.35 + 0.65 * g)[..., None]
        zone[:] = zone * (1 - m[..., None] * 0.9) + m[..., None] * (c * 0.55 * (1 - g[..., None]) + (c * 0.45 + 255 * 0.55) * g[..., None]) * lueur + 0
        # halo autour du cristal
        img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
        halo = Image.new("RGB", img.size, (0, 0, 0)); hd = ImageDraw.Draw(halo)
        hd.ellipse((x0 - w * .25, y0 - h * .1, x1 + w * .25, y1 + h * .35), fill=tuple(int(v * .5) for v in c))
        halo = halo.filter(ImageFilter.GaussianBlur(w * .35))
        img = Image.fromarray(np.clip(np.asarray(img).astype(np.float32) + np.asarray(halo).astype(np.float32) * 0.6, 0, 255).astype(np.uint8))
        return img
    blanc = np.array([250, 252, 255], dtype=np.float32)
    a = (np.clip(g * 1.1, 0, 1) * 0.88)[..., None]
    zone[:] = zone * (1 - a) + blanc * a
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))

if __name__ == "__main__":
    for sup, por, led in [("coeur", "couple", None), ("coeur", "couple", "rose"), ("rect", "enfant-chien", None), ("rect", "enfant-chien", "bleu"),
                          ("coeur", "maman", None), ("coeur", "maman", "violet"), ("rect", "maman", None), ("rect", "maman", "vert"),
                          ("rect", "enfant-chat", None), ("coeur", "famille", "rose"), ("coeur", "famille", None), ("rect", "couple", "blanc")]:
        composer(sup, por, led).save(os.path.join(OUT, f"{sup}-{por}-{led or 'jour'}.jpg"), quality=90)
    print("ok")
