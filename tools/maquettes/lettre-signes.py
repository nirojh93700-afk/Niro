#!/usr/bin/env python3
"""Les dessins des signes refaits (Gémeaux, Lion, Vierge, Verseau) ajoutés à la police des dessins de l'outil lettre — 13/11/2026.

Le gérant, le 13/11 : « pour les zodiaques je préfère le A, mais j'aime pas les jumeaux, j'aime pas le lion, tu dois refaire
Vierge et Verseau ». Les huit autres signes gardent leur dessin (Noto Emoji). Ces quatre-là viennent de collections libres
(voir signes-dessins/LICENCES.txt), composés puis tracés en noir (potrace) : un fichier .svg par dessin.

  python3 tools/maquettes/lettre-signes.py docs/maquettes/assets/lettre/signes-dessins docs/maquettes/assets/lettre/animaux.ttf

Chaque dessin prend une case « privée » de la police (U+E001…) ; relancer remplace les dessins sans doublon.
"""
import os, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

CODES = {  # nom du fichier → case de la police
    'gem-a': 0xE001, 'gem-b': 0xE002, 'gem-c': 0xE003, 'lion-a': 0xE004, 'lion-b': 0xE005,
    'vie-a': 0xE006, 'vie-b': 0xE007, 'vie-c': 0xE008, 'ver-a': 0xE009, 'ver-b': 0xE00A, 'ver-c': 0xE00B,
    # les douze symboles « au pinceau » (lettre-signes-pinceau.py), dans l'ordre de SIGNES du moteur
    'cal-capricorne': 0xE010, 'cal-verseau': 0xE011, 'cal-poissons': 0xE012, 'cal-belier': 0xE013, 'cal-taureau': 0xE014, 'cal-gemeaux': 0xE015,
    'cal-cancer': 0xE016, 'cal-lion': 0xE017, 'cal-vierge': 0xE018, 'cal-balance': 0xE019, 'cal-scorpion': 0xE01A, 'cal-sagittaire': 0xE01B,
}

def glyphe(svg, em):
    """Le tracé potrace (unités = dixièmes de point d'image, y vers le haut) ramené à la hauteur de la police."""
    ds = re.findall(r'<path d="([^"]+)"', svg)
    assert ds, "aucun tracé"
    pen = TTGlyphPen(None)
    k = em / 10000.0
    t = TransformPen(Cu2QuPen(pen, max_err=1.0, reverse_direction=False), (k, 0, 0, k, 0, 0))
    for d in ds: parse_path(d, t)
    return pen.glyph()

def main(dossier, police):
    f = TTFont(police); em = f['head'].unitsPerEm
    ordre = f.getGlyphOrder(); glyf = f['glyf']; hmtx = f['hmtx']
    tables = [t for t in f['cmap'].tables if t.isUnicode()]
    n = 0
    for nom, code in sorted(CODES.items(), key=lambda x: x[1]):
        p = os.path.join(dossier, nom + '.svg')
        if not os.path.exists(p): continue
        g = glyphe(open(p, encoding='utf-8').read(), em)
        gn = 'signe%04X' % code
        if gn not in ordre: ordre.append(gn)
        glyf[gn] = g; g.recalcBounds(glyf); hmtx[gn] = (em, max(0, getattr(g, 'xMin', 0)))
        for t in tables: t.cmap[code] = gn
        n += 1
    f.setGlyphOrder(ordre); f['maxp'].numGlyphs = len(ordre)
    f.save(police)
    print(n, 'dessins de signes dans', police, '·', os.path.getsize(police), 'octets ·', len(TTFont(police).getBestCmap()), 'dessins en tout')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
