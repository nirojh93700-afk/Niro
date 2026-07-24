"use client";

// Indique au client OÙ le nom et la date seront gravés, SANS écrire par-dessus le
// dessin : une petite étiquette DISCRÈTE sur le côté (hors du logo) + une flèche
// FINE et légère qui pointe l'endroit. Le moins couvrant possible pour l'image.
export default function MotifTextZone({ hasName, hasDate, zone, motifLayout }) {
  const size = motifLayout?.size ?? 0.2;
  const aspect = motifLayout?.aspect ?? 1;
  const mcx = motifLayout?.cx ?? 0.5;
  const mcy = motifLayout?.cy ?? 0.3;
  const toGlass = (p) => ({
    x: mcx + ((p?.x ?? 0.5) - 0.5) * size,
    y: mcy + ((p?.y ?? 0.5) - 0.5) * size * aspect,
  });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tp = hasName && zone?.t ? toGlass(zone.t) : null;
  const dp = hasDate && zone?.d ? toGlass(zone.d) : null;

  // Étiquettes ancrées au bord (jamais coupées) : Nom à gauche, Date à droite.
  const tAnchor = tp ? { x: 3, y: clamp(tp.y * 100, 6, 94) } : null;
  const dAnchor = dp ? { x: 97, y: clamp(dp.y * 100, 6, 94) } : null;

  if (!tp && !dp) return null;
  return (
    <div className="engrave-editor mtz-arrows" style={{ pointerEvents: "none" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="mtz-ah" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L4,2.5 L0,5 Z" fill="#8a8177" />
          </marker>
        </defs>
        {tp && (
          <>
            <line x1={tAnchor.x + 7} y1={tAnchor.y} x2={tp.x * 100} y2={tp.y * 100} stroke="#8a8177" strokeOpacity="0.55" strokeWidth="0.3" markerEnd="url(#mtz-ah)" />
            <circle cx={tp.x * 100} cy={tp.y * 100} r="0.7" fill="#2563eb" />
          </>
        )}
        {dp && (
          <>
            <line x1={dAnchor.x - 7} y1={dAnchor.y} x2={dp.x * 100} y2={dp.y * 100} stroke="#8a8177" strokeOpacity="0.55" strokeWidth="0.3" markerEnd="url(#mtz-ah)" />
            <circle cx={dp.x * 100} cy={dp.y * 100} r="0.7" fill="#e0731f" />
          </>
        )}
      </svg>
      {tp && <span className="mtz-flag t" style={{ top: `${tAnchor.y}%` }}>Nom</span>}
      {dp && <span className="mtz-flag d" style={{ top: `${dAnchor.y}%` }}>Date</span>}
    </div>
  );
}
