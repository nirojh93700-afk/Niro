// =============================================================================
// Intégration Gmail (agent e-mail) — accès REST à la boîte de la gérante.
// Utilise les identifiants OAuth (client_id, client_secret, refresh_token)
// stockés dans les réglages (admin uniquement, jamais exposés au public).
// L'agent LIT les mails et prépare des brouillons ; l'envoi est toujours
// déclenché manuellement depuis l'admin.
// =============================================================================

// Échange le refresh token contre un access token temporaire.
export async function gmailAccessToken({ clientId, clientSecret, refreshToken }) {
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Identifiants Gmail manquants.");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    const detail = [data.error, data.error_description].filter(Boolean).join(" — ");
    throw new Error(detail || "Connexion Gmail refusée.");
  }
  return data.access_token;
}

// Échange un code d'autorisation (flux « Connecter avec Google ») contre un
// refresh token, avec les identifiants du client de la gérante.
export async function exchangeCodeForTokens({ clientId, clientSecret, code, redirectUri }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret, code,
      redirect_uri: redirectUri, grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = [data.error, data.error_description].filter(Boolean).join(" — ");
    throw new Error(detail || "Échange du code refusé.");
  }
  return data; // { access_token, refresh_token, ... }
}

function header(headers, name) {
  const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : "";
}

// Décode une partie base64url Gmail en texte UTF-8.
function decodeB64(data) {
  try {
    const norm = (data || "").replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(norm, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

// Extrait le corps texte d'un message (préfère text/plain, sinon nettoie le HTML).
function extractBody(payload) {
  if (!payload) return "";
  const walk = (part) => {
    if (!part) return "";
    if (part.mimeType === "text/plain" && part.body?.data) return decodeB64(part.body.data);
    if (part.parts) {
      for (const p of part.parts) { const t = walk(p); if (t) return t; }
    }
    return "";
  };
  let txt = walk(payload);
  if (!txt) {
    // pas de text/plain : on prend le HTML nettoyé
    const html = (function findHtml(part) {
      if (!part) return "";
      if (part.mimeType === "text/html" && part.body?.data) return decodeB64(part.body.data);
      if (part.parts) for (const p of part.parts) { const h = findHtml(p); if (h) return h; }
      return "";
    })(payload);
    txt = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }
  return txt.slice(0, 8000);
}

// Vrai mail de cliente ? (on écarte pubs, newsletters, no-reply, notifications)
export function looksLikeRealCustomer(fromEmail, labelIds = []) {
  const e = (fromEmail || "").toLowerCase();
  if (!e) return false;
  if (/no[-_.]?reply|do[-_.]?not[-_.]?reply|newsletter|mailer|notif|marketing|info@|news@|support@google|facebookmail|instagram|stripe\.com|paypal|alibaba/.test(e)) return false;
  const bad = ["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_FORUMS", "SPAM"];
  if (labelIds.some((l) => bad.includes(l))) return false;
  return true;
}

// Liste les derniers messages reçus, filtrés (vraies clientes).
export async function gmailListClientMessages(token, max = 20) {
  const q = encodeURIComponent("in:inbox -category:promotions -category:social -category:forums newer_than:30d");
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=${max}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Lecture Gmail impossible.");
  const ids = (data.messages || []).map((m) => m.id);
  const out = [];
  for (const id of ids) {
    const m = await gmailGetMessage(token, id, false);
    if (m && looksLikeRealCustomer(m.fromEmail, m.labelIds)) out.push(m);
  }
  return out;
}

// Liste les messages VENANT d'une adresse précise (réponses d'une cliente),
// avec leur corps complet. Sert à remonter les réponses par e-mail dans le
// fil d'aperçu (BAT) de la commande correspondante.
export async function gmailListFromSender(token, fromEmail, max = 10) {
  const email = (fromEmail || "").trim();
  if (!email) return [];
  const q = encodeURIComponent(`from:${email} newer_than:90d`);
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=${max}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Lecture Gmail impossible.");
  const ids = (data.messages || []).map((m) => m.id);
  const out = [];
  for (const id of ids) {
    const m = await gmailGetMessage(token, id, true);
    if (m) out.push(m);
  }
  return out;
}

// Liste seulement les IDENTIFIANTS des messages récents de la boîte (léger).
// Sert à la vérification globale « nouvelles réponses » sans tout télécharger.
export async function gmailListInboxIds(token, max = 30) {
  const q = encodeURIComponent("in:inbox -category:promotions -category:social -category:forums newer_than:90d");
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=${max}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Lecture Gmail impossible.");
  return (data.messages || []).map((m) => m.id);
}

// Récupère un message (entêtes + extrait, ou corps complet si full=true).
export async function gmailGetMessage(token, id, full = true) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return null;
  const headers = data.payload?.headers || [];
  const from = header(headers, "From");
  const emailMatch = from.match(/<([^>]+)>/);
  const fromEmail = (emailMatch ? emailMatch[1] : from).trim();
  const fromName = from.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || fromEmail;
  return {
    id,
    threadId: data.threadId,
    fromName,
    fromEmail,
    subject: header(headers, "Subject"),
    date: header(headers, "Date"),
    messageId: header(headers, "Message-ID"),
    references: header(headers, "References"),
    snippet: data.snippet || "",
    labelIds: data.labelIds || [],
    unread: (data.labelIds || []).includes("UNREAD"),
    body: full ? extractBody(data.payload) : "",
  };
}

// Marque un message comme lu (retire le label UNREAD) — synchronisé avec Gmail.
export async function gmailMarkRead(token, id) {
  try {
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
    });
    return true;
  } catch {
    return false;
  }
}

// Encode un en-tête (sujet) avec accents pour l'e-mail.
function encodeHeader(s) {
  // si pas d'accents, on garde tel quel
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return "=?UTF-8?B?" + Buffer.from(s, "utf-8").toString("base64") + "?=";
}

// Envoie un e-mail HTML (à l'image de la marque) via Gmail, à n'importe quelle
// adresse. Contrairement à Resend, Gmail n'exige pas de domaine vérifié.
export async function gmailSendHtml(token, { to, subject, html, bcc }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${encodeHeader(subject || "")}`,
  ];
  if (bcc && String(bcc).toLowerCase() !== String(to).toLowerCase()) lines.push(`Bcc: ${bcc}`);
  lines.push(
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  );
  const raw = lines.join("\r\n") + "\r\n\r\n" + Buffer.from(html || "", "utf-8").toString("base64");
  const encoded = Buffer.from(raw, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Envoi Gmail impossible.");
  return data;
}

// Envoie une réponse dans le même fil (déclenché manuellement par l'admin).
export async function gmailSendReply(token, { to, subject, body, threadId, inReplyTo, references }) {
  const subj = subject?.startsWith("Re:") ? subject : `Re: ${subject || ""}`;
  const lines = [
    `To: ${to}`,
    `Subject: ${encodeHeader(subj)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references || inReplyTo) lines.push(`References: ${references || inReplyTo}`);
  const raw = lines.join("\r\n") + "\r\n\r\n" + Buffer.from(body || "", "utf-8").toString("base64");
  const encoded = Buffer.from(raw, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded, threadId: threadId || undefined }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Envoi impossible.");
  return data;
}
