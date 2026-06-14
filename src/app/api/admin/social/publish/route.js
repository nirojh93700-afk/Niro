// Publication sur Instagram via l'API Meta (Graph API).
// La gérante renseigne son "igUserId" (identifiant du compte Instagram Business)
// et un "igToken" (jeton d'accès longue durée) dans le centre des agents.
//
// Flux Instagram en 2 étapes :
//   1. créer le média (image_url + caption) -> creation_id
//   2. publier le creation_id
// L'image doit être accessible publiquement en HTTPS (CDN produit ou visuel hébergé).

import { isAdmin, getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v19.0";

// Indique si la publication est configurée (sans jamais renvoyer le jeton).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const s = await getSettings();
  return Response.json({ configured: Boolean(s.social?.igUserId && s.social?.igToken) });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const imageUrl = String(body?.imageUrl || "").trim();
  const caption = String(body?.caption || "").trim();
  if (!/^https:\/\/.+/i.test(imageUrl)) {
    return Response.json({ error: "Mets une URL d'image en https (visible publiquement)." }, { status: 400 });
  }

  const s = await getSettings();
  const igUserId = s.social?.igUserId;
  const token = s.social?.igToken;
  if (!igUserId || !token) {
    return Response.json({ error: "Instagram non configuré : renseigne ton identifiant et ton jeton d'accès." }, { status: 503 });
  }

  try {
    // 1) Création du conteneur média.
    const createRes = await fetch(`${GRAPH}/${encodeURIComponent(igUserId)}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok || !createData.id) {
      const msg = createData?.error?.message || "Échec de la création du média.";
      return Response.json({ error: `Instagram : ${msg}` }, { status: 502 });
    }

    // 2) Publication du conteneur.
    const pubRes = await fetch(`${GRAPH}/${encodeURIComponent(igUserId)}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: token }),
    });
    const pubData = await pubRes.json().catch(() => ({}));
    if (!pubRes.ok || !pubData.id) {
      const msg = pubData?.error?.message || "Échec de la publication.";
      return Response.json({ error: `Instagram : ${msg}` }, { status: 502 });
    }

    return Response.json({ ok: true, postId: pubData.id });
  } catch (e) {
    console.error("Instagram publish:", e?.message);
    return Response.json({ error: "Erreur réseau lors de la publication." }, { status: 500 });
  }
}
