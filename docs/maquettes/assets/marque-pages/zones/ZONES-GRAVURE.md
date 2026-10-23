# Zones de gravure des marque-pages — données du gérant, 23/10/2026

Dessinées par le gérant avec l'outil https://claude.ai/artifact/6gNFwNMq5fsE4efqPoS6P6 (photos redressées
`m1-face.jpg`, `m1-dos.jpg`, `m2-face.jpg`, `m2-dos.jpg` ; 260 px de large, le trou du cordon EN HAUT).
Coordonnées dans `zones-gravure.json` : fractions 0–1 de la largeur / hauteur de la photo redressée
(`x`, `y` = coin haut-gauche, `w`, `h`). Contrôle visuel : `zones-controle.jpg`.

Code brut reçu (ZONES-MP) : voir `zones-gravure.json` (regroupé par emplacement).

## Lecture (confirmée par sa phrase : « les textes qui sont en bas, c'est écrit de bas en haut ou de haut en bas,
## pareil ; pour l'arrière t'as compris »)
- Chaque face a DEUX emplacements : **HAUT** (sous le trou du cordon) et **BAS**. Chacun reçoit **le nom OU le dessin**.
- **Nom en HAUT** = écrit à l'horizontale, sur une ligne (zone large et basse).
- **Nom en BAS** = écrit à la **VERTICALE**, le long du marque-page (de bas en haut ou de haut en bas, au choix de l'atelier).
- **Dessin en HAUT** = petit (≈ 60 % de la largeur, ≈ 11 % de la hauteur) ; **dessin en BAS** = grand (presque toute la largeur,
  ≈ 60–70 % de la hauteur).
- **Modèle 1 (bois, pompon doré)** : face et dos identiques (bois nu des deux côtés).
- **Modèle 2 (ajouré, oiseau et magnolia)** — face : HAUT = la bande de bois au-dessus de la fenêtre ajourée (y ≈ 0,08–0,16) ;
  BAS = la bande de bois À GAUCHE de la branche, entre la fenêtre et l'oiseau (x ≈ 0,16–0,45, y ≈ 0,49–0,74). Dos = comme le
  modèle 1 (il n'a rien dessiné : « pour l'arrière t'as compris »).
  ⚠️ La maquette enregistrée du modèle 2 ne vend QUE le texte au verso (+3 €). Ses zones sur la FACE sont enregistrées ; à lui
  de dire si la face se grave aussi (texte / dessin dans les blancs du bois) avant de toucher la maquette.
- Modèle 3 (métal) : pas de gravure, pas de zones.

## À quoi ça sert (au « applique »)
- `engrave.box` / zones d'aperçu de la fiche (comme les verres : `box`, `maxWidthFrac`) : HAUT pour le nom horizontal, BAS pour
  le dessin ; nom en bas = texte tourné de 90°.
- Fiche atelier (`consignesGravure`) : « Nom : en haut, horizontal » ou « Nom : en bas, à la verticale » ; « Dessin : en bas,
  grand » ou « en haut, petit », selon ce que la cliente a choisi.
