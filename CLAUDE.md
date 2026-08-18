# Guide agent — Boutique Niv Création

## 📦 À FAIRE PAR LA GÉRANTE — REP EMBALLAGES / IDU (enregistré 18/08/2026, IMPORTANT — la rappeler)
> **Démarche administrative en attente, à faire « plus tard » (demande de la gérante).** Quand elle
> demande « où j'en suis / qu'est-ce qu'il reste » ou reparle des emballages/Etsy/REP, **le lui rappeler**.
- **Quoi** : adhérer à un éco-organisme (**Léko** `leko-organisme.fr` ou **Citeo** `citeo.com`), obtenir
  l'**IDU (Identifiant Unique ADEME)**, payer l'éco-contribution (~95–110 €/an, forfait petit volume),
  puis **coller l'IDU dans Etsy** (Conformité / EPR). **Risque concret : sans IDU, Etsy peut bloquer le
  compte vendeur.** Sur nivcreation.fr rien ne bloque, mais l'obligation légale existe.
- **Récap complet pas-à-pas** : `docs/rep-emballages-idu.md` (SIRET 105 914 774 00010, forfait, étapes).
- **PPWR** (règlement UE emballages) = pas de démarche, juste faire des emballages recyclables / sans vide
  inutile — déjà le cas. Ne pas l'inquiéter avec ça.
- Ne PAS faire la démarche à sa place (administratif, son compte). Rôle = lui rendre le récap clair + rappeler.

## 🚫 RÈGLE D'OR — NE JAMAIS TOUCHER AUX APPLIS / SITES EN LIGNE SANS DEMANDE EXPLICITE (enregistré 13/08/2026)
> **Demande ferme de la gérante, valable pour TOUTES les conversations et TOUS ses projets.**
- **INTERDIT** de modifier, déployer, republier, reconfigurer ou supprimer quoi que ce soit sur un **site, une application ou un projet EN LIGNE** de la gérante (boutique Niv Création `nivcreation.fr`, projets Firebase `niv-creation`/`crafia-app`/`niv-social`, Stripe, réglages, agents, etc.) **sans qu'elle le demande explicitement**.
- Cela vaut pour **tous ses projets**, pas seulement la boutique : ne toucher à AUCUN de ses services en ligne de sa propre initiative.
- **Préparer / proposer / montrer une maquette = OK.** **Appliquer / mettre en ligne / déployer = SEULEMENT sur sa demande explicite.** En cas de doute : **demander d'abord**, ne jamais déduire un accord.
- Un nouveau projet **isolé** (ex. app voyage sur un projet Firebase neuf) ne compte pas comme « toucher » à ses projets existants — mais le déploiement final reste **à sa main / sur sa demande**.

## 📦 FOURNISSEUR BOÎTES / EMBALLAGES PERSONNALISÉS — « Guardidea-Rachel » (enregistré 27/07/2026)
> Quand la gérante parle du **fournisseur de boîtes / emballages**, c'est **Guardidea-Rachel** (contact **WhatsApp**, anglophone). C'est aussi elle qui fait déjà les **boîtes à bijoux** de la gérante.
- **Personnalisation** : oui, à la marque Niv Création (même couleur + mêmes textes/logo que les boîtes bijoux déjà commandées).
- **Sur-mesure (nouvelle taille)** : possible MAIS **MOQ 300 pièces par taille** (nouvelle découpe « die cut »). Plus grande taille **standard** dispo (sans MOQ) = **25×17×8 cm** (jugée trop petite/basse par la gérante).
- **Boîtes voulues** (vides, **sans mousse** — la gérante cale elle-même au papier bulle) : **cristaux ≈ 25×20×15 cm** (une seule taille pour toutes les tailles de cristal) · **verres 2 pièces ≈ 28×20×12 cm** (verres ~21 cm de haut, flûte Ø6,3×21,4 cm). En attente : tailles standard proches + prix.
- La gérante communique avec elle **en français** (la fournisseuse traduit). Toujours proposer les messages en français, clairs et courts.

## 🛒 METTRE UN PRODUIT SUR ETSY — RECETTE ENREGISTRÉE (08/07/2026)
> Quand la gérante dit « mets ce produit sur Etsy », suivre **`docs/etsy/RECETTE-ETSY.md`** (recette complète + textes prêts dans `docs/etsy/`).
- **Méthode** : la gérante utilise **Claude pour Chrome** (extension navigateur). Nous, on ne touche PAS à Etsy — on **prépare un TEXTE** qu'elle colle dans Claude pour Chrome, qui remplit les fiches à sa place. Boutique : **NivCreationArtisanat**.
- **PRIX ETSY = prix du site × 1,45** (arrondi ,90 sup.) : couvre frais Etsy ~14 % + remise boutique 10 % + pubs ~13 %. Ex. blocs : Petit 57,90 · Moyen 86,90 · Grand 144,90 · XL 217,90 · socle 21,90/28,90.
- **Règles du texte** : français, pas d'emojis, personnalisé = fait à la commande, **brouillon** (ne rien publier), fiches une par une, INTERDICTION de toucher aux bijoux/autres produits. Photos = garder le site ouvert dans un onglet (Claude pour Chrome les récupère). Perso = champ « Photo à graver » obligatoire.
- **Livraison** : profils par type — blocs lourds France 12,90 / EU 29,90 ; socle léger France 6,90 / EU 14,90 ; bijoux = petit colis. Ne jamais laisser le tarif bijoux sur du lourd.
- **Socle en option** : soit fiche séparée (simple), soit 2e variation « Socle » + prix varient sur les 2 variations = 8 prix totaux (détaillé dans la recette).

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
- **LIVRAISON OFFERTE PAR SEUIL SUR COLIS (`freeShipThreshold`, maj 24/07/2026)** : mettre `freeShipThreshold: 45` sur un produit colis (verre à vin, flûte, carafe) → **livraison offerte dès que le sous-total du panier ≥ ce seuil**. Calculé dans `/api/checkout` : `allColisThreshFree` (vrai seulement si TOUS les colis du panier portent un `freeShipThreshold`) + `subtotal >= colisThresh` → `freeShipping` passé à `buildShippingOptions`. **Sûr et automatique en panier mixte** : le seuil s'applique sur le total (ex. vin lot 2 + flûte lot 2 = 49,80 € ≥ 45 → offert), un mélange avec un colis SANS seuil (ex. bloc cristal) reste facturé au poids (pas de gratuité indue). Le seuil bijoux/lettre (`bijouxFreeThreshold`, 45 €) reste séparé pour les paniers 100 % lettre. **Ne pas utiliser `freeShipping:true` (toujours offert) sur un produit qui peut être mélangé** → ça se perd en panier mixte ; préférer `freeShipThreshold`. Vérifié par script (paniers mixtes vin/flûte/carafe/bijou) le 24/07/2026 : ✔ additionne poids × quantités, ✔ seuil 45 € sur le total, ✔ carafe seule 54,90 € offerte.
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
4bis. **⚠️ RÈGLE OBLIGATOIRE — UN NOUVEAU PRODUIT DOIT RESSEMBLER AUX AUTRES DU MÊME TYPE.**
   Ne jamais ajouter un produit « nu ». Le configurer **exactement comme ses semblables** :
   - **Packaging / emballages** : ajouter le slug dans `src/lib/packagingSeed.js`
     (`DEFAULT_PRODUCT_PACKAGING`). **Un bijou = comme les autres bijoux** : un **collier** →
     liste `COLLIERS` (sac + boîte carrée + microfibre + pack-collier) ; un **bracelet femme fin**
     → `BRACELETS_CARRE` ; un **bracelet homme/long** → `BRACELETS_LONG` (boîte allongée +
     pack-bracelet). Sinon la fiche n'a pas le sélecteur « Votre emballage » que les autres ont.
   - **Fiche détaillée** : entrée dans `productInfo.js` (Taille & Matériaux, Entretien, Retour).
   - **Champs communs** : `weight`, `letter`, `pickup`, `category`, `subcategory` (femme/homme pour
     les bijoux), `badge:"Nouveau"`, `type`, photos optimisées (~1200px, <300 Ko).
   - En résumé : **regarder un produit existant du même genre et copier TOUTE sa config** (pas que
     le nom/prix/photo). Si un bijou, il doit se comporter comme les autres bijoux de bout en bout.
   - **⚠️ GRAVURE = TOUJOURS UNE OPTION PAYANTE, JAMAIS INCLUSE** (demande explicite de la gérante).
     Ne jamais mettre la gravure « incluse/offerte ». Toujours une variante **« Sans gravure » / « Avec
     gravure » (+ supplément, ex. +3 €)** avec les champs de gravure en `variantContains:"Avec"` (modèle :
     `bracelet-homme-cuir-tresse-acier` = 3 couleurs × Sans/Avec, ou `collier-coeur-zircon`).
   - **COÛT D'ACHAT = prix fournisseur + FRAIS DE PORT/IMPORT** (jamais le prix article seul). Pour la
     commande Nihao NHFR607182266419 : +18,8 % environ (port 20,21 € / produits 107,66 €). Voir
     `docs/commande-fournisseur-NHFR607182266419.md`.
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
- **URSSAF : déclaration FAITE** (activité déclarée à l'URSSAF — confirmé par la gérante le 11/07/2026). Ne plus le redemander ni le rappeler.
- **Retrait en main propre** : déco/mariage **uniquement** (jamais les bijoux = livraison seule), gratuit,
  sur rendez-vous, limité par code postal (95 + voisins : 78, 92, 93, 75, 60), adresse jamais publiée.

### TEXTE RETIRÉ DES CRISTAUX — TEMPORAIRE (07/07/2026, À REMETTRE quand la gérante le dira)
> Le champ « texte à graver » a été retiré des cristaux ; **tout est sauvegardé en commentaire** dans `src/lib/products.js` (chercher « TEXTE RETIRÉ TEMPORAIREMENT »). Pour remettre : décommenter les champs `texte`/`police`.
- **Blocs vertical + horizontal** : photo uniquement (texte optionnel retiré, en commentaire).
- **Pyramide** (`pyramide-cristal-gravure-3d`) : passée de TEXTE → **PHOTO** (photo 3D + guide). Le texte d'origine (textarea+police) est en commentaire ; titre/tagline/description mis à jour en « photo ». Pour revenir au texte : remettre les 2 champs commentés, retirer le champ photo, et remettre les libellés « texte ».
- **Porte-clés cristal** (Cœur, Rectangle) : déjà photo uniquement (jamais de texte).

### PACKAGING / EMBALLAGES — construit le 17/07/2026 (masqué tant que non activé)
> Page **Gestion → Catalogue → 📦 Packaging & emballages** (`/gestion/emballages`, `src/app/gestion/emballages/page.jsx`).
- **Bibliothèque** d'emballages dans `settings.packaging` (`[{id,name,desc,buy,sell,weight,photo}]`) + **attribution par produit** `settings.productPackaging` (`{slug:{on,ids,free}}`). Sanitizers dans `/api/admin/settings`. Config de DÉPART pré-remplie (prix/règles de la gérante) dans `src/lib/packagingSeed.js` (s'affiche tant qu'elle n'a rien enregistré → elle ajoute juste les photos).
- **INTERRUPTEUR MAÎTRE** `settings.packagingLive` (défaut **false**) : tant qu'il est false, `getCatalog` n'attache PAS `product.packaging` → **RIEN sur le site** (fiches inchangées). L'admin a le toggle « visible sur le site ». Activation = la gérante coche + Enregistre (ou on met `packagingLive:true`).
- **Fiche** (`ProductDetail.jsx`) : si `product.packaging.on`, sélecteur « Votre emballage » en mode **choisir UNE formule** (radio) : Sans emballage / Sac / Boîte / Microfibre / Pack (mis en avant « meilleur choix »). Prix recalculé côté serveur au checkout (`packagingExtra` dans `src/lib/packaging.js`, appelé dans `/api/checkout`), poids ajouté au colis, emballage écrit sur la commande (description Stripe).
- Prix confirmés : Sac 1,20 · Boîte cadeau 3 (colliers) / 5 (bracelets) · Microfibre 1,90 · **Pack Collier 5,50**. Règles : sac+microfibre sur tous les bijoux · boîte cadeau (carrée) sur colliers + 3 bracelets fins (Femme Cœur/Papillon/Acier) · boîte cadeau (allongée) sur les autres bracelets. Maquettes validées : `docs/maquettes/admin-packaging.html` + `packaging-client-pack.html`. **Reste à trancher** : Pack Bracelet (oui/non) — non créé pour l'instant.

### RÈGLE — RIEN SUR LE SITE SANS VALIDATION (17/07/2026, demande explicite après incident)
- **INTERDIT de modifier le site visible** (fiches, pages, textes clients) **sans l'accord explicite de la gérante**. Le circuit est TOUJOURS : **maquette d'abord → elle valide → « applique » → alors seulement on touche au site.**
- En cas de doute sur ce qu'un « oui » valide exactement : **demander**, ne pas déduire.

### RÈGLE — NE PAS MODIFIER LES MAQUETTES SANS DEMANDER (23/07/2026, demande explicite)
- **INTERDIT de modifier une maquette (artifact) sans demander d'abord l'accord de la gérante.** Même pour une « amélioration » évidente : on **propose et on attend son feu vert** avant de toucher/republier une maquette existante.
- Vaut pour TOUTES les maquettes (gobelet, carafe, cristal, thème, etc.). Republier une maquette = une modification → demander avant.
- Exception : si elle demande explicitement le changement, on le fait (c'est déjà son accord).

### RÈGLE DE COMMUNICATION (importante)
- **NE PLUS répéter** les rappels SIRET / médiateur / légal : l'utilisatrice est au courant et s'en occupe elle-même. Ne pas la « contrôler ».
- Quand elle demande quelque chose : **le faire**, sans re-justifier ni multiplier les avertissements. Réponses courtes.

### MAQUETTES CRISTAL 3D SUR MESURE — ENREGISTRÉES (08/07/2026, à appliquer quand la gérante le dira)
> Deux maquettes validées en test, **sauvegardées telles quelles** dans `docs/maquettes/`. Quand la gérante dit « mets-le / applique », reproduire **EXACTEMENT** (règle maquettes). Décision : proposer **LES DEUX** (modèles prêts + photo perso), **même prix que les blocs par taille** (Petit 39,90 · Moyen 59,90 · Grand 99,90 · XL 149,90).
- **`docs/maquettes/cristal-surmesure-section.html`** : section à ajouter en haut de `/cristaux` — titre « Gravez ce que vous voulez dans le cristal », tags (Photo/Animal/Dessin/Logo/Objet — **PAS** Couple&famille, déjà couvert par les blocs photo), 3 étapes, **galerie de 8 exemples** (cœur, sirène, dessin enfant, baleines, oiseaux, colibri, portrait, objet/échecs — images fournies par la gérante, IMG_9083..9089 + 8958), 2 cartes format (vertical/horizontal) → boutons vers les blocs.
- **`docs/maquettes/cristal-configurateur.html`** : configurateur d'achat — le client choisit un **modèle prêt** (les 8) OU **« Ma propre photo »**, puis **format** (vertical/horizontal) + **taille** (prix des blocs), aperçu à gauche, total + « Ajouter au panier ». À brancher au panier/paiement existant (modèle prêt = achat direct ; photo perso = upload comme les blocs actuels).
- **À vérifier côté gérante** : que le fournisseur peut produire ces modèles (cœur, sirène, échecs… = modèles standards, normalement oui).

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

### AGENTS AUTOMATIQUES (maj 24/07/2026)
- **Agent e-mail autonome** : déjà codé. S'active via l'interrupteur `agents.emailAutoReply` (Gestion → Équipe d'agents). Quand ON, `/api/contact` appelle `triageIncomingEmail` → répond SEUL aux cas simples (envoi Resend) et remonte les cas spéciaux « à valider ». Laissé OFF par défaut (la gérante teste avant). Réglage « live » (Firestore) — pas modifiable depuis le code.
- **Rapport / Newsletter / Marketing automatiques** : endpoint **`/api/cron/agents?token=CRON_SECRET`** (`src/app/api/cron/agents/route.js`). Lance les agents `rapport`/`newsletter`/`marketing` (ou un seul avec `&task=`) et **envoie le résultat par e-mail à la gérante** (`BRAND.contact`) pour relecture — rien n'est diffusé aux clients/Instagram sans elle. À planifier via **Google Cloud Scheduler** (comme `/api/cron/birthdays`), 1×/semaine. Nécessite `CRON_SECRET` (secret Firebase) + `ANTHROPIC_API_KEY` (déjà là). Post Instagram auto = seulement quand le compte IG Business sera connecté (sinon le brouillon arrive par mail).

### 🛡️ SURVEILLANCE AUTOMATIQUE DU CATALOGUE (maj 31/07/2026)
> Détecte les produits mal configurés (incohérents avec les autres) : **bijou sans emballage**,
> **sans photo**, **sans prix** (important) + **sans fiche détaillée** (mineur). Répond à la demande
> de la gérante « les agents doivent surveiller et détecter tout seuls ».
- **Cœur** : `src/lib/catalogAudit.js` (`auditCatalog()` read-only + `auditSummaryText()` + `importantIssueCount()`).
- **API admin** : `GET /api/admin/catalog-audit` → `{ issueCount, issues:[{slug,name,type,severity,message}], … }`.
- **Automatique (e-mail)** : tâche `sante` dans `/api/cron/agents` — lancée avec « tout » (cron hebdo) ou
  `&task=sante`. **Alerte la gérante par e-mail UNIQUEMENT s'il y a des points importants** (pas pour les
  fiches mineures). Nécessite `CRON_SECRET` (déjà là pour les autres crons).
- **Agent Technicien** : `needsAudit:true` → il connaît l'état du catalogue ; la gérante peut lui demander
  « vérifie le catalogue » à tout moment.
- **Règle liée** : §10 point 4bis — un nouveau bijou DOIT être configuré comme les autres (packaging inclus).
  C'est cette surveillance qui rattrape un oubli.
- **🔧 CORRECTION AUTOMATIQUE (maj 31/07/2026)** : `defaultPackagingFor(product)` dans `src/lib/packaging.js`
  attribue un emballage par défaut à TOUT bijou selon son type (collier / bracelet homme-long /
  bracelet femme-fin / autre), même sans config. Appliqué dans `getCatalog` (affichage) ET reconnu par
  l'audit → **impossible d'oublier le packaging d'un bijou**, la correction est structurelle (pas besoin
  d'un agent qui répare après coup). De plus `getSettings` FUSIONNE la config de départ du code avec les
  réglages enregistrés (`{ ...DEFAULT_PRODUCT_PACKAGING, ...enregistré }`) → un nouveau bijou est couvert
  même si la gérante a déjà enregistré la page Packaging. La visibilité côté client reste pilotée par
  l'interrupteur maître `settings.packagingLive`.

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

## 🔍 « VÉRIFIE MON SITE » — AUDIT COMPLET AUTOMATIQUE (créé le 13/08/2026)
> **Quand la gérante dit « vérifie mon site », « est-ce que tout va bien », « fais un audit »** →
> lancer **`node tools/audit-site.mjs`** et lui rendre le résultat en français, court et clair.
> Ne PAS improviser une vérification à la main : l'outil existe pour que rien ne soit oublié.

```
node tools/audit-site.mjs              # audit complet (~1 min avec la compilation)
node tools/audit-site.mjs --rapide     # sans compiler le code (~20 s)
node tools/audit-site.mjs --paiement   # teste EN PLUS le paiement Stripe (aucun prélèvement)
node tools/audit-site.mjs --site https://autre-adresse
```
**Ce qu'il contrôle (lecture seule, ne modifie rien)** : 1) les 21 pages du site (+ vitesse) ·
2) TOUTES les fiches produits du plan Google · 3) TOUTES les photos produits (~360, détecte une
photo cassée) · 4) les services : frais de livraison, promos, avis, stock, **points relais Boxtal**,
**paiement Stripe** · 5) la cohérence du catalogue (doublons d'identifiants = panier cassé, prix
manquant, produit sans photo, fiche détaillée manquante, produits masqués) · 6) la compilation du code.
- **Photos** : une photo en échec est **re-testée une seconde fois, plus lentement** avant d'être
  signalée (les hébergeurs bloquent parfois les requêtes rapprochées → faux positifs).
- **Sortie** : ✅ tout va bien · ⚠️ points à surveiller · ❌ problèmes à corriger (+ code de sortie 1).
- **Piège connu** : Next.js insère le texte « Page introuvable » dans TOUTES les pages (composant
  404 embarqué) → ne jamais détecter une erreur avec ce texte, se fier au **code HTTP**.
- **Dernier audit (13/08/2026)** : ✅ tout fonctionne, aucun problème (83-85 vérifications).
- **Correctif issu de cet audit (13/08/2026)** : `src/app/sitemap.js` était **figé à la compilation**
  → un produit masqué depuis l'admin (`bougeoir-mandala-bois`) restait annoncé à Google (erreur 404)
  et un nouveau produit n'y apparaissait qu'au déploiement suivant. Corrigé par
  `export const dynamic = "force-dynamic"` (même méthode que `flux-google.xml`, déjà dynamique).
  ⚠️ `export const revalidate = …` n'est PAS pris en compte sur `sitemap.js` (reste ○ Static au
  build) — utiliser `force-dynamic`. Vérifié en ligne : 74 → 73 adresses, le produit masqué a disparu.

## ✅ RÈGLE — TOUTE PROMESSE FAITE À LA CLIENTE DOIT MARCHER POUR DE VRAI (14/08/2026)
> Suite à la découverte que **le code BIENVENUE10 promis par e-mail était refusé au paiement**
> (il n'existait que comme TEXTE d'affichage). Avant d'annoncer quoi que ce soit à une cliente
> (code promo, livraison offerte, cadeau…), **vérifier que le mécanisme existe côté serveur** —
> et le tester en ligne (`/api/promo-validate`, panier réel), pas seulement lire le code.
- **Codes promo automatiques** : `ensureWelcomeCode()` / `ensureReferralCode()` (`src/lib/stock.js`)
  créent le vrai code promo à partir des réglages (`settings.welcome` / `settings.referral`), en
  déduisant la remise du texte (« −10 % » → percent 10 ; « −5 € » → fixed 5). Appelés depuis
  `/api/newsletter` (inscription), `/api/promo-validate` (saisie au panier) et le webhook Stripe
  (code de parrainage dans l'e-mail de commande). **Ne JAMAIS écraser un code déjà réglé à la main**
  dans Promotions : si le code existe, on n'y touche pas. Vérifié en ligne le 14/08 → `valid:true, −10 %`.
- **LIVRAISON OFFERTE = les DEUX modes.** Le seuil bijoux (45 €) ne s'appliquait qu'au domicile :
  le **point relais restait facturé 4,90 €** malgré la promesse affichée. Corrigé dans
  `buildShippingOptions` (`portOffert = freeShipping || bijouxOffert`), libellé « — Offerte ».
  Les colis lourds (cristaux, déco) restent facturés normalement (vérifié cas par cas).
- **Panier mixte** : un produit `freeShipping:true` (couverts enfants) annulait la gratuité au
  seuil d'un produit `freeShipThreshold` (carafe) → port facturé alors que les DEUX fiches
  promettent la livraison offerte. Corrigé dans `/api/checkout` (un produit toujours offert ne
  bloque plus le seuil des autres).
- **Rupture de stock** : le paiement d'un article épuisé était possible (page produit grisée
  seulement côté navigateur). `/api/checkout` refuse désormais avant paiement, **même règle que
  l'affichage** (seules les variantes suivies numériquement sont contrôlées). Important vu la règle
  « produit personnalisé jamais remboursé » : on ne veut pas encaisser ce qu'on ne peut pas fabriquer.

## 🏖️ MODE VACANCES — CONSTRUIT ET ÉTEINT (15/08/2026, à activer SEULEMENT sur demande)
> La gérante part bientôt en vacances. **Tout le mécanisme est en place mais ÉTEINT**
> (`settings.vacation.enabled = false` par défaut). **NE JAMAIS l'activer sans sa demande explicite**
> (« active le mode vacances du … au … »). Maquette validée : `docs/maquettes/mode-vacances.html`
> (artifact https://claude.ai/code/artifact/d84e78d4-0f30-440f-b6d5-9d4a52cea804).
- **Principe** : la boutique RESTE OUVERTE (jamais fermée — ventes + référencement préservés) ; le délai
  est annoncé partout : bandeau haut de site (`layout.jsx`), encart fiche produit + panier
  (`VacationNotice.jsx`, alimenté par `/api/shipping-config` → `vacation: null` si éteint), et
  paragraphe dans l'e-mail de confirmation cliente (webhook Stripe). Logique : `src/lib/vacation.js`.
- **Réglage** : Gestion → Apparence → « 🏖️ Mode vacances » — case Activer + 3 dates (début, fin,
  reprise des expéditions) + message personnalisé (sinon message auto avec les dates) + option
  **🎁 cadeau** (« un petit cadeau glissé dans chaque commande passée pendant les congés »).
  Avec les dates, s'allume/s'éteint TOUT SEUL (jour de fin inclus).
- **Pour activer** : cocher dans l'admin OU régler `settings.vacation` (enabled + dates). Vérifié :
  éteint → `vacation:null`, rien nulle part ; le build passe ; rendu réel testé (fiche + panier).

## 14. NOUVEAU PRODUIT — GOBELET ISOTHERME 40 oz À GRAVER (en préparation, 18/07/2026)
> Nouvelle gamme : grand gobelet isotherme 40 oz (1,1 L) type « Stanley » (acier inox double paroi, anse + paille), **gravure laser personnalisée**. Maquette validée en cours, **PAS ENCORE EN LIGNE** (attend « applique »).
- **Titre validé** : « Gobelet isotherme 40 oz à graver ». Catégorie envisagée : Boutique / Cadeaux (à confirmer).
- **Prix** : recherche marché faite (Amazon basique ~20 € ; Etsy gravé artisanal 30–45 €). **Reco = 34,90 €** (option prix barré 39,90 €). **En attente du choix de la gérante.**
- **4 coloris**, chacun avec **3 photos** (Vierge / Gravé exemple / Accessoires inclus) — déjà classées :
  - **Crème** : IMG_9303 (vierge) · IMG_9304 (gravé floral) · IMG_9305 (accessoires)
  - **Blanc** : IMG_9308 (vierge, liseré arc-en-ciel) · IMG_9309 (gravé « Follow the Stars ») · IMG_9310 (accessoires)
  - **Bleu marine** : IMG_9295 (vierge) · IMG_9296 (gravé « The Future is Bright ») · IMG_9297 (accessoires)
  - **Rose** : IMG_9299 (vierge) · IMG_9300 (gravé floral, anse rose) · IMG_9301 (accessoires)
  - NB : les rendus gravés « Follow the Stars » / « The Future is Bright » sont des **textes anglais de démo** (à valider ou remplacer).
- **Accessoires inclus** (visibles sur les photos accessoires) : paille inox + paille coudée, goupillon de nettoyage, couvercle avec bouchon, joint/stoppeur paille, petit tournevis.
- **Maquettes faites** (scratchpad, à refaire/committer si besoin) : fiche produit (galerie vierge/gravé/accessoires + sélecteur 4 coloris + zone gravure + « Ajouter au panier »), Avant/Après gobelet & carafe, récap couleurs. Style marque or/crème. Mention **« Gravé en France »** (PAS « fait main » : elle grave, elle ne fabrique pas le gobelet).
- **Carafe à whisky** : même logique Avant/Après (vierge → gravé) existe aussi (IMG_9312 vierge / IMG_9414 gravé démo).

### TÂCHE EN COURS — CATALOGUE DE DESSINS GRAVABLES (18/07/2026)
> On va proposer aux clients une bibliothèque de **motifs/dessins gravables** (fleurs, animaux, etc.) au choix sur le gobelet. La gérante envoie des **planches d'exemples avec des NUMÉROS** sur chaque dessin.
- **Ma mission** : pour **chaque numéro**, retrouver **UN PAR UN l'image d'origine / source téléchargeable** (haute déf) pour qu'elle puisse la télécharger.
- Limite technique : pas d'outil de recherche par image inversée → je procède par description du motif + recherche web ; certains motifs (packs connus, motifs courants) seront trouvables, d'autres non. Toujours procéder **un dessin à la fois**, dans l'ordre des numéros.

### OUTIL DE NUMÉROTATION DES PLANCHES — MÉTHODE VALIDÉE (22/07/2026)
> La gérante numérote elle-même les motifs (elle sait où sont les vrais motifs). Ne plus deviner les emplacements.
- **Outil interactif** (artifact) : page web où elle **clique sur chaque motif** pour poser un numéro (auto-incrément), glisse pour ajuster, double-tap pour supprimer. Champ **« Départ n° »** pour continuer la numérotation d'une planche à l'autre. Généré par script Python (image en base64 data-URI + JS canvas). Fichier type : `scratchpad/outil-numerotation.html`.
- **⚠️ Le téléchargement direct bloque sur iPhone.** La méthode fiable = bouton **« 📋 Copier le code »** → elle colle le code ici → JE régénère l'image finale avec Pillow (badges = cercle rouge #d32f2f, contour blanc, r≈W×0.032) et je l'enregistre/renvoie.
- **Workflow par planche** : (1) nouvelle planche → rebâtir l'outil (même URL, republish) avec l'image dedans ; (2) elle met « Départ n° » = numéro suivant (continuité) ; (3) elle pose les numéros + « Copier le code » ; (4) je rends l'image finale.
- **Compteur** : Planche « couples » = 1–9 (test). Planche « fleurs/papillons » IMG_9549 = **1–10** (placements de la gérante, enregistrée). **Prochaine planche : continuer à partir de 11.**

### MAQUETTES GOBELET + CARAFE — VALIDÉES, À REPRODUIRE À L'IDENTIQUE (23/07/2026, demande explicite)
> **Les 2 maquettes sont validées et enregistrées. Quand la gérante dira « mets sur le site » : les REPRODUIRE EXACTEMENT telles quelles — NE RIEN CHANGER, juste ADAPTER à la structure/couleurs du vrai site.** Ne pas « améliorer », ne pas réinventer. Et (règle générale) : **ne jamais modifier/republier ces maquettes sans son accord.**
> - **Gobelet** : `docs/maquettes/gobelet-configurateur-final.html` · artifact https://claude.ai/code/artifact/91c33586-d44d-43d9-af10-64fe924da40c
>   - Fiche = grande photo → 3 vignettes → **couleurs (sous les photos, à gauche)** cliquables (chaque couleur change la grande photo + les 3 vignettes). Configurateur « Composez votre gravure » : onglets **Dessins (1-74)** · **Cadres & banderoles (75-103)** · **Lettre fleurie (A→Z)**. Image principale obligatoire d'abord. Numéros affichés sur le gobelet 3D flottant. **56-60 retirés des Dessins (c'étaient des cadres) ; Dessins renumérotés 1-74 ; cadres passés en 75-103 → zéro doublon.**
> - **Carafe** : `docs/maquettes/carafe-fiche.html` · artifact https://claude.ai/code/artifact/58331379-1fae-43c8-9bc1-bc7f1d308240
>   - **Prix : 54,90 € livraison offerte** (net, pas de fausse remise). Styles numérotés 1-33 (dont Lettre fleurie n°33), champs Prénom/Nom/Initiale/Rôle/Date, **police par défaut du site** (le nom reprend l'écriture du modèle décoré), aperçu en direct. **Option coffret verres assortis** (carafe + 2/4 verres gravés au même style, verre 24,90 € en coffret au lieu de 26,90 €, **prix barré réel**, livraison offerte). **Jack Daniel's écarté** (marque déposée) → n°32 « Whisky de… » à la place. Planches numérotées : `docs/planches-carafe/`.
> - **Verre à vin gravé** : `docs/maquettes/verre-vin-fiche.html` · artifact https://claude.ai/code/artifact/10717789-346d-4ef2-ab3b-45801b3a1102
>   - Verre cristal Montese 36 cl (coût d'achat 3,05 €/verre, fournisseur Metro). **Prix : à l'unité 12,90 € + port · lot de 2 24,90 € + port · lot de 4 49,90 € livraison offerte** (livraison offerte dès **45 €** — FAIT via `freeShipThreshold: 45` par produit, cf. §6). Section « Personnalisez votre verre » : **styles numérotés 1-19** (couples, noms & dates, banderoles — planches `docs/planches-verre-vin/`), **lettre fleurie A→Z** (alphabet affiché + boutons), **8 polices du site** (identiques), aperçu en direct. **Note sous le choix de style** : pour les modèles avec prénoms (n°14-17), le prénom/date sont gravés dans l'écriture du modèle (image), pas dans la police. Photos verre : `IMG_9595/9596/9597/9598`.
> - **Flûte à champagne gravée** : `docs/maquettes/flute-champagne-fiche.html` · artifact https://claude.ai/code/artifact/9948bdc8-7ab5-44ec-9c50-2eda30dc2c72
>   - Clone EXACT du verre à vin (mêmes réglages : styles 1-19, lettre fleurie, 8 polices, note, prix unité 12,90 €+port / lot2 24,90 €+port / lot4 49,90 € livr. offerte). Change seulement : photos (`IMG_9599 vierge / 9601 set / 9602 ambiance`) + infos (verre **21 cl**, Ø 6,3 × H 21,4 cm, lave-vaisselle ; coût Metro 2,34 €/flûte, réf Pinomaro).

### CONFIGURATEUR GOBELET — MAQUETTE FINALE VALIDÉE (22/07/2026, À METTRE EN LIGNE SUR DEMANDE)
> Maquette finale enregistrée : **`docs/maquettes/gobelet-configurateur-final.html`** (autonome, images + planches intégrées ; artifact : https://claude.ai/code/artifact/91c33586-d44d-43d9-af10-64fe924da40c). **NE PAS mettre en ligne tant que la gérante n'a pas dit « mets en ligne ».** Le gobelet reste en produit **caché**. **Prévu comme OFFRE LIMITÉE / OFFRE SPÉCIALE** (à décider plus tard).
- **Fiche d'origine intacte** (grande photo + 3 vignettes vierge/gravé/accessoires + 4 couleurs) — ne pas y toucher. Configurateur intégré dans la carte « Composez votre gravure ». **Aperçu 3D flottant en bas à droite** qui apparaît **seulement quand le client arrive sur la personnalisation** (pas en haut de page).
- **Étape 1 obligatoire = IMAGE PRINCIPALE** (le motif du CENTRE de la FACE) : le client doit la choisir d'abord (guide orange → vert). Puis il ajoute d'autres éléments par zone (haut/bas/gauche/droite) et par côté (Face/Gauche/Droite/Tour).
- **2 familles séparées** : **« Dessins »** (motifs pleins, planches 1–79) et **« Écrire un nom »** (cadres/banderoles + **« Lettre fleurie »** = monogramme).
- **Rubrique « Écrire un nom »** = le client tape un **nom/texte au milieu** du cadre (1 ou 2 lignes selon le dessin). Numéros **56–60 DÉPLACÉS** des dessins vers ici + **nouvelles pièces numérotées à partir de 80** : planches `docs/planches/cadres_56-60`, `cadres_80-81`, `82-91`, `92-95`, `96-101`, `102-103`. **Lettre fleurie** = menu A→Z + le nom (pas de numéro par lettre).
- **Sur l'aperçu 3D : on GARDE les NUMÉROS** sur le gobelet (montrent où chaque motif est placé) + le **texte/nom** pour les cadres. Décision de la gérante : NE PAS afficher le vrai dessin du motif à la place (jugé « moche »). Le n° sert au client à choisir dans les planches.
- **Reste à faire quand elle dira « mets en ligne »** : intégrer tout ça dans la vraie fiche (`products.js` : rubrique « Écrire un nom » + planches cadres ; `GobeletComposer.jsx`/`GobeletPreview.jsx` : familles + champ nom + image principale obligatoire ; checkout : cadres = éléments comptés comme les motifs). Reproduire FIDÈLEMENT la maquette finale.
- **COMMANDE = récap écrit + IMAGE d'aperçu (demandé par la gérante 22/07)** : chaque commande doit fournir à la gérante (1) un **récap écrit** de la composition (par élément : côté + zone + n° de motif OU texte/nom + couleur + police) dans Gestion → Commandes ET dans l'e-mail d'alerte, ET (2) une **image d'aperçu générée** (le gobelet avec les numéros/noms placés, comme la fenêtre 3D) **jointe à la commande / à l'e-mail**. Le n° renvoie aux planches numérotées pour savoir quel dessin graver.
