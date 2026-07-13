#!/bin/bash
# ──────────────────────────────────────────────────────────────────
#  NIRO — Construire l'application Mac (.app / .dmg)
#  À lancer une fois sur le Mac Studio
# ──────────────────────────────────────────────────────────────────
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║    NIRO — Construction de l'application  ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# ── 1. Node.js ────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "📦 Installation de Node.js..."
  brew install node
else
  echo "✓ Node.js $(node --version)"
fi

# ── 2. Dépendances Electron ───────────────────────────────
echo "📚 Installation des dépendances..."
npm install

# ── 3. Générer une icône simple si absente ─────────────────
if [ ! -f icon.png ]; then
  echo "🎨 Génération de l'icône..."
  python3 - <<'PYEOF'
from PIL import Image, ImageDraw, ImageFont
import os

size = 512
img = Image.new('RGBA', (size, size), (1, 11, 20, 255))
draw = ImageDraw.Draw(img)

# Cercle extérieur
for r in range(3):
    draw.ellipse([size//2 - 200 + r, size//2 - 200 + r,
                  size//2 + 200 - r, size//2 + 200 - r],
                 outline=(0, 212, 255, max(50, 150 - r*50)), width=2)

# Cercle intérieur
draw.ellipse([size//2 - 130, size//2 - 130,
              size//2 + 130, size//2 + 130],
             fill=(0, 40, 80, 180), outline=(0, 212, 255, 200), width=2)

# Texte NIRO
try:
    font = ImageFont.truetype('/System/Library/Fonts/SFCompact-Bold.otf', 80)
except:
    font = ImageFont.load_default()

text = "NIRO"
bbox = draw.textbbox((0,0), text, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((size//2 - tw//2, size//2 - th//2), text, fill=(0, 212, 255, 255), font=font)

img.save('icon.png')
print('Icône créée : icon.png')
PYEOF
fi

# ── 4. Convertir en .icns (format Apple) ──────────────────
if [ -f icon.png ] && ! [ -f icon.icns ]; then
  echo "🖼️  Conversion en .icns..."
  mkdir -p icon.iconset
  for size in 16 32 64 128 256 512; do
    sips -z $size $size icon.png --out "icon.iconset/icon_${size}x${size}.png" &>/dev/null
    double=$((size * 2))
    sips -z $double $double icon.png --out "icon.iconset/icon_${size}x${size}@2x.png" &>/dev/null
  done
  iconutil -c icns icon.iconset
  rm -rf icon.iconset
  echo "✓ icon.icns créé"
fi

# ── 5. Build ──────────────────────────────────────────────
echo ""
echo "🔨 Construction de NIRO.app..."
npm run dist

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                Application créée ! ✓                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  Le fichier NIRO.dmg est dans : $DIR/dist/"
echo ""
echo "  → Double-cliquez sur NIRO.dmg"
echo "  → Glissez NIRO dans Applications"
echo "  → Lancez depuis le Launchpad ou le Dock"
echo ""
