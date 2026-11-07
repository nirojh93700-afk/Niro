/** @type {import('next').NextConfig} */
// Déploiement déclenché pour activer les variables d'environnement (ADMIN_PASSWORD).
const nextConfig = {
  // firebase-admin ne doit pas être "bundlé" (sinon le build Netlify échoue).
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin", "harfbuzzjs"],
    // Fichier à graver (07/11/2026) : HarfBuzz lit hb.wasm à côté de son code ; sans ceci le fichier
    // n'est pas copié dans le serveur en ligne (erreur 500 constatée sur /api/fichier-gravure).
    outputFileTracingIncludes: { "/api/fichier-gravure": ["./node_modules/harfbuzzjs/*.wasm", "./node_modules/harfbuzzjs/*.js"] },
  },
  // CORS sur les images utilisées pour composer le visuel du verre (canvas).
  // Sans ça, sur iOS le canvas est "contaminé" (CDN = origine externe) et la
  // génération de l'aperçu échoue → verre vide. ACAO:* + crossOrigin="anonymous".
  async headers() {
    // En-têtes de sécurité sur TOUTES les pages (audit du 04/11/2026, aucun n'existait) :
    //  · HSTS : le navigateur n'accepte plus que le https pendant un an (www compris) ;
    //  · X-Frame-Options SAMEORIGIN : le site ne peut pas être mis dans un cadre par un autre
    //    site (hameçonnage) ; le cadre caché de /gestion/etiquettes est sur le même site, OK ;
    //  · X-Content-Type-Options : un fichier n'est jamais « deviné » comme un script ;
    //  · Referrer-Policy : l'adresse complète d'une page n'est pas transmise aux autres sites ;
    //  · Permissions-Policy : caméra, micro, position coupés (le site n'en a pas besoin ;
    //    « Choisir une photo » passe par le sélecteur de fichiers, pas par la caméra).
    // Pas de Content-Security-Policy : trop de scripts en ligne (GA, Stripe, aperçus) à lister,
    // un oubli casserait une page ; à faire à part, avec un mode « rapport » d'abord.
    const securite = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/:path*", headers: securite },
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
