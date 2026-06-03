import { CATEGORIES } from "@/lib/products";
import { getCatalog } from "@/lib/catalog";

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nivcreation.com").replace(/\/$/, "");
  const now = new Date();

  const staticPages = [
    "",
    "/boutique",
    "/a-propos",
    "/contact",
    "/retours",
    "/cgv",
    "/mentions-legales",
    "/confidentialite",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${base}/boutique?cat=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const catalog = await getCatalog();
  const productPages = catalog.map((p) => ({
    url: `${base}/produit/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
