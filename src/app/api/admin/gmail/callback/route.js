import { getGmailCreds, updateGmail } from "@/lib/stock";
import { exchangeCodeForTokens } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Retour de Google après « Connecter avec Google ». Vérifie l'état (anti-CSRF),
// échange le code contre un refresh token, l'enregistre, puis renvoie l'admin
// vers la Boîte mail. Pas de header admin ici (c'est une redirection navigateur) :
// la sécurité repose sur le jeton "state" à usage unique généré côté admin.
export async function GET(req) {
  const url = new URL(req.url);
  const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").replace(/\/$/, "");
  const dest = (q) => Response.redirect(`${SITE}/gestion/boite-mail${q}`, 302);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) return dest(`?error=${encodeURIComponent(err)}`);
  if (!code || !state) return dest("?error=missing_code");

  const creds = await getGmailCreds();
  if (!creds.oauthState || state !== creds.oauthState) return dest("?error=bad_state");

  try {
    const data = await exchangeCodeForTokens({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      code,
      redirectUri: `${SITE}/api/admin/gmail/callback`,
    });
    if (!data.refresh_token) return dest("?error=no_refresh_token");
    await updateGmail({ refreshToken: data.refresh_token, oauthState: "" });
    return dest("?connected=1");
  } catch (e) {
    return dest(`?error=${encodeURIComponent(e.message || "exchange_failed")}`);
  }
}
