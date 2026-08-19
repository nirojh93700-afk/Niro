// Construit le HTML des grilles de produits des guides, à partir du VRAI catalogue.
//
// Pourquoi du HTML et pas des composants React : le texte du guide est injecté en
// un seul morceau (dangerouslySetInnerHTML). Si on découpait ce texte pour glisser
// des composants au milieu, les morceaux ne seraient plus des blocs HTML complets
// et le navigateur les refermerait tout seul → différence avec ce que React attend
// (erreurs d'hydratation). En générant la grille en HTML, la page reste UN seul
// bloc cohérent, tout en affichant des prix et des photos à jour.
import { formatEuro } from "./format";

export function echapper(texte) {
  return String(texte ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Même logique de prix que les vignettes de la boutique (promo, prix barré,
// « dès » quand il existe des options plus chères).
function prixHtml(p) {
  const prix = (p.variants || []).map((v) => v.price).filter((n) => typeof n === "number");
  if (!prix.length) return "";
  const base = p.variants[0].price;
  const promo = typeof p.salePrice === "number" && p.salePrice < base ? p.salePrice : null;
  const compare = p.variants[0].compareAt;
  const barre = !promo && typeof compare === "number" && compare > base ? compare : null;
  const des = new Set(prix).size > 1 && base === Math.min(...prix);

  if (promo != null) {
    return `<span class="guide-prix-barre">${formatEuro(base)}</span> ${formatEuro(promo)}`;
  }
  if (barre != null) {
    return `<span class="guide-prix-barre">${formatEuro(barre)}</span> ${formatEuro(base)}`;
  }
  return `${des ? "dès " : ""}${formatEuro(base)}`;
}

// items = [{ produit, cta }] ; un produit absent du catalogue est déjà filtré en amont.
export function grilleHtml(items) {
  const cartes = (items || [])
    .filter((x) => x && x.produit)
    .map(({ produit: p, cta }) => {
      const image = p.cardImage || (p.images || [])[0] || "";
      const alt = echapper(p.title || p.name || "");
      const photo = image
        ? `<div class="ph"><img src="${echapper(image)}" alt="${alt}" loading="lazy"></div>`
        : `<div class="ph"></div>`;
      const prix = prixHtml(p);
      return (
        `<a class="card" href="/produit/${echapper(p.slug)}">` +
        photo +
        `<div class="body">` +
        `<div class="name">${echapper(p.name)}</div>` +
        (prix ? `<div class="price">${prix}</div>` : "") +
        `<div class="cta">${echapper(cta || "Découvrir →")}</div>` +
        `</div></a>`
      );
    })
    .join("");
  return cartes ? `<div class="grid">${cartes}</div>` : "";
}

// Portrait d'un produit, pour savoir dans quelle grille il a sa place.
// Le « type » est du texte libre (« Collier cadeau », « Collier personnalisé »,
// « Bracelet »…) : on ne compare donc que le PREMIER MOT — la famille (collier,
// bracelet, verre, carafe, lampe…). C'est ce qui permet de ranger un nouveau
// collier avec les colliers et un nouveau bracelet avec les bracelets.
function famille(p) {
  const brut = `${p.type || ""} ${p.name || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const mot = brut.trim().split(/[^a-z]+/).filter(Boolean)[0] || "";
  return mot.replace(/s$/, "");
}

function profil(p) {
  return {
    cat: p.category || "",
    sub: p.subcategory || "",
    fam: famille(p),
  };
}

// Range chaque NOUVEAU produit dans la grille de la page qui lui ressemble le
// plus : d'abord même catégorie + même sous-catégorie + même type (un nouveau
// collier femme va avec les colliers femme), sinon même catégorie +
// sous-catégorie. Ce qui ne trouve pas sa place reste pour le bas de page.
export function repartirNouveaux(blocs, parSlug, nouveaux, maxParGrille = 2) {
  const grilles = (blocs || [])
    .map((b, i) => ({ i, b }))
    .filter(({ b }) => b.t === "produits")
    .map(({ i, b }) => {
      const produits = b.v.map((x) => parSlug.get(x.slug)).filter(Boolean);
      return { i, produits, profils: produits.map(profil), ajouts: [] };
    });

  const restants = [];
  for (const p of nouveaux || []) {
    const pr = profil(p);
    const place =
      grilles.find(
        (g) =>
          g.ajouts.length < maxParGrille &&
          g.profils.some((q) => q.cat === pr.cat && q.sub === pr.sub && q.fam === pr.fam)
      ) ||
      grilles.find(
        (g) =>
          g.ajouts.length < maxParGrille &&
          g.profils.some((q) => q.cat === pr.cat && q.sub === pr.sub)
      );
    if (place) place.ajouts.push(p);
    else restants.push(p);
  }

  const parBloc = new Map(grilles.map((g) => [g.i, g.ajouts]));
  return { parBloc, restants };
}

// Assemble le guide complet : texte des maquettes + grilles à jour, avec les
// nouveaux produits rangés dans la bonne section.
export function guideHtmlComplet(blocs, parSlug, ajoutsParBloc) {
  return (blocs || [])
    .map((b, i) => {
      if (b.t !== "produits") return b.v;
      const items = b.v.map((x) => ({ produit: parSlug.get(x.slug), cta: x.cta })).filter((x) => x.produit);
      const ajouts = (ajoutsParBloc && ajoutsParBloc.get(i)) || [];
      // « Nouveau » seulement si le produit porte vraiment ce badge : on n'annonce
      // pas une nouveauté qui n'en est pas une.
      for (const p of ajouts) {
        items.push({ produit: p, cta: p.badge === "Nouveau" ? "Nouveau dans l'atelier →" : "À découvrir →" });
      }
      return grilleHtml(items);
    })
    .join("\n");
}
