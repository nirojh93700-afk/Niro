"use client";

// Rappel automatique : déclarer le chiffre d'affaires à l'URSSAF chaque mois.
// Début d'activité : 15 juin 2026 · cotisations mensuelles.
// La 1re déclaration est différée (~90 jours après le début) → fin octobre 2026.

const URSSAF_URL = "https://www.autoentrepreneur.urssaf.fr/";
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function lastDay(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0);
}
function fmt(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DeclarationReminder() {
  const now = new Date();

  // 1re déclaration différée : fin octobre 2026 (différé légal de 90 jours).
  const firstDeadline = lastDay(2026, 9); // 31 octobre 2026

  let next;
  if (now <= firstDeadline) {
    next = firstDeadline;
  } else {
    // Déclaration mensuelle : le CA d'un mois se déclare avant la fin du mois suivant.
    next = lastDay(now.getFullYear(), now.getMonth());
    if (now > next) next = lastDay(now.getFullYear(), now.getMonth() + 1);
  }

  const isFirst = next.getTime() === firstDeadline.getTime();
  const days = Math.ceil((next - now) / 86400000);
  const urgent = days <= 7;

  return (
    <div
      className="admin-block"
      style={{
        background: urgent ? "#fbecea" : "#fbf4e6",
        border: `1px solid ${urgent ? "#e7b7ad" : "#e7d3a1"}`,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>📋</span>
        <div style={{ flex: 1 }}>
          <strong style={{ color: "var(--gold-dark)" }}>
            Déclaration URSSAF — à ne pas oublier
          </strong>
          <p style={{ margin: "6px 0 0", fontSize: "0.92rem", lineHeight: 1.55 }}>
            Pense à déclarer ton chiffre d'affaires <strong>chaque mois</strong>,
            même si tu n'as rien vendu (tu déclares alors <strong>0 €</strong>).
            {" "}
            Prochaine échéance : <strong>avant le {fmt(next)}</strong>
            {urgent ? ` (dans ${days} jour${days > 1 ? "s" : ""} !)` : ""}.
            {isFirst && (
              <>
                {" "}
                <em>
                  (Première déclaration — différée de 90 jours après le début
                  d'activité du 15 juin 2026.)
                </em>
              </>
            )}
          </p>
          <p style={{ margin: "6px 0 10px", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            ⚠️ Un oubli de déclaration entraîne une pénalité (~58 €). En cas de
            doute, déclare 0 €, c'est rapide et gratuit.
          </p>
          <a
            className="btn btn-gold"
            style={{ padding: "6px 16px", fontSize: "0.88rem" }}
            href={URSSAF_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Déclarer sur l'URSSAF →
          </a>
        </div>
      </div>
    </div>
  );
}
