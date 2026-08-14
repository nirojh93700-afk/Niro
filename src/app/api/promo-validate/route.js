import { getPromoCodes, hasUsedCode, ensureWelcomeCode, ensureReferralCode } from "@/lib/stock";

export const dynamic = "force-dynamic";

function clientIp(req) {
  return (req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0] || "").trim();
}

// Vérifie un code promo (public) — renvoie le type et la valeur si valide.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ valid: false }); }
  const code = String(body?.code || "").trim().toUpperCase();
  if (!code) return Response.json({ valid: false });
  let codes = await getPromoCodes();
  let pc = codes[code];
  // Code de bienvenue promis par e-mail mais jamais créé dans Promotions : on
  // le crée à la volée pour qu'il fonctionne (au lieu d'être refusé à tort).
  if (!pc) {
    const [bienvenue, parrainage] = await Promise.all([ensureWelcomeCode(), ensureReferralCode()]);
    if (bienvenue === code || parrainage === code) {
      codes = await getPromoCodes();
      pc = codes[code];
    }
  }
  if (!pc) return Response.json({ valid: false });
  // Code expiré (durée de validité dépassée) → invalide.
  if (pc.expiresAt && Date.now() > pc.expiresAt) return Response.json({ valid: false, expired: true });
  // Code ambassadeur (reusable) : pas de limite « une fois par cliente ».
  // Code à usage unique : on vérifie PAR PERSONNE (e-mail). L'ancienne
  // vérification par adresse internet bloquait à tort deux personnes d'un même
  // foyer, et laissait passer un simple changement de réseau (wifi → 4G).
  // L'adresse internet ne sert plus que de garde-fou si aucun e-mail n'est donné.
  if (!pc.reusable) {
    const email = String(body?.email || "").trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return Response.json({ valid: false, needEmail: true });
    if (await hasUsedCode(code, { email })) return Response.json({ valid: false, used: true });
  }
  return Response.json({
    valid: true,
    code,
    type: pc.type,
    value: pc.value,
    label: pc.type === "fixed" ? `−${pc.value} €` : `−${pc.value} %`,
  });
}
