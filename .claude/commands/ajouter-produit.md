---
description: Rechercher, configurer et publier un nouveau produit sur la boutique Niv Création
---

Tu vas ajouter un nouveau produit à la boutique Niv Création, en suivant
**scrupuleusement** le guide `CLAUDE.md` (schéma produit, champs de gravure,
catégories, livraison, ton).

Produit à ajouter (fourni par l'utilisatrice) :

$ARGUMENTS

Étapes :
1. Analyse ce qui est fourni (texte, lien, photo). Si un lien fournisseur/Etsy
   est donné, extrais matière, dimensions, options et prix.
2. Si des informations utiles manquent, **recherche sur Internet** (matériaux,
   dimensions, bonnes pratiques de personnalisation pour ce type de produit).
3. Détermine : `category`, `subcategory` (si bijou), `type`, `tagline`, `title`,
   prix et `variants`, `weight`, `letter`, `pickup`, les `personalizationFields`
   (nombre de faces gravables, police, couleur, photo…), et une `descriptionHtml`
   soignée.
4. Récupère/choisis des **images** (URLs hébergées ; outils MCP Shopify si dispo).
5. Ajoute l'objet produit dans `src/lib/products.js` et une entrée dans
   `src/lib/productInfo.js` (material / usage / returns).
6. Lance `npm run build` et corrige toute erreur.
7. Commit puis `git push origin claude/site-product-overview-1t2de`.
8. Donne à l'utilisatrice l'URL `/produit/<slug>` et demande-lui de vérifier.

Règle d'or : en cas d'ambiguïté (faces gravables, prix, couleurs), **pose la
question à l'utilisatrice** avant de publier — n'invente pas.
