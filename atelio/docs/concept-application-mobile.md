# Concept — Application mobile Atelio

> Spécification fonctionnelle de l'app mobile (iOS + Android). Sert de cahier des
> charges pour un développement ultérieur (React Native / Flutter recommandé pour
> partager le code avec le site Next.js).

---

## 1. Pourquoi une app mobile ?

- Le sur-mesure se **décide souvent au téléphone** (on prend une photo, on note une
  idée de cadeau, on partage avec un proche).
- L'app permet le **suivi de fabrication en notifications push** (« Votre pièce
  entre en atelier », « Expédiée ») — c'est l'argument émotionnel fort.
- L'**appareil photo** est central : envoyer une photo à graver, scanner une idée,
  voir l'aperçu en réalité augmentée plus tard.
- Fidélisation : l'app garde le client (commandes répétées : Noël, anniversaires…).

---

## 2. Deux applications, un seul code

| App | Pour qui | Fonctions clés |
|---|---|---|
| **Atelio** (client) | Acheteurs | Parcourir, configurer, commander, suivre, messagerie |
| **Atelio Studio** (créateur) | Artisans | Gérer annonces, recevoir/valider commandes, suivi atelier, encaissements |

(On peut démarrer par une seule app « client » et garder le studio côté web.)

---

## 3. Parcours client (écrans principaux)

1. **Accueil / Découverte** — sélections (« Idées cadeaux », saisons, mariages),
   recherche, catégories. Personnalisé selon les occasions à venir.
2. **Fiche création** — photos, prix, délai, créateur, avis.
3. **Configurateur de personnalisation** — le cœur de l'app :
   - champs texte (gravure), choix de **police**, **couleur**, **photo** (depuis
     l'appareil photo / galerie), nombre de faces ;
   - **aperçu en direct** du rendu de gravure ;
   - (V2) **aperçu en réalité augmentée** posé sur la main / la table.
4. **Panier & paiement** — multi-devises, Apple Pay / Google Pay, Stripe.
5. **Messagerie** — discuter avec le créateur pour valider les détails.
6. **Suivi de fabrication** — timeline : *Reçue → Validée → En atelier → Expédiée
   → Livrée*, avec **notifications push** à chaque étape + suivi de colis.
7. **Mes commandes / Favoris / Profil** — historique, recommander à l'identique,
   adresses, langue & devise.

---

## 4. Parcours créateur (Atelio Studio)

1. **Tableau de bord** — commandes du jour, chiffre d'affaires, à expédier.
2. **Mes annonces** — créer/éditer une création, définir les champs de
   personnalisation (réutilise le schéma produit existant de Niv Création).
3. **Commandes** — détail de la personnalisation client, fichiers/photos reçus,
   bouton « bon à produire », passage d'étape (atelier → expédié).
4. **Messagerie** — répondre aux clients.
5. **Paiements** — encaissements (Stripe Connect), historique des commissions.
6. **Assistant IA** — aide à rédiger les fiches, traduire à l'international,
   générer des visuels (briques déjà présentes côté Niv Création).

---

## 5. Fonctions techniques clés

- **Notifications push** (suivi de fabrication, messages, promos) — l'atout
  rétention n°1.
- **Appareil photo / galerie** pour les photos à graver.
- **Multilingue + multi-devises** (international dès le départ).
- **Paiement natif** : Apple Pay, Google Pay, Stripe.
- **Mode hors-ligne léger** : consulter ses commandes et favoris sans réseau.
- **Partage** : envoyer une création à un proche (cadeau).

---

## 6. Stack recommandée

- **React Native (Expo)** ou **Flutter** — un seul code iOS + Android.
- **Backend partagé** avec le site (mêmes API : produits, commandes, Stripe,
  e-mails, suivi). L'app consomme les API existantes ; pas de double maintenance.
- **Push** : Expo Notifications / Firebase Cloud Messaging.
- **Auth** : connexion e-mail + Apple/Google Sign-In (obligatoire sur iOS).

---

## 7. Feuille de route proposée

| Phase | Contenu | Objectif |
|---|---|---|
| **V0 — Web (fait/en cours)** | Site responsive, déjà utilisable sur mobile | Valider la demande |
| **V1 — App client** | Découverte, configurateur, paiement, suivi push | Fidéliser, commandes répétées |
| **V2 — App créateur** | Studio mobile (commandes, atelier, encaissements) | Autonomie des artisans |
| **V3 — Réalité augmentée** | Aperçu AR de la pièce personnalisée | Différenciation forte |

---

## 8. Maquette d'écrans (rappel visuel)

Une démo cliquable du **flux mobile** (3 écrans : découverte → configurateur →
suivi de fabrication) est intégrée dans le site, section « Application mobile ».
Voir `atelio/site/index.html`. Elle sert de support de discussion avant le
développement natif.
