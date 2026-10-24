# Dessins découpés pour l'aperçu des marque-pages (24/10/2026)

`<n°>.png` = le dessin n° du gobelet (planches validées de `docs/maquettes/gobelet-configurateur-final.html`), fond transparent,
encre = noirceur. 1–74 = dessins · 88–94, 96, 98, 100, 101, 102 = cadres retenus pour un marque-page (les autres cadres sont trop larges).
⚠️ 24/10 soir (gérant) : 96+97, 98+99 et 102+103 sont chacun UN SEUL cadre (deux filets, le texte s'écrit entre les deux) → 096.png, 098.png et 102.png sont les cadres complets ; 097, 099 et 103 n'existent plus (86 fichiers).
Fabrication : `tools/maquettes/marque-pages-badges.py` (détection des pastilles numérotées + boîtes automatiques) puis
`tools/maquettes/marque-pages-decoupe-dessins.py` (boîtes corrigées à la main pour les planches 1–10, 11–27, 28–36, 37–45, 88–91 ;
découpe par composantes d'encre). `CONTROLE.jpg` = la planche de contrôle regardée. Servis par `tools/maquettes/mp_apercu.py`.
⚠️ 24/10 soir (gérant, capture du coffret : « ce dessin il est à l'envers, il faut que tu fasses attention sur les dessins ») : le **n° 5** est
dessiné sur la planche avec la rose AU PIED et la tige qui monte ; sur un marque-page il se lit à l'envers → `005.png` est tourné de 180° (rose en
haut, tige qui retombe ; `RETOURNES={5}` dans le script de découpe). Les 85 autres découpes ont été revues une par une sur `CONTROLE.jpg` : elles se
lisent dans le bon sens (fleur ou animal en haut, tige en dessous ; le n° 6 a bien sa tige sous la fleur). Au milieu d'un marque-page, un dessin
LARGE ou un cadre est posé à la verticale (tourné de −90°, le haut du dessin vers la gauche, comme un texte qui se lit de bas en haut).
