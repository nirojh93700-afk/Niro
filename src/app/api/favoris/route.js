import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/customerAuth";
import { getFavoris, toggleFavori, mergeFavoris } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// FAVORIS DE LA CLIENTE CONNECTÉE
// -----------------------------------------------------------------------------
// L'e-mail vient UNIQUEMENT de la session signée (cookie `niv_espace`), jamais
// du corps de la requête : impossible de lire ou de modifier les favoris de
// quelqu'un d'autre.
//
// Pas connectée → on répond { loggedIn:false } SANS erreur : le bouton ♡ et la
// page /favoris continuent de marcher avec le navigateur (localStorage), comme
// avant. C'est ce qui évite de casser l'usage actuel.
//
// Les noms, photos et PRIX sont relus dans le catalogue en direct à chaque
// affichage : un prix modifié dans Gestion (ou une promo) se met à jour tout
// seul, et un produit masqué/supprimé disparaît des favoris — jamais de lien
// mort ni de vieux prix (même principe que les guides « Idées & conseils »).
// =============================================================================

// Transforme une liste de slugs en cartes affichables, d'après le catalogue.
async function enrichir(slugs) {
  if (!slugs?.length) return [];
  let catalogue = [];
  try { catalogue = await getCatalog(); } catch { return []; }
  const parSlug = new Map(catalogue.map((p) => [p.slug, p]));
  return slugs
    .map((slug) => {
      const p = parSlug.get(slug);
      if (!p) return null; // produit masqué ou supprimé : on ne l'affiche pas
      const v = p.variants?.[0] || {};
      return {
        slug,
        name: p.name,
        type: p.type || "",
        image: (p.images || [])[0] || "",
        price: typeof v.price === "number" ? v.price : null,
        compareAt: typeof v.compareAt === "number" ? v.compareAt : null,
        soldOut: !!p.soldOut,
      };
    })
    .filter(Boolean);
}

export async function GET() {
  const email = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!email) return Response.json({ loggedIn: false, items: [] });
  let slugs = [];
  try { slugs = await getFavoris(email); } catch { slugs = []; }
  return Response.json({ loggedIn: true, email, slugs, items: await enrichir(slugs) });
}

export async function POST(req) {
  const email = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!email) return Response.json({ loggedIn: false, items: [] });

  let body = {};
  try { body = await req.json(); } catch { /* corps vide accepté */ }
  const action = String(body?.action || "").trim();

  // Basculer un favori (le ♡ d'une fiche ou d'une vignette).
  if (action === "toggle") {
    const r = await toggleFavori(email, body?.slug);
    if (!r.ok) return Response.json({ error: "Produit inconnu." }, { status: 400 });
    return Response.json({ loggedIn: true, fav: r.fav, slugs: r.slugs });
  }

  // Fusion à la connexion : les favoris du navigateur rejoignent le compte.
  if (action === "merge") {
    const r = await mergeFavoris(email, body?.slugs);
    if (!r.ok) return Response.json({ error: "Liste invalide." }, { status: 400 });
    return Response.json({ loggedIn: true, ajoutes: r.ajoutes, slugs: r.slugs, items: await enrichir(r.slugs) });
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
