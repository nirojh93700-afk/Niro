import { products, CATEGORIES } from "@/lib/products";

export default function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nivcreation.com").replace(/\/$/, "");
  const now = new Date();

  const staticPages = ["", "/boutique"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${base}/boutique?cat=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productPages = products.map((p) => ({
    url: `${base}/produit/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
