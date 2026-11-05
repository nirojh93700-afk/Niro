"use client";
// « Image du site choisie par la cliente » → le fichier d'origine à télécharger, comme une photo envoyée
// (gérant, 05/11/2026). La liste vient de src/lib/imagesOrigine.js (pur).
import { useState } from "react";
import { imagesOrigineArticle } from "@/lib/imagesOrigine";

function Tuile({ im, compact }) {
  const [taille, setTaille] = useState(null);
  const clair = /\/(noel-\d+-blanc|dessin-[a-z-]+)\.(png|webp)$|\/origines\/zodiaque\//i.test(im.src); // traits blancs sur fond transparent
  return (
    <div style={{ width: compact ? 160 : 190, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.3 }}>{im.titre}</div>
      <a href={im.src} target="_blank" rel="noreferrer" title="Ouvrir en grand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={im.src} alt={im.titre} loading="lazy"
          onLoad={(e) => setTaille({ w: e.currentTarget.naturalWidth, txt: `${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight} px` })}
          style={{ width: "100%", aspectRatio: "1", objectFit: "contain", borderRadius: 8, border: "1px solid #e7d3a1", background: clair ? "#222" : "#fff", display: "block" }} />
      </a>
      <span style={{ fontSize: "0.72rem", color: "#8a7a5a" }}>{taille ? taille.txt : " "}</span>
      {taille && taille.w < 600 && !/\.svg$/i.test(im.src) ? (
        <span style={{ fontSize: "0.72rem", color: "#9a4a00", lineHeight: 1.35 }}>⚠ Image petite : c'est la taille du fichier d'origine que nous avons. Un fichier plus grand peut être ajouté.</span>
      ) : null}
      <a href={im.src} download={im.nom} className="btn btn-gold"
        style={{ padding: "6px 10px", fontSize: "0.78rem", textAlign: "center", textDecoration: "none", display: "block" }}>
        ⬇ Télécharger l'image d'origine
      </a>
      {im.note ? <span style={{ fontSize: "0.72rem", color: "#7a6a48", lineHeight: 1.35 }}>{im.note}</span> : null}
    </div>
  );
}

export default function ImagesOrigine({ item, compact = false, titre = true }) {
  const liste = imagesOrigineArticle(item);
  if (!liste.length) return null;
  return (
    <div data-images-origine="" style={{ margin: "10px 0", padding: "10px 12px", background: "#fdfaf3", border: "1px solid #ece0c4", borderRadius: 10 }}>
      {titre ? (
        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8 }}>
          🖼️ Image{liste.length > 1 ? "s" : ""} du site choisie{liste.length > 1 ? "s" : ""} par la cliente — fichier{liste.length > 1 ? "s" : ""} d'origine à graver
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {liste.map((im) => <Tuile key={im.titre + im.src} im={im} compact={compact} />)}
      </div>
    </div>
  );
}
