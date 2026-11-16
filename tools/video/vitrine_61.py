# -*- coding: utf-8 -*-
# VIDÉO 61 (16/11/2026) — gérant : « tu mets en ligne et tu me fais une vidéo sur les produits… pas les prix sur les vidéos ».
# Les 14 nouveaux bijoux (bon Nihao du 15/11). Style NEUF « vitrine » : un bijou pour elle (fond rose poudré) puis un pour lui
# (fond pierre), en ALTERNANCE (gérant : « tu mélanges »), chaque bijou entre en grande carte arrondie qui glisse de côté, une étiquette kraft suspendue
# porte son nom et se balance, petit « Nouveau » doré ; fin en mosaïque + bouton.
# Photos du site (public/produits/nihao), regardées en planche : sans texte, sans mesures. ⛔ Aucun prix, aucun nombre.
# Usage : python3 tools/video/vitrine_61.py <polices> <sortie> [--apercu]   (depuis la racine du dépôt)
import os, sys, math, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg
FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe(); W, H, FPS = 1080, 1920, 30
ENCRE = (34, 26, 18); OR = (184, 142, 58); CREME = (250, 245, 236); KRAFT = (205, 170, 122)
def police(n, s, w=None):
    f = ImageFont.truetype(os.path.join(FD, n + ".ttf"), s)
    if w:
        try: f.set_variation_by_axes([w])
        except Exception: pass
    return f
PLAY = lambda s, w=600: police("PlayfairDisplay", s, w); INTER = lambda s, w=600: police("Inter", s, w)
def ease(x): x = max(0., min(1., x)); return 1 - (1 - x) ** 3
def rebond(x): x = max(0., min(1., x)); return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2
def lg(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]
def texte(im, y, t, f, c, a=255, x=None):
    d = ImageDraw.Draw(im, "RGBA"); b = d.textbbox((0, 0), t, font=f); w = b[2] - b[0]
    assert w <= W - 60, t
    d.text(((W - w) / 2 - b[0] if x is None else x - b[0], y), t, font=f, fill=c + (int(max(0, min(255, a))),))
N = "public/produits/nihao/"
ELLE = [("collier-papillon-bleu", "Collier Papillon"), ("collier-papillon-rose-turquoise", "Collier Papillon"),
        ("collier-papillons-scintillants-porte-2", "Papillons scintillants"), ("collier-envol-papillons-porte-2", "Envol de Papillons"),
        ("collier-papillon-ajoure-porte-2", "Papillon Ajouré"), ("collier-noeud-scintillant-porte-1", "Nœud scintillant"),
        ("bracelet-plaque-breloque-dore-coeur", "Bracelet prénom gravé"), ("bracelet-plaque-breloque-porte-dore-2", "Bracelet à breloque")]
LUI = [("bracelet-homme-trois-rangs-trois-couleurs", "Bracelet trois rangs"), ("bracelet-homme-plaque-longue-deux-couleurs", "Plaque longue"),
       ("bracelet-homme-deux-rangs-porte", "Bracelet deux rangs"), ("bracelet-homme-tresse-bicolore-camel", "Tressé bicolore"),
       ("bracelet-homme-maille-venitienne-dore-poing", "Maille vénitienne"), ("bracelet-homme-perles-tresse-bois-face", "Perles et tresse"),
       ("ensemble-homme-plaque-acier-photo-2", "Ensemble plaque acier"), ("ensemble-homme-plaque-noire-photo-1", "Ensemble plaque noire")]
CH = [((246, 226, 224), (164, 92, 96), "Pour elle", "Papillons, nœud et breloques", ELLE),
      ((226, 228, 224), (70, 78, 74), "Pour lui", "Cuir tressé, acier et plaques à graver", LUI)]
CW = 860
def carte(nom):
    img = Image.open(N + nom + ".jpg").convert("RGB"); k = CW / img.width
    img = img.resize((CW, int(img.height * k)), Image.LANCZOS)
    if img.height > 1060: img = img.crop((0, (img.height - 1060) // 2, CW, (img.height - 1060) // 2 + 1060))
    m = Image.new("L", img.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), 46, fill=255)
    c = Image.new("RGBA", (img.width + 24, img.height + 24), (255, 255, 255, 0))
    fr = Image.new("L", c.size, 0); ImageDraw.Draw(fr).rounded_rectangle((0, 0, c.width - 1, c.height - 1), 56, fill=255)
    c.paste((255, 255, 255, 255), (0, 0), fr); c.paste(img, (12, 12), m); return c
CARTES = {n: carte(n) for ch in CH for n, _ in ch[4]}
def coller(im, c, cx, cy, s=1., rot=0., a=1., ombre=True):
    if s <= .02 or a <= .01: return
    x = c if s == 1 else c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if a < 1: al = x.split()[3].point(lambda v: int(v * a)); x = x.copy(); x.putalpha(al)
    if ombre:
        P = 50; sh = Image.new("RGBA", (x.width + 2 * P, x.height + 2 * P), (0, 0, 0, 0))
        al = Image.new("L", sh.size, 0); al.paste(x.split()[3].point(lambda v: int(v * .25)), (P, P)); sh.putalpha(al)
        sh = sh.filter(ImageFilter.GaussianBlur(20)); im.paste(sh, (int(cx - x.width / 2) - P + 10, int(cy - x.height / 2) - P + 26), sh)
    im.paste(x, (int(cx - x.width / 2), int(cy - x.height / 2)), x)
def etiquette(nom, accent):
    f = PLAY(54); d = ImageDraw.Draw(Image.new("RGB", (1, 1))); w = lg(d, nom, f) + 120; h = 150
    e = Image.new("RGBA", (w, h + 70), (0, 0, 0, 0)); ed = ImageDraw.Draw(e)
    ed.line((w / 2, 0, w / 2, 70), fill=(120, 96, 62, 255), width=4)
    ed.polygon([(0, 110), (40, 70), (w - 40, 70), (w, 110), (w, h + 70 - 1), (0, h + 70 - 1)], fill=KRAFT + (255,))
    ed.ellipse((w / 2 - 12, 82, w / 2 + 12, 106), fill=CREME + (255,))
    b = ed.textbbox((0, 0), nom, font=f); ed.text(((w - (b[2] - b[0])) / 2 - b[0], 120 - b[1] + 22), nom, font=f, fill=ENCRE + (255,))
    return e
ETQ = {(n, i): etiquette(t, CH[i][1]) for i, ch in enumerate(CH) for n, t in ch[4]}
def pastille(im, x, y, a):
    if a <= .01: return
    f = INTER(30, 700); d = ImageDraw.Draw(im, "RGBA"); t = "NOUVEAU"; w = lg(d, t, f)
    d.rounded_rectangle((x, y, x + w + 56, y + 62), 31, fill=OR + (int(255 * a),)); b = d.textbbox((0, 0), t, font=f)
    d.text((x + 28 - b[0], y + 31 - (b[3] - b[1]) / 2 - b[1]), t, font=f, fill=(255, 255, 255, int(255 * a)))
def s_intro(im, t, d):
    im.paste(CREME + (255,), (0, 0, W, H))
    for i, (m, f, c) in enumerate([("Nouveaux", PLAY(150), ENCRE), ("bijoux", PLAY(150, 500), OR)]):
        u = (t - .2 * i) / .4
        if u > 0: texte(im, 640 + i * 190 + (1 - ease(u)) * 110, m, f, c, 255 * ease(u))
    dd = ImageDraw.Draw(im); e = ease((t - .6) / .4); dd.rectangle((W / 2 - 220 * e, 1060, W / 2 + 220 * e, 1066), fill=OR)
    texte(im, 1110, "Pour elle et pour lui", INTER(44, 500), ENCRE, 255 * ease((t - .7) / .4))
    texte(im, 1180, "Gravés dans notre atelier, en France", INTER(34, 400), (110, 92, 70), 255 * ease((t - .9) / .4))
PAS = 2.15
# 16/11 (gérant : « tu mélanges… les gens ils vont pas regarder jusqu'à la fin ») : un bijou pour elle, un pour lui, en alternance.
ITEMS = []
for k in range(max(len(ELLE), len(LUI))):
    if k < len(ELLE): ITEMS.append((0, ELLE[k]))
    if k < len(LUI): ITEMS.append((1, LUI[k]))
def melange(c1, c2, x): return tuple(int(a + (b - a) * x) for a, b in zip(c1, c2))
def s_defile(im, t, d):
    k = min(len(ITEMS) - 1, int(t / PAS)); v = t - k * PAS; i, (nom, _) = ITEMS[k]
    fond = CH[i][0]
    if k > 0 and v < .4: fond = melange(CH[ITEMS[k - 1][0]][0], fond, ease(v / .4))
    im.paste(fond + (255,), (0, 0, W, H)); accent = CH[i][1]
    texte(im, 120, CH[i][2], PLAY(64), accent, 255 * (ease(v / .3) if k == 0 or ITEMS[k - 1][0] != i else ease(v / .3)))
    c = CARTES[nom]; sens = -1 if k % 2 else 1
    e = ease(v / .4); cx = W / 2 + sens * (1 - e) * 700; rot = sens * (1 - e) * 8
    if v > PAS - .25: cx += -sens * ease((v - (PAS - .25)) / .25) * 1100
    cy = 300 + c.height / 2 + 30
    coller(im, c, cx, cy, s=1 + .015 * v, rot=rot)
    if v > .35:
        sw = math.sin((v - .35) * 6) * 9 * math.exp(-(v - .35) * 1.6)
        et = ETQ[(nom, i)]; base = cy + c.height / 2 - 20
        et_a = 1 - ease((v - (PAS - .25)) / .2) if v > PAS - .25 else ease((v - .35) / .25)
        rr = et.rotate(sw, resample=Image.BICUBIC, expand=True, center=(et.width / 2, 0))
        coller(im, rr, W / 2, base + rr.height / 2, a=et_a, ombre=False)
    pastille(im, W / 2 + 270, 330, ease((v - .5) / .3) * (1 if v < PAS - .25 else 0))
MOS = []
for ch in CH:
    for n, _ in ch[4]:
        img = Image.open(N + n + ".jpg").convert("RGB"); s = 230; r = s / min(img.size)
        img = img.resize((int(img.width * r) + 1, int(img.height * r) + 1)); img = img.crop(((img.width - s) // 2, (img.height - s) // 2, (img.width - s) // 2 + s, (img.height - s) // 2 + s))
        m = Image.new("L", (s, s), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, s - 1, s - 1), 30, fill=255)
        o = Image.new("RGBA", (s, s)); o.paste(img, (0, 0), m); MOS.append(o)
def s_fin(im, t, d):
    im.paste(ENCRE + (255,), (0, 0, W, H))
    for n, m in enumerate(MOS):
        r, c = divmod(n, 4); v = ease((t - .04 * n) / .4)
        if v > 0: coller(im, m, 165 + c * 250, 240 + r * 250, s=.6 + .4 * v, a=v, ombre=False)
    texte(im, 1300, "Nos nouveaux bijoux", PLAY(78), CREME, 255 * ease((t - .9) / .5))
    texte(im, 1400, "sont arrivés", PLAY(78, 500), (226, 196, 126), 255 * ease((t - 1.1) / .5))
    if t > 1.5:
        s = rebond((t - 1.5) / .5) * (1 + .04 * math.sin((t - 1.5) * 5)); f = PLAY(62)
        w = lg(ImageDraw.Draw(Image.new("RGB", (1, 1))), "nivcreation.fr", f); p = Image.new("RGBA", (w + 90, 116)); pd = ImageDraw.Draw(p)
        pd.rounded_rectangle((0, 0, w + 89, 115), 58, fill=(226, 196, 126, 255)); b = pd.textbbox((0, 0), "nivcreation.fr", font=f)
        pd.text((45 - b[0], (116 - (b[3] - b[1])) / 2 - b[1]), "nivcreation.fr", font=f, fill=ENCRE + (255,)); coller(im, p, W / 2, 1590, s=s, ombre=False)
    texte(im, 1730, "NiV CRÉATION · Gravé en France", INTER(32, 500), CREME, 230 * ease((t - 1.9) / .5))
SCENES = [(1.5, s_intro), (PAS * len(ITEMS), s_defile), (3.8, s_fin)]
def image(t):
    acc = 0
    for d, fn in SCENES:
        if t < acc + d or fn is SCENES[-1][1]: break
        acc += d
    im = Image.new("RGBA", (W, H)); fn(im, t - acc, d); return im.convert("RGB")
def main():
    total = sum(d for d, _ in SCENES); out = os.path.join(OUT, "61-nouveaux-bijoux-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(int(total * FPS)): p.stdin.write(image(f / FPS).tobytes())
    p.stdin.close(); p.wait(); leger = os.path.join(OUT, "61-nouveaux-bijoux-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")
if __name__ == "__main__":
    if "--apercu" in sys.argv:
        total = sum(d for d, _ in SCENES); ts = [x * .8 for x in range(int(total / .8) + 1)]
        ims = [image(x).resize((216, 384)) for x in ts]; cols = 10; rows = math.ceil(len(ims) / cols)
        pl = Image.new("RGB", (cols * 216, rows * 384))
        for i, x in enumerate(ims): pl.paste(x, ((i % cols) * 216, (i // cols) * 384))
        pl.save(os.path.join(OUT, "apercu-planche.jpg"), quality=82)
        for x in (1.2, 3.0, 5.2, 7.4, 20.0, 37.0): image(x).save(os.path.join(OUT, f"apercu-{x:04.1f}.jpg"), quality=85)
        print("ok", f"{total:.1f} s")
    else: main()
