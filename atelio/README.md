# Atelio — projet (étude de marché + site + concept d'app)

**Atelio** : place de marché internationale de la **création personnalisée à la
demande**. On y commande un objet sur-mesure à un artisan (bijou gravé, déco,
cadeau…), on suit sa fabrication en direct, on est livré partout dans le monde.
C'est le modèle de boutique de Niv Création transformé en **plateforme** (à
revendre / exploiter en ligne), avec une **application mobile**.

> La marque (« Atelio ») et la palette (marron / terracotta — le « marron »
> demandé) sont volontairement faciles à changer.

## Contenu du dossier

| Chemin | Description |
|---|---|
| `docs/etude-de-marche.md` | **Étude de marché** chiffrée (taille, croissance, concurrents, modèle économique, go-to-market) avec sources réelles. |
| `docs/concept-application-mobile.md` | **Concept d'application mobile** (parcours client + créateur, fonctions, stack, feuille de route). |
| `site/index.html` | **Site web** complet (vitrine + démo marketplace), bilingue FR/EN. |
| `site/styles.css` | Thème marron/terracotta, responsive. |
| `site/app.js` | Traduction FR/EN, aperçu de gravure en direct, animations, formulaire d'inscription. |

## Voir le site

Aucune installation : ouvrez `site/index.html` dans un navigateur.
Ou servez le dossier :

```bash
cd atelio/site
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

Le site est **statique et autonome** : il peut être déployé tel quel (Netlify,
Vercel, GitHub Pages, n'importe quel hébergeur) ou revendu.

## Points clés du site
- **Bilingue FR / EN** (bouton en haut à droite) — angle international.
- **Aperçu de gravure en direct** (section « Aperçu en direct ») — le
  différenciateur produit.
- **Démo du flux mobile** (3 écrans : découverte → personnalisation → suivi).
- **Tarifs créateurs** (commission) illustrant le modèle économique de la plateforme.

## Pour aller plus loin (si validé)
Brancher le site sur le vrai catalogue/paiement : l'infrastructure existe déjà
côté Niv Création (Next.js + Stripe + e-mails + suivi + assistant IA). Atelio est
surtout un **changement de modèle** (boutique → marketplace), pas un développement
de zéro. Détails dans `docs/etude-de-marche.md` §10.
