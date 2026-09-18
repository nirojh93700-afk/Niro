# 📦 Message prêt — retour du colis, commande #1S9IOON5 (Hend Musallam)

> ✅ **ENVOYÉ le 17/09/2026** sur « envoie » du gérant, par le site (`send-client-email`,
> bouton Répondre inclus, tracé dans le dossier). **Version RACCOURCIE à sa demande** : le mail
> demande seulement « souhaitez-vous que nous vous le renvoyions ? » — AUCUNE mention de mode de
> livraison ni de frais. **Quand elle répond oui : lui demander relais/domicile + adresse, et LÀ
> parler des frais** (4,90 € relais / 6,90 € domicile, décision du 15/09 — sauf s'il change d'avis).
> Le colis a été récupéré au relais par le gérant (17/09).
>
> ⛔ **RETIRÉ DE GESTION À SA DEMANDE** (15/09) : « tu enlèves ce mail de la gestion, tu le mets
> en attente, pour pas qu'on se trompe et qu'on l'envoie ». Il n'apparaît donc **plus** dans
> Gestion → Clients → Messages clients — impossible de l'envoyer par erreur d'un clic.
> **Pour le remettre** quand il le demandera : recopier l'entrée ci-dessous dans
> `MESSAGES_PRETS` (`src/lib/messagesPrets.js`). Sinon il peut aussi copier-coller le texte
> directement dans le formulaire Messages clients.

## Le contexte

- Commande **#1S9IOON5** du 31/08/2026, payée **30,21 €** par PayPal (transaction `3A007117GV571102X`).
- **1× Bracelet Femme Cœur doré gravé « Hend »** (police Allura) + boîte cadeau.
- Cliente : **Hend Musallam**, 31 rue d'Etrembières, 74100 Annemasse ·
  `e.varol2012@icloud.com` · 07 49 37 63 26.
- Envoi Boxtal `#2609011116MONRXTX0FR`, suivi `71133346`, offre **« Domicile France »**.
- **03/09 14 h 14** : livraison tentée à son adresse → « destinataire absent » + 1er avisage e-mail.
  Colis dérouté en relais, **disponible le 04/09 9 h 26** + 2e avisage 9 h 29. **Jamais retiré en
  7 jours** → retour à l'expéditeur le 11/09 → arrivé au relais de Sarcelles le 15/09.
- **Décision du gérant** : réexpédition possible mais **frais à la charge de la cliente**
  (4,90 € en relais / 6,90 € à domicile) — il ne peut pas offrir le port.
- Si elle ouvre une réclamation PayPal : `docs/messages/paypal-litige-1S9IOON5.md`.

## Le message (à envoyer par Gestion → Clients → Messages clients)

**Destinataire** : `e.varol2012@icloud.com`
**Objet** : `Votre bracelet nous est revenu — comment on le remet en route`

```
Bonjour,

Votre commande nous est revenue cette semaine, et nous voulions vous
expliquer ce qui s'est passé.

Le transporteur s'est présenté à votre adresse le 3 septembre ; personne
n'étant là, il a déposé le colis dans un point relais et vous a prévenue
par e-mail. Le colis y est resté à votre disposition jusqu'au
11 septembre, puis il nous a été automatiquement renvoyé.

Votre bracelet est donc bien là, intact dans son écrin, avec la gravure
« Hend ».

Nous pouvons vous le renvoyer dès que vous le souhaitez. Le premier envoi
ayant été consommé, il reste les frais de réexpédition à prévoir :
4,90 € en point relais, ou 6,90 € en livraison à domicile.

Dites-nous simplement ce que vous préférez, et confirmez-nous l'adresse —
ou le point relais — à utiliser : nous voulons être sûrs qu'il arrive
entre vos mains cette fois. Nous vous enverrons ensuite un lien de
paiement sécurisé pour ces frais, et le bracelet repart dès le règlement
reçu.

Désolés pour ce contretemps, et merci de votre compréhension.

Bien cordialement,
Niv Création
nivcreation.fr
```

## Ce qui a guidé la rédaction

- **Les faits datés** (tentative de livraison, avisages, 7 jours) justifient les frais **sans
  lui faire de reproche** : on garde le vocabulaire du transporteur.
- **Aucune mention de remboursement** (règle de la boutique : personnalisé = jamais remboursé).
- **Aucune date de livraison promise.**
- « revenue **cette semaine** » et non « aujourd'hui » : le texte reste juste quel que soit le
  jour de l'envoi.
- Signature **Niv Création**, aucun nom de personne.

## L'entrée à recopier dans `MESSAGES_PRETS` pour le remettre dans Gestion

```js
{
  id: "1S9IOON5-colis-revenu",
  client: "Hend Musallam",
  ref: "1S9IOON5",
  piece: "Bracelet Femme Cœur doré gravé « Hend » (police Allura) + boîte cadeau — payé 30,21 € le 31/08",
  note: "Colis revenu (livraison tentée le 03/09, destinataire absent, 2 avisages, 7 jours au relais, retour le 11/09). Frais de réexpédition à sa charge : 4,90 € relais / 6,90 € domicile. Dossier PayPal prêt si réclamation : docs/messages/paypal-litige-1S9IOON5.md",
  to: "e.varol2012@icloud.com",
  subject: "Votre bracelet nous est revenu — comment on le remet en route",
  body: `… le texte ci-dessus …`,
},
```


## Suite — 18/09/2026
- Elle a répondu le 17/09 au soir (bouton Répondre) : était en vacances · renvoi en **point
  relais Mondial Relay d'Ambilly, « vers la Panière »** (PAS à domicile) · veut **changer le
  prénom gravé → « Melyna »**.
- ✅ **Réponse PROGRAMMÉE le 18/09 à 10 h 00 (Paris) par le site** (id `sch_cgg8ikilmu6j3ohy`,
  objet « Re : » = même fil) : gravure ineffaçable, le bracelet « Hend » reste à elle ; nouveau
  bracelet « Melyna » **22,41 €** + livraison **4,90 relais / 3,90 lettre / 6,90 colis-boîte** ;
  règlement par **devis** OU **commande sur la fiche** ; **les deux bracelets dans le même colis**.
- **Suite selon sa réponse** : « d'accord pour le devis » → créer le devis (bracelet 22,41 +
  livraison choisie) sur ordre du gérant ; si elle commande sur la fiche → glisser le bracelet
  « Hend » dans le colis. Note : les frais de réexpédition du bracelet « Hend » seul ne sont plus
  facturés à part — la livraison de la nouvelle commande couvre le colis commun.
