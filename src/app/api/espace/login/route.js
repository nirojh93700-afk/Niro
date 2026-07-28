import { createMagicToken } from "@/lib/stock";
import { sendClientMail, brandedMessage } from "@/lib/clientMail";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Envoi du « lien magique » de connexion à l'espace client.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });

  const token = await createMagicToken(email);
  if (!token) return Response.json({ error: "Impossible de créer le lien." }, { status: 500 });

  const link = `${BRAND.siteUrl}/api/espace/verify?token=${token}`;
  const html = brandedMessage(
    "Votre connexion à Niv Création",
    `Bonjour,\n\nVoici votre lien de connexion à votre espace Niv Création (valable 20 minutes) :\n${link}\n\nSi vous n'avez pas demandé cette connexion, ignorez simplement cet e-mail.\n\nÀ très vite !`
  );
  // On répond toujours OK (on ne révèle pas si l'e-mail existe) — bonne pratique.
  await sendClientMail({ to: email, subject: "Votre lien de connexion — Niv Création", html, bcc: "" });
  return Response.json({ ok: true });
}
