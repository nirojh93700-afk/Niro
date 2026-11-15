# Bracelet homme perles et tresse : emballages bracelet long (BRACELETS_LONG) + Noël, tous (gérant, 15/11 : « tu peux mettre tous les paquets »).
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-bpt-"
prod='''  {
    slug: "bracelet-homme-perles-tresse",
    badge: "Nouveau",
    name: "Bracelet Homme Perles et Tresse",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme gravé trois rangs : perles noires, simili cuir et tresse",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Un rang de perles noires mates, un rang plat en simili cuir à graver et une tresse noire et brune, fermoir aimanté noir.",
    personalizable: true,
    personalizationLabel: "Gravure du rang plat",
    images: ["IIblanc.jpg", "IIbois-face.jpg", "IIsombre.jpg", "IIdebout.jpg", "IIbois-angle.jpg"],
    variants: [
      { id: "bracelet-homme-perles-tresse", title: "Noir", price: 25.90, stockId: "bracelet-homme-perles-tresse", image: "IIblanc.jpg" },
    ],
    engravingPricing: { moinsCherCompris: true, textKeys: ["texte"], textExtra: 3 },
    personalizationFields: [
      { key: "texte", label: "Texte gravé sur le rang plat en simili cuir (+3 €)", placeholder: "Prénom, date, message…", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
      { key: "note", type: "note", text: "La gravure est offerte : elle se fait sur le rang plat en simili cuir. Laissez vide pour un bracelet sans gravure." },
    ],
    descriptionHtml: `<p>Un <strong>bracelet homme à trois rangs</strong> : un rang de <strong>perles noires mates</strong>, un <strong>rang plat en simili cuir noir</strong> et une <strong>tresse noire et brune</strong>, réunis par un fermoir aimanté noir. Un prénom, une date ou un message gravé sur le rang plat, et le cadeau est prêt.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> simili cuir noir et brun, perles noires mates, fermoir aimanté noir</li>
<li><strong>Couleur :</strong> noir, tresse noire et brune</li>
<li><strong>Poids :</strong> environ 40 g</li>
</ul>`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "bracelet-homme-perles-tresse": {
    material: `Taille & Matériaux
- Bracelet à trois rangs : perles noires mates, rang plat en simili cuir noir, tresse en simili cuir noir et brun.
- Fermoir aimanté noir.
- Poids : environ 40 g.`,
    usage: `Personnalisation & Entretien
- Gravure sur le rang plat en simili cuir : un prénom, une date ou un message, offerte.
- Évitez l'eau : retirez-le pour la douche, la baignade et le sport. S'il a été mouillé, laissez-le sécher à l'air libre, loin d'un radiateur.
- Entretien : essuyez-le avec un chiffon doux et sec. Gardez-le loin des cartes bancaires et du téléphone (fermoir aimanté).`,
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
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["bracelet-homme-perles-tresse", ',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "bracelet-homme-perles-tresse": "2026-11-15",',1))
