import { isAdmin, getVisibilite, setVisibilite } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";
import { UNIVERS } from "@/lib/univers";
import { rayonsDe, cleRayon } from "@/lib/visibilite";

export const dynamic = "force-dynamic";

// Gestion → Catalogue → Visibilité sur le site (22/10/2026) : masquer d'un geste une
// catégorie entière ou un rayon, avec tous ses produits.
// GET  → { groupes:[{ id, nom, img, masque, at, rayons:[{ cle, nom, masque, at, produits:[…] }] }] }
// POST { type:"univers"|"rayon", cle, masque } → même réponse (relue fraîche).
async function etat(fresh) {
  const [produits, vis] = await Promise.all([getCatalogAdmin(), getVisibilite(fresh)]);
  const parSlug = new Map(produits.map((p) => [p.slug, p]));
  const rayons = rayonsDe(produits);
  const fiche = (s) => {
    const p = parSlug.get(s);
    const prix = Math.min(...(p.variants || []).map((v) => Number(v.price) || Infinity));
    return {
      slug: s, nom: p.name || s, image: p.cardImage || (p.images || [])[0] || "",
      prix: Number.isFinite(prix) ? prix : null,
      seul: Boolean(p.hidden), groupe: p.masqueGroupe || "",
    };
  };
  const groupes = UNIVERS.map((u) => ({
    id: u.id, nom: u.nom, img: u.img,
    masque: Boolean(vis.univers[u.id]), at: vis.univers[u.id]?.at || "",
    rayons: rayons.filter((r) => r.uid === u.id).map((r) => ({
      cle: r.cle, nom: r.nom, masque: Boolean(vis.rayons[r.cle]), at: vis.rayons[r.cle]?.at || "",
      produits: r.slugs.filter((s) => parSlug.has(s)).map(fiche),
    })),
  }));
  return { groupes };
}

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json(await etat(false));
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { type, cle } = body || {};
  const masque = Boolean(body?.masque);
  const ids = new Set(UNIVERS.map((u) => u.id));
  const rayonsConnus = new Set(UNIVERS.flatMap((u) => [...u.rayons.map((r) => cleRayon(u.id, r.nom)), cleRayon(u.id, "Autres créations")]));
  if (type === "univers" ? !ids.has(cle) : type === "rayon" ? !rayonsConnus.has(cle) : true) {
    return Response.json({ error: "Catégorie ou rayon inconnu : rien n'a été enregistré." }, { status: 400 });
  }
  await setVisibilite(type, cle, masque);
  return Response.json({ ok: true, ...(await etat(true)) });
}
