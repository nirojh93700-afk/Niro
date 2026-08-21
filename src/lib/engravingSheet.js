// =============================================================================
// « Quel texte sur quelle face » — tableau de gravure d'un article commandé.
// -----------------------------------------------------------------------------
// Partagé entre la fiche imprimée (FichePapier) et la page Atelier : une ligne
// par face réellement gravée, libellés nettoyés des prix (+5 €), police en clair.
// Les faces laissées vides ne sont pas listées.
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { getFontLabel } from "@/lib/fonts";

export function lignesGravure(item) {
  const produit = getProductBySlug(item.slug);
  const champs = item.fields || {};
  const lignes = [];
  for (const f of produit?.personalizationFields || []) {
    if (f.type === "note" || f.type === "photo") continue;
    const brut = champs[f.key];
    if (typeof brut !== "string" || !brut.trim()) continue;
    const face = String(f.label || f.key)
      .replace(/^Gravure\s*[—-]\s*/i, "")
      .replace(/,?\s*\+\s*[\d.,]+\s*€/gi, "") // retire « +5 € » même au milieu d'une parenthèse
      .replace(/\s*\(\s*\)/g, "")             // parenthèses restées vides
      .replace(/\s*\(texte inclus\)/gi, "")
      .trim();
    let texte = brut.trim();
    if (f.type === "font") texte = getFontLabel(texte) || texte;
    else if (f.type === "select") texte = (f.options || []).find((o) => o.value === texte)?.label || texte;
    else if (f.type === "stylepicker") texte = `n° ${texte}`; // renvoie aux dessins numérotés de la fiche
    lignes.push({ face: f.type === "font" ? "Police de gravure" : face, texte, police: f.type === "font" });
  }
  return lignes;
}

// Tableau prêt à afficher (même rendu partout : fiche imprimée + page Atelier).
export function TableGravure({ item, titre = true }) {
  const lignes = lignesGravure(item);
  if (!lignes.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      {titre && (
        <h3 style={{ margin: "0 0 6px", fontFamily: "Georgia,serif", fontSize: "1.05rem" }}>
          À graver — {item.name}{item.variantTitle ? ` (${item.variantTitle})` : ""}
        </h3>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
        <tbody>
          {lignes.map((l, j) => (
            <tr key={j} style={{ background: l.police ? "#f7f2e6" : "#fff" }}>
              <td style={{ border: "1px solid #999", padding: "6px 10px", width: "38%", fontWeight: 600 }}>
                {l.face}
              </td>
              <td style={{ border: "1px solid #999", padding: "6px 10px", fontSize: l.police ? "0.95rem" : "1.15rem" }}>
                {l.texte}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
