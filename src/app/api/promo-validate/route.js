import { getPromoCodes, hasUsedCode, ensureWelcomeCode } from "@/lib/stock";

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
    const bienvenue = await ensureWelcomeCode();
    if (bienvenue === code) {
      codes = await getPromoCodes();
      pc = codes[code];
    }
  }
  if (!pc) return Response.json({ valid: false });
  // Code expiré (durée de validité dépassée) → invalide.
  if (pc.expiresAt && Date.now() > pc.expiresAt) return Response.json({ valid: false, expired: true });
  // Code ambassadeur (reusable) : pas de limite « une fois par cliente ».
  if (!pc.reusable && await hasUsedCode(code, { ip: clientIp(req) })) {
    return Response.json({ valid: false, used: true });
  }
  return Response.json({
    valid: true,
    code,
    type: pc.type,
    value: pc.value,
    label: pc.type === "fixed" ? `−${pc.value} €` : `−${pc.value} %`,
  });
}
