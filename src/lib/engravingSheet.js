// =============================================================================
// « Quel texte sur quelle face » — tableau de gravure d'un article commandé.
// -----------------------------------------------------------------------------
// Partagé entre la fiche imprimée (FichePapier), la fiche commande et la page
// Atelier : une ligne par face réellement gravée, libellés nettoyés des prix
// (+5 €), police en clair. Les faces laissées vides ne sont pas listées.
//
// Lot « chacun différent » (perGlass) : UN BLOC PAR VERRE, numéroté, avec SA
// photo et SES textes — jamais un seul tableau pour quatre gravures différentes
// (incident #1LTYHZ6D du 30/09/2026, voir `eclaterParVerre`).
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { getFontLabel } from "@/lib/fonts";
import { eclaterParVerre } from "@/lib/orderSpec";

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

const cellCle = { border: "1px solid #999", padding: "6px 10px", width: "38%", fontWeight: 600 };
const cellVal = (police) => ({ border: "1px solid #999", padding: "6px 10px", fontSize: police ? "0.95rem" : "1.15rem" });

function LignesTable({ lignes }) {
  if (!lignes.length) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
      <tbody>
        {lignes.map((l, j) => (
          <tr key={j} style={{ background: l.police ? "#f7f2e6" : "#fff" }}>
            <td style={cellCle}>{l.face}</td>
            <td style={cellVal(l.police)}>{l.texte}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Un verre d'un lot « chacun différent » : numéro, SA photo, SES textes. */
function BlocVerre({ item }) {
  const lignes = lignesGravure(item);
  return (
    <div className="tg-verre" style={{ border: "1px solid #c9a24b", borderRadius: 8, margin: "0 0 8px", background: "#fff", overflow: "hidden" }}>
      <div style={{ background: "#fbf3e6", borderBottom: "1px solid #e7d3a1", padding: "4px 10px", fontWeight: 800, color: "#8a6d1f", fontSize: "0.95rem" }}>
        Verre {item.verre} / {item.verres}
      </div>
      {/* Sur téléphone (colonne étroite), le tableau passe SOUS la photo au lieu
          d'être écrasé à côté : flexWrap + base de 200 px. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 8, alignItems: "flex-start" }}>
        {item.photoSrc ? (
          <a href={item.photoSrc} target="_blank" rel="noreferrer" title={`Ouvrir la photo du verre ${item.verre}`} style={{ flex: "0 0 auto", textAlign: "center", textDecoration: "none", fontSize: "0.72rem", color: "#8a6d1f", fontWeight: 600 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photoSrc} alt={`Photo du verre ${item.verre}`} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 6, border: "2px solid #c9a24b", display: "block", background: "#fff" }} />
            📷 photo {item.verre}
          </a>
        ) : null}
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          {lignes.length ? <LignesTable lignes={lignes} /> : null}
          {!lignes.length && !item.photoSrc ? (
            <div style={{ color: "#777", fontSize: "0.85rem" }}>Sans gravure (verre vierge)</div>
          ) : null}
          {item.photoSrc && !lignes.length ? (
            <div style={{ color: "#555", fontSize: "0.85rem" }}>Photo / logo seul, sans texte</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Tableau prêt à afficher (même rendu partout : fiche imprimée + fiche commande + page Atelier).
export function TableGravure({ item, titre = true }) {
  const verres = eclaterParVerre(item);
  const entete = titre ? (
    <h3 style={{ margin: "0 0 6px", fontFamily: "Georgia,serif", fontSize: "1.05rem" }}>
      À graver — {item.name}{item.variantTitle ? ` (${item.variantTitle})` : ""}
    </h3>
  ) : null;

  if (verres.length > 1) {
    return (
      <div style={{ marginBottom: 12 }}>
        {entete}
        <div style={{ margin: "0 0 8px", padding: "6px 10px", background: "#fdecec", border: "1px solid #d64545", borderRadius: 6, color: "#b32b2b", fontWeight: 700, fontSize: "0.9rem" }}>
          ⚠️ Lot de {verres.length} verres, CHACUN DIFFÉRENT — {verres.length} gravures à faire, une par verre (photo et texte propres à chaque verre).
        </div>
        {verres.map((v) => <BlocVerre key={v.verre} item={v} />)}
      </div>
    );
  }

  const lignes = lignesGravure(item);
  if (!lignes.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      {entete}
      <LignesTable lignes={lignes} />
    </div>
  );
}
