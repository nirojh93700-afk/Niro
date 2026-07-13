#!/bin/bash
# ──────────────────────────────────────────────────────────
#  Jarvis — Nettoyage des anciens modèles (garde qwen2.5:32b)
#  Libère la RAM/disque : supprime le 72b, les fichiers partiels
#  et l'ancien dossier sur le disque externe VERBATIM.
# ──────────────────────────────────────────────────────────

export PATH="/opt/homebrew/bin:$PATH"

echo ""
echo "  🧹 Nettoyage des anciens modèles Jarvis"
echo "  ─────────────────────────────────────────"
echo ""

# ── 0. Sécurité : Ollama doit tourner ──────────────────────
if ! pgrep -x "ollama" > /dev/null; then
  echo "  ⚠  Ollama n'est pas lancé. Je le démarre..."
  /opt/homebrew/bin/ollama serve &>/tmp/niro-ollama.log &
  sleep 4
fi

# ── 1. Sécurité : le 32b DOIT être présent avant de supprimer ──
if ! ollama list 2>/dev/null | grep -q "qwen2.5:32b"; then
  echo "  ❌ ARRÊT : qwen2.5:32b n'est pas installé."
  echo "     Téléchargez-le d'abord :  ollama pull qwen2.5:32b"
  echo "     (rien n'a été supprimé)"
  exit 1
fi
echo "  ✓ qwen2.5:32b est bien installé — on peut nettoyer en sécurité."
echo ""

# ── 2. Supprimer l'ancien 72b (libère ~47 Go) ──────────────
if ollama list 2>/dev/null | grep -q "qwen2.5:72b"; then
  echo "  → Suppression de qwen2.5:72b (libère ~47 Go)..."
  ollama rm qwen2.5:72b
else
  echo "  • qwen2.5:72b déjà absent."
fi

# ── 3. Supprimer les fichiers partiels (téléchargements coupés) ──
PARTIALS=$(ls ~/.ollama/models/blobs/ 2>/dev/null | grep -i partial)
if [ -n "$PARTIALS" ]; then
  echo "  → Suppression des fichiers partiels (téléchargements coupés)..."
  rm -f ~/.ollama/models/blobs/*partial* 2>/dev/null
else
  echo "  • Aucun fichier partiel à nettoyer."
fi

# ── 4. Supprimer l'ancien dossier sur le disque externe VERBATIM ──
if [ -d "/Volumes/VERBATIM HD/niro-models" ]; then
  echo "  → Suppression de l'ancien modèle sur le disque VERBATIM (libère ~44 Go)..."
  rm -rf "/Volumes/VERBATIM HD/niro-models"
else
  echo "  • Dossier VERBATIM déjà absent (ou disque non branché)."
fi

# ── 5. Bilan ───────────────────────────────────────────────
echo ""
echo "  ─────────────────────────────────────────"
echo "  ✅ Nettoyage terminé. Modèles restants :"
echo ""
ollama list
echo ""
echo "  💾 Espace disque interne :"
df -h / | tail -1 | awk '{print "     Libre : "$4" / "$2}'
echo ""
