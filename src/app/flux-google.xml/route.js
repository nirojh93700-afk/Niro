import { getCatalog, priceFrom } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Frais de port FRANCE, PAR PRODUIT (1 exemplaire) — pour que Google affiche le
// vrai tarif de chaque produit au lieu d'un tarif fixe unique. Règle Google :
// ne jamais annoncer MOINS que le prix réel → on prend le tarif le plus élevé
// possible pour un article (domicile OU point relais), aligné sur shipping.js.
//   · produit toujours offert (couverts…) → 0 €
//   · bijou (lettre suivie) → 4,90 € (max entre domicile 3,90 et relais 4,90)
//   · verre (fragile) → 11,90 €
//   · déco / mariage / cristal (colis) → 6,90 € mini, plus selon le poids réel
// La livraison offerte dès 45 € est gérée par le réglage du compte Merchant.
function poidsProduit(p) {
  return Number(p.variants?.[0]?.weight) || Number(p.weight) || 500;
}

// FRANCE (1 exemplaire). Livraison offerte dès 45 € gérée par le compte Merchant.
function portFR(p) {
  if (p.freeShipping) return 0;
  if (p.letter) return 4.9;
  if (p.category === "verres") return 11.9;
  const w = poidsProduit(p);
  const byWeight = w <= 1000 ? 6.9 : w <= 2000 ? 8.9 : w <= 5000 ? 14.9 : w <= 10000 ? 22.9 : w <= 15000 ? 28.9 : 34.9;
  return Math.max(6.9, byWeight);
}

// BELGIQUE / LUXEMBOURG (zone EU1) — aligné sur EU_TIERS de shipping.js.
// Sans ces tarifs, Google refuse les produits pour BE et LU (« infos de
// livraison manquantes »). L'Europe n'a PAS de livraison offerte au seuil.
function portEU1(p) {
  if (p.freeShipping) return 0;
  const w = poidsProduit(p);
  if (p.letter) return w <= 250 ? 6.9 : w <= 500 ? 9.9 : 12.9;        // lettre suivie EU1
  return w <= 1000 ? 16.9 : w <= 2000 ? 22.9 : w <= 5000 ? 32.9 : w <= 10000 ? 46.9 : 74.9; // colis EU1
}

// Blocs de livraison du produit pour les 3 pays diffusés (FR, BE, LU).
function feedShipping(p) {
  const bloc = (pays, prix) => `<g:shipping><g:country>${pays}</g:country><g:price>${prix.toFixed(2)} EUR</g:price></g:shipping>`;
  const eu = portEU1(p);
  return bloc("FR", portFR(p)) + bloc("BE", eu) + bloc("LU", eu);
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
    // Catégorie officielle Google (recommandée pour bien classer le produit).
    const slug = p.slug || "";
    const googleCat =
      p.category === "bijoux" ? "Apparel & Accessories > Jewelry"
      : p.category === "verres" ? "Home & Garden > Kitchen & Dining > Barware"
      : /couvert/.test(slug) ? "Home & Garden > Kitchen & Dining > Tableware > Flatware"
      : /usb|cle-usb/.test(slug) ? "Electronics > Computer Components > Storage Devices > USB Flash Drives"
      : "Home & Garden > Decor";
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
  <g:google_product_category>${esc(googleCat)}</g:google_product_category>
  ${feedShipping(p)}
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
