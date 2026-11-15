# Bracelet homme deux rangs : emballages bracelet long (BRACELETS_LONG) + Noël, tous (gérant, 15/11 : « tu peux mettre tous les paquets »).
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-bdr-"
prod='''  {
    slug: "bracelet-homme-deux-rangs",
    badge: "Nouveau",
    name: "Bracelet Homme Deux Rangs",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme deux rangs gravé, simili cuir noir et plaque en acier",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Un rang plat et un rang tressé en simili cuir noir, une plaque en acier brossé au bandeau noir.",
    personalizable: true,
    personalizationLabel: "Gravure du rang plat",
    images: ["IIblanc.jpg", "IIpierre-devant.jpg", "IIpierre.jpg", "IIpierre-face.jpg", "IIfermoir.jpg", "IIporte.jpg", "IIporte-motif.jpg", "IImesures-fr.jpg"],
    variants: [
      { id: "bracelet-homme-deux-rangs", title: "Noir et acier", price: 25.90, stockId: "bracelet-homme-deux-rangs", image: "IIblanc.jpg" },
    ],
    engravingPricing: { moinsCherCompris: true, textKeys: ["texte"], textExtra: 3 },
    personalizationFields: [
      { key: "texte", label: "Texte gravé sur le rang plat en simili cuir (+3 €)", placeholder: "Prénom, date, message…", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "La gravure est offerte : elle se fait sur le rang plat en simili cuir, à côté de la plaque. Laissez vide pour un bracelet sans gravure." },
    ],
    descriptionHtml: `<p>Un <strong>bracelet homme à deux rangs</strong> : un rang plat et un rang tressé en <strong>simili cuir noir</strong>, réunis par une <strong>plaque en acier brossé</strong> ornée d'un bandeau noir. Il se ferme par un fermoir à clip en acier. Un prénom, une date ou un message gravé sur le rang plat, et le cadeau est prêt.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> simili cuir noir, plaque et fermoir en acier inoxydable</li>
<li><strong>Plaque :</strong> 4,1 × 0,68 cm</li>
<li><strong>Longueur :</strong> 21 cm</li>
<li><strong>Poids :</strong> environ 12 g</li>
</ul>
`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "bracelet-homme-deux-rangs": {
    material: `Taille & Matériaux
- Bracelet à deux rangs : un rang plat et un rang tressé en simili cuir noir.
- Plaque en acier inoxydable brossé (4,1 × 0,68 cm) avec un bandeau noir, fermoir à clip en acier.
- Longueur : 21 cm. Poids : environ 12 g.`,
    usage: `Personnalisation & Entretien
- Gravure sur le rang plat en simili cuir, à côté de la plaque : un prénom, une date ou un message, offerte.
- Évitez l'eau : retirez-le pour la douche, la baignade et le sport. S'il a été mouillé, laissez-le sécher à l'air libre, loin d'un radiateur.
- Entretien : essuyez-le avec un chiffon doux et sec. Rangez-le à part pour que la plaque ne se raye pas.`,
    returns: `Expédition & Retour
- Expédié soigneusement protégé.
- Un souci à la réception (colis abîmé, erreur de notre part) ? Écrivez-nous vite avec une photo, on trouvera toujours une solution ensemble.`,
  },
'''
anc='  "bracelet-femme-papillon": {'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,info+anc))
P="src/lib/packagingSeed.js";t=open(P,encoding="utf-8").read()
a='const BRACELETS_LONG = ['; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["bracelet-homme-deux-rangs", ',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "bracelet-homme-deux-rangs": "2026-11-15",',1))
