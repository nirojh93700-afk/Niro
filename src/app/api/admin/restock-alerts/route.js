import { isAdmin, getRestockAlerts, clearRestockAlerts } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";
import { sendClientMail } from "@/lib/clientMail";
import { emailLayout, escapeHtml, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Alertes « retour en stock » — côté admin.
// GET : compteurs d'inscrits par produit (avec nom + lien fiche).
// POST {slug, action:"send"} : ENVOIE l'e-mail « Il est de retour » aux inscrits
//   du produit (déclenché UNIQUEMENT par le clic de la gérante), puis vide la liste.
// POST {slug, action:"clear"} : vide la liste SANS rien envoyer.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const alerts = await getRestockAlerts();
  let noms = {};
  try { for (const p of await getCatalogAdmin()) noms[p.slug] = p.name || p.slug; } catch { /* noms = slugs */ }
  const rows = Object.entries(alerts)
    .map(([slug, liste]) => ({ slug, name: noms[slug] || slug, count: (liste || []).length }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  return Response.json({ ok: true, rows });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const slug = String(body?.slug || "").trim();
  const action = body?.action;
  if (!slug) return Response.json({ error: "Produit manquant." }, { status: 400 });

  if (action === "clear") {
    await clearRestockAlerts(slug);
    return Response.json({ ok: true, sent: 0 });
  }
  if (action !== "send") return Response.json({ error: "Action inconnue." }, { status: 400 });

  const liste = (await getRestockAlerts())[slug] || [];
  if (!liste.length) return Response.json({ ok: true, sent: 0 });

  let nom = slug;
  try { nom = (await getCatalogAdmin()).find((p) => p.slug === slug)?.name || slug; } catch { /* slug */ }
  const lien = `${BRAND.siteUrl}/produit/${encodeURIComponent(slug)}`;
  const html = emailLayout({
    heading: "✨ Il est de retour !",
    bodyHtml: `<p style="margin:0 0 12px;">Bonjour,</p>
      <p style="margin:0 0 12px;">Bonne nouvelle : le <strong>${escapeHtml(nom)}</strong> que vous attendiez est de nouveau disponible sur notre boutique.</p>
      <p style="margin:0 0 18px;">Les quantités restent limitées — ne tardez pas trop.</p>
      <p style="margin:0 0 8px;"><a href="${lien}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">Voir le produit</a></p>
      <p style="margin-top:16px;color:#7a7268;font-size:12px;">Vous recevez cet e-mail car vous avez demandé à être prévenu(e) du retour de ce produit. C'est le seul message que nous vous enverrons à ce sujet.</p>`,
  });

  let sent = 0, failed = 0;
  for (const insc of liste) {
    // bcc vide : pas de copie de chaque envoi dans la boîte (le compteur suffit).
    const r = await sendClientMail({ to: insc.email, subject: `✨ Il est de retour — ${nom}`, html, bcc: "" });
    if (r?.ok) sent++; else failed++;
  }
  // Liste vidée seulement après l'envoi (un raté total la conserve pour réessayer).
  if (sent > 0) await clearRestockAlerts(slug);
  return Response.json({ ok: true, sent, failed });
}
