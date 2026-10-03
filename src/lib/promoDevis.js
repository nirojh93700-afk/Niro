// Vérification SERVEUR d'un code promo pour un devis (03/10/2026). Mêmes verrous que
// /api/promo-validate (expiration, code nominatif lié à une adresse, usage unique par
// e-mail) — le calcul de la remise est dans remiseDevis.js. Les codes « gravure offerte »
// et « carte cadeau » dépendent d'un panier de la boutique : refusés ici, avec un message clair.
import { getPromoCodes, hasUsedCode, ensureWelcomeCode, ensureReferralCode } from "@/lib/stock";
import { calculRemiseDevis } from "@/lib/remiseDevis";

export async function verifierCodeDevis(codeRaw, emailRaw, items) {
  const code = String(codeRaw || "").trim().toUpperCase();
  if (!code) return { valid: false };
  let codes = await getPromoCodes();
  let pc = codes[code];
  if (!pc) {
    const [bienvenue, parrainage] = await Promise.all([ensureWelcomeCode(), ensureReferralCode()]);
    if (bienvenue === code || parrainage === code) { codes = await getPromoCodes(); pc = codes[code]; }
  }
  if (!pc) return { valid: false };
  if (pc.expiresAt && Date.now() > pc.expiresAt) return { valid: false, expired: true };
  const email = String(emailRaw || "").trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (pc.kind === "gravure" || pc.kind === "cadeau") return { valid: false, boutiqueSeulement: true };
  if (pc.email) {
    if (!emailOk) return { valid: false, needEmail: true };
    if (email !== pc.email) return { valid: false, wrongEmail: true };
  }
  if (!pc.reusable) {
    if (!emailOk) return { valid: false, needEmail: true };
    if (await hasUsedCode(code, { email })) return { valid: false, used: true };
  }
  const remise = calculRemiseDevis(pc, items);
  if (!(remise > 0)) return { valid: false };
  const label = pc.type === "fixed" ? `−${pc.value} €` : `−${pc.value} %`;
  return { valid: true, code, remise, label, email: emailOk ? email : "" };
}
