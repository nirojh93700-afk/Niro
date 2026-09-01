import { addRestockAlert } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Inscription PUBLIQUE « prévenez-moi dès son retour » depuis une fiche épuisée.
// N'envoie RIEN : enregistre l'e-mail, c'est la gérante qui déclenche l'envoi
// depuis Gestion (bouton « Prévenir »). Voir stock.js (restockAlerts).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const slug = String(body?.slug || "").trim();
  const email = String(body?.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  // Le produit doit exister dans le catalogue visible (pas d'inscription fantôme).
  let existe = false;
  try { existe = (await getCatalog()).some((p) => p.slug === slug); } catch { /* refus ci-dessous */ }
  if (!existe) return Response.json({ error: "Produit introuvable." }, { status: 404 });
  const r = await addRestockAlert(slug, email);
  if (!r.ok) return Response.json({ error: "Inscription impossible." }, { status: 400 });
  return Response.json({ ok: true, deja: Boolean(r.deja) });
}
