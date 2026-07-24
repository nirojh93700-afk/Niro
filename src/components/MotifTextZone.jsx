"use client";

// Repères posés PILE sur le modèle, aux emplacements exacts (placés par la gérante) :
// pastille BLEUE = où le nom/texte sera gravé, pastille ORANGE = où la date sera
// gravée. Les repères suivent le motif (déplacement/taille). Le détail lisible
// (le texte du client) est affiché sous la photo, dans un encadré (jamais coupé).
export default function MotifTextZone({ hasName, hasDate, zone, motifLayout }) {
  const size = motifLayout?.size ?? 0.2;
  const aspect = motifLayout?.aspect ?? 1;
  const mcx = motifLayout?.cx ?? 0.5;
  const mcy = motifLayout?.cy ?? 0.3;
  const toGlass = (p) => ({
    x: mcx + ((p?.x ?? 0.5) - 0.5) * size,
    y: mcy + ((p?.y ?? 0.5) - 0.5) * size * aspect,
  });
  const tp = zone?.t ? toGlass(zone.t) : null;
  const dp = zone?.d ? toGlass(zone.d) : null;
  return (
    <div className="engrave-editor" style={{ pointerEvents: "none" }}>
      {hasName && tp && (
        <span className="mtz-dot mtz-dot-t" style={{ left: `${tp.x * 100}%`, top: `${tp.y * 100}%` }}>Nom</span>
      )}
      {hasDate && dp && (
        <span className="mtz-dot mtz-dot-d" style={{ left: `${dp.x * 100}%`, top: `${dp.y * 100}%` }}>Date</span>
      )}
    </div>
  );
}
