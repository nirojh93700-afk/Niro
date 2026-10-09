"use client";

import { useRef } from "react";
import { Ic } from "./icones";

// Rail horizontal (les dernières sorties) : les cartes sont rendues par le
// serveur et passées en enfants ; seules les flèches sont interactives.
export default function Rail({ titre, sous, children }) {
  const rail = useRef(null);
  const go = (dir) => { const r = rail.current; if (r) r.scrollBy({ left: r.clientWidth * 0.8 * dir, behavior: "smooth" }); };
  return (
    <section className="sec rail-sec rv" id="nouveautes" aria-labelledby="t-new">
      <div className="sec-head">
        <div><h2 id="t-new">{titre}</h2><p className="sub">{sous}</p></div>
        <div className="rail-ctrl">
          <button type="button" className="rbtn" onClick={() => go(-1)} aria-label="Précédent"><Ic n="left" /></button>
          <button type="button" className="rbtn" onClick={() => go(1)} aria-label="Suivant"><Ic n="right" /></button>
        </div>
      </div>
      <div className="rail" ref={rail} tabIndex={0} aria-label="Nouveautés">{children}</div>
    </section>
  );
}
