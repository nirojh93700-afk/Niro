// Jetons de suivi des e-mails de campagne (ouverture + clic).
// Un jeton = base64url("campagne|email"). Aucun secret : ces liens ne donnent
// accès à rien, ils ne servent qu'à compter. Volontairement simple et lisible.

export function makeTrackToken(campaignId, email) {
  const raw = `${campaignId}|${String(email || "").toLowerCase()}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

export function readTrackToken(token) {
  try {
    const raw = Buffer.from(String(token || ""), "base64url").toString("utf8");
    const i = raw.indexOf("|");
    if (i < 1) return null;
    const campaignId = raw.slice(0, i);
    const email = raw.slice(i + 1).toLowerCase();
    if (!campaignId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { campaignId, email };
  } catch {
    return null;
  }
}

// Sécurité : on ne redirige QUE vers le site (jamais vers un domaine tiers),
// sinon le lien de clic deviendrait une redirection ouverte exploitable.
const SITE = "https://nivcreation.fr";
export function safeRedirect(url) {
  const u = String(url || "").trim();
  if (u.startsWith("/")) return SITE + u;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "https:" && /(^|\.)nivcreation\.fr$/.test(parsed.hostname)) return parsed.toString();
  } catch { /* url invalide */ }
  return SITE;
}

// Ajoute le pixel d'ouverture et trace les liens produits d'un e-mail, pour UNE
// destinataire. On ne touche qu'aux liens vers le site ; le reste est laissé tel quel.
export function addTracking(html, campaignId, email) {
  if (!campaignId || !email) return html;
  const token = makeTrackToken(campaignId, email);
  const traced = String(html).replace(
    /href="(https:\/\/nivcreation\.fr\/[^"]*)"/g,
    (m, url) => `href="${SITE}/api/c/${token}?u=${encodeURIComponent(url)}"`
  );
  const pixel = `<img src="${SITE}/api/o/${token}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">`;
  return traced + pixel;
}
