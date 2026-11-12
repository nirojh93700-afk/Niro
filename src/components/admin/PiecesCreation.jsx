"use client";
// La liste écrite des pièces d'une création (support de téléphone, arbre de vie, décoration) : le produit, puis chaque pièce
// avec son texte, son écriture, sa matière, sa place et sa taille en millimètres (12/11/2026, gérant : « il faut que tout
// soit en détail et en morceaux, pour que je découpe et que je colle »). Décoration : mêmes numéros que le fichier et le plan.
import { useEffect, useState } from "react";

const mm = (v) => String(Math.round(v * 10) / 10).replace(".", ",");

export function ListePieces({ pieces, titre, note, papier }) {
  if (!Array.isArray(pieces) || !pieces.length) return null;
  const numerote = pieces.some((p) => p.n > 0);
  return (
    <div style={{ border: "1px solid #d9cbb0", borderRadius: 10, background: "#fff", padding: papier ? "6px 8px" : "10px 12px", fontSize: papier ? "inherit" : 13, lineHeight: 1.45 }}>
      <strong style={{ display: "block", fontSize: papier ? "inherit" : 13.5 }}>{titre || "Les pièces"}</strong>
      {note ? <span style={{ display: "block", fontSize: "0.92em", color: "#6b5d4a" }}>{note}</span> : null}
      <ol style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "grid", gap: papier ? 2 : 6 }}>
        {pieces.map((p, i) => (
          <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", borderTop: i ? "1px solid #efe6d3" : "none", paddingTop: i ? (papier ? 2 : 6) : 0, minWidth: 0 }}>
            {numerote ? <b style={{ flex: "none", minWidth: 22, height: 22, borderRadius: 11, background: "#1a1206", color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{p.n || ""}</b> : null}
            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              <b>{p.nom}</b>{p.sous ? <span style={{ color: "#6b5d4a" }}> · {p.sous}</span> : null}
              <span style={{ display: "block", color: "#3d3222", fontVariantNumeric: "tabular-nums" }}>
                {p.police ? `Écriture ${p.police} · ` : ""}
                {p.w != null && p.h != null ? `${mm(p.w)} × ${mm(p.h)} mm` : ""}
                {p.x != null && p.y != null ? ` · à ${mm(p.x)} mm du bord gauche, ${mm(p.y)} mm du haut` : ""}
              </span>
              {p.alerte ? <span role="alert" style={{ display: "block", color: "#b4452f", fontWeight: 600 }}>⚠ {p.alerte}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Sur la fiche d'une commande : la liste gardée avec la création (celle de l'atelier si le gérant l'a corrigée, sinon celle
// de la cliente). Rien tant qu'aucune liste n'est gardée.
export default function PiecesCreation({ id, papier }) {
  const [c, setC] = useState(null);
  useEffect(() => {
    let vivant = true;
    (async () => {
      try {
        const cle = sessionStorage.getItem("niv-admin-key") || "";
        const r = await fetch(`/api/admin/creation?id=${encodeURIComponent(id)}`, { headers: { "x-admin-key": cle }, cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (vivant) setC(j);
      } catch { /* la fiche s'affiche sans la liste */ }
    })();
    return () => { vivant = false; };
  }, [id]);
  if (!c) return null;
  const atelier = Array.isArray(c.atelierPieces) && c.atelierPieces.length > 0;
  const pieces = atelier ? c.atelierPieces : c.pieces;
  if (!Array.isArray(pieces) || !pieces.length) {
    return papier ? null : <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#6b5d4a" }}>La liste des pièces s&apos;affichera ici après la première ouverture de la création dans l&apos;outil.</p>;
  }
  return (
    <div style={{ margin: "0 0 10px" }}>
      <ListePieces pieces={pieces} papier={papier} titre="Les pièces à découper et à graver"
        note={atelier ? "Version corrigée par l'atelier (celle de la cliente est gardée à côté)." : "Telles que la cliente les a commandées."} />
    </div>
  );
}
