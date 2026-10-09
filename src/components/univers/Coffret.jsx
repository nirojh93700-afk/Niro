"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEuro } from "@/lib/format";
import { Ic } from "./icones";

// Coffret assorti Bébé & Enfant (maquette « Mélange ») : les pièces à cocher, le
// prénom écrit une seule fois, le total. Pas de remise : elle n'existe pas au
// paiement (à trancher par le gérant), on n'annonce rien qui ne marche pas.
export default function Coffret({ id = "home", titre, texte, note, pieces, photos, href }) {
  const [coches, setCoches] = useState(pieces.map((p) => !!p.checked));
  const [prenom, setPrenom] = useState("");
  const [live, setLive] = useState(false);
  const total = pieces.reduce((s, p, i) => s + (coches[i] ? p.prix : 0), 0);
  const n = coches.filter(Boolean).length;
  return (
    <div className="cof rv" id={`coffret-${id}`}>
      <div className="cof-txt">
        <h3>Un prénom, un univers : <em>{titre}</em></h3>
        <p>{texte}</p>
        <div className="cof-pick" role="group" aria-label="Pièces du coffret">
          {pieces.map((p, i) => (
            <label key={p.name}>
              <input type="checkbox" checked={coches[i]} disabled={p.bientot} onChange={() => setCoches(coches.map((c, k) => (k === i ? !c : c)))} />
              <span>{p.name}{p.bientot ? " (bientôt)" : ""}</span> <b>{formatEuro(p.prix)}</b>
            </label>
          ))}
        </div>
        <div className="cof-name">
          <label htmlFor={`cofPrenom-${id}`}>Prénom de l’enfant, gravé sur chaque pièce</label>
          <input id={`cofPrenom-${id}`} maxLength={14} placeholder="Ex. Léa" autoComplete="off" value={prenom}
            onChange={(e) => { setPrenom(e.target.value); setLive(true); }} onFocus={() => setLive(true)} onBlur={() => setLive(false)} />
        </div>
        <p className="cof-tot"><b>{formatEuro(total)}</b> <span>{n > 1 ? `pour les ${n} pièces cochées` : n === 1 ? "pour la pièce cochée" : "cochez les pièces du coffret"}</span></p>
        <Link href={href} className="mxbtn mxbtn-gold"><span>Composer mon coffret</span><Ic n="arrow" /></Link>
        <p className="cof-note">{note}</p>
      </div>
      <div className="cof-pics" aria-hidden="true">
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" loading="lazy" />
        ))}
        <span className={`cof-nom${live ? " live" : ""}`}>{prenom.trim() || "Léa"}</span>
      </div>
    </div>
  );
}
