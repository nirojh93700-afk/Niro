import { getBatThreadByToken, batCustomerMessage } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";

// Vue publique du fil par jeton (lien envoyé à la cliente). On ne renvoie pas
// l'e-mail complet — juste ce qu'il faut pour la page.
function publicView(th) {
  if (!th) return null;
  return {
    ref: th.ref || "",
    status: th.status || "en_attente",
    messages: (th.messages || []).map((m) => ({ from: m.from, text: m.text, image: m.image || "", decision: m.decision || "", at: m.at })),
  };
}

export async function GET(_req, { params }) {
  const th = await getBatThreadByToken(params.token);
  if (!th) return Response.json({ error: "Lien invalide." }, { status: 404 });
  return Response.json({ thread: publicView(th) });
}

// Réponse de la cliente : message libre et/ou décision (valide / modif).
export async function POST(req, { params }) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const text = String(body?.text || "").trim();
  const decision = body?.decision === "valide" ? "valide" : body?.decision === "modif" ? "modif" : "";
  if (!text && !decision) return Response.json({ error: "Ajoutez un message ou une réponse." }, { status: 400 });

  const th = await batCustomerMessage(params.token, { text, decision });
  if (!th) return Response.json({ error: "Lien invalide." }, { status: 404 });

  // Notifie l'atelier (e-mail).
  const to = (process.env.CONTACT_EMAIL || BRAND.contact || "").trim();
  if (to && process.env.RESEND_API_KEY) {
    const label = decision === "valide" ? "✅ Aperçu VALIDÉ" : decision === "modif" ? "✏️ Modification demandée" : "💬 Nouveau message";
    const html = emailLayout({
      heading: `${label}${th.ref ? ` — commande #${escapeHtml(th.ref)}` : ""}`,
      bodyHtml: `<p style="margin:0 0 12px;">La cliente a répondu sur le suivi de sa commande :</p>
        ${text ? `<p style="white-space:pre-line;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:10px;padding:12px;">${escapeHtml(text)}</p>` : ""}
        <p style="margin:14px 0 0;color:#7a7268;">Retrouve la discussion dans ta gestion → Commandes.</p>`,
    });
    await sendEmail({ to, subject: `${label}${th.ref ? ` #${th.ref}` : ""}`, html });
  }
  return Response.json({ ok: true, thread: publicView(th) });
}
