# 💡 Nouveautés possibles pour le site — liste tenue pour le gérant

> Règle du gérant (29/09/2026) : « il faut que tu me mettes une alerte si t'as des nouveaux trucs,
> nouveau système pour améliorer le site, et tu me le dises ». **Chaque idée est notée ici ET
> annoncée en fin de message** (« 💡 Nouveauté possible : … »). Il choisit, puis « fais la maquette »,
> puis « applique ». Rien n'est construit sans son mot. Quand une ligne est faite : la barrer.

## Proposées le 29/09/2026
1. **Parcours guidé (comme la carafe) sur les autres fiches à choix** — ~~verre à vin et flûte~~
   ✅ en ligne le 29/09 ; reste : verre à whisky perso + cocktail + fête des pères (face / fond),
   puis support téléphone bois (42 modèles + lettre fleurie + photo).
2. ~~Verre à vin : incohérences « styles 1 à 19 » / « 26–42 »~~ ✅ corrigées par le parcours (29/09).
3. ~~Carafe : champs facultatifs~~ ✅ fait le 29/09.
4. **Modèles 20 (Johnnie Walker) et 32 (Jack Daniel's) de la carafe** = marques déposées ; à retirer
   ou remplacer par un motif « whisky » neutre (comme le n° 33).
5. **Date +3 € sur les modèles qui l'incluent** (carafe 18–28, vin 26–30, flûte 14–16 / 31–35) :
   la date fait partie du dessin, faut-il la facturer ? À trancher.

## Proposées le 02/10/2026 — moderniser la Gestion → TOUTES FAITES le 02/10 (« Fais tout »)
6. ~~Menu qui ne changeait pas d'onglet + chargement lent~~ ✅ corrigé le 02/10 (compteurs légers,
   chargement en parallèle, plus de déconnexion sur un raté réseau, onglets chargés à la demande).
7. ✅ (02/10) **Une vraie page par écran** : Avis, Devis, Produits, Apparence… vivent encore DANS l'accueil
   (fichier de 1 800 lignes, 18 onglets). Chacun sa page `/gestion/avis`… → plus rapide, le retour
   du téléphone marche partout, un lien direct par écran.
8. ✅ (02/10) **Mémoire partagée entre les écrans** : revenir sur un écran déjà vu = affichage instantané
   (les données se rafraîchissent derrière), au lieu de tout recharger à chaque clic.
9. ✅ (02/10) **Recherche universelle (Ctrl+K / loupe)** : une seule case qui trouve commande, cliente,
   produit, devis ou écran (comme Shopify).
10. ✅ (02/10) **Icône « Niv Admin » sur le téléphone** : le réglage de l'appli admin (icône, plein écran,
    nom) est dans un fichier ignoré (`gestion/layout.js` en double de `layout.jsx`) → il ne
    s'applique pas. À fusionner.
11. ✅ (02/10) **Notifications sur le téléphone** (nouvelle commande, réponse de cliente) via l'appli admin,
    avec son accord une fois.
12. ✅ (02/10) **Contrôle Gmail des réponses non lues (≈ 5 s) déplacé côté serveur** (battement du site) :
    l'admin lirait le résultat déjà prêt.
13. 💡 (03/10) **Devis : point relais + livraison choisis par le client sur le lien du devis** (question du gérant,
    dossier Simon Pascal, clé USB 64 Go). AUJOURD'HUI `/api/quote-pay` ne collecte que l'adresse à domicile
    (Stripe) : pas de carte de points relais, pas de choix de livraison, pas de port ajouté tout seul.
    À construire : sur `/document/<id>`, choix domicile / relais (`RelaisPicker`), port calculé comme au
    panier (poids à saisir par ligne de devis), transmis à `quote-pay` (`relaisPoint` en metadata — le webhook
    Stripe l'affiche déjà « 📍 Point relais choisi »). Toujours : maquette → « applique ».

## Déjà notées avant (rappel, détail dans CLAUDE.md / EN-ATTENTE.md)
- Audit comparatif du 19/09 : **date de livraison estimée** sur la fiche, **message cadeau** au
  paiement, **alerte stock bas** (blocs 2, 3, 4 — validés dans le principe, pas construits).
- Étude de marché du 26/09 : prix porte-clés cuir, veilleuse, bracelets homme ; afficher
  « livraison offerte » plus visiblement ; trancher la 1re gravure bijoux ; préparer
  Saint-Valentin / fête des mères.
- Gobelet isotherme (maquette validée, attend « mets en ligne ») · boule de Noël (enregistrée) ·
  date limite de commande pour Noël à afficher dès qu'il la donne.
- Avertissements React #425/#418/#423 sur l'accueil (invisibles pour la cliente, à nettoyer un jour).

## 14. Inscrire AUTOMATIQUEMENT chaque client à la newsletter, devis compris (proposé le 04/10/2026, RIEN fait)
> Gérant : « il doit transmettre automatiquement, même tous les clients qui commencent par un devis ».
- Aujourd'hui : un client qui paie (boutique OU devis) devient bien un **client** (commande + dossier), mais
  **n'est PAS ajouté** à la newsletter — `addSubscriber` n'est appelé que par `/api/newsletter` (fenêtre de
  bienvenue / pied de page). Constat du 04/10 : 21 clients distincts, 17 déjà inscrits, **4 non inscrits**.
- Proposition : au webhook Stripe (commande payée, devis payé compris) → `addSubscriber(customerEmail)`, sans e-mail
  de bienvenue ni code ; + rattrapage unique des 4 clients non inscrits.
- ⚠️ À trancher avant (RGPD/CNIL) : inscrire sans demander n'est permis que pour des produits ANALOGUES et si le
  client a pu refuser à la collecte + chaque envoi porte un lien de désinscription. **Aucun lien de désinscription
  trouvé dans les e-mails de newsletter du code** → à ajouter avant toute inscription automatique (et une case
  « je souhaite recevoir… » au paiement serait plus sûre). Rien n'est appliqué sans son « applique ».

## 15. « EXPÉDIÉE » ENVOYÉ AVANT LE VRAI DÉPART DU COLIS + LIVRAISON À DOMICILE LENTE (constaté le 06/10/2026, RIEN fait)
> Gérant, captures Boxtal / Mondial Relay / Paack : colis de Madame Monhardt (étiquette 02/10, remis au transporteur
> le 06/10), de Cécilia Herrera (« expédiée » 30/09, premier scan 06/10, puis confié par Mondial Relay à **Paack** —
> sous-traitant de livraison à domicile), de Rose Catarino (aucun scan depuis le 30/09). Les clientes ont reçu
> « votre commande est expédiée » plusieurs jours avant le départ réel.
- Proposition 1 : n'envoyer le mail « expédiée » (et ne marquer « Expédiée ») qu'**après le premier scan du
  transporteur** (suivi Boxtal), ou garder le statut « Étiquette créée » tant qu'il n'y en a pas.
- Proposition 2 : la livraison à domicile Mondial Relay passe par des sous-traitants (Paack) et traîne ; comparer avec
  Colissimo / Chronopost à domicile pour les colis fragiles (verres) — coût Boxtal à relever avant de proposer.
- Rien n'est appliqué sans son « applique ».

## 🍪 Conformité « cookies » du site (07/10/2026, vérifié dans le code après une vidéo TikTok envoyée par le gérant)
- Google Analytics (`settings.gaId`, renseigné G-RMBERKLVN9) et le pixel Meta (`settings.metaPixelId`, s'il est
  rempli) se chargent dans `layout.jsx` **dès l'arrivée, sans demander l'accord** → non conforme CNIL. Et
  `/confidentialite` §5 dit « pas de cookies publicitaires / seulement le panier » → page à corriger.
- Proposition : bandeau cookies « Tout accepter / Tout refuser / Personnaliser » (refuser aussi visible qu'accepter),
  GA et Meta chargés SEULEMENT après « accepter », choix gardé 6 mois, lien « Gérer mes cookies » en pied de page,
  § cookies de la politique de confidentialité réécrit. Compteur de visites interne (sans cookie) inchangé.
- Le reste de la liste de la vidéo existe déjà : confidentialité, CGV, retours, mentions légales (SIRET), médiation (§9 CGV).
- Rien n'est appliqué sans son « applique ».

## 🧸 Univers « Bébé & Enfants » + coffret au prénom (08/10/2026, idée après recherche — RIEN construit)
- Constat : les couverts enfants sont rangés dans « Déco & Maison » (`category: "deco"`, sous-cat. couverts) ;
  la veilleuse au prénom et la plaque de porte enfant aussi ; « Naissance » n'a que plaques + cartes étapes.
- Recherche (Amikado : rubrique « enfance » ; My 1st Years : par âge + par occasion + coffret « Best of » ;
  Baby'Sphère : coffret naissance qui regroupe plusieurs pièces ; Etsy : le puzzle prénom en bois = best-seller enfant).
- Idée : renommer « Naissance » en « Bébé & Enfants » avec 4 rayons (Naissance & baptême · Repas · Chambre · Jeux),
  y ranger couverts, veilleuse prénom, plaque de porte, plaques/cartes, puzzles (quand ils sortent) ; entrées par âge
  (0-1 an, 1-3 ans, 3 ans et +) et par occasion (naissance, baptême, 1er anniversaire, Noël).
- Idée phare : « Les univers assortis » — un même thème animal (savane, océan, forêt, dinosaures) sur les couverts,
  le puzzle, la veilleuse, la plaque de porte ; le prénom tapé UNE fois ; coffret de 2 ou 3 pièces avec petite remise.
- Rien n'est appliqué sans son « applique ».

## 📅 Fêtes calculées automatiquement sur tout le site (08/10/2026, demandé par le gérant sur la maquette — RIEN construit)
- Aujourd'hui `occasions.js` n'a aucune date : « Fête des pères » peut rester affichée en octobre, le bandeau Noël
  s'éteint à la main (`settings.sections.noel`).
- Proposition : un calendrier (`src/lib/fetes.js`) avec les mêmes règles que la maquette → menu « Offrir », page /offrir,
  bloc « Trouver un cadeau », et le bandeau de l'accueil (Noël → Saint-Valentin → fête des mères → fête des pères) qui
  change tout seul, X jours avant chaque fête. Rien n'est appliqué sans son « applique ».
