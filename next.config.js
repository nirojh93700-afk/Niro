/** @type {import('next').NextConfig} */
// Déploiement déclenché pour activer les variables d'environnement (ADMIN_PASSWORD).
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

module.exports = nextConfig;
