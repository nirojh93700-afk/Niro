import { getQuote } from "@/lib/firebase";
import { getSettings } from "@/lib/stock";
import { livraisonActive, poidsDevis, portDevis } from "@/lib/portDevis";
import { indexVariantes } from "@/lib/indexVariantes";

export const dynamic = "force-dynamic";

// Prix de livraison d'un devis (public, comme le panier). Sans « method » : état de départ
// { actif, poids, domicile, relaisDes, relaisOk }. Avec method + point relais : prix exact.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ actif: false }); }
  const q = body?.id ? await getQuote(body.id) : null;
  if (!q || q.type === "facture" || q.status === "paye") return Response.json({ actif: false });
  const index = await indexVariantes();
  if (!livraisonActive(q.items, index)) return Response.json({ actif: false });
  const settings = await getSettings();
  if (body?.method === "relais" || body?.method === "domicile") {
    const r = portDevis(q, settings, index, body.method, body.relaisPoint);
    return Response.json(r.ok ? { actif: true, price: r.price } : { actif: true, error: r.error });
  }
  const dom = portDevis(q, settings, index, "domicile");
  const rel = portDevis(q, settings, index, "relais");
  return Response.json({
    actif: true, poids: poidsDevis(q.items, index), domicile: dom.price, express: dom.express ?? null,
    relaisOk: rel.ok, relaisDes: rel.ok ? rel.price : null,
  });
}
