#!/bin/bash
# ──────────────────────────────────────────────────────────
#  NIRO — Installation (Mac Studio M4 Max)
#  Lance ce script une seule fois après avoir cloné le repo
# ──────────────────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         NIRO — Installation          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Homebrew
if ! command -v brew &>/dev/null; then
  echo "📦 Installation de Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✓ Homebrew déjà installé"
fi

# 2. Python 3.11+
if ! command -v python3 &>/dev/null || python3 -c "import sys; exit(0 if sys.version_info >= (3,11) else 1)" 2>/dev/null; then
  echo "🐍 Installation de Python 3.11..."
  brew install python@3.11
  export PATH="$(brew --prefix python@3.11)/bin:$PATH"
else
  echo "✓ Python OK ($(python3 --version))"
fi

# 3. Ollama
if ! command -v ollama &>/dev/null; then
  echo "🧠 Installation de Ollama..."
  brew install ollama
else
  echo "✓ Ollama déjà installé"
fi

# 4. Démarrer Ollama en arrière-plan
echo "🚀 Démarrage de Ollama..."
ollama serve &>/tmp/ollama.log &
sleep 3

# 5. Télécharger le modèle IA
echo ""
echo "⬇️  Téléchargement du modèle Qwen 2.5 72B (40 Go — une seule fois)..."
echo "   Cela peut prendre 20-40 min selon votre connexion."
echo "   Avec le Mac Studio M4 Max 48Go, c'est le meilleur modèle possible."
echo ""
ollama pull qwen2.5:72b

# Modèle vision pour les images
echo "⬇️  Téléchargement du modèle vision (LLaVA)..."
ollama pull llava:13b

# 6. Dépendances Python
echo ""
echo "📚 Installation des dépendances Python..."
pip3 install fastapi uvicorn httpx python-multipart --quiet

# 7. Dossier config
mkdir -p ~/.niro

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              Installation terminée ! ✓              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Pour configurer l'email (optionnel) :"
echo "  nano ~/.niro/email.json"
echo ""
echo '  Contenu : {"smtp":"smtp.gmail.com","port":587,"user":"vous@gmail.com","password":"mot-de-passe-app","from":"NIRO <vous@gmail.com>"}'
echo ""
echo "  Pour lancer NIRO :"
echo "  ./start.sh"
echo ""
