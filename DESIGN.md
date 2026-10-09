# Niv Création — monde visuel des maquettes « luxe » (09/10/2026)

> Décisions visuelles durables, écrites d'après la maquette construite (`tools/maquettes/accueil-univers.py`).
> Le SITE en ligne garde son thème actuel tant que le gérant n'a pas dit « applique ». Ce fichier sert à ce que
> toute nouvelle maquette « ressemble » à celle-ci (demande du gérant : « il faut que tout le site ressemble »).

## Idée
Une maison de gravure, pas une boutique de gadgets : du papier crème, de l'encre, l'or seulement en filet et sur les
prix ; de grandes photos de pièces gravées ; peu de boîtes, beaucoup d'air ; un mouvement lent et rare.

## Jetons (CSS `:root` de la maquette)
| Rôle | Valeur | Usage |
|---|---|---|
| `--cream` | `#fbf7ee` | fond de page |
| `--paper` | `#fdfaf3` | panneaux du menu |
| `--sand` / `--sand2` | `#f3e8d3` / `#eadbbf` | bandes secondaires (nouveautés, mur), fonds de photo |
| `--ink` / `--ink2` / `--ink3` | `#1a1206` / `#241a0c` / `#3a2e1c` | texte, bandes sombres (carafe, coffret, sur mesure, pied de page) |
| `--muted` | `#6b5f4b` | texte secondaire sur crème (contraste 5,8) |
| `--gold` / `--gold-d` / `--gold-l` | `#c9a24b` / `#a98935` / `#e2c67e` | bouton principal, filets, or sur encre |
| `--gold-t` | `#7c6120` | or LISIBLE sur crème (prix, mots en italique, liens) : contraste 5,5 |
| `--on-ink` / `--on-ink2` | `#d9ccb0` / `#b8a98a` | texte secondaire sur encre |
| `--red` / `--red2` | `#7a1512` / `#5a0e0c` | la bande de Noël seulement (rouge et or validé sur le site) |
| `--line` / `--line2` | `rgba(26,18,6,.13)` / `.26` | filets et contours |
| `--r` | `6px` | rayon des photos et cadres ; les boutons et puces sont des pilules ; le logo garde ses 10 px |

## Typographie
- Titres : **Playfair Display** 500 (la police du site), italique 500 pour le mot mis en avant, coloré `--gold-t`
  (ou `--gold-l` sur encre). Tailles fluides : h1 2,6 à 5,1 rem ; h2 2 à 3,6 rem ; interligne 1,02 à 1,08.
- Textes et interface : **Jost** 400 / 500 (proposition, à la place d'Inter) ; 16 px, interligne 1,6 ; petites
  étiquettes en capitales espacées (.14 em) uniquement pour les libellés de filtres, le ruban et le menu.
- Jamais de kicker/eyebrow au-dessus d'un titre, jamais de tiret cadratin dans nos phrases, jamais de nombre en dur.

## Composants
- **Bouton** `.btn` : pilule 52 px, libellé puis flèche dans sa pastille ronde ; or (principal), encre (secondaire),
  fantôme à filet (tertiaire). Au survol la pastille glisse de 3 px ; au clic, échelle .98.
- **Puce** `.puce` : pilule 44 px à filet, remplie encre quand elle est choisie (`aria-pressed` / `aria-current`),
  grisée à 35 % quand elle ne donnerait aucun résultat.
- **Carte produit** `.uc` : photo carrée (6 px, filet intérieur), étiquette éventuelle SOUS la photo (jamais posée
  dessus), nom Jost 500 avec soulignement or qui se dessine au survol, prix Playfair en `--gold-t`, « Prêt à
  offrir » en petit pour les pièces non gravables, « Personnaliser » qui monte sur la photo au survol, cœur en haut
  à droite visible au survol (toujours visible au doigt).
- **Tuiles d'univers / verres** : photo pleine avec dégradé encre en bas, nom en Playfair, prix ou nombre en or clair.
- **Bandes sombres** (carafe, coffret, sur mesure, pied de page) : encre, titres crème, mot en or clair.
- **Formulaire** : champs à filet or sur encre, anneau or au focus ; libellé toujours au-dessus.

## Mouvement (une seule grammaire)
- Apparition : `.rv` → `.in` (opacité + 26 px vers le haut, 1 s, `cubic-bezier(.16,1,.3,1)`), par IntersectionObserver.
- Héros : la photo se pose (zoom 1,08 → 1, saturation qui revient) pendant qu'un trait laser or la parcourt une fois.
- Photos : zoom lent (1,04 à 1,05 en 1,4 à 2 s) au survol. Menu : panneau en fondu avec un délai d'ouverture de 120 ms.
- Mur : trois rangées qui défilent (95 / 110 / 125 s), pause au survol ou sous le doigt, reprise après 4 s.
- `prefers-reduced-motion` : tout est immobile et déjà visible.

## Mise en page
- Largeur de lecture 1380 px, gouttières fluides (20 à 80 px), sections de 56 à 112 px de haut.
- Un logo centré (92 px, 64 px sur téléphone), icônes à droite, menu en capitales sur UNE ligne jusqu'à 901 px,
  tiroir en dessous. En-tête collant, légèrement translucide (seule surface floutée).
- Familles de mise en page de l'accueil, chacune une seule fois : deux colonnes (héros), colonne collante + grille
  (bijoux), rail, photo + grille 2×2 (enfant), bande sombre (carafe), mosaïque (verres), bande rouge en éventail
  (Noël), mosaïque de tuiles (univers), énoncé + trois gestes (atelier), mur défilant, centré (avis, sur mesure).
