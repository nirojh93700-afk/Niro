# Vidéo Noël — composition HyperFrames (26/09/2026)

Projet HyperFrames (HTML + GSAP) de la vidéo n° 9 « Noël ». Rendu local, pas le service hébergé
(HeyGen refuse les agents en ligne de commande).

- Photos : copier depuis `public/produits/` dans `assets/` (voir les `src` de `index.html`) —
  UNIQUEMENT des produits déjà gravés (règle du 22/09).
- Musique : `assets/musique-noel.m4a` (Jingle Bells, domaine public, synthétisée — pas de droits).
- Polices locales (`fonts/`), GSAP local (`vendor/`) : les CDN sont bloqués depuis le rendu.
- Outils : Node 22, `ffmpeg` (pip imageio-ffmpeg) ET un vrai `ffprobe`
  (`npm i @ffprobe-installer/linux-x64` → copier le binaire dans /usr/local/bin), Chrome
  headless via `npx hyperframes browser ensure`.
- Vérifier / rendre : `npx hyperframes check` → `npx hyperframes snapshot --at 4.6,14.4`
  → `npx hyperframes render --quality looks --output noel.mp4`, puis ré-encoder léger
  (`scale=720:1280`, crf 26, faststart) pour le téléphone.
