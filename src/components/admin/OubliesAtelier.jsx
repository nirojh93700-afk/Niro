"use client";

// Filet de sécurité de l'atelier (16/10/2026, « je veux plus le même problème pour les commandes ») :
// tout choix de la cliente que le tableau « À graver », les photos ou « Vendu en plus » ne montrent
// pas est affiché ici, en rouge — rien de ce qu'elle a choisi ne peut plus rester caché.
// Logique : src/lib/controleAtelier.js (oubliesAtelier).

import { oubliesAtelier } from "@/lib/controleAtelier";

export default function OubliesAtelier({ item }) {
  let oublis = [];
  try { oublis = oubliesAtelier(item); } catch { oublis = []; }
  if (!oublis.length) return null;
  return (
    <div className="oa">
      <div className="oa-titre">⚠️ Aussi choisi par la cliente — à graver / à vérifier</div>
      <ul className="oa-liste">
        {oublis.map((o) => (
          <li key={o.cle}>
            <b>{o.libelle}</b>
            {o.photo ? (
              <span className="oa-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.valeur} alt={o.libelle} />
                <a href={o.valeur} download target="_blank" rel="noreferrer">Télécharger</a>
              </span>
            ) : <span> : {o.valeur}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
