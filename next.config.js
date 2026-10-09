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
    // Univers (09/10/2026) : les anciennes catégories « deco » et « naissance »
    // renvoient vers « maison » et « enfants ».
    const cats = ["bijoux", "verres", "mariage", "cadeaux", "cristal"];
    return [
      { source: "/boutique", has: [{ type: "query", key: "cat", value: "deco" }], destination: "/boutique/maison", permanent: true },
      { source: "/boutique", has: [{ type: "query", key: "cat", value: "naissance" }], destination: "/boutique/enfants", permanent: true },
      { source: "/boutique", has: [{ type: "query", key: "cat", value: "jeux" }], destination: "/boutique/enfants#r-enfants-2", permanent: true },
      { source: "/boutique/deco", destination: "/boutique/maison", permanent: true },
      { source: "/boutique/naissance", destination: "/boutique/enfants", permanent: true },
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
