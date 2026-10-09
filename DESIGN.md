# Niv Création — monde visuel des maquettes, direction « Mélange » (09/10/2026)

> Décisions visuelles durables, écrites d'après la maquette construite (`tools/maquettes/accueil-univers.py`).
> Le gérant a refusé la version « luxe » (éditoriale, calme, beaucoup de crème vide, petites capitales, listes de puces)
> puis a choisi « Mélange » parmi trois pistes. Le SITE en ligne garde son thème tant qu'il n'a pas dit « applique ».
> Ce fichier sert à ce que toute nouvelle maquette « ressemble » à celle-ci (« il faut que tout le site ressemble »).
> Il se juge d'abord sur téléphone (390 px) : c'est là que le gérant regarde.

## Idée
Trois pistes réunies dans un seul monde :
- **L'écrin (piste A)** pour ce qui doit impressionner : le haut de page, la carafe édition limitée, le sur mesure.
  Encre `#241a0c`, halo or en radial, cadre doré à double filet autour de la photo, trait laser qui la parcourt une fois,
  reflet lent, ruban or qui défile avec les quatre preuves (gravé en France · 4,8/5 sur 286 avis · livraison offerte dès
  45 € sur les bijoux · paiement sécurisé).
- **Le parcours (piste C)** pour tout ce qui demande un choix : « Trouver le bon cadeau » en trois étapes numérotées
  (① Pour qui ② Pour quelle occasion ③ Quel budget), cartes blanches à cocher sur fond sable, exactement comme les
  fiches produit du site (parcours guidé = la référence). Même grammaire pour « l'atelier en trois gestes » et pour la
  tuile « Offrir » de « Nos univers ».
- **Le plein cadre (piste B)** pour les bijoux : grande photo d'ambiance sur toute la largeur, panneau de verre dépoli
  posé dessus (titre, trois bijoux, raccourcis, bouton).
- Partout ailleurs, le ton chaleureux de la piste C : crème et sable, photos arrondies à 20 px, cartes blanches à ombre
  douce, bouton or en dégradé. Jamais de grande surface vide, jamais de liste de puces-formulaire.

## Jetons (CSS `:root` de la maquette)
| Rôle | Valeur | Usage |
|---|---|---|
| `--cream` / `--paper` | `#fbf7ee` / `#fdfaf3` | fond de page, panneaux du menu |
| `--sand` / `--sand2` | `#f3e8d3` / `#eadbbf` | parcours « Trouver un cadeau », Bébé & Enfant, le mur, puces, tuile Offrir |
| `--ink` / `--ink2` / `--ink3` | `#1a1206` / `#241a0c` / `#3a2e1c` | texte ; écrins (héros, carafe, sur mesure, coffret, pied de page) |
| `--muted` | `#6b5f4b` | texte secondaire sur crème (contraste 5,8) |
| `--gold` / `--gold-d` / `--gold-l` | `#c9a24b` / `#a98935` / `#e2c67e` | bouton or (dégradé `gold-l → gold`), filets du cadre, or sur encre |
| `--gold-t` | `#7c6120` | or LISIBLE sur crème : prix, mots en italique, liens (contraste 5,5) |
| `--on-ink` / `--on-ink2` | `#d9ccb0` / `#b8a98a` | texte secondaire sur encre |
| `--red` / `--red2` | `#7a1512` / `#5a0e0c` | la bande de Noël seulement (rouge et or validé sur le site) |
| `--r` / `--r2` / `--r3` | `20px` / `14px` / `28px` | photos et tuiles / puces et petites photos / panneaux (verre, coffret, carafe, Offrir) |
| `--sh` | ombre douce | cartes blanches (parcours, atelier), grande photo Bébé & Enfant |
Le cadre doré de l'écrin garde ses angles presque droits (6 px, filet intérieur à 5 px) : c'est un cadre, pas une carte.

## Typographie
- Titres : **Playfair Display** 600 (la police du site), un mot en italique 500 coloré `--gold-t` (ou `--gold-l` sur encre).
  h1 2,4 à 4,6 rem ; h2 1,9 à 3 rem ; titres d'étape 1,3 rem ; interligne 1,04 à 1,08.
- Textes et interface : **Inter** 400 / 500 / 600 (la police du site, Jost abandonné) ; 16 px, interligne 1,55.
- Capitales espacées UNIQUEMENT sur le ruban or et la pastille « Édition limitée » (signatures de l'écrin). Les libellés de
  filtres sont en Inter 600 normal, les titres d'étape en Playfair. Jamais de kicker au-dessus d'un titre, jamais de
  tiret cadratin dans nos phrases, jamais de nombre en dur dans un texte.

## Composants
- **Bouton** `.btn` : pilule 52 px, libellé puis flèche ; or en dégradé avec ombre dorée (principal), encre (secondaire,
  passe or au survol), filet (tertiaire, or clair sur encre). Au survol il se soulève de 2 px, la flèche glisse de 3 px.
- **Carte à cocher** `.fc` (parcours) : blanche, 18 px d'arrondi, icône or au trait, libellé Inter 600, bord or quand
  elle est choisie + pastille or avec une coche (en ligne sur les cartes de budget) ; grisée à 35 % quand elle ne
  donnerait aucun résultat ; une seule par étape.
- **Puce** `.puce` (rayons, filtres, onglets, raccourcis) : pavé sable 14 px, encre quand choisie, 44 px minimum.
- **Carte produit** `.uc` : photo carrée arrondie 20 px, étiquette SOUS la photo (Nouveau, Best-seller, Naissance…),
  nom Inter 600, prix Playfair `--gold-t`, « Prêt à offrir » pour les pièces non gravables, « Personnaliser » qui monte
  sur la photo au survol, cœur en haut à droite (toujours visible au doigt, 44 px).
- **Cadre doré** `.frame` : double filet or sur encre, photo 4:5 (héros) ou carrée (carafe), étiquette nom + prix en
  bas à gauche, reflet toutes les 5 s, laser une fois au chargement (masqué sur téléphone).
- **Panneau de verre** `.glass` : crème à 80 % + flou 14 px, 28 px d'arrondi, posé sur une photo plein cadre.
- **Écrins** (héros, carafe, sur mesure, coffret) : encre, halo or, titres blancs, mot en or clair.
- **Tuiles** (univers, verres, Bébé & Enfant) : photo pleine arrondie 20 px, dégradé encre en bas, nom en Playfair.

## Mouvement (une seule grammaire)
- Apparition : `.rv` → `.in` (opacité + 22 px vers le haut, 0,9 s, `cubic-bezier(.16,1,.3,1)`) par IntersectionObserver.
- Écrin : la photo se pose (zoom 1,06 → 1), le laser la parcourt une fois, le reflet revient toutes les 5 s.
- Ruban or : défilement linéaire 40 s. Le mur : trois rangées (95 / 110 / 125 s), pause au survol ou sous le doigt.
  Ce sont les deux seuls défilements automatiques de la page (assumés : signatures de la piste A et du site).
- Photos : zoom lent (1,04 à 1,05 en 1,2 à 2 s) au survol. Menu : panneau en fondu, délai d'ouverture 120 ms.
- `prefers-reduced-motion` : tout est immobile et déjà visible.

## Mise en page
- Largeur de lecture 1300 px (1100 px pour le parcours), gouttières fluides (16 à 72 px), sections de 44 à 96 px.
- En-tête du site : logo centré (92 px, 64 px sur téléphone, arrondi 10 px, intouché), icônes à droite, menu en pavés
  (8 entrées, panneaux au survol) sur une ligne jusqu'à 1021 px, tiroir en dessous. En-tête collant, légèrement translucide.
- Ordre de l'accueil : écrin cristal → ruban → trois étapes → bijoux sur photo → dernières sorties (rail) → Bébé & Enfant
  + coffret → carafe (écrin) → verres en mosaïque → Noël (rouge et or, éventail) → Nos univers + tuile Offrir →
  l'atelier (énoncé + trois gestes) → le mur → avis → sur mesure (écrin) → pied de page.
- Téléphone (≤ 640 px) : écrin empilé (texte puis cadre), cartes du parcours 2 par ligne (la dernière seule sur toute la
  largeur, budget 3 par ligne), cartes produit 2 par ligne, rail à 68 %, verres 2 par ligne, univers 2 par ligne.
