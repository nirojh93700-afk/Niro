import { sendEmail, emailLayout, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Reçoit une demande de projet sur mesure et l'envoie par e-mail à l'atelier.
export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  const name = String(b.name || "").trim().slice(0, 80);
  const email = String(b.email || "").trim().slice(0, 120);
  const idea = String(b.idea || "").trim().slice(0, 2000);
  const material = String(b.material || "").trim().slice(0, 40);
  const dims = String(b.dims || "").trim().slice(0, 80);
  const qty = String(b.qty || "").trim().slice(0, 20);
  const photo = String(b.photo || "").trim().slice(0, 600);
  const preview = String(b.preview || "").trim().slice(0, 1200);

  if (!idea || !email) return Response.json({ error: "Merci d'indiquer votre idée et votre e-mail." }, { status: 400 });

  const html = emailLayout({
    heading: "Nouvelle demande sur mesure",
    bodyHtml: `
      <p style="margin:0 0 6px;"><strong>De :</strong> ${esc(name) || "—"} — <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      <p style="margin:0 0 6px;"><strong>Matière souhaitée :</strong> ${esc(material) || "—"}</p>
      <p style="margin:0 0 6px;"><strong>Dimensions :</strong> ${esc(dims) || "—"} · <strong>Quantité :</strong> ${esc(qty) || "—"}</p>
      <p style="margin:12px 0 4px;"><strong>Son idée :</strong></p>
      <p style="margin:0 0 12px;white-space:pre-line;">${esc(idea)}</p>
      ${photo ? `<p style="margin:0 0 6px;"><strong>Photo d'inspiration :</strong></p><p style="margin:0 0 12px;"><a href="${esc(photo)}">${esc(photo)}</a></p>` : ""}
      ${preview ? `<p style="margin:0 0 6px;"><strong>Aperçu généré (indicatif) :</strong></p><img src="${esc(preview)}" alt="aperçu" style="max-width:320px;width:100%;border-radius:8px;border:1px solid #ddd;">` : ""}
      <p style="margin:16px 0 0;color:#7a7268;">Réponds à cet e-mail pour dire à la cliente si c'est réalisable.</p>`,
  });

  try {
    await sendEmail({ to: BRAND.contact, subject: `✨ Demande sur mesure — ${name || email}`, html, replyTo: email });
  } catch (e) {
    return Response.json({ error: "Envoi impossible : " + e.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
