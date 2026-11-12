// Bouton « Corriger dans l'outil » d'une commande (12/11/2026, gérant : « dans la fiche gravure où il y a les détails, je veux un
// bouton pour corriger ; ça va directement dans l'outil du produit »). Un article créé avec l'un des trois outils (support de
// téléphone, arbre de vie, décoration) porte dans ses réglages  creation: { outil, id }  : l'état complet est gardé à part
// (collection « creations », voir firebase.js). Pur : sert à la fiche atelier, à la page Atelier et à l'écran de retouche.
export const OUTILS_CREATION = { support: "Support de téléphone", arbre: "Arbre de vie", decoration: "Décoration à suspendre" };

export function creationDe(item) {
  const c = item && item.creation;
  if (!c || typeof c !== "object") return null;
  const id = String(c.id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60);
  return id && OUTILS_CREATION[c.outil] ? { outil: c.outil, id } : null;
}

// L'adresse de l'écran de retouche pour cet article (null = pas un produit à outil : aucun bouton).
export function lienCorriger(item, order) {
  const c = creationDe(item);
  if (!c) return null;
  const ref = order ? order.ref || String(order.id || "").slice(-6) : "";
  return `/gestion/retouche?creation=${encodeURIComponent(c.id)}${ref ? `&commande=${encodeURIComponent(ref)}` : ""}`;
}

// « Fichiers pour la machine » : la même page, qui refabrique tout de suite les fichiers de la version gardée avec la commande.
export function lienFichiers(item, order) {
  const l = lienCorriger(item, order);
  return l ? `${l}&fichiers=1` : null;
}
