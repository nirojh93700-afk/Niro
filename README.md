# Niv Création — Site e-commerce

Boutique en ligne **indépendante** pour Niv Création (créations personnalisées
par gravure & découpe laser), avec paiement par carte bancaire intégré via
**Stripe**.

- ⚙️ **Technologie :** Next.js 14 (React) + Stripe Checkout
- 💳 **Paiement :** carte bancaire sécurisée (hébergé par Stripe)
- 🚀 **Hébergement conseillé :** Vercel (gratuit) + ton domaine
- 🛍️ **13 produits** intégrés (bijoux, mariage, cadeaux)
- 🚚 **Frais de port automatiques selon le poids** + remise en main propre
- ✉️ **Page contact + à propos**

> 📘 **Pour mettre le site en ligne, suis le guide pas à pas : [`DEPLOIEMENT.md`](./DEPLOIEMENT.md)**

---

## 🧭 Ce que tu dois faire, étape par étape

### 1. Récupérer tes clés Stripe
Tu as déjà un compte Stripe ✅. Deux options :

- **Le plus simple :** réutiliser ton compte existant. Crée juste un nouveau
  **« compte » (account)** depuis le menu en haut à gauche du dashboard Stripe
  → « + Nouveau compte », pour bien séparer la compta de Niv Création de ton
  autre activité. (Recommandé.)
- Ou utiliser directement ton compte actuel si tu préfères tout regrouper.

Ensuite, va sur **https://dashboard.stripe.com/apikeys** et copie :
- la **clé secrète** (`sk_live_...` en réel, `sk_test_...` pour tester)
- la **clé publique** (`pk_live_...` ou `pk_test_...`)

> 👉 Commence avec les clés **test** pour tout essayer sans vrai paiement,
> puis passe en **live** quand tu es prête.

### 2. Déployer le site sur Vercel (gratuit)
1. Crée un compte sur https://vercel.com (connecte-le à GitHub).
2. Clique **« Add New… → Project »** et choisis ce dépôt.
3. Vercel détecte Next.js automatiquement → clique **Deploy**.
4. Dans **Settings → Environment Variables**, ajoute :

   | Nom | Valeur |
   |-----|--------|
   | `STRIPE_SECRET_KEY` | ta clé secrète Stripe |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ta clé publique Stripe |
   | `NEXT_PUBLIC_SITE_URL` | l'adresse du site : `https://www.nivcreation.com` |

5. Relance un déploiement (**Redeploy**) pour appliquer les variables.

### 3. Brancher ton domaine (www.nivcreation.com)
Dans Vercel : **Settings → Domains → Add** → saisis **`nivcreation.com`**
(Vercel ajoute aussi automatiquement `www.nivcreation.com`).

Vercel affiche ensuite les enregistrements DNS à copier chez le bureau
d'enregistrement de ton domaine (là où tu as acheté `nivcreation.com`) :

| Type | Nom | Valeur |
|------|-----|--------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> ℹ️ Vercel peut afficher des valeurs légèrement différentes : utilise toujours
> celles affichées dans **ton** tableau de bord Vercel.

Une fois les DNS propagés (quelques minutes à quelques heures), le site est en
ligne sur https://www.nivcreation.com avec HTTPS automatique. ✅

> 🔄 **Plus tard, pour passer au `.fr`** : ajoute `nivcreation.fr` dans
> Vercel → Domains, mets à jour la variable `NEXT_PUBLIC_SITE_URL` en
> `https://www.nivcreation.fr`, et redéploie. C'est tout.

---

## 💻 Lancer le site en local (sur ton ordinateur, optionnel)

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier de configuration
cp .env.example .env.local
#    puis ouvre .env.local et colle tes clés Stripe

# 3. Démarrer le site
npm run dev
```

Le site est accessible sur http://localhost:3000

---

## 🧪 Tester un paiement (mode test)

Avec les clés **test**, utilise la carte de test Stripe :
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future · CVC : 3 chiffres au hasard

Aucun argent n'est débité en mode test.

---

## 🗂️ Structure du projet

```
src/
├── app/
│   ├── page.jsx              → Page d'accueil
│   ├── boutique/             → Catalogue + filtres
│   ├── produit/[handle]/     → Fiche produit
│   ├── panier/               → Panier complet
│   ├── merci/ · annule/      → Après paiement
│   └── api/checkout/         → Création du paiement Stripe (sécurisé)
├── components/               → Header, Footer, Panier, Fiche produit…
└── lib/
    └── products.js           → 🟢 TOUS TES PRODUITS (à éditer ici)
```

### ✏️ Modifier / ajouter un produit
Tout se passe dans **`src/lib/products.js`**. Copie un bloc produit existant,
change le titre, le prix, les images et les variantes. Les prix sont en euros.

---

## 🔒 Sécurité

Les prix sont **toujours recalculés côté serveur** à partir de `products.js`
au moment du paiement : personne ne peut payer un prix modifié depuis le
navigateur. La clé secrète Stripe reste sur le serveur et n'est jamais exposée.

---

## ❓ Notes

- Beaucoup de produits sont **personnalisables** (gravure). Le client peut
  saisir son texte sur la fiche produit **et** dans un champ dédié au moment du
  paiement Stripe. Pense à revenir vers le client par e-mail pour valider les
  détails de gravure avant fabrication.
- **Livraison :** les frais sont calculés automatiquement selon le **poids** et
  le **type** d'articles du panier (tarifs La Poste / Mondial Relay 2025, voir
  `src/lib/shipping.js`) :
  - Articles **légers et fins** (bijoux, clé USB, ronds de serviette) →
    **Lettre Suivie La Poste** (l'option la moins chère : ex. 3,28 € jusqu'à
    100 g, 5,25 € jusqu'à 250 g).
  - **Décoration bois volumineuse** → **colis** (point relais Mondial Relay ou
    domicile Colissimo suivi).
  - **Remise en main propre — gratuite** dès que le panier contient une déco
    bois/mariage.
  - Réglages par produit dans `src/lib/products.js` : `weight` (grammes),
    `letter` (expédiable en lettre), `pickup` (retrait possible).
- **Contact :** le formulaire envoie un e-mail via Resend (variable
  `RESEND_API_KEY`). Sans clé, il invite à écrire à l'adresse e-mail directe.
