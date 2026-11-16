"use client";
// Récap en haut de la fiche commande (16/11/2026, gérant : « une fenêtre plus simple, plus petite,
// avec les noms des produits et combien ; je clique pour ouvrir »). Chaque produit s'ouvre au toucher
// et montre ce qu'il y a à graver. Le détail complet reste plus bas dans la fiche.
import { compteGravures, compteLigneDevis, piecesDeLigne } from "@/lib/compteGravures";

const court = (v, n = 34) => { const t = String(v || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
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
  if (!rows.length) return null;
  return (
    <div className="ag-rec" id="a-graver-recap">
      <div className="ag-rec-t">✒️ Produits de la commande</div>
      {rows.map((r, i) => (
        <details key={i} className={`ag-rec-r${r.n ? "" : " vide"}`}>
          <summary>
            <span className="ag-rec-nom">{r.nom}{r.detail ? <span className="ag-rec-d"> · {r.detail}</span> : null}</span>
            <span className="ag-rec-q">× {r.pieces}</span>
            <span className={`ag-rec-c${r.n ? "" : " z"}`}>{r.n ? pl(r.n, "gravure", "gravures") : "sans gravure"}</span>
          </summary>
          {r.n ? (
            <div className="ag-rec-e">
              {r.elements.map((e, j) => (
                <span key={j} className="ag-rec-chip">{e.face ? <i>{e.face} · </i> : null}{e.quoi}{valeurChip(e) ? <> : {valeurChip(e)}</> : null}</span>
              ))}
              {r.pieces > 1 ? <span className="ag-rec-chip ag-rec-chip-x">sur chacune des {r.pieces} pièces</span> : null}
            </div>
          ) : <div className="ag-rec-e"><span className="ag-rec-chip">Rien à graver sur ce produit.</span></div>}
        </details>
      ))}
    </div>
  );
}
