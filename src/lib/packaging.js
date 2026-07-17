// =============================================================================
// Emballages (packaging) — moteur de prix PUR, partagé client + serveur.
// Même principe que engravingExtra : le prix est TOUJOURS recalculé côté
// serveur au paiement depuis le catalogue (jamais depuis le client).
//
// Deux structures, stockées dans settings :
//   settings.packaging        = [ { id, name, desc, buy, sell, weight, photo } ]   (bibliothèque)
//   settings.productPackaging = { [slug]: { on, ids:[...], free:[...] } }           (par produit)
//
// resolvePackaging() fusionne les deux et attache product.packaging = { on, options }
// (fait dans catalog.js). packagingExtra() calcule le supplément choisi.
// =============================================================================

// Construit product.packaging à partir de l'attribution du produit + la biblio.
export function resolvePackaging(assign, library) {
  if (!assign || !assign.on) return null;
  const ids = Array.isArray(assign.ids) ? assign.ids : [];
  if (!ids.length) return null;
  const lib = Array.isArray(library) ? library : [];
  const free = new Set(Array.isArray(assign.free) ? assign.free : []);
  const options = ids
    .map((id) => {
      const it = lib.find((x) => x && x.id === id);
      if (!it) return null;
      const isFree = free.has(id);
      return {
        id,
        name: it.name || "Emballage",
        desc: it.desc || "",
        photo: it.photo || "",
        free: isFree,
        price: isFree ? 0 : Math.max(0, Number(it.sell) || 0),
        weight: Math.max(0, Number(it.weight) || 0),
      };
    })
    .filter(Boolean);
  if (!options.length) return null;
  return { on: true, options };
}

// Supplément d'emballage pour un article, selon les options payantes choisies.
// - Les options « offertes » (free) sont TOUJOURS incluses (prix 0, poids compté).
// - Les options payantes ne comptent que si leur id est dans selectedIds.
export function packagingExtra(product, selectedIds = []) {
  const pk = product?.packaging;
  if (!pk || !pk.on || !Array.isArray(pk.options)) {
    return { amount: 0, weight: 0, labels: [], chosen: [] };
  }
  const sel = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  let amount = 0;
  let weight = 0;
  const labels = [];
  const chosen = [];
  for (const o of pk.options) {
    if (o.free) {
      weight += Number(o.weight) || 0;
      labels.push(`${o.name} (offert)`);
      chosen.push(o.id);
    } else if (sel.has(o.id)) {
      amount += Number(o.price) || 0;
      weight += Number(o.weight) || 0;
      labels.push(`${o.name} (+${(Number(o.price) || 0).toFixed(2)} €)`);
      chosen.push(o.id);
    }
  }
  return { amount: Math.round(amount * 100) / 100, weight, labels, chosen };
}
