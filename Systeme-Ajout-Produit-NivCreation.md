# Système d'ajout d'un nouveau produit — Niv Création (app de gestion)

> Fiche de référence détaillée pour reproduire / comprendre le système d'ajout
> de produit dans une autre conversation ou une autre application.
> Basée sur le code réel (fonction `confirmAdd`).

---

## 1. Vue d'ensemble

- App **mono-fichier HTML** (vanilla JS), catalogue dans la variable globale `data` (tableau d'objets produit).
- Ajout via un **modal** (`#modal`) ouvert par le bouton « ➕ » → rempli → bouton **« ✓ Enregistrer »** = fonction `confirmAdd()`.
- Un produit = un objet poussé dans `data`, sauvegardé en local + cloud.

---

## 2. Champs du formulaire (UI)

| # | Libellé | id HTML | Type | Oblig. |
|---|---------|---------|------|--------|
| 1 | Nom du produit | `m-name` | texte | ✅ |
| 2 | Variante (description courte) | `m-var` | texte | recommandé |
| 3 | Catégorie | `m-cat` | select | ✅ |
| 4 | Type / Sous-catégorie | `m-type` | texte + datalist | non |
| 5 | Longueur (cm) | `m-dim-l` | number | non |
| 6 | Largeur (cm) | `m-dim-w` | number | non |
| 7 | Hauteur (cm) | `m-dim-h` | number | non |
| 8 | Poids (g) | `m-weight` | number | non |
| 9 | Prix achat (€) | `m-pa` | number | recommandé |
| 10 | Prix vente (€) | `m-pv` | number | ✅ |
| 11 | Quantité achetée | `m-qty` | number | ✅ |
| 12 | Seuil d'alerte stock bas | `m-threshold` | number | non (auto 20%) |
| 13 | Plusieurs tailles/variantes | section `m-sizes-section` | tableau | non |
| 14 | Tarifs dégressifs | section `m-tiers-section` | tableau | non |
| 15 | Photos (jusqu'à 4) | `m-photo-1` … `m-photo-4` | file image | recommandé |

Boutons : **Annuler** (`closeModal()`) · **✓ Enregistrer** (`confirmAdd()`).

---

## 3. Modèle de données EXACT d'un produit

Objet construit par `confirmAdd()` → `buildProduct()` :

```js
{
  name:              "Bracelet femme papillon ajouré à graver", // champ 1
  var:               "Doré",                 // champ 2 (variante)
  category:          "Bijoux personnalisés", // champ 3
  pa:                4.50,    // Prix ACHAT (champ 9)
  pv:                14.90,   // Prix VENTE (champ 10)
  qty:               4,       // Quantité achetée / stock total (champ 11)
  sold:              0,       // Quantité VENDUE (incrémentée à chaque vente)
  elec:              1.00,    // Coût électricité / production (défaut 1.00)
  notes:             "",
  imgData:           "",      // Photo principale (base64) — remplie après compression
  imgDataExtra:      [],      // Photos secondaires (base64[])
  lowStockThreshold: null,    // Seuil alerte (null = auto à 20% du stock)
  priceTiers:        [],      // Tarifs dégressifs : [{ minQty, price }, ...]
  dimensions:        "5 × 2 × 0.5 cm", // texte formaté auto
  dimL: 5, dimW: 2, dimH: 0.5,         // dimensions numériques (cm)
  weight:            30,      // poids (g) — sert au calcul frais de port

  // Ajoutés ailleurs (pas dans buildProduct) :
  qrCode:  "NIV-A1B2C3",  // code unique pour l'étiquette / le scan (généré à la demande)
  pid:     "bracelet_femme_papillon_ajoure_a_graver___dore", // clé STABLE de la photo
  _showTiers: true        // flag d'affichage si priceTiers rempli
}
```

### Notions importantes
- **Stock restant affiché = `qty - sold`** (jamais `qty` seul).
- **`pa` / `pv` / `elec`** → marge = `pv - (pa + elec)`.
- **`var` (variante)** : ⚠️ champ nommé `var` (mot réservé JS, toujours en notation `p.var` / `p["var"]`).
- **Mode « tailles multiples »** : si rempli, `confirmAdd` crée **un produit par taille** (chacun avec son `var`, `pa`, `pv`, `qty`), au lieu d'un seul.

---

## 4. Logique de `confirmAdd()`

1. Lire `m-name` → si vide, **alerte et stop**.
2. Récupérer les tailles valides (`modalSizes` avec label rempli) et les fichiers photos des 4 slots.
3. **Compresser** chaque photo (`compressImage` → base64 réduit) en parallèle.
4. Construire le(s) produit(s) :
   - Si des tailles sont saisies → 1 produit par taille.
   - Sinon → 1 seul produit (variante = `m-var`).
5. `data.push(produit)` pour chacun + `saveProductToFirebase(p, index)`.
6. `closeModal()` + rafraîchir l'affichage.

---

## 5. Système QR (étiquette + scan)

- **`qrCode`** : identifiant court unique par produit (ex. `NIV-A1B2C3`), généré par `generateUniqueQRCodeForProduct()`. C'est ce qui est encodé dans l'étiquette imprimée et reconnu au scan.
- **Impression** : `printAllProductLabels()` / `openCrafiaQR()` → PDF A4 d'étiquettes (QR + nom + variante + catégorie + branding).
- **Scan** : bouton 📷 → `openScan()` (caméra + jsQR) → `handleScanResult()` (matching par `qrCode`, sinon par nom+variante) → `showScanActionModal()` qui propose **Vendre (−stock)** ou **Ajouter au stock (+stock)**.

---

## 6. Système photo (clé stable `pid`)

- Clé d'origine = `Nom + "___" + Variante` normalisé (sans accents, minuscules, `_`).
- Figée dans **`pid`** à la 1re fois → **ne change plus** même si le produit est renommé (la photo ne se perd pas).
- Deux produits avec **nom + variante identiques** = même `pid` = même photo → à éviter.

---

## 7. Architecture de stockage (à jour, v434)

| Où | Quoi |
|----|------|
| `localStorage.niv_catalogue` | Catalogue **SANS photos** (léger — évite la limite ~5 Mo d'iOS) |
| **IndexedDB `niv_photos`** | Les photos (base64), clé = `pid` — grande capacité |
| Firestore `backup/master` | Catalogue (sans photos) + ventes + commandes + réglages |
| Firestore `photos/{pid}` | 1 document par photo `{ dataUrl, productKey, updatedAt }` |

### Flux photos
- À l'ajout : photo compressée → `imgData` (mémoire) → IndexedDB → uploadée dans `photos/{pid}` (cloud).
- Au chargement : catalogue chargé (sans photos) → photos **ré-hydratées depuis IndexedDB** → celles manquantes téléchargées depuis le cloud (`progressiveDownload`) une seule fois, puis mises en cache IndexedDB.
- ⚠️ **Ne pas stocker les photos base64 dans localStorage** (saturation → crash sur iPhone).

---

## 8. Fonctions clés (référence)

| Fonction | Rôle |
|----------|------|
| `confirmAdd()` | Crée le(s) produit(s) depuis le formulaire |
| `buildProduct(var, pa, pv, qty)` | Construit l'objet produit |
| `compressImage(file, cb)` | Compresse une photo en base64 |
| `saveData()` | Sauvegarde locale (localStorage, sans photos) |
| `saveAllToFirebase(force)` | Sync cloud (catalogue + ventes + réglages) |
| `getProductQRId(i)` / `generateUniqueQRCodeForProduct()` | IDs / codes QR |
| `openScan()` → `handleScanResult()` → `showScanActionModal()` | Scan QR → vente / réception |
| `photoKey(p)` / `ensurePids()` | Clé photo stable |
| `idbPutPhoto(key,url)` / `idbGetAllPhotos()` | Cache photos IndexedDB |

---

## 9. Notes de portage (autre appli)

- Garder le principe **`pid` stable** (clé photo indépendante du nom).
- **Photos hors de localStorage** : IndexedDB (web) ou un stockage objet (S3/Firebase Storage) — pas de base64 en localStorage.
- **Stock restant = `qty - sold`** (ne pas écraser `qty` à la vente, incrémenter `sold`).
- Champs optionnels (type, dimensions, seuil, tailles, tarifs dégressifs) repliables pour ne pas surcharger le formulaire.
