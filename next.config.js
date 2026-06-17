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
};

module.exports = nextConfig;
