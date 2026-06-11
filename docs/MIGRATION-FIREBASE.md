# Migration Netlify → Firebase App Hosting

> Préparée le 11/06/2026. Le site Netlify continue de fonctionner normalement
> pendant toute la migration : le nouveau stockage Firestore ne s'active que
> via la variable `DATA_BACKEND=firestore` (jamais définie sur Netlify).

## Comment c'est construit (pour l'agent)
- `src/lib/stock.js` parle aux **deux stockages** : Netlify Blobs (défaut) ou
  **Firestore** si `DATA_BACKEND=firestore` (collection `siteConfig`, un document
  par section, en JSON ; écritures en lot atomiques → plus aucun problème de
  cohérence différée).
- **Cache mémoire 60 s** en mode Firestore : le site ne relit la base qu'une
  fois par minute maximum → reste très en-dessous du palier gratuit
  (50 000 lectures/jour).
- Fichiers 3D (.glb) : Firebase **Storage** (`models3d/`) en mode Firestore.
- `apphosting.yaml` : config App Hosting (0 instance à vide = pas de coût).
- Migration des données : `GET /api/admin/export` (sur Netlify) puis
  `POST /api/admin/import` (sur Firebase), tous deux protégés par `x-admin-key`.

## Étapes à faire par l'utilisatrice (dans l'ordre)
1. **Firebase → passer au plan Blaze** (console Firebase → Paramètres → Forfait).
   Mettre une **alerte budget à 5 €** (console Google Cloud → Facturation →
   Budgets et alertes) pour être prévenue par e-mail avant tout débit.
2. **Console Firebase → App Hosting → Commencer** : connecter le dépôt GitHub
   `nirojh93700-afk/Niro`, branche `claude/site-product-overview-1t2de`.
3. Quand la console demande les **secrets**, créer ceux listés dans
   `apphosting.yaml` en collant les mêmes valeurs que dans Netlify
   (Site settings → Environment variables) : STRIPE_SECRET_KEY,
   STRIPE_WEBHOOK_SECRET (voir étape 6), RESEND_API_KEY,
   FIREBASE_SERVICE_ACCOUNT, ADMIN_PASSWORD, CONTACT_EMAIL,
   ANTHROPIC_API_KEY, ANTHROPIC_MODEL.
   Ajouter aussi les variables publiques Cloudinary si utilisées :
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
4. Premier déploiement → Firebase donne une **URL temporaire**
   (`….hosted.app`). Vérifier que le site s'affiche.
5. **Migrer les données** (réglages, promos, retouches produits, stock) —
   l'agent peut le faire : export depuis `https://nivcreation.fr/api/admin/export`
   (en-tête `x-admin-key`), puis import sur `https://<url-firebase>/api/admin/import`.
6. **Stripe → Webhooks** : ajouter un endpoint avec l'URL Firebase
   (`https://<domaine>/api/stripe/webhook` — même chemin qu'avant), événements
   `checkout.session.completed` + `checkout.session.expired`, puis coller le
   nouveau « Signing secret » dans le secret STRIPE_WEBHOOK_SECRET.
7. **Tester sur l'URL temporaire** : une commande réelle petite somme
   (remboursable), e-mails reçus, admin OK, stock décrémenté.
8. **Basculer le domaine** : console Firebase → App Hosting → Domaines
   personnalisés → `nivcreation.fr` → suivre les enregistrements DNS indiqués
   chez le registrar. (Prévoir un moment calme ; l'ancien site Netlify reste
   actif pendant la propagation, aucune commande n'est perdue.)
9. Après quelques jours OK : laisser Netlify en pause ou supprimer le site
   Netlify (garder le dépôt GitHub, c'est lui la source).

## Ce qui ne change pas
- Commandes, devis, uploads clients : déjà dans Firebase (rien à migrer).
- Resend, Cloudinary, Stripe (à part l'URL du webhook).
- L'admin `/gestion`, les e-mails, le paiement : identiques.
