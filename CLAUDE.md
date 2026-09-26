## ⛔⛔ INCIDENT GRAVE — RÉGLAGES DE GRAVURE QUI S'EFFAÇAIENT TOUT SEULS (26/09/2026, RÉSOLU)
> En ajoutant le verre à cocktail puis le verre à whisky à la page **Gestion → Réglages produits →
> « Réglage cristaux, verres & carafe »** (`/gestion/cristal-reglage`), le gérant a dû **tout
> réenregistrer un par un** — les cadres des cristaux (blocs 3D, porte-clés, pyramide, trophée)
> bougeaient encore APRÈS un ré-enregistrement. Colère justifiée, à ne plus jamais reproduire.
- **Cause réelle trouvée et corrigée** : `/api/admin/settings` **remplaçait ENTIÈREMENT**
  `crystalZones`/`motifTextZones` par ce que la page envoyait à cet instant (`patch.crystalZones =
  out`, sans fusion avec l'existant). Cette page envoie TOUJOURS l'état complet de TOUS les
  produits réglables (chargé une fois à l'ouverture) — si cet état n'était plus à jour (onglet
  resté ouvert, page rechargée entre deux réglages, deux réglages coup sur coup…), enregistrer
  UN SEUL produit **effaçait silencieusement** les réglages des AUTRES faits juste avant.
- **✅ Corrigé (commit `b0653c8`)** : le serveur **fusionne** maintenant avec les réglages déjà
  en base, produit par produit (`{ ...existant, ...ce qui est envoyé }`), au lieu de remplacer en
  bloc. Un enregistrement ne peut plus jamais écraser un autre produit, même avec une page pas à
  jour. **Cette règle doit être appliquée à TOUT nouveau réglage « par produit/par clé » dans
  `/api/admin/settings`** (sur le modèle de `crystalZones`/`motifTextZones`) : ne JAMAIS faire
  `patch.xxx = out` à partir du seul contenu envoyé par le client — toujours partir de
  `{ ...((await getSettings())?.xxx || {}) }` et fusionner dedans.
- ⛔ **Ne plus jamais ajouter un produit à une page de réglage partagée (cristal-reglage,
  packaging, taxonomie…) sans vérifier que le mécanisme de sauvegarde est bien un PATCH par clé,
  jamais un remplacement en bloc.** Si ce n'est pas le cas : corriger le serveur AVANT d'ajouter
  le produit, pas après.

# ⛳ REPRISE D'UNE SESSION — À LIRE EN PREMIER (mis à jour 09/09/2026)
> 📋 **`docs/EN-ATTENTE.md` = l'inventaire de tout ce qui est en attente** (messages à envoyer,
> maquettes validées non appliquées, projets en pause, actions du gérant, questions sans réponse).
> **Le lire au démarrage** en même temps que ce fichier, et le tenir à jour à chaque avancée.
> Le gérant reprend souvent le travail depuis une AUTRE conversation : il faut continuer
> **comme si de rien n'était**. Tout ce qu'il faut savoir est dans ce fichier.
- **Branche de travail ET de mise en ligne : `claude/site-product-overview-1t2de`** (branche par
  défaut du dépôt GitHub `nirojh93700-afk/Niro`). Firebase App Hosting déploie à chaque push
  dessus (~4 min). **`main` et `master` sont des MIROIRS** de cette branche : après chaque push,
  faire aussi `git push origin HEAD:main HEAD:master` pour qu'aucun outil ne dise « branche introuvable ».
- Si l'environnement démarre vide ou sur une branche sans commit :
  `git fetch origin claude/site-product-overview-1t2de && git checkout -B claude/site-product-overview-1t2de origin/claude/site-product-overview-1t2de`.
- Outils à réinstaller si besoin : `pip install Pillow imageio imageio-ffmpeg gTTS numpy` (vidéos).
  Le réseau de certains environnements bloque nivcreation.fr et la voix Google : les scripts vidéo
  utilisent alors les photos de `public/produits/` et rendent sans voix (le dire au gérant).
- ⛔ **ENVOI PROGRAMMÉ À UNE CLIENTE = LE SITE LE FAIT DÉJÀ, NE PAS PASSER PAR UNE ROUTINE CLAUDE**
  (incident du 07/09/2026). Utiliser **Gestion → Clients → Messages clients** (formulaire libre :
  adresse, sujet, message, « Envoyer » ou « Programmer » à l'heure voulue) — API `POST /api/admin/scheduled`
  `{to, subject, body, sendAt}`, envoyé par `runScheduledJobs` via `/api/cron/scheduled` ET le heartbeat
  du site. Ça ne dépend d'AUCUN outil extérieur.
  Ce jour-là, deux envois validés (Audrey 8h30, Aurore 9h00) ont été programmés par une routine Claude :
  au déclenchement, `nivcreation.fr` ET l'adresse Firebase étaient **bloquées par la politique réseau**
  de l'environnement (`connect_rejected`), et `list_environments` ne renvoyait plus aucun environnement.
  Rien n'est parti, le gérant a dû envoyer à la main. Une routine Claude ne sert que si elle DOIT
  réfléchir (vérifier une réponse, calculer une liste) — sinon, c'est le site.
- ⛔⛔ **INTERDICTION DÉFINITIVE D'ENVOYER UN MAIL CLIENT PAR GMAIL (09/09/2026, ordre formel après
  récidive).** Aucun outil Gmail (`reply`, `send_message`, brouillon envoyé) ne doit servir à écrire
  à un client, **même en reconstruisant le gabarit de marque, même si le gérant a dit « envoie »**,
  **même si le site est injoignable**. Un « envoie » autorise le CONTENU, jamais le canal Gmail.
  Le SEUL canal = le site : **Gestion → Clients → Messages clients** (ou `/api/admin/send-client-email`,
  `/api/admin/scheduled`, `/api/admin/bat`, `/api/reply/<jeton>`). Si le site est injoignable depuis
  l'environnement : **je ne l'envoie PAS**, je donne le texte au gérant et c'est LUI qui clique.
  Gmail reste autorisé UNIQUEMENT en LECTURE (boîte surveillée). Ne jamais rediscuter cette règle.
  **Confirmé et testé le 09/09/2026 après-midi** (demande du gérant « je veux que ça parte du
  site », test envoyé par `/api/admin/send-client-email` → reçu, validé, gabarit de marque).
  Nuance à connaître : le site envoie par la boîte Gmail qui lui est CONNECTÉE (`via:"gmail"`
  dans la réponse de l'API) — c'est NORMAL et autorisé (gabarit + traçage) ; ce qui est interdit,
  c'est un envoi Gmail rédigé EN DEHORS du site (outils `mcp__Gmail__reply`/`send_message`…).
- ⛔ **TOUT E-MAIL CLIENT ENVOYÉ PAR LE SITE DOIT PORTER LE BOUTON « ✉️ Répondre à ce message »**
  (rappel ferme du gérant, 17/09/2026, après un envoi validé parti sans bouton : « il faut que tu
  mettes pour que les clients répondent directement dans le mail, faut pas que tu recommences »).
  Le bouton est maintenant STRUCTUREL : `boutonRepondre(...)` dans `src/lib/clientMail.js`
  (jeton `addReplyLink`, page `/reponse/<jeton>`, réponse rangée dans le dossier + la commande),
  branché sur les 3 canaux — `send-client-email`, `/api/reply/[token]` (réponses validées) et
  les envois programmés (`runScheduledJobs`). **Tout NOUVEAU canal d'e-mail client devra l'appeler
  aussi.** Jamais bloquant : si le jeton échoue, l'e-mail part sans bouton et la boîte surveillée
  rattrape les réponses classiques.
- ⛔⛔ **RIEN N'EST POUSSÉ SUR LE SITE SANS SON « APPLIQUE » / « POUSSE » (rappel très ferme du
  gérant, 26/09/2026, après incident)** : il a demandé « tu mets les cadeaux de Noël juste avant
  Explorez nos collections » avec une capture → j'ai modifié `page.jsx` et POUSSÉ directement.
  C'était une demande de MAQUETTE, comme toujours (« je t'ai pas dit de pousser, je t'ai dit de
  faire une maquette… tu pousses rien sur le site sans me dire »). Annulé dans la minute (commit
  `b54c164`, code identique à avant). **Une phrase qui décrit un changement du site = une maquette
  à faire, JAMAIS un push.** Le push n'arrive QUE sur un mot explicite : « applique », « pousse »,
  « mets en ligne ». Même quand le changement paraît minuscule ou déjà validé dans son principe.
- 🗂️ **CRAFIA = UNE AUTRE APPLI, INJOIGNABLE D'ICI (constat du 26/09/2026)**. Le gérant : « regarde
  l'application Crafia, t'as accès, on l'a créée, t'as toutes les gravures qu'elle a faite ». Vérifié :
  Crafia (app.crafia.fr, projet Firebase `crafia-app`, gros fichier `crafia_app.html` sur SON Mac
  dans `~/Desktop/Crafia-Deploy/`) n'est PAS dans ce dépôt — seule la branche
  `claude/crafia-email-whitelabel-JBr6R` contient `crafia-email/` (gabarits d'e-mails, rien d'autre).
  Pas de dépôt GitHub accessible (`nirojh93700-afk/crafia*` → introuvable), pas d'identifiants
  Firebase ici, et le réseau bloque app.crafia.fr. **Pour utiliser ses données/photos : il doit les
  exporter et les envoyer ici, ou lancer Claude Code sur son Mac dans le dossier Crafia.**
- Règles absolues (détaillées plus bas) : rien n'est envoyé à une cliente sans « envoie » explicite ;
  rien de visible sur le site sans validation (l'admin peut être modifié) ; ne JAMAIS parler de la
  machine / panne / laser aux clientes ; clé admin uniquement dans les commandes shell, jamais dans
  un fichier ; Etsy reste hors de la boîte mail surveillée.
- ⛔ **NE PLUS PROMETTRE D'« APERÇU AVANT GRAVURE » DANS LES MESSAGES CLIENTS** (demande ferme
  du gérant, 15/09/2026 : « pas d'aperçu avant le gravure »). Dans tout futur e-mail client, ne pas
  proposer ni promettre d'aperçu/BAT avant de graver — l'atelier grave directement à partir de la
  commande. (Le fil Aperçu/BAT reste disponible dans Gestion si LUI décide d'envoyer un aperçu,
  mais on ne le promet plus à la cliente.) ⚠️ Une promesse d'aperçu a DÉJÀ été faite à Rose
  Catarino (#1Z17IKQ8, les 14 et 15/09) — celle-là est au choix du gérant : la tenir ou graver.
- ⛔ **AUCUNE PROMESSE DE TEMPO DANS UN MESSAGE CLIENT** (rappel ferme du gérant, 21/09/2026 :
  « je t'ai déjà dit de pas avancer aussitôt »). Interdits : « aussitôt », « au plus vite », « dès le
  règlement », « part dans la journée », « très rapidement », toute date. On décrit ce qui sera fait,
  jamais quand. (Complète « pas de date promise » et le délai allongé du mode vacances.)
- ⛔ **COLIS REVENU (non retiré au relais, adresse erronée…) = RÉEXPÉDITION PAYÉE PAR LE CLIENT**
  (règle ferme du gérant, 21/09/2026, dossier Enes Varol / bracelet « Hend » #1S9IOON5 : « c'est le
  client qui doit payer »). On ne renvoie JAMAIS gratuitement un produit revenu : devis « nouvelle
  expédition » (relais 4,90 € / lettre au poids, 4,90 € jusqu'à 100 g / colis 6,90 €) à régler en ligne, envoi après règlement.
  Idem si le client veut une pièce en plus : prix de la fiche + port. Aucun geste de notre initiative.
- 📦 **PORT BIJOUX = AU POIDS RÉEL, GRILLE LA POSTE (23/09/2026, demande du gérant : « il faut que ça
  augmente par rapport à ce que les clients mettent »)**. `letterPriceByWeight` dans `src/lib/shipping.js` :
  lettre suivie ≤ 100 g **4,90 €** (réglage admin `bijouxHome`, passé de 3,90 à 4,90 le 23/09) · ≤ 250 g
  6,50 · ≤ 500 g 8,90 · ≤ 1 kg 10,90 · ≤ 2 kg 12,90. Coût La Poste « Lettre Services Plus » relevé le
  23/09 : 4,45 · 5,77 · 8,04 · 10,23 · 11,95. Le poids inclut l'emballage, **pesé par le gérant le 23/09** :
  sac 28 g · boîte carrée 59 g · boîte allongée 80 g · microfibre 15 g (non pesée) · pack collier 102 g ·
  pack bracelet 123 g (réglages en ligne `settings.packaging` + `packagingSeed.js`). Bijou en **boîte** = colis, jamais moins cher que le même panier en
  lettre (`bijouxOnly`). Offert dès 45 € inchangé. Relais inchangé (4,90 €). Envoi conseillé :
  lettre = La Poste (moins cher que Boxtal) ; boîte = colis Boxtal (Mondial Domicile ≈ 5,10 € HT).
  **Poids déclaré d'un bijou (23/09, consigne du gérant : « minimum 100 g, prends le prix pour
  100 g » — il met souvent le bijou dans une boîte même sans la demande)** : `weight: 72` sur TOUS
  les bijoux `letter:true`, sans exception. 72 + sac 28 = **100 g pile → 4,90 €** (prix de la
  tranche 100 g). 2 bijoux + sac = 200 g → 6,50 € · 3 à 5 bijoux + sac → 8,90 €. Un nouveau bijou
  prend aussi `weight: 72`. (Remplace le réglage à 50 g du même jour.)
  ✅ **« Appliquer, corrige tout » (23/09)** : plus aucun « 3,90 € » sur le site — 4 fiches bois à plat
  (porte-serviettes ×2, supports téléphone ×2, 160-220 g) → « 6,50 € à domicile, 4,90 € en point
  relais » · e-mail d'exemple → 4,90 € · `BIJOUX_HOME` du code = 4,9 (« Rétablir » ne ramène plus
  3,90) · flux Google + données structurées des fiches = prix au poids (jamais moins que le réel) ·
  Gestion → Livraison affiche la grille complète par poids.
- ⛔ **PRIX DE PORT CITÉ À UN CLIENT = LE PRIX DU SITE, VÉRIFIÉ AVANT D'ÉCRIRE** (erreur du 21/09/2026,
  dossier Enes Varol : j'ai cité 3,90 € pour un bracelet EN BOÎTE → colis 6,90 €, le gérant paie
  6,12 € à Boxtal ; « à cause de toi je vais perdre de l'argent »). Grille bijou : sac/microfibre =
  lettre suivie au poids (4,90 € jusqu'à 100 g, 6,50 € jusqu'à 250 g) · **boîte cadeau = colis 6,90 €** · Mondial Relay 4,90 € (jusqu'à 1 kg).
  Toujours regarder l'emballage de la commande (`items[].packaging` / « Boîte cadeau ») avant de
  citer un montant, et **ne jamais annoncer un prix inférieur à ce qu'un e-mail précédent a déjà dit**.
- ⛔ **AVANT D'ÉCRIRE UN MAIL CLIENT : LIRE TOUT LE FIL, NE RIEN INVENTER** (règle ferme du gérant,
  22/09/2026, après un brouillon pour TRAN qui disait « comme vous étiez pressée » alors que son
  message demandait « un modèle avec des suggestions » : « je t'ai déjà dit que tu regardes le mail
  des clients avant d'en écrire… tu dois suivre les mails, tu dois pas inventer »). Avant CHAQUE
  brouillon : 1) `GET /api/admin/comms?email=` (dossier du site) ET la recherche Gmail
  `from:<adresse>` / le fil envoyé ; 2) relire ce que LA CLIENTE a écrit, mot pour mot, et ce que
  NOUS lui avons déjà répondu (dates, promesses, prix, images envoyées) ; 3) le brouillon reprend
  ces faits-là, jamais une supposition sur son motif ou son urgence. Un dossier vide sur le site
  ne veut pas dire « pas d'échange » : vérifier aussi Gmail.
- ⛔ **SIGNATURE DES MESSAGES CLIENTS = « Niv Création », JAMAIS LE NOM DU GÉRANT** (rappel ferme du
  08/09/2026 : « il faut jamais mettre mon nom, c'est le nom du site »). Aucun nom de personne dans
  un e-mail, un devis ou un message client : on écrit « nous » (l'atelier), on signe **Niv Création**
  + `nivcreation.fr`. Vaut aussi pour les messages que je lui propose de copier-coller ailleurs.
- En cours au 02/09 : newsletter programmée ven. 04/09 10 h + relance mar. 08/09 10 h, relance Aurore
  lun. 07/09 ; Sophie Berardo (#0C1CGL2Q) attend, cadeau promis dans le colis ; boîte mail surveillée
  toutes les heures (routine Claude `trig_01YR967ZA5brMSLhsAvqfQ6a`) ; 6 vidéos livrées (2 sans voix).

### 📌 ÉTAT AU 09/09/2026 — REPRENDRE ICI
- **Accès au site RÉTABLI** : le gérant a mis l'environnement cloud « Default » en *Accès réseau →
  Personnalisé* avec `nivcreation.fr`, `*.nivcreation.fr`,
  `niv-creation--niv-creation.europe-west4.hosted.app`. **VÉRIFIER au démarrage**
  (`curl -s -o /dev/null -w '%{http_code}' https://nivcreation.fr/api/shipping-config` → 200).
  Si 000/403, l'accès est retombé : le dire tout de suite, ne rien envoyer par un autre chemin.
- **Gregory Perez** (`cseidm@pm.me`, secrétaire du C.S.E. IDM, ceidm.fr) — **SITUATION CHANGÉE
  le 09/09 après-midi** : l'envoi Gmail du matin (8h06) contenait déjà tout le texte validé
  (les 2 options + questions quantité/taille/date), et **il a RÉPONDU à 8h56** : c'est bien
  **l'objet moulé** qu'il veut reproduire à l'identique → travail de verrier, pas de la gravure,
  l'atelier ne sait pas le faire. **L'ancien texte validé est OBSOLÈTE — ne pas l'envoyer.**
  ✅ **CLASSÉ SANS SUITE le 17/09/2026** (décision du gérant : « tu peux oublier ») — le
  brouillon `docs/messages/perez-coeur-verre.md` est abandonné, aucune réponse à envoyer,
  ne plus le rappeler.
- ~~Simon Zuccarelli~~ (`zucsim58@gmail.com`, partenariat dropshipping) : ✅ **CLASSÉ SANS SUITE
  le 17/09/2026** (décision du gérant : « tu peux oublier ») — pas de réponse, classer son
  brouillon « à valider » sans réponse s'il traîne encore, ne plus le rappeler.
- **Relance newsletter du 08/09 NON ENVOYÉE** (site injoignable ce jour-là). À refaire par
  Gestion → Marketing → Newsletter → résultats de la campagne du 04/09 → « relancer celles qui n'ont
  pas ouvert », objet : « ✦ Un prénom, une date — et le bijou devient le sien ». Vérifier d'abord que
  l'envoi du 04/09 est bien parti ; sinon, ne rien relancer et prévenir.
- Audrey Duquennec (`dreyduquennec@mailo.com`) : répondu le 07/09 (dimensions du Collier Plaque
  Acier ajoutées sur la fiche : plaque 33,5 × 19,7 mm, chaîne 60 cm, livré complet). Rien en attente.
- **Aurore Corcy** (`aurorecorcy@gmail.com`) : relance mariage (carafe + 2 verres assortis) préparée
  le 07/09 et **jamais envoyée** — texte dans `docs/messages/aurore-relance.md`. Vérifier d'abord
  qu'elle n'a pas répondu, puis **redemander l'accord** du gérant avant tout envoi.
- **Ticket xTool #1222642** (France / Technical support / F Series) : xTool relance et **ferme le
  dossier sans réponse sous 24 h**. Le gérant veut le garder ouvert en annonçant qu'il versera
  « l'acompte / dépôt 40 » la semaine prochaine. ⚠️ Ce fil est dans sa messagerie **Outlook**, pas
  dans le Gmail surveillé : impossible de lire ce que xTool demande exactement. Message anglais
  proposé le 09/09 (garder le dossier ouvert + acompte la semaine prochaine + confirmation de
  paiement à suivre) — **c'est LUI qui l'envoie depuis Outlook**, et il doit remplacer « the deposit
  (40) » par la formulation exacte de xTool.
- **Boîte mail surveillée : plus aucun outil extérieur** (commit `991e7e0`) — `syncInbox` est lancée
  par le **heartbeat du site** (`src/lib/heartbeat.js`, verrou `claimJob("inbox", 15 min)`), en plus
  du chargement de l'admin et du cron. La routine Claude horaire n'est plus nécessaire.
- **Diagnostic réseau à connaître** : quand le site est injoignable, la cause est la politique réseau
  de l'environnement cloud, pas le site. `curl -sS "$HTTPS_PROXY/__agentproxy/status"` le confirme
  (`connect_rejected`, « gateway answered 403 to CONNECT »). La seule correction est le réglage
  *Accès réseau → Personnalisé* décrit plus haut, et il ne s'applique qu'aux **nouvelles sessions**.
  ⛔ Ne JAMAIS bricoler un relais (workflow GitHub, service tiers) pour contourner ce blocage.

### 🎁 CADEAU DANS CHAQUE COLIS — CONSTRUIT LE 20/09/2026, ÉTEINT (« prépare, j'activerai plus tard »)
> Demande : « garder les messages pour les cadeaux quand j'aurai arrêté le mode vacances — plus de
> délai 3 à 4 semaines non plus ». Maquette validée `docs/maquettes/cadeau-colis.html`
> (artifact https://claude.ai/artifact/DfjUmv4hQt9SXAiaLFcNb2).
- **Réglage** `settings.cadeauColis = { enabled:false, text, until }` (sanitizé), écran **Gestion →
  Apparence → « 🎁 Cadeau dans chaque colis »** (case + phrase + « Jusqu'au » facultatif, vide = en
  permanence). **C'est LUI qui coche**, au moment d'éteindre le mode vacances (~23/09).
- **Une seule fonction décide** : `cadeauColisActif(settings)` dans `src/lib/vacation.js` →
  `{ text, viaVacances }` si le mode vacances est allumé (comportement d'avant, inchangé) OU si la
  case est cochée ; `null` sinon = plus rien nulle part.
- **Branché sur** : `/api/shipping-config` (champ `cadeau`) · `CadeauChoix.jsx` (hors vacances : pas
  de paragraphe de délai, titre « Un cadeau dans votre colis — offert ») · `/api/checkout`
  (`cadeauChoix` enregistré si cadeau actif) · webhook Stripe (confirmation cliente : ligne cadeau
  seule hors vacances) · `runOffreGravureJob` (la ligne « un cadeau vous attend » n'est écrite que si
  `cadeauColisActif`) · `serviceContext` des agents. Gestion / e-mail d'alerte / règle « ≥ 80 € →
  deux cadeaux » inchangés. 11 vérifications de logique au vert.
- ~~ORDRE À RESPECTER : cocher « Cadeau dans chaque colis » AVANT de décocher le mode vacances~~
  **ANNULÉ le 22/09** : le mode vacances a été éteint SANS cocher le cadeau, décision du gérant
  (voir « FIN DU MODE VACANCES »). La question « jusqu'au 20/10 ou en permanence » est sans objet.

### 🔚 FIN DU MODE VACANCES — DÉCISION DU GÉRANT, 22/09/2026
> « Tu peux annuler le mode vacances… quand tu désactives le mode vacances y a plus de cadeaux, tu
> parles plus de cadeaux, mais tout ce qu'il y a eu comme commande je mettrai un cadeau… tu peux
> activer livraison express. »
- **UN SEUL CLIC** : Gestion → Apparence → Bandeau & pop-ups → **décocher « 🏖️ Mode vacances »**,
  Enregistrer. **Ne PAS cocher « 🎁 Cadeau dans chaque colis »** — il la veut décochée.
  ⚠️ Ceci ANNULE la consigne d'ordre écrite le 20/09 (« cocher le cadeau AVANT d'éteindre les
  vacances ») : il a tranché, il n'y a plus de cadeau sur les nouvelles commandes.
- **CE QUI DISPARAÎT** (tout seul, rien d'autre à faire) : bandeau « 3 à 4 semaines » en haut du
  site · encart des fiches et du panier · paragraphe de délai dans l'e-mail de confirmation ·
  **case « Votre cadeau » au paiement** · ligne cadeau de l'e-mail de confirmation · **ligne
  « un cadeau vous attend » des e-mails de l'offre gravure encore à partir** (`cadeauColisActif(s)`
  dans `runOffreGravureJob` → faux ⇒ la phrase n'est plus écrite). Rien à corriger à la main.
- **LES CADEAUX DÉJÀ PROMIS** : les 49 e-mails de l'offre gravure partis le 20/09 annoncent un
  cadeau. Le gérant les couvre **physiquement** : il glisse un cadeau dans les commandes déjà
  reçues. **Les NOUVELLES commandes n'ont plus de cadeau** — ne plus jamais en parler à une cliente.
- ⛔ **CONSÉQUENCES POUR TOUT MESSAGE CLIENT** (l'autre conversation aussi) : ne plus annoncer
  « délai de confection 3 à 4 semaines », ne plus annoncer de cadeau dans le colis. Le délai
  redevient celui des fiches (pièce personnalisée). La règle « aucune promesse de tempo » du
  21/09 reste entière.
- ✅ **LIVRAISON EXPRESS CHRONOPOST : AUTORISÉE par le gérant le 22/09** et **s'allume toute seule**
  avec l'extinction des vacances — `EXPRESS_START` (24/09/2026) est passé et `settings.shipping
  .expressOff` n'a jamais été mis. Rien à activer. Option au paiement, France + Monaco, domicile
  seulement : ≤ 2 kg 14,90 € · ≤ 5 kg 19,90 € · au-delà 29,90 €.
  ⚠️ **Une commande express est à graver EN PRIORITÉ** (engagement 24/48 h après confection).
  Pour l'éteindre sans toucher au reste : `settings.shipping.expressOff = true`.
- ✅ **ÉTEINT LE 22/09/2026 à 8 h 50 (heure française)** sur ordre du gérant (« il faut que ça vienne
  comme avant »), par `POST /api/admin/settings` avec l'objet `vacation` COMPLET (texte, dates, cadeau
  conservés, seul `enabled:false`). Vérifié : `/api/shipping-config` → `vacation: null` et
  `cadeau: null`, bandeau absent de l'accueil et des fiches, `cadeauColis` décoché, offre gravure
  toujours active. L'option Express au paiement n'a pas été testée (pas de session Stripe créée).
- 🎁 **CADEAU ENCORE DÛ** : toute commande arrivant avec un code `GRAVURE-…` (les 49 e-mails du 20/09)
  = **un cadeau surprise à glisser** (le site ne demande plus le choix). Les commandes d'avant le
  22/09 gardent le choix noté (`cadeauChoix`).
- ✅ **DÉTECTION AUTOMATIQUE — CONSTRUITE LE 22/09/2026** (« tu dois identifier les gens à qui j'ai dit
  je donnerai un cadeau, il faut que tu me l'indiques quand il commande, automatiquement ») :
  `cadeauPromisPour({email, promoCode})` dans **`src/lib/cadeauPromis.js`** lit la section
  `offreGravure` (adresse servie, ou adresse du code nominatif `kind:"gravure"` utilisé) et ne
  retient que les e-mails envoyés **avant `OFFRE_CADEAU_JUSQUAU` (22/09 9 h Paris)** — après, la
  phrase du cadeau n'est plus dans l'e-mail (`cadeauColisActif` faux), donc rien n'est dû.
  Au webhook Stripe, si la commande n'a pas de `cadeauChoix` et que la promesse existe :
  `cadeauChoix = "surprise"` + `cadeauPromis = <motif>` + `flags:["cadeau"]` sur la commande →
  encadré doré **« 🎁 CADEAU PROMIS à cette cliente »** avec le motif dans l'e-mail d'alerte
  🛎️ ET dans Gestion → Commandes, pastille « 🎁 surprise · promis » dans la file de production,
  contexte de l'assistant (`inbox.js`). Règle « ≥ 80 € → deux cadeaux » inchangée. Jamais
  bloquant (erreur de lecture → pas de marque). Rien n'est écrit à la cliente. 12 vérifications
  au vert. Le passage du 22/09 à 9 h 12 (1 e-mail) est bien APRÈS la coupure : pas de cadeau dû.

### 🛍️ AUDIT COMPARATIF — 5 AMÉLIORATIONS APPLIQUÉES LE 19/09/2026
> Audit contre Amikado/Merci Maman/CadeauGravure (maquette `docs/maquettes/audit-9-ameliorations.html`,
> artifact https://claude.ai/artifact/Kscni7tb6QUEAatAHLj9Ji). Le gérant a validé « pour les autres
> je valide, tu peux appliquer » : blocs 1, 5, 6, 8 appliqués (+ 7 déjà existant). **Blocs 2 (date
> de livraison estimée), 3 (message cadeau) et 4 (stock bas) : SAUVEGARDÉS, à faire quand il dira.**
> Bloc 9 (express) : ✅ **APPLIQUÉ le 19/09** (« mets en place pour que ça fonctionne à partir
> de mercredi prochain ») — voir ⑨ ci-dessous.
- **① CARTE CADEAU** (`/carte-cadeau`) : montants 20/30/50/75/100 €, petit mot (180 car.),
  destinataire, envoi immédiat ou à une date (matin ~9 h Paris). Paiement = session Stripe DÉDIÉE
  (`/api/carte-cadeau`, metadata `giftcard:"1"`) — PAS une commande (le webhook la traite AVANT
  `claimSiteOrder`, anti-doublon `hasAutoSent("carteCadeau", sessionId)`). Au webhook : code
  `CADEAU-XXXXX` créé AVANT tout envoi (`setPromoCode` kind:"cadeau", `value` = SOLDE restant,
  `email` = verrou destinataire, `reusable:true`, 365 j) → e-mail destinataire (bouton Répondre,
  ou envoi programmé du site si date choisie) + confirmation acheteuse + info gérant.
  **Utilisation** : `/api/promo-validate` (solde affiché, 0 = refusé) et `/api/checkout`
  (déduction = min(solde, sous-total), metadata `giftUsed`) ; le webhook DÉBITE le solde
  (`setPromoCode` value=reste). En plusieurs fois jusqu'à épuisement. Fichiers :
  `src/lib/carteCadeau.js` · `/api/carte-cadeau` · `/carte-cadeau` (+ `/merci`) ·
  `CarteCadeauForm.jsx` · webhook Stripe · CSS `.gc-*`. Lien : pied de page + tuile sur /offrir.
- **⑨ LIVRAISON EXPRESS Chronopost — s'allume TOUTE SEULE le mercredi 24/09/2026** (minuit,
  Paris ; `EXPRESS_START` dans `src/lib/shipping.js`). Option « Express Chronopost — 24/48 h
  après confection » ajoutée à côté du domicile (page Stripe), France + Monaco seulement.
  Prix au poids (`EXPRESS_TIERS`) : ≤2 kg 14,90 · ≤5 kg 19,90 · au-delà 29,90 € (coût réel
  Chronopost/Boxtal + marge). **Trois coupe-circuits** dans `/api/checkout` : la date, le mode
  « délai allongé » ALLUMÉ = express coupé (on ne vend pas du 24/48 h avec des semaines de
  confection), et `settings.shipping.expressOff: true` (sanitizé) pour l'éteindre à la main.
  Pas d'express en point relais / retrait / Europe. L'étiquette Chronopost se crée sur
  boxtal.com comme aujourd'hui. ⚠️ Une commande express = à graver EN PRIORITÉ (engagement
  client). 10 vérifications de logique au vert le 19/09.
- **⑤ PAGE « OFFRIR » PAR OCCASION** (`/offrir` + `/offrir/<occasion>`) : 6 occasions (mariage,
  naissance, amour, pour-lui, pour-elle, famille) définies dans `src/lib/occasions.js` (règles de
  correspondance sur le CATALOGUE EN DIRECT, comme les guides — jamais de produit en dur, 12 max).
  Menu du haut « Offrir », pied de page, sitemap. CSS `.occ-*`.
- **⑥ TRI + BUDGET boutique** : `?tri=` (prix-croissant/décroissant/nouveautés via PRODUCT_DATES)
  et `?budget=` (moins20 / 20-40 / plus40 sur `priceFrom`), combinés aux filtres/recherche.
  `TriBoutique.jsx` (client) + `appliquerTri` dans `src/app/boutique/page.jsx`. CSS `.tri-*`.
- **⑦ AVIS AVEC PHOTO : EXISTAIT DÉJÀ** (formulaire + affichage + stockage) — compté manquant à
  tort dans l'audit, rien touché.
- **⑧ ALERTE BAISSE DE PRIX sur un favori** : cloche sur `/favoris` (connectée seulement).
  Section `priceWatch` = `{email: {slug: {base, at}}}` — `base` relevé CÔTÉ SERVEUR à l'activation
  (`/api/favoris` action "watch"). Job quotidien `runPriceWatchJob` (heartbeat,
  `claimJob("priceWatch")`) : prix du catalogue < base → UN e-mail groupé (bouton Répondre, tracé
  logComm) puis base recalée au nouveau prix (jamais 2 e-mails pour la même baisse) ; prix monté →
  base suit vers le haut. Fonctions stock.js : `togglePriceWatch/getPriceWatch/getPriceWatchAll/
  rebasePriceWatch`. C'est le SEUL envoi automatique — validé explicitement par le gérant le 19/09.

### 🔑 CONNEXIONS CLIENTES — APPLIQUÉ LE 19/09/2026
> Demande du gérant (« tu peux savoir les gens qui se connectent ? » → maquette
> `docs/maquettes/connexions-clientes.html` validée « applique »). Journal des connexions à
> l'espace client, LECTURE SEULE (aucun envoi possible, même règle que les Favoris).
- **Stockage** : section `logins` du blob = `{ [email]: { lien, at, n, hist } }` — `lien` =
  dernière demande de lien magique, `at` = dernière ouverture réelle, `hist` = 12 dernières
  ouvertures. **Conservation 90 jours** (purge au fil de l'eau), garde anti-rafale 6 h
  (mémoire + blob) car `/api/espace/me` est appelée souvent. Fonctions `recordEspaceLogin` /
  `getLoginsAll` dans `stock.js`. **Jamais bloquant** : un échec d'écriture ne gêne pas la connexion.
- **Branché sur 3 routes** : `/api/espace/login` (kind "lien"), `/api/espace/verify` (kind
  "ouvert"), `/api/espace/me` (retours, garde 6 h intégrée).
- **Écran** : Gestion → Clients → ⚿ Connexions (`/gestion/connexions`, API `/api/admin/logins`,
  CSS `.cx-*` fin de `globals.css`). KPI : aujourd'hui / 7 jours / distinctes 30 j / « lien
  demandé sans suite » (lien plus récent que la dernière ouverture = cliente qui hésite).
  Lignes enrichies avec les commandes (`getSiteOrders`) : nom + nombre + dernière réf.
  « Dossier → » ouvre `/gestion/crm?q=<email>` (le CRM lit maintenant `?q=` au chargement).
- **CRM** : pastille `🔑 <date>` à côté de `💬 N` sur chaque cliente (fetch `/api/admin/logins`).
- **RGPD** : section « 6 bis. Espace client » ajoutée dans `/confidentialite` (e-mail + horaires,
  90 jours, jamais publicitaire). Le journal démarre vide : il se remplit à partir du déploiement.

### 💗 FAVORIS RANGÉS DANS LE COMPTE CLIENT — APPLIQUÉ LE 15/09/2026
> Demande du gérant : « sur les autres sites les clients mettent en favoris et ça va directement
> dans leur compte, est-ce qu'on peut faire la même chose ? » → maquette
> `docs/maquettes/favoris-compte.html` validée (« applique »), puis construit.
- **Deux endroits, volontairement.** Le ♡ écrit dans le **navigateur** (`localStorage`, clé
  `niv-wishlist`) — ça marche sans compte et l'affichage est instantané — **et**, si la cliente est
  connectée, dans son **compte** (`POST /api/favoris {action:"toggle"}`, « tiré et oublié » : si
  l'appel échoue, le cœur fonctionne quand même).
- **LA FUSION EST LE CŒUR DU SYSTÈME** : personne ne se connecte AVANT de mettre un cœur. Quand la
  page `/favoris` détecte une session, elle envoie les favoris du navigateur
  (`POST {action:"merge"}`) → `mergeFavoris` **n'ajoute que ce qui manque, ne supprime jamais rien**
  → message vert « N favoris ont été ajoutés à votre compte ». Puis le navigateur est réaligné sur
  le compte pour que le ♡ reste allumé partout. **Ne jamais retirer cette fusion** : sans elle, une
  visiteuse qui met 3 cœurs puis se connecte perd tout.
- **Stockage** : section `favoris` du blob catalogue = `{ [email]: { slugs:[...], at } }`, plafond
  **200 par cliente**. Fonctions dans `stock.js` : `getFavoris` / `toggleFavori` / `mergeFavoris` /
  `getFavorisAll`. Écriture ciblée (`persistCatalog(data, ["favoris"])`).
- **L'e-mail vient TOUJOURS de la session signée** (`readSession`, cookie `niv_espace`), jamais du
  corps de la requête → impossible de lire ou modifier les favoris de quelqu'un d'autre. Pas
  connectée = `{ loggedIn:false }` **sans erreur** (le site continue de marcher).
- **Prix et noms relus dans le catalogue en direct** (`getCatalog`) à chaque affichage : un prix
  changé dans Gestion se met à jour tout seul, un produit masqué/supprimé disparaît des favoris.
  Jamais de vieux prix ni de lien mort (même principe que les guides « Idées & conseils »).
- **Gestion → Clients → ♥ Favoris des clientes** (`/gestion/favoris`, API `/api/admin/favoris`) :
  chiffres clés, classement des créations les plus mises de côté, clientes par création (dépliable),
  export Excel/CSV/PDF via `exportRows`. **LECTURE SEULE — aucun e-mail ne part d'ici**, même règle
  que les alertes « retour en stock » : les envois passent par Clients → Messages clients.
- ⚠️ Un favori n'apparaît dans Gestion que si la cliente était **connectée** : ceux gardés dans un
  navigateur anonyme restent invisibles jusqu'à sa connexion. C'est dit sur l'écran.
- **♡ PARTOUT — APPLIQUÉ LE 15/09/2026** (« je clique à l'intérieur, la cliente elle peut pas
  mettre j'aime… faut que ça soit partout ») : le cœur n'était QUE sur les vignettes
  (`ProductCard`), donc absent de l'endroit qui décide — **la fiche produit**. Un seul composant,
  **quatre formes** (prop `variant`) :
  · `vignette` — pastille sur la photo (boutique, accueil, /offres, style-1/2/3, « Vous aimerez
    aussi », **les 2 bandeaux de l'accueil**) ;
  · `titre` — pastille à droite du **H1 de la fiche** (`.pd-titrerow`) ;
  · `ligne` — lien discret **« ♡ Garder pour plus tard »** sous « Ajouter au panier » ;
  · `mur` — petite pastille sur les tuiles du **mur de l'atelier**, visible quand la rangée s'arrête.
  ⚠️ **PAS sur la grande photo de la fiche** : la barre de l'aperçu de gravure (`.ee-toolbar`,
  verres/cristaux/modèles) occupe déjà les coins haut ET bas de `.gallery-main` — le cœur aurait été
  recouvert. D'où la place à côté du titre.
  **Tous les cœurs de la page s'allument ensemble** : chaque bouton écoute l'événement
  `niv-wishlist-change` (avant, il ne lisait `localStorage` qu'au montage).
- **GRILLES DES GUIDES « Idées & conseils »** : elles sont rendues en **un seul bloc HTML côté
  serveur** (piège documenté : y mettre un composant React cassait l'hydratation des 9 pages).
  Donc `grilleHtml` écrit un `<button data-fav-slug/-name/-image/-price>` et
  **`src/components/FavorisHydrate.jsx`** (n'affiche rien) le branche sur la même mécanique.
  **Ne pas y remettre de composant React.**
- **Fichiers** : `src/lib/stock.js` (section favoris) · `src/app/api/favoris/route.js` ·
  `src/app/api/admin/favoris/route.js` · `src/app/favoris/page.jsx` ·
  `src/components/WishlistButton.jsx` (4 formes) · `src/components/FavorisHydrate.jsx` ·
  `src/components/ProductCard.jsx` · `src/components/ProductDetail.jsx` (titre + ligne) ·
  `src/components/home/BandeauAccueil.jsx` (+ `prixBandeau().valeur`) ·
  `src/components/home/MurAtelier.jsx` (+ `prixValeur` dans `src/app/page.jsx`) ·
  `src/lib/guideHtml.js` · `src/app/idees/[slug]/page.jsx` · `src/app/gestion/favoris/page.jsx` ·
  NAV d'`AdminShell` · CSS `.fav-*` et `.fv-*` en fin de `globals.css`.
- **Pas encore fait, à proposer plus tard** : « prévenez-moi si le prix baisse » sur un favori
  (c'est là qu'est l'argent, mais il faut son accord — aucun e-mail automatique aujourd'hui).

### 💍 GRAVURE DES BIJOUX — TRANCHÉ ET APPLIQUÉ LE 14/09/2026 (À LIRE AVANT DE TOUCHER UN BIJOU)
> 📄 **`docs/etat-bijoux.md` = l'état exact des 32 bijoux** : prix du code, prix barré, prix payé,
> chaque champ de gravure avec son supplément, emballages, poids/livraison, et les points à
> surveiller. **FICHIER GÉNÉRÉ** : le régénérer avec **`npm run etat-bijoux`** après toute
> modification de `src/lib/products.js`. Ne jamais l'éditer à la main.
- ⛔ **L'ADMIN PRIME TOUJOURS SUR LE CODE** (`applyOverride` dans `catalog.js`) : prix, options
  (`variants`), champs de gravure (`personalizationFields`), photos, masquage. **Donc le code ne dit
  pas ce que la cliente voit.** Avant d'affirmer quoi que ce soit sur une fiche : regarder la fiche
  en ligne (ou demander une capture), pas seulement `products.js`. Si une correction de code ne se
  voit pas en ligne, c'est qu'un réglage admin la recouvre → le corriger dans Gestion.
- 🔴 **INCIDENT À NE PAS REPRODUIRE (Bracelet Homme Tressé)** : ses champs de gravure n'apparaissaient
  que si le nom de l'option contenait « Avec » (`variantContains`). Les options ayant été renommées
  en simples couleurs depuis l'admin, **la fiche « à graver » n'avait plus AUCUN champ** — titre
  « Personnalisation — gravure » vide, bracelet achetable sans texte. **Ne plus jamais faire dépendre
  une gravure du NOM d'une option.**
- ⛔ **AUCUN CHAMP PAYANT MASQUABLE** : un champ facturé derrière `showIfField` (case « Sans / Avec
  gravure ») garde sa valeur quand il se cache → un texte saisi puis caché restait **facturé 3 € sans
  rien afficher**. Les champs de gravure payants doivent être **facultatifs et toujours visibles**.
- ✅ **LE GABARIT À COPIER** (appliqué aux 3 bijoux à cœur le 14/09) : pas de variante « Sans / Avec
  gravure », une option par finition (couleur), puis
  `engravingPricing: { textKeys: ["recto", "verso"], textExtra: 3 }` + deux champs `optional: true`
  toujours visibles, libellés **« Texte au recto (+3 €) » / « Texte au verso (+3 €) »**, une `note`
  qui dit « laissez vide pour un bijou sans gravure », et le champ `police`.
  Le supplément est chiffré **APRÈS** la remise bijoux (+3 € pile) : le passer en variante le ferait
  dériver à +2,70 / +3,60 € à cause du −10 %.
  ⚠️ En retirant des variantes, **GARDER LES IDENTIFIANTS EXISTANTS** (même s'ils finissent par
  `-sans`) : les changer casse les paniers en cours et l'historique des commandes.
- **Corrigé le 14/09** : Collier Double Cœur (les faux « Ligne 1/2/3 » → recto/verso) · Bracelet Cœur
  T-bar · Bracelet Cœur grosse chaîne → tous en recto/verso à 3 € la face. Bracelet Homme Tressé :
  gravure toujours affichée. Bracelet cordon à plaque : **prix baissé à 17,91 €** (code 21,90 →
  barré 19,90). Prix des 3 bijoux à cœur : nu 22,41 / 30,51 € · 1 face +3 € · 2 faces +6 €.
- **Ce que font les autres (recherche 14/09)** : chez les boutiques de personnalisation en ligne
  (Petits Trésors, Aismée, Mon Espiègle Tribu, CadeauGravure, Merci Maman), la **1re gravure est
  comprise dans le prix** et seule la 2e face est payante (Petite Gravure : verso +7 €). Idem verres
  (Zephyr Paris « aucun coût supplémentaire »), cristaux (photo incluse, socle payant), porte-clés.
  Seules les **bijouteries classiques** (Histoire d'Or, Cleor, Marc Orian, Carador) facturent la
  gravure 8-16 € la face — ce n'est pas notre modèle.
- ⛔ **5 BIJOUX NE SE GRAVENT PAS DU TOUT** (rappel ferme du gérant, 15/09/2026, captures à
  l'appui) : Bracelet Cœur argenté · Bracelet Maille Trombone doré · Bracelet Ange · Collier Cœur
  scintillant doré · Collier Perle solitaire. Aucun champ de personnalisation, ils se vendent tels
  quels. **Ne JAMAIS leur ajouter de gravure** et ne jamais les compter comme « gravure incluse » —
  c'était une erreur de mon inventaire, corrigée : la colonne « Gravure » de `docs/etat-bijoux.md`
  distingue maintenant **payante / comprise dans le prix / pas de gravure**.
- ❓ **QUESTION OUVERTE, NE PAS TRANCHER SEUL** : sur les 32 bijoux — **19 font payer la gravure,
  8 la comprennent dans le prix, 5 ne se gravent pas** (liste exacte dans `docs/etat-bijoux.md`,
  colonne « Gravure »). Le gérant a dit le 13/09 « y a que le premier gravure gratuit après c'est
  payant », mais la règle plus ancienne du §10 4bis dit « GRAVURE = TOUJOURS PAYANTE, JAMAIS
  INCLUSE ». **Les deux ne peuvent pas être vraies : lui demander laquelle est la bonne** avant
  d'aligner quoi que ce soit. Il a demandé le 14/09 de ne corriger **que** les fiches qu'il désigne.
- **Restent au vieux système** (« Sans / Avec gravure » ou case +3 €), à ne toucher que sur sa
  demande : Bracelet Homme Identité (Gourmette) · Bracelet Homme Acier & Silicone · Collier Cœur &
  Zircon doré · Bracelet cordon à plaque · Bracelet homme cuir & plaque · Bracelet perles à pastille
  (+ hors bijoux : Bougeoir Fleur de Lotus, Support téléphone ajouré).
- 🏷️ **NOUVEAUX NOMS DES 32 BIJOUX — PRÊTS, PAS APPLIQUÉS (15/09/2026)** : il a demandé des noms
  « amour romantique » inspirés des grandes boutiques, puis **« enregistre ces noms, quand je te
  dirai tu les changeras »**. Les 32 noms sont dans **`docs/noms-bijoux-proposition.md`** (tableau
  + liste slug → nouveau nom, prête à appliquer). Ex. Collier Double Cœur → **Collier Cœur à Cœur**,
  Collier Couple Cœur → **Collier Toi & Moi**, Bracelet Papillon → **Bracelet Envolée**, gourmette
  homme → **Bracelet Le Serment**.
  ⛔ **À l'application : changer UNIQUEMENT le champ `name`.** Ne toucher ni au `slug` (l'adresse
  de la fiche : la changer casse les liens partagés, le référencement acquis et le flux Google
  Merchant Center), ni au `title` (le titre Google porte les mots-clés). Garder le mot
  « Collier »/« Bracelet » devant le nom poétique : le `name` s'affiche aussi dans le panier, les
  e-mails de commande et Gestion. Puis `npm run build` + `npm run etat-bijoux`.
- 🧊 **APERÇU 3D DES BIJOUX (chantier ouvert le 14/09/2026)** : le site dessine déjà lui-même des
  aperçus 3D (`Engrave3D`, `EngraveHeart3D`, `EngravePlate3D`, `EngraveGourmette3D`, `EngraveBook3D`,
  `EngraveEnvelope3D` — 9 bijoux les ont). 18 bijoux gravables n'en ont pas. Il a demandé **une
  maquette par produit**, en commençant par le cœur : **9 maquettes livrées**
  (`docs/maquettes/apercu3d-<slug>.html`, générateur `tools/maquettes/coeur3d.mjs` + gabarit),
  **en attente de son retour — RIEN d'appliqué au site**. Le gabarit du fichier : three.js intégré
  (bundle construit depuis `node_modules`, sans import), photos intégrées, prix/champs lus dans
  `products.js`. Suite prévue quand il le dira : pastille ronde, plaques de bracelet, puzzle.
  Consigne du 14/09 : « tu publies rien » → maquettes seulement, pas d'artifact, pas de fiche modifiée.


### 💍 11 BIJOUX AJOUTÉS LE 01/09/2026 — RÈGLES À RÉUTILISER
> Produits Nihaojewelry ajoutés depuis ses photos : `collier-double-coeur`, `collier-coeur-plaques`,
> `collier-3coeurs`, `bracelet-coeur-chaine`, `bracelet-cordon-plaque`, `collier-medaillon-pivotant`,
> `bracelet-homme-plaque-cuir`, `collier-pastille`, `collier-coeur-grave`, `bracelet-perles-pastille`.
- **LA PHOTO DOIT CHANGER QUAND ON CHOISIT UNE COULEUR** (demande ferme : « si t'as pas de photo tu
  fais rien »). Mettre `image:` sur CHAQUE variante de couleur, et **cette URL doit aussi figurer dans
  `product.images`**, sinon la bascule ne se fait pas. À vérifier sur tout nouveau produit à couleurs.
- **Prix bijou** : le prix affiché se calcule `roundTo90(prixCode × 0,9) × 0,9` (remise bijoux −10 %
  dans `catalog.js`), avec `roundTo90(n) = Math.round(n − 0,9) + 0,9`. Ex. 37,90 → 30,51 · 33,90 → 27,81.
  Toujours **chercher les prix du marché** avant de fixer un prix (« regarde sur Internet »).
- **Gravure = supplément payant**, jamais incluse (cf. §10 4bis) : `engravingPricing` avec
  `textKeys`+`textExtra` par zone, ou `flatExtras:[{key:"gravure",value:"oui",amount:3}]` + champ
  `select` piloté par `showIfField`/`showIfValue`.

### 💰 CAGNOTTE — ANNULATION ET REMBOURSEMENT (corrigé le 01/09/2026)
`reverseCagnotteForOrder(order)` dans `stock.js` : quand une commande passe en **annulée** ou est
**remboursée**, le cashback gagné est retiré ET la cagnotte dépensée est rendue. Appelé par
`/api/admin/refund` et `/api/admin/orders` (statut `annulee`). Idempotent (clé `${ref}:annulation`),
ne descend jamais sous zéro.

### 📣 NEWSLETTER — RÈGLES DU GÉRANT
- **NE JAMAIS écrire le nombre de nouveautés** dans le texte (« nos 8 nouveautés ») : règle ferme.
- Toujours **montrer la maquette d'abord**, puis lui envoyer **à lui seul** pour contrôle, et
  n'envoyer à la liste qu'après son accord explicite.
- Relance = **uniquement les non-ouvreuses qui n'ont pas commandé**, avec un **objet différent**,
  via l'écran de résultats de campagne (`NewsletterAdmin`). Rappeler que les **clics sont fiables**
  mais que les **ouvertures ne sont qu'un ordre de grandeur**.

### ✦ OFFRE « GRAVURE OFFERTE » — CONSTRUITE ET ÉTEINTE (11/09/2026)
> Demande du gérant : « dans admin tu mets cette option, comme pour le mode vacances, quand j'ai
> besoin j'active ; pour un mois ; que pour les gens qui ont pas commandé et qui sont inscrits ;
> adapte les mails par rapport à la date d'inscription ».
- **Écran** : Gestion → Marketing → ✦ Offre gravure offerte (`/gestion/offre-gravure`) — case
  Activer, début, fin, code, montant, « inscrites depuis au moins X jours » (3 par défaut), rappel
  du cadeau, bouton **« Ouvrir pour un mois »** et bouton **« Envoyer maintenant »**. Chiffres clés :
  à servir / en attente / déjà reçu.
- **Réglage** `settings.gravureOfferte` (enabled:false par défaut, sanitizé dans `/api/admin/settings`).
  **ÉTEINTE = rien ne part jamais.** Ne JAMAIS l'activer sans sa demande.
- **⛔ RIEN SUR LE SITE** (sa demande) : ni bandeau, ni encart de fiche. **L'offre n'existe que dans
  l'e-mail**, donc un client qui a déjà acheté ne peut pas tomber dessus.
- **Qui la reçoit** : inscrites à la newsletter **sans AUCUNE commande** (toute adresse présente
  dans les commandes est exclue), **sans DEVIS ni facture reçus** (règle du gérant 20/09/2026 :
  « il faut pas envoyer aux gens à qui on a envoyé un devis » — exclusion via `listQuotes` dans
  `runOffreGravureJob`), **inscrites depuis plus de 3 jours** (les nouvelles viennent de
  recevoir BIENVENUE10). Celles qui atteignent les 3 jours **pendant** l'offre sont servies au fil
  de l'eau. **Une seule fois par personne** (section `offreGravure` = {email: ts}).
- **Le texte s'adapte à l'ancienneté** (`ouverturePhrase` dans `src/lib/offreGravure.js`) :
  < 14 j « il y a quelques jours » · < 30 j « quelques semaines » · < 90 j « depuis un moment » ·
  ≥ 90 j « cela fait un moment que vous nous suivez de loin » · date inconnue « nos abonnées ».
- **Fichiers** : `src/lib/offreGravure.js` (offreActive / ouverturePhrase / joursDepuis /
  offreGravureEmail) · `runOffreGravureJob({dryRun})` dans `src/lib/jobs.js` · appelée par le
  **heartbeat du site** (1×/jour, verrou `claimJob("offreGravure")`) · API `/api/admin/offre-gravure`
  (GET état + comptes, POST `{action:"send"}`) · page `/gestion/offre-gravure` · CSS `.og-*`.
- ✅ **UN CODE PAR CLIENTE, UNE SEULE UTILISATION — APPLIQUÉ LE 17/09/2026** (demande du gérant :
  « il faut que les clients utilisent qu'une fois le code », puis « on fait un code par client »).
  **Avant, c'était un trou** : un seul code commun créé en `reusable: true` → illimité et
  **partageable** (une inscrite pouvait le donner à qui elle voulait). Maintenant chaque cliente
  reçoit **SON** code (`GRAVURE-A7K2`, `GRAVURE-M4P9`…) avec **trois verrous**, tous vérifiés
  **côté serveur** (`/api/promo-validate` ET `/api/checkout`) donc incontournables :
  1. **`email`** (nouveau champ de `setPromoCode`) — le code ne marche QUE pour l'adresse à
     laquelle il a été envoyé. Autre adresse → `wrongEmail`, message cliente « Ce code est réservé
     à l'adresse e-mail à laquelle il a été envoyé ». **Adresse vide = bloqué** (pas de remise par
     défaut). Un code sans `email` reste OUVERT (ambassadeurs inchangés).
  2. **`reusable: false`** — une seule utilisation, mémorisée sur l'e-mail (`recordCodeUsage` au
     webhook Stripe, + l'e-mail saisi au panier, pour qu'en changer au paiement ne serve à rien).
  3. **`days`** calculé sur la **date de fin de l'offre** → le code MEURT avec l'offre, même s'il fuite.
  · Codes générés dans `runOffreGravureJob` (`src/lib/jobs.js`) : préfixe réglable (`o.code`) +
    5 caractères tirés d'un alphabet **sans 0/O/1/I/L** (recopiable à la main), unicité vérifiée
    contre les codes existants, et **le code est créé AVANT l'envoi** (jamais de promesse creuse ;
    si la génération échoue, la cliente est simplement sautée).
  · Le code est gardé **à côté de l'adresse** (`markOffreGravureSent` accepte `{email, code}`,
    section `offreGravure` = `{email: {at, code}}`, ancien format `{email: ts}` toujours lu) → on
    retrouve son code si elle écrit « mon code ne marche pas ».
  · L'écran Promotions ne passe PAS `email` à `setPromoCode` → ré-enregistrer un code nominatif à
    la main **conserve** son verrou (pas de déverrouillage accidentel).
  · ⚠️ **Conséquence à connaître** : la liste de Promotions va se remplir d'un code par cliente
    servie. C'est normal. Un nettoyage des codes expirés reste à faire si ça gêne.
  · 17 vérifications de logique passées au vert (unicité sur 500 codes, majuscules/espaces
    normalisés, mauvaise adresse refusée au panier ET au paiement, expiration calée sur la fin).
- **Le code promo est créé pour de vrai** avant l'envoi (règle : aucune promesse qui ne marche pas
  au paiement) et **un code déjà réglé à la main n'est jamais écrasé**.
- **⚠️ LE SUPPLÉMENT DE GRAVURE N'EST PAS TOUJOURS DE 3 € (remarque du gérant, 11/09/2026)** —
  relevé dans `products.js` : `collier-plaque-acier` recto **inclus** + verso **+5 €** + photo
  **+8 €** (`perExtraPage`/`photoSurcharge`) · `collier-medaillon-livre` **3 pages × 5 €** (15 €) ·
  `collier-coeur-plaques` **3 zones × 3 €** · recto-verso divers **2 × 3 €** · cristaux **texte
  +5 €** (la photo 3D est incluse, le socle LED 19,90 € n'est PAS de la gravure) · verre à whisky
  face+fond **+7 €**. Un code à −3 € n'offre donc PAS « la gravure » partout.
  **Il ne veut PAS offrir toutes les pages.**
- ✅ **RÈGLE TRANCHÉE PAR LE GÉRANT LE 11/09/2026** (maquette `docs/maquettes/regle-gravure-offerte.html`,
  artifact https://claude.ai/code/artifact/f97064b3-4f31-4e45-850c-e3644b0b1590, version 2) :
  · le code offre **UNE gravure, une seule, à son PRIX RÉEL** (3 € ou 5 € selon la pièce) —
    **AUCUN plafond fixe** : « ça dépend des produits de toute façon » ;
  · sur les **bijoux, les cristaux ET les cadeaux gravés** (porte-clés, pièce laiton — il a dit oui) ;
  · **verres, flûte, carafe HORS OFFRE** (leur port coûte déjà cher) ;
  · **un seul cadeau par commande**, même avec plusieurs bijoux au panier ;
  · **restent payants** : les pages/zones suivantes, la photo gravée (+8 €), le socle LED (19,90 €) ;
  · **pas de minimum d'achat** (un seuil à 25 € reste possible s'il change d'avis) ;
  · phrase cliente : **« Gravure offerte sur les bijoux et le cristal. »**
- ✅ **LA RÈGLE EST CODÉE — 17/09/2026** (le gérant a repris le sujet : « en fait c'est une gravure
  offerte pour n'importe quel produit »). **Changement par rapport au 11/09 : les VERRES ne sont plus
  exclus** — n'importe quel produit. Mécanique :
  · `prixPremiereGravure(product, fields, variantId)` dans `src/lib/engravingPrice.js` = le prix
    d'UNE gravure sur cette pièce (textExtra / pageText / perExtraPage / modeleSubExtra / flatExtra
    de gravure), **0 si rien de payant**. Exclus : la **photo** (`photoSurcharge`), les **motifs
    suivants**, et tout flatExtra **physique** (avec `stockId` ou `weight` : socle LED, coffret).
    Vérifié sur les 38 produits gravables : **jamais plus que le supplément réellement facturé**.
  · Un code porte `kind: "gravure"` (nouveau champ de `setPromoCode`). Au paiement
    (`/api/checkout`), la remise n'est PAS `value` mais **le prix de la première gravure payante
    trouvée dans le panier** (ordre du panier), coupon Stripe « Gravure offerte (CODE) ». Sans
    gravure payante → aucune remise. Au panier (`/api/promo-validate` reçoit maintenant `items`),
    on annonce la vraie remise ; sans gravure → `noEngraving`, message « ajoutez un texte à graver ».
  · `o.montant` de l'écran n'est plus qu'un **montant de secours** (libellé changé).
- ✅ **E-MAIL ADAPTÉ À CHAQUE CLIENTE (17/09/2026)** : ancienneté (5 phrases) + **son code** + **ses
  favoris** (`getFavoris(email)`, nom/photo/prix lus dans `getCatalog()` à l'envoi ; photos rendues
  absolues) — sinon 3 idées (`IDEES` dans `jobs.js` : plaque acier, cristal vertical, porte-clés cuir,
  verre à vin). Formulation « sur votre première pièce gravée — quelle qu'elle soit » + phrase
  « votre code est personnel ». Pas de prénom : les inscrites n'ont qu'un e-mail et une date.
- ✅ **NETTOYAGE DES CODES (17/09/2026)** : `purgeExpiredPromoCodes()` supprime les codes
  **nominatifs** (avec `email`) **expirés ou déjà utilisés** — jamais un code ouvert (BIENVENUE10,
  ambassadeurs, codes à la main : ils portent stats et commissions). Lancé à chaque passage réel de
  `runOffreGravureJob` + bouton « Nettoyer les codes expirés » + KPI « Codes personnels actifs »
  (`POST /api/admin/offre-gravure {action:"purge"}`).
- 🚀 **LANCÉE LE 20/09/2026 — 49 E-MAILS PARTIS ENTRE 9 H 25 ET 9 H 27 (heure française), 0 échec.**
  Réglage : `enabled:true`, `start: 2026-09-20`, `end: 2026-10-20`, préfixe `GRAVURE`, cadeau coché.
  Ciblage vérifié : buyers + devis + vrais échanges exclus (Ludovic, Aurore, Audrey absents).
  1 inscrite « en attente » (< 3 jours) et les prochaines partent seules via le battement, jusqu'au 20/10.
  **Idées de l'e-mail** (sans favoris) : plaque acier · cristal vertical · **Bracelet Femme Cœur**
  (le porte-clés a été retiré à la demande du gérant le 20/09, « un bijou femme à graver »).
  · 🔴 **INCIDENT DU PASSAGE DE 9 H 00** : le battement a créé les 49 codes puis **aucun e-mail n'est
    parti** (0 trace, erreur Gmail avalée par `sendClientMail`). Constaté via la boîte d'envoi de
    l'atelier (vide) et le compteur « déjà servies » à 0. Corrigé dans la foulée (commits `b4cfc42`,
    `10ae652`) : `sendClientMail` garde l'erreur Gmail · `gmailAccessToken` **met le jeton en cache**
    (avant : une demande de jeton à Google PAR e-mail — cause la plus probable en série) ·
    `runOffreGravureJob` note échecs + erreurs (section `jobNotes`, visible dans
    `GET /api/admin/offre-gravure → dernierPassage`), **réutilise un code nominatif encore valide**
    (pas de doublon), **mémorise chaque envoi réussi aussitôt** (un passage coupé ne ressert jamais
    personne), et accepte `POST {action:"test", to}` (un seul envoi, rien mémorisé — le gérant
    reçoit les tests dans la boîte de l'atelier, ne pas en abuser).
  · Battement : verrou pris **seulement si l'offre est ouverte** (clé `offreGravureJob`, commit
    `05a35b6`) → une ouverture à heure fixe marche. Pour détecter un déploiement sans envoyer de
    test : `curl -s https://nivcreation.fr/ | grep -o 'buildId\\":\\"[A-Za-z0-9_-]*'`
    (les déploiements poussés à la suite sortent l'un après l'autre, ~4 min chacun).
  · Maquette validée des 2 e-mails : `docs/maquettes/offre-gravure-emails.html`. **Pour arrêter** :
    décocher Activer.
- ⏸️ **MISE EN PAUSE LE 25/09/2026** (« tu peux arrêter là, on va attendre, je te relancerai ») :
  `enabled:false` posé par `POST /api/admin/settings` (dates 20/09→20/10 conservées). Les 53 codes
  déjà donnés RESTENT valables (ils ne dépendent pas de ce réglage). Dernier envoi : 25/09 9 h 15.
  **REPRISE = LUI** : Gestion → Marketing → Offre gravure → cocher « Activer » → Enregistrer →
  les inscrites en attente sont servies **dans la foulée** (appel `send` automatique à l'activation),
  puis le battement continue chaque jour. Une date de fin déjà passée est effacée à l'activation
  (fin vide = envois tant que c'est coché). Ne jamais réactiver sans sa demande.
- ✅ **UN MOIS PAR CLIENTE (25/09/2026)** : avant, tout le monde avait la fin commune `o.end` → une
  inscrite servie le 25/09 n'avait que 25 jours. Maintenant **30 jours à compter de SON e-mail**
  (`OFFRE_GRAVURE_JOURS` dans `offreGravure.js`) : date écrite dans l'e-mail (`finPerso`) et code
  (`days: 31`, pour couvrir toute la journée annoncée). Les 3 servies les 22, 24 et 25/09 gardent
  le 20/10 (question « les allonger ? » posée, pas tranchée).
- ⛔ **LANCEMENT = UNIQUEMENT SUR DEMANDE EXPLICITE DU GÉRANT**, par l'autre conversation, en suivant
  **`docs/messages/offre-gravure-lancement.md`** (5 étapes ; décocher « cadeau » si le mode délai
  allongé est éteint ; annoncer le nombre d'envois AVANT de cliquer). L'offre est **éteinte**.
- **Ce que font les autres (recherche 11/09/2026)** : le modèle du marché FR est **la 1re gravure
  incluse, les faces suivantes payantes** (Atelier Aismée : recto offert, verso payant — c'est déjà
  le modèle du collier plaque acier). Nomination : gravure offerte **1 par client**, avec **minimum
  d'achat** (£39 / $59), hors articles soldés, non cumulable. Plusieurs boutiques (Emotion Gravure,
  Atelier de Famille) annoncent « gravure offerte » comme argument permanent, pas comme promo.
  → Une gravure par commande est la norme ; un minimum d'achat est courant et reste à trancher.
- **Maquette des 3 e-mails de la séquence** : `docs/maquettes/emails-relance-inscrites.html`
  (artifact https://claude.ai/code/artifact/1bb3b4e1-13b5-440f-9c55-9d92d0bcfe70). Les e-mails 2 et 3
  ne parlent QUE des bijoux, du cristal et des cadeaux gravés — **jamais des verres ni de la carafe**
  (leur port coûte trop cher pour être offert). Le cadeau surprise du colis est annoncé, avec le
  choix au paiement (surprise / plutôt femme / plutôt homme).

## 🧱 GESTION — SQUELETTE MODERNE PARTAGÉ (02/09/2026, « un truc moderne »)
> Le gérant a autorisé un nouveau design admin, sans contrainte de l'ancienne maquette « L'Écrin ».
- `src/app/gestion/layout.jsx` → `src/components/admin/AdminShell.jsx` : **toutes** les pages
  `/gestion/*` partagent la barre latérale sombre (7 groupes : Pilotage, Commandes, Clients,
  Catalogue, Marketing, Finances, Réglages), la barre du haut (fil d'Ariane, recherche globale →
  `/gestion/commandes?q=`, pastille « N à traiter », bouton ✦ Assistant) et le tiroir mobile.
- **Compteurs en direct** (toutes les 2 min, si la clé admin est en session) : à préparer,
  réponses clientes non lues (`/api/admin/bat?action=unread`), réponses à valider, avis.
- Les onglets internes de `/gestion/page.jsx` sont ciblés par `/gestion#id` (la page écoute le
  hash). L'ancienne barre latérale de cette page a été RETIRÉE (contenu intact) ; `GestionShell` /
  `AdminSidebar` (jamais utilisés) supprimés. Styles `.ash-*` en fin de `globals.css`.
- **Ajouter une page admin** : créer `src/app/gestion/<slug>/page.jsx` (elle hérite du squelette)
  et l'entrée dans `NAV` d'`AdminShell.jsx`. Ne pas remettre de barre latérale dans une page.

## 🧭 TABLEAU DE BORD v2 — APPLIQUÉ LE 19/09/2026 (« Appliquer »)
> Le gérant a demandé « qu'est-ce que tu peux améliorer sur mon dashboard », a retenu 3 points, a
> demandé de regarder ce que font Shopify / WooCommerce / Etsy, puis la maquette
> (`docs/maquettes/tableau-de-bord-v2.html`, validée) avec le sélecteur de période en plus.
- **Composants** : `src/components/admin/DashBlocks.jsx` — `BandeauDelai` (②), `MessagesATraiter`
  (①), `ChiffresPeriode` (③+④). **Calculs purs et testés** (23 vérifications) dans
  `src/lib/dashPeriodes.js` : `chiffresPeriode` (CA / commandes / panier sur jour · 7 j · mois ·
  30 j, comparés à la période PRÉCÉDENTE de même longueur), `tendance`, `devisEnAttente`,
  `commandesEnRetard(orders, 14)`, `depuis`. Branché dans l'onglet accueil de `src/app/gestion/page.jsx`.
- **① Messages à traiter** = réponses préparées par l'agent (`/api/admin/pending-replies` → liste
  complète, plus seulement le compte) + réponses de clientes non lues dans leur commande
  (`/api/admin/bat?action=unread` renvoie maintenant AUSSI `unreadMeta` : orderId, ref, nom, date).
  Une ligne = initiale, nom, pièce/commande, chip, « il y a N h », bouton direct (« Relire et envoyer »
  → `/repondre/<jeton>` ; « Ouvrir la commande » → onglet Commandes, fiche dépliée, fil ouvert,
  pastille effacée). **Rouge passé 24 h.** Les plus anciennes en premier. Vide → « tout est traité ».
  La ligne « réponses à valider » du panneau « À faire » a été retirée (doublon).
  · ⚠️ **TROU CORRIGÉ LE 19/09 (remarque du gérant : « on a traité tous les messages, non ? »)** :
    une réponse préparée par l'agent ne se classait QUE par la page `/repondre/<jeton>`. Répondre à
    la cliente par **Messages clients** (ce que fait l'autre conversation) la laissait « à valider »
    pour toujours → TRAN et Alicia (répondues le 17/09) apparaissaient encore. Maintenant **un
    message de l'atelier, par n'importe quel canal, classe la réponse préparée** : `logComm`
    (`from:"nous"`) appelle `classerPendingPourEmail` (envois programmés rangent aussi dans le
    dossier désormais), et `GET /api/admin/pending-replies` commence par
    `purgeAnsweredPendingReplies()` (auto-réparation : pending + message atelier plus récent dans
    le dossier → classé `deja-repondu`). Une demande **plus récente** que le dernier message atelier
    reste bien en attente.
- **② Bandeau délai allongé** : lu dans `settings.vacation` (`vacationActive`), « Régler » → onglet
  Apparence, « Éteindre » → confirmation puis `POST /api/admin/settings {vacation:{…, enabled:false}}`.
  Invisible quand le mode est éteint.
- **③ Chiffres** : 4 tuiles (plus jamais 5 sur une grille de 4) — CA avec tendance et **barre vers
  `salesGoal`** (sur « Ce mois » seulement) · commandes · panier moyen · devis en attente
  (`/api/admin/quotes`, type devis, ni payé ni annulé ; clic → onglet Devis). Puis une ligne de
  pastilles : à préparer · **en retard (+14 j) avec la réf la plus ancienne** · en gravure · avis.
  Les anciennes tuiles « Commandes (total) » et « Clientes (total) » ont disparu de l'accueil (les
  totaux restent dans Statistiques / CRM).
- **④ Sélecteur** Aujourd'hui / 7 jours / Ce mois / 30 jours (`PERIODES`), défaut « Ce mois ».
  « vs août » est calculé sur le vrai mois précédent ; sans historique → « nouveau », sans rien → « = ».
- **CSS** `.dq-*` en fin de `globals.css` (mêmes classes que la maquette). Le reste du tableau de
  bord (dernières commandes, stock cristal, À faire, URSSAF, Assistant) est **inchangé**.
- ⚠️ Vérifié : build OK + calculs testés. **Le rendu réel de `/gestion` n'a pas pu être capturé**
  (Firestore + clé admin nécessaires, site injoignable depuis la session) → à regarder en ligne.

## 📱 GESTION SUR TÉLÉPHONE — APPLIQUÉ LE 19/09/2026 (« Applique »)
> Demande du gérant : « quand je lis les mails je peux pas retourner en arrière, j'ai pas de bouton
> retour… adapte l'admin pour les portables, pour le PC tu peux laisser comme ça… les mails c'est
> moche, j'arrive pas à lire, y a pas d'espace, c'est amateur… cherche comment font les grands
> sites ». Maquette `docs/maquettes/admin-mobile.html` (artifact
> https://claude.ai/artifact/H2PcXbdviEadpRrdVo1UPf) validée, puis construite.
- ⛔ **L'ORDINATEUR N'EST PAS TOUCHÉ.** Tout est dans `@media (max-width: 900px)` (ou 720 px pour
  les messages). Vérifié à 1440 px : barre d'onglets masquée, croix masquée, recherche d'écran
  masquée, barre latérale toujours à 244 px, bouton Assistant toujours à 106 px. **Ne jamais
  déplacer ces règles hors de leur media query.**
- **① Barre d'onglets en bas** (`.ash-tabs`, constante `TABS` d'`AdminShell`) : Accueil · Commandes ·
  Messages · Produits · **Plus** (ouvre le tiroir). Le modèle des applis de gestion (Shopify mobile,
  Etsy Seller) : 4-5 destinations au pouce plutôt que tout derrière un ☰. Pastilles rouges =
  `prep` et `unread + replies`, les compteurs déjà calculés. `.ash-content` réserve
  `calc(78px + env(safe-area-inset-bottom))` en bas — **si on grossit la barre, augmenter ce padding**.
- **② Flèche ‹ de retour** : remplace le ☰ dès qu'on est descendu d'un cran. Deux sources —
  · la page a ouvert un écran par-dessus elle → **`useAdminBack(actif, label, fn)`**
    (`src/components/admin/adminBack.js`, petit registre + `useSyncExternalStore` dans `AdminShell`) ;
  · sinon, si l'écran n'est pas une des destinations de `TABS` → retour à `/gestion`.
  Le `label` dit **où la flèche ramène** (« Tous les messages »), il s'affiche en petit SOUS le titre
  (`.ash-crumb-back`) ; le titre reste le nom de l'écran. **Toute page qui ouvre quelque chose
  par-dessus elle (e-mail, fiche, fil) doit appeler `useAdminBack`** — sinon pas de retour.
  Branché sur `/gestion/boite-mail` (e-mail ouvert). Testé : la flèche referme l'e-mail SANS changer
  de page, un 2ᵉ appui quitte vers `/gestion`.
- **③ Tiroir** : vraie croix `.ash-close` (40 × 40) + **recherche d'écran** `.ash-find` (sans accents,
  29 entrées devenaient illisibles au pouce). Le ✦ Assistant devient une pastille de 38 px.
- **④ LECTURE DES MESSAGES — la règle à réutiliser PARTOUT** : `.mb-text` / `.mb-quoted` portent
  **`overflow-wrap: anywhere`** + interligne 1,6. **C'était LE défaut** : les bulles étaient en
  `white-space: pre-line` SANS règle de coupure → un lien de suivi ou une adresse sortait de l'écran
  et le texte était tranché à droite (exactement ses captures). **Tout nouvel endroit qui affiche
  un message client doit passer par `<MailBody text={…} />`**, jamais par un `<div>` brut.
- **⑤ Texte cité replié** : `separerCitation()` dans **`src/lib/mailQuote.js`** coupe le message en
  `{main, quoted}` (lignes « > », « Le … a écrit : », « On … wrote: », « -----Message d'origine----- »,
  trait Outlook, « De : »). Replié derrière « ··· Afficher le texte cité (N lignes) » comme Gmail.
  ⚠️ **`main + quoted` contient TOUJOURS l'intégralité du texte** — en cas de doute la fonction ne
  coupe pas (citation seule, réponse vide au-dessus, moins de 40 caractères). 12 vérifications au vert.
- **⑥ Boutons au pouce** : `.bm-actions` collé en bas au-dessus de la barre d'onglets (≤ 720 px),
  cibles de 46 px. Le corps d'un e-mail **ne défile plus dans une boîte de 260 px** (`maxHeight` +
  `overflow:auto` retirés) : un cadre qui défile dans une page qui défile est le pire cas tactile.
- **Fichiers** : `src/lib/mailQuote.js` (+ test) · `src/components/admin/MailBody.jsx` ·
  `src/components/admin/adminBack.js` · `AdminShell.jsx` (TABS, retour, croix, recherche) ·
  `BatThread.jsx` (réécrit en classes `.bt-*`, séparateurs de jour, « Nous » / nom de la cliente) ·
  `src/app/gestion/boite-mail/page.jsx` (en-tête `.bm-*`, `MailBody`, `useAdminBack`) ·
  CSS `.ash-tabs/.ash-back/.ash-close/.ash-find`, `.mb-*`, `.bt-*`, `.bm-*` en fin de `globals.css`.
- 🔴 **PIÈGE CSS À NE PAS REFAIRE** : `font: 600 0.63rem/1.1 inherit` est **invalide** (`inherit`
  n'est pas une famille dans le raccourci `font`) → **toute la déclaration est ignorée** et les
  libellés des onglets se collaient les uns aux autres. Dans ce fichier, écrire `font-weight` /
  `font-size` / `line-height` séparément, ou mettre une vraie famille (`system-ui`).
- **Vérifié au navigateur** (390 px et 1440 px, `/gestion`, `/gestion/commandes`, `/gestion/boite-mail`,
  `/gestion/crm`) : aucun défilement horizontal, aucun élément qui déborde, 0 erreur JavaScript,
  tiroir qui s'ouvre et se ferme par la croix, filtre d'écran, flèche de retour dans les deux modes.

## 🖥️ GESTION — TOUTES LES TAILLES D'ÉCRAN (PC / Mac) — APPLIQUÉ LE 22/09/2026
> Demande du gérant : « il faut que t'adaptes l'application admin pour tous les écrans de PC au Mac,
> pour tous les écrans, toutes les tailles ». Mesuré au navigateur sur **21 largeurs** de 390 à
> 3840 px (téléphones, iPad, vieux PC 1024, Mac zoomé, MacBook Air/Pro, iMac 21/27, Full HD, 4K,
> ultra-large) — avant : 5 largeurs en défaut ; après : **21/21 sans défaut**.
- ⛔ **LE CONSTAT DE DÉPART** : l'admin ne connaissait qu'**UN palier (900 px)** plus deux paliers
  ad hoc. Toute la bande « petit portable » était orpheline. Ne plus ajouter un écran admin sans
  vérifier cette bande.
- **① Contenu centré sur grand écran** : `.ash-content` avait `max-width: 1500px` **sans
  `margin: 0 auto`** → le contenu était collé à gauche avec **816 px de vide à droite sur un
  iMac 27"** (1696 px en ultra-large). Ajout de `margin: 0 auto` → vide symétrique (408 px de
  chaque côté à 2560). Le plafond de 1500 px est **volontaire** (largeur de lecture, comme les
  grands back-offices) ; il est réglable s'il veut des tableaux plus larges.
- **② La page défilait horizontalement de 800 à 1152 px** (donc iPad, vieux PC, **et un Mac 1440
  affiché à 125 %**). Cause unique et bête : les champs de `.ach-meta` (Achats & factures)
  n'avaient **ni `box-sizing: border-box` ni `min-width: 0`** → leur largeur intrinsèque forçait
  la grille `auto-fit` et poussait la page entière. Corrigé + `.ach-meta > * { min-width: 0 }`.
  ⚠️ **Règle à retenir : tout `input`/`select` dans une grille admin doit porter
  `box-sizing: border-box` + `min-width: 0`**, sinon il élargit la page.
- **③ NOUVEAU PALIER `901–1200 px`** (bande petit portable / tablette / navigateur zoomé) :
  `--ash-side` passe de 244 à **208 px** et les marges de contenu de 22 à 16 px (**+36 px rendus
  au contenu**) · `.ach-line` resserrée pour ne plus être rognée (elle l'était de 45 px à 901 px) ·
  `.file-cols` passe à **2 colonnes** au lieu de 3 bandes de ~190 px illisibles.
- **④ Référence de commande rognée À TOUTES LES LARGEURS** : `.dash-orow` avait une colonne fixe de
  `68px` alors qu'une réf de 8 caractères en `tabular-nums` demande ~78 px → « 00CUYR2U » coupée
  partout, y compris sur un iMac. Passée en `minmax(78px, auto)`. Même défaut sur téléphone
  (palier 720 px, colonne de 52 px) → `minmax(72px, auto)`.
- **⑤ EN-TÊTE DU TABLEAU PRODUITS DÉCALÉ sous 1100 px** : le palier 1100 masque `.pt-cat` dans les
  lignes, mais l'en-tête écrivait `<span>Catégorie</span>` **sans la classe** → 6 cases pour
  5 colonnes, tous les libellés décalés d'un cran (« Prix » au-dessus du Stock…). Corrigé dans
  `ProductsAdmin.jsx`. ⚠️ **Toute colonne masquée par media query doit porter la même classe dans
  l'en-tête que dans les lignes.**
- **⑥ Champ de stock** : `.admin-stock-pill input` faisait 44 + 4 + 2 = **50 px** faute de
  `box-sizing` → débordait sa pastille. Corrigé.
- **Méthode réutilisable** : page de mesure temporaire sous `/gestion` reproduisant les blocs les
  plus larges (tuiles, `.dq-row`, `.file-cols`, `.co-head`, `.pt-row`, `.ach-line`), puis sonde
  Chromium sur la grille de largeurs. ⚠️ **Exclure `input`/`select` de la détection de contenu
  rogné** : un champ dont la valeur dépasse défile à l'intérieur, c'est normal (faux positif).
  La page de mesure a été **supprimée** après vérification.
- **Vérifié aussi** : `/gestion`, `/gestion/commandes`, `/gestion/achats`, `/gestion/crm` à 901,
  1024, 1280 et 2560 px — aucun défilement horizontal, un seul H1, 0 erreur JavaScript. Le travail
  téléphone du 19/09 (barre d'onglets, flèche de retour) fonctionne toujours : onglets visibles
  jusqu'à 900 px, absents au-dessus.

## 📎 PHOTO D'UNE COMMANDE SUR DEVIS DANS LA FICHE ATELIER — 23/09/2026
> Remarque du gérant (commande Sophie Berardo #0C1CGL2Q, devis DEV-0003) : « pourquoi dans la fiche
> de travail y a pas la photo qu'elle demande ». Une commande sur devis n'a PAS de `spec` : la photo
> arrive en **pièce jointe d'un e-mail** → la fiche disait « aucun réglage détaillé ».
- **Maintenant** : `FicheAtelier` (écran + papier) et `/gestion/atelier` (section « Sur mesure
  (devis) », commandes à préparer / en gravure) montrent **la demande du devis** + **les photos
  envoyées par la cliente**, lues dans la boîte Gmail connectée au site (LECTURE SEULE) :
  `gmailListPhotosFrom` / `gmailGetAttachment` (`src/lib/gmail.js`), API admin
  `GET /api/admin/gmail?action=photos&email=` puis `?action=attachment&msg=&att=&mime=`,
  composant `src/components/admin/PhotosEmail.jsx` (vignette + « Télécharger »).
- « Imprimer la fiche » attend que la photo soit chargée (8 s max) avant d'imprimer.
- **Photo RENVOYÉE par e-mail après une commande normale (24/09/2026)** : Rose Catarino #1Z17IKQ8 a
  commandé avec une photo en français puis renvoyé la version PORTUGAISE par e-mail le 15/09 ; la
  fiche à l'écran ne montrait que la photo du site. `FicheAtelier` affiche maintenant, sous les
  réglages de TOUTE commande, les photos reçues par e-mail (« à comparer avec celle de la commande :
  la plus récente est la bonne »), rien si aucune (`masquerSiVide`). La fiche papier le faisait déjà.
- ⚠️ **Déploiement** : le 23/09, 4 envois poussés en 10 minutes → le 4ᵉ a échoué côté Firebase
  (« Build failed » en 2 min 30 alors que le build local passait), les 3 autres ont réussi. Vérifier
  un déploiement : `curl -s https://api.github.com/repos/nirojh93700-afk/Niro/commits/<sha>/check-runs`
  (`conclusion` success/failure). En cas d'échec, relancer avec le commit suivant.

## 🖨️ FICHE ATELIER IMPRIMÉE — UNE SEULE FEUILLE A4 (24/09/2026)
> Demande du gérant : « dans les commandes, imprimer la fiche… il faut que ça soit concentré pour
> une feuille A4 et correctement, comme un truc professionnel — corrige pour TOUTES les commandes,
> là j'ai imprimé je suis en train de gratter » + « il faut que ça soit bien détaillé avec tous les
> détails de la commande, image comprise ». Avant : 2 à 3 pages, mise en page d'écran, bouton
> « Télécharger » et JSON brut imprimés pour rien.
- **Mise en page papier dédiée** `src/components/admin/FichePapier.jsx` (classes `.fp-*`) : en-tête
  (titre · date/devis · réf + statut + total), puis **deux colonnes** —
  · gauche = ce qu'on LIT : encadrés d'alerte (geste promis, **cadeau à glisser**, demande du devis,
    texte demandé), **tableau « À graver »** (le plus gros de la feuille, une face par ligne, +
    vignette du dessin numéroté), articles, client & livraison, détail du prix, note interne ;
  · droite = ce qu'on REGARDE : visuel reconstruit de chaque article (`GlassPreview`), ses réglages
    (`ReglagesItem`), et la **photo envoyée par la cliente** (`PhotosEmail`).
  Les deux blocs de droite sont **exportés de `FicheAtelier.jsx`** pour ne pas dupliquer l'écran.
- **Tient sur une page quoi qu'il arrive** — `src/lib/impression.js` (`imprimerFiche()`, branché sur
  le bouton « 🖨️ Imprimer la fiche ») : attend les photos, mesure la feuille, puis joue sur DEUX
  leviers dans cet ordre — **la taille des photos** (`--fp-vis` : 1 → 0,85 → 0,72 → 0,6 → 0,45, on
  s'arrête dès que le texte tient à ≥ 75 %), **puis** la taille générale (`--impr-echelle`, plancher
  0,58). Mesuré : 1 article = 100 % · 2 articles + 4 encadrés + photo = 81 % · 3 articles gravés
  différents = 60 %, tables « À graver » toujours lisibles.
- ✅ **TEST AUTOMATIQUE : `npm run test-impression`** (`tools/tests/impression-fiche.mjs`). Il
  reconstruit 4 feuilles avec le VRAI bloc CSS de `globals.css` **et la règle de plein écran de
  l'admin**, joue l'algorithme de `impression.js` en média écran, puis vérifie : feuille mesurable ·
  visible à l'impression · **pourcentage d'encre > 2 %** (c'est ça qui attrape la feuille blanche) ·
  **exactement 1 page** dans le PDF. `IMPR_GARDER=<dossier>` garde les images pour les regarder.
  Playwright n'est pas une dépendance du site (déploiement) : le test se saute tout seul s'il manque
  (`npm i --no-save playwright-core`).
- 🔴🔴 **LA FEUILLE BLANCHE (24/09/2026) — LE PIÈGE LE PLUS COÛTEUX.** Le gérant a imprimé : une
  page **entièrement vide**. La fiche est rendue dans un **portail**, c'est donc un **enfant direct
  du `<body>`** — et le plein écran de l'admin masque tous les enfants du body sauf `<main>` :
  `body:has(.ash) > *:not(main):not(script):not(style):not(link) { display: none !important; }`
  (fin de `globals.css`). Cette règle porte `!important`, donc **elle gagne contre n'importe quelle
  spécificité**. Les deux règles qui ré-affichent la feuille DOIVENT donc porter `!important` :
  `body.impression-fiche .zone-impression` (impression) et `body.impression-mesure .zone-impression`
  (mesure — sans lui, `scrollHeight` vaut 0 et la réduction est calculée n'importe comment).
  **Ne jamais retirer ces deux `!important`.** C'est `npm run test-impression` qui le surveille.
  ⚠️ Et quand on écrit un test pour ça : **mettre la règle de plein écran dans la feuille de style
  du test**. Un premier harnais y avait recopié des lignes de COMMENTAIRE citant le sélecteur →
  CSS invalide, règle avalée, la panne ne se reproduisait pas et le test passait au vert à tort.
- 🔴 **TROIS PIÈGES À NE PAS REFAIRE** (chacun a coûté un aller-retour) :
  1. **La mise en page `.fp-*` est HORS `@media print`.** Les styles d'impression ne s'appliquent
     QUE pendant l'impression : en les y laissant, la mesure (faite avant, en média écran) portait
     sur un bloc sans styles et la réduction calculée était fausse. La feuille reste `display:none`
     à l'écran, sauf pendant la mesure (`body.impression-mesure`, hors champ à −10000 px).
  2. **`zoom`, jamais `transform: scale()`.** Une transformation ne réduit pas la hauteur de MISE EN
     PAGE : le navigateur comptait toujours deux pages et sortait une feuille blanche.
  3. **Avec `zoom`, PAS de compensation de largeur** (`width: 100%`, pas `calc(100% / échelle)`) :
     `100%` est déjà exprimé dans les unités réduites — diviser en plus faisait déborder la fiche
     de la feuille par la droite.
- ⚠️ **Ne jamais redimensionner `GlassPreview` par une largeur CSS** : la gravure posée dessus est
  dimensionnée en pixels à partir de ses 300 px, elle se décalerait de la photo. On le réduit
  **en bloc avec `zoom`**, et seulement l'image (les réglages en dessous gardent leur taille).
- Sur papier, `PhotosEmail` n'imprime plus « aucune photo trouvée » (inutile à l'atelier), et si la
  colonne de droite est vide la feuille repasse sur **une seule colonne** (règle `:has()`).
- **Méthode de vérification réutilisable** : 4 fiches HTML de test (légère / moyenne / lourde /
  devis) portant le vrai bloc CSS, mesurées par Chromium avec l'algorithme exact d'`impression.js`
  **en média écran**, puis `page.pdf({format:"A4"})` → **compter les pages dans le PDF** et regarder
  le rendu. C'est le seul moyen de prouver « une feuille », le site étant injoignable d'ici.

## 📊 ÉTUDE DE MARCHÉ DU CATALOGUE — 26/09/2026 (constat, RIEN appliqué)
> Demande du gérant : « fais une étude de marché par rapport à ses produits ». Dossier
> **`docs/etude-marche-2026-09.md`** + page **`docs/etude-marche-2026-09.html`** (artifact
> https://claude.ai/artifact/VWntbMV3t7VNiadodvW7f2). Complète `docs/prix-marche.md` (verres, 16/09).
> ⚠️ Les fiches concurrentes sont bloquées par le proxy (`EGRESS_BLOCKED`) : prix tirés des extraits
> de recherche, à vérifier avant décision.
- **Au niveau** : verres, carafe, cristal (Zephyr 39→169 €, Rayjan 29,90→119 €), clés USB, plaques
  de naissance, pièce laiton, numéros de table, ronds de serviette, collier puzzle.
- **Sous le marché (pistes, à valider par LUI)** : porte-clés cuir 7,90 € (marché 12,95–13,90) →
  9,90 · veilleuse/lampe arbre de vie 29,90 € (marché 37–49) → 34,90 · bracelets homme cuir/gourmette
  25–30 € (Petits Trésors 35–39) → 34,90.
- **Vigilance** : plaque de porte enfant 29,99 € (marché 19,50–28,50) · menu mariage 34,90 € (pas de
  comparable) · gobelet 40 oz 39,90 € (Etsy 30–45).
- **Bijoux acier** : TOUT le marché inclut la 1re gravure (CadeauGravure 10,90–26,90 € gravure
  incluse ; Petits Trésors/Aismée/Merci Maman gravure offerte). Chez nous +3 € → c'est la question
  ouverte du 14/09, à trancher par le gérant.
- Saisonnalité : recherches « cadeau personnalisé » +145 % déc., +138 % mai, +129 % fév.

## 🍹 VERRE À COCKTAIL GRAVÉ — ✅ EN LIGNE LE 26/09/2026 (`verre-a-cocktail-grave`, ordre « vas-y tu publies »)
> **État au 26/09 soir** : fiche publiée, reproduction EXACTE de la maquette (8 photos dans l'ordre
> de la maquette, recadrées en carré 900×900 ; `photoContain` retiré — le whisky ne l'a pas).
> Gabarit = verre à whisky portrait (face / fond / les deux +7 €, photo + texte +3 € + date + décor + police).
> Incident du jour : la fiche n'avait PAS de `engraveImage` → l'éditeur photo ne s'affichait jamais
> côté face (« rien ne se passe »). Corrigé (commit `dc883e6`). Le gérant trouvait ensuite la photo
> encore mal placée / trop grande → **il veut régler les cadres LUI-MÊME dans l'admin** (« tu me mets
> dans l'admin comme pour les autres, je vais le paramétrer, je te dis, tu valides ») :
> - `zoneAdmin: true` sur le produit (cocktail **ET verre à whisky portrait** `verre-a-whisky-grave`,
>   ajouté à sa demande le 26/09 soir « corrige aussi pour le fond du verre de whisky » ; Fête des
>   pères non concerné) → il apparaît DEUX fois dans **Gestion → Réglages produits →
>   « Réglage cristaux, verres & carafe »** (`/gestion/cristal-reglage`) : « — face avant » (clé
>   `verre-a-cocktail-grave`) et « — fond du verre » (clé `verre-a-cocktail-grave#fond`, photo
>   `fondImage`). Il glisse/redimensionne le cadre, coche **« Utiliser ce cadre sur la fiche »**,
>   Enregistre. Tant que la case est décochée, la fiche garde `engrave` / `engraveFond` du code.
> - Côté fiche (`ProductDetail.jsx`, état `adminZones`, lecture `/api/crystal-zones`) : un cadre
>   actif remplace la config du code (`box`, `maxWidthFrac` = largeur du cadre, mm recalés) et
>   porte `fromAdmin:true` → `PhotoEngraveLayer` borne alors la photo **en largeur ET en hauteur**
>   (`maxHeightFrac` enfin utilisé, uniquement pour ces cadres) : une photo verticale ne déborde plus.
>   Les autres verres (whisky, vin, flûte, carafe) ne changent pas.
> - Photo très verticale sans cadre admin = déborde en hauteur sur TOUS les verres (le site ne borne
>   que la largeur) — vérifié identique sur le whisky. Whisky portrait : `maxWidthFrac` 0,50 → 0,30
>   le 26/09 à sa demande (Fête des pères NON touché : pas d'upload libre).
> - **Toujours pas de vraie photo GRAVÉE** de ce verre (verre reçu 29/09–1/10) : la fiche montre des
>   photos d'exemple de la maquette. Vidéo impossible tant qu'il n'y a pas de photo gravée (règle).
### (historique) NOUVEAU PRODUIT — VERRE À COCKTAIL GRAVÉ (25/09/2026, maquette enregistrée)
> Demande du gérant : « j'aimerais ajouter un produit » puis captures Metro (commande passée) +
> « c'est pas ces photos que tu dois mettre... fais une maquette, je te donnerai les vraies photos,
> on va le faire comme pour le verre à whisky ». Fiche construite en reprenant le gabarit EXACT du
> Verre à whisky portrait personnalisé (photo optionnelle + texte + décor + police + gravure
> face/fond +7 €) — même famille de fournisseur (Metro Professional Lario, comme le verre à whisky
> Lario 30 cl déjà en vente).
- **Maquette** : `docs/maquettes/verre-a-cocktail-fiche.html`, artifact
  https://claude.ai/artifact/XRYqfH6rdExwQUqGehB17Q. Construite à partir du VRAI rendu de la fiche
  `/produit/verre-a-whisky-grave` (HTML servi par `next start`, vraies feuilles de style, polices
  Google Fonts, logo en texte), texte/prix/accordéon adaptés au cocktail.
  ⛔ **PAS de gravure au fond du verre pour celui-ci** (demande du gérant, 25/09) — retiré le
  choix « face / fond / les deux (+7 €) » : ce verre haut et fin n'a qu'une seule zone de
  gravure, sur la face. À construire pour de vrai SANS le champ `emplacement` (garder juste
  `photo` + `texte` + `texte2`/date + `decor` + `police`, comme le whisky mais sans `engraveFond`,
  `fondImage`, `photoFond`, `texteFond`, `note-deux`, et sans le flatExtra `emplacement:deux +7€`).
- **Source** : METRO Professional Verre à cocktail Lario, 17 cl, carton de 12 — commande passée par
  le gérant, livraison prévue 29 sept.–1 oct. Coût 15,84 €/carton + 1,01 € de port ≈ **1,40 €/verre
  rendu**. Dimensions (web) : hauteur ≈ 12,5 cm, diamètre ≈ 5,2 cm, forme haute.
- **Photos (25/09, 3 photos envoyées par le gérant)** : verre vierge (studio, fond blanc), verre
  garni (cocktail jaune, anis étoilé), photo d'ambiance (3 cocktails sur table bois) — intégrées
  dans la galerie. ⚠️ **Aucune n'est une photo GRAVÉE** — le verre n'a pas encore été reçu ni gravé.
  **Il faudra une vraie photo gravée avant de publier pour de vrai**, comme sur toutes les autres
  fiches (règle du 22/09 : jamais un produit vierge en avant sur le site).
- **Prix proposés (à valider par le gérant)** : 17,90 € à l'unité · 33,90 € les 2 · 64,90 € les 4
  (livraison offerte dès 60 €, comme les autres verres). Marché relevé (25/09) : 12,90 € à 25,90 €
  pour un verre à cocktail gravé (sources : Verre Créations, Val Création, poupepoupi, ocadeau…).
- ⛔ **Aucune marque fournisseur sur le site** (ni Metro, ni Lario) — même règle que les autres verres.
- ✅ **Maquette ENREGISTRÉE telle quelle le 25/09 soir** (gérant : « enregistrer cette maquette, on
  reprendra après ») — c'est LUI qui relance. Ne rien construire dans le site d'ici là.
- **Reste à faire** : recevoir le verre (29 sept.–1 oct.), le graver, prendre une vraie photo gravée,
  faire valider le prix par le gérant, PUIS seulement ajouter le produit dans `products.js` +
  `productInfo.js` (suivre §10 de ce fichier — packaging, `productDates.js`, etc.) et publier.
  **Rien n'est en ligne, rien n'a été touché dans `products.js`.**

## 🎄 NOËL 2026 — ✅ BANDEAU + PAGE EN LIGNE LE 25/09/2026 (« pour Noël tu peux mettre en ligne »)
> **CE QUI EST EN LIGNE** (maquette v4 `docs/maquettes/noel-sur-accueil-actuel.html` reproduite) :
> · `src/components/home/BandeauNoel.jsx` — bandeau rouge de Noël & or « Ce Noël, offrez un cadeau
>   unique », mosaïque 3×3 (cristal, verres, 5 bijoux GRAVÉS), **premier bloc de `page.jsx`**, donc
>   juste sous le logo + menu, AVANT l'entrée cristal (inchangée) ; lien → `/offrir/noel`.
>   ✅ **DÉPLACÉ LE 26/09/2026 (« OK vas-y tu peux pousser », après maquette
>   `docs/maquettes/noel-avant-collections.html`, artifact
>   https://claude.ai/artifact/2nEdfPc1PAs5XeeGu2RowH)** : le bandeau ET la « Sélection de Noël »
>   sont maintenant **juste après « Verres & carafes gravés » et juste AVANT « Explorez nos
>   collections »** (`id="collections"`) dans `page.jsx`. Le haut de page (cristal + carafe) est
>   redevenu comme avant. Ordre : cristal → carafe → Vient d'arriver → Verres & carafes →
>   bandeau Noël → Sélection de Noël → Explorez nos collections.
> · « Sélection de Noël » = `<BandeauAccueil cinq>` (5 produits du catalogue en direct) juste AVANT
>   « Vient d'arriver » dans `page.jsx`.
> · **7ᵉ occasion `noel`** dans `src/lib/occasions.js` (`NOEL_SLUGS`, liste fermée de 18 produits,
>   `max: 20`, `ordre` gardé ; `produitsPourOccasion` lit `o.max`) → `/offrir/noel`, tuile sur
>   `/offrir`, sitemap automatique. Un produit masqué dans Gestion disparaît tout seul.
> · **Interrupteur** `settings.sections.noel` (défaut vrai) — Gestion → Apparence → Sections de
>   l'accueil → « 🎄 Bandeau Noël + sélection de Noël » : **à décocher après les fêtes**. Au passage,
>   le sanitizer de `/api/admin/settings` garde maintenant aussi `newArrivals/verresBand/mur` (avant,
>   il les jetait) et ces 3 cases sont ajoutées à l'écran Apparence.
> · CSS `.noel-*` en fin de `globals.css`. Vérifié en local : accueil 1280/390 px sans débordement,
>   `/offrir/noel` 18 cartes, sitemap OK, build OK (les erreurs React #425 de l'accueil sont ANTÉRIEURES).
> **Toujours en attente** : la DATE LIMITE de commande pour Noël (à ajouter dans le bandeau et la page
> dès qu'il la donne) · la boule de Noël (enregistrée, PAS en ligne) · le gobelet (maquette redonnée
> le 25/09, il doit dire « mets en ligne »).
### (historique) NOËL 2026 — PLAN ENREGISTRÉ LE 25/09/2026 (« garde ça en mémoire »), RIEN EN LIGNE
> Recherche marché du 25/09 : le catalogue n'a AUCUN produit de Noël alors que c'est la période
> n° 1 des cadeaux personnalisés. Le gérant a demandé : maquette boules de Noël, puis maquette
> d'un bloc Noël sur l'accueil + page Noël avec les produits existants qui correspondent.
- **Boule de Noël en bois gravée** — maquette validée à montrer : `docs/maquettes/boule-noel-fiche.html`
  (artifact https://claude.ai/artifact/1pDPGZqAzLgssMW7KmLb3d). Fiche interactive : 4 modèles
  (Prénom & flocons · Mon premier Noël + année · Famille jusqu'à 4 prénoms · Joyeux Noël & sapin),
  8 écritures, aperçu qui se met à jour. **Prix proposés : 11,90 € l'unité · 29,90 € les 3 ·
  54,90 € les 6** (marché : à partir de 11,90 €, Ø 7-7,5 cm). Lettre suivie (~20 g), offerte dès 45 €
  comme les bijoux. **Questions ouvertes** : découpe maison (bois 3 mm) ou boule achetée ? diamètre ?
  ruban ? et **une vraie photo gravée** (les visuels de la maquette sont dessinés). Construire = comme
  un bijou (packaging, productInfo, productDates, `letter:true`, `weight: 72`).
- ⛔ **« Il faut pas que tu modifies la page actuelle, tu dois juste ajouter » (gérant, 25/09 soir)** :
  la maquette à montrer est **`docs/maquettes/noel-sur-accueil-actuel.html`** (artifact
  https://claude.ai/artifact/QTkgDBFVsvAmKo2aEFgKNP) = le VRAI rendu de l'accueil (HTML servi par
  `next start`, vraies feuilles de style, scripts retirés, photos réduites en data URI, polices
  Google, logo en texte car le CDN Shopify est injoignable d'ici) avec les blocs Noël **simplement
  insérés**, encadrés en pointillé « NOUVEAU — bloc ajouté ». Rien d'autre ne change.
  **v3 (25/09 soir, « mets-le juste après le logo, pas vert mais une couleur de Noël, tu mets pas en
  ligne »)** : le bandeau est **juste sous le logo + menu, avant l'entrée cristal** (dans le code :
  `layout.jsx` après l'en-tête), la « Sélection de Noël » reste avant « Vient d'arriver »
  (`page.jsx`). Couleur **rouge de Noël & or** (`#c0392b→#7a1512`) par défaut, bascule
  **bordeaux & or** dans la maquette. ⛔ Vert refusé. Rien en ligne, attendre « applique ».
  **v4 (« pas que des verres, aussi les bijoux qui vendent le plus »)** : mosaïque 3×3 = cristal V ·
  whisky · carafe · verre à vin + 5 bijoux GRAVÉS (`collier-coeur-grave-1`, `collier-double-coeur-3`,
  `bracelet-cordon-plaque-4`, `bracelet-femme-acier-grave`, `collier-coeur-plaques-1`). Pas de
  chiffres de vente accessibles d'ici (Firestore) : choix = bijoux les plus cités dans les commandes
  connues ; à confirmer par le gérant. ⚠️ Correctif de la liste vidéo : `bracelet-homme-plaque-1 à 5`
  sont VIERGES (planche regardée le 25/09), ne pas les compter comme gravées.
  Recette : capturer `curl localhost:3140/`, inliner `.next/static/css/*.css`, remplacer les
  `src` par des data URI (Pillow 640 px q72), insérer après `</header>`. La maquette
  `noel-accueil-et-page.html` (v2) garde la vue « page Noël ».
- **Bloc Noël sur l'accueil + page Noël — MAQUETTE v2 du 25/09** (`docs/maquettes/noel-accueil-et-page.html`,
  artifact https://claude.ai/artifact/RonyZq6a22CTEnGgyW5UGT, deux vues Accueil / Page). Corrections
  demandées par le gérant sur la v1 : ⛔ **PAS la boule de Noël** (« je t'ai dit d'enregistrer mais
  je t'ai pas dit de mettre ») · titre « offrez un cadeau qui porte leur prénom » refusé (« envoie
  pas trop ») → **« Ce Noël, offrez un cadeau unique »** (mot mis en avant par les boutiques de
  personnalisation ; 2 variantes proposées dans les notes) · couleur rouge sombre refusée →
  **vert sapin & or** par défaut (`#1d4a34→#0c2820`), bouton de bascule vers une version
  **crème & or** dans la maquette. Page : h1 « Des cadeaux de Noël uniques, gravés dans notre atelier ».
  **EMPLACEMENT EXACT (demandé par le gérant)** : `src/app/page.jsx`, juste après le `</section>` de
  la carafe « Édition limitée » et juste avant `{show.newArrivals && <BandeauAccueil eyebrow="Vient
  d'arriver" …>}` — 1 entrée cristal (inchangé) · 2 carafe (inchangé) · **3 bandeau Noël (nouveau)** ·
  **4 « Sélection de Noël » = un `<BandeauAccueil … cinq />` (nouveau, 5 produits)** · 5 Vient
  d'arriver · 6 Verres & carafes · 7 collections… Interrupteur `settings.sections.noel` (Apparence).
  La page = 7ᵉ occasion `noel` dans `src/lib/occasions.js` (`/offrir/noel`, catalogue en direct).
  17 produits retenus (tous « en vente » dans le code — vérifier les masquages Gestion) : cristal V/H,
  verre whisky, carafe, verre à vin, flûte, collier plaque acier, collier cœur gravé, bracelet homme
  tressé, collier puzzle, porte-clés cuir, clé USB coffret, veilleuse prénom, couverts enfants,
  plaque de porte enfant, photophore fée, porte-clés cristal LED cœur, pièce laiton.
  Filtres : Cristal photo · Verres & carafe · Bijoux · Enfants · Petits cadeaux & maison.
  **Argument à ajouter dès qu'il la donne : la DATE LIMITE de commande pour Noël.** En attente de
  son retour (couleur sapin ou crème, titre) puis « applique ».
- **Gobelet isotherme 40 oz** (question « il y en a combien ? ») : dans le code **39,90 €**, 4 couleurs
  (crème, blanc, bleu marine, rose), 4 dessins compris puis +2,90 €/dessin, **`hidden: true`**, pas de
  stock saisi (le gérant n'a pas dit combien il en a). ⚠️ La version en ligne n'est PAS la maquette
  finale validée en juillet (dessins renumérotés 1-74, cadres 75-103, « Écrire un nom », image
  principale obligatoire). Deux options proposées : le montrer tel quel (5 min) ou finir la version
  validée (quelques heures). **Pas de réponse encore.**
- ⛔ Rien de tout ça n'est en ligne : maquettes uniquement, attendre « applique ».

## 🍷 VERRE À VIN — DEUX TAILLES, 36 cl ET 47 cl (construit le 25/09/2026, en attente du « applique »)
> Demande du gérant : « dans le verre de vin, tu peux mettre ça comme option, le client choisit
> entre les 2 cl » (grand verre 47 cl acheté chez Metro, coupe ronde). Puis, les photos côte à
> côte montrant deux formes différentes : « Ah c'est pas le même verre, tu peux construire alors ? »
> → version B : **l'aperçu de gravure suit la taille choisie.**
- ⛔ **CE QUE LE GÉRANT A REFUSÉ (1re version, 25/09)** : 6 tuiles « 36 cl · Lot de 2 » à droite
  et une galerie qui mélangeait les 9 photos. « Fais pas comme t'as fait, tu laisses comme
  actuel pour le sélecteur des quantités, il faut que ce soit pareil que les autres verres. »
- **La bonne mise en page** : la TAILLE se choisit **sous la photo** (pastilles, même habillage
  que les couleurs du gobelet, `.color-swatches`) et **remplace toute la galerie** par les photos
  de cette taille — **36 cl par défaut** (6 photos), 47 cl → ses 3 photos, jamais mélangées. Le
  sélecteur de droite reste **À l'unité / Lot de 2 / Lot de 4**, identique aux autres verres,
  filtré sur la taille choisie. Changer de taille garde le format déjà choisi (Lot de 2 → Lot de 2).
- **Données** : `product.tailles = { label, options: [{ id, title, sub, image, gallery,
  engraveImage?, engrave? }] }` + `taille: "36" | "47"` sur chaque variante. Identifiants
  **gardés** pour le 36 cl (`verre-vin-1/2/4`), nouveaux `verre-vin-47-1/2/4`. Les titres portent
  « Lot de N » : c'est là que la fiche lit le nombre de verres (`glassQty`). Dans `ProductDetail` :
  état `tailleId`, `selectTaille()`, `variantsVisibles` (index GLOBAL gardé pour `selectVariant`).
  Réutilisable pour tout produit à deux dimensions (taille × format).
- **Prix 47 cl : 19,90 / 36,90 / 71,90 €** — même marge en € que le 36 cl, coût **6,54 €/verre
  port compris** (carton de 6 à 29,23 € + 10 € de port, chiffres du gérant, `productCosts.js`).
  Poids 550 / 1000 / 1800 g. Détail dans `docs/prix-historique.md`.
- **Aperçu par variante** : une variante peut porter `engraveImage` + `engrave` (photo vierge +
  zone). `ProductDetail.jsx` passe par `engraveImage` / `engraveCfg` (résolus depuis la variante,
  repli produit) — **ne plus jamais lire `product.engraveImage` / `product.engrave` directement**
  dans ce composant. Changer de taille avec un texte déjà saisi bascule l'aperçu (effet sur
  `engraveImage`). `FicheAtelier` (visuel de l'atelier) suit aussi la variante commandée.
  Zone du 47 cl : constante `VIN_47_APERCU` avant le tableau `products` (box, **maxWidthFrac 0,30**
  — à 0,45 le texte couvrait toute la coupe, « c'est trop grand » ; widthMm 56 pour garder la
  même lecture en cm — voir le commentaire : le calcul des cm suppose une photo carrée).
- **Photos** (fournies par le gérant, 482–800 px) : `verre_vin_47_vierge.jpg` (aperçu + pastille),
  `_rose.jpg`, `_ambiance.jpg` — dans `tailles.options[1].gallery`, PAS dans `images` (la galerie
  par défaut reste le 36 cl seul). La vierge DOIT être dans la galerie de sa taille : l'aperçu la
  retrouve par `indexOf`. Pastilles : `object-position: top center` sur `.cs-btn img` (et
  `.variant-swatch img`) pour montrer la coupe et non le pied — sans effet sur les photos carrées.
  ⚠️ Si Gestion a téléversé des photos pour ce produit (`images[slug]`), elles remplacent la
  galerie au chargement ; un clic sur une taille remet la galerie du code.
- **Descriptions** (les deux tailles) : « verrerie professionnelle, qualité restauration » —
  ⛔ **aucune marque** (ni Metro ni le fabricant : « les clients peuvent chercher sur Internet »),
  et **pas « cristal » pour le 47 cl** (matière non vérifiée sur l'emballage).
- 🔴 **CORRIGÉ AU PASSAGE dans `catalog.js`** : un réglage d'options enregistré dans Gestion
  (`ov.variants`) **remplaçait** les variantes du code par `{id, title, price, stockId}` seulement
  → photo, **poids** (port d'un lot de 4 retombé sur 500 g), galerie, aperçu par taille : tout
  perdu. Maintenant fusion par identifiant : l'admin garde la liste, les titres et les prix ; le
  code fournit le reste. ⚠️ Si Gestion a déjà un réglage d'options pour ce verre avec seulement
  les 3 anciens choix, **les 47 cl n'apparaîtront pas en ligne** tant qu'il n'est pas complété
  ou remis à zéro (Gestion → Produits → Verre à vin → options).
- **Stock** : les 3 nouveaux choix n'ont pas d'entrée de stock → **non suivis = illimités**
  (`productSoldOut`). Le gérant veut **100** : à saisir dans Gestion → Produits & stock.
- **Vérifié au navigateur** (serveur local, `scratchpad/verre47.mjs`, captures données au gérant
  comme maquette) : défaut = 36 cl, 6 photos, 3 options 15,90/29,90/57,90 · clic 47 cl → 3 photos,
  options 19,90/36,90/71,90, texte → aperçu sur le 47 (« ≈ 1,1 cm » ; 36 cl : 1,5 cm) · Lot de 2
  conservé en changeant de taille · retour 36 → tulipe · téléphone 390 px sans débordement ·
  0 erreur JS · `test-orderspec` et `test-impression` au vert. ⚠️ Pièges de ce test : fermer le pop-up « Bienvenue » (il arrive
  avec un délai et couvre les options) ; **tuer le serveur `next start` avant chaque rebuild**
  (un serveur qui survit à un rebuild sert un mélange de deux compilations → clics sans effet) ;
  `pkill -f "next-serve[r]"` avec les crochets, sinon pkill tue le shell qui le lance (exit 144).
- ✅ **EN LIGNE le 25/09/2026** (« Applique »), commit `ecc373c`. Reste au gérant : stock 100 sur les 3 choix 47 cl dans Gestion → Produits & stock, et vérifier que les deux tailles s'affichent bien en ligne.

## 🔴 DEUX LIGNES DU MÊME PRODUIT — GRAVURES MÉLANGÉES (corrigé le 24/09/2026)
> Remarque du gérant sur la commande **#00CUYR2U** (Cécilia Herrera, 2 lots de flûtes gravés
> différemment) : « je comprends pas là, c'est mal écrit ». Le tableau « À graver » de la 2ᵉ ligne
> **recopiait celui de la 1ʳᵉ** → risque réel de graver deux fois la même chose.
- **Cause** : `o.spec.find((x) => x.slug === it.slug)` dans `/gestion/page.jsx`. Deux lignes du
  MÊME produit → `find` renvoie toujours le PREMIER réglage. (Le visuel et le « Résumé » de la
  fiche atelier étaient justes, eux : ils parcourent `o.spec` directement.)
- **Corrigé** : `apparierSpec(items, spec)` dans **`src/lib/orderSpec.js`** apparie DANS L'ORDRE en
  consommant chaque réglage une seule fois (identifiant produit d'abord ; jamais les réglages d'un
  AUTRE produit — mieux vaut « aucun réglage » qu'une gravure fausse). 9 vérifications :
  `npm run test-orderspec`.
- ⚠️ **Pourquoi l'ordre suffit** : `/api/checkout` enregistre `items.map(...).filter(Boolean)` et
  Stripe rend les lignes dans le même ordre. Le `filter(Boolean)` retire les articles **non gravés**,
  d'où le décalage des rangs → apparier par rang seul serait faux aussi.
- ⛔ **À REFAIRE PARTOUT** : tout nouvel écran qui relie une ligne de commande à ses réglages doit
  passer par `apparierSpec`, **jamais** par un `find` sur le slug. (`/gestion/atelier` et la fiche
  papier parcourent `order.spec` directement : ils sont corrects.)

## ❓ LA FICHE LAISSE CHOISIR DEUX FAÇONS DE GRAVER À LA FOIS — À TRANCHER AVEC LE GÉRANT
> Trouvé en analysant #00CUYR2U : le 2ᵉ lot porte **à la fois** `numstyle: "15"` (onglet
> « Modèles (n°) ») **et** `gravureExemple: "plume"` (onglet « Gravures (photos) »).
- **Ce n'est pas un bug d'affichage : la cliente a bien enregistré les deux.** Les onglets de
  personnalisation (`product.personaTabs`, `setPersonaTab` dans `ProductDetail.jsx`) changent
  seulement ce qui est AFFICHÉ — **ils ne vident pas les champs de l'onglet quitté**. C'est le même
  piège que `showIfField` (règle « aucun champ payant masquable », 14/09).
- Concerne les 4 onglets de la flûte / du verre à vin / de la carafe : Modèles (n°) · Gravures
  (photos) · Lettre fleurie · Texte seul — ce sont des choix **alternatifs**, pas cumulables.
- **Correction proposée, PAS appliquée** (elle touche le site visible → attendre « applique ») :
  au changement d'onglet, vider les champs des autres onglets, ou afficher « vous avez choisi
  deux styles, gardez-en un ». À lui de trancher.

## ⛔ AUCUNE CASE LIBRE DE GRAVURE À LA PAGE DE PAIEMENT (24/09/2026, rappel du gérant)
> « Je t'ai déjà dit d'enlever cette case. » Demandé le 25/08 (« Message ou date à graver »),
> la case était revenue sous le libellé **« Précisions de personnalisation (gravure) »**
> (`custom_fields` de `/api/checkout`). Rose Catarino #1Z17IKQ8 y a tapé « Belle rencontre » :
> un texte hors fiche, non payé, affiché dans Gestion comme « Texte demandé (à graver) ».
- **Retirée le 24/09.** Tout texte à graver se saisit sur la FICHE (champs payants). Ne jamais
  remettre de case libre de gravure au paiement, **sous aucun libellé**. Seul reste le choix
  « Lancement de la fabrication » (omis en mode vacances → `custom_fields: undefined`).
- **« Tu supprimes partout » (même jour)** : plus rien n'est lu ni affiché nulle part — le webhook
  n'enregistre plus `demandeGravure`/`messageGraver` et ignore ces clés dans les e-mails (alerte +
  confirmation), et l'encadré « ✍️ Texte demandé par la cliente (à graver) » est retiré de la fiche
  commande (`/gestion`), de la file de production (`/gestion/commandes`) et de la fiche papier
  (`FichePapier`). Les anciennes valeurs restent en base mais ne s'affichent plus.

## 📬 HISTORIQUE COMPLET DES E-MAILS DANS CHAQUE COMMANDE — 24/09/2026
> Remarque du gérant : « j'ai des mails, ils sont pas complets dans mon dossier dans la commande…
> relis tous les mails que j'ai reçus par rapport aux commandes ». Le fil « Communications » d'une
> commande ne recevait que les réponses APRÈS notre dernier message (10 derniers mails) et ce que la
> boîte surveillée voyait passer (25 derniers, < 10 jours, boîte de réception seulement) → tout ce
> qui précédait la commande, était ancien ou archivé n'apparaissait jamais.
- **`syncHistoriqueCommande(order)`** (`src/lib/historiqueMails.js`) : Gmail
  `(from:X OR to:X) newer_than:365d` (archivés compris, 80 max, `gmailSearchIds` paginé) + le dossier
  du site (`getCommsFor`) → rangés dans le fil par **`batImportHistorique`** (`stock.js`) : clé =
  id Gmail ou `c:<id dossier>`, doublons évités (même sens ±10 min), **sans toucher au statut ni à
  la pastille « non lu »**, messages marqués `historique:true`. Le dossier de la cliente se complète
  au passage (`logComm`). Etsy exclu. Envois automatiques exclus (bienvenue, connexion, newsletter,
  offre gravure, favoris). Texte cité retiré (`separerCitation`), 3000 caractères max : **toute la
  section `bat` tient dans UN document Firestore (1 Mo max)** — ne jamais y ranger de corps entiers.
- **Déclenché à l'ouverture** des communications d'une commande (`GET /api/admin/bat?orderId=`, au
  plus toutes les 10 min) ; **`&historique=1`** force et renvoie `{ajoutes, lus, total}` (rattrapage).
- Rattrapage de toutes les commandes fait le 24/09 (boucle shell sur `/api/admin/orders`).

## 🗂️ FILE DE PRODUCTION — `/gestion/commandes` (02/09/2026)
> Demande du gérant : « un truc propre, dans l'ordre, pour pas que je mélange les commandes en
> arrivant ». Page dédiée, compacte, **ordre de traitement numéroté** (FIFO par date, urgentes
> d'abord), 3 colonnes sur ordinateur (À préparer · En fabrication · Expédiées récentes), empilées
> sur mobile. L'ancien onglet Commandes reste la fiche complète (lien « Fiche complète → »
> avec `?q=<ref>` qui pré-remplit la recherche).
- **Une carte = une commande** : n° d'ordre, réf, ancienneté, cliente, articles (nom ×qté + détail
  gravure / demande sur mesure), montant, étiquettes (⚡ immédiate, 🎁 cadeau, 📬 nouvelle réponse,
  🚨 alerte, 🏪 relais…), **note interne** éditable, actions rapides (Commencer la fabrication ·
  Expédier avec n° de suivi · Livrée).
- **API** : `POST /api/admin/orders` `{ id, action:"annotate", adminNote?, flags?, alerteInterne? }`
  (flags autorisés : attend, cadeau, gravure_offerte, urgent, appel, attente_client). Statuts via
  l'action existante `{ id, status, tracking, notifyCustomer }`. Réponses non lues : `GET
  /api/admin/bat?action=unread`.
- Commandes test exclues ; annulées/remboursées masquées par défaut (dépliable).
- Sophie Berardo (0C1CGL2Q) annotée : **accepte d'attendre (02/09) + 🎁 cadeau promis**.

## 📥 BOÎTE MAIL SURVEILLÉE + ACHATS FOURNISSEURS + EXPORT CLIENTS (02/09/2026)
> Demandes du gérant : « il doit me proposer automatiquement dès qu'il y a un mail, analyser tout le
> temps les mails et toutes les conversations, tracé dans leur commande » · « importer des devis ou
> des factures pour que les agents analysent et mettent dans les stocks, je corrige et je valide » ·
> « exporter les clients en PDF ou toutes sortes de fichiers, il faut que j'aie le choix ».
- **Boîte mail surveillée** `src/lib/inbox.js` (`syncInbox`) : lit les 25 derniers e-mails Gmail,
  garde les vraies clientes (`looksLikeRealCustomer` renforcé : jamais `@nivcreation.fr`, resend.dev,
  Etsy/Amazon/Nihao/Metro/factures/plateformes), **range chaque e-mail dans le fil de sa commande**
  (retrouvée par l'adresse ; `ensureCommThread` crée le fil s'il n'existe pas) puis **prépare une
  réponse** (`triageIncomingEmail` avec `context` = commande + échanges + réponses déjà envoyées)
  → `addPendingReply` (champs `orderId/orderRef/gmailId/gmailThreadId/messageId/references/source`)
  → **UNE alerte** (`src/lib/replyAlert.js`, partagée avec `/api/contact`). Réponse préparée
  **seulement pour le DERNIER message d'une expéditrice, pas encore répondu** (un message atelier plus
  récent dans le fil = déjà traité). Premier passage : pas de brouillon pour les mails > 24 h.
  Mémoire `inboxSeen` (600 ids), limite 1 passage / 3 min, mails > 10 jours ignorés.
- **Déclencheurs** : `AdminShell` (POST `/api/admin/inbox-sync` à chaque chargement des compteurs) ·
  `GET /api/cron/inbox?token=` (CRON_SECRET **ou** `settings.inboxToken`, jeton sans accès aux données,
  visible via GET `/api/admin/inbox-sync`) · **Routine Claude horaire** `trig_01YR967ZA5brMSLhsAvqfQ6a`
  (session neuve qui fait juste le curl ; à supprimer si le gérant ne la veut plus) · bouton « Vérifier
  maintenant » dans Gestion → Équipe d'agents (bloc « Boîte mail surveillée »).
- **Envoi validé** (`/api/reply/[token]`) : part **dans le même fil Gmail** (`gmailSendHtml` accepte
  `threadId/inReplyTo/references` via `sendClientMail({thread})`) et est **tracé dans la commande**
  (`batAtelierMessage(..., { keepStatus:true })`). La page `/repondre` affiche « Cliente de la commande #… ».
- ⚠️ Premier passage réel (02/09 12:29) : 8 brouillons inutiles + 8 alertes envoyées au gérant avant le
  renforcement du filtre — tous classés « sans réponse » à la main. Ne se reproduit plus.
- **DOSSIER DE COMMUNICATION PAR CLIENTE (02/09, demande : « chaque fois qu'un client me répond, il
  doit être placé dans leur dossier dédié, je ne cherche plus dans le mail »)** : section `comms`
  (clé = e-mail) via `logComm/getCommsFor/getCommsMeta` dans `stock.js`. TOUT y est rangé, avec ou
  sans commande : e-mails reçus (inbox sync), e-mails **envoyés à la main depuis Gmail**
  (`gmailListSentIds` + `toEmail`, importés aussi dans le fil de la commande via
  `batImportOutgoing`), réponses validées (`/api/reply`), messages depuis la commande (`/api/admin/bat`),
  « Écrire à ce client » (`send-client-email`), formulaire de contact. API `GET /api/admin/comms?email=`
  fusionne le journal + les fils de toutes ses commandes ; sans e-mail → `meta` (compteur par cliente).
  **CRM** : pastille « 💬 N » sur chaque cliente + section « 💬 Communications » dans son dossier
  (chargée à l'ouverture, CSS `.cm-*`). Sur la commande, le bouton s'appelle « Communications & aperçu ».
- **⛔ ETSY RESTE DANS ETSY (demande du gérant, 02/09)** : la boîte mail surveillée et les dossiers de
  communication ne prennent QUE les e-mails liés au site. Tout ce qui touche Etsy est ignoré
  (expéditeur/destinataire `etsy.` — y compris `convos.etsy.com` —, ou « Etsy » dans le sujet), en
  réception comme dans les envoyés. Ne jamais l'élargir sans sa demande.
- **Achats & factures** `/gestion/achats` (`src/app/gestion/achats/page.jsx`, API
  `/api/admin/purchases`) : PDF / photo / CSV / texte → Claude (document/image + outil
  `proposition_achat`, catalogue des `stockId` fourni) → tableau corrigeable (produit, qté, prix) →
  « Valider » = `adjustStockMany` (1 écriture, s'ajoute au stock), coût d'achat produit mis à jour
  (port réparti au prorata, `setProductOverride({cost})`), dépense ajoutée dans Bénéfices
  (`settings.expenses`, catégorie `achat`), historique section `purchases` (200). Rien n'est écrit
  avant « Valider ». Entrée NAV Catalogue → « Achats & factures ». Toast : `analyze` exclu.
  **Export de l'historique** (Excel/CSV/PDF/JSON, une ligne par article) via `exportRows`.
- **Export clients** : `src/lib/exportClients.js` (CSV `;` + BOM, **XLSX sans bibliothèque** (zip
  stocké + inlineStr), PDF via `jspdf` (tableau paginé, en-tête Niv Création), JSON) — barre
  « Sauvegarder / exporter » en haut de l'onglet Clients du CRM, exporte la liste **filtrée**.
  Réutilisable pour d'autres listes (`exportRows(format, rows, columns, opts)`).

## 🧱 GESTION MODERNE — 5 CHANTIERS LIVRÉS (02/09/2026, « fais les 5 un par un sans bug »)
> Suite du squelette admin (`AdminShell`). Tout est ADMIN uniquement (rien côté clientes).
1. **En-tête commun** `src/components/admin/PageHead.jsx` (`eyebrow`, `title`, `subtitle`, `actions`,
   `kpis:[{label,value,sub,tone:good|warn|bad|alert}]`, CSS `.ph-*`) sur les 18 sous-pages `/gestion/*`.
   Un nouvel écran admin DOIT commencer par `<PageHead …/>` (un seul H1 par page).
2. **Produits & stock** (`ProductsAdmin.jsx`, CSS `.pt-*`) : chiffres clés (ruptures / stock bas), recherche +
   filtre d'état + puces catégories, **tableau** (vignette · nom+étiquettes · catégorie · prix · **stock
   modifiable en ligne** · ›) ; clic sur une ligne → **panneau latéral** (`.pt-drawer`, Échap/fond pour
   fermer) avec le stock + la fiche complète (`EditProduct`) ; « + Ajouter » ouvre `AddProduct` dans le même
   panneau. Accessoires en option (socles LED) = lignes grisées à la fin de leur catégorie.
3. **Apparence** (`AppearanceAdmin.jsx`, CSS `.ap-*`) : colonne gauche = 6 thèmes avec **résumé d'état**
   (`subSummary`) + point orange si modifié ; **barre collée en bas « Enregistrer tout »** (compare `s` à
   `saved`, `SUB_KEYS`/`SETTING_KEYS`, POST des seules clés modifiées) + « Annuler ». Les boutons
   « Enregistrer » par section restent (chaque save met à jour `saved`).
4. **Retour « Enregistré ✓ » partout** : `src/components/admin/AdminToast.jsx` (monté dans `AdminShell`,
   CSS `.ash-toast`). Observe `window.fetch` : POST/DELETE réussi vers une route de `SAVE_ROUTES`
   (settings, catalog, stock, images, taxonomy, promo, orders, cagnottes, scheduled, benefices, refund…)
   → toast vert ; échec → toast rouge « rien n'a été enregistré ». Les ENVOIS (e-mail, newsletter, BAT,
   hub, agents) sont volontairement exclus (`SKIP_ACTIONS` : checkPayment, send, list, preview).
   Usage manuel : `import { toast } from "@/components/admin/AdminToast"; toast("…", "ok|err|info")`.
5. **Onglet Commandes** (`/gestion/page.jsx`, CSS `.co-*`) : une **ligne compacte par commande**
   (réf+date · cliente+résumé articles · chip statut · total · ▸) ; la fiche complète (inchangée) ne
   s'affiche qu'au clic (`openOrders`) ou quand la recherche `?q=` vise ≤ 2 commandes (`orderOpen`).
- **Plein écran admin** : `body:has(.ash) > *:not(main)…{display:none}` → bandeaux, en-tête boutique,
  pied de page et tiroir panier disparaissent dans Gestion (la vitrine prenait la moitié de l'écran mobile).
- Aussi : file de production → carte rouge « urgente » seulement si la commande est encore active ;
  `/gestion/cristal-reglage` réutilise la clé de session (plus de re-saisie du mot de passe).
- **Vérification live** : Chromium ne passe plus par le proxy pour nivcreation.fr (`ERR_CONNECTION_RESET`)
  → script `scratchpad/shot-ph.mjs` qui sert chaque requête du navigateur via **curl** (`page.route`),
  clé admin injectée en `sessionStorage` (`niv-admin-key`). Mesure : `.ph-title`, `.ash-side`, débordement,
  nb de H1, erreurs JS, à 1440 et 500 px.

## 🧭 ASSISTANT « TOUT EN UN » — UN SEUL FIL DANS GESTION (02/09/2026)
> Demande du gérant : « améliore les interfaces admin, plus simple pour communiquer avec les
> agents ». **Gestion → 🧭 Assistant (tout en un)** = un seul fil de conversation, mémorisé.
- **Aiguilleur** `src/lib/agents/hub.js` (`runHub`) : lit la demande en français et route vers
  `catalogue` (assistant catalogue → propositions à confirmer), `email` (brouillon à relire/envoyer),
  `avis` / `newsletter` / `marketing` / `rapport` / `technicien` (agents du registry), ou répond
  directement. Il connaît les réponses clientes en attente (`listPendingReplies`).
- **API** `/api/admin/hub` : GET historique · POST `{text}` (ajoute, fait travailler, mémorise) ·
  POST `{markAt, done}` (marque « appliqué ✓ / envoyé ✓ ») · DELETE (efface). Historique dans la
  section `hubHistory` du blob (80 messages, `getHubHistory`/`appendHubHistory`/`markHubMessage`/
  `clearHubHistory` dans `stock.js`).
- **Assistant catalogue** extrait dans `src/lib/agents/catalogAssistant.js` (`runCatalogAssistant`) ;
  l'ancienne route `/api/admin/assistant` n'est plus qu'un passe-plat. Application des changements
  partagée : `src/components/admin/applyCatalogActions.js` (utilisée par `HubChat` ET `AssistantAdmin`).
- **UI** `src/components/admin/HubChat.jsx` (styles `.hub-*` en fin de `globals.css`) : cartes
  « réponses à valider » en tête, raccourcis, propositions catalogue (Confirmer/Annuler), brouillons
  d'e-mail (relire/modifier/envoyer via `/api/admin/send-client-email`), saisie multiligne
  (Entrée = envoyer, Maj+Entrée = ligne), composer collé en bas sur mobile.
- Tableau de bord : ligne « 📬 N réponses clientes à valider » dans « À faire » → ouvre l'onglet.
- `/gestion/agents` reste (réglages + espace par agent) avec un bandeau vers le fil unifié.
- **Toujours vrai** : rien n'est appliqué ni envoyé sans le clic du gérant.

## 💬 ASSISTANT CLIENT « IL PRÉPARE, LE GÉRANT DÉCIDE » — EN LIGNE (02/09/2026)
> Demande du gérant : « il prépare le mail mais il demande mon avis avant de faire quoi que ce soit ».
> **L'agent ne répond JAMAIS seul.** Pour chaque message reçu (page Contact ou bouton flottant
> « Une question ? »), il rédige une réponse → rangée « à valider » → le gérant reçoit UNE alerte
> (message + réponse proposée + bouton « Relire, modifier et envoyer ») → il valide sur la page
> `/repondre/<jeton>` → l'e-mail part à l'image de la marque (Gmail puis Resend, copie au gérant).
- **Interrupteurs** (Gestion → Équipe d'agents) : `agents.emailDraft` (ON par défaut, prime sur
  `emailAutoReply`) et `agents.widget` (bouton « Une question ? », ON). Sanitizer = FUSION : un
  interrupteur n'efface plus les autres.
- **Fichiers** : `stock.js` (`addPendingReply`/`getPendingReplyByToken`/`listPendingReplies`/
  `resolvePendingReply`/`reopenPendingReply`, section `pendingReplies`, jeton 40 car., 30 jours) ·
  `/api/contact` (branche brouillon, repli notification classique si l'alerte échoue) ·
  `/api/reply/[token]` (GET/POST, **réservation AVANT envoi** → un double clic n'envoie pas 2×,
  409 si déjà traité, réouverture si l'envoi échoue) · `/repondre/[token]` (noindex) ·
  `/api/admin/pending-replies` · `QuestionWidget.jsx` (masqué sur /gestion, /panier, /paiement,
  /merci, /repondre, /suivi, /espace).
- **L'agent connaît le vrai état du site** : `serviceContext()` dans `registry.js` injecte le délai
  RÉELLEMENT affiché (mode délai allongé compris), la livraison (seuil admin) et la FAQ officielle
  (`src/lib/faq.js`, source unique partagée avec la page /faq → jamais de contradiction).
- **Règles absolues codées dans sa consigne** : jamais de mention machine/panne/graveuse/laser/
  fabricant/remplacement (motif = forte demande) · pas de date promise · pas de remboursement
  d'un article personnalisé · pas de geste commercial de sa propre initiative · vouvoiement.
- Le gérant peut aussi répondre à la main : l'alerte a `reply-to` = la cliente.

## 📊 SUIVI DES E-MAILS DE CAMPAGNE — OUVERTURES + CLICS (construit le 02/09/2026)
> Demande du gérant : « mets en place pour voir qui ouvre le mail ». Fonctionne, testé de bout en bout.
- **Comment** : chaque destinataire reçoit SA version de l'e-mail — un pixel `/api/o/<jeton>` et les
  liens réécrits en `/api/c/<jeton>?u=<url>`. Jeton = base64url(`campagne|email`), aucun secret.
- **Fichiers** : `src/lib/emailTrack.js` (`makeTrackToken`/`readTrackToken`/`safeRedirect`/`addTracking`) ·
  `src/app/api/o/[token]` (GIF 1×1, no-cache, renvoie TOUJOURS l'image même en cas d'erreur) ·
  `src/app/api/c/[token]` (enregistre puis redirige ; la redirection prime toujours) ·
  `stock.js` (`startEmailCampaign`/`recordEmailOpen`/`recordEmailClick`/`getEmailStats`, section
  `emailStats`, 40 campagnes gardées) · `GET /api/admin/email-stats` · écran de résultats dans
  `NewsletterAdmin.jsx` + bouton « relancer celles qui n'ont pas ouvert ».
- **Sécurité** : `/api/c` ne redirige QUE vers `*.nivcreation.fr` (sinon redirection ouverte
  exploitable en hameçonnage). Vérifié en ligne : une cible externe est renvoyée sur l'accueil.
- **⚠️ FIABILITÉ** : les **clics sont fiables**, les **ouvertures non** — Mail sur iPhone précharge
  les images (faux positifs) et les images bloquées ne comptent pas (faux négatifs). Toujours le dire
  au gérant plutôt que de lui vendre un chiffre exact.
- **RGPD** : section 6 « Mesure d'audience de nos e-mails » ajoutée dans `/confidentialite`.
- Les stats ne bloquent JAMAIS un envoi (try/catch autour de l'ouverture de campagne).

## ⛔ NE JAMAIS PARLER DE LA MACHINE AUX CLIENTES (02/09/2026, demande ferme)
> La graveuse a un problème et une nouvelle machine arrive. **Le gérant ne veut PAS que les clientes
> le sachent.** Interdit dans tout message client : « machine », « panne », « graveuse », « laser »,
> « fabricant », « remplacement », « problème technique ».
- Le motif annoncé est TOUJOURS celui du site : **forte demande, délai de confection allongé**.
- Modèle validé (message à Sophie Berardo, commande 0C1CGL2Q) : annonce du délai → **remboursement
  intégral immédiat sans condition** proposé EN PREMIER → **ou attendre avec un cadeau dans le colis**
  → elle reste libre de changer d'avis à tout moment. Envoyé par le fil **Aperçu/BAT** (`/api/admin/bat`),
  pas par Gmail : sa réponse revient dans la commande.

## 🥃 VERRES REMIS EN VENTE (01/09/2026)
> Les 5 produits verre/carafe (whisky portrait, fête des pères, vin, flûte, carafe) sont REMIS EN
> VENTE (stocks restaurés aux niveaux d'origine, plus aucune rupture). Le spray de marquage laser a
> résolu le problème de gravure. Décision de la gérante — « je te parle pas des bijoux » : le
> **Bracelet Cœur Multicolore reste volontairement en rupture** (jamais acheté chez le fournisseur),
> ne pas y toucher sans demande explicite.

## 👤 LE PROPRIÉTAIRE DE LA BOUTIQUE EST UN HOMME (précisé par lui le 01/09/2026)
> Nirojh Kamalanathan est **un homme** — utiliser le masculin (« le gérant », « absent », « prêt »)
> dans tous les messages le concernant. Les mentions « la gérante » plus bas dans ce fichier sont
> un historique d'écriture : les consignes restent valables, mais la personne est un homme.
> (Ses clientes à ELLES restent souvent des femmes — le féminin des e-mails clients type
> « chère cliente » suit le contexte client, pas lui.)

# Guide agent — Boutique Niv Création

## 📩 ALERTES « RETOUR EN STOCK » — EN LIGNE (01/09/2026)
> Fiche épuisée → encadré « Prévenez-moi dès son retour » (`RestockAlerte.jsx` →
> POST `/api/restock-alert`, stockage section `restockAlerts` du blob, écritures fraîches/section).
> **AUCUN e-mail automatique (règle ferme gérante)** : les envois partent UNIQUEMENT quand elle
> clique « 📩 Prévenir » dans Gestion → Produits & Stock (`RestockAlertsAdmin.jsx` →
> POST `/api/admin/restock-alerts` action send/clear ; send = e-mail de marque « Il est de retour »
> puis liste vidée). Le compteur d'inscrits = indicateur de demande pour ses réachats.

## ⚠️ BUG CORRIGÉ — DOUBLE CONFIRMATION DE COMMANDE (01/09/2026)
> Constaté sur la commande de Sophie Berardo (réf. 0C1CGL2Q, devis DEV-0003) : elle a reçu l'e-mail
> de confirmation **2 fois** (à 1 seconde d'écart), et 2 commandes identiques existaient en base.
> Cause réelle : Stripe a livré 2× le même événement `checkout.session.completed` quasi
> simultanément ; l'ancien anti-doublon (« je cherche puis j'écris ») n'était PAS atomique — les deux
> requêtes voyaient « rien trouvé » avant qu'aucune n'ait écrit.
- **Corrigé** : `claimSiteOrder()` (`src/lib/firebase.js`) réserve la commande via un **id de document
  déterministe** (`s_<sessionId>`) + `Firestore .create()` — appelée en TOUT PREMIER dans le webhook
  (`src/app/api/webhooks/stripe/route.js`), AVANT tout envoi d'e-mail. Une seule requête peut réussir
  la réservation ; l'autre s'arrête aussitôt. `recordSiteOrder()` écrit ensuite les détails sur ce
  document déjà réservé (2e paramètre `claimedDocId`).
- Cashback vérifié : PAS doublé (creditCagnotte a son propre anti-doublon par orderId+reason).
- Doublon nettoyé en base (commande `EX8Eb8CF2l6q995vRyrw` supprimée, gardé `MlvykV6Aulj3nCoSzd0H`).

## ⏳ MODE « DÉLAI ALLONGÉ » (vacances 2→23 SEPT) — PRÊT, EN ATTENTE DU « LANCE » (30/08/2026)
> Tout est préparé et ÉTEINT. **Quand la gérante dit « lance » (ou « active ») : passer
> `settings.vacation.enabled` à `true`** (POST /api/admin/settings) — rien d'autre à faire, le mode
> s'allume tout seul le 02/09. **PAS de date de fin (choix gérante 01/09)** : il reste allumé
> jusqu'à ce qu'ELLE le désactive (Gestion → Apparence → Mode vacances, case « Activer », ou en
> me le demandant) — son retour est incertain (~23/09, avant ou après). Ne JAMAIS l'activer NI
> le désactiver sans son mot.
- **Déjà réglé dans `settings.vacation`** (enabled:false) : start 2026-09-02, end/resume VIDES,
  texte SANS parler de congés (« Fabriqué à la commande — forte demande — délai de confection actuel
  3 à 4 semaines minimum — commandes traitées dans leur ordre d'arrivée »), cadeau activé
  (« un cadeau surprise est glissé dans chaque commande »).
- **Code déployé (dormant tant que le mode est éteint)** : case au paiement « 🎁 Votre cadeau
  d'attente (offert) » (Surprise / Plutôt femme / Plutôt homme, clé `cadeau`) → stockée sur la
  commande (`cadeauChoix`) → encadré doré dans Gestion + e-mail d'alerte, avec rappel rouge
  **« 🎁🎁 Commande ≥ 80 € → DEUX cadeaux »** (règle gérante).
- Après activation, VÉRIFIER : bandeau + encart fiche/panier affichés, `/api/shipping-config`
  renvoie `vacation.message`, et la case cadeau apparaît au paiement.
- La gérante part en vacances le jeudi 03/09 environ ; elle revient le 23/09.

## 🎁 GESTE CLIENT EN COURS — NINA BELTRAN (29/08/2026, à surveiller)
> Commande verre whisky 1CSPQUR9 non gravée (machine) → **remboursée intégralement par la gérante
> (Stripe, 31,80 €)**. Gestes promis par e-mail : **gravure OFFERTE sur un bijou** si elle recommande
> (+ 5 € de cagnotte, à créditer AVANT l'envoi du message qui l'annonce — en attente du « envoie »).
- **⚠️ SI UNE COMMANDE DE Nina Beltran (beltran.030201@gmail.com) ARRIVE : RAPPELER À LA GÉRANTE
  que la gravure est offerte pour elle** (ne pas facturer le supplément gravure / le rembourser).
- Ne pas re-proposer de remboursement du verre (déjà fait). Commande 1CSPQUR9 à passer « Annulée »
  dans Gestion si la gérante le demande.

## 📦 À FAIRE PAR LA GÉRANTE — REP EMBALLAGES / IDU (enregistré 18/08/2026, IMPORTANT — la rappeler)
> **Démarche administrative en attente, à faire « plus tard » (demande de la gérante).** Quand elle
> demande « où j'en suis / qu'est-ce qu'il reste » ou reparle des emballages/Etsy/REP, **le lui rappeler**.
- **Quoi** : adhérer à un éco-organisme (**Léko** `leko-organisme.fr` ou **Citeo** `citeo.com`), obtenir
  l'**IDU (Identifiant Unique ADEME)**, payer l'éco-contribution (~95–110 €/an, forfait petit volume),
  puis **coller l'IDU dans Etsy** (Conformité / EPR). **Risque concret : sans IDU, Etsy peut bloquer le
  compte vendeur.** Sur nivcreation.fr rien ne bloque, mais l'obligation légale existe.
- **Récap complet pas-à-pas** : `docs/rep-emballages-idu.md` (SIRET 105 914 774 00010, forfait, étapes).
- **PPWR** (règlement UE emballages) = pas de démarche, juste faire des emballages recyclables / sans vide
  inutile — déjà le cas. Ne pas l'inquiéter avec ça.
- Ne PAS faire la démarche à sa place (administratif, son compte). Rôle = lui rendre le récap clair + rappeler.

## ⛔ RÈGLE ABSOLUE — AUCUN ENVOI À UN CLIENT SANS VALIDATION EXPLICITE (25/08/2026, incident)
> Incident : deux e-mails envoyés à un client (commande gourmette) depuis Gmail brut, dont un APRÈS
> que la gérante a interrompu l'envoi. Elle l'a très mal pris, à juste titre.
- **INTERDIT d'envoyer quoi que ce soit à un client** (e-mail, message, réponse) tant que la gérante
  n'a pas VU le texte final et écrit « envoie ». « Prépare un message » = préparer et MONTRER, jamais envoyer.
- Si elle interrompt ou dit « on envoie rien » : tout s'arrête, on ne réessaie PAS l'envoi qui a échoué.
- **Les e-mails clients partent par le SITE** (Resend, à l'image de la marque, logo or/crème) — pas par
  Gmail brut, sauf si elle demande explicitement Gmail.
- **AVANT TOUTE ACTION (envoi, réponse client, nouvel outil) : VÉRIFIER CE QUI EXISTE DÉJÀ SUR LE SITE.**
  Ex. le fil « Aperçu / BAT » (`/api/admin/bat` + page `/suivi/[token]` : e-mail de marque + boutons
  « Je valide / Demander une modification », réponse visible dans la commande) existait déjà et devait
  servir pour la question au client de la commande 1YPJVC5R — au lieu de ça, envoi Gmail à la main.
  Réutiliser l'existant, ne jamais réinventer (rappel du gabarit du 20/08, valable pour TOUT).
- Cette règle complète « RIEN SUR LE SITE SANS VALIDATION » : même principe pour toute action
  tournée vers l'extérieur (client, fournisseur, réseau social).

## 🚫 RÈGLE D'OR — NE JAMAIS TOUCHER AUX APPLIS / SITES EN LIGNE SANS DEMANDE EXPLICITE (enregistré 13/08/2026)
> **Demande ferme de la gérante, valable pour TOUTES les conversations et TOUS ses projets.**
- **INTERDIT** de modifier, déployer, republier, reconfigurer ou supprimer quoi que ce soit sur un **site, une application ou un projet EN LIGNE** de la gérante (boutique Niv Création `nivcreation.fr`, projets Firebase `niv-creation`/`crafia-app`/`niv-social`, Stripe, réglages, agents, etc.) **sans qu'elle le demande explicitement**.
- Cela vaut pour **tous ses projets**, pas seulement la boutique : ne toucher à AUCUN de ses services en ligne de sa propre initiative.
- **Préparer / proposer / montrer une maquette = OK.** **Appliquer / mettre en ligne / déployer = SEULEMENT sur sa demande explicite.** En cas de doute : **demander d'abord**, ne jamais déduire un accord.
- Un nouveau projet **isolé** (ex. app voyage sur un projet Firebase neuf) ne compte pas comme « toucher » à ses projets existants — mais le déploiement final reste **à sa main / sur sa demande**.

## 📦 FOURNISSEUR BOÎTES / EMBALLAGES PERSONNALISÉS — « Guardidea-Rachel » (enregistré 27/07/2026)
> Quand la gérante parle du **fournisseur de boîtes / emballages**, c'est **Guardidea-Rachel** (contact **WhatsApp**, anglophone). C'est aussi elle qui fait déjà les **boîtes à bijoux** de la gérante.
- **Personnalisation** : oui, à la marque Niv Création (même couleur + mêmes textes/logo que les boîtes bijoux déjà commandées).
- **Sur-mesure (nouvelle taille)** : possible MAIS **MOQ 300 pièces par taille** (nouvelle découpe « die cut »). Plus grande taille **standard** dispo (sans MOQ) = **25×17×8 cm** (jugée trop petite/basse par la gérante).
- **Boîtes voulues** (vides, **sans mousse** — la gérante cale elle-même au papier bulle) : **cristaux ≈ 25×20×15 cm** (une seule taille pour toutes les tailles de cristal) · **verres 2 pièces ≈ 28×20×12 cm** (verres ~21 cm de haut, flûte Ø6,3×21,4 cm). En attente : tailles standard proches + prix.
- La gérante communique avec elle **en français** (la fournisseuse traduit). Toujours proposer les messages en français, clairs et courts.

## 🛒 METTRE UN PRODUIT SUR ETSY — RECETTE ENREGISTRÉE (08/07/2026)
> Quand la gérante dit « mets ce produit sur Etsy », suivre **`docs/etsy/RECETTE-ETSY.md`** (recette complète + textes prêts dans `docs/etsy/`).
- **Méthode** : la gérante utilise **Claude pour Chrome** (extension navigateur). Nous, on ne touche PAS à Etsy — on **prépare un TEXTE** qu'elle colle dans Claude pour Chrome, qui remplit les fiches à sa place. Boutique : **NivCreationArtisanat**.
- **PRIX ETSY = prix du site × 1,45** (arrondi ,90 sup.) : couvre frais Etsy ~14 % + remise boutique 10 % + pubs ~13 %. Ex. blocs : Petit 57,90 · Moyen 86,90 · Grand 144,90 · XL 217,90 · socle 21,90/28,90.
- **Règles du texte** : français, pas d'emojis, personnalisé = fait à la commande, **brouillon** (ne rien publier), fiches une par une, INTERDICTION de toucher aux bijoux/autres produits. Photos = garder le site ouvert dans un onglet (Claude pour Chrome les récupère). Perso = champ « Photo à graver » obligatoire.
- **Livraison** : profils par type — blocs lourds France 12,90 / EU 29,90 ; socle léger France 6,90 / EU 14,90 ; bijoux = petit colis. Ne jamais laisser le tarif bijoux sur du lourd.
- **Socle en option** : soit fiche séparée (simple), soit 2e variation « Socle » + prix varient sur les 2 variations = 8 prix totaux (détaillé dans la recette).

## 🚚 INTÉGRATION BOXTAL (point relais / transporteurs) — CONNEXION RÉSOLUE (03/07/2026)
> API v3 Boxtal. La connexion fonctionne : ne PAS repartir de zéro.
- **Auth = OAuth client_credentials en Basic Auth** sur `POST https://api.boxtal.com/iam/account-app/token` (test : `api.boxtal.build`). Renvoie `{accessToken}` (JWT, ~1h).
- **PIÈGE qui a coûté cher** : le login/mot de passe de l'auth = la **« clé d'accès »** + la **« clé secrète »** de l'app (PAS l'`app-…` ID !). Sur developer.boxtal.com → l'app a 3 valeurs : *ID application* (`app-…`, inutile pour l'auth), *clé d'accès* (login), *clé secrète* (password). Basic = base64(cléAccès:cléSecrète).
- **Clés stockées** dans `settings.boxtal` : `appId` = clé d'accès, `appSecret` = clé secrète (voir `getBoxtalCreds()`/`updateBoxtal()` dans `stock.js`). Saisies dans **Gestion → Réglages** (composant `BoxtalKeys`). Activation + prix dans **Gestion → Livraison** (`ShippingAdmin`).
- **Appels API** : `Authorization: Bearer <accessToken>`. Endpoints v3 utiles : `GET /shipping/v3.1/content-category` · `GET /shipping/v3.2/parcel-point-by-network` (carte points relais) · `POST /shipping/v3.1/shipping-order` (créer expédition) · `GET /shipping/v3.1/shipping-order/{id}/shipping-document` (étiquette PDF) · `GET .../tracking`.
- **Outil de diag** : `/api/admin/boxtal-test` (admin) pour tester la connexion.
- **Reste à construire** : lib client Boxtal (token caché + cotation par poids + points relais), sélecteur transporteur/point relais sur la page panier (Stripe hébergé ne peut pas afficher de carte → choix AVANT paiement), création expédition au webhook, bouton « imprimer l'étiquette » sur la page commande admin. Règle prix : max(4,90 €, coût réel Boxtal + petite marge).

### Boxtal — découvertes du 04/07/2026 (à réutiliser)
- **2 apps** : une **API v1** (pour les PRIX/devis) + une **API v3** (relais/commande/étiquette). Chacune a *clé d'accès* + *clé secrète* (l'App ID `app-…` n'est PAS l'auth). Les DEUX s'authentifient sur `/iam/account-app/token`.
- ⚠️ **v3 ne fait PAS de devis/prix** (dit noir sur blanc dans leur doc : « pas possible en v3, évolution future → utiliser l'API v1 »). Donc **prix auto par poids = API v1** (endpoint pas encore trouvé : `envoimoinscher.com/api/v1/cotation` → 405, `api.boxtal.com/api/v1/…` → 403 WAF ; à creuser via la doc v1).
- ⚠️ **Créer une commande exige que le compte Boxtal ait le « paiement différé par prélèvement » activé** (sinon impossible). Créer une vraie commande en prod = **facturé** → tester en env test `api.boxtal.build` avec un compte de test.
- **Codes d'offres** (POST shipping-order, champ `shippingOfferCode`) : Mondial Relay point relais = `MONR-CpourToi` · Mondial domicile = `MONR-DomicileFrance` · Colissimo point retrait = `POFR-ColissimoPickupStation` · Colissimo domicile = `POFR-ColissimoAccess`/`POFR-ColissimoExpert` · Colis Privé relais = `COPR-CoprRelaisRelaisNat` · Chrono Shop2Shop = `CHRP-ChronoShoptoShop` · Relais Colis = `SOGP-RelaisColis` · UPS relais = `UPSE-StandardAccessPoint`.
- **Structure `POST /shipping/v3.1/shipping-order`** (reconstituée par les erreurs 422) : `{ shippingOfferCode, shipment: { fromAddress, toAddress, returnAddress, packages[] } }`. Chaque *address* = `{ type, contact, location }`. Chaque *package* = `{ length, width, height, weight (>0), value }`. Reste à trouver les sous-champs exacts de contact/location/type/value (itérer sur les 400/422). Étiquette = via webhook `DOCUMENT_CREATED` ou `GET /shipping-order/{id}/shipping-document`.
- **Points relais (marche)** : `GET /shipping/v3.2/parcel-point-by-shipping-offer?shippingOfferCode=MONR-CpourToi&type=ARRIVAL&countryIsoCode=FR&zipCode=…&city=…` (ou `parcel-point-by-network` avec `searchNetworks`).

### ÉTAT ACTUEL & REPRISE (décision de la gérante, 04/07)
- **OPTION B active** (choix de la gérante) : au paiement, option « Livraison en point relais — 4,90 € » (fixe, réglable dans Gestion → Livraison). La gérante crée/imprime l'étiquette **elle-même sur boxtal.com** (paiement carte/PayPal). **Rien d'autre à faire, ça marche.**
- **OPTION A « tout depuis mon site » = à construire PLUS TARD** (quand elle aura du volume). Checklist de reprise :
  1. **Elle** : activer sur Boxtal le **« paiement différé par prélèvement »** (Moyen de paiement → mandat SEPA, IBAN+BIC). Sans ça, création d'étiquette impossible.
  2. **Moi** : lib `src/lib/boxtal.js` (token caché via `/iam/account-app/token` en Basic base64(cléAccès:cléSecrète), clés dans `settings.boxtal` via `getBoxtalCreds()`).
  3. **Moi** : sur la **page panier**, sélecteur de point relais (carte) via `parcel-point-by-shipping-offer` (Stripe hébergé ne peut pas → choisir AVANT Stripe), stocker le point relais choisi sur la commande.
  4. **Moi** : bouton **« Imprimer l'étiquette »** sur la fiche commande admin → `POST /shipping/v3.1/shipping-order` (structure ci-dessus, finir de découvrir contact/location/type/value via les erreurs 422/400) → étiquette via webhook `DOCUMENT_CREATED` (souscription) ou `GET /shipping-order/{id}/shipping-document`.
  5. **Tester en env test** `api.boxtal.build` (compte test) pour ne pas créer de vraies étiquettes facturées.
  - **Prix auto par poids (v1)** = OPTIONNEL (la gérante est OK avec le prix fixe). L'app v1 existe (clés sur son compte Boxtal) mais l'endpoint cotation v1 reste à trouver ; non nécessaire pour l'Option A.


### ⛔ VIDÉO — UNIQUEMENT DES PRODUITS DÉJÀ GRAVÉS (règle ferme du gérant, 22/09/2026)
> « Refais la vidéo avec des produits déjà gravés, je t'ai déjà dit mais mets en mémoire,
> avant de faire un truc fais-le correctement. » Il l'avait déjà dit en conversation et
> ça n'avait JAMAIS été écrit ici — d'où la répétition. C'est écrit maintenant.
- **Toute photo d'une vidéo doit montrer la GRAVURE.** Jamais un produit vierge : on vend la
  personnalisation, un verre nu ne montre rien et ne donne envie de rien.
- 🔴 **LE NOM DE FICHIER MENT — TOUJOURS OUVRIR L'IMAGE.** Pièges avérés dans
  `public/produits/` : **`verre_vin_grave.jpg`** et **`verre_a_whisky_grave_ambiance.jpg`**
  portent « grave » dans leur nom mais sont des **verres VIERGES**. Idem
  `collier-double-coeur-1.jpg` (cœur lisse). Les trois étaient dans la 1re vidéo du 22/09.
- **Méthode obligatoire avant de monter** : fabriquer une **planche contact** des candidates
  (vignettes + nom de fichier, script jetable avec Pillow) et **la regarder**. 5 minutes, et
  c'est la seule façon de ne pas se tromper.
- **Photos GRAVÉES repérées le 22/09 (réutilisables telles quelles)** :
  · carafe — `carafe_gravee.jpg`, `carafe_whiskey_1892.jpg`
  · verre à whisky — `verre_a_whisky_exemple_face.jpg` (photo gravée + MEILLEUR PAPA),
    `verre_a_whisky_exemple_fond.jpg` (gravé au fond), `verre_whisky_papa_monde_moustache.jpg`,
    `verre_whisky_papa_monde_banniere.jpg`, `verre_a_whisky_logo_bourbon.webp`, `verre_a_whisky_card.jpg`
  · verre à vin — `verre_vin_exemple_dale.jpg` (monogramme D DALE), `verre_vin_geniet.jpg`
  · bijoux — `collier-coeur-grave-1.jpg`, `collier-3coeurs-1.jpg`, `collier-coeur-plaques-1à 4.jpg`,
    `collier-double-coeur-3/4/6.jpg`, `bracelet-cordon-plaque-4.jpg`, `bracelet-homme-plaque-1à 5.jpg`
- ⚠️ **AUCUNE photo de flûte à champagne gravée n'existe** (`flute_ambiance/set/vierge` sont
  toutes vierges). Tant qu'il n'en fournit pas une, **la flûte ne peut pas figurer dans une vidéo**.
- **Scripts** : `tools/video/pub_graves_silencieuse.py` (10 produits gravés, sans son) et
  `pub_verres_bijoux_silencieuse.py`. Le titre s'ajuste tout seul à la largeur (4 noms sur 9
  débordaient à 74 px). Photos lues en **local** dans `public/produits/` quand le site est
  injoignable.

## 🎬 RECETTE VIDÉO PUB (à refaire pareil à chaque demande de vidéo)
> Quand l'utilisatrice demande une vidéo/pub, produire CE style par défaut. Si elle dit « améliore », améliorer sur cette base.
Scripts prêts : **`tools/video/pub_gratuite.py`** (montage GRATUIT, 0 crédit) et **`tools/video/pub_ia_higgsfield.py`** (clips animés par l'IA Higgsfield, payant).
- **Outils (gratuits, à réinstaller après un redémarrage du conteneur)** : `pip install Pillow imageio imageio-ffmpeg gTTS numpy` (ffmpeg via `imageio_ffmpeg.get_ffmpeg_exe()`). Voix FR = gTTS (gratuit).
- **Style imposé** : format **vertical 1080×1920** (mobile/reels) ; **rythme RAPIDE et vivant** (segments ~2,2 s, coupures nettes) ; **zoom dynamique** sur chaque photo ; **beat rythmé** (~112 BPM) + nappe douce ; **voix off FR accélérée** (atempo 1,12 — moins « endormie ») ; **sous-titres** + nom du produit (pas de prix) ; carte d'intro « NiV CRÉATION » + carte finale **nivcreation.fr / Fait main en France** ; couleurs marque (or #c9a24b, crème, encre) ; police titres = DejaVuSerif-Bold.
- **Photos** : télécharger depuis `https://nivcreation.fr/produits/<fichier>` (marche même si le dépôt local est vide).
- **Sortie** : ré-encoder LÉGER + faststart (`scale=720:1280`, crf 26, `-movflags +faststart`) → ~3-6 Mo, facile à ouvrir sur téléphone. Toujours l'envoyer via SendUserFile.
- **Varier les produits** à chaque fois (ne pas reprendre toujours les mêmes) ; possibilité d'ajouter d'autres produits sur demande.
- **À CHAQUE vidéo** : joindre une **description** + des **tags**. ⚠️ **LE FORMAT EST FIXE**
  (établi sur les vidéos 1 à 6, rappelé par le gérant le 22/09 : « on refait les descriptions
  correctement et les tags comme pour les autres »). Le recopier exactement :
  ```
  **Vidéo N — <Thème>** (Produit 1, Produit 2, Produit 3…)
  > <2 à 3 phrases courtes, chaleureuses, AVEC des emojis ✨ 💛 🎁 🆕>
  > 👉 nivcreation.fr

  #nivcreation #<thème> #<produit> #<produit> #cadeaupersonnalise #faitmainenfrance #gravure #<…> #<…> #ideecadeau
  ```
  · **La numérotation CONTINUE** d'une livraison à l'autre (1-6 le 02-06/09, 7-9 le 22/09,
    10-11 le 25/09, **12 verres et 13 Noël le 26/09** — la 13 = toutes familles, 13 pièces
    gravées, script `pub_cristaux_silencieuse.py` entrée 13 ; **14 Noël HyperFrames le 26/09** ;
    **15 Noël HyperFrames « 13 pièces » le 26/09** (2ᵉ conversation, même jour, même demande —
    projet `tools/video/hyperframes-noel-13pieces/`, registre `docs/videos/`) ; prochaine = 16).
  · 🎬 **HYPERFRAMES EN LOCAL — ÇA MARCHE (26/09/2026, vidéo 14)** : le MCP hébergé (`compose`/
    `render_video`) **refuse les agents Claude Code** (« disabled for local CLI/IDE agents »). La
    voie qui marche = les skills locaux (`npx skills add heygen-com/hyperframes`) + le CLI
    `npx hyperframes` (init / check / snapshot / render). Projet modèle commité :
    **`tools/video/hyperframes-noel/`** (README avec la recette complète). Pièges réglés : les CDN
    (jsdelivr, Google Fonts côté navigateur) sont bloqués au rendu → GSAP et polices EN LOCAL ;
    `ffprobe` manque (imageio-ffmpeg n'a que ffmpeg) → `npm i @ffprobe-installer/linux-x64` ;
    Chrome via `npx hyperframes browser ensure` (téléchargement OK). Rendu 32 s ≈ 2 min 30.
    Compléments (autre session, même jour) : GSAP local aussi dans `videos/niv-produits/vendor/`
    ou `npm pack gsap@3.14.2` (registre npm autorisé) ; polices TTF via
    `raw.githubusercontent.com/google/fonts/main/ofl/…` (autorisé) + `@font-face` obligatoire ;
    ffmpeg = lien `~/bin/ffmpeg` → binaire d'imageio-ffmpeg, mais **ffprobe DOIT être le vrai** (`@ffprobe-installer/linux-x64`) : un lien ffprobe→ffmpeg fait échouer le rendu à 100 % (« Unrecognized option print_format ») ; contrat de
    composition dans `.agents/skills/hyperframes-core/SKILL.md` (un `gsap.timeline({paused:true})`
    dans `window.__timelines["main"]`, `fromTo` partout, jamais de `transform` CSS sur un nœud
    tweené) ; `check --json` doit donner 0 finding, `snapshot --at …` fait une planche contact
    à REGARDER avant `render`. Skills installés dans `.agents/skills/` (`skills-lock.json` versionné).
    Photos posées ENTIÈRES dans un cadre doré sur fond flou (hauteur du cadre = ratio de la photo),
    jamais recadrées ; musique = Jingle Bells synthétisée (domaine public).
  · ⚠️ **UNE VIDÉO D'OCCASION DOIT LE DIRE SUR CHAQUE PLAN** (gérant, 26/09, sur la 1re version de
    la 13 : « dans la vidéo on sait pas, c'est pour des cadeaux pour Noël »). Refaite avec un
    habillage Noël : ruban doré « ✦ IDÉE CADEAU DE NOËL ✦ » en haut de CHAQUE plan produit,
    pastille « NOËL 2026 » près du nom, cartes d'intro/fin rouge & or (« Cadeaux de Noël » /
    « Commandez tôt pour Noël »). Mécanique = 5ᵉ élément `True` dans `VIDEOS[n]` → `noel=True`
    dans `overlay`/`card`. Piège : Liberation Sans n'a pas le glyphe ✦ (carrés vides) → `SANSB_U`
    (DejaVu Sans Bold) pour ces textes.
  · Le titre liste **les produits de la vidéo entre parenthèses**.
  · ⚠️ **DEPUIS LE 25/09/2026 : 5 HASHTAGS, PAS 10** (gérant : « les tags les plus importants
    qui fonctionnent bien sur les réseaux sociaux, et n'en mets que cinq »). Sur UNE ligne,
    `#nivcreation` en premier, `#ideecadeau` en dernier, entre les deux les 3 tags à plus forte
    portée pour la vidéo (`#cadeaupersonnalise` quasi toujours, + le produit, + l'occasion).
    Jamais `#faitenfrance`. (Les vidéos 1 à 9 ont 10 tags : ne pas les refaire.)
  · ⚠️ **UNE VIDÉO PAR FAMILLE, AVEC TOUS LES PRODUITS GRAVÉS DE LA FAMILLE** (25/09 : « une
    vidéo où il y a tous les blocs, comme une pub pour les réseaux sociaux » — il a REFUSÉ
    3 vidéos par thème). Vidéo 10 = tous les blocs de cristal 3D (uniquement les BLOCS : ni
    porte-clés, ni pyramide, ni socle, ni USB) · vidéo 11 = toute la déco bois gravée.
    Script : `tools/video/pub_cristaux_silencieuse.py` (10 et 11 ; photos paysage posées ENTIÈRES
    sur fond flou, jamais recadrées ; `cristal-v-bebe.jpg` écarté : 512 px, flou).
  · ⚠️ **Les emojis sont OBLIGATOIRES ici** — la règle « pas d'emojis » du §9 ne vaut que pour
    le CONTENU DU SITE, pas pour les légendes Instagram.
  · Pas de prix, jamais de nombre de produits, ne pas nommer le département de l'atelier.
  · 📁 **REGISTRE DES VIDÉOS = `docs/videos/REGISTRE-VIDEOS.md` (créé le 26/09/2026, demande du
    gérant : « enregistrer ces vidéos et les tailles que tu me donneras avec les descriptions, je te
    demanderai »)**. Chaque vidéo livrée y est consignée le jour même : fichiers dans `docs/videos/`
    (`<n°>-<thème>-<L>x<H>.mp4`, version pleine qualité + version légère), durée, poids, produits,
    description et hashtags **tels que livrés**. Quand il redemande une vidéo ou sa description :
    lire le registre, renvoyer le fichier (`SendUserFile`) et la description à l'identique.
  · **Les vidéos 1 à 13** ne sont PAS dans le dépôt (livrées avant le registre) : elles ne sont que
    dans les transcripts des sessions (`~/.claude/projects/-home-user-Niro/<session>.jsonl`, chercher
    `#nivcreation`) — le dire s'il les redemande, et proposer de les régénérer avec les scripts.
- **CRÉDITS Higgsfield = payant** : ne JAMAIS lancer sans confirmer, annoncer le coût (`get_cost:true` preflight, ~7,5 crédits/clip 5 s), et attendre l'accord. Le montage gratuit (`pub_gratuite.py`) est la version par défaut.

---

Ce fichier explique à **tout agent Claude** comment travailler sur ce dépôt,
et surtout **comment ajouter un produit correctement et le publier**.

> Objectif : quand l'utilisatrice donne un produit (photo, description, lien
> Etsy/fournisseur), l'agent recherche les infos, remplit le bon format, vérifie
> que le site compile, puis commit + push. Netlify redéploie automatiquement.

---

## 1. Stack & déploiement
- **Next.js 14** (App Router, JavaScript) + **Stripe** (paiement) + **Resend** (e-mails).
- Hébergé sur **Netlify** : un `git push` sur la branche de déploiement déclenche
  un redéploiement automatique (~2-3 min).
- **Branche de déploiement : `claude/site-product-overview-1t2de`.** Toujours
  commit/push dessus (sauf consigne contraire de l'utilisatrice).
- Avant de pousser : **toujours** lancer `npm run build` pour vérifier qu'il n'y
  a pas d'erreur.

## 2. Carte des fichiers
| Fichier | Rôle |
|---|---|
| `src/lib/products.js` | **TOUS les produits** (la source à éditer pour ajouter/modifier) |
| `src/lib/productInfo.js` | Infos détaillées par produit (Taille & Matériaux, Entretien, Expédition & Retour) |
| `src/lib/fonts.js` | Palette des 8 polices de gravure |
| `src/lib/shipping.js` | Frais de livraison (forfaits, paliers) |
| `src/components/ProductDetail.jsx` | Fiche produit (rend les champs de gravure) |
| `src/app/boutique/page.jsx` | Catalogue + filtres catégories/sous-catégories |
| `docs/PERSONNALISATION-GRAVURE-3D.md` | **Guide gravure + aperçu 3D** (motifs, 3D, recette nouveau produit) |
| `docs/couts-cristal-alibaba.md` | **Coûts d'achat gamme CRISTAL 3D** (reçu Alibaba avr. 2026 : coût rendu par taille, transport compris) |
| `docs/prix-marche.md` | **Relevé du marché produit par produit** (ce que font les autres sites) + ce qui a été relevé ou laissé tel quel |
| `docs/prix-historique.md` | **Les prix d'AVANT chaque hausse**, pour pouvoir revenir en arrière. À COMPLÉTER à chaque changement de prix |
| `docs/cristal-3d-plan.md` | **DOSSIER Cristal 3D** (plan de vente : achats, prix concurrents, prix conseillés, mise en page fiche, marketing, plan d'action — en cours, gravure à trancher) |

## 3. Schéma d'un produit (`src/lib/products.js`)
Chaque produit est un objet du tableau `products`. Champs :

```js
{
  slug: "mon-produit",                 // identifiant URL unique (minuscules, tirets)
  name: "Nom court",                   // affiché sur les vignettes
  weight: 150,                          // poids EMBALLÉ en grammes (frais de port)
  pickup: false,                        // true = remise en main propre possible (déco bois/mariage)
  letter: true,                         // true = expédiable en Lettre Suivie (léger & fin < 3 cm : bijoux, petits objets)
  subcategory: "femme",                // UNIQUEMENT pour les bijoux : "femme" ou "homme"
  title: "Titre long et SEO",          // titre de la fiche + balise <title>
  category: "bijoux",                  // "bijoux" | "mariage" | "cadeaux"
  type: "Collier personnalisé",        // type affiché (chip sur la vignette)
  tagline: "Phrase d'accroche courte.",
  personalizable: true,
  personalizationLabel: "Résumé de la personnalisation",
  personalizationFields: [ /* voir §4 */ ],
  images: [                             // URLs hébergées (CDN Shopify ou Cloudinary)
    "https://cdn.shopify.com/.../photo1.jpg",
  ],
  variants: [                           // au moins une variante
    { id: "id-unique-variante", title: "Option", price: 24.90 },
  ],
  descriptionHtml: `<p>...</p>`,        // description riche (HTML : p, h3, ul, li, strong)
}
```

Règles importantes :
- **`id` de variante** : chaîne unique et stable (ex. `slug-option`). Sert au panier et au paiement.
- **Prix** : nombre en euros (point décimal), ex. `24.90`. Le site recalcule les prix côté serveur depuis ce fichier (sécurité).
- **Première variante = prix affiché** sur la vignette. Pour un tarif dégressif, mettre l'unité en premier, le lot ensuite.
- **`letter`/`pickup`/`weight`** pilotent la livraison (voir §6).

## 4. Champs de gravure (`personalizationFields`)
Liste de champs affichés sur la fiche. Types disponibles :
- `text` (défaut) : `{ key, label, placeholder, maxLength, optional }`
- `textarea` : pareil, pour plusieurs lignes (listes de prénoms, menu…)
- `select` : `{ key, type:"select", label, optional, options:[{value,label}] }`
- `font` : `{ key, type:"font", label, optional }` → menu déroulant des 8 polices (auto)
- `color` : `{ key, type:"color", label, optional, options:[{value:"#c9a24b",label:"Doré"}] }` → teinte l'aperçu
- `photo` : `{ key, type:"photo", label, optional, text }` → upload Cloudinary (sinon « envoyer par e-mail »)
- `note` : `{ key, type:"note", text }` → simple texte informatif, pas de saisie

Options communes :
- `optional: true` → champ facultatif (sinon obligatoire avant ajout au panier).
- `variantContains: "Recto-Verso"` → le champ n'apparaît **que** si le titre de la
  variante choisie contient ce texte (ex. afficher le verso seulement en recto-verso,
  ou la photo seulement pour l'option « Photo »).
- `maxLength` → limite de caractères (compteur affiché).

Un **aperçu de gravure en direct** s'affiche automatiquement dès qu'il y a un champ
texte : le texte saisi apparaît dans la **police** et la **couleur** choisies.

### Combien de faces graver ?
Configurer **exactement** le nombre de zones réellement gravables :
- 1 face → 1 champ texte. Recto-verso → 2 champs (le 2e avec `variantContains`).
- Plusieurs faces (ex. médaillon = 4) → un champ par face.
- En cas de doute, **demander à l'utilisatrice** le nombre de côtés gravables.

## 5. Catégories, sous-catégories & polices
- Catégories : `bijoux`, `mariage`, `cadeaux` (constante `CATEGORIES`).
- Sous-catégories : pour `bijoux` → `femme` / `homme` (constante `SUBCATEGORIES`).
  Pour en ajouter une nouvelle famille (ex. cristaux), ajouter à `CATEGORIES` et,
  si besoin, à `SUBCATEGORIES`, et mettre `category` (et `subcategory`) sur les produits.
- Polices de gravure (clé à utiliser dans un champ `font`) : `playfair`, `cinzel`,
  `cinzel-deco`, `montserrat`, `inter`, `great-vibes`, `allura`, `pacifico`.

## 6. Livraison (rappel)
Le site calcule **un seul frais** automatiquement (voir `src/lib/shipping.js`) :
- Panier 100 % `letter:true` → forfait lettre suivie (offert dès 45 € pour les bijoux).
- Dès qu'un article n'est pas `letter` (déco bois) → tarif colis par paliers de quantité.
- `pickup:true` → ajoute l'option « Remise en main propre » (7 €).
→ Bien renseigner `weight`, `letter`, `pickup` sur chaque nouveau produit.

**Poids AUTOMATIQUE par taille + options (maj 06/07/2026)** : le port se calcule sur le **poids réel du panier** (somme des poids × quantités), donc c'est correct pour plusieurs articles OU un mélange (bijou + bloc…), et automatique dès qu'un produit a un poids.
- **Poids par variante** : mettre `weight` (g, EMBALLÉ) **sur chaque variante** si les tailles pèsent différemment (ex. blocs cristal : petit 750 / moyen 1100 / grand 1800 / XL 2800). Repli : `product.weight`. Le checkout lit `variant.weight || product.weight`.
- **Poids d'une option** (ex. socle) : ajouter `weight` (et `weightByVariant`) sur l'entrée `engravingPricing.flatExtras` → ajouté au port quand l'option est prise (`engravingExtra().weight`).
- **Point relais** = grille par poids (`POINT_RELAIS_TIERS`). **Domicile** = max(tarif par quantité déco/verres, grille par poids `HOME_WEIGHT_TIERS`) → les colis lourds ne sont jamais sous-facturés, les petits produits ne changent pas.
- **LIVRAISON OFFERTE PAR SEUIL SUR COLIS (`freeShipThreshold`, maj 24/07/2026)** : mettre `freeShipThreshold: 45` sur un produit colis (verre à vin, flûte, carafe) → **livraison offerte dès que le sous-total du panier ≥ ce seuil**. Calculé dans `/api/checkout` : `allColisThreshFree` (vrai seulement si TOUS les colis du panier portent un `freeShipThreshold`) + `subtotal >= colisThresh` → `freeShipping` passé à `buildShippingOptions`. **Sûr et automatique en panier mixte** : le seuil s'applique sur le total (ex. vin lot 2 + flûte lot 2 = 49,80 € ≥ 45 → offert), un mélange avec un colis SANS seuil (ex. bloc cristal) reste facturé au poids (pas de gratuité indue). Le seuil bijoux/lettre (`bijouxFreeThreshold`, 45 €) reste séparé pour les paniers 100 % lettre. **Ne pas utiliser `freeShipping:true` (toujours offert) sur un produit qui peut être mélangé** → ça se perd en panier mixte ; préférer `freeShipThreshold`. Vérifié par script (paniers mixtes vin/flûte/carafe/bijou) le 24/07/2026 : ✔ additionne poids × quantités, ✔ seuil 45 € sur le total, ✔ carafe seule 54,90 € offerte.
- **BIJOU EN BOÎTE = PETIT COLIS (31/08/2026, demande gérante)** : un bijou emballé dans une
  **boîte rigide** (boîte cadeau carrée/allongée, Pack Collier, Pack Bracelet — id contenant
  `boite`/`pack`) dépasse les 3 cm de la Lettre Suivie → facturé au **tarif colis** (domicile 6,90 €,
  relais grille au poids) au lieu de 3,90 €. Sac / microfibre seuls = toujours lettre 3,90 €.
  **La promesse « offerte dès 45 € » reste vraie** pour un panier 100 % bijoux même en boîte
  (flag `tousBijouxLettre && bijouEnBoite` dans `/api/checkout`). Aligné sur le marché (recherche 31/08).
- **POINT RELAIS MULTI-TRANSPORTEURS (maj 06/07/2026)** : le client voit sur la carte **tous les points relais** autour de lui, **tous transporteurs confondus** (Mondial Relay, Relais Colis, Colissimo point retrait, Chrono Shop2Shop, UPS — tous gérés par Boxtal), et clique sur le plus proche ; **le prix s'ajuste au transporteur du point choisi**. Transporteurs + grilles par poids = `RELAIS_CARRIERS` dans `shipping.js` (chaque point porte `carrier`/`carrierName`/`offer`). `/api/relais` interroge tous les transporteurs en parallèle et fusionne les points (repli sûr : ceux qui ne remontent rien n'apparaissent pas). Le `RelaisPicker` affiche le nom du transporteur + le prix par point ; le checkout facture via `relaisCarrier` (tarif au poids du transporteur, jamais perdant) et enregistre le transporteur + le point sur la commande. Pour ajouter/retirer un transporteur : éditer `RELAIS_CARRIERS` (il doit aussi être activé sur Boxtal). Onglet « Transporteurs relais » du fichier Excel.
- **EUROPE (maj 06/07/2026)** : livraison hors France gérée par **zone + poids** (`shippingZone(country)` + `EU_TIERS` dans `shipping.js`). Zones : **EU1** (BE/LU/NL/DE), **EU2** (ES/IT/PT), **CH** (Suisse). Le client choisit son **pays sur la page panier** (`COUNTRIES`) → envoyé au checkout (`country`) → `buildShippingOptions({country})` renvoie le tarif Europe (à domicile uniquement) ; l'adresse Stripe est verrouillée sur le pays choisi (`allowedCountries`). **France + Monaco = tarifs habituels inchangés.** Grille complète : onglet « Livraison Europe » du fichier Excel `docs/Niv-Creation-Prix-et-Port.xlsx`. Point relais Europe = à ajouter plus tard si besoin.

**Tarifs modifiables dans l'admin (maj 03/07/2026)** : page **Gestion → Réglages → 🚚 Livraison
(tarifs)** (`src/components/admin/ShippingAdmin.jsx`). Tous les montants (bijoux, seuil offert,
paliers déco, paliers verres, retrait) sont stockés en réglages (`settings.shipping`, sanitizé
dans `/api/admin/settings`) et appliqués au checkout via `resolveShippingConfig()` — repli sûr
sur les constantes du code si un champ est vide/invalide. La barre « livraison offerte » du
panier (`FreeShippingBar`) lit le seuil via `/api/shipping-config` ; la FAQ le lit côté serveur.
Les valeurs de `shipping.js` restent les tarifs PAR DÉFAUT (bouton « Rétablir » dans l'admin).

## 7. Infos détaillées (`src/lib/productInfo.js`)
Pour une fiche complète, ajouter une entrée `"slug": { material, usage, returns }`
(texte libre, sauts de ligne conservés) :
- `material` : Taille & Matériaux
- `usage` : Personnalisation & Entretien
- `returns` : Expédition & Retour (politique adaptée au produit)

## 8. Photos
- Utiliser des **URLs hébergées** (https). Sources possibles : CDN Shopify de la
  boutique, ou Cloudinary (compte de l'utilisatrice).
- Pour récupérer les vraies photos d'un produit déjà sur Shopify, utiliser les
  outils MCP Shopify (`get-product` / `search_products`) si disponibles.

## 9. Ton & style
- Tout en **français**, élégant, soigné. **Pas d'emojis** dans le contenu du site.
- Descriptions structurées (accroche en gras, sections `<h3>`, listes `<ul>`).

---

## 🧩 GABARIT FICHE PRODUIT — À RESPECTER SANS QU'ELLE AIT À LE REDEMANDER (20/08/2026)
> **Demande explicite de la gérante** : « il faut que tu gardes les mêmes réglages, la même mise en
> page pour tous les produits, tous les systèmes qu'on a déjà paramétrés — je vais pas te répéter à
> chaque fois ». **Avant toute maquette ou tout nouveau produit : lire ce gabarit ET regarder une
> fiche existante du même type** (`src/components/ProductDetail.jsx` + le produit voisin).

**Ordre EXACT des blocs d'une fiche produit** (tel que rendu par `ProductDetail.jsx`) :
1. Fil d'Ariane `Boutique / <Catégorie>` · bandeau jaune « Aperçu privé » si le produit est masqué
2. **Galerie** : grande photo + `gallery-thumbs` (vignettes) · flèches ‹ › · modèle 3D si `model3d`
3. Note d'aperçu si `engrave` (givré sur le verre / **`engraveNote`** pour une autre matière)
4. Catégorie en sur-titre doré · **H1** (le `title`) · `tagline` · note `pd-rating` (★ + nb d'avis)
5. **Prix** : `price-old` barré + `price-sale` + `promo-badge` (ou « Prix conseillé »)
6. **« Choisissez votre option »** : `variant-swatches` (les variantes = options/prix)
7. **« Personnalisation — gravure »** : les `field` dans l'ordre de `personalizationFields`
   (stylepicker n° · photo · lettreFleurie · textes · police · notes)
8. **« Votre emballage »** si `packaging` (sélecteur de formule)
9. **`pd-totbox`** — encadré doré **« Total tout compris »** (prix × quantité, options incluses)
10. **`pd-nfois`** — « Payez en plusieurs fois sans frais » (4× PayPal / 3× Klarna)
11. `VacationNotice` (n'affiche rien si le mode vacances est éteint)
12. **`qty-row`** — sélecteur de quantité (− 1 +) **à gauche** du bouton doré **« Ajouter au panier »**
13. **`trust-cards`** — 4 cartes : origine · Paiement sécurisé · Fait main / Gravé à la commande · Livraison suivie
14. **`pd-perso`** — « ✦ Pièce personnalisée » (délai 3-5 jours ouvrés + livraison)
15. `product-desc` — la description HTML · guide de tailles si cristal
16. **`info-accordion`** — Taille & Matériaux · Personnalisation & Entretien · Expédition & Retour
    (+ un 2e accordéon Qualité/Entretien sur les bijoux) → vient de `productInfo.js`
17. Lien discret vers le guide de conseils · « Vous aimerez aussi » · avis · vus récemment

**Systèmes déjà en place — les RÉUTILISER, ne jamais en réinventer :**
- **Modèles numérotés** : `type:"stylepicker"` + `styleImages` (42 modèles du verre à vin, 33 de la carafe)
- **Lettre fleurie** : `type:"lettreFleurie"` + `image:"/produits/alphabet-fleuri.jpg"` (A→Z)
- **Photo à graver** : `type:"photo"` (téléversement + vérification atelier)
- **Aperçu en direct** : `engraveImage` (photo du produit VIERGE, prise de face) + `engrave.box`
  - **Ce qui se pose sur le produit** (règle de la gérante, 20/08/2026) : un **modèle numéroté** ou
    la **photo** de la cliente → OUI, ils apparaissent sur la photo du produit ; la **lettre
    fleurie** → NON, on ne la pose pas ; le **texte** écrit par la cliente → OUI, toujours, y
    compris avec la lettre fleurie.
  - Le placement de la zone se règle **dans le code** (`engrave.box`), pas dans l'admin : le faire
    soi-même à partir de la photo vierge, puis lui demander « plus haut / plus grand » — ne pas lui
    faire faire le réglage.
- **Choix exclusif** : `showIfField` / `showIfValue` (ex. Texte / Photo)
- ⚠️ **RIEN N'EST AFFICHÉ EN PERMANENCE** (demande de la gérante, 20/08/2026) : la fiche commence
  par **« Que voulez-vous faire graver ? »** (modèle n° / photo / lettre fleurie), et **seuls les
  champs du choix retenu apparaissent**. La planche de l'alphabet fleuri, la bande de motifs et le
  téléversement de photo NE DOIVENT PAS rester visibles tout le temps — c'est lourd et ça perd la
  cliente. Le **texte à graver + la police** (les 8 écritures du site) restent proposés dans tous
  les cas ; avec la lettre fleurie, ce texte se grave **dans la bande** au milieu de la lettre.
- **Polices** : `type:"font"` (les 8 écritures) · **Couleur** : `type:"color"`
- **Emballage** : `packagingSeed.js` + `defaultPackagingFor()` · **Livraison** : `weight` + `letter`/`pickup`
- **Guide de conseils** : automatique via la catégorie (`guidePourProduit`)

**Pour une MAQUETTE de fiche** : reprendre les **2 feuilles de style réelles du site**
(`https://nivcreation.fr/_next/static/css/*.css`, récupérables avec curl) + les polices
Playfair Display / Inter, et les **mêmes classes** que ci-dessus. Modèle de référence déjà fait :
`docs/maquettes/support-telephone-fiche.html`. Les photos que la gérante envoie dans la conversation
sont **récupérables** dans le transcript de session (`~/.claude/projects/…/<session>.jsonl`, blocs
`{"type":"image","source":{"type":"base64",…}}`) — **ne jamais lui dire qu'on ne peut pas les récupérer**.

## 10. PROCÉDURE — Ajouter un produit (à suivre par l'agent)
1. **Comprendre** le produit fourni (photo / description / lien). Si un lien
   fournisseur/Etsy est donné, en extraire matière, dimensions, options, prix.
2. **Rechercher sur Internet** si besoin (matériaux, dimensions standard, bonnes
   pratiques de personnalisation pour ce type de produit).
3. **Déterminer** : catégorie, sous-catégorie (si bijou), type, prix, variantes,
   `weight`, `letter`, `pickup`, et les **champs de gravure** (nb de faces, police,
   couleur, photo…).
4. **Ajouter** l'objet produit dans `src/lib/products.js` (et une entrée dans
   `src/lib/productInfo.js`).
4ter. **⚠️ DATE D'AJOUT OBLIGATOIRE** : ajouter le slug + la date du jour dans
   `src/lib/productDates.js` (`PRODUCT_DATES`). C'est elle qui : 1) fait passer le produit
   **en tête du bandeau « Vient d'arriver »** de l'accueil ; 2) **éteint l'étiquette
   « Nouveau » au bout de 30 jours** (autom., `estRecent()` appliqué dans `getCatalog`).
   Sans date : pas de bandeau, pas d'étiquette.
4bis. **⚠️ RÈGLE OBLIGATOIRE — UN NOUVEAU PRODUIT DOIT RESSEMBLER AUX AUTRES DU MÊME TYPE.**
   Ne jamais ajouter un produit « nu ». Le configurer **exactement comme ses semblables** :
   - **Packaging / emballages** : ajouter le slug dans `src/lib/packagingSeed.js`
     (`DEFAULT_PRODUCT_PACKAGING`). **Un bijou = comme les autres bijoux** : un **collier** →
     liste `COLLIERS` (sac + boîte carrée + microfibre + pack-collier) ; un **bracelet femme fin**
     → `BRACELETS_CARRE` ; un **bracelet homme/long** → `BRACELETS_LONG` (boîte allongée +
     pack-bracelet). Sinon la fiche n'a pas le sélecteur « Votre emballage » que les autres ont.
   - **Fiche détaillée** : entrée dans `productInfo.js` (Taille & Matériaux, Entretien, Retour).
   - **Champs communs** : `weight`, `letter`, `pickup`, `category`, `subcategory` (femme/homme pour
     les bijoux), `badge:"Nouveau"`, `type`, photos optimisées (~1200px, <300 Ko).
   - En résumé : **regarder un produit existant du même genre et copier TOUTE sa config** (pas que
     le nom/prix/photo). Si un bijou, il doit se comporter comme les autres bijoux de bout en bout.
   - **⚠️ GRAVURE = TOUJOURS UNE OPTION PAYANTE, JAMAIS INCLUSE** (demande explicite de la gérante).
     Ne jamais mettre la gravure « incluse/offerte ». Toujours une variante **« Sans gravure » / « Avec
     gravure » (+ supplément, ex. +3 €)** avec les champs de gravure en `variantContains:"Avec"` (modèle :
     `bracelet-homme-cuir-tresse-acier` = 3 couleurs × Sans/Avec, ou `collier-coeur-zircon`).
   - **COÛT D'ACHAT = prix fournisseur + FRAIS DE PORT/IMPORT** (jamais le prix article seul). Pour la
     commande Nihao NHFR607182266419 : +18,8 % environ (port 20,21 € / produits 107,66 €). Voir
     `docs/commande-fournisseur-NHFR607182266419.md`.
5. **Vérifier** : `npm run build` doit réussir (corriger toute erreur).
6. **Publier** : `git add -A && git commit -m "Ajout produit : <nom>"` puis
   `git push origin claude/site-product-overview-1t2de`.
7. **Confirmer** à l'utilisatrice l'URL de la fiche (`/produit/<slug>`) et lui
   demander de vérifier (rappel : recharger en navigation privée, le déploiement
   prend 2-3 min).

> En cas d'information manquante ou ambiguë (nombre de faces gravables, prix,
> couleurs disponibles…), **poser la question à l'utilisatrice** plutôt que d'inventer.

---

## 11. ÉTAT DU PROJET — confirmé par l'utilisatrice (à lire avant de reposer des questions)
> Ces points ont déjà été confirmés. **Ne pas les redemander.** Mettre à jour cette
> section quand l'utilisatrice confirme un nouvel élément.

- **Stripe : en mode RÉEL (Live).** Les vrais paiements fonctionnent. (Confirmé.)
- **Frais de port : corrects.** Les tarifs de livraison correspondent. (Confirmé.)
- **Variables d'environnement Netlify configurées** : `STRIPE_SECRET_KEY` + webhook (live),
  `RESEND_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `CONTACT_EMAIL`, `ANTHROPIC_API_KEY`,
  `ANTHROPIC_MODEL`, `NEXT_PUBLIC_SITE_URL`.
- **Assistant admin (Claude)** : activé et fonctionnel.
- **E-mails** : confirmation cliente + alerte commande (vérifier les spams), suivi colis,
  annulation — tous à l'image de la marque (logo + or/crème).
- **Reçu Stripe** : logo + couleur or réglés ; numéro perso retiré (informations publiques Stripe).
- **POLITIQUE REMBOURSEMENT — RÈGLE FERME (déjà confirmée, NE PLUS REDEMANDER)** : les **produits
  personnalisés ne sont JAMAIS remboursés** (droit de rétractation exclu, art. L221-28 ; clause déjà
  dans les pages Retours/CGV). → Ne JAMAIS proposer remboursement/retour/avoir pour un article
  personnalisé. Si une commande « retrait » n'est pas venue chercher : on garde, **pas de remboursement**.
- **Atelier en Val-d'Oise (95)** ; domiciliation légale 6 rue d'Armaillé 75017 Paris = **correcte**, ne pas la remettre en question.
- **URSSAF : déclaration FAITE** (activité déclarée à l'URSSAF — confirmé par la gérante le 11/07/2026). Ne plus le redemander ni le rappeler.
- **Retrait en main propre** : déco/mariage **uniquement** (jamais les bijoux = livraison seule), gratuit,
  sur rendez-vous, limité par code postal (95 + voisins : 78, 92, 93, 75, 60), adresse jamais publiée.

### TEXTE RETIRÉ DES CRISTAUX — TEMPORAIRE (07/07/2026, À REMETTRE quand la gérante le dira)
> Le champ « texte à graver » a été retiré des cristaux ; **tout est sauvegardé en commentaire** dans `src/lib/products.js` (chercher « TEXTE RETIRÉ TEMPORAIREMENT »). Pour remettre : décommenter les champs `texte`/`police`.
- **Blocs vertical + horizontal** : photo uniquement (texte optionnel retiré, en commentaire).
- **Pyramide** (`pyramide-cristal-gravure-3d`) : passée de TEXTE → **PHOTO** (photo 3D + guide). Le texte d'origine (textarea+police) est en commentaire ; titre/tagline/description mis à jour en « photo ». Pour revenir au texte : remettre les 2 champs commentés, retirer le champ photo, et remettre les libellés « texte ».
- **Porte-clés cristal** (Cœur, Rectangle) : déjà photo uniquement (jamais de texte).

### PACKAGING / EMBALLAGES — construit le 17/07/2026 (masqué tant que non activé)
> Page **Gestion → Catalogue → 📦 Packaging & emballages** (`/gestion/emballages`, `src/app/gestion/emballages/page.jsx`).
- **Bibliothèque** d'emballages dans `settings.packaging` (`[{id,name,desc,buy,sell,weight,photo}]`) + **attribution par produit** `settings.productPackaging` (`{slug:{on,ids,free}}`). Sanitizers dans `/api/admin/settings`. Config de DÉPART pré-remplie (prix/règles de la gérante) dans `src/lib/packagingSeed.js` (s'affiche tant qu'elle n'a rien enregistré → elle ajoute juste les photos).
- **INTERRUPTEUR MAÎTRE** `settings.packagingLive` (défaut **false**) : tant qu'il est false, `getCatalog` n'attache PAS `product.packaging` → **RIEN sur le site** (fiches inchangées). L'admin a le toggle « visible sur le site ». Activation = la gérante coche + Enregistre (ou on met `packagingLive:true`).
- **Fiche** (`ProductDetail.jsx`) : si `product.packaging.on`, sélecteur « Votre emballage » en mode **choisir UNE formule** (radio) : Sans emballage / Sac / Boîte / Microfibre / Pack (mis en avant « meilleur choix »). Prix recalculé côté serveur au checkout (`packagingExtra` dans `src/lib/packaging.js`, appelé dans `/api/checkout`), poids ajouté au colis, emballage écrit sur la commande (description Stripe).
- Prix confirmés : Sac 1,20 · Boîte cadeau 3 (colliers) / 5 (bracelets) · Microfibre 1,90 · **Pack Collier 5,50**. Règles : sac+microfibre sur tous les bijoux · boîte cadeau (carrée) sur colliers + 3 bracelets fins (Femme Cœur/Papillon/Acier) · boîte cadeau (allongée) sur les autres bracelets. Maquettes validées : `docs/maquettes/admin-packaging.html` + `packaging-client-pack.html`. **Reste à trancher** : Pack Bracelet (oui/non) — non créé pour l'instant.

### RÈGLE — RIEN SUR LE SITE SANS VALIDATION (17/07/2026, demande explicite après incident)
- **INTERDIT de modifier le site visible** (fiches, pages, textes clients) **sans l'accord explicite de la gérante**. Le circuit est TOUJOURS : **maquette d'abord → elle valide → « applique » → alors seulement on touche au site.**
- En cas de doute sur ce qu'un « oui » valide exactement : **demander**, ne pas déduire.

### ⛔ RÈGLE RENFORCÉE — « MASQUÉ » NE VEUT PAS DIRE « PAS SUR LE SITE » (20/08/2026, incident)
> La gérante avait demandé une **maquette** du support téléphone. Pour lui « montrer la vraie page »,
> j'ai créé le produit dans `products.js` avec `hidden:true` et je l'ai poussé. Invisible pour les
> clientes, certes — **mais c'était quand même son site, sans son accord.** Elle l'a très mal pris,
> à juste titre. Produit et images supprimés, code remis à l'identique.
- **Ne JAMAIS modifier le code du site — même un produit masqué, même un réglage invisible, même
  « pour montrer » — tant que la gérante n'a pas écrit « applique » / « publie ».**
- Une maquette reste dans `docs/maquettes/` + artifact. Elle ne se construit PAS dans le site.
- Si montrer le vrai rendu impose de construire (aperçu privé `?apercu=niv2026`), **lui demander
  d'abord** : « pour vous montrer la vraie page, je dois la créer en mode masqué, d'accord ? »
- Le doute se tranche TOUJOURS dans le sens : je ne touche pas, je demande.

### RÈGLE — NE PAS MODIFIER LES MAQUETTES SANS DEMANDER (23/07/2026, demande explicite)
- **INTERDIT de modifier une maquette (artifact) sans demander d'abord l'accord de la gérante.** Même pour une « amélioration » évidente : on **propose et on attend son feu vert** avant de toucher/republier une maquette existante.
- Vaut pour TOUTES les maquettes (gobelet, carafe, cristal, thème, etc.). Republier une maquette = une modification → demander avant.
- Exception : si elle demande explicitement le changement, on le fait (c'est déjà son accord).

### MÉTHODE DE MAQUETTE — GARDER LA MÉTHODE CLASSIQUE (22/08/2026, demande explicite)
> Testé l'outil `/design` (canvas Claude Design éditable) pour une maquette de hero. **La gérante n'a pas aimé,
> elle veut qu'on reste sur la méthode habituelle.**
- **Ne plus utiliser `/design`** pour les maquettes du site. Revenir systématiquement à la méthode classique :
  page HTML autonome avec les **vraies feuilles de style de nivcreation.fr** (récupérées avec curl), testée avec
  Chromium headless (aucun débordement, texte lisible, pas d'erreur JS) avant d'être montrée, publiée en artifact.
- Cette règle est permanente, ne pas reproposer `/design` sauf si elle le redemande elle-même.

### RÈGLE DE COMMUNICATION (importante)
- **NE PLUS répéter** les rappels SIRET / médiateur / légal : l'utilisatrice est au courant et s'en occupe elle-même. Ne pas la « contrôler ».
- Quand elle demande quelque chose : **le faire**, sans re-justifier ni multiplier les avertissements. Réponses courtes.

### MAQUETTES CRISTAL 3D SUR MESURE — ENREGISTRÉES (08/07/2026, à appliquer quand la gérante le dira)
> Deux maquettes validées en test, **sauvegardées telles quelles** dans `docs/maquettes/`. Quand la gérante dit « mets-le / applique », reproduire **EXACTEMENT** (règle maquettes). Décision : proposer **LES DEUX** (modèles prêts + photo perso), **même prix que les blocs par taille** (Petit 39,90 · Moyen 59,90 · Grand 99,90 · XL 149,90).
- **`docs/maquettes/cristal-surmesure-section.html`** : section à ajouter en haut de `/cristaux` — titre « Gravez ce que vous voulez dans le cristal », tags (Photo/Animal/Dessin/Logo/Objet — **PAS** Couple&famille, déjà couvert par les blocs photo), 3 étapes, **galerie de 8 exemples** (cœur, sirène, dessin enfant, baleines, oiseaux, colibri, portrait, objet/échecs — images fournies par la gérante, IMG_9083..9089 + 8958), 2 cartes format (vertical/horizontal) → boutons vers les blocs.
- **`docs/maquettes/cristal-configurateur.html`** : configurateur d'achat — le client choisit un **modèle prêt** (les 8) OU **« Ma propre photo »**, puis **format** (vertical/horizontal) + **taille** (prix des blocs), aperçu à gauche, total + « Ajouter au panier ». À brancher au panier/paiement existant (modèle prêt = achat direct ; photo perso = upload comme les blocs actuels).
- **À vérifier côté gérante** : que le fournisseur peut produire ces modèles (cœur, sirène, échecs… = modèles standards, normalement oui).

### MAQUETTE EN ATTENTE — NOUVEAU THÈME « L'ÉCRIN » (enregistrée le 06/07/2026, à appliquer PLUS TARD)
> La gérante a demandé d'**enregistrer la maquette telle quelle** pour l'appliquer plus tard. Quand elle dira « applique le nouveau thème » : **reproduire EXACTEMENT** cette maquette (règle ci-dessous), sans réinventer.
- **Fichier** : `docs/maquettes/theme-ecrin.html` (autonome, images intégrées — ouvrir dans un navigateur pour revoir). Artifact : https://claude.ai/code/artifact/3e4f0c71-7b5c-4288-84cf-831970af0ab7
- **Contenu** : 2 vues avec boutons de bascule en haut — 🛍️ le SITE (accueil) et ⚙️ l'ADMIN (Gestion).
- **Principe** : mêmes couleurs de marque (or #c9a24b/#a98935/#e2c67e, crème #fbf7ee/#f3e8d3, encre #1a1206/#241a0c), nouveau décor « écrin de bijouterie ».
- **Site** : bandeau d'entrée SOMBRE (encre + halo or, photo cristal dans cadre doré double filet + reflet balayant + trait laser qui se grave sous le titre) · ruban marquee doré défilant (France ✦ 4,9/5 ✦ Europe…) · univers en mosaïque asymétrique 4 photos avec zoom au survol · cartes produit à cadre fin doré (photo zoome, carte se soulève, liseré blanc intérieur au survol) · 3 étapes « Comment ça marche » (bord haut doré) · avis en grande citation serif italique qui tourne toutes les ~5 s · bande finale sombre « Sur mesure » · apparitions douces au scroll (IntersectionObserver `.rv/.in`), `prefers-reduced-motion` respecté.
- **Admin** : menu latéral SOMBRE groupé (vraies rubriques de /gestion) avec pastilles dorées de compteurs · « Bonjour 👋 » + 4 tuiles chiffres (liseré or à gauche, tabular-nums) · commandes avec chips de statut (À préparer sable/or, À graver mauve, Expédiée verte, Livrée grise) · stock en barres (orange = bas, rouge RUPTURE) · panneau « À faire aujourd'hui » · panneau Assistant. Mobile : menu horizontal défilant.

### RÈGLE — RESPECTER LES TESTS / MAQUETTES VALIDÉS (TRÈS IMPORTANTE, demande explicite)
- Quand une **maquette / un test** (artifact) est validé par la gérante, il faut le **REPRODUIRE FIDÈLEMENT** sur le vrai site — **copier** le rendu du test, juste **l'adapter** aux couleurs/structure du site. NE PAS réinventer un rendu différent, sinon « les tests ne servent à rien ».
- **TESTER SOI-MÊME le rendu** (rendu HTML → screenshot via Chromium headless : `/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --screenshot=...`) AVANT de dire à la gérante que c'est bon. Ne pas lui faire vérifier chaque détail.
- Ex. aperçu cristal 3D : la photo du client s'affiche dans un **bloc de verre** (comme la maquette `apercu-fiche-cristal.html`) : verre bleuté clair + `mix-blend-mode:luminosity` + `filter:grayscale(1) contrast(1.18) brightness(1.12)` opacity .74 + reflet animé. Le grand aperçu remplace l'image du haut dès l'upload (`.crystal-hero` dans `ProductDetail.jsx`).

### Reste à faire avant l'ouverture publique
- **Ouvrir le site au public** : décocher « Activer le code d'accès » dans gestion → Apparence (site encore privé en attendant).
- **SIRET** : `105 914 774 00010` renseigné dans Mentions légales + CGV (fait le 25/06/2026).
- **Catégories & ordre (admin)** : page `/gestion → Catalogue → 🗂️ Catégories & ordre` (`TaxonomyAdmin.jsx`). L'utilisatrice peut ajouter/renommer/supprimer/réordonner les catégories ET sous-catégories, et réordonner les produits dans chaque catégorie (flèches ▲▼ + Enregistrer). Stocké en base (`taxonomy` dans le blob catalogue, via `getTaxonomy`/`saveTaxonomy`), repli sûr sur le code (`CATEGORIES`/`SUBCATEGORIES` de products.js). La boutique fusionne via `src/lib/taxonomy.js` (`resolveCategories`/`resolveSubcategories`/`resolveProductOrder`/`makeProductSorter`). NB : renommer ne change que le libellé, pas l'identifiant (slug) — la logique produit (bijoux −10 %, crystal3d…) reste intacte.
- **Bijoux** : prix de référence à +25 % ; re-appliquer la remise −20 % (Promotions → Remise rapide) pour retomber sur les prix d'origine.
- Finir photos + stocks sur les produits restants.

### MIGRATION FIREBASE — EN COURS DE BASCULE DNS (maj 11/06/2026 soir)
- Netlify a atteint 100 % des minutes de build → migration vers **Firebase App Hosting**.
- Code prêt : stockage commutable via `DATA_BACKEND=firestore` (Firestore, cache 60 s, Storage pour .glb), `apphosting.yaml`, routes `/api/admin/export` + `/api/admin/import`.
- **Le site Netlify reste EN LIGNE et prend les commandes pendant toute la migration.** Ne PAS définir `DATA_BACKEND` sur Netlify.

**FAIT (Firebase App Hosting opérationnel) :**
- Backend `niv-creation` en `europe-west4`, Node 24, projet `niv-creation` (n° 619294563828), plan Blaze.
- URL Firebase : **`https://niv-creation--niv-creation.europe-west4.hosted.app`** — testée OK (commande + paiement + annulation + remboursement fonctionnent).
- 8 secrets créés dans Secret Manager + accès accordé via `firebase apphosting:secrets:grantaccess` (l'IAM manuel ne suffit PAS — toujours utiliser la CLI).
- `STRIPE_SECRET_KEY` : l'ancienne était révoquée → recréée dans Stripe, mise à jour (version valide `sk_live_`, compte `acct_1Te7Ku0So3AjxkUO`).
- Webhook Stripe Firebase créé (`/api/stripe/webhook`, events completed/expired/payment_failed) → `STRIPE_WEBHOOK_SECRET` mis à jour.
- Données migrées une fois (export Netlify → import Firebase : 7 sections catalogue).
- Bug corrigé : label custom_field cadeau > 50 car. (limite Stripe) — commit `493f10d`.

**BASCULE DNS — FAITE (vérifiée le 26/06/2026).** `nivcreation.fr` ET l'adresse `…hosted.app` renvoient désormais le MÊME backend Firebase (en-tête `cache-tag: 619294563828:niv-creation` sur les deux → projet niv-creation). Il n'y a donc plus qu'UN seul backend en ligne (Firebase/Firestore). Reste à VÉRIFIER/CONSOLIDER : une commande tombée sur l'ANCIEN Netlify juste avant la bascule peut ne pas être dans Firestore — à recopier si elle existe (export Netlify → import Firebase).

**Historique — BASCULE DNS (domaine chez HOSTINGER, pas OVH ni Netlify) :**
- DNS géré sur **hpanel.hostinger.com** → nivcreation.fr → DNS / Serveurs de noms. (NS = `dns-parking.com`.)
- Étape 1 FAITE : TXT `fah-claim=016-02-eb4357c4-...` + CNAME `_acme-challenge_goaabsql7whIflx` ajoutés et **propagés** (vérifiés OK). Reste à cliquer « Valider les enregistrements » dans Firebase.
- Étape 2 À FAIRE = LA BASCULE : remplacer l'ALIAS `@ → apex-loadbalancer.netlify.com` par l'IP Firebase **`35.219.200.110`** (+ retirer les A Netlify `75.2.60.5` / `99.83.231.61`). C'est CE changement qui bascule le trafic.
- **AVANT la bascule : refaire une migration données Netlify → Firebase** (récupérer dernières commandes/stock). À faire à une heure creuse.
- **APRÈS la bascule : VÉRIFIER LES COMMANDES SUR LES DEUX BACKENDS** (Netlify Blobs + Firestore) car pendant la propagation DNS des commandes peuvent tomber sur l'un ou l'autre. Consolider le tout côté Firebase. ← demande explicite de l'utilisatrice.
- NB : la remise bijoux est désormais **dans le code** (−10 % permanent, catalog.js) — la ligne « +25 % / −20 % » ci-dessus est obsolète.

### Actions externes en attente (à faire par l'utilisatrice — RAPPELER si elle demande « où on en est »)
- **Google Merchant Center** (gratuit, visibilité Google Shopping) : créer le compte, vérifier le site, puis ajouter le flux **`https://nivcreation.fr/flux-google.xml`** (Produits → Flux → Flux planifié). Le flux est déjà généré par le site.
- **Stripe → Webhooks** : cocher l'événement **`checkout.session.expired`** (nécessaire pour la relance e-mail des paniers abandonnés — déjà codée).
- **Resend** : vérifier le domaine `nivcreation.fr` (SPF/DKIM/DMARC) pour que les e-mails arrivent en boîte de réception et pas en spam.

### Fenêtre « Ajouter / Modifier un produit » enrichie (maj 26/06/2026)
> Inspirée des systèmes des autres apps (Crafia / app de gestion Niv) mais **adaptée au site** (modèle products.js).
Briques dans `src/components/admin/ProductFormParts.jsx` (`MarginBox`, `EngravingBuilder`, `SeasonalFields`, `makeTierVariant`), branchées dans `ProductsAdmin.jsx` (création ET édition). Stockage : champs `cost`, `lowStockThreshold`, `seasonal`, `personalizationFields` gérés dans `catalog.js` (applyOverride) + route `/api/admin/catalog` (sanitizers `sanitizePersonalizationFields`/`sanitizeSeasonal`).
- **Coût + marge en direct** : champ coût → marge €/% + voyant (pas de « prix conseillé » trompeur : le bois coûte ~0 €, le prix se fixe au marché/temps).
- **Gravure configurable** : ajouter/réordonner les champs (texte, texte long, choix, police, couleur, photo, note) avec libellé/facultatif/maxLength/options. En édition, l'override `personalizationFields` n'est envoyé QUE si modifié (préserve les produits à `engravingPricing` complexes — avertissement affiché).
- **Tarifs dégressifs** : bouton « + Tarif dégressif (lot) » → génère une variante « Lot de N (X €/pièce) ».
- **Stock** : seuil d'alerte `lowStockThreshold`. **Saisonnier** : `seasonal {name,start,end,hideOutOfSeason}` → masqué hors période (récurrence annuelle MM-JJ, filtré dans `getCatalog`).
- **Mise en avant accueil** : case `featured` (override) → page d'accueil lit les produits `featured` (repli `FEATURED_FALLBACK` dans `src/app/page.jsx`).

### Fonctionnalités livrées (rappel)
Modèles 3D (.glb) téléversables · suivi de colis (admin + cliente + e-mail) · commandes
(annuler/supprimer/rembourser/livrée + filtres/recherche) · assistant (masquer, prix, textes,
ajout/suppression, stock, promos) · boutique rangée par thème · remise rapide par catégorie ·
prix conseillé · bouton accueil « Idées cadeaux ».

## 12. ÉQUIPE D'AGENTS IA (maj 13/06/2026)
> Développé sur la branche `claude/multi-agent-system-unx3q2`, déployé en fast-forward sur la
> branche du site `claude/site-product-overview-1t2de`. Accès : **/gestion → Réglages →
> Équipe d'agents → « Ouvrir le centre des agents »** (page dédiée `/gestion/agents`).

**Moteur réutilisable** : `src/lib/agents/registry.js` (objet `AGENTS` + `runAgent` + `triageIncomingEmail`).
Pour ajouter un agent : une entrée dans `AGENTS` (consigne + outils). Même clé `ANTHROPIC_API_KEY`.
Fichiers liés : `/api/admin/agents` (liste + exécution), `/gestion/agents/page.jsx` (UI : vue
d'ensemble, espace par agent, page récap « Comment ça marche »), `/api/admin/social/publish`
(Instagram), autonomie e-mail branchée dans `/api/contact`, réglages dans `getSettings`
(`agents.emailAutoReply`, `social.igUserId/igToken`).

**Agents actifs** : 🧭 Chef (orchestrateur, délègue) · ✉️ E-mail (AUTONOME : répond seul aux
cas simples, remonte les cas spéciaux « à valider ») · ⭐ Avis · 📣 Newsletter · 🎨 Marketing
(prépare le post + publie sur Instagram si compte connecté) · 🛠️ Technicien/Dev (diagnostic +
fiche ; le vrai code est fait par Claude Code) · 📊 Rapport (sur les vraies commandes).

**Principe** : cas simples en autonomie, cas spéciaux toujours remontés. Rien ne casse le site
(bloc isolé, désactivable). Pour RETIRER les agents : supprimer `src/lib/agents/`,
`src/app/api/admin/agents`, `src/app/api/admin/social`, `src/app/gestion/agents`, l'onglet
« agents » dans `/gestion/page.jsx`, et le bloc autonome dans `/api/contact/route.js`.

### AGENTS AUTOMATIQUES (maj 24/07/2026)
- **Agent e-mail autonome** : déjà codé. S'active via l'interrupteur `agents.emailAutoReply` (Gestion → Équipe d'agents). Quand ON, `/api/contact` appelle `triageIncomingEmail` → répond SEUL aux cas simples (envoi Resend) et remonte les cas spéciaux « à valider ». Laissé OFF par défaut (la gérante teste avant). Réglage « live » (Firestore) — pas modifiable depuis le code.
- **Rapport / Newsletter / Marketing automatiques** : endpoint **`/api/cron/agents?token=CRON_SECRET`** (`src/app/api/cron/agents/route.js`). Lance les agents `rapport`/`newsletter`/`marketing` (ou un seul avec `&task=`) et **envoie le résultat par e-mail à la gérante** (`BRAND.contact`) pour relecture — rien n'est diffusé aux clients/Instagram sans elle. À planifier via **Google Cloud Scheduler** (comme `/api/cron/birthdays`), 1×/semaine. Nécessite `CRON_SECRET` (secret Firebase) + `ANTHROPIC_API_KEY` (déjà là). Post Instagram auto = seulement quand le compte IG Business sera connecté (sinon le brouillon arrive par mail).

### 🛡️ SURVEILLANCE AUTOMATIQUE DU CATALOGUE (maj 31/07/2026)
> Détecte les produits mal configurés (incohérents avec les autres) : **bijou sans emballage**,
> **sans photo**, **sans prix** (important) + **sans fiche détaillée** (mineur). Répond à la demande
> de la gérante « les agents doivent surveiller et détecter tout seuls ».
- **Cœur** : `src/lib/catalogAudit.js` (`auditCatalog()` read-only + `auditSummaryText()` + `importantIssueCount()`).
- **API admin** : `GET /api/admin/catalog-audit` → `{ issueCount, issues:[{slug,name,type,severity,message}], … }`.
- **Automatique (e-mail)** : tâche `sante` dans `/api/cron/agents` — lancée avec « tout » (cron hebdo) ou
  `&task=sante`. **Alerte la gérante par e-mail UNIQUEMENT s'il y a des points importants** (pas pour les
  fiches mineures). Nécessite `CRON_SECRET` (déjà là pour les autres crons).
- **Agent Technicien** : `needsAudit:true` → il connaît l'état du catalogue ; la gérante peut lui demander
  « vérifie le catalogue » à tout moment.
- **Règle liée** : §10 point 4bis — un nouveau bijou DOIT être configuré comme les autres (packaging inclus).
  C'est cette surveillance qui rattrape un oubli.
- **🔧 CORRECTION AUTOMATIQUE (maj 31/07/2026)** : `defaultPackagingFor(product)` dans `src/lib/packaging.js`
  attribue un emballage par défaut à TOUT bijou selon son type (collier / bracelet homme-long /
  bracelet femme-fin / autre), même sans config. Appliqué dans `getCatalog` (affichage) ET reconnu par
  l'audit → **impossible d'oublier le packaging d'un bijou**, la correction est structurelle (pas besoin
  d'un agent qui répare après coup). De plus `getSettings` FUSIONNE la config de départ du code avec les
  réglages enregistrés (`{ ...DEFAULT_PRODUCT_PACKAGING, ...enregistré }`) → un nouveau bijou est couvert
  même si la gérante a déjà enregistré la page Packaging. La visibilité côté client reste pilotée par
  l'interrupteur maître `settings.packagingLive`.

### EN ATTENTE côté utilisatrice (RAPPELER si elle demande « il reste quoi »)
- **Montage / visuel / fichier 3D** : elle DOIT fournir un produit (photo + nom) → Claude le
  génère à la demande avec ses outils (génération image/vidéo/3D). ← promis, à faire quand elle l'envoie.
- **Publication Instagram auto** : connecter un compte Instagram Business + jeton Meta longue
  durée (perms `instagram_basic` + `instagram_content_publish`) dans le panneau « Publier sur
  Instagram ». Tant que non connecté : l'agent prépare le post, elle publie elle-même (bouton Copier).
- **Auto-réponse e-mail** : codée et déployée mais **OFF par défaut**. À activer via l'interrupteur
  dans le centre des agents quand elle est prête (elle teste avant).
- **Agent téléphone** : non construit — nécessite un compte Twilio payant + numéro dédié.
- **Option** : bouton « Générer le 3D » in-app (auto) → nécessiterait une API 3D payante.

### À FAIRE PLUS TARD — 2 branchements optionnels (le site marche très bien sans, RIEN ne casse)
> L'utilisatrice a dit « on fait plus tard, pas de souci si pas fait ». Ne pas la presser. NB : le connecteur de
> son APPLI Claude ≠ le branchement du SITE ; il faut les clés ci-dessous dans Firebase pour le site.

1. **Étude de marché — recherche gratuite (Tavily)** : page `/gestion/etude-marche` déjà en ligne (menu Marketing).
   Pour activer la recherche gratuite, elle doit mettre la clé Tavily dans Firebase :
   `firebase apphosting:secrets:set TAVILY_API_KEY` puis
   `firebase apphosting:secrets:grantaccess TAVILY_API_KEY --backend niv-creation`
   (clé `tvly-…` sur tavily.com → API Keys). PUIS me prévenir → je RÉACTIVE le bloc `TAVILY_API_KEY`
   commenté dans `apphosting.yaml`. Sécurité en place : sans la clé, le bouton refuse de lancer une recherche
   payante (pas de prélèvement surprise). En attendant, le fichier Excel de l'étude est déjà fourni.

2. **Gmail → agents (réponses mails clients, JAMAIS d'envoi auto, validation obligatoire)** : à construire.
   Elle veut le VRAI Gmail branché ET garder le formulaire (les deux). Côté Google (gratuit, une fois) :
   créer projet Google Cloud → activer Gmail API → ID client OAuth (Desktop) → OAuth Playground avec scope
   `https://mail.google.com/` → récupérer **Client ID + Client secret + Refresh token**. Elle me donne les 3
   (ou les met en secrets) → je construis la page admin « Boîte mail (agent) » : l'agent lit les mails, prépare
   un brouillon, elle clique « Envoyer » / « Modifier » — jamais d'envoi automatique.

## 13. À FAIRE PAR L'UTILISATRICE — liste consolidée (maj 24/06/2026)
> Récap des actions qui restent **côté utilisatrice** (à faire quand elle veut). Tout le code est prêt.

### Priorité / quand elle veut
- [ ] **Générateur sur-mesure en qualité « pro » (payant)** : créer un compte **OpenAI** + une **clé API**, puis soit
  mettre le secret Firebase `OPENAI_API_KEY` (puis grantaccess), soit me demander d'ajouter un **champ admin** pour la coller.
  Tant que pas de clé → le générateur **gratuit** (Pollinations) fonctionne (0 €). Page : `/sur-mesure` (démo, pas encore au menu).
- [ ] **Remise anniversaire 100 % automatique** : définir le secret `CRON_SECRET` (Firebase) + créer un **planificateur
  Google Cloud Scheduler** (gratuit) qui appelle 1×/jour `https://nivcreation.fr/api/cron/birthdays?token=CRON_SECRET`.
  En attendant : le **semi-auto** est déjà dans le CRM (encadré « 🎂 Anniversaires à venir » + bouton).
- [ ] **Publier la page « Projet sur mesure »** : quand elle valide la démo `/sur-mesure`, me dire → je l'ajoute au menu.
- [ ] **Activer le bandeau SOLDES** quand voulu : Apparence → Bandeau & pop-ups → « ✦ Bandeau SOLDES » (texte + dates).

### Déjà en attente (rappels des sections précédentes)
- [ ] **Ouvrir le site au public** : décocher « code d'accès » (Apparence → Accès & état) si encore privé.
- [ ] **Stripe → activer l'événement `checkout.session.expired`** (relance paniers abandonnés).
- [ ] **Resend** : vérifier le domaine `nivcreation.fr` (SPF/DKIM/DMARC) pour éviter les spams.
- [ ] **Google Merchant Center** : ajouter le flux `https://nivcreation.fr/flux-google.xml`.
- [ ] **Instagram Business** : connecter pour la publication auto (sinon l'agent prépare, elle publie).
- [ ] **Tavily** : clé `TAVILY_API_KEY` (Firebase) pour l'étude de marché en ligne (optionnel).
- [x] **SIRET** : `105 914 774 00010` ajouté dans Mentions légales + CGV (fourni le 25/06/2026).

### À TESTER (côté utilisatrice, quand elle veut)
- [ ] **Demande sur mesure → devis → commande automatique** (verres gravés + mariage) :
  1. Sur une fiche verre/mariage, bouton **« Faire une demande particulière »** → le client écrit + envoie → elle reçoit l'e-mail.
  2. **Gestion → Devis & factures** : créer un devis, recopier la demande dans le champ **« Demande du client / à fabriquer »**, mettre le prix.
  3. Payer le devis (test à 1 €) → vérifier que : devis passe en **« Payé »**, **commande créée** dans Gestion → Commandes avec l'encadré bleu **« 📋 Sur mesure — ce que le client a demandé »**, e-mail **« 🛎️ Commande »** reçu, et **adresse + téléphone** bien demandés au paiement.

### À me confirmer (côté Claude, en attente de sa réponse)
- [ ] **Règle de remboursement (palier du milieu)** : après 24 h, est-ce **retenue de 10 €** (mis par défaut) ou **−10 %** ?
  (L'indicateur auto sur chaque commande affiche « retenue de 10 € » pour l'instant.)

### FAIT récemment (pour info)
- Google Analytics branché (ID `G-RMBERKLVN9` collé) · Webhook Stripe réparé + anti-doublon (session + paiement) ·
  Boîte mail Gmail connectée (lecture + brouillon + envoi sur validation) · Compteur visites intégré ·
  Couverts enfants personnalisés PUBLIÉS (34,90 € port offert, éditeur par couvert) · CRM enrichi
  (campagne remise, anniversaires, tags, graphique CA, relance) · Bandeau Soldes animé · Page sur-mesure (démo).

## 📚 PAGES « IDÉES & CONSEILS » — EN LIGNE (19/08/2026)
> 9 pages de conseil pour le référencement Google, validées puis mises en ligne à la demande
> de la gérante. Adresses : `/idees` (sommaire) + `/idees/<slug>`.
- **Source = les maquettes validées** `docs/maquettes/guide-*.html`. **NE JAMAIS réécrire le contenu
  à la main dans le code** : on modifie la maquette, puis on relance **`node tools/generer-guides.mjs`**
  qui régénère `src/lib/guidesContent.js` (contenu + questions fréquentes extraites). Le générateur
  rend les liens internes, encadre le tableau des prix (défilement mobile) et refuse un lien absolu oublié.
- **Fichiers** : `src/lib/guides.js` (liste, titres/descriptions Google, `getGuide`, `guidePourProduit`) ·
  `src/lib/guidesContent.js` (GÉNÉRÉ) · `src/app/idees/page.jsx` (sommaire) ·
  `src/app/idees/[slug]/page.jsx` (guide + fil d'Ariane + données structurées FAQ) ·
  styles `.guide*` à la fin de `src/app/globals.css` (couleurs du site, aucune couleur en dur).
- **Où on les voit** : menu du haut (« Idées & conseils »), colonne du bas de page, lien discret sous
  chaque fiche produit (`guidePourProduit` choisit le guide selon la catégorie ; aucun lien si rien ne
  correspond), et `sitemap.xml`.
- **Ajouter un guide** : créer la maquette dans `docs/maquettes/`, l'ajouter à `MAP` dans
  `tools/generer-guides.mjs`, ajouter son entrée (slug, nav, title, description, `auto`) dans
  `GUIDES` (`src/lib/guides.js`), régénérer, `npm run build`.
- **🔄 AUTOMATIQUE — RIEN À REFAIRE QUAND LE CATALOGUE CHANGE (19/08/2026, demande de la gérante)** :
  les guides n'ont **AUCUN produit recopié en dur**. Le générateur ne garde que les identifiants
  (slug) + la petite phrase d'accroche ; **nom, photo et PRIX sont lus dans le catalogue en direct**
  (`getCatalog()`) à chaque affichage. Conséquences :
  · un prix changé dans Gestion (ou une promo) se met à jour tout seul sur les guides ;
  · un produit **masqué/supprimé disparaît** des guides → jamais de lien mort ni de vieux prix ;
  · un **nouveau produit se range tout seul DANS LA BONNE SECTION** du guide de sa famille
    (un nouveau collier femme rejoint « Les colliers gravés », un bracelet rejoint « Les
    bracelets à personnaliser »). Règle `auto` par guide (`{category, subcategory, motCle}`
    dans `src/lib/guides.js`, fonction `produitsEnPlus`), puis placement par
    `repartirNouveaux` (`src/lib/guideHtml.js`) : même catégorie + même sous-catégorie +
    même **famille** (1er mot du type/nom : collier, bracelet, verre, lampe…), max 2 par
    section. Ce qui ne trouve pas sa place va en bas sous « Nos autres modèles à découvrir ».
    L'étiquette « Nouveau dans l'atelier » n'est mise que si le produit porte vraiment le
    badge « Nouveau » (sinon « À découvrir ») — on n'annonce pas une fausse nouveauté.
  · ⚠️ **ne jamais écrire un NOMBRE de produits dans le texte d'un guide** (« nos quatre
    modèles ») : la grille s'agrandit toute seule. Corrigé une fois dans `guide-cadeaux-homme.html`.
  → Pour qu'un nouveau produit tombe dans le bon guide, il suffit de lui mettre la bonne
  **catégorie/sous-catégorie** (ce qui est déjà obligatoire, cf. §10 point 4bis). Rien d'autre à faire.
- ⚠️ **PIÈGE À NE PAS REFAIRE** : le guide doit être rendu en **UN SEUL bloc HTML**
  (`guideHtmlComplet` dans `src/lib/guideHtml.js`). Une première version découpait le texte pour
  insérer des composants React au milieu → les morceaux n'étaient plus des blocs HTML complets,
  le navigateur les refermait tout seul → **erreurs d'hydratation React #418/#423 sur les 9 pages**.
  Les grilles sont donc construites en HTML côté serveur (`grilleHtml`), pas en composants.
- **Vérifié avant mise en ligne** : les 9 pages en mobile (390 px) et ordinateur (1440 px) — aucun
  débordement, aucune erreur JavaScript, un seul H1 par page ; 43 images et 52 liens internes testés
  un par un ; titres/descriptions/canoniques présents ; FAQ + fil d'Ariane en données structurées.
- ⚠️ **Connu, ANTÉRIEUR à ces pages** : la page d'accueil produit des avertissements React
  d'hydratation (#425/#418/#423). Vérifié en retirant toutes les nouvelles pages : c'était déjà le cas.
  Invisible pour la cliente, à corriger séparément si la gérante le demande.

### 4 GUIDES DE PLUS + OPTION PHOTO (19/08/2026) — 13 guides au total
- Nouveaux guides (mêmes règles que les 9 autres) : `/idees/cle-usb-personnalisee-gravee` ·
  `/idees/porte-cles-piece-a-graver` · `/idees/cadeau-enfant-personnalise` ·
  `/idees/porte-stylo-bois-personnalise`. Ils couvrent les 10 produits qui n'avaient aucun guide
  → **les 55 produits ont désormais tous leur lien de conseils** (`guidePourProduit`).
- ⚠️ **Une page par produit = NON** (page pauvre pour Google, et concurrence la fiche produit).
  Un guide = un SUJET avec plusieurs produits dedans. C'est pour ça qu'on a fait 4 pages, pas 10.
- **Option « graver une photo »** ajoutée sur `piece-ronde-laiton` et `porte-cles-cuir-a-graver`
  (demande de la gérante) : un champ `select` **gravure** (Un texte / Une photo) pilote l'affichage
  via `showIfField`/`showIfValue` (mécanisme déjà présent dans `ProductDetail.jsx`). Les champs
  cachés ne sont pas exigés à l'ajout au panier (la validation ne regarde que `visibleFields`).
  ⚠️ Ne PAS écrire « (facultatif) » dans un `label` : le composant l'ajoute déjà quand `optional:true`.

## 🏠 PAGE D'ACCUEIL — NOUVELLE ORGANISATION (appliquée le 21/08/2026, validée par la gérante)
> Maquettes : `docs/maquettes/accueil-mur-tout-en-bas.html` (VERSION B, appliquée) et
> `accueil-vient-d-arriver.html` (version A, gardée de côté). La gérante tient au haut de
> page (cristal + carafe) : **ne pas y toucher**.
- **Ordre** : cristal → carafe édition limitée → bandeau **« Vient d'arriver »** (4 derniers
  produits par date, automatique) → bandeau **« Verres & carafes gravés »** (5 produits fixes :
  whisky portrait, whisky perso, vin, flûte, carafe — lus dans le catalogue en direct) → page
  inchangée (collections, phares, savoir-faire, sur-mesure) → **« mur de l'atelier »** tout en
  bas (TOUTES les créations visibles, 3 rangées qui défilent ; arrêt au survol/toucher, reprise
  auto après 4 s sans clic) → fenêtre flottante nouveautés.
- **Fichiers** : `src/components/home/BandeauAccueil.jsx` (+ `prixBandeau`) ·
  `src/components/home/MurAtelier.jsx` (client, JS pause/reprise) · CSS `.na-*` / `.mur-*` à la
  fin de `globals.css` · branchés dans `src/app/page.jsx` (l'ancienne grande section « Nos
  nouveautés » a été SUPPRIMÉE — elle faisait double emploi et cachait les verres).
- **Dates produits** : `src/lib/productDates.js` (retrouvées dans git). Étiquette « Nouveau »
  auto-éteinte à 30 jours dans `getCatalog` (catalog.js). Cf. règle §10 4ter.
- **Interrupteurs** : `settings.sections.newArrivals` (bandeau nouveautés), `.verresBand`,
  `.mur` — tous par défaut à vrai.
- ⚠️ Les avertissements React #425/#418/#423 de l'accueil sont ANTÉRIEURS (déjà documentés),
  vérifiés identiques avant/après.

## 🔍 « VÉRIFIE MON SITE » — AUDIT COMPLET AUTOMATIQUE (créé le 13/08/2026)
> **Quand la gérante dit « vérifie mon site », « est-ce que tout va bien », « fais un audit »** →
> lancer **`node tools/audit-site.mjs`** et lui rendre le résultat en français, court et clair.
> Ne PAS improviser une vérification à la main : l'outil existe pour que rien ne soit oublié.

```
node tools/audit-site.mjs              # audit complet (~1 min avec la compilation)
node tools/audit-site.mjs --rapide     # sans compiler le code (~20 s)
node tools/audit-site.mjs --paiement   # teste EN PLUS le paiement Stripe (aucun prélèvement)
node tools/audit-site.mjs --site https://autre-adresse
```
**Ce qu'il contrôle (lecture seule, ne modifie rien)** : 1) les 21 pages du site (+ vitesse) ·
2) TOUTES les fiches produits du plan Google · 3) TOUTES les photos produits (~360, détecte une
photo cassée) · 4) les services : frais de livraison, promos, avis, stock, **points relais Boxtal**,
**paiement Stripe** · 5) la cohérence du catalogue (doublons d'identifiants = panier cassé, prix
manquant, produit sans photo, fiche détaillée manquante, produits masqués) · 6) la compilation du code.
- **Photos** : une photo en échec est **re-testée une seconde fois, plus lentement** avant d'être
  signalée (les hébergeurs bloquent parfois les requêtes rapprochées → faux positifs).
- **Sortie** : ✅ tout va bien · ⚠️ points à surveiller · ❌ problèmes à corriger (+ code de sortie 1).
- **Piège connu** : Next.js insère le texte « Page introuvable » dans TOUTES les pages (composant
  404 embarqué) → ne jamais détecter une erreur avec ce texte, se fier au **code HTTP**.
- **Dernier audit (13/08/2026)** : ✅ tout fonctionne, aucun problème (83-85 vérifications).
- **Correctif issu de cet audit (13/08/2026)** : `src/app/sitemap.js` était **figé à la compilation**
  → un produit masqué depuis l'admin (`bougeoir-mandala-bois`) restait annoncé à Google (erreur 404)
  et un nouveau produit n'y apparaissait qu'au déploiement suivant. Corrigé par
  `export const dynamic = "force-dynamic"` (même méthode que `flux-google.xml`, déjà dynamique).
  ⚠️ `export const revalidate = …` n'est PAS pris en compte sur `sitemap.js` (reste ○ Static au
  build) — utiliser `force-dynamic`. Vérifié en ligne : 74 → 73 adresses, le produit masqué a disparu.

## ✅ RÈGLE — TOUTE PROMESSE FAITE À LA CLIENTE DOIT MARCHER POUR DE VRAI (14/08/2026)
> Suite à la découverte que **le code BIENVENUE10 promis par e-mail était refusé au paiement**
> (il n'existait que comme TEXTE d'affichage). Avant d'annoncer quoi que ce soit à une cliente
> (code promo, livraison offerte, cadeau…), **vérifier que le mécanisme existe côté serveur** —
> et le tester en ligne (`/api/promo-validate`, panier réel), pas seulement lire le code.
- **Codes promo automatiques** : `ensureWelcomeCode()` / `ensureReferralCode()` (`src/lib/stock.js`)
  créent le vrai code promo à partir des réglages (`settings.welcome` / `settings.referral`), en
  déduisant la remise du texte (« −10 % » → percent 10 ; « −5 € » → fixed 5). Appelés depuis
  `/api/newsletter` (inscription), `/api/promo-validate` (saisie au panier) et le webhook Stripe
  (code de parrainage dans l'e-mail de commande). **Ne JAMAIS écraser un code déjà réglé à la main**
  dans Promotions : si le code existe, on n'y touche pas. Vérifié en ligne le 14/08 → `valid:true, −10 %`.
- **LIVRAISON OFFERTE = les DEUX modes.** Le seuil bijoux (45 €) ne s'appliquait qu'au domicile :
  le **point relais restait facturé 4,90 €** malgré la promesse affichée. Corrigé dans
  `buildShippingOptions` (`portOffert = freeShipping || bijouxOffert`), libellé « — Offerte ».
  Les colis lourds (cristaux, déco) restent facturés normalement (vérifié cas par cas).
- **Panier mixte** : un produit `freeShipping:true` (couverts enfants) annulait la gratuité au
  seuil d'un produit `freeShipThreshold` (carafe) → port facturé alors que les DEUX fiches
  promettent la livraison offerte. Corrigé dans `/api/checkout` (un produit toujours offert ne
  bloque plus le seuil des autres).
- **Rupture de stock** : le paiement d'un article épuisé était possible (page produit grisée
  seulement côté navigateur). `/api/checkout` refuse désormais avant paiement, **même règle que
  l'affichage** (seules les variantes suivies numériquement sont contrôlées). Important vu la règle
  « produit personnalisé jamais remboursé » : on ne veut pas encaisser ce qu'on ne peut pas fabriquer.

## 🏖️ MODE VACANCES — CONSTRUIT ET ÉTEINT (15/08/2026, à activer SEULEMENT sur demande)
> La gérante part bientôt en vacances. **Tout le mécanisme est en place mais ÉTEINT**
> (`settings.vacation.enabled = false` par défaut). **NE JAMAIS l'activer sans sa demande explicite**
> (« active le mode vacances du … au … »). Maquette validée : `docs/maquettes/mode-vacances.html`
> (artifact https://claude.ai/code/artifact/d84e78d4-0f30-440f-b6d5-9d4a52cea804).
- **Principe** : la boutique RESTE OUVERTE (jamais fermée — ventes + référencement préservés) ; le délai
  est annoncé partout : bandeau haut de site (`layout.jsx`), encart fiche produit + panier
  (`VacationNotice.jsx`, alimenté par `/api/shipping-config` → `vacation: null` si éteint), et
  paragraphe dans l'e-mail de confirmation cliente (webhook Stripe). Logique : `src/lib/vacation.js`.
- **Réglage** : Gestion → Apparence → « 🏖️ Mode vacances » — case Activer + 3 dates (début, fin,
  reprise des expéditions) + message personnalisé (sinon message auto avec les dates) + option
  **🎁 cadeau** (« un petit cadeau glissé dans chaque commande passée pendant les congés »).
  Avec les dates, s'allume/s'éteint TOUT SEUL (jour de fin inclus).
- **Pour activer** : cocher dans l'admin OU régler `settings.vacation` (enabled + dates). Vérifié :
  éteint → `vacation:null`, rien nulle part ; le build passe ; rendu réel testé (fiche + panier).

## 14. NOUVEAU PRODUIT — GOBELET ISOTHERME 40 oz À GRAVER (en préparation, 18/07/2026)
> Nouvelle gamme : grand gobelet isotherme 40 oz (1,1 L) type « Stanley » (acier inox double paroi, anse + paille), **gravure laser personnalisée**. Maquette validée en cours, **PAS ENCORE EN LIGNE** (attend « applique »).
- **Titre validé** : « Gobelet isotherme 40 oz à graver ». Catégorie envisagée : Boutique / Cadeaux (à confirmer).
- **Prix** : recherche marché faite (Amazon basique ~20 € ; Etsy gravé artisanal 30–45 €). **Reco = 34,90 €** (option prix barré 39,90 €). **En attente du choix de la gérante.**
- **4 coloris**, chacun avec **3 photos** (Vierge / Gravé exemple / Accessoires inclus) — déjà classées :
  - **Crème** : IMG_9303 (vierge) · IMG_9304 (gravé floral) · IMG_9305 (accessoires)
  - **Blanc** : IMG_9308 (vierge, liseré arc-en-ciel) · IMG_9309 (gravé « Follow the Stars ») · IMG_9310 (accessoires)
  - **Bleu marine** : IMG_9295 (vierge) · IMG_9296 (gravé « The Future is Bright ») · IMG_9297 (accessoires)
  - **Rose** : IMG_9299 (vierge) · IMG_9300 (gravé floral, anse rose) · IMG_9301 (accessoires)
  - NB : les rendus gravés « Follow the Stars » / « The Future is Bright » sont des **textes anglais de démo** (à valider ou remplacer).
- **Accessoires inclus** (visibles sur les photos accessoires) : paille inox + paille coudée, goupillon de nettoyage, couvercle avec bouchon, joint/stoppeur paille, petit tournevis.
- **Maquettes faites** (scratchpad, à refaire/committer si besoin) : fiche produit (galerie vierge/gravé/accessoires + sélecteur 4 coloris + zone gravure + « Ajouter au panier »), Avant/Après gobelet & carafe, récap couleurs. Style marque or/crème. Mention **« Gravé en France »** (PAS « fait main » : elle grave, elle ne fabrique pas le gobelet).
- **Carafe à whisky** : même logique Avant/Après (vierge → gravé) existe aussi (IMG_9312 vierge / IMG_9414 gravé démo).

### TÂCHE EN COURS — CATALOGUE DE DESSINS GRAVABLES (18/07/2026)
> On va proposer aux clients une bibliothèque de **motifs/dessins gravables** (fleurs, animaux, etc.) au choix sur le gobelet. La gérante envoie des **planches d'exemples avec des NUMÉROS** sur chaque dessin.
- **Ma mission** : pour **chaque numéro**, retrouver **UN PAR UN l'image d'origine / source téléchargeable** (haute déf) pour qu'elle puisse la télécharger.
- Limite technique : pas d'outil de recherche par image inversée → je procède par description du motif + recherche web ; certains motifs (packs connus, motifs courants) seront trouvables, d'autres non. Toujours procéder **un dessin à la fois**, dans l'ordre des numéros.

### OUTIL DE NUMÉROTATION DES PLANCHES — MÉTHODE VALIDÉE (22/07/2026)
> La gérante numérote elle-même les motifs (elle sait où sont les vrais motifs). Ne plus deviner les emplacements.
- **Outil interactif** (artifact) : page web où elle **clique sur chaque motif** pour poser un numéro (auto-incrément), glisse pour ajuster, double-tap pour supprimer. Champ **« Départ n° »** pour continuer la numérotation d'une planche à l'autre. Généré par script Python (image en base64 data-URI + JS canvas). Fichier type : `scratchpad/outil-numerotation.html`.
- **⚠️ Le téléchargement direct bloque sur iPhone.** La méthode fiable = bouton **« 📋 Copier le code »** → elle colle le code ici → JE régénère l'image finale avec Pillow (badges = cercle rouge #d32f2f, contour blanc, r≈W×0.032) et je l'enregistre/renvoie.
- **Workflow par planche** : (1) nouvelle planche → rebâtir l'outil (même URL, republish) avec l'image dedans ; (2) elle met « Départ n° » = numéro suivant (continuité) ; (3) elle pose les numéros + « Copier le code » ; (4) je rends l'image finale.
- **Compteur** : Planche « couples » = 1–9 (test). Planche « fleurs/papillons » IMG_9549 = **1–10** (placements de la gérante, enregistrée). **Prochaine planche : continuer à partir de 11.**

### MAQUETTES GOBELET + CARAFE — VALIDÉES, À REPRODUIRE À L'IDENTIQUE (23/07/2026, demande explicite)
> **Les 2 maquettes sont validées et enregistrées. Quand la gérante dira « mets sur le site » : les REPRODUIRE EXACTEMENT telles quelles — NE RIEN CHANGER, juste ADAPTER à la structure/couleurs du vrai site.** Ne pas « améliorer », ne pas réinventer. Et (règle générale) : **ne jamais modifier/republier ces maquettes sans son accord.**
> - **Gobelet** : `docs/maquettes/gobelet-configurateur-final.html` · artifact https://claude.ai/artifact/JzxuttEeyZSDymLM17BVas
>   - Fiche = grande photo → 3 vignettes → **couleurs (sous les photos, à gauche)** cliquables (chaque couleur change la grande photo + les 3 vignettes). Configurateur « Composez votre gravure » : onglets **Dessins (1-74)** · **Cadres & banderoles (75-103)** · **Lettre fleurie (A→Z)** · **Texte seul (25/09)**. Image principale obligatoire d'abord (un dessin OU un texte seul peuvent être ce premier élément). Numéros affichés sur le gobelet 3D flottant. **56-60 retirés des Dessins (c'étaient des cadres) ; Dessins renumérotés 1-74 ; cadres passés en 75-103 → zéro doublon.**
>   - ✅ **CORRIGÉ LE 25/09/2026** (demande du gérant : « c'est marqué jusqu'à quatre éléments inclus… tu mets juste un élément » + « ajoute pour que les gens puissent graver un prénom ou un texte tout seul, comme pour les autres produits, avec les polices ») :
>     1. **Quota ramené de 4 à 1 élément inclus, supplément passé à 3 € (25/09 soir, « comme pour les autres gravures »)** — la note dit maintenant « Le premier élément est inclus dans le prix — chaque élément en plus : +3 € » (le compteur passe direct à « X en plus : +3 €, +6 €… » dès le 2ᵉ élément, quel que soit son type : dessin, cadre, lettre ou texte). Aligné sur le supplément de gravure des bijoux (`textExtra: 3`).
>     2. **Nouvel onglet « Texte seul »** (4ᵉ onglet, à côté de Dessins / Cadres & banderoles / Lettre fleurie) : le client tape juste un prénom, une date ou un mot — sans dessin ni cadre — et **peut être le tout premier élément** (comme « Dessins », il n'a pas besoin d'un motif posé avant).
>     3. **Vrai sélecteur de police** (le champ « Police de gravure » était un faux `.sel` statique, jamais branché) : les **8 écritures du site** (`src/lib/fonts.js` : playfair, cinzel, cinzel-deco, montserrat, inter, great-vibes, allura, pacifico), avec un **aperçu texte en direct** dans la police choisie, et **appliquée à la gravure 3D** (canvas) pour tout élément texte (texte seul, cadre, lettre). Polices chargées via Google Fonts dans la maquette (le site utilise déjà ces polices en `next/font`).
>   - Testé en local (Chromium headless) : 4 onglets, bascule « Texte seul » cache bien planches/n°/champs de cadre, compteur « 1 / 1 inclus » puis « 1 en plus : +2,90 € » au 2ᵉ élément, les 8 polices listées, aperçu qui change de police. Rien appliqué au site — reste une **maquette**, en attente de son « mets en ligne » (gobelet toujours `hidden:true`).
> - **Carafe** : `docs/maquettes/carafe-fiche.html` · artifact https://claude.ai/code/artifact/58331379-1fae-43c8-9bc1-bc7f1d308240
>   - **Prix : 54,90 € livraison offerte** (net, pas de fausse remise). Styles numérotés 1-33 (dont Lettre fleurie n°33), champs Prénom/Nom/Initiale/Rôle/Date, **police par défaut du site** (le nom reprend l'écriture du modèle décoré), aperçu en direct. **Option coffret verres assortis** (carafe + 2/4 verres gravés au même style, verre 24,90 € en coffret au lieu de 26,90 €, **prix barré réel**, livraison offerte). **Jack Daniel's écarté** (marque déposée) → n°32 « Whisky de… » à la place. Planches numérotées : `docs/planches-carafe/`.
> - **Verre à vin gravé** : `docs/maquettes/verre-vin-fiche.html` · artifact https://claude.ai/code/artifact/10717789-346d-4ef2-ab3b-45801b3a1102
>   - Verre cristal Montese 36 cl (coût d'achat 3,05 €/verre, fournisseur Metro). **Prix : à l'unité 12,90 € + port · lot de 2 24,90 € + port · lot de 4 49,90 € livraison offerte** (livraison offerte dès **45 €** — FAIT via `freeShipThreshold: 45` par produit, cf. §6). Section « Personnalisez votre verre » : **styles numérotés 1-19** (couples, noms & dates, banderoles — planches `docs/planches-verre-vin/`), **lettre fleurie A→Z** (alphabet affiché + boutons), **8 polices du site** (identiques), aperçu en direct. **Note sous le choix de style** : pour les modèles avec prénoms (n°14-17), le prénom/date sont gravés dans l'écriture du modèle (image), pas dans la police. Photos verre : `IMG_9595/9596/9597/9598`.
> - **Verre à whisky (fiches whisky portrait + fête des pères)** : **METRO Professional Tumbler Lario 30 cl** (fournisseur **Metro**, réf `AAA0000163284`, lot de 12, **acheté — livré le 22/07/2026**, visible dans l'historique Metro). Ø 7,9 × H 9,3 cm, 300 ml, fond lourd, paroi lisse, NON trempé (idéal laser), lave-vaisselle, fabriqué en France. Correspond exactement à la fiche. Équivalent de secours si rupture : Arcoroc Islande 30 cl (réf `AAA0001186981`).
> - **Flûte à champagne gravée** : `docs/maquettes/flute-champagne-fiche.html` · artifact https://claude.ai/code/artifact/9948bdc8-7ab5-44ec-9c50-2eda30dc2c72
>   - Clone EXACT du verre à vin (mêmes réglages : styles 1-19, lettre fleurie, 8 polices, note, prix unité 12,90 €+port / lot2 24,90 €+port / lot4 49,90 € livr. offerte). Change seulement : photos (`IMG_9599 vierge / 9601 set / 9602 ambiance`) + infos (verre **21 cl**, Ø 6,3 × H 21,4 cm, lave-vaisselle ; coût Metro 2,34 €/flûte, réf Pinomaro).

### CONFIGURATEUR GOBELET — MAQUETTE FINALE ✅ RE-VALIDÉE LE 25/09/2026, À METTRE EN LIGNE SUR DEMANDE
> Maquette finale enregistrée : **`docs/maquettes/gobelet-configurateur-final.html`** (autonome, images + planches intégrées ; artifact : https://claude.ai/artifact/JzxuttEeyZSDymLM17BVas (corrigée le 25/09 : quota 1 élément inclus, onglet « Texte seul », vrai sélecteur de police)). **NE PAS mettre en ligne tant que la gérante n'a pas dit « mets en ligne ».** Le gobelet reste en produit **caché**. **Prévu comme OFFRE LIMITÉE / OFFRE SPÉCIALE** (à décider plus tard).
- **Fiche d'origine intacte** (grande photo + 3 vignettes vierge/gravé/accessoires + 4 couleurs) — ne pas y toucher. Configurateur intégré dans la carte « Composez votre gravure ». **Aperçu 3D flottant en bas à droite** qui apparaît **seulement quand le client arrive sur la personnalisation** (pas en haut de page).
- **Étape 1 obligatoire = IMAGE PRINCIPALE** (le motif du CENTRE de la FACE) : le client doit la choisir d'abord (guide orange → vert). Puis il ajoute d'autres éléments par zone (haut/bas/gauche/droite) et par côté (Face/Gauche/Droite/Tour).
- **2 familles séparées** : **« Dessins »** (motifs pleins, planches 1–79) et **« Écrire un nom »** (cadres/banderoles + **« Lettre fleurie »** = monogramme).
- **Rubrique « Écrire un nom »** = le client tape un **nom/texte au milieu** du cadre (1 ou 2 lignes selon le dessin). Numéros **56–60 DÉPLACÉS** des dessins vers ici + **nouvelles pièces numérotées à partir de 80** : planches `docs/planches/cadres_56-60`, `cadres_80-81`, `82-91`, `92-95`, `96-101`, `102-103`. **Lettre fleurie** = menu A→Z + le nom (pas de numéro par lettre).
- **Sur l'aperçu 3D : on GARDE les NUMÉROS** sur le gobelet (montrent où chaque motif est placé) + le **texte/nom** pour les cadres. Décision de la gérante : NE PAS afficher le vrai dessin du motif à la place (jugé « moche »). Le n° sert au client à choisir dans les planches.
- ✅ **Version définitive au 25/09/2026 soir** (le gérant : « enregistrer cette maquette garde en mémoire, je publierai après ») —
  la maquette inclut maintenant les 2 corrections du 25/09 (quota 1 élément inclus, +3 € par élément en plus,
  onglet « Texte seul », vrai sélecteur des 8 polices du site) EN PLUS du système « Un motif (n°) / Un texte »
  dans l'onglet Dessins, que le gérant a confirmé aimer tel quel (capture du 25/09 : ne rien y changer).
  Fichier `docs/maquettes/gobelet-configurateur-final.html`, artifact https://claude.ai/artifact/JzxuttEeyZSDymLM17BVas.
  **C'est CETTE version qu'il faut reproduire à l'identique** le jour où il dit « mets en ligne » — ne pas revenir
  aux 4 éléments inclus, ne pas retirer l'onglet Texte seul ni le sélecteur de police.
- **Reste à faire quand il dira « mets en ligne »** : intégrer tout ça dans la vraie fiche (`products.js` : rubrique « Écrire un nom » + planches cadres + onglet « Texte seul » + le champ police branché sur `src/lib/fonts.js` ; `GobeletComposer.jsx`/`GobeletPreview.jsx` : familles + champ nom + image principale obligatoire ; checkout : cadres/textes = éléments comptés comme les motifs, 1 inclus puis +3 €/élément). Reproduire FIDÈLEMENT la maquette finale.
- **COMMANDE = récap écrit + IMAGE d'aperçu (demandé par la gérante 22/07)** : chaque commande doit fournir à la gérante (1) un **récap écrit** de la composition (par élément : côté + zone + n° de motif OU texte/nom + couleur + police) dans Gestion → Commandes ET dans l'e-mail d'alerte, ET (2) une **image d'aperçu générée** (le gobelet avec les numéros/noms placés, comme la fenêtre 3D) **jointe à la commande / à l'e-mail**. Le n° renvoie aux planches numérotées pour savoir quel dessin graver.
