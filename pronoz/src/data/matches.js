// Données de démonstration. À remplacer plus tard par une vraie API
// (football-data.org, API-Sports…) ou par Firestore.

export const competitions = {
  l1: { id: "l1", name: "Ligue 1", emoji: "🇫🇷" },
  cl: { id: "cl", name: "Ligue des Champions", emoji: "⭐" },
  pl: { id: "pl", name: "Premier League", emoji: "🏴" },
};

// status : "upcoming" (pronostic ouvert) | "live" | "finished"
export const seedMatches = [
  {
    id: "m1",
    competitionId: "l1",
    kickoff: "2026-06-13T19:00:00Z",
    home: { name: "Paris SG", short: "PSG", color: "#0b2240" },
    away: { name: "Marseille", short: "OM", color: "#2faee0" },
    status: "upcoming",
    result: null,
  },
  {
    id: "m2",
    competitionId: "l1",
    kickoff: "2026-06-13T21:00:00Z",
    home: { name: "Lyon", short: "OL", color: "#1c2c6b" },
    away: { name: "Monaco", short: "ASM", color: "#e2574c" },
    status: "upcoming",
    result: null,
  },
  {
    id: "m3",
    competitionId: "cl",
    kickoff: "2026-06-14T19:00:00Z",
    home: { name: "Real Madrid", short: "RMA", color: "#1a2a6c" },
    away: { name: "Manchester City", short: "MCI", color: "#6cabdd" },
    status: "upcoming",
    result: null,
  },
  {
    id: "m4",
    competitionId: "pl",
    kickoff: "2026-06-14T16:00:00Z",
    home: { name: "Arsenal", short: "ARS", color: "#e2574c" },
    away: { name: "Liverpool", short: "LIV", color: "#c8102e" },
    status: "upcoming",
    result: null,
  },
  {
    id: "m5",
    competitionId: "l1",
    kickoff: "2026-06-10T19:00:00Z",
    home: { name: "Lille", short: "LOSC", color: "#e2574c" },
    away: { name: "Rennes", short: "SRFC", color: "#1b2440" },
    status: "finished",
    result: { home: 2, away: 1 },
  },
  {
    id: "m6",
    competitionId: "cl",
    kickoff: "2026-06-09T21:00:00Z",
    home: { name: "Bayern", short: "FCB", color: "#dc052d" },
    away: { name: "Barcelone", short: "FCB", color: "#a50044" },
    status: "finished",
    result: { home: 3, away: 3 },
  },
];
