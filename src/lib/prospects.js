// =============================================================================
// RESTAURANTS & BARS — PROSPECTION B2B (26/09/2026, demande du gérant)
// -----------------------------------------------------------------------------
// « Tous les mails qu'on va envoyer aux restaurants, s'ils nous répondent, il
// faut qu'on détecte que c'est pour le restaurant et que ça aille
// automatiquement dans une catégorie Restaurants & bars, séparée des clients
// normaux. »
// Ce fichier = logique PURE (testée par tools/tests/prospects.mjs) : repérer
// qu'un e-mail reçu vient d'un établissement démarché, détecter une demande de
// désinscription (« STOP »), lire une liste collée (CSV). Le stockage est dans
// stock.js (section `prospects`), l'écran dans /gestion/restaurants.
// =============================================================================

export const PROSPECT_STATUTS = {
  a_contacter: "À contacter",
  envoye: "E-mail envoyé",
  repondu: "A répondu",
  invalide: "Adresse invalide (a rebondi)",
  stop: "Ne plus contacter",
};

// L'e-mail arrivé dans le même fil est-il un AVIS DE NON-DISTRIBUTION (bounce),
// pas une vraie réponse de l'établissement ? (incident du 26/09/2026 : 3
// adresses mortes — 2 déjà signalées fragiles, 1 nouvelle — comptées à tort
// comme « a répondu », avec une pastille « nouvelle réponse » trompeuse).
// Gmail/Google renvoie ces avis dans le MÊME fil que l'envoi, d'où la
// confusion avec `trouverProspect` (qui matche par threadId).
export function estAvisNonDistribution(fromEmail) {
  const e = normEmail(fromEmail);
  return /^(mailer-daemon|postmaster|mail-daemon|delivery-status|bounce)[@.]/.test(e);
}

// Messageries grand public : deux établissements différents peuvent y avoir
// une adresse → on ne rapproche JAMAIS par le domaine pour celles-là.
const WEBMAILS = new Set([
  "gmail.com", "googlemail.com", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "neuf.fr",
  "hotmail.com", "hotmail.fr", "outlook.com", "outlook.fr", "live.com", "live.fr", "msn.com",
  "yahoo.com", "yahoo.fr", "icloud.com", "me.com", "mac.com", "laposte.net", "aol.com",
  "mailo.com", "gmx.fr", "gmx.com", "proton.me", "protonmail.com", "pm.me", "bbox.fr", "numericable.fr",
]);

export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const domaineDe = (e) => normEmail(e).split("@")[1] || "";

// Retrouve l'établissement démarché qui a écrit. Trois façons, dans l'ordre :
//   1. la même adresse que celle à laquelle nous avons écrit ;
//   2. le même fil Gmail (réponse depuis une autre boîte : le patron, le gérant…) ;
//   3. le même nom de domaine professionnel (ex. contact@ → direction@bar.fr),
//      jamais pour Gmail / Orange / Hotmail…
// Renvoie la clé (adresse de l'établissement) ou "".
export function trouverProspect(prospects, { email = "", threadId = "" } = {}) {
  const all = prospects || {};
  const e = normEmail(email);
  if (e && all[e]) return e;
  const tid = String(threadId || "").trim();
  if (tid) {
    for (const [k, p] of Object.entries(all)) {
      if ((p?.threadIds || []).includes(tid)) return k;
    }
  }
  const d = domaineDe(e);
  if (d && !WEBMAILS.has(d)) {
    for (const k of Object.keys(all)) if (domaineDe(k) === d) return k;
  }
  return "";
}

// L'établissement demande à ne plus être contacté ? (mention obligatoire de
// l'e-mail : « répondez STOP »). Prudent : on regarde le DÉBUT du message
// (sa réponse, pas notre e-mail cité dessous) et des formules sans ambiguïté.
export function demandeStop(text) {
  // Seulement SA réponse : on coupe avant notre e-mail cité (lignes « > »,
  // « Le … a écrit : », « On … wrote: », « ---- Message d'origine ---- »), qui
  // contient lui-même la phrase « répondez STOP ».
  const brut = String(text || "").replace(/\r/g, "");
  const coupe = brut.search(/^\s*>|^.{0,120}(a écrit|a ecrit|wrote)\s*:|^-{2,}/im);
  const t = (coupe >= 0 ? brut.slice(0, coupe) : brut).trim().slice(0, 300)
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (!t) return false;
  if (/^[\s"'«»*.>-]*stop\b/.test(t) || /^\s*stop\s*[.!]*\s*$/m.test(t)) return true;
  if (/\b(desinscri|desabonn)/.test(t)) return true;
  if (/\bn(e\b|')[^.\n]{0,30}\b(plus|pas)\b[^.\n]{0,20}(recevoir|contacte|sollicite|ecrire)/.test(t)) return true;
  if (/(retirez|supprimez|enlevez)[^.\n]{0,40}(adresse|liste|fichier|mail)/.test(t)) return true;
  return false;
}

// Liste collée depuis un tableur : une ligne par établissement, séparateur « ; »
// ou tabulation ou « , ». Colonnes reconnues dans n'importe quel ordre grâce à
// l'en-tête (ville ; etablissement ; type ; email ; source) — sans en-tête, on
// prend la cellule qui ressemble à un e-mail et on devine le reste.
export function lireListe(texte) {
  const lignes = String(texte || "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lignes.length) return [];
  const sep = lignes[0].includes(";") ? ";" : lignes[0].includes("\t") ? "\t" : ",";
  const cellules = (l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
  const sansAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let entete = null;
  const premiere = cellules(lignes[0]).map(sansAccent);
  if (premiere.some((c) => /^e-?mail/.test(c))) entete = premiere;
  const idx = (re) => (entete ? entete.findIndex((c) => re.test(c)) : -1);
  const iEmail = idx(/^e-?mail/), iNom = idx(/^(etablissement|nom|name)/), iVille = idx(/^ville|^city/),
    iType = idx(/^type/), iSource = idx(/^source|^url|^lien/);
  const out = [];
  for (const l of entete ? lignes.slice(1) : lignes) {
    const c = cellules(l);
    const email = normEmail(iEmail >= 0 ? c[iEmail] : c.find((x) => /@/.test(x)));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    const autres = c.filter((x) => normEmail(x) !== email);
    out.push({
      email,
      name: (iNom >= 0 ? c[iNom] : autres[1] || autres[0] || "").slice(0, 120),
      ville: (iVille >= 0 ? c[iVille] : entete ? "" : autres[0] || "").slice(0, 60),
      type: (iType >= 0 ? c[iType] : "").slice(0, 80),
      source: (iSource >= 0 ? c[iSource] : c.find((x) => /^https?:\/\//.test(x)) || "").slice(0, 300),
    });
  }
  return out;
}

// Le message de prospection validé (docs/prospection/email-bars-restaurants.md),
// pré-rempli dans Messages clients par le bouton « Écrire » de l'écran.
// Le site ajoute tout seul : le titre, le bouton « Répondre » et « Niv Création ».
export const PROSPECT_SUJET = "Le logo de votre établissement, gravé sur vos verres";

// Classe le type saisi (texte libre : « Bar à cocktails », « Bar à vins / caviste »,
// « Bouchon / restaurant »…) dans une des 4 familles qui changent le texte. Un
// établissement qui coche plusieurs mots (« Restaurant et bar à cocktails ») est
// rangé dans la famille la plus vendeuse pour nous : cocktail d'abord.
function familleType(type) {
  const t = String(type || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/cocktail/.test(t)) return "cocktail";
  if (/vin|caviste|oenolog/.test(t)) return "vin";
  if (/restaurant|bistrot|bouchon|estaminet|brasserie/.test(t)) return "restaurant";
  return "autre";
}

// Paragraphe de présentation, adapté au type ET à la ville de l'établissement.
function pitchPersonnalise(type, ville) {
  const v = String(ville || "").trim();
  const laBas = v ? ` à ${v}` : "";
  switch (familleType(type)) {
    case "cocktail":
      return `Nous proposons aux bars à cocktails comme le vôtre${laBas} de graver leur logo sur les verres à cocktail servis au comptoir. C'est un détail que vos clients remarquent, qui signe chacune de leurs photos sur les réseaux, et qui donne à votre carte une vraie identité.`;
    case "vin":
      return `Nous proposons aux bars à vins et aux cavistes comme le vôtre${laBas} de graver leur logo sur leurs verres à vin. C'est un détail que vos clients remarquent à chaque dégustation, et qui donne à votre service une vraie identité.`;
    case "restaurant":
      return `Nous proposons aux restaurants comme le vôtre${laBas} de graver leur logo sur les verres servis à table. C'est un détail que vos clients remarquent, et qui donne à votre salle une vraie identité.`;
    default:
      return `Nous proposons aux bars et aux restaurants comme le vôtre${laBas} de graver leur logo sur leurs verres. C'est un détail que vos clients remarquent, qui signe chacune de leurs photos sur les réseaux, et qui donne à votre service une vraie identité.`;
  }
}

export function messageProspect(nom, { type = "", ville = "" } = {}) {
  const n = String(nom || "").trim();
  // « l'équipe du Bistro… », « des Luschtig », « de L'Agence » — jamais « de Le ».
  const qui = !n ? "toute l'équipe"
    : /^le\s/i.test(n) ? `l'équipe du ${n.slice(3)}`
    : /^les\s/i.test(n) ? `l'équipe des ${n.slice(4)}`
    : `l'équipe de ${n}`;
  return `Bonjour à ${qui},

Niv Création est un atelier français de gravure personnalisée. Nous gravons à la commande des verres à cocktail, des verres à whisky, des verres à vin et des flûtes à champagne, ainsi que des pièces en bois.

${pitchPersonnalise(type, ville)}

Au-delà des verres, nous gravons et découpons aussi le bois pour votre salle : cartes menu en bois gravées, numéros de table, découpes à votre logo.

Et il n'y a pas de limite : si vous avez une idée particulière, une pièce unique pour votre établissement, demandez-nous. Si nous pouvons la réaliser, nous la réaliserons.

Comment cela se passe :
- vous nous envoyez votre logo ou votre idée (fichier vectoriel de préférence : PDF, SVG ou AI ; une image nette convient aussi) ;
- vous nous indiquez ce qui vous intéresse et la quantité ;
- nous vous adressons nos tarifs professionnels et un devis, et la réalisation se fait dans notre atelier après votre accord.

La gravure est permanente et les verres gravés passent au lave-vaisselle.

Vous pouvez voir nos créations et des exemples de gravure sur nivcreation.fr. Il vous suffit de répondre à ce message pour recevoir nos tarifs ou un devis.

Bien cordialement,

—
Niv Création · nivcreation.fr
6 rue d'Armaillé, 75017 Paris
Vous recevez ce message à l'adresse professionnelle publiée par votre établissement. Si vous ne souhaitez plus recevoir de message de notre part, répondez simplement « STOP » : votre adresse sera retirée de notre liste.`;
}

// Tarifs professionnels — SAUVEGARDÉS, envoyés seulement SUR DEMANDE (décision
// du gérant, 26/09/2026 : « enlève les prix, tu les sauvegardes, s'ils
// demandent on enverra »). Prix par verre, logo gravé sur une face, livraison
// comprise en France métropolitaine. En dessous de 12 verres : les lots du site.
export const TARIFS_PRO = [
  { verre: "Verre à cocktail 17 cl", des12: 15.9, des24: 14.9 },
  { verre: "Flûte à champagne 21 cl", des12: 15.9, des24: 14.9 },
  { verre: "Verre à vin 36 cl", des12: 13.9, des24: 12.9 },
  { verre: "Verre à vin 47 cl", des12: 17.9, des24: 16.9 },
  { verre: "Verre à whisky 30 cl", des12: 17.9, des24: 16.9 },
];
export const TARIFS_PRO_NOTE = "Prix par verre, logo gravé sur une face, livraison comprise en France métropolitaine. Au-delà de 48 verres : sur devis. Bois (cartes menu, numéros de table, découpes, pièces uniques) : sur devis.";

// Lot 1 (26/09/2026) — 30 adresses trouvées dans des résultats de recherche
// publics (sites des établissements, annuaires). NON VÉRIFIÉES : les sites
// étaient bloqués depuis l'environnement de travail. Importées « à vérifier ».
// Détail et sources : docs/prospection/bars-restaurants-lot1.csv
export const PROSPECTS_LOT1 = [
  ["Paris", "Le Calbar", "Bar à cocktails", "info@lecalbarcocktail.com", "https://lecalbarcocktail.com/paris.html"],
  ["Paris", "Au Passage", "Bar à vins / bistrot", "baraupassage@gmail.com", "https://www.restaurant-aupassage.fr/mentions-legales/"],
  ["Paris", "Deux Point Zéro", "Bar à cocktails (peut-être fermé)", "reservation@deuxpointzerobar.com", "https://deuxpointzerobar.com/DossierPresseWeb.pdf"],
  ["Lyon", "Cactus Bar", "Bar à cocktails", "contact@cactusbar.fr", "https://www.cactusbar.fr/contact"],
  ["Lyon", "Bouchon Tupin", "Bouchon / restaurant", "contact@bouchontupin.com", "https://www.bouchontupin.com/contact-reservation/"],
  ["Lyon", "Bouchon Bât d'Argent", "Bouchon / restaurant", "contact@bouchonbatdargent.com", "https://www.bouchonbatdargent.com/evenements-groupes/"],
  ["Marseille", "Coquetel Club", "Bar à cocktails", "coquetelclub13006@gmail.com", "https://www.coquetelclub.fr/fr/conditions-generales-de-vente"],
  ["Marseille", "The Reed's", "Bar à cocktails et tapas", "thereeds13008@gmail.com", "https://www.thereeds.fr/contact/"],
  ["Marseille", "Le Verre à Cruise", "Bar à tapas et cocktails", "verreacruise@gmail.com", "https://tarpin-bien.com/lieu/le-verre-a-cruise/"],
  ["Bordeaux", "Neta", "Restaurant et bar à cocktails", "hello@neta-bordeaux.com", "https://www.neta-bordeaux.com/"],
  ["Bordeaux", "Le Bistro du Sommelier", "Bistrot", "contact@bistrodusommelier.com", "https://www.bistrodusommelier.com/mentions-legales"],
  ["Bordeaux", "The Wine Bar (Boutique Hôtel)", "Bar à vins d'hôtel", "contact@lebhb.com", "https://quoifaireabordeaux.com/the-wine-bar/"],
  ["Lille", "Quai des Bananes", "Bar à cocktails", "hello@qdblille.com", "https://quaidesbananes.fr/contact/"],
  ["Lille", "Genever Bar", "Bar à cocktails et gin", "contact@geneverbar.fr", "https://www.geneverbar.fr/contact.html"],
  ["Lille", "Le Scoop du Vieux Lille", "Restaurant / estaminet", "scoopdelille@orange.fr", "https://www.cirkwi.com/fr/point-interet/3046197-le-scoop-du-vieux-lille"],
  ["Toulouse", "L'Agence", "Bar à cocktails", "contact@lagencetoulouse.com", "https://www.lagencetoulouse.com/bar"],
  ["Toulouse", "L'Heure du Singe", "Bar à cocktails", "contact@heuredusinge.com", "https://www.heuredusinge.com/"],
  ["Toulouse", "Tempête", "Bar à cocktails / bistrot", "contact@tempete-bar.com", "https://www.tempete-bar.com/mentions-legales"],
  ["Nantes", "19:33 Cocktail Experience", "Bar à cocktails", "contact@19-33.bar", "https://www.19-33.bar/"],
  ["Nantes", "Ambrosia", "Bar à cocktails / lounge", "contact@ambrosia-nantes.com", "https://www.ambrosianantes.fr/contact"],
  ["Nantes", "Bistro Melon", "Cave à manger / bistrot", "lebistromelon@gmail.com", "https://www.bistromelon.com/"],
  ["Strasbourg", "Le Douanier", "Bar à cocktails", "hello@ledouanier.fr", "https://ledouanier.fr/reservation/"],
  ["Strasbourg", "Les Luschtig", "Bar à tapas / cocktails", "contact@les-luschtig.fr", "https://www.les-luschtig.fr/"],
  ["Strasbourg", "Vino Strada", "Bar à vins / caviste", "vinostrada@gmail.com", "https://www.vinostrada.com/en/contact"],
  ["Nice", "La Shounga", "Bar à cocktails", "contact@shounga.bar", "https://bar-shounga-nice.fr/"],
  ["Nice", "Topaze", "Bar à cocktails", "contact.topazenice@gmail.com", "https://topaze-bar.fr/en/accueil-2/"],
  ["Nice", "Chambre Noire", "Bar à cocktails", "contact@chambrenoirebar.com", "https://chambrenoirebar.com/"],
  ["Montpellier", "Aperture", "Bar à cocktails", "contact@aperturemontpellier.com", "https://aperturemontpellier.com/"],
  ["Montpellier", "TUB", "Bar à cocktails", "contact@tubmontpellier.com", "https://tubmontpellier.com/mentions-legales/"],
  ["Montpellier", "Cave des Arceaux", "Caviste / bar à vins", "contact@cave-arceaux.com", "https://cave-arceaux.com/"],
].map(([ville, name, type, email, source]) => ({ ville, name, type, email, source }));

// Lot 2 (26/09/2026, demande du gérant : « 30 c'est pas assez, cherche partout,
// trouve le plus possible ») — 92 adresses de plus, 20 villes non couvertes par
// le lot 1 + un second passage sur les 10 villes du lot 1 (établissements
// différents). MÊME RÈGLE : NON VÉRIFIÉES, vues dans des extraits de recherche
// (les sites étaient bloqués depuis l'environnement de travail) — le gérant
// vérifie avant d'écrire. Les adresses au nom d'une personne, les chaînes et
// les bars d'hôtel repérés en cours de route ont déjà été écartés.
export const PROSPECTS_LOT2 = [
  ["Rennes", "Rewined", "Bar à vin", "contact@rewined.fr", "https://www.rewined.fr/"],
  ["Rennes", "Bistrot L'Arrivée", "Bistrot", "contact@bistrotlarrivee.com", "https://bistrotlarrivee.com/contact/"],
  ["Rennes", "IMA", "Restaurant", "contact@ima.restaurant", "https://ima.restaurant/"],
  ["Rennes", "Restaurant La Réserve", "Restaurant", "lareserve.rennes@gmail.com", "https://restaurant-lareserve-rennes.fr/"],
  ["Rennes", "La Tonnelle à Vins", "Restaurant / bar à vin", "contact@latonnelleavins.fr", "https://www.latonnelleavins.fr/"],
  ["Grenoble", "House Deep Cocktails", "Bar à cocktails", "bookings@housedeepcocktails.com", "http://housedeepcocktails.com/"],
  ["Grenoble", "La Vinothèque des Alpes", "Bar / cave à vin", "contact@lavinothequedesalpes.fr", "https://www.lavinothequedesalpes.fr/fr/vinotheque"],
  ["Grenoble", "Restaurant L'Inattendu", "Restaurant", "contact@restaurant-linattendu.fr", "https://restaurant-linattendu.fr/"],
  ["Grenoble", "Le Bistrot Parisien", "Bistrot", "grillparisien@gmail.com", "https://www.lebistrotparisien-grenoble.fr/en/"],
  ["Grenoble", "La Belle Idée", "Restaurant / brasserie", "la.belle.idee38@gmail.com", "https://labelleideegrenoble.fr/contact"],
  ["Dijon", "Cave Vauban", "Restaurant / bar à vin", "contact@cavevauban.com", "https://www.cavevauban.com/"],
  ["Dijon", "Bistrot des Tramways", "Bistrot", "bistrotdestramways@bbox.fr", "https://restaurant-bistro-des-tramways-dijon.fr/fr"],
  ["Dijon", "Le Bistrot de Norges", "Restaurant", "contact@lebistrotdenorges.fr", "https://lebistrotdenorges.fr/fr/"],
  ["Dijon", "L'Archipel", "Bar à cocktails", "hello@larchipel.bar", "https://larchipel.bar/contactez-l-archipel-a-dijon/"],
  ["Dijon", "Le Chat qui Fume", "Bar à cocktails", "contact@lechatquifumedijon.fr", "https://www.lechatquifumedijon.fr/mentions-legales"],
  ["Toulon", "L'Eautel", "Bar à cocktails / restaurant", "contact@leautel-toulon.com", "https://www.leautel-toulon.com/fr/bar-a-cocktail-toulon"],
  ["Toulon", "Le Canon des Halles", "Cave / bar à vin", "lacavhalles@gmail.com", "https://commercesdetoulon.com/commerces/le-canon"],
  ["Toulon", "Street Bar", "Bar à cocktails", "streetbartoulon@gmail.com", "https://streetbar.fr/"],
  ["Toulon", "Le Bistrok", "Bistrot", "lebistroktoulon83@gmail.com", "https://lebistrok.com/contact/"],
  ["Toulon", "Chai St-Vincent", "Caviste / bar à vin", "contact.chaisv@gmail.com", "https://www.facebook.com/ChaiStVincentToulon/"],
  ["Aix-en-Provence", "El Primo", "Bar à tapas, vins & cocktails", "contact@elprimo.fr", "https://elprimo.fr/restaurant-el-primo-bar-tapas-vins-cocktails-aix-en-provence/nous-contacter-restaurant-el-primo/"],
  ["Aix-en-Provence", "Faubourg 46", "Restaurant / bar", "contact@faubourg46.fr", "https://www.faubourg46.fr/"],
  ["Aix-en-Provence", "Licandro Le Bistro", "Bistrot", "licandrolebistro@gmail.com", "https://www.licandrolebistro.com/accueil"],
  ["Aix-en-Provence", "Les Baratineurs", "Restaurant / bar à cocktails", "lesbaratineursaix@gmail.com", "https://www.les-baratineurs-restaurant-aix-en-provence.com/"],
  ["Aix-en-Provence", "Il était une fois", "Restaurant", "aix.iletaitunefois@hotmail.com", "https://www.iletaitune-fois.fr/en/address-contact/"],
  ["Tours", "La Manufacture", "Restaurant / bar à cocktails", "lamanufacturetours@gmail.com", "https://www.la-manufacture-tours.fr/"],
  ["Tours", "La Niche", "Bar à cocktails & brunch", "laniche37+reservation@gmail.com", "https://lebarlaniche.fr/contacts.html"],
  ["Tours", "Bistrot 22", "Bistrot / bar à vin", "contact@bistrot22-tours.com", "https://www.bistrot22-tours.com/"],
  ["Tours", "Le Super 9", "Bar restaurant", "contact@lesuper9.com", "https://www.lesuper9.fr/contact.html"],
  ["Tours", "Ô Lieudit Vin", "Bar à vin / caviste", "olieuditvin@gmail.com", "https://olieuditvin.com/"],
  ["Clermont-Ferrand", "Carmela", "Bar mexicain / cocktails", "contact@carmela-clermont.fr", "https://carmela-clermont.fr/"],
  ["Clermont-Ferrand", "L'Ostrog", "Bar à vins & cocktails / restaurant", "contact@lostrog-clermontferrand.fr", "https://www.lostrog-clermontferrand.fr/"],
  ["Clermont-Ferrand", "Vins sur 20", "Bar à vin", "clermont@vins-sur-20.fr", "https://www.facebook.com/Vinssur20Clermont/"],
  ["Clermont-Ferrand", "LBV - La Belle Vie", "Bar à tapas, vins & bières", "info@lbv-clermont.fr", "https://www.lbv-clermont.fr/contacts/"],
  ["Clermont-Ferrand", "Le Bistrot d'à Côté", "Bistrot", "contact@restaurant-bistrotdacote.fr", "https://restaurant-bistrotdacote.fr/"],
  ["Rouen", "Le Charleston", "Bar à cocktails", "charleston.rouen@gmail.com", "https://www.le-charleston.fr/contactez-nous"],
  ["Rouen", "Après mon premier", "Bar / bistrot", "bistrot.monpremier@gmail.com", "https://www.facebook.com/monpremierbarbistrot/"],
  ["Nancy", "Vins et Tartines", "Bistrot / caviste-restaurant", "contact@vins-et-tartines.com", "https://maisons-mengin.com/fr/etablissement/vins-et-tartines/"],
  ["Nancy", "Vindiou", "Bar à vin", "vindiou.nancy@gmail.com", "https://www.facebook.com/vindiounancy/"],
  ["Nancy", "L'Echanson", "Bar à vin", "contact@echanson-nancy.com", "http://www.echanson-nancy.com/informations.html"],
  ["Nancy", "Les Pissenlits", "Restaurant / bistrot", "contact@les-pissenlits.com", "https://www.les-pissenlits.com/en/access-contact-us.html"],
  ["Nancy", "Le Comptoir Saint Michel", "Bistrot-brasserie", "contact@lecomptoirstmichel.com", "https://www.lecomptoirstmichel.com/contact"],
  ["Metz", "Le Bistronome", "Bistronomique", "bistronomemetz@gmail.com", "https://le-bistronome-metz.fr/"],
  ["Metz", "Le Parvis", "Restaurant", "contact@leparvismetz.com", "https://www.leparvismetz.com/"],
  ["Metz", "Le Bistrot de G", "Restaurant traditionnel", "contact@restaurant-bistrotdeg.com", "https://restaurant-bistrotdeg.com/contact.html"],
  ["Metz", "Bottle Bar", "Bar à vin & cocktails", "contact@bottlebar.fr", "https://www.pagesjaunes.fr/pros/62403180"],
  ["Metz", "Au Cul d'Poule", "Bistronomique", "auculdpoule@hotmail.com", "https://www.auculdpoule.fr/en/address-contact/"],
  ["Besançon", "La Buvette du Conservatoire", "Bar à vins et cocktails", "labuvetteduconservatoire@gmail.com", "https://labuvetteduconservatoire.fr/"],
  ["Besançon", "Le Saint-Pierre", "Restaurant gastronomique", "lesaintpierre2@wanadoo.fr", "https://www.restaurant-saintpierre.com/contact"],
  ["Besançon", "LauMas", "Restaurant bistronomique", "laumasrestaurant@hotmail.com", "https://restaurant-laumas.com/reservation/"],
  ["Biarritz", "Le Rendez-vous des Halles", "Bar festif / cocktails", "contact@lerdvdeshalles.fr", "https://lerdvdeshalles.fr/bar-festif-biarritz-halles/"],
  ["Biarritz", "Café des Artistes", "Bar-restaurant / brasserie", "cafedesartistesbiarritz@gmail.com", "https://www.cafedesartistesbiarritz.com/"],
  ["Biarritz", "Bar Jean (Les Halles)", "Bar à tapas / restaurant", "barjeanbiarritz@gmail.com", "https://barjean-biarritz.fr/nous-contacter/"],
  ["Biarritz", "California Kitchen", "Pub / bar à bières", "contact@california-kitchen.com", "https://californiakitchen.fr/contactez-nous/"],
  ["Biarritz", "Le Surfing", "Brasserie / bar en bord de mer", "lesurfing.btz@gmail.com", "https://www.destination-biarritz.fr/restaurant/le-surfing/"],
  ["Avignon", "Le Bistrot d'Avenio", "Bistrot", "contact@bistrot-avenio.fr", "https://bistrot-avenio.fr/"],
  ["Avignon", "Restaurant Sevin", "Restaurant gastronomique", "contact@restaurantsevin.fr", "https://www.restaurantsevin.fr/contact.html"],
  ["Avignon", "Vinotage", "Bar à vin (péniche)", "vinotage.avignon@gmail.com", "https://www.vinotage-avignon.fr/en/"],
  ["Avignon", "Carré du Palais", "Bar à vin / restaurant", "contact@carredupalais.fr", "https://www.carredupalais.fr/"],
  ["Avignon", "Hiély-Lucullus", "Restaurant gastronomique", "contact@hiely-lucullus.com", "https://www.hiely-lucullus.com/"],
  ["La Rochelle", "Ze'Bar", "Cave à manger / bar à vin", "contact@zebar-larochelle.fr", "https://www.zebar-larochelle.fr/contact/"],
  ["La Rochelle", "Baron Moleskine", "Restaurant / bar à cocktails", "coopbistrotiere@gmail.com", "https://www.baronmoleskine.com/"],
  ["La Rochelle", "Bistrot de Mémé", "Bistrot", "bistrotdememe@gmail.com", "https://bistrot-de-meme17.fr/fr/page/contact"],
  ["La Rochelle", "Bistrot d'la chaîne", "Bistrot", "bistrotdlachaine@gmail.com", "https://www.bistrotdelachaine.com/en/address-contact/"],
  ["La Rochelle", "Bistrot des Pêcheurs", "Restaurant poissons / fruits de mer", "contact@lespecheurs.fr", "https://www.lespecheurs.fr/"],
  ["Caen", "Bar'Barque", "Bar-restaurant (viande)", "chezbarbaque@gmail.com", "https://barbaque-caen.fr/contact/"],
  ["Caen", "Bistro Régent", "Bistrot (adresse @gmail.fr inhabituelle, à revérifier)", "bistroregent14@gmail.fr", "https://bistro-regent.fr/fr/restaurant/bistro-regent/caen"],
  ["Caen", "Âmbar", "Bar à manger", "reservationambarcaen@gmail.com", "https://ambarcaen.com/contact-et-reservation/"],
  ["Caen", "Le Bistrot Basque", "Bistrot (cuisine basque/espagnole)", "bistrotbasquecaen@gmail.com", "https://www.caenlamer-tourisme.com/affaires-restaurants/le-bistrot-basque/"],
  ["Caen", "Balthazar Caen", "Bar à vin / restaurant", "contact@balthazar-caen.com", "https://balthazar-caen.com/"],
  ["Perpignan", "Le Grabuge", "Bar à vins naturels", "grabuge.nanobrasserie@gmail.com", "https://www.raisin.digital/fr/le-grabuge-21382/"],
  ["Perpignan", "Le Bar à Lait", "Restaurant / crèmerie-bar", "contact@lebaralait.com", "https://www.lebaralait.com/contact"],
  ["Perpignan", "Bistrot Côte Cour", "Restaurant traditionnel", "bistrotcotecour@sfr.fr", "https://www.perpignanmediterranee-tourisme.com/en/restaurant/le-bistrot-cote-cour/"],
  ["Perpignan", "Al Tapas (Halles Vauban)", "Bar à tapas", "altapas@yahoo.com", "https://perpignan.resto-avenue.fr/Restaurant/Al-Tapas-Perpignan"],
  ["Perpignan", "La Casa de Tapas", "Restaurant traditionnel / bar à tapas", "lacasadetapas66@gmail.com", "https://www.alentoor.fr/perpignan/restaurant/1937899-la-casa-de-tapas"],
  ["Paris", "Parisian Cocktail Club", "Bar à cocktails", "hello@parisiancocktailclub.com", "https://parisiancocktailclub.com/mentions-legales"],
  ["Paris", "Le 153", "Bar à cocktails", "commercial@le153.com", "https://www.le153.com/en"],
  ["Paris", "Bistrot Beaubourg", "Bistrot", "bistrot.beaubourg@free.fr", "https://bistrot-beaubourg-restaurant-paris.eatbu.com/"],
  ["Paris", "Terra Bar à Vins", "Bar à vin", "baravins.terra@gmail.com", "https://www.terrabaravins.fr/mentions-legales/"],
  ["Lyon", "Micro Sillon", "Bar à vin / cave à manger", "microsillonlyon@gmail.com", "https://www.microsillon-cave.fr/en/"],
  ["Marseille", "Primo Amore", "Restaurant italien", "contact@amore-primo.com", "https://www.restaurant-primoamore.fr/mentions-legales"],
  ["Bordeaux", "OST Bordeaux", "Bar-restaurant", "hello@ostbordeaux.com", "https://www.ostbordeaux.com/en/"],
  ["Lille", "Rituel", "Bar-restaurant (petit groupe, à confirmer indépendant)", "contact@rituelgroup.fr", "https://rituel-bar-restaurant-lille.fr/mentions-legales/"],
  ["Nantes", "Nomad Nantes", "Bar / tapas / cocktails", "contact@nomad-nantes.com", "https://www.nomad-nantes.com/mentions-legales/"],
  ["Nantes", "Bibou", "Bistrot de quartier / bar à vin", "contact@bibou.family", "https://www.bibou.family/"],
  ["Nantes", "ZAW", "Café-restaurant", "contact@zaw-nantes.com", "https://zaw-nantes.com/"],
  ["Toulouse", "Maison Sarment", "Bar à vin", "contact@maisonsarment.com", "https://maisonsarment.com/pages/contact"],
  ["Toulouse", "Barallel", "Bar à vin & bière (micro-brasserie)", "contact@barallel.com", "http://m.barallel.com/"],
  ["Strasbourg", "Alsace à boire", "Bar à vin & caviste", "contact@alsaceaboire.fr", "https://alsaceaboire.fr/bar-boutique/"],
  ["Nice", "Les Bons Vivants", "Cave à manger & bar à vin bio/nature", "contact@lesbonsvivantsnice.com", "https://lesbonsvivantsnice.com/"],
  ["Montpellier", "Le Verre à Soi", "Bar à vin", "montpellier@verre-a-soi.fr", "https://www.verre-a-soi.fr/"],
  ["Montpellier", "Le FaV", "Bar à vin", "contact@lefav.fr", "https://lefav.fr/"],
].map(([ville, name, type, email, source]) => ({ ville, name, type, email, source }));


// Lot 3 (26/09/2026, suite de « cherche partout ») — 85 adresses de plus, dans
// 24 villes non couvertes par les lots 1 et 2. MÊME RÈGLE : NON VÉRIFIÉES.
export const PROSPECTS_LOT3 = [
  ["Angers", "La Cour", "Bar / restaurant", "contact@lacour-angers.com", "https://www.lacour-angers.com/"],
  ["Angers", "L'Angevigne", "Bar à vin", "langevigne@gmail.com", "https://langevigne.fr/mentions-legales/"],
  ["Angers", "La Cave du Doyenné", "Bar à vin", "cavedoyenne49@orange.fr", "https://cave-du-doyenne-angers.fr/mentions-legales/"],
  ["Angers", "Bistrot de l'Industrie", "Bistrot", "reservationbdi19@gmail.com", "https://bistrotdelindustrie.fr/"],
  ["Angers", "La Bougeotte", "Bistrot", "labougeotte.angers@gmail.com", "https://la-bougeotte-angers.eatbu.com/"],
  ["Reims", "Aroma Bar - Restaurant", "Bar / restaurant", "aromareims@aroma-baramanger.com", "https://www.aroma-baramanger.com/mentions-legales"],
  ["Reims", "Le Foch", "Restaurant / bar à vin", "contact@lefoch.com", "https://www.lefoch.com/contact-us/"],
  ["Reims", "L'Atelier Entrecôte et Volaille", "Brasserie", "contact@latelierev.com", "https://latelierev.com/fr-fr/reims"],
  ["Reims", "L'Apostrophe", "Brasserie", "lapostrophe.reims@gmail.com", "https://lapostrophe-reims.com/"],
  ["Reims", "L'Expérience", "Restaurant / bar à cocktails", "reims@lexperience-rd.com", "https://www.lexperience-reims.fr/"],
  ["Le Mans", "La Table de Luc", "Restaurant", "contact@latabledeluc.fr", "https://latabledeluc.fr/"],
  ["Le Mans", "Le Bistrot des Jacobins", "Bistrot (adresse iCloud, à vérifier de près)", "l-ange-noir7@icloud.com", "https://le-bistrot-des-jacobins.eatbu.com/"],
  ["Orléans", "Restaurant Eugène", "Restaurant", "restauranteugene45@gmail.com", "https://www.restauranteugene.fr/"],
  ["Orléans", "Merci", "Bar à cocktails (vu sur Facebook seulement, à vérifier)", "contact@mercibar.fr", "https://www.facebook.com/mercibarcocktails/"],
  ["Poitiers", "Oh ! Le Bistro", "Bistrot", "contact@ohlebistro.fr", "https://ohlebistro.fr/mentions-legales/"],
  ["Poitiers", "Cave Rocinante", "Bar à vin", "contact@cave-rocinante.fr", "https://www.cave-rocinante.fr/contact/"],
  ["Poitiers", "Le Bistrot Gourmand", "Bistrot", "le-bistrot-gourmand86@orange.fr", "annuaire local"],
  ["Poitiers", "Le Bistro de l'Absynthe", "Bistrot", "absynthe86@sfr.fr", "annuaire local"],
  ["Saint-Étienne", "Chimère", "Restaurant bistronomique & bar à cocktails", "contact@restaurantchimere.fr", "https://restaurantchimere.fr/"],
  ["Saint-Étienne", "Le Jean Jaurès", "Café-bar-restaurant", "contact@lejeanjaures.com", "https://www.lejeanjaures.com/"],
  ["Saint-Étienne", "Le Balafon", "Pub cocktails / restaurant exotique", "purestolebalafon@gmail.com", "https://lebalafon.fr/"],
  ["Saint-Étienne", "Nota Bene", "Restaurant", "restaurant.nota.bene.42@gmail.com", "https://www.notabene42.com/"],
  ["Saint-Étienne", "Café Saint-Jacques", "Bar à vin / café", "contact@cafesaintjacques.com", "https://cafesaintjacques.com/contact/"],
  ["Limoges", "Bistrot Le Maréchal", "Bistrot", "bonjour@bistrotlemarechal.fr", "https://bistrotlemarechal.fr/nous-contacter/"],
  ["Limoges", "Au Bacchus", "Bar à vin / tapas", "contact@au-bacchus.fr", "https://au-bacchus.fr/"],
  ["Limoges", "Les Quilles de Saint Martial", "Bar à vin naturel / caviste", "lesquillesdesaintmartial@gmail.com", "https://vinsnaturels-limoges.fr/"],
  ["Limoges", "Le Bistrot de Léon", "Restaurant / bistrot", "lebistrotdeleon@orange.fr", "https://www.le-bistrot-de-leon-restaurant-limoges.fr/"],
  ["Limoges", "Le Bistrot des Halles", "Bistrot", "lebistrotdeshalles.87@gmail.com", "https://lebistrotdeshalles87.fr/"],
  ["Villeurbanne", "Le Tourbillon de la Vigne", "Cave à manger / bar à vin", "letourbi@gmail.com", "https://www.raisin.digital/fr/le-tourbillon-de-la-vigne-23295/"],
  ["Villeurbanne", "Le Shrubbery", "Bar (jeux de société, bières, vins)", "contact@leshrubbery.fr", "https://leshrubbery.fr/"],
  ["Villeurbanne", "Bryan's Café", "Pub irlandais / brasserie", "bryanscafe69@gmail.com", "https://www.bryanscafe.fr/"],
  ["Villeurbanne", "Bar Kulte", "Bar festif / vins & tapas", "info.kultebar@gmail.com", "https://www.flashopvins.fr/"],
  ["Nîmes", "Wine Bar Le Cheval Blanc", "Restaurant / bar à vin", "winebar@wanadoo.fr", "https://www.winebar-lechevalblanc.com/"],
  ["Nîmes", "C Unik", "Restaurant tapas / bar à vin & huîtres", "contact@c-suites.fr", "https://www.c-suites.fr/restaurant-nimes-tapas-vins-cigares"],
  ["Nîmes", "Gard Ô Vin", "Bar à vin", "gardovin@gmail.com", "https://www.facebook.com/gardovin.nimes/"],
  ["Nîmes", "Entre 2 Tapas", "Bar à tapas", "entre2tapas@gmail.com", "https://restaurant.entre2tapas.fr/"],
  ["Béziers", "Bistrot de l'Hôtel de Ville", "Restaurant / bar à tapas", "contact@bistrotbeziers.fr", "https://bistrotbeziers.fr/"],
  ["Béziers", "Le Tribeca", "Bar tapas musical", "contact@tribecabeziers.fr", "https://www.tribecabeziers.fr/contact"],
  ["Béziers", "Le Victor", "Brasserie bistronomique / bar à cocktails", "contact@levictor-beziers.fr", "https://levictor-beziers.fr/"],
  ["Béziers", "Brasserie du Midi", "Brasserie", "brasseriedumidi34@gmail.com", "https://brasserie-du-midi.metro.rest/"],
  ["Annecy", "Alpine Bar", "Bar à cocktails", "contact@alpine-bar.com", "https://www.alpine-bar.com/contact.html"],
  ["Annecy", "Society Bar", "Bar à cocktails", "contact@societybar.fr", "https://www.societybar.fr/"],
  ["Annecy", "Mazette", "Bistrot / cuisine de marché", "contact@mazette-restaurant.com", "https://www.mazette-restaurant.com/"],
  ["Annecy", "Le 7 Bistrot Perriere", "Bistrot", "contact@le7perriere.fr", "https://le7bistrotperriere.com/"],
  ["Annecy", "Ebo Annecy", "Bar / restaurant", "contact@ebo-annecy.fr", "https://ebo-annecy.fr/contact/"],
  ["Chambéry", "Le Bistrot", "Restaurant bistronomique", "contact@restaurant-lebistrot.com", "https://www.restaurant-lebistrot.com/contact/"],
  ["Chambéry", "La Maniguette", "Bar à vin naturel & restaurant", "contact@lamaniguette.fr", "https://www.lamaniguette.fr/contact.html"],
  ["Chambéry", "HC Restaurant", "Restaurant / vin bio", "contact.chambery@hc-restaurant.com", "https://hc-restaurant.com/contact.html"],
  ["Chambéry", "Maison de Savoie", "Brasserie (depuis 1929)", "contact@maisondesavoie73.fr", "site officiel maisondesavoie73.fr"],
  ["Chambéry", "Le Grand Joseph", "Brasserie", "grandjoseph73@gmail.com", "page Facebook officielle"],
  ["Colmar", "Au Temps d'un Verre", "Bar à vin", "contact@autemps-d1verre.fr", "https://www.autemps-d1verre.fr/"],
  ["Colmar", "L'Un des Sens", "Bar à vin", "contact@lun-des-sens.alsace", "https://www.lun-des-sens.alsace/bar-a-vins/"],
  ["Colmar", "Bar L'Augustin", "Bar à vin", "contact@laugustin.fr", "site laugustin.fr"],
  ["Colmar", "Caveau Saint-Pierre", "Restaurant / brasserie alsacienne", "info@caveausaintpierre-colmar.fr", "https://caveausaintpierre-colmar.fr/"],
  ["Colmar", "Meistermann", "Restaurant / brasserie", "info@meistermann.com", "https://www.meistermann.com/contact/"],
  ["Mulhouse", "L'Oxalis", "Brasserie", "contact@brasserie-loxalis.fr", "https://www.brasserie-loxalis.fr/contact/"],
  ["Mulhouse", "Le Petit Paris", "Restaurant bistronomique", "info@lepetitparis.pro", "site lepetitparis.alsace"],
  ["Mulhouse", "Diamonds", "Bar à thème / cocktails", "info@diamondsbars.com", "https://www.diamondsmulhouse.com/contact"],
  ["Mulhouse", "Le Rustique", "Restaurant traditionnel", "lerustiquemulhouse@gmail.com", "https://restaurant-lerustique.fr/contact/"],
  ["Mulhouse", "L'Entrecôte de Mulhouse", "Restaurant", "entrecotedemulhouse@gmail.com", "https://lentrecote68.fr/contact/"],
  ["Amiens", "Network", "Bar à cocktails", "nw.amiens@gmail.com", "site network-bar-amiens.fr"],
  ["Amiens", "Ail des Ours", "Restaurant gastronomique", "aildesoursrestaurant@gmail.com", "https://www.aildesours-restaurant.fr/en/address-contact/"],
  ["Amiens", "Barrio", "Restaurant / bar à tapas & vins", "lebarrio@gmail.com", "https://www.barrio-amiens.fr/en/address-contact/"],
  ["Amiens", "Le Port Saint Leu", "Restaurant traditionnel", "contact@portsaintleu.fr", "https://www.portsaintleu.fr/mentions-legales/"],
  ["Amiens", "Delirium Café", "Bar / brasserie", "contact@deliriumcafeamiens.fr", "Facebook + site officiel"],
  ["Cannes", "Bobo Bistro", "Restaurant", "contact@bobobistrocannes.com", "https://bobobistro.com/"],
  ["Cannes", "La Cave Cannes", "Bar à vin / cave à manger", "contact@lacavecannes.com", "https://www.lacavecannes.com/contact/"],
  ["Cannes", "Restaurant Cannelle", "Restaurant", "contact@cannelle-cannes.com", "https://restaurant-cannelle-cannes.com/"],
  ["Cannes", "L'Éponyme", "Bistrot", "contact@leponyme-cannes.com", "https://www.leponyme-cannes.com/"],
  ["Cannes", "Le Bistrot Gourmand", "Restaurant", "lebistrotgourmand.cannes@gmail.com", "https://www.bistrotgourmandcannes.fr/"],
  ["Antibes", "Les Vieux Murs", "Restaurant", "contact@lesvieuxmurs.com", "https://www.lesvieuxmurs.com/"],
  ["Antibes", "Le Fricot", "Restaurant", "contact@lefricot.fr", "https://restaurant-lefricot-antibes.fr/"],
  ["Antibes", "L'Arazur", "Restaurant", "restaurant@larazur.fr", "https://www.larazur.fr/"],
  ["Antibes", "Le Vauban", "Restaurant", "contact@levauban.fr", "https://www.levauban.fr/"],
  ["Antibes", "Maison de Bacon", "Restaurant", "qualite@maisondebacon.fr", "https://www.maisondebacon.fr/"],
  ["Deauville", "Le Point Bar", "Bar d'ambiance", "contact@le-point-bar.com", "http://www.le-point-bar.com/"],
  ["Deauville", "L'Étage Deauville", "Restaurant / bar à vin", "restaurant@etagedeauville.com", "https://etagedeauville.com/"],
  ["Deauville", "Chez Miocque", "Bistrot / restaurant", "contact@chez-miocque-deauville.com", "http://www.chezmiocque-deauville.com/"],
  ["Deauville", "L'Équilibriste", "Bar à cocktails", "lequilibristedeauville@gmail.com", "https://www.lequilibriste-deauville.com/"],
  ["Deauville", "La Flambée", "Restaurant", "restaurant.laflambee@wanadoo.fr", "https://www.laflambee-deauville.com/"],
  ["Bayonne", "Au Bouchon Basque", "Restaurant / bistrot", "contact@aubouchonbasque.fr", "https://aubouchonbasque.fr/"],
  ["Bayonne", "Brasserie Basa", "Restaurant / bar à vin", "contact@brasserie-basa.com", "https://www.brasserie-basa.com/"],
  ["Bayonne", "Le Chistera", "Restaurant", "lechistera@lechistera.com", "http://lechistera.com/"],
  ["Bayonne", "Une Bouteille à la Nive", "Bar à tapas", "unebouteillealanive@gmail.com", "https://www.unebouteillealanive.fr/"],
  ["Bayonne", "En Cave et Débouche", "Bar à vin / caviste", "eced.contact@gmail.com", "https://www.en-cave-et-debouche.fr/contact/"],
].map(([ville, name, type, email, source]) => ({ ville, name, type, email, source }));
