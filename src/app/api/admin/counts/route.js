import { isAdmin, getAdminCountsData } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Pastilles de la barre latérale de Gestion (02/10/2026). Avant : à CHAQUE clic de menu,
// l'admin téléchargeait les commandes, les avis, les restaurants, les réponses préparées
// et relisait Gmail (≈ 1 Mo, 5 s) juste pour afficher 5 chiffres. Ici : des chiffres
// seulement, gardés 30 s en mémoire, sans Gmail.
let memo = { at: 0, data: null };
const TTL = 30 * 1000;

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  if (memo.data && Date.now() - memo.at < TTL) return Response.json(memo.data);
  const [c, orders] = await Promise.all([
    getAdminCountsData().catch(() => ({ replies: 0, unread: 0, reviews: 0, pros: 0 })),
    getSiteOrders(300).catch(() => []),
  ]);
  const prep = (orders || []).filter((x) => !x.test && (!x.status || x.status === "a_preparer")).length;
  const data = { prep, ...c };
  memo = { at: Date.now(), data };
  return Response.json(data);
}
