import { SESSION_COOKIE } from "@/lib/customerAuth";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Déconnexion : efface le cookie de session.
export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${BRAND.siteUrl}/espace`,
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`,
    },
  });
}
