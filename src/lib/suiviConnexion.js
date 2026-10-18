// CONNEXION À L'ESPACE CLIENT DEPUIS UN E-MAIL (18/10/2026, gérant : « je peux savoir aussi si ils sont
// connectés ? » → maquette validée « applique »). Pur, sans accès aux données : lit une entrée du journal
// `logins` ({ lien, at, n, hist }) et la date d'envoi de l'e-mail.
// - « on »   : au moins une ouverture de l'espace client APRÈS l'envoi (n = ouvertures comptées, dernière = date)
// - « lien » : lien de connexion demandé après l'envoi, jamais ouvert
// - « non »  : rien depuis l'envoi (une simple visite du site sans connexion est invisible)
// Le journal garde 12 ouvertures et 90 jours : au-delà, n est un minimum.
export function connexionDepuis(login, envoyeLe) {
  const depuis = Number(envoyeLe) || 0;
  if (!login || typeof login !== "object") return { etat: "non", n: 0, le: 0 };
  const hist = (Array.isArray(login.hist) ? login.hist : []).map(Number).filter((t) => t && t >= depuis);
  const at = Number(login.at) || 0;
  if (!hist.length && at >= depuis && at) hist.push(at);
  if (hist.length) return { etat: "on", n: hist.length, le: Math.max(...hist) };
  const lien = Number(login.lien) || 0;
  if (lien && lien >= depuis) return { etat: "lien", n: 0, le: lien };
  return { etat: "non", n: 0, le: 0 };
}
