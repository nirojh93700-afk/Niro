#!/bin/bash
# ──────────────────────────────────────────────
#  NIRO — Lancement
# ──────────────────────────────────────────────

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ███╗   ██╗██╗██████╗  ██████╗ "
echo "  ████╗  ██║██║██╔══██╗██╔═══██╗"
echo "  ██╔██╗ ██║██║██████╔╝██║   ██║"
echo "  ██║╚██╗██║██║██╔══██╗██║   ██║"
echo "  ██║ ╚████║██║██║  ██║╚██████╔╝"
echo "  ╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝ ╚═════╝ "
echo ""
echo "  Assistant IA Personnel — M4 Max 48Go"
echo ""

# Vérifier Ollama
if ! pgrep -x "ollama" > /dev/null; then
  echo "🧠 Démarrage de Ollama..."
  ollama serve &>/tmp/niro-ollama.log &
  sleep 3
else
  echo "✓ Ollama actif"
fi

# Vérifier le modèle
echo "🔍 Vérification du modèle..."
if ollama list 2>/dev/null | grep -q "qwen2.5:72b"; then
  export NIRO_MODEL="qwen2.5:72b"
  echo "✓ Modèle : qwen2.5:72b"
elif ollama list 2>/dev/null | grep -q "llama3.3:70b"; then
  export NIRO_MODEL="llama3.3:70b"
  echo "✓ Modèle : llama3.3:70b"
else
  echo "⚠ Aucun grand modèle trouvé. Lancement avec ce qui est disponible..."
fi

# Lancer le backend
echo ""
echo "🚀 Lancement de NIRO sur http://localhost:7777"
echo "   Ouvrez cette URL dans Safari ou Chrome"
echo ""
echo "   Ctrl+C pour arrêter"
echo ""

cd "$DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 7777 --reload

# Ouvrir Safari automatiquement
sleep 1
open -a Safari "http://localhost:7777" 2>/dev/null || open "http://localhost:7777"
