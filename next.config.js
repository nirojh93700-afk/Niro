/** @type {import('next').NextConfig} */
// Déploiement déclenché pour activer les variables d'environnement (ADMIN_PASSWORD).
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  // firebase-admin ne doit pas être "bundlé" (sinon le build Netlify échoue).
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
  // CORS sur les images utilisées pour composer le visuel du verre (canvas).
  // Sans ça, sur iOS le canvas est "contaminé" (CDN = origine externe) et la
  // génération de l'aperçu échoue → verre vide. ACAO:* + crossOrigin="anonymous".
  async headers() {
    return [
      { source: "/produits/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
      { source: "/motifs/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
    ];
  },
  // SEO : les anciennes adresses à filtre /boutique?cat=X renvoient (301) vers
  // les vraies adresses /boutique/X (cristal et naissance vers leurs pages dédiées).
  // Les autres paramètres (sub, type) sont conservés automatiquement.
  async redirects() {
    const cats = ["bijoux", "verres", "mariage", "deco", "cadeaux"];
    return [
      { source: "/boutique", has: [{ type: "query", key: "cat", value: "cristal" }], destination: "/cristaux", permanent: true },
      { source: "/boutique", has: [{ type: "query", key: "cat", value: "naissance" }], destination: "/naissance", permanent: true },
      ...cats.map((c) => ({
        source: "/boutique",
        has: [{ type: "query", key: "cat", value: c }],
        destination: `/boutique/${c}`,
        permanent: true,
      })),
    ];
  },
};

module.exports = nextConfig;
