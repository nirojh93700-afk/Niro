# Guide — Obtenir l'accès API Etsy (pour publier automatiquement)

Objectif : obtenir une **clé API Etsy** afin qu'un connecteur puisse créer/gérer
tes fiches automatiquement (titres, descriptions, prix, variantes, photos…).

> Tu ne partages **jamais** ton mot de passe Etsy. L'accès passe par une clé
> développeur + une autorisation OAuth (un écran « J'autorise » que tu valides toi-même).

---

## Étape 1 — Activer la double authentification (2FA)
Etsy l'exige avant de créer une app.
1. Connecte-toi sur Etsy → **Paramètres du compte → Sécurité**.
2. Active la **vérification en deux étapes** (appli type Google Authenticator, SMS ou appel).

## Étape 2 — Créer l'application développeur
1. Va sur **https://www.etsy.com/developers/register**
2. Renseigne :
   - **Nom de l'app** : ex. « Niv Création - Sync »
   - **Description** : ex. « Outil interne pour gérer mes fiches produits »
   - **Type** : usage personnel / commercial selon le formulaire
   - **Callback URL (URL de redirection)** : nécessaire pour l'OAuth.
     Si tu ne sais pas encore quoi mettre, indique provisoirement
     `https://localhost/callback` (on l'ajustera selon le connecteur utilisé).
3. **Accepte les conditions** de l'API Etsy et valide.

## Étape 3 — Récupérer tes identifiants
Une fois l'app créée, dans **« Your Apps »** tu verras :
- **Keystring** (la clé API)
- **Shared Secret** (le secret partagé)

➡️ **Copie ces deux valeurs** et garde-les en sécurité (ne les publie jamais).

> Important (depuis le 9 février 2026) : Etsy demande désormais **les deux**
> valeurs ensemble, au format `keystring:secret`, dans l'en-tête `x-api-key`.

## Étape 4 — Attendre l'approbation
- Le statut peut afficher **« Pending Personal Approval »**.
- L'approbation prend en général **24 à 48 h**. La clé ne fonctionne qu'une fois approuvée.
- Par défaut : **accès personnel** (lecture/écriture sur ta boutique via OAuth),
  utilisable avec **jusqu'à 5 boutiques**.

## Étape 5 — Autorisation OAuth (la « porte » que tu ouvres)
Quand le connecteur sera branché, il te présentera un lien d'autorisation Etsy.
Tu cliques **« J'autorise »** → Etsy renvoie un jeton d'accès au connecteur.
Les permissions utiles à demander (scopes) :
- `listings_r` / `listings_w` : lire et **créer/modifier des fiches** (le coeur du besoin)
- `shops_r` / `shops_w` : infos boutique
- `transactions_r` : commandes (optionnel)

---

## Ce qu'il me faut, à la fin
Pour que je publie tes bijoux automatiquement, il faut que ton **environnement
Claude Code** dispose d'un **connecteur (MCP) Etsy** configuré avec :
- ta **Keystring**
- ton **Shared Secret**
- le **jeton OAuth** obtenu à l'étape 5

Cette mise en place se fait dans la **configuration de ton environnement Claude
Code** (pas dans une simple conversation). Selon ton installation :
- soit via un connecteur Etsy déjà prêt (à ajouter aux MCP servers),
- soit via un petit connecteur sur mesure utilisant l'API Etsy v3.

Dès que ce connecteur apparaît dans ma session, je peux **reprendre `products.js`
et créer les 18 fiches bijoux d'un coup** (en brouillon d'abord, pour validation).

---

## Liens utiles
- Portail développeurs : https://www.etsy.com/developers
- Inscription app : https://www.etsy.com/developers/register
- Documentation API v3 : https://developers.etsy.com/documentation/
- Démarrage rapide : https://developers.etsy.com/documentation/tutorials/quickstart/
- Authentification (OAuth) : https://developer.etsy.com/documentation/essentials/authentication/
