"use client";
// L'aperçu 3D que la cliente a vu sur la fiche au moment de commander (05/11/2026, commande 0BHBVOXK,
// Collier Plaque Acier noir, « Mon homme formidable » au verso : « tu m'as pas mis le visuel qu'elle avait
// quand elle a commandé »). Les bijoux à aperçu 3D n'enregistrent pas d'image : on redessine ici le MÊME
// composant 3D que la fiche, avec SES réglages (texte, face, finition, police, photo, motifs). Les calculs
// des propriétés sont recopiés de ProductDetail.jsx : les garder identiques.

import dynamic from "next/dynamic";
import { getProductBySlug } from "@/lib/products";

const Engrave3D = dynamic(() => import("@/components/Engrave3D"), { ssr: false });
const EngraveHeart3D = dynamic(() => import("@/components/EngraveHeart3D"), { ssr: false });
const EngraveBook3D = dynamic(() => import("@/components/EngraveBook3D"), { ssr: false });
const EngraveEnvelope3D = dynamic(() => import("@/components/EngraveEnvelope3D"), { ssr: false });
const EngravePlate3D = dynamic(() => import("@/components/EngravePlate3D"), { ssr: false });
const EngraveGourmette3D = dynamic(() => import("@/components/EngraveGourmette3D"), { ssr: false });

/** Le produit a-t-il un aperçu 3D sur sa fiche ? */
export function a3D(p) {
  return Boolean(p && !p.model3d && (p.engrave3d || p.engraveHeart3d || p.engraveBook3d || p.engraveEnvelope3d
    || p.engravePlate3d || p.engraveGourmette3d || p.engraveSilicone3d || p.engraveLeather3d || p.engraveBar3d));
}

const FINISH_MAP = { "argenté": "silver", "argente": "silver", "doré": "gold", "dore": "gold", "noir": "black", "or rose": "rose", "arc en ciel": "rainbow" };
const HEART_PAGE_INDEX = { cover: 0, page1: 1, page2: 2, page3: 3, backcover: 4 };

export default function Apercu3DCommande({ item, hauteur = 300 }) {
  const p = getProductBySlug(item?.slug);
  if (!a3D(p)) return null;
  const fv = item.fields || {};
  const v = (p.variants || []).find((x) => x.id === item.variantId);
  const titre = String(v?.title || item.variantTitle || "");
  const t = titre.toLowerCase();
  const fontField = (p.personalizationFields || []).find((f) => f.type === "font");
  const fontKey = (fontField && fv[fontField.key]) || "playfair";
  const photo = item.photoSrc || null;
  const commun = { fontKey, height: hauteur, showHint: false };

  let rendu;
  if (p.engraveGourmette3d || p.engraveSilicone3d || p.engraveLeather3d || p.engraveBar3d) {
    const fin = t.includes("rose") ? "rose" : t.includes("dor") ? "gold" : t.includes("noir") ? "black" : "silver";
    const band = p.engraveLeather3d ? "leather" : p.engraveSilicone3d ? "silicone" : p.engraveBar3d ? "finechain" : "chain";
    rendu = <EngraveGourmette3D {...commun} text={fv.texte || ""} finish={p.engraveGourmette3d ? "silver" : fin} band={band} slim={Boolean(p.engraveBar3d)} decor={p.decor3d || ""} />;
  } else if (p.engravePlate3d) {
    const finish = t.includes("dor") ? "gold" : (t.includes("noir") && !t.includes("argent")) ? "black" : "silver";
    rendu = <EngravePlate3D {...commun} faces={[fv.recto || "", fv.verso || ""]} motifPos={fv.textPos} photo={photo} photoFace={fv.photoFace || "recto"} finish={finish} />;
  } else if (p.engraveEnvelope3d) {
    const faces = [fv.recto || "", fv.verso || ""];
    const finish = t.includes("rose") ? "rose" : t.includes("argent") ? "silver" : "gold";
    rendu = <EngraveEnvelope3D {...commun} faces={faces} finish={finish} twoSided={Boolean(faces[1].trim()) || titre.includes("Recto-Verso")} />;
  } else if (p.engraveBook3d) {
    const finish = t.includes("argent") && t.includes("dor") ? "bicolore" : t.includes("dor") ? "gold" : "silver";
    rendu = (
      <EngraveBook3D {...commun} finish={finish}
        faces={[fv.couverture || "", fv.page1 || "", fv.page2 || "", fv.page3 || ""]}
        motifs={[1, 2, 3, 4].map((i) => fv["motif" + i] || "")}
        motifPositions={[1, 2, 3, 4].map((i) => fv["motifPos" + i] || "hd")} />
    );
  } else if (p.engraveHeart3d) {
    const finish = t.includes("bicolore") ? "bicolore" : (t.includes("doré") || t.includes("dore")) ? "gold" : "silver";
    rendu = (
      <EngraveHeart3D {...commun} key={finish} finish={finish} photo={photo} photoIndex={HEART_PAGE_INDEX[fv.photoPage] ?? 1}
        faces={[fv.cover || "", fv.page1 || "", fv.page2 || "", fv.page3 || "", fv.backcover || ""]} />
    );
  } else {
    // Même règle que la fiche : les champs texte VISIBLES pour l'option et les choix de la cliente.
    const visibles = (p.personalizationFields || []).filter((f) =>
      (!f.variantContains || titre.includes(f.variantContains))
      && (!f.requiresField || String(fv[f.requiresField] || "").trim())
      && (!f.showIfEmplacement || fv.emplacement === f.showIfEmplacement)
      && (!f.showIfField || fv[f.showIfField] === f.showIfValue));
    const faces = visibles.filter((f) => f.type === "text" || f.type === "textarea" || !f.type).map((f) => fv[f.key] || "");
    rendu = (
      <Engrave3D {...commun} faces={faces} finish={FINISH_MAP[t] || "silver"}
        motifs={[1, 2, 3, 4].map((i) => fv["motif" + i] || "")}
        motifPositions={[1, 2, 3, 4].map((i) => (fv["motifPos" + i] === "below" ? "below" : "above"))}
        direction={fv.sens === "down" ? "down" : "up"} />
    );
  }

  return (
    <div style={{ width: 300, maxWidth: "100%", borderRadius: 10, border: "1px solid #e7d3a1", background: "#fffaf0", padding: "6px 6px 8px" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#8a6d1f", padding: "2px 4px 4px" }}>
        Aperçu 3D vu par la cliente à la commande
      </div>
      {rendu}
      <div style={{ fontSize: "0.72rem", color: "#7a7268", textAlign: "center", marginTop: 4 }}>
        Faites-le tourner avec la souris ou le doigt pour voir chaque face.
      </div>
    </div>
  );
}
