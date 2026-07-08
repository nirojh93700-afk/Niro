# RECETTE ETSY — comment mettre un produit sur Etsy (à réutiliser)

> Quand la gérante dit « mets ce produit sur Etsy », suivre CETTE recette.
> Méthode : la gérante utilise **Claude pour Chrome** (extension sur son navigateur).
> Nous (ici, dans le code) on ne touche PAS à Etsy — on **prépare un TEXTE** qu'elle
> colle dans Claude pour Chrome, qui remplit les fiches Etsy à sa place.
> Boutique Etsy : **NivCreationArtisanat** (etsy.com/your/shops/me/tools/listings).

## 1. RÈGLE DE PRIX ETSY — **+45 %** (très important)
Le prix Etsy = **prix du site × 1,45**, arrondi au **,90** supérieur.
Le +45 % couvre : **frais Etsy** (~14 % : commission 6,5 % + paiement ~4 % + réglementaire ~1 % + mise en vente) **+ la remise boutique de 10 %** + **les pubs Etsy** (~13 %).
Formule : `etsy = arrondi_au_0,90_supérieur(prix_site × 1,45)`.
La gérante met ensuite une **remise boutique de 10 %** (Etsy → Marketing → Ventes & réductions) — grâce à la majoration elle reste gagnante.

**Prix Etsy des cristaux (déjà calculés) :**
| Produit | Site | Etsy (+45 %) |
|---|---|---|
| Bloc Petit | 39,90 | **57,90** |
| Bloc Moyen | 59,90 | **86,90** |
| Bloc Grand | 99,90 | **144,90** |
| Bloc XL | 149,90 | **217,90** |
| Pyramide | 39,90 | **57,90** |
| Trophée | 69,90 | **101,90** |
| Porte-clés cœur | 24,90 | **36,90** |
| Porte-clés rectangle | 22,90 | **33,90** |
| Clé USB cristal | 17,90 | **26,90** |
| Socle petit (carré) | 14,90 | **21,90** |
| Socle grand (rectangle) | 19,90 | **28,90** |

Positionnement : ces prix placent la boutique en **gamme premium** (comme Artpix3D/Masterpics), au-dessus des vendeurs discount. Assumé (fait main France).

## 2. STRUCTURE DU TEXTE À DONNER À CLAUDE POUR CHROME
Toujours inclure :
- **Rôle** : « tu crées mes fiches Etsy en recopiant mon site nivcreation.fr ».
- **Règles** : FRANÇAIS, ton élégant, **PAS d'emojis** dans le contenu ; produits **personnalisés = faits à la commande** ; **ENREGISTRE EN BROUILLON**, ne publie RIEN sans accord ; fiches **une par une** ; si un champ bloque, demander (ne pas inventer).
- **Prix** : utiliser le prix Etsy (+45 %), PAS celui du site.
- **Photos** : « garde MON SITE ouvert dans un onglet → sur la page produit, clic droit → Enregistrer l'image → reviens sur Etsy → charge les fichiers (3-5 photos) ». Si échec, la gérante les met à la main.
- **Personnalisation** (cristaux) : champ « Photo à graver » = Téléchargement de fichier, **obligatoire**, 1 fichier. Instructions (≤120 car) : « Photo nette et bien éclairée, visage(s) bien visible(s), min. 1280×960 px. Évitez les photos sombres ou floues. »
- **Variations** (tailles) avec prix Etsy par taille.
- **Tags** (13 max, FR), **Matériaux** (cristal optique K9…), **Catégorie**, **Livraison** (voir §4).
- Fin : « préviens-moi quand c'est fait ».
- **INTERDICTION** systématique : ne modifier AUCUN autre produit ni réglage (surtout PAS les bijoux ni leurs prix).

Exemples de textes prêts dans ce dossier : `etsy-blocs-claude-chrome.txt`, `etsy-socle-claude-chrome.txt`, `etsy-livraison-claude-chrome.txt`, `etsy-socle-option-bloc.txt`.

## 3. SOCLE EN OPTION (add-on payant) — méthode Etsy
Etsy ne fait PAS « +X € ». Deux façons :
- **A. Fiche socle SÉPARÉE (recommandé, simple)** : le socle est sa propre fiche, 2 variantes (petit 21,90 / grand 28,90). Dans la description du bloc : « socle disponible séparément ».
- **B. Socle EN OPTION sur le bloc** : 2 variations (Taille + « Socle » avec « Sans socle »/« Avec socle LED »), activer **« les prix varient » sur les 2 variations** → remplir **8 prix TOTAUX** (prix complet, pas un supplément) :
  Petit 57,90 / 79,80 · Moyen 86,90 / 115,80 · Grand 144,90 / 173,80 · XL 217,90 / 246,80.
  (socle = +21,90 sur Petit, +28,90 sur les autres). Long à la main → Claude pour Chrome le fait.

## 4. LIVRAISON ETSY (profils par type)
Ne JAMAIS laisser le tarif « bijoux » par défaut sur du lourd. Créer des profils :
- **Blocs cristal (lourds)** : France **12,90 €** · Union Européenne **29,90 €** · reste du monde désactivé (ou 49,90). Article suppl. +8 € (FR) / +18 € (EU). Délai fabrication **1-2 semaines**.
  Poids/dims par taille : Petit 0,75 kg 8×5×5 · Moyen 1,1 kg 10×6×5 · Grand 1,8 kg 12×8×6 · XL 2,8 kg 15×10×6.
- **Socle / accessoire léger (~300-550 g)** : France **6,90 €** · Europe **14,90 €**. Délai **1-3 jours**.
- **Bijoux (légers)** : tarif lettre/petit colis (bas), profil bijoux existant.

## 5. DONNÉES PRODUITS (source)
Le flux `https://nivcreation.fr/flux-google.xml` liste **tous les produits** (titre, description, prix, image, id=slug) → source pour générer les listes. 45 produits : 15 bijoux, 23 cadeaux (dont cristaux), 7 mariage.
Page produit = `https://nivcreation.fr/produit/<slug>` (Claude pour Chrome l'ouvre pour recopier).

## 6. ORDRE DE DÉPLOIEMENT (décidé par la gérante)
On fait par lots : d'abord **les blocs**, puis socle, puis pyramide/porte-clés, puis bijoux/mariage. Toujours en **brouillon**, la gérante vérifie + ajoute les photos manquantes, puis publie.
