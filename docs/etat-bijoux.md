# 💍 État des bijoux — config exacte, prix affichés, gravures

> **FICHIER GÉNÉRÉ — ne pas le modifier à la main.** Régénérer avec `npm run etat-bijoux`
> après toute modification de `src/lib/products.js`. Il sert à retrouver l'état réglé
> d'un bijou depuis n'importe quelle conversation, sans relire le code.

> Généré le 2026-09-15 · 32 bijoux dans le code, dont 27 gravables et 5 vendus tels quels (aucune gravure — ne rien leur ajouter).

⚠️ **Ce document reflète le CODE.** Les prix, options et champs de gravure peuvent être
réécrits depuis **Gestion → Produits & stock** : l'admin **prime toujours** sur le code
(`applyOverride` dans `src/lib/catalog.js`). Un écart entre ce document et la fiche en
ligne signifie qu'un réglage a été enregistré dans l'admin — c'est là qu'il faut le corriger.

**Prix affichés** = `roundTo90(prix du code × 0,9)` barré, puis **−10 %** payés (remise bijoux
permanente). **Les suppléments de gravure ne sont PAS remisés** : +3 € = 3 € pile.

---

## Vue d'ensemble

| Bijou | Rayon | Prix payé | Gravure | Ce qui est facturé |
|---|---|---|---|---|
| **Collier Enveloppe Message Secret** | femme | 22,41 € – 24,21 € | comprise dans le prix | — |
| **Collier Médaillon Cœur ouvrable** | femme | 31,41 € – 36,81 € | comprise dans le prix | photo +8 € · chaque page en plus +5 € |
| **Bracelet Homme Identité (Gourmette)** | homme | 25,11 € | **payante** | texte +4,50 € |
| **Bracelet Homme Acier & Silicone** | homme | 21,51 € | **payante** | texte +5,40 € |
| **Bracelet Homme Tressé & Acier** | homme | 20,61 € – 23,31 € | **payante** | texte +3 € |
| **Bracelet Homme Chaîne Acier** | homme | 31,41 € | comprise dans le prix | — |
| **Bracelet Femme Acier** | femme | 22,41 € | comprise dans le prix | — |
| **Bracelet Empreinte Pied de Bébé** | bebe | 16,11 € | comprise dans le prix | — |
| **Bracelet Femme Cœur** | femme | 21,51 € – 22,41 € | comprise dans le prix | — |
| **Bracelet Femme Papillon ajouré** | femme | 20,61 € – 24,21 € | comprise dans le prix | — |
| **Bracelet Cœur argenté** | femme | 15,21 € | _pas de gravure_ | — |
| **Bracelet Maille Trombone doré** | femme | 17,91 € | _pas de gravure_ | — |
| **Bracelet Ange** | femme | 15,21 € | _pas de gravure_ | — |
| **Bracelet Cœur à graver** | femme | 22,41 € | **payante** | recto +3 € · verso +3 € |
| **Collier Couple Cœur (lot de 2)** | couple | 31,41 € | comprise dans le prix | — |
| **Collier Plaque Acier** | homme | 24,21 € – 27,81 € | comprise dans le prix | photo +8 € · chaque page en plus +5 € |
| **Collier Cœur scintillant doré** | femme | 22,41 € | _pas de gravure_ | — |
| **Collier Perle solitaire** | femme | 17,91 € | _pas de gravure_ | — |
| **Collier Cœur & Zircon doré** | femme | 22,41 € | **payante** | texte +2,70 € |
| **Collier Double Cœur à graver** | femme | 29,61 € – 30,51 € | **payante** | recto +3 € · verso +3 € |
| **Collier Cœur & 2 plaques à graver** | femme | 29,61 € – 30,51 € | **payante** | coeur +3 € · plaque1 +3 € · plaque2 +3 € |
| **Collier 3 Cœurs entrelacés à graver** | femme | 30,51 € | **payante** | coeur1 +3 € · coeur2 +3 € · coeur3 +3 € |
| **Bracelet Cœur grosse chaîne à graver** | femme | 30,51 € | **payante** | recto +3 € · verso +3 € |
| **Bracelet cordon à plaque gravée** | homme | 17,91 € | **payante** | texte +3 € |
| **Collier Médaillon pivotant à graver** | femme | 29,61 € – 30,51 € | **payante** | recto +3 € · verso +3 € |
| **Bracelet homme cuir & plaque à graver** | homme | 30,51 € | **payante** | texte +3 € |
| **Collier Pastille à graver recto-verso** | femme | 26,91 € – 27,81 € | **payante** | recto +3 € · verso +3 € |
| **Collier Cœur à graver recto-verso** | femme | 29,61 € – 30,51 € | **payante** | recto +3 € · verso +3 € |
| **Bracelet perles à pastille gravée** | femme | 29,61 € – 30,51 € | **payante** | texte +3 € |
| **Collier Médaillon Livre** | femme | 33,21 € – 34,11 € | comprise dans le prix | page1 +5 € · page2 +5 € · page3 +5 € |
| **Collier Couple Puzzle géométrique** | couple | 16,11 € – 18,81 € | comprise dans le prix | — |
| **Collier Femme Pendentif géométrique** | femme | 21,51 € – 25,11 € | comprise dans le prix | face2 +3 € · face3 +3 € · face4 +3 € |

---

## Fiche par fiche

### Collier Enveloppe Message Secret

`collier-enveloppe-message-secret` · /produit/collier-enveloppe-message-secret

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 120 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Recto uniquement / Doré | 27,90 € | 24,90 € | **22,41 €** | env-dore |
| Recto uniquement / Argent | 27,90 € | 24,90 € | **22,41 €** | env-argent |
| Recto uniquement / Or Rose | 27,90 € | 24,90 € | **22,41 €** | env-rose |
| Recto-Verso / Doré | 29,90 € | 26,90 € | **24,21 €** | env-dore |
| Recto-Verso / Argent | 29,90 € | 26,90 € | **24,21 €** | env-argent |
| Recto-Verso / Or Rose | 29,90 € | 26,90 € | **24,21 €** | env-rose |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver — recto | texte (40 car.) | oui | — | toujours |
| Texte à graver — verso | texte (40 car.) | non | — | si l'option contient « Recto-Verso » |
| Police de gravure | font | non | — | toujours |

---

### Collier Médaillon Cœur ouvrable

`collier-medaillon-coeur-ouvrable` · /produit/collier-medaillon-coeur-ouvrable

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 150 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argent | 38,90 € | 34,90 € | **31,41 €** | — |
| Doré | 38,90 € | 34,90 € | **31,41 €** | — |
| Bicolore (Or & Argent) | 44,90 € | 40,90 € | **36,81 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Gravure — Couverture (texte inclus) | texte (15 car.) | oui | — | toujours |
| Gravure — Page 1 (+5 €) | texte (15 car.) | non | — | toujours |
| Gravure — Page 2 (+5 €) | texte (15 car.) | non | — | toujours |
| Gravure — Page 3 (+5 €) | texte (15 car.) | non | — | toujours |
| Gravure — Dos (+5 €) | texte (15 car.) | non | — | toujours |
| Police de gravure | font | non | — | toujours |
| Photo à graver (+8 €) | photo | non | +8 € | toujours |
| Sur quelle page graver la photo ? | select | oui | — | toujours |

**Ce que paie la cliente** (option « Argent »)

- sans rien graver : **31,41 €**
- + photo : **39,41 €**
- + chaque page en plus : **39,41 €**

---

### Bracelet Homme Identité (Gourmette)

`bracelet-homme-identite-gourmette` · /produit/bracelet-homme-identite-gourmette

- **Rayon** : bijoux / homme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 160 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Acier inoxydable | 30,90 € | 27,90 € | **25,11 €** | gourm |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver (+4,50 €) | texte (30 car.) | non | +4.5 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Acier inoxydable »)

- sans rien graver : **25,11 €**
- + texte : **29,61 €**

---

### Bracelet Homme Acier & Silicone

`bracelet-homme-acier-silicone` · /produit/bracelet-homme-acier-silicone

- **Rayon** : bijoux / homme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 100 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Plaque argentée | 26,90 € | 23,90 € | **21,51 €** | sil-argent |
| Plaque noire | 26,90 € | 23,90 € | **21,51 €** | sil-noire |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver (+5,40 €) | texte (30 car.) | non | +5.4 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Plaque argentée »)

- sans rien graver : **21,51 €**
- + texte : **26,91 €**

---

### Bracelet Homme Tressé & Acier

`bracelet-homme-cuir-tresse-acier` · /produit/bracelet-homme-cuir-tresse-acier

- **Rayon** : bijoux / homme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 90 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté / Sans texte | 24,90 € | 22,90 € | **20,61 €** | cuir-argent |
| Argenté / Avec texte | 28,90 € | 25,90 € | **23,31 €** | cuir-argent |
| Doré / Sans texte | 24,90 € | 22,90 € | **20,61 €** | cuir-dore |
| Doré / Avec texte | 28,90 € | 25,90 € | **23,31 €** | cuir-dore |
| Noir / Sans texte | 24,90 € | 22,90 € | **20,61 €** | cuir-noire |
| Noir / Avec texte | 28,90 € | 25,90 € | **23,31 €** | cuir-noire |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver (+3 €) | texte (30 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Argenté / Sans texte »)

- sans rien graver : **20,61 €**
- + texte : **23,61 €**

---

### Bracelet Homme Chaîne Acier

`bracelet-homme-chaine-acier` · /produit/bracelet-homme-chaine-acier

- **Rayon** : bijoux / homme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 120 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 38,90 € | 34,90 € | **31,41 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver | texte (30 car.) | oui | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Bracelet Femme Acier

`bracelet-femme-acier` · /produit/bracelet-femme-acier

- **Rayon** : bijoux / femme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 80 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 27,90 € | 24,90 € | **22,41 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver | texte (30 car.) | oui | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Bracelet Empreinte Pied de Bébé

`bracelet-empreinte-pied-bebe` · /produit/bracelet-empreinte-pied-bebe

- **Rayon** : bijoux / bebe · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 70 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 19,90 € | 17,90 € | **16,11 €** | — |
| Doré | 19,90 € | 17,90 € | **16,11 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Prénom et/ou date de naissance | texte (20 car.) | oui | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Bracelet Femme Cœur

`bracelet-femme-coeur` · /produit/bracelet-femme-coeur

- **Rayon** : bijoux / femme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 80 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 27,90 € | 24,90 € | **22,41 €** | — |
| Or rose | 27,90 € | 24,90 € | **22,41 €** | — |
| Argenté | 26,90 € | 23,90 € | **21,51 €** | — |
| Multicolore | 27,90 € | 24,90 € | **22,41 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver | texte (25 car.) | oui | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Bracelet Femme Papillon ajouré

`bracelet-femme-papillon` · /produit/bracelet-femme-papillon

- **Rayon** : bijoux / femme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 80 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 27,90 € | 24,90 € | **22,41 €** | — |
| Doré | 27,90 € | 24,90 € | **22,41 €** | — |
| Noir | 24,90 € | 22,90 € | **20,61 €** | — |
| Or Rose | 29,90 € | 26,90 € | **24,21 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver | texte (25 car.) | oui | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Bracelet Cœur argenté

`bracelet-coeur-acier` · /produit/bracelet-coeur-acier

- **Rayon** : bijoux / femme · type « Bracelet »
- **Ajouté le** : 2026-07-31
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui
- **Gravure : AUCUNE** — ce bijou se vend tel quel. ⛔ Ne rien ajouter ici.

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 18,90 € | 16,90 € | **15,21 €** | bracelet-coeur-acier |

---

### Bracelet Maille Trombone doré

`bracelet-maille-trombone` · /produit/bracelet-maille-trombone

- **Rayon** : bijoux / femme · type « Bracelet »
- **Ajouté le** : 2026-08-01
- **Livraison** : 35 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui
- **Gravure : AUCUNE** — ce bijou se vend tel quel. ⛔ Ne rien ajouter ici.

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 21,90 € | 19,90 € | **17,91 €** | bracelet-maille-trombone |

---

### Bracelet Ange

`bracelet-ange` · /produit/bracelet-ange

- **Rayon** : bijoux / femme · type « Bracelet »
- **Ajouté le** : 2026-08-01
- **Livraison** : 35 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui
- **Gravure : AUCUNE** — ce bijou se vend tel quel. ⛔ Ne rien ajouter ici.

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 18,90 € | 16,90 € | **15,21 €** | bracelet-ange-dore |
| Argenté | 18,90 € | 16,90 € | **15,21 €** | bracelet-ange-argente |

---

### Bracelet Cœur à graver

`bracelet-coeur-a-graver-ot` · /produit/bracelet-coeur-a-graver-ot

- **Rayon** : bijoux / femme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-07-31
- **Livraison** : 55 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 27,90 € | 24,90 € | **22,41 €** | bracelet-coeur-ot-dore |
| Or Rose | 27,90 € | 24,90 € | **22,41 €** | bracelet-coeur-ot-rose |
| Argenté | 27,90 € | 24,90 € | **22,41 €** | bracelet-coeur-ot-argent |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte au recto (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Texte au verso (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **22,41 €**
- + recto : **25,41 €**
- + verso : **28,41 €**

---

### Collier Couple Cœur (lot de 2)

`collier-couple-coeur-lot2` · /produit/collier-couple-coeur-lot2

- **Rayon** : bijoux / couple · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 90 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Or Rose | 38,90 € | 34,90 € | **31,41 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte — pendentif 1 | texte (20 car.) | oui | — | toujours |
| Texte — pendentif 2 | texte (20 car.) | non | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Collier Plaque Acier

`collier-plaque-acier` · /produit/collier-plaque-acier

- **Rayon** : bijoux / homme · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 90 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Acier Noir | 32,90 € | 29,90 € | **26,91 €** | — |
| Argenté | 29,90 € | 26,90 € | **24,21 €** | — |
| Argenté et Noir | 33,90 € | 30,90 € | **27,81 €** | — |
| Doré | 33,90 € | 30,90 € | **27,81 €** | — |
| Noir | 30,90 € | 27,90 € | **25,11 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver — recto (inclus) | texte (30 car.) | non | — | toujours |
| Texte à graver — verso (+5 €) | texte (30 car.) | non | — | toujours |
| Police de gravure | font | non | — | toujours |
| Photo à graver (+8 €) | photo | non | +8 € | toujours |
| Photo gravée sur quelle face ? (à choisir) | select | oui | — | toujours |
| Texte placé par rapport à la photo | select | non | — | toujours |

**Ce que paie la cliente** (option « Acier Noir »)

- sans rien graver : **26,91 €**
- + photo : **34,91 €**
- + chaque page en plus : **34,91 €**

---

### Collier Cœur scintillant doré

`collier-coeur-scintillant` · /produit/collier-coeur-scintillant

- **Rayon** : bijoux / femme · type « Collier »
- **Ajouté le** : 2026-08-01
- **Livraison** : 35 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui
- **Gravure : AUCUNE** — ce bijou se vend tel quel. ⛔ Ne rien ajouter ici.

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 27,90 € | 24,90 € | **22,41 €** | collier-coeur-scintillant |

---

### Collier Perle solitaire

`collier-perle-solitaire` · /produit/collier-perle-solitaire

- **Rayon** : bijoux / femme · type « Collier »
- **Ajouté le** : 2026-08-01
- **Livraison** : 35 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui
- **Gravure : AUCUNE** — ce bijou se vend tel quel. ⛔ Ne rien ajouter ici.

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 21,90 € | 19,90 € | **17,91 €** | collier-perle-solitaire |

---

### Collier Cœur & Zircon doré

`collier-coeur-zircon` · /produit/collier-coeur-zircon

- **Rayon** : bijoux / femme · type « Collier cadeau »
- **Ajouté le** : 2026-07-31
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 27,90 € | 24,90 € | **22,41 €** | collier-coeur-zircon |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver (+2,70 €) | texte (15 car.) | non | +2.7 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **22,41 €**
- + texte : **25,11 €**

---

### Collier Double Cœur à graver

`collier-double-coeur` · /produit/collier-double-coeur

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | collier-double-coeur-dore |
| Or rose | 37,90 € | 33,90 € | **30,51 €** | collier-double-coeur-orrose |
| Argenté | 36,90 € | 32,90 € | **29,61 €** | collier-double-coeur-argente |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte au recto (+3 €) | texte (16 car.) | non | +3 € | toujours |
| Texte au verso (+3 €) | texte (16 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + recto : **33,51 €**
- + verso : **36,51 €**

---

### Collier Cœur & 2 plaques à graver

`collier-coeur-plaques` · /produit/collier-coeur-plaques

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | collier-coeur-plaques-dore |
| Or rose | 37,90 € | 33,90 € | **30,51 €** | collier-coeur-plaques-orrose |
| Argenté | 36,90 € | 32,90 € | **29,61 €** | collier-coeur-plaques-argente |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Gravure — le cœur (+3 €) | texte (12 car.) | non | +3 € | toujours |
| Gravure — plaque 1 (+3 €) | texte (14 car.) | non | +3 € | toujours |
| Gravure — plaque 2 (+3 €) | texte (14 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + coeur : **33,51 €**
- + plaque1 : **36,51 €**
- + plaque2 : **39,51 €**

---

### Collier 3 Cœurs entrelacés à graver

`collier-3coeurs` · /produit/collier-3coeurs

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | collier-3coeurs-dore |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Prénom — 1er cœur (+3 €) | texte (12 car.) | non | +3 € | toujours |
| Prénom — 2e cœur (+3 €) | texte (12 car.) | non | +3 € | toujours |
| Prénom — 3e cœur (+3 €) | texte (12 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + coeur1 : **33,51 €**
- + coeur2 : **36,51 €**
- + coeur3 : **39,51 €**

---

### Bracelet Cœur grosse chaîne à graver

`bracelet-coeur-chaine` · /produit/bracelet-coeur-chaine

- **Rayon** : bijoux / femme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 60 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | bracelet-coeur-chaine-dore |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte au recto (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Texte au verso (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + recto : **33,51 €**
- + verso : **36,51 €**

---

### Bracelet cordon à plaque gravée

`bracelet-cordon-plaque` · /produit/bracelet-cordon-plaque

- **Rayon** : bijoux / homme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Noir / boucle noire | 21,90 € | 19,90 € | **17,91 €** | bracelet-cordon-plaque-noir-noir |
| Noir / boucle acier | 21,90 € | 19,90 € | **17,91 €** | bracelet-cordon-plaque-noir-acier |
| Gris foncé / boucle noire | 21,90 € | 19,90 € | **17,91 €** | bracelet-cordon-plaque-gris |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver sur la plaque (+3 €) | texte (15 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Noir / boucle noire »)

- sans rien graver : **17,91 €**
- + texte : **20,91 €**

---

### Collier Médaillon pivotant à graver

`collier-medaillon-pivotant` · /produit/collier-medaillon-pivotant

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | collier-medaillon-pivotant-dore |
| Or rose | 37,90 € | 33,90 € | **30,51 €** | collier-medaillon-pivotant-orrose |
| Argenté | 36,90 € | 32,90 € | **29,61 €** | collier-medaillon-pivotant-argente |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Gravure — face avant (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Gravure — face arrière (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + recto : **33,51 €**
- + verso : **36,51 €**

---

### Bracelet homme cuir & plaque à graver

`bracelet-homme-plaque-cuir` · /produit/bracelet-homme-plaque-cuir

- **Rayon** : bijoux / homme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 50 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Bracelet
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Noir chiné | 37,90 € | 33,90 € | **30,51 €** | bracelet-homme-plaque-noir |
| Bleu marine chiné | 37,90 € | 33,90 € | **30,51 €** | bracelet-homme-plaque-marine |
| Marron | 37,90 € | 33,90 € | **30,51 €** | bracelet-homme-plaque-marron |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver sur la plaque (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Noir chiné »)

- sans rien graver : **30,51 €**
- + texte : **33,51 €**

---

### Collier Pastille à graver recto-verso

`collier-pastille` · /produit/collier-pastille

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 35 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 33,90 € | 30,90 € | **27,81 €** | collier-pastille-dore |
| Or rose | 33,90 € | 30,90 € | **27,81 €** | collier-pastille-orrose |
| Argenté | 32,90 € | 29,90 € | **26,91 €** | collier-pastille-argente |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Gravure — recto (+3 €) | texte (18 car.) | non | +3 € | toujours |
| Gravure — verso (+3 €) | texte (18 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **27,81 €**
- + recto : **30,81 €**
- + verso : **33,81 €**

---

### Collier Cœur à graver recto-verso

`collier-coeur-grave` · /produit/collier-coeur-grave

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 45 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | collier-coeur-grave-dore |
| Or rose | 37,90 € | 33,90 € | **30,51 €** | collier-coeur-grave-orrose |
| Argenté | 36,90 € | 32,90 € | **29,61 €** | collier-coeur-grave-argente |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Gravure — recto (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Gravure — verso (+3 €) | texte (20 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + recto : **33,51 €**
- + verso : **36,51 €**

---

### Bracelet perles à pastille gravée

`bracelet-perles-pastille` · /produit/bracelet-perles-pastille

- **Rayon** : bijoux / femme · type « Bracelet personnalisé »
- **Ajouté le** : 2026-09-01
- **Livraison** : 40 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Doré | 37,90 € | 33,90 € | **30,51 €** | bracelet-perles-pastille-dore |
| Argenté | 36,90 € | 32,90 € | **29,61 €** | bracelet-perles-pastille-argente |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte à graver sur la pastille (+3 €) | texte (12 car.) | non | +3 € | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Doré »)

- sans rien graver : **30,51 €**
- + texte : **33,51 €**

---

### Collier Médaillon Livre

`collier-medaillon-livre` · /produit/collier-medaillon-livre

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 120 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 40,90 € | 36,90 € | **33,21 €** | — |
| Doré | 40,90 € | 36,90 € | **33,21 €** | — |
| Doré et Argenté | 41,90 € | 37,90 € | **34,11 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Gravure — couverture (incluse) | texte (30 car.) | non | — | toujours |
| Motif — couverture | motif | non | — | toujours |
| Couverture — position du motif | select | non | — | toujours |
| Gravure — page 1 (+5 €) | texte (30 car.) | non | +5 € | toujours |
| Motif — page 1 | motif | non | — | toujours |
| Page 1 — position du motif | select | non | — | toujours |
| Gravure — page 2 (+5 €) | texte (30 car.) | non | +5 € | toujours |
| Motif — page 2 | motif | non | — | toujours |
| Page 2 — position du motif | select | non | — | toujours |
| Gravure — page 3 (+5 €) | texte (30 car.) | non | +5 € | toujours |
| Motif — page 3 | motif | non | — | toujours |
| Page 3 — position du motif | select | non | — | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Argenté »)

- sans rien graver : **33,21 €**
- + page1 : **38,21 €**
- + page2 : **43,21 €**
- + page3 : **48,21 €**

---

### Collier Couple Puzzle géométrique

`collier-couple-puzzle` · /produit/collier-couple-puzzle

- **Rayon** : bijoux / couple · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 80 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 19,90 € | 17,90 € | **16,11 €** | — |
| Or Rose | 22,90 € | 20,90 € | **18,81 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Texte — pendentif 1 | texte (20 car.) | oui | — | toujours |
| Texte — pendentif 2 | texte (20 car.) | non | — | toujours |
| Police de gravure | font | non | — | toujours |

---

### Collier Femme Pendentif géométrique

`collier-femme-pendentif-geometrique` · /produit/collier-femme-pendentif-geometrique

- **Rayon** : bijoux / femme · type « Collier personnalisé »
- **Ajouté le** : 2026-06-02
- **Livraison** : 70 g emballé · lettre suivie possible
- **Emballages proposés** : Sac cadeau, Boîte cadeau, Pochette microfibre, Pack Collier
- **Fiche détaillée** (Taille & Matériaux…) : oui

**Options / prix**

| Option | Prix du code | Barré | Payé | Stock suivi |
|---|---|---|---|---|
| Argenté | 26,90 € | 23,90 € | **21,51 €** | — |
| Arc en Ciel | 30,90 € | 27,90 € | **25,11 €** | — |
| Doré | 29,90 € | 26,90 € | **24,21 €** | — |
| Noir | 29,90 € | 26,90 € | **24,21 €** | — |
| Or Rose | 29,90 € | 26,90 € | **24,21 €** | — |

**Personnalisation**

| Champ | Type | Obligatoire | Supplément | Affiché |
|---|---|---|---|---|
| Face avant — texte | texte (23 car.) | non | — | toujours |
| Face avant — motif | motif | non | — | toujours |
| Face avant — motif placé | select | non | — | toujours |
| Face arrière — texte (+3 €) | texte (23 car.) | non | +3 € | toujours |
| Face arrière — motif | motif | non | — | toujours |
| Face arrière — motif placé | select | non | — | toujours |
| Face droite — texte (+3 €) | texte (23 car.) | non | +3 € | toujours |
| Face droite — motif | motif | non | — | toujours |
| Face droite — motif placé | select | non | — | toujours |
| Face gauche — texte (+3 €) | texte (23 car.) | non | +3 € | toujours |
| Face gauche — motif | motif | non | — | toujours |
| Face gauche — motif placé | select | non | — | toujours |
| Sens du nom | select | non | — | toujours |
| Police de gravure | font | non | — | toujours |

**Ce que paie la cliente** (option « Argenté »)

- sans rien graver : **21,51 €**
- + face2 : **24,51 €**
- + face3 : **27,51 €**
- + face4 : **30,51 €**

---

## Récapitulatif des points à surveiller

Aucun. Tous les bijoux sont configurés de la même façon.
