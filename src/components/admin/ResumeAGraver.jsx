"use client";
// Récap en haut de la fiche commande (16/11/2026, gérant : « au-dessus de la page, dis-moi
// combien il y a de gravures par produit »). Lecture seule : les consignes détaillées restent plus bas.
import { compteGravures, compteLigneDevis, piecesDeLigne } from "@/lib/compteGravures";

const court = (v, n = 34) => { const t = String(v || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
// Ce qu'il y a à graver, en court : un texte entre guillemets, un dessin / un modèle par son nom.
function valeurChip(e) {
  const v = String(e.valeur || "").trim();
  if (!v || /^envoy[ée]e par la cliente/i.test(v) || v.toLowerCase() === String(e.quoi || "").toLowerCase()) return "";
  if (/[«»]/.test(v)) return court(v, 44);
  return e.texte ? `« ${court(v)} »` : court(v, 44);
}
const pl = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

export default function ResumeAGraver({ lignes }) {
  const rows = (lignes || []).map(({ it, s }) => {
    const c = s ? compteGravures(s) : compteLigneDevis(it);
    return { nom: it.name, detail: s?.variantDetail || it.variantDetail || "", pieces: piecesDeLigne(it, s), ...c };
  });
  const total = rows.reduce((a, r) => a + r.n * Math.max(1, r.pieces), 0);
  const avec = rows.filter((r) => r.n);
  return (
    <div className="ag-rec" id="a-graver-recap">
      <div className="ag-rec-h">
        <span className="ag-rec-t">✒️ À graver dans cette commande</span>
        <span className="ag-rec-n">{total ? pl(total, "gravure", "gravures") : "Rien à graver"}</span>
      </div>
      <ul className="ag-rec-l">
        {rows.map((r, i) => (
          <li key={i} className={r.n ? "" : "vide"}>
            <div className="ag-rec-p">
              <b>{r.nom}</b>{r.detail ? <span className="ag-rec-d"> · {r.detail}</span> : null}
              {r.pieces > 1 ? <span className="ag-rec-x">× {r.pieces} pièces</span> : null}
              <span className={`ag-rec-c ${r.n ? "" : "z"}`}>{r.n ? `${pl(r.n, "gravure", "gravures")}${r.pieces > 1 ? " chacune" : ""}` : "sans gravure"}</span>
            </div>
            {r.n ? (
              <div className="ag-rec-e">
                {r.elements.map((e, j) => (
                  <span key={j} className="ag-rec-chip">{e.face ? <i>{e.face} · </i> : null}{e.quoi}{valeurChip(e) ? <> : {valeurChip(e)}</> : null}</span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {avec.length ? <a href="#a-graver" className="ag-rec-lien" onClick={(ev) => { const el = document.querySelector(".fc-tg"); if (el) { ev.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } }}>Voir le détail de chaque gravure ↓</a> : null}
    </div>
  );
}
