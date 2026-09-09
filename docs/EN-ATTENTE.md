# 📋 TOUT CE QUI EST EN ATTENTE — inventaire de reprise

> **Mis à jour le 09/09/2026.** Ce fichier est l'index unique pour reprendre le travail depuis
> n'importe quelle conversation : messages à envoyer, maquettes validées non appliquées, projets en
> pause, actions côté gérant, questions sans réponse. Le détail de chaque sujet reste dans
> `CLAUDE.md`. **À tenir à jour** : quand une ligne est faite, la barrer ou la retirer.

---

## 1. Messages / clients en attente

| Qui | État | Où |
|---|---|---|
| **Gregory Perez** (`cseidm@pm.me`, C.S.E. IDM) — cœur en verre + monogramme GM | Texte validé, **à envoyer** par Gestion → Clients → Messages clients | `docs/messages/perez-coeur-verre.md` |
| **Aurore Corcy** (`aurorecorcy@gmail.com`) — relance carafe + 2 verres de mariage | Texte prêt du 07/09, **jamais envoyé** ; revérifier + redemander l'accord | `docs/messages/aurore-relance.md` |
| **Simon Zuccarelli** (`zucsim58@gmail.com`, Éternel Compagnon) — partenariat revendeur / dropshipping cristaux 3D pour animaux | Réponse préparée par l'agent, **attend la validation du gérant** | Alerte « [À valider] » du 07/09 dans la boîte mail |
| **Relance newsletter** (non-ouvreuses du 04/09), objet « ✦ Un prénom, une date — et le bijou devient le sien » | **Non envoyée** le 08/09 (site injoignable) — vérifier d'abord que l'envoi du 04/09 est parti | Gestion → Marketing → Newsletter |
| **Ticket xTool #1222642** (F Series) | Message anglais proposé ; **c'est le gérant qui envoie depuis Outlook** (fil absent du Gmail surveillé) | `CLAUDE.md` § État au 09/09 |
| **Sophie Berardo** (#0C1CGL2Q) | Accepte d'attendre — **cadeau promis dans le colis**, à ne pas oublier à l'expédition | Commande annotée |
| **Nina Beltran** (`beltran.030201@gmail.com`) | **Gravure offerte** promise sur un bijou + 5 € de cagnotte à créditer avant tout message | `CLAUDE.md` § Geste client |

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

1. Aucun envoi à un client sans « envoie » explicite, et **uniquement par le site**.
2. Signature **Niv Création**, jamais le nom du gérant, jamais un « je » personnel.
3. Rien de visible sur le site sans « applique » — même masqué, même invisible.
4. Ne jamais parler de la machine, de panne, de laser ou de fabricant à une cliente.
5. Produit personnalisé = jamais remboursé.
6. Clé admin uniquement dans les commandes shell, jamais dans un fichier.
7. Etsy reste dans Etsy : hors boîte mail surveillée et hors dossiers de communication.
