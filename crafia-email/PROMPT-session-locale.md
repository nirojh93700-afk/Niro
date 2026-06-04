# Prompt à donner à la session Claude Code LOCALE (sur le Mac)

> Cette session locale a accès à `crafia_app.html`, `firebase.json` et
> `deploy.sh`. Copie-colle le bloc ci-dessous tel quel dans cette session.

---

Récupère la branche `claude/crafia-email-whitelabel-JBr6R` du dépôt Niro
(`git fetch origin claude/crafia-email-whitelabel-JBr6R && git pull` ou clone si
besoin). Tout le travail à intégrer est dans le dossier `crafia-email/`.

Lis d'abord `crafia-email/README.md` puis `crafia-email/INTEGRATION-crafia_app.md`.
Ensuite, applique ceci dans le projet Crafia (dossier de déploiement
`~/Desktop/Crafia-Deploy/`), avec prudence :

1. **Copie des fichiers**
   - Copie tout `crafia-email/functions/` à la racine du projet Firebase
     (dossier `functions/`).
   - Copie `crafia-email/app/auth/action/index.html` vers `app/auth/action/index.html`.

2. **firebase.json**
   - Fusionne `crafia-email/firebase.json.snippet` dans le `firebase.json`
     existant : ajoute le bloc `functions` (s'il manque) et le rewrite
     `{ "source": "/auth/action", "destination": "/auth/action/index.html" }`
     sur les sites hosting `app` ET `app-test`.
   - IMPORTANT : place la règle `/auth/action` AVANT un éventuel catch-all
     `"**" -> "/index.html"`, sinon elle ne sera jamais atteinte.

3. **Config Firebase web dans la page d'action**
   - Récupère la config via `firebase apps:sdkconfig WEB` (projet `crafia-app`).
   - Remplace les valeurs `À_REMPLIR` (`apiKey`, `appId`) dans
     `app/auth/action/index.html`.

4. **Intégration dans `crafia_app.html`** (gros fichier ~3,5 Mo — prudence)
   - Suis EXACTEMENT `crafia-email/INTEGRATION-crafia_app.md`.
   - Détecte si l'app utilise le SDK Firebase "compat" ou "modulaire", ajoute le
     helper `crafiaCallFn` UNE seule fois après l'init Firebase.
   - Remplace l'appel "mot de passe oublié" par
     `await crafiaCallFn("sendAuthEmail", { type: "reset", email })`.
   - Remplace CHAQUE `sendEmailVerification` (≈ lignes 14446 et 79231) par
     `await crafiaCallFn("sendAuthEmail", { type: "verify" })`.
   - Vérifie la syntaxe après chaque modif (objectif « Blocs OK: X | KO: 0 »).
   - NE CASSE PAS la connexion Google / Email / Anonyme.
   - NE TOUCHE PAS aux emails métier (factures / devis / commandes de l'artisan).

5. **SMTP (OVH — support@crafia.fr)**
   - Crée `functions/.env` à partir de `functions/.env.example` (le bloc OVH est
     déjà actif : host `ssl0.ovh.net`, port `465`, secure `true`,
     user `support@crafia.fr`).
   - Nirojh renseigne lui-même `SMTP_PASS` (mot de passe de la boîte mail OVH).
   - Vérifie que `.env` est bien dans `.gitignore`.

6. **Dépendances + déploiement TEST d'abord**
   - `cd functions && npm install`
   - `firebase deploy --only functions`
   - `firebase deploy --only hosting:app-test` (ou `./deploy.sh test`)
   - On teste ensemble sur `crafia-app-test.web.app` (reset + vérif email), on
     vérifie que le lien ouvre bien la page Crafia `auth/action`.

7. **Prod (seulement après validation du test)**
   - `firebase deploy --only functions`
   - `firebase deploy --only hosting:app` (ou `./deploy.sh prod`)

## Rappels (étapes manuelles que Nirojh fait dans la console Firebase)
Ces étapes ne sont PAS scriptables, je (Nirojh) les fais en parallèle :
- Authentication → Templates → langue **Français**
- Authentication → Templates → « Personnaliser l'URL d'action » →
  `https://app.crafia.fr/auth/action`
- Authentication → Settings → Authorized domains : vérifier `app.crafia.fr`

## Critères de réussite à vérifier en cliquant pour de vrai
- [ ] Email de reset reçu, design Crafia, expéditeur support@crafia.fr, en FR
- [ ] Clic → page `app.crafia.fr/auth/action` aux couleurs Crafia
- [ ] Changement de mot de passe effectif → reconnexion OK
- [ ] Email de vérification idem → page « Adresse confirmée »
- [ ] Aucune mention « Firebase » visible côté client
- [ ] Google / Email / Anonyme fonctionnent toujours
