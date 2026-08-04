// =============================================================================
// Route publique des sites hébergés dans Lior : /site/<id>
// -----------------------------------------------------------------------------
// Renvoie directement le HTML du site (aucune connexion requise). C'est le lien
// que la propriétaire donne à son client. Le HTML vient des Netlify Blobs
// (site uploadé dans l'app). À défaut, on bascule sur une copie statique
// livrée avec l'app (public/sites/<id>.html) — ce qui garantit qu'un site de
// départ comme HB Auto-Clé est en ligne dès le déploiement.
// =============================================================================

import { getSiteHtml } from "@/lib/plateforme-store";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const id = String(params?.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!id) return notFound();

  const html = await getSiteHtml(id);
  if (html) {
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  }

  // Repli : copie statique livrée avec l'app (public/sites/<id>.html).
  return Response.redirect(new URL(`/sites/${id}.html`, req.url), 307);
}

function notFound() {
  return new Response(
    "<!doctype html><meta charset=utf-8><title>Site introuvable</title>" +
      "<body style='font-family:system-ui;background:#0e1116;color:#eef2f7;display:grid;place-items:center;height:100vh;margin:0'>" +
      "<div style='text-align:center'><h1>Site introuvable</h1><p style='color:#9aa6b2'>Ce site n'existe pas ou n'est pas encore publié.</p></div>",
    { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
