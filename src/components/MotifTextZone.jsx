"use client";

import { useRef, useState, useEffect } from "react";

// Petite FENÊTRE à côté du dessin : montre le texte du client (dans sa police)
// avec une FLÈCHE qui pointe l'endroit exact du modèle où il sera gravé
// (banderole, cadre, écriture du modèle…). Le texte n'est pas superposé au
// dessin — la fenêtre explique clairement où il ira.
export default function MotifTextZone({ lines, fontClass, color, zone, motifLayout, onChange }) {
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
  // Point exact (dans le cadre photo) où le texte sera gravé dans le modèle.
  const zx = mcx + ((zone?.x ?? 0.5) - 0.5) * size;
  const zy = mcy + ((zone?.y ?? 0.5) - 0.5) * size * aspect;

  // La fenêtre se place du côté où il y a de la place (motif à gauche → fenêtre à droite).
  const bubbleRight = zx <= 0.5;
  const bx = bubbleRight ? Math.min(0.97, zx + 0.34) : Math.max(0.03, zx - 0.34);
  const by = Math.max(0.12, Math.min(0.88, zy));

  useEffect(() => {
    if (!onChange) return;
    onChange({ cx: zx, cy: zy, scale: 0.05, fitScale: 0.05, label: "gravé dans le modèle" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zx, zy]);

  if (!lines.length) return null;
  return (
    <div className="engrave-editor" ref={ref} style={{ pointerEvents: "none" }}>
      {/* Flèche : de la fenêtre vers l'endroit gravé */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="mtz-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a98935" />
          </marker>
        </defs>
        <line
          x1={bx * 100} y1={by * 100}
          x2={zx * 100 + (bubbleRight ? 3 : -3)} y2={zy * 100}
          stroke="#a98935" strokeWidth="0.7" strokeDasharray="2 1.6"
          markerEnd="url(#mtz-arrow)" vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className="mtz-bubble"
        style={{
          position: "absolute",
          left: `${bx * 100}%`,
          top: `${by * 100}%`,
          transform: bubbleRight ? "translate(0, -50%)" : "translate(-100%, -50%)",
        }}
      >
        <span className="mtz-cap">Sera gravé ici ➜</span>
        <span className="mtz-txt">
          {lines.map((line, i) => (
            <span key={i} className={fontClass} style={{ color }}>{line}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
