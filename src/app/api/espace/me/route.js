import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/customerAuth";
import { getCagnotte, getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Renvoie l'état de connexion + le solde de cagnotte de la cliente connectée.
// L'e-mail vient UNIQUEMENT de la session signée (jamais du client) → sûr.
// Utilisé par la page panier pour proposer d'utiliser la cagnotte.
export async function GET() {
  const email = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!email) return Response.json({ loggedIn: false });
  let balance = 0, cashbackPercent = 5;
  try { balance = (await getCagnotte(email)).balance; } catch { /* 0 */ }
  try { cashbackPercent = Number((await getSettings()).cashbackPercent) || 0; } catch { /* 5 */ }
  return Response.json({ loggedIn: true, email, balance, cashbackPercent });
}
