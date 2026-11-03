"use client";
// « Comme sur l'aperçu de la cliente » : lignes du texte de chaque face, telles que l'aperçu 3D les a
// montrées (03/11/2026, commande 0QEIXDI5 : « Axandre Maxim » vu sur DEUX lignes, lu sur une seule).
// Lignes enregistrées avec la commande (`spec.apercuLignes`) ; pour une commande plus ancienne, elles
// sont recalculées ici avec le MÊME code que l'aperçu de la fiche (fonction `lignesApercu`).

import { useEffect, useState } from "react";
import { getProductBySlug } from "@/lib/products";
import { genreApercu, CHAMPS_APERCU } from "@/lib/apercuLignes";
import { lignesApercu as lignesPlaque } from "@/components/EngravePlate3D";
import { lignesApercu as lignesEnveloppe } from "@/components/EngraveEnvelope3D";
import { lignesApercu as lignesLivre } from "@/components/EngraveBook3D";
import { lignesApercu as lignesCoeur } from "@/components/EngraveHeart3D";
import { lignesApercu as lignesGourmette } from "@/components/EngraveGourmette3D";

const CALCUL = { plaque: lignesPlaque, enveloppe: lignesEnveloppe, livre: lignesLivre, coeur: lignesCoeur, gourmette: lignesGourmette };
const COEUR_PAGE = { cover: "cover", page1: "page1", page2: "page2", page3: "page3", backcover: "backcover" };

function libelle(product, key) {
  const f = (product?.personalizationFields || []).find((x) => x.key === key);
  return String(f?.label || key).replace(/\s*\([^)]*€[^)]*\)/g, "").replace(/\s*\(facultatif\)/gi, "").trim();
}

export default function DispositionApercu({ item }) {
  const product = getProductBySlug(item?.slug);
  const genre = genreApercu(product);
  const fields = item?.fields || {};
  const enregistre = item?.apercuLignes || null;
  const [faces, setFaces] = useState(null);

  useEffect(() => {
    if (!genre) return undefined;
    let fini = false;
    const fontField = (product.personalizationFields || []).find((f) => f.type === "font");
    const fontKey = (fontField && fields[fontField.key]) || "playfair";
    const cles = (CHAMPS_APERCU[genre] || []).filter((k) => typeof fields[k] === "string" && fields[k].trim());
    const calculer = () => cles.map((k) => {
      if (enregistre && Array.isArray(enregistre[k]) && enregistre[k].length) {
        return { k, lignes: enregistre[k], source: "commande" };
      }
      let opts = {};
      if (genre === "plaque") opts = { avecPhoto: Boolean(item.photoSrc) && (fields.photoFace || "recto") === k };
      if (genre === "coeur") opts = { avecPhoto: Boolean(item.photoSrc) && (COEUR_PAGE[fields.photoPage] || "page1") === k };
      if (genre === "gourmette") opts = { decor: product.decor3d || "" };
      let lignes = null;
      try { lignes = CALCUL[genre](fields[k], fontKey, opts); } catch { lignes = null; }
      return { k, lignes: lignes || [fields[k].trim()], source: "recalcul" };
    });
    // Les polices du site doivent être chargées avant de mesurer (sinon la coupure change).
    const pret = typeof document !== "undefined" && document.fonts?.ready ? document.fonts.ready : Promise.resolve();
    pret.then(() => { if (!fini) setFaces(calculer()); });
    return () => { fini = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.slug, JSON.stringify(fields), JSON.stringify(enregistre), item?.photoSrc]);

  if (!genre || !faces || !faces.length) return null;
  // Rien à préciser si chaque face tient sur une ligne.
  if (!faces.some((f) => f.lignes.length > 1)) return null;
  const recalcul = faces.some((f) => f.source === "recalcul");

  return (
    <div className="disp-ap" style={{ margin: "6px 0 8px", padding: "8px 10px", border: "2px solid #c9a24b", borderRadius: 8, background: "#fffaf0" }}>
      <div style={{ fontWeight: 800, color: "#8a6d1f", fontSize: "0.9rem", marginBottom: 6 }}>
        📐 Disposition vue par la cliente sur l&apos;aperçu — graver ligne par ligne, centré
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {faces.map((f) => (
          <div key={f.k} style={{ flex: "1 1 150px", minWidth: 0, border: "1px solid #e7d3a1", borderRadius: 6, padding: "6px 8px", background: "#fff" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6b5a2e" }}>{libelle(product, f.k)}</div>
            {f.lignes.map((l, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                <span style={{ fontSize: "0.7rem", color: "#999", fontWeight: 400, marginRight: 6 }}>ligne {i + 1}</span>{l}
              </div>
            ))}
          </div>
        ))}
      </div>
      {recalcul ? (
        <div style={{ marginTop: 6, fontSize: "0.75rem", color: "#777" }}>
          Commande passée avant l&apos;enregistrement des lignes : disposition recalculée avec l&apos;aperçu du site.
        </div>
      ) : null}
    </div>
  );
}
