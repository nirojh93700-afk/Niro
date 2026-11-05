// Titres COURTS envoyés à Google (balise <title>) pour les fiches produit — audit du 05/11/2026.
//
// Pourquoi une table à part : le champ `title` d'un produit est AUSSI le grand titre visible
// de la fiche (H1) et le titre du flux Google Shopping (qui accepte 150 caractères). On ne
// touche donc pas à `title` : seule la ligne bleue des résultats Google est raccourcie, pour
// tenir dans les ~60 caractères que Google affiche (le reste était coupé).
// Règles : on garde les mots que les gens cherchent ; l'adresse (slug) et le nom ne changent pas.
// `de` = le titre actuel du produit : si Gestion a changé le titre (override), il ne
// correspond plus et c'est le titre de Gestion qui reste (rien n'est écrasé).
export const TITRES_GOOGLE = {
  "bougeoir-fleur-de-lotus": { de: "Bougeoir Fleur de Lotus en bois personnalisé — porte-bougie chauffe-plat déco", vers: "Bougeoir Fleur de Lotus en bois personnalisé" },
  "bracelet-ange": { de: "Bracelet ange minimaliste — chaîne fine acier, doré ou argenté, cadeau femme", vers: "Bracelet ange minimaliste doré ou argenté" },
  "bracelet-coeur-a-graver-ot": { de: "Bracelet cœur à graver, fermoir T-bar — médaille cœur personnalisée, doré / or rose / argenté", vers: "Bracelet cœur à graver, fermoir T-bar" },
  "bracelet-coeur-acier": { de: "Bracelet cœur ouvert argenté — acier inoxydable, cadeau femme délicat", vers: "Bracelet cœur ouvert argenté en acier" },
  "bracelet-coeur-chaine": { de: "Bracelet cœur à graver, grosse chaîne dorée et fermoir T", vers: "Bracelet cœur à graver, grosse chaîne dorée" },
  "bracelet-cordon-plaque": { de: "Bracelet cordon tressé à plaque acier gravée — unisexe, taille réglable, noir ou gris", vers: "Bracelet cordon tressé à plaque gravée" },
  "bracelet-gourmette-plaque": { de: "Bracelet gourmette à plaque gravée — acier inoxydable, doré ou noir", vers: "Bracelet gourmette à plaque gravée" },
  "bracelet-homme-acier-silicone": { de: "Bracelet Homme — Acier inoxydable & silicone gravé au laser", vers: "Bracelet homme acier et silicone gravé" },
  "bracelet-homme-identite-gourmette": { de: "Bracelet Homme Identité — Gourmette acier inoxydable gravée", vers: "Bracelet homme gourmette acier gravée" },
  "bracelet-homme-plaque-cuir": { de: "Bracelet homme en cuir à plaque acier gravée — fermoir clip, noir, marine ou marron", vers: "Bracelet homme cuir à plaque acier gravée" },
  "bracelet-maille-trombone": { de: "Bracelet maille trombone doré — gros maillons acier, tendance, cadeau femme", vers: "Bracelet maille trombone doré en acier" },
  "bracelet-perles-pastille": { de: "Bracelet perles acier à pastille gravée — taille réglable 16 à 23 cm, doré ou argenté", vers: "Bracelet perles acier à pastille gravée" },
  "carafe-a-whisky-gravee": { de: "Carafe à whisky gravée personnalisée — édition limitée, cadeau d'exception", vers: "Carafe à whisky gravée personnalisée" },
  "cartes-etapes-bebe-animaux": { de: "Cartes étapes bébé têtes d'animaux en bois — lot de 12 (1 à 12 mois)", vers: "Cartes étapes bébé en bois, têtes d'animaux" },
  "cartes-etapes-bebe-girafe": { de: "Cartes étapes bébé en bois gravé — lot de 12, girafe (1 à 12 mois)", vers: "Cartes étapes bébé en bois gravé, girafe" },
  "cle-usb-personnalisee": { de: "Clé USB personnalisée – Cadeau souvenir gravé sur mesure", vers: "Clé USB personnalisée gravée sur mesure" },
  "collier-3coeurs": { de: "Collier trois cœurs entrelacés à graver — un prénom par cœur, cadeau maman et famille", vers: "Collier trois cœurs entrelacés à graver" },
  "collier-barre-verticale": { de: "Collier Quatre Mots — barre à graver sur 4 faces, acier inoxydable", vers: "Collier Quatre Mots, barre à graver 4 faces" },
  "collier-coeur-grave": { de: "Collier cœur plat à graver recto-verso — prénom, date ou message, doré, or rose ou argenté", vers: "Collier cœur à graver recto-verso" },
  "collier-coeur-plaques": { de: "Collier cœur et deux plaques à graver — prénoms et date gravés, cadeau couple ou famille", vers: "Collier cœur et deux plaques à graver" },
  "collier-coeur-scintillant": { de: "Collier cœur doré à zircons — pendentif cœur brillant, cadeau femme romantique", vers: "Collier cœur doré à zircons" },
  "collier-double-coeur": { de: "Collier double cœur à graver — pendentif cœur serti de zircons, message gravé au dos", vers: "Collier double cœur à graver, zircons" },
  "collier-medaillon-pivotant": { de: "Collier médaillon pivotant à graver recto-verso — doré, or rose ou argenté", vers: "Collier médaillon pivotant à graver" },
  "collier-pastille": { de: "Collier pastille ronde à graver recto-verso — chaîne fine dorée", vers: "Collier pastille ronde à graver recto-verso" },
  "collier-perle-solitaire": { de: "Collier perle solitaire doré — chaîne fine dorée, cadeau femme minimaliste", vers: "Collier perle solitaire, chaîne fine dorée" },
  "couverts-enfants-personnalises": { de: "Couverts enfants personnalisés — jeu de 4, prénom et animal au choix gravés", vers: "Couverts enfants personnalisés gravés" },
  "cristal-photo-3d-horizontal": { de: "Cristal photo 3D horizontal (paysage) — gravure personnalisée en France", vers: "Cristal photo 3D horizontal personnalisé" },
  "etiquette-serviette-initiales": { de: "Étiquette de serviette fleur en bois gravée – Initiales des mariés", vers: "Étiquette de serviette en bois, initiales mariés" },
  "flute-a-champagne-gravee": { de: "Flûte à champagne gravée personnalisée — prénom, date, monogramme ou modèle", vers: "Flûte à champagne gravée personnalisée" },
  "marque-page-bois-oiseau": { de: "Marque-page en bois ajouré, oiseau bleu et magnolia, avec cordon à perles de verre", vers: "Marque-page en bois ajouré, oiseau et magnolia" },
  "marque-page-metal-peinture": { de: "Marque-page en métal doré, Van Gogh et Monet, avec pompon", vers: "Marque-page en métal doré, Van Gogh et Monet" },
  "numero-table-arche-geometrique": { de: "Numéro de table mariage en bois – Arche ajourée & chiffre en relief 3D", vers: "Numéro de table mariage en bois, arche 3D" },
  "numero-table-arches-bohemes": { de: "Numéro de table mariage Arches Bohèmes – Bois & acrylique", vers: "Numéro de table mariage Arches Bohèmes" },
  "numero-table-eucalyptus": { de: "Numéro de table mariage en bois – Motif branche d'eucalyptus", vers: "Numéro de table mariage en bois, eucalyptus" },
  "numero-table-feuillage": { de: "Numéro de table mariage en bois découpé au laser – Motif feuillage", vers: "Numéro de table mariage en bois, feuillage" },
  "plaque-de-naissance": { de: "Plaque de naissance personnalisée en bois — prénom, date, poids, taille", vers: "Plaque de naissance personnalisée en bois" },
  "plaque-de-naissance-coeur": { de: "Plaque de naissance mains en cœur — support bracelet de naissance personnalisé", vers: "Plaque de naissance mains en cœur personnalisée" },
  "plaque-de-porte-enfant": { de: "Plaque de porte personnalisée prénom & animaux – Chambre enfant", vers: "Plaque de porte enfant personnalisée prénom" },
  "porte-serviettes-bois-fleur": { de: "Porte-serviettes de table en bois — fleur et arabesques découpées", vers: "Porte-serviettes de table en bois, fleur" },
  "porte-serviettes-colombes": { de: "Porte-serviettes colombes en bois — deux oiseaux et un cœur", vers: "Porte-serviettes colombes en bois" },
  "porte-stylo-argentine-coupe-du-monde": { de: "Porte-stylo Argentine en bois — aux couleurs de l'Albiceleste", vers: "Porte-stylo Argentine en bois" },
  "porte-stylo-coq-coupe-du-monde": { de: "Porte-stylo France en bois — coq gaulois, aux couleurs des Bleus", vers: "Porte-stylo France en bois, coq gaulois" },
  "puzzle-animaux-amerique": { de: "Puzzle à encastrer en bois « Les animaux du Grand Nord », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer Grand Nord au prénom" },
  "puzzle-australie": { de: "Puzzle à encastrer en bois « Les animaux d'Australie », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer Australie au prénom" },
  "puzzle-camping": { de: "Puzzle à encastrer en bois « L'aventure en camping », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer camping au prénom" },
  "puzzle-dinosaures": { de: "Puzzle à encastrer en bois « Les dinosaures », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer dinosaures au prénom" },
  "puzzle-foret": { de: "Puzzle à encastrer en bois « Les animaux de la forêt », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer forêt au prénom" },
  "puzzle-fruits-legumes": { de: "Puzzle à encastrer en bois « Les fruits et légumes », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer fruits et légumes" },
  "puzzle-jardin-enchante": { de: "Puzzle à encastrer en bois « Le jardin enchanté », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer jardin enchanté" },
  "puzzle-photo-grave": { de: "Puzzle photo gravé sur bois — votre photo, de 24 à 100 pièces", vers: "Puzzle photo gravé sur bois, 24 à 100 pièces" },
  "puzzle-savane": { de: "Puzzle à encastrer en bois « Les animaux de la savane », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer savane au prénom" },
  "puzzle-vehicules-secours": { de: "Puzzle à encastrer en bois « Les véhicules de secours », gravé au prénom de l'enfant", vers: "Puzzle bois à encastrer véhicules de secours" },
  "ronds-de-serviette-bois": { de: "Ronds de serviette personnalisés en bois – Hexagone, cœur ou cercle", vers: "Ronds de serviette personnalisés en bois" },
  "support-telephone-bois-ajoure": { de: "Support téléphone en bois ajouré — feuilles et lierre découpés", vers: "Support téléphone en bois ajouré" },
  "support-telephone-bois-grave": { de: "Support téléphone en bois gravé — photo, dessin ou monogramme fleuri", vers: "Support téléphone en bois gravé, photo" },
  "veilleuse-arbre-de-vie-prenom": { de: "Veilleuse Arbre de Vie personnalisée au prénom — lumière LED", vers: "Veilleuse Arbre de Vie personnalisée prénom" },
  "verre-a-cocktail-grave": { de: "Verre à cocktail personnalisé — modèle, lettre fleurie, photo ou texte gravé", vers: "Verre à cocktail personnalisé gravé" },
  "verre-a-vin-grave": { de: "Verre à vin gravé personnalisé — prénom, date, monogramme ou modèle au choix", vers: "Verre à vin gravé personnalisé" },
  "verre-a-whisky-fete-des-peres": { de: "Verre à whisky à personnaliser — modèles gravés (Route 66, Bourbon…) et prénom", vers: "Verre à whisky personnalisé, modèles gravés" },
  "verre-a-whisky-grave": { de: "Verre à whisky portrait personnalisé — photo gravée, cadeau papa, couple ou souvenir", vers: "Verre à whisky personnalisé, photo gravée" },
  "verre-tumbler-cristal-grave": { de: "Verre tumbler en cristal gravé — modèle, lettre fleurie, prénom ou photo", vers: "Verre tumbler en cristal gravé" },
  // Pas trop longs en ligne aujourd'hui (titre de Gestion ou produit masqué), prêts si le titre du code revient.
  "cristal-photo-3d-vertical": { de: "Cristal photo 3D vertical (portrait) — gravure personnalisée en France", vers: "Cristal photo 3D vertical personnalisé" },
  "collier-coeur-zircon": { de: "Collier cœur doré & anneau serti de zircon — cadeau femme, gravure prénom en option", vers: "Collier cœur doré et anneau serti de zircon" },
  "lampe-led-paris-saint-germain": { de: "Lampe LED Paris Saint-Germain — décoration lumineuse gravée, socle bois", vers: "Lampe LED Paris Saint-Germain gravée" },
  "arbre-de-vie-lumineux": { de: "Lampe Arbre de Vie en bois personnalisée — veilleuse déco rétroéclairée LED", vers: "Lampe Arbre de Vie en bois personnalisée" },
  "bougeoir-mandala-bois": { de: "Bougeoir Flottant en bois — porte-bougie chauffe-plat déco zen", vers: "Bougeoir flottant en bois, chauffe-plat" },
};

// Le titre à mettre dans la balise <title> de la fiche.
export function titreGoogle(product) {
  const t = TITRES_GOOGLE[product?.slug];
  return t && product.title === t.de ? t.vers : product?.title;
}
