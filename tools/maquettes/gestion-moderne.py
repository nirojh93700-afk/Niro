#!/usr/bin/env python3
"""Maquette « Gestion moderne » (29/10/2026) : nouveau rangement de Gestion, 9 sections, 37 écrans conservés.
Usage : python3 tools/maquettes/gestion-moderne.py [sortie.html]
Le gabarit gestion-moderne.tpl.html reçoit le logo d'origine (octets intacts) et des vignettes produits."""
import base64, io, json, sys, pathlib
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[2]
P = R / "public"
IMGS = {
  "whisky": "produits/verre_a_whisky_exemple_face.jpg", "coeurs3": "produits/collier-3coeurs-1.jpg",
  "cristal": "produits/cristal-v-couple.jpg", "carafe": "produits/carafe_gravee.jpg", "savane": "produits/puzzle-savane.jpg",
  "cordon": "produits/bracelet-cordon-plaque-4.jpg", "vin": "produits/verre_vin_exemple_dale.jpg",
  "couverts": "produits/couverts_enfants_ex_prenom.jpg", "coeurgrave": "produits/collier-coeur-grave-1.jpg",
  "flute": "produits/flute-grav-01.jpg",
  "m_sac": "materiel/emb-sac.webp", "m_sacor": "materiel/sac-blanc-or.webp", "m_carree": "materiel/emb-boite-carree.webp",
  "m_carton": "materiel/carton-25x20x15.webp", "m_chips": "materiel/chips-calage.webp", "m_frag": "materiel/etiquettes-fragile.webp",
}
def thumb(p, size):
    im = Image.open(p).convert("RGB"); im.thumbnail((size, size)); b = io.BytesIO(); im.save(b, "WEBP", quality=72)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()
imgs = {k: thumb(P / v, 320 if k.startswith("m_") else 200) for k, v in IMGS.items()}
logo = "data:image/jpeg;base64," + base64.b64encode((P / "logo-niv-creation.jpg").read_bytes()).decode()
tpl = (R / "tools/maquettes/gestion-moderne.tpl.html").read_text(encoding="utf-8")
out = tpl.replace("{{LOGO}}", logo).replace("{{IMGS}}", json.dumps(imgs))
dst = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else R / "docs/maquettes/gestion-moderne.html"
dst.write_text(out, encoding="utf-8"); print(dst, len(out) // 1024, "Ko")
