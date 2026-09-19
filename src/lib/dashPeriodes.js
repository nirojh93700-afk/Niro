// =============================================================================
// TABLEAU DE BORD — CHIFFRES PAR PÉRIODE (④ sélecteur, maquette du 18/09/2026)
// -----------------------------------------------------------------------------
// Fonctions PURES (testables sans navigateur) : à partir des commandes valides,
// calcule le CA, le nombre de commandes et le panier moyen sur une période, et
// la même chose sur la période PRÉCÉDENTE de même longueur, pour afficher
// « ↗ +18 % vs août ». Un chiffre qui ne bouge jamais n'a rien à faire en haut
// d'un tableau de bord : ici tout est relatif à une période choisie.
// =============================================================================

export const PERIODES = [
  { id: "jour", label: "Aujourd'hui" },
  { id: "7j", label: "7 jours" },
  { id: "mois", label: "Ce mois" },
  { id: "30j", label: "30 jours" },
];

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOUR = 86400000;

// Bornes [debut, fin) de la période courante et de la précédente.
export function bornesPeriode(periode, now = Date.now()) {
  const d = new Date(now);
  const minuit = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (periode === "jour") {
    return { cur: [minuit, minuit + JOUR], prev: [minuit - JOUR, minuit], vs: "vs hier" };
  }
  if (periode === "7j") {
    const debut = minuit - 6 * JOUR; // aujourd'hui compris = 7 jours
    return { cur: [debut, minuit + JOUR], prev: [debut - 7 * JOUR, debut], vs: "vs les 7 jours d'avant" };
  }
  if (periode === "30j") {
    const debut = minuit - 29 * JOUR;
    return { cur: [debut, minuit + JOUR], prev: [debut - 30 * JOUR, debut], vs: "vs les 30 jours d'avant" };
  }
  // mois calendaire
  const debutMois = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const finMois = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  const debutPrev = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
  const prevNom = MOIS[new Date(debutPrev).getMonth()];
  return { cur: [debutMois, finMois], prev: [debutPrev, debutMois], vs: `vs ${prevNom}` };
}

function agrege(orders, [a, b]) {
  let ca = 0, n = 0;
  for (const o of orders) {
    const t = o?.createdAt ? new Date(o.createdAt).getTime() : NaN;
    if (!Number.isFinite(t) || t < a || t >= b) continue;
    ca += Number(o.total) || 0;
    n += 1;
  }
  return { ca: Math.round(ca * 100) / 100, n, panier: n ? Math.round((ca / n) * 100) / 100 : 0 };
}

// Tendance entre deux valeurs : { sens: "up"|"dn"|"eq"|"new", texte }.
export function tendance(cur, prev, { pourcent = true } = {}) {
  if (!prev && !cur) return { sens: "eq", texte: "=" };
  if (!prev && cur) return { sens: "new", texte: "nouveau" };
  if (pourcent) {
    const pct = Math.round(((cur - prev) / prev) * 100);
    if (pct === 0) return { sens: "eq", texte: "= 0 %" };
    return { sens: pct > 0 ? "up" : "dn", texte: `${pct > 0 ? "↗ +" : "↘ −"}${Math.abs(pct)} %` };
  }
  const diff = cur - prev;
  if (diff === 0) return { sens: "eq", texte: "= 0" };
  return { sens: diff > 0 ? "up" : "dn", texte: `${diff > 0 ? "↗ +" : "↘ −"}${Math.abs(diff)}` };
}

// Tout ce qu'il faut pour les 3 premières tuiles d'une période.
export function chiffresPeriode(orders, periode, now = Date.now()) {
  const b = bornesPeriode(periode, now);
  const cur = agrege(orders || [], b.cur);
  const prev = agrege(orders || [], b.prev);
  return {
    periode, vs: b.vs, cur, prev,
    trCa: tendance(cur.ca, prev.ca),
    trN: tendance(cur.n, prev.n, { pourcent: false }),
    trPanier: tendance(cur.panier, prev.panier),
  };
}

// Devis envoyés et pas encore payés (de l'argent posé sur la table).
export function devisEnAttente(quotes) {
  const liste = (quotes || []).filter((q) => q && q.type !== "facture" && q.status !== "paye" && q.status !== "annule");
  const total = Math.round(liste.reduce((s, q) => s + (Number(q.total) || 0), 0) * 100) / 100;
  return { n: liste.length, total, liste };
}

// Commandes encore « à préparer » depuis plus de N jours.
export function commandesEnRetard(orders, jours = 14, now = Date.now()) {
  const limite = now - jours * JOUR;
  return (orders || []).filter((o) => {
    if (!o || o.test) return false;
    const st = o.status || "a_preparer";
    if (st !== "a_preparer") return false;
    const t = o.createdAt ? new Date(o.createdAt).getTime() : NaN;
    return Number.isFinite(t) && t < limite;
  });
}

// « il y a 7 h », « il y a 2 j », « à l'instant ».
export function depuis(ts, now = Date.now()) {
  const t = Number(ts) || 0;
  if (!t) return "";
  const m = Math.max(0, Math.floor((now - t) / 60000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}
