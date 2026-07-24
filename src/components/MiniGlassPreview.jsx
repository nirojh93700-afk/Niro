"use client";

// Mini-aperçu flottant (bas à droite) : reprend EN PETIT la vraie photo du verre
// avec le motif et le texte gravés, aux positions/tailles réglées par le client.
// Non interactif — c'est un rappel visuel qui reste sous les yeux quand on descend.
const MW = 150; // largeur du mini-cadre (px)

export default function MiniGlassPreview({
  glassSrc, contain = false,
  artSrc, artLayout,        // photo/motif posé sur le verre + son placement {cx,cy,size}
  lines = [], textLayout,   // texte gravé + son placement {cx,cy,scale}
  fontClass = "", color = "#3a2f1d",
  onClose,
}) {
  if (!glassSrc) return null;
  const aL = artLayout || {};
  const tL = textLayout || {};
  return (
    <div className="mini-glass" role="img" aria-label="Aperçu de votre gravure">
      <div className="mini-head">
        <span>Votre aperçu</span>
        {onClose && <button type="button" onClick={onClose} aria-label="Masquer l'aperçu">×</button>}
      </div>
      <div className="mini-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mini-glass-img" src={glassSrc} alt="" style={{ objectFit: contain ? "contain" : "cover" }} />
        {artSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mini-art"
            src={artSrc}
            alt=""
            style={{
              left: `${(aL.cx ?? 0.5) * 100}%`,
              top: `${(aL.cy ?? 0.3) * 100}%`,
              width: `${(aL.size ?? 0.2) * 100}%`,
            }}
          />
        )}
        {lines.length > 0 && (
          <div
            className="mini-text"
            style={{
              left: `${(tL.cx ?? 0.5) * 100}%`,
              top: `${(tL.cy ?? 0.5) * 100}%`,
              fontSize: `${Math.max(6, (tL.scale ?? 0.06) * MW)}px`,
              color,
            }}
          >
            {lines.map((l, i) => (
              <span key={i} className={fontClass}>{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
