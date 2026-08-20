// Génère src/lib/guidesContent.js à partir des maquettes validées de docs/maquettes.
// Reproduction FIDÈLE : on garde le texte tel quel, on ne change que les liens
// (absolus -> internes) et on retire le <header>/<footer> de la maquette (le site a les siens).
//
// IMPORTANT — les GRILLES DE PRODUITS ne sont PAS recopiées en dur : on ne garde
// que la liste des identifiants (slug) et la petite phrase d'accroche. Le nom, la
// photo et le PRIX sont lus dans le vrai catalogue au moment de l'affichage. Donc :
//   • un prix modifié dans Gestion se met à jour tout seul sur les guides ;
//   • un produit masqué ou supprimé disparaît des guides (jamais de lien mort) ;
//   • un nouveau produit apparaît tout seul dans le guide de sa catégorie
//     (règles `auto` dans src/lib/guides.js).
import fs from "node:fs";
import path from "node:path";

const SRC = "docs/maquettes";
const OUT = "src/lib/guidesContent.js";

// fichier maquette -> slug de page sur le site
const MAP = {
  "guide-cadeaux-femme.html": "cadeau-femme-personnalise",
  "guide-idees-gravure.html": "idees-gravure-bijoux",
  "guide-cadeaux-homme.html": "bijoux-homme-graves",
  "guide-cadeaux-couple.html": "cadeau-couple",
  "guide-naissance.html": "cadeau-naissance",
  "guide-mariage.html": "deco-mariage-personnalisee",
  "guide-cristal-3d.html": "cristal-photo-3d",
  "guide-verres-graves.html": "verres-carafes-graves",
  "guide-deco-lumineuse.html": "deco-lumineuse-bois",
  "guide-cle-usb.html": "cle-usb-personnalisee-gravee",
  "guide-porte-cles-piece.html": "porte-cles-piece-a-graver",
  "guide-cadeaux-enfant.html": "cadeau-enfant-personnalise",
  "guide-porte-stylo.html": "porte-stylo-bois-personnalise",
  "guide-support-telephone.html": "support-telephone-personnalise",
};

// anciens liens de maquette -> vraies adresses du site
const LIENS = {
  "https://nivcreation.fr/idees-cadeaux-femme": "/idees/cadeau-femme-personnalise",
  "https://nivcreation.fr/idees-gravure": "/idees/idees-gravure-bijoux",
};

// Retire les balises HTML et remet les caractères spéciaux en clair.
function texteSeul(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Trouve la fin d'un <div ...> ouvert à l'indice `debut` (compte les div imbriqués).
function finDuDiv(html, debut) {
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = debut;
  let profondeur = 0;
  let m;
  while ((m = re.exec(html))) {
    profondeur += m[0].startsWith("</") ? -1 : 1;
    if (profondeur === 0) return re.lastIndex;
  }
  return -1;
}

// Découpe le corps en blocs : { t:"html" } pour le texte, { t:"produits" } pour
// les grilles (on n'en garde que les slugs + la phrase d'accroche).
function decouper(body, slugPage) {
  const blocs = [];
  let reste = body;
  for (;;) {
    const i = reste.indexOf('<div class="grid">');
    if (i === -1) break;
    const fin = finDuDiv(reste, i);
    if (fin === -1) throw new Error("grille mal fermée : " + slugPage);
    const grille = reste.slice(i, fin);
    const items = [];
    for (const carte of grille.split('<a class="card"').slice(1)) {
      const slugProduit = (carte.match(/href="\/produit\/([a-z0-9-]+)"/) || [])[1];
      if (!slugProduit) continue;
      const cta = (carte.match(/<div class="cta">([\s\S]*?)<\/div>/) || [])[1] || "";
      items.push({ slug: slugProduit, cta: texteSeul(cta) });
    }
    if (!items.length) throw new Error("grille sans produit : " + slugPage);
    const avant = reste.slice(0, i).trim();
    if (avant) blocs.push({ t: "html", v: avant });
    blocs.push({ t: "produits", v: items });
    reste = reste.slice(fin);
  }
  const fin = reste.trim();
  if (fin) blocs.push({ t: "html", v: fin });
  return blocs;
}

const out = {};
const blocs = {};
const meta = {};

for (const [file, slug] of Object.entries(MAP)) {
  const raw = fs.readFileSync(path.join(SRC, file), "utf8");

  // Métadonnées : titre de l'onglet, H1, chapô, sur-titre
  const title = (raw.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const h1 = (raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.trim() || "";
  const eyebrow = (raw.match(/<div class="eyebrow">([\s\S]*?)<\/div>/) || [])[1]?.trim() || "";
  const chapo = (raw.match(/<header class="hero">[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1]?.trim() || "";
  // Image de la vignette du sommaire : en adresse interne (comme le reste du site).
  const firstImg = ((raw.match(/<img src="([^"]+)"/) || [])[1] || "").replace("https://nivcreation.fr/", "/");

  // Corps = tout ce qui suit le </header> d'entrée, sans le <footer> final
  let body = raw.split("</header>").slice(1).join("</header>");
  body = body.replace(/<footer>[\s\S]*?<\/footer>/g, "").trim();

  // Liens : d'abord les renvois entre guides, puis tout le reste du domaine
  for (const [de, vers] of Object.entries(LIENS)) body = body.split(de + '"').join(vers + '"');
  body = body.replace(/https:\/\/nivcreation\.fr\//g, "/");

  // Sécurité mobile : un tableau large doit pouvoir défiler seul, sans élargir la page.
  body = body.replace(/<table class="prices">/g, '<div class="prices-scroll"><table class="prices">')
             .replace(/<\/table>/g, "</table></div>");

  if (/https?:\/\/nivcreation\.fr/.test(body)) throw new Error("lien absolu restant : " + slug);
  if (!body.includes("<h2")) throw new Error("corps vide : " + slug);

  // Questions/réponses de la partie « Questions fréquentes » → données structurées
  // FAQ pour Google (le contenu reste visible sur la page, comme Google l'exige).
  const faqBloc = (body.match(/<div class="faq">([\s\S]*?)<\/div>/) || [])[1] || "";
  const faq = [];
  const re = /<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
  let mm;
  while ((mm = re.exec(faqBloc))) {
    faq.push({ q: texteSeul(mm[1]), r: texteSeul(mm[2]) });
  }

  out[slug] = body;
  blocs[slug] = decouper(body, slug);
  const cites = [...new Set(blocs[slug].filter((b) => b.t === "produits").flatMap((b) => b.v.map((x) => x.slug)))];
  meta[slug] = { title, h1, eyebrow, chapo, image: firstImg, faq, cites, source: file };
}

const js =
  "// FICHIER GÉNÉRÉ — ne pas modifier à la main.\n" +
  "// Source : docs/maquettes/guide-*.html (maquettes validées par la gérante).\n" +
  "// Régénérer : node tools/generer-guides.mjs\n\n" +
  "// Blocs d'affichage : texte (html) et grilles de produits (slugs seulement —\n" +
  "// nom, photo et prix viennent du catalogue en direct).\n" +
  "export const GUIDES_BLOCS = " + JSON.stringify(blocs, null, 0) + ";\n\n" +
  "export const GUIDES_HTML = " + JSON.stringify(out, null, 0) + ";\n\n" +
  "export const GUIDES_META = " + JSON.stringify(meta, null, 2) + ";\n";

fs.writeFileSync(OUT, js);
console.log("OK ->", OUT, Object.keys(out).length, "pages,", (js.length / 1024).toFixed(0), "Ko");
for (const [s, m] of Object.entries(meta)) console.log("  /idees/" + s, "|", m.title, "|", m.h1.replace(/<[^>]*>/g, ""));
