"""Ajoute EN LOCAL la fiche verre-tumbler-cristal-grave (maquette). Usage : python3 patch.py [G37 json] [G39 json]"""
import json, sys
G37 = json.loads(sys.argv[1]) if len(sys.argv) > 1 else ["/produits/zz-maquette-tumbler-vierge.jpg"]
G39 = json.loads(sys.argv[2]) if len(sys.argv) > 2 else ["/produits/zz-maquette-tumbler39-vierge.jpg", "/produits/zz-maquette-tumbler39-studio.jpg"]
p = 'src/lib/products.js'; s = open(p).read()
m = "];\n\n// --- Helpers ----------------------------------------------------------------\n"
assert s.count(m) == 1
add = '''];
{
  const f = products.find((p) => p.slug === "flute-a-champagne-gravee");
  const E37 = { box: { top: 0.20, left: 0.24, width: 0.52, height: 0.50 }, widthMm: 70, maxWidthFrac: 0.34, minWidthFrac: 0.08 };
  const E39 = { box: { top: 0.16, left: 0.31, width: 0.38, height: 0.52 }, widthMm: 55, maxWidthFrac: 0.30, minWidthFrac: 0.07 };
  const G37 = __G37__;
  const G39 = __G39__;
  products.push({
    ...f,
    slug: "verre-tumbler-cristal-grave",
    badge: "Nouveau", hidden: false, lockImages: true,
    name: "Verre tumbler en cristal gravé",
    title: "Verre tumbler en cristal gravé — modèle, lettre fleurie, prénom ou photo",
    type: "Verre en cristal gravé", subcategory: "whisky",
    tagline: "Un verre sans pied en cristal, en 37 cl ou en grand 39 cl, gravé à votre façon : un modèle, une lettre fleurie, votre texte, votre photo ou votre logo.",
    weight: 600, freeShipThreshold: 60, perGlassLot: true,
    images: G37,
    engraveImage: "/produits/zz-maquette-tumbler-vierge.jpg",
    engrave: E37,
    parcoursGuide: { ...f.parcoursGuide, titre: "Personnalisez votre verre", objet: "verre", objetArticle: "le verre" },
    tailles: { label: "Taille du verre", options: [
      { id: "37", title: "37 cl", sub: "tumbler évasé, Ø 8,5 × H 10 cm", image: "/produits/zz-maquette-tumbler-vierge.jpg", gallery: G37, engraveImage: "/produits/zz-maquette-tumbler-vierge.jpg", engrave: E37 },
      { id: "39", title: "39 cl", sub: "grand tumbler, Ø 7 × H 14,4 cm", image: "/produits/zz-maquette-tumbler39-vierge.jpg", gallery: G39, engraveImage: "/produits/zz-maquette-tumbler39-vierge.jpg", engrave: E39 },
    ] },
    variants: [
      { id: "verre-tumbler-1", title: "À l'unité", price: 19.90, weight: 600, taille: "37" },
      { id: "verre-tumbler-2", title: "Lot de 2", price: 37.90, weight: 1100, taille: "37" },
      { id: "verre-tumbler-4", title: "Lot de 4 — livraison offerte", price: 71.90, weight: 2000, taille: "37" },
      { id: "verre-tumbler-39-1", title: "À l'unité", price: 19.90, weight: 600, taille: "39" },
      { id: "verre-tumbler-39-2", title: "Lot de 2", price: 37.90, weight: 1100, taille: "39" },
      { id: "verre-tumbler-39-4", title: "Lot de 4 — livraison offerte", price: 71.90, weight: 2000, taille: "39" },
    ],
    descriptionHtml: `<div class="pd2"><p class="pd2-lead"><strong>Un verre en cristal sans pied, gravé à votre façon dans notre atelier.</strong></p><p class="pd2-occ">Pour le whisky, un cocktail, l’eau ou le vin. Idéal pour un mariage, un anniversaire, la Fête des pères ou un cadeau d’entreprise.</p><h3>Deux tailles</h3><div class="pd2-sizes"><div class="pd2-size"><b>37 cl</b><span>tumbler évasé en cristal sans plomb, Ø 8,5 cm, hauteur 10 cm.</span></div><div class="pd2-size"><b>39 cl</b><span>grand tumbler en cristal sans plomb, Ø 7 cm, hauteur 14,4 cm.</span></div></div><h3>Quatre façons de le graver</h3><div class="pd2-ways"><div class="pd2-way"><p class="pd2-wt"><i>1</i><b>Un modèle</b></p><span>40 modèles numérotés, avec vos prénoms si vous le souhaitez.</span></div><div class="pd2-way"><p class="pd2-wt"><i>2</i><b>Une lettre fleurie</b></p><span>votre initiale, avec un prénom au milieu.</span></div><div class="pd2-way"><p class="pd2-wt"><i>3</i><b>Votre texte</b></p><span>un prénom, une date, un message, dans l’une de nos 8 écritures.</span></div><div class="pd2-way"><p class="pd2-wt"><i>4</i><b>Votre photo ou votre logo</b></p><span>un dessin, une photo, le logo de votre bar ou de votre entreprise.</span></div></div><h3>Bon à savoir</h3><table class="pd2-spec"><tbody><tr><th>Formats</th><td>À l’unité, par 2 ou par 4, dans les deux tailles.</td></tr><tr><th>Gravure</th><td>Gravure laser permanente : elle résiste au lave-vaisselle.</td></tr><tr><th>Aperçu</th><td>L’aperçu de votre gravure s’affiche sur le verre avant de commander.</td></tr><tr><th>Emballage</th><td>Emballage protégé, gravé en France dans notre atelier.</td></tr><tr><th>Livraison</th><td>Livraison offerte dès 60 € d’achat.</td></tr></tbody></table></div>`,
    voletVerres: [["Gravure", "Quatre façons de graver : un modèle (40 modèles numérotés), une lettre fleurie, votre texte dans l’une de nos 8 écritures, ou votre photo ou votre logo. L’aperçu se met à jour pendant que vous choisissez."], ["Modèles", "Sur un modèle, les prénoms et la date sont gravés dans l’écriture du modèle."], ["Entretien", "Va au lave-vaisselle : la gravure ne bouge pas. Évitez les chocs thermiques (pas du congélateur à l’eau chaude)."]],
  });
}

// --- Helpers ----------------------------------------------------------------
'''.replace("__G37__", json.dumps(G37)).replace("__G39__", json.dumps(G39))
open(p, 'w').write(s.replace(m, add))
p = 'src/lib/productInfo.js'; s = open(p).read()
mk = '  "verre-a-whisky-grave": {'
info = '''  "verre-tumbler-cristal-grave": {
    material: `Verre tumbler en cristal

- Cristal sans plomb, deux tailles : 37 cl (Ø 8,5 cm, hauteur 10 cm) ou grand 39 cl (Ø 7 cm, hauteur 14,4 cm).
- Paroi lisse idéale pour une gravure laser nette et précise.
- Va au lave-vaisselle (la gravure ne s'efface pas).`,
    usage: `Personnalisation
- Un modèle numéroté, une lettre fleurie, votre texte, votre photo ou votre logo.

Entretien
- Lavage à la main recommandé pour préserver la brillance, lave-vaisselle possible.
- Évitez les chocs thermiques (ne pas passer du congélateur à l'eau chaude).`,
    returns: `Produit personnalisé après gravure — non remboursable

Annulation
- Dans les 24 h suivant la commande, avant le démarrage de la gravure : annulation possible.
- Après gravure : non remboursable (personnalisation unique, article L221-28).`,
  },
'''
open(p, 'w').write(s.replace(mk, info + mk, 1))
print("patch ok")
