import { getCatalog, priceFrom } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Flux produits pour Google Merchant Center (Google Shopping, gratuit).
// À ajouter une fois dans Merchant Center : URL = https://nivcreation.fr/flux-google.xml
export async function GET() {
  let products = [];
  try { products = (await getCatalog()).filter((p) => !p.hidden && (p.images || []).length); } catch { products = []; }

  const items = products.map((p) => {
    const price = priceFrom(p).toFixed(2);
    const desc = (p.descriptionHtml || p.tagline || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4500);
    const img = p.images[0];
    const extra = (p.images || []).slice(1, 11).map((u) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("");
    const cat = p.category === "mariage" ? "Décoration de mariage" : p.category === "bijoux" ? "Bijoux personnalisés" : "Cadeaux personnalisés";
    return `<item>
  <g:id>${esc(p.slug)}</g:id>
  <g:title>${esc(p.title || p.name)}</g:title>
  <g:description>${esc(desc)}</g:description>
  <g:link>${BASE}/produit/${esc(p.slug)}</g:link>
  <g:image_link>${esc(img)}</g:image_link>${extra}
  <g:price>${price} EUR</g:price>
  <g:availability>in_stock</g:availability>
  <g:condition>new</g:condition>
  <g:brand>Niv Création</g:brand>
  <g:identifier_exists>no</g:identifier_exists>
  <g:product_type>${esc(cat)}</g:product_type>
</item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Niv Création — Créations personnalisées</title>
<link>${BASE}</link>
<description>Bijoux, mariage et cadeaux personnalisés gravés en France.</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
