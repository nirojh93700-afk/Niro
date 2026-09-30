// =============================================================================
// APPARIER LES RÉGLAGES DE GRAVURE AVEC LES LIGNES DE LA COMMANDE.
// -----------------------------------------------------------------------------
// 🔴 BUG CORRIGÉ LE 24/09/2026 (commande #00CUYR2U, Cécilia Herrera — remarque du
// gérant : « je comprends pas, c'est mal écrit »). L'admin retrouvait le réglage
// d'une ligne avec `spec.find(x => x.slug === it.slug)`. Quand une commande porte
// DEUX LIGNES DU MÊME PRODUIT (deux lots de flûtes, gravés différemment),
// `find` renvoyait TOUJOURS le premier réglage : le tableau « À graver » de la
// 2ᵉ ligne affichait le texte de la 1ʳᵉ. Risque réel de graver deux fois la même
// chose.
//
// Ici on apparie DANS L'ORDRE, en consommant chaque réglage une seule fois.
// L'ordre est fiable : le paiement enregistre les réglages dans l'ordre du panier
// (`items.map(...).filter(Boolean)` dans /api/checkout) et Stripe rend les lignes
// dans ce même ordre. Le `filter(Boolean)` retire les articles sans gravure, d'où
// le décalage possible des rangs — c'est pourquoi on apparie par identifiant
// produit d'abord, et par rang seulement en dernier recours.
// =============================================================================

/**
 * @param {Array} items  les lignes de la commande (order.items)
 * @param {Array} spec   les réglages enregistrés (order.spec)
 * @returns {Array} un réglage (ou null) PAR ligne, dans l'ordre des lignes
 */
export function apparierSpec(items, spec) {
  const libres = (Array.isArray(spec) ? spec : [])
    .filter(Boolean)
    .map((s) => ({ s, pris: false }));
  const prendre = (e) => {
    if (!e) return null;
    e.pris = true;
    return e.s;
  };
  return (Array.isArray(items) ? items : []).map((it, i) => {
    if (it && it.slug) {
      // 1. même produit, premier réglage encore libre : c'est le bon lot.
      const parSlug = libres.find((x) => !x.pris && x.s.slug === it.slug);
      if (parSlug) return prendre(parSlug);
      // 2. un réglage d'avant, enregistré sans identifiant produit.
      const sansSlug = libres.find((x) => !x.pris && !x.s.slug);
      if (sansSlug) return prendre(sansSlug);
      // Sinon RIEN. On ne prête JAMAIS à une ligne les réglages d'un autre
      // produit : mieux vaut « aucun réglage » qu'une gravure fausse. C'est ce
      // qui arrivait à l'article non gravé posé au milieu de la commande.
      return null;
    }
    // 3. ligne sans identifiant produit (vieille commande) : on suit l'ordre.
    const sansSlug = libres.find((x) => !x.pris && !x.s.slug);
    if (sansSlug) return prendre(sansSlug);
    return prendre(libres[i] && !libres[i].pris ? libres[i] : null);
  });
}

// =============================================================================
// UN LOT « CHACUN DIFFÉRENT » = UN ARTICLE PAR VERRE.
// -----------------------------------------------------------------------------
// 🔴 INCIDENT DU 30/09/2026 (commande #1LTYHZ6D, Olivier Chesta — 4 verres à
// cocktail, 4 photos et 4 textes différents). Un lot personnalisé « chacun
// différent » enregistre les réglages de CHAQUE verre dans `item.perGlass[]`,
// mais les champs de tête (`fields`, `photoSrc`, `layout`, `previewImage`) ne
// portent QUE le verre actif au moment de l'ajout au panier. Tous les écrans qui
// affichaient « la » photo et « le » texte de l'article n'en montraient donc
// qu'UN sur quatre : le gérant n'a vu qu'une photo, n'a pas compris qu'il y avait
// quatre gravures différentes, et le client a dû le lui écrire.
//
// Cette fonction rend un article virtuel PAR verre (numéroté « Verre 2 / 4 »),
// avec SA photo, SES champs et SON résumé. Tout écran qui affiche un article
// gravé doit passer par elle (fiche commande, fiche atelier, fiche papier, page
// Atelier, e-mail d'alerte) — jamais lire `item.photoSrc` seul sur un lot.
// =============================================================================

/**
 * @param {object} item  un réglage enregistré (order.spec[i])
 * @returns {Array} un article par verre si le lot est « chacun différent »,
 *                  sinon `[item]` tel quel (lot uniforme, article seul, ancien format)
 */
export function eclaterParVerre(item) {
  if (!item) return [];
  const verres = Array.isArray(item.perGlass) ? item.perGlass.filter((g) => g && typeof g === "object") : [];
  if (verres.length < 2) return [item];
  // Le résumé enregistré est « Verre 1 : …  |  Verre 2 : … » : un segment par verre.
  const segments = String(item.personalization || "").split(/\s*\|\s*/).filter(Boolean);
  const cle = (o) => JSON.stringify(o || {});
  const actif = cle(item.fields);
  return verres.map((fv, i) => {
    // Le verre actif à l'ajout au panier est le seul dont on a la capture
    // (previewImage) et l'artwork : les autres n'ont que leur photo brute.
    const tete = cle(fv) === actif;
    const empl = fv.emplacement || item.emplacement || "face";
    return {
      ...item,
      perGlass: null,
      verre: i + 1,
      verres: verres.length,
      fields: { ...fv },
      emplacement: empl === "deux" ? "face" : empl,
      deuxEmplacement: empl === "deux" || fv.deuxEmplacement === "oui" || (tete && Boolean(item.deuxEmplacement)),
      photoSrc: fv.photo || null,
      artworkImage: tete ? item.artworkImage || fv.photo || null : fv.photo || null,
      artworkImageFond: tete ? item.artworkImageFond || null : null,
      previewImage: tete ? item.previewImage || null : null,
      previewImageFond: tete ? item.previewImageFond || null : null,
      personalization: segments[i] || `Verre ${i + 1}`,
    };
  });
}
