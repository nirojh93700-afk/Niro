# Sauvegarde du site — 16/10/2026, avant les changements « gravure des verres » et « fiche atelier détaillée »

- **Code** : le site en ligne à ce moment = commit `bcfd1c4f` (il reste pour toujours dans l’historique de la branche du site).
  Revenir en arrière : remettre ce commit sur `claude/site-product-overview-1t2de` (+ `main`, `master`), puis pousser.
- **Données** (Firestore, lues par `/api/admin/export` le 16/10/2026) : `donnees-site.json` = catalogue complet
  (réglages, prix et options modifiés dans Gestion, cadres de gravure, emballages, avis, codes promo…) + stock.
  Restaurer : `POST /api/admin/import` avec ce fichier (clé admin), seulement sur décision du gérant.
- **Clés secrètes retirées** (GitHub refuse les secrets, et ils n'ont rien à faire dans git) : connexion Gmail du site
  (identifiant, secret, jeton), clés Boxtal, jeton de la boîte surveillée, clé privée des notifications. Elles restent
  intactes dans Firestore ; si on restaure ce fichier, il faut les ressaisir dans Gestion → Réglages.
- **Commandes** : `commandes.json` = les 36 commandes telles que renvoyées par `/api/admin/orders` (lecture seule, pour mémoire).
- Ce dossier contient des données de clientes : ne jamais le copier sur la branche du site ni le publier.
