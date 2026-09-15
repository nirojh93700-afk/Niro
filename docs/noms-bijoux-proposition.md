# 💍 NOUVEAUX NOMS DES 32 BIJOUX — proposition enregistrée, NON APPLIQUÉE

> **Demande du gérant (15/09/2026)** : « pour les bijoux, trouve-moi des noms, l'amour romantique,
> va sur Internet, les grands sites des grandes boutiques… il faut changer tous les noms des bijoux,
> mais des noms qui correspondent aux bijoux. »
> Puis : **« Enregistre ces noms, quand je te dirai tu les changeras. »**
>
> ⛔ **RIEN N'EST APPLIQUÉ.** Les noms ci-dessous attendent son « applique » / « change les noms ».
> `src/lib/products.js` est inchangé.

## ⚠️ RÈGLE TECHNIQUE À RESPECTER À L'APPLICATION

**Changer UNIQUEMENT le champ `name`** de chaque produit dans `src/lib/products.js`.

**NE PAS TOUCHER** :
- le **`slug`** (l'adresse `/produit/collier-double-coeur`) → la changer casse les liens déjà
  partagés, le référencement acquis et le flux Google Merchant Center ;
- le **`title`** (le titre Google, « Collier double cœur à graver — pendentif cœur serti de
  zircons… ») → c'est lui qui porte les mots-clés ;
- le `tagline`, les photos, les prix, les champs de gravure.

Le `name` est l'étiquette de la boutique : il s'affiche sur les vignettes, dans le panier, dans les
e-mails de commande et dans Gestion. C'est pour ça qu'on garde le mot **Collier** / **Bracelet**
devant le nom poétique — sinon la cliente ne sait plus ce qu'elle a commandé.

Après application : `npm run build`, puis **`npm run etat-bijoux`** (l'inventaire reprend les noms).

## Ce que font les grandes maisons (recherche du 15/09/2026)

- **Le prénom-modèle** : Merci Maman vend le « Collier Kate », le « Collier M » ; Petits Trésors la
  « plaque le courageux », la « plaque l'explorateur » ; Atelier de Famille la « médaille laurier ».
- **Le nom qui raconte** : Mauboussin « Toi Éternelle mon Amour », Gemmyo « Rétromantique », et le
  **Toi & Moi** historique repris par Histoire d'Or.
- **Aucune ne met la matière dans le nom** (« acier », « zircon », « ajouré ») : ça va dans la fiche.

---

## Colliers femme

| slug | Nom actuel | ➜ Nouveau nom | Pourquoi |
|---|---|---|---|
| `collier-enveloppe-message-secret` | Collier Enveloppe Message Secret | **Collier Billet Doux** | une enveloppe qui s'ouvre sur un mot d'amour |
| `collier-medaillon-coeur-ouvrable` | Collier Médaillon Cœur ouvrable | **Collier Cœur Confidences** | il s'ouvre, 4 faces à graver |
| `collier-double-coeur` | Collier Double Cœur à graver | **Collier Cœur à Cœur** | deux cœurs superposés |
| `collier-coeur-grave` | Collier Cœur à graver recto-verso | **Collier Cœur Serment** | un cœur, deux faces, une promesse |
| `collier-coeur-zircon` | Collier Cœur & Zircon doré | **Collier Cœur Enlacé** | le cœur entrelacé dans son anneau |
| `collier-coeur-scintillant` | Collier Cœur scintillant doré | **Collier Étincelle** | le pavé de zircons |
| `collier-3coeurs` | Collier 3 Cœurs entrelacés à graver | **Collier Nos Cœurs Liés** | un prénom dans chaque cœur |
| `collier-coeur-plaques` | Collier Cœur & 2 plaques à graver | **Collier Trois Mots** | trois surfaces, trois choses à dire |
| `collier-medaillon-pivotant` | Collier Médaillon pivotant à graver | **Collier Deux Secrets** | il tourne, deux faces cachées |
| `collier-medaillon-livre` | Collier Médaillon Livre | **Collier Notre Histoire** | un livre qui s'ouvre |
| `collier-pastille` | Collier Pastille à graver recto-verso | **Collier Souvenir** | la médaille qu'on garde |
| `collier-perle-solitaire` | Collier Perle solitaire | **Collier Une Perle** | une seule perle, rien d'autre |
| `collier-femme-pendentif-geometrique` | Collier Femme Pendentif géométrique | **Collier Quatre Confidences** | la barre se grave sur 4 faces |

## Bracelets femme

| slug | Nom actuel | ➜ Nouveau nom | Pourquoi |
|---|---|---|---|
| `bracelet-femme-coeur` | Bracelet Femme Cœur | **Bracelet Cœur Tendre** | le cœur doré gravé |
| `bracelet-coeur-a-graver-ot` | Bracelet Cœur à graver | **Bracelet Cœur Promesse** | la médaille cœur |
| `bracelet-coeur-chaine` | Bracelet Cœur grosse chaîne à graver | **Bracelet Grand Cœur** | la chaîne large, le grand cœur |
| `bracelet-femme-papillon` | Bracelet Femme Papillon ajouré | **Bracelet Envolée** | le papillon |
| `bracelet-femme-acier` | Bracelet Femme Acier | **Bracelet Murmure** | le bracelet fin, le mot discret |
| `bracelet-perles-pastille` | Bracelet perles à pastille gravée | **Bracelet Perles Confidence** | le rang de perles et sa pastille |
| `bracelet-coeur-acier` | Bracelet Cœur argenté | **Bracelet Cœur Ouvert** | le cœur ouvert, tel quel |
| `bracelet-maille-trombone` | Bracelet Maille Trombone doré | **Bracelet Lumière** | les gros maillons dorés |
| `bracelet-ange` | Bracelet Ange | **Bracelet Ange Gardien** | l'ange qu'on offre pour veiller |

## Homme — des noms « Le… », comme les plaques de Petits Trésors

| slug | Nom actuel | ➜ Nouveau nom | Pourquoi |
|---|---|---|---|
| `bracelet-homme-identite-gourmette` | Bracelet Homme Identité (Gourmette) | **Bracelet Le Serment** | la pièce la plus massive |
| `bracelet-homme-chaine-acier` | Bracelet Homme Chaîne Acier | **Bracelet Le Fidèle** | la chaîne simple du quotidien |
| `bracelet-homme-acier-silicone` | Bracelet Homme Acier & Silicone | **Bracelet Le Complice** | souple, tous les jours |
| `bracelet-homme-cuir-tresse-acier` | Bracelet Homme Tressé & Acier | **Bracelet Le Gardien** | le tressage protecteur |
| `bracelet-cordon-plaque` | Bracelet cordon à plaque gravée | **Bracelet Le Compagnon** | le cordon qu'on ne quitte pas |
| `bracelet-homme-plaque-cuir` | Bracelet homme cuir & plaque à graver | **Bracelet L'Inséparable** | cuir et large plaque |
| `collier-plaque-acier` | Collier Plaque Acier | **Collier L'Essentiel** | une plaque, rien de superflu |

## Couple et naissance

| slug | Nom actuel | ➜ Nouveau nom | Pourquoi |
|---|---|---|---|
| `collier-couple-coeur-lot2` | Collier Couple Cœur (lot de 2) | **Collier Toi & Moi** | le nom historique des bijoux de couple |
| `collier-couple-puzzle` | Collier Couple Puzzle géométrique | **Collier L'Autre Moitié** | les deux pièces qui s'emboîtent |
| `bracelet-empreinte-pied-bebe` | Bracelet Empreinte Pied de Bébé | **Bracelet Premier Pas** | l'empreinte, la naissance |

---

## Liste à appliquer (slug → nouveau `name`)

```
collier-enveloppe-message-secret      Collier Billet Doux
collier-medaillon-coeur-ouvrable      Collier Cœur Confidences
collier-double-coeur                  Collier Cœur à Cœur
collier-coeur-grave                   Collier Cœur Serment
collier-coeur-zircon                  Collier Cœur Enlacé
collier-coeur-scintillant             Collier Étincelle
collier-3coeurs                       Collier Nos Cœurs Liés
collier-coeur-plaques                 Collier Trois Mots
collier-medaillon-pivotant            Collier Deux Secrets
collier-medaillon-livre               Collier Notre Histoire
collier-pastille                      Collier Souvenir
collier-perle-solitaire               Collier Une Perle
collier-femme-pendentif-geometrique   Collier Quatre Confidences
bracelet-femme-coeur                  Bracelet Cœur Tendre
bracelet-coeur-a-graver-ot            Bracelet Cœur Promesse
bracelet-coeur-chaine                 Bracelet Grand Cœur
bracelet-femme-papillon               Bracelet Envolée
bracelet-femme-acier                  Bracelet Murmure
bracelet-perles-pastille              Bracelet Perles Confidence
bracelet-coeur-acier                  Bracelet Cœur Ouvert
bracelet-maille-trombone              Bracelet Lumière
bracelet-ange                         Bracelet Ange Gardien
bracelet-homme-identite-gourmette     Bracelet Le Serment
bracelet-homme-chaine-acier           Bracelet Le Fidèle
bracelet-homme-acier-silicone         Bracelet Le Complice
bracelet-homme-cuir-tresse-acier      Bracelet Le Gardien
bracelet-cordon-plaque                Bracelet Le Compagnon
bracelet-homme-plaque-cuir            Bracelet L'Inséparable
collier-plaque-acier                  Collier L'Essentiel
collier-couple-coeur-lot2             Collier Toi & Moi
collier-couple-puzzle                 Collier L'Autre Moitié
bracelet-empreinte-pied-bebe          Bracelet Premier Pas
```

32 bijoux, 32 noms. Aucun doublon.
