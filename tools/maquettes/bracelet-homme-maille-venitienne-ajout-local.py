# Bracelet homme maille vénitienne : emballages bracelet long (BRACELETS_LONG) + Noël, tous (gérant, 15/11 : « tu peux mettre tous les paquets »).
P="src/lib/products.js";t=open(P,encoding="utf-8").read()
I="/produits/zz-maquette-bmv-"
prod='''  {
    slug: "bracelet-homme-maille-venitienne",
    badge: "Nouveau",
    name: "Bracelet Homme Maille Vénitienne",
    weight: 72, pickup: false, letter: true, subcategory: "homme",
    title: "Bracelet homme maille vénitienne à plaque, acier inoxydable",
    category: "bijoux", type: "Bracelet personnalisé",
    tagline: "Une fine maille vénitienne en acier et sa petite plaque, en doré ou en argenté. Prêt à offrir.",
    personalizable: false,
    images: ["IIdeux-couleurs.jpg", "IIdore.jpg", "IIargente-blanc.jpg", "IIargente.jpg", "IIargente-porte.jpg", "IIdore-porte.jpg", "IIdore-poing.jpg", "IIdeux-fermoirs.jpg", "IIdeux-maillons.jpg", "IIargente-ambiance.jpg", "IImesures-fr.jpg"],
    variants: [
      { id: "bracelet-homme-maille-venitienne-dore", title: "Doré", price: 13.90, stockId: "bracelet-homme-maille-venitienne-dore", image: "IIdore.jpg" },
      { id: "bracelet-homme-maille-venitienne-argente", title: "Argenté", price: 25.90, stockId: "bracelet-homme-maille-venitienne-argente", image: "IIargente-blanc.jpg" },
    ],
    descriptionHtml: `<p>Un <strong>bracelet homme</strong> sobre : une fine <strong>maille vénitienne</strong> de 2 mm en acier inoxydable, une chaînette de réglage et une petite <strong>plaque</strong> au bout, en doré ou en argenté. Un bijou discret, prêt à offrir.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> acier inoxydable, finition dorée ou argentée, fermoir mousqueton</li>
<li><strong>Couleurs :</strong> doré, argenté</li>
<li><strong>Longueur :</strong> 19 à 22 cm, réglable avec la chaînette</li>
<li><strong>Maille :</strong> 2 mm</li>
<li><strong>Poids :</strong> environ 5 g</li>
</ul>`,
  },
'''.replace("II",I)
anc='  {\n    slug: "collier-coeur-scintillant",'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,prod+anc))
P="src/lib/productInfo.js";t=open(P,encoding="utf-8").read()
info='''  "bracelet-homme-maille-venitienne": {
    material: `Taille & Matériaux
- Maille vénitienne de 2 mm en acier inoxydable, finition dorée ou argentée.
- Petite plaque rectangulaire au bout de la chaînette de réglage, fermoir mousqueton.
- Longueur : 19 à 22 cm, réglable. Poids : environ 5 g.`,
    usage: `Personnalisation & Entretien
- Ce bracelet se vend tel quel : il ne se grave pas.
- Mettez parfum, crème et laque avant votre bijou. Retirez-le pour la douche, la piscine, la mer et le sport : le chlore, le sel et le savon abîment surtout les finitions dorées.
- Entretien : essuyez-le avec un chiffon doux et sec après l'avoir porté ; s'il a été mouillé, séchez-le bien. Rangez-le à part, dans sa pochette, pour qu'il ne se raye pas.`,
    returns: `Expédition & Retour
- Expédié soigneusement protégé.
- Un souci à la réception (colis abîmé, erreur de notre part) ? Écrivez-nous vite avec une photo, on trouvera toujours une solution ensemble.`,
  },
'''
anc='  "bracelet-femme-papillon": {'
assert t.count(anc)==1; open(P,"w",encoding="utf-8").write(t.replace(anc,info+anc))
P="src/lib/packagingSeed.js";t=open(P,encoding="utf-8").read()
a='const BRACELETS_LONG = ['; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,'const BRACELETS_LONG = ["bracelet-homme-maille-venitienne", ',1))
P="src/lib/productDates.js";t=open(P,encoding="utf-8").read()
a='  "collier-barre-verticale": "2026-11-02",'; assert a in t
open(P,"w",encoding="utf-8").write(t.replace(a,a+'\n  "bracelet-homme-maille-venitienne": "2026-11-15",',1))
