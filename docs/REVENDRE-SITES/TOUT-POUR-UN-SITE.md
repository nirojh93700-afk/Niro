# Tout pour un site — la liste complète que la plateforme doit gérer

> Ce document réunit DEUX choses :
> 1. **Tout ce qu'il faut pour créer et lancer un site** (recherche à jour, contexte
>    français) — pour ne rien oublier.
> 2. **Tout ce qu'on a déjà construit sur votre site** Niv Création — pour que la
>    future plateforme reprenne et gère l'ensemble.
>
> C'est la « checklist maître » : chaque ligne est soit ✅ **déjà fait** sur votre
> site, soit ▸ à intégrer/automatiser dans la plateforme.

---

# PARTIE A — Tout ce qu'il faut pour créer un site

## A1. Administratif (avant de vendre)
- **Créer une entreprise** (auto-entrepreneur le plus simple) — *obligatoire pour facturer*.
- **Ouvrir un compte professionnel** (encaissement).
- Choisir le **nom de la marque** et vérifier sa disponibilité (domaine + réseaux).

## A2. Technique (pour que le site existe en ligne)
- **Nom de domaine** (ex. `.fr` pour rassurer en France) — à acheter chez un registrar (OVH, Gandi…).
- **Hébergement** (où le site « habite ») — Netlify dans votre cas.
- **DNS** — les réglages qui relient le domaine au site ET aux e-mails.
- **Certificat SSL / HTTPS** — le petit cadenas, indispensable (sécurité + confiance).
- **Adresse e-mail professionnelle** (ex. `contact@votre-domaine.fr`) liée au domaine.

## A3. Légal & conformité (obligatoire en France)
- **Mentions légales** — *leur absence est un délit (jusqu'à 75 000 € d'amende)*.
- **CGV** (Conditions Générales de Vente) — accessibles avant tout achat.
- **Politique de confidentialité (RGPD)** — quelles données, pourquoi, droits du client.
- **Bandeau cookies** — consentement (refuser doit être aussi simple qu'accepter).
- **Droit de rétractation 14 jours** (sauf produits personnalisés — à bien indiquer).
- **Médiateur de la consommation** — coordonnées à mentionner.

## A4. Paiement & livraison
- **Paiement en ligne** (Stripe : carte ; option PayPal, paiement en 3x…).
- **Frais et options de livraison** clairs (standard, suivi, point relais, main propre).
- **E-mails automatiques** : confirmation de commande, expédition.

## A5. Contenu & produits
- **Fiches produits** détaillées (photos HD, description, options).
- **Pages** : accueil, boutique, à-propos, contact.
- **Version mobile** impeccable (60 %+ des achats sur téléphone).

## A6. Visibilité & suivi (SEO)
- **Balises SEO** (titres, descriptions) + **sitemap** + **robots.txt**.
- **Google Search Console** (indexation, erreurs) — à configurer au lancement.
- **Google Analytics** (statistiques de visites) — installé dès le 1er jour.

## A7. Marketing & lancement
- **Réseaux sociaux** (Instagram…), **newsletter**, éventuellement **publicité**.
- Vérifications avant ouverture (liens, paiement test, mobile, orthographe).

---

# PARTIE B — Tout ce qu'on a DÉJÀ construit sur votre site

> Bonne nouvelle : la plupart des « briques » ci-dessus existent déjà chez vous.
> Voici l'inventaire complet, regroupé par réglage. La plateforme devra centraliser
> tout ça dans un seul tableau de bord.

## B1. Identité & marque ✅
- Nom, baseline, **couleurs** (doré/crème/encre), logo, domaine, e-mail, Instagram.
- Centralisé dans `src/config/marque.js`.

## B2. Réglages de paiement (Stripe) ✅
- Clé secrète, clé publique, secret webhook.
- Checkout sécurisé, recalcul des prix côté serveur, pays de livraison autorisés (FR, BE, CH, LU, DE, ES, IT, NL, PT, MC).

## B3. Réglages e-mails (Resend) ✅
- Adresse de réception, adresse d'expéditeur.
- **E-mails automatiques** : confirmation de commande, « commande expédiée » (avec n° de suivi), e-mail de test, e-mail du formulaire de contact.

## B4. Réglages de livraison ✅
- Forfait **lettre suivie** (3,90 €), **gratuité bijoux** dès 45 €.
- **Paliers colis déco** (1–4 : 6,90 € / 5–12 : 12,90 € / 13+ : 19,90 €).
- **Remise en main propre** (7 €). Seuil cristal (80 €) prêt pour le futur.

## B5. Apparence (modifiable depuis l'admin) ✅
- Couleur principale, **polices** titres & corps (8 au choix).
- **Bandeau d'annonce**, **accès privé** au site (code), bloc accueil (hero), cartes de catégories, section atelier, affichage/masquage des sections, contenu « À propos ».

## B6. Produits & personnalisation ✅
- 7 catégories (bijoux, mariage, cristaux, cadeaux, clés USB, porte-clés, médailles).
- Champs de gravure : **texte, zone de texte, police, photo, menu déroulant, couleur, note**.
- **8 polices** de gravure, **12 motifs** (fleurs + symboles).
- **Prix de gravure** : couverture incluse, page de texte en plus (+3 €), photo (+5 €).
- **Aperçu de gravure** en direct + **aperçu sur photo** + **aperçu 3D** (cœur, modèles .glb/.gltf).

## B7. Ventes & gestion ✅
- **Commandes** (statuts, suivi, remboursement) — stockées dans Firebase.
- **Stock** par variante (épuisé = achat bloqué), **promotions** (prix barré).
- **Devis & factures** avec page partageable, PDF et paiement en ligne.
- **Assistant IA** (Claude) : la gérante parle en français pour modifier la boutique.
- **Upload de photos** clients (Cloudinary / e-mail).

## B8. Pages légales & contenu ✅
- **Mentions légales, CGV, confidentialité (RGPD), retours/rétractation** — déjà rédigées.
- Accueil, boutique, fiche produit, panier, à-propos, contact, merci, annulation.

## B9. SEO & découvrabilité ✅
- Métadonnées (titres, description, mots-clés, Open Graph).
- **Sitemap** dynamique + **robots.txt**.

## B10. Accès & sécurité ✅
- Espace `/gestion` protégé par mot de passe.
- **Accès privé** du site avant ouverture (code).

## B11. Où sont stockés les réglages ✅
- **Netlify Blobs** (catalogue, stock, promos, apparence, modèles 3D).
- **Firebase** (commandes, devis, photos clients).

---

# PARTIE C — Ce que la plateforme devra centraliser

Pour chaque cliente, le tableau de bord de votre application devra gérer **un seul
panneau de réglages** regroupant tout :

| Bloc de réglages | État aujourd'hui | Dans la plateforme |
|---|---|---|
| Identité & marque (nom, couleurs, logo) | ✅ Existe (par site) | Centraliser par cliente |
| Domaine + DNS + SSL | ▸ Manuel | **À automatiser** (registrar API) |
| E-mail professionnel du domaine | ▸ Manuel | **À automatiser** |
| Paiement Stripe | ✅ Existe | Connecter via Stripe Connect |
| E-mails automatiques | ✅ Existe | Centraliser les adresses |
| Livraison (forfaits, paliers) | ✅ Existe | Régler par cliente |
| Apparence (couleurs, polices, accueil) | ✅ Existe | Régler par cliente |
| Produits & personnalisation | ✅ Existe | Régler par cliente |
| Stock, promos, devis, commandes | ✅ Existe | Voir toutes les clientes |
| Pages légales (mentions, CGV, RGPD) | ✅ Existe | **Pré-remplir** par cliente |
| Cookies (bandeau consentement) | ▸ À ajouter | **À intégrer** |
| SEO (titres, sitemap, robots) | ✅ Existe | Régler par cliente |
| Analytics + Search Console | ▸ À ajouter | **À intégrer** |
| Abonnement mensuel de la cliente | ▸ À ajouter | **À intégrer** (Stripe Billing) |
| Accès / mot de passe admin | ✅ Existe | Comptes par cliente (Firebase) |

> **Lecture simple :** tout ce qui est ✅ est **déjà fait** une fois (sur votre site) —
> il « suffit » de le rendre réglable par cliente depuis la plateforme. Tout ce qui est
> ▸ (domaine, e-mail pro, cookies, analytics, abonnements) est **à ajouter** pour que,
> comme vous le souhaitez, **tout se fasse depuis l'application**.

---

## En résumé

- La **Partie A** garantit qu'on n'oublie **rien** de ce qu'exige un vrai site (technique, légal, SEO).
- La **Partie B** montre que **l'essentiel existe déjà** sur votre site — c'est un énorme avantage.
- La **Partie C** est la **feuille de route des réglages** : rendre l'existant pilotable par cliente, et ajouter les quelques briques manquantes (domaine, e-mail pro, cookies, analytics, abonnements) pour que **tout** se gère depuis votre application.
