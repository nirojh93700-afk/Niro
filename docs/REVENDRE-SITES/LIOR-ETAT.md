# Lior — état des lieux (reprise dans une autre conversation)

> Ce document permet à **n'importe quelle nouvelle conversation** de comprendre le
> projet Lior et de reprendre le travail immédiatement. Tout est déjà sauvegardé.

## C'est quoi Lior
**Lior** est une **plateforme de gestion de boutiques** (application privée) que la
gérante utilise pour vendre et gérer des sites à d'autres personnes. C'est un
**projet distinct** de la boutique **Niv Création** (qui, elle, est reliée dans Lior
comme « sa boutique »).

## Accès
- **Application en ligne** : `https://lior-studio.netlify.app/plateforme`
  (⚠️ tout en minuscules, ne pas oublier `/plateforme`).
- **Connexion** : mot de passe = variable `ADMIN_PASSWORD` (réglée dans Netlify,
  projet **lior-studio**). L'API accepte `PLATFORM_PASSWORD` sinon `ADMIN_PASSWORD`.
- **Dépôt / branche** : `nirojh93700-afk/niro`, branche
  **`claude/selling-websites-clients-uNHCF`** (Netlify redéploie à chaque push).

> Confidentialité : le prénom personnel de la propriétaire reste **privé** et ne
> doit apparaître **nulle part** dans l'application ni dans le code.

## Où est le code
| Fichier | Rôle |
|---|---|
| `src/app/plateforme/page.jsx` | L'application complète (connexion + vues : tableau de bord, clientes CRUD, abonnements, surveillance, réglages, coffre à clés, modale d'édition). Client component, styles inline (thème « doré & nuit »). |
| `src/app/plateforme/layout.jsx` | Métadonnées propres (nom « Lior », icône, manifeste PWA). |
| `src/app/api/plateforme/route.js` | API : GET (données+stats) et POST (createClient, updateClient, deleteClient, saveKeys, saveReglages, check). Protégée par `x-platform-key`. |
| `src/lib/plateforme-store.js` | Stockage via **Netlify Blobs** (store `lior-plateforme`, clé `data`). Repli mémoire en local. `getData/saveData/computeStats/slugify`. |
| `src/middleware.js` | Expose `x-pathname` pour que le layout racine laisse `/plateforme` (et `/gestion`) hors du portail d'accès boutique. |
| `public/lior-icon.png`, `lior-icon-512.png`, `manifest.webmanifest` | Icône + manifeste (app installable). |
| `src/app/layout.jsx` | Layout racine : si le chemin commence par `/plateforme`, rend une page autonome (sans habillage boutique ni portail). |

## Stockage des données
- **Netlify Blobs** (gratuit, sans clé) : clientes, clés par cliente, formules.
- En local (`npm run dev`), repli en mémoire (non persistant).

## Ce qui est FAIT (fonctionnel, sans clé)
- Connexion par mot de passe (+ bouton œil, case « Rester connectée » via localStorage
  `lior-key`, déconnexion dans Réglages et la barre latérale).
- **Audit qualité (maj)** : plus aucun `confirm()`/`alert()` (bloqués en PWA iOS) →
  modale de confirmation + notifications (toasts) intégrées. Sonde de santé du
  stockage (`storageHealth`) : l'API renvoie `storage: "ok"|"ephemere"` et l'UI
  affiche une bannière si les écritures ne persistent pas (Blobs indisponible ;
  secours possible via env `NETLIFY_SITE_ID`+`NETLIFY_BLOBS_TOKEN`). Boutiques
  d'exemple marquées `exemple: true` + action API `purgeExamples` (bouton dans
  Réglages → Nettoyage). Gardes serveur : `deleteClient` refuse la boutique
  `vous`, supprime le site hébergé associé ; `updateClient` en liste blanche
  (ne peut plus écraser keys/site/vous). `createClient` renvoie `createdId`.
  Mot de passe comparé à temps constant + délai anti-rafale. Timeout check 6 s.
- **Sites hébergés DANS Lior (maj 04/08/2026)** : dans la modale « Nouveau site / Modifier »,
  bouton **fichier HTML** → le site est stocké (Netlify Blobs, clé `site-<id>`) et servi sur
  **`/site/<id>`** (route `src/app/site/[id]/route.js`) — lien à donner au client.
  Actions API : `saveSite` / `deleteSite`. Boutons « ↗ Site » (liste clientes) + « voir le site » (coffre).
  ⚠️ **Rien n'est publié automatiquement** : tant qu'aucun fichier n'a été déposé pour un client,
  `/site/<id>` répond **404**. Une maquette ne devient publique qu'après un dépôt volontaire
  (donc après validation du client). `deleteSite` la retire de la ligne.
- Pas de client ajouté d'office. `ensureCleanup` (API) retire **une seule fois** une éventuelle
  fiche HB Auto-Clé auto-ajoutée par une version antérieure (drapeau `settings.hbCleaned`), pour
  ne rien laisser en ligne avant validation.
- **Clientes** : ajouter / modifier / supprimer (persisté) + recherche rapide.
- **Fiche cliente** (tiroir ⬡) : checklist de lancement 6 étapes (badge 🚀 x/6 sur la
  ligne, « Lancée ✓ » à 6/6), contact (e-mail/tél), notes libres, coffre à clés —
  enregistrés ensemble via l'action API `saveFiche`.
- **Coffre à clés** par cliente (enregistre Stripe/Resend/domaine/e-mail/Cloudinary).
- **Graphique réel** sur le tableau de bord : barres des revenus par formule
  (plus de courbe décorative).
- **Sauvegarde** : Réglages → « Télécharger une sauvegarde » (JSON complet).
- **Surveillance automatique** : le test des sites se lance à l'ouverture de la vue.
- **Abonnements** : revenus récurrents, « marquer payé ».
- **Surveillance** : test HTTP réel des sites.
- **Réglages** : formules d'abonnement éditables.
- **Responsive** téléphone + barre de navigation basse + **PWA installable**.
- Boutique **Niv Création reliée** (carte « Votre boutique »).

## Ce qui RESTE (a besoin des comptes de la propriétaire)
1. **Stripe** : facturation auto (Billing) + onboarding clientes (Connect) + commission.
2. **E-mails** (Resend) : envoi réel (bienvenue, factures, alertes).
3. **Chiffrement renforcé** du coffre (secret).
4. **Registrar** : achat de domaine depuis l'app.
5. **Phases 3-4-5** : création de site assistée, domaine auto, inscription libre-service.
6. **Agent IA** : la surveillance *détecte* déjà ; la *réparation auto* reste à faire.
7. **Option B** : emballer en app des stores (Capacitor + comptes développeur).

Les clés existent déjà (la propriétaire est inscrite partout) : on **réutilise** ses
clés (rangées dans Netlify du projet boutique) — pas de nouvelle inscription.

## Comment reprendre le travail (nouvelle conversation)
1. Se placer sur le dépôt `nirojh93700-afk/niro`, branche `claude/selling-websites-clients-uNHCF`.
2. `npm install` puis `npm run build` (doit réussir).
3. Modifier, puis **commit + push** sur la même branche → Netlify redéploie `lior-studio` tout seul.
4. Vérifier le rendu (ex. capture via Chromium headless comme dans l'historique).
