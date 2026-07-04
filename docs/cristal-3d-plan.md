# DOSSIER — Cristal Photo 3D (plan de vente + données marché)

> Document maître pour lancer la gamme **cristal photo 3D**. Regroupe : achats réels
> (transport compris), prix des concurrents, prix de vente conseillés, mise en page
> de la fiche produit, marketing. Coûts détaillés bruts : voir `couts-cristal-alibaba.md`.
> **À NE PAS PERDRE** — base de travail validée avec la gérante (juillet 2026).

## 1. Ce que la gérante a acheté (reçu Alibaba, transport compris)
Total payé : **1 129,87 €** = marchandise 673,66 € + transport (fret mer DDP) 423,44 € + frais paiement 32,82 €.
Transport réparti **au poids** (cristal dense). « Coût rendu » = prix fournisseur + part transport.

| Article | Taille | Qté | Prix fourn./pièce | Total marchandise | **Coût rendu/pièce** |
|---|---|---|---|---|---|
| Bloc cristal | 5×5×8 cm | 50 | 2,29 € | 114,51 € | **~4,40 €** |
| Bloc cristal | 5×6×10 cm | 50 | 3,72 € | 185,80 € | **~6,90 €** |
| Bloc cristal | 6×8×12 cm | 10 | 6,48 € | 64,82 € | **~12,60 €** |
| Bloc cristal | 6×10×15 cm | 10 | 10,80 € | 108,02 € | **~20,30 €** |
| Cœur cristal | 10×10×5 cm | 5 | 8,56 € | 42,78 € | **~11,20 €** |
| Porte-clés LED | cœur | 50 | 0,99 € | 49,69 € | **~1,10 €** |
| Porte-clés LED | rectangle | 50 | 0,86 € | 43,21 € | **~1,00 €** |
| Socle LED rotatif | petit 5×5×8 | 5 | 2,16 € | 10,81 € | **~2,70 €** |
| Socle LED rotatif | moyen | 15 | 2,59 € | 38,89 € | **~3,10 €** |
| Socle LED rotatif | cœur 10×10×5 | 5 | 3,03 € | 15,13 € | **~3,50 €** |

## 2. Concurrents — prix relevés (juillet 2026)
| Site | Positionnement | Entrée | Haut de gamme | Notes |
|---|---|---|---|---|
| **MasterPics** (masterpics.fr) | Leader, étranger, livraison 10-12 j | 89 € | 199 € | Promos –30 % permanentes. Socle LED option 25-39 €. « Garder le fond » +10 €. Gravure texte offerte. Cœur : 99/139/199 €. |
| **LOOXIS** (looxis.fr) | Premium FR | 39,90 € | 599 € | Tailles nommées par nb de personnes (1-2, 1-4…). Cœur M/L/XL : 79/139/199 €. |
| **Zephyr Paris** | Fabriqué à Paris, 48/72 h | 39 € | 499 € | Cubes 4/5/6/8/10 cm : 39/49/59/99/169 €. Rectangles 7-18 cm : 49-189 €. Cœur 119 €. Aussi bougeoirs/porte-stylo/trophées. |
| Amazon / Personello | Entrée de gamme | 18 € | 30 € | Qualité variable, pas de service. |

## 3. Prix de vente CONSEILLÉS (calés sous le marché, marge énorme)
| Mon produit | Coût rendu | Repère concurrents | **Prix conseillé** | **Marge** |
|---|---|---|---|---|
| Bloc Petit 5×5×8 | 4,40 € | 40-89 € | **39,90 €** | +35 € (×9) |
| Bloc Moyen 5×6×10 | 6,90 € | 79-139 € | **59,90 €** | +53 € (×8,7) |
| Bloc Grand 6×8×12 | 12,60 € | 99-139 € | **99,90 €** | +87 € (×7,9) |
| Bloc XL 6×10×15 | 20,30 € | 179-269 € | **149,90 €** | +130 € (×7,4) |
| Cœur 10×10×5 | 11,20 € | 79-199 € | **89,90 €** | +79 € |
| Porte-clés LED cœur | 1,10 € | 15-25 € | **16,90 €** | +15 € |
| Porte-clés LED rectangle | 1,00 € | 15-25 € | **14,90 €** | +13 € |
| Socle LED rotatif (option) | 2,70-3,50 € | 25-39 € (MasterPics) | **+19,90 €** | +16 € |

**Stratégie socle** : seulement 25 socles pour 125 blocs → socle en **option payante (+19,90 €)** sur les petits/moyens, **offert** sur les grands (99,90 €+) pour justifier le prix.
**Emballage** : prévoir mousse de calage (~1-2 €/pièce) — le cristal casse.

## 4. Mise en page de la fiche produit (repris des concurrents, adapté au site)
Structure gagnante observée sur MasterPics / LOOXIS / Zephyr :
1. **Hero** : grande photo/vidéo du cristal allumé sur son socle (ambiance + fond blanc). Le cristal qui **tourne** = pour Reels/TikTok.
2. **Sélecteur de forme** (vignettes : bloc, cœur, porte-clés).
3. **Sélecteur de taille** avec **dimensions + guide « nb de personnes sur la photo »** (idée LOOXIS) et prix qui se met à jour. → dans le site = `variants`.
4. **Zone d'upload photo** (drag & drop) + conseils (visage net, fond simple) + option « garder le fond ». → `personalizationFields` type `photo`.
5. **Options** : socle LED (avec image), texte/date gravé (offert), coffret cadeau. → champs `select` + `text`.
6. **Prix + Ajouter au panier** bien visibles.
7. **Réassurance** : livraison offerte dès seuil, garantie casse/défaut (photo sous 24 h → remplacé), paiement sécurisé, avis étoilés.
8. **« Comment ça marche »** en 3 étapes avec icônes.
9. **Galerie d'exemples** + avant/après (photo 2D → cristal 3D).
10. **Avis clients** + FAQ.

Correspondance avec l'existant Niv : `ProductDetail.jsx` gère déjà variants (tailles), upload photo (Cloudinary), aperçu 3D (`Engrave3D`), champs de gravure, badges de réassurance, bloc retrait. → il suffit de configurer : variants = tailles, champs = photo + texte + select socle + select coffret, et une note « guide des tailles ».

## 5. Marketing & occasions (à décliner toute l'année)
Saint-Valentin & couples · Fête des mères/pères · Naissance & bébé · **Mariage** (lien gamme mariage) · Hommage/souvenir (proche, animal) · Noël & anniversaires.
Arguments : cristal **K9 premium** · **gravé en France** (vs 10-12 j d'import) · socle **lumineux** rotatif · **livraison offerte** dès seuil · **garantie casse**.

## 6. Livraison (déjà en place, juillet 2026)
Cristal lourd (0,5-2,3 kg) → **retrait auto dès 2 kg** (gros blocs), **point relais** (carte), frais **au poids**. Cf. logique livraison du site.

## 7. LA GRAVURE — RÉSOLU ✅ (Scénario A : en interne)
**La gérante possède un `xTool F2 Ultra UV`** (laser UV 355 nm, 5W). C'est LA machine
adaptée : **gravure 3D sous-surface à l'intérieur du cristal K9** (effet « photo qui
flotte », comme MasterPics), + logiciel **IA photo 2D → modèle 3D**, précision <10 µm,
double caméra 48 MP. **Exige du cristal K9 = exactement ce qui a été acheté.**
→ **Gravure faite EN INTERNE, à l'atelier (Val-d'Oise, France).** Conséquences :
- Marge MAXIMALE (grille de prix §3 pleinement valable, pas de coût de sous-traitance).
- Positionnement « **gravé en France, rapide** » = 100 % vrai (vs 10-12 j d'import des géants).
- Workflow : client envoie sa photo → logiciel xTool convertit en 3D → gravure dans le bloc K9 → socle LED → expédition/retrait.
- **À faire par la gérante avant lancement** : s'entraîner sur quelques blocs (courbe
  d'apprentissage machine + logiciel), valider la qualité photo→3D, définir le temps de
  gravure par taille (impacte le délai annoncé).

## 8. Plan d'action
1. Gérante : confirmer la **gravure** (A/B/C) + valider la grille de prix.
2. Moi : créer les **fiches produit** (4 tailles blocs + cœur + 2 porte-clés) avec upload photo, aperçu 3D, options socle/texte/coffret, poids/livraison.
3. Moi : **visuels + vidéo** (cristal qui tourne sur socle lumineux) pour accueil + réseaux.
4. Publier une **collection « Cristal Photo 3D »** rangée par occasion, avec guide des tailles.
