# ✦ OFFRE « GRAVURE OFFERTE » — PROCÉDURE DE LANCEMENT (pour l'autre conversation)

> ⛔ **NE LANCER QUE SUR DEMANDE EXPLICITE DU GÉRANT** (« lance l'offre gravure »,
> « envoie l'offre »). Consigne du 17/09/2026 : *« tu mets tout en place pour que l'autre
> conversation l'envoie quand je lui demande ; sans que je lui demande, il faut pas que ça
> soit envoyé. »* Tant qu'il n'a rien dit : **rien n'est envoyé, l'offre reste ÉTEINTE.**

## Ce qui est prêt (construit le 17/09/2026, commit sur `claude/site-product-overview-1t2de`)

- **Un code par cliente** (`GRAVURE-A7K2M`…), réservé à son adresse, une seule utilisation,
  qui expire à la date de fin de l'offre. Les trois verrous sont vérifiés côté serveur.
- **La vraie gravure est offerte** : au paiement, la remise = **le prix réel de la première
  gravure du panier** (3 € bijou, 5 € cristal ou page de médaillon, 7 € 2e face du whisky…),
  **sur n'importe quel produit** (choix du gérant du 17/09 — les verres ne sont plus exclus).
  Restent payants : les gravures suivantes, la photo gravée, le socle LED, le coffret de verres.
  Sans gravure payante dans le panier, le code ne déduit rien et le panier le dit à la cliente.
- **L'e-mail est adapté à chaque cliente** : phrase d'ouverture selon son ancienneté, SON code,
  et **ses favoris** (si elle s'est connectée un jour) — sinon trois idées gravables. Prix et
  photos lus dans le catalogue en direct au moment de l'envoi.
- **Nettoyage automatique** des codes expirés / utilisés à chaque passage, + bouton dans l'écran.
- **Qui reçoit** : inscrites à la newsletter **sans aucune commande**, inscrites depuis
  **plus de 3 jours** (réglable), **une seule fois** chacune. Celles qui atteignent les 3 jours
  pendant l'offre sont servies au fil de l'eau par le battement du site.

## Le jour où il dit « lance » — 5 étapes, dans l'ordre

1. **`git pull`** sur la branche (le code du 17/09 doit être déployé — vérifier que
   Gestion → Marketing → Offre gravure offerte affiche le KPI « Codes personnels actifs »).
2. **Gestion → Marketing → ✦ Offre gravure offerte** :
   - cliquer **« Ouvrir pour un mois »** (met Activer + début aujourd'hui + fin dans 30 jours),
     ou régler les dates à la main si le gérant a donné une période ;
   - **Préfixe des codes** : laisser `GRAVUREOFFERTE` (ou ce qu'il demande) ;
   - **Inscrites depuis au moins** : 3 jours (ne pas descendre sous 3 : les nouvelles viennent
     de recevoir BIENVENUE10) ;
   - **Cadeau surprise** : coché SEULEMENT si le mode délai allongé est encore allumé (c'est lui
     qui fait apparaître le choix du cadeau au paiement). S'il est éteint, DÉCOCHER — sinon
     l'e-mail promet un choix que la cliente ne verra pas ;
   - **Enregistrer**.
3. Lire le KPI **« À servir maintenant »** et **l'annoncer au gérant** (« N inscrites vont
   recevoir l'offre ») **avant** de cliquer.
4. **« Envoyer maintenant »** → confirmer. Chaque cliente reçoit son e-mail avec son code.
   Le toast dit combien sont partis.
5. Le rapporter au gérant : combien d'envois, et rappeler que les suivantes (celles qui
   atteignent 3 jours pendant l'offre) partent toutes seules chaque jour tant que l'offre est
   ouverte. **Pour arrêter** : décocher Activer + Enregistrer (ou attendre la date de fin).

## Ce qu'il ne faut PAS faire
- Ne pas envoyer par Gmail ni par une routine Claude : c'est **le site** qui envoie.
- Ne pas créer les codes à la main dans Promotions : ils sont générés à l'envoi, un par cliente.
- Ne pas mettre l'offre sur le site (bandeau, encart) : **e-mail uniquement**, décision du 11/09.
- Ne pas modifier le texte de l'e-mail sans son accord (`src/lib/offreGravure.js`).

## Si une cliente écrit « mon code ne marche pas »
Son code est enregistré **à côté de son adresse** dans la section `offreGravure` du blob
(`{ email: { at, code } }`). Vérifier : (1) elle tape **son adresse** au panier — le code est
réservé à celle de l'e-mail ; (2) son panier contient **une gravure payante** (un texte à graver)
— sans ça, le code n'a rien à déduire ; (3) le code n'est pas **expiré** (date de fin) ni
**déjà utilisé**. Répondre par **Gestion → Clients → Messages clients**, jamais Gmail.

## Fichiers
`src/lib/jobs.js` (`runOffreGravureJob` : cibles, codes, e-mails, nettoyage) ·
`src/lib/offreGravure.js` (e-mail) · `src/lib/engravingPrice.js` (`prixPremiereGravure`) ·
`src/app/api/checkout/route.js` + `src/app/api/promo-validate/route.js` (la règle au paiement
et au panier) · `src/lib/stock.js` (`setPromoCode` avec `email`/`kind`,
`purgeExpiredPromoCodes`) · `src/app/api/admin/offre-gravure/route.js` ·
`src/app/gestion/offre-gravure/page.jsx`.
