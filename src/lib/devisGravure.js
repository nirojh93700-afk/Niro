// =============================================================================
// COMMANDE SUR DEVIS → LIGNES « À GRAVER » (30/09/2026).
// -----------------------------------------------------------------------------
// Remarque du gérant sur #16HGINEA (devis DEV-1506, 2 verres + un coffret) :
// « je sais même pas quoi, il veut combien de verres — deux verres de chaque style
// ou juste un verre de chaque style ? ». Une commande sur devis n'a PAS de réglages
// enregistrés (`spec`) : l'atelier n'affichait que le texte du devis, sans aucune
// quantité lisible ni fichier à ouvrir.
//
// Ici on relit les LIGNES DU DEVIS (nom, quantité, texte entre « », style n°) et on
// les présente comme une commande normale : une pièce par ligne, sa quantité, son
// texte, son fichier à graver. Les fichiers faits à la main pour une commande sont
// déclarés dans FICHIERS_DEVIS (ils vivent dans public/gravures/<réf>/).
// =============================================================================

// Un fichier par LIGNE DU DEVIS (hors livraison), dans l'ordre des lignes.
export const FICHIERS_DEVIS = {
  "16HGINEA": [
    { fichier: "/gravures/16HGINEA/verre-1.svg", texte: "Claude · Millésime 1976", style: "2" },
    { fichier: "/gravures/16HGINEA/verre-2.svg", texte: "Ami de Claude · Millésimé", style: "2" },
    {
      fichier: "/gravures/16HGINEA/couvercle.svg",
      texte: "Claude · Millésime 1976",
      style: "2",
      note: "Couvercle du coffret — même texte que le verre 1, confirmé par le client le 28/09.",
    },
  ],
};

// Lignes d'envoi (pas des pièces à fabriquer) : « Livraison… », « Lettre suivie La Poste », « Colis suivi ».
const LIVRAISON = /livraison|point relais|retrait|expédition|frais de port|^\s*(lettre|colis)\s+suivi/i;

/** Les pièces à fabriquer d'une commande sur devis, une par ligne du devis. */
export function lignesDevis(order) {
  const fichiers = FICHIERS_DEVIS[order?.ref] || [];
  return (order?.items || [])
    .filter((it) => !LIVRAISON.test(it.name || ""))
    .map((it, i) => {
      const nom = String(it.name || "").trim();
      const texteNom = (/«\s*([^»]+?)\s*»/.exec(nom) || [])[1] || "";
      const styleNom = (/style\s*n°\s*(\d+)/i.exec(nom) || [])[1] || "";
      const f = fichiers[i] || {};
      return {
        rang: i + 1,
        quantite: Number(it.quantity) || 1,
        nom,
        court: nom.split(/\s+[—–-]\s+/)[0],
        texte: f.texte || texteNom,
        style: f.style || styleNom,
        fichier: f.fichier || "",
        note: f.note || "",
      };
    });
}
