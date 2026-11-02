// HISTORIQUE D'UNE COMMANDE SUR DEVIS (02/11/2026, gérant, commande 04AT1IG4 : « j'aimerais bien savoir
// l'historique de devis… t'as pas mis les devis, t'as pas mis les images qu'on a envoyées, l'image qu'elle a
// sélectionnée, y a rien »). Pur : reçoit la commande, les devis / factures et le fil de messages.

const norm = (e) => String(e || "").trim().toLowerCase();

// Devis et factures liés à la commande : son numéro de devis, toute pièce qui cite la commande ou ce devis,
// et les autres devis de la même cliente (même e-mail). Du plus ancien au plus récent.
export function devisDeLaCommande(order, quotes) {
  if (!order || !Array.isArray(quotes)) return [];
  const num = String(order.quoteNumber || "").trim();
  const ref = String(order.ref || "").trim();
  const email = norm(order.customerEmail);
  const cite = (q, mot) => {
    if (!mot) return false;
    const txt = `${q.note || ""} ${(q.items || []).map((i) => i?.desc || "").join(" ")}`;
    return new RegExp(`(^|[^A-Za-z0-9])${mot.replace(/[^A-Za-z0-9-]/g, "")}([^A-Za-z0-9]|$)`).test(txt);
  };
  const out = [];
  for (const q of quotes) {
    if (!q || !q.id) continue;
    const principal = Boolean(num) && q.number === num;
    const lie = principal || cite(q, ref) || cite(q, num);
    const memeCliente = Boolean(email) && norm(q.client?.email) === email;
    if (!lie && !memeCliente) continue;
    out.push({
      id: q.id, number: q.number || "", type: q.type === "facture" ? "facture" : "devis",
      status: q.status || "", total: Number(q.total) || 0, createdAt: q.createdAt || "",
      lien: `/document/${q.id}`, principal, lie,
      lignes: (q.items || []).map((i) => ({ desc: String(i?.desc || "").slice(0, 200), qty: Number(i?.qty) || 1, price: Number(i?.price) || 0 })).slice(0, 12),
      note: String(q.note || "").slice(0, 600),
    });
  }
  return out.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

// Images du fil de la commande : envoyées par l'atelier (aperçus, planches…) et reçues de la cliente.
export function imagesDuFil(thread) {
  const out = [];
  for (const m of thread?.messages || []) {
    const de = m.from === "atelier" ? "atelier" : "cliente";
    const base = { at: Number(m.at) || 0, de, subject: String(m.subject || "").slice(0, 120) };
    const img = String(m.image || "").trim();
    if (img) {
      const id = (img.match(/\/api\/img\/([A-Za-z0-9_-]{8,64})/) || [])[1];
      out.push({ ...base, src: id ? `/api/img/${id}` : img });
    }
    for (const id of m.photos || []) {
      if (/^[A-Za-z0-9_-]{8,64}$/.test(String(id))) out.push({ ...base, src: `/api/img/${id}` });
    }
  }
  const vus = new Set();
  return out.filter((x) => (vus.has(x.src) ? false : (vus.add(x.src), true))).slice(0, 16);
}
