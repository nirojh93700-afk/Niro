// =============================================================================
// Catalogue Niv Création
// -----------------------------------------------------------------------------
// Source unique de vérité pour tous les produits du site.
// Pour ajouter / modifier un produit : édite simplement ce tableau.
// Les prix sont en euros (number). Les images pointent vers le CDN Shopify.
// =============================================================================

export const CATEGORIES = [
  { slug: "bijoux", label: "Bijoux personnalisés" },
  { slug: "mariage", label: "Mariage & Réception" },
  { slug: "cadeaux", label: "Cadeaux & Décoration" },
];

// Sous-catégories par catégorie (ex : bijoux femme / homme).
export const SUBCATEGORIES = {
  bijoux: [
    { slug: "femme", label: "Bijoux femme" },
    { slug: "homme", label: "Bijoux homme" },
  ],
};

export const products = [
  // ----------------------------- BIJOUX --------------------------------------
  {
    slug: "collier-enveloppe-message-secret",
    name: "Collier Enveloppe Message Secret",
    weight: 120, // grammage emballé (g) — sert au calcul des frais de port
    pickup: false, // remise en main propre possible
    letter: true, // expédiable en Lettre Suivie (léger & fin, < 3 cm)
    subcategory: "femme", // sous-catégorie bijoux
    title: "Collier Enveloppe Message Secret personnalisable",
    category: "bijoux",
    type: "Collier personnalisé",
    tagline: "Le pendentif enveloppe qui s'ouvre sur votre message secret.",
    personalizable: true,
    personalizationLabel: "Texte à graver (à l'intérieur de l'enveloppe)",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.7864685300_7l25.jpg?v=1780366782",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.7912637465_7d0t.jpg?v=1780366782",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.7864685302_iebi.jpg?v=1780366782",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.7864685290_a50j.jpg?v=1780366782",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.7864685306_sefx.jpg?v=1780366782",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.7864685296_55z9.jpg?v=1780366782",
    ],
    variants: [
      { id: "env-recto-dore", title: "Recto uniquement / Doré", price: 17.92 },
      { id: "env-recto-argent", title: "Recto uniquement / Argent", price: 17.92 },
      { id: "env-recto-rose", title: "Recto uniquement / Or Rose", price: 17.92 },
      { id: "env-rv-dore", title: "Recto-Verso / Doré", price: 19.42 },
      { id: "env-rv-argent", title: "Recto-Verso / Argent", price: 19.42 },
      { id: "env-rv-rose", title: "Recto-Verso / Or Rose", price: 19.42 },
    ],
    descriptionHtml: `<p>Gardez vos mots les plus précieux près de votre cœur avec ce collier locket unique. Chaque modèle est livré avec sa plaque intérieure prête à être gravée pour vous. Le pendentif en forme d'enveloppe s'ouvre réellement pour révéler cette plaque amovible.</p>
<p>Ce bijou symbolique permet de dissimuler un secret, une date ou un prénom. Sa conception soignée avec charnière fluide et fermeture sécurisée assure élégance et durabilité. Disponible en trois finitions polies pour s'adapter à toutes vos tenues.</p>
<h3>Spécifications</h3>
<ul>
<li><strong>Pendentif :</strong> 23 mm × 14 mm, épaisseur 4 mm</li>
<li><strong>Chaîne :</strong> 40 cm + 5 cm de rallonge</li>
<li><strong>Matériau :</strong> Acier inoxydable hypoallergénique, résistant au ternissement</li>
<li><strong>Couleurs :</strong> Or, Argent, Or Rose</li>
</ul>
<h3>Points forts</h3>
<ul>
<li>✨ Plaque intérieure incluse et prête pour la gravure</li>
<li>💌 Design interactif et original (enveloppe qui s'ouvre)</li>
<li>📏 Longueur ajustable pour un confort optimal</li>
<li>🎁 Parfait cadeau Saint-Valentin, anniversaire ou commémoration</li>
</ul>`,
  },
  {
    slug: "collier-medaillon-coeur-ouvrable",
    name: "Collier Médaillon Cœur ouvrable",
    weight: 150,
    pickup: false,
    letter: true,
    subcategory: "femme",
    title: "Collier médaillon cœur ouvrable — 4 faces gravables",
    category: "bijoux",
    type: "Collier personnalisé",
    tagline: "Un cœur qui s'ouvre comme un livre, 4 faces à graver.",
    personalizable: true,
    personalizationLabel: "Textes à graver (face avant + pages intérieures)",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8007460522_d3ji.jpg?v=1780366817",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8055379169_ip8s.jpg?v=1780366816",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8007460526_h2kk.jpg?v=1780366816",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8007440646_ooc0.jpg?v=1780366816",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8055354801_l7f2.jpg?v=1780366817",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8055354789_4miu.jpg?v=1780366816",
    ],
    variants: [
      { id: "med-argent-texte", title: "Argent / Texte", price: 25.11 },
      { id: "med-argent-photo", title: "Argent / Texte + Photo", price: 34.11 },
      { id: "med-bicolore-texte", title: "Bicolore (Or & Argent) / Texte", price: 28.71 },
      { id: "med-bicolore-photo", title: "Bicolore (Or & Argent) / Texte + Photo", price: 35.91 },
    ],
    descriptionHtml: `<p><strong>Un bijou élégant et intemporel à personnaliser.</strong></p>
<p>Gardez vos souvenirs les plus précieux près de votre cœur. Le pendentif en forme de cœur s'ouvre comme un petit livre pour révéler quatre faces entièrement personnalisables, à graver selon vos envies.</p>
<h3>Un médaillon, 4 faces</h3>
<ul>
<li><strong>Face avant</strong> — 20 caractères max</li>
<li><strong>Page 1</strong> — 30 caractères max</li>
<li><strong>Page 2 gauche</strong> — 30 caractères max</li>
<li><strong>Page 3 droite</strong> — 30 caractères max</li>
</ul>
<p>Sur chaque emplacement : un texte, une photo gravée, ou rien du tout. Vous pouvez combiner texte et photo.</p>
<h3>Spécifications</h3>
<ul>
<li><strong>Chaîne :</strong> 50 cm — <strong>Poids :</strong> ~14 g</li>
<li><strong>Matériau :</strong> Acier inoxydable hypoallergénique</li>
<li><strong>Couleurs :</strong> Argent ou Bicolore (Or & Argent)</li>
<li>🎁 Livré dans une élégante boîte cadeau noire</li>
</ul>
<p><em>Option photo : choisissez une image nette, bien éclairée et contrastée pour un rendu optimal.</em></p>`,
  },
  {
    slug: "bracelet-homme-identite-gourmette",
    name: "Bracelet Homme Identité (Gourmette)",
    weight: 160,
    pickup: false,
    letter: true,
    subcategory: "homme",
    title: "Bracelet Homme Identité — Gourmette acier inoxydable gravée",
    category: "bijoux",
    type: "Bracelet personnalisé",
    tagline: "Gourmette à maillons cubains, plaque gravée à votre message.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police souhaitée",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086801196_rxih.jpg?v=1780366838",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086800434_d5ag.jpg?v=1780366839",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8134708393_5e02.jpg?v=1780366838",
    ],
    variants: [
      { id: "gourm-gravure", title: "Avec gravure", price: 24.9 },
      { id: "gourm-sans", title: "Sans gravure", price: 27.9 },
    ],
    descriptionHtml: `<p>Offrez un bijou d'élégance avec ce <strong>bracelet identité homme</strong> personnalisable par gravure laser. La plaque rectangulaire lisse offre un espace idéal pour graver un prénom, une date, un message ou des initiales.</p>
<p>Monté sur une belle chaîne gourmette à gros maillons cubains en acier inoxydable, il allie solidité, élégance et style contemporain.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> Acier inoxydable 316L (qualité chirurgicale)</li>
<li><strong>Plaque :</strong> Rectangulaire, surface lisse gravable</li>
<li><strong>Fermoir :</strong> Mousqueton sécurisé</li>
<li><em>Hypoallergénique • Résistant à l'oxydation • Ne noircit pas</em></li>
</ul>
<p>Idéal pour un anniversaire, la Fête des Pères, Noël ou la Saint-Valentin.</p>`,
  },
  {
    slug: "bracelet-homme-acier-silicone",
    name: "Bracelet Homme Acier & Silicone",
    weight: 100,
    pickup: false,
    letter: true,
    subcategory: "homme",
    title: "Bracelet Homme — Acier inoxydable & silicone gravé au laser",
    category: "bijoux",
    type: "Bracelet personnalisé",
    tagline: "Silicone souple et plaque acier, confort au quotidien.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police souhaitée",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8132632743_pkdt.jpg?v=1780366865",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8132632741_4nw4.jpg?v=1780366864",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8132632747_knt0.jpg?v=1780366864",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8084724218_jxik.jpg?v=1780366864",
    ],
    variants: [
      { id: "sil-argent-sans", title: "Plaque argentée / Sans texte", price: 16.9 },
      { id: "sil-argent-texte", title: "Plaque argentée / Avec texte", price: 20.9 },
      { id: "sil-noire-sans", title: "Plaque noire / Sans texte", price: 16.9 },
      { id: "sil-noire-texte", title: "Plaque noire / Avec texte", price: 20.9 },
    ],
    descriptionHtml: `<p>Offrez un bijou unique grâce à notre <strong>bracelet homme personnalisé par gravure laser</strong>. Chaque pièce est gravée à la demande : prénom, date, message ou initiales.</p>
<p>Fabriqué en acier inoxydable de qualité associé à un gel de silicone souple, il allie solidité et confort pour un port quotidien agréable.</p>
<h3>Points forts</h3>
<ul>
<li>💪 Acier inoxydable hypoallergénique</li>
<li>🪶 Bracelet silicone souple, confortable au quotidien</li>
<li>🎨 2 finitions : plaque argentée ou plaque noire</li>
<li>🎁 Idéal Fête des Pères, anniversaire, Noël, Saint-Valentin</li>
</ul>`,
  },
  {
    slug: "bracelet-homme-cuir-acier",
    name: "Bracelet Homme Cuir & Acier",
    weight: 100,
    pickup: false,
    letter: true,
    subcategory: "homme",
    title: "Bracelet Homme — Cuir véritable & acier inoxydable gravé",
    category: "bijoux",
    type: "Bracelet personnalisé",
    tagline: "L'authenticité du cuir, la modernité de l'acier gravé.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police souhaitée",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8056490795_5cio.jpg?v=1780366894",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8008573224_ltde.jpg?v=1780366894",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8056490789_3bjk.jpg?v=1780366894",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8008797014_pcih.jpg?v=1780366895",
    ],
    variants: [
      { id: "cuir-argent-sans", title: "Plaque argentée / Sans texte", price: 16.11 },
      { id: "cuir-argent-texte", title: "Plaque argentée / Avec texte", price: 19.71 },
      { id: "cuir-dore-sans", title: "Plaque dorée / Sans texte", price: 16.11 },
      { id: "cuir-dore-texte", title: "Plaque dorée / Avec texte", price: 19.71 },
      { id: "cuir-noire-sans", title: "Plaque noire / Sans texte", price: 16.11 },
      { id: "cuir-noire-texte", title: "Plaque noire / Avec texte", price: 19.71 },
    ],
    descriptionHtml: `<p><strong>Bracelet homme personnalisé en cuir véritable & acier inoxydable.</strong></p>
<p>Offrez bien plus qu'un bijou : un message gravé qui traverse le temps. Ce bracelet allie l'authenticité du cuir véritable noir à la modernité de l'acier inoxydable 316L, pour un style sobre et masculin.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matières :</strong> Cuir véritable + acier inoxydable 316L</li>
<li><strong>Longueur :</strong> 19,5 cm</li>
<li><strong>Fermoir :</strong> Boucle de sécurité acier</li>
<li><em>Hypoallergénique • Ne noircit pas • Résistant à l'oxydation</em></li>
</ul>
<p>Personnalisez avec un prénom, une date, des initiales, un message court ou des coordonnées GPS.</p>`,
  },

  // ----------------------------- MARIAGE -------------------------------------
  {
    slug: "numero-table-arches-bohemes",
    name: "Numéro de table Arches Bohèmes",
    weight: 250,
    pickup: true,
    letter: false,
    title: "Numéro de table mariage Arches Bohèmes – Bois & acrylique",
    category: "mariage",
    type: "Décoration de mariage",
    tagline: "Bois ajouré et acrylique doré pour une table de mariage chic.",
    personalizable: true,
    personalizationLabel: "Numéro / nom de table + couleur de l'acrylique",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/6eab4878-cbeb-4f83-9620-ea38e73359b9_png.webp?v=1775184450",
    ],
    variants: [
      { id: "arches-unite", title: "À l'unité (1-9)", price: 18.9 },
      { id: "arches-lot", title: "Lot de 10+ (prix unitaire)", price: 15.9 },
    ],
    descriptionHtml: `<p><strong>Sublimez votre table de mariage avec une signature élégante.</strong></p>
<p>Le numéro de table « Arches Bohèmes » conjugue la chaleur du bois naturel et l'éclat de l'acrylique pour une touche moderne et raffinée. Pensé pour les mariages bohèmes, champêtres ou minimalistes.</p>
<h3>Pourquoi vous allez l'adorer</h3>
<ul>
<li><strong>Design multi-couches</strong> — arches ajourées pour un effet de profondeur.</li>
<li><strong>Contraste raffiné</strong> — bois clair + acrylique pour une lisibilité parfaite.</li>
<li><strong>Couleur personnalisable</strong> — acrylique doré par défaut, ou couleur au choix.</li>
<li><strong>Stabilité parfaite</strong> — livré avec son socle ovale assorti.</li>
</ul>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matériaux :</strong> bois de haute qualité + acrylique premium</li>
<li><strong>Hauteur :</strong> environ 15 cm</li>
<li><strong>Personnalisation :</strong> gravure laser de précision</li>
</ul>
<p><strong>Tarif dégressif :</strong> 18,90 € à l'unité — 15,90 € l'unité dès 10 numéros commandés.</p>`,
  },
  {
    slug: "numero-table-eucalyptus",
    name: "Numéro de table Eucalyptus",
    weight: 200,
    pickup: true,
    letter: false,
    title: "Numéro de table mariage en bois – Motif branche d'eucalyptus",
    category: "mariage",
    type: "Décoration de mariage",
    tagline: "Le charme végétal d'une branche d'eucalyptus gravée.",
    personalizable: true,
    personalizationLabel: "Numéro / nom de table + couleur du motif",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/Gemini_Generated_Image_rdfslxrdfslxrdfs.png?v=1776295960",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/d9bb3a81-dd45-421f-a4ec-fd5831d3d6b6.webp?v=1776295997",
    ],
    variants: [
      { id: "euca-unite", title: "À l'unité (1-9)", price: 14.9 },
      { id: "euca-lot", title: "Lot de 10+ (prix unitaire)", price: 11.9 },
    ],
    descriptionHtml: `<p>Une décoration de table à la fois naturelle, élégante et personnelle. Ce <strong>numéro de table en bois gravé</strong> est orné d'un délicat motif de branche d'eucalyptus.</p>
<p>Réalisé à la main dans notre atelier au laser de précision, il s'harmonise parfaitement avec une décoration champêtre, bohème ou végétale.</p>
<ul>
<li>✨ <strong>100% personnalisable</strong> : numéro ou nom de table selon votre plan de salle.</li>
<li>🎨 <strong>Couleur du motif personnalisable</strong> : doré par défaut, ou autre couleur au choix.</li>
<li>🌿 Motif branche d'eucalyptus, idéal mariages champêtres et bohèmes.</li>
<li>🪵 Fabrication artisanale française.</li>
</ul>
<p><strong>Tarif dégressif :</strong> 14,90 € à l'unité — 11,90 € l'unité dès 10 numéros commandés.</p>`,
  },
  {
    slug: "ronds-de-serviette-bois",
    name: "Ronds de serviette personnalisés",
    weight: 40,
    pickup: true,
    letter: true,
    title: "Ronds de serviette personnalisés en bois – Hexagone, cœur ou cercle",
    category: "mariage",
    type: "Art de la table",
    tagline: "Un cadeau d'invité raffiné, gravé à chaque prénom.",
    personalizable: true,
    personalizationLabel: "Prénoms / initiales / date à graver",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/610876bb-4b83-4b09-a722-356af9af8088.webp?v=1776298326",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/a0452f63-4f2b-4f6b-833d-e9f8772be649.webp?v=1776298326",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/Gemini_Generated_Image_nzbs5vnzbs5vnzbs.png?v=1776298347",
    ],
    variants: [
      { id: "rond-hexagone", title: "Hexagone", price: 7.5 },
      { id: "rond-cercle", title: "Cercle", price: 7.5 },
      { id: "rond-coeur", title: "Double cœur", price: 7.5 },
    ],
    descriptionHtml: `<p><strong>Sublimez vos tables de réception avec une attention raffinée pour chaque convive.</strong></p>
<p>Alliant le charme du bois naturel à une gravure laser haut de gamme, ces ronds de serviette deviennent de véritables pièces de décoration — et un cadeau d'invité que vos proches conserveront longtemps.</p>
<h3>Trois formes au choix</h3>
<ul>
<li>La modernité épurée de l'<strong>hexagone</strong></li>
<li>Le classicisme intemporel du <strong>cercle</strong></li>
<li>Le romantisme délicat du <strong>double cœur</strong></li>
</ul>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matériau :</strong> bois clair de qualité supérieure, finition lisse</li>
<li><strong>Personnalisation :</strong> gravure laser (prénom, initiales, date…)</li>
</ul>
<p>Idéal pour mariages, dîners de fête, repas de famille et événements professionnels.</p>`,
  },
  {
    slug: "menu-de-mariage-bois-grave",
    name: "Menu de mariage en bois gravé",
    weight: 300,
    pickup: true,
    letter: false,
    title: "Menu de mariage en bois gravé — Arche & lettrage relief",
    category: "mariage",
    type: "Menu de mariage",
    tagline: "Un menu en bois, lettrage « Menu » en relief, à vos prénoms.",
    personalizable: true,
    personalizationLabel: "Prénoms des mariés + texte du menu + couleur",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6547.png?v=1780236313",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6734.jpg?v=1780236313",
    ],
    variants: [
      { id: "menu-unite", title: "À l'unité (1-9)", price: 34.9 },
      { id: "menu-lot", title: "Lot de 10+ (prix unitaire)", price: 29.9 },
    ],
    descriptionHtml: `<p>Sublimez vos tables de réception avec ce <strong>menu de mariage en bois gravé entièrement personnalisé</strong>. Réalisé à la main au laser de précision, il associe la chaleur du bois clair à l'élégance d'un lettrage « Menu » en relief.</p>
<p>Forme arche double et socle en bois deux tons pour une présentation raffinée.</p>
<ul>
<li>✨ <strong>100% personnalisable</strong> : prénoms des mariés, entrées, plats et desserts.</li>
<li>🎨 <strong>Lettrage « Menu » personnalisable</strong> : doré par défaut, ou couleur au choix.</li>
<li>📏 Dimensions : environ 195 × 195 mm monté sur son socle.</li>
<li>🪵 Fabrication artisanale française.</li>
</ul>
<p><strong>Tarif dégressif :</strong> 34,90 € à l'unité — 29,90 € l'unité dès 10 menus commandés.</p>`,
  },

  // ----------------------------- CADEAUX & DÉCO ------------------------------
  {
    slug: "plaque-de-porte-enfant",
    name: "Plaque de porte enfant",
    weight: 450,
    pickup: true,
    letter: false,
    title: "Plaque de porte personnalisée prénom & animaux – Chambre enfant",
    category: "cadeaux",
    type: "Décoration chambre enfant",
    tagline: "Le prénom de votre enfant, entouré de ses animaux préférés.",
    personalizable: true,
    personalizationLabel: "Prénom + police + animaux (4 max) + finition",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6324.png?v=1775091197",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6331.png?v=1775091240",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6330.png?v=1775091271",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6327.png?v=1775091304",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6335.png?v=1775091343",
    ],
    variants: [
      { id: "plaque-default", title: "Plaque personnalisée", price: 29.99 },
    ],
    descriptionHtml: `<p><strong>Une décoration unique et chargée d'émotion pour la chambre de votre enfant.</strong></p>
<p>Réalisée en bois découpé avec précision, cette plaque marque l'identité de votre enfant tout en apportant une touche tendre et chaleureuse à sa décoration.</p>
<h3>Une création à votre image</h3>
<ul>
<li><strong>Prénom personnalisé</strong> — choisissez le prénom et la police.</li>
<li><strong>Animaux au choix (4 max)</strong> — Lion, Éléphant, Girafe, Zèbre, Singe, Hippopotame, Ours, Renard, Cerf, Hérisson.</li>
<li><strong>Finition au choix</strong> — bois brut naturel ou marron foncé contrasté.</li>
</ul>
<p>Idéal pour un cadeau de naissance, un baptême, un anniversaire ou simplement la déco d'une chambre.</p>`,
  },
  {
    slug: "cle-usb-personnalisee",
    name: "Clé USB personnalisée",
    weight: 80,
    pickup: false,
    letter: true,
    title: "Clé USB personnalisée – Cadeau souvenir gravé sur mesure",
    category: "cadeaux",
    type: "Cadeau personnalisé",
    tagline: "Un souvenir gravé à conserver : mariage, entreprise, cadeau.",
    personalizable: true,
    personalizationLabel: "Texte / logo à graver",
    images: [],
    variants: [
      { id: "usb-default", title: "Clé USB gravée", price: 14.99 },
    ],
    descriptionHtml: `<p><strong>Un objet du quotidien qui devient un souvenir unique.</strong></p>
<p>Offrez bien plus qu'une simple clé USB : un objet personnalisé qui accompagne au bureau, en voyage, ou conserve les souvenirs les plus précieux.</p>
<h3>Pourquoi vous allez l'adorer</h3>
<ul>
<li><strong>Personnalisation gravée</strong> — prénom, date, message ou logo.</li>
<li><strong>Polyvalente</strong> — usage personnel, professionnel ou cadeau souvenir.</li>
<li><strong>Finition soignée</strong> — matériaux durables, rendu haut de gamme.</li>
</ul>
<h3>Idéale pour</h3>
<ul>
<li><strong>Mariage</strong> — livrer le film de cérémonie ou les photos aux invités.</li>
<li><strong>Cadeau d'entreprise</strong> — logo gravé pour vos clients ou partenaires.</li>
<li><strong>Cadeau personnel</strong> — un souvenir gravé qui marque les esprits.</li>
</ul>`,
  },
];

// --- Helpers ----------------------------------------------------------------

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug) {
  return products.filter((p) => p.category === categorySlug);
}

export function getPriceFrom(product) {
  return Math.min(...product.variants.map((v) => v.price));
}

export function getCategoryLabel(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label || slug;
}

export function getSubcategories(catSlug) {
  return SUBCATEGORIES[catSlug] || null;
}

export function getSubcategoryLabel(catSlug, subSlug) {
  return SUBCATEGORIES[catSlug]?.find((s) => s.slug === subSlug)?.label || subSlug;
}
