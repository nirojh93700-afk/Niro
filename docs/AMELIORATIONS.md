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

## 💡 Facturation électronique (10/10/2026) — à proposer, rien construit
- Depuis le 01/09/2026 toutes les entreprises françaises assujetties à la TVA (micro-entreprises comprises) doivent pouvoir
  RECEVOIR des factures électroniques via une plateforme agréée ; l'ÉMISSION et l'e-reporting deviennent obligatoires pour les
  micro-entreprises au 01/09/2027 (sources : Pennylane, Compta-Online, facture-electronique-pro.fr — à vérifier sur impots.gouv.fr).
- Concerne les ventes ENTRE PROFESSIONNELS (devis/factures aux restaurants et bars, aux entreprises) ; les ventes aux particuliers
  relèvent de l'e-reporting. Source de doute : une seule source annonce un changement de la mention de franchise de TVA (art. L.223-3 CIBS).
- Piste : adapter Gestion → Devis & factures (format Factur-X / plateforme agréée) et « Achats & factures » (factures fournisseurs reçues).

## 💡 Précommande / série limitée sur une fiche produit (11/10/2026) — à proposer, rien construit
- Marque-pages en bois (stock pas encore arrivé) : il faut pouvoir vendre AVANT réception. Aujourd'hui rien n'existe : pas de bouton
  « Précommander », pas de compteur de places. Idée : champ produit `precommande: { message, limite }` → badge « Précommande »,
  encadré explicatif sous le titre, bouton « Précommander », mention dans le panier, l'e-mail de confirmation et la fiche atelier
  (« à graver à réception du stock »), compteur « N places restantes » si `limite` (stock suivi), coupe-circuit à zéro.
  Réutilisable pour tout futur arrivage (cadeaux de Noël, nouveaux modèles). ⚠️ Règle : aucune date promise.

- **Précommande — ce qu'il faudra décider avant de construire (12/10/2026)** : ① paiement tout de suite (le site ne sait payer qu'au moment de la commande) ② nombre de places = quantité commandée au fournisseur (sinon stock illimité) ③ **délai de livraison à annoncer** (obligation légale : une date ou un délai, sinon 30 jours maximum, au-delà le client peut annuler — à vérifier ; en tension avec la règle « aucune date promise » dans les mails) ④ panier mixte (précommande + article en stock : un seul colis à la fin ou deux envois) ⑤ marque « précommande » dans Gestion, la file de production et la fiche atelier ⑥ message « c'est arrivé » envoyé par LUI via Messages clients (jamais automatique) ⑦ remboursement si le fournisseur ne livre pas.

## 🛒 « Paniers abandonnés » de Gestion → Visiteurs : chiffre gonflé (14/10/2026, question du gérant « pourquoi autant d'abandons ? »)
- Le chiffre = clics « Ajouter au panier » − achats (`statistiques/page.jsx`, `abandoned = addToCart − purchase`). Ce n'est PAS
  un nombre de personnes : une cliente qui met 3 articles puis paie compte 2 « abandons » ; ajouter, retirer, ré-ajouter compte
  à chaque fois ; ses propres essais aussi.
- L'achat n'est compté que si la cliente revient sur la page /merci après Stripe (`track("purchase")` dans `merci/page.jsx`) :
  une cliente qui paie puis ferme l'onglet compte comme un abandon.
- ✅ EN LIGNE le 14/10/2026 (« refais le compteur » puis « pousse ») : voir CLAUDE.md « COMPTEUR DES PANIERS ».
- Piste d'origine : compter les paniers PAR VISITE (une seule fois par session, comme `trackOnce`), compter l'achat
  au webhook Stripe (côté serveur, sûr), et afficher où ils partent : panier → « Paiements lancés » → payé, plus les paniers
  Stripe expirés (`checkout.session.expired`) qui sont les vrais abandons au paiement.

## 📮 Suivi La Poste affiché DANS Gestion (proposé le 14/10/2026)
- Aujourd'hui (en ligne le 14/10) : un numéro La Poste ouvre la page de suivi laposte.fr — aucun compte nécessaire.
- Possible en plus : lire l'état du colis directement dans Gestion (« en cours », « livré ») et passer la commande en
  « Livrée » toute seule, avec l'API Suivi de La Poste (gratuite, compte sur developer.laposte.fr, clé « Okapi »).
  Le gérant met la clé lui-même en secret Firebase (`LAPOSTE_OKAPI_KEY`), jamais dans la conversation ni dans un fichier.
  À construire seulement s'il le demande.

## 💡 16/10/2026 — Plusieurs verres, une seule photo (cas 0E3Y9OBX, logo manquant)
- **Constat** (vérifié sur les 36 commandes) : la cliente a pris le verre à vin 47 cl **« À l'unité » × 2** au lieu du **« Lot de 2 »** :
  sur « À l'unité », la fiche n'a qu'**un seul champ photo** (une 2ᵉ image remplace la 1ʳᵉ) et le choix **« Chacun différent »**
  n'apparaît que sur les lots. Résultat : un seul visuel enregistré pour deux verres, le logo a dû être redemandé par e-mail.
  C'est la seule commande dans ce cas ; Olivier Chesta (cocktail, lot de 4, « Chacun différent ») a bien eu ses 4 photos.
- **Pistes** (à proposer, rien de construit) : ① sur une fiche verre, quand la quantité passe à 2 ou plus en mode photo, afficher
  « Des verres différents ? Prenez le lot de 2 puis “Chacun différent” » (le lot est aussi moins cher : 39,90 € au lieu de 43,80 €) ;
  ② ou proposer « Chacun différent » aussi sur « À l'unité » quand la quantité dépasse 1 ; ③ dans Gestion, une pastille
  « 2 verres, 1 seule photo — vérifier » sur ce genre de commande.
- ✅ **Maquette faite le 16/10/2026** (« fais-moi la maquette des trois et alerte ») : `docs/maquettes/plusieurs-photos.html`,
  artifact https://claude.ai/artifact/Gey5ZJW7Fh5kjyVPaajYwQ, générateur `tools/maquettes/plusieurs-photos.py <fiche capturée>
  <.next/static/css> <photo> <sortie>` (vrai rendu de /produit/verre-a-vin-grave, 47 cl, À l'unité, mode photo, quantité 2).
  Idée 1 encadré sous le bouton · Idée 2 « Chacun différent » sur À l'unité · Idée 3 alerte « 2 verres, 1 seule photo » dans la
  file de production ET la fiche atelier (pour tous les produits photo). **Rien en ligne : en attente de son choix.**
- ✅ **Onglet « Prix » ajouté le 16/10 (gérant : « le deuxième, le troisième logo est payant »)** : première image comprise,
  **chaque verre gravé d'une image DIFFÉRENTE : +3 €** (montant PROPOSÉ, aligné sur le supplément texte des verres, à valider
  par lui) ; un verre qui reprend la même image ne coûte rien de plus ; les textes restent +3 € chacun. Exemples dans la maquette :
  2 verres même photo 43,80 € · photo + logo 46,80 € · lot de 4 avec 4 images 86,90 € · lot de 4 avec 2 images 80,90 €.
  À la construction : compter les images distinctes dans `perGlass` au checkout (comme `textExtra`), affichage « +3 € » sur
  l'onglet du verre, ligne par verre dans le résumé, la fiche atelier et le mail de confirmation.
- ✅ **RÈGLE DE PRIX VALIDÉE PAR LE GÉRANT LE 16/10/2026 (« OK fais comme ça »)**, maquette v4 (même artifact) :
  **verre 1 comme aujourd'hui** (image comprise, texte +3 €) ; **chaque verre suivant** : identique au verre 1 (même image,
  même texte) = rien en plus ; **différent** (autre image et/ou autre texte) = **forfait +5 € tout compris**, image et texte.
  Conséquence : un texte identique sur tous les verres n'est compté qu'une fois (« À l'unité × 2 » s'aligne sur le lot, où le
  supplément est déjà ajouté une seule fois). Exemples : 2 verres photo + logo = 48,80 € · même logo + prénoms différents = 51,80 € ·
  lot de 4 avec 4 images = 92,90 € · 6 verres tout différent = 159,40 €.
  **Atelier (sa demande : « bien identifié, bien détaillé dans l'atelier gravure »)** : fiche atelier avec un tableau UNE LIGNE PAR VERRE
  (vignette de l'image, texte entre guillemets, écriture, face), « Vendu en plus » qui liste verre 1 / verre 2 · différent · forfait + 5 €,
  et la carte de la file de production qui écrit le détail par verre. Même tableau sur la fiche imprimée.
  **Rien en ligne : attendre son « applique ».** À construire alors : « Chacun différent » dès quantité ≥ 2 sur À l'unité (idée 2),
  forfait verre différent au checkout (comparer image + texte de chaque verre à ceux du verre 1), alerte « N pièces, 1 seule image »
  (idée 3), tableau par verre dans `FicheAtelier` / `FichePapier` / `/gestion/atelier`, ligne par verre dans le mail de confirmation.
- ✅ **Complément du 16/10 (gérant : « quand c'est le même verre, même logo, même texte, on met un peu plus, frais de gravure ; le client
  doit savoir en détail ce qu'il paie »)**, maquette v5 : **verre identique au verre 1 = +2 € de frais de gravure** (montant PROPOSÉ,
  à valider) ; verre différent toujours +5 € tout compris ; verre 1 inchangé. Le résumé de la fiche devient **« Le détail de votre
  prix »**, ligne par ligne : « 2 verres × 21,90 € », « Verre 1 · gravure de votre photo · comprise », « Verre 1 · texte · aucun », « Verre 2 ·
  différent : gravure du logo + texte … · + 5,00 € » ou « Verre 2 · identique au verre 1 : frais de gravure · + 2,00 € », total. Le même
  détail doit se retrouver au panier, dans le mail de confirmation et sur la fiche atelier. ⚠️ Conséquence : un lot « identiques » avec
  gravure coûte N−1 fois 2 € de plus qu'aujourd'hui (lot de 4 même prénom : 86,90 € au lieu de 80,90 €).
- ✅ **Précision du gérant, 16/10 (« quatre verres identiques : un petit frais en plus, mais pas pour chaque verre, un seul frais en
  total »)**, maquette v7 : les **frais de gravure pour les verres identiques = +2 € UNE SEULE FOIS par commande**, quel que soit le
  nombre de verres identiques (montant proposé). Exemples : lot de 4 même prénom 77,90 + 3 + 2 = 82,90 € · 6 verres identiques
  136,40 € · lot de 4 avec 2 images (2 verres chacune) 77,90 + 5 + 2 = 84,90 €. Le verre différent reste +5 € chacun.
- ✅ **Dernier réglage du gérant, 16/10 (« pour deux verres identiques tu enlèves les 2 € ; à partir de quatre tu mets un frais »)**,
  maquette v8 : verres identiques au verre 1 = **rien en plus jusqu'à 3 verres**, **+2 € de frais de gravure en tout à partir de 4 verres
  identiques** (montant proposé). 2 identiques même prénom 46,80 € · 3 identiques 68,70 € · lot de 4 identiques 82,90 € · lot de 4 avec
  2 images (2 verres chacune, aucune série de 4) 82,90 €. Le détail du prix écrit la ligne « Verre 2 · identique au verre 1 · 0,00 € ».
- ✅✅ **GRILLE FINALE VALIDÉE PAR LE GÉRANT LE 16/10/2026 (« Oui c'est ça, fais la maquette »)**, maquette v10 (même artifact) — remplace
  les essais précédents (2 € par verre, 2 € en tout, gratuit jusqu'à 3) :
  · verre 1 : image ou logo **offert**, texte **+3 €** (le texte se paie TOUJOURS, même pour 1 ou 2 verres) ;
  · chaque verre **différent** (autre image et/ou autre texte) : **+5 € tout compris** ;
  · frais de gravure pour les verres **identiques**, une seule fois par commande : **1 ou 2 verres : aucun · 3 ou 4 : +2 € · 5 ou 6 : +5 €**
    (au-delà de 6 : non tranché, 5 € par défaut à confirmer).
  Exemples (verre à vin 47 cl) : 1 verre logo + prénom 24,90 € · 2 identiques 46,80 € · 3 identiques 70,70 € · lot de 4 identiques 82,90 € ·
  6 identiques 139,40 €. **Rien en ligne : attendre son « applique ».**
- ✅ **VERSION FINALE DE LA MAQUETTE, 16/10/2026 (« Fais-moi la maquette. Finale »)**, v11 : la grille de prix (image offerte · texte +3 € ·
  verre différent +5 € · frais verres identiques 1-2 aucun / 3-4 +2 € / 5-6 +5 €) est posée dans le volet **« Personnalisation & Entretien »**
  de chaque fiche verre (au « applique » : dans `productInfo.js` ou en bloc rendu par `ProductDetail.jsx` pour toutes les fiches verres) ;
  le tableau d'exemples est marqué « pour toi seulement », il NE va PAS sur le site. C'est CETTE version à reproduire au « applique ».
- 💡 Vu au passage sur la fiche verre à vin (volet « Personnalisation & Entretien », texte en ligne) : « Trois façons de personnaliser »
  alors que la fiche en propose quatre (la photo / le logo manque), et « c'est du cristal » alors que le 47 cl n'est pas annoncé en cristal.
  À corriger sur son mot.


- **16/10/2026 — Adresse e-mail mal tapée au paiement** (commande 10OPUHMO, « gmail.comn ») : signaler au panier une adresse
  probablement fausse (gmail.comn, gmial.com, hotmial.fr…) avant d'aller payer. Proposé, pas construit.
