# Prospection bars & restaurants — logo gravé sur nos verres (26/09/2026)

> ⚠️ Version 3 (26/09) : adresse de Paris remise, SIRET retiré, PRIX RETIRÉS du message (sauvegardés
> plus bas), phrase « pas de limite, demande spéciale » + bois ajoutés.
> **Statut : BROUILLON, RIEN N'EST ENVOYÉ.** Le gérant écrira « envoie » quand il valide.
> Canal unique : **Gestion → Clients → Messages clients** (un envoi par établissement,
> `POST /api/admin/send-client-email`). Jamais par Gmail en dehors du site.
> Liste du lot 1 : `docs/prospection/bars-restaurants-lot1.csv` (30 adresses, **toutes à vérifier** :
> les sites des établissements sont bloqués par le réseau de l'environnement, les adresses viennent
> des extraits de recherche — le gérant les confirme en ouvrant les liens depuis son navigateur).

## Ce que le site ajoute tout seul (ne pas le recopier dans le message)
- le sujet en titre, en haut de l'e-mail ;
- le bouton « ✉️ Répondre à ce message » ;
- la signature « Niv Création ».

## Sujet
Le logo de votre établissement, gravé sur vos verres

## Message — version 3 (26/09/2026), SANS PRIX

> Texte identique à `messageProspect()` dans `src/lib/prospects.js` (c'est lui que le bouton
> « Écrire » de Gestion → Restaurants & bars pré-remplit). Modifier les deux ensemble.

Bonjour à l'équipe de {Établissement},

Niv Création est un atelier français de gravure personnalisée. Nous gravons à la commande des verres à cocktail, des verres à whisky, des verres à vin et des flûtes à champagne, ainsi que des pièces en bois.

Nous proposons aux bars et aux restaurants de graver le logo de leur établissement sur leurs verres. C'est un détail que vos clients remarquent, qui signe chacune de vos photos de cocktails sur les réseaux, et qui donne à votre service une vraie identité.

Au-delà des verres, nous gravons et découpons aussi le bois pour votre salle : cartes menu en bois gravées, numéros de table, découpes à votre logo.

Et il n'y a pas de limite : si vous avez une idée particulière, une pièce unique pour votre établissement, demandez-nous. Si nous pouvons la réaliser, nous la réaliserons.

Comment cela se passe :
- vous nous envoyez votre logo ou votre idée (fichier vectoriel de préférence : PDF, SVG ou AI ; une image nette convient aussi) ;
- vous nous indiquez ce qui vous intéresse et la quantité ;
- nous vous adressons nos tarifs professionnels et un devis, et la réalisation se fait dans notre atelier après votre accord.

La gravure est permanente et les verres gravés passent au lave-vaisselle.

Vous pouvez voir nos créations et des exemples de gravure sur nivcreation.fr. Il vous suffit de répondre à ce message pour recevoir nos tarifs ou un devis.

Bien cordialement,

—
Niv Création · nivcreation.fr
6 rue d'Armaillé, 75017 Paris
Vous recevez ce message à l'adresse professionnelle publiée par votre établissement. Si vous ne souhaitez plus recevoir de message de notre part, répondez simplement « STOP » : votre adresse sera retirée de notre liste.

## Tarifs professionnels — SAUVEGARDÉS, envoyés seulement s'ils les demandent
> Décision du gérant (26/09) : « enlève les prix, tu les sauvegardes, s'ils demandent on enverra ».
> Aussi visibles dans Gestion → Restaurants & bars (encadré « Tarifs professionnels »), `TARIFS_PRO`.
Prix **livraison comprise**, à partir de 12 verres (en dessous : les lots du site). Le port réel
(Colissimo guichet 2026 : 17,39 € jusqu'à 5 kg, 25,29 € jusqu'à 10 kg) est intégré dans le prix.
| Verre | Lot de 4 du site (/verre) | dès 12 | dès 24 | Reste/verre estimé* |
|---|---|---|---|---|
| Cocktail 17 cl | 16,23 | 15,90 | 14,90 | ≈ 10 € |
| Flûte 21 cl | 16,23 | 15,90 | 14,90 | ≈ 9,50 € |
| Vin 36 cl | 14,48 | 13,90 | 12,90 | ≈ 7 € |
| Vin 47 cl | 17,98 | 17,90 | 16,90 | ≈ 6,50 € |
| Whisky 30 cl | 17,98 | 17,90 | 16,90 | ≈ 11 € (coût Lario estimé 2 €) |
*après verre, port, carton, frais Stripe et ~12,3 % d'URSSAF — avant temps de gravure et casse.
48 verres et plus : devis, port calculé au cas par cas (ou retrait si établissement proche).
Commande pro = **Gestion → Devis & factures** (le panier du site ne gère pas ces paliers).
Bois (cartes menu, numéros de table, découpes logo, pièces uniques) : aucun prix annoncé, sur devis.

## Règles respectées
Pas d'emoji · signé Niv Création, aucun nom de personne · aucune promesse de délai · aucun aperçu
avant gravure promis · pas de mention de la machine · expéditeur identifié + désinscription simple et
gratuite (prospection B2B par e-mail, règle CNIL : message lié à l'activité du destinataire, opposition
possible à tout moment).

## Liste d'opposition
Toute réponse « STOP » (ou demande équivalente) : ajouter l'adresse ici et ne plus jamais l'écrire.
- (vide)
