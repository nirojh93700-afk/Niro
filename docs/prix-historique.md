# 🗂️ HISTORIQUE DES PRIX — POUR POUVOIR REVENIR EN ARRIÈRE

> Demande du gérant le 16/09/2026 : « enregistre les prix d'avant si je veux revenir
> plus tard pour remettre ».
> Ce fichier garde **les prix tels qu'ils étaient AVANT chaque hausse**, avec la
> manière exacte de les remettre. **Il ne se régénère pas tout seul** : à chaque
> changement de prix, ajouter une entrée datée en haut de la section 1.

---

## 1. Les changements, du plus récent au plus ancien

### 16/09/2026 — Hausse de 3 produits après relevé du marché
Raison : relevé de marché (`docs/prix-marche.md`). Accord du gérant : « OK applique les
prix augmentent ». Commits : **`1268fde`** (verre à vin) et **`9c19697`** (flûte +
ronds de serviette). État juste avant : commit **`858d131`**.

| Produit | Option | **AVANT (à remettre)** | Après |
|---|---|---|---|
| **Verre à vin gravé** (`verre-a-vin-grave`) | À l'unité | **12,90 €** | 15,90 € |
| | Lot de 2 | **24,90 €** | 29,90 € |
| | Lot de 4 | **49,90 €** | 57,90 € |
| **Flûte à champagne gravée** (`flute-a-champagne-gravee`) | À l'unité | **12,90 €** | 17,90 € |
| | Lot de 2 | **24,90 €** | 33,90 € |
| | Lot de 4 | **49,90 €** | 64,90 € |
| **Ronds de serviette** (`ronds-de-serviette-bois`) | À l'unité | **4,50 €** | 5,90 € |
| | Lot de 20 | 70,00 € | *inchangé* |
| | Lot de 50 | 145,00 € | *inchangé* |

**⚠️ Deux TEXTES ont changé en même temps — les remettre aussi, sinon la fiche mentira :**
1. `flute-a-champagne-gravee` → titre du variant du lot de 4 :
   `"Lot de 4 — livraison offerte"` → remettre **`"Lot de 4"`**
   (à 49,90 € le lot ne franchit plus le seuil de 60 €, donc la livraison n'est plus offerte).
2. `ronds-de-serviette-bois` → champ `note` : « Tarif dégressif : **5,90 €** à l'unité… »
   → remettre **« Tarif dégressif : 4,50 € à l'unité, 3,50 €/pièce dès 20, 2,90 €/pièce dès 50. »**

**Comment remettre (le plus simple)** — éditer `src/lib/products.js` à la main avec le
tableau ci-dessus, puis `npm run build` et pousser. Ou voir les diffs exacts :
```
git show 1268fde -- src/lib/products.js
git show 9c19697 -- src/lib/products.js
```
⚠️ **NE PAS faire `git revert`** sur ces deux commits : ils contiennent aussi le devis
de Ludovic NOEL et le relevé de marché, qu'on ne veut pas perdre.

**⚠️ ET SURTOUT — L'ADMIN PRIME SUR LE CODE.** Si un prix a été modifié depuis
Gestion → Produits & Stock, l'override admin recouvre le code : remettre le prix dans
le code ne changera **rien** sur la fiche. Dans ce cas, le remettre **dans Gestion**.

---

## 2. Photo complète de TOUS les prix au 15/09/2026 (avant la première hausse)

> Généré depuis le commit `858d131`. C'est le filet de sécurité : même si un prix est
> changé plus tard sans être noté en section 1, on retrouve ici ce qu'il valait.
> Les bijoux : prix du CODE (le prix payé par la cliente est ce prix × 0,9 × 0,9,
> remise bijoux −10 % — le détail est dans `docs/etat-bijoux.md`).

| Produit | slug | Catégorie | Option | Prix |
|---|---|---|---|---|
| Collier Enveloppe Message Secret | `collier-enveloppe-message-secret` | bijoux | Recto uniquement / Doré | **27,90 €** |
|  |  |  | Recto uniquement / Argent | **27,90 €** |
|  |  |  | Recto uniquement / Or Rose | **27,90 €** |
|  |  |  | Recto-Verso / Doré | **29,90 €** |
|  |  |  | Recto-Verso / Argent | **29,90 €** |
|  |  |  | Recto-Verso / Or Rose | **29,90 €** |
| Collier Médaillon Cœur ouvrable | `collier-medaillon-coeur-ouvrable` | bijoux | Argent | **38,90 €** |
|  |  |  | Doré | **38,90 €** |
|  |  |  | Bicolore (Or & Argent) | **44,90 €** |
| Bracelet Homme Identité (Gourmette) | `bracelet-homme-identite-gourmette` | bijoux | Acier inoxydable | **30,90 €** |
| Bracelet Homme Acier & Silicone | `bracelet-homme-acier-silicone` | bijoux | Plaque argentée | **26,90 €** |
|  |  |  | Plaque noire | **26,90 €** |
| Numéro de table Arches Bohèmes | `numero-table-arches-bohemes` | mariage | À l'unité (1-9) | **18,90 €** |
|  |  |  | Lot de 10+ (prix unitaire) | **16,90 €** |
| Numéro de table Eucalyptus | `numero-table-eucalyptus` | mariage | À l'unité (1-9) | **14,90 €** |
|  |  |  | Lot de 10+ (prix unitaire) | **12,90 €** |
| Numéro de table Feuillage | `numero-table-feuillage` | mariage | À l'unité (1-9) | **14,90 €** |
|  |  |  | Lot de 10+ (prix unitaire) | **12,90 €** |
| Étiquette de serviette Initiales | `etiquette-serviette-initiales` | mariage | À la pièce | **5,90 €** |
| Numéro de table Arche géométrique | `numero-table-arche-geometrique` | mariage | À l'unité (1-9) | **14,90 €** |
|  |  |  | Lot de 10+ (prix unitaire) | **12,90 €** |
| Ronds de serviette personnalisés | `ronds-de-serviette-bois` | mariage | À l'unité | **4,50 €** |
|  |  |  | Lot de 20 (3,50 €/pièce) | **70,00 €** |
|  |  |  | Lot de 50 (2,90 €/pièce) | **145,00 €** |
| Menu de mariage en bois gravé | `menu-de-mariage-bois-grave` | mariage | À l'unité (1-9) | **34,90 €** |
|  |  |  | Lot de 10+ (prix unitaire) | **31,90 €** |
| Plaque de porte enfant | `plaque-de-porte-enfant` | deco | Plaque personnalisée | **29,99 €** |
| Clé USB personnalisée | `cle-usb-personnalisee` | cadeaux | Clé USB gravée | **14,99 €** |
| Pyramide cristal — Gravure 3D [MASQUÉ] | `pyramide-cristal-gravure-3d` | cristal | 50 mm | **39,90 €** |
| Bracelet Homme Tressé & Acier | `bracelet-homme-cuir-tresse-acier` | bijoux | Argenté / Sans texte | **24,90 €** |
|  |  |  | Argenté / Avec texte | **28,90 €** |
|  |  |  | Doré / Sans texte | **24,90 €** |
|  |  |  | Doré / Avec texte | **28,90 €** |
|  |  |  | Noir / Sans texte | **24,90 €** |
|  |  |  | Noir / Avec texte | **28,90 €** |
| Porte-clés aspect cuir à graver | `porte-cles-cuir-a-graver` | cadeaux | Marron | **7,90 €** |
|  |  |  | Noir | **7,90 €** |
| Trophée cristal — Gravure 3D [MASQUÉ] | `trophee-cristal-vierge-3d` | cristal | 14 cm | **69,90 €** |
| Cristal Photo 3D — Vertical | `cristal-photo-3d-vertical` | cristal | Petit — 5×5×8 cm · Couple (1-2) | **39,90 €** |
|  |  |  | Moyen — 5×6×10 cm · 2-3 personnes | **59,90 €** |
|  |  |  | Grand — 6×8×12 cm · Famille (2-4) | **99,90 €** |
|  |  |  | XL — 6×10×15 cm · Grand groupe (5-6) | **149,90 €** |
| Cristal Photo 3D — Horizontal | `cristal-photo-3d-horizontal` | cristal | Petit — 8×5×5 cm · Couple (1-2) | **39,90 €** |
|  |  |  | Moyen — 10×6×5 cm · 2-3 personnes | **59,90 €** |
|  |  |  | Grand — 12×8×6 cm · Famille (2-4) | **99,90 €** |
|  |  |  | XL — 15×10×6 cm · Grand groupe (5-6) | **149,90 €** |
| Bracelet Homme Chaîne Acier | `bracelet-homme-chaine-acier` | bijoux | Argenté | **27,90 €** |
| Bracelet Femme Acier | `bracelet-femme-acier` | bijoux | Doré | **27,90 €** |
| Bracelet Empreinte Pied de Bébé | `bracelet-empreinte-pied-bebe` | bijoux | Argenté | **19,90 €** |
|  |  |  | Doré | **19,90 €** |
| Bracelet Femme Cœur | `bracelet-femme-coeur` | bijoux | Doré | **27,90 €** |
|  |  |  | Or rose | **27,90 €** |
|  |  |  | Argenté | **26,90 €** |
|  |  |  | Multicolore | **27,90 €** |
| Bracelet Femme Papillon ajouré | `bracelet-femme-papillon` | bijoux | Argenté | **27,90 €** |
|  |  |  | Doré | **27,90 €** |
|  |  |  | Noir | **24,90 €** |
|  |  |  | Or Rose | **29,90 €** |
| Bracelet Cœur argenté | `bracelet-coeur-acier` | bijoux | Argenté | **18,90 €** |
| Bracelet Maille Trombone doré | `bracelet-maille-trombone` | bijoux | Doré | **21,90 €** |
| Bracelet Ange | `bracelet-ange` | bijoux | Doré | **18,90 €** |
|  |  |  | Argenté | **18,90 €** |
| Bracelet Cœur à graver | `bracelet-coeur-a-graver-ot` | bijoux | Doré | **27,90 €** |
|  |  |  | Or Rose | **27,90 €** |
|  |  |  | Argenté | **27,90 €** |
| Collier Couple Cœur (lot de 2) | `collier-couple-coeur-lot2` | bijoux | Or Rose | **27,90 €** |
| Collier Plaque Acier | `collier-plaque-acier` | bijoux | Acier Noir | **32,90 €** |
|  |  |  | Argenté | **29,90 €** |
|  |  |  | Argenté et Noir | **33,90 €** |
|  |  |  | Doré | **33,90 €** |
|  |  |  | Noir | **30,90 €** |
| Collier Cœur scintillant doré | `collier-coeur-scintillant` | bijoux | Doré | **27,90 €** |
| Collier Perle solitaire | `collier-perle-solitaire` | bijoux | Doré | **21,90 €** |
| Collier Cœur & Zircon doré | `collier-coeur-zircon` | bijoux | Doré | **27,90 €** |
| Collier Double Cœur à graver | `collier-double-coeur` | bijoux | Doré | **37,90 €** |
|  |  |  | Or rose | **37,90 €** |
|  |  |  | Argenté | **36,90 €** |
| Collier Cœur & 2 plaques à graver | `collier-coeur-plaques` | bijoux | Doré | **37,90 €** |
|  |  |  | Or rose | **37,90 €** |
|  |  |  | Argenté | **36,90 €** |
| Collier 3 Cœurs entrelacés à graver | `collier-3coeurs` | bijoux | Doré | **37,90 €** |
| Bracelet Cœur grosse chaîne à graver | `bracelet-coeur-chaine` | bijoux | Doré | **37,90 €** |
| Bracelet cordon à plaque gravée | `bracelet-cordon-plaque` | bijoux | Noir / boucle noire | **21,90 €** |
|  |  |  | Noir / boucle acier | **21,90 €** |
|  |  |  | Gris foncé / boucle noire | **21,90 €** |
| Collier Médaillon pivotant à graver | `collier-medaillon-pivotant` | bijoux | Doré | **37,90 €** |
|  |  |  | Or rose | **37,90 €** |
|  |  |  | Argenté | **36,90 €** |
| Bracelet homme cuir & plaque à graver | `bracelet-homme-plaque-cuir` | bijoux | Noir chiné | **37,90 €** |
|  |  |  | Bleu marine chiné | **37,90 €** |
|  |  |  | Marron | **37,90 €** |
| Collier Pastille à graver recto-verso | `collier-pastille` | bijoux | Doré | **33,90 €** |
|  |  |  | Or rose | **33,90 €** |
|  |  |  | Argenté | **32,90 €** |
| Collier Cœur à graver recto-verso | `collier-coeur-grave` | bijoux | Doré | **37,90 €** |
|  |  |  | Or rose | **37,90 €** |
|  |  |  | Argenté | **36,90 €** |
| Bracelet perles à pastille gravée | `bracelet-perles-pastille` | bijoux | Doré | **37,90 €** |
|  |  |  | Argenté | **36,90 €** |
| Collier Médaillon Livre | `collier-medaillon-livre` | bijoux | Argenté | **40,90 €** |
|  |  |  | Doré | **40,90 €** |
|  |  |  | Doré et Argenté | **41,90 €** |
| Collier Couple Puzzle géométrique | `collier-couple-puzzle` | bijoux | Argenté | **19,90 €** |
|  |  |  | Or Rose | **22,90 €** |
| Collier Femme Pendentif géométrique | `collier-femme-pendentif-geometrique` | bijoux | Argenté | **26,90 €** |
|  |  |  | Arc en Ciel | **30,90 €** |
|  |  |  | Doré | **29,90 €** |
|  |  |  | Noir | **29,90 €** |
|  |  |  | Or Rose | **29,90 €** |
| Clé USB Cristal — Gravure 3D | `cle-usb-cristal-3d` | cristal | 4 Go | **17,90 €** |
| Clé USB Bois — Coffret | `cle-usb-bois-coffret` | cadeaux | 4 Go | **24,90 €** |
| Porte-clés Cristal LED Cœur — Gravure 3D | `porte-cles-cristal-led-coeur` | cristal | Cœur | **24,90 €** |
| Porte-clés Cristal LED Rectangle — Gravure 3D | `porte-cles-cristal-led-rectangle` | cristal | Rectangle | **22,90 €** |
| Pièce ronde laiton à graver | `piece-ronde-laiton` | cadeaux | Laiton | **14,90 €** |
| Verre à whisky portrait personnalisé | `verre-a-whisky-grave` | verres | À l'unité | **19,90 €** |
|  |  |  | Lot de 2 | **37,90 €** |
|  |  |  | Lot de 4 — livraison offerte | **71,90 €** |
| Verre à whisky à personnaliser | `verre-a-whisky-fete-des-peres` | verres | Verre à whisky à personnaliser | **19,90 €** |
| Verre à vin gravé | `verre-a-vin-grave` | verres | À l'unité | **12,90 €** |
|  |  |  | Lot de 2 | **24,90 €** |
|  |  |  | Lot de 4 | **49,90 €** |
| Flûte à champagne gravée | `flute-a-champagne-gravee` | verres | À l'unité | **12,90 €** |
|  |  |  | Lot de 2 | **24,90 €** |
|  |  |  | Lot de 4 | **49,90 €** |
| Carafe à whisky gravée | `carafe-a-whisky-gravee` | verres | Carafe gravée | **54,90 €** |
| Couverts enfants personnalisés | `couverts-enfants-personnalises` | deco | Jeu de 4 — couteau, fourchette, grande et petite cuillère | **34,90 €** |
| Lampe LED PSG | `lampe-led-paris-saint-germain` | deco | Lampe LED PSG | **29,90 €** |
| Lampe Arbre de Vie | `arbre-de-vie-lumineux` | deco | Lampe Arbre de Vie | **29,90 €** |
| Veilleuse Arbre de Vie Ronde | `veilleuse-arbre-de-vie-ronde` | deco | Veilleuse Arbre de Vie Ronde | **29,90 €** |
| Veilleuse Arbre de Vie au prénom | `veilleuse-arbre-de-vie-prenom` | deco | Veilleuse Arbre de Vie au prénom | **34,90 €** |
| Bougeoir Flottant | `bougeoir-mandala-bois` | deco | Bougeoir Flottant | **22,90 €** |
| Photophore fée en bois | `photophore-fee-bois` | deco | Photophore fée — bougie LED incluse | **27,90 €** |
| Bougeoir Fleur de Lotus | `bougeoir-fleur-de-lotus` | deco | Bois naturel | **16,90 €** |
| Support téléphone en bois gravé | `support-telephone-bois-grave` | deco | Texte seul | **12,90 €** |
|  |  |  | Dessin au choix | **14,90 €** |
|  |  |  | Lettre fleurie | **14,90 €** |
|  |  |  | Photo gravée | **19,90 €** |
| Support téléphone en bois ajouré | `support-telephone-bois-ajoure` | deco | Bois naturel | **12,90 €** |
| Porte-serviettes en bois — fleur | `porte-serviettes-bois-fleur` | mariage | Modèle fleur | **11,90 €** |
| Porte-serviettes colombes | `porte-serviettes-colombes` | mariage | Modèle colombes | **14,90 €** |
| Porte-stylo France | `porte-stylo-coq-coupe-du-monde` | deco | Porte-stylo France | **14,90 €** |
| Porte-stylo Portugal | `porte-stylo-portugal-coupe-du-monde` | deco | Porte-stylo Portugal | **14,90 €** |
| Porte-stylo Argentine | `porte-stylo-argentine-coupe-du-monde` | deco | Porte-stylo Argentine | **14,90 €** |
| Porte-stylo Espagne | `porte-stylo-espagne-coupe-du-monde` | deco | Porte-stylo Espagne | **14,90 €** |
| Gobelet isotherme 40 oz [MASQUÉ] | `gobelet-isotherme-40oz` | cadeaux | Crème | **39,90 €** |
|  |  |  | Blanc | **39,90 €** |
|  |  |  | Bleu marine | **39,90 €** |
|  |  |  | Rose | **39,90 €** |
| Cartes étapes bébé — têtes d'animaux | `cartes-etapes-bebe-animaux` | naissance | Lot de 12 cartes (1 à 12 mois) | **15,90 €** |
| Cartes étapes bébé — lot de 12 | `cartes-etapes-bebe-girafe` | naissance | Lot de 12 cartes (1 à 12 mois) | **29,90 €** |
| Plaque de naissance | `plaque-de-naissance` | naissance | Modèle Garçon (rond) | **14,90 €** |
|  |  |  | Modèle Fille (ovale) | **14,90 €** |
| Plaque de naissance cœur — porte-bracelet | `plaque-de-naissance-coeur` | naissance | Plaque ronde — mains en cœur | **11,90 €** |


## 25/09/2026 — Verre à vin : ajout du GRAND VERRE 47 cl (nouvelles variantes, rien de changé sur le 36 cl)
- 36 cl (inchangé) : 15,90 / 29,90 / 57,90 € — coût 3,05 €/verre.
- **47 cl (nouveau)** : **19,90 / 36,90 / 71,90 €** — coût **6,54 €/verre port compris**
  (carton de 6 à 29,23 € TTC + 10 € de port, chiffres du gérant). Même marge en € que le 36 cl
  (12,85 € l'unité · 23,80 € le lot de 2 · 45,70 € le lot de 4), arrondi à ,90.
- Repères : prix validé le 16/09 pour le devis Ludovic Noël = 18,90 / 34,90 € (calculé avec un
  port de 3,20 €) ; artisan le plus proche (Verre Créations, 46 cl cristal) = 19,90 €.
- Identifiants : `verre-vin-47-1 / -2 / -4` (stock à part ; non suivi = illimité tant que le
  gérant n'a pas saisi 100 dans Gestion → Produits & stock).
