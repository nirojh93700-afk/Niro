# Bracelet homme : emballages bracelet long (BRACELETS_LONG) + Noël, tous (gérant, 15/11 : « tu peux mettre tous les paquets »).
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-bht-"
prod='''  {
    slug: "bracelet-homme-trois-rangs",
    badge: "Nouveau",
    name: "Bracelet Homme Trois Rangs",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme trois rangs à plaque gravée, simili cuir noir et acier doré",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Trois rangs de simili cuir noir, une plaque dorée à graver et deux perles d'acier ciselées.",
    personalizable: true,
    personalizationLabel: "Gravure de la plaque",
    images: ["IIdore.jpg", "IImesures-fr.jpg"],
    variants: [
      { id: "bracelet-homme-trois-rangs-noir-dore", title: "Noir et doré", price: 30.90, stockId: "bracelet-homme-trois-rangs-noir-dore", image: "IIdore.jpg" },
    ],
    engravingPricing: { moinsCherCompris: true, textKeys: ["texte"], textExtra: 3 },
    personalizationFields: [
      { key: "texte", label: "Texte gravé sur la plaque (+3 €)", placeholder: "Prénom, date, message…", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "La gravure de la plaque est offerte. Laissez vide pour un bracelet sans gravure." },
    ],
    descriptionHtml: `<p>Un <strong>bracelet homme à trois rangs</strong> : un rang plat et deux rangs tressés en <strong>simili cuir noir</strong>, une <strong>plaque dorée</strong> à graver et deux <strong>perles d'acier ciselées</strong>. Un prénom, une date ou un message sur la plaque, et le cadeau est prêt.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> simili cuir noir, plaque et perles en acier inoxydable doré, fermoir en métal</li>
<li><strong>Longueur :</strong> 21 cm</li>
<li><strong>Poids :</strong> environ 35 g</li>
</ul>`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "bracelet-homme-trois-rangs": {
    material: `Taille & Matériaux
- Bracelet trois rangs : un rang plat et deux rangs tressés en simili cuir noir.
- Plaque et perles ciselées en acier inoxydable doré, fermoir en métal.
- Longueur : 21 cm. Poids : environ 35 g.`,
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
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["bracelet-homme-trois-rangs", ',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "bracelet-homme-trois-rangs": "2026-11-15",',1))
