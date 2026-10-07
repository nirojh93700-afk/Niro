# 📋 TOUT CE QUI EST EN ATTENTE — inventaire de reprise

> **Mis à jour le 29/09/2026.** Ce fichier est l'index unique pour reprendre le travail depuis
> n'importe quelle conversation : messages à envoyer, maquettes validées non appliquées, projets en
> pause, actions côté gérant, questions sans réponse. Le détail de chaque sujet reste dans
> `CLAUDE.md`. **À tenir à jour** : quand une ligne est faite, la barrer ou la retirer.

---

## 0. Côté gérant, après mise en ligne
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

- **Maquette « Cristaux déjà gravés » (07/10/2026) — ENREGISTRÉE (version 4)** — https://claude.ai/artifact/X7GRtRJuZ8Hjw66rTZFcVz, rien en ligne :
  (prix = cristaux photo ✅, format au choix du client ✅) · « Fillette au ballon » (Banksy, droits) à garder ? ·
  « I Love You » de l'ourson · noms des 16 modèles · 15 dessins ajoutés (licence pngtree des 2 mariés, fée qui
  ressemble à la Fée Clochette, colibri couleur en double) · son « applique ».

- **Remboursement, palier du milieu** : après 24 h, retenue de **10 €** (valeur actuelle) ou **−10 %** ?
- **Prix du gobelet 40 oz** : ✅ **47,90 € net, livraison en plus** (fixé par le gérant le 03/10/2026, maquette à jour).
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

- **Accueil moderne** : maquette ENREGISTRÉE le 04/10 (version 5) — https://claude.ai/artifact/W8kig3DjxpGYeFxxpnpq4J — `docs/maquettes/accueil-moderne.html`, générateur `tools/maquettes/accueil-moderne.py`. Attend son « applique ». Rien en ligne.
