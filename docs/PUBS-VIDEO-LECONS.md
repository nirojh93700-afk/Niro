# Pubs vidéo (Higgsfield) — Leçons & défauts à NE PAS refaire

> Journal des erreurs commises pendant la création de pubs vidéo, pour ne pas recommencer.
> **À lire AVANT toute génération de vidéo/image payante.**

## ⭐ RECETTE VALIDÉE — Mannequin qui PARLE et PRÉSENTE le vrai produit (à suivre TOUJOURS)
> Demande explicite de l'utilisatrice : **un mannequin qui parle, en français, bouche synchronisée, qui présente le VRAI produit.** Si je ne peux pas faire ça, je NE fais PAS et je le dis. Ne plus jamais improviser ni changer de mannequin.

**Paramètres VERROUILLÉS :**
- **Mannequin = M2** (image Higgsfield job `72b420c8-98b6-475c-81a1-add36ec783e9`, la blonde). **NE JAMAIS changer de mannequin** sans demander. (Clara/Marketing Studio = visage imposé ≠ M2 → erreur déjà commise.)
- **Langue = FRANÇAIS obligatoire**, sur toutes les vidéos.
- **Voix = premium ElevenLabs** (`generate_audio`, model `text2speech_v2_elevenlabs`, voix « Elena » `ca83ca7f-c186-493d-bd69-0d765fa861b2`). PAS edge-tts.
- **Toujours annoncer le coût et attendre un « oui » écrit avant de générer. Vérifier image par image avant d'envoyer.**

**Pipeline qui marche (≈ 18 cr) :**
1. **Image** : `generate_image` `nano_banana_2`, 9:16, 2 entrées = [image M2 (job 72b420c8) + vraie photo produit] → prompt « remplace le verre dans sa main par le verre gravé exact de la 2e image, garde la gravure identique et lisible, garde la femme 100% identique ». **≈ 1,5 cr.** → M2 tenant le VRAI produit, gravure fidèle. **Faire valider l'image avant la suite.**
2. **Voix** : `generate_audio` ElevenLabs Elena, texte FR. **≈ 0,5 cr.** Uploader le mp3 (`media_upload`/`media_confirm`).
3. **Vidéo parlante** : `generate_video` **`wan2_7`**, 9:16, medias = [start_image = image étape 1] + [audio = voix étape 2]. Wan **fabrique les lèvres À PARTIR de la voix française** → bouche réellement synchronisée + elle tient le vrai produit. **≈ 16,5 cr** (~11 s). Passer `declined_preset_id` si Higgsfield propose le preset « IN THE DARK ».
4. **Montage gratuit** : carte `nivcreation.fr` en bas via PNG PIL + `overlay` (band placé bas, ne cache pas le produit). Vérifier image par image avant d'envoyer.

**Pourquoi PAS les autres outils (vérifié, ne pas refaire) :**
- **Marketing Studio** : refuse les avatars perso (impose Clara/Ren) ET sort en anglais (`prompt_language:"en"`, pas de réglage FR). → mauvais mannequin + mauvaise langue.
- **Kling 3.0** : son = charabia FR ; en `sound:off` elle **ne parle pas** (plan muet) → ce n'est pas « un mannequin qui parle ».
- **Wan 2.7 sur l'image BRUTE de M2** (sans étape 1) : elle tient un verre à **fausse gravure** inventée. → toujours passer par l'étape 1 (composite du vrai produit) d'abord.

## Règles d'or (argent / crédits)
1. **Toujours annoncer le coût en crédits AVANT de générer, et attendre le « OK » explicite.** Ne jamais lancer une génération payante sans validation.
2. Viser **le moins de crédits possible**. Le calcul de coût (`get_cost:true`) ne coûte rien → l'utiliser systématiquement.
3. Montrer **l'image de base** (gratuite/à ~2 cr) et la faire **valider** avant de payer une vidéo.
4. Je ne peux pas rembourser : les crédits sont gérés par **Higgsfield** (support@higgsfield.ai). Plan PLUS = 1000 cr/mois.

## Fidélité des bijoux (LE point sensible)
- ✅ **100 % fidèle** : animer **la VRAIE photo produit** (plan macro/produit). C'est sa photo → identique.
- ✅ **Convaincant** : un **bracelet simple porté** au poignet (bracelet-femme-acier, -coeur, bracelets homme).
- ❌ **NE JAMAIS faire** (l'IA invente / rate) :
  - L'**ouverture** du collier enveloppe ou des médaillons (mécanisme).
  - Tout bijou avec **gravure/texte fin** recréé sur une personne.
  - Le **cristal photo 3D** recréé.
- ❌ **Ne JAMAIS réutiliser une image de mannequin qui porte déjà un bijou** : l'outil le met en avant → bijou raté. Pour une vidéo « présentation », **AUCUN bijou à l'écran** sur la personne ; montrer les bijoux via **les vraies photos** en plan de coupe.

## Mannequin / décor
- Pas de « selfie maison assise » : l'utilisatrice veut un **vrai décor** (café, boutique, extérieur). Utiliser les **photos de mannequin fournies** (ex. café `IMG_2789` = bonne, aucun bijou).
- L'IA **déforme la tasse / les mains** → recadrer en **tête‑épaules** (gratuit, ffmpeg) pour la faire disparaître.

## Voix / audio
- ❌ **Kling 3.0** (sound on, ~30 cr) : voix française **NON FIABLE** (sort en charabia/mauvaise langue). **Ne pas l'utiliser pour du parlé FR.**
- ✅ **Marketing Studio** (`marketing_studio_video`, generate_audio) : **voix FR correcte + lèvres synchro**. Coûts : 10 s 720p ≈ **50 cr**, 15 s 720p ≈ **75 cr**, 15 s 1080p ≈ **150 cr**. ⚠️ Rendu **très long** (~1–2 h quand chargé).
- Voix off gratuite de secours : **gTTS** (`pip install gTTS`, lang="fr") → prononciation correcte, **0 crédit**. MAIS si on remplace l'audio d'une vidéo déjà parlante, **les lèvres ne collent plus** (désync). À réserver aux plans sans visage (B‑roll) ou assumer le défaut.

## Texte à l'écran / sous‑titres / nom du site
- ❌ Ne **PAS** faire écrire le texte par l'IA vidéo (elle déforme les lettres).
- ✅ Les ajouter **en montage** : `imageio-ffmpeg` (pas de `drawtext`/`libass` dans ce build) → générer des **PNG transparents avec PIL** (police `/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf`) puis filtre **`overlay`**. Orthographe parfaite, **0 crédit**.

## Catalogue (rappel)
- Bijoux **reproductibles portés** : `bracelet-femme-acier`, `bracelet-femme-coeur`, `bracelet-empreinte-pied-bebe`, `bracelet-homme-*`.
- Bijoux **à éviter** en « porté/animé » : `collier-enveloppe-message-secret`, `collier-medaillon-coeur-ouvrable`, `collier-medaillon-livre`, cristaux.
- **Pas de couverts personnalisés** au catalogue → ne pas le proposer.
- Photos produits locales : `public/produits/…` (ex. `bracelet_femme_coeur_a_graver_dore.jpg`).

## Limite honnête à dire à l'utilisatrice
- L'IA fait du **« bon UGC »**, **pas** une pub **studio parfaite**. Des petits défauts (voix ou lèvres pas nickel) sont **inévitables**. Le dire **avant**, ne pas survendre (« je sais le faire » → puis échec = très mal vécu).

## Réseaux sociaux (publication)
- **Instagram : 5 hashtags max** (reco Instagram 2026, pas 30).
- Kit titres/hashtags par plateforme (TikTok, Instagram, Facebook, YouTube Shorts, Pinterest) : voir l'historique.
- Site : **nivcreation.fr**. Marque : **Niv Création** — « L'art de graver vos émotions », gravure laser, fait en France.

## Pipeline qui a marché (montage local, 0 crédit)
1. Générer le plan parlant (Marketing Studio) OU animer une vraie photo (Kling sur photo réelle).
2. Recadrer si défaut (tasse) → tête‑épaules.
3. Construire les **plans bijoux** depuis les vraies photos (`overlay` sur fond flou).
4. Timeline : intro (elle) → bijoux pendant sa voix → fin (elle) + carte « nivcreation.fr ».
5. Incruster **sous‑titres + site** via PNG PIL + `overlay`.
6. **Vérifier image par image** (planche‑contact `tile`) AVANT d'envoyer.
