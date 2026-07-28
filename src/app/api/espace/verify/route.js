import { consumeMagicToken } from "@/lib/stock";
import { makeSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/customerAuth";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Clic sur le lien magique : valide le jeton, ouvre la session, redirige vers l'espace.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const email = await consumeMagicToken(token);
  const base = BRAND.siteUrl;
  if (!email) {
    return new Response(null, { status: 302, headers: { Location: `${base}/espace?erreur=lien` } });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${base}/espace`,
      "Set-Cookie": `${SESSION_COOKIE}=${makeSession(email)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_MAX_AGE}`,
    },
  });
}
