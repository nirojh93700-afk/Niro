"use client";

import { useState } from "react";

// Sélecteur de modèles par DÉFILEMENT HORIZONTAL (maquette validée) :
// vignettes numérotées qui défilent sur le côté (mobile-friendly), groupes en
// onglets (ex. Couples / Noms & cadres). Touche une vignette = modèle choisi.
export default function StyleScroller({ images, groups, value, onChange }) {
  const gs = groups && groups.length ? groups : [{ label: "Modèles", nums: Object.keys(images || {}) }];
  const [gi, setGi] = useState(0);
  const nums = (gs[gi]?.nums || []).map(String).filter((n) => images && images[n]);
  return (
    <div className="style-scroller">
      {gs.length > 1 && (
        <div className="ss-chips">
          {gs.map((g, i) => (
            <button type="button" key={g.label} className={`ss-chip${gi === i ? " on" : ""}`} onClick={() => setGi(i)}>
              {g.label}
            </button>
          ))}
        </div>
      )}
      <div className="ss-track">
        {nums.map((n) => (
          <button
            type="button"
            key={n}
            className={`ss-thumb${String(value) === n ? " on" : ""}`}
            onClick={() => onChange(String(value) === n ? "" : n)}
            aria-label={`Modèle n°${n}`}
          >
            <span className="ss-n">{n}</span>
            <span className="ss-ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[n]} alt={`Modèle n°${n}`} loading="lazy" />
            </span>
          </button>
        ))}
      </div>
      <p className="ss-note">
        {value && images[String(value)] ? <>Modèle choisi : <b>n°{value}</b> (touchez-le à nouveau pour retirer)</> : "Faites défiler et touchez le modèle que vous voulez."}
      </p>
    </div>
  );
}
