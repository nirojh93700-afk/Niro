// Réglages des notifications sur le téléphone (15/11/2026, maquette « Niv Admin »). Pur (testable).
export const TELEPHONE_DEFAUT = {
  commande: true, message: true, litige: true, materiel: false, resume: false,
  calme: false, calmeDe: "22:00", calmeA: "07:30", badge: "prep",
};

export function reglageTelephone(notifications) {
  return { ...TELEPHONE_DEFAUT, ...((notifications && notifications.telephone) || {}) };
}

// Heure de Paris « HH:MM » → minutes.
function minutesParis(d) {
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const h = Number(p.find((x) => x.type === "hour")?.value || 0), m = Number(p.find((x) => x.type === "minute")?.value || 0);
  return h * 60 + m;
}
const enMin = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return (h || 0) * 60 + (m || 0); };

export function dansHeuresCalmes(regl, date = new Date()) {
  if (!regl?.calme) return false;
  const t = minutesParis(date), de = enMin(regl.calmeDe), a = enMin(regl.calmeA);
  if (de === a) return false;
  return de < a ? t >= de && t < a : t >= de || t < a;
}
