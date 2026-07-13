#!/bin/bash
# ──────────────────────────────────────────────────────────
#  NIRO — Lancement (Serveur central — tous appareils)
# ──────────────────────────────────────────────────────────

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=7777

echo ""
echo "        _                  _     "
echo "       | |  __ _  _ __ __| | __ "
echo "    _  | | / _\` || '__|/ _\` |/ _|"
echo "   | |_| || (_| || |  | (_| |\__ \\"
echo "    \___/  \__,_||_|   \__,_||___/"
echo ""
echo "  Serveur Central — M4 Max 48Go"
echo ""

# ── 0. Chemins ─────────────────────────────────────────────
export PATH="/opt/homebrew/bin:$PATH"
export OLLAMA_MODELS="/Volumes/VERBATIM HD/niro-models"

# ── 1. Ollama ──────────────────────────────────────────────
if ! pgrep -x "ollama" > /dev/null; then
  echo "🧠 Démarrage de Ollama..."
  /opt/homebrew/bin/ollama serve &>/tmp/niro-ollama.log &
  sleep 4
else
  echo "✓ Ollama actif"
fi

# ── 2. Modèle ──────────────────────────────────────────────
if ollama list 2>/dev/null | grep -q "qwen2.5:72b"; then
  echo "✓ Modèle : qwen2.5:72b"
elif ollama list 2>/dev/null | grep -q "llama3.3:70b"; then
  echo "✓ Modèle : llama3.3:70b"
else
  echo "⚠ Modèle par défaut (lancez ./install.sh pour le meilleur modèle)"
fi

# ── 3. IP locale (WiFi) ────────────────────────────────────
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

# ── 4. mDNS — accessible via niro.local ───────────────────
# Enregistrer le service Bonjour/mDNS (natif macOS)
dns-sd -R "NIRO Assistant" _http._tcp local $PORT &>/tmp/niro-mdns.log &
MDNS_PID=$!

# ── 5. Affichage des URLs d'accès ─────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Jarvis est accessible depuis tous vos appareils :"
echo ""
echo "  Sur ce Mac         →  http://localhost:$PORT"
if [ -n "$LOCAL_IP" ]; then
echo "  iPhone / iPad      →  http://$LOCAL_IP:$PORT"
echo "  MacBook Pro        →  http://$LOCAL_IP:$PORT"
echo "  Tout appareil WiFi →  http://jarvis.local:$PORT"
echo ""
echo "  📱 Scannez le QR dans l'interface pour accéder depuis votre téléphone"
fi

# Tailscale (si installé)
if command -v tailscale &>/dev/null; then
  TAIL_IP=$(tailscale ip -4 2>/dev/null || echo "")
  if [ -n "$TAIL_IP" ]; then
    echo ""
    echo "  🌐 Partout dans le monde (Tailscale) :"
    echo "     http://$TAIL_IP:$PORT"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Ctrl+C pour arrêter"
echo ""

# Ouvrir Safari sur ce Mac
sleep 1
open "http://localhost:$PORT" 2>/dev/null &

# ── 6. Lancer le serveur ───────────────────────────────────
cd "$DIR/backend"

# Passer l'IP locale au backend (pour le QR code)
export NIRO_LOCAL_IP="$LOCAL_IP"
export NIRO_PORT="$PORT"

python3 -m uvicorn main:app --host 0.0.0.0 --port $PORT

# Nettoyage à l'arrêt
kill $MDNS_PID 2>/dev/null
