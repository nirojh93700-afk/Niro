import { isAdmin, getGmailCreds, setGmailCreds, updateGmail } from "@/lib/stock";
import { gmailAccessToken, gmailListClientMessages, gmailGetMessage, gmailSendReply, gmailMarkRead } from "@/lib/gmail";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

// Rédige un brouillon de réponse à l'image de la marque (jamais envoyé seul).
async function draftReply({ fromName, subject, body }) {
  if (!process.env.ANTHROPIC_API_KEY) return "";
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sys = `Tu es l'assistante e-mail de la boutique française "Niv Création" (gravure laser : bijoux, verres gravés, décorations de mariage, cadeaux, couverts enfants personnalisés).
Rédige une réponse en FRANÇAIS, chaleureuse, polie et professionnelle, à l'image d'une petite marque artisanale.
- Tutoiement non : vouvoiement.
- Réponds précisément à la demande de la cliente.
- Pas d'emojis. Pas de promesses de remboursement pour un produit personnalisé.
- Termine par : "Belle journée,\\nL'atelier Niv Création".
- Donne UNIQUEMENT le texte de l'e-mail (pas d'objet, pas de commentaire).`;
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system: sys,
    messages: [{ role: "user", content: `E-mail reçu de ${fromName} (objet : ${subject}) :\n\n${body}\n\nRédige la réponse.` }],
  });
  return (resp.content || []).map((c) => c.text || "").join("").trim();
}

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";
  const creds = await getGmailCreds();
  const connected = Boolean(creds.refreshToken);
  if (action === "status") return Response.json({ connected });
  if (!connected) return Response.json({ error: "Gmail non connecté." }, { status: 400 });

  try {
    const token = await gmailAccessToken(creds);
    if (action === "inbox") {
      const messages = await gmailListClientMessages(token, 20);
      return Response.json({ connected: true, messages });
    }
    if (action === "message") {
      const id = url.searchParams.get("id");
      const m = await gmailGetMessage(token, id, true);
      await gmailMarkRead(token, id); // ouvert = marqué lu (synchro Gmail)
      if (m) m.unread = false;
      return Response.json({ message: m });
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const action = body?.action;

  // Flux « Connecter avec Google » : enregistre Client ID + secret, crée un
  // jeton d'état (anti-CSRF) et renvoie l'URL d'autorisation Google (qui
  // affichera bien l'appli « Niv Mail » de la gérante).
  if (action === "authUrl") {
    const clientId = String(body.clientId || "").trim();
    const clientSecret = String(body.clientSecret || "").trim();
    if (!clientId || !clientSecret) return Response.json({ error: "Client ID et Client secret requis." }, { status: 400 });
    const state = "niv-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await updateGmail({ clientId, clientSecret, oauthState: state });
    const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").replace(/\/$/, "");
    const redirectUri = `${SITE}/api/admin/gmail/callback`;
    const url = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://mail.google.com/",
      access_type: "offline",
      prompt: "consent",
      state,
    }).toString();
    return Response.json({ url, redirectUri });
  }

  // Enregistrer les identifiants (collés par la gérante) + test de connexion.
  if (action === "saveCreds") {
    const { clientId, clientSecret, refreshToken } = body;
    if (!clientId || !clientSecret || !refreshToken) return Response.json({ error: "Les 3 codes sont requis." }, { status: 400 });
    try {
      await gmailAccessToken({ clientId, clientSecret, refreshToken }); // test
    } catch (e) {
      return Response.json({ error: "Connexion refusée : " + e.message }, { status: 400 });
    }
    await setGmailCreds({ clientId, clientSecret, refreshToken });
    return Response.json({ ok: true });
  }

  if (action === "disconnect") {
    await setGmailCreds({ clientId: "", clientSecret: "", refreshToken: "" });
    return Response.json({ ok: true });
  }

  const creds = await getGmailCreds();
  if (!creds.refreshToken) return Response.json({ error: "Gmail non connecté." }, { status: 400 });

  // Préparer un brouillon de réponse (ne l'envoie PAS).
  if (action === "draft") {
    try {
      const text = await draftReply({ fromName: body.fromName, subject: body.subject, body: body.body });
      return Response.json({ draft: text });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }
  }

  // Envoyer la réponse (déclenché manuellement par la gérante).
  if (action === "send") {
    try {
      const token = await gmailAccessToken(creds);
      await gmailSendReply(token, {
        to: body.to, subject: body.subject, body: body.text,
        threadId: body.threadId, inReplyTo: body.messageId, references: body.references,
      });
      return Response.json({ ok: true });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
