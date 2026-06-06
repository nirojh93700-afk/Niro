# Revendre des sites — Kit de démarrage

Ce dossier rassemble tout ce qu'il faut pour **vendre des boutiques en ligne**
à d'autres personnes, en réutilisant ce site comme modèle.

## Les documents

| Fichier | À quoi ça sert |
|---|---|
| **GUIDE-DEBUTANT.md** | **Commencez par celui-ci.** Tout expliqué avec des mots simples : c'est quoi vendre un site, les abonnements, comment ça marche de A à Z. |
| **OFFRE-COMMERCIALE.md** | La page à montrer aux clients : prestations, formules, prix, déroulé. À adapter à vos tarifs. |
| **PROCEDURE-NOUVEAU-CLIENT.md** | Le mode d'emploi pour créer un nouveau site client en quelques heures, sans rien casser. |
| **PLAN-PLATEFORME.md** | La vision « plateforme » : une application qui gère tous les sites (domaines, inscriptions, abonnements, création), expliquée et planifiée par étapes. |

## Les versions PDF (dossier `pdf/`)

| PDF | Pour qui |
|---|---|
| **GUIDE-DEBUTANT-ILLUSTRE.pdf** | Pour vous : tout compris en images, pas à pas. |
| **PLAN-PLATEFORME.pdf** | Pour vous : le plan illustré de la future plateforme. |

## Les outils techniques fournis avec

| Élément | Rôle |
|---|---|
| `src/config/marque.js` | **Configuration centrale** : le nom, les couleurs et les coordonnées de la marque en un seul endroit. C'est le premier fichier à changer pour un nouveau client. |
| `scripts/verifier-marque.mjs` | Script qui repère les mentions de l'ancienne marque oubliées dans le code. À lancer avant chaque mise en ligne. |

## Le principe en une phrase

> Le site est conçu comme un **modèle réutilisable** : pour un nouveau client, on
> change la marque (1 fichier), les produits (1 fichier), et les comptes de
> paiement/e-mail (variables d'environnement) — le reste du moteur ne bouge pas.

## Par où commencer

1. Lire **OFFRE-COMMERCIALE.md**, fixer vos prix, trouver un premier client.
2. Suivre **PROCEDURE-NOUVEAU-CLIENT.md** pour monter sa boutique.
3. Mettre en ligne (voir `DEPLOIEMENT.md` à la racine du projet).

> Conseil : commencez par 1 ou 2 clients proches pour roder le processus, puis
> structurez votre offre et vos formules mensuelles (revenus récurrents).
