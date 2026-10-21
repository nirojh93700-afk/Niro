# Audit complet du site — 21/10/2026 (après la mise en ligne du verre à cocktail 33 cl)

Demande du gérant : « fais une audite complète du site, portable et ordinateur, options bien placées, et le site est un peu en ralenti ».
Rien n'a été modifié : constat seulement.

## 1. Mise en ligne vérifiée
- Commit `f87e2335`, déploiement Firebase **réussi**, fiche en ligne : « Taille du verre » 17 cl / 33 cl, 33 cl à 19,90 / 37,90 / 71,90 €.

## 2. Mise en page — 135 pages × 3 largeurs (390, 1280, 1440 px) = 405 mesures
- 0 défilement horizontal · 0 élément qui sort de l'écran (le tiroir du panier, caché hors écran, est normal) · 0 texte rogné
  dans les boutons · 0 erreur JavaScript · 0 image cassée (les 2 `/api/img/…` de /idees répondent 200 en ligne).
- Audit `tools/audit-site.mjs --rapide` sur le site en ligne : **126 vérifications réussies**, 404 photos OK. Les 5 « fiches qui ne
  s'ouvrent pas » étaient de faux positifs (délai dépassé dans la rafale juste après le déploiement : rouvertes une à une en < 2,2 s).
- **Options à regarder (pas de bug, mais pas pareil partout)** :
  1. Téléphone : **flûte** et **verre à whisky** ont encore « Lot de 4 — livraison offerte » qui passe seul sur une 2ᵉ ligne ; le vin et
     le cocktail disent « Lot de 4 » sur une ligne. À aligner si le gérant le veut.
  2. Ordinateur : 5 couleurs = 4 + 1 seule sur la 2ᵉ rangée (pendentif géométrique, collier plaque acier). Téléphone : dernière case seule
     sur puzzle photo (3+1), bracelet cordon à plaque (2+1), bracelet homme plaque cuir, collier enveloppe, médaillon cœur.
  3. Bracelet homme tressé : 6 options (3 couleurs × sans/avec texte) sur 2 rangées — vieux système « Sans / Avec gravure » (déjà noté).
- **16 pages sans titre principal (h1)** : carte-cadeau, panier, favoris, contact, CGV, confidentialité, mentions légales, retours, offres,
  et les 7 pages /offrir/<occasion>. Invisible pour la cliente, compte pour Google et l'accessibilité. Antérieur.

## 3. Lenteur — causes mesurées
1. **L'accueil charge 21 Mo d'images** (90 photos en taille d'origine, téléphone compris) : le mur de l'atelier affiche TOUTES les créations
   en pleine taille et sans chargement différé. Les plus lourdes : numéro de table eucalyptus 5,2 Mo (`Gemini_Generated_Image_….png`),
   porte-clés cristal cœur crème 1,5 Mo, menu de mariage bois 1,2 Mo, plaque de porte enfant 1,2 Mo. Fiche produit = 1,8 Mo, boutique = 2,3 Mo (correct).
   Tout le site : 495 photos, 93 Mo, **48 font plus de 300 Ko (50 Mo à elles seules), 17 font plus de 1 Mo** (règle du §10 : ~1200 px, < 300 Ko).
2. **Chaque page est rendue à la demande** (toutes les pages « ƒ », en-tête `no-store`) : 1,0 à 2,0 s avant le premier octet, contre 0,1–0,3 s
   pour un fichier statique. Aucun cache CDN ; `/api/shipping-config` 0,45 s, `/sitemap.xml` 0,9–2 s.
3. **`apphosting.yaml` : `minInstances: 0`**, 1 CPU, 512 Mo, 2 instances max → après un moment sans visite, le premier visiteur attend le démarrage
   du serveur (plusieurs secondes).
4. Petit : logo 124 Ko (JPEG) et QR Instagram 278 Ko (PNG) sur chaque page, 9 fichiers de polices (253 Ko).

## 4. Propositions (rien de fait, à son « applique »)
- A. **Compresser les 48 photos > 300 Ko** (WebP ~1200 px, même rendu) + chargement différé du mur → accueil ≈ 3 Mo au lieu de 21. Le plus gros gain.
- B. **Garder les pages en cache 60 s** côté serveur (au lieu de `no-store`) → ~0,2 s au lieu de 1–2 s pour la plupart des visiteurs ; un prix changé
   dans Gestion reste visible en moins d'une minute (le catalogue a déjà un cache de 60 s).
- C. **`minInstances: 1`** → plus de démarrage à froid ; coût de l'ordre de 10 € par mois (à confirmer dans la console Firebase).
- D. Logo et QR Instagram en version légère (−350 Ko par page).
