#!/bin/bash
# ──────────────────────────────────────────────────────────
#  NIRO — Installation (Mac Studio M4 Max — Serveur Central)
# ──────────────────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          NIRO — Installation Serveur            ║"
echo "║         Mac Studio M4 Max 48Go                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Homebrew ───────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "📦 Installation de Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  echo "✓ Homebrew OK"
fi

# ── 2. Python 3.11+ ───────────────────────────────────────
if ! python3 -c "import sys; exit(0 if sys.version_info >= (3,11) else 1)" 2>/dev/null; then
  echo "🐍 Installation de Python 3.11..."
  brew install python@3.11
  export PATH="$(brew --prefix python@3.11)/bin:$PATH"
else
  echo "✓ Python OK ($(python3 --version))"
fi

# ── 3. Ollama ─────────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
  echo "🧠 Installation de Ollama..."
  brew install ollama
else
  echo "✓ Ollama OK"
fi

# ── 4. Démarrer Ollama ────────────────────────────────────
echo "🚀 Démarrage de Ollama..."
pkill ollama 2>/dev/null || true
sleep 1
ollama serve &>/tmp/ollama.log &
sleep 4

# ── 5. Modèle IA principal (72B — meilleur pour M4 Max 48Go) ──
echo ""
echo "⬇️  Modèle Qwen 2.5 72B (40 Go — meilleur open source)"
echo "    Durée : 20-40 min selon votre connexion. Une seule fois."
echo ""
ollama pull qwen2.5:72b

# ── 6. Dépendances Python ─────────────────────────────────
echo ""
echo "📚 Dépendances Python..."
pip3 install fastapi uvicorn httpx python-multipart Pillow psutil --quiet

# ── 6b. Icônes PWA ────────────────────────────────────────
echo "🎨 Génération des icônes..."
python3 "$(dirname "$0")/frontend/generate_icons.py"

# ── 7. Dossier config ─────────────────────────────────────
mkdir -p ~/.niro

# ── 8. Lancer au démarrage (LaunchAgent) ──────────────────
PLIST="$HOME/Library/LaunchAgents/ai.niro.assistant.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cat > "$PLIST" << PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.niro.assistant</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/start.sh</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/niro.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/niro-error.log</string>
</dict>
</plist>
PLIST_EOF

launchctl load "$PLIST" 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                 Installation terminée ! ✓               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  ▶ Lancez NIRO :  ./start.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Pour accéder depuis tous vos appareils (iPhone, iPad…)"
echo "  ils doivent être sur le même WiFi."
echo ""
echo "  Pour accéder depuis N'IMPORTE OÙ dans le monde :"
echo "  Installez Tailscale : brew install tailscale"
echo "  Puis : sudo tailscale up"
echo "  → NIRO sera accessible via votre IP Tailscale"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Email (optionnel) — créez ~/.niro/email.json :"
echo '  {"smtp":"smtp.gmail.com","port":587,"user":"...","password":"...","from":"NIRO <...>"}'
echo ""
