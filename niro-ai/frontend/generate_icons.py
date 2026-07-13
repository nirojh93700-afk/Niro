"""Génère les icônes Jarvis pour la PWA."""
import subprocess, sys, os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow', '-q'])
    from PIL import Image, ImageDraw, ImageFont

def make_icon(size):
    img = Image.new('RGBA', (size, size), (1, 11, 20, 255))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    r = int(size * 0.42)

    # Cercles
    for i, (rad, alpha) in enumerate([(r, 180), (int(r*0.78), 120), (int(r*0.55), 80)]):
        draw.ellipse([cx-rad, cy-rad, cx+rad, cy+rad],
                     outline=(0, 212, 255, alpha), width=max(1, size//128))

    # Centre rempli
    ri = int(r * 0.52)
    draw.ellipse([cx-ri, cy-ri, cx+ri, cy+ri],
                 fill=(0, 40, 80, 200), outline=(0, 212, 255, 200), width=max(1, size//128))

    # Texte
    fs = max(10, int(size * 0.18))
    try:
        for path in [
            '/System/Library/Fonts/SFCompact-Bold.otf',
            '/System/Library/Fonts/Helvetica.ttc',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        ]:
            try:
                font = ImageFont.truetype(path, fs)
                break
            except Exception:
                continue
        else:
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    text = 'J'
    bb = draw.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    draw.text((cx - tw//2, cy - th//2 - bb[1]), text, fill=(0, 212, 255, 255), font=font)

    return img

ICONS_DIR = Path(__file__).parent / 'icons'
ICONS_DIR.mkdir(exist_ok=True)

for size, name in [(192, 'icon-192'), (512, 'icon-512'), (180, 'icon-180')]:
    img = make_icon(size)
    path = ICONS_DIR / f'{name}.png'
    img.save(str(path))
    print(f'✓ {path}')

print('Icônes générées.')
