# 📋 TOUT CE QUI EST EN ATTENTE — inventaire de reprise

> **Mis à jour le 09/09/2026.** Ce fichier est l'index unique pour reprendre le travail depuis
> n'importe quelle conversation : messages à envoyer, maquettes validées non appliquées, projets en
> pause, actions côté gérant, questions sans réponse. Le détail de chaque sujet reste dans
> `CLAUDE.md`. **À tenir à jour** : quand une ligne est faite, la barrer ou la retirer.

---

## 1. Messages / clients en attente

| Qui | État | Où |
|---|---|---|
| **Gregory Perez** (`cseidm@pm.me`, C.S.E. IDM) — cœur en verre + monogramme GM | **Il a répondu le 09/09 à 8h56** (il veut bien l'objet moulé → verrier, pas nous). L'ancien texte validé est OBSOLÈTE (déjà envoyé à 8h06). **Nouveau brouillon prêt, attend le « envoie » du gérant** | `docs/messages/perez-coeur-verre.md` |
| **Aurore Corcy** (`aurorecorcy@gmail.com`) — relance carafe + 2 verres de mariage | Texte prêt du 07/09, **jamais envoyé** ; revérifier + redemander l'accord | `docs/messages/aurore-relance.md` |
| **Simon Zuccarelli** (`zucsim58@gmail.com`, Éternel Compagnon) — partenariat revendeur / dropshipping cristaux 3D pour animaux | Réponse préparée par l'agent, **attend la validation du gérant** | Alerte « [À valider] » du 07/09 dans la boîte mail |
| **Newsletter du 04/09** | ⚠️ **VÉRIFIÉ le 09/09 : JAMAIS PARTIE** (aucune campagne dans les stats à part le [TEST] du 01/09, file programmée vide, rien dans Gmail autour du 04/09). **Ne PAS envoyer la relance** ; c'est l'envoi INITIAL qu'il faut refaire, sur décision du gérant (maquette → à lui seul → liste) | Gestion → Marketing → Newsletter |
| **Ticket xTool #1222642** (F Series) | Message anglais proposé ; **c'est le gérant qui envoie depuis Outlook** (fil absent du Gmail surveillé) | `CLAUDE.md` § État au 09/09 |
| **Sophie Berardo** (#0C1CGL2Q) | Accepte d'attendre — **cadeau promis dans le colis**, à ne pas oublier à l'expédition | Commande annotée |
| **Nina Beltran** (`beltran.030201@gmail.com`) | **Gravure offerte** promise sur un bijou + 5 € de cagnotte à créditer avant tout message | `CLAUDE.md` § Geste client |

État des « réponses à valider » sur le site (vu le 09/09 via `/api/admin/pending-replies`) :
2 entrées Perez (celle du 08/09 est périmée — déjà répondu le 09/09 au matin — à classer « sans
réponse » ; celle du 09/09 a un brouillon d'agent MOINS bon que le nôtre : il laisse entendre
qu'on pourrait fabriquer l'objet), 1 entrée Simon Zuccarelli (en attente), 1 entrée Audrey
Duquennec périmée (déjà répondu le 07/09, elle n'a pas réécrit — à classer), 1 entrée
`contact@tricolores.app` (pas une cliente, à classer).

---

## 2. Maquettes validées, **pas encore appliquées** au site

> Règle : quand le gérant dit « applique / mets en ligne », **reproduire fidèlement** la maquette,
> sans réinventer. Ne jamais modifier ni republier une maquette sans son accord.

| Projet | Fichier | Décisions déjà prises |
|---|---|---|
| **Gobelet isotherme 40 oz** (configurateur final) | `docs/maquettes/gobelet-configurateur-final.html` | Produit **caché** ; prix conseillé 34,90 € (à trancher) ; Dessins 1-74, Cadres 75-103, Lettre fleurie ; image principale obligatoire ; commande = récap écrit + image d'aperçu |
| **Carafe à whisky** | `docs/maquettes/carafe-fiche.html` | 54,90 € livraison offerte ; styles 1-33 ; option coffret verres assortis |
| **Verre à vin gravé** | `docs/maquettes/verre-vin-fiche.html` | 12,90 / 24,90 / 49,90 € ; styles 1-19 + lettre fleurie |
| **Flûte à champagne** | `docs/maquettes/flute-champagne-fiche.html` | Clone du verre à vin, mêmes prix |
| **Thème « L'Écrin »** (site + admin) | `docs/maquettes/theme-ecrin.html` | À appliquer seulement s'il dit « applique le nouveau thème » |
| **Cristal 3D sur mesure** — section + configurateur | `docs/maquettes/cristal-surmesure-section.html`, `cristal-configurateur.html` | Proposer modèles prêts **et** photo perso, prix des blocs par taille |
| Autres maquettes archivées (paiement, filtres boutique, emballages, supports téléphone, photophore, plaque naissance, porte-serviettes…) | `docs/maquettes/` | Non demandées pour l'instant |

---

## 2 bis. 🔴 GOOGLE MERCHANT CENTER — 27 PRODUITS REFUSÉS (constaté le 09/09/2026)

Le gérant a créé le compte Merchant Center et ajouté le flux. **27 produits en « Attention requise »**,
motif bloquant : **« Informations de livraison manquantes — empêche la diffusion (France) »**,
plus un avertissement mineur « Couleur manquante ».

⚠️ **Le flux du site envoie pourtant déjà tout ça** : frais de port FR/BE/LU par produit depuis le
18/08 (`src/app/flux-google.xml`, `portFR`/`portEU1`), couleur + sexe + âge des bijoux depuis le
22/08. **Hypothèse à vérifier en priorité** : ces fiches ne viennent pas du flux mais du **robot
d'exploration automatique** de Google (source automatique / onglet « Automatisation »), qui crée des
fiches sans frais de port.

À faire dans la nouvelle session (avec l'accès au site) :
1. Lire `https://nivcreation.fr/flux-google.xml` et vérifier qu'un `<g:shipping>` FR est bien présent
   sur chaque produit, et que le flux se charge sans erreur.
2. Demander au gérant ce qu'affiche **Produits → Sources** (flux vs source automatique, date de la
   dernière récupération) et **Paramètres → Livraison et retours** (service de livraison France
   existant ou non).
3. Selon le cas : lui faire créer un service de livraison France au niveau du compte (couvre les
   fiches créées par Google), ou désactiver la source automatique pour ne garder que le flux.

---

## 3. Projets en pause / interrupteurs éteints

- **Packaging & emballages** : tout est construit, l'interrupteur maître `settings.packagingLive` est
  **à false** → rien n'apparaît côté clientes. Reste à trancher : Pack Bracelet (oui/non).
- **Mode « délai allongé » / vacances** : construit, s'active par `settings.vacation.enabled`.
  **Ne jamais l'allumer ni l'éteindre sans son mot.**
- **Catalogue de dessins gravables** : numérotation des planches par le gérant, **reprendre au n° 11**
  (planches « couples » 1-9 et « fleurs/papillons » 1-10 déjà faites).
- **Boxtal Option A** (étiquettes depuis le site) : à construire plus tard, quand il aura du volume.
  Option B (point relais 4,90 € fixe, étiquette créée sur boxtal.com) fonctionne aujourd'hui.
- **Page `/sur-mesure`** : démo en ligne, **pas au menu** tant qu'il ne valide pas.
- **Agent e-mail 100 % autonome** (`agents.emailAutoReply`) : codé, **OFF** — il teste avant.
- **Étude de marché Tavily** : page en ligne, clé absente → recherche désactivée.

---

## 4. À faire par le gérant (rappeler s'il demande « où on en est »)

- **REP emballages / IDU** : adhérer à Léko ou Citeo, obtenir l'IDU, le coller dans Etsy.
  Risque : sans IDU, Etsy peut bloquer le compte vendeur. Récap : `docs/rep-emballages-idu.md`.
- **Stripe** : cocher l'événement `checkout.session.expired` (relance paniers abandonnés).
- **Resend** : vérifier le domaine `nivcreation.fr` (SPF/DKIM/DMARC) contre les spams.
- **Google Merchant Center** : ajouter le flux `https://nivcreation.fr/flux-google.xml`.
- **Instagram Business** : connecter pour la publication automatique.
- **Cron anniversaires** : `CRON_SECRET` + Google Cloud Scheduler sur `/api/cron/birthdays`.
- **Clés optionnelles** : `TAVILY_API_KEY` (étude de marché), `OPENAI_API_KEY` (générateur pro).
- **Ouvrir le site au public** : décocher le code d'accès (Apparence → Accès & état), si encore privé.

---

## 5. Questions en attente de SA réponse

- **Remboursement, palier du milieu** : après 24 h, retenue de **10 €** (valeur actuelle) ou **−10 %** ?
- **Prix du gobelet 40 oz** : 34,90 € conseillé, prix barré 39,90 € — à confirmer.
- **Pack Bracelet** : à créer ou non dans les emballages.
- **Fournisseur de boîtes (Guardidea-Rachel)** : en attente de ses tailles standard et prix pour les
  boîtes cristaux (≈25×20×15 cm) et verres 2 pièces (≈28×20×12 cm).

---

## 6. Règles à ne jamais oublier (détail en tête de `CLAUDE.md`)

1. Aucun envoi à un client sans « envoie » explicite, et **uniquement par le site** (règle
   re-confirmée + testée le 09/09 : e-mail test parti par `/api/admin/send-client-email`, validé
   par le gérant ; jamais d'envoi rédigé par les outils Gmail).
2. Signature **Niv Création**, jamais le nom du gérant, jamais un « je » personnel.
3. Rien de visible sur le site sans « applique » — même masqué, même invisible.
4. Ne jamais parler de la machine, de panne, de laser ou de fabricant à une cliente.
5. Produit personnalisé = jamais remboursé.
6. Clé admin uniquement dans les commandes shell, jamais dans un fichier.
7. Etsy reste dans Etsy : hors boîte mail surveillée et hors dossiers de communication.
