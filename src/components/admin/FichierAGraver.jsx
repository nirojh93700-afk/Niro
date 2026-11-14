"use client";

// « Fichier à graver » de chaque article, fabriqué dans Gestion (14/11/2026, gérant : « je peux toujours
// pas télécharger le fichier pour graver… pour les nouvelles commandes à chaque fois y a pas »).
// La gravure seule, en noir, à la taille réelle : SVG (tracés), PNG (taille écrite dedans), PDF.
import { useEffect, useState } from "react";
import { fichiersPossibles, fabriquerFichier } from "@/lib/fichierAtelier";

const mm = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");
const propre = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

function telecharger(blob, nom) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function UnFichier({ item, f, base }) {
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [pdf, setPdf] = useState(false);
  // Les objets sont recréés à chaque affichage : on ne refabrique que si le CONTENU change.
  const cle = f.id + JSON.stringify([item.slug, item.variantId, item.fields, item.modele, item.modeleTemplate, item.layout, item.photoSrc, f.lignes]);
  useEffect(() => {
    let fini = false;
    setRes(null); setErr("");
    fabriquerFichier(item, f).then((r) => { if (!fini) setRes(r); }).catch((e) => { if (!fini) setErr(String(e?.message || e)); });
    return () => { fini = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
  const nom = res ? `${base}-${propre(f.titre)}-${Math.round(res.mmL)}x${Math.round(res.mmH)}mm` : base;
  const btn = { fontWeight: 700, color: "#7a5c12", background: "#fff", border: "1.5px solid #c9a24b", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" };
  const fairePdf = async () => {
    setPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const data = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(res.png); });
      const doc = new jsPDF({ orientation: res.mmL >= res.mmH ? "landscape" : "portrait", unit: "mm", format: [res.mmL, res.mmH] });
      doc.addImage(data, "PNG", 0, 0, res.mmL, res.mmH);
      telecharger(doc.output("blob"), `${nom}.pdf`);
    } catch { setErr("PDF impossible à fabriquer : prenez le SVG ou le PNG."); }
    setPdf(false);
  };
  return (
    <div style={{ padding: "8px 0", borderTop: "1px solid #f0e3c4" }}>
      <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>{f.titre}</div>
      {err ? <div style={{ color: "#b02a25", fontSize: "0.84rem" }}>Fichier impossible à fabriquer ({err}). Rechargez la page ; sinon dites-le-moi.</div> : null}
      {!res && !err ? <div style={{ fontSize: "0.84rem", color: "#8a7a5c" }}>Fabrication du fichier…</div> : null}
      {res ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={res.apercu} alt={`Fichier à graver : ${f.titre}`} style={{ display: "block", maxWidth: "100%", maxHeight: 180, background: "#fff", border: "1px solid #e7d3a1", borderRadius: 6, padding: 6, boxSizing: "border-box" }} />
          <div style={{ fontSize: "0.86rem", margin: "6px 0", fontWeight: 600 }}>Taille réelle de la gravure : {mm(res.mmL)} × {mm(res.mmH)} mm{res.photo ? " · photo en niveaux de gris" : ""}</div>
          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={() => telecharger(new Blob([res.svg], { type: "image/svg+xml" }), `${nom}.svg`)}>⬇ SVG {res.photo ? "" : "(vecteurs)"}</button>
            <button type="button" style={btn} onClick={() => telecharger(res.png, `${nom}.png`)}>⬇ PNG</button>
            <button type="button" style={btn} disabled={pdf} onClick={fairePdf}>{pdf ? "…" : "⬇ PDF"}</button>
          </div>
          {f.note ? <div style={{ fontSize: "0.78rem", color: "#6b5d48", marginTop: 4 }}>{f.note}</div> : null}
        </>
      ) : null}
    </div>
  );
}

export default function FichierAGraver({ item, refCommande }) {
  const liste = fichiersPossibles(item);
  if (!liste.length) return null;
  const base = `gravure-${propre(refCommande || "commande")}${item.verre ? `-verre${item.verre}` : ""}`;
  return (
    <div className="no-print" style={{ margin: "8px 0 10px", padding: "10px 12px", border: "2px solid #c9a24b", borderRadius: 10, background: "#fffaf0" }}>
      <div style={{ fontWeight: 800, color: "#7a5c12", fontSize: "0.95rem" }}>📥 Fichier à graver — taille réelle</div>
      <div style={{ fontSize: "0.8rem", color: "#6b5d48", margin: "2px 0 4px" }}>La gravure seule, en noir, comme la cliente l&apos;a vue. SVG en tracés : aucune police à installer dans le logiciel du laser.</div>
      {liste.map((f) => <UnFichier key={f.id} item={item} f={f} base={base} />)}
    </div>
  );
}
