// Réglages CRISTAL par DÉFAUT (valeurs de secours validées le 26/07/2026).
// Priorité : les réglages faits dans l'admin (base de données) PRIMENT. Ces
// valeurs ne s'appliquent que si un cristal n'a jamais été réglé dans l'admin
// (elles évitent un placement « au hasard » si la base est vide). L'outil de
// réglage admin pilote de nouveau les cristaux (comme les verres/carafe).
export const CRYSTAL_ZONES_LOCK = {
  "cristal-photo-3d-vertical": { img: "/produits/cristal-bloc-v-creme.jpg", left: 30, top: 27, width: 42, height: 41, rotation: -3, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
  "cristal-photo-3d-horizontal": { img: "/produits/cristal-bloc-h-creme.jpg", left: 30, top: 30, width: 42, height: 32, rotation: -3, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
  "porte-cles-cristal-led-coeur": { img: "/produits/cristal-pcles-coeur-creme.jpg", left: 30, top: 51, width: 27, height: 24, rotation: 0, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
  "porte-cles-cristal-led-rectangle": { img: "/produits/cristal-pcles-rect-creme.jpg", left: 49.77, top: 46.95, width: 18.5, height: 27, rotation: 1, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
  "pyramide-cristal-gravure-3d": { img: "/produits/pyramide_en_verre_de_cristal_50mm.jpg", left: 20, top: 40, width: 30, height: 30, rotation: 0, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
  "trophee-cristal-vierge-3d": { img: "/produits/trophee_en_cristal_vierge_14_cm.jpg", left: 20, top: 40, width: 30, height: 30, rotation: 0, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
  "cle-usb-cristal-3d": { img: "/produits/cle_usb_cristal_argent_4gb.jpg", left: 20, top: 40, width: 30, height: 30, rotation: 0, ry: 0, rx: 0, opacity: 0.72, blend: "screen", bw: 1, on: 1 },
};
