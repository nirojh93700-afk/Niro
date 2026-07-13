# Sauvegarde — Maquettes & tests du site (inventaire au 13/07/2026)

> Récapitulatif de **toutes les maquettes** (tests visuels faits avant de mettre sur le site)
> et des **pages de test** encore dans le dépôt. Sert de sauvegarde : rien n'est perdu, tout
> reste dans l'historique Git même après nettoyage. Branche : `claude/mockups-tests-cleanup-4v0hsb`.

## A. Maquettes EN ATTENTE — À GARDER (validées, pas encore appliquées)
Ce sont les tests validés par la gérante qu'il faudra reproduire fidèlement plus tard.

| Fichier | Ce que c'est | Statut |
|---|---|---|
| `docs/maquettes/theme-ecrin.html` | Nouveau thème « L'Écrin » (site + admin) | En attente — à appliquer quand la gérante le dira |
| `docs/maquettes/cristal-surmesure-section.html` | Section « Gravez ce que vous voulez » (haut de /cristaux) | Validée — à appliquer sur demande |
| `docs/maquettes/cristal-configurateur.html` | Configurateur d'achat cristal (modèle prêt / photo perso) | Validé — à brancher au panier |

## B. Maquettes DÉJÀ APPLIQUÉES sur le site (archives de référence)
Le vrai code existe déjà et tourne en ligne ; la maquette n'est plus qu'un souvenir.

| Fichier | Appliquée dans | Note |
|---|---|---|
| `docs/maquettes/cristal-multifenetres.html` | `src/components/CristalVivant.jsx` → page `/cristaux` | Version retenue |
| `docs/maquettes/plaque-naissance.html` | page `/naissance` (`src/app/naissance/`) | En ligne |

## C. Maquettes OBSOLÈTES / doublons (candidates à suppression)

| Fichier | Pourquoi inutile |
|---|---|
| `docs/maquettes/cristal-vivant.html` | Ancienne itération de la page cristaux, remplacée par `cristal-multifenetres.html` (c'est cette dernière qui a été retenue et appliquée dans `CristalVivant.jsx`). Doublon. |

## D. Pages de TEST dans l'app (routes jamais publiées, non liées au menu)

| Route / fichier | Ce que c'est | Statut |
|---|---|---|
| `src/app/style-1/` `style-2/` `style-3/` | 3 maquettes d'accueil (Éditorial / Immersif / Manifeste) | Test — la vraie page d'accueil est `src/app/page.jsx`, ces 3-là ne sont liées nulle part |
| `src/components/MockupSwitcher.jsx` | Barre pour passer d'une maquette d'accueil à l'autre | Sert uniquement aux 3 pages `style-x` |
| `src/lib/homeContent.js` | Contenu partagé des 3 maquettes d'accueil | Sert uniquement aux 3 pages `style-x` |

## E. Pages « démo » — fonctionnelles, EN ATTENTE de validation (à garder)

| Route | Statut |
|---|---|
| `src/app/sur-mesure/` (+ `src/app/api/sur-mesure/preview`) | Démo générateur sur-mesure, pas encore au menu — à garder (fonctionnalité en attente) |
| `src/app/coupe-du-monde/` | EN LIGNE, liée depuis le menu et l'accueil — NE PAS toucher |

## F. Outils / fichiers annexes (ne sont PAS des tests — à garder)

| Fichier | Rôle |
|---|---|
| `tools/cristal/guide-tailles-*.html` | Guides de tailles cristal (référence produit) |
| `Attestation_non_condamnation_NivCreation.html` / `.pdf` | Document légal |
| `motifs-fleurs.zip` | Ressource motifs gravure |

---

### Proposition de nettoyage (à confirmer par la gérante)
- **Supprimer** : `docs/maquettes/cristal-vivant.html` (doublon obsolète).
- **Supprimer** : `src/app/style-1`, `style-2`, `style-3`, `src/components/MockupSwitcher.jsx`,
  `src/lib/homeContent.js` (3 maquettes d'accueil de test, non utilisées).
- **Garder** : tout le reste (A, B, E, F).
</content>
</invoke>
