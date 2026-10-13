// =============================================================================
// PASTILLE « PRODUIT EXACT » (13/10/2026, gérant : « il faut que ça soit plus visible »).
// La taille / le format commandé (« 47 cl · Lot de 2 », « Doré », « Grand »…) s'affiche partout
// dans Gestion dans une pastille or bien visible, au lieu d'un texte gris après le nom.
// Taille introuvable (« ⚠️ taille non enregistrée… ») → pastille ROUGE.
// =============================================================================
export default function VarBadge({ texte, grand = false }) {
  const t = String(texte || "").trim();
  if (!t) return null;
  const alerte = t.includes("⚠️");
  return <span className={`var-badge${alerte ? " alerte" : ""}${grand ? " grand" : ""}`}>{t}</span>;
}
