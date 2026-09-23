# Fichiers de gravure — style n°2 « étiquette de grand cru » (Ludovic NOEL, #16HGINEA)
# Sortie : SVG (texte en tracés, unités mm) + PNG 600 dpi noir sur blanc + aperçu sur le verre.
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from PIL import Image, ImageDraw, ImageFont
import os

F = "fonts/"
OUT = "ludovic-gravure/"
NAME_FONT = F + "PlayfairDisplayMedium.ttf"
SUB_FONT = F + "MontserratLight.ttf"

# Zone de gravure (mm) — verre à pied 47 cl, face avant
W_MM, H_MM = 70.0, 34.0
DPI = 600
PX = DPI / 25.4  # px par mm

def load(path):
    t = TTFont(path); return t, t["cmap"].getBestCmap(), t.getGlyphSet(), t["head"].unitsPerEm

def layout(text, font, size_mm, tracking_mm):
    """Positions des glyphes (x en mm) pour une ligne centrée, cap-height de size_mm."""
    t, cmap, gs, upem = font
    os2 = t["OS/2"]; cap = getattr(os2, "sCapHeight", 0) or int(upem * 0.7)
    scale = size_mm / cap  # mm par unité de fonte → hauteur des capitales = size_mm
    names = [cmap.get(ord(c)) for c in text]
    widths = [(gs[n].width * scale if n else size_mm * 0.35) for n in names]
    total = sum(widths) + tracking_mm * (len(text) - 1)
    x = -total / 2
    pos = []
    for n, w in zip(names, widths):
        pos.append((n, x)); x += w + tracking_mm
    return pos, scale, total

def glyph_path(font, name, scale, dx, dy):
    _, _, gs, _ = font
    pen = SVGPathPen(gs)
    # y vers le bas en SVG : on inverse
    tp = TransformPen(pen, (scale, 0, 0, -scale, dx, dy))
    gs[name].draw(tp)
    return pen.getCommands()

def build(title, subtitle, base, fname):
    name_font = load(NAME_FONT); sub_font = load(SUB_FONT)
    cx = W_MM / 2
    # Réglages du style n°2
    NAME_SIZE = 7.2      # hauteur des capitales (mm)
    NAME_TRACK = 1.3     # espacement (mm)
    SUB_SIZE = 2.3
    SUB_TRACK = 1.05
    RULE = 0.35          # épaisseur des filets (mm)
    DIAMOND = 1.6        # côté du losange (mm)
    y_rule_top = 6.0
    y_name_base = y_rule_top + 3.4 + NAME_SIZE   # ligne de base du nom
    y_sub_base = y_name_base + 5.2
    y_rule_bot = y_sub_base + 3.6
    MAX_NAME_W = 47.0
    pos_n, sc_n, wn = layout(title, name_font, NAME_SIZE, NAME_TRACK)
    if wn > MAX_NAME_W:
        k = MAX_NAME_W / wn
        NAME_SIZE *= k; NAME_TRACK *= k
        pos_n, sc_n, wn = layout(title, name_font, NAME_SIZE, NAME_TRACK)
        y_name_base = y_rule_top + 3.4 + NAME_SIZE + (7.2 - NAME_SIZE) / 2  # nom recentré entre les filets
        y_sub_base = y_name_base + 4.6
    pos_s, sc_s, ws = layout(subtitle, sub_font, SUB_SIZE, SUB_TRACK)
    rule_w = 57.0  # même largeur de filets sur les deux verres
    x0 = cx - rule_w / 2; x1 = cx + rule_w / 2
    # --- SVG
    paths = []
    for n, x in pos_n:
        if n: paths.append(glyph_path(name_font, n, sc_n, cx + x, y_name_base))
    for n, x in pos_s:
        if n: paths.append(glyph_path(sub_font, n, sc_s, cx + x, y_sub_base))
    d = DIAMOND / 2
    gap = DIAMOND * 1.3
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W_MM}mm" height="{H_MM}mm" viewBox="0 0 {W_MM} {H_MM}">',
           f'<title>{title} — {subtitle} — style n°2</title>',
           '<g fill="#000" stroke="none">',
           # filet haut coupé au milieu par le losange
           f'<rect x="{x0}" y="{y_rule_top - RULE/2}" width="{cx - gap - x0}" height="{RULE}"/>',
           f'<rect x="{cx + gap}" y="{y_rule_top - RULE/2}" width="{x1 - cx - gap}" height="{RULE}"/>',
           f'<polygon points="{cx},{y_rule_top - d} {cx + d},{y_rule_top} {cx},{y_rule_top + d} {cx - d},{y_rule_top}"/>',
           f'<rect x="{x0}" y="{y_rule_bot - RULE/2}" width="{rule_w}" height="{RULE}"/>']
    svg += [f'<path d="{p}"/>' for p in paths if p]
    svg += ['</g></svg>']
    open(OUT + fname + ".svg", "w").write("\n".join(svg))
    # --- PNG 600 dpi (noir sur blanc) + PNG fond transparent
    Wpx, Hpx = int(W_MM * PX), int(H_MM * PX)
    img = Image.new("L", (Wpx, Hpx), 255); dr = ImageDraw.Draw(img)
    fn = ImageFont.truetype(NAME_FONT, 10); fs = ImageFont.truetype(SUB_FONT, 10)
    # taille de police Pillow telle que cap-height = size : px_size = size_mm*PX*upem/cap
    def pil_font(path, font, size_mm):
        t, _, _, upem = font; cap = getattr(t["OS/2"], "sCapHeight", 0) or int(upem*0.7)
        return ImageFont.truetype(path, max(1, round(size_mm * PX * upem / cap)))
    fn = pil_font(NAME_FONT, name_font, NAME_SIZE); fs = pil_font(SUB_FONT, sub_font, SUB_SIZE)
    for (n, x), ch in zip(pos_n, title):
        if n: dr.text(((cx + x) * PX, y_name_base * PX), ch, font=fn, fill=0, anchor="ls")
    for (n, x), ch in zip(pos_s, subtitle):
        if n: dr.text(((cx + x) * PX, y_sub_base * PX), ch, font=fs, fill=0, anchor="ls")
    r = RULE * PX / 2
    dr.rectangle([x0*PX, y_rule_top*PX - r, (cx-gap)*PX, y_rule_top*PX + r], fill=0)
    dr.rectangle([(cx+gap)*PX, y_rule_top*PX - r, x1*PX, y_rule_top*PX + r], fill=0)
    dr.polygon([(cx*PX, (y_rule_top-d)*PX), ((cx+d)*PX, y_rule_top*PX), (cx*PX, (y_rule_top+d)*PX), ((cx-d)*PX, y_rule_top*PX)], fill=0)
    dr.rectangle([x0*PX, y_rule_bot*PX - r, x1*PX, y_rule_bot*PX + r], fill=0)
    img.save(OUT + fname + ".png", dpi=(DPI, DPI))
    rgba = Image.new("RGBA", img.size, (0, 0, 0, 0)); rgba.putalpha(Image.eval(img, lambda v: 255 - v))
    rgba.save(OUT + fname + "-transparent.png", dpi=(DPI, DPI))
    return img, rule_w

specs = [("CLAUDE", "MILLÉSIME 1976", "verre-1"), ("AMI DE CLAUDE", "MILLÉSIMÉ", "verre-2"), ("CLAUDE", "MILLÉSIME 1976", "couvercle-coffret-A-CONFIRMER")]
imgs = {}
for t, s, f in specs:
    imgs[f] = build(t, s, None, f)
    print(f, "→ filets", round(imgs[f][1], 1), "mm")

# Aperçu sur le verre vierge (indicatif) : gravure givrée sur la face
glass = Image.open("verre_vierge.jpg").convert("RGBA")
gw, gh = glass.size  # 1476x2953
# largeur du calice ≈ 640 px sur 1476 → on suppose calice ≈ 90 mm → 7.1 px/mm
pxmm = 640 / 90
for f in ("verre-1", "verre-2"):
    art = imgs[f][0]
    aw, ah = int(W_MM * pxmm), int(H_MM * pxmm)
    a = art.resize((aw, ah), Image.LANCZOS)
    layer = Image.new("RGBA", (aw, ah), (0, 0, 0, 0))
    alpha = Image.eval(a, lambda v: int((255 - v) * 0.92))
    frost = Image.new("RGBA", (aw, ah), (150, 160, 172, 255)); frost.putalpha(alpha)
    g = glass.copy(); g.alpha_composite(frost, (gw//2 - aw//2, 1120 - ah//2))
    g.convert("RGB").resize((738, 1476), Image.LANCZOS).save(OUT + "apercu-" + f + ".jpg", quality=88)
print("ok")
