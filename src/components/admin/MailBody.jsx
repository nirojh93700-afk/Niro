"use client";

import { useState } from "react";
import { separerCitation, compterLignes } from "@/lib/mailQuote";

// =============================================================================
// AFFICHAGE D'UN MESSAGE (côté gestion) — la seule façon d'afficher le texte
// d'un e-mail dans l'admin. À réutiliser partout : fil d'aperçu/BAT, boîte mail,
// dossier de communication d'une cliente.
//
// Ce qu'il garantit (demande du gérant, 19/09/2026 — « les mails c'est moche,
// j'arrive pas à lire, y a pas d'espace ») :
//   - les mots trop longs (liens, adresses) sont COUPÉS au lieu de déborder ;
//   - interligne confortable, pas de mur de texte ;
//   - la réponse citée (« > », « Le … a écrit : ») est REPLIÉE derrière un
//     bouton, comme dans Gmail — rien n'est perdu, juste rangé.
// =============================================================================
export default function MailBody({ text, className = "" }) {
  const [ouvert, setOuvert] = useState(false);
  const { main, quoted } = separerCitation(text);

  return (
    <div className={`mb ${className}`.trim()}>
      <div className="mb-text">{main}</div>
      {quoted ? (
        <>
          <button type="button" className="mb-quotebtn" onClick={() => setOuvert((o) => !o)}>
            <i aria-hidden>···</i>
            {ouvert ? "Masquer le texte cité" : `Afficher le texte cité (${compterLignes(quoted)} lignes)`}
          </button>
          {ouvert ? <div className="mb-quoted">{quoted}</div> : null}
        </>
      ) : null}
    </div>
  );
}
