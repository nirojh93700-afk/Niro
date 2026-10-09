// Position du texte gravé sur un cristal photo : le menu « Où placer le texte ? »
// (textePos) et le texte glissé dans l'aperçu (layout.crystalText) disent la
// même chose. Source unique pour la fiche produit, la fiche atelier et le test.

// Position d'un choix du menu, en % du bloc (x = gauche→droite, y = haut→bas).
export const POSITIONS_TEXTE = {
  bas: { x: 50, y: 78 },
  haut: { x: 50, y: 22 },
  gauche: { x: 22, y: 50 },
  droite: { x: 78, y: 50 },
};

export const LIBELLE_POSITION = { bas: "en bas", haut: "en haut", gauche: "à gauche", droite: "à droite" };

// Côté d'une position glissée : "haut" | "bas" | "gauche" | "droite" | "" (au milieu).
// Le haut et le bas priment sur les côtés (un texte en coin compte pour sa hauteur).
export function regionTexte(x, y) {
  if (typeof x !== "number" || typeof y !== "number") return "";
  if (y > 66) return "bas";
  if (y < 34) return "haut";
  if (x < 34) return "gauche";
  if (x > 66) return "droite";
  return "";
}

// Position à afficher pour un article de commande.
// → { x, y, scale, region, conflit }. `conflit` = la cliente a choisi un côté dans
// le menu alors que son aperçu montrait le texte ailleurs (cas d'avant la liaison
// du menu à l'aperçu) : on suit le menu, c'est un choix explicite, et on le signale.
export function positionTexteCristal(item) {
  const menu = item?.fields?.textePos || "";
  const glisse = item?.layout?.crystalText || null;
  const scale = glisse?.scale ?? 1;
  const regionGlisse = glisse ? regionTexte(glisse.x, glisse.y) : "";
  if (menu && POSITIONS_TEXTE[menu] && menu !== regionGlisse) {
    return { ...POSITIONS_TEXTE[menu], scale, region: menu, conflit: glisse ? { menu, apercu: regionGlisse } : null };
  }
  if (glisse) return { x: glisse.x, y: glisse.y, scale, region: regionGlisse, conflit: null };
  return { ...POSITIONS_TEXTE.bas, scale, region: "bas", conflit: null };
}
