import { isAdmin } from "@/lib/stock";
import { sendEmail, sampleClientEmailHtml } from "@/lib/email";

// Envoie un e-mail de test (le modèle de confirmation client) à une adresse donnée.
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const to = String(body?.to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const result = await sendEmail({
    to,
    subject: "Test — Votre commande Niv Création est confirmée",
    html: sampleClientEmailHtml(),
  });

  if (!result.ok) {
    return Response.json(
      { error: "Échec de l'envoi. Vérifie CONTACT_FROM (doit être une adresse @nivcreation.fr) et que le domaine est vérifié dans Resend. Détail : " + (result.error || "") },
      { status: 502 }
    );
  }
  return Response.json({ ok: true });
}
