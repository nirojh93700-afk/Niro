// =============================================================================
// Informations détaillées par produit (issues de tes métachamps Shopify)
// -----------------------------------------------------------------------------
// Pour chaque produit (par slug) :
//   material : Taille & Matériaux
//   usage    : Personnalisation & Entretien
//   returns  : Expédition & Retour (politique de retour spécifique au produit)
// Affiché en sections dépliables sur la fiche produit.
// Texte libre — les retours à la ligne sont conservés à l'affichage.
// =============================================================================

// Fiche commune aux porte-stylos Coupe du Monde (un produit par pays).
const WORLDCUP_PEN_INFO = {
  material: `Taille & Matériaux
- Porte-stylo de bureau, motif spécial Coupe du Monde 2026.
- Bois découpé au laser, aux couleurs de la nation.
- Le stylo n'est pas inclus. Livré à plat (montage simple).`,
  usage: `Utilisation & Entretien
- Assemblage en quelques secondes (pièces à clipser).
- Dépoussiérer avec un chiffon doux et sec ; ne pas immerger.`,
  returns: `Expédition & Retour
- Expédié à plat en lettre suivie, soigneusement protégé.
- Fabriqué à la demande = non remboursable une fois la découpe lancée (article L221-28).
- En cas de casse à l'arrivée : photo sous 14 jours, remplacement sans frais.`,
};

export const productInfo = {
  "collier-enveloppe-message-secret": {
    material: `Acier inoxydable 316L hypoallergénique (acier chirurgical)

Pourquoi le 316L
- Sans nickel : ne provoque pas d'allergies, validé pour peaux sensibles.
- Composition enrichie en molybdène : résistance exceptionnelle à la corrosion (eau, chlore, sueur, eau salée).
- Référence des bijoux haut de gamme : conserve son éclat des décennies sans ternir ni se déformer.

Caractéristiques techniques
- Pendentif : 23 mm × 14 mm, épaisseur 4 mm — léger et discret.
- Chaîne : 40 cm + 5 cm de rallonge réglable.
- Finitions : Argent (acier brossé) ou Or rose (revêtement PVD haute durabilité).
- Plaque intérieure amovible, prête à graver.`,
    usage: `Comment porter et entretenir votre collier locket

Au quotidien
- Compatible douche, baignade, sport et transpiration : l'acier 316L ne craint ni l'eau ni le chlore.
- Évitez le contact direct avec parfums, crèmes et lotions — vaporisez avant de mettre le collier.
- Plongée ou eau de mer prolongée : rincez à l'eau claire en sortant.

Ouvrir la pochette
- L'enveloppe s'ouvre via une charnière fluide — soulevez délicatement le rabat.
- Sortez la plaque intérieure pour la gravure ou pour la remplacer plus tard.
- Refermez en clipsant doucement — fermeture sécurisée.

Entretien
- Essuyez avec un chiffon doux après chaque port prolongé.
- Nettoyage hebdomadaire : trempage 10-15 min dans eau tiède savonneuse, brosse souple, rinçage, séchage.`,
    returns: `Conditions adaptées au produit personnalisé

Si vous avez fait graver votre message
- Le pendentif est personnalisé → non remboursable après gravure (article L221-28).
- Annulation possible dans les 24 h après la commande, avant le démarrage de la gravure.

Si vous commandez le collier seul (sans gravure)
- Droit de rétractation 14 jours (article L221-18).
- Retour dans l'emballage d'origine, non porté.

Défaut à l'arrivée (les deux cas)
- Photo sous 14 jours, échange ou renvoi sans frais.
- Chaîne cassée, finition défectueuse : remplacement immédiat.`,
  },

  "collier-medaillon-coeur-ouvrable": {
    material: `Acier inoxydable 316L hypoallergénique

- Sans nickel : adapté aux peaux sensibles, ne ternit pas en usage normal.
- Médaillon cœur ouvrable, 4 faces gravables.
- Chaîne 50 cm.
- Finitions : Argent ou Bicolore (Or & Argent).
- Livré dans une élégante boîte cadeau noire.`,
    usage: `Personnalisation & entretien

Personnalisation (4 faces)
- Couverture + 3 pages intérieures + dos (15 caractères max par face).
- Sur chaque face : un texte, une photo gravée, ou rien — vous combinez librement.
- Pour une photo gravée : choisissez une image nette, bien éclairée et contrastée.

Entretien
- Essuyez avec un chiffon doux après un port prolongé.
- Évitez le contact avec parfums et crèmes (vaporisez avant de mettre le bijou).`,
    returns: `Conditions adaptées au produit personnalisé

Si vous avez fait graver un texte ou une photo
- Médaillon personnalisé → non remboursable après gravure (article L221-28).
- Annulation possible dans les 24 h après la commande, avant le démarrage de la gravure.

Annulation
- Dans les 24 h : remboursement intégral.
- Au-delà, avant gravure : remboursement moins 10 € de frais (designer affecté).
- Après gravure : non remboursable.

Défaut à l'arrivée
- Photo sous 14 jours, refonte ou remboursement.
- Chaîne cassée, finition défectueuse : remplacement immédiat.`,
  },

  "bracelet-homme-identite-gourmette": {
    material: `Acier inoxydable 316L (qualité chirurgicale)

- Chaîne gourmette à gros maillons cubains.
- Plaque rectangulaire lisse, gravable au laser.
- Fermoir mousqueton sécurisé.
- Hypoallergénique, ne noircit pas, résiste à l'oxydation.`,
    usage: `Personnalisation & entretien

Personnalisation
- Indiquez le texte à graver (prénom, date, initiales, message) et la police souhaitée.
- Réalisé sur commande dans notre atelier français.

Entretien
- Chiffon doux sec après un port prolongé.
- Évitez parfums, crème solaire et gel hydroalcoolique (oxydation).`,
    returns: `Conditions adaptées

Version AVEC gravure (personnalisée)
- Non remboursable après gravure (article L221-28).
- Annulation possible dans les 24 h, avant le démarrage de la gravure.

Version SANS gravure (standard)
- Droit de rétractation 14 jours (article L221-18), non porté, emballage d'origine.

Défaut à l'arrivée
- Photo sous 14 jours, échange ou remboursement.
- Fermoir cassé, finition défectueuse : remplacement immédiat.`,
  },

  "bracelet-homme-acier-silicone": {
    material: `Acier inoxydable + gel de silicone souple

- Plaque argentée ou noire au choix, gravable au laser.
- Bracelet silicone confortable au quotidien.
- Hypoallergénique.`,
    usage: `Personnalisation & entretien

Personnalisation
- Choisissez la couleur de plaque, indiquez le texte à graver et la police.
- Réalisé sur commande dans notre atelier français.

Entretien
- Chiffon doux sec après un port prolongé.
- Évitez parfums et produits chimiques agressifs.`,
    returns: `Conditions adaptées

Version AVEC texte (personnalisée)
- Non remboursable après gravure (article L221-28).
- Annulation possible dans les 24 h, avant le démarrage de la gravure.

Version SANS texte (standard)
- Droit de rétractation 14 jours (article L221-18), non porté, emballage d'origine.

Défaut à l'arrivée
- Photo sous 14 jours, échange ou remboursement.
- Fermoir cassé, finition défectueuse : remplacement immédiat.`,
  },

  "bracelet-homme-cuir-acier": {
    material: `Cuir véritable noir + acier inoxydable 316L

- Plaque gravable au laser (argentée, dorée ou noire).
- Longueur 19,5 cm, boucle de sécurité acier.
- Hypoallergénique, ne noircit pas, résiste à l'oxydation.`,
    usage: `Personnalisation & entretien

Personnalisation
- Choisissez la couleur de plaque, indiquez le texte (prénom, date, initiales, coordonnées GPS) et la police.
- Réalisé sur commande dans notre atelier français.

Entretien
- Chiffon doux sec après un port prolongé.
- Tenez le cuir éloigné de l'eau prolongée ; évitez parfums et produits chimiques.`,
    returns: `Conditions adaptées

Version AVEC texte (personnalisée)
- Non remboursable après gravure (article L221-28).
- Annulation possible dans les 24 h, avant le démarrage de la gravure.

Version SANS texte (standard)
- Droit de rétractation 14 jours (article L221-18), non porté, emballage d'origine.

Défaut à l'arrivée
- Photo sous 14 jours, échange ou remboursement.
- Boucle cassée, finition défectueuse : remplacement immédiat.`,
  },

  "numero-table-arches-bohemes": {
    material: `Bois + acrylique miroir — le mixed media tendance 2026

Bois
- Bois de haute qualité (peuplier ou chêne selon disponibilité), découpé au laser de précision.
- Épaisseur ~3 mm, suffisamment solide pour ne pas se voiler.

Acrylique
- Acrylique premium effet miroir doré, gravé/découpé au laser.
- Hauteur 15 cm pour une visibilité parfaite sans encombrer.

Stabilité
- Socle ovale assorti inclus.`,
    usage: `Mise en scène sur votre table de mariage

Placement
- Au centre de la table : pose stable grâce au socle ovale assorti inclus.
- Hauteur 15 cm : visible sans masquer les convives en face.

Mise en valeur déco
- Posez-le dans un chemin de table en gaze de coton ivoire.
- Entourez d'eucalyptus, de gypsophile et de quelques bougies chauffe-plat.

Personnalisation
- Indiquez le numéro souhaité (ou « Mariés » pour la table d'honneur) et la couleur de l'acrylique.

Après la réception
- Réutilisables : anniversaires, dîners, décoration permanente.`,
    returns: `Conditions adaptées au mariage (urgence événementielle)

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà : remboursement moins 15 € (designer affecté).
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Commande de dernière minute
- À moins de 15 jours de l'événement, contactez-nous AVANT de commander pour confirmer la faisabilité.
- Livraison express disponible.

Défaut à l'arrivée
- Photo sous 24 h, refonte URGENTE sans frais avec livraison express si délai serré.`,
  },

  "numero-table-eucalyptus": {
    material: `Bois clair + branche d'eucalyptus en relief

Bois
- Bois clair sélectionné (peuplier ou bouleau), découpe laser haute précision.
- Style arche moderne avec ouverture centrale pour le chiffre.

Branche eucalyptus
- Motif découpé en relief, fixé sur le bas du support.

Dimensions
- Hauteur environ 16-17 cm, légère et stable.
- Stable sur surface plane grâce à la base intégrée.`,
    usage: `Style bohème champêtre par excellence

Placement
- Parfait sur tout type de table (ronde, longue, carrée), avec ou sans chemin de table en gaze ou lin naturel.
- Entourez de vraies branches d'eucalyptus + chandeliers.

Personnalisation
- À la commande, précisez le numéro souhaité et la couleur du chiffre (doré, ivoire, noir).
- La branche d'eucalyptus est le motif standard du modèle.`,
    returns: `Produit personnalisé — urgence événementielle

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà : remboursement moins 10 €.
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Commande tardive
- Moins de 15 jours avant l'événement : nous contacter pour confirmer la faisabilité.
- Livraison express disponible.

Défaut à l'arrivée
- Photo sous 24 h, refonte gratuite + livraison express si délai serré.`,
  },

  "numero-table-arche-geometrique": {
    material: `Bois découpé au laser + chiffre en relief

Bois
- Bois clair sélectionné, découpe laser haute précision.
- Arche bordée d'un motif géométrique ajouré.
- Chiffre en bois foncé contrastant, fixé en relief (effet 3D).

Dimensions et stabilité
- Hauteur environ 16-17 cm, légère et stable.
- Socle inclus : pose stable sur surface plane.`,
    usage: `Une pièce élégante sur vos tables

Placement
- Parfait sur tout type de table (ronde, longue, carrée), avec ou sans chemin de table.
- S'accorde aux décorations élégantes, bohèmes ou champêtres.

Personnalisation
- À la commande, précisez le numéro (ou le nom de table) et, si vous le souhaitez, l'année à graver.
- Le motif géométrique ajouré est le décor standard du modèle.`,
    returns: `Produit personnalisé — urgence événementielle

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà : remboursement moins 10 €.
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Commande tardive
- Moins de 15 jours avant l'événement : nous contacter pour confirmer la faisabilité.
- Livraison express disponible.

Défaut à l'arrivée
- Photo sous 24 h, refonte gratuite + livraison express si délai serré.`,
  },

  "numero-table-feuillage": {
    material: `Bois clair découpé au laser

Bois
- Bois clair sélectionné (peuplier ou bouleau), découpe laser haute précision.
- Épaisseur ~3 mm, panneau avec motif de feuillage gravé.

Dimensions et stabilité
- Hauteur environ 16-17 cm, légère et stable.
- Socle inclus : pose stable sur surface plane.`,
    usage: `Élégance naturelle sur vos tables

Placement
- Parfait sur tout type de table (ronde, longue, carrée), avec ou sans chemin de table.
- S'accorde aux décorations champêtres, bohèmes ou élégantes.

Personnalisation
- À la commande, précisez le numéro (ou le nom de table) et la couleur du chiffre (doré, argenté, noir).
- Le feuillage gravé est le motif standard du modèle.`,
    returns: `Produit personnalisé — urgence événementielle

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà : remboursement moins 10 €.
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Commande tardive
- Moins de 15 jours avant l'événement : nous contacter pour confirmer la faisabilité.
- Livraison express disponible.

Défaut à l'arrivée
- Photo sous 24 h, refonte gratuite + livraison express si délai serré.`,
  },

  "etiquette-serviette-initiales": {
    material: `Bois clair gravé au laser + cordelette naturelle

- Bois clair (peuplier ou bouleau), découpe et gravure laser de précision.
- Forme fleur avec feuillage gravé, environ 5 cm.
- Cordelette naturelle incluse pour nouer autour de la serviette.`,
    usage: `Le détail qui unifie votre table

À indiquer à la commande
- Les initiales à graver (ex. « O & E ») et la police souhaitée.
- Quantité : choisissez la quantité que vous souhaitez.

Mise en place
- Nouez la cordelette autour de la serviette roulée ou pliée.
- S'accorde à toutes les couleurs de serviettes (lin, bordeaux, bleu…).

Après le mariage
- Réutilisable en étiquette cadeau ou marque-place souvenir.`,
    returns: `Personnalisé aux initiales — conditions adaptées

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà : remboursement moins 10 €.
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Quantité erronée à la livraison
- Échange ou complément immédiat sans frais si la quantité reçue ne correspond pas à la commande.

Défaut à l'arrivée
- Photo sous 14 jours, refonte gratuite.
- Pour un mariage proche : livraison express ajoutée.`,
  },

  "ronds-de-serviette-bois": {
    material: `Bois clair de qualité supérieure

- Bois clair (peuplier ou bouleau), poli lisse pour ne pas accrocher au tissu.
- Épaisseur environ 3 mm — solide mais discret.
- Trois formes au choix, gravées au laser de précision.
- Diamètre intérieur environ 4-4,5 cm.

Quantité
- Pour les grandes quantités (50+), contactez-nous pour un devis sur mesure.`,
    usage: `Petit détail qui change tout

À indiquer à la commande
- Forme : hexagone / cercle / double cœur.
- Texte gravé : prénom de l'invité / initiales / date.
- Quantité : choisissez la quantité que vous souhaitez.

Mise en place
- Glissez la serviette pliée dans le rond, posée à gauche de l'assiette.
- Effet uniforme (une seule forme) ou personnalisé (mix de formes).

Après le mariage
- Réutilisables comme marque-place ou souvenir d'invité.`,
    returns: `Personnalisé par invité — conditions adaptées

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà : remboursement moins 10 € (designer affecté).
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Quantité erronée à la livraison
- Échange ou complément immédiat sans frais si la quantité reçue ne correspond pas à la commande.

Défaut à l'arrivée
- Photo sous 14 jours, refonte gratuite.
- Pour un mariage proche : livraison express ajoutée.`,
  },

  "menu-de-mariage-bois-grave": {
    material: `Bois noble + lettrage gravé en relief 3D

Bois
- Bois clair sélectionné, découpe laser haute précision.
- Forme d'arche moderne, finition mate naturelle.

Lettrage relief
- Découpe laser fixée en surépaisseur : vrai effet 3D.
- Couleur au choix : doré, argenté, ivoire, noir mat, rosé.

Dimensions
- Hauteur environ 18 cm × largeur environ 14 cm.
- Socle intégré : pose stable.`,
    usage: `La pièce maîtresse de votre table de réception

Placement
- Pièce centrale de la table d'honneur, ou un menu par table (tout type de table).
- Posé verticalement sur son socle intégré.

Personnalisation
- Indiquez les plats (un par ligne), les prénoms à graver et la couleur du lettrage relief.
- Vérification de la maquette par e-mail avant gravure sur demande.`,
    returns: `Produit ultra-personnalisé — conditions adaptées à l'événement

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà (avant gravure) : remboursement moins 15 € (designer affecté à votre maquette).
- Dès le lancement de la fabrication (découpe) : non remboursable (article L221-28).

Commande tardive
- Moins de 21 jours avant l'événement : contactez-nous AVANT de commander (gravure menu + relief = délai un peu plus long).
- Livraison express disponible.

Défaut à l'arrivée ou erreur de gravure
- Photo sous 24 h, refonte URGENTE gratuite + livraison express si le mariage approche.`,
  },

  "plaque-de-porte-enfant": {
    material: `Bois clair sélectionné, découpé au laser

Origine et qualité
- Bois clair de qualité supérieure (peuplier ou bouleau), finition lisse et solide.
- Découpe laser haute précision : contours nets, détails fins.

Finitions
- Bois brut : aspect naturel, style scandinave / minimaliste.
- Marron foncé : teinture pénétrante, style cottage / bohème.

Dimensions et sécurité
- Format moyen et léger.
- Bords poncés et arrondis : pas de risque de blessure.`,
    usage: `Personnalisation, fixation, entretien

À indiquer à la commande
1. Le prénom de l'enfant (écriture exacte avec accents).
2. Le style d'écriture souhaité (Fleuri, Celtique, Art déco, Élégant ou Arrondi).
3. Les animaux sélectionnés (4 max).
4. La finition (bois brut ou marron foncé).

Fixation
- Crochet delta, pâte à fixe ou ruban double-face.
- Vérifiez régulièrement la fixation (sécurité enfant).

Entretien
- Dépoussiérez avec un chiffon doux sec ; évitez les nettoyants chimiques.`,
    returns: `Produit personnalisé (gravure prénom unique) — non remboursable après lancement de la fabrication

Annulation
- Dans les 24 h après la commande : remboursement intégral.
- Au-delà (un designer affecté) : remboursement moins 15 € de frais.
- Après validation de l'aperçu : la découpe a démarré, plus de remboursement.

Défaut à l'arrivée
- Photo sous 14 jours après réception, refonte sans frais (renvoi du produit défectueux requis).

Erreur d'orthographe sur le prénom
- Si la faute vient de notre côté (par rapport à l'aperçu validé) : refonte gratuite.
- Si la faute vient de la commande initiale (validée à l'aperçu) : refonte avec frais réduits, contactez-nous.`,
  },

  "cle-usb-personnalisee": {
    material: `Clé USB design + gravure laser de précision

Spécifications
- Norme USB 2.0 en standard, USB 3.0 en option pour transferts lourds.
- Capacités : 8 / 16 / 32 / 64 GB.
- Connecteur : USB-A (universel) ou USB-C (smartphones récents, MacBook récents).

Matériau et personnalisation
- Corps en métal ou bois selon le modèle.
- Gravure laser fine et durable.`,
    usage: `Personnalisation, usage, conservation

À indiquer à la commande
- Texte à graver (prénom, date, dédicace) OU logo d'entreprise (fichier vectoriel HD).
- Capacité et type de connecteur souhaités.

Usages typiques
- Mariage : film de cérémonie et photos remis aux invités.
- Entreprise : logo gravé en welcome pack.

Conservation
- Sauvegardez toujours vos fichiers en parallèle (disque dur ou cloud).
- Évitez les températures extrêmes ; éjectez correctement la clé.`,
    returns: `Personnalisée après gravure — non remboursable

Annulation
- Dans les 24 h suivant la commande : remboursement intégral.
- Au-delà (commande en préparation) : remboursement moins 10 € de frais.
- Après gravure : non remboursable (personnalisation unique).

Défaut technique ou de gravure
- Photo du défaut sous 14 jours après réception.
- Échange standard sans frais (renvoi du produit défectueux requis).`,
  },

  "verre-a-whisky-grave": {
    material: `Verre à whisky à base épaisse

- Verre épais et lourd en main, contenance d'environ 300 ml, hauteur d'environ 9 cm.
- Surface lisse idéale pour une gravure laser nette et précise.
- Va au lave-vaisselle (la gravure ne s'efface pas).`,
    usage: `Personnalisation
- Texte au choix (prénom, date, message) dans la police de votre choix.
- Option dessin / logo : décrivez votre idée pour générer un aperçu, ou envoyez votre propre image.
- La gravure se fait sur une face du verre.

Entretien
- Lavage à la main recommandé pour préserver la brillance, lave-vaisselle possible.
- Évitez les chocs thermiques (ne pas passer du congélateur à l'eau chaude).`,
    returns: `Produit personnalisé après gravure — non remboursable

Annulation
- Dans les 24 h suivant la commande, avant le démarrage de la gravure : annulation possible.
- Après gravure : non remboursable (personnalisation unique, article L221-28).

Casse ou défaut à l'arrivée
- Photo sous 14 jours après réception : remplacement sans frais.
- Emballage protégé prévu pour un transport sécurisé.`,
  },
  "couverts-enfants-personnalises": {
    material: `Taille & Matériaux
- Jeu de 4 pièces : couteau, fourchette, grande et petite cuillère.
- Acier inoxydable 304 (18/10), poli miroir.
- Dimensions : couteau 16,8 cm · fourchette 15 cm · grande cuillère 14,7 cm · petite cuillère 12,5 cm.
- Adapté aux mains des enfants, sans bord coupant.`,
    usage: `Personnalisation & Entretien
- Gravure laser sur le manche : le prénom + un animal par couvert.
- Un animal au choix pour chaque pièce.
- Passe au lave-vaisselle, la gravure ne s'efface pas.`,
    returns: `Produit personnalisé après gravure — non remboursable

Annulation
- Dans les 24 h suivant la commande, avant le démarrage de la gravure : annulation possible.
- Après gravure : non remboursable (personnalisation unique, article L221-28).

Défaut à l'arrivée
- Photo sous 14 jours après réception : remplacement sans frais.`,
  },
  "lampe-led-paris-saint-germain": {
    material: `Taille & Matériaux
- Lampe ronde sur socle bois.
- Contreplaqué de tilleul 3 mm, découpé au laser (motif rétroéclairé).
- Éclairage LED bleu et rouge, aux couleurs du club.
- Dimensions : environ 18 cm de large pour 13,5 cm de haut.`,
    usage: `Utilisation & Entretien
- Fonctionne à pile, allumage par interrupteur situé à l'arrière (sans télécommande).
- Lumière fixe bleue et rouge.
- Dépoussiérer avec un chiffon doux et sec ; ne pas immerger.`,
    returns: `Expédition & Retour
- Objet fragile : expédié soigneusement protégé.
- Retour possible sous 14 jours s'il n'a pas servi, dans son emballage d'origine (frais de retour à votre charge).
- À l'arrivée, en cas de casse : envoyez-nous une photo sous 14 jours, on remplace sans frais.`,
  },
  "arbre-de-vie-lumineux": {
    material: `Taille & Matériaux
- Panneau carré à coins arrondis, motif Arbre de Vie ajouré.
- Contreplaqué de tilleul 3 mm, découpé au laser.
- Se tient debout (déco à poser).`,
    usage: `Utilisation & Entretien
- Fonctionne à pile, allumage par interrupteur à l'arrière.
- Lumière chaude (couleur unique).
- Dépoussiérer avec un chiffon doux et sec ; ne pas immerger.`,
    returns: `Expédition & Retour
- Objet expédié soigneusement protégé.
- Article non personnalisé : retour possible sous 14 jours s'il n'a pas servi, dans son emballage d'origine (frais de retour à votre charge).
- En cas de casse à l'arrivée : photo sous 14 jours, remplacement sans frais.`,
  },
  "veilleuse-arbre-de-vie-ronde": {
    material: `Taille & Matériaux
- Disque rond, motif Arbre de Vie celtique ajouré.
- Contreplaqué de tilleul 3 mm, découpé au laser.
- Se tient debout (déco à poser).`,
    usage: `Utilisation & Entretien
- Fonctionne à pile, allumage par interrupteur à l'arrière.
- Lumière chaude (couleur unique).
- Dépoussiérer avec un chiffon doux et sec ; ne pas immerger.`,
    returns: `Expédition & Retour
- Objet expédié soigneusement protégé.
- Article non personnalisé : retour possible sous 14 jours s'il n'a pas servi, dans son emballage d'origine (frais de retour à votre charge).
- En cas de casse à l'arrivée : photo sous 14 jours, remplacement sans frais.`,
  },
  "bougeoir-mandala-bois": {
    material: `Taille & Matériaux
- Bougeoir « flottant » à étages, motifs mandala ajourés.
- Bois découpé au laser, monté à la main.
- Reçoit une bougie chauffe-plat (non incluse).`,
    usage: `Utilisation & Entretien
- Déposer une bougie chauffe-plat dans l'emplacement prévu.
- Ne jamais laisser une bougie allumée sans surveillance ; tenir loin des matières inflammables.
- Dépoussiérer avec un chiffon doux et sec ; ne pas immerger.`,
    returns: `Expédition & Retour
- Objet expédié soigneusement protégé.
- Article non personnalisé : retour possible sous 14 jours s'il n'a pas servi, dans son emballage d'origine (frais de retour à votre charge).
- En cas de casse à l'arrivée : photo sous 14 jours, remplacement sans frais.`,
  },
  "bougeoir-fleur-de-lotus": {
    material: `Taille & Matériaux
- Porte-bougie en forme de fleur de lotus.
- Bois découpé au laser.
- Reçoit une bougie chauffe-plat (non incluse).`,
    usage: `Utilisation & Entretien
- Déposer une bougie chauffe-plat au centre.
- Personnalisation facultative : prénom, nom ou date gravé.
- Ne jamais laisser une bougie allumée sans surveillance ; tenir loin des matières inflammables.
- Dépoussiérer avec un chiffon doux et sec ; ne pas immerger.`,
    returns: `Expédition & Retour
- Objet expédié soigneusement protégé.
- Personnalisé = non remboursable une fois la gravure lancée (article L221-28). Sans personnalisation : retour possible sous 14 jours s'il n'a pas servi, dans son emballage d'origine.
- En cas de casse à l'arrivée : photo sous 14 jours, remplacement sans frais.`,
  },
  "porte-stylo-coq-coupe-du-monde": WORLDCUP_PEN_INFO,
  "porte-stylo-portugal-coupe-du-monde": WORLDCUP_PEN_INFO,
  "porte-stylo-argentine-coupe-du-monde": WORLDCUP_PEN_INFO,
  "porte-stylo-espagne-coupe-du-monde": WORLDCUP_PEN_INFO,
};

export function getProductInfo(slug) {
  return productInfo[slug] || null;
}
