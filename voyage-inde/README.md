# Voyage Inde du Sud — appli de dépenses (projet séparé de la boutique)

Application PWA autonome, déployée sur **voyage-inde-sud.surge.sh**.
Ce dossier est une **sauvegarde du code source** : il ne fait PAS partie du site Niv Création
et n'est déployé par aucun pipeline de ce dépôt.

## Publier
    NODE_USE_ENV_PROXY=1 npx surge --project ./voyage-inde/public --domain voyage-inde-sud.surge.sh
Avant de publier, incrémenter `var CACHE = "voyage-inde-vNN"` dans `public/sw.js`.

## Backend
Firebase Realtime Database (projet `voyage-inde`, plan gratuit) — l'adresse est dans `public/index.html` (`FBDB`).
Code de voyage partagé : `inde26-4h7k2p`.

## Rapports PDF
`build.py` / `complet.py` / `histo.py` génèrent un HTML à partir de `carnet.json`
(export Firebase), rendu en PDF avec Chromium (voir `topdf*.mjs` de la session).
