// Décor choisi autour du texte (« Décor autour du texte ? » : ♥ ★ ✿ ◆ •), 05/11/2026.
// Commande 1K8QTJYM : la cliente avait choisi « Cœurs » sur le verre à whisky, l'aperçu
// montrait « ♥ Super Papy d'Eloann ♥ » mais l'atelier écrivait le texte SANS les cœurs.
// Même règle que l'aperçu (apercuCote.js) : le décor entoure le texte principal (clé « texte »).
export function texteAvecDecor(cle, valeur, champs) {
  const v = String(valeur ?? "").trim();
  const d = String(champs?.decor ?? "").trim();
  if (!v || !d || cle !== "texte") return v;
  return `${d} ${v} ${d}`;
}
