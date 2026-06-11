# Pronoz ⚡

App mobile de **pronostics sportifs entre amis** (React Native + Expo).
Design original, thème sombre & néon.

## Concept
Prédis les scores des matchs avant le coup d'envoi, marque des points selon ta
justesse, et grimpe au classement de ta bande.

**Barème de points**
- Score exact : **3 pts**
- Bonne différence de buts : **+1 pt** bonus
- Bon résultat (1 · N · 2) : **1 pt**
- Mauvais résultat : 0 pt

## Lancer l'app sur ton téléphone (le plus simple)
1. Installe **Expo Go** depuis l'App Store (iPhone) ou le Play Store (Android).
2. Sur l'ordinateur, dans ce dossier :
   ```bash
   cd pronoz
   npm install      # première fois seulement
   npx expo start
   ```
3. Un **QR code** s'affiche. Scanne-le avec l'appareil photo (iPhone) ou depuis
   l'app Expo Go (Android). L'app s'ouvre sur ton téléphone.

> Téléphone et ordinateur doivent être sur le **même réseau Wi-Fi**.
> Sinon : `npx expo start --tunnel`.

## Écrans
- **Accueil** : présentation + connexion (Apple / Facebook / invité — pour l'instant
  factices, à brancher plus tard).
- **Matchs** : liste des rencontres, filtres (à jouer / terminés), accès au prono.
- **Match** : sélecteur de score (+/−), barème, enregistrement du pronostic.
- **Classement** : podium + liste, le total de l'utilisateur se met à jour selon
  ses pronos sur les matchs terminés.
- **Profil** : stats, réglages, déconnexion.

## Structure
```
app/                  écrans (expo-router)
  index.js            accueil / connexion
  (tabs)/             onglets : matches, leaderboard, profile
  match/[id].js       saisie d'un pronostic
src/
  theme.js            palette sombre & néon
  lib/scoring.js      calcul des points
  lib/store.js        état global (Context + AsyncStorage)
  lib/format.js       dates en français
  data/               données de démo (matchs, amis)
  components/         composants partagés
```

## Données
Pour l'instant tout est **local** (données de démo + sauvegarde sur l'appareil via
AsyncStorage). Prochaine étape possible : brancher une vraie API de matchs
(football-data.org, API-Sports…) et **Firebase/Firestore** pour les pronos et le
classement partagé entre amis en temps réel.

## Pas encore branché (volontairement)
- Connexion réelle Apple/Facebook (nécessite comptes développeur + certificats).
- Synchro multi-joueurs en ligne.
- Notifications push avant les matchs.
