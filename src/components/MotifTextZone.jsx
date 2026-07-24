"use client";

// Indique au client OÙ le nom et la date seront gravés, SANS écrire par-dessus le
// dessin : une petite étiquette sur le côté (hors du logo) + une FLÈCHE qui pointe
// l'endroit exact. Bleu = nom/texte, orange = date. Jamais superposé au dessin.
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
  const tAnchor = tp ? { x: 3, y: clamp(tp.y * 100, 7, 93) } : null;
  const dAnchor = dp ? { x: 97, y: clamp(dp.y * 100, 7, 93) } : null;

  if (!tp && !dp) return null;
  return (
    <div className="engrave-editor mtz-arrows" style={{ pointerEvents: "none" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="mtz-ah-t" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
            <path d="M0,0 L5,3 L0,6 Z" fill="#2563eb" />
          </marker>
          <marker id="mtz-ah-d" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
            <path d="M0,0 L5,3 L0,6 Z" fill="#e0731f" />
          </marker>
        </defs>
        {tp && (
          <>
            <line x1={tAnchor.x + 8} y1={tAnchor.y} x2={tp.x * 100} y2={tp.y * 100} stroke="#2563eb" strokeWidth="0.7" markerEnd="url(#mtz-ah-t)" />
            <circle cx={tp.x * 100} cy={tp.y * 100} r="1" fill="#2563eb" stroke="#fff" strokeWidth="0.4" />
          </>
        )}
        {dp && (
          <>
            <line x1={dAnchor.x - 8} y1={dAnchor.y} x2={dp.x * 100} y2={dp.y * 100} stroke="#e0731f" strokeWidth="0.7" markerEnd="url(#mtz-ah-d)" />
            <circle cx={dp.x * 100} cy={dp.y * 100} r="1" fill="#e0731f" stroke="#fff" strokeWidth="0.4" />
          </>
        )}
      </svg>
      {tp && <span className="mtz-flag t" style={{ top: `${tAnchor.y}%` }}>Nom</span>}
      {dp && <span className="mtz-flag d" style={{ top: `${dAnchor.y}%` }}>Date</span>}
    </div>
  );
}
