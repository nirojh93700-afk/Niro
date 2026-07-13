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
# export OLLAMA_MODELS="/Volumes/VERBATIM HD/niro-models"  # ancien : disque externe
export OLLAMA_KEEP_ALIVE=-1
export OLLAMA_MAX_LOADED_MODELS=1

# ── 0 bis. Tuer TOUT ancien serveur Jarvis (sinon l'ancien code bugué reste actif) ──
echo "🧹 Arrêt de tout ancien serveur Jarvis..."
pkill -f "uvicorn main:app" 2>/dev/null
# Libérer le port 7777 s'il est encore occupé
OCC=$(lsof -ti tcp:7777 2>/dev/null)
if [ -n "$OCC" ]; then
  echo "$OCC" | xargs kill -9 2>/dev/null
fi
sleep 1

# ── 1. Ollama ──────────────────────────────────────────────
# On teste si Ollama RÉPOND vraiment (pas juste si un processus existe)
if ! ollama list &>/dev/null; then
  echo "🧠 Démarrage de Ollama..."
  # Tuer tout processus fantôme qui ne répond pas
  pkill ollama 2>/dev/null; sleep 1
  /opt/homebrew/bin/ollama serve &>/tmp/niro-ollama.log &
  # Attendre qu'Ollama réponde vraiment (max 20s)
  for i in $(seq 1 20); do
    ollama list &>/dev/null && break
    sleep 1
  done
fi
if ollama list &>/dev/null; then
  echo "✓ Ollama actif"
else
  echo "⚠ Ollama ne répond pas — vérifiez /tmp/niro-ollama.log"
fi

# ── 2. Modèle ──────────────────────────────────────────────
if ollama list 2>/dev/null | grep -q "qwen2.5:32b"; then
  echo "✓ Modèle : qwen2.5:32b (rapide)"
elif ollama list 2>/dev/null | grep -q "qwen2.5:72b"; then
  echo "✓ Modèle : qwen2.5:72b"
elif ollama list 2>/dev/null | grep -q "llama3.3:70b"; then
  echo "✓ Modèle : llama3.3:70b"
else
  echo "⚠ Modèle par défaut (lancez ./install.sh pour le meilleur modèle)"
fi

# ── 3. IP locale (WiFi) ────────────────────────────────────
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

# ── 4. mDNS — accessible via jarvis.local ─────────────────
if command -v dns-sd &>/dev/null; then
  dns-sd -R "Jarvis" _http._tcp local $PORT &>/tmp/niro-mdns.log &
  MDNS_PID=$!
fi

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

# psutil pour les jauges système (installe en silence si absent)
# IMPORTANT : python3 -m pip (et PAS pip3) pour installer dans LE python qui lance Jarvis
python3 -c "import psutil" 2>/dev/null || python3 -m pip install psutil --quiet 2>/dev/null &

# Librairie WebSocket : sans elle uvicorn REFUSE les connexions temps réel
# (symptôme : la page se charge mais reste HORS LIGNE / code 1006)
WSCHECK=$(python3 - <<'PY'
try:
    from uvicorn.protocols.websockets.auto import AutoWebSocketsProtocol as A
    print("OK" if A else "MISSING")
except Exception:
    print("MISSING")
PY
)
if [ "$WSCHECK" != "OK" ]; then
  echo "📦 Support WebSocket MANQUANT → installation dans le bon Python..."
  python3 -m pip install websockets --quiet
  WSCHECK=$(python3 -c "from uvicorn.protocols.websockets.auto import AutoWebSocketsProtocol as A; print('OK' if A else 'MISSING')" 2>/dev/null)
fi
if [ "$WSCHECK" = "OK" ]; then
  echo "✓ Support WebSocket : OK"
else
  echo "❌ SUPPORT WEBSOCKET TOUJOURS MANQUANT — les appareils resteront HORS LIGNE."
  echo "   Lancez :  python3 -m pip install websockets"
fi

# ── 6. Lancer le serveur ───────────────────────────────────
cd "$DIR/backend"

# Passer l'IP locale au backend (pour le QR code)
export NIRO_LOCAL_IP="$LOCAL_IP"
export NIRO_PORT="$PORT"

python3 -m uvicorn main:app --host 0.0.0.0 --port $PORT

# Nettoyage à l'arrêt
kill $MDNS_PID 2>/dev/null || true
