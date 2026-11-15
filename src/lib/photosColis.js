// 📷 Photos du colis (15/11/2026, maquette « Niv Admin ») : les trois photos guidées prises au moment d'emballer.
export const PHOTOS_COLIS = [
  { k: "contenu", t: "1 · Le contenu" },
  { k: "ferme", t: "2 · La boîte fermée" },
  { k: "etiquette", t: "3 · L'étiquette collée" },
];

export function etatPhotosColis(order) {
  const l = Array.isArray(order?.photosColis) ? order.photosColis : [];
  const faites = PHOTOS_COLIS.filter((p) => l.some((x) => x.k === p.k));
  const manquent = PHOTOS_COLIS.filter((p) => !l.some((x) => x.k === p.k));
  return { n: faites.length, total: PHOTOS_COLIS.length, manquent, autres: l.filter((x) => x.k === "autre").length, toutes: l };
}

export const empreinteCourte = (sha) => String(sha || "").slice(0, 12);
