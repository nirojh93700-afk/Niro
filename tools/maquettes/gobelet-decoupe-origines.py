"""Gobelet — découpe les dessins dans les images D'ORIGINE (sans numéros) données par le gérant le 05/11/2026.
Les images d'origine ont la même taille que les planches numérotées : on reprend les boîtes des dessins (celles de
marque-pages-decoupe-dessins.py, mesurées sur les planches redimensionnées à 760 px de large) mises à l'échelle,
on attribue chaque tache d'encre à la boîte qui en contient le plus, et on sort chaque dessin en pleine résolution.
Usage : python3 tools/maquettes/gobelet-decoupe-origines.py <sortie>"""
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

OUT = sys.argv[1]
SRC = {
    "docs/planches/origines/fleurs-papillons-1-10.png": {1:(0,0,400,450),2:(350,70,760,250),3:(130,215,580,475),4:(190,445,560,615),5:(610,240,760,920),6:(0,540,230,1000),
        7:(205,680,420,1260),8:(400,690,620,1150),9:(390,980,760,1349),10:(0,990,260,1349)},
    "docs/planches/origines/roses-11-27.png": {11:(0,0,180,290),12:(110,85,260,200),13:(210,0,640,80),14:(285,85,760,170),15:(400,190,650,270),16:(305,185,400,330),
        17:(185,180,305,340),18:(80,200,190,305),19:(500,280,660,360),20:(650,180,760,560),21:(655,480,760,587),22:(500,370,660,520),
        23:(405,375,500,587),24:(255,380,420,587),25:(140,355,260,587),26:(0,280,150,587),27:(380,255,500,395)},
    "docs/planches/origines/volutes-28-36.jpg": {28:(0,0,320,100),29:(0,110,330,215),30:(0,235,320,330),31:(0,340,330,440),32:(0,455,320,560),
        33:(0,565,330,660),34:(0,675,320,760),35:(340,0,590,760),36:(590,0,760,760)},
}
BOITES_ORIGINE = {18: (130, 340, 292, 600)}
faits = []
for src, boxes in SRC.items():
    im = Image.open(src).convert("RGB"); A = np.asarray(im).astype(float); H, W, _ = A.shape
    k = W / 760.0
    seeds = {n: tuple(int(round(v * k)) for v in b) for n, b in boxes.items()}
    # Boîtes corrigées en pixels de l'image d'origine (05/11 : la rose 18 a sa tige et ses deux feuilles jusqu'au-dessus du 25).
    seeds.update({n: b for n, b in BOITES_ORIGINE.items() if n in seeds})
    gray = A.mean(axis=2)
    ink = gray < 170
    lab, nb = ndi.label(ndi.binary_dilation(ink, iterations=2))
    # Chaque pixel d'encre va au dessin dont la boîte le contient (la plus petite si plusieurs). Une tache qui
    # appartient surtout à UNE boîte lui va entière (ses débords compris) ; une tache partagée entre deux dessins
    # qui se touchent sur l'image d'origine (18 / 25, 27 / 23) est coupée pixel par pixel selon les boîtes.
    yy, xx = np.mgrid[0:H, 0:W]
    parpix = np.zeros((H, W), int); aire = np.full((H, W), np.inf)
    for n, (x0, y0, x1, y1) in seeds.items():
        a_ = (x1 - x0) * (y1 - y0); dedans = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1) & (a_ < aire)
        parpix[dedans] = n; aire[dedans] = a_
    proprio = np.zeros((H, W), int)
    for i, sl in enumerate(ndi.find_objects(lab)):
        if sl is None: continue
        m = (lab[sl] == i + 1) & ink[sl]
        if m.sum() < 6: continue
        votes = parpix[sl][m]; votes = votes[votes > 0]
        if not len(votes): continue
        nums, cts = np.unique(votes, return_counts=True)
        ordre = np.argsort(-cts)
        if cts[ordre[0]] >= 0.8 * m.sum():
            proprio[sl][m] = nums[ordre[0]]
        else:
            proprio[sl][m] = parpix[sl][m]
    for n in seeds:
        mask = (proprio == n) & ink
        if mask.sum() < 30: print("VIDE", n); continue
        # Petits bouts isolés (morceau d'un dessin voisin coupé par la boîte) : retirés s'ils sont loin du dessin.
        lm, nm = ndi.label(ndi.binary_dilation(mask, iterations=2))
        if nm > 1:
            tailles = ndi.sum(mask, lm, range(1, nm + 1))
            gros = np.argmax(tailles) + 1
            proche = ndi.binary_dilation(lm == gros, iterations=14)
            for j in range(1, nm + 1):
                if j != gros and tailles[j - 1] < 0.02 * mask.sum() and not (proche & (lm == j)).any():
                    mask &= lm != j
        ys, xs = np.nonzero(mask); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        own = ndi.binary_dilation(mask, iterations=3)
        alpha = np.clip((240 - gray) / (240 - 40), 0, 1) * own
        sub = alpha[y0:y1, x0:x1]
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8); rgba[..., 3] = (sub * 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(f"{OUT}/{n:02d}.webp", "WEBP", quality=90, method=6)
        faits.append(n)
print("découpés :", sorted(faits))
