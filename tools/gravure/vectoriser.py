#!/usr/bin/env python3
"""Dessin du site (JPG / PNG / WebP) → SVG VECTORIEL pour le laser (tracés noirs, aucun pixel).
Usage : python3 tools/gravure/vectoriser.py <image> <sortie.svg> [largeur_mm=60]
Méthode : fond transparent aplati en blanc, gris, image agrandie ×3 (courbes plus lisses), seuil automatique
(Otsu), puis potrace (apt install potrace) : courbes de Bézier, petites taches < 6 px retirées.
Le SVG porte sa taille réelle en mm (hauteur au prorata)."""
import sys, subprocess, tempfile, os, re
from PIL import Image, ImageOps

def otsu(img):
    h = img.histogram(); total = sum(h); s = sum(i * h[i] for i in range(256))
    sb = wb = 0; best = (0, 128)
    for t in range(256):
        wb += h[t]
        if not wb: continue
        wf = total - wb
        if not wf: break
        sb += t * h[t]; mb = sb / wb; mf = (s - sb) / wf
        v = wb * wf * (mb - mf) ** 2
        if v > best[0]: best = (v, t)
    return best[1]

def vectoriser(src, out, largeur_mm=60.0):
    im = Image.open(src)
    a = None
    if im.mode in ("RGBA", "LA", "P") or "transparency" in im.info:
        im = im.convert("RGBA"); a = im.getchannel("A")
    g = ImageOps.grayscale(im.convert("RGB"))
    if a is not None and a.getextrema()[0] < 250:
        # Fond transparent : l'encre = ce qui est opaque. Dessin CLAIR sur transparent (cristaux, blanc) → encre = alpha × clarté.
        lum = [v for v, al in zip(g.getdata(), a.getdata()) if al > 128]
        clair = lum and sum(lum) / len(lum) > 150
        from PIL import ImageChops
        encre = ImageChops.multiply(a, g) if clair else ImageChops.multiply(a, ImageOps.invert(g))
        g = ImageOps.invert(encre)
    elif g.resize((1, 1)).getpixel((0, 0)) < 110: g = ImageOps.invert(g)  # dessin clair sur fond sombre → trait noir
    g = g.resize((g.width * 3, g.height * 3), Image.LANCZOS)
    t = otsu(g)
    bw = g.point(lambda p: 0 if p <= t else 255, "1")
    with tempfile.TemporaryDirectory() as d:
        pbm = os.path.join(d, "a.pbm"); bw.save(pbm)
        h_mm = largeur_mm * bw.height / bw.width
        subprocess.run(["potrace", pbm, "-s", "-t", "6", "-a", "1", "-O", "0.4", "-W", f"{largeur_mm}mm", "-H", f"{h_mm:.2f}mm", "-o", out], check=True)
    svg = open(out).read()
    svg = re.sub(r"<metadata>.*?</metadata>\s*", "", svg, flags=re.S)
    open(out, "w").write(svg)
    return t

if __name__ == "__main__":
    print("seuil", vectoriser(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 60.0))
