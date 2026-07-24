"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Sélecteur de modèles par DÉFILEMENT HORIZONTAL (maquette validée) :
// vignettes numérotées qui défilent sur le côté (mobile-friendly), groupes en
// onglets (ex. Couples / Noms & cadres). Touche une vignette = modèle choisi.
// Flèches + dégradés sur les bords pour montrer qu'il y a d'AUTRES motifs à voir.
export default function StyleScroller({ images, groups, value, onChange }) {
  const gs = groups && groups.length ? groups : [{ label: "Modèles", nums: Object.keys(images || {}) }];
  const [gi, setGi] = useState(0);
  const nums = (gs[gi]?.nums || []).map(String).filter((n) => images && images[n]);
  const trackRef = useRef(null);
  const [more, setMore] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [update, gi, nums.length]);

  function nudge(dir) {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.7), behavior: "smooth" });
  }

  return (
    <div className="style-scroller">
      {gs.length > 1 && (
        <div className="ss-chips">
          {gs.map((g, i) => (
            <button type="button" key={g.label} className={`ss-chip${gi === i ? " on" : ""}`} onClick={() => { setGi(i); const el = trackRef.current; if (el) el.scrollLeft = 0; }}>
              {g.label}
            </button>
          ))}
        </div>
      )}
      <div className="ss-viewport">
        {more.left && <button type="button" className="ss-arrow ss-arrow-l" aria-label="Voir les modèles précédents" onClick={() => nudge(-1)}>‹</button>}
        <div className="ss-track" ref={trackRef}>
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
        {more.right && (
          <>
            <span className="ss-fade" aria-hidden="true" />
            <button type="button" className="ss-arrow ss-arrow-r" aria-label="Voir les autres modèles" onClick={() => nudge(1)}>›</button>
          </>
        )}
      </div>
      <p className="ss-note">
        {value && images[String(value)]
          ? <>Modèle choisi : <b>n°{value}</b> (touchez-le à nouveau pour retirer)</>
          : more.right
            ? <>Faites défiler → il y a d&apos;autres modèles.</>
            : "Faites défiler et touchez le modèle que vous voulez."}
      </p>
    </div>
  );
}
