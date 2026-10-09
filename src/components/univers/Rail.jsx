"use client";

import { useRef } from "react";
import { Ic } from "./icones";

// Rail horizontal (les dernières sorties) : les cartes sont rendues par le
// serveur et passées en enfants ; seules les flèches sont interactives.
// `lignes` = plusieurs rangées de cartes, chacune son propre rail qui glisse
// séparément (gérant, 09/10/2026 : « deux lignes de produits, qu'il fasse
// défiler de la gauche vers la droite comme avant ») ; les flèches font
// avancer toutes les lignes. Sans `lignes`, les enfants forment une seule ligne.
export default function Rail({ titre, sous, lignes, children }) {
  const racine = useRef(null);
  const go = (dir) => {
    const rails = racine.current ? racine.current.querySelectorAll(".rail") : [];
    rails.forEach((r) => r.scrollBy({ left: r.clientWidth * 0.8 * dir, behavior: "smooth" }));
  };
  const rangs = lignes && lignes.length ? lignes : [children];
  return (
    <section className="sec rail-sec rv" id="nouveautes" aria-labelledby="t-new" ref={racine}>
      <div className="sec-head">
        <div><h2 id="t-new">{titre}</h2><p className="sub">{sous}</p></div>
        <div className="rail-ctrl">
          <button type="button" className="rbtn" onClick={() => go(-1)} aria-label="Précédent"><Ic n="left" /></button>
          <button type="button" className="rbtn" onClick={() => go(1)} aria-label="Suivant"><Ic n="right" /></button>
        </div>
      </div>
      {rangs.map((r, i) => (
        <div className="rail" key={i} tabIndex={0} aria-label={rangs.length > 1 ? `Nouveautés, ligne ${i + 1}` : "Nouveautés"}>{r}</div>
      ))}
    </section>
  );
}
