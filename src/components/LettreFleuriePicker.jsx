"use client";

// Sélecteur "Lettre fleurie" : on montre l'alphabet fleuri (image) et le
// client clique une initiale A→Z. La lettre choisie est renvoyée telle quelle
// (ex. "C") — l'atelier la grave dans le style fleuri de l'image.
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function LettreFleuriePicker({ value, onChange, image }) {
  return (
    <div className="lettre-fleurie">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="lf-alpha"
        src={image || "/produits/alphabet-fleuri.jpg"}
        alt="Alphabet lettres fleuries"
        loading="lazy"
      />
      <div className="lf-letters">
        {LETTERS.map((L) => (
          <button
            type="button"
            key={L}
            className={`lf-btn${value === L ? " on" : ""}`}
            onClick={() => onChange(value === L ? "" : L)}
          >
            {L}
          </button>
        ))}
      </div>
      <p className="lf-note">
        {value
          ? `Lettre fleurie choisie : ${value} — gravée dans le style fleuri de l'image.`
          : "Aucune lettre choisie."}
      </p>
    </div>
  );
}
