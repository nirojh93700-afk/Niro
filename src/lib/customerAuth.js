import crypto from "crypto";

// Session « espace client » : un cookie signé (HMAC) contenant l'e-mail + une
// expiration. Pas de mot de passe. La signature empêche toute falsification.
const SECRET = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET || "niv-espace-secret-2026";
const MAX_AGE_DAYS = 30;
export const SESSION_COOKIE = "niv_espace";

function sign(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

// Fabrique la valeur du cookie pour un e-mail.
export function makeSession(email) {
  const e = String(email || "").trim().toLowerCase();
  const exp = Date.now() + MAX_AGE_DAYS * 86400000;
  const payload = Buffer.from(`${e}|${exp}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// Vérifie un cookie → renvoie l'e-mail (ou null si invalide/expiré/falsifié).
export function readSession(cookieValue) {
  try {
    const [payload, sig] = String(cookieValue || "").split(".");
    if (!payload || !sig) return null;
    if (sign(payload) !== sig) return null; // signature invalide
    const [email, exp] = Buffer.from(payload, "base64url").toString("utf8").split("|");
    if (!email || !exp || Number(exp) < Date.now()) return null;
    return email;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_DAYS * 86400;
