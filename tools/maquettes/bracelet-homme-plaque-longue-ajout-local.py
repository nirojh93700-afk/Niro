# Maquette « Bracelet Homme Plaque Longue » (Nihao NH11089638, 15/11/2026) : fiche ajoutée EN LOCAL seulement, pour la capture.
# Emballages bracelet long (BRACELETS_LONG) + Noël, tous. Code 27,90 → barré 24,90 dans la capture, remplacé par 24,90 € net.
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-bpl-"
prod='''  {
    slug: "bracelet-homme-plaque-longue",
    badge: "Nouveau",
    name: "Bracelet Homme Plaque Longue",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme à plaque longue gravée, simili cuir noir tressé et acier",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Trois rangs de simili cuir noir, une longue plaque d'acier à graver et un fermoir en acier : argenté ou tout noir.",
    personalizable: true,
    personalizationLabel: "Gravure de la plaque",
    images: ["IIdeux-couleurs.jpg", "IIargente.jpg", "IInoir.jpg", "IIargente-face.jpg", "IImesures-fr.jpg"],
    variants: [
      { id: "bracelet-homme-plaque-longue-acier", title: "Noir et acier", price: 27.90, stockId: "bracelet-homme-plaque-longue-acier", image: "IIargente.jpg" },
      { id: "bracelet-homme-plaque-longue-noir", title: "Tout noir", price: 27.90, stockId: "bracelet-homme-plaque-longue-noir", image: "IInoir.jpg" },
    ],
    engravingPricing: { moinsCherCompris: true, textKeys: ["texte"], textExtra: 3 },
    personalizationFields: [
      { key: "texte", label: "Texte gravé sur la plaque (+3 €)", placeholder: "Prénom, date, message…", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "La gravure de la plaque est offerte. Laissez vide pour un bracelet sans gravure." },
    ],
    descriptionHtml: `<p>Un <strong>bracelet homme à trois rangs</strong> : deux rangs plats et un rang tressé en <strong>simili cuir noir</strong>, une <strong>longue plaque d'acier</strong> à graver, des perles d'acier sur le rang tressé et un fermoir en acier. En argenté sur noir ou tout en noir. Un prénom, une date ou un message sur la plaque, et le cadeau est prêt.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> simili cuir noir, plaque, perles et fermoir en acier inoxydable (argenté ou noir)</li>
<li><strong>Couleurs :</strong> noir et acier, tout noir</li>
<li><strong>Longueur :</strong> 21 cm</li>
<li><strong>Poids :</strong> environ 28 g</li>
</ul>`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "bracelet-homme-plaque-longue": {
    material: `Taille & Matériaux
- Bracelet trois rangs : deux rangs plats et un rang tressé en simili cuir noir.
- Plaque, perles et fermoir en acier inoxydable argenté ou noir.
- Longueur : 21 cm. Poids : environ 28 g.`,
    usage: `Personnalisation & Entretien
- Gravure de la plaque : un prénom, une date ou un message, offerte.
- Évitez l'eau : retirez-le pour la douche, la baignade et le sport. S'il a été mouillé, laissez-le sécher à l'air libre, loin d'un radiateur.
- Entretien : essuyez-le avec un chiffon doux et sec. Rangez-le à part pour que la plaque ne se raye pas.`,
    returns: `Expédition & Retour
- Expédié soigneusement protégé.
- Article personnalisé : il ne peut être ni repris ni échangé, sauf défaut ou erreur de notre part (art. L221-28 du Code de la consommation).
- Un souci à la réception ? Écrivez-nous vite avec une photo, on trouvera toujours une solution ensemble.`,
  },
'''
anc='  "bracelet-femme-papillon": {'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,info+anc))
P="src/lib/packagingSeed.js";t=open(P,encoding="utf-8").read()
a='const BRACELETS_LONG = ['; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["bracelet-homme-plaque-longue", ',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "bracelet-homme-plaque-longue": "2026-11-15",',1))
