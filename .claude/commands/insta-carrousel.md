---
description: "Niv Création · Instagram 3/7 — fabriquer un carrousel Instagram (5 à 8 images 1080×1350) à partir des photos GRAVÉES du site : couverture, une image par produit ou par idée, dernière image « lien en bio ». Quand le gérant dit « fais-moi un carrousel », « des images pour Insta »."
---
# Carrousel Instagram (images 1080 × 1350)

1. Lire `docs/instagram/REGLES-INSTAGRAM.md`.
2. Choisir les photos dans `public/produits/` (et `public/marque-pages/`, `public/produits/catalogue/`) :
   faire une PLANCHE CONTACT avec Pillow (vignettes + nom de fichier), la regarder, garder seulement les pièces gravées,
   sans badge « EXEMPLE », sans texte anglais, sans marque déposée.
3. Fabriquer les images avec Pillow (script jetable dans le scratchpad, ou réutiliser `tools/video/carrousel_66.py` comme base) :
   - 1080 × 1350, fond crème ou encre, photo ENTIÈRE dans un cadre doré à double filet, fond flou de la même photo derrière ;
   - image 1 = titre en Playfair/DejaVuSerif-Bold (« Idées cadeaux gravés pour … »), dernière = « Tout est sur nivcreation.fr · lien en bio » + logo d'origine ;
   - une phrase courte par image (pas de prix, pas de stock).
4. Sortie : `docs/instagram/carrousels/AAAA-MM-JJ-<sujet>/01.jpg …` (JPEG qualité 90). Vérifier chaque image en la regardant
   (texte lisible, rien de coupé), puis l'envoyer au gérant (SendUserFile) avec la légende faite par `insta-legende`.
