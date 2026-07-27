import { isAdmin, getScheduledEmails, addScheduledEmail, cancelScheduledEmail } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Liste des messages programmés (admin).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const list = (await getScheduledEmails()).slice().sort((a, b) => (a.sendAt || 0) - (b.sendAt || 0));
  return Response.json({ scheduled: list });
}

// Programmer un message pour une cliente à une date/heure précise.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const to = String(body?.to || "").trim();
  const subject = String(body?.subject || "").trim();
  const text = String(body?.body || "").trim();
  const sendAt = Number(body?.sendAt) || 0;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Response.json({ error: "Adresse e-mail de la cliente invalide." }, { status: 400 });
  if (!subject || !text) return Response.json({ error: "Sujet et message obligatoires." }, { status: 400 });
  if (!sendAt || sendAt < Date.now() - 60000) return Response.json({ error: "Choisis une date et une heure d'envoi (dans le futur)." }, { status: 400 });

  const item = await addScheduledEmail({
    to, name: body?.name, subject, body: text, sendAt,
    source: "manuel", orderId: body?.orderId || "",
  });
  return Response.json({ ok: true, item });
}

// Annuler un message programmé (pas encore envoyé).
export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  await cancelScheduledEmail(id);
  return Response.json({ ok: true });
}
