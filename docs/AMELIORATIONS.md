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
