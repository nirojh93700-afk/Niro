"use client";

// Aperçu du gobelet (comme le mini 3D des bijoux, mais SANS 3D) : la photo du
// gobelet de la couleur choisie, avec des pastilles posées aux endroits où le
// client a placé ses motifs (numéro) ou ses textes. Sert d'aperçu visuel de la
// composition — le vrai gravage est fait à l'atelier d'après ces repères.

// Position (en %) de chaque zone sur la photo du gobelet.
const ZONE_POS = {
  principal: { x: 50, y: 47 },
  haut: { x: 50, y: 29 },
  bas: { x: 50, y: 65 },
  gauche: { x: 35, y: 47 },
  droite: { x: 65, y: 47 },
};

export default function GobeletPreview({ image, composition, mini = false }) {
  const motifs = composition?.motifs || [];
  return (
    <div className={`gp${mini ? " gp-mini" : ""}`}>
      <div className="gp-stage">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="gp-img" src={image} alt="Aperçu du gobelet" />
        )}
        {motifs.map((m, i) => {
          const pos = ZONE_POS[m.zone] || ZONE_POS.principal;
          const isText = m.text != null;
          return (
            <span
              key={i}
              className={`gp-badge${isText ? " gp-text" : ""}${m.zone === "principal" ? " gp-main" : ""}`}
              style={{ left: pos.x + "%", top: pos.y + "%" }}
              title={isText ? m.text : `Motif n°${m.num}`}
            >
              {isText ? m.text : m.num}
            </span>
          );
        })}
      </div>
      <div className="gp-cap">
        {motifs.length
          ? "Aperçu de votre composition"
          : "Choisissez vos motifs pour les voir ici"}
      </div>
    </div>
  );
}
