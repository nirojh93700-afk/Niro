# 📋 TOUT CE QUI EST EN ATTENTE — inventaire de reprise

> **Mis à jour le 24/09/2026.** Ce fichier est l'index unique pour reprendre le travail depuis
> n'importe quelle conversation : messages à envoyer, maquettes validées non appliquées, projets en
> pause, actions côté gérant, questions sans réponse. Le détail de chaque sujet reste dans
> `CLAUDE.md`. **À tenir à jour** : quand une ligne est faite, la barrer ou la retirer.

---

## 0. À mettre en ligne sur le mot du gérant
- **Verre à vin 47 cl** (2 tailles sur la fiche, aperçu par taille, prix 19,90 / 36,90 / 71,90 €) :
  **construit et vérifié le 25/09, commit local, PAS poussé** — attend « applique ». Ensuite :
  saisir **stock 100** sur les 3 choix 47 cl dans Gestion → Produits & stock, et vérifier que les
  6 choix s'affichent en ligne (si Gestion a un vieux réglage d'options, les 47 cl manqueront).
  Détail : `CLAUDE.md` § « VERRE À VIN — DEUX TAILLES ».

## 1. Messages / clients en attente

| Qui | État | Où |
|---|---|---|
| **Gregory Perez** (`cseidm@pm.me`, C.S.E. IDM) — cœur en verre + monogramme GM | **Il a répondu le 09/09 à 8h56** (il veut bien l'objet moulé → verrier, pas nous). L'ancien texte validé est OBSOLÈTE (déjà envoyé à 8h06). **Nouveau brouillon prêt, attend le « envoie » du gérant** | `docs/messages/perez-coeur-verre.md` |
| **Aurore Corcy** (`aurorecorcy@gmail.com`, signe « Damon Aurore ») — carafe + 2 verres de mariage | Demande du 30/08, notre réponse du 30/08 (90,70 € l'ensemble, 3 questions). Silence 23 jours. ✅ **RELANCE ENVOYÉE le 22/09 à 10 h 40** (Messages clients, validée « Envoie le mail ») : redemande date, textes, écriture. **Attendre sa réponse** (bouton Répondre) ; le prix du 30/08 reste valable | `docs/messages/aurore-relance.md` |
| **TRAN** (`vnhantran@gmail.com`) — carafe Linh & Michael (date 06.09.2025, esprit Jack Daniel's sans logo) | Demande du 17/09 (« un modèle avec des suggestions ») → composition envoyée le 17/09 à 18 h 22 (exception, image avant devis). **Silence depuis.** ✅ **RELANCE ENVOYÉE le 22/09 à 10 h 25** (Messages clients, validée) : lui redemande si la composition convient, devis dès son accord. **Aucun devis créé.** Attendre sa réponse (bouton Répondre) | Gmail fil 1a0b02d2b2bf7a2e |
| **Simon Zuccarelli** (`zucsim58@gmail.com`, Éternel Compagnon) — partenariat revendeur / dropshipping cristaux 3D pour animaux | Réponse préparée par l'agent, **attend la validation du gérant** | Alerte « [À valider] » du 07/09 dans la boîte mail |
| **Newsletter du 04/09** | ⚠️ **VÉRIFIÉ le 09/09 : JAMAIS PARTIE** (aucune campagne dans les stats à part le [TEST] du 01/09, file programmée vide, rien dans Gmail autour du 04/09). **Ne PAS envoyer la relance** ; c'est l'envoi INITIAL qu'il faut refaire, sur décision du gérant (maquette → à lui seul → liste) | Gestion → Marketing → Newsletter |
| **Ticket xTool #1222642** (F Series) | Message anglais proposé ; **c'est le gérant qui envoie depuis Outlook** (fil absent du Gmail surveillé) | `CLAUDE.md` § État au 09/09 |
| **Sonia** (`soniagailhac1307@gmail.com`) — commande 16GFEMQP | ✅ **ENVOYÉ le 12/09 à 07 h 13** (fil Communications & aperçu) | `docs/messages/rassurance-3-commandes.md` |
| **Ophélie Terraz** (`ophelie.terraz@gmail.com`) — commande 0KVSBXKR | ✅ **ENVOYÉ le 12/09 à 07 h 13** — **attendre sa réponse sur le choix du cadeau** (colis part chez la destinataire) | `docs/messages/rassurance-3-commandes.md` |
| **Sophie Berardo** (#0C1CGL2Q) — verre whisky sur mesure | ✅ **ENVOYÉ le 12/09 à 07 h 13** (fil Communications & aperçu) | `docs/messages/rassurance-3-commandes.md` |
| **Rose** (`rose75013@icloud.com`) — verre à whisky, gravure en portugais | ✅ **ENVOYÉ le 14/09** par Messages clients (`send-client-email`), texte exact de `messagesPrets.js`. **Attendre ses réponses** (répartition des lignes, nb de verres, écriture, majuscules). 📌 Housekeeping FAIT le 15/09 (entrée retirée) | `src/lib/messagesPrets.js` |
| **Sophie Berardo** (#0C1CGL2Q) | Accepte d'attendre — **cadeau promis dans le colis**, à ne pas oublier à l'expédition | Commande annotée |
| **Valérine Zaghini** (`valerinezaghini@gmail.com`) — #0URL2JQA (2 flûtes « 50 ans d'amour » / « 25 septembre 1976 », Allura, Mondial Relay locker Châtillon-sur-Seine, 29,80 €) | Correction de date faite le 15/09 (graver **25** septembre, pas 26 — alerte interne sur la commande). **Elle a réécrit le 22/09 à 7 h 34** : « pas d'expédition, l'événement est ce week-end ». ✅ **Réponse ENVOYÉE le 22/09 à 8 h 37** (Messages clients, validée « Envoie ») : « nous faisons le maximum, sans garantie », **sans mention du mode de livraison** pour laisser le choix. ⚠️ **Noces d'or le vendredi 25/09** : machine reçue le 23 → seul un **Chronopost déposé jeudi 24 matin** (domicile : 6 rue des Carrelles, 21400 Montliot-et-Courcelles) arrive le 25 ; Mondial Relay/Colissimo = lundi 28. Express ≈ 12,50 € Boxtal (marge ≈ 8,90 € au lieu de 15,90) — **décision du gérant en attente**. Elle a été prévenue 2× le 15/09 (« ce sera juste »), on n'est pas en retard sur le délai affiché (3-4 semaines) | `docs/messages/valerine-correction-date.md` |
| **Céline** (`celinecosta88@yahoo.com`) — question dimensions du Collier Pastille | ✅ **RÉPONDU le 22/09 à 10 h 05** par la page de réponse du site (`/api/reply`, validé « Envoie ça par le site ») : pastille 2,4 cm (0,96 pouce), épaisseur 1,3 mm, chaîne 24 cm de hauteur portée ≈ 48 cm de tour de cou (mesures données par le gérant en pouces sauf la chaîne). Fiche `productInfo.js` corrigée avec ces dimensions. Rien en attente | Gestion → Messages |
| **Cécilia Herrera** (`cecilia.herrera@hotmail.fr`) — #00CUYR2U (4 flûtes, 2 lots) | ✅ **MESSAGE ENVOYÉ LE 24/09 À 9 H 32** par le site (Messages clients, bouton Répondre). ⏳ **On attend sa réponse** : « modèle 15 » ou pas de réponse → lot 2 sur le **modèle 15** ; « plume » → lot 2 en style **Plume**, mêmes textes. Lot 1 déjà gravé. Contexte : la date gravée **24.09.2026 était aujourd'hui**, commande encore « À préparer », un seul e-mail envoyé le 15/09. On lui demande de trancher entre **modèle 15** et style **« Plume »**, enregistrés tous les deux sur le 2ᵉ lot. 🎁 Cadeau surprise promis le 15/09 **à glisser dans le colis** | `docs/messages/herrera-00CUYR2U.md` |
| **Rose Catarino** (`rose75013@icloud.com`) — #1Z17IKQ8 | Elle a répondu le 15/09 : **gravure EN PORTUGAIS**, texte exact « Obrigado por todos estes orgasmos. Continua assim! ». Le brouillon d'agent qui reposait la question a été **supprimé** (ordre du gérant). ✅ **Confirmation ENVOYÉE le 15/09** (Messages clients). ⚠️ Un aperçu avant gravure lui a été PROMIS (14 et 15/09) — **nouvelle règle du 15/09 : on ne promet plus d'aperçu** ; pour Rose, le gérant tranche (tenir la promesse ou graver directement) | `docs/messages/rose-confirmation-portugais.md` |
| **Maëlys Georges** (`mae31340@gmail.com`) — #1GIP8RR1 | ✅ **ENVOYÉ le 15/09** (réassurance + délai) — rien d'autre en attente | `src/lib/messagesPrets.js` (historique) |
| **Nina Beltran** (`beltran.030201@gmail.com`) | **Gravure offerte** promise sur un bijou + 5 € de cagnotte à créditer avant tout message | `CLAUDE.md` § Geste client |
| **Camille Faucon** (`camille.faucon@gmail.com`) — #1XDNGCQE (21/09 21 h 31) | **Nouvelle commande, 32,01 €** : Bracelet Homme Chaîne Acier argenté, gravure « 15/05/2026 » Great Vibes (+3 €), sac cadeau, Mondial Relay locker Préchac (33730), cadeau d'attente « surprise ». Rien à écrire pour l'instant (confirmation auto reçue) | Gestion → Commandes |

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
| **Ludovic NOEL — 2 verres à vin 47 cl gravés** (`ludsolo@gmail.com`) | `docs/messages/noel-verre-vin-45cl.md` | **MESSAGE PRÊT, EN ATTENTE D'ENVOI** — le gérant a demandé le 16/09 qu'une AUTRE CONVERSATION l'envoie. Canal : Gestion → Clients → Messages clients. Le fichier contient : le texte exact du mail, le prix retenu (18,90 € l'unité / 34,90 € les deux), et **le devis tout prêt à créer** (lignes, total 43,80 €, texte du champ « Demande du client ») pour le jour où Ludovic répond oui. Le gérant achète un verre 47 cl (liens Metro dans `docs/prix-marche.md`) — ne PAS dire à la cliente qu'on l'achète. |
| ~~**Favoris enregistrés dans le compte client**~~ ✅ **APPLIQUÉ le 15/09/2026** | `docs/maquettes/favoris-compte.html` | Validé (« applique ») puis construit — voir `CLAUDE.md` § Favoris. Maquette gardée pour mémoire. **Complété le 15/09 : le ♡ est désormais PARTOUT** (fiche produit à côté du titre + « Garder pour plus tard » sous le bouton panier, bandeaux de l'accueil, mur de l'atelier, grilles des guides) — il ne vivait que sur les vignettes. Ancienne fiche : Chantier demandé : « les clients mettent en favoris et ça va directement dans leur compte ». Existe déjà : le ♡ (`WishlistButton.jsx`) + `/favoris` mais en **localStorage** (par navigateur), et l'espace client `/espace` (connexion par lien magique, cookie signé 30 j). À construire : favoris rangés côté serveur par e-mail, **fusion des favoris du navigateur à la connexion**, et écran Gestion → Favoris (top produits + clientes + export). Aucun e-mail automatique. |
| **Nouveaux noms des 32 bijoux** (15/09/2026) | `docs/noms-bijoux-proposition.md` | **Enregistrés à sa demande, NON appliqués** — il dira quand. À l'application : changer **uniquement** le champ `name`, jamais le `slug` ni le `title` (référencement + Merchant Center). |
| **Aperçu 3D des 9 bijoux à cœur** (14/09/2026) | `docs/maquettes/apercu3d-<slug>.html` — 9 pages autonomes, générées par `node --import ./tools/alias-register.mjs tools/maquettes/coeur3d.mjs` | **En attente de son retour.** Cœur recto/verso gravé en direct, couleur = métal, rotation au doigt, total avec +3 €/face. Deux fiches restent à l'ancien système (Cœur & Zircon, Femme Cœur). Quand il dit « applique » : reproduire dans le site (forme cœur à ajouter à `EngravePlate3D` ou nouveau composant), puis ces maquettes peuvent être supprimées. Ensuite prévus : pastille ronde (2 fiches), plaques de bracelet (6), puzzle (1). |
| **Cristal 3D sur mesure** — section + configurateur | `docs/maquettes/cristal-surmesure-section.html`, `cristal-configurateur.html` | Proposer modèles prêts **et** photo perso, prix des blocs par taille |
| **Bouton « Répondre » dans les e-mails clients** | ✅ **APPLIQUÉ le 15/09** (« applique » du gérant, commit `efffd9f`) : bouton dans chaque envoi Messages clients → page `/reponse/<jeton>` (jeton 30 j) → réponse rangée dans le dossier + fil de commande (pastille 📬) + alerte. Le fil Aperçu/BAT avait DÉJÀ son bouton (/suivi). Maquette : `docs/maquettes/bouton-repondre-email.html` |
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

**Vérifications FAITES le 09/09 au soir (session reprise, accès au site OK)** :
1. ✅ **Le flux est complet et correct** : 72 produits, chacun avec `<g:shipping>` pour **FR + BE +
   LU** (FR : 46× 4,90 · 21× 6,90 · 5× 11,90), XML valide, `g:price`/`g:availability`/`g:brand`/
   `g:identifier_exists` présents, couleur+sexe+âge sur les bijoux. ⚠️ Piège de vérif : le flux est
   mis en cache 1 h — le lire avec `?nocache=<timestamp>` sinon on voit une vieille copie.
2. ✅ **Les pages produit portent aussi la livraison en données structurées** (JSON-LD `Offer` →
   `OfferShippingDetails` FR 3,90 € + délais + politique de retour) — vérifié sur `collier-pastille`.
→ **Côté site, RIEN ne manque.** Le problème est donc côté compte Merchant Center : les 27 fiches
   refusées ne sont pas alimentées par le flux (compte tout neuf : flux pas encore traité, et/ou
   fiches créées par la source automatique de Google), et **aucun service de livraison n'existe au
   niveau du compte**.

Reste à faire PAR LE GÉRANT dans Merchant Center (rien à changer sur le site) :
1. **Paramètres → Livraison et retours → Ajouter un service de livraison** pour la **France** :
   tarif 6,90 € (ou 4,90 € si le compte ne diffuse que les bijoux), **livraison offerte dès 45 €**
   — c'est prévu ainsi (le flux compte sur ce réglage pour le seuil). Ça couvre TOUTES les fiches,
   quelle que soit leur source, et lève « Informations de livraison manquantes ».
2. **Produits → Sources** : vérifier que le flux `https://nivcreation.fr/flux-google.xml` est bien
   listé, dernière récupération réussie ; cliquer « Récupérer maintenant » si disponible.
3. S'il y a une **source automatique** (« fiches créées à partir de votre site web ») : la laisser,
   le service de livraison du compte suffit — ou la désactiver pour ne garder que le flux.
4. « Couleur manquante » (mineur) : se résorbera quand les fiches viendront du flux (couleur incluse).

**Amélioration du flux PRÉPARÉE, PAS APPLIQUÉE (09/09 soir, le gérant a dit « tu changes rien
sur le site »)** : ajout de `<g:free_shipping_threshold>` par produit (seuil bijoux lu dans le
réglage admin, seuils 60 €/45 € des verres/couverts lus sur chaque produit) → la livraison offerte
au seuil serait déclarée DANS le flux, plus besoin du réglage de compte Merchant. Compilation
vérifiée OK. Le correctif complet est dans **`docs/patches/flux-google-seuil-offert.patch`** —
l'appliquer (`git apply`) SEULEMENT quand le gérant dit « applique ». Le code du site n'a pas
été touché ni déployé.

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

- 📦 **RETOUR CLIENT À RETIRER AVANT LE 20/09/2026 — commande #1S9IOON5**
  (notification Mondial Relay du 15/09 à 15 h 32). Colis **n° 98362971**, code de retrait
  **536287**, au relais **RETOUCHERIE JO**, 1 place de la Libération, **95200 Sarcelles**
  (9 h-13 h / 14 h-19 h). **Passé le 20/09 le colis repart** → à retirer en priorité.
  - **Ce n'est pas un colis fournisseur** : c'est le **retour de la commande #1S9IOON5**, envoi
    Boxtal `#2609011116MONRXTX0FR`, suivi `71133346` (5,10 € HT de port).
  - Cliente : **Hend Musallam**, 31 rue d'Etrembières, 74100 Annemasse ·
    `e.varol2012@icloud.com` · 07 49 37 63 26 (payé par PayPal sous *Enes Varol*).
  - Contenu : **1× Bracelet Femme Cœur doré gravé « Hend »** (police Allura) + boîte cadeau.
    Payé **30,21 €** (26,31 € + 3,90 € de livraison). Commande du 31/08, fabrication immédiate.
  - Historique du colis (vérifié sur Boxtal le 15/09) : envoi **« Domicile France »** →
    **03/09 14 h 14 « destinataire absent »** (le livreur s'est présenté à son adresse) + avisage
    e-mail → colis dérouté vers un relais → **disponible le 04/09 à 9 h 26**, 2e avisage e-mail à
    9 h 29 → **jamais retiré en 7 jours** → retour à l'expéditeur le 11/09.
    ✅ **L'atelier n'a commis aucune erreur** : la livraison à domicile payée a bien été tentée.
    Demander les frais de réexpédition est donc défendable, et ce suivi est le dossier à produire
    en cas de litige PayPal.
  - ⏳ **Le message cliente est PRÊT mais PAS ENVOYÉ**, et il a été **RETIRÉ de Gestion à sa
    demande** (« pour pas qu'on se trompe et qu'on l'envoie ») : il n'apparaît plus dans
    Messages clients. Texte + contexte + entrée à recopier :
    **`docs/messages/1S9IOON5-colis-revenu.md`**. Envoi prévu **en fin de semaine, par lui
    seul**. Le remettre dans `MESSAGES_PRETS` seulement s'il le demande.
  - 📅 **Le retrait du colis, lui, n'attend pas** : limite au **20/09, qui est un DIMANCHE** →
    le relais sera probablement fermé, donc **samedi 19/09 au plus tard**.
  - ⚠️ **Décision prise** : le bracelet est gravé « Hend », donc invendable à
    quelqu'un d'autre, et la règle du site est « personnalisé = jamais remboursé ». Options
    proposées le 15/09 : **renvoi offert** · **renvoi avec port à sa charge (~4,90 €)** ·
    elle vient le chercher. **Aucun message ne lui a été écrit** — le texte sera préparé dans
    Gestion → Clients → Messages clients dès qu'il aura choisi.
  - 🛡️ **DOSSIER PAYPAL PRÊT, À NE SORTIR QUE SI ELLE RÉCLAME** :
    `docs/messages/paypal-litige-1S9IOON5.md` — texte à coller dans le Centre de résolution
    (français + anglais), chronologie datée, liste des 5 preuves à joindre, et ce qu'il ne faut
    PAS écrire. Préparé le 15/09 à sa demande (« on sait jamais »). **Tant qu'elle ne réclame
    rien, on n'écrit pas à PayPal.** S'il demande, ou si une réclamation arrive : lui donner ce
    texte (délai de réponse PayPal souvent 10 jours → répondre tout de suite).
  - À noter : la fiche a facturé 3,90 € de port alors que l'envoi a coûté 5,10 € HT.

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

## 4 a. 🧭 Tableau de bord Gestion v2 — ✅ APPLIQUÉ le 19/09/2026

Maquette `docs/maquettes/tableau-de-bord-v2.html` validée (« Appliquer ») et reproduite sur le site :
① messages à traiter en tête · ② bandeau « mode délai allongé ACTIF » avec Éteindre · ③ chiffres
utiles (CA / commandes / panier / devis en attente, objectif, retards) · ④ sélecteur de période.
Détail dans `CLAUDE.md` § « Tableau de bord v2 ». **À vérifier par le gérant dans Gestion** après
déploiement (le site n'est pas joignable depuis cette session) : le bandeau apparaît bien, les
messages listent TRAN / Ludovic / Rose, le sélecteur change les chiffres.

---

## 4 bis. ✦ Offre gravure offerte — PRÊTE, ÉTEINTE, À LANCER SEULEMENT SUR SA DEMANDE (17/09/2026)

**Tout est construit et testé. RIEN ne part tant que le gérant ne dit pas « lance l'offre ».**
Procédure complète pour l'autre conversation : **`docs/messages/offre-gravure-lancement.md`**.

Ce qui a été tranché et fait le 17/09 :
- [x] **Un code par cliente**, réservé à son adresse, une seule utilisation, expire à la fin de l'offre.
- [x] **La vraie gravure est offerte** (prix réel de la 1re gravure du panier, une par commande),
      **sur n'importe quel produit** — le gérant a levé l'exclusion des verres du 11/09.
      Restent payants : gravures suivantes, photo gravée, socle LED, coffret.
- [x] **E-mail adapté à chaque cliente** : ancienneté + son code + ses favoris (sinon 3 idées).
- [x] **Nettoyage des codes expirés/utilisés** : automatique à chaque passage + bouton dans l'écran.
- [x] Un seul cadeau par commande · pas de minimum d'achat · rien sur le site (e-mail uniquement).

⚠️ Avant de lancer : si le mode délai allongé est éteint, **décocher « cadeau surprise »** dans
l'écran (le choix du cadeau au paiement n'existe qu'avec ce mode).

---

## 4 ter. 💍 Bijoux — gravure (chantier du 14/09/2026)

**État complet et à jour des 32 bijoux : `docs/etat-bijoux.md`** (fichier GÉNÉRÉ — régénérer avec
`npm run etat-bijoux`). Il donne pour chaque bijou : prix du code, prix barré, prix payé, chaque
champ de gravure avec son supplément, les emballages, le poids/la livraison, et les points à
surveiller. Les règles et l'historique sont dans `CLAUDE.md` § « Gravure des bijoux ».

Fait le 14/09 (à sa demande, fiche par fiche) :
- [x] **Bracelet Homme Tressé** : la gravure ne dépend plus du nom de l'option (elle avait disparu
      de la fiche après un renommage dans l'admin).
- [x] **Bracelet cordon à plaque** : prix baissé à **17,91 €** (barré 19,90 €).
- [x] **Collier Double Cœur** : les faux « Ligne 1/2/3 » remplacés par recto/verso, 3 € la face.
- [x] **Bracelet Cœur T-bar** et **Bracelet Cœur grosse chaîne** : même gabarit recto/verso.

En attente de SA décision :
- [ ] **Quelle règle pour la 1re gravure ?** 13 bijoux la font payer, 19 l'incluent. Il a dit
      « y a que le premier gravure gratuit après c'est payant », mais la règle plus ancienne du
      `CLAUDE.md` §10 4bis dit « gravure TOUJOURS payante ». Les deux se contredisent → lui demander.
- [ ] **6 bijoux + 2 objets déco** gardent le vieux système « Sans / Avec gravure » ou la case +3 € :
      Gourmette, Bracelet Homme Acier & Silicone, Collier Cœur & Zircon, Bracelet cordon à plaque,
      Bracelet homme cuir & plaque, Bracelet perles à pastille, Bougeoir Lotus, Support téléphone
      ajouré. **Ne les corriger que s'il les désigne** (consigne du 14/09 : « les autres tu touches pas »).

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
3 bis. **Ne plus promettre d'« aperçu avant gravure »** dans les messages clients (règle du 15/09).
3. Rien de visible sur le site sans « applique » — même masqué, même invisible.
4. Ne jamais parler de la machine, de panne, de laser ou de fabricant à une cliente.
5. Produit personnalisé = jamais remboursé.
6. Clé admin uniquement dans les commandes shell, jamais dans un fichier.
7. Etsy reste dans Etsy : hors boîte mail surveillée et hors dossiers de communication.
