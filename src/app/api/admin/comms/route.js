import { isAdmin, getCommsFor, getCommsMeta, getBatThreadsMeta, getBatThread } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Dossier de communication d'une cliente.
//   GET ?email=…  → { messages } : journal `comms` + fils de TOUTES ses commandes
//                   (aperçus/BAT, réponses importées), fusionnés et triés par date.
//   GET (sans e-mail) → { meta } : nb de messages + dernier échange, par e-mail.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const email = String(new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ meta: await getCommsMeta() });

  const dossier = await getCommsFor(email);
  // Journal, sans doublon « même côté à moins de 3 min » (un envoi fait par le
  // site puis retrouvé dans les « envoyés » Gmail = un seul message).
  const messages = [];
  for (const m of [...dossier.messages].sort((a, b) => (a.at || 0) - (b.at || 0))) {
    if (messages.some((x) => x.from === m.from && Math.abs((x.at || 0) - (m.at || 0)) < 3 * 60 * 1000 && (x.via !== "gmail" || m.via === "gmail"))) continue;
    messages.push(m);
  }
  const seenGmail = new Set(messages.map((m) => m.gmailId).filter(Boolean));
  const seenKey = new Set(messages.map((m) => `${m.from}|${m.at}|${String(m.text || "").slice(0, 60)}`));

  // Fils des commandes de cette cliente (historique antérieur au journal inclus).
  try {
    const metas = (await getBatThreadsMeta()).filter((m) => String(m.customerEmail || "").toLowerCase() === email);
    for (const meta of metas) {
      const th = await getBatThread(meta.orderId);
      for (const m of th?.messages || []) {
        const from = m.from === "atelier" ? "nous" : "cliente";
        if (m.gmailId && seenGmail.has(m.gmailId)) continue;
        const key = `${from}|${m.at}|${String(m.text || "").slice(0, 60)}`;
        if (seenKey.has(key)) continue;
        // Déjà dans le journal par une autre voie (même côté, à moins de 3 min) → pas de doublon.
        if (messages.some((x) => x.from === from && Math.abs((x.at || 0) - (Number(m.at) || 0)) < 3 * 60 * 1000)) continue;
        seenKey.add(key);
        messages.push({
          id: `b${meta.orderId}_${m.at}`, from, at: Number(m.at) || 0,
          text: m.text || (m.image ? "(aperçu envoyé)" : ""), subject: "", via: m.viaEmail ? "gmail" : "commande",
          orderId: meta.orderId, orderRef: meta.ref || "", gmailId: m.gmailId || "", decision: m.decision || "",
        });
      }
    }
  } catch { /* le journal seul suffit */ }

  messages.sort((a, b) => (a.at || 0) - (b.at || 0));
  return Response.json({ name: dossier.name, messages });
}
