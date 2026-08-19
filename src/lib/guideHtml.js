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

// Assemble le guide complet : texte des maquettes + grilles à jour.
export function guideHtmlComplet(blocs, parSlug) {
  return (blocs || [])
    .map((b) => {
      if (b.t !== "produits") return b.v;
      const items = b.v.map((x) => ({ produit: parSlug.get(x.slug), cta: x.cta })).filter((x) => x.produit);
      return grilleHtml(items);
    })
    .join("\n");
}
