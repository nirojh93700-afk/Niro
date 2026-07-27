import { CATEGORIES } from "@/lib/products";
import { getCatalog } from "@/lib/catalog";

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").replace(/\/$/, "");
  const now = new Date();

  const staticPages = [
    "",
    "/boutique",
    "/cristaux",
    "/naissance",
    "/offres",
    "/avis",
    "/faq",
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
    priority: path === "" ? 1 : path === "/cristaux" ? 0.9 : 0.7,
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
