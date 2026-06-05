import { isAdmin } from "@/lib/stock";
import { getSiteOrders, updateSiteOrderStatus, deleteSiteOrder } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Liste des commandes du site (réservé à l'admin).
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const orders = await getSiteOrders(300);
  if (orders === null) {
    return Response.json({ orders: [], firebase: false });
  }
  return Response.json({ orders, firebase: true });
}

// Met à jour le statut d'une commande (à préparer / expédiée).
export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { id, status } = body || {};
  if (!id || !["a_preparer", "expediee", "annulee"].includes(status)) {
    return Response.json({ error: "Paramètres invalides." }, { status: 400 });
  }
  const ok = await updateSiteOrderStatus(id, status);
  return Response.json({ ok });
}

// Supprime définitivement une commande (ex : commande de test).
export async function DELETE(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { id } = body || {};
  if (!id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  const ok = await deleteSiteOrder(id);
  return Response.json({ ok });
}
