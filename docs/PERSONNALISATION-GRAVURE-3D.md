# 🛠️ Guide — Personnalisation gravure + Aperçu 3D (Niv Création)

> Mémo technique : comment fonctionne la **personnalisation de gravure** et l'**aperçu 3D**
> du collier barre, et **comment l'appliquer à un autre produit** rapidement.
> (Référence pour les futures sessions — relire ce fichier avant d'ajouter un produit 3D.)

---

## 1. Vue d'ensemble
Le collier barre (`collier-femme-pendentif-geometrique`) propose :
- **4 faces** gravables, chacune avec **texte** + **motif** + **position du motif** (haut/bas)
- **Sens du nom** (du bas vers le haut / du haut vers le bas)
- **Police de gravure** (les 8 polices du site)
- Un **aperçu 3D** photo-réaliste (Three.js) : barre métallique + chaîne, gravure en relief,
  motifs (fleurs images ou symboles), qui **change de couleur** selon la finition et que le
  client **fait pivoter**.

---

## 2. Activer ça sur un produit  → `src/lib/products.js`
Ajouter au produit :

```js
{
  slug: "...",
  category: "bijoux",
  engrave3d: true, // ← ACTIVE l'aperçu 3D (forme barre)
  // ... name, title, weight, variants (finitions : Argenté/Doré/Noir/Or Rose/Arc en Ciel) ...
  personalizationFields: [
    { key: "face1", label: "Face 1 — texte", placeholder: "Ex. un prénom", maxLength: 23, optional: true },
    { key: "motif1", type: "motif", label: "Face 1 — motif (facultatif)", optional: true, options: MOTIF_OPTIONS },
    { key: "motifPos1", type: "select", label: "Face 1 — motif placé", optional: true,
      options: [{ value: "above", label: "Au-dessus du nom" }, { value: "below", label: "En dessous du nom" }] },
    // ... idem face2 / face3 / face4 (motif2/motifPos2, etc.) ...
    { key: "sens", type: "select", label: "Sens du nom", optional: true,
      options: [{ value: "up", label: "Du bas vers le haut" }, { value: "down", label: "Du haut vers le bas" }] },
    { key: "police", type: "font", label: "Police de gravure", optional: true },
    { key: "note", type: "note", text: "..." },
  ],
}
```

**Important** : `import { MOTIF_OPTIONS } from "@/lib/motifs";` est déjà en haut de `products.js`.

### Conventions de clés (le 3D les lit automatiquement)
- Textes des faces : `face1` … `face4` (dans cet ordre = faces avant/arrière/droite/gauche)
- Motifs : `motif1` … `motif4`
- Position motif : `motifPos1` … `motifPos4` (`above` / `below`)
- Sens du nom : `sens` (`up` par défaut / `down`)
- Police : champ `type: "font"` (n'importe quelle clé, ici `police`)

---

## 3. Les motifs  → `src/lib/motifs.js`
Source unique des motifs. Deux types :
- **`kind: "image"`** → vrai dessin (URL hébergée Shopify). Affiché à l'identique sur le 3D
  (le fond clair est rendu transparent, lignes → noir gravé, via détourage automatique).
- **`kind: "glyph"`** → symbole monochrome (♥ ★ ∞ ☾), avec une vignette SVG dans `/public/motifs/`.

**Ajouter une fleur** : uploader le dessin (fond blanc de préférence) sur Shopify → Fichiers,
copier le lien, puis ajouter une ligne :
```js
{ value: "fleurX", label: "Fleur — modèle X", kind: "image", url: "https://cdn.shopify.com/.../xxx.jpg" },
```
→ Elle apparaît automatiquement dans le **sélecteur à vignettes** ET dans le **3D**.
⚠️ Éviter les **captures d'écran** (fond gris, UI) : utiliser une image propre du dessin seul.

---

## 4. Le composant 3D  → `src/components/Engrave3D.jsx`
Vraie 3D WebGL (lib `three`). Props :
| Prop | Rôle |
|---|---|
| `faces` | tableau des 4 textes |
| `motifs` | tableau des 4 valeurs de motif (clé) |
| `motifPositions` | tableau des 4 positions (`above`/`below`) |
| `finish` | finition métal (silver/gold/rose/black/rainbow) |
| `fontKey` | police choisie (utilise les vraies polices du site) |
| `direction` | `up` (nom part du bas) / `down` |
| `height` | hauteur du rendu (360 normal, 200 pour le mini) |
| `showHint` | affiche/masque les légendes |

Détails de rendu : `MeshPhysicalMaterial` métal + `RoomEnvironment` (reflets studio, gratuit),
gravure en **relief** (bumpMap), chaîne + bélière, rotation auto + au doigt.
La finition est déduite du **titre de la variante** (Argenté→silver, Doré→gold, etc.) dans
`ProductDetail.jsx` (`FINISH_MAP`).

---

## 5. Le sélecteur de motifs à vignettes  → `src/components/MotifPicker.jsx`
- Affiche chaque motif en **vignette** (image ou SVG).
- **Survol souris (PC uniquement)** : aperçu agrandi au-dessus du curseur (désactivé sur tactile).

---

## 6. Placement de l'aperçu 3D (PC vs mobile)  → `ProductDetail.jsx` + `globals.css`
- **PC** : le 3D est sous la photo (colonne gauche), **collant** (`.engrave3d-sticky`) et suit
  le défilement ; un `.engrave3d-spacer` (≈1050px) contrôle **jusqu'où** il descend (police de gravure).
- **Mobile** : le grand 3D est **en bas** (après les faces) + un **mini-3D flottant**
  (`.engrave3d-mini`, coin bas-droite) apparaît quand la photo sort de l'écran et disparaît
  quand on atteint le grand 3D (détection via `IntersectionObserver` sur la photo et le grand 3D).
- Détection PC/mobile : `matchMedia("(min-width: 901px)")` → état `isWide`.

---

## 7. RECETTE pour un nouveau produit « barre/plaque à graver »
1. Dans `products.js` : copier le bloc `personalizationFields` du collier barre, mettre `engrave3d: true`.
2. Mettre les bonnes **variantes** (finitions) — les noms pilotent la couleur du 3D.
3. Si nouveaux **motifs** : les ajouter dans `src/lib/motifs.js`.
4. `npm run build` → commit → push (Netlify redéploie).
5. Régler la zone de gravure si besoin via l'admin (onglet **Gravure**) — mais le 3D, lui, est automatique.

> ⚠️ Le 3D actuel = forme **barre** (parallélépipède). Pour une autre forme (plaque large,
> dog tag, médaille ronde), il faudra ajuster la géométrie dans `Engrave3D.jsx` (BoxGeometry →
> autres dimensions / autre forme).

---

## 8. Fichiers concernés (récap)
| Fichier | Rôle |
|---|---|
| `src/lib/products.js` | champs de perso + flag `engrave3d` par produit |
| `src/lib/motifs.js` | liste des motifs (fleurs images + symboles) |
| `src/components/Engrave3D.jsx` | le rendu 3D WebGL |
| `src/components/MotifPicker.jsx` | sélecteur de motifs à vignettes + zoom survol |
| `src/components/ProductDetail.jsx` | branche tout (champs, 3D PC/mobile, mini flottant) |
| `src/app/globals.css` | `.engrave3d-sticky`, `.engrave3d-spacer`, `.engrave3d-mini`, anti-débordement |
| `public/motifs/` | vignettes SVG des symboles |
