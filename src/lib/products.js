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
  { slug: "bijoux", label: "Bijoux", short: "Bijoux" },
  { slug: "cristal", label: "Cristal Photo 3D", short: "Cristal" },
  { slug: "verres", label: "Verres gravés", short: "Verres" },
  { slug: "mariage", label: "Mariage & Réception", short: "Mariage" },
  { slug: "deco", label: "Déco & Maison", short: "Déco" },
  { slug: "cadeaux", label: "Cadeaux & Accessoires", short: "Cadeaux" },
];

// (Les motifs gravables sont définis dans src/lib/motifs.js.)

// Sous-catégories par catégorie. La boutique affiche automatiquement ces filtres.
export const SUBCATEGORIES = {
  bijoux: [
    { slug: "femme", label: "Femme" },
    { slug: "homme", label: "Homme" },
    { slug: "couple", label: "Couple" },
    { slug: "bebe", label: "Bébé & Naissance" },
  ],
  // Verres gravés : par type de verre (on ajoute champagne/bière/vin quand les produits arrivent).
  verres: [
    { slug: "whisky", label: "Verre à whisky" },
  ],
  mariage: [
    { slug: "tables", label: "Numéros de table" },
    { slug: "table-deco", label: "Ronds & étiquettes" },
    { slug: "menus", label: "Menus" },
  ],
  deco: [
    { slug: "plaques", label: "Plaques" },
    { slug: "couverts", label: "Couverts" },
    { slug: "lampes", label: "Lampes" },
    { slug: "bougeoirs", label: "Bougeoir" },
  ],
  cadeaux: [
    { slug: "cles-usb", label: "Clés USB" },
    { slug: "porte-cles", label: "Porte-clés" },
    { slug: "medaillons", label: "Médaillons" },
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
    badge: "Coup de cœur",
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
    engraveEnvelope3d: true, // aperçu 3D : la plaque sort de l'enveloppe et montre la gravure
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
      { id: "env-recto-dore", title: "Recto uniquement / Doré", price: 27.90, stockId: "env-dore" },
      { id: "env-recto-argent", title: "Recto uniquement / Argent", price: 27.90, stockId: "env-argent" },
      { id: "env-recto-rose", title: "Recto uniquement / Or Rose", price: 27.90, stockId: "env-rose" },
      { id: "env-rv-dore", title: "Recto-Verso / Doré", price: 29.90, stockId: "env-dore" },
      { id: "env-rv-argent", title: "Recto-Verso / Argent", price: 29.90, stockId: "env-argent" },
      { id: "env-rv-rose", title: "Recto-Verso / Or Rose", price: 29.90, stockId: "env-rose" },
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
    badge: "Coup de cœur",
    name: "Collier Médaillon Cœur ouvrable",
    weight: 150,
    pickup: false,
    letter: true,
    subcategory: "femme",
    engraveHeart3d: true, // ← aperçu 3D cœur éventail (8 faces)
    // Couverture (texte) incluse, +5 €/page de texte, photo +8 €.
    engravingPricing: { perExtraPage: 5, includedKey: "cover", photoKey: "photo", photoSurcharge: 8 },
    personalizationFields: [
      { key: "note", type: "note", text: "Médaillon qui s'ouvre comme un livre : 5 faces à graver (la couverture, 3 pages intérieures et le dos). La gravure de TEXTE de la couverture est incluse ; chaque autre page de texte gravée est à +5 €. Remplissez seulement les faces souhaitées, les autres restent vierges." },
      { key: "cover", label: "Gravure — Couverture (texte inclus)", placeholder: "Prénom, mot court…", maxLength: 15 },
      { key: "page1", label: "Gravure — Page 1 (+5 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "page2", label: "Gravure — Page 2 (+5 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "page3", label: "Gravure — Page 3 (+5 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "backcover", label: "Gravure — Dos (+5 €)", placeholder: "15 caractères max", maxLength: 15, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "photo", type: "photo", label: "Photo à graver (+8 €)", optional: true, text: "Optionnel : ajoutez une photo gravée (+8 €). Choisissez une photo nette, bien éclairée et contrastée. La page qui reçoit la photo ne porte pas de texte." },
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
      { id: "med-argent-texte", title: "Argent", price: 38.90 },
      { id: "med-bicolore-texte", title: "Bicolore (Or & Argent)", price: 44.90 },
    ],
    descriptionHtml: `<p><strong>Un bijou élégant et intemporel à personnaliser.</strong></p>
<p>Gardez vos souvenirs les plus précieux près de votre cœur. Le médaillon s'ouvre comme un petit livre et révèle <strong>5 faces entièrement personnalisables</strong> à graver selon vos envies.</p>
<h3>Un médaillon, 5 faces</h3>
<ul>
<li><strong>Couverture</strong> — gravure de texte incluse</li>
<li><strong>Pages 1 à 3</strong> — gravure de texte à +5 € par page</li>
<li><strong>Dos</strong> — gravure de texte à +5 €</li>
</ul>
<p>Sur chaque face : un texte court, ou une <strong>photo gravée (+8 €)</strong> que vous placez sur la page de votre choix (cette page ne porte alors pas de texte).</p>
<h3>Spécifications</h3>
<ul>
<li><strong>Chaîne :</strong> 50 cm</li>
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
    engraveGourmette3d: true, // aperçu 3D : plaque gravée sur chaîne gourmette
    tagline: "Gourmette à maillons cubains, plaque gravée avec votre message.",
    personalizable: true,
    personalizationLabel: "Texte à graver + police souhaitée",
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086801196_rxih.jpg?v=1780366838",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8086800434_d5ag.jpg?v=1780366839",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/il_fullxfull.8134708393_5e02.jpg?v=1780366838",
    ],
    variants: [
      { id: "gourm-gravure", title: "Avec gravure", price: 36.90, stockId: "gourm" },
      { id: "gourm-sans", title: "Sans gravure", price: 30.90, stockId: "gourm" },
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
    engraveSilicone3d: true, // aperçu 3D : plaque (argentée/noire) gravée sur bracelet silicone
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
      { id: "sil-argent-sans", title: "Plaque argentée / Sans texte", price: 26.90, stockId: "sil-argent" },
      { id: "sil-argent-texte", title: "Plaque argentée / Avec texte", price: 32.90, stockId: "sil-argent" },
      { id: "sil-noire-sans", title: "Plaque noire / Sans texte", price: 26.90, stockId: "sil-noire" },
      { id: "sil-noire-texte", title: "Plaque noire / Avec texte", price: 32.90, stockId: "sil-noire" },
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
  // ----------------------------- MARIAGE -------------------------------------
  {
    slug: "numero-table-arches-bohemes",
    name: "Numéro de table Arches Bohèmes",
    weight: 250,
    pickup: true,
    letter: false,
    title: "Numéro de table mariage Arches Bohèmes – Bois & acrylique",
    subcategory: "tables",
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
      { id: "arches-lot", title: "Lot de 10+ (prix unitaire)", price: 16.9 },
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
<p><strong>Tarif dégressif :</strong> 18,90 € à l'unité — 16,90 € l'unité dès 10 numéros commandés.</p>`,
  },
  {
    slug: "numero-table-eucalyptus",
    name: "Numéro de table Eucalyptus",
    weight: 200,
    pickup: true,
    letter: false,
    title: "Numéro de table mariage en bois – Motif branche d'eucalyptus",
    subcategory: "tables",
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
      { id: "euca-lot", title: "Lot de 10+ (prix unitaire)", price: 12.9 },
    ],
    descriptionHtml: `<p>Une décoration de table à la fois naturelle, élégante et personnelle. Ce <strong>numéro de table en bois gravé</strong> est orné d'un délicat motif de branche d'eucalyptus.</p>
<p>Réalisé à la main dans notre atelier au laser de précision, il s'harmonise parfaitement avec une décoration champêtre, bohème ou végétale.</p>
<ul>
<li>✨ <strong>100% personnalisable</strong> : numéro ou nom de table selon votre plan de salle.</li>
<li>🎨 <strong>Couleur du motif personnalisable</strong> : doré par défaut, ou autre couleur au choix.</li>
<li>🌿 Motif branche d'eucalyptus, idéal mariages champêtres et bohèmes.</li>
<li>🪵 Fabrication artisanale française.</li>
</ul>
<p><strong>Tarif dégressif :</strong> 14,90 € à l'unité — 12,90 € l'unité dès 10 numéros commandés.</p>`,
  },
  {
    slug: "numero-table-feuillage",
    name: "Numéro de table Feuillage",
    weight: 200,
    pickup: true,
    letter: false,
    title: "Numéro de table mariage en bois découpé au laser – Motif feuillage",
    subcategory: "tables",
    category: "mariage",
    type: "Décoration de mariage",
    tagline: "Un panneau de bois découpé au laser, orné d'un feuillage gravé.",
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
      "/produits/numero_table_rectangulaire_feuillage_bois.png",
    ],
    variants: [
      { id: "feuillage-unite", title: "À l'unité (1-9)", price: 14.9 },
      { id: "feuillage-lot", title: "Lot de 10+ (prix unitaire)", price: 12.9 },
    ],
    descriptionHtml: `<p>Un <strong>numéro de table en bois découpé au laser</strong>, au panneau élégant orné d'un <strong>motif de feuillage gravé</strong>. Posé sur son socle, il habille vos tables avec douceur et raffinement.</p>
<p>Réalisé à la main dans notre atelier au laser de précision, il s'accorde aussi bien aux mariages champêtres qu'aux réceptions élégantes.</p>
<ul>
<li>✨ <strong>100% personnalisable</strong> : numéro ou nom de table selon votre plan de salle.</li>
<li>🎨 <strong>Couleur du chiffre au choix</strong> : doré, argenté ou noir.</li>
<li>🌿 Motif feuillage gravé, fin et élégant.</li>
<li>🪵 Socle inclus — pose stable. Fabrication artisanale française.</li>
</ul>
<p><strong>Tarif dégressif :</strong> 14,90 € à l'unité — 12,90 € l'unité dès 10 numéros commandés.</p>`,
  },
  {
    slug: "etiquette-serviette-initiales",
    name: "Étiquette de serviette Initiales",
    weight: 30,
    pickup: true,
    letter: true,
    title: "Étiquette de serviette fleur en bois gravée – Initiales des mariés",
    subcategory: "table-deco",
    category: "mariage",
    type: "Décoration de mariage",
    tagline: "Une fleur de bois gravée à vos initiales, nouée à la cordelette.",
    personalizable: true,
    personalizationLabel: "Initiales à graver + police",
    personalizationFields: [
      { key: "initiales", label: "Initiales à graver", placeholder: "Ex : O & E", maxLength: 12 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/etiquette_serviette_fleur_initiales_blanc.webp",
      "/produits/etiquette_serviette_fleur_initiales_bordeaux.jpeg",
      "/produits/etiquette_serviette_fleur_initiales_bleu.jpeg",
    ],
    variants: [
      { id: "etiquette-initiales", title: "À la pièce", price: 5.9 },
    ],
    descriptionHtml: `<p>Une <strong>étiquette de serviette en bois</strong> en forme de fleur, gravée aux <strong>initiales des mariés</strong> et nouée autour de la serviette avec sa cordelette naturelle.</p>
<p>Le détail délicat qui unifie toute votre table : chaque convive découvre vos initiales joliment gravées sur sa serviette.</p>
<ul>
<li>✨ <strong>Gravure personnalisée</strong> : vos initiales (ex. « O &amp; E »).</li>
<li>🌸 Forme fleur avec feuillage gravé, cordelette naturelle incluse.</li>
<li>🤍 S'accorde à toutes les couleurs de serviettes.</li>
<li>🪵 Bois clair découpé et gravé au laser — fabrication artisanale française.</li>
</ul>
<p>Commandez la quantité souhaitée selon votre nombre de convives.</p>`,
  },
  {
    slug: "numero-table-arche-geometrique",
    name: "Numéro de table Arche géométrique",
    weight: 200,
    pickup: true,
    letter: false,
    title: "Numéro de table mariage en bois – Arche ajourée & chiffre en relief 3D",
    subcategory: "tables",
    category: "mariage",
    type: "Décoration de mariage",
    tagline: "Une arche ajourée au chiffre en relief, avec l'année de votre mariage.",
    personalizable: true,
    personalizationLabel: "Numéro de table + année + police",
    personalizationFields: [
      { key: "numero", label: "Numéro ou nom de la table", placeholder: "Ex : 1, 2… ou « Mariés »", maxLength: 24 },
      { key: "annee", label: "Année à graver", placeholder: "Ex : 2026", maxLength: 8, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/numero_table_arche_geometrique_relief_bois.jpeg",
    ],
    variants: [
      { id: "arche-geo-unite", title: "À l'unité (1-9)", price: 14.9 },
      { id: "arche-geo-lot", title: "Lot de 10+ (prix unitaire)", price: 12.9 },
    ],
    descriptionHtml: `<p>Un <strong>numéro de table en bois découpé au laser</strong> en forme d'arche, bordé d'un élégant <strong>motif géométrique ajouré</strong>. Le chiffre, découpé dans un bois foncé, est <strong>fixé en relief</strong> pour un vrai effet 3D.</p>
<p>L'<strong>année de votre mariage</strong> est gravée sous le numéro — un souvenir à garder bien après le grand jour.</p>
<ul>
<li>✨ <strong>100% personnalisable</strong> : numéro ou nom de table + année.</li>
<li>🪵 Chiffre en <strong>relief 3D</strong> (bois foncé contrastant).</li>
<li>◇ Bordure géométrique ajourée, découpée au laser.</li>
<li>🪵 Socle inclus — pose stable. Fabrication artisanale française.</li>
</ul>
<p><strong>Tarif dégressif :</strong> 14,90 € à l'unité — 12,90 € l'unité dès 10 numéros commandés.</p>`,
  },
  {
    slug: "ronds-de-serviette-bois",
    name: "Ronds de serviette personnalisés",
    weight: 40,
    pickup: true,
    letter: true,
    title: "Ronds de serviette personnalisés en bois – Hexagone, cœur ou cercle",
    subcategory: "table-deco",
    category: "mariage",
    type: "Art de la table",
    tagline: "Un cadeau d'invité raffiné, gravé du prénom de chaque convive.",
    personalizable: true,
    personalizationLabel: "Prénoms / initiales / date à graver",
    personalizationFields: [
      { key: "forme", type: "select", label: "Forme", options: [
        { value: "Hexagone", label: "Hexagone" },
        { value: "Cercle", label: "Cercle" },
        { value: "Double cœur", label: "Double cœur" },
      ] },
      { key: "prenoms", type: "textarea", label: "Prénoms / initiales à graver (un par ligne)", placeholder: "Marie\nPaul\nSophie…", maxLength: 600 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "Tarif dégressif : 4,50 € à l'unité, 3,50 €/pièce dès 20, 2,90 €/pièce dès 50. Indiquez un prénom par ligne (autant que de pièces commandées)." },
    ],
    images: [
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/610876bb-4b83-4b09-a722-356af9af8088.webp?v=1776298326",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/a0452f63-4f2b-4f6b-833d-e9f8772be649.webp?v=1776298326",
      "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/Gemini_Generated_Image_nzbs5vnzbs5vnzbs.png?v=1776298347",
    ],
    variants: [
      { id: "rond-unite", title: "À l'unité", price: 4.50 },
      { id: "rond-lot20", title: "Lot de 20 (3,50 €/pièce)", price: 70.00 },
      { id: "rond-lot50", title: "Lot de 50 (2,90 €/pièce)", price: 145.00 },
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
    subcategory: "menus",
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
      { id: "menu-lot", title: "Lot de 10+ (prix unitaire)", price: 31.9 },
    ],
    descriptionHtml: `<p>Sublimez vos tables de réception avec ce <strong>menu de mariage en bois gravé entièrement personnalisé</strong>. Réalisé à la main au laser de précision, il associe la chaleur du bois clair à l'élégance d'un lettrage « Menu » en relief.</p>
<p>Forme arche double et socle en bois deux tons pour une présentation raffinée.</p>
<ul>
<li>✨ <strong>100% personnalisable</strong> : prénoms des mariés, entrées, plats et desserts.</li>
<li>🎨 <strong>Lettrage « Menu » personnalisable</strong> : doré par défaut, ou couleur au choix.</li>
<li>📏 Dimensions : environ 195 × 195 mm monté sur son socle.</li>
<li>🪵 Fabrication artisanale française.</li>
</ul>
<p><strong>Tarif dégressif :</strong> 34,90 € à l'unité — 31,90 € l'unité dès 10 menus commandés.</p>`,
  },

  // ----------------------------- CADEAUX & DÉCO ------------------------------
  {
    slug: "plaque-de-porte-enfant",
    name: "Plaque de porte enfant",
    noEngravePreview: true, // pas d'aperçu de gravure (lettres découpées, pas de gravure de texte)
    weight: 450,
    pickup: false,
    letter: false,
    title: "Plaque de porte personnalisée prénom & animaux – Chambre enfant",
    subcategory: "plaques",
    category: "deco",
    type: "Décoration chambre enfant",
    tagline: "Le prénom de votre enfant, entouré de ses animaux préférés.",
    personalizable: true,
    personalizationLabel: "Prénom + style d'écriture + animaux (4 max) + finition",
    personalizationFields: [
      { key: "prenom", label: "Prénom de l'enfant", placeholder: "Ex : Lina", maxLength: 20 },
      { key: "style", type: "lettering", label: "Style d'écriture (lettres découpées)", options: [
        { value: "Fleuri", label: "Fleuri", image: "/lettering/fleuri.jpeg" },
        { value: "Celtique", label: "Celtique", image: "/lettering/celtique.jpeg" },
        { value: "Art déco", label: "Art déco", image: "/lettering/art-deco.jpeg" },
        { value: "Élégant", label: "Élégant", image: "/lettering/elegant.jpeg" },
        { value: "Arrondi", label: "Arrondi", image: "/lettering/arrondi.jpeg" },
      ] },
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
    hidden: false, // visible
    title: "Clé USB personnalisée – Cadeau souvenir gravé sur mesure",
    subcategory: "cles-usb",
    category: "cadeaux",
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
    pickup: false, // envoi seul (retrait auto si lourd)
    letter: false,
    title: "Pyramide en cristal — gravure photo 3D personnalisée",
    subcategory: "cristal",
    crystal3d: true,
    category: "cristal",
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
    hidden: false, // visible
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
      { key: "texte", label: "Texte à graver", placeholder: "Prénom, date, message…", maxLength: 30, variantContains: "Avec" },
      { key: "police", type: "font", label: "Police de gravure", optional: true, variantContains: "Avec" },
    ],
    images: [
      "/produits/bracelet_cuir_tresse_a_graver_argente.jpg",
      "/produits/bracelet_cuir_tresse_a_graver_dore.jpg",
      "/produits/bracelet_cuir_tresse_a_graver_noir.jpg",
    ],
    // Stock suivi PAR COULEUR (stockId) ; le prix change selon Sans/Avec gravure.
    variants: [
      { id: "cuir-tresse-argente-sans", title: "Argenté / Sans texte", price: 22.90, stockId: "cuir-argent", image: "/produits/bracelet_cuir_tresse_a_graver_argente.jpg" },
      { id: "cuir-tresse-argente-texte", title: "Argenté / Avec texte", price: 28.90, stockId: "cuir-argent", image: "/produits/bracelet_cuir_tresse_a_graver_argente.jpg" },
      { id: "cuir-tresse-dore-sans", title: "Doré / Sans texte", price: 22.90, stockId: "cuir-dore", image: "/produits/bracelet_cuir_tresse_a_graver_dore.jpg" },
      { id: "cuir-tresse-dore-texte", title: "Doré / Avec texte", price: 28.90, stockId: "cuir-dore", image: "/produits/bracelet_cuir_tresse_a_graver_dore.jpg" },
      { id: "cuir-tresse-noir-sans", title: "Noir / Sans texte", price: 22.90, stockId: "cuir-noire", image: "/produits/bracelet_cuir_tresse_a_graver_noir.jpg" },
      { id: "cuir-tresse-noir-texte", title: "Noir / Avec texte", price: 28.90, stockId: "cuir-noire", image: "/produits/bracelet_cuir_tresse_a_graver_noir.jpg" },
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
    subcategory: "porte-cles",
    category: "cadeaux",
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
    weight: 600, pickup: false, letter: false,
    title: "Trophée en cristal — gravure photo 3D personnalisée",
    subcategory: "cristal",
    crystal3d: true,
    category: "cristal", type: "Cristal photo 3D",
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
  {
    slug: "cristal-photo-3d-vertical",
    name: "Cristal Photo 3D — Vertical",
    weight: 900, pickup: false, letter: false,
    title: "Cristal photo 3D vertical (portrait) — gravure personnalisée en France",
    subcategory: "cristal",
    crystal3d: true,
    category: "cristal", type: "Cristal photo 3D",
    tagline: "Votre photo gravée en 3D au cœur du cristal — format portrait.",
    featured: true,
    personalizable: true, personalizationLabel: "Photo à graver (+ texte optionnel)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Votre photo à graver en 3D", text: "Choisissez une photo nette, bien éclairée, avec les visages bien visibles. Plus il y a de personnes, plus il faut un grand cristal pour que chaque visage reste net." },
      { key: "texte", label: "Texte à graver (optionnel)", placeholder: "Prénom, date, petit mot…", maxLength: 40, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: [
      "/produits/cristal-bloc-v-creme.jpg",
      "/produits/cristal-v-enfant-chat.jpg",
      "/produits/cristal-v-couple.jpg",
      "/produits/cristal-v-femme.jpg",
      "/produits/cristal-v-enfant-chien.jpg",
      "/produits/cristal-v-jeunes.jpg",
      "/produits/cristal-v-guide.png",
    ],
    variants: [
      { id: "cristal-v-petit", title: "Petit — 5×5×8 cm · Couple (1-2)", price: 39.9 },
      { id: "cristal-v-moyen", title: "Moyen — 5×6×10 cm · 2-3 personnes", price: 59.9 },
      { id: "cristal-v-grand", title: "Grand — 6×8×12 cm · Famille (2-4)", price: 99.9 },
      { id: "cristal-v-xl", title: "XL — 6×10×15 cm · Grand groupe (5-6)", price: 149.9 },
    ],
    descriptionHtml: `<p><strong>Votre photo sculptée en 3D au cœur du cristal.</strong> Un cadeau qui capte la lumière — et l'émotion.</p>
<p>Votre image est gravée en trois dimensions à l'intérieur d'un <strong>cristal optique K9</strong> de haute pureté, au laser de précision, dans notre atelier <strong>en France</strong>. Les visages semblent flotter dans le cristal.</p>
<h3>Idéal pour</h3>
<p>Un couple, une naissance, une famille, un mariage, un hommage. Cristal optique K9, gravure photo 3D interne au laser, gravé en France.</p>`,
  },
  {
    slug: "cristal-photo-3d-horizontal",
    name: "Cristal Photo 3D — Horizontal",
    weight: 900, pickup: false, letter: false,
    title: "Cristal photo 3D horizontal (paysage) — gravure personnalisée en France",
    subcategory: "cristal",
    crystal3d: true,
    category: "cristal", type: "Cristal photo 3D",
    tagline: "Votre photo gravée en 3D au cœur du cristal — format paysage.",
    featured: true,
    personalizable: true, personalizationLabel: "Photo à graver (+ texte optionnel)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Votre photo à graver en 3D", text: "Choisissez une photo nette, bien éclairée, avec les visages bien visibles. Plus il y a de personnes, plus il faut un grand cristal pour que chaque visage reste net." },
      { key: "texte", label: "Texte à graver (optionnel)", placeholder: "Prénom, date, petit mot…", maxLength: 40, optional: true },
      { key: "police", type: "font", label: "Police (si texte)", optional: true },
    ],
    images: [
      "/produits/cristal-bloc-h-creme.jpg",
      "/produits/cristal-h-famille.jpg",
      "/produits/cristal-h-couple.jpg",
      "/produits/cristal-h-amis.jpg",
      "/produits/cristal-v-bebe.jpg",
      "/produits/cristal-h-guide.png",
    ],
    variants: [
      { id: "cristal-h-petit", title: "Petit — 8×5×5 cm · Couple (1-2)", price: 39.9 },
      { id: "cristal-h-moyen", title: "Moyen — 10×6×5 cm · 2-3 personnes", price: 59.9 },
      { id: "cristal-h-grand", title: "Grand — 12×8×6 cm · Famille (2-4)", price: 99.9 },
      { id: "cristal-h-xl", title: "XL — 15×10×6 cm · Grand groupe (5-6)", price: 149.9 },
    ],
    descriptionHtml: `<p><strong>Votre photo sculptée en 3D au cœur du cristal.</strong> Format paysage, idéal pour un couple, un groupe ou une photo large.</p>
<p>Votre image est gravée en trois dimensions à l'intérieur d'un <strong>cristal optique K9</strong> de haute pureté, au laser de précision, dans notre atelier <strong>en France</strong>. Les visages semblent flotter dans le cristal.</p>
<h3>Idéal pour</h3>
<p>Une famille, un groupe d'amis, un couple, un mariage, un hommage. Cristal optique K9, gravure photo 3D interne au laser, gravé en France.</p>`,
  },

  // ===== Bracelets =====
  {
    slug: "bracelet-homme-chaine-acier",
    name: "Bracelet Homme Chaîne Acier",
    weight: 120, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme chaîne acier à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    engraveGourmette3d: true, // aperçu 3D : plaque gravée sur chaîne acier
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
      { id: "chaine-acier-argente", title: "Argenté", price: 38.90 },
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
    variants: [{ id: "bracelet-femme-acier-dore", title: "Doré", price: 27.90 }],
    descriptionHtml: `<p>Bracelet femme délicat en <strong>acier inoxydable doré</strong>, à personnaliser par gravure.</p>
<ul><li>Acier inoxydable, ne ternit pas</li><li>Gravure fine au laser</li></ul>`,
  },
  {
    slug: "bracelet-empreinte-pied-bebe",
    badge: "Naissance",
    name: "Bracelet Empreinte Pied de Bébé",
    weight: 70, pickup: false, letter: true, subcategory: "bebe",
    title: "Bracelet empreinte pied de bébé à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Le souvenir d'une naissance, gravé à porter sur soi.",
    personalizable: true, personalizationLabel: "Prénom & date + police",
    personalizationFields: [
      { key: "texte", label: "Prénom et/ou date de naissance", placeholder: "Ex : Lina — 12.06.2024", maxLength: 20 },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_argente.jpg",
      "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_dore.jpg",
    ],
    variants: [
      { id: "empreinte-bebe-argente", title: "Argenté", price: 19.90, image: "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_argente.jpg" },
      { id: "empreinte-bebe-dore", title: "Doré", price: 19.90, image: "/produits/bracelet_empreinte_de_pied_de_bebe_a_graver_dore.jpg" },
    ],
    descriptionHtml: `<p>Un bracelet tendre orné d'une <strong>empreinte de pied de bébé</strong>, personnalisé avec le prénom et la date de naissance. Cadeau de naissance idéal.</p>
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
    variants: [{ id: "bracelet-coeur-dore", title: "Doré", price: 27.90 }],
    descriptionHtml: `<p>Bracelet femme avec breloque <strong>cœur</strong> gravable, en acier inoxydable doré. Romantique et délicat.</p>`,
  },
  {
    slug: "bracelet-femme-papillon",
    name: "Bracelet Femme Papillon ajouré",
    weight: 80, pickup: false, letter: true, subcategory: "femme",
    title: "Bracelet femme papillon ajouré à graver",
    category: "bijoux", type: "Bracelet personnalisé",
    engraveBar3d: true, // aperçu 3D : barre fine gravée sur chaîne délicate (argent/or/noir/or rose)
    decor3d: "butterfly", // petit papillon sur la barre
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
      { id: "papillon-argente", title: "Argenté", price: 27.90, image: "/produits/bracelet_papillon_ajoure_a_graver_argente.jpg" },
      { id: "papillon-dore", title: "Doré", price: 27.90, image: "/produits/bracelet_papillon_ajoure_a_graver_dore.jpg" },
      { id: "papillon-noir", title: "Noir", price: 24.90, image: "/produits/bracelet_papillon_ajoure_a_graver_noir.jpg" },
      { id: "papillon-or-rose", title: "Or Rose", price: 29.90, image: "/produits/bracelet_papillon_ajoure_a_graver_or_rose.jpg" },
    ],
    descriptionHtml: `<p>Bracelet femme orné d'un <strong>papillon ajouré</strong> en acier inoxydable, à personnaliser par gravure. Plusieurs finitions.</p>`,
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
    variants: [{ id: "couple-coeur-or-rose", title: "Or Rose", price: 38.90 }],
    descriptionHtml: `<p>Un <strong>lot de 2 colliers</strong> formant un cœur, à graver chacun. Le cadeau parfait pour les amoureux.</p>`,
  },
  {
    slug: "collier-plaque-acier",
    name: "Collier Plaque Acier",
    weight: 90, pickup: false, letter: true, subcategory: "homme",
    title: "Collier plaque acier à graver",
    category: "bijoux", type: "Collier personnalisé",
    engravePlate3d: true, // aperçu 3D : plaque recto/verso avec texte + photo
    tagline: "Une plaque d'acier épurée, gravée avec votre texte ou votre photo.",
    personalizable: true, personalizationLabel: "Texte (recto / verso) + photo + police",
    // Recto inclus ; gravure du verso +5 € ; photo gravée +8 €.
    engravingPricing: { perExtraPage: 5, includedKey: "recto", photoKey: "photo", photoSurcharge: 8 },
    personalizationFields: [
      { key: "note", type: "note", text: "Plaque gravable des deux côtés. La gravure du RECTO est incluse ; la gravure du VERSO est à +5 €. Vous pouvez aussi faire graver une PHOTO (+8 €). Remplissez seulement ce que vous souhaitez." },
      { key: "recto", label: "Texte à graver — recto (inclus)", placeholder: "Prénom, date, message…", maxLength: 30, optional: true },
      { key: "verso", label: "Texte à graver — verso (+5 €)", placeholder: "Visible au dos de la plaque", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "photo", type: "photo", label: "Photo à graver (+8 €)", optional: true, text: "Optionnel : ajoutez une photo gravée (+8 €). Choisissez une photo nette, bien éclairée et contrastée pour un beau rendu." },
      { key: "photoFace", type: "select", label: "Photo gravée sur quelle face ? (à choisir)", requiresField: "photo",
        options: [{ value: "recto", label: "Recto (devant)" }, { value: "verso", label: "Verso (derrière)" }] },
      { key: "textPos", type: "select", label: "Texte placé par rapport à la photo", requiresField: "photo", optional: true,
        options: [{ value: "above", label: "Au-dessus de la photo" }, { value: "below", label: "En dessous de la photo" }] },
    ],
    images: [
      "/produits/collier_plaque_a_graver_acier_noir.jpg",
      "/produits/collier_plaque_a_graver_argente.jpg",
      "/produits/collier_plaque_a_graver_argente_et_noir.jpg",
      "/produits/collier_plaque_a_graver_dore.jpg",
      "/produits/collier_plaque_a_graver_noir.jpg",
    ],
    variants: [
      { id: "plaque-acier-noir", title: "Acier Noir", price: 32.90, image: "/produits/collier_plaque_a_graver_acier_noir.jpg" },
      { id: "plaque-argente", title: "Argenté", price: 29.90, image: "/produits/collier_plaque_a_graver_argente.jpg" },
      { id: "plaque-argente-noir", title: "Argenté et Noir", price: 33.90, image: "/produits/collier_plaque_a_graver_argente_et_noir.jpg" },
      { id: "plaque-dore", title: "Doré", price: 33.90, image: "/produits/collier_plaque_a_graver_dore.jpg" },
      { id: "plaque-noir", title: "Noir", price: 30.90, image: "/produits/collier_plaque_a_graver_noir.jpg" },
    ],
    descriptionHtml: `<p>Collier à <strong>plaque rectangulaire</strong> en acier inoxydable, surface lisse gravable des deux côtés. Style épuré et contemporain.</p>
<p>Personnalisez le <strong>recto</strong> (inclus), ajoutez une gravure au <strong>verso</strong> (+5 €) et même une <strong>photo gravée</strong> (+8 €).</p>`,
  },
  {
    slug: "collier-medaillon-livre",
    badge: "Nouveau",
    name: "Collier Médaillon Livre",
    weight: 120, pickup: false, letter: true, subcategory: "femme",
    title: "Collier médaillon livre à graver",
    category: "bijoux", type: "Collier personnalisé",
    engraveBook3d: true, // aperçu 3D : médaillon livre qui s'ouvre (couverture + 3 pages)
    // Couverture incluse. Texte sur une page intérieure : +5 €. Motifs : le 1er
    // est offert, chaque motif suivant : +3 €.
    engravingPricing: {
      textKeys: ["page1", "page2", "page3"],
      textExtra: 5,
      motifKeys: ["motif1", "motif2", "motif3", "motif4"],
      motifExtra: 3,
    },
    tagline: "Un médaillon qui s'ouvre comme un petit livre, à graver.",
    personalizable: true, personalizationLabel: "Couverture + 3 pages : texte, motif et police",
    personalizationFields: [
      { key: "note", type: "note", text: "La couverture est incluse. Une page intérieure avec texte : +5 €. Côté motifs : le 1er motif est OFFERT, chaque motif supplémentaire +3 €. Pour chaque face, vous pouvez ajouter un motif et choisir où le placer (haut/bas, gauche/droite)." },
      { key: "couverture", label: "Gravure — couverture (incluse)", maxLength: 30, optional: true },
      { key: "motif1", type: "motif", label: "Motif — couverture", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos1", type: "select", label: "Couverture — position du motif", optional: true, requiresField: "motif1",
        options: [{ value: "hg", label: "Haut gauche" }, { value: "hd", label: "Haut droite" }, { value: "bg", label: "Bas gauche" }, { value: "bd", label: "Bas droite" }, { value: "centre", label: "Centré (en haut)" }] },
      { key: "page1", label: "Gravure — page 1 (+5 €)", maxLength: 30, optional: true },
      { key: "motif2", type: "motif", label: "Motif — page 1", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos2", type: "select", label: "Page 1 — position du motif", optional: true, requiresField: "motif2",
        options: [{ value: "hg", label: "Haut gauche" }, { value: "hd", label: "Haut droite" }, { value: "bg", label: "Bas gauche" }, { value: "bd", label: "Bas droite" }, { value: "centre", label: "Centré (en haut)" }] },
      { key: "page2", label: "Gravure — page 2 (+5 €)", maxLength: 30, optional: true },
      { key: "motif3", type: "motif", label: "Motif — page 2", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos3", type: "select", label: "Page 2 — position du motif", optional: true, requiresField: "motif3",
        options: [{ value: "hg", label: "Haut gauche" }, { value: "hd", label: "Haut droite" }, { value: "bg", label: "Bas gauche" }, { value: "bd", label: "Bas droite" }, { value: "centre", label: "Centré (en haut)" }] },
      { key: "page3", label: "Gravure — page 3 (+5 €)", maxLength: 30, optional: true },
      { key: "motif4", type: "motif", label: "Motif — page 3", optional: true, options: MOTIF_OPTIONS },
      { key: "motifPos4", type: "select", label: "Page 3 — position du motif", optional: true, requiresField: "motif4",
        options: [{ value: "hg", label: "Haut gauche" }, { value: "hd", label: "Haut droite" }, { value: "bg", label: "Bas gauche" }, { value: "bd", label: "Bas droite" }, { value: "centre", label: "Centré (en haut)" }] },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    images: [
      "/produits/collier_medaillon_modele_livre_a_graver_argente.jpg",
      "/produits/collier_medaillon_modele_livre_a_graver_dore.jpg",
      "/produits/collier_medaillon_modele_livre_a_graver_dore_et_argente.jpg",
    ],
    variants: [
      { id: "medaillon-livre-argente", title: "Argenté", price: 40.90, image: "/produits/collier_medaillon_modele_livre_a_graver_argente.jpg" },
      { id: "medaillon-livre-dore", title: "Doré", price: 40.90, image: "/produits/collier_medaillon_modele_livre_a_graver_dore.jpg" },
      { id: "medaillon-livre-bicolore", title: "Doré et Argenté", price: 41.90, image: "/produits/collier_medaillon_modele_livre_a_graver_dore_et_argente.jpg" },
    ],
    descriptionHtml: `<p>Médaillon en forme de <strong>livre</strong> qui s'ouvre. Gravable sur la <strong>couverture</strong> et sur <strong>3 pages à l'intérieur</strong>. En acier inoxydable.</p>`,
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
      { id: "puzzle-argente", title: "Argenté", price: 19.90, image: "/produits/collier_pendentif_couple_geometric_puzzle_a_graver_argente.jpg" },
      { id: "puzzle-or-rose", title: "Or Rose", price: 22.90, image: "/produits/collier_pendentif_couple_geometric_puzzle_a_graver_or_rose.jpg" },
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
    // Gravure des 4 faces incluse. Motifs : le 1er offert, chaque motif suivant +3 €.
    engravingPricing: { motifKeys: ["motif1", "motif2", "motif3", "motif4"], motifExtra: 3 },
    tagline: "Une barre verticale gravable sur ses 4 faces : prénoms, dates, coordonnées…",
    personalizable: true, personalizationLabel: "Gravure jusqu'à 4 faces + police",
    personalizationFields: [
      { key: "note", type: "note", text: "Gravure des 4 faces (texte) incluse. Côté motifs : le 1er motif est OFFERT, chaque motif supplémentaire +3 €." },
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
      { id: "geo-argente", title: "Argenté", price: 26.90, image: "/produits/collier_pendentif_geometrique_a_graver_agente.jpg" },
      { id: "geo-arc-en-ciel", title: "Arc en Ciel", price: 30.90, image: "/produits/collier_pendentif_geometrique_a_graver_arc_en_ciel.jpg" },
      { id: "geo-dore", title: "Doré", price: 29.90, image: "/produits/collier_pendentif_geometrique_a_graver_dore.jpg" },
      { id: "geo-noir", title: "Noir", price: 29.90, image: "/produits/collier_pendentif_geometrique_a_graver_noir.jpg" },
      { id: "geo-or-rose", title: "Or Rose", price: 29.90, image: "/produits/collier_pendentif_geometrique_a_graver_or_rose.jpg" },
    ],
    descriptionHtml: `<p>Collier femme au <strong>pendentif géométrique</strong> moderne, gravable au laser. Plusieurs finitions, dont arc-en-ciel.</p>`,
  },

  // ===== Clés USB =====
  {
    slug: "cle-usb-cristal-3d",
    name: "Clé USB Cristal — Gravure 3D",
    weight: 70, pickup: false, letter: true,
    title: "Clé USB cristal avec gravure photo 3D",
    subcategory: "cles-usb",
    category: "cadeaux", type: "Clé USB personnalisée",
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
    subcategory: "cles-usb",
    category: "cadeaux", type: "Clé USB personnalisée",
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
    subcategory: "porte-cles",
    crystal3d: true,
    crystalShape: "coeur",
    category: "cadeaux", type: "Porte-clés cristal 3D",
    tagline: "Un porte-clés cœur en cristal lumineux, votre photo gravée en 3D.",
    personalizable: true, personalizationLabel: "Photo à graver (+ texte)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", text: "Photo nette et contrastée pour un beau rendu." },
    ],
    images: [
      "/produits/cristal-pcles-coeur-creme.jpg",
      "/produits/porte-cles-coeur-demo.jpg",
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
    subcategory: "porte-cles",
    crystal3d: true,
    category: "cadeaux", type: "Porte-clés cristal 3D",
    tagline: "Un porte-clés rectangle en cristal lumineux, votre photo gravée en 3D.",
    personalizable: true, personalizationLabel: "Photo à graver (+ texte)",
    personalizationFields: [
      { key: "photo", type: "photo", label: "Photo à graver en 3D", text: "Photo nette et contrastée pour un beau rendu." },
    ],
    images: [
      "/produits/cristal-pcles-rect-creme.jpg",
      "/produits/porte-cles-rect-creme-2.jpg",
      "/produits/porte-cles-rect-demo-chien.jpg",
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
    subcategory: "medaillons",
    category: "cadeaux", type: "Pièce à graver",
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
  // ----------------------------- CADEAUX -------------------------------------
  {
    slug: "verre-a-whisky-grave",
    badge: "Nouveau",
    lockImages: true, // galerie pilotée par le code (ignore l'ancienne liste admin)
    lockHidden: true, // publication pilotée par le code (ignore un ancien masquage admin)
    cardImage: "/produits/verre_a_whisky_exemple_face.jpg", // vignette : verre gravé PHOTO (montre l'usage)
    name: "Verre à whisky gravé",
    weight: 600, // verre + emballage protégé (fragile)
    pickup: false, // verres : livraison seule (pas de retrait en main propre)
    letter: false, // colis : lourd et fragile
    hidden: false, // PUBLIÉ (verre à whisky gravé — photo / texte / logo)
    preview: { top: "44%", bottom: "30%", left: "26%", right: "26%" },
    previewPhoto: { top: "30%", bottom: "20%", left: "15%", right: "15%" },
    // Éditeur interactif logo (glisser + redimensionner + mesure cm).
    // box = zone de placement en fraction du cadre carré ; widthMm = largeur réelle
    // gravable correspondant à maxWidthFrac. À RECALIBRER avec le vrai verre + photo.
    engrave: {
      box: { top: 0.15, left: 0.20, width: 0.60, height: 0.62 },
      widthMm: 65,
      heightMm: 65,
      maxWidthFrac: 0.50,
      minWidthFrac: 0.10,
      maxHeightFrac: 0.50,
      minHeightFrac: 0.10,
      diameterMm: 79,
      glassHeightMm: 95,
    },
    // Gravure au fond du verre : vue de dessus, zone ronde (la base).
    fondImage: "/produits/verre_a_whisky_fond_clair.jpg",
    engraveFond: {
      box: { top: 0.30, left: 0.30, width: 0.40, height: 0.40 },
      widthMm: 50,
      heightMm: 50,
      maxWidthFrac: 0.40,
      minWidthFrac: 0.08,
      maxHeightFrac: 0.40,
      minHeightFrac: 0.08,
      round: true,
    },
    personalizationFields: [
      { key: "emplacement", type: "select", asChecks: true, label: "Emplacement de la gravure", default: "face", options: [
        { value: "face", label: "Sur la face avant" },
        { value: "fond", label: "Au fond du verre (vu à travers le verre)" },
        { value: "deux", label: "Les deux : face + fond (+7 €)" },
      ] },
      { key: "photo", type: "photo", label: "Envoyez votre logo / photo (facultatif)", optional: true, text: "Une fois la photo ajoutée, glissez-la sur le verre et réglez sa taille avec le curseur (la dimension en cm s'affiche)." },
      { key: "texte", label: "Ajouter un texte sous la photo (+3 €)", placeholder: "Prénom, message…", maxLength: 30, optional: true },
      { key: "texte2", label: "Date (sous la photo)", placeholder: "Ex : 12.06.2024", maxLength: 30, optional: true },
      { key: "decor", type: "select", label: "Décor autour du texte ?", optional: true, options: [
        { value: "", label: "Aucun" },
        { value: "★", label: "Étoiles  ★ texte ★" },
        { value: "♥", label: "Cœurs  ♥ texte ♥" },
        { value: "✿", label: "Fleurs  ✿ texte ✿" },
        { value: "◆", label: "Losanges  ◆ texte ◆" },
        { value: "•", label: "Points  • texte •" },
      ] },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note-deux", type: "note", showIfEmplacement: "deux", text: "Vous avez choisi de graver les DEUX côtés. Ci-dessus, réglez la gravure de la FACE. Ci-dessous, ajoutez la photo/le texte pour le FOND du verre (gravé centré au fond)." },
      { key: "photoFond", type: "photo", label: "Photo pour le FOND du verre", optional: true, showIfEmplacement: "deux", text: "2e gravure : cette photo sera gravée au fond du verre (centrée)." },
      { key: "texteFond", label: "Texte pour le fond (facultatif)", placeholder: "Prénom, message…", maxLength: 30, optional: true, showIfEmplacement: "deux" },
      { key: "note-photo", type: "note", image: "/produits/guide-photo-gravure.png", imageAlt: "Exemples de bonnes et mauvaises photos pour la gravure", text: "Réussir sa gravure photo : choisissez une image nette et bien éclairée (lumière du jour idéale), avec le ou les visages bien visibles, et un peu d'espace autour du sujet. Une à plusieurs personnes possibles ; pour un groupe, préférez une photo où chaque visage reste net et bien distinct. Évitez les photos sombres, floues, à contre-jour ou trop serrées. Votre photo est transformée en gravure monochrome façon dessin, puis retravaillée à la main par notre atelier avant la gravure laser. L'aperçu en ligne est indicatif : le rendu final est optimisé par l'atelier." },
    ],
    engravingPricing: { flatExtras: [{ key: "texte", amount: 3 }, { key: "emplacement", value: "deux", amount: 7 }] }, // texte +3 € · gravure face+fond +7 €
    title: "Verre à whisky gravé personnalisé — photo, prénom, date ou logo",
    category: "verres",
    subcategory: "whisky",
    type: "Verre gravé personnalisé",
    tagline: "Un verre à whisky gravé à votre message : prénom, date, initiales ou logo.",
    personalizable: true,
    personalizationLabel: "Texte à graver (+ police, dessin ou logo en option)",
    images: [
      "/produits/verre_a_whisky_grave_ambiance.jpg",
      "/produits/verre_a_whisky_exemple_face.jpg",
      "/produits/verre_a_whisky_exemple_fond.jpg",
      "/produits/verre_a_whisky_grave_vide.jpg",
      "/produits/verre_a_whisky_fond_clair.jpg",
    ],
    engraveImage: "/produits/verre_a_whisky_grave_vide.jpg",
    variants: [
      { id: "verre-whisky-grave", title: "Verre à whisky gravé", price: 26.90 },
    ],
    descriptionHtml: `<p><strong>Le verre à whisky personnalisé, gravé à votre message.</strong> Prénom, date, initiales, citation ou logo : chaque verre est gravé sur mesure pour devenir un cadeau unique et raffiné.</p>
<p>Gravure réalisée au laser sur un verre épais à base lourde, pour un rendu net et durable qui ne s'efface pas au lavage. Idéal pour un anniversaire, la Fête des Pères, un cadeau d'entreprise, un témoin de mariage, ou simplement pour se faire plaisir.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Verre :</strong> verre à whisky, base épaisse, contenance d'environ 300 ml</li>
<li><strong>Gravure :</strong> laser, sur une face — texte et/ou dessin / logo</li>
<li><strong>Personnalisation :</strong> texte au choix, 8 polices, dessin via l'assistant ou votre propre image</li>
<li><strong>Hauteur :</strong> environ 9 cm</li>
</ul>
<h3>Points forts</h3>
<ul>
<li>Gravure permanente, qui résiste au lave-vaisselle</li>
<li>Aperçu en direct de votre texte sur le verre avant de commander</li>
<li>Emballage protégé pour un transport en toute sécurité</li>
<li>Une idée cadeau personnalisée, pour homme comme pour femme</li>
</ul>`,
  },
  {
    // PAGE MODÈLE — propulsée par le moteur partagé (lib/modeles.js, template "peres").
    slug: "verre-a-whisky-fete-des-peres",
    badge: "Nouveau",
    name: "Verre à whisky — Fête des pères",
    cardImage: "/produits/verre_a_whisky_card.jpg", // vignette : verre GRAVÉ (montre la personnalisation)
    weight: 600,
    pickup: false,
    letter: false,
    hidden: false, // PUBLIÉ (Fête des pères)
    preview: { top: "44%", bottom: "30%", left: "26%", right: "26%" },
    engrave: {
      box: { top: 0.15, left: 0.20, width: 0.60, height: 0.62 },
      widthMm: 65, heightMm: 65,
      maxWidthFrac: 0.50, minWidthFrac: 0.10,
      maxHeightFrac: 0.50, minHeightFrac: 0.10,
      diameterMm: 79, glassHeightMm: 95,
    },
    fondImage: "/produits/verre_a_whisky_fond_clair.jpg",
    engraveFond: {
      box: { top: 0.30, left: 0.30, width: 0.40, height: 0.40 },
      widthMm: 50, heightMm: 50,
      maxWidthFrac: 0.40, minWidthFrac: 0.08,
      maxHeightFrac: 0.40, minHeightFrac: 0.08,
      round: true,
    },
    personalizationFields: [
      { key: "modele", type: "modele", template: "peres", optional: true, label: "Personnalisez votre gravure", text: "Modifiez chaque ligne et choisissez un motif, OU choisissez simplement un visuel prêt à graver (sans rien remplir). L'aperçu se met à jour sur le verre ; vous pouvez le déplacer et le redimensionner. Aperçu indicatif — la gravure finale est optimisée par notre atelier." },
      { key: "emplacement", type: "select", asChecks: true, label: "Emplacement de la gravure", optional: true, default: "face", options: [
        { value: "face", label: "Sur la face avant" },
        { value: "fond", label: "Au fond du verre (vu à travers le verre)" },
        { value: "deux", label: "Les deux : face + fond (+7 €)" },
      ] },
      { key: "note-fond-fp", type: "note", showIfEmplacement: "deux", text: "Vous gravez les DEUX côtés. Au-dessus : la face (le modèle). Ci-dessous : choisissez ce qui sera gravé AU FOND du verre — un texte OU un dessin." },
      { key: "fondType", type: "select", label: "Au fond du verre : que graver ?", optional: true, showIfEmplacement: "deux", options: [
        { value: "texte", label: "Un texte" },
        { value: "dessin", label: "Un dessin (motif)" },
      ] },
      { key: "texteFond", label: "Texte du fond", placeholder: "Prénom, message…", maxLength: 30, optional: true, showIfEmplacement: "deux", showIfField: "fondType", showIfValue: "texte" },
      { key: "motifFond", type: "motifniv", label: "Dessin du fond", optional: true, showIfEmplacement: "deux", showIfField: "fondType", showIfValue: "dessin" },
    ],
    engravingPricing: { flatExtras: [{ key: "emplacement", value: "deux", amount: 7 }], modeleSubExtra: { key: "modele", amount: 3 } },
    title: "Verre à whisky gravé Fête des pères — cadeau papa, papy personnalisé",
    category: "verres",
    subcategory: "whisky",
    type: "Verre gravé Fête des pères",
    tagline: "Le verre à whisky personnalisé pour la Fête des pères : élu papa / papy de l'année.",
    personalizable: true,
    personalizationLabel: "Gravure Fête des pères personnalisable (textes + motif)",
    images: [
      "/produits/verre_a_whisky_grave_vide.jpg",
      "/produits/verre_whisky_papa_monde_banniere.jpg",
      "/produits/verre_whisky_papa_monde_moustache.jpg",
      "/produits/verre_a_whisky_grave_ambiance.jpg",
      "/produits/verre_a_whisky_fond_clair.jpg",
    ],
    engraveImage: "/produits/verre_a_whisky_grave_vide.jpg",
    variants: [
      { id: "verre-whisky-fete-des-peres", title: "Verre à whisky gravé", price: 22.90 },
    ],
    descriptionHtml: `<p><strong>Le cadeau Fête des pères qui fait mouche.</strong> Un verre à whisky gravé « élu PAPA de l'année » (ou PAPY, TONTON, PARRAIN…), entièrement personnalisable.</p>
<p>Choisissez vos textes, la police de chaque ligne et un motif : l'aperçu s'affiche en direct sur le verre. Gravure laser permanente, qui résiste au lave-vaisselle.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Verre :</strong> verre à whisky, base épaisse, contenance d'environ 300 ml</li>
<li><strong>Gravure :</strong> laser, sur la face avant ou au fond du verre</li>
<li><strong>Personnalisation :</strong> 3 lignes de texte + motif au choix</li>
<li><strong>Hauteur :</strong> environ 9 cm</li>
</ul>`,
  },
  {
    // PAGE TEST (non publiée) — couverts enfants personnalisés (prénom + un animal par couvert).
    // Visible uniquement via ?apercu=niv2026.
    slug: "couverts-enfants-personnalises",
    badge: "Nouveau",
    name: "Couverts enfants personnalisés",
    weight: 200, // jeu de 4 pièces + emballage
    pickup: false,
    letter: false, // colis (rigide)
    freeShipping: true, // livraison offerte (incluse dans le prix)
    noCustomCta: true, // pas le bloc "projet sur mesure / téléphone" (perso via le configurateur)
    hidden: false, // PUBLIÉ
    subcategory: "couverts",
    category: "deco",
    type: "Couverts enfants gravés",
    tagline: "Le jeu de 4 couverts enfants en inox, personnalisés avec le prénom et un animal au choix sur chaque pièce.",
    personalizable: true,
    personalizationLabel: "Prénom + un animal par couvert à graver",
    personalizationFields: [
      { key: "prenom", label: "Prénom à graver", placeholder: "Ex : Ishaan", maxLength: 12 },
      { key: "police", type: "font", label: "Police du prénom", optional: true },
      { key: "couverts", type: "couverts", label: "Choisissez un animal pour chaque couvert",
        base: "/produits/couverts_enfants_4_face.jpg",
        zoomImage: "/produits/couverts_enfants_zoom.jpg",
        zoomAspect: "1076 / 565",
        pieces: [
          { key: "couteau", label: "Couteau",
            zone: { cx: 0.207, nameCy: 0.70, animalCy: 0.82, animalH: 0.05, nameSize: 0.03 },
            zoomZone: { cx: 0.144, nameCy: 0.45, animalCy: 0.80, animalH: 0.16, nameSize: 0.03 } },
          { key: "fourchette", label: "Fourchette",
            zone: { cx: 0.40, nameCy: 0.70, animalCy: 0.82, animalH: 0.05, nameSize: 0.03 },
            zoomZone: { cx: 0.366, nameCy: 0.45, animalCy: 0.80, animalH: 0.16, nameSize: 0.03 } },
          { key: "grande", label: "Grande cuillère",
            zone: { cx: 0.62, nameCy: 0.70, animalCy: 0.82, animalH: 0.05, nameSize: 0.03 },
            zoomZone: { cx: 0.63, nameCy: 0.45, animalCy: 0.80, animalH: 0.16, nameSize: 0.03 } },
          { key: "petite", label: "Petite cuillère",
            zone: { cx: 0.82, nameCy: 0.70, animalCy: 0.82, animalH: 0.05, nameSize: 0.03 },
            zoomZone: { cx: 0.872, nameCy: 0.45, animalCy: 0.80, animalH: 0.16, nameSize: 0.03 } },
        ],
        themes: [
          { key: "savane", label: "Savane", animals: [
            { key: "lion", label: "Lion", img: "/animaux/savane/lion.png" },
            { key: "elephant", label: "Éléphant", img: "/animaux/savane/elephant.png" },
            { key: "girafe", label: "Girafe", img: "/animaux/savane/girafe.png" },
            { key: "zebre", label: "Zèbre", img: "/animaux/savane/zebre.png" },
            { key: "rhinoceros", label: "Rhinocéros", img: "/animaux/savane/rhinoceros.png" },
            { key: "singe", label: "Singe", img: "/animaux/savane/singe.png" },
          ] },
          { key: "mer", label: "Mer", animals: [
            { key: "baleine", label: "Baleine", img: "/animaux/mer/baleine.png" },
            { key: "dauphin", label: "Dauphin", img: "/animaux/mer/dauphin.png" },
            { key: "requin", label: "Requin", img: "/animaux/mer/requin.png" },
            { key: "tortue", label: "Tortue", img: "/animaux/mer/tortue.png" },
            { key: "hippocampe", label: "Hippocampe", img: "/animaux/mer/hippocampe.png" },
            { key: "poulpe", label: "Poulpe", img: "/animaux/mer/poulpe.png" },
          ] },
        ],
      },
      { key: "note-grav", type: "note", text: "Chaque couvert est gravé sur le manche avec le prénom et l'animal choisi. Aperçu indicatif ; la gravure finale est optimisée par notre atelier." },
    ],
    title: "Couverts enfants personnalisés — jeu de 4, prénom et animal au choix gravés",
    images: [
      "/produits/couverts_enfants_4_face.jpg",
      "/produits/couverts_enfants_ex_prenom.jpg",
      "/produits/couverts_enfants_ex_enfant.jpg",
      "/produits/couverts_enfants_ex_ocean.jpg",
      "/produits/couverts_enfants_ex_animaux.jpg",
      "/produits/couverts_enfants_ex_flatlay.jpg",
      "/produits/couverts_enfants_couteau.jpg",
      "/produits/couverts_enfants_fourchette.jpg",
      "/produits/couverts_enfants_grande_cuillere.jpg",
      "/produits/couverts_enfants_petite_cuillere.jpg",
    ],
    variants: [
      // PRIX PROVISOIRE — à confirmer par l'utilisatrice.
      { id: "couverts-enfants-jeu4", title: "Jeu de 4 — couteau, fourchette, grande et petite cuillère", price: 34.90 },
    ],
    descriptionHtml: `<p><strong>Le jeu de couverts enfant personnalisé, gravé au laser.</strong> Quatre pièces adaptées aux petites mains — couteau, fourchette, grande et petite cuillère — en acier inoxydable poli miroir, personnalisées avec le prénom de l'enfant et un animal au choix par pièce.</p>
<p>Un cadeau de naissance, d'anniversaire ou de baptême qui accompagne l'enfant au quotidien et donne envie de passer à table.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Composition :</strong> jeu de 4 pièces (couteau, fourchette, grande cuillère, petite cuillère)</li>
<li><strong>Matière :</strong> acier inoxydable 304 (18/10), poli miroir</li>
<li><strong>Gravure :</strong> laser, sur le manche — prénom + un animal par couvert</li>
<li><strong>Entretien :</strong> passe au lave-vaisselle</li>
<li><strong>Dimensions :</strong> couteau 16,8 cm · fourchette 15 cm · grande cuillère 14,7 cm · petite cuillère 12,5 cm</li>
</ul>`,
  },
  {
    slug: "lampe-led-paris-saint-germain",
    badge: "Nouveau",
    name: "Lampe LED PSG",
    weight: 700, // lampe bois + plaque acrylique + socle, emballage protégé (fragile)
    pickup: false, // envoi seul (pas de retrait)
    letter: false, // colis (volumineux et fragile)
    hidden: false, // PUBLIÉ
    cardImage: "/produits/psg-lampe-bleu.jpg",
    subcategory: "lampes",
    category: "deco",
    type: "Lampe LED déco",
    tagline: "Lampe décorative ronde à l'effigie du Paris Saint-Germain : bois découpé au laser, socle bois et éclairage LED bleu et rouge aux couleurs du club.",
    personalizable: false,
    title: "Lampe LED Paris Saint-Germain — décoration lumineuse gravée, socle bois",
    images: [
      "/produits/psg-lampe-bleu.jpg",
      "/produits/psg-lampe-couleur.jpg",
      "/produits/psg-lampe-ambiance.jpg",
    ],
    variants: [
      { id: "lampe-psg-standard", title: "Lampe LED PSG", price: 29.90 },
    ],
    descriptionHtml: `<p><strong>La lampe lumineuse à l'effigie du Paris Saint-Germain.</strong> Une décoration ronde découpée au laser, montée sur un socle en bois, dont le motif s'illumine aux couleurs du club.</p>
<p>Posée sur un bureau, une étagère ou une table de chevet, elle crée une ambiance chaleureuse et fait un cadeau idéal pour tous les supporters parisiens.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> contreplaqué de tilleul 3 mm, découpé au laser</li>
<li><strong>Motif :</strong> logo du club découpé, rétroéclairé par les LED</li>
<li><strong>Éclairage :</strong> LED bleu et rouge, les couleurs du club</li>
<li><strong>Allumage :</strong> interrupteur situé à l'arrière (sans télécommande)</li>
<li><strong>Alimentation :</strong> à pile</li>
<li><strong>Socle :</strong> en bois, la lampe se tient debout toute seule</li>
<li><strong>Dimensions :</strong> environ 18 cm de large pour 13,5 cm de haut</li>
<li><strong>Fabrication :</strong> artisanale, dans notre atelier en France</li>
</ul>`,
  },
  {
    slug: "arbre-de-vie-lumineux",
    badge: "Nouveau",
    name: "Lampe Arbre de Vie",
    weight: 400, // panneau bois + socle + pile, emballage protégé
    pickup: false, // envoi seul (pas de retrait)
    letter: false, // colis (volumineux)
    hidden: false, // PUBLIÉ
    cardImage: "/produits/arbre-vie-lumineux-2.jpg",
    subcategory: "lampes",
    category: "deco",
    type: "Lampe LED déco",
    tagline: "Une lampe d'ambiance au motif Arbre de Vie, découpé au laser dans le bois — à personnaliser d'un prénom ou d'une date.",
    personalizable: true,
    personalizationLabel: "Texte à graver (facultatif)",
    personalizationFields: [
      { key: "texte", label: "Texte à graver (prénom, date ou court message)", placeholder: "Ex : Famille Martin — 2026", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "Personnalisation facultative : laissez vide pour le modèle sans texte. Le texte est gravé discrètement sous l'arbre." },
    ],
    title: "Lampe Arbre de Vie en bois personnalisée — veilleuse déco rétroéclairée LED",
    images: [
      "/produits/arbre-vie-lumineux-2.jpg",
      "/produits/arbre-vie-lumineux-1.jpg",
      "/produits/arbre-vie-lumineux-3.jpg",
    ],
    variants: [
      { id: "arbre-vie-lumineux-standard", title: "Lampe Arbre de Vie", price: 29.90 },
    ],
    descriptionHtml: `<p><strong>La lampe d'ambiance Arbre de Vie.</strong> Un panneau en bois découpé au laser, au motif Arbre de Vie finement ajouré, qui diffuse une lumière douce et chaleureuse.</p>
<p>Symbole de force, de sérénité et de lien familial, l'Arbre de Vie habille votre intérieur d'une décoration lumineuse et apaisante — sur une table de chevet, un buffet ou une étagère. Un cadeau plein de sens.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> contreplaqué de tilleul 3 mm, découpé au laser</li>
<li><strong>Motif :</strong> Arbre de Vie ajouré, rétroéclairé</li>
<li><strong>Éclairage :</strong> LED, lumière chaude (couleur unique)</li>
<li><strong>Alimentation :</strong> à pile (interrupteur à l'arrière)</li>
<li><strong>Forme :</strong> carrée à coins arrondis, se tient debout toute seule</li>
<li><strong>Fabrication :</strong> artisanale, dans notre atelier en France</li>
</ul>`,
  },
  {
    slug: "veilleuse-arbre-de-vie-ronde",
    badge: "Nouveau",
    name: "Veilleuse Arbre de Vie Ronde",
    weight: 400, // panneau bois rond + socle + pile, emballage protégé
    pickup: false, // envoi seul (pas de retrait)
    letter: false,
    hidden: false,
    cardImage: "/produits/arbre-vie-rond-1.jpg",
    subcategory: "lampes",
    category: "deco",
    type: "Lampe LED déco",
    tagline: "Une veilleuse ronde au motif Arbre de Vie celtique, découpé au laser dans le bois — à personnaliser.",
    personalizable: true,
    personalizationLabel: "Texte à graver (facultatif)",
    personalizationFields: [
      { key: "texte", label: "Texte à graver (prénom, date ou court message)", placeholder: "Ex : Famille Martin — 2026", maxLength: 30, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "Personnalisation facultative : laissez vide pour le modèle sans texte." },
    ],
    title: "Veilleuse Arbre de Vie Ronde en bois personnalisée — lampe d'ambiance LED",
    images: [
      "/produits/arbre-vie-rond-1.jpg",
      "/produits/arbre-vie-rond-2.jpg",
      "/produits/arbre-vie-rond-3.jpg",
    ],
    variants: [
      { id: "veilleuse-arbre-vie-ronde-standard", title: "Veilleuse Arbre de Vie Ronde", price: 29.90 },
    ],
    descriptionHtml: `<p><strong>La veilleuse d'ambiance Arbre de Vie.</strong> Un disque en bois découpé au laser, au motif Arbre de Vie celtique finement ajouré, qui diffuse une lumière douce et chaleureuse.</p>
<p>Symbole de force, de sérénité et de lien familial, elle crée une atmosphère apaisante sur une table de chevet, un buffet ou une étagère. Un cadeau plein de sens.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> contreplaqué de tilleul 3 mm, découpé au laser</li>
<li><strong>Motif :</strong> Arbre de Vie celtique ajouré, rétroéclairé</li>
<li><strong>Éclairage :</strong> LED, lumière chaude (couleur unique)</li>
<li><strong>Alimentation :</strong> à pile (interrupteur à l'arrière)</li>
<li><strong>Forme :</strong> ronde, se tient debout toute seule</li>
<li><strong>Fabrication :</strong> artisanale, dans notre atelier en France</li>
</ul>`,
  },
  {
    slug: "bougeoir-mandala-bois",
    badge: "Nouveau",
    name: "Bougeoir Flottant",
    weight: 300, // structure bois multi-étages
    pickup: false, // envoi seul (pas de retrait)
    letter: false,
    hidden: false,
    cardImage: "/produits/bougeoir-mandala-1.jpg",
    subcategory: "bougeoirs",
    category: "deco",
    type: "Bougeoir déco",
    tagline: "Un bougeoir flottant en bois, au motif mandala finement découpé au laser.",
    personalizable: false,
    title: "Bougeoir Flottant en bois — porte-bougie chauffe-plat déco zen",
    images: [
      "/produits/bougeoir-mandala-1.jpg",
      "/produits/bougeoir-mandala-2.jpg",
      "/produits/bougeoir-mandala-3.jpg",
    ],
    variants: [
      { id: "bougeoir-mandala-standard", title: "Bougeoir Flottant", price: 22.90 },
    ],
    descriptionHtml: `<p><strong>Le bougeoir flottant Arbre de Vie au motif mandala.</strong> Une structure en bois à étages, découpée au laser et ornée de mandalas ajourés, qui accueille une bougie chauffe-plat pour une ambiance douce et apaisante.</p>
<p>Posé sur une table basse, un buffet ou un coin détente, il diffuse une lumière chaleureuse à travers ses motifs. Idéal pour une décoration zen, un cadeau bien-être ou un moment de relaxation.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> bois découpé au laser, motifs mandala ajourés</li>
<li><strong>Structure :</strong> design « flottant » à étages, montée à la main</li>
<li><strong>Usage :</strong> reçoit une bougie chauffe-plat (non incluse)</li>
<li><strong>Fabrication :</strong> artisanale, dans notre atelier en France</li>
</ul>
<p><em>Conseil sécurité : ne jamais laisser une bougie allumée sans surveillance.</em></p>`,
  },
  {
    slug: "bougeoir-fleur-de-lotus",
    badge: "Nouveau",
    name: "Bougeoir Fleur de Lotus",
    weight: 250,
    pickup: false, // envoi seul (pas de retrait)
    letter: false,
    hidden: false,
    cardImage: "/produits/bougeoir-lotus-1.jpg",
    subcategory: "bougeoirs",
    category: "deco",
    type: "Bougeoir déco",
    tagline: "Un porte-bougie fleur de lotus en bois, découpé à la main dans notre atelier — à personnaliser d'un prénom ou d'une date.",
    personalizable: true,
    personalizationLabel: "Gravure (option)",
    personalizationFields: [
      { key: "texte", label: "Texte à graver (prénom, nom ou date)", placeholder: "Ex : Marie & Paul — 2026", maxLength: 30, variantContains: "gravure" },
      { key: "police", type: "font", label: "Police de gravure", optional: true, variantContains: "gravure" },
      { key: "note", type: "note", text: "Choisissez « Avec gravure » pour personnaliser (prénom, nom ou date). La gravure est discrète (pourtour ou pétale)." },
    ],
    title: "Bougeoir Fleur de Lotus en bois personnalisé — porte-bougie chauffe-plat déco",
    images: [
      "/produits/bougeoir-lotus-1.jpg",
      "/produits/bougeoir-lotus-2.jpg",
      "/produits/bougeoir-lotus-3.jpg",
    ],
    variants: [
      { id: "bougeoir-lotus-simple", title: "Sans personnalisation", price: 16.90 },
      { id: "bougeoir-lotus-grave", title: "Avec gravure (prénom, nom ou date)", price: 21.90 },
    ],
    descriptionHtml: `<p><strong>Une fleur de lotus découpée au laser dans notre atelier — pas en usine.</strong> Chaque bougeoir est découpé et fini à la main chez nous, en France. Une pièce singulière, pas un objet de production de masse.</p>
<p>Le bois naturel et la finesse de la découpe laser offrent des détails impossibles à obtenir en grande série. Symbole de pureté et de sérénité, le lotus diffuse une lumière douce et apaisante sur une table, un buffet ou un coin détente.</p>
<p><strong>Personnalisez-le d'un prénom, d'un nom ou d'une date</strong> : il devient un cadeau unique et plein de sens — anniversaire, mariage, naissance, remerciement.</p>
<h3>Caractéristiques</h3>
<ul>
<li>Découpé et fini <strong>à la main dans notre atelier français</strong> (pas de fabrication en chaîne)</li>
<li><strong>Bois naturel</strong> découpé au laser, finition soignée</li>
<li>Reçoit une <strong>bougie chauffe-plat</strong> (non incluse)</li>
<li><strong>Gravure au choix</strong> : prénom, nom ou date (option +5 €)</li>
</ul>
<p><em>Conseil sécurité : ne jamais laisser une bougie allumée sans surveillance.</em></p>`,
  },
  // --- Collection Coupe du Monde 2026 : UN produit PAR pays -----------------
  {
    slug: "porte-stylo-coq-coupe-du-monde",
    worldcup: true,
    badge: "Nouveau",
    name: "Porte-stylo France",
    weight: 200,
    pickup: false,
    letter: true, // expédié à plat en lettre suivie
    hidden: false,
    cardImage: "/produits/porte-stylo-coq-1.jpg",
    subcategory: undefined,
    category: "deco",
    type: "Coupe du Monde 2026",
    tagline: "Le porte-stylo en bois aux couleurs des Bleus — coq gaulois, spécial Coupe du Monde 2026.",
    personalizable: false,
    title: "Porte-stylo France en bois — coq gaulois, Coupe du Monde 2026",
    images: [
      "/produits/porte-stylo-coq-1.jpg",
      "/produits/porte-stylo-coq-2.jpg",
      "/produits/porte-stylo-coq-3.jpg",
    ],
    variants: [
      { id: "porte-stylo-coq-standard", title: "Porte-stylo France", price: 14.90 },
    ],
    descriptionHtml: `<p><strong>Supportez les Bleus avec style.</strong> Ce porte-stylo en bois, découpé au laser, célèbre la <strong>Coupe du Monde 2026</strong> aux couleurs de la France, avec son fier coq gaulois.</p>
<p>Posé sur un bureau, il tient fièrement votre stylo (non inclus). Le cadeau parfait pour tous les supporters.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Motif :</strong> coq gaulois + « FRANCE » + bandeau Coupe du Monde 2026</li>
<li><strong>Matière :</strong> bois découpé au laser, finition soignée</li>
<li>Découpé et fini <strong>à la main dans notre atelier français</strong></li>
<li>Livré à plat (montage simple, quelques secondes)</li>
</ul>`,
  },
  {
    slug: "porte-stylo-portugal-coupe-du-monde",
    worldcup: true,
    badge: "Nouveau",
    name: "Porte-stylo Portugal",
    weight: 200,
    pickup: false,
    letter: true,
    hidden: false,
    cardImage: "/produits/porte-stylo-portugal-1.jpg",
    subcategory: undefined,
    category: "deco",
    type: "Coupe du Monde 2026",
    tagline: "Le porte-stylo en bois aux couleurs du Portugal — « A paixão que nos une », spécial Coupe du Monde 2026.",
    personalizable: false,
    title: "Porte-stylo Portugal en bois — Coupe du Monde 2026",
    images: [
      "/produits/porte-stylo-portugal-1.jpg",
      "/produits/porte-stylo-portugal-2.jpg",
    ],
    variants: [
      { id: "porte-stylo-portugal-standard", title: "Porte-stylo Portugal", price: 14.90 },
    ],
    descriptionHtml: `<p><strong>Força Portugal !</strong> Ce porte-stylo en bois, découpé au laser, célèbre la <strong>Coupe du Monde 2026</strong> aux couleurs du Portugal — « A paixão que nos une ».</p>
<p>Posé sur un bureau, il tient fièrement votre stylo (non inclus). Le cadeau parfait pour tous les supporters lusitaniens.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Motif :</strong> blason + « PORTUGAL » + bandeau Coupe du Monde 2026</li>
<li><strong>Matière :</strong> bois découpé au laser, finition soignée</li>
<li>Découpé et fini <strong>à la main dans notre atelier français</strong></li>
<li>Livré à plat (montage simple, quelques secondes)</li>
</ul>`,
  },
  {
    slug: "porte-stylo-argentine-coupe-du-monde",
    worldcup: true,
    badge: "Nouveau",
    name: "Porte-stylo Argentine",
    weight: 200,
    pickup: false,
    letter: true,
    hidden: false,
    cardImage: "/produits/porte-stylo-argentine-1.jpg",
    subcategory: undefined,
    category: "deco",
    type: "Coupe du Monde 2026",
    tagline: "Le porte-stylo en bois aux couleurs de l'Argentine — « Pasión por el fútbol », spécial Coupe du Monde 2026.",
    personalizable: false,
    title: "Porte-stylo Argentine en bois — Coupe du Monde 2026",
    images: [
      "/produits/porte-stylo-argentine-1.jpg",
      "/produits/porte-stylo-argentine-2.jpg",
    ],
    variants: [
      { id: "porte-stylo-argentine-standard", title: "Porte-stylo Argentine", price: 14.90 },
    ],
    descriptionHtml: `<p><strong>Vamos Argentina !</strong> Ce porte-stylo en bois, découpé au laser, célèbre la <strong>Coupe du Monde 2026</strong> aux couleurs de l'Albiceleste — « Pasión por el fútbol ».</p>
<p>Posé sur un bureau, il tient fièrement votre stylo (non inclus). Le cadeau parfait pour tous les supporters argentins.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Motif :</strong> blason + « ARGENTINE » + bandeau Coupe du Monde 2026</li>
<li><strong>Matière :</strong> bois découpé au laser, finition soignée</li>
<li>Découpé et fini <strong>à la main dans notre atelier français</strong></li>
<li>Livré à plat (montage simple, quelques secondes)</li>
</ul>`,
  },
  {
    slug: "porte-stylo-espagne-coupe-du-monde",
    worldcup: true,
    badge: "Nouveau",
    name: "Porte-stylo Espagne",
    weight: 200,
    pickup: false,
    letter: true,
    hidden: false,
    cardImage: "/produits/porte-stylo-espagne-1.jpg",
    subcategory: undefined,
    category: "deco",
    type: "Coupe du Monde 2026",
    tagline: "Le porte-stylo en bois aux couleurs de l'Espagne — « El sueño de una nación », spécial Coupe du Monde 2026.",
    personalizable: false,
    title: "Porte-stylo Espagne en bois — Coupe du Monde 2026",
    images: [
      "/produits/porte-stylo-espagne-1.jpg",
      "/produits/porte-stylo-espagne-2.jpg",
    ],
    variants: [
      { id: "porte-stylo-espagne-standard", title: "Porte-stylo Espagne", price: 14.90 },
    ],
    descriptionHtml: `<p><strong>¡Vamos España !</strong> Ce porte-stylo en bois, découpé au laser, célèbre la <strong>Coupe du Monde 2026</strong> aux couleurs de la Roja — « El sueño de una nación ».</p>
<p>Posé sur un bureau, il tient fièrement votre stylo (non inclus). Le cadeau parfait pour tous les supporters espagnols.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Motif :</strong> blason + « ESPAGNE » + bandeau Coupe du Monde 2026</li>
<li><strong>Matière :</strong> bois découpé au laser, finition soignée</li>
<li>Découpé et fini <strong>à la main dans notre atelier français</strong></li>
<li>Livré à plat (montage simple, quelques secondes)</li>
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
