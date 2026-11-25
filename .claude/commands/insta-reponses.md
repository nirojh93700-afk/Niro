---
description: "Niv Création · Instagram 6/7 — préparer les réponses aux commentaires et messages privés Instagram que le gérant colle dans la conversation (question de prix, de délai, de gravure, cliente mécontente). Quand le gérant dit « réponds à ce commentaire / ce message Insta »."
---
# Réponses aux commentaires et messages Instagram

On PRÉPARE la réponse ; c'est le gérant qui la copie dans Instagram. Rien n'est envoyé par nous.

1. Lire `docs/instagram/REGLES-INSTAGRAM.md` et les règles des mails clients de `CLAUDE.md` (elles valent aussi ici).
2. Lire exactement ce que la personne a écrit, sans rien inventer. Si c'est une cliente : retrouver sa commande ou son dossier
   (`/api/admin/orders`, `/api/admin/comms?email=`) s'il donne son nom ou son e-mail.
3. Règles :
   - prix = celui de la fiche (`node tools/prix-fiche.mjs <slug>`), avec le détail (article + gravure), jamais de remise inventée,
     aucun mot sur la livraison sauf si on le demande ;
   - aucune date, aucun « aussitôt » ; jamais un mot sur la machine ;
   - personnalisé = pas de retour (le dire seulement si c'est demandé, poliment) ;
   - image personnalisée : oui, c'est possible (fiche « Ma photo ou mon logo » ou « Faire une demande particulière ») ;
   - cliente mécontente en public : réponse courte et polie + « écrivez-nous en message privé », puis prévenir le gérant ;
   - vérifier sur Internet avant d'affirmer un rendu de gravure (verre = blanc givré, aucune couleur).
4. Réponse courte (2 à 4 phrases pour un commentaire), vouvoiement, signée « Niv Création » en message privé seulement.
