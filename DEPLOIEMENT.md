# 🚀 Guide de déploiement pas à pas — Niv Création

Ce guide t'explique **dans l'ordre**, en partant de zéro, comment mettre ton
site en ligne sur **www.nivcreation.com** avec le paiement par carte.

Compte le faire en **30 à 45 minutes**. Aucune compétence technique requise :
il suffit de copier-coller. ☕

---

## 📋 Vue d'ensemble (les 4 étapes)

1. Récupérer tes **clés Stripe** (paiement)
2. (Optionnel) Créer une clé **Resend** (formulaire de contact)
3. **Déployer** le site sur Vercel
4. **Brancher** ton domaine www.nivcreation.com

---

## Étape 1 — Tes clés Stripe 💳

> Tu as déjà un compte Stripe pour ton autre activité. Conseil : dans Stripe,
> en haut à gauche, clique sur le nom de ton compte → **« + Créer un compte »**
> pour ouvrir un compte séparé « Niv Création » (compta et virements distincts).
> Ce n'est pas obligatoire : tu peux aussi réutiliser ton compte actuel.

1. Connecte-toi sur **https://dashboard.stripe.com**
2. En haut à droite, laisse le **mode Test** activé pour commencer.
3. Va dans **Développeurs → Clés API** (ou directement
   https://dashboard.stripe.com/test/apikeys).
4. Note ces deux valeurs (clique « Révéler » pour la secrète) :
   - **Clé publiable** : commence par `pk_test_…`
   - **Clé secrète** : commence par `sk_test_…`

Garde cet onglet ouvert, tu en auras besoin à l'étape 3.

---

## Étape 2 — Clé Resend (formulaire de contact) ✉️ *(optionnel)*

Le formulaire de contact envoie un e-mail grâce à **Resend** (gratuit jusqu'à
3 000 e-mails/mois). Si tu sautes cette étape, le formulaire affichera
simplement ton adresse e-mail directe — ce n'est pas bloquant.

1. Crée un compte sur **https://resend.com**
2. Menu **API Keys → Create API Key** → copie la clé (`re_…`).
3. (Plus tard, pour un rendu pro) ajoute et vérifie ton domaine dans
   **Resend → Domains**, ce qui te permettra d'envoyer depuis
   `contact@nivcreation.com`. Pour démarrer, l'adresse de test
   `onboarding@resend.dev` fonctionne.

---

## Étape 3 — Déployer le site 🌐

Tu as deux options d'hébergement. **Netlify est recommandé** (gratuit, autorisé
pour la vente, et tout fonctionne sans modification). Vercel reste possible
(plus simple encore, mais ~20 €/mois pour un usage commercial).

### 🟢 Option A — Netlify (gratuit, recommandé)
1. Va sur **https://netlify.com** → **Sign up** → connecte-toi avec **GitHub**.
2. **Add new site → Import an existing project** → choisis le dépôt **Niro**.
3. Netlify détecte Next.js automatiquement (la config `netlify.toml` est déjà
   dans le projet). Ne touche pas aux réglages de build.
4. Avant de déployer, ouvre **Site configuration → Environment variables** et
   ajoute les mêmes variables que dans le tableau ci-dessous (étape 3.3).
5. Clique **Deploy**. Ton site est en ligne sur une adresse `…netlify.app`.
6. Pour le webhook Stripe et le domaine : mêmes étapes (3 bis et 4), en
   remplaçant simplement l'adresse par celle de ton site Netlify / ton domaine.

> Les variables s'ajoutent dans **Site configuration → Environment variables**
> (au lieu de Vercel), mais ce sont exactement les mêmes noms et valeurs.

### ⚪ Option B — Vercel

### 3.1 Créer le compte
1. Va sur **https://vercel.com** → **Sign Up** → connecte-toi avec ton compte
   **GitHub** (celui qui contient ce dépôt).

### 3.2 Importer le projet
1. Tableau de bord Vercel → **Add New… → Project**.
2. Trouve le dépôt **Niro** (nirojh93700-afk/Niro) → **Import**.
3. Vercel détecte automatiquement **Next.js**. Ne touche à rien.

### 3.3 Ajouter les variables d'environnement
Avant de cliquer Deploy, déplie **Environment Variables** et ajoute :

| Nom | Valeur |
|-----|--------|
| `STRIPE_SECRET_KEY` | ta clé secrète Stripe (`sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ta clé publiable (`pk_test_…`) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.nivcreation.com` |
| `RESEND_API_KEY` | ta clé Resend (`re_…`) — *optionnel* |
| `CONTACT_EMAIL` | `contact.nivcreation@gmail.com` — *optionnel* |
| `STRIPE_WEBHOOK_SECRET` | secret du webhook (`whsec_…`) — voir étape 3 bis |

> 💡 Astuce : ajoute chaque variable une par une (Nom + Valeur + Add).

### 3.4 Déployer
1. Clique **Deploy**. Patiente ~2 minutes. 🎉
2. Vercel te donne une adresse de test du type
   `niro-xxxx.vercel.app` : clique dessus, ton site est déjà en ligne !

### 3.5 Tester un achat (sans vrai paiement)
1. Ajoute un produit au panier → **Payer**.
2. Sur la page Stripe, utilise la carte de test :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future · CVC : `123` · Code postal : `75000`
3. Tu dois arriver sur la page **« Merci pour votre commande »**. ✅

---

## Étape 3 bis — E-mail récap à chaque commande (pour tes étiquettes) 📩

À chaque commande payée, le site peut t'envoyer un e-mail avec tout le détail
(produits, personnalisation et **adresse de livraison prête à copier** pour ton
imprimante d'étiquettes). Pour l'activer :

1. Assure-toi d'avoir renseigné `RESEND_API_KEY` et `CONTACT_EMAIL` (étape 2).
2. Une fois le site déployé, va dans Stripe : **Développeurs → Webhooks →
   Ajouter un point de terminaison**.
3. URL du endpoint : `https://www.nivcreation.com/api/webhooks/stripe`
   (ou ton adresse Vercel `https://…vercel.app/api/webhooks/stripe` pour tester).
4. Événement à écouter : **`checkout.session.completed`**.
5. Valide, puis copie le **« Secret de signature »** (`whsec_…`).
6. Ajoute-le dans Vercel → Environment Variables sous le nom
   `STRIPE_WEBHOOK_SECRET`, puis **Redeploy**.

✅ Désormais, chaque commande payée déclenche ton e-mail récap automatique.

---

## Étape 3 ter — Activer l'upload de photo (gravure photo / cristaux) 📷 *(optionnel)*

Pour que le client puisse **téléverser sa photo** (collier médaillon option photo,
futurs cristaux 3D) directement sur le site :

1. Crée un compte gratuit sur **https://cloudinary.com**.
2. Va dans **Settings → Upload → Upload presets → Add upload preset**.
3. Mets **Signing Mode = Unsigned**, enregistre, et note le **nom du preset**.
4. Note aussi ton **Cloud name** (affiché en haut du tableau de bord).
5. Dans Netlify → Environment variables, ajoute :
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = ton cloud name
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = le nom du preset
6. **Redeploy.**

Sans ces variables, le site affiche simplement « envoyez votre photo par e-mail
après la commande » — rien n'est bloqué. Une fois activé, la photo est
téléversée et son lien arrive dans ton e-mail récap de commande.

---

## Étape 4 — Brancher ton domaine www.nivcreation.com 🔗

1. Dans Vercel : projet → **Settings → Domains**.
2. Tape **`nivcreation.com`** → **Add**. Accepte d'ajouter aussi `www`.
3. Vercel affiche les **enregistrements DNS** à créer. Connecte-toi chez
   l'endroit où tu as acheté `nivcreation.com` (OVH, Gandi, IONOS, GoDaddy…),
   section **Zone DNS**, et ajoute ce que Vercel indique, généralement :

   | Type | Nom | Valeur |
   |------|-----|--------|
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

   ⚠️ Utilise toujours les valeurs **exactes** affichées dans ton tableau Vercel.

4. Reviens sur Vercel : quand les pastilles passent au **vert** (de quelques
   minutes à quelques heures), c'est en ligne sur
   **https://www.nivcreation.com** avec HTTPS automatique. 🔒

---

## 🟢 Passer en mode « réel » (encaisser de vrais paiements)

Quand tout est testé et que tu es prête :

1. Dans Stripe, **active ton compte** (renseigne tes infos pro/bancaires) et
   bascule du mode **Test** au mode **Réel** (en haut à droite).
2. Récupère tes clés **live** (`sk_live_…` et `pk_live_…`).
3. Dans Vercel → Settings → Environment Variables, **remplace** les deux clés
   Stripe par les versions live, puis **Redeploy** (onglet Deployments → … →
   Redeploy).

---

## 🔄 Plus tard : passer au domaine .fr

Quand tu auras récupéré `nivcreation.fr` :
1. Vercel → Settings → Domains → ajoute `nivcreation.fr` (+ DNS comme ci-dessus).
2. Change la variable `NEXT_PUBLIC_SITE_URL` en `https://www.nivcreation.fr`.
3. **Redeploy**. Terminé.

---

## 🆘 Petits soucis fréquents

- **« Le paiement n'est pas configuré »** → la variable `STRIPE_SECRET_KEY`
  manque ou tu n'as pas redéployé après l'avoir ajoutée.
- **Le formulaire de contact affiche un message d'erreur** → ajoute
  `RESEND_API_KEY` (ou contacte tes clients via l'e-mail affiché).
- **Le domaine reste « en attente »** → les DNS mettent parfois quelques heures
  à se propager. Patiente, puis clique « Refresh » dans Vercel.

Besoin d'aide ? Reviens vers moi avec une capture d'écran de l'étape qui
bloque. 😊
