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
import VarBadge from "@/components/admin/VarBadge";
import { consignesGravure } from "@/lib/consignesGravure";

// Champ affiché à la cliente pour cette commande (même règles que la fiche :
// « afficher si tel choix » et « seulement pour telle option »).
function champVisible(f, champs, variantTitle) {
  if (f.showIfField && String(champs[f.showIfField] || "") !== String(f.showIfValue)) return false;
  if (f.variantContains && !String(variantTitle || "").includes(f.variantContains)) return false;
  return true;
}
const estTexte = (f) => !f.type || f.type === "text" || f.type === "textarea";

/** Police à graver pour cet article : { label, defaut } ou null.
 *  Un texte saisi sans police choisie = Playfair, la police que la fiche
 *  montre déjà sélectionnée et que l'aperçu utilise (commande 0ZH3LP9M du
 *  11/10/2026 : « Eloïm » arrivé sans police). Un MODÈLE décoré n'en a pas :
 *  le nom se grave dans l'écriture du modèle. */
export function policeDeGravure(item) {
  const produit = getProductBySlug(item?.slug);
  const champs = item?.fields || {};
  const vus = (produit?.personalizationFields || []).filter((f) => champVisible(f, champs, item?.variantTitle));
  const fonte = vus.find((f) => f.type === "font");
  if (!fonte) return null;
  const choisie = String(champs[fonte.key] || "").trim();
  const aDuTexte = vus.some((f) => estTexte(f) && String(champs[f.key] || "").trim());
  if (!aDuTexte || champs.mode === "modele") return null;
  if (choisie) return { label: getFontLabel(choisie) || choisie, defaut: false };
  return { label: getFontLabel("playfair"), defaut: true };
}

export function lignesGravure(item) {
  const produit = getProductBySlug(item.slug);
  const champs = item.fields || {};
  const lignes = [];
  const pol = policeDeGravure(item);
  for (const f of produit?.personalizationFields || []) {
    if (f.type === "font") {
      // Une seule ligne « Police », écrite dès qu'il y a un texte à graver —
      // y compris quand la cliente a laissé la police proposée (Playfair).
      if (pol && !lignes.some((l) => l.police) && champVisible(f, champs, item.variantTitle)) {
        lignes.push({ face: "Police de gravure", texte: pol.defaut ? `${pol.label} (police proposée, non changée)` : pol.label, police: true });
      }
      continue;
    }
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
    if (f.type === "select") texte = (f.options || []).find((o) => o.value === texte)?.label || texte;
    else if (f.type === "stylepicker") texte = `n° ${texte}`; // renvoie aux dessins numérotés de la fiche
    lignes.push({ face, texte, police: false });
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
          <tr key={j} style={{ background: l.alerte ? "#fdecec" : l.police ? "#f7f2e6" : "#fff", color: l.alerte ? "#b32b2b" : undefined }}>
            <td style={cellCle}>{l.face}</td>
            <td style={cellVal(l.police)}>{l.texte}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// Consignes rangées pour l'atelier (16/10/2026) : ce qui vaut pour toute la pièce
// (emplacement, sens d'écriture, police), puis UN BLOC PAR FACE — faces à laisser
// vierges comprises —, puis les autres réglages, puis où et à quelle taille graver.
const cG = { padding: "6px 10px", borderBottom: "1px solid #e7d3a1" };
function Consignes({ item, avecPlacement = true }) {
  const c = consignesGravure(item);
  const rien = !c.general.length && !c.faces.length && !c.autres.length && !(avecPlacement && c.placement.length);
  if (rien) return null;
  return (
    <div className="tg-consignes" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {c.general.length ? (
        <div style={{ border: "1px solid #c9a24b", borderRadius: 8, background: "#fbf3e6", overflow: "hidden" }}>
          {c.general.map((g, i) => (
            <div key={i} style={{ ...cG, display: "flex", gap: 10, borderBottom: i < c.general.length - 1 ? cG.borderBottom : 0 }}>
              <span style={{ minWidth: 120, fontWeight: 600, color: "#6b5418" }}>{g.k}</span>
              <span style={{ fontWeight: g.fort ? 800 : 600, fontSize: g.fort ? "1.1rem" : "0.98rem", color: "#2b2620" }}>{g.v}</span>
            </div>
          ))}
        </div>
      ) : null}
      {c.faces.length ? (
        <div className="tg-faces" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8 }}>
          {c.faces.map((f) => (
            <div key={f.nom} style={{ border: f.vide ? "1px dashed #bbb" : "1px solid #999", borderRadius: 8, background: f.vide ? "#f6f6f6" : "#fff", overflow: "hidden" }}>
              <div style={{ padding: "4px 10px", fontWeight: 800, fontSize: "0.9rem", background: f.vide ? "#eee" : "#f3ece0", color: f.vide ? "#777" : "#2b2620" }}>{f.nom}</div>
              {f.vide ? (
                <div style={{ padding: "6px 10px", color: "#777", fontSize: "0.88rem" }}>Rien à graver : laisser vierge</div>
              ) : f.lignes.map((l, i) => (
                <div key={i} style={{ padding: "5px 10px", borderTop: i ? "1px solid #eee" : 0 }}>
                  <div style={{ fontSize: "0.75rem", color: "#777" }}>{l.k}</div>
                  <div style={{ fontWeight: 700, fontSize: l.texte ? "1.15rem" : "0.95rem", overflowWrap: "anywhere" }}>{l.v}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {c.autres.length ? <LignesTable lignes={c.autres.map((a) => ({ face: a.k, texte: a.v, police: !a.texte }))} /> : null}
      {avecPlacement && c.placement.length ? (
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", margin: "2px 0 4px" }}>Où et à quelle taille graver</div>
          <LignesTable lignes={c.placement.map((p) => ({ face: p.k, texte: p.v, police: true, alerte: p.alerte }))} />
        </div>
      ) : null}
    </div>
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
          {lignes.length ? <Consignes item={item} avecPlacement={false} /> : null}
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
      À graver — {item.name}<VarBadge texte={item.variantDetail || item.variantTitle} grand />
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

  const c = consignesGravure(item);
  if (!c.general.length && !c.faces.length && !c.autres.length && !c.placement.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      {entete}
      <Consignes item={item} />
    </div>
  );
}
