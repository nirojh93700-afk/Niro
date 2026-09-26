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
  stop: "Ne plus contacter",
};

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
export function messageProspect(nom) {
  const n = String(nom || "").trim();
  // « l'équipe du Bistro… », « des Luschtig », « de L'Agence » — jamais « de Le ».
  const qui = !n ? "toute l'équipe"
    : /^le\s/i.test(n) ? `l'équipe du ${n.slice(3)}`
    : /^les\s/i.test(n) ? `l'équipe des ${n.slice(4)}`
    : `l'équipe de ${n}`;
  return `Bonjour à ${qui},

Niv Création est un atelier français de gravure personnalisée. Nous gravons à la commande des verres à cocktail, des verres à whisky, des verres à vin et des flûtes à champagne, ainsi que des pièces en bois.

Nous proposons aux bars et aux restaurants de graver le logo de leur établissement sur leurs verres. C'est un détail que vos clients remarquent, qui signe chacune de vos photos de cocktails sur les réseaux, et qui donne à votre service une vraie identité.

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
