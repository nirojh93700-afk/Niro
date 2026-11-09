p="src/lib/products.js"; s=open(p,encoding="utf-8").read()
imgs=",\n".join(f'      "{i}": "/produits/noel/noel-{i:02d}.jpg"' for i in range(1,28))
prod='''  {
    // ===== Décoration de Noël ronde en cristal à graver (mise en ligne le 09/11/2026, « Mets en cristal et applique »).
    slug: "decoration-noel-verre-gravee",
    badge: "Nouveau",
    name: "Décoration de Noël en cristal gravée",
    weight: 120,
    pickup: false,
    letter: false, // cristal : part en colis, bien calé
    cardImage: "/produits/deco-noel-verre-vierge.jpg",
    title: "Décoration de Noël ronde en cristal gravée, ruban bleu",
    category: "deco",
    subcategory: "table",
    type: "Décoration de Noël personnalisée",
    tagline: "Un disque de cristal biseauté de 10 cm, gravé d'un dessin de Noël, d'un prénom ou d'une date, à suspendre au sapin.",
    personalizable: true,
    personalizationLabel: "Un dessin de Noël, votre texte ou votre photo",
    images: [
      "/produits/deco-noel-verre-vierge.jpg",
      "/produits/deco-noel-cristal-ex-1.jpg",
      "/produits/deco-noel-cristal-ex-2.jpg",
      "/produits/deco-noel-cristal-ex-3.jpg",
      "/produits/deco-noel-cristal-ex-4.jpg",
      "/produits/deco-noel-cristal-exemple.jpg",
      "/produits/deco-noel-verre-boite.jpg",
    ],
    engraveImage: "/produits/deco-noel-verre-vierge.jpg",
    engrave: {
      box: { top: 0.40, left: 0.30, width: 0.40, height: 0.36 },
      widthMm: 70, maxWidthFrac: 0.40, minWidthFrac: 0.10,
    },
    styleImages: {
''' + imgs + '''
    },
    personalizationFields: [
      { key: "numstyle", type: "stylepicker", optional: true, label: "Choisissez votre dessin de Noël",
        variantContains: "dessin", groups: [
        { label: "Dessins de Noël (1–16)", nums: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"] },
        { label: "Mots de Noël (17–25)", nums: ["17","18","19","20","21","22","23","24","25"] },
        { label: "Dessins de Noël (26–27)", nums: ["26","27"] },
      ] },
      { key: "photo", type: "photo", label: "Votre photo ou votre logo", variantContains: "photo",
        text: "La photo est gravée en blanc givré dans le cristal. Une image nette et bien éclairée donne le meilleur résultat." },
      { key: "texte", label: "Le texte à graver", placeholder: "Ex. Joyeux Noël Camille", maxLength: 40, variantContains: "Mon texte" },
      { key: "texte", label: "Ajouter un texte (compris)", placeholder: "Ex. Joyeux Noël Camille", maxLength: 40, optional: true, variantContains: "dessin" },
      { key: "texte", label: "Ajouter un texte (compris)", placeholder: "Ex. Notre premier Noël", maxLength: 40, optional: true, variantContains: "photo" },
      { key: "date", label: "Ajouter une date (+3 €)", placeholder: "Ex. Noël 2026", maxLength: 20, optional: true },
      { key: "police", type: "font", label: "Police du texte", optional: true },
      { key: "boite", type: "select", label: "Boîte bleue", optional: true, options: [
        { value: "non", label: "Sans boîte" },
        { value: "oui", label: "Dans sa boîte bleue avec mousse (+3,90 €)" },
      ] },
    ],
    variants: [
      { id: "deco-noel-verre-dessin", title: "Un dessin de Noël", price: 21.90 },
      { id: "deco-noel-verre-texte", title: "Mon texte", price: 16.90 },
      { id: "deco-noel-verre-photo", title: "Ma photo ou mon logo", price: 21.90 },
    ],
    engravingPricing: { flatExtras: [
      { key: "date", amount: 3 },
      { key: "boite", value: "oui", amount: 3.9, weight: 60 },
    ] },
    descriptionHtml: `<p><strong>Une décoration de Noël en cristal, gravée dans notre atelier.</strong> Un disque rond de 10 cm au bord biseauté, suspendu à un ruban de satin bleu : on y grave un de nos dessins de Noël, un prénom, une date ou votre photo. Accroché au sapin, il attrape la lumière des guirlandes.</p>
<h3>Caractéristiques</h3>
<ul>
<li><strong>Matière :</strong> cristal transparent au bord biseauté</li>
<li><strong>Taille :</strong> 10 cm de diamètre</li>
<li><strong>Ruban :</strong> satin bleu, prêt à suspendre</li>
<li><strong>Gravure :</strong> au laser, en blanc givré dans le cristal. 16,90 € avec un texte ; 21,90 € avec un dessin de Noël ou votre photo, texte compris ; une date en plus : +3 €</li>
<li><strong>En option :</strong> la boîte bleue avec mousse, prête à offrir</li>
</ul>
<p>Chaque décoration est gravée à la commande.</p>`,
  },
'''
anchor='  {\n    // ===== Support téléphone en bois gravé'
assert anchor in s
s=s.replace(anchor,prod+anchor,1); open(p,"w",encoding="utf-8").write(s)
pi="src/lib/productInfo.js"; t=open(pi,encoding="utf-8").read()
a='  "support-telephone-bois-grave": {'
add='''  "decoration-noel-verre-gravee": {
    material:
      "Cristal transparent, disque rond de 10 cm au bord biseauté.\\nRuban de satin bleu, prêt à suspendre.\\nGravure au laser dans notre atelier : elle ressort en blanc givré dans le cristal.",
    usage:
      "Choisissez ce que vous voulez faire graver : un de nos 27 dessins de Noël, votre texte, ou votre photo / votre logo.\\nUn texte est compris (prénom, petit mot), dans la police de votre choix. Avec un dessin de Noël ou votre photo : 21,90 €, texte compris. Une date en plus : +3 €.\\nEntretien : un chiffon doux et sec. Le cristal est fragile : manipulez-le avec soin.",
    returns:
      "Expédiée en colis, bien calée.\\nPièce personnalisée : gravée à la commande, elle ne peut être ni reprise ni remboursée (article L221-28 du Code de la consommation). Relisez bien votre texte avant de valider.",
  },
'''
assert a in t; t=t.replace(a,add+a,1); open(pi,"w",encoding="utf-8").write(t)
d="src/lib/productDates.js"; u=open(d,encoding="utf-8").read()
a2='  "support-telephone-bois-grave": "2026-08-20",'
assert a2 in u
u=u.replace(a2,'  "decoration-noel-verre-gravee": "2026-11-09",\n'+a2,1); open(d,"w",encoding="utf-8").write(u)
print("ok")
