# Spécification — Fenêtre « Ajouter un produit » (Niv Création)

> Document de référence pour reproduire le formulaire d'ajout de produit
> dans une autre application. Décrit les champs, le modèle de données et le
> système de photos.

---

## 1. Champs du formulaire (dans l'ordre d'affichage)

| # | Libellé | id (champ) | Type | Obligatoire | Rôle |
|---|---------|-----------|------|-------------|------|
| 1 | Nom du produit | `m-name` | texte | Oui | Nom principal (ex. « Bracelet argent à graver ») |
| 2 | Variante (description courte) | `m-var` | texte | Recommandé | Déclinaison (ex. « Doré, 20 cm »). Vide si tableau de tailles utilisé |
| 3 | Catégorie | `m-cat` | menu déroulant | Oui | Famille (Bijoux, Clés USB, Cristal 3D, Porte-clés…) |
| 4 | Type / Sous-catégorie | `m-type` | texte + autocomplétion | Non | Regroupe dans le catalogue (ex. « Bracelet Homme ») |
| 5a | Longueur (cm) | `m-dim-l` | nombre | Non | Dimension — sert aux frais de port |
| 5b | Largeur (cm) | `m-dim-w` | nombre | Non | Dimension |
| 5c | Hauteur (cm) | `m-dim-h` | nombre | Non | Dimension |
| 5d | Poids (g) | `m-weight` | nombre | Non | Poids emballé — calcul frais de port |
| 6 | Prix achat (€) | `m-pa` | nombre (2 déc.) | Recommandé | Coût d'achat (marge, valeur de stock) |
| 7 | Prix vente (€) | `m-pv` | nombre (2 déc.) | Oui | Prix client |
| 8 | Quantité achetée | `m-qty` | nombre entier | Oui | Stock initial |
| 9 | Seuil d'alerte stock bas | `m-threshold` | nombre | Non | Alerte. Vide → auto à 20 % du stock initial |
| 10 | Plusieurs tailles/variantes | section `m-sizes-section` | tableau | Non | Chaque taille a son prix. Si rempli, prix 6-7 ignorés |
| 11 | Tarifs dégressifs | section `m-tiers-section` | tableau | Non | Remise par quantité (paliers) |
| 12 | Photos (jusqu'à 4) | `m-photo-1..4` | fichier image | Recommandé | Photo 1 = principale (vignette) |

Boutons : **Annuler** (`closeModal()`) · **✓ Enregistrer** (`confirmAdd()`).

---

## 2. Modèle de données d'un produit

Chaque produit est un objet stocké dans le tableau global `data`.

```js
{
  name:      "Bracelet femme papillon ajouré à graver", // Nom (champ 1)
  var:       "Doré",            // Variante (champ 2)
  category:  "Bijoux personnalisés", // Catégorie (champ 3)
  type:      "Bracelet Femme",  // Type / sous-catégorie (champ 4)

  dimL:      5,    // Longueur cm  (champ 5a)
  dimW:      2,    // Largeur cm   (champ 5b)
  dimH:      0.5,  // Hauteur cm   (champ 5c)
  weight:    30,   // Poids g      (champ 5d)

  pa:        4.50, // Prix achat   (champ 6)
  pv:        14.90,// Prix vente   (champ 7)
  qty:       4,    // Quantité     (champ 8)
  threshold: 2,    // Seuil alerte (champ 9 ; sinon 20% de qty)

  // Champ 10 — tailles multiples (optionnel)
  sizes:  [ { label: "5x5x5", price: 10 }, { label: "10x10x10", price: 25 } ],
  // Champ 11 — tarifs dégressifs (optionnel)
  tiers:  [ { minQty: 1, price: 14 }, { minQty: 10, price: 12 }, { minQty: 50, price: 10 } ],

  // Photo principale (base64) — champ 12, photo 1
  imgData: "data:image/jpeg;base64,...",
  // Photos secondaires éventuelles
  photos:  [ "data:image/jpeg;base64,...", ... ],

  // Identifiant STABLE de photo (généré 1 fois, ne change jamais même si renommage)
  pid:     "bracelet_femme_papillon_ajoure_a_graver___dore"
}
```

### Règle d'identité / photo (IMPORTANT)
- Clé d'origine = `Nom + "___" + Variante`, normalisée (sans accents, minuscules,
  caractères non alphanumériques → `_`).
- Cette clé est **figée** dans `pid` à la 1re fois et **ne change plus** :
  ainsi renommer un produit **ne casse pas** le lien vers sa photo.
- Deux produits avec **Nom + Variante identiques** partageraient la même clé →
  à éviter (ils afficheraient la même photo).

---

## 3. Stockage

| Où | Quoi | Détail |
|----|------|--------|
| `localStorage.niv_catalogue` | Tout le catalogue (avec photos base64) | JSON stringifié |
| Firebase Firestore `backup/master` | Catalogue **sans** photos + ventes, commandes, réglages… | Photos retirées (limite 1 Mo/doc) |
| Firebase Firestore `photos/{pid}` | 1 document par photo | `{ dataUrl: "data:image/jpeg;base64,...", productKey, updatedAt }` |

### Synchronisation photos
- À l'ajout/modif : la photo est **compressée** si > ~675 Ko, puis envoyée dans
  la collection `photos` sous la clé `pid`.
- Au chargement : `backup/master` (sans photos) est chargé, puis les photos sont
  téléchargées progressivement depuis la collection `photos` (1 par 1, avec reprise).
- Un cache « photo absente » évite de relire en boucle une photo inexistante
  (économie de lectures Firebase).

---

## 4. Logique d'enregistrement (`confirmAdd`)
1. Lire tous les champs du formulaire.
2. Validation minimale : `name` non vide, `pv` renseigné, `qty ≥ 1`.
3. Construire l'objet produit (modèle §2) + générer `pid` si absent.
4. `data.push(produit)` puis sauvegarde locale (`niv_catalogue`) + sync Firebase.
5. Uploader chaque photo dans `photos/{pid}`.
6. Rafraîchir l'affichage du catalogue.

---

## 5. Notes de portage vers une autre appli
- Si l'autre appli n'utilise pas Firebase : remplacer §3 par ton backend
  (les photos peuvent aller dans un stockage objet type S3/Storage plutôt
  qu'en base64 — recommandé pour les performances et le coût).
- Garder le principe **`pid` stable** = la meilleure protection contre la perte
  de photos lors des renommages.
- Les champs **optionnels** (type, dimensions, seuil, tailles, tarifs dégressifs)
  peuvent être masqués derrière des sections repliables pour ne pas surcharger.
