// =============================================================================
// Catalogue Niv Création
// -----------------------------------------------------------------------------
// Source unique de vérité pour tous les produits du site.
// Pour ajouter / modifier un produit : édite simplement ce tableau.
// Les prix sont en euros (number). Les images pointent vers le CDN Shopify.
// =============================================================================

import { MOTIF_OPTIONS } from "@/lib/motifs";
export { MOTIF_OPTIONS };

export const CATEGORIES = [
  { slug: "bijoux", label: "Bijoux personnalisés", short: "Bijoux" },
  { slug: "mariage", label: "Mariage & Réception", short: "Mariage" },
  { slug: "cristaux", label: "Cristal 3D", short: "Cristal 3D" },
  { slug: "cadeaux", label: "Décoration & Cadeaux", short: "Déco & Cadeaux" },
  { slug: "cles-usb", label: "Clés USB", short: "Clés USB" },
  { slug: "porte-cles", label: "Porte-clés", short: "Porte-clés" },
  { slug: "medailles", label: "Médaillons & Pièces", short: "Médaillons" },
];

// (Les motifs gravables sont définis dans src/lib/motifs.js.)

// Sous-catégories par catégorie (ex : bijoux femme / homme). « Pour qui ? »
export const SUBCATEGORIES = {
  bijoux: [
    { slug: "femme", label: "Femme" },
    { slug: "homme", label: "Homme" },
    { slug: "couple", label: "Couple" },
    { slug: "bebe", label: "Bébé & Naissance" },
  ],
};

// Deuxième axe de filtre pour les bijoux : le TYPE (collier / bracelet).
// Permet de combiner « Femme + Collier », « Homme + Bracelet », etc.
export const JEWEL_TYPES = [
  { slug: "collier", label: "Colliers" },
  { slug: "bracelet", label: "Bracelets" },
];

// Type de bijou déduit du libellé « type » du produit.
export function getJewelType(product) {
  const t = (product.type || "").toLowerCase();
  if (t.includes("collier")) return "collier";
  if (t.includes("bracelet")) return "bracelet";
  return null;
}

export function getJewelTypeLabel(slug) {
  return JEWEL_TYPES.find((t) => t.slug === slug)?.label || slug;
}

export const products = [
  // ----------------------------- BIJOUX --------------------------------------
  {
    slug: "collier-enveloppe-message-secret",
    name: "Collier Enveloppe Message Secret",
    weight: 120, // grammage emballé (g) — sert au calcul des frais de port
    pickup: false, // remise en main propre possible
    letter: true, // expédiable en Lettre Suivie (léger & fin, < 3 cm)
    subcategory: "femme", // sous-catégorie bijoux
    personalizationFields: [
      { key: "recto", label: "Texte à graver — recto", placeholder: "Ex : Je t'aime — 12.06.2024", maxLength: 40 },
      { key: "verso", label: "Texte à graver — verso", placeholder: "Visible au dos de la plaque", maxLength: 40, optional: true, variantContains: "Recto-Verso" },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
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
      { id: "env-recto-dore", title: "Recto uniquement / Doré", price: 22.90, compareAt: 30.90 },
      { id: "env-recto-argent", title: "Recto uniquement / Argent", price: 22.90, compareAt: 30.90 },
      { id: "env-recto-rose", title: "Recto uniquement / Or Rose", price: 22.90, compareAt: 30.90 },
      { id: "env-rv-dore", title: "Recto-Verso / Doré", price: 23.90, compareAt: 31.90 },
      { id: "env-rv-argent", title: "Recto-Verso / Argent", price: 23.90, compareAt: 31.90 },
      { id: "env-rv-rose", title: "Recto-Verso / Or Rose", price: 23.90, compareAt: 31.90 },
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
    engraveHeart3d: true, // ← aperçu 3D cœur éventail (8 faces)
    // Couverture (texte) incluse, +3 €/page de texte, photo +5 €.
    engravingPricing: { perExtraPage: 3, includedKey: "cover", photoKey: "photo", photoSurcharge: 5 },
    personalizationFields: [
      { key: "note", type: "note", text: "Médaillon qui s'ouvre comme un livre : 5 faces à graver (la couverture, 3 pages intérieures et le dos). La gravure de TEXTE de la couverture est incluse ; chaque autre page de texte gravée est à +3 €. Remplissez seulement les faces souhaitées, les autres restent vierges. Astuce : les polices manuscrites ou en gras prennent plus de place — avec ces styles, prévoyez un texte plus court (15 caractères, c'est environ un prénom + une date)." },
      { key: "cover", label: "Gravure — Couverture (texte inclus)", placeholder: "Prénom, mot court…", maxLength: 15 },
      { key: "page1", label: "Gravure — Page 1 (+3 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "page2", label: "Gravure — Page 2 (+3 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "page3", label: "Gravure — Page 3 (+3 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "backcover", label: "Gravure — Dos (+3 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "photo", type: "photo", label: "Photo à graver (+5 €)", optional: true, text: "Optionnel : ajoutez une photo gravée (+5 €). Choisissez une photo nette, bien éclairée et contrastée. La page qui reçoit la photo ne porte pas de texte." },
      { key: "photoPage", type: "select", label: "Sur quelle page graver la photo ?", requiresField: "photo",
        options: [
          { value: "cover", label: "Couverture" },
          { value: "page1", label: "Page 1" },
          { value: "page2", label: "Page 2" },
          { value: "page3", label: "Page 3" },
          { value: "backcover", label: "Dos" },
        ] },
    ],
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
      { id: "med-argent-texte", title: "Argent", price: 30.90, compareAt: 40.90 },
      { id: "med-bicolore-texte", title: "Bicolore (Or & Argent)", price: 35.90, compareAt: 47.90 },
    ],
    descriptionHtml: `<p><strong>Un bijou élégant et intemporel à personnaliser.</strong></p>
<p>Gardez vos souvenirs les plus précieux près de votre cœur. Le médaillon s'ouvre comme un petit livre et révèle <strong>5 faces entièrement personnalisables</strong> à graver selon vos envies.</p>
<h3>Un médaillon, 5 faces</h3>
<ul>
<li><strong>Couverture</strong> — gravure de texte incluse</li>
<li><strong>Pages 1 à 3</strong> — gravure de texte à +3 € par page</li>
<li><strong>Dos</strong> — gravure de texte à +3 €</li>
</ul>
<p>Sur chaque face : un texte court, ou une <strong>photo gravée (+5 €)</strong> que vous placez sur la page de votre choix (cette page ne porte alors pas de texte).</p>
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
    preview: { top: "45%", bottom: "40%", left: "6%", right: "48%" },
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30, variantContains: "Avec" },
      { key: "police", type: "font", label: "Police de gravure", optional: true, variantContains: "Avec" },
    ],
    title: "Bracelet Homme Identité — Gourmette acier inoxydable gravée",
    category: "bijoux",
    type: "Bracelet personnalisé",
    tagline: "Gourmette à maillons cubains, plaque gravée avec votre message.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police souhaitée",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086801196_rxih.jpg?v=1780366838",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086800434_d5ag.jpg?v=1780366839",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8134708393_5e02.jpg?v=1780366838",
    ],
    variants: [
      { id: "gourm-gravure", title: "Avec gravure", price: 30.90, compareAt: 40.90 },
      { id: "gourm-sans", title: "Sans gravure", price: 34.90, compareAt: 46.90 },
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
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30, variantContains: "Avec" },
      { key: "police", type: "font", label: "Police de gravure", optional: true, variantContains: "Avec" },
    ],
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
      { id: "sil-argent-sans", title: "Plaque argentée / Sans texte", price: 20.90, compareAt: 27.90 },
      { id: "sil-argent-texte", title: "Plaque argentée / Avec texte", price: 25.90, compareAt: 34.90 },
      { id: "sil-noire-sans", title: "Plaque noire / Sans texte", price: 20.90, compareAt: 27.90 },
      { id: "sil-noire-texte", title: "Plaque noire / Avec texte", price: 25.90, compareAt: 34.90 },
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
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30, variantContains: "Avec" },
      { key: "police", type: "font", label: "Police de gravure", optional: true, variantContains: "Avec" },
    ],
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
      { id: "cuir-argent-sans", title: "Plaque argentée / Sans texte", price: 19.90, compareAt: 26.90 },
      { id: "cuir-argent-texte", title: "Plaque argentée / Avec texte", price: 24.90, compareAt: 32.90 },
      { id: "cuir-dore-sans", title: "Plaque dorée / Sans texte", price: 19.90, compareAt: 26.90 },
      { id: "cuir-dore-texte", title: "Plaque dorée / Avec texte", price: 24.90, compareAt: 32.90 },
      { id: "cuir-noire-sans", title: "Plaque noire / Sans texte", price: 19.90, compareAt: 26.90 },
      { id: "cuir-noire-texte", title: "Plaque noire / Avec texte", price: 24.90, compareAt: 32.90 },
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
    personalizationFields: [
      { key: "numero", label: "Numéro ou nom de la table", placeholder: "Ex : 1, 2… ou « Mariés »", maxLength: 24 },
      { key: "couleur", type: "color", label: "Couleur de l'acrylique", optional: true, options: [
        { value: "#c9a24b", label: "Doré" },
        { value: "#b0b0b0", label: "Argenté" },
        { value: "#1c1813", label: "Noir" },
        { value: "#b76e79", label: "Rosé" },
      ] },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
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
    personalizationFields: [
      { key: "numero", label: "Numéro ou nom de la table", placeholder: "Ex : 1, 2… ou « Mariés »", maxLength: 24 },
      { key: "couleur", type: "color", label: "Couleur du chiffre", optional: true, options: [
        { value: "#c9a24b", label: "Doré" },
        { value: "#b0b0b0", label: "Argenté" },
        { value: "#1c1813", label: "Noir" },
      ] },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
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
    tagline: "Un cadeau d'invité raffiné, gravé au prénom de chaque invité.",
    personalizable: true,
    personalizationLabel: "Prénoms / initiales / date à graver",
    personalizationFields: [
      { key: "prenoms", type: "textarea", label: "Prénoms / initiales à graver (un par ligne)", placeholder: "Marie\nPaul\nSophie…", maxLength: 600 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
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
    personalizationFields: [
      { key: "prenoms", label: "Prénoms des mariés", placeholder: "Ex : Marie & Paul", maxLength: 40 },
      { key: "menu", type: "textarea", label: "Texte du menu (un plat par ligne)", placeholder: "Entrée : …\nPlat : …\nDessert : …", maxLength: 400 },
      { key: "couleur", type: "color", label: "Couleur du lettrage « Menu »", optional: true, options: [
        { value: "#c9a24b", label: "Doré" },
        { value: "#b0b0b0", label: "Argenté" },
        { value: "#1c1813", label: "Noir mat" },
        { value: "#b76e79", label: "Rosé" },
      ] },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
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
    personalizationFields: [
      { key: "prenom", label: "Prénom de l'enfant", placeholder: "Ex : Lina", maxLength: 20 },
      { key: "police", type: "font", label: "Police", optional: true },
      { key: "animaux", type: "textarea", label: "Animaux au choix (4 max)", placeholder: "Ex : Lion, Éléphant, Girafe, Ours", maxLength: 120 },
      { key: "finition", type: "select", label: "Finition", optional: true, options: [
        { value: "Bois brut", label: "Bois brut (naturel)" },
        { value: "Marron foncé", label: "Marron foncé (teinté)" },
      ] },
    ],
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
    hidden: true, // doublon visuel avec la Clé USB Cristal 3D (même photo) — masquée
    title: "Clé USB personnalisée – Cadeau souvenir gravé sur mesure",
    category: "cles-usb",
    type: "Cadeau personnalisé",
    tagline: "Un souvenir gravé à conserver : mariage, entreprise, cadeau.",
    personalizable: true,
    personalizationLabel: "Texte / logo à graver",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 40, optional: true },
      { key: "police", type: "font", label: "Police", optional: true },
      { key: "logoNote", type: "note", text: "Logo d'entreprise : envoyez votre fichier (vectoriel HD) par e-mail après la commande, avec votre numéro de commande." },
    ],
    images: ["/produits/cle_usb_cristal_argent_4gb.jpg"],
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

  // ============== IMPORT CATALOGUE (test) ==============
  {
    slug: "pyramide-cristal-gravure-3d",
    name: "Pyramide cristal — Gravure 3D",
    weight: 320,
    pickup: true, // fragile : remise en main propre conseillée
    letter: false,
    title: "Pyramide en cristal — gravure photo 3D personnalisée",
    category: "cristaux",
    type: "Cristal photo 3D",
    tagline: "Votre photo gravée en 3D au cœur du cristal.",
    personalizable: true,
    personalizationLabel: "Photo à graver (+ texte optionnel)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", text: "Choisissez une photo nette, bien éclairée, avec un sujet bien détaché sur un fond simple ou sombre." },
      { key: "texte", label: "Texte à graver (optionnel)", placeholder: "Prénom, date…", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: ["/produits/pyramide_en_verre_de_cristal_50mm.jpg"],
    variants: [{ id: "pyramide-cristal-50mm", title: "50 mm", price: 39.9 }],
    descriptionHtml: `<p><strong>Offrez un souvenir gravé pour l'éternité.</strong></p>
<p>Votre photo est gravée en trois dimensions à l'intérieur d'un cristal optique K9 d'une grande pureté, grâce à un laser de précision. L'image semble flotter au cœur du cristal — un effet saisissant, encore sublimé posé sur un socle lumineux LED.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matériau :</strong> cristal optique K9 haute pureté</li>
<li><strong>Format :</strong> pyramide 50 mm</li>
<li><strong>Gravure :</strong> photo 3D interne (sub-surface) au laser</li>
<li><strong>Idéal :</strong> cadeau souvenir, naissance, mariage, hommage</li>
</ul>
<p><em>Conseil : une photo nette et contrastée donne le plus beau rendu. Un socle lumineux LED est disponible séparément.</em></p>`,
  },
  {
    slug: "bracelet-homme-cuir-tresse-acier",
    hidden: true, // retiré du site (doublon visuel avec le Bracelet Cuir & Acier)
    name: "Bracelet Homme Cuir Tressé & Acier",
    weight: 90,
    pickup: false,
    letter: true,
    subcategory: "homme",
    title: "Bracelet homme cuir tressé & acier à graver",
    category: "bijoux",
    type: "Bracelet personnalisé",
    tagline: "Cuir tressé et plaque acier, gravée avec votre message.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/bracelet_cuir_tresse_a_graver_argente.jpg",
      "/produits/bracelet_cuir_tresse_a_graver_dore.jpg",
      "/produits/bracelet_cuir_tresse_a_graver_noir.jpg",
    ],
    variants: [
      { id: "cuir-tresse-argente", title: "Argenté", price: 18.90, compareAt: 24.90 },
      { id: "cuir-tresse-dore", title: "Doré", price: 18.90, compareAt: 24.90 },
      { id: "cuir-tresse-noir", title: "Noir", price: 18.90, compareAt: 24.90 },
    ],
    descriptionHtml: `<p>Un bracelet masculin et intemporel : <strong>cuir véritable tressé</strong> associé à une <strong>plaque en acier inoxydable</strong> gravable.</p>
<p>Gravez un prénom, une date ou un message pour en faire un cadeau unique (Fête des Pères, anniversaire, Noël).</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matières :</strong> cuir véritable tressé + acier inoxydable</li>
<li><strong>Finitions :</strong> plaque argentée, dorée ou noire</li>
<li><strong>Gravure :</strong> laser, réalisée sur commande</li>
</ul>`,
  },
  {
    slug: "porte-cles-cuir-a-graver",
    name: "Porte-clés cuir à graver",
    weight: 50,
    pickup: false,
    letter: true,
    title: "Porte-clés en cuir véritable à graver personnalisé",
    category: "porte-cles",
    type: "Porte-clés personnalisé",
    tagline: "Un porte-clés en cuir, gravé avec votre message.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, coordonnées GPS…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/porte_cles_vierges_en_cuir_marron.jpg",
      "/produits/porte_cles_vierges_en_cuir_noir.jpg",
    ],
    variants: [
      { id: "porte-cles-cuir-marron", title: "Marron", price: 7.9, image: "/produits/porte_cles_vierges_en_cuir_marron.jpg" },
      { id: "porte-cles-cuir-noir", title: "Noir", price: 7.9, image: "/produits/porte_cles_vierges_en_cuir_noir.jpg" },
    ],
    descriptionHtml: `<p>Un <strong>porte-clés en cuir véritable</strong>, gravé au laser avec le texte de votre choix : prénom, date, petit mot ou coordonnées GPS d'un lieu qui compte.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> cuir véritable</li>
<li><strong>Coloris :</strong> marron ou noir</li>
<li><strong>Gravure :</strong> laser, réalisée sur commande</li>
</ul>
<p>Un petit cadeau qui fait toujours plaisir, à offrir ou à s'offrir.</p>`,
  },

  // ===== Cristaux 3D =====
  {
    slug: "trophee-cristal-vierge-3d",
    name: "Trophée cristal — Gravure 3D",
    weight: 600, pickup: true, letter: false,
    title: "Trophée en cristal — gravure photo 3D personnalisée",
    category: "cristaux", type: "Cristal photo 3D",
    tagline: "Un trophée en cristal, votre photo gravée en 3D à l'intérieur.",
    personalizable: true, personalizationLabel: "Photo à graver (+ texte optionnel)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", text: "Photo nette, bien éclairée, sujet bien détaché sur fond simple." },
      { key: "texte", label: "Texte à graver (optionnel)", placeholder: "Nom, date, dédicace…", maxLength: 40, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: ["/produits/trophee_en_cristal_vierge_14_cm.jpg"],
    variants: [{ id: "trophee-cristal-14cm", title: "14 cm", price: 69.9 }],
    descriptionHtml: `<p>Un <strong>trophée en cristal optique K9</strong> avec votre photo gravée en 3D à l'intérieur. Une pièce d'exception pour un hommage, une remise de prix ou un souvenir précieux.</p>
<ul><li>Cristal optique K9 haute pureté</li><li>Hauteur 14 cm</li><li>Gravure photo 3D interne au laser</li></ul>
<p><em>Sublimé par un socle lumineux LED (disponible séparément).</em></p>`,
  },

  // ===== Bracelets =====
  {
    slug: "bracelet-homme-chaine-acier",
    name: "Bracelet Homme Chaîne Acier",
    weight: 120, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme chaîne acier à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Chaîne en acier inoxydable, plaque gravée avec votre message.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/bracelet_homme_chaine_a_graver_argente.jpg",
    ],
    variants: [
      { id: "chaine-acier-argente", title: "Argenté", price: 30.90, compareAt: 40.90 },
    ],
    descriptionHtml: `<p>Bracelet homme en <strong>acier inoxydable</strong>, plaque gravable au laser. Solide, élégant, intemporel.</p>
<ul><li>Acier inoxydable hypoallergénique</li><li>Fermoir sécurisé</li><li>Gravure prénom, date ou message</li></ul>`,
  },
  {
    slug: "bracelet-femme-acier",
    name: "Bracelet Femme Acier",
    weight: 80, pickup: false, letter: true, subcategory: "femme",
    title: "Bracelet femme acier à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Un bracelet fin en acier doré, gravé avec votre message.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: ["/produits/bracelet_a_graver_dore.jpg"],
    variants: [{ id: "bracelet-femme-acier-dore", title: "Doré", price: 21.90, compareAt: 28.90 }],
    descriptionHtml: `<p>Bracelet femme délicat en <strong>acier inoxydable doré</strong>, à personnaliser par gravure.</p>
<ul><li>Acier inoxydable, ne ternit pas</li><li>Gravure fine au laser</li></ul>`,
  },
  {
    slug: "bracelet-empreinte-pied-bebe",
    name: "Bracelet Empreinte Pied de Bébé",
    weight: 70, pickup: false, letter: true, subcategory: "bebe",
    title: "Bracelet empreinte pied de bébé à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Le souvenir d'une naissance, gravé à porter sur soi.",
    personalizable: true, personalizationLabel: "Prénom & date + police",
    personalizationFields: [
      { key: "texte", label: "Prénom et/ou date de naissance", placeholder: "Ex : Lina — 12.06.2024", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_argente.jpg",
      "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_dore.jpg",
    ],
    variants: [
      { id: "empreinte-bebe-argente", title: "Argenté", price: 15.90, compareAt: 20.90, image: "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_argente.jpg" },
      { id: "empreinte-bebe-dore", title: "Doré", price: 15.90, compareAt: 20.90, image: "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_dore.jpg" },
    ],
    descriptionHtml: `<p>Un bracelet tendre orné d'une <strong>empreinte de pied de bébé</strong>, à graver au prénom et à la date de naissance. Cadeau de naissance idéal.</p>
<ul><li>Acier inoxydable hypoallergénique</li><li>Argenté ou doré</li></ul>`,
  },
  {
    slug: "bracelet-femme-coeur",
    name: "Bracelet Femme Cœur",
    weight: 80, pickup: false, letter: true, subcategory: "femme",
    title: "Bracelet femme cœur à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Un cœur en acier doré, gravé avec votre message.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 25 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: ["/produits/bracelet_femme_coeur_a_graver_dore.jpg"],
    variants: [{ id: "bracelet-coeur-dore", title: "Doré", price: 21.90, compareAt: 28.90 }],
    descriptionHtml: `<p>Bracelet femme avec breloque <strong>cœur</strong> gravable, en acier inoxydable doré. Romantique et délicat.</p>`,
  },
  {
    slug: "bracelet-femme-papillon",
    name: "Bracelet Femme Papillon ajouré",
    weight: 80, pickup: false, letter: true, subcategory: "femme",
    title: "Bracelet femme papillon ajouré à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Un papillon ajouré tout en finesse, à graver.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 25 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/bracelet_papillon_ajoure_a_graver_argente.jpg",
      "/produits/bracelet_papillon_ajoure_a_graver_dore.jpg",
      "/produits/bracelet_papillon_ajoure_a_graver_noir.jpg",
      "/produits/bracelet_papillon_ajoure_a_graver_or_rose.jpg",
    ],
    variants: [
      { id: "papillon-argente", title: "Argenté", price: 21.90, compareAt: 28.90 },
      { id: "papillon-dore", title: "Doré", price: 21.90, compareAt: 28.90 },
      { id: "papillon-noir", title: "Noir", price: 19.90, compareAt: 26.90 },
      { id: "papillon-or-rose", title: "Or Rose", price: 23.90, compareAt: 31.90 },
    ],
    descriptionHtml: `<p>Bracelet femme orné d'un <strong>papillon ajouré</strong> en acier inoxydable, à personnaliser par gravure. Plusieurs finitions.</p>`,
  },
  {
    slug: "bracelet-homme-double-anneau",
    name: "Bracelet Homme Double Anneau",
    weight: 110, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme double anneau acier à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Deux anneaux d'acier, une plaque à graver.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: ["/produits/bracelet_homme_double_anneau_a_graver_argente.jpg"],
    variants: [{ id: "double-anneau-argente", title: "Argenté", price: 24.90, compareAt: 32.90 }],
    descriptionHtml: `<p>Bracelet homme moderne à <strong>double anneau</strong> en acier inoxydable, plaque gravable au laser.</p>`,
  },
  {
    slug: "bracelet-homme-rond-retro",
    name: "Bracelet Homme Rond Rétro",
    weight: 100, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme rond rétro acier à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Un médaillon rond rétro en acier, à graver.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/bracelet_homme_rond_retro_a_grave_argente.jpg",
      "/produits/bracelet_homme_rond_retro_a_grave_noir.jpg",
    ],
    variants: [
      { id: "rond-retro-argente", title: "Argenté", price: 18.90, compareAt: 24.90 },
      { id: "rond-retro-noir", title: "Noir", price: 18.90, compareAt: 24.90 },
    ],
    descriptionHtml: `<p>Bracelet homme au style <strong>rétro</strong> avec médaillon rond gravable, en acier inoxydable.</p>`,
  },

  // ===== Colliers =====
  {
    slug: "collier-couple-coeur-lot2",
    name: "Collier Couple Cœur (lot de 2)",
    weight: 90, pickup: false, letter: true, subcategory: "couple",
    title: "Collier couple cœur à graver (lot de 2)",
    category: "bijoux", type: "Collier personnalisé",
    tagline: "Deux moitiés de cœur à graver, à partager à deux.",
    personalizable: true, personalizationLabel: "Texte des 2 pendentifs + police",
    personalizationFields: [
      { key: "texte1", label: "Texte — pendentif 1", placeholder: "Ex : prénom", maxLength: 20 },
      { key: "texte2", label: "Texte — pendentif 2", placeholder: "Ex : prénom", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: ["/produits/collier_c_ur_couple_a_graver_lot_2_pieces_or_rose.jpg"],
    variants: [{ id: "couple-coeur-or-rose", title: "Or Rose", price: 30.90, compareAt: 40.90 }],
    descriptionHtml: `<p>Un <strong>lot de 2 colliers</strong> formant un cœur, à graver chacun. Le cadeau parfait pour les amoureux.</p>`,
  },
  {
    slug: "collier-plaque-acier",
    name: "Collier Plaque Acier",
    weight: 90, pickup: false, letter: true, subcategory: "homme",
    title: "Collier plaque acier à graver",
    category: "bijoux", type: "Collier personnalisé",
    tagline: "Une plaque d'acier épurée, gravée avec votre message.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/collier_plaque_a_graver_acier_noir.jpg",
      "/produits/collier_plaque_a_graver_argente.jpg",
      "/produits/collier_plaque_a_graver_argente_et_noir.jpg",
      "/produits/collier_plaque_a_graver_dore.jpg",
      "/produits/collier_plaque_a_graver_noir.jpg",
    ],
    variants: [
      { id: "plaque-acier-noir", title: "Acier Noir", price: 25.90, compareAt: 34.90 },
      { id: "plaque-argente", title: "Argenté", price: 23.90, compareAt: 31.90 },
      { id: "plaque-argente-noir", title: "Argenté et Noir", price: 26.90, compareAt: 35.90 },
      { id: "plaque-dore", title: "Doré", price: 26.90, compareAt: 35.90 },
      { id: "plaque-noir", title: "Noir", price: 24.90, compareAt: 32.90 },
    ],
    descriptionHtml: `<p>Collier à <strong>plaque rectangulaire</strong> en acier inoxydable, surface lisse gravable. Style épuré et contemporain.</p>`,
  },
  {
    slug: "collier-medaillon-livre",
    name: "Collier Médaillon Livre",
    weight: 120, pickup: false, letter: true, subcategory: "femme",
    title: "Collier médaillon livre à graver",
    category: "bijoux", type: "Collier personnalisé",
    tagline: "Un médaillon qui s'ouvre comme un petit livre, à graver.",
    personalizable: true, personalizationLabel: "Textes à graver + police",
    personalizationFields: [
      { key: "texte1", label: "Gravure — page 1", maxLength: 30 },
      { key: "texte2", label: "Gravure — page 2", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/collier_medaillon_modele_livre_a_graver_argente.jpg",
      "/produits/collier_medaillon_modele_livre_a_graver_dore.jpg",
      "/produits/collier_medaillon_modele_livre_a_graver_dore_et_argente.jpg",
    ],
    variants: [
      { id: "medaillon-livre-argente", title: "Argenté", price: 31.90, compareAt: 42.90 },
      { id: "medaillon-livre-dore", title: "Doré", price: 31.90, compareAt: 42.90 },
      { id: "medaillon-livre-bicolore", title: "Doré et Argenté", price: 33.90, compareAt: 44.90 },
    ],
    descriptionHtml: `<p>Médaillon en forme de <strong>livre</strong> qui s'ouvre, avec pages intérieures gravables. En acier inoxydable.</p>`,
  },
  {
    slug: "collier-couple-puzzle",
    name: "Collier Couple Puzzle géométrique",
    weight: 80, pickup: false, letter: true, subcategory: "couple",
    title: "Collier couple pendentif puzzle géométrique à graver",
    category: "bijoux", type: "Collier personnalisé",
    tagline: "Deux pièces qui s'emboîtent, à graver à deux.",
    personalizable: true, personalizationLabel: "Texte des 2 pendentifs + police",
    personalizationFields: [
      { key: "texte1", label: "Texte — pendentif 1", maxLength: 20 },
      { key: "texte2", label: "Texte — pendentif 2", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/collier_pendentif_couple_geometric_puzzle_a_graver_argente.jpg",
      "/produits/collier_pendentif_couple_geometric_puzzle_a_graver_or_rose.jpg",
    ],
    variants: [
      { id: "puzzle-argente", title: "Argenté", price: 15.90, compareAt: 20.90 },
      { id: "puzzle-or-rose", title: "Or Rose", price: 18.90, compareAt: 24.90 },
    ],
    descriptionHtml: `<p>Un duo de pendentifs <strong>puzzle géométrique</strong> qui s'emboîtent, à graver. Symbole d'un lien unique.</p>`,
  },
  {
    slug: "collier-femme-pendentif-geometrique",
    name: "Collier Femme Pendentif géométrique",
    weight: 70, pickup: false, letter: true, subcategory: "femme",
    title: "Collier femme pendentif géométrique à graver",
    category: "bijoux", type: "Collier personnalisé",
    engrave3d: true, // aperçu 3D : barre gravable sur 4 faces (le client fait pivoter)
    tagline: "Une barre verticale gravable sur ses 4 faces : prénoms, dates, coordonnées…",
    personalizable: true, personalizationLabel: "Gravure jusqu'à 4 faces + police",
    personalizationFields: [
      { key: "face1", label: "Face avant — texte", placeholder: "Ex. un prénom", maxLength: 23, optional: true },
      { key: "motif1", type: "motif", label: "Face avant — motif", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos1", type: "select", label: "Face avant — motif placé", optional: true, options: [{ value: "above", label: "Au-dessus du nom" }, { value: "below", label: "En dessous du nom" }] },
      { key: "face2", label: "Face arrière — texte", placeholder: "Ex. une date : 14.07.2024", maxLength: 23, optional: true },
      { key: "motif2", type: "motif", label: "Face arrière — motif", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos2", type: "select", label: "Face arrière — motif placé", optional: true, options: [{ value: "above", label: "Au-dessus du nom" }, { value: "below", label: "En dessous du nom" }] },
      { key: "face3", label: "Face droite — texte", placeholder: "Ex. un mot, un message", maxLength: 23, optional: true },
      { key: "motif3", type: "motif", label: "Face droite — motif", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos3", type: "select", label: "Face droite — motif placé", optional: true, options: [{ value: "above", label: "Au-dessus du nom" }, { value: "below", label: "En dessous du nom" }] },
      { key: "face4", label: "Face gauche — texte", placeholder: "Ex. coordonnées GPS", maxLength: 23, optional: true },
      { key: "motif4", type: "motif", label: "Face gauche — motif", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos4", type: "select", label: "Face gauche — motif placé", optional: true, options: [{ value: "above", label: "Au-dessus du nom" }, { value: "below", label: "En dessous du nom" }] },
      { key: "sens", type: "select", label: "Sens du nom", optional: true, options: [
        { value: "up", label: "Du bas vers le haut" },
        { value: "down", label: "Du haut vers le bas" },
      ] },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "Laissez vide les faces non gravées. Motif et placement (haut/bas) réglables par face." },
    ],
    images: [
      "/produits/collier_pendentif_geometrique_a_graver_agente.jpg",
      "/produits/collier_pendentif_geometrique_a_graver_arc_en_ciel.jpg",
      "/produits/collier_pendentif_geometrique_a_graver_dore.jpg",
      "/produits/collier_pendentif_geometrique_a_graver_noir.jpg",
      "/produits/collier_pendentif_geometrique_a_graver_or_rose.jpg",
    ],
    variants: [
      { id: "geo-argente", title: "Argenté", price: 20.90, compareAt: 27.90 },
      { id: "geo-arc-en-ciel", title: "Arc en Ciel", price: 24.90, compareAt: 32.90 },
      { id: "geo-dore", title: "Doré", price: 23.90, compareAt: 31.90 },
      { id: "geo-noir", title: "Noir", price: 23.90, compareAt: 31.90 },
      { id: "geo-or-rose", title: "Or Rose", price: 23.90, compareAt: 31.90 },
    ],
    descriptionHtml: `<p>Collier femme au <strong>pendentif géométrique</strong> moderne, gravable au laser. Plusieurs finitions, dont arc-en-ciel.</p>`,
  },

  // ===== Clés USB =====
  {
    slug: "cle-usb-cristal-3d",
    name: "Clé USB Cristal — Gravure 3D",
    weight: 70, pickup: false, letter: true,
    title: "Clé USB cristal avec gravure photo 3D",
    category: "cles-usb", type: "Clé USB personnalisée",
    tagline: "Une clé USB en cristal, votre photo gravée en 3D.",
    personalizable: true, personalizationLabel: "Photo à graver (+ texte)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", optional: true, text: "Photo nette et contrastée pour un beau rendu." },
      { key: "texte", label: "Texte à graver (optionnel)", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: [
      "/produits/cle_usb_cristal_argent_4gb.jpg",
      "/produits/cle_usb_cristal_rose_4gb.jpg",
    ],
    variants: [{ id: "usb-cristal-4go", title: "4 Go", price: 17.9 }],
    descriptionHtml: `<p>Clé USB en <strong>cristal</strong> avec votre photo gravée en 3D à l'intérieur. Un souvenir et un objet utile à la fois.</p>`,
  },
  {
    slug: "cle-usb-bois-coffret",
    name: "Clé USB Bois — Coffret",
    weight: 150, pickup: false, letter: false,
    title: "Clé USB bois avec coffret, à graver",
    category: "cles-usb", type: "Clé USB personnalisée",
    tagline: "Une clé USB en bois gravée, livrée dans son coffret.",
    personalizable: true, personalizationLabel: "Texte / logo + police",
    personalizationFields: [
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 40, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "logoNote", type: "note", text: "Logo d'entreprise : envoyez votre fichier (vectoriel HD) par e-mail après la commande." },
    ],
    images: ["/produits/cle_usb_en_bois_4gb_avec_boite_en_bois.jpg"],
    variants: [{ id: "usb-bois-4go", title: "4 Go", price: 24.9 }],
    descriptionHtml: `<p>Clé USB en <strong>bois</strong> gravée au laser, présentée dans un élégant <strong>coffret bois</strong>. Idéale mariage ou cadeau d'entreprise.</p>`,
  },

  // ===== Porte-clés =====
  {
    slug: "porte-cles-cristal-led-coeur",
    name: "Porte-clés Cristal LED Cœur — Gravure 3D",
    weight: 120, pickup: false, letter: false,
    title: "Porte-clés cristal LED cœur avec gravure photo 3D",
    category: "cristaux", type: "Porte-clés cristal 3D",
    tagline: "Un porte-clés cœur en cristal lumineux, votre photo gravée en 3D.",
    personalizable: true, personalizationLabel: "Photo à graver (+ texte)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", text: "Photo nette et contrastée pour un beau rendu." },
      { key: "texte", label: "Texte à graver (optionnel)", maxLength: 25, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: [
      "/produits/porte_cles_en_cristal_avec_lumiere_led_coeur.jpg",
    ],
    variants: [
      { id: "pc-cristal-coeur", title: "Cœur", price: 24.9 },
    ],
    descriptionHtml: `<p>Porte-clés <strong>en forme de cœur</strong> en cristal avec LED, votre photo gravée en 3D à l'intérieur. S'illumine d'une simple pression.</p>
<ul><li>Forme cœur</li><li>Cristal optique avec LED intégrée</li><li>Gravure photo 3D au laser</li></ul>`,
  },
  {
    slug: "porte-cles-cristal-led-rectangle",
    name: "Porte-clés Cristal LED Rectangle — Gravure 3D",
    weight: 120, pickup: false, letter: false,
    title: "Porte-clés cristal LED rectangle avec gravure photo 3D",
    category: "cristaux", type: "Porte-clés cristal 3D",
    tagline: "Un porte-clés rectangle en cristal lumineux, votre photo gravée en 3D.",
    personalizable: true, personalizationLabel: "Photo à graver (+ texte)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", text: "Photo nette et contrastée pour un beau rendu." },
      { key: "texte", label: "Texte à graver (optionnel)", maxLength: 25, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: [
      "/produits/porte_cles_en_cristal_avec_lumiere_led_rectangle.jpg",
    ],
    variants: [
      { id: "pc-cristal-rectangle", title: "Rectangle", price: 22.9 },
    ],
    descriptionHtml: `<p>Porte-clés <strong>de forme rectangulaire</strong> en cristal avec LED, votre photo gravée en 3D à l'intérieur. S'illumine d'une simple pression.</p>
<ul><li>Forme rectangle</li><li>Cristal optique avec LED intégrée</li><li>Gravure photo 3D au laser</li></ul>`,
  },

  // ===== Pièces métal =====
  {
    slug: "piece-ronde-laiton",
    name: "Pièce ronde laiton à graver",
    weight: 40, pickup: false, letter: true,
    title: "Pièce ronde en laiton à graver personnalisée",
    category: "medailles", type: "Pièce à graver",
    tagline: "Une médaille ronde en laiton, à graver des deux côtés.",
    personalizable: true, personalizationLabel: "Texte à graver + police",
    personalizationFields: [
      { key: "recto", label: "Texte à graver — recto", maxLength: 30 },
      { key: "verso", label: "Texte à graver — verso", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: ["/produits/piece_laiton.jpg"],
    variants: [{ id: "piece-laiton", title: "Laiton", price: 14.9 }],
    descriptionHtml: `<p>Médaille ronde en <strong>laiton</strong>, à graver (recto et verso possibles). Parfaite en porte-bonheur ou souvenir.</p>`,
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
