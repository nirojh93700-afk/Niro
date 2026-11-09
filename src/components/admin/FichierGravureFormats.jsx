"use client";

// Le fichier à graver aussi en PNG et en PDF (09/11/2026) : certains logiciels de laser lisent mal
// le SVG. Fabriqués dans le navigateur à partir du MÊME SVG (lettres en tracés) : image à 600 points
// par pouce, fond blanc, à la taille réelle (60 × 30 mm) ; le PDF fait exactement 60 × 30 mm.
import { useState } from "react";

const MM_L = 60, MM_H = 30, PPP = 600;

async function svgVersPng(href) {
  const svg = await fetch(href).then((r) => { if (!r.ok) throw new Error("svg"); return r.text(); });
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const c = document.createElement("canvas");
    c.width = Math.round((MM_L / 25.4) * PPP); c.height = Math.round((MM_H / 25.4) * PPP);
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally { URL.revokeObjectURL(url); }
}

function telecharger(dataUrlOuBlob, nom) {
  const a = document.createElement("a");
  const url = typeof dataUrlOuBlob === "string" ? dataUrlOuBlob : URL.createObjectURL(dataUrlOuBlob);
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  if (typeof dataUrlOuBlob !== "string") setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function FichierGravureFormats({ href, nom }) {
  const [etat, setEtat] = useState("");
  const base = String(nom || "gravure.svg").replace(/\.svg$/i, "");
  const faire = async (format) => {
    setEtat(format);
    try {
      const png = await svgVersPng(href);
      if (format === "png") telecharger(png, `${base}.png`);
      else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [MM_H, MM_L] });
        pdf.addImage(png, "PNG", 0, 0, MM_L, MM_H);
        telecharger(pdf.output("blob"), `${base}.pdf`);
      }
      setEtat("");
    } catch { setEtat("erreur"); }
  };
  const style = { fontWeight: 700, color: "#8a6d1f", background: "none", border: "1px solid #c9a24b", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" };
  return (
    <span className="no-print" style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 8, flexWrap: "wrap" }}>
      <button type="button" style={style} disabled={etat === "png" || etat === "pdf"} onClick={() => faire("png")}>{etat === "png" ? "…" : "⬇ PNG"}</button>
      <button type="button" style={style} disabled={etat === "png" || etat === "pdf"} onClick={() => faire("pdf")}>{etat === "pdf" ? "…" : "⬇ PDF"}</button>
      {etat === "erreur" ? <small style={{ color: "#b02a25" }}>Fichier impossible à fabriquer, prenez le SVG.</small> : null}
    </span>
  );
}
