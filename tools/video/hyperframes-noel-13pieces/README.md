# Vidéo 15 — Noël, 13 pièces gravées (HyperFrames, rendu local)

Composition HTML + GSAP (1080 × 1920, 35,2 s, sans son) : carte rouge & or « Cadeaux de Noël »,
13 plans produit (photo ENTIÈRE sur fond flou, ruban « ✦ IDÉE CADEAU DE NOËL ✦ », pastille
« NOËL 2026 », nom + légende), carte finale « Commandez tôt pour Noël ».

Recette (voir aussi `tools/video/hyperframes-noel/README.md`) :
1. `npx -y skills add heygen-com/hyperframes` (une fois par environnement)
2. `ln -sf $(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") ~/bin/ffmpeg`
   et `npm i --no-save @ffprobe-installer/linux-x64` → lien `~/bin/ffprobe` (le binaire ffmpeg
   renommé NE fait PAS ffprobe : le rendu échoue à la fin sur « Unrecognized option print_format »).
3. `npx hyperframes browser ensure` · `npx hyperframes check --json` · `npx hyperframes snapshot --at 1.4,4.6,13.8,33.4`
4. `npx hyperframes render --quality looks --output out.mp4` (~4 min) puis version légère :
   `ffmpeg -i out.mp4 -vf scale=720:1280 -c:v libx264 -crf 26 -an -movflags +faststart out-720.mp4`

Photos : `assets/img/p01..p13.jpg` = copies réduites de `public/produits/` (toutes gravées, planche
contact vérifiée le 26/09). Polices : Playfair Display + Inter (TTF variables, Google Fonts via GitHub).
