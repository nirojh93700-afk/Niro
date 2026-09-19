import { isAdmin, getLoginsAll } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// GESTION → CLIENTS → CONNEXIONS (lecture seule, rien ne part d'ici).
// Qui s'est connecté à son espace client, et quand — enrichi avec les commandes
// (nom + nombre) pour reconnaître la cliente d'un coup d'œil.
// =============================================================================
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });

  const logins = await getLoginsAll();
  const orders = (await getSiteOrders(300).catch(() => null)) || [];

  // Index commandes par adresse (nom le plus récent + compte + dernière réf).
  const parEmail = {};
  for (const o of orders) {
    const e = String(o.customerEmail || o.customer?.email || "").trim().toLowerCase();
    if (!e) continue;
    const st = String(o.status || "");
    if (st === "test" || st === "annulee" || st === "remboursee") continue;
    const it = parEmail[e] || { n: 0, name: "", ref: "" };
    it.n += 1;
    if (!it.name) it.name = String(o.customerName || o.customer?.name || "").trim();
    if (!it.ref) it.ref = String(o.ref || "");
    parEmail[e] = it;
  }

  const now = Date.now();
  const jour = new Date(); jour.setHours(0, 0, 0, 0);
  const debutJour = jour.getTime();
  const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);

  let aujourdHui = 0, sept = 0, sansSuite = 0;
  const distinct30 = new Set();

  const rows = Object.entries(logins).map(([email, v]) => {
    const hist = Array.isArray(v.hist) ? v.hist : [];
    for (const t of hist) {
      if (t >= debutJour) aujourdHui += 1;
      if (t >= now - 7 * 24 * 3600 * 1000) sept += 1;
      if (t >= now - 30 * 24 * 3600 * 1000) distinct30.add(email);
    }
    // « Lien demandé sans suite » : un lien plus récent que la dernière ouverture.
    const enAttente = (v.lien || 0) > (v.at || 0);
    if (enAttente) sansSuite += 1;
    const cmd = parEmail[email] || { n: 0, name: "", ref: "" };
    return {
      email,
      name: cmd.name,
      orders: cmd.n,
      ref: cmd.ref,
      at: v.at || 0,
      lien: v.lien || 0,
      mois: hist.filter((t) => t >= debutMois.getTime()).length,
      etat: enAttente ? "lien" : "ouvert",
      dernier: Math.max(v.at || 0, v.lien || 0),
    };
  });
  rows.sort((a, b) => b.dernier - a.dernier);

  return Response.json({
    kpis: { aujourdHui, sept, distinct30: distinct30.size, sansSuite },
    rows: rows.slice(0, 150),
  });
}
