# NB : pour la capture seulement, l'ensemble est rangé dans BRACELETS_LONG ; au « applique », emballages = sac + microfibre seulement (gérant, 15/11).
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-ehp-"
prod='''  {
    slug: "ensemble-homme-plaque-noire",
    badge: "Nouveau",
    name: "Ensemble Homme Plaque Noire",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Ensemble homme noir à graver : collier plaque, bracelet torsadé et bague",
    category: "bijoux", type: "Ensemble",
    tagline: "Un collier à plaque, un bracelet torsadé et une bague, tout en noir, à graver à son nom.",
    personalizable: true,
    personalizationLabel: "Gravure du pendentif et de la bague",
    images: ["IIphoto-1.jpg", "IIphoto-2.jpg", "IIphoto-3.jpg", "IImesures-fr.jpg"],
    variants: [
      { id: "ensemble-homme-plaque-noire-noir", title: "Noir", price: 38.90, stockId: "ensemble-homme-plaque-noire-noir", image: "IIphoto-1.jpg" },
    ],
    engravingPricing: { moinsCherCompris: true, textKeys: ["pendentif", "bague"], textExtra: 3 },
    personalizationFields: [
      { key: "note", type: "note", text: "Le pendentif et la bague se gravent. La première gravure est offerte, la deuxième coûte 3 €. Laissez vide pour un ensemble sans gravure." },
      { key: "pendentif", label: "Texte gravé sur le pendentif (+3 €)", placeholder: "Prénom, date, message…", maxLength: 30, optional: true },
      { key: "bague", label: "Texte gravé sur la bague (+3 €)", placeholder: "Initiales, date…", maxLength: 15, optional: true },
      { key: "police", type: "font", label: "Police de gravure", optional: true },
    ],
    descriptionHtml: `<p>Un <strong>ensemble homme tout en noir</strong> : un <strong>collier à plaque</strong> sur une chaîne maille vénitienne, un <strong>bracelet torsadé</strong> et une <strong>bague</strong> lisse. La plaque et la bague se <strong>gravent</strong> : un prénom, une date, un message.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> acier inoxydable noir</li>
<li><strong>Collier :</strong> chaîne de 60 cm, pendentif plaque</li>
<li><strong>Bracelet :</strong> torsadé, 21 cm, fermoir mousqueton</li>
<li><strong>Bague :</strong> 1,9 cm de diamètre, taille unique</li>
<li><strong>Poids :</strong> environ 50 g pour l'ensemble</li>
</ul>`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "ensemble-homme-plaque-noire": {
    material: `Taille & Matériaux
- Ensemble de trois pièces en acier inoxydable noir.
- Collier : chaîne maille vénitienne de 60 cm, pendentif plaque.
- Bracelet torsadé : 21 cm, fermoir mousqueton.
- Bague lisse : 1,9 cm de diamètre, taille unique.
- Poids : environ 50 g pour l'ensemble.`,
    usage: `Personnalisation & Entretien
- Gravure du pendentif et de la bague : la première gravure est offerte, la deuxième coûte 3 €.
- Mettez parfum, crème et laque avant vos bijoux. Retirez-les pour la douche, la piscine, la mer et le sport : le chlore, le sel et le savon abîment la finition noire.
- Entretien : essuyez-les avec un chiffon doux et sec après les avoir portés ; s'ils ont été mouillés, séchez-les bien. Rangez-les à part pour qu'ils ne se rayent pas.`,
    returns: `Expédition & Retour
- Expédié soigneusement protégé.
- Article personnalisé : il ne peut être ni repris ni échangé, sauf défaut ou erreur de notre part (art. L221-28 du Code de la consommation).
- Un souci à la réception ? Écrivez-nous vite avec une photo, on trouvera toujours une solution ensemble.`,
  },
'''
anc='  "bracelet-femme-papillon": {'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,info+anc))
P="src/lib/packagingSeed.js";t=open(P,encoding="utf-8").read()
a='const BRACELETS_LONG = ["bracelet-homme-identite-gourmette",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["ensemble-homme-plaque-noire", "bracelet-homme-identite-gourmette",',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "ensemble-homme-plaque-noire": "2026-11-15",',1))
