# Bracelet homme : emballages bracelet long (BRACELETS_LONG) + Noël, tous (gérant, 15/11 : « tu peux mettre tous les paquets »).
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-btb-"
prod='''  {
    slug: "bracelet-homme-tresse-bicolore",
    badge: "Nouveau",
    name: "Bracelet Homme Tressé Bicolore",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme tressé trois liens, simili cuir noir et couleur, fermoir acier",
    category: "bijoux", type: "Bracelet",
    tagline: "Trois liens de simili cuir, dont une tresse de couleur, et une perle d'acier ciselée.",
    personalizable: false,
    images: ["IIquatre-couleurs.jpg", "IIdore.jpg", "IIcamel.jpg", "IIporte-blanc.jpg"],
    variants: [
      { id: "bracelet-homme-tresse-noir", title: "Noir", price: 25.90, stockId: "bracelet-homme-tresse-noir", image: "IIquatre-couleurs.jpg" },
      { id: "bracelet-homme-tresse-blanc", title: "Noir et blanc", price: 25.90, stockId: "bracelet-homme-tresse-blanc", image: "IIporte-blanc.jpg" },
      { id: "bracelet-homme-tresse-dore", title: "Noir et doré", price: 25.90, stockId: "bracelet-homme-tresse-dore", image: "IIdore.jpg" },
      { id: "bracelet-homme-tresse-camel", title: "Noir et camel", price: 25.90, stockId: "bracelet-homme-tresse-camel", image: "IIcamel.jpg" },
    ],
    descriptionHtml: `<p>Un <strong>bracelet homme à trois liens</strong> : un lien plat et un lien tressé en <strong>simili cuir noir</strong>, une <strong>tresse de couleur</strong> (noire, blanche, dorée ou camel) et une <strong>perle d'acier ciselée</strong> entre deux anneaux. Il se ferme par un fermoir en métal.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> simili cuir, perle et anneaux en acier inoxydable, fermoir en métal</li>
<li><strong>Couleurs :</strong> noir, noir et blanc, noir et doré, noir et camel</li>
<li><strong>Poids :</strong> environ 25 g</li>
</ul>
<p>Ce bracelet se vend tel quel, prêt à offrir : il ne se grave pas.</p>`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "bracelet-homme-tresse-bicolore": {
    material: `Taille & Matériaux
- Bracelet à trois liens : un lien plat et un lien tressé en simili cuir noir, une tresse de couleur (noire, blanche, dorée ou camel).
- Perle ciselée et anneaux en acier inoxydable, fermoir en métal.
- Poids : environ 25 g.`,
    usage: `Personnalisation & Entretien
- Ce bracelet se vend tel quel : il ne se grave pas.
- Évitez l'eau : retirez-le pour la douche, la baignade et le sport. S'il a été mouillé, laissez-le sécher à l'air libre, loin d'un radiateur.
- Entretien : essuyez-le avec un chiffon doux et sec.`,
    returns: `Expédition & Retour
- Expédié soigneusement protégé.
- Un souci à la réception (colis abîmé, erreur de notre part) ? Écrivez-nous vite avec une photo, on trouvera toujours une solution ensemble.`,
  },
'''
anc='  "bracelet-femme-papillon": {'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,info+anc))
P="src/lib/packagingSeed.js";t=open(P,encoding="utf-8").read()
a='const BRACELETS_LONG = ['; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["bracelet-homme-tresse-bicolore", ',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "bracelet-homme-tresse-bicolore": "2026-11-15",',1))
