"use client";

import { useRef, useState, useEffect } from "react";

// Petite FENÊTRE ancrée au bord de la photo (jamais coupée) : montre le texte du
// client dans sa police + une FLÈCHE qui pointe l'endroit exact du modèle où il
// sera gravé (banderole, cadre, écriture du modèle…). Le texte n'est pas
// superposé au dessin — la fenêtre explique clairement où il ira.
export default function MotifTextZone({ lines, fontClass, color, zone, motifLayout }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => setW(el.getBoundingClientRect().width);
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = motifLayout?.size ?? 0.2;
  const aspect = motifLayout?.aspect ?? 1;
  const mcx = motifLayout?.cx ?? 0.5;
  const mcy = motifLayout?.cy ?? 0.3;
  // Point exact (dans le cadre photo, 0→1) où le texte sera gravé dans le modèle.
  const zx = mcx + ((zone?.x ?? 0.5) - 0.5) * size;
  const zy = mcy + ((zone?.y ?? 0.5) - 0.5) * size * aspect;

  // La fenêtre est ancrée au bord (jamais coupée) : côté opposé à la zone.
  const bubbleRight = zx <= 0.5;
  const by = Math.max(14, Math.min(86, zy * 100)); // % vertical, gardé dans le cadre
  // x de départ de la flèche = bord intérieur approximatif de la fenêtre.
  const arrowStartX = bubbleRight ? 66 : 34;

  if (!lines.length) return null;
  return (
    <div className="engrave-editor mtz-wrap" ref={ref} style={{ pointerEvents: "none" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="mtz-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a98935" />
          </marker>
        </defs>
        <line
          x1={arrowStartX} y1={by}
          x2={zx * 100} y2={zy * 100}
          stroke="#a98935" strokeWidth="0.8" strokeDasharray="2.4 1.8"
          markerEnd="url(#mtz-arrow)" vectorEffect="non-scaling-stroke"
        />
        <circle cx={zx * 100} cy={zy * 100} r="1.1" fill="#a98935" />
      </svg>
      <div
        className={`mtz-bubble ${bubbleRight ? "mtz-right" : "mtz-left"}`}
        style={{ top: `${by}%` }}
      >
        <span className="mtz-cap">Gravé ici :</span>
        <span className="mtz-txt">
          {lines.map((line, i) => (
            <span key={i} className={fontClass} style={{ color }}>{line}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
