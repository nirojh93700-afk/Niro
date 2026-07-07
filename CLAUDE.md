# Guide agent — Boutique Niv Création

## 🚚 INTÉGRATION BOXTAL (point relais / transporteurs) — CONNEXION RÉSOLUE (03/07/2026)
> API v3 Boxtal. La connexion fonctionne : ne PAS repartir de zéro.
- **Auth = OAuth client_credentials en Basic Auth** sur `POST https://api.boxtal.com/iam/account-app/token` (test : `api.boxtal.build`). Renvoie `{accessToken}` (JWT, ~1h).
- **PIÈGE qui a coûté cher** : le login/mot de passe de l'auth = la **« clé d'accès »** + la **« clé secrète »** de l'app (PAS l'`app-…` ID !). Sur developer.boxtal.com → l'app a 3 valeurs : *ID application* (`app-…`, inutile pour l'auth), *clé d'accès* (login), *clé secrète* (password). Basic = base64(cléAccès:cléSecrète).
- **Clés stockées** dans `settings.boxtal` : `appId` = clé d'accès, `appSecret` = clé secrète (voir `getBoxtalCreds()`/`updateBoxtal()` dans `stock.js`). Saisies dans **Gestion → Réglages** (composant `BoxtalKeys`). Activation + prix dans **Gestion → Livraison** (`ShippingAdmin`).
- **Appels API** : `Authorization: Bearer <accessToken>`. Endpoints v3 utiles : `GET /shipping/v3.1/content-category` · `GET /shipping/v3.2/parcel-point-by-network` (carte points relais) · `POST /shipping/v3.1/shipping-order` (créer expédition) · `GET /shipping/v3.1/shipping-order/{id}/shipping-document` (étiquette PDF) · `GET .../tracking`.
- **Outil de diag** : `/api/admin/boxtal-test` (admin) pour tester la connexion.
- **Reste à construire** : lib client Boxtal (token caché + cotation par poids + points relais), sélecteur transporteur/point relais sur la page panier (Stripe hébergé ne peut pas afficher de carte → choix AVANT paiement), création expédition au webhook, bouton « imprimer l'étiquette » sur la page commande admin. Règle prix : max(4,90 €, coût réel Boxtal + petite marge).

### Boxtal — découvertes du 04/07/2026 (à réutiliser)
- **2 apps** : une **API v1** (pour les PRIX/devis) + une **API v3** (relais/commande/étiquette). Chacune a *clé d'accès* + *clé secrète* (l'App ID `app-…` n'est PAS l'auth). Les DEUX s'authentifient sur `/iam/account-app/token`.
- ⚠️ **v3 ne fait PAS de devis/prix** (dit noir sur blanc dans leur doc : « pas possible en v3, évolution future → utiliser l'API v1 »). Donc **prix auto par poids = API v1** (endpoint pas encore trouvé : `envoimoinscher.com/api/v1/cotation` → 405, `api.boxtal.com/api/v1/…` → 403 WAF ; à creuser via la doc v1).
- ⚠️ **Créer une commande exige que le compte Boxtal ait le « paiement différé par prélèvement » activé** (sinon impossible). Créer une vraie commande en prod = **facturé** → tester en env test `api.boxtal.build` avec un compte de test.
- **Codes d'offres** (POST shipping-order, champ `shippingOfferCode`) : Mondial Relay point relais = `MONR-CpourToi` · Mondial domicile = `MONR-DomicileFrance` · Colissimo point retrait = `POFR-ColissimoPickupStation` · Colissimo domicile = `POFR-ColissimoAccess`/`POFR-ColissimoExpert` · Colis Privé relais = `COPR-CoprRelaisRelaisNat` · Chrono Shop2Shop = `CHRP-ChronoShoptoShop` · Relais Colis = `SOGP-RelaisColis` · UPS relais = `UPSE-StandardAccessPoint`.
- **Structure `POST /shipping/v3.1/shipping-order`** (reconstituée par les erreurs 422) : `{ shippingOfferCode, shipment: { fromAddress, toAddress, returnAddress, packages[] } }`. Chaque *address* = `{ type, contact, location }`. Chaque *package* = `{ length, width, height, weight (>0), value }`. Reste à trouver les sous-champs exacts de contact/location/type/value (itérer sur les 400/422). Étiquette = via webhook `DOCUMENT_CREATED` ou `GET /shipping-order/{id}/shipping-document`.
- **Points relais (marche)** : `GET /shipping/v3.2/parcel-point-by-shipping-offer?shippingOfferCode=MONR-CpourToi&type=ARRIVAL&countryIsoCode=FR&zipCode=…&city=…` (ou `parcel-point-by-network` avec `searchNetworks`).

### ÉTAT ACTUEL & REPRISE (décision de la gérante, 04/07)
- **OPTION B active** (choix de la gérante) : au paiement, option « Livraison en point relais — 4,90 € » (fixe, réglable dans Gestion → Livraison). La gérante crée/imprime l'étiquette **elle-même sur boxtal.com** (paiement carte/PayPal). **Rien d'autre à faire, ça marche.**
- **OPTION A « tout depuis mon site » = à construire PLUS TARD** (quand elle aura du volume). Checklist de reprise :
  1. **Elle** : activer sur Boxtal le **« paiement différé par prélèvement »** (Moyen de paiement → mandat SEPA, IBAN+BIC). Sans ça, création d'étiquette impossible.
  2. **Moi** : lib `src/lib/boxtal.js` (token caché via `/iam/account-app/token` en Basic base64(cléAccès:cléSecrète), clés dans `settings.boxtal` via `getBoxtalCreds()`).
  3. **Moi** : sur la **page panier**, sélecteur de point relais (carte) via `parcel-point-by-shipping-offer` (Stripe hébergé ne peut pas → choisir AVANT Stripe), stocker le point relais choisi sur la commande.
  4. **Moi** : bouton **« Imprimer l'étiquette »** sur la fiche commande admin → `POST /shipping/v3.1/shipping-order` (structure ci-dessus, finir de découvrir contact/location/type/value via les erreurs 422/400) → étiquette via webhook `DOCUMENT_CREATED` (souscription) ou `GET /shipping-order/{id}/shipping-document`.
  5. **Tester en env test** `api.boxtal.build` (compte test) pour ne pas créer de vraies étiquettes facturées.
  - **Prix auto par poids (v1)** = OPTIONNEL (la gérante est OK avec le prix fixe). L'app v1 existe (clés sur son compte Boxtal) mais l'endpoint cotation v1 reste à trouver ; non nécessaire pour l'Option A.


## 🎬 RECETTE VIDÉO PUB (à refaire pareil à chaque demande de vidéo)
> Quand l'utilisatrice demande une vidéo/pub, produire CE style par défaut. Si elle dit « améliore », améliorer sur cette base.
Scripts prêts : **`tools/video/pub_gratuite.py`** (montage GRATUIT, 0 crédit) et **`tools/video/pub_ia_higgsfield.py`** (clips animés par l'IA Higgsfield, payant).
- **Outils (gratuits, à réinstaller après un redémarrage du conteneur)** : `pip install Pillow imageio imageio-ffmpeg gTTS numpy` (ffmpeg via `imageio_ffmpeg.get_ffmpeg_exe()`). Voix FR = gTTS (gratuit).
- **Style imposé** : format **vertical 1080×1920** (mobile/reels) ; **rythme RAPIDE et vivant** (segments ~2,2 s, coupures nettes) ; **zoom dynamique** sur chaque photo ; **beat rythmé** (~112 BPM) + nappe douce ; **voix off FR accélérée** (atempo 1,12 — moins « endormie ») ; **sous-titres** + nom du produit (pas de prix) ; carte d'intro « NiV CRÉATION » + carte finale **nivcreation.fr / Fait main en France** ; couleurs marque (or #c9a24b, crème, encre) ; police titres = DejaVuSerif-Bold.
- **Photos** : télécharger depuis `https://nivcreation.fr/produits/<fichier>` (marche même si le dépôt local est vide).
- **Sortie** : ré-encoder LÉGER + faststart (`scale=720:1280`, crf 26, `-movflags +faststart`) → ~3-6 Mo, facile à ouvrir sur téléphone. Toujours l'envoyer via SendUserFile.
- **Varier les produits** à chaque fois (ne pas reprendre toujours les mêmes) ; possibilité d'ajouter d'autres produits sur demande.
- **À CHAQUE vidéo** : joindre une **description** + des **tags** (format Insta, ~10 hashtags).
- **CRÉDITS Higgsfield = payant** : ne JAMAIS lancer sans confirmer, annoncer le coût (`get_cost:true` preflight, ~7,5 crédits/clip 5 s), et attendre l'accord. Le montage gratuit (`pub_gratuite.py`) est la version par défaut.

---

Ce fichier explique à **tout agent Claude** comment travailler sur ce dépôt,
et surtout **comment ajouter un produit correctement et le publier**.

> Objectif : quand l'utilisatrice donne un produit (photo, description, lien
> Etsy/fournisseur), l'agent recherche les infos, remplit le bon format, vérifie
> que le site compile, puis commit + push. Netlify redéploie automatiquement.

---

## 1. Stack & déploiement
- **Next.js 14** (App Router, JavaScript) + **Stripe** (paiement) + **Resend** (e-mails).
- Hébergé sur **Netlify** : un `git push` sur la branche de déploiement déclenche
  un redéploiement automatique (~2-3 min).
- **Branche de déploiement : `claude/site-product-overview-1t2de`.** Toujours
  commit/push dessus (sauf consigne contraire de l'utilisatrice).
- Avant de pousser : **toujours** lancer `npm run build` pour vérifier qu'il n'y
  a pas d'erreur.

## 2. Carte des fichiers
| Fichier | Rôle |
|---|---|
| `src/lib/products.js` | **TOUS les produits** (la source à éditer pour ajouter/modifier) |
| `src/lib/productInfo.js` | Infos détaillées par produit (Taille & Matériaux, Entretien, Expédition & Retour) |
| `src/lib/fonts.js` | Palette des 8 polices de gravure |
| `src/lib/shipping.js` | Frais de livraison (forfaits, paliers) |
| `src/components/ProductDetail.jsx` | Fiche produit (rend les champs de gravure) |
| `src/app/boutique/page.jsx` | Catalogue + filtres catégories/sous-catégories |
| `docs/PERSONNALISATION-GRAVURE-3D.md` | **Guide gravure + aperçu 3D** (motifs, 3D, recette nouveau produit) |
| `docs/couts-cristal-alibaba.md` | **Coûts d'achat gamme CRISTAL 3D** (reçu Alibaba avr. 2026 : coût rendu par taille, transport compris) |
| `docs/cristal-3d-plan.md` | **DOSSIER Cristal 3D** (plan de vente : achats, prix concurrents, prix conseillés, mise en page fiche, marketing, plan d'action — en cours, gravure à trancher) |

## 3. Schéma d'un produit (`src/lib/products.js`)
Chaque produit est un objet du tableau `products`. Champs :

```js
{
  slug: "mon-produit",                 // identifiant URL unique (minuscules, tirets)
  name: "Nom court",                   // affiché sur les vignettes
  weight: 150,                          // poids EMBALLÉ en grammes (frais de port)
  pickup: false,                        // true = remise en main propre possible (déco bois/mariage)
  letter: true,                         // true = expédiable en Lettre Suivie (léger & fin < 3 cm : bijoux, petits objets)
  subcategory: "femme",                // UNIQUEMENT pour les bijoux : "femme" ou "homme"
  title: "Titre long et SEO",          // titre de la fiche + balise <title>
  category: "bijoux",                  // "bijoux" | "mariage" | "cadeaux"
  type: "Collier personnalisé",        // type affiché (chip sur la vignette)
  tagline: "Phrase d'accroche courte.",
  personalizable: true,
  personalizationLabel: "Résumé de la personnalisation",
  personalizationFields: [ /* voir §4 */ ],
  images: [                             // URLs hébergées (CDN Shopify ou Cloudinary)
    "https://cdn.shopify.com/.../photo1.jpg",
  ],
  variants: [                           // au moins une variante
    { id: "id-unique-variante", title: "Option", price: 24.90 },
  ],
  descriptionHtml: `<p>...</p>`,        // description riche (HTML : p, h3, ul, li, strong)
}
```

Règles importantes :
- **`id` de variante** : chaîne unique et stable (ex. `slug-option`). Sert au panier et au paiement.
- **Prix** : nombre en euros (point décimal), ex. `24.90`. Le site recalcule les prix côté serveur depuis ce fichier (sécurité).
- **Première variante = prix affiché** sur la vignette. Pour un tarif dégressif, mettre l'unité en premier, le lot ensuite.
- **`letter`/`pickup`/`weight`** pilotent la livraison (voir §6).

## 4. Champs de gravure (`personalizationFields`)
Liste de champs affichés sur la fiche. Types disponibles :
- `text` (défaut) : `{ key, label, placeholder, maxLength, optional }`
- `textarea` : pareil, pour plusieurs lignes (listes de prénoms, menu…)
- `select` : `{ key, type:"select", label, optional, options:[{value,label}] }`
- `font` : `{ key, type:"font", label, optional }` → menu déroulant des 8 polices (auto)
- `color` : `{ key, type:"color", label, optional, options:[{value:"#c9a24b",label:"Doré"}] }` → teinte l'aperçu
- `photo` : `{ key, type:"photo", label, optional, text }` → upload Cloudinary (sinon « envoyer par e-mail »)
- `note` : `{ key, type:"note", text }` → simple texte informatif, pas de saisie

Options communes :
- `optional: true` → champ facultatif (sinon obligatoire avant ajout au panier).
- `variantContains: "Recto-Verso"` → le champ n'apparaît **que** si le titre de la
  variante choisie contient ce texte (ex. afficher le verso seulement en recto-verso,
  ou la photo seulement pour l'option « Photo »).
- `maxLength` → limite de caractères (compteur affiché).

Un **aperçu de gravure en direct** s'affiche automatiquement dès qu'il y a un champ
texte : le texte saisi apparaît dans la **police** et la **couleur** choisies.

### Combien de faces graver ?
Configurer **exactement** le nombre de zones réellement gravables :
- 1 face → 1 champ texte. Recto-verso → 2 champs (le 2e avec `variantContains`).
- Plusieurs faces (ex. médaillon = 4) → un champ par face.
- En cas de doute, **demander à l'utilisatrice** le nombre de côtés gravables.

## 5. Catégories, sous-catégories & polices
- Catégories : `bijoux`, `mariage`, `cadeaux` (constante `CATEGORIES`).
- Sous-catégories : pour `bijoux` → `femme` / `homme` (constante `SUBCATEGORIES`).
  Pour en ajouter une nouvelle famille (ex. cristaux), ajouter à `CATEGORIES` et,
  si besoin, à `SUBCATEGORIES`, et mettre `category` (et `subcategory`) sur les produits.
- Polices de gravure (clé à utiliser dans un champ `font`) : `playfair`, `cinzel`,
  `cinzel-deco`, `montserrat`, `inter`, `great-vibes`, `allura`, `pacifico`.

## 6. Livraison (rappel)
Le site calcule **un seul frais** automatiquement (voir `src/lib/shipping.js`) :
- Panier 100 % `letter:true` → forfait lettre suivie (offert dès 45 € pour les bijoux).
- Dès qu'un article n'est pas `letter` (déco bois) → tarif colis par paliers de quantité.
- `pickup:true` → ajoute l'option « Remise en main propre » (7 €).
→ Bien renseigner `weight`, `letter`, `pickup` sur chaque nouveau produit.

**Poids AUTOMATIQUE par taille + options (maj 06/07/2026)** : le port se calcule sur le **poids réel du panier** (somme des poids × quantités), donc c'est correct pour plusieurs articles OU un mélange (bijou + bloc…), et automatique dès qu'un produit a un poids.
- **Poids par variante** : mettre `weight` (g, EMBALLÉ) **sur chaque variante** si les tailles pèsent différemment (ex. blocs cristal : petit 750 / moyen 1100 / grand 1800 / XL 2800). Repli : `product.weight`. Le checkout lit `variant.weight || product.weight`.
- **Poids d'une option** (ex. socle) : ajouter `weight` (et `weightByVariant`) sur l'entrée `engravingPricing.flatExtras` → ajouté au port quand l'option est prise (`engravingExtra().weight`).
- **Point relais** = grille par poids (`POINT_RELAIS_TIERS`). **Domicile** = max(tarif par quantité déco/verres, grille par poids `HOME_WEIGHT_TIERS`) → les colis lourds ne sont jamais sous-facturés, les petits produits ne changent pas.
- **POINT RELAIS MULTI-TRANSPORTEURS (maj 06/07/2026)** : le client voit sur la carte **tous les points relais** autour de lui, **tous transporteurs confondus** (Mondial Relay, Relais Colis, Colissimo point retrait, Chrono Shop2Shop, UPS — tous gérés par Boxtal), et clique sur le plus proche ; **le prix s'ajuste au transporteur du point choisi**. Transporteurs + grilles par poids = `RELAIS_CARRIERS` dans `shipping.js` (chaque point porte `carrier`/`carrierName`/`offer`). `/api/relais` interroge tous les transporteurs en parallèle et fusionne les points (repli sûr : ceux qui ne remontent rien n'apparaissent pas). Le `RelaisPicker` affiche le nom du transporteur + le prix par point ; le checkout facture via `relaisCarrier` (tarif au poids du transporteur, jamais perdant) et enregistre le transporteur + le point sur la commande. Pour ajouter/retirer un transporteur : éditer `RELAIS_CARRIERS` (il doit aussi être activé sur Boxtal). Onglet « Transporteurs relais » du fichier Excel.
- **EUROPE (maj 06/07/2026)** : livraison hors France gérée par **zone + poids** (`shippingZone(country)` + `EU_TIERS` dans `shipping.js`). Zones : **EU1** (BE/LU/NL/DE), **EU2** (ES/IT/PT), **CH** (Suisse). Le client choisit son **pays sur la page panier** (`COUNTRIES`) → envoyé au checkout (`country`) → `buildShippingOptions({country})` renvoie le tarif Europe (à domicile uniquement) ; l'adresse Stripe est verrouillée sur le pays choisi (`allowedCountries`). **France + Monaco = tarifs habituels inchangés.** Grille complète : onglet « Livraison Europe » du fichier Excel `docs/Niv-Creation-Prix-et-Port.xlsx`. Point relais Europe = à ajouter plus tard si besoin.

**Tarifs modifiables dans l'admin (maj 03/07/2026)** : page **Gestion → Réglages → 🚚 Livraison
(tarifs)** (`src/components/admin/ShippingAdmin.jsx`). Tous les montants (bijoux, seuil offert,
paliers déco, paliers verres, retrait) sont stockés en réglages (`settings.shipping`, sanitizé
dans `/api/admin/settings`) et appliqués au checkout via `resolveShippingConfig()` — repli sûr
sur les constantes du code si un champ est vide/invalide. La barre « livraison offerte » du
panier (`FreeShippingBar`) lit le seuil via `/api/shipping-config` ; la FAQ le lit côté serveur.
Les valeurs de `shipping.js` restent les tarifs PAR DÉFAUT (bouton « Rétablir » dans l'admin).

## 7. Infos détaillées (`src/lib/productInfo.js`)
Pour une fiche complète, ajouter une entrée `"slug": { material, usage, returns }`
(texte libre, sauts de ligne conservés) :
- `material` : Taille & Matériaux
- `usage` : Personnalisation & Entretien
- `returns` : Expédition & Retour (politique adaptée au produit)

## 8. Photos
- Utiliser des **URLs hébergées** (https). Sources possibles : CDN Shopify de la
  boutique, ou Cloudinary (compte de l'utilisatrice).
- Pour récupérer les vraies photos d'un produit déjà sur Shopify, utiliser les
  outils MCP Shopify (`get-product` / `search_products`) si disponibles.

## 9. Ton & style
- Tout en **français**, élégant, soigné. **Pas d'emojis** dans le contenu du site.
- Descriptions structurées (accroche en gras, sections `<h3>`, listes `<ul>`).

---

## 10. PROCÉDURE — Ajouter un produit (à suivre par l'agent)
1. **Comprendre** le produit fourni (photo / description / lien). Si un lien
   fournisseur/Etsy est donné, en extraire matière, dimensions, options, prix.
2. **Rechercher sur Internet** si besoin (matériaux, dimensions standard, bonnes
   pratiques de personnalisation pour ce type de produit).
3. **Déterminer** : catégorie, sous-catégorie (si bijou), type, prix, variantes,
   `weight`, `letter`, `pickup`, et les **champs de gravure** (nb de faces, police,
   couleur, photo…).
4. **Ajouter** l'objet produit dans `src/lib/products.js` (et une entrée dans
   `src/lib/productInfo.js`).
5. **Vérifier** : `npm run build` doit réussir (corriger toute erreur).
6. **Publier** : `git add -A && git commit -m "Ajout produit : <nom>"` puis
   `git push origin claude/site-product-overview-1t2de`.
7. **Confirmer** à l'utilisatrice l'URL de la fiche (`/produit/<slug>`) et lui
   demander de vérifier (rappel : recharger en navigation privée, le déploiement
   prend 2-3 min).

> En cas d'information manquante ou ambiguë (nombre de faces gravables, prix,
> couleurs disponibles…), **poser la question à l'utilisatrice** plutôt que d'inventer.

---

## 11. ÉTAT DU PROJET — confirmé par l'utilisatrice (à lire avant de reposer des questions)
> Ces points ont déjà été confirmés. **Ne pas les redemander.** Mettre à jour cette
> section quand l'utilisatrice confirme un nouvel élément.

- **Stripe : en mode RÉEL (Live).** Les vrais paiements fonctionnent. (Confirmé.)
- **Frais de port : corrects.** Les tarifs de livraison correspondent. (Confirmé.)
- **Variables d'environnement Netlify configurées** : `STRIPE_SECRET_KEY` + webhook (live),
  `RESEND_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `CONTACT_EMAIL`, `ANTHROPIC_API_KEY`,
  `ANTHROPIC_MODEL`, `NEXT_PUBLIC_SITE_URL`.
- **Assistant admin (Claude)** : activé et fonctionnel.
- **E-mails** : confirmation cliente + alerte commande (vérifier les spams), suivi colis,
  annulation — tous à l'image de la marque (logo + or/crème).
- **Reçu Stripe** : logo + couleur or réglés ; numéro perso retiré (informations publiques Stripe).
- **POLITIQUE REMBOURSEMENT — RÈGLE FERME (déjà confirmée, NE PLUS REDEMANDER)** : les **produits
  personnalisés ne sont JAMAIS remboursés** (droit de rétractation exclu, art. L221-28 ; clause déjà
  dans les pages Retours/CGV). → Ne JAMAIS proposer remboursement/retour/avoir pour un article
  personnalisé. Si une commande « retrait » n'est pas venue chercher : on garde, **pas de remboursement**.
- **Atelier en Val-d'Oise (95)** ; domiciliation légale 6 rue d'Armaillé 75017 Paris = **correcte**, ne pas la remettre en question.
- **Retrait en main propre** : déco/mariage **uniquement** (jamais les bijoux = livraison seule), gratuit,
  sur rendez-vous, limité par code postal (95 + voisins : 78, 92, 93, 75, 60), adresse jamais publiée.

### TEXTE RETIRÉ DES CRISTAUX — TEMPORAIRE (07/07/2026, À REMETTRE quand la gérante le dira)
> Le champ « texte à graver » a été retiré des cristaux ; **tout est sauvegardé en commentaire** dans `src/lib/products.js` (chercher « TEXTE RETIRÉ TEMPORAIREMENT »). Pour remettre : décommenter les champs `texte`/`police`.
- **Blocs vertical + horizontal** : photo uniquement (texte optionnel retiré, en commentaire).
- **Pyramide** (`pyramide-cristal-gravure-3d`) : passée de TEXTE → **PHOTO** (photo 3D + guide). Le texte d'origine (textarea+police) est en commentaire ; titre/tagline/description mis à jour en « photo ». Pour revenir au texte : remettre les 2 champs commentés, retirer le champ photo, et remettre les libellés « texte ».
- **Porte-clés cristal** (Cœur, Rectangle) : déjà photo uniquement (jamais de texte).

### RÈGLE DE COMMUNICATION (importante)
- **NE PLUS répéter** les rappels SIRET / médiateur / légal : l'utilisatrice est au courant et s'en occupe elle-même. Ne pas la « contrôler ».
- Quand elle demande quelque chose : **le faire**, sans re-justifier ni multiplier les avertissements. Réponses courtes.

### MAQUETTE EN ATTENTE — NOUVEAU THÈME « L'ÉCRIN » (enregistrée le 06/07/2026, à appliquer PLUS TARD)
> La gérante a demandé d'**enregistrer la maquette telle quelle** pour l'appliquer plus tard. Quand elle dira « applique le nouveau thème » : **reproduire EXACTEMENT** cette maquette (règle ci-dessous), sans réinventer.
- **Fichier** : `docs/maquettes/theme-ecrin.html` (autonome, images intégrées — ouvrir dans un navigateur pour revoir). Artifact : https://claude.ai/code/artifact/3e4f0c71-7b5c-4288-84cf-831970af0ab7
- **Contenu** : 2 vues avec boutons de bascule en haut — 🛍️ le SITE (accueil) et ⚙️ l'ADMIN (Gestion).
- **Principe** : mêmes couleurs de marque (or #c9a24b/#a98935/#e2c67e, crème #fbf7ee/#f3e8d3, encre #1a1206/#241a0c), nouveau décor « écrin de bijouterie ».
- **Site** : bandeau d'entrée SOMBRE (encre + halo or, photo cristal dans cadre doré double filet + reflet balayant + trait laser qui se grave sous le titre) · ruban marquee doré défilant (France ✦ 4,9/5 ✦ Europe…) · univers en mosaïque asymétrique 4 photos avec zoom au survol · cartes produit à cadre fin doré (photo zoome, carte se soulève, liseré blanc intérieur au survol) · 3 étapes « Comment ça marche » (bord haut doré) · avis en grande citation serif italique qui tourne toutes les ~5 s · bande finale sombre « Sur mesure » · apparitions douces au scroll (IntersectionObserver `.rv/.in`), `prefers-reduced-motion` respecté.
- **Admin** : menu latéral SOMBRE groupé (vraies rubriques de /gestion) avec pastilles dorées de compteurs · « Bonjour 👋 » + 4 tuiles chiffres (liseré or à gauche, tabular-nums) · commandes avec chips de statut (À préparer sable/or, À graver mauve, Expédiée verte, Livrée grise) · stock en barres (orange = bas, rouge RUPTURE) · panneau « À faire aujourd'hui » · panneau Assistant. Mobile : menu horizontal défilant.

### RÈGLE — RESPECTER LES TESTS / MAQUETTES VALIDÉS (TRÈS IMPORTANTE, demande explicite)
- Quand une **maquette / un test** (artifact) est validé par la gérante, il faut le **REPRODUIRE FIDÈLEMENT** sur le vrai site — **copier** le rendu du test, juste **l'adapter** aux couleurs/structure du site. NE PAS réinventer un rendu différent, sinon « les tests ne servent à rien ».
- **TESTER SOI-MÊME le rendu** (rendu HTML → screenshot via Chromium headless : `/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --screenshot=...`) AVANT de dire à la gérante que c'est bon. Ne pas lui faire vérifier chaque détail.
- Ex. aperçu cristal 3D : la photo du client s'affiche dans un **bloc de verre** (comme la maquette `apercu-fiche-cristal.html`) : verre bleuté clair + `mix-blend-mode:luminosity` + `filter:grayscale(1) contrast(1.18) brightness(1.12)` opacity .74 + reflet animé. Le grand aperçu remplace l'image du haut dès l'upload (`.crystal-hero` dans `ProductDetail.jsx`).

### Reste à faire avant l'ouverture publique
- **Ouvrir le site au public** : décocher « Activer le code d'accès » dans gestion → Apparence (site encore privé en attendant).
- **SIRET** : `105 914 774 00010` renseigné dans Mentions légales + CGV (fait le 25/06/2026).
- **Catégories & ordre (admin)** : page `/gestion → Catalogue → 🗂️ Catégories & ordre` (`TaxonomyAdmin.jsx`). L'utilisatrice peut ajouter/renommer/supprimer/réordonner les catégories ET sous-catégories, et réordonner les produits dans chaque catégorie (flèches ▲▼ + Enregistrer). Stocké en base (`taxonomy` dans le blob catalogue, via `getTaxonomy`/`saveTaxonomy`), repli sûr sur le code (`CATEGORIES`/`SUBCATEGORIES` de products.js). La boutique fusionne via `src/lib/taxonomy.js` (`resolveCategories`/`resolveSubcategories`/`resolveProductOrder`/`makeProductSorter`). NB : renommer ne change que le libellé, pas l'identifiant (slug) — la logique produit (bijoux −10 %, crystal3d…) reste intacte.
- **Bijoux** : prix de référence à +25 % ; re-appliquer la remise −20 % (Promotions → Remise rapide) pour retomber sur les prix d'origine.
- Finir photos + stocks sur les produits restants.

### MIGRATION FIREBASE — EN COURS DE BASCULE DNS (maj 11/06/2026 soir)
- Netlify a atteint 100 % des minutes de build → migration vers **Firebase App Hosting**.
- Code prêt : stockage commutable via `DATA_BACKEND=firestore` (Firestore, cache 60 s, Storage pour .glb), `apphosting.yaml`, routes `/api/admin/export` + `/api/admin/import`.
- **Le site Netlify reste EN LIGNE et prend les commandes pendant toute la migration.** Ne PAS définir `DATA_BACKEND` sur Netlify.

**FAIT (Firebase App Hosting opérationnel) :**
- Backend `niv-creation` en `europe-west4`, Node 24, projet `niv-creation` (n° 619294563828), plan Blaze.
- URL Firebase : **`https://niv-creation--niv-creation.europe-west4.hosted.app`** — testée OK (commande + paiement + annulation + remboursement fonctionnent).
- 8 secrets créés dans Secret Manager + accès accordé via `firebase apphosting:secrets:grantaccess` (l'IAM manuel ne suffit PAS — toujours utiliser la CLI).
- `STRIPE_SECRET_KEY` : l'ancienne était révoquée → recréée dans Stripe, mise à jour (version valide `sk_live_`, compte `acct_1Te7Ku0So3AjxkUO`).
- Webhook Stripe Firebase créé (`/api/stripe/webhook`, events completed/expired/payment_failed) → `STRIPE_WEBHOOK_SECRET` mis à jour.
- Données migrées une fois (export Netlify → import Firebase : 7 sections catalogue).
- Bug corrigé : label custom_field cadeau > 50 car. (limite Stripe) — commit `493f10d`.

**BASCULE DNS — FAITE (vérifiée le 26/06/2026).** `nivcreation.fr` ET l'adresse `…hosted.app` renvoient désormais le MÊME backend Firebase (en-tête `cache-tag: 619294563828:niv-creation` sur les deux → projet niv-creation). Il n'y a donc plus qu'UN seul backend en ligne (Firebase/Firestore). Reste à VÉRIFIER/CONSOLIDER : une commande tombée sur l'ANCIEN Netlify juste avant la bascule peut ne pas être dans Firestore — à recopier si elle existe (export Netlify → import Firebase).

**Historique — BASCULE DNS (domaine chez HOSTINGER, pas OVH ni Netlify) :**
- DNS géré sur **hpanel.hostinger.com** → nivcreation.fr → DNS / Serveurs de noms. (NS = `dns-parking.com`.)
- Étape 1 FAITE : TXT `fah-claim=016-02-eb4357c4-...` + CNAME `_acme-challenge_goaabsql7whIflx` ajoutés et **propagés** (vérifiés OK). Reste à cliquer « Valider les enregistrements » dans Firebase.
- Étape 2 À FAIRE = LA BASCULE : remplacer l'ALIAS `@ → apex-loadbalancer.netlify.com` par l'IP Firebase **`35.219.200.110`** (+ retirer les A Netlify `75.2.60.5` / `99.83.231.61`). C'est CE changement qui bascule le trafic.
- **AVANT la bascule : refaire une migration données Netlify → Firebase** (récupérer dernières commandes/stock). À faire à une heure creuse.
- **APRÈS la bascule : VÉRIFIER LES COMMANDES SUR LES DEUX BACKENDS** (Netlify Blobs + Firestore) car pendant la propagation DNS des commandes peuvent tomber sur l'un ou l'autre. Consolider le tout côté Firebase. ← demande explicite de l'utilisatrice.
- NB : la remise bijoux est désormais **dans le code** (−10 % permanent, catalog.js) — la ligne « +25 % / −20 % » ci-dessus est obsolète.

### Actions externes en attente (à faire par l'utilisatrice — RAPPELER si elle demande « où on en est »)
- **Google Merchant Center** (gratuit, visibilité Google Shopping) : créer le compte, vérifier le site, puis ajouter le flux **`https://nivcreation.fr/flux-google.xml`** (Produits → Flux → Flux planifié). Le flux est déjà généré par le site.
- **Stripe → Webhooks** : cocher l'événement **`checkout.session.expired`** (nécessaire pour la relance e-mail des paniers abandonnés — déjà codée).
- **Resend** : vérifier le domaine `nivcreation.fr` (SPF/DKIM/DMARC) pour que les e-mails arrivent en boîte de réception et pas en spam.

### Fenêtre « Ajouter / Modifier un produit » enrichie (maj 26/06/2026)
> Inspirée des systèmes des autres apps (Crafia / app de gestion Niv) mais **adaptée au site** (modèle products.js).
Briques dans `src/components/admin/ProductFormParts.jsx` (`MarginBox`, `EngravingBuilder`, `SeasonalFields`, `makeTierVariant`), branchées dans `ProductsAdmin.jsx` (création ET édition). Stockage : champs `cost`, `lowStockThreshold`, `seasonal`, `personalizationFields` gérés dans `catalog.js` (applyOverride) + route `/api/admin/catalog` (sanitizers `sanitizePersonalizationFields`/`sanitizeSeasonal`).
- **Coût + marge en direct** : champ coût → marge €/% + voyant (pas de « prix conseillé » trompeur : le bois coûte ~0 €, le prix se fixe au marché/temps).
- **Gravure configurable** : ajouter/réordonner les champs (texte, texte long, choix, police, couleur, photo, note) avec libellé/facultatif/maxLength/options. En édition, l'override `personalizationFields` n'est envoyé QUE si modifié (préserve les produits à `engravingPricing` complexes — avertissement affiché).
- **Tarifs dégressifs** : bouton « + Tarif dégressif (lot) » → génère une variante « Lot de N (X €/pièce) ».
- **Stock** : seuil d'alerte `lowStockThreshold`. **Saisonnier** : `seasonal {name,start,end,hideOutOfSeason}` → masqué hors période (récurrence annuelle MM-JJ, filtré dans `getCatalog`).
- **Mise en avant accueil** : case `featured` (override) → page d'accueil lit les produits `featured` (repli `FEATURED_FALLBACK` dans `src/app/page.jsx`).

### Fonctionnalités livrées (rappel)
Modèles 3D (.glb) téléversables · suivi de colis (admin + cliente + e-mail) · commandes
(annuler/supprimer/rembourser/livrée + filtres/recherche) · assistant (masquer, prix, textes,
ajout/suppression, stock, promos) · boutique rangée par thème · remise rapide par catégorie ·
prix conseillé · bouton accueil « Idées cadeaux ».

## 12. ÉQUIPE D'AGENTS IA (maj 13/06/2026)
> Développé sur la branche `claude/multi-agent-system-unx3q2`, déployé en fast-forward sur la
> branche du site `claude/site-product-overview-1t2de`. Accès : **/gestion → Réglages →
> Équipe d'agents → « Ouvrir le centre des agents »** (page dédiée `/gestion/agents`).

**Moteur réutilisable** : `src/lib/agents/registry.js` (objet `AGENTS` + `runAgent` + `triageIncomingEmail`).
Pour ajouter un agent : une entrée dans `AGENTS` (consigne + outils). Même clé `ANTHROPIC_API_KEY`.
Fichiers liés : `/api/admin/agents` (liste + exécution), `/gestion/agents/page.jsx` (UI : vue
d'ensemble, espace par agent, page récap « Comment ça marche »), `/api/admin/social/publish`
(Instagram), autonomie e-mail branchée dans `/api/contact`, réglages dans `getSettings`
(`agents.emailAutoReply`, `social.igUserId/igToken`).

**Agents actifs** : 🧭 Chef (orchestrateur, délègue) · ✉️ E-mail (AUTONOME : répond seul aux
cas simples, remonte les cas spéciaux « à valider ») · ⭐ Avis · 📣 Newsletter · 🎨 Marketing
(prépare le post + publie sur Instagram si compte connecté) · 🛠️ Technicien/Dev (diagnostic +
fiche ; le vrai code est fait par Claude Code) · 📊 Rapport (sur les vraies commandes).

**Principe** : cas simples en autonomie, cas spéciaux toujours remontés. Rien ne casse le site
(bloc isolé, désactivable). Pour RETIRER les agents : supprimer `src/lib/agents/`,
`src/app/api/admin/agents`, `src/app/api/admin/social`, `src/app/gestion/agents`, l'onglet
« agents » dans `/gestion/page.jsx`, et le bloc autonome dans `/api/contact/route.js`.

### EN ATTENTE côté utilisatrice (RAPPELER si elle demande « il reste quoi »)
- **Montage / visuel / fichier 3D** : elle DOIT fournir un produit (photo + nom) → Claude le
  génère à la demande avec ses outils (génération image/vidéo/3D). ← promis, à faire quand elle l'envoie.
- **Publication Instagram auto** : connecter un compte Instagram Business + jeton Meta longue
  durée (perms `instagram_basic` + `instagram_content_publish`) dans le panneau « Publier sur
  Instagram ». Tant que non connecté : l'agent prépare le post, elle publie elle-même (bouton Copier).
- **Auto-réponse e-mail** : codée et déployée mais **OFF par défaut**. À activer via l'interrupteur
  dans le centre des agents quand elle est prête (elle teste avant).
- **Agent téléphone** : non construit — nécessite un compte Twilio payant + numéro dédié.
- **Option** : bouton « Générer le 3D » in-app (auto) → nécessiterait une API 3D payante.

### À FAIRE PLUS TARD — 2 branchements optionnels (le site marche très bien sans, RIEN ne casse)
> L'utilisatrice a dit « on fait plus tard, pas de souci si pas fait ». Ne pas la presser. NB : le connecteur de
> son APPLI Claude ≠ le branchement du SITE ; il faut les clés ci-dessous dans Firebase pour le site.

1. **Étude de marché — recherche gratuite (Tavily)** : page `/gestion/etude-marche` déjà en ligne (menu Marketing).
   Pour activer la recherche gratuite, elle doit mettre la clé Tavily dans Firebase :
   `firebase apphosting:secrets:set TAVILY_API_KEY` puis
   `firebase apphosting:secrets:grantaccess TAVILY_API_KEY --backend niv-creation`
   (clé `tvly-…` sur tavily.com → API Keys). PUIS me prévenir → je RÉACTIVE le bloc `TAVILY_API_KEY`
   commenté dans `apphosting.yaml`. Sécurité en place : sans la clé, le bouton refuse de lancer une recherche
   payante (pas de prélèvement surprise). En attendant, le fichier Excel de l'étude est déjà fourni.

2. **Gmail → agents (réponses mails clients, JAMAIS d'envoi auto, validation obligatoire)** : à construire.
   Elle veut le VRAI Gmail branché ET garder le formulaire (les deux). Côté Google (gratuit, une fois) :
   créer projet Google Cloud → activer Gmail API → ID client OAuth (Desktop) → OAuth Playground avec scope
   `https://mail.google.com/` → récupérer **Client ID + Client secret + Refresh token**. Elle me donne les 3
   (ou les met en secrets) → je construis la page admin « Boîte mail (agent) » : l'agent lit les mails, prépare
   un brouillon, elle clique « Envoyer » / « Modifier » — jamais d'envoi automatique.

## 13. À FAIRE PAR L'UTILISATRICE — liste consolidée (maj 24/06/2026)
> Récap des actions qui restent **côté utilisatrice** (à faire quand elle veut). Tout le code est prêt.

### Priorité / quand elle veut
- [ ] **Générateur sur-mesure en qualité « pro » (payant)** : créer un compte **OpenAI** + une **clé API**, puis soit
  mettre le secret Firebase `OPENAI_API_KEY` (puis grantaccess), soit me demander d'ajouter un **champ admin** pour la coller.
  Tant que pas de clé → le générateur **gratuit** (Pollinations) fonctionne (0 €). Page : `/sur-mesure` (démo, pas encore au menu).
- [ ] **Remise anniversaire 100 % automatique** : définir le secret `CRON_SECRET` (Firebase) + créer un **planificateur
  Google Cloud Scheduler** (gratuit) qui appelle 1×/jour `https://nivcreation.fr/api/cron/birthdays?token=CRON_SECRET`.
  En attendant : le **semi-auto** est déjà dans le CRM (encadré « 🎂 Anniversaires à venir » + bouton).
- [ ] **Publier la page « Projet sur mesure »** : quand elle valide la démo `/sur-mesure`, me dire → je l'ajoute au menu.
- [ ] **Activer le bandeau SOLDES** quand voulu : Apparence → Bandeau & pop-ups → « ✦ Bandeau SOLDES » (texte + dates).

### Déjà en attente (rappels des sections précédentes)
- [ ] **Ouvrir le site au public** : décocher « code d'accès » (Apparence → Accès & état) si encore privé.
- [ ] **Stripe → activer l'événement `checkout.session.expired`** (relance paniers abandonnés).
- [ ] **Resend** : vérifier le domaine `nivcreation.fr` (SPF/DKIM/DMARC) pour éviter les spams.
- [ ] **Google Merchant Center** : ajouter le flux `https://nivcreation.fr/flux-google.xml`.
- [ ] **Instagram Business** : connecter pour la publication auto (sinon l'agent prépare, elle publie).
- [ ] **Tavily** : clé `TAVILY_API_KEY` (Firebase) pour l'étude de marché en ligne (optionnel).
- [x] **SIRET** : `105 914 774 00010` ajouté dans Mentions légales + CGV (fourni le 25/06/2026).

### À TESTER (côté utilisatrice, quand elle veut)
- [ ] **Demande sur mesure → devis → commande automatique** (verres gravés + mariage) :
  1. Sur une fiche verre/mariage, bouton **« Faire une demande particulière »** → le client écrit + envoie → elle reçoit l'e-mail.
  2. **Gestion → Devis & factures** : créer un devis, recopier la demande dans le champ **« Demande du client / à fabriquer »**, mettre le prix.
  3. Payer le devis (test à 1 €) → vérifier que : devis passe en **« Payé »**, **commande créée** dans Gestion → Commandes avec l'encadré bleu **« 📋 Sur mesure — ce que le client a demandé »**, e-mail **« 🛎️ Commande »** reçu, et **adresse + téléphone** bien demandés au paiement.

### À me confirmer (côté Claude, en attente de sa réponse)
- [ ] **Règle de remboursement (palier du milieu)** : après 24 h, est-ce **retenue de 10 €** (mis par défaut) ou **−10 %** ?
  (L'indicateur auto sur chaque commande affiche « retenue de 10 € » pour l'instant.)

### FAIT récemment (pour info)
- Google Analytics branché (ID `G-RMBERKLVN9` collé) · Webhook Stripe réparé + anti-doublon (session + paiement) ·
  Boîte mail Gmail connectée (lecture + brouillon + envoi sur validation) · Compteur visites intégré ·
  Couverts enfants personnalisés PUBLIÉS (34,90 € port offert, éditeur par couvert) · CRM enrichi
  (campagne remise, anniversaires, tags, graphique CA, relance) · Bandeau Soldes animé · Page sur-mesure (démo).
