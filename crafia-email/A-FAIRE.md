# Crafia — Emails white-label : TOUT ce qui reste à faire

Récap complet et à jour. Coche au fur et à mesure.

---

## ✅ DÉJÀ FAIT (par Claude, dans `crafia-email/` sur la branche `claude/crafia-email-whitelabel-JBr6R`)

- [x] Templates email HTML aux couleurs Crafia (reset mot de passe, vérif email,
      recover email) — FR, sans aucune trace « Firebase ».
- [x] Structure pré-câblée pour les futurs emails (rappels d'essai J-3/J-1/J0,
      confirmation d'abonnement).
- [x] Cloud Functions `europe-west1` : `sendPasswordResetEmail`,
      `sendVerificationEmail`, et le dispatcher unifié `sendAuthEmail`.
- [x] Page d'action Crafia `app/auth/action/index.html` (reset / verify / recover
      + boutons « Renvoyer un lien » / « Retour à la connexion »).
- [x] Envoi SMTP configuré sur **OVH** (`ssl0.ovh.net:465`, secure, from
      `Crafia <support@crafia.fr>`) dans `functions/.env.example`.
- [x] `firebase.json.snippet`, `README.md`, `INTEGRATION-crafia_app.md`,
      `PROMPT-session-locale.md`.

---

## ⏳ INTÉGRATION CODE (Claude peut le faire — il manque juste les fichiers)

> Pour que Claude fasse ces 4 étapes lui-même, lui fournir : `crafia_app.html`,
> `firebase.json`, et les valeurs `apiKey` + `appId`. Sinon, la session locale
> les fait via `PROMPT-session-locale.md`.

- [ ] 1. Copier `functions/` + `app/auth/action/index.html` dans le projet Crafia.
- [ ] 2. Fusionner `firebase.json.snippet` dans `firebase.json` (rewrite
      `/auth/action` sur les sites `app` et `app-test`).
- [ ] 3. Remplir `apiKey` / `appId` (placeholders `À_REMPLIR`) dans
      `app/auth/action/index.html`.
- [ ] 4. Rebrancher `crafia_app.html` : remplacer les 2 `sendEmailVerification`
      (~14446 / ~79231) et le flux « mot de passe oublié » par
      `crafiaCallFn("sendAuthEmail", …)` — sans casser Google/Email/Anonyme.

---

## 🙋 À FAIRE PAR NIROJH — chez OVH

- [ ] Vérifier que la boîte `support@crafia.fr` existe et connaître son
      **mot de passe** (OVH → Web Cloud → Emails → crafia.fr). → c'est `SMTP_PASS`.
- [ ] Mettre ce mot de passe dans `functions/.env` (champ `SMTP_PASS`).
- [ ] Confirmer l'offre email pour le bon host (MX Plan = `ssl0.ovh.net` ✅ ;
      Email Pro = `pro1.mail.ovh.net`).
- [ ] Délivrabilité : activer **DKIM** sur crafia.fr (OVH → Emails → Délivrabilité).
- [ ] Délivrabilité : vérifier le **SPF** dans la zone DNS
      (`v=spf1 include:mx.ovh.com ~all`).

---

## 🙋 À FAIRE PAR NIROJH — console Firebase (clics, non scriptable)

- [ ] Authentication → Templates → langue **Français**.
- [ ] Authentication → Templates → « Personnaliser l'URL d'action » →
      `https://app.crafia.fr/auth/action`. **(étape clé)**
- [ ] Authentication → Settings → Authorized domains → vérifier `app.crafia.fr`.
- [ ] Paramètres du projet → Vos applications (Web) → Configuration SDK →
      copier `apiKey` + `appId` (pour l'étape 3).

---

## 🚀 DÉPLOIEMENT & TEST (session locale / Nirojh)

- [ ] `cd functions && npm install`
- [ ] `firebase deploy --only functions`
- [ ] Déployer le **TEST** : `firebase deploy --only hosting:app-test`
      (ou `./deploy.sh test`).
- [ ] Tester sur `crafia-app-test.web.app` : reset mot de passe + vérif email,
      vérifier que le lien ouvre bien la page Crafia `auth/action`.
- [ ] Après validation : déploiement **PROD** (`firebase deploy --only functions`
      + `hosting:app`, ou `./deploy.sh prod`).

---

## ✅ CRITÈRES DE RÉUSSITE (à vérifier en cliquant pour de vrai)

- [ ] Email de reset reçu, design Crafia, expéditeur `support@crafia.fr`, en FR.
- [ ] Clic → page `app.crafia.fr/auth/action` aux couleurs Crafia.
- [ ] Changement de mot de passe effectif → reconnexion OK.
- [ ] Email de vérification idem → page « Adresse confirmée ».
- [ ] Zéro mention « Firebase » visible côté client.
- [ ] Google / Email / Anonyme fonctionnent toujours.
