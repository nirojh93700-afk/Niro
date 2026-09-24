"use client";

// =============================================================================
// IMPRESSION DE LA FICHE ATELIER — UNE SEULE FEUILLE A4, TOUJOURS.
// -----------------------------------------------------------------------------
// Demande du gérant (24/09/2026) : « il faut que ça soit concentré pour une
// feuille A4 et correctement, comme un truc professionnel — corrige pour toutes
// les commandes ». Avant, la fiche sortait sur 2 ou 3 pages selon la commande.
//
// Comment on garantit UNE page quel que soit le contenu :
//   1. la feuille est sortie hors champ (classe `impression-mesure`) AVEC ses
//      vrais styles papier — c'est pour ça que la mise en page .fp-* est écrite
//      hors de `@media print` : sinon on mesurerait un bloc sans styles, et la
//      réduction calculée serait fausse ;
//   2. on cherche le plus grand facteur qui la fait rentrer dans la page ;
//   3. on l'écrit dans --impr-echelle, appliqué en `zoom` (et non en
//      `transform: scale`, qui ne réduit PAS la hauteur de mise en page : le
//      navigateur comptait toujours deux pages et sortait une feuille blanche).
//
// Deux leviers, dans cet ordre : d'abord réduire les VISUELS (--fp-vis), car une
// photo un peu plus petite ne gêne personne ; le texte n'est rapetissé qu'après.
// En dessous de PLANCHER on arrête : une fiche illisible devant la machine est
// pire qu'une deuxième feuille.
// =============================================================================

const PX_PAR_MM = 96 / 25.4;      // 1 mm en pixels CSS
const A4_L = 210, A4_H = 297;     // A4 en mm
const MARGE = 10;                 // marge d'impression (doit égaler @page)
const PLANCHER = 0.58;            // en dessous, ce n'est plus lisible
const CONFORT = 0.75;             // en dessous, on préfère rapetisser les photos
// Tailles d'essai des visuels. Le dernier cran (0,45) ne sert qu'aux commandes
// à trois articles gravés différents : sans lui elles passaient sur 2 ou 3 pages.
const VISUELS = [1, 0.85, 0.72, 0.6, 0.45];

export const LARGEUR_UTILE_PX = Math.round((A4_L - 2 * MARGE) * PX_PAR_MM); // ~718
export const HAUTEUR_UTILE_PX = Math.round((A4_H - 2 * MARGE) * PX_PAR_MM); // ~1047

/** Hauteur qu'aurait la feuille posée sur une largeur donnée, avec ses styles
 *  papier. Mesurée hors champ : rien n'apparaît à l'écran. */
function hauteurA(el, largeur) {
  const avant = el.getAttribute("style") || "";
  el.setAttribute("style", `${avant};width:${Math.round(largeur)}px;max-width:none;zoom:1;`);
  const h = el.scrollHeight;
  el.setAttribute("style", avant);
  return h;
}

/**
 * Le plus grand facteur qui fait tenir `el` sur une page, à taille de visuels
 * donnée.
 *
 * Attention au piège : `zoom` réduit la feuille APRÈS l'avoir mise en page.
 * Sur une laize de 190 mm et une échelle e, elle se met donc en page sur
 * 190 mm / e — plus large, donc moins haute. Mesurer une seule fois à 190 mm
 * sur-estimait la hauteur et rapetissait la fiche pour rien. On tourne donc
 * deux ou trois fois, jusqu'à stabilisation.
 */
function echelleAvecVisuels(el, vis) {
  el.style.setProperty("--fp-vis", String(vis));
  const h1 = hauteurA(el, LARGEUR_UTILE_PX);
  if (!h1) return 1;
  if (h1 <= HAUTEUR_UTILE_PX) return 1;

  let e = HAUTEUR_UTILE_PX / h1;
  for (let i = 0; i < 3; i += 1) {
    const h = hauteurA(el, LARGEUR_UTILE_PX / e);
    if (!h) break;
    const suivant = HAUTEUR_UTILE_PX / h;
    if (Math.abs(suivant - e) < 0.004) { e = suivant; break; }
    e = suivant;
  }
  // 1 % de marge : un arrondi du navigateur ne doit pas faire déborder d'une
  // ligne et déclencher une deuxième feuille.
  return Math.min(1, Math.round(e * 0.99 * 1000) / 1000);
}

/** Règle la feuille pour qu'elle tienne sur une page. Les deux réglages restent
 *  posés sur l'élément : c'est ce que l'impression utilisera. */
export function reglerPourUnePage(el) {
  if (!el) return { echelle: 1, visuels: 1 };
  document.body.classList.add("impression-mesure");
  try {
    let meilleur = { echelle: 0, visuels: 1 };
    for (const vis of VISUELS) {
      const e = echelleAvecVisuels(el, vis);
      if (e > meilleur.echelle) meilleur = { echelle: e, visuels: vis };
      // Dès que la feuille tient à une taille de texte confortable, on s'arrête :
      // inutile de rapetisser les photos davantage.
      if (e >= CONFORT) { meilleur = { echelle: e, visuels: vis }; break; }
    }
    const echelle = Math.max(PLANCHER, meilleur.echelle || 1);
    el.style.setProperty("--fp-vis", String(meilleur.visuels));
    el.style.setProperty("--impr-echelle", String(echelle));
    return { echelle, visuels: meilleur.visuels };
  } finally {
    document.body.classList.remove("impression-mesure");
  }
}

/** Ouvre l'impression : attend les photos, règle l'échelle, imprime, remet tout
 *  en place. */
export function imprimerFiche({ attenteMaxMs = 8000 } = {}) {
  const debut = Date.now();

  const lancer = () => {
    const zone = document.querySelector(".zone-impression");
    if (!zone) return;

    // Les photos reçues par e-mail arrivent après coup : on les attend, sinon
    // la fiche est mesurée trop courte et la mise à l'échelle est fausse.
    const chargeEnCours = zone.querySelector("[data-photos-chargement]");
    const imagesPasPretes = [...zone.querySelectorAll("img")].some((i) => !i.complete);
    if ((chargeEnCours || imagesPasPretes) && Date.now() - debut < attenteMaxMs) {
      setTimeout(lancer, 200);
      return;
    }

    const { echelle } = reglerPourUnePage(zone);
    if (echelle <= PLANCHER) {
      console.warn(
        "[impression] Fiche très chargée : réduite au minimum lisible (" +
        Math.round(PLANCHER * 100) + " %). Elle peut dépasser d'une page.");
    }

    document.body.classList.add("impression-fiche");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("impression-fiche");
      zone.style.removeProperty("--impr-echelle");
      zone.style.removeProperty("--fp-vis");
    }, 300);
  };

  setTimeout(lancer, 250);
}
