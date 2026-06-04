# Intégration dans `crafia_app.html` — code prêt à coller

> Ce fichier est conçu pour être **appliqué par la session Claude Code locale**
> (celle qui tourne sur le Mac et a accès à `~/Downloads/crafia_app.html`), ou
> par Nirojh manuellement. La session cloud n'a pas le fichier.
>
> **À dire à la session locale :** « Applique les remplacements de
> `crafia-email/INTEGRATION-crafia_app.md` dans `crafia_app.html`, en suivant les
> règles de prudence (1 modif à la fois, vérifier la syntaxe, ne pas casser
> l'auth Google/Email/Anonyme). »

Le but : remplacer les 3 envois d'emails **natifs Firebase** par des appels à
notre Cloud Function `sendAuthEmail` (région `europe-west1`), pour que les
clients reçoivent nos emails au design Crafia.

---

## 0. Prérequis (une seule fois)

L'app doit pouvoir appeler les Cloud Functions. Selon la façon dont Firebase est
chargé dans `crafia_app.html` :

### Cas « SDK compat » (balises `<script src=".../firebase-*-compat.js">`)
Aucun import à ajouter. Ajoutez ce helper **une fois**, juste après
l'initialisation de l'app Firebase (`firebase.initializeApp(...)`) :

```js
// Appel d'une Cloud Function Crafia (région europe-west1).
function crafiaCallFn(name, payload) {
  return firebase.app().functions("europe-west1").httpsCallable(name)(payload || {});
}
```

### Cas « SDK modulaire » (imports ES `from "firebase/functions"`)
Ajoutez l'import et le helper près des autres imports/initialisations :

```js
import { getFunctions, httpsCallable } from "firebase/functions";
const _functions = getFunctions(app, "europe-west1");
function crafiaCallFn(name, payload) {
  return httpsCallable(_functions, name)(payload || {});
}
```

> Pour savoir dans quel cas vous êtes : cherchez `compat` dans les `<script>` du
> `<head>`. S'il y est → cas compat.

---

## 1. Mot de passe oublié

**Chercher** l'appel actuel (flux « Mot de passe oublié »). Il ressemble à l'un de :

```js
// compat
firebase.auth().sendPasswordResetEmail(email)
// ou modulaire
await sendPasswordResetEmail(auth, email);
```

**Remplacer par :**

```js
await crafiaCallFn("sendAuthEmail", { type: "reset", email: email });
```

> ⚠️ Gardez le **même message de confirmation neutre** affiché à l'utilisateur
> (« Si un compte existe, un email vient d'être envoyé »). La fonction renvoie
> toujours un succès, sans révéler si le compte existe.

---

## 2. Vérification d'email — point n°1 (≈ ligne 14446)

**Chercher :**

```js
// compat
firebase.auth().currentUser.sendEmailVerification(...)
user.sendEmailVerification(...)
// ou modulaire
await sendEmailVerification(auth.currentUser);
sendEmailVerification(user)
```

**Remplacer par :**

```js
await crafiaCallFn("sendAuthEmail", { type: "verify" });
```

(La fonction utilise automatiquement l'utilisateur connecté ; pas besoin de
passer l'email.)

---

## 3. Vérification d'email — point n°2 (≈ ligne 79231)

Même remplacement qu'au point 2 :

```js
await crafiaCallFn("sendAuthEmail", { type: "verify" });
```

> Repérez chaque occurrence de `sendEmailVerification` (il y en a ~2) et
> appliquez le même remplacement. Cherchez `sendEmailVerification` dans tout le
> fichier pour ne rien oublier.

---

## 4. (Optionnel) Bouton « Renvoyer un lien » de la page d'action

La page `auth/action` renvoie l'utilisateur vers l'app avec `?action=forgot`
quand un lien a expiré. Pour rouvrir automatiquement la fenêtre « mot de passe
oublié », ajoutez au démarrage de l'app :

```js
if (new URLSearchParams(location.search).get("action") === "forgot") {
  // Appelez ici la fonction qui ouvre votre fenêtre "Mot de passe oublié".
  // ex : ouvrirFenetreMotDePasseOublie();
}
```

C'est facultatif : sans ça, le bouton renvoie simplement vers l'écran de
connexion, où le lien « mot de passe oublié » existe déjà.

---

## 5. Vérifications après modification

- [ ] Recherche globale : plus aucun `sendPasswordResetEmail` ni
      `sendEmailVerification` **natif** dans le code (tous passés par `crafiaCallFn`).
- [ ] `crafiaCallFn` est défini **une seule fois**, après l'init Firebase.
- [ ] La syntaxe passe (objectif « Blocs OK »).
- [ ] **Ne pas toucher** : connexion Google, connexion Email/MDP, anonyme,
      ni les emails métier (factures/devis/commandes de l'artisan).
- [ ] Déployer d'abord sur **test** : `./deploy.sh test` → tester sur
      `crafia-app-test.web.app`, puis `./deploy.sh prod`.

---

## 6. Déploiement des Cloud Functions (rappel)

Les fonctions doivent être déployées séparément du HTML :

```bash
cd <projet>/functions
npm install
firebase deploy --only functions
```

Et la page d'action via le hosting :

```bash
firebase deploy --only hosting:app-test   # test
firebase deploy --only hosting:app         # prod
```
