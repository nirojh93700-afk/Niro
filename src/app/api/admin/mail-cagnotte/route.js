import { isAdmin, getCagnotte, hasAutoSent, markAutoSent, logComm } from "@/lib/stock";
import { sendClientMail, boutonRepondre } from "@/lib/clientMail";
import { mailCagnotte } from "@/lib/mailCagnotte";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Envoi du mail « Votre cagnotte vous attend pour Noël » (19/11/2026), une cliente par appel.
// POST { to, items:[noms des produits commandés], test?:true, soldeTest? } — le montant est la VRAIE cagnotte de `to`
// (relue ici), jamais un chiffre du navigateur ; une seule fois par adresse (registre autoSent « cagnotte-noel-1911 »).
const REGLE = "cagnotte-noel-1911";
export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const to = String(body?.to || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Response.json({ error: "Adresse invalide." }, { status: 400 });
  const items = Array.isArray(body?.items) ? body.items.slice(0, 20).map((x) => String(x || "").slice(0, 200)) : [];
  const test = body?.test === true;
  const solde = test ? Number(body?.soldeTest) || 0 : (await getCagnotte(to)).balance;
  if (!(solde > 0)) return Response.json({ error: "Cagnotte vide : rien n'est parti." }, { status: 400 });
  if (!test && (await hasAutoSent(REGLE, to))) return Response.json({ ok: true, deja: true });
  let mail = mailCagnotte({ items, solde });
  try {
    const btn = await boutonRepondre({ email: to, subject: mail.subject, excerpt: `Cagnotte fidélité : ${solde.toFixed(2)} €` });
    if (btn) mail = mailCagnotte({ items, solde, bouton: btn });
  } catch { /* jamais bloquant */ }
  const r = await sendClientMail({ to, subject: mail.subject, html: mail.html });
  if (!r?.ok) return Response.json({ error: r?.error || "Échec de l'envoi." }, { status: 500 });
  if (!test) {
    try { await markAutoSent(REGLE, to); } catch { /* ignore */ }
    try { await logComm({ email: to, from: "nous", text: `Votre cagnotte vous attend pour Noël (${solde.toFixed(2)} €)`, subject: mail.subject, via: r.via || "gmail" }); } catch { /* ignore */ }
  }
  return Response.json({ ok: true, solde, via: r.via || "" });
}
