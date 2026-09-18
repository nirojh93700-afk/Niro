# Ludovic NOEL — réponse « pas de coffret » (préparée le 16/09/2026)

> ## ✅✅ ENVOYÉ LE 18/09/2026 AU SOIR — DEVIS DEV-1506 + MAIL (ordre du gérant « tu peux tout envoyer »)
> - **Numérotation remontée à sa demande** (« le client verra pas que c'est le 5e ») : nouvelle
>   action admin `POST /api/admin/quotes {action:"counter",type:"devis",value:1505}` (commit
>   `490968b`, jamais vers le bas), compteur mis à 1505 → DEV-0005 supprimé, devis recréé
>   **DEV-1506** (id `1A7Rj7Kb8j0swpsavtYJ`), total **89,70 €**. Prochains devis : 1507, 1508…
> - **Devis DEV-1506 ENVOYÉ** à ludsolo@gmail.com (lien de validation/paiement en ligne).
> - **Mail d'accompagnement ENVOYÉ** (via le site, `via:"gmail"` = boîte connectée, bouton
>   Répondre structurel) : confirme n°2 + coffret, annonce le devis en e-mail séparé, et
>   demande ce qu'il veut sur le COUVERCLE (même style n°2 ou autre texte/dédicace/motif).
> - **En attente de Ludovic** : sa réponse couvercle + le règlement du devis. Après paiement :
>   fichiers HD (2 verres + couvercle) ; côté gérant : acheter 2× Cabernet Tulipe 47 cl +
>   coffret Creative Deco 40×30×14.

> ## ✅ SUITE — 18/09/2026 : gravure n°2 choisie + coffret OK + DEVIS DEV-0004 CRÉÉ
> - Ludovic a répondu le 18/09 à 15 h 56 (bouton Répondre) : « Je choisi la gravure n°2.
>   Ok pour le coffret en bois. Dans l'attente de votre devis. »
> - **Devis créé le 18/09 (NON envoyé)** : **DEV-0005** (id `mzH21RaljmlFpwU3GOc4`) —
>   le DEV-0004 initial (livraison 12,90) a été supprimé et recréé sur choix du gérant,
>   Gestion → Devis & factures. Lignes : verre « Claude · Millésime 1976 » 18,90 · verre
>   « Ami de Claude · Millésimé » 16,00 (= lot 34,90) · coffret bois couvercle gravé 39,90 ·
>   **livraison domicile 14,90** (grille du site, palier 2-5 kg — choix du gérant 18/09).
>   **Total 89,70 €.**
> - **Verre à acheter (dit au gérant le 18/09)** : 2× **Chef & Sommelier Cabernet Tulipe 47 cl**
>   (Ø 9,0 × H 22,0 — rentre dans le coffret 40×30×14) ; l'alternative Grands Cépages 47 cl
>   (Ø 9,5 × H 22,7) rentre aussi mais plus juste. + coffret Creative Deco 40×30×14 (~29,95 €).
> - Champ « Demande du client » rempli : style n°2 (étiquette grand cru — filets fins,
>   capitales espacées, losange), textes exacts des 2 verres, coffret 40×30×14 couvercle
>   gravé (motif du couvercle à confirmer), demande d'origine du 16/09, fichiers HD après
>   règlement.
> - **Mail d'accompagnement PRÉPARÉ, montré au gérant, PAS ENVOYÉ** (« Ne envoie rien ») :
>   confirme n°2 + coffret, annonce le devis, et demande s'il veut le MÊME style n°2 sur le
>   couvercle ou autre chose. Texte dans la conversation du 18/09 — attendre son « envoie ».
> - Après paiement : produire les fichiers HD (2 verres + couvercle) ; côté gérant : acheter
>   coffret Creative Deco 40×30×14 + verres 47 cl.

**Statut : ✅ PROGRAMMÉ le 16/09 au soir pour le 17/09 à 9 h 30 (heure de Paris) par le site**
(`/api/admin/scheduled`, id `sch_yq034h6fmu4eiveq` — visible/annulable dans Gestion → Clients →
Messages clients). Objet en « Re : » pour rester dans le même fil que le mail du 16/09.
Ordre du gérant du 16/09 au soir : « prépare le mail, tu dis qu'il y a pas de coffret,
t'envoie rien, tu le mets à l'heure d'ouverture demain ». La programmation par l'API
(`POST /api/admin/scheduled`) a été **bloquée par les permissions de l'environnement** —
à refaire (moi sur son feu vert, ou lui dans Gestion → Clients → Messages clients →
« Programmer »).

- Contexte : Ludovic a répondu OUI le 16/09 à 13 h 43 (bouton « Répondre ») : 47 cl ok,
  prix ok, ornement laissé à notre choix (fin, contemporain, pas rustique), demande si
  les verres arrivent **en coffret** (décision du 16/09 au soir : coffret bois Creative Deco 40×30×14 à 29,95 € + calage, couvercle GRAVÉ par le gérant aux mêmes textes/ornement, proposé à Ludovic à 39,90 € — si pris : livraison du devis à recalculer au poids, ~10,90-12,90 € au lieu de 8,90), et veut « le plus vite
  possible » (aucune date à promettre — délai 3-4 semaines déjà annoncé et accepté).
- Après ce mail : **le devis 43,80 €** (voir `noel-verre-vin-45cl.md`) reste à créer
  et envoyer sur ordre du gérant.
- Destinataire : `ludsolo@gmail.com`

## Image des propositions (hébergée sur le site, invisible ailleurs)

`https://nivcreation.fr/api/img/5KbYKEL8WHoKPvvmT9qW` — la planche des 9 ornements
avec LES DEUX VERRES côte à côte dans chaque style (version cliente FILIGRANÉE partout + tampon « NIV CRÉATION » posé SUR chacune des 18 gravures (demande du gérant, 16/09) — basse définition volontaire, les fichiers de gravure HD restent chez nous ; régénérable depuis
`scratchpad/planche-client3.html`). Pour un envoi immédiat par Messages clients, passer
cette adresse dans le champ `imageUrl` de `/api/admin/send-client-email` (l'image
s'affiche alors EN HAUT du mail). L'envoi PROGRAMMÉ (`/api/admin/scheduled`) ne sait
afficher que du texte → y mettre l'adresse en lien dans le corps (Gmail la rend cliquable).

## Objet

Re : Vos deux verres gravés — c'est faisable

## Message

Bonjour Ludovic,

Merci pour votre retour rapide.

Pour l'ornement, nous vous avons préparé neuf propositions, dessinées sur le verre avec vos deux textes. Toutes restent dans l'esprit convenu : fin, harmonieux, contemporain. Répondez-nous simplement avec le numéro qui vous plaît (1 à 9). Si aucune ne vous convient tout à fait, dites-le nous : nous vous préparerons volontiers d'autres propositions. Et si vous préférez nous laisser la main, nous choisirons pour vous dans cet esprit.

Vous pouvez voir les propositions ici :
https://nivcreation.fr/api/img/5KbYKEL8WHoKPvvmT9qW

Pour répondre à votre question sur le coffret : les deux verres arrivent en temps normal soigneusement emballés et protégés, chacun calé individuellement. Mais si vous souhaitez en faire un cadeau complet, nous vous proposons un coffret en bois dont le couvercle est gravé lui aussi, avec les mêmes inscriptions et le même ornement que les verres. Les deux verres y sont présentés calés, prêts à offrir. Ce coffret bois gravé est en supplément, à 39,90 € — dites-nous dans votre réponse si vous le souhaitez et nous l'ajouterons au devis.

Côté délai, c'est bien noté : votre commande sera traitée dans son ordre d'arrivée dès le règlement, et nous ferons au plus court.

Nous vous envoyons le devis très rapidement : vous pourrez le valider et le régler en ligne, en toute sécurité. Dès le règlement reçu, la gravure est mise en route.

À très vite,

Niv Création
nivcreation.fr
