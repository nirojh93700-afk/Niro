// Réception des messages du formulaire de contact.
// Envoi de l'e-mail via Resend (https://resend.com) si configuré.
// Variables d'environnement nécessaires (voir .env.example) :
//   RESEND_API_KEY  -> ta clé API Resend
//   CONTACT_EMAIL   -> l'adresse qui reçoit les messages (ex : contact.nivcreation@gmail.com)
//   CONTACT_FROM    -> l'expéditeur vérifié dans Resend (sinon onboarding@resend.dev en test)

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const subject = String(body?.subject || "").trim() || "Nouveau message";
  const message = String(body?.message || "").trim();

  if (!name || !email || !message) {
    return Response.json({ error: "Merci de remplir tous les champs obligatoires." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || "contact.nivcreation@gmail.com";
  const from = process.env.CONTACT_FROM || "Niv Création <onboarding@resend.dev>";

  // Si l'e-mail n'est pas encore configuré, on l'indique clairement.
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Le formulaire n'est pas encore relié à l'e-mail (clé RESEND_API_KEY manquante).",
      },
      { status: 503 }
    );
  }

  const html = `
    <h2>Nouveau message — Niv Création</h2>
    <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
    <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
    <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Contact site] ${subject}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend error:", detail);
      return Response.json({ error: "L'envoi a échoué. Réessayez plus tard." }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact error:", err);
    return Response.json({ error: "Erreur réseau lors de l'envoi." }, { status: 500 });
  }
}
