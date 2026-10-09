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
//
// 09/10/2026, « ça fait trop petit, pas adapté au A4 » : dans l'autre sens, une
// fiche COURTE agrandit son texte (--fp-k, jusqu'à 1,35×) pour remplir la page.
// Et à partir de 3 visuels, FichePapier les pose sous le texte, côte à côte
// (.fp-visuels), au lieu d'une colonne de droite qui forçait une réduction à 60 %.
// =============================================================================

const PX_PAR_MM = 96 / 25.4;      // 1 mm en pixels CSS
const A4_L = 210, A4_H = 297;     // A4 en mm
const MARGE = 10;                 // marge d'impression (doit égaler @page)
// Échelles essayées, de la plus lisible à la moins. En dessous de PLANCHER on
// n'insiste plus : mieux vaut une deuxième feuille qu'un texte de 5 pt.
const ECHELLES = [1, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82, 0.79, 0.76, 0.75];
const PLANCHER = 0.75;
// Tailles d'essai des visuels, de la plus grande à la plus petite : à échelle
// égale on préfère rapetisser une photo plutôt que le texte.
const VISUELS = [1, 0.85, 0.72, 0.6, 0.45];
// Facteurs de TEXTE essayés quand la fiche est plus courte que la page, du plus
// grand au plus petit : une commande simple remplit la feuille en ~12 pt au lieu
// de laisser un tiers de vide en 9 pt (« trop petit », gérant 09/10/2026).
const TEXTES = [1.35, 1.28, 1.2, 1.12, 1.06];

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
 * La feuille tient-elle sur une page avec ces réglages ?
 *
 * Attention au piège : `zoom` réduit la feuille APRÈS l'avoir mise en page.
 * Sur une laize de 190 mm et une échelle e, elle se met donc en page sur
 * 190 mm / e (plus large, donc moins haute) et sa hauteur imprimée vaut h × e.
 * On mesure à la vraie largeur de mise en page, pour chaque échelle candidate :
 * pas d'itération « point fixe », qui oscillait dès que la hauteur faisait des
 * sauts (une rangée de visuels en plus ou en moins).
 */
function tient(el, { vis = 1, echelle = 1, texte = 1 }) {
  el.style.setProperty("--fp-vis", String(vis));
  el.style.setProperty("--fp-k", String(texte));
  const h = hauteurA(el, LARGEUR_UTILE_PX / echelle);
  // 1 % de marge : un arrondi du navigateur ne doit pas faire déborder d'une
  // ligne et déclencher une deuxième feuille.
  return Boolean(h) && h * echelle <= HAUTEUR_UTILE_PX * 0.99;
}

function poser(el, r) {
  el.style.setProperty("--fp-vis", String(r.visuels));
  el.style.setProperty("--fp-k", String(r.texte));
  el.style.setProperty("--impr-echelle", String(r.echelle));
  return r;
}

/** Règle la feuille pour qu'elle tienne sur une page, la plus lisible possible.
 *  Les réglages restent posés sur l'élément : c'est ce que l'impression utilise. */
export function reglerPourUnePage(el) {
  if (!el) return { echelle: 1, visuels: 1, texte: 1 };
  document.body.classList.add("impression-mesure");
  try {
    // 1. La page a de la place ? On agrandit le texte (photos et colonnes
    //    inchangées) jusqu'à la remplir.
    for (const texte of TEXTES) {
      if (tient(el, { texte })) return poser(el, { echelle: 1, visuels: 1, texte });
    }
    // 2. Sinon, on descend l'échelle cran par cran ; à chaque cran, la plus
    //    grande taille de photos qui fait tenir la feuille.
    for (const echelle of ECHELLES) {
      for (const vis of VISUELS) {
        if (tient(el, { vis, echelle })) return poser(el, { echelle, visuels: vis, texte: 1 });
      }
    }
    // 3. Rien ne tient, même au plancher : on garde le plancher lisible et la
    //    fiche passera sur une deuxième feuille.
    return poser(el, { echelle: PLANCHER, visuels: 0.45, texte: 1 });
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
        "[impression] Fiche très chargée : gardée au minimum lisible (" +
        Math.round(PLANCHER * 100) + " %). Elle peut prendre une deuxième feuille.");
    }

    document.body.classList.add("impression-fiche");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("impression-fiche");
      zone.style.removeProperty("--impr-echelle");
      zone.style.removeProperty("--fp-vis");
      zone.style.removeProperty("--fp-k");
    }, 300);
  };

  setTimeout(lancer, 250);
}
