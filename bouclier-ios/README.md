# Bouclier — application anti-arnaque (iOS)

Application iPhone en **SwiftUI** qui détecte et bloque les **appels de démarchage**
(numéros réservés par l'**ARCEP**) et les **SMS frauduleux** (smishing : faux colis,
Ameli, CPF, impôts, banque, amendes…), avec une **analyse locale** sur l'appareil
(aucun message envoyé sur Internet).

## Ce que fait l'app

| Fonction | Comment | Limite iOS |
|---|---|---|
| **Filtrage des SMS** | Une extension `ILMessageFilterExtension` reçoit en **temps réel** les SMS d'expéditeurs inconnus, les analyse et classe les fraudes en **« Indésirables »**. | ✅ Analyse en direct autorisée. |
| **Blocage d'appels** | Une extension `CXCallDirectoryProvider` fournit à iOS une **liste** de numéros à bloquer / étiqueter (numéros signalés + démarchage ARCEP déjà reçu). | ⚠️ Apple **interdit** d'analyser un appel en direct — on ne peut bloquer qu'une liste. Vrai pour **toutes** les apps iPhone (Truecaller inclus). |
| **Moteur d'analyse** | `Shared/FraudEngine.swift` : préfixes ARCEP, thèmes sensibles, ton d'urgence, incitations, analyse d'URL (raccourcis, TLD à risque, usurpation de marque), reconnaissance des codes 2FA. | — |

## Architecture

```
bouclier-ios/
├── Shared/            # logique partagée app + extensions (compilée dans chaque cible)
│   ├── FraudEngine.swift   # moteur d'analyse (pur, testable)
│   ├── ArcepData.swift     # préfixes ARCEP + dictionnaires de fraude
│   └── SharedStore.swift   # stockage App Group (listes, réglages, historique)
├── App/               # application SwiftUI (tableau de bord, historique, testeur, listes, réglages)
├── CallDirectory/     # extension blocage d'appels
├── MessageFilter/     # extension filtrage SMS
├── Tests/             # tests unitaires du moteur (XCTest)
├── reference/         # miroir JS du moteur + suite de validation (node verify.mjs)
└── project.yml        # description du projet Xcode (XcodeGen)
```

Les 3 cibles partagent des données via un **App Group** : `group.fr.niro.bouclier`
(défini dans les 3 fichiers `.entitlements`). L'app écrit les listes ; les extensions
les lisent. L'extension SMS écrit aussi l'historique lu par l'app.

## Prérequis pour compiler

Il faut un **Mac avec Xcode** (les apps iOS ne se compilent que sous macOS) et un
**compte Apple Developer** (le compte gratuit suffit pour l'installer sur votre propre
iPhone ; le compte payant à 99 €/an est requis pour l'App Store).

## Générer et lancer

```bash
# 1. Installer XcodeGen (une fois)
brew install xcodegen

# 2. Générer le projet Xcode
cd bouclier-ios
xcodegen generate

# 3. Ouvrir
open Bouclier.xcodeproj
```

Dans Xcode :
1. Sélectionnez chaque cible (Bouclier, CallDirectory, MessageFilter) → onglet
   **Signing & Capabilities** → choisissez votre **Team**. Xcode ajuste les
   identifiants si besoin (gardez le même préfixe partout).
2. Vérifiez que la capability **App Groups** contient `group.fr.niro.bouclier`
   sur les 3 cibles (déjà dans les `.entitlements`).
3. Branchez votre iPhone, choisissez-le comme destination, **Run** (⌘R).

## Activer la protection sur l'iPhone (une fois installée)

- **Appels** : Réglages → Téléphone → *Blocage d'appels et identification* → activer **Bouclier**.
- **SMS** : Réglages → Messages → *Filtrage indésirables / Inconnus* → activer **Bouclier**.

## Tester le moteur d'analyse

**Sans Mac**, la logique de détection est vérifiable immédiatement via le miroir JS :

```bash
cd bouclier-ios/reference
node verify.mjs      # 18 cas réels (arnaques FR + messages légitimes) → doit tout passer
```

**Dans Xcode** : ⌘U lance `Tests/FraudEngineTests.swift` (mêmes cas, en Swift).

Dans l'app, l'onglet **« Analyser »** permet de coller un SMS douteux et de voir le
verdict détaillé (score + raisons).

## Personnaliser la détection

Ajoutez mots-clés, marques usurpées, TLD ou préfixes dans **`Shared/ArcepData.swift`**
(et, pour garder la parité de test, dans `reference/engine.mjs`). Relancez
`node verify.mjs` pour valider.

## Notes importantes

- **Confidentialité** : toute l'analyse est locale. Aucun SMS/numéro n'est transmis à un serveur.
- Bouclier **ne remplace pas la vigilance** : ne communiquez jamais vos identifiants ou
  codes bancaires par SMS. Signalez les spams SMS au **33700**.
- L'annuaire d'appels est rechargé automatiquement quand vous signalez un numéro
  (bouton « Recharger » disponible dans Réglages en cas de besoin).
