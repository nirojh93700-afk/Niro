// Décor choisi autour du texte (« Décor autour du texte ? » : ♥ ★ ✿ ◆ •), 05/11/2026.
// Commande 1K8QTJYM : la cliente avait choisi « Cœurs » sur le verre à whisky, l'aperçu
// montrait « ♥ Super Papy d'Eloann ♥ » mais l'atelier écrivait le texte SANS les cœurs.
// Même règle que l'aperçu (apercuCote.js) : le décor entoure le texte principal (clé « texte »).
// 07/11/2026 (« Où mettre le décor ? ») : autour du texte (défaut), de la DATE, ou des deux
// (champ decorPlace). Clés de date : « date » (vin, flûte, carafe…), « texte2 » (whisky, cocktail).
const CLES_DATE = ["date", "texte2"];
export function texteAvecDecor(cle, valeur, champs) {
  const v = String(valeur ?? "").trim();
  const d = String(champs?.decor ?? "").trim();
  if (!v || !d) return v;
  const p = String(champs?.decorPlace || "texte");
  const surTexte = p !== "date";
  const surDate = p === "date" || p === "deux";
  if ((cle === "texte" && surTexte) || (CLES_DATE.includes(cle) && surDate)) return `${d} ${v} ${d}`;
  return v;
}
