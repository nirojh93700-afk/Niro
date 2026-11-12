import { isAdmin } from "@/lib/stock";
import { getCreation, setCreationAtelier } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Gestion → commande → « Corriger dans l'outil » (12/11/2026) : la création d'une cliente (support de téléphone, arbre de vie,
// décoration) et la version corrigée par l'atelier, gardée À CÔTÉ (celle de la cliente n'est jamais modifiée).
// GET  ?id=…                    → { id, outil, etat, atelier, at, atelierAt }
// POST { id, atelier: {…} }     → garde la version de l'atelier ; { id, atelier: null } → revient à la version de la cliente.
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  const c = await getCreation(id);
  if (!c || !c.etat) return Response.json({ error: "Création introuvable." }, { status: 404 });
  return Response.json(c);
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch { return Response.json({ error: "Demande illisible." }, { status: 400 }); }
  if (!b.id) return Response.json({ error: "Création manquante." }, { status: 400 });
  if (b.atelier !== null && (typeof b.atelier !== "object" || Array.isArray(b.atelier))) return Response.json({ error: "Version illisible." }, { status: 400 });
  const r = await setCreationAtelier(b.id, b.atelier);
  if (!r.ok) return Response.json({ error: r.error }, { status: r.error === "Création introuvable." ? 404 : 500 });
  return Response.json(await getCreation(b.id));
}
