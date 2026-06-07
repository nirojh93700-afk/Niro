# Procédure — Créer un nouveau site pour un client

> Comment dupliquer cette boutique pour un nouveau client, étape par étape.
> Objectif : un site client en ligne en quelques heures, sans rien casser.
> Cette procédure peut être confiée à un agent Claude : il connaît déjà le code.

---

## Vue d'ensemble

Le site est conçu pour être **réutilisé**. Pour un nouveau client, on change :

1. **La marque** (1 fichier central) → `src/config/marque.js`
2. **Les produits** → `src/lib/products.js` + `src/lib/productInfo.js`
3. **Les comptes externes** (paiement, e-mails) → variables d'environnement
4. **Les mentions oubliées** → script de vérification

On ne touche presque jamais au reste du code.

---

## Étape 0 — Dupliquer le projet

Le plus simple : créer un **nouveau dépôt Git** à partir de celui-ci.

```bash
# Cloner le modèle dans un nouveau dossier au nom du client
git clone <url-du-modele> boutique-NOMCLIENT
cd boutique-NOMCLIENT
rm -rf .git           # on repart d'un historique vierge
git init
npm install
```

> Chaque client a **son propre dépôt** et **son propre site Netlify**. On ne
> mélange jamais deux clients dans le même projet.

---

## Étape 1 — La marque (fichier central)

Ouvrir **`src/config/marque.js`** et remplacer les valeurs :

```js
export const MARQUE = {
  nom: "Boutique du Client",
  nomCourt: "Client",
  baseline: "La phrase d'accroche du client",
  description: "Description SEO du client...",
  couleurs: {
    or: "#a98935",     // couleur principale du client
    creme: "#faf6ee",  // fond clair
    encre: "#2b2620",  // texte foncé
  },
  domaine: "boutiqueduclient.fr",
  contactEmail: "contact@boutiqueduclient.fr",
  instagram: "https://instagram.com/boutiqueduclient",
  logoUrl: "https://.../logo-client.jpg",
};
```

C'est la **source unique de vérité**. Les e-mails, le titre du site et les
métadonnées la lisent automatiquement.

---

## Étape 2 — Le contenu de la page d'accueil

Ouvrir **`src/lib/homeContent.js`** et adapter les textes d'accroche
(`headline`, `intro`, `statement`, `quote`, `trust`) et les **cartes de catégories**
(`categoryCards`) au métier du client.

---

## Étape 3 — Les produits

C'est le gros du travail. Voir le guide existant **`CLAUDE.md` (§3 à §8)** pour le
schéma d'un produit.

1. Vider/remplacer le tableau `products` dans **`src/lib/products.js`** par les
   produits du client (slug, nom, prix, variantes, champs de gravure, photos…).
2. Ajouter les infos détaillées dans **`src/lib/productInfo.js`**.
3. Adapter les **catégories** (`CATEGORIES`) si le métier diffère (ex. une
   savonnerie n'aura pas « mariage »).
4. Adapter **`src/lib/shipping.js`** si la politique de livraison change.

> Astuce : pour un agent Claude, la skill **`ajouter-produit`** automatise
> l'ajout d'un produit complet.

---

## Étape 4 — Les comptes externes (par client !)

Chaque client a **ses propres comptes**. Copier `.env.example` en `.env.local`
et remplir (voir `.env.example` pour le détail de chaque variable) :

| Variable | Compte à créer pour le client |
|---|---|
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Compte **Stripe** du client (l'argent va chez lui) |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe (voir `DEPLOIEMENT.md`) |
| `NEXT_PUBLIC_SITE_URL` | Le domaine du client (https, sans `/` final) |
| `RESEND_API_KEY` / `CONTACT_EMAIL` / `CONTACT_FROM` | Compte **Resend** + e-mail du client |
| `NEXT_PUBLIC_CLOUDINARY_*` | Compte **Cloudinary** (si upload de photo) |
| `ADMIN_PASSWORD` | Mot de passe de l'espace `/gestion` du client |
| `LOGO_URL` / `INSTAGRAM_URL` | Repli pour le logo / réseau (sinon valeurs de `marque.js`) |

> **Important :** ne jamais réutiliser le compte Stripe ou Resend d'un autre
> client. Chaque boutique encaisse sur le compte de SON propriétaire.

---

## Étape 5 — Vérifier les mentions oubliées

Lancer le script de contrôle pour repérer tout « Niv Création » resté en dur :

```bash
node scripts/verifier-marque.mjs
```

S'il reste des mentions, les remplacer (idéalement en important
`MARQUE.nom` depuis `@/config/marque`). Relancer jusqu'à `✓ Aucune mention`.

On peut aussi chercher d'autres termes :

```bash
node scripts/verifier-marque.mjs "ancienne marque" "ancien-domaine"
```

---

## Étape 6 — Tester en local

```bash
npm run build     # DOIT réussir sans erreur
npm run dev       # puis ouvrir http://localhost:3000
```

Vérifier : page d'accueil, catalogue, une fiche produit, ajout au panier,
et un **paiement test** (cartes test Stripe, voir `DEPLOIEMENT.md`).

---

## Étape 7 — Mettre en ligne

1. Créer un nouveau site **Netlify** relié au dépôt du client.
2. Y renseigner les **mêmes variables d'environnement** que `.env.local`.
3. Brancher le **nom de domaine** du client.
4. Passer Stripe en mode **réel** (clés `live`) quand tout est validé.

Détails complets dans **`DEPLOIEMENT.md`**.

---

## Récapitulatif express

```
[ ] Dupliquer le dépôt + npm install
[ ] src/config/marque.js          → identité du client
[ ] src/lib/homeContent.js        → textes d'accueil
[ ] src/lib/products.js + productInfo.js → produits
[ ] src/lib/shipping.js           → livraison (si besoin)
[ ] .env.local                    → comptes Stripe / Resend / Cloudinary du client
[ ] node scripts/verifier-marque.mjs → 0 mention résiduelle
[ ] npm run build                 → OK
[ ] Netlify + domaine + Stripe live
```

---

## Fichiers à NE PAS toucher (sauf besoin précis)

Le moteur du site — panier, paiement, calcul de prix, gravure, aperçu 3D — est
mutualisé et n'a pas besoin d'être modifié par client :
`src/lib/checkout.js`, `src/lib/engravingPrice.js`, `src/components/*`,
`src/app/api/*`. On les laisse tels quels.
