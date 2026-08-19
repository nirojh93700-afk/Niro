import { CATEGORIES } from "@/lib/products";
import { getCatalog } from "@/lib/catalog";
import { GUIDE_SLUGS } from "@/lib/guides";

// Le plan du site était figé à la compilation : un produit masqué depuis
// l'admin restait annoncé à Google (qui tombait sur une erreur 404), et un
// nouveau produit n'y apparaissait qu'au déploiement suivant. On le régénère
// donc à chaque demande, à partir du catalogue réel (même méthode que le flux
// Google Shopping `flux-google.xml`, qui fonctionne déjà ainsi ; le catalogue
// est mis en cache 60 s côté serveur, donc aucun surcoût).
export const dynamic = "force-dynamic";

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

  // Vraies adresses de catégories (/boutique/X). Cristal et naissance ont déjà
  // leur page dédiée (/cristaux, /naissance) dans staticPages.
  const categoryPages = CATEGORIES
    .filter((c) => c.slug !== "cristal" && c.slug !== "naissance")
    .map((c) => ({
      url: `${base}/boutique/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  // Pages « Idées & conseils » (/idees et /idees/<slug>) — guides de conseil.
  const guidePages = ["/idees", ...GUIDE_SLUGS.map((s) => `/idees/${s}`)].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/idees" ? 0.7 : 0.75,
  }));

  const catalog = await getCatalog();
  const productPages = catalog.map((p) => ({
    url: `${base}/produit/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...guidePages, ...productPages];
}
