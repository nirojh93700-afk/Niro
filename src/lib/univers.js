// =============================================================================
// UNIVERS DE LA BOUTIQUE — le rangement de la maquette « accueil + univers »
// (direction « Mélange », validée « applique » le 09/10/2026). Sept univers, des
// rayons par univers, et pour chaque création : « pour qui », « pour quelle
// occasion », prix mini/maxi. Tout est lu dans le CATALOGUE EN DIRECT (prix,
// photos, produits masqués) : ce fichier ne contient que des identifiants et
// des règles. Un produit qui n'est rangé nulle part tombe dans l'univers de sa
// catégorie (rayon « Autres créations ») : rien ne disparaît jamais.
// Les catégories des produits (products.js, Gestion → Catégories) ne changent
// pas : ce rangement est une couche d'affichage par-dessus.
// =============================================================================
import { OCCASIONS } from "./occasions";
import { PRODUCT_DATES } from "./productDates";
import { formatEuro } from "./format";

// Photo de vignette : une pièce GRAVÉE quand le site en a une (règle du gérant :
// toujours montrer la gravure). Sinon la photo principale du produit.
export const PHOTO_GRAVEE = {
  "couverts-enfants-personnalises": "/produits/couverts_enfants_ex_prenom.jpg",
  "verre-a-whisky-grave": "/produits/verre_a_whisky_exemple_face.jpg",
  "verre-a-vin-grave": "/produits/verre_vin_exemple_dale.jpg",
  "carafe-a-whisky-gravee": "/produits/carafe_gravee.jpg",
  "collier-3coeurs": "/produits/collier-3coeurs-3.jpg",
  "collier-coeur-grave": "/produits/collier-coeur-grave-2.jpg",
  "collier-double-coeur": "/produits/collier-double-coeur-6.jpg",
  "bracelet-cordon-plaque": "/produits/bracelet-cordon-plaque-4.jpg",
  "bracelet-femme-acier": "/produits/bracelet-femme-acier-grave.jpg",
  "verre-a-whisky-fete-des-peres": "/produits/verre_whisky_papa_monde_moustache.jpg",
  "verre-a-cocktail-grave": "/produits/verre_a_cocktail_exemple_logo.jpg",
  "verre-tumbler-cristal-grave": "/produits/verre_tumbler_37_ex_maries.jpg",
};

// Les 9 puzzles en bois (maquette « Jeux pour enfants », 07/10/2026) : EN VENTE depuis le 09/10/2026
// (ordre du gérant). 19,90 € (gérant, 11/10/2026), prénom compris. Fiches dans products.js (category "jeux").
export const PUZZLES = [
  ["foret", "Forêt"], ["savane", "Savane"], ["dinosaures", "Dinosaures"], ["animaux-amerique", "Grand Nord"],
  ["australie", "Australie"], ["vehicules-secours", "Véhicules de secours"], ["camping", "Camping"],
  ["jardin-enchante", "Jardin enchanté"], ["fruits-legumes", "Fruits & légumes"],
];
export const PUZZLE_PRIX = 29.9;

const bij = (prefix) => (p) => p.category === "bijoux" && String(p.name || "").startsWith(prefix);

// id, nom (titre de page), short (menu), accroche, photo d'en-tête, filtre « pour qui », étiquette « Nouveau ».
export const UNIVERS = [
  { id: "bijoux", nom: "Bijoux", short: "Bijoux", pourqui: true, img: "/produits/collier-3coeurs-3.jpg",
    accroche: "Colliers et bracelets en acier, la plupart gravés avec un prénom, une date ou un mot qui vous est cher.",
    rayons: [{ nom: "Colliers", regle: bij("Collier") }, { nom: "Bracelets", regle: bij("Bracelet") }] },
  { id: "cristal", nom: "Cristal photo 3D", short: "Cristal", img: "/produits/cristal-v-femme.jpg",
    accroche: "Votre photo gravée au laser à l'intérieur d'un bloc de cristal.",
    rayons: [{ nom: "Blocs photo 3D", slugs: ["cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"] },
             { nom: "Cristaux déjà gravés", slugs: ["cristal-deja-grave"] },
             { nom: "Porte-clés & USB", slugs: ["porte-cles-cristal-led-coeur", "porte-cles-cristal-led-rectangle", "cle-usb-cristal-3d"] }] },
  { id: "verres", nom: "Verres & Carafes", short: "Verres & Carafes", pourqui: true, img: "/produits/verre_a_whisky_exemple_face.jpg",
    accroche: "Verres à whisky, à cocktail, à vin, flûtes et carafe, gravés à la commande.",
    rayons: [{ nom: "Verres à whisky", slugs: ["verre-a-whisky-grave", "verre-tumbler-cristal-grave", "verre-a-whisky-fete-des-peres"] },
             { nom: "Vin, champagne, cocktail & carafe", slugs: ["verre-a-vin-grave", "flute-a-champagne-gravee", "verre-a-cocktail-grave", "carafe-a-whisky-gravee"] }] },
  { id: "enfants", nom: "Bébé & Enfant", short: "Bébé & Enfant", neuf: true, img: "/produits/couverts_enfants_ex_enfant.jpg",
    accroche: "De la naissance aux premiers repas, des cadeaux personnalisés avec le prénom de votre enfant.",
    rayons: [{ nom: "Naissance & baptême", slugs: ["plaque-de-naissance", "plaque-de-naissance-coeur", "cartes-etapes-bebe-animaux", "cartes-etapes-bebe-girafe", "bracelet-empreinte-pied-bebe"] },
             { nom: "Repas & chambre", slugs: ["couverts-enfants-personnalises", "veilleuse-arbre-de-vie-prenom", "plaque-de-porte-enfant"] },
             { nom: "Jeux en bois", slugs: ["puzzle-photo-grave", ...PUZZLES.map(([f]) => `puzzle-${f}`)] }] },
  { id: "mariage", nom: "Mariage & Réception", short: "Mariage", img: "/produits/numero_table_arche_geometrique_relief_bois.jpeg",
    accroche: "Numéros de table, menus, décorations de table et verres de réception, gravés pour votre jour.",
    rayons: [{ nom: "Numéros de table", regle: (p) => p.subcategory === "tables" },
             { nom: "Décor de table & menus", slugs: ["etiquette-serviette-initiales", "ronds-de-serviette-bois", "porte-serviettes-bois-fleur", "porte-serviettes-colombes", "menu-de-mariage-bois-grave"] },
             { nom: "Verres de réception", slugs: ["flute-a-champagne-gravee", "carafe-a-whisky-gravee", "verre-a-vin-grave"] }] },
  { id: "maison", nom: "Maison & Déco", short: "Maison & Déco", img: "/produits/arbre-vie-rond-1.jpg",
    accroche: "Lampes, veilleuses et bougeoirs gravés, pour une lumière qui vous ressemble.",
    rayons: [{ nom: "Lampes & veilleuses", slugs: ["arbre-de-vie-lumineux", "veilleuse-arbre-de-vie-ronde", "veilleuse-arbre-de-vie-prenom", "lampe-led-paris-saint-germain"] },
             { nom: "Bougeoirs", slugs: ["bougeoir-mandala-bois", "photophore-fee-bois", "bougeoir-fleur-de-lotus"] }] },
  // Marque-pages (27/10/2026, gérant : « tu fais pas un petit cadeau… change le nom dans le menu » → « Marque-pages »).
  { id: "marque-pages", nom: "Marque-pages", short: "Marque-pages", neuf: true, img: "/marque-pages/m1/groupe.jpg",
    accroche: "Des marque-pages en bois à graver d'un prénom, d'un dessin ou d'une photo, et des marque-pages en métal doré d'après Van Gogh et Monet.",
    rayons: [{ nom: "Marque-pages en bois", slugs: ["marque-page-bois-pompon", "marque-page-bois-oiseau"] },
             { nom: "Marque-pages en métal", slugs: ["marque-page-metal-peinture"] }] },
  { id: "cadeaux", nom: "Petits cadeaux", short: "Petits cadeaux", pourqui: true, img: "/produits/cle_usb_en_bois_4gb_avec_boite_en_bois.jpg",
    accroche: "Clés USB, porte-clés, pièce à graver et accessoires de bureau, personnalisés ou prêts à offrir.",
    rayons: [{ nom: "Clés USB", slugs: ["cle-usb-personnalisee", "cle-usb-bois-coffret", "cle-usb-cristal-3d"] },
             { nom: "Porte-clés & pièce à graver", slugs: ["porte-cles-cuir-a-graver", "piece-ronde-laiton", "porte-cles-cristal-led-coeur", "porte-cles-cristal-led-rectangle"] },
             { nom: "Bureau", slugs: ["support-telephone-bois-grave", "support-telephone-bois-ajoure", "porte-stylo-coq-coupe-du-monde",
                                     "porte-stylo-portugal-coupe-du-monde", "porte-stylo-argentine-coupe-du-monde", "porte-stylo-espagne-coupe-du-monde"] }] },
];
export const UNIVERS_IDS = UNIVERS.map((u) => u.id);
export const getUnivers = (id) => UNIVERS.find((u) => u.id === id) || null;
// Anciennes adresses de catégories → univers (redirections).
export const ANCIENNES_CATEGORIES = { deco: "maison", naissance: "enfants", jeux: "enfants" };
// Catégorie du produit → univers d'accueil quand une création n'est rangée nulle part.
export const CAT_VERS_UNIVERS = { bijoux: "bijoux", cristal: "cristal", verres: "verres", naissance: "enfants", jeux: "enfants", mariage: "mariage", deco: "maison", cadeaux: "cadeaux" };

export const POURQUI = { elle: "Pour elle", lui: "Pour lui", couple: "Pour un couple", enfant: "Pour bébé & enfant", parents: "Pour des parents" };
const COUPLE = new Set(["collier-couple-coeur-lot2", "collier-couple-puzzle", "flute-a-champagne-gravee", "verre-a-vin-grave",
  "porte-cles-cristal-led-coeur", "cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"]);
const QUI_EXTRA = {
  "verre-a-cocktail-grave": ["elle", "lui", "couple"], "verre-tumbler-cristal-grave": ["elle", "lui", "couple"], "lampe-led-paris-saint-germain": ["lui", "enfant"],
  "porte-stylo-coq-coupe-du-monde": ["lui", "enfant"], "porte-stylo-portugal-coupe-du-monde": ["lui", "enfant"],
  "porte-stylo-argentine-coupe-du-monde": ["lui", "enfant"], "porte-stylo-espagne-coupe-du-monde": ["lui", "enfant"],
  "support-telephone-bois-grave": ["lui", "elle"], "support-telephone-bois-ajoure": ["lui", "elle"],
  "bougeoir-mandala-bois": ["elle", "parents"], "bougeoir-fleur-de-lotus": ["elle", "parents"], "photophore-fee-bois": ["elle", "parents"],
  "verre-a-vin-grave": ["couple", "elle"], "flute-a-champagne-gravee": ["couple", "elle"],
  "cle-usb-personnalisee": ["lui"], "cle-usb-bois-coffret": ["lui"], "cle-usb-cristal-3d": ["lui"],
  "porte-cles-cuir-a-graver": ["lui"], "piece-ronde-laiton": ["lui"],
  "marque-page-bois-pompon": ["elle", "lui", "parents"], "marque-page-bois-oiseau": ["elle", "parents"], "marque-page-metal-peinture": ["elle", "parents"],
};
const QUI_UNIVERS = { "marque-pages": ["elle", "parents"], verres: ["lui"], maison: ["elle", "parents"], cristal: ["parents", "couple"], mariage: ["maries"], bijoux: ["elle"], enfants: ["enfant"], cadeaux: ["lui", "elle"] };

// Occasions d'un produit (règles d'occasions.js) ; sans occasion → anniversaire + Noël.
export function occasionsDe(p) {
  const o = OCCASIONS.filter((x) => { try { return x.match(p); } catch { return false; } }).map((x) => x.slug);
  if (!o.length) return ["anniversaire", "noel"];
  if (!o.every((x) => x === "mariage" || x === "naissance")) o.push("anniversaire");
  return o;
}

// Prix de vignette : promo si elle existe, sinon prix de la 1re variante, « dès »
// quand les variantes ont des prix différents et que la 1re est la moins chère.
// lo/hi servent au filtre par budget.
export function prixCarte(p) {
  const prices = (p.variants || []).map((v) => v.price).filter((x) => Number.isFinite(x));
  if (!prices.length) return null;
  const base = prices[0];
  const sale = p.salePrice;
  const hasPromo = Number.isFinite(sale) && sale > 0 && sale < base;
  const distinct = new Set(prices).size > 1;
  const des = !hasPromo && distinct && base === Math.min(...prices);
  const valeur = hasPromo ? sale : base;
  // Prix barré + pastille de remise (bijoux −10 %, promos) : comme sur la fiche produit.
  const cmp = (p.variants || [])[0]?.compareAt;
  const barre = hasPromo ? base : Number.isFinite(cmp) && cmp > valeur ? cmp : 0;
  const remise = barre ? Math.round((1 - valeur / barre) * 100) : 0;
  return {
    texte: formatEuro(valeur), des, valeur, lo: Math.min(valeur, ...prices), hi: Math.max(...prices),
    barre: remise > 0 ? formatEuro(barre) : "", remise: remise > 0 ? remise : 0,
  };
}

function imageDe(p) {
  return PHOTO_GRAVEE[p.slug] || p.cardImage || (p.images || []).find(Boolean) || "";
}

// Range le catalogue (déjà filtré des produits masqués) dans les univers.
export function rangerCatalogue(catalog) {
  const parSlug = new Map(catalog.map((p) => [p.slug, p]));
  const home = new Map();
  const univers = UNIVERS.map((u) => {
    const vus = new Set();
    const rayons = u.rayons.map((r, i) => {
      if (r.bientot) return { id: `r-${u.id}-${i}`, nom: r.nom, bientot: r.bientot, slugs: [] };
      let slugs = r.slugs ? r.slugs.filter((s) => parSlug.has(s)) : catalog.filter(r.regle).map((p) => p.slug);
      slugs = slugs.filter((s) => !vus.has(s) && vus.add(s));
      return { id: `r-${u.id}-${i}`, nom: r.nom, slugs };
    });
    return { ...u, rayons, vus };
  });
  for (const u of univers) for (const r of u.rayons) for (const s of r.slugs) if (!home.has(s)) home.set(s, u.id);
  // Créations non rangées : dans l'univers de leur catégorie, rayon « Autres créations ».
  for (const p of catalog) {
    if (home.has(p.slug)) continue;
    const uid = CAT_VERS_UNIVERS[p.category] || "cadeaux";
    const u = univers.find((x) => x.id === uid);
    let r = u.rayons.find((x) => x.autres);
    if (!r) { r = { id: `r-${uid}-${u.rayons.length}`, nom: "Autres créations", slugs: [], autres: true }; u.rayons.push(r); }
    r.slugs.push(p.slug); u.vus.add(p.slug); home.set(p.slug, uid);
  }
  const cartes = new Map();
  for (const p of catalog) {
    const uid = home.get(p.slug);
    const qui = new Set(QUI_EXTRA[p.slug] || []);
    const occ = occasionsDe(p);
    if (occ.includes("pour-elle")) qui.add("elle");
    if (occ.includes("pour-lui")) qui.add("lui");
    if (p.subcategory === "couple" || COUPLE.has(p.slug)) qui.add("couple");
    if (p.subcategory === "bebe" || uid === "enfants") qui.add("enfant");
    if (occ.includes("famille") || occ.includes("naissance")) qui.add("parents");
    if (!qui.size) for (const q of QUI_UNIVERS[uid] || []) qui.add(q);
    const prix = prixCarte(p);
    cartes.set(p.slug, {
      slug: p.slug, name: p.name, href: p.pageDediee || `/produit/${p.slug}`, image: imageDe(p), badge: p.badge || "",
      perso: !!p.personalizable, u: uid, prix: prix ? { texte: prix.texte, des: prix.des, valeur: prix.valeur, barre: prix.barre, remise: prix.remise } : null,
      lo: prix ? prix.lo : 0, hi: prix ? prix.hi : 0, qui: [...qui].sort(), occ, date: PRODUCT_DATES[p.slug] || "",
    });
  }
  for (const u of univers) { u.count = u.vus.size; delete u.vus; }
  // Rayon vide (tous ses produits masqués, ou rayon masqué dans Gestion → Visibilité) : il disparaît ;
  // univers sans aucun produit (catégorie masquée) : il disparaît des onglets, du menu de l'accueil, de la boutique.
  for (const u of univers) u.rayons = u.rayons.filter((r) => r.bientot || r.slugs.length);
  univers.splice(0, univers.length, ...univers.filter((u) => u.count > 0));
  // « Toute la boutique » : chaque création une seule fois, sous son univers d'accueil.
  const boutique = {
    id: "boutique", nom: "Toute la boutique", short: "Tout", img: "/produits/cristal-v-femme.jpg", pourqui: true,
    accroche: "Toutes nos créations, un rayon par univers.",
    rayons: univers.map((u, i) => ({ id: `r-boutique-${i}`, nom: u.nom, slugs: [...new Set(u.rayons.flatMap((r) => r.slugs))].filter((s) => home.get(s) === u.id) })),
    count: cartes.size,
  };
  const carteDe = (s) => cartes.get(s) || null;
  // Photo d'en-tête d'un univers → fiche du produit qu'elle montre (22/10/2026 : toute photo de produit
  // doit mener à sa fiche). Seulement les produits du catalogue en direct (un produit masqué n'y est pas).
  const photos = new Map();
  for (const p of catalog) for (const i of [p.cardImage, imageDe(p), ...(p.images || [])]) if (i && !photos.has(i)) photos.set(i, p.slug);
  const lienPhoto = (img) => { const c = cartes.get(photos.get(img)); return c ? { href: c.href, name: c.name } : null; };
  return { univers, boutique, home, cartes: [...cartes.values()], carteDe, lienPhoto, getUnivers: (id) => (id === "boutique" ? boutique : univers.find((u) => u.id === id) || null) };
}

// Cartes « Bientôt » des puzzles (non cliquables, pas encore en vente).
export function cartesPuzzles() {
  return PUZZLES.map(([f, n]) => ({
    slug: `puzzle-${f}`, name: `Puzzle en bois, ${n}`, href: "", image: `/produits/puzzle-${f}.jpg`, badge: "Bientôt", soon: true,
    perso: true, u: "enfants", prix: { texte: formatEuro(PUZZLE_PRIX), des: false, valeur: PUZZLE_PRIX }, lo: PUZZLE_PRIX, hi: PUZZLE_PRIX,
    qui: ["enfant"], occ: ["naissance", "noel", "anniversaire"], note: "prénom compris",
  }));
}

// Les 6 dernières sorties (date d'ajout, productDates.js).
export function dernieresSorties(cartes, n = 6) {
  return cartes.filter((c) => c.date).sort((a, b) => (a.date === b.date ? 0 : b.date.localeCompare(a.date))).slice(0, n);
}
