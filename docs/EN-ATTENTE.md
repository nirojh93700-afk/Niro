# 📋 TOUT CE QUI EST EN ATTENTE — inventaire de reprise

> **Mis à jour le 29/09/2026.** Ce fichier est l'index unique pour reprendre le travail depuis
> n'importe quelle conversation : messages à envoyer, maquettes validées non appliquées, projets en
> pause, actions côté gérant, questions sans réponse. Le détail de chaque sujet reste dans
> `CLAUDE.md`. **À tenir à jour** : quand une ligne est faite, la barrer ou la retirer.

---

## 0. Côté gérant, après mise en ligne
- **🔴 ANCIEN SITE NETLIFY À SUPPRIMER + « www » À RÉGLER (16/10/2026 — le gérant le fera lui-même, « je supprimerai après »)**.
  L'ancien site `exquisite-khapse-7af3a0.netlify.app` tourne encore : il a envoyé 3 demandes d'avis en double à Ludovic
  (16HGINEA) et continuera (environ toutes les 12 min jusqu'au 19/10) tant qu'il existe. **`www.nivcreation.fr` pointe vers lui**
  (CNAME vérifié le 16/10) ; `nivcreation.fr` est bien chez Firebase (35.219.200.110). Pas d'accès Netlify / Hostinger / console
  Firebase d'ici : c'est LUI qui fait les 3 étapes.
  1. **Supprimer l'ancien site** : app.netlify.com → site **exquisite-khapse-7af3a0** → **Site configuration** → tout en bas
     **Delete this site** (arrête les mails ; `www.nivcreation.fr` affiche une erreur jusqu'aux étapes 2-3 ; nivcreation.fr intact).
  2. **Firebase** : console.firebase.google.com → projet **niv-creation** → **App Hosting** → **niv-creation** → **Paramètres** →
     **Domaines** → **Ajouter un domaine personnalisé** → `www.nivcreation.fr`, **redirigé vers nivcreation.fr** → noter les réglages DNS affichés.
  3. **Hostinger** : hpanel.hostinger.com → **nivcreation.fr** → **DNS** → supprimer **CNAME « www » → exquisite-khapse-7af3a0.netlify.app**,
     ajouter les lignes données par Firebase ; attendre « Connecté » dans Firebase.
  Après : moi, vérifier que Netlify ne répond plus et que `www.nivcreation.fr` arrive sur le vrai site ; dans Stripe → Webhooks,
  supprimer un éventuel ancien point de terminaison Netlify. Les 2 règles automatiques (avis J+2, relance inscrites J+4) sont
  **éteintes** depuis le 16/10 : ne les rallumer que sur sa demande.
- **🌐 Domaine nivcreation.fr à prolonger (16/10)** : acheté chez **Hostinger** (hpanel → Domaines → nivcreation.fr → Renouveler +
  renouvellement automatique, jusqu'à 10 ans en .fr). Date d'expiration non lue d'ici : c'est lui qui la regarde.
- ✅ **Devis : code promo + livraison choisis par le client — EN LIGNE le 03/10/2026** (« tu peux le mettre en ligne à la place de
  l'ancien », maquette validée, option 1 = calcul du port PARTAGÉ avec le panier : `src/lib/panierPort.js`, utilisé par
  `/api/checkout` ET les devis ; parité prouvée par `npm run test-port-parite`, 6000 paniers). Reste : **UN paiement test boutique**
  (bijou, verre, carafe) pour revérifier les frais de port, et le devis de Simon Pascal (clé USB 64 Go, 44,90 €, 1 clé, besoin le 13/10).
  Règles : devis avec « Article du site » ou poids par ligne (poids toujours modifiable) ; anciens devis sans poids ou avec ligne
  « Livraison » manuelle = comme avant. PAS construit : champ « prix de livraison imposé ».
- **Verre à vin 47 cl** : ✅ **EN LIGNE le 25/09** (« Applique », commit `ecc373c`). À faire :
  saisir **stock 100** sur les 3 choix 47 cl (Gestion → Produits & stock) et vérifier sur la fiche
  que les deux tailles apparaissent (si Gestion a un vieux réglage d'options, les 47 cl manqueront).

- **🧾 Devis Arnold — 10 verres à whisky (03/10)** : préparé et ENREGISTRÉ pour le gérant seul, **rien dans le site**.
  4 + 6 verres = 181,70 € − 10 % = **163,53 €**, livraison offerte. Fichier `docs/devis/arnold-verres-whisky.md`.
  **À lui redonner quand il le demande** ; créer le vrai devis dans Gestion seulement sur son ordre.
- **🍷🥂 Verre à vin + flûte — même parcours que la carafe** (29/09 soir) : maquettes FAITES
  (https://claude.ai/artifact/79y5nzvqvPMzp9VvTEs1c2 et https://claude.ai/artifact/GfwRCqS9CEukTrmuSwmsRB),
  ✅ **EN LIGNE le 29/09 soir** (« Tu peux appliquer »), carafe passée en facultatif en même temps.
  Suite à proposer : whisky perso + cocktail + fête des pères, puis support téléphone bois.
- **🫙 Fiche carafe — parcours guidé** (29/09) : ✅ **EN LIGNE le 29/09 soir** (« Applique »), + 4ᵉ choix « Ma photo ou mon logo ». Reste : ses réponses aux 2 questions (date +3 € sur les modèles qui l'incluent ; modèles 20/32 marques déposées) et « reproduire sur vin / flûte / whisky perso » quand il le dira. Maquette d'origine :
  `docs/maquettes/carafe-parcours-guide.html`, artifact https://claude.ai/artifact/9SKYiYbYMJDuVd77ESUj5E
  (4 étapes : quoi graver → modèle/lettre/texte avec SEULS les champs utiles → coffret → résumé, bouton
  grisé sans gravure). **Attend son retour puis « applique »** ; ensuite reproduire sur verre à vin /
  flûte / whisky perso. Questions ouvertes : date +3 € sur les modèles qui l'incluent ? modèles 20 et 32
  (marques déposées) à retirer ? Détail : `CLAUDE.md` § FICHE CARAFE.
- **📊 Étude de marché** (26/09) : `docs/etude-marche-2026-09.md`, artifact
  https://claude.ai/artifact/VWntbMV3t7VNiadodvW7f2 — 6 pistes à valider (porte-clés 9,90, veilleuse 34,90,
  bracelets homme 34,90, afficher la livraison offerte, trancher la 1re gravure bijoux, préparer
  Saint-Valentin / fête des mères). **Rien appliqué.**
- **🍹 Verre à cocktail gravé** (25/09) : maquette ENREGISTRÉE (`docs/maquettes/verre-a-cocktail-fiche.html`,
  artifact https://claude.ai/artifact/XRYqfH6rdExwQUqGehB17Q — gabarit du verre à whisky, SANS gravure au
  fond, 3 photos du gérant, prix proposés 17,90 / 33,90 / 64,90 € à valider). Verre commandé chez Metro
  (livraison 29 sept.–1 oct.). **Le gérant reprendra** : il manque une photo GRAVÉE + son accord sur le prix
  avant d'ajouter le produit pour de vrai. Détail : `CLAUDE.md` § VERRE À COCKTAIL.
- **🎄 Noël 2026** : ✅ **bandeau + sélection + page `/offrir/noel` EN LIGNE le 25/09** (interrupteur
  Apparence → « Bandeau Noël », à décocher après les fêtes). Reste en attente : (1) **date limite de
  commande** à me donner ; (2) boule de Noël = enregistrée, PAS en ligne ; (3) gobelet : maquette **✅ VALIDÉE
  définitivement le 25/09 soir** (« enregistrer cette maquette garde en mémoire, je publierai après »)
  (`docs/maquettes/gobelet-configurateur-final.html`, artifact https://claude.ai/artifact/JzxuttEeyZSDymLM17BVas —
  quota 4→1 élément inclus, +3 €/élément en plus, onglet « Texte seul » ajouté, vrai sélecteur des 8 polices du
  site, système « Un motif / Un texte » de l'onglet Dessins gardé tel quel — le gérant l'aime). **N'attend plus
  qu'un « mets en ligne »** + la quantité en stock. Détail : `CLAUDE.md` § CONFIGURATEUR GOBELET.
  **03/10 : version « parcours guidé » demandée** (« retravailler la maquette comme pour les verres de vin ») →
  `docs/maquettes/gobelet-parcours-guide.html` (artifact https://claude.ai/artifact/KNBxJ9BAsss7oshCo2RJfC, générateur
  `tools/maquettes/parcours-gobelet.py`) — édition limitée comme la carafe (étiquette, accroche, description, bandeau d'accueil sombre & or), **47,90 € net,
  livraison en plus**. ✅ **ENREGISTRÉE le 03/10 (« Enregistre la maquette, je te donnerai les quantités après »)** :
  c'est CETTE version (parcours guidé) qui remplace celle du 25/09. **En attente : les quantités par couleur, puis
  son « mets en ligne ».** Rien n'est en ligne.

## 1. Messages / clients en attente
- **🍷 Céline Druesne #1ZGOWMIL (verre à vin 36 cl « Ma Sister ❤️ », arrivé CASSÉ le 19/10)** : mail parti le 19/10 20 h 45 — nouveau verre gravé renvoyé à nos frais, on lui demande si on peut l'envoyer en point relais Mondial Relay (elle doit indiquer son point). ✅ 20/10 8 h : elle accepte le point relais (« d'accord pour une livraison en point relais ») — son point relais n'est pas précisé. ✅ 22/10 16 h 35 : verre prêt, mail parti par le site (« nous n'avons toujours pas reçu l'adresse du point relais ») — attendre son point relais pour l'envoyer. 22/10 18 h 40 : 2ᵉ mail avec les 7 points Mondial Relay de Sorgues (n° 1 à 7 : DBS Phone, Ecovrac, Agence MR, Lockers U Express / Carrefour Market / Lidl / Loubox) — elle répond par le numéro. Livraison d'origine : Maude De Branbandere, 3 Lot. les Valérianes, 84700 Sorgues. Graver et renvoyer (bien caler la coupe). Statut Gestion encore « à préparer » alors qu'elle a été expédiée le 13/10 (Colissimo 9V35593961247). ✅ 22/10 soir : elle a choisi le **Locker 24/7 Carrefour Market, 1 rue des 700 Déportés du Train, 84700 Sorgues (Mondial Relay, code 31373, offre MONR-CpourToi)** → enregistré sur la commande (action `relais`, ancienne livraison gardée dans `livraisonAvant`). Reste : étiquette Boxtal vers ce locker et envoi. ⛔ Les brouillons de l'agent qui disent « Carrefour Market n'est pas Mondial Relay » sont FAUX : ne pas les envoyer.
- **🥃 Céline Naulin #10OPUHMO** : mail du 20/10 9 h (écriture Great Vibes proposée) → ✅ elle valide le changement (20/10 10 h 41). Graver en Great Vibes.
- **💛 Pierre Lays #1WONUVDK (Collier Cœur doré, verso « P.J », relais Bourg-Saint-Maurice)** : mail parti le 22/10 16 h 38 par le site — on lui demande s'il veut bien un point entre les initiales ou autre chose. Attendre sa réponse avant de graver.
- **🥂 Kim Martins (2 flûtes, drapeaux, pour le 28/10)** : devis DEV-1526 (36,90 € + livraison au choix) envoyé le 19/10 20 h 39, dessin France à gauche / États-Unis à droite. ✅ PAYÉ le 20/10 7 h 59 → commande **0XMR9EAS** (41,80 €), à graver pour le 28/10 (France à gauche, USA à droite). Sa réponse du 20/10 : « j'ai approuvé la gravure… très heureux de voir le produit fini ». → `docs/messages/kim-martins-flutes.md`.
- **0E3Y9OBX (Taru Yal / livraison Fabien Guiblet, 2 verres à vin 47 cl, dessin)** : aperçu du dessin reproduit ENVOYÉ le 13/10 à 16 h 19 par le fil Aperçu/BAT (image `/api/img/QPGpw6jFMfM7mxDJeQIz`, « Bonjour, » sans prénom car le nom de la commande est celui du destinataire du cadeau). Elle a répondu le 13/10 à 16 h 32 (« Je valide » puis « modification » : « Il y a un verre comme ça et l'autre avec le logo »). Le logo n'existe nulle part chez nous (1 seule image dans la commande, aucune pièce jointe) → **demande du logo ENVOYÉE le 13/10 à 17 h 00** par le fil de la commande (« Vas-y » du gérant). Logo « Zoo Bar » reçu par e-mail le 13/10 à 17 h 26 (534 px, couleurs, damier) ; versions N&B préparées (scratchpad) puis **logo RETOUCHÉ par le gérant** envoyé en aperçu à valider le 13/10 à 19 h 31 (image `/api/img/i7LOUlRtyDjENUuGSkQX`, « Envoie »). **Logo validé par la cliente le 13/10** (« Oui parfait merci »). Réponse à sa question de date ENVOYÉE le 15/10 à 14 h 33 : colis expédié vendredi 16/10 (« envoie » du gérant) → **passer la commande en « Expédiée » avec le numéro de suivi le 16/10** (le suivi part alors tout seul). Verre 1 = dessin (validé), verre 2 = logo ; rien de plus à facturer (photo comprise, aucun texte). ⚠️ Sa question du 13/10 (date d'envoi approximative) n'a PAS encore de réponse : brouillon montré, en attente du « envoie » du gérant.

- **🥃 Evan (evan2008.nat@gmail.com) — verre à whisky sur mesure (visuel complet : dessin de mains + 3 textes)** : réponse SANS prix envoyée
  le 12/10 soir par le site, on attend SA MAQUETTE. Dès qu'elle arrive : devis à régler en ligne, prix gardé en mémoire dans
  `docs/messages/evan-verre-whisky-sur-mesure.md` (19,90 € + 3 textes × 3 € = 28,90 € · port relais 4,90 / domicile 11,90 €),
  à montrer au gérant avant tout envoi. Règle écrite le 12/10 en tête de CLAUDE.md : tout texte gravé est payant, même dans un visuel fourni.
- **📦 Nollez Jessica (1PUMYQBL, bracelet cordon à plaque) — ✅ MAIL « quel nom sur le colis ? » ENVOYÉ le 12/10 par le site**
  (texte validé de `docs/messages/nollez-1PUMYQBL-nom-livraison.md`, branche de déploiement, envoyé tel quel après vérification :
  aucune réponse d'elle au mail du 09/10). Le mail annonce un départ DEMAIN (13/10) au nom « cipresso fybie » si elle ne répond pas :
  surveiller sa réponse (dossier + Gmail) avant d'expédier.
- **⭐ Mails d'avis du 12/10** : ✅ **6 ENVOYÉS** (Sophie Berardo, Mme Monhardt, Olivier Chesta, Ludovic Noel, Rose Catarino,
  Cécilia Herrera — « envoie juste les commandes envoyées avant »). ⏳ **5 EN ATTENTE** (« pour les autres on va attendre ») :
  Marie Randriamalaza, Anthony Giot, Laura Brimeux (expédiés le 09/10 ; Laura après son PACS du 14/10), Inès Doumi et Lorenzo
  Franchi (colis au point de retrait depuis le 10/10). Brouillons prêts dans `docs/messages/avis-2026-10-12.md`, à envoyer sur
  son mot. Déjà servies avant : Maëlys, Zaghini, Alicia, Ophélie, Camille, Laura Nebout, Sonia, Faustine.
- **🍸 Prospection bars & restaurants (26/09)** : e-mail v4 SANS prix, personnalisé par type + ville
  (tarifs pro sauvegardés, sur demande) + **122 adresses** au total (lot 1 : 30, lot 2 : 92, boutons
  séparés dans l'écran) NON vérifiées (`docs/prospection/`) + écran **Restaurants & bars** ✅ **EN
  LIGNE**. Reste à faire par le gérant : importer les 2 lots, ouvrir chaque source et cocher « adresse
  vérifiée » avant d'écrire. **RIEN ENVOYÉ** avant son « envoie » ; envoi par Gestion → Restaurants &
  bars → « Écrire » (Messages clients).
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

- 🟠 **Maquette « Puzzle photo gravé » (09/10 soir)** : https://claude.ai/artifact/UEkvNMNmgoPTkvsLsZKZzG — v2 pour adultes : 24 / 48 / 80 / 120 pièces à 29,90 / 32,90 / 34,90 / 37,90 €, 21 × 15 cm. En attente de son avis puis « applique ».
- ✅ **PUZZLES EN VENTE depuis le 09/10/2026 soir** (ordre du gérant), 9 fiches à 29,90 € prénom compris. Marquage CE pas fait (sa décision).
- **Maquette « Jeux pour enfants » (07/10/2026) — ENREGISTRÉE (version 2)** — https://claude.ai/artifact/HkVPxQEevP5UwD2bn3Sf8x, rien en ligne :
  (prix 29,90 € prénom compris ✅ 07/10 · dimensions 18,5 × 13,5 cm ✅ 09/10 et âge « dès 2 ans, sous la surveillance d'un adulte » ✅ 09/10 soir — formulation proposée, à reporter dans la maquette sur son accord ·
  poids 75 g ✅ 09/10) · épaisseur / bois · marquage CE (EN 71) · nom de la catégorie · son « applique ».
  Il envisage de mettre LE PUZZLE SEUL en ligne (sans la refonte accueil) : possible, répondu le 09/10 soir, il dit avant.
- ✅✅ **ACCUEIL + UNIVERS « MÉLANGE » APPLIQUÉE AU SITE le 09/10 soir** (« applique la maquette avec le puzzle » → « OK, vas-y ») :
  version avec puzzles « Bientôt » (non achetables, CE à faire). Point de retour = commit `44f2f64` (une commande pour revenir).
  Reste à lui : vérifier sur son téléphone ; dire si le coffret doit avoir une remise (non annoncée car inexistante au
  paiement) ; les puzzles passeront en vente sur son « applique le puzzle » (CE + cylindre 3,2 cm avant).
- ✅ **LES TROIS MAQUETTES CRISTAL EN LIGNE LE 10/10/2026 (« les trois », gérant)** : page **/cristaux-graves** (cristaux déjà
  gravés, v14, produit `cristal-deja-grave` achetable, rangé dans l'univers Cristal à la place de l'encadré « Bientôt ») · page
  **/cristaux** dans le nouvel habillage · **écrin** en haut des fiches cristal verticale et horizontale (fiche inchangée dessous).
  Restent les questions sur les modèles : « Fillette au ballon » (Banksy, droits) · « I Love You » de l'ourson · licence pngtree
  des 2 dessins de mariés · fée qui ressemble à la Fée Clochette · colibri couleur en double.
- ✅ **« Les dernières sorties » sur deux lignes qui glissent (version B) — APPLIQUÉE le 09/10 soir** (commit `374bb1b`).
- ✅ **Maquette « Accueil + univers », 09/10 soir, « OK fais-le »** : parcours « Trouver le bon cadeau » descendu juste avant le
  coffret enfants + phrase « Fait main en France : chaque pièce est gravée et découpée dans notre atelier » sous son titre
  (v11 / v7), puis parcours ramené à DEUX étapes sans budget (v12 / v8). Barre rayons + filtres compacte sur téléphone (v10 / v6).
  Attend maintenant son avis d'ensemble, puis « applique ».

- **Remboursement, palier du milieu** : après 24 h, retenue de **10 €** (valeur actuelle) ou **−10 %** ?
- **Prix du gobelet 40 oz** : ✅ **47,90 € net, livraison en plus** (fixé par le gérant le 03/10/2026, maquette à jour).
- **Pack Bracelet** : à créer ou non dans les emballages.
- **Fournisseur de boîtes (Guardidea-Rachel)** : en attente de ses tailles standard et prix pour les
  boîtes cristaux (≈25×20×15 cm) et verres 2 pièces (≈28×20×12 cm).

---

- **💶 Prix de livraison des VERRES à domicile — À TRANCHER PAR LUI (« garde en mémoire pour le prix », 14/10/2026).**
  Aujourd'hui 11,90 € pour 1-2 verres (`GLASS_TIERS`, ou son réglage dans Gestion → Livraison), 16,90 € pour 3-4.
  Marché relevé le 14/10 : domicile 6,95 € (Amikado) à 7,90 € (Un Jour Une Surprise, PopCase) ; livraison offerte dès
  49-89 € ailleurs (lui : 60 €, mieux que la plupart). Coût réel : Boxtal ≈ 6 € TTC + ~2 € carton/calage ; Colissimo
  guichet 9,59 € / 1 kg. Proposition faite : verres à domicile 7,90 €. RIEN changé tant qu'il ne l'a pas dit.

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

- **Accueil moderne** : maquette ENREGISTRÉE le 04/10 (version 5) — https://claude.ai/artifact/W8kig3DjxpGYeFxxpnpq4J — `docs/maquettes/accueil-moderne.html`, générateur `tools/maquettes/accueil-moderne.py`. Attend son « applique ». Rien en ligne.

- **Maquette « Accueil + univers » — direction « MÉLANGE » construite le 09/10 (il a répondu « Mélange » aux 3 pistes) : EN ATTENTE DE SON AVIS.**
  Les deux versions sont refaites (écrin de A en haut et pour la carafe, parcours en 3 étapes de C **en tuiles photo** (ses cartes blanches
  refusées le 09/10 : « bizarre »), bijoux plein cadre + verre de B,
  ton chaleureux de C partout, Inter + Playfair, logo intouché, toutes les corrections du 09/10 gardées) et republiées :
  sans puzzles https://claude.ai/artifact/Y96RDZxfvpMEHgnMQmmwj6 (v12) · avec puzzles https://claude.ai/artifact/2gPUibrL9LzWW4tY1n3HAM (v8).
  Générateur `tools/maquettes/accueil-univers.py <cat.json> [--puzzles]`, monde décrit dans `DESIGN.md`. Les 3 pistes restent
  visibles (https://claude.ai/artifact/8nwU5hA2o4AphYUm941zTC) s'il veut changer le dosage. Rien en ligne : attend « applique ».
- (historique) **Maquette « Accueil + univers » — VERSION LUXE du 09/10/2026** (feu vert du gérant : « tu peux tout changer sauf le logo ») :
  toutes les pages refaites (accueil, 7 univers, Toute la boutique, Offrir) dans un monde visuel crème / encre / or, Playfair +
  Jost, grandes photos gravées, mouvements sobres ; TOUTES les corrections du 09/10 gardées ; générateur unique
  `tools/maquettes/accueil-univers.py [--puzzles]` ; `DESIGN.md` + `PRODUCT.md` écrits pour que les prochaines maquettes
  ressemblent à celle-ci — sans puzzles https://claude.ai/artifact/Y96RDZxfvpMEHgnMQmmwj6 · avec puzzles
  https://claude.ai/artifact/2gPUibrL9LzWW4tY1n3HAM, rien en ligne : il choisit la version ; à trancher : Jost ou Inter, le
  coffret assorti (prix, −10 % dès 2 pièces), le rangement « Pour qui » / « Anniversaire » / fêtes datées dans `occasions.js` ·
  puis son « applique ».
## 📦 Matériel & conditionnement — en ligne le 11/10/2026
- ✅ Page Gestion → Matériel & emballages + bloc « Conditionnement » dans la file de production + matériel déduit dans Bénéfices.
- ❓ À confirmer par le gérant : pochettes lin (50 ou 24 achetées ?), papier de soie (60 feuilles ?), boîtes en bois (emballage ou produit ?), portions de calage (chips ≈ 2 L, raffia ≈ 10 g), carton 25×20×15 réellement acheté (lot de 15 ou de 25), tailles du sac / de la microfibre / de la boîte allongée, stocks réels de départ.
- 💡 Reste à proposer : lien avec Achats & factures, décompte à l'expédition, alerte « à racheter » dans le menu.

## 🔖 Marque-pages en bois (précommande) — maquette du 11/10/2026, en attente de son avis
- **12/10 soir — commande Alibaba passée** (relevé : `docs/marque-pages-commande-alibaba-2026-10-12.md`) : modèle 1 = 6 couleurs × 20,
  modèle 2 = 4 couleurs × 10, boîtes 10 / 10 / 10, arrivée estimée le 12/12. **Décision du gérant : les prix des maquettes déjà
  faites restent tels quels** (9,90 / 13,90 €, boîtes 4,90 / 5,90 / 7,90 €, gravure +2 €). Les deux lignes « marque-page
  métallique » (champagne ×35) et « style papillon » (doré ×5) = **nouveaux produits, maquette PLUS TARD** quand il donnera les
  photos. Reste à lui demander au moment voulu : places de précommande à reporter, une seule famille de boîtes pour les deux modèles.
- Artifact https://claude.ai/artifact/SVdzg13dw99fmeg1DSaYUa : 6 couleurs (caramel, blond clair, rouge, cuivré, gris anthracite, gris sable), 9,90 € seul, dessin +2 €, texte +2 €, boîtes cadeau 1/2/4 (4,90 / 5,90 / 7,90 €, coût des boîtes à confirmer, photo de la boîte d'un à envoyer), encadré « Précommande · série limitée ».
- À lui : donner SES dessins (numérotés), valider les prix, la formule de précommande, les noms de bois ; donner les dessins ; dire ce que sont « les boîtes » ; envoyer le modèle suivant.
- ⚠️ Avant de commander : demander au fournisseur l'essence réelle de chaque couleur et les documents CITES (palissandre / santal rouge = annexe II).
- Marque-pages : il doit choisir l'idée A, B, C ou D pour les couleurs d'un coffret (page `marque-pages-idees`) ; la couleur reste en haut.
- Marque-pages : idée C (fenêtre « Composer mon coffret ») choisie et mise dans la maquette de la fiche (v8) ; reste son avis, les dessins, la photo de la boîte d'un, l'essence réelle des bois (CITES) avant commande.
- Marque-pages modèle 2 (ajouré, oiseau et magnolia) : maquette faite le 11/10, 4 couleurs + coffret des 4 couleurs ; à confirmer : prix, coffret utilisé, texte au verso, vraie photo de la couleur Sable.
- ✅ 23/10 — **Zones de gravure données par le gérant** (outil à dessin) : `docs/maquettes/assets/marque-pages/zones/` (HAUT = nom horizontal ou petit dessin ·
  BAS = grand dessin ou nom à la VERTICALE ; modèle 2 : au-dessus de la fenêtre / à gauche de la branche ; dos = comme le modèle 1). ✅ « Oui la face se grave aussi » → maquette du modèle 2
  refaite (face : TEXTE seulement +3 €, place haut / bas vertical, pas de dessin « il y a déjà un dessin » ; verso +3 €), artifact CKqzt46EGgVntsypefi1Tv v3, en attente de son avis.
- ✅ 23/10 soir — « Enregistre toutes les maquettes » : les 3 maquettes marque-pages sont ENREGISTRÉES telles quelles (modèle 1 v3 SS39rAgHXq7yuJpD1vNctu ·
  modèle 2 v3 CKqzt46EGgVntsypefi1Tv, face texte seul · modèle 3 v4 VaSkxKqaBF6oeRDpQwKcji) + zones de gravure. Reste : son « applique » (fiches + précommande),
  photos atelier, formats du Papillon, une seule famille de boîtes.
- 24/10 — **Modèle 1 : les dessins numérotés du gobelet intégrés** (gérant : « intègre les images qu'on a choisies, comme pour le gobelet, avec les numéros… mets ceux que tu conseilles ») : artifact SS39rAgHXq7yuJpD1vNctu **v4** = les 10 planches de dessins (1–74) + les cadres retenus (88–94, 96–103), même parcours que le gobelet (planche agrandie au toucher, numéro tapé, grille repliée + « Changer de dessin »), place « en haut, petit / en bas, grand » (zones du 23/10), et dans le coffret un n° + une place par marque-page + « Voir les planches ». Modèle 2 non touché (pas de dessin). En attente de son avis.
- 24/10 — **v5 modèle 1 + v4 modèle 2 : place face / dos × haut / milieu par élément + APERÇU face et dos avec le vrai dessin** (89 dessins et cadres découpés, `mp_apercu.py`). 
- 24/10 soir — **v6 modèle 1 (texte dans un cadre enfin lisible) + v5 modèle 2 (dessin / cadre / photo au VERSO, +4 €, même parcours que le modèle 1 ; la face reste texte seul)**, sur sa demande. Puis v7 / v6 : le nom bien centré dans chaque cadre (cartouche, ruban, ornements). Puis v8 / v7 (24/10 soir) : cadres 96, 98, 102 = cadres complets à deux filets (97, 99, 103 n'existent plus), corrigé aussi dans la maquette du gobelet. Puis v10 / v9 : aperçu dans la couleur choisie et dans la grande photo (comme le carnet), coffret personnalisé pas à pas + « la même gravure sur les N ». Puis v11 / v10 : les planches directement dans la carte du coffret, bouton photo, tout centré sur le bois nu. En attente de son avis.
- 24/10 soir — **v12 modèle 1 + v11 modèle 2 : QUATRE emplacements par marque-page** (Face · en haut / au milieu, Dos · en haut / au milieu, chacun = rien / texte +3 € / dessin ou cadre +4 € / photo +4 € ; modèle 2 : face = texte seul) sur la fiche ET dans chaque carte du coffret, aperçu du coffret agrandi (≈ 523 px sur téléphone). Gérant : « c'est trop petit… s'il veut ajouter à l'avant et au dos, au-dessus et en bas, il faut qu'ils aient le choix ». En attente de son avis ; rien en ligne.
- 24/10 soir — **v13 / v12 : bouton « Valider ✓ » à côté du numéro du dessin** (demande du gérant) ; deux gravures par face déjà possibles avec les quatre menus. En attente de son avis.
- 24/10 soir — **Carnet A5 v4 : quatre emplacements par face** (En haut · Au milieu · En bas à gauche · En bas à droite, sur la couverture et au dos ; texte / dessin ou cadre / logo), prix proposé +7 € par face quel que soit le nombre d'emplacements (à valider). Artifact QSD8HCrAzEqrSEYA7viFMh v5 (v5 = 4 images d'exemple dans la galerie, jamais son nom). En attente de son avis.
- 24/10 soir — **Marque-pages v14 / v13 : images d'exemple de gravure dans la galerie** (4 pour le modèle 1, 3 pour le modèle 2, jamais son nom). En attente de son avis.
- ✅ 24/10 soir — **« Enregistre les maquettes déjà »** : marque-pages modèle 1 v15, modèle 2 v14, carnet v6, précommande Gestion v2 ENREGISTRÉES telles quelles. Réponses du gérant : places = facture Alibaba (20 / couleur modèle 1, 10 / couleur modèle 2, boîtes 10 / 10 / 10) ; boîte cadeau = colis au prix de l'option choisie (relais / domicile / Express) ; la date d'arrivée : il la donnera. Au « applique » : construire la précommande (catégorie Gestion à part, places, « Arrivage reçu ») + les fiches + le coffret par marque-page.
- 24/10 soir — gérant : « je pense que je le reçois la semaine prochaine » (semaine du 26/10). Si les marque-pages arrivent avant la mise en ligne, la précommande ne sert pas pour eux : on vend normalement (stock = quantités de la facture). À la réception : vraies photos gravées (face + dos, chaque couleur, les boîtes), pesée, puis « applique ».
- ✅ 24/10 soir — **Exemples avec une PHOTO de personne gravée** (sa demande, montrés d'abord, puis « Parfait, tu peux mettre dans les images… pour le carnet aussi ») : modèle 1 v17 (3 exemples photo de plus), modèle 2 v16 (3 de plus ; **la face accepte maintenant la photo EN HAUT, +4 €**, le bas de la face reste texte seul), carnet v9 (2 exemples photo ; v8 corrigée : la photo sur le noir sortait en négatif). Portraits = recadrages des photos de cristaux du site (`assets/marque-pages/exemples/portraits/`). En attente de son avis.
- ✅ 24/10 soir — **« On enregistre toutes les maquettes maintenant »** : modèle 1 v17, modèle 2 v16, métal v4, carnet v9, précommande Gestion v2 ENREGISTRÉES telles quelles. **Vidéo 30** livrée (teaser des trois modèles de marque-pages, métal compris) ; à refaire avec les vraies photos à la réception, comme la 29.
- 24/10 soir — **Vidéo 29, teaser « bientôt » des marque-pages** livrée (registre). ⚠️ Faite avec les aperçus des maquettes (pas de pièce gravée encore) : à refaire avec les vraies photos gravées à la réception.
- Précommande côté Gestion : maquette ENREGISTRÉE le 12/10 (v2, catégorie à part) ; au « applique » : construire ; restent à trancher : panier mixte, port des boîtes, délai légal.

## 🏷️ Étiquette d'adresse plus jolie — ✅ INTÉGRÉE le 14/10/2026 : les 4 styles au choix dans Gestion (il choisit quand il veut)
- `docs/maquettes/etiquette-adresse.html`, artifact https://claude.ai/artifact/Djpa5zALNmWwYzpum1YQE1.
  Trois habillages : A Écrin (double filet doré, logo centré en bas) · B Bandeau (pied crème, logo +
  « Gravé pour vous dans notre atelier » + nivcreation.fr) · C Sobre (coin doré, « Merci pour votre commande »,
  logo à droite). Adresse toujours en noir, CP + VILLE en gras majuscules ; logo d'origine, en bas.
- Au « applique » : reporter le modèle choisi dans `feuilleHtml` ET `feuillePdf` (`src/lib/etiquettes.js`),
  garder le resserrement automatique du texte (adresse longue), relancer `npm run test-etiquettes`.

- **16/10/2026 — Céline Naulin #10OPUHMO** (verre à whisky face + fond) : le mail du 16/10 20 h 46 lui annonce **un aperçu de sa
  gravure** → à lui envoyer par Gestion → la commande → « Communications & aperçu » avant de graver. Adresse de la commande
  corrigée (naulinceline71@gmail.com, ancienne « …gmail.comn » gardée dans `emailCorrigeDe`).

- **Noms de domaine nivcreation.fr + nivcreation.com : expirent le 28/03/2027, renouvellement auto DÉSACTIVÉ chez Hostinger**
  (renouvellement 10,99 € et 16,99 €/an). Le gérant veut renouveler pour 3 ans. Rappels programmés sur le site (Messages clients →
  envois programmés, vers contact.nivcreation@gmail.com) : jeudi 28/01/2027 9 h et vendredi 26/02/2027 9 h.
- **🍹 Verre à cocktail 33 cl (21/10/2026)** : maquette faite (captures `docs/maquettes/verre-cocktail-33cl-*.png`), choix « Taille du verre » 17 cl / 33 cl comme le verre à vin, mêmes photos et même aperçu. 33 cl : 19,90 / 37,90 / 71,90 € (coût 1,80 €/verre, Metro 19/10). ✅ **EN LIGNE le 21/10/2026** (`f87e2335`). Même jour : verre 1 = logo OU un texte offert, étiquettes « (offert) » (poussé sur son « Ok »).
- **💡 22/10/2026 — Lampe LED PSG** : 3 nouvelles photos (salon sombre / blanc / chaleureux) à la place des anciennes, rien d'autre changé. 1er déploiement Firebase en échec, relancé.

- 22/10/2026 : 1er déploiement de « Visibilité sur le site » en échec côté Firebase (build local OK), relancé.

- **⭐ Demandes d'avis du 22/10/2026 (19 h 10, par le site, sur l'ordre du gérant)** : 7 envoyées, toutes vues dans la boîte d'envoi — Lorraine Allain 1ZNESNSV · Dembele 1EPMUGMO · Nellycha Mafula 0ZH3LP9M · Marie Randriamalaza 02JTG1UH · Jessica Nollez 1PUMYQBL · Inès Doumi 0JCPPKTU · Anthony Giot 1MR8WS8X. Toutes les commandes plus anciennes avaient déjà reçu la leur. Jankowski 1P5XZKRP envoyé ensuite (19 h 20, sur son ordre). Pas envoyé : Laura Brimeux 0ZGGAEOJ (commande sur devis : le formulaire refuserait son avis), Enes Varol 1S9IOON5 (bracelet jamais reçu, toujours à l'atelier), Lorenzo Franchi 1YPJVC5R / 0GTB1LZ5 (colis perdu, retrait à Cabourg non confirmé), colis partis après le 15/10. ⛔ Ne plus renvoyer de demande à ces 7.

- **💛 Enes Varol #1S9IOON5 (bracelet « Hend » revenu du point relais, toujours à l'atelier)** : relance partie le 22/10 19 h 14 par le site : « recevoir votre bracelet Hend » ou « ajouter un bracelet Melyna, les deux partent ensemble » — SANS parler de payer la livraison (consigne du gérant). Question restée ouverte au gérant : si elle choisit de recevoir Hend, renvoi offert ou expédition à régler ? Statut Gestion « Livrée » (mis le 22/10 16 h 54) alors qu'elle ne l'a jamais reçu.

- **🌐 DOMAINE nivcreation.fr À SORTIR DE HOSTINGER (22/10/2026, côté gérant)** : compte Hostinger restreint DÉFINITIVEMENT → impossible de renouveler ou d'acheter chez eux ; domaine actif jusqu'au **28/03/2027**. Plan sûr validé par recherche (« je veux pas de coupure ») : ① captures de TOUTES les lignes DNS dans hPanel (A @ 35.219.200.110 Firebase, TXT fah-claim, CNAME _acme-challenge, SPF/DKIM/DMARC Resend, Google…) → je vérifie ; ② compte Cloudflare gratuit, ajouter le domaine, lignes recopiées et comparées, A/CNAME en « DNS only » (nuage gris) ; ③ hPanel : désactiver DNSSEC puis remplacer les serveurs dns-parking.com par ceux de Cloudflare, attendre « Actif » ; ④ seulement alors transfert chez **OVHcloud** (Cloudflare ne vend pas les .fr) : déverrouiller, « Obtenir le code » dans hPanel, transfert OVH en GARDANT les serveurs DNS Cloudflare. ⛔ Ne jamais transférer tant que les DNS sont chez Hostinger (certains registraires suppriment la zone à la fin du transfert → site + e-mails coupés). Au passage : corriger le www (CNAME encore vers Netlify, cf. §0). En attente des captures du gérant.

- ✅ **23/10/2026 — LES TROIS MAQUETTES MARQUE-PAGES ENREGISTRÉES TELLES QUELLES** (modèle 1 https://claude.ai/artifact/SS39rAgHXq7yuJpD1vNctu · modèle 2 https://claude.ai/artifact/CKqzt46EGgVntsypefi1Tv · modèle 3 https://claude.ai/artifact/VaSkxKqaBF6oeRDpQwKcji) : 9,90 / 13,90 / 15,90 € (Papillon 19,90), dessin ou photo +4 €, texte +3 €, métal sans gravure. En attente de l'« applique » (+ mécanisme de précommande à construire).
- **🔖 Marque-pages modèle 3 « métal, peintures célèbres » (23/10/2026)** : maquette https://claude.ai/artifact/VaSkxKqaBF6oeRDpQwKcji (8 tableaux × 5 pièces commandés, suivi GFFR26293177616129). Prix proposés 15,90 € / Papillon coffret 19,90 € (23/10 : « plus cher que les deux autres parce que c'est en métal »), SANS gravure (gérant 23/10 : pas de place sur le métal), boîtes 4,90 / 5,90 / 7,90. Modèle 1 : dessin OU photo +4 € / texte +3 € depuis le 23/10 → https://claude.ai/artifact/SS39rAgHXq7yuJpD1vNctu. En attente de son avis ; rien en ligne. Questions : prix, formats du Papillon, photos atelier. Modèle 2 : texte au verso +3 € depuis le 23/10 → https://claude.ai/artifact/CKqzt46EGgVntsypefi1Tv.
## 📓 Carnet A5 gravé — MAQUETTE du 23/10/2026, en attente de son avis
- 24/10 soir — **v3 : nos dessins numérotés + cadres (texte au milieu du cadre) + texte centré sur l'encre**, sur sa demande ; générateur `tools/maquettes/carnet-a5-dessins.py <base v2>`. En attente de son avis.
- `docs/maquettes/carnet-a5.html`, artifact https://claude.ai/artifact/QSD8HCrAzEqrSEYA7viFMh, générateur
  `tools/maquettes/carnet-a5.py` (capture de la vraie fiche, construite sur la machine seulement, rien poussé).
- Fournisseur (Alibaba, Wenzhou Senyuan) : A5 21,2 × 14,5 cm, couverture rigide aspect cuir, élastique, 100 feuilles 80 g,
  reliure cousue, 0,88 € pièce dès 20. Coloris retenus (entourés par lui) : marron, noir, gris.
- ✅ 23/10 (« c'est sept euros pour les gravures ») : carnet seul 12,90 € · gravure de la couverture +7 € (texte 2 lignes
  + 8 écritures, ou logo/dessin) · texte au dos +7 €. Carnet gravé = 19,90 €.
- COÛT RÉEL (reçu Alibaba #33986068501043880 du 23/10) : 60 carnets × 0,89 € + port 153,94 € + frais 6,20 € = 213,07 €
  → **3,55 € le carnet** (le port pèse 2,57 €). ⚠️ Adresse « Ship to » du reçu = Cangnan, Wenzhou (Chine) : à vérifier.
- ✅ 23/10 : maquette ENREGISTRÉE telle quelle (« tu enregistres, tu mets rien en ligne ») ; relevé du marché dans
  `docs/prix-marche.md` (gravé 12,50–19,90 € chez les artisans FR, 39,90 € cuir vegan, 6,99 € Amazon).
  Poids estimé 380 g → lettre suivie 8,90 € / relais 4,90 € : À VÉRIFIER (pesée réelle).
- Couvertures DESSINÉES dans la maquette : il faudra de vraies photos gravées avant la mise en ligne.

## 🌐 DOMAINE nivcreation.fr — À TRANSFÉRER AVANT LE 28/03/2027 (vu le 23/10/2026)
- Hostinger a mis une restriction PERMANENTE sur son compte : renouvellement impossible chez eux. Le domaine reste actif
  jusqu'au 28/03/2027. Il faut le transférer vers un autre registrar (ex. OVHcloud ou Gandi, qui gèrent le .fr).
- ⚠️ AVANT de changer quoi que ce soit : recopier TOUS les enregistrements DNS actuels (A du site Firebase, TXT fah-claim,
  CNAME _acme-challenge, MX, SPF/DKIM/DMARC de Resend et de la messagerie) chez le nouveau registrar, sinon le site et les
  e-mails tombent. C'est LUI qui fait le transfert (son compte) ; on peut lui préparer la liste.

## 🍷 NICKY (twigglet.73@gmail.com) — GRAVURE SUR LE PIED D'UN VERRE À VIN — répondu le 25/10/2026 à 9 h 12
- Elle voulait un verre à vin sans pied (nous n'en avons pas) ou une gravure sur le pied. Le gérant : « je peux graver le pied ».
- Réponse partie par le site (page de validation de l'agent) : texte sur le pied = gravure offerte du verre 1 → ⚠️ ERREUR : prix d'avant le 13/10 annoncés
  (2 € de moins que la fiche) ; correction envoyée par le site le 25/10 à 12 h 50 (17,90 € / 21,90 €, texte sur le pied compris) ; port en plus ; chaque texte en plus +3 €. Elle doit donner le texte et la taille → **devis à faire** à sa réponse.
- L'option « gravure sur le pied » n'existe pas sur la fiche (devis seulement). Idée : l'ajouter aux verres à vin (voir AMELIORATIONS).
