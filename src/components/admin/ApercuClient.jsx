"use client";

// Aperçu d'un côté du verre (face ou fond) redessiné TEL QUE LA CLIENTE L'A VU sur la fiche :
// photo carrée du verre vierge, sa photo en rendu « gravé » à la place et à la taille qu'elle a
// réglées, son texte dans sa police à l'endroit choisi. Mêmes règles que l'éditeur de la fiche
// (PhotoEngraveLayer / TextEngraveLayer), mêmes données que la commande (src/lib/apercuCote.js).
// Gérant, 16/10/2026 (commande 10OPUHMO) : « comme la cliente a choisi, il faut que ce soit
// pareil dans l'atelier ».

import { useEffect, useRef, useState } from "react";
import { contenuCote } from "@/lib/apercuCote";
import { getFontClass } from "@/lib/fonts";

const COULEUR = "#3a2f1d"; // même teinte de gravure que la fiche produit

export default function ApercuClient({ item, side = "face", largeur = 240, titre = true }) {
  const c = contenuCote(item, side);
  const ref = useRef(null);
  const [w, setW] = useState(largeur);
  // Le texte se dimensionne sur la largeur réelle du cadre (comme sur la fiche).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width || largeur));
    ro.observe(el);
    return () => ro.disconnect();
  }, [largeur]);
  if (!c.glass) return null;
  const box = c.box || { left: 0.2, top: 0.2, width: 0.6, height: 0.6 };
  const pL = c.photoLayout || {};
  const tL = c.textLayout || {};
  const tcx = tL.cx ?? box.left + box.width / 2;
  const tcy = tL.cy ?? box.top + box.height * 0.85;
  const fs = Math.max(6, (tL.fitScale || tL.scale || 0.05) * w);
  return (
    <figure className="apc" style={{ width: largeur }}>
      {titre ? <figcaption className="apc-titre">{side === "fond" ? "Fond du verre" : "Face avant"} — vu par la cliente</figcaption> : null}
      <div className="apc-scene" ref={ref}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="apc-verre" src={c.glass} alt="" />
        {c.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="apc-photo"
            src={c.photo}
            alt=""
            style={{
              left: `${(pL.cx ?? box.left + box.width / 2) * 100}%`,
              top: `${(pL.cy ?? box.top + box.height / 2) * 100}%`,
              width: `${(pL.size ?? box.width * 0.75) * 100}%`,
            }}
          />
        ) : null}
        {c.lines.length ? (
          <div className="apc-texte" style={{ left: `${tcx * 100}%`, top: `${tcy * 100}%`, fontSize: `${fs}px` }}>
            {c.lines.map((l, i) => <span key={i} className={getFontClass(c.fontKey)} style={{ color: COULEUR }}>{l}</span>)}
          </div>
        ) : null}
      </div>
    </figure>
  );
}
