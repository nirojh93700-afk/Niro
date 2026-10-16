// Le logo du site, servi TEL QUEL depuis son adresse d'origine (aucune copie, aucune retouche).
// Sert aux étiquettes d'adresse (/gestion/etiquettes) : le navigateur ne peut pas lire l'image du
// CDN pour la mettre dans un PDF, alors on la lui donne depuis notre propre adresse.
export const dynamic = "force-dynamic";

const LOGO = (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim();

export async function GET() {
  try {
    const r = await fetch(LOGO, { cache: "force-cache" });
    if (!r.ok) return new Response("", { status: 502 });
    return new Response(await r.arrayBuffer(), {
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("", { status: 502 });
  }
}
