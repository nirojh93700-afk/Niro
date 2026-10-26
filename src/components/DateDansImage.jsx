"use client";

// « Mon image contient une date » (26/10/2026, gérant) : l'image est gratuite, une date écrite
// dedans se paie comme un texte. La cliente coche ; l'agent lit l'image en direct et lui montre
// un oubli EN ROUGE (bouton « Cocher la case »). Il ne bloque JAMAIS l'ajout au panier : si elle
// commande sans cocher, le gérant reçoit une alerte (webhook Stripe).
import { useEffect, useRef, useState } from "react";

export default function DateDansImage({ photoUrl, value, onChange, prix = "+3 €" }) {
  const coche = value === "oui";
  const [lecture, setLecture] = useState(null); // null | { etat: "lecture" } | { etat: "fini", verifiee, date, certain }
  const derniere = useRef("");

  // Photo retirée : la case se vide (jamais un supplément payé pour une case cachée).
  useEffect(() => {
    if (!photoUrl && coche) onChange("");
  }, [photoUrl, coche, onChange]);

  useEffect(() => {
    if (!photoUrl || !/\/api\/img\//.test(photoUrl)) { setLecture(null); derniere.current = ""; return; }
    if (derniere.current === photoUrl) return;
    derniere.current = photoUrl;
    let fini = false;
    setLecture({ etat: "lecture" });
    fetch("/api/lecture-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: photoUrl }) })
      .then((r) => r.json())
      .then((d) => { if (!fini && derniere.current === photoUrl) setLecture({ etat: "fini", verifiee: Boolean(d?.verifiee), date: String(d?.date || ""), certain: d?.certain !== false }); })
      .catch(() => { if (!fini) setLecture({ etat: "fini", verifiee: false }); });
    return () => { fini = true; };
  }, [photoUrl]);

  if (!photoUrl) return null;
  const vue = lecture?.etat === "fini" && lecture.verifiee ? lecture.date : null; // "" = rien vu
  const oubli = vue && !coche;

  let message = null;
  if (lecture?.etat === "lecture") {
    message = <div className="did-msg did-wait"><span className="did-spin" aria-hidden="true" />Nous lisons votre image… vous pouvez continuer.</div>;
  } else if (oubli && lecture.certain) {
    message = (
      <div className="did-msg did-rouge" role="alert">
        <span className="did-ic" aria-hidden="true">⚠️</span>
        <span><b>Vous avez oublié de cocher la date.</b> Votre image contient une date : <b>{vue}</b>. Cochez la case ci-dessus : une date est comptée comme un texte ({prix}).
          <button type="button" className="did-btn" onClick={() => onChange("oui")}>Cocher la case</button></span>
      </div>
    );
  } else if (oubli) {
    message = (
      <div className="did-msg did-ambre"><span className="did-ic" aria-hidden="true">!</span>
        <span>Nous croyons voir une date dans votre image : <b>{vue}</b>. Si c&apos;est bien une date, cochez la case ci-dessus.
          <button type="button" className="did-btn did-btn-clair" onClick={() => onChange("oui")}>Cocher la case</button></span></div>
    );
  } else if (vue && coche) {
    message = <div className="did-msg did-vert"><span className="did-ic" aria-hidden="true">✓</span><span>Parfait : nous voyons bien une date dans votre image ({vue}).</span></div>;
  } else if (vue === "" && coche) {
    message = <div className="did-msg did-ambre"><span className="did-ic" aria-hidden="true">!</span><span>Nous ne voyons pas de date dans votre image. Si elle n&apos;en contient pas, vous pouvez décocher la case.</span></div>;
  } else if (vue === "") {
    message = <div className="did-msg did-vert"><span className="did-ic" aria-hidden="true">✓</span><span>Rien à ajouter : nous ne voyons pas de date dans votre image.</span></div>;
  }

  return (
    <div className="did">
      <p className="did-titre">Y a-t-il une date écrite dans votre image ?</p>
      <p className="did-sous">Votre image est comprise. Une date écrite dedans se compte comme un texte, au tarif de la fiche.</p>
      <label className={`did-chk${oubli && lecture.certain ? " oubli" : ""}`}>
        <input type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked ? "oui" : "")} />
        <span><b>Mon image contient une date</b><small>Comptée comme un texte ({prix})</small></span>
      </label>
      {message}
      <p className="did-note">Nous lisons votre image pour vous aider à ne rien oublier. Si quelque chose ne correspond pas, nous vous contactons avant toute gravure.</p>
    </div>
  );
}
