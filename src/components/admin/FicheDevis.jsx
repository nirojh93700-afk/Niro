"use client";

// « À graver » d'une commande SUR DEVIS : une carte par pièce, avec sa quantité,
// son texte, son style et son fichier à graver — comme une commande normale.
// Sans ça, l'atelier ne voyait que le texte du devis (« combien de verres ? »).

import { lignesDevis } from "@/lib/devisGravure";

const cellCle = { border: "1px solid #999", padding: "6px 10px", width: "38%", fontWeight: 600 };
const cellVal = { border: "1px solid #999", padding: "6px 10px", fontSize: "1.05rem" };

export default function FicheDevis({ order }) {
  const lignes = lignesDevis(order);
  if (!lignes.length) return null;
  const total = lignes.reduce((s, l) => s + l.quantite, 0);
  return (
    <div className="fd-devis" style={{ margin: "8px 0" }}>
      <div style={{ margin: "0 0 8px", padding: "8px 12px", background: "#fdecec", border: "2px solid #d64545", borderRadius: 8, color: "#b32b2b", fontWeight: 700, fontSize: "0.92rem" }}>
        ⚠️ {total} pièce{total > 1 ? "s" : ""} à fabriquer — une par ligne ci-dessous, avec sa propre quantité.
        <div style={{ fontWeight: 600, marginTop: 4, color: "#7a1d1d" }}>
          {lignes.map((l) => `${l.quantite} × ${l.texte ? `« ${l.texte} »` : l.court}`).join("  ·  ")}
        </div>
      </div>
      {lignes.map((l) => (
        <div key={l.rang} className="fd-carte" style={{ border: "1px solid #c9a24b", borderRadius: 8, margin: "0 0 8px", background: "#fff", overflow: "hidden", breakInside: "avoid" }}>
          <div style={{ background: "#fbf3e6", borderBottom: "1px solid #e7d3a1", padding: "4px 10px", fontWeight: 800, color: "#8a6d1f", fontSize: "0.95rem", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span>Pièce {l.rang} / {lignes.length}</span>
            <span>Quantité : {l.quantite}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 8, alignItems: "flex-start" }}>
            {l.fichier ? (
              <a href={l.fichier} target="_blank" rel="noreferrer" title="Ouvrir le fichier à graver" style={{ flex: "0 0 auto", textAlign: "center", textDecoration: "none", fontSize: "0.72rem", color: "#8a6d1f", fontWeight: 600 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.fichier} alt={`Gravure pièce ${l.rang}`} style={{ width: 150, height: 96, objectFit: "contain", borderRadius: 6, border: "2px solid #c9a24b", display: "block", background: "#fff", padding: 4 }} />
                fichier à graver
              </a>
            ) : null}
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                <tbody>
                  <tr><td style={cellCle}>Pièce</td><td style={cellVal}>{l.nom}</td></tr>
                  <tr><td style={cellCle}>Quantité</td><td style={{ ...cellVal, fontWeight: 800 }}>{l.quantite}</td></tr>
                  {l.texte ? <tr><td style={cellCle}>Texte à graver</td><td style={{ ...cellVal, fontSize: "1.2rem" }}>{l.texte}</td></tr> : null}
                  {l.date ? <tr><td style={cellCle}>Date à graver</td><td style={{ ...cellVal, fontSize: "1.2rem" }}>{l.date}</td></tr> : null}
                  {l.dateManquante ? <tr style={{ background: "#fdecec" }}><td style={{ ...cellCle, color: "#b32b2b" }}>Date</td><td style={{ ...cellVal, color: "#b32b2b", fontWeight: 700 }}>⚠️ Le devis dit « + date » sans la préciser — à demander au client avant de graver</td></tr> : null}
                  {l.police ? <tr><td style={cellCle}>Police</td><td style={cellVal}>{l.police}</td></tr> : null}
                  {l.emplacement ? <tr><td style={cellCle}>Emplacement</td><td style={cellVal}>{l.emplacement}</td></tr> : null}
                  {l.emballage ? <tr><td style={cellCle}>Emballage</td><td style={cellVal}>{l.emballage}</td></tr> : null}
                  {l.style ? <tr style={{ background: "#f7f2e6" }}><td style={cellCle}>Style</td><td style={cellVal}>n° {l.style}</td></tr> : null}
                </tbody>
              </table>
              {l.note ? <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#555" }}>{l.note}</div> : null}
              {l.fichier ? (
                <div style={{ margin: "8px 0 0" }}>
                  <a href={l.fichier} download className="btn btn-gold" style={{ padding: "7px 14px", fontSize: "0.82rem", display: "inline-block", textDecoration: "none" }}>
                    ⬇ Télécharger le fichier à graver (SVG)
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
