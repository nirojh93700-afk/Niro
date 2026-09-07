# Publier l'appli VOYAGE INDE — procédure exacte (à suivre telle quelle)

> ⚠️ Ceci concerne UNIQUEMENT l'appli de voyage `voyage-inde-sud.surge.sh`.
> NE RIEN TOUCHER au site Niv Création (boutique), ni à Netlify/Firebase App Hosting, ni à Stripe.

## 1. Récupérer le code à publier
    git fetch origin claude/new-session-bl1z33
    git checkout claude/new-session-bl1z33
    # le dossier à publier est : voyage-inde/public  (sw.js doit indiquer "voyage-inde-v48" ou plus)
    grep -m1 "var CACHE" voyage-inde/public/sw.js

## 2. Publier sur surge (le compte surge est déjà connecté via ~/.netrc)
    NODE_USE_ENV_PROXY=1 npx surge --project ./voyage-inde/public --domain voyage-inde-sud.surge.sh

Si surge demande un e-mail/mot de passe : c'est que le réseau vers surge.sh est bloqué
dans la session (`curl -s -o /dev/null -w "%{http_code}" https://surge.sh` renvoie 000).
Ne pas inventer d'identifiants, ne pas changer d'hébergeur, ne pas changer l'adresse :
dire à la gérante que le réseau est bloqué et réessayer dans une autre session.

## 3. Vérifier — OBLIGATOIRE avant de dire « c'est en ligne »
    curl -s https://voyage-inde-sud.surge.sh/sw.js | grep "var CACHE"
Doit afficher `voyage-inde-v48` (ou plus). Donner ce numéro à la gérante.

## Ce que contient la v48 (déjà testé, ne pas re-modifier)
- menu de monnaie (€, ₹, …) pour enregistrer / modifier un remboursement
- correctif : montants avec espace de milliers (« 95 654 ») lus correctement
- corbeille des suppressions (restaurables, synchronisées)
- bouton « Chauffeur du circuit » → ouvre le chauffeur existant + « ✕ Supprimer le chauffeur »
- montant en € conservé si on réenregistre sans changer la somme
- taux fixe 1 € = 113,20 ₹ ; synchro Firebase (projet `voyage-inde`)
