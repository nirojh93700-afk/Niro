# 📋 Suivi & Audit — Niv Création / Crafia

> Mémoire unique du projet. Mise à jour : 4 juin 2026.
> Auto-entreprise déposée le **04/06/2026** · Début d'activité déclaré : **15/06/2026**.

---

## 1. 🧾 Administratif / création d'entreprise
- [x] **Domiciliation** Les Tricolores — 6 rue d'Armaillé, 75017 Paris (attestation reçue, depuis 03/06/2026)
- [x] **Auto-entreprise déposée** sur le Guichet unique (entreprise individuelle / micro, activité artisanale — fabrication d'objets bois & déco / bijoux personnalisés)
- [x] **Attestation de non-condamnation** générée (PDF) à signer/joindre
- [x] **Les Tricolores** : demande d'ajout de la marque **Crafia** (courrier aux 2 noms)
- [ ] ⏳ **Recevoir le SIRET** (1-3 sem.) → **me l'envoyer** pour compléter CGV + mentions légales
- [ ] 🎁 **Demander l'ACRE** à l'URSSAF — **avant ~19 juillet 2026**
- [ ] 💳 **Compte bancaire dédié** (conseillé ; obligatoire si > 10 000 €/an sur 2 ans)
- [ ] 📊 **Déclarer le CA chaque mois** à l'URSSAF (même 0 €) — 1re fois ~fin octobre 2026 (rappel auto dans l'admin)

## 2. 🌐 Domaine & hébergement
- [x] Site hébergé sur **Netlify** (projet `exquisite-khapse-7af3a0`)
- [x] **nivcreation.fr** branché sur Netlify (DNS Hostinger : ALIAS @ → apex-loadbalancer.netlify.com, CNAME www → exquisite-khapse-7af3a0.netlify.app) — **HTTPS actif** 🔒
- [x] **nivcreation.com** laissé sur **Shopify** (séparé, on n'y touche pas)
- [x] Adresse par défaut du site = **https://nivcreation.fr** (méta, sitemap, robots)

## 3. 💳 Paiement & intégrations (Netlify env)
- [x] **Stripe** (clé secrète) — Configuré ✅
- [x] **Webhook Stripe** (e-mail commande + baisse stock) — Configuré ✅
- [x] **Resend** (e-mails contact + commandes) — Configuré ✅
- [x] **Adresse e-mail de réception** — Configuré ✅
- [ ] **Cloudinary** (téléversement photos depuis l'admin) — optionnel, non configuré

## 4. 🛍️ Site web — fonctionnalités
- [x] Admin `/gestion` : Commandes, Statistiques, Clientes, Devis/Factures, Produits, Gravure, Stock, Promos, Photos, Apparence, Réglages
- [x] **Rappel mensuel URSSAF** en haut de l'admin
- [x] **Module Devis / Factures** (création, doc partageable, paiement en ligne, PDF)
- [x] **Apparence éditable** (couleurs, polices, accueil, sections, page À propos)
- [x] **Contact « sur mesure »** : bannière accueil + encart catégories **Mariage** & **Déco/Cadeaux** + petit encart sur fiches produit (auto par catégorie)
- [x] **Catégories** rangées : ordre = Bijoux · Mariage · Cristal 3D · Déco & Cadeaux · Clés USB · Porte-clés · **Médaillons & Pièces** (la pièce laiton est dans sa propre catégorie)
- [x] **Accès privé au site** : code d'entrée **`Niro2026`** (activable/modifiable dans Admin → Apparence)

## 5. 📄 Pages légales
- [x] **CGV** : identité (EI micro, Nirojh Kamalanathan), TVA non applicable art. 293 B, rétractation, garanties
- [x] **Mentions légales** : éditeur, directeur de publication, hébergeur Netlify
- [ ] **SIRET** à insérer (en attente) — dans CGV + mentions légales
- [ ] **Médiateur de la consommation** : adhérer à un service (CM2C / Medicys / AME…) puis ajouter ses coordonnées aux CGV

## 6. ⚠️ Points de vigilance avant d'ouvrir au public
1. Ne prendre de **vraies commandes** qu'après le **15 juin** (date de début déclarée) **et** réception du **SIRET**.
2. Compléter **SIRET** + **médiateur conso** dans les pages légales.
3. Ouvrir la boutique = **décocher** « Accès privé » dans Admin → Apparence.

---

### 📌 Infos clés
| Élément | Valeur |
|---|---|
| Entrepreneur | Nirojh Kamalanathan |
| Marques | NivCréation + Crafia |
| Activité | Fabrication artisanale (bois/déco) + bijoux personnalisés |
| Siège (domiciliation) | 6 rue d'Armaillé, 75017 Paris — SIREN domiciliataire 849 409 313 |
| Régime | Micro-entrepreneur · cotisations mensuelles · franchise TVA |
| Site | nivcreation.fr (Netlify) · code d'accès Niro2026 |
| Contact public | contact.nivcreation@gmail.com · 07 66 15 31 02 |
