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

## 🧸 Univers « Bébé & Enfant » + coffret assorti (08/10/2026, idée après recherche — maquette faite, RIEN construit)
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

## 🔎 Vu pendant la refonte de la maquette accueil + univers (09/10/2026 — RIEN construit, à lui de dire)
- **Champ de recherche dans l'en-tête** : toutes les boutiques comparées en ont un (Amikado, Merci Maman, CadeauGravure) ;
  le site n'a que la recherche de la page Boutique. L'en-tête ne se touche pas sans sa demande (règle du 04/10) → à proposer.
- **« Prévenez-moi dès sa sortie » sur les produits « Bientôt »** (puzzles, cristaux déjà gravés), sur le modèle de l'alerte
  « retour en stock » (`RestockAlerte.jsx`) : une liste d'adresses prête le jour du lancement, aucun e-mail automatique.
- **`occasions.js` à enrichir au « applique »** : rangement « Pour qui » (elle / lui / couple / bébé & enfant / parents),
  occasion « Anniversaire », fêtes datées (calendrier `src/lib/fetes.js` proposé plus haut) → menu Offrir, /offrir, bloc
  « Trouver un cadeau », bandeau Noël. La maquette porte déjà ces règles (`QUI_EXTRA`, `prochainesFetes`).
- **Prix « dès »** : la vignette du site affiche le prix de la 1re variante avec « dès » même quand une autre variante est
  moins chère (ex. Arches Bohèmes 18,90 € alors que le lot est à 16,90 €) → à vérifier dans `ProductCard` si c'est voulu.

## ✦ Vu pendant la refonte « luxe » des maquettes accueil + univers (09/10/2026 — RIEN construit, à lui de dire)
- **Un monde visuel pour TOUT le site** : `DESIGN.md` décrit les jetons (réécrit le 09/10 pour le Mélange : écrin encre et or,
  parcours en trois étapes, cartes arrondies 20 px, bouton or dégradé, Inter + Playfair). Si la maquette lui plaît, les fiches produit,
  le panier, les pages Offrir et les e-mails pourraient reprendre ces mêmes jetons (une maquette par page, puis « applique »).
- **Ruban d'en-tête** (livraison offerte dès 45 € sur les bijoux · gravé en France · paiement sécurisé) : les boutiques de
  bijoux en ont toutes un ; sur le site il pourrait remplacer le bandeau « Nouveau » quand il n'y a pas de promotion.
- **Rail des nouveautés trié par la vraie date d'ajout** (`productDates.js`) et étiquette « Nouveau » éteinte à 30 jours :
  déjà le cas sur le site pour « Vient d'arriver » ; la maquette montre 6 pièces au lieu de 4.
- ~~**Police d'interface** : Jost à la place d'Inter~~ — abandonné le 09/10 avec la version luxe : le Mélange garde Inter + Playfair, les polices du site.
- **Le parcours en trois étapes comme bloc réutilisable** (09/10, direction Mélange) : les cartes à cocher numérotées ①②③ de
  « Trouver le bon cadeau » sont la même grammaire que le parcours guidé des fiches (carafe, vin, flûte) ; si le Mélange est
  validé, le même composant pourrait servir à la page Offrir du site, au choix d'emballage et au choix de coffret.

- 💡 **Étiquette « Best-seller » automatique (proposée le 10/10/2026, question du gérant « on peut mettre des best-sellers ? »)** :
  calculée chaque jour sur les VRAIES commandes (90 derniers jours, hors annulées / remboursées / tests, en nombre de pièces),
  posée sur les 3 à 5 produits les plus vendus (cartes, fiches) et, en option, un rail « Nos meilleures ventes » sur l'accueil.
  Remplacerait l'étiquette « Best-seller » écrite à la main sur le Collier 3 Cœurs (accueil, bloc bijoux), dont la vérité n'est
  pas vérifiée. Les chiffres existent déjà (Gestion → Statistiques, « Produits les plus vendus »). ✅ Maquette faite le 10/10 (« oui ») : `docs/maquettes/best-sellers.html`, artifact https://claude.ai/artifact/N2eUzA3BCz3T9MG5ARJBLn,
  générateur `tools/maquettes/best-sellers.py` (classement d'EXEMPLE). ✅ **ENREGISTRÉE TELLE QUELLE le 10/10/2026
  (« Enregistre la maquette Best Seller », version 1)** : c'est CETTE version à reproduire le jour où il dit « applique »
  (classement réel sur 90 jours, 5 produits, rangée après « Les dernières sorties », étiquette posée partout, celle du
  Collier 3 Cœurs retirée s'il n'est pas dans le vrai classement). Ne pas la modifier sans sa demande.
