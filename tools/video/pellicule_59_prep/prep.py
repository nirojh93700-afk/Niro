import os, json
from PIL import Image
S = os.path.dirname(os.path.abspath(__file__))
R = "/home/user/Niro/public/produits/"
os.makedirs(S + "/photos", exist_ok=True)
# Verres à vin : la photo blanche du verre seule (bords crème de la galerie retirés)
for n in ("vin-1", "vin-texte"):
    im = Image.open(f"{S}/{n}.png").convert("RGB")
    w, h = im.size
    # colonne blanche = la photo du verre
    px = im.load(); y = h // 2
    xs = [x for x in range(w) if px[x, 5][0] > 250 and px[x, 5][1] > 250 and px[x, 5][2] > 250]
    x0, x1 = min(xs), max(xs)
    im.crop((x0, 0, x1 + 1, h)).save(f"{S}/photos/{n}.jpg", quality=92)
    print(n, x0, x1, w, h)
# Tumbler : badge « EXEMPLE » effacé (fond blanc)
for n in ("verre_tumbler_37_ex_maries.jpg", "verre_tumbler_39_ex_photo.jpg"):
    im = Image.open(R + n).convert("RGB"); w, h = im.size; px = im.load()
    zx, zy = int(w * 0.30), int(h * 0.12)
    sombres = [(x, y) for y in range(zy) for x in range(zx) if sum(px[x, y]) < 600]
    if sombres:
        x0 = min(p[0] for p in sombres); x1 = max(p[0] for p in sombres); y0 = min(p[1] for p in sombres); y1 = max(p[1] for p in sombres)
        m = 6
        for y in range(max(0, y0 - m), min(h, y1 + m)):
            for x in range(max(0, x0 - m), min(w, x1 + m)): px[x, y] = (255, 255, 255)
        print(n, "badge", x0, y0, x1, y1, w, h)
    im.save(f"{S}/photos/{n}", quality=92)
