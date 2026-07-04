// Guide des tailles cristal — reproduit fidèlement la maquette validée :
// des blocs de cristal dessinés À L'ÉCHELLE, avec dimensions, poids et nombre
// de personnes conseillé. Rendu identique en vertical (portrait) et horizontal.
const SIZES = [
  { k: "Petit", dim: "5×5×8 cm", w: "~0,5 kg", icon: "👫", ppl: "Couple (1-2)" },
  { k: "Moyen", dim: "5×6×10 cm", w: "~0,8 kg", icon: "👥", ppl: "2-3 personnes" },
  { k: "Grand", dim: "6×8×12 cm", w: "~1,4 kg", icon: "👨‍👩‍👧", ppl: "Famille (2-4)" },
  { k: "XL", dim: "6×10×15 cm", w: "~2,3 kg", icon: "👨‍👩‍👧‍👦", ppl: "Grand groupe (5-6)" },
];

export default function CrystalSizeGuide({ horizontal = false }) {
  const n = SIZES.length;
  return (
    <div className="crystal-guide-section">
      <h3>Quelle taille choisir ?</h3>
      <p className="cg-hint">
        Plus il y a de personnes sur votre photo, plus il faut un grand cristal —
        pour que chaque visage reste net et détaillé.
      </p>
      <div className="crystal-guide">
        {SIZES.map((s, i) => {
          const sc = 0.58 + 0.42 * (i / (n - 1));
          const h = Math.round((horizontal ? 70 : 132) * sc);
          const w = Math.round((horizontal ? 116 : 74) * sc);
          return (
            <div className="cg-item" key={s.k}>
              <div className="cg-block" style={{ width: w, height: h }} />
              <b>{s.k}</b>
              <span className="cg-d">
                {s.dim}
                <br />
                {s.w}
                <br />
                {s.icon} {s.ppl}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
