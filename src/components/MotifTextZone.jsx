"use client";

import { useRef, useState, useEffect } from "react";

// Petite FENÊTRE (ancrée au bord, jamais coupée) qui montre le texte du client,
// avec des FLÈCHES qui pointent les emplacements EXACTS où ça sera gravé dans le
// modèle : flèche BLEUE vers le nom/texte, flèche ORANGE vers la date. Les points
// (t = texte, d = date) ont été placés par la gérante et suivent le motif.
export default function MotifTextZone({ nameLines = [], dateLines = [], fontClass, color, zone, motifLayout }) {
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
  const toGlass = (p) => ({
    x: mcx + ((p?.x ?? 0.5) - 0.5) * size,
    y: mcy + ((p?.y ?? 0.5) - 0.5) * size * aspect,
  });
  const tp = zone?.t ? toGlass(zone.t) : null;
  const dp = zone?.d && dateLines.length ? toGlass(zone.d) : null;

  const anchorX = tp ? tp.x : 0.5;
  const bubbleRight = anchorX <= 0.5;
  const arrowStartX = bubbleRight ? 66 : 34;
  const centerY = tp ? tp.y : 0.5;
  const by = Math.max(14, Math.min(86, centerY * 100));

  if (!nameLines.length && !dateLines.length) return null;
  return (
    <div className="engrave-editor mtz-wrap" ref={ref} style={{ pointerEvents: "none" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="mtz-t" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
          <marker id="mtz-d" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#e0731f" />
          </marker>
        </defs>
        {tp && nameLines.length > 0 && (
          <>
            <line x1={arrowStartX} y1={by} x2={tp.x * 100} y2={tp.y * 100} stroke="#2563eb" strokeWidth="0.8" strokeDasharray="2.4 1.8" markerEnd="url(#mtz-t)" vectorEffect="non-scaling-stroke" />
            <circle cx={tp.x * 100} cy={tp.y * 100} r="1.1" fill="#2563eb" />
          </>
        )}
        {dp && (
          <>
            <line x1={arrowStartX} y1={by} x2={dp.x * 100} y2={dp.y * 100} stroke="#e0731f" strokeWidth="0.8" strokeDasharray="2.4 1.8" markerEnd="url(#mtz-d)" vectorEffect="non-scaling-stroke" />
            <circle cx={dp.x * 100} cy={dp.y * 100} r="1.1" fill="#e0731f" />
          </>
        )}
      </svg>
      <div className={`mtz-bubble ${bubbleRight ? "mtz-right" : "mtz-left"}`} style={{ top: `${by}%` }}>
        <span className="mtz-cap">Sera gravé :</span>
        {nameLines.length > 0 && (
          <span className="mtz-row">
            <span className="mtz-key" style={{ background: "#2563eb" }}></span>
            <span className="mtz-txt">{nameLines.map((l, i) => <span key={i} className={fontClass} style={{ color }}>{l}</span>)}</span>
          </span>
        )}
        {dateLines.length > 0 && (
          <span className="mtz-row">
            <span className="mtz-key" style={{ background: "#e0731f" }}></span>
            <span className="mtz-txt">{dateLines.map((l, i) => <span key={i} className={fontClass} style={{ color }}>{l}</span>)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
