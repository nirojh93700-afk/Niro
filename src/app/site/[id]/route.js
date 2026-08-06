// =============================================================================
// Route publique des sites hébergés dans Lior : /site/<id>
// -----------------------------------------------------------------------------
// Renvoie le HTML du site UNIQUEMENT s'il a été déposé volontairement dans
// l'app (action saveSite, rangé dans les Netlify Blobs). Rien n'est publié
// automatiquement : tant que la propriétaire n'a pas mis un site en ligne pour
// ce client, l'adresse répond « introuvable ». C'est ce qui garantit qu'une
// maquette ne devient publique qu'après validation.
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
        "cache-control": "no-store",
      },
    });
  }
  return notFound();
}

function notFound() {
  return new Response(
    "<!doctype html><meta charset=utf-8><title>Site introuvable</title>" +
      "<body style='font-family:system-ui;background:#0e1116;color:#eef2f7;display:grid;place-items:center;height:100vh;margin:0'>" +
      "<div style='text-align:center'><h1>Site introuvable</h1><p style='color:#9aa6b2'>Ce site n'existe pas ou n'est pas encore publié.</p></div>",
    { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
