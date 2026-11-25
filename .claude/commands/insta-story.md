---
description: "Niv Création · Instagram 5/7 — préparer une série de stories (1080×1920) : nouveauté, coulisses de gravure, sondage, question, compte à rebours de fête, avis client, avec l'autocollant lien marqué utm. Quand le gérant dit « fais-moi des stories »."
---
# Stories Instagram

1. Lire `docs/instagram/REGLES-INSTAGRAM.md`.
2. Proposer une série de 3 à 6 stories, chacune avec : image (1080 × 1920, zone haute et basse de 250 px laissée libre pour
   l'interface d'Instagram), texte court, autocollant à ajouter par le gérant (Sondage, Question, Quiz, Compte à rebours, Lien).
   Idées : « Lequel préférez-vous ? A / B » · « Que graveriez-vous dessus ? » · avant / après (vierge → gravé, photos réelles seulement)
   · un avis client RÉEL lu dans `GET /api/reviews` (prénom seul, jamais inventé).
3. Lien : `https://nivcreation.fr/produit/<slug>?utm_source=instagram&utm_medium=story&utm_campaign=<sujet>` (vérifier que la fiche existe et est en vente).
4. Images avec Pillow (photo entière + fond flou, polices de la marque, logo d'origine), dans
   `docs/instagram/stories/AAAA-MM-JJ-<sujet>/`, regardées puis envoyées au gérant avec le texte de chaque autocollant.
