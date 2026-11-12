#!/usr/bin/env python3
"""Les « Éléments » du générateur Ornament d'Atomm pour la maquette « Créez votre décoration à suspendre » (12/11/2026).

Le gérant : « je voulais que tu fasses exactement le truc qu'il y a sur le logiciel de création » → les 257 dessins d'Atomm
(Noël, bougies, sapins, cadeaux, cloches, flocons, rennes, papillons, Pâques, feuillages, lapins, croix, fleurs, formes,
chaussettes, bonnets), téléchargés depuis leur panneau « Element » (scratchpad orn/elem/ana.cjs → cats.json, elements.json, png/).

  python3 -I tools/maquettes/decoration-elements.py <elements.json> <dossier png> <sortie.json>

Pour chaque dessin : l'image (WebP 320 px, noir sur transparent) et sa silhouette pleine (contour extérieur rempli,
pour la pièce découpée autour d'un dessin gravé), et le rapport hauteur / largeur.
"""
import base64, io, json, sys
import cv2, numpy as np
from PIL import Image

src, dossier, sortie = sys.argv[1:4]
FR = {"Christmas": "Noël", "Candle": "Bougies", "Christmas Tree": "Sapins", "Gifts": "Cadeaux", "Bell": "Cloches",
      "Snowflakes": "Flocons", "Reindeer": "Rennes", "Butterfly": "Papillons", "Egg": "Œufs de Pâques", "Leaf": "Feuillages",
      "Others": "Autres", "Rabbit": "Lapins", "Cross": "Croix", "Flower": "Fleurs", "Base": "Formes", "Socks": "Chaussettes",
      "Christmas Hats": "Bonnets"}
ORDRE = list(FR)
def b64(im, fmt, **kw):
    b = io.BytesIO(); im.save(b, fmt, **kw); return f"data:image/{fmt.lower()};base64," + base64.b64encode(b.getvalue()).decode()
out = []
for e in json.load(open(src)):
    im = Image.open(f"{dossier}/{e['id']}.png").convert("RGBA")
    a = np.array(im.split()[3])
    ys, xs = np.where(a > 40)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w, h = im.size
    k = 320 / max(w, h); im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    # le dessin en noir pur, la transparence gardée
    noir = Image.new("RGBA", im.size, (0, 0, 0, 0)); noir.putalpha(im.split()[3])
    # la silhouette pleine : le contour extérieur rempli
    m = (np.array(im.split()[3]) > 100).astype(np.uint8) * 255
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    plein = np.zeros_like(m); cv2.drawContours(plein, cs, -1, 255, -1)
    sil = Image.new("RGBA", im.size, (0, 0, 0, 0)); sil.putalpha(Image.fromarray(plein))
    sil = sil.resize((max(1, im.size[0] // 2), max(1, im.size[1] // 2)), Image.LANCZOS)
    out.append({"id": e["id"], "cats": [FR[c] for c in e["cats"] if c in FR], "r": round(im.size[1] / im.size[0], 4),
                "img": b64(noir, "WEBP", quality=80, method=6), "sil": b64(sil, "WEBP", quality=70, method=6)})
json.dump({"familles": [FR[c] for c in ORDRE], "elements": out}, open(sortie, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "dessins,", round(sum(len(x["img"]) + len(x["sil"]) for x in out) / 1e6, 2), "Mo")
