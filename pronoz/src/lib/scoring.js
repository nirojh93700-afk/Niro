// Barème de points Scorecast (style « pronostics entre amis ».)
//  - Score exact ............. 3 points
//  - Bon résultat (1/N/2) .... 1 point
//  - Bonne différence de buts  +1 point bonus (sauf si déjà score exact)
//  - Mauvais résultat ........ 0 point

export const POINTS = {
  EXACT: 3,
  OUTCOME: 1,
  GOAL_DIFF_BONUS: 1,
};

function outcome(home, away) {
  if (home > away) return "1";
  if (home < away) return "2";
  return "N";
}

// pred et result = { home, away }
export function scorePrediction(pred, result) {
  if (!pred || !result) return 0;
  const exact = pred.home === result.home && pred.away === result.away;
  if (exact) return POINTS.EXACT;

  const sameOutcome = outcome(pred.home, pred.away) === outcome(result.home, result.away);
  if (!sameOutcome) return 0;

  let pts = POINTS.OUTCOME;
  const sameDiff = pred.home - pred.away === result.home - result.away;
  if (sameDiff) pts += POINTS.GOAL_DIFF_BONUS;
  return pts;
}

// Détaille le résultat pour l'affichage (libellé + couleur).
export function explainPrediction(pred, result) {
  const pts = scorePrediction(pred, result);
  if (pts >= POINTS.EXACT) return { pts, label: "Score exact", tone: "green" };
  if (pts === 0) return { pts, label: "Manqué", tone: "red" };
  if (pts > POINTS.OUTCOME) return { pts, label: "Bon résultat +diff.", tone: "amber" };
  return { pts, label: "Bon résultat", tone: "amber" };
}
