import { getPromoCodes, hasUsedCode, ensureWelcomeCode, ensureReferralCode } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";
import { prixPremiereGravure } from "@/lib/engravingPrice";

// Offre « gravure offerte » : le panier envoie ses articles (même forme qu'au
// paiement) pour qu'on annonce la VRAIE remise — le prix de la première gravure
// payante trouvée — et non un montant fixe. Même calcul que /api/checkout.
async function remiseGravure(items) {
  if (!Array.isArray(items) || !items.length) return 0;
  const products = await getCatalog();
  const index = new Map();
  for (const p of products) for (const v of p.variants || []) index.set(v.id, { product: p, variant: v });
  for (const it of items.slice(0, 40)) {
    const m = index.get(it?.variantId);
    if (!m) continue;
    const champs = (Array.isArray(it.perGlass) && it.perGlass.length > 0) ? (it.perGlass[0] || {}) : (it.fields || {});
    const prix = prixPremiereGravure(m.product, champs, m.variant.id) || 0;
    if (prix > 0) return prix;
  }
  return 0;
}

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
  // CODE NOMINATIF : réservé à UNE adresse (offre gravure offerte). Une autre
  // adresse est refusée → partager son code ne sert à rien.
  if (pc.email) {
    const email = String(body?.email || "").trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return Response.json({ valid: false, needEmail: true });
    if (email !== pc.email) return Response.json({ valid: false, wrongEmail: true });
  }
  if (!pc.reusable) {
    const email = String(body?.email || "").trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return Response.json({ valid: false, needEmail: true });
    if (await hasUsedCode(code, { email })) return Response.json({ valid: false, used: true });
  }
  // Code « gravure offerte » : la remise dépend du panier. Sans gravure payante
  // dedans, on le dit tout de suite (plutôt qu'un code accepté qui ne déduit rien).
  if (pc.kind === "gravure") {
    const remise = await remiseGravure(body?.items);
    if (!(remise > 0)) return Response.json({ valid: false, noEngraving: true, kind: "gravure" });
    return Response.json({
      valid: true, code, kind: "gravure", type: "fixed", value: remise,
      label: `gravure offerte, −${remise.toFixed(2).replace(".", ",")} €`,
    });
  }
  return Response.json({
    valid: true,
    code,
    type: pc.type,
    value: pc.value,
    label: pc.type === "fixed" ? `−${pc.value} €` : `−${pc.value} %`,
  });
}
