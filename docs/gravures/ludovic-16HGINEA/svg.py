import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
FONTS = {'t1': TTFont('eaead17c7dbfcd5d-s.p.woff2'), 't2': TTFont('a273567b21a7c318-s.p.woff2')}
MM_PER_PX = 40.0 / 140.0   # le filet (140 px sur la planche) = 40 mm sur le verre
def glyphs(font, ch, size, x, base):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upem = font['head'].unitsPerEm
    n = cmap.get(ord(ch))
    if not n or ch == ' ': return ''
    pen = SVGPathPen(gs); s = size / upem
    gs[n].draw(TransformPen(pen, (s, 0, 0, -s, x, base)))
    return pen.getCommands()
for name, s1 in (('verre-1', 30), ('verre-2', 21)):
    d = json.load(open(f'grav2/{name}.json'))
    paths = []
    for key, size in (('t1', s1), ('t2', 12.5)):
        base = d['base' + key[1]]
        for ch, left, top, w, h in d[key]:
            p = glyphs(FONTS[key], ch, size, left, base)
            if p: paths.append(p)
    r1, r2, dm = d['r1'], d['r2'], d['dm']
    cx, cy = dm[0] + dm[2]/2, dm[1] + dm[3]/2; h = dm[2]/2
    xs = [r1[0], r1[0]+r1[2]] + [c[1] for c in d['t1']+d['t2']] + [c[1]+c[3] for c in d['t1']+d['t2']]
    x0, x1 = min(xs) - 2, max(xs) + 2; y0, y1 = r1[1] - 2, r2[1] + r2[3] + 2
    W, H = x1 - x0, y1 - y0
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W*MM_PER_PX:.2f}mm" height="{H*MM_PER_PX:.2f}mm" viewBox="{x0:.3f} {y0:.3f} {W:.3f} {H:.3f}">',
           '<g fill="#000" stroke="none">',
           f'<rect x="{r1[0]}" y="{r1[1]}" width="{r1[2]}" height="{r1[3]}"/>',
           f'<rect x="{r2[0]}" y="{r2[1]}" width="{r2[2]}" height="{r2[3]}"/>',
           f'<polygon points="{cx},{cy-h} {cx+h},{cy} {cx},{cy+h} {cx-h},{cy}"/>']
    svg += [f'<path d="{p}"/>' for p in paths] + ['</g></svg>']
    open(f'grav2/{name}.svg', 'w').write('\n'.join(svg))
    print(name, f'{W*MM_PER_PX:.1f} x {H*MM_PER_PX:.1f} mm')
