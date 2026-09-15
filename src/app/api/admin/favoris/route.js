import { isAdmin, getFavorisAll } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// GESTION → FAVORIS : ce que les clientes mettent de côté.
// -----------------------------------------------------------------------------
// LECTURE SEULE. Aucun e-mail n'est envoyé d'ici — comme les alertes « retour en
// stock », les envois restent à la main du gérant.
// Les noms et prix viennent du catalogue en direct ; un produit masqué ou
// supprimé n'apparaît plus (jamais de vieux prix ni de lien mort).
// =============================================================================
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });

  let favoris = {};
  try { favoris = await getFavorisAll(); } catch { favoris = {}; }
  let catalogue = [];
  try { catalogue = await getCatalog(); } catch { catalogue = []; }
  const parSlug = new Map(catalogue.map((p) => [p.slug, p]));

  const SEMAINE = Date.now() - 7 * 86400000;
  const parProduit = new Map(); // slug -> { emails:[], }
  let clientes = 0, semaine = 0, total = 0;

  for (const [email, fiche] of Object.entries(favoris)) {
    const slugs = (fiche?.slugs || []).filter((s) => parSlug.has(s));
    if (!slugs.length) continue;
    clientes++;
    if ((fiche?.at || 0) >= SEMAINE) semaine += slugs.length;
    for (const s of slugs) {
      total++;
      if (!parProduit.has(s)) parProduit.set(s, []);
      parProduit.get(s).push(email);
    }
  }

  const rows = [...parProduit.entries()]
    .map(([slug, emails]) => {
      const p = parSlug.get(slug);
      const v = p.variants?.[0] || {};
      return {
        slug,
        name: p.name,
        type: p.type || "",
        categorie: p.category || "",
        image: (p.images || [])[0] || "",
        price: typeof v.price === "number" ? v.price : null,
        soldOut: !!p.soldOut,
        n: emails.length,
        emails: emails.sort(),
      };
    })
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

  return Response.json({
    total,
    clientes,
    produits: rows.length,
    semaine,
    rows,
  });
}
