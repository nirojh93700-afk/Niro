# Crafia — Emails d'authentification white-label

White-label complet des emails Firebase (mot de passe oublié, vérification
d'email, etc.) aux couleurs de Crafia, en français, expédiés depuis
`support@crafia.fr`, avec une page d'action sur `app.crafia.fr` — **aucune trace
« Firebase » visible par le client**.

> ⚠️ Ces fichiers appartiennent au **projet Crafia** (séparé de la boutique Niv
> Création). Ils ont été générés ici pour que vous les **copiiez dans votre
> projet Crafia local** (`~/Desktop/Crafia-Deploy/` ou équivalent). Ne les
> déployez pas depuis ce dépôt.

---

## 1. Comment ça fonctionne (approche 100 % custom)

```
[App Crafia] --appelle--> [Cloud Function] --génère le lien sécurisé Firebase
                                            --envoie NOTRE email HTML (SMTP)
                                                       │
                                                       ▼
[Email Crafia en français] --le client clique--> [app.crafia.fr/auth/action]
                                                  (page au design Crafia qui
                                                   traite l'oobCode)
```

- On **n'utilise plus** l'envoi d'email natif de Firebase.
- Le SDK Admin **génère** le lien (avec son `oobCode` sécurisé), mais c'est
  **notre** Cloud Function qui envoie un email HTML maison.
- Le lien pointe vers **notre** page `app.crafia.fr/auth/action` (réglée dans la
  console Firebase), qui finalise l'action avec le SDK web Firebase.
- L'authentification existante (Google, Email/MDP, Anonyme) **n'est pas touchée**.

---

## 2. Fichiers fournis

| Fichier | Où le copier dans votre projet Crafia |
|---|---|
| `functions/` (tout le dossier) | À la racine de votre projet Firebase (`functions/`) |
| `app/auth/action/index.html` | Dans votre dossier hosting `app/`, soit `app/auth/action/index.html` |
| `firebase.json.snippet` | À **fusionner** dans votre `firebase.json` (ne pas remplacer) |

---

## 3. Mise en place — pas à pas

### Étape A — Copier les fichiers
1. Copiez le dossier `functions/` à la racine de votre projet Crafia.
2. Copiez `app/auth/action/index.html` dans votre dossier `app/`
   (créez `app/auth/action/`).
3. Fusionnez `firebase.json.snippet` dans votre `firebase.json` (voir le fichier
   pour les 2 ajouts : bloc `functions` + rewrite `/auth/action`).

### Étape B — Renseigner la config web Firebase dans la page d'action
Ouvrez `app/auth/action/index.html` et remplacez le bloc `firebaseConfig`
(marqué `À_REMPLIR`) par la config web de votre projet `crafia-app` :
Console Firebase → ⚙ Paramètres du projet → Vos applications → Configuration SDK.
(Ces valeurs `apiKey`/`appId` sont publiques, c'est normal.)

### Étape C — Configurer le SMTP (choix : OVH support@crafia.fr)
1. `cd functions`
2. Copiez `.env.example` en `.env`.
3. Le bloc **OVH** est déjà actif (`ssl0.ovh.net`, port `465`, `SMTP_SECURE=true`,
   `SMTP_USER=support@crafia.fr`). Renseignez seulement `SMTP_PASS` (le mot de
   passe de la boîte mail `support@crafia.fr`).
   - Vérifiez le host selon votre offre OVH (MX Plan = `ssl0.ovh.net` ;
     Email Pro = `pro1.mail.ovh.net`).
   - Pour la délivrabilité : activez **DKIM** sur la boîte dans l'espace OVH et
     vérifiez le **SPF** de `crafia.fr` (voir guide).
   - (Les blocs Brevo et Gmail restent disponibles en commentaire, en secours.)
4. `.env` ne doit **jamais** être commité (déjà dans `.gitignore`).

### Étape D — Installer les dépendances
```bash
cd functions
npm install
```

### Étape E — Étapes MANUELLES dans la console Firebase (indispensables)
Claude Code ne peut pas cliquer ici ; à faire vous-même :

1. **Authentication → Templates** : passez la langue en **Français**.
2. **Authentication → Templates → « Personnaliser l'URL d'action »** :
   mettez `https://app.crafia.fr/auth/action`.
   👉 **Sans cette étape, le lien des emails n'arrivera pas sur votre page custom.**
3. Vous **n'avez pas** besoin de configurer le SMTP natif de Firebase :
   on envoie nos propres emails via les Cloud Functions.

---

## 4. Brancher l'app (remplacer les appels natifs)

> 📄 **Guide détaillé prêt-à-coller** : voir **`INTEGRATION-crafia_app.md`**
> (remplacements exacts pour les appels `sendEmailVerification` ~14446/~79231 et
> le flux « mot de passe oublié »). À appliquer dans le projet local.

Le plus simple est le point d'entrée unifié `sendAuthEmail` :

```js
import { getFunctions, httpsCallable } from "firebase/functions";
const functions = getFunctions(app, "europe-west1");
const crafiaCallFn = (name, payload) => httpsCallable(functions, name)(payload || {});

// Mot de passe oublié (utilisateur NON connecté)
await crafiaCallFn("sendAuthEmail", { type: "reset", email });
// Vérification d'email (utilisateur CONNECTÉ)
await crafiaCallFn("sendAuthEmail", { type: "verify" });
```

Les fonctions séparées `sendPasswordResetEmail` / `sendVerificationEmail` restent
aussi disponibles si vous préférez. Exemple (SDK web modulaire) :

```js
import { getFunctions, httpsCallable } from "firebase/functions";
const functions = getFunctions(app, "europe-west1");

// --- Mot de passe oublié (utilisateur NON connecté) ---
// AVANT : await sendPasswordResetEmail(auth, email);
async function envoyerResetMdp(email) {
  const fn = httpsCallable(functions, "sendPasswordResetEmail");
  await fn({ email });
  // Réponse toujours neutre (on ne révèle pas si le compte existe).
  alert("Si un compte existe, un email vient d'être envoyé.");
}

// --- Vérification d'email (utilisateur CONNECTÉ) ---
// AVANT : await sendEmailVerification(auth.currentUser);
async function envoyerVerifEmail() {
  const fn = httpsCallable(functions, "sendVerificationEmail");
  await fn(); // utilise l'utilisateur connecté
  alert("Email de vérification envoyé.");
}
```

> Si votre app charge Firebase via les balises `<script>` (SDK compat), utilisez
> `firebase.app().functions("europe-west1").httpsCallable("sendPasswordResetEmail")({ email })`.

Les emails de bienvenue/essai/abonnement (`sendTrialReminder`,
`sendSubscriptionConfirmation`) sont **préparés** mais désactivés tant que vous
ne les branchez pas sur vos données d'abonnement (voir `index.js`, marqués TODO).

---

## 5. Tester AVANT la prod (sur le site de test)

1. Déployez d'abord les functions + le hosting de test :
   ```bash
   firebase deploy --only functions
   firebase deploy --only hosting:app-test
   ```
2. Testez la page d'action en local sans envoyer d'email : ouvrez
   `https://crafia-app-test.web.app/auth/action?mode=verifyEmail&oobCode=FAUX`
   → vous devez voir la page Crafia afficher « Lien invalide » (preuve que la
   page se charge et gère les erreurs proprement).
3. Test bout-en-bout du reset :
   - Depuis l'app de test, déclenchez « mot de passe oublié » sur une vraie
     adresse à vous.
   - Vérifiez l'email reçu : expéditeur `support@crafia.fr`, design Crafia, FR.
   - Cliquez le lien → la page `auth/action` s'ouvre, changez le mot de passe,
     reconnectez-vous avec le nouveau.
4. Idem pour la vérification d'email (compte connecté).
5. Quand tout est bon → déploiement prod :
   ```bash
   firebase deploy --only functions
   firebase deploy --only hosting:app
   ```

> 💡 Pour pointer temporairement l'URL d'action vers le test, vous pouvez régler
> `https://crafia-app-test.web.app/auth/action` dans la console, valider, puis
> remettre `https://app.crafia.fr/auth/action` pour la prod.

---

## 6. Checklist de réussite (du brief)

- [ ] L'email de reset arrive depuis « Crafia &lt;support@crafia.fr&gt; »
- [ ] Email en français, couleurs Crafia, logo « Crafia. »
- [ ] Le lien ouvre `app.crafia.fr/auth/action` au design Crafia
- [ ] Le reset de mot de passe fonctionne de bout en bout
- [ ] Idem vérification d'email
- [ ] Aucune mention « Firebase » visible par le client
- [ ] Google + Email + Anonyme fonctionnent toujours

---

## 7. Dépannage rapide

| Symptôme | Cause probable |
|---|---|
| L'email n'arrive pas | SMTP mal configuré dans `functions/.env`, ou expéditeur non autorisé par le serveur SMTP. Voir `firebase functions:log`. |
| Le lien ouvre une page Firebase générique | L'« URL d'action » n'a pas été changée dans la console (Étape E.2). |
| « Lien invalide » alors que l'email est récent | `oobCode` déjà utilisé, ou `firebaseConfig` (Étape B) incorrect. |
| Mails en spam | Configurez SPF + DKIM sur `crafia.fr` pour l'expéditeur choisi. |
| `Configuration SMTP incomplète` dans les logs | `.env` non rempli ou non déployé avec les functions. |
