// Petits utilitaires d'affichage (dates en français).
const DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function formatKickoff(iso) {
  const d = new Date(iso);
  const day = DAYS[d.getDay()];
  const time = `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
  return `${day} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${time}`;
}

export function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}
