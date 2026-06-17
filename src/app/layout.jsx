import {
  Playfair_Display,
  Inter,
  Cinzel,
  Cinzel_Decorative,
  Montserrat,
  Great_Vibes,
  Allura,
  Pacifico,
} from "next/font/google";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SiteGate from "@/components/SiteGate";
import ShopButton from "@/components/ShopButton";
import WelcomePopup from "@/components/WelcomePopup";
import SiteAnalytics from "@/components/SiteAnalytics";
import { getSettings } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/products";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Polices de gravure (palette Niv Création).
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-cinzel", display: "swap" });
const cinzelDeco = Cinzel_Decorative({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-cinzel-deco", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-montserrat", display: "swap" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: ["400"], variable: "--font-great-vibes", display: "swap" });
const allura = Allura({ subsets: ["latin"], weight: ["400"], variable: "--font-allura", display: "swap" });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"], variable: "--font-pacifico", display: "swap" });

const fontVars = [cinzel, cinzelDeco, montserrat, greatVibes, allura, pacifico]
  .map((f) => f.variable)
  .join(" ");

// Résout l'URL de base sans jamais planter le build (même si la variable
// NEXT_PUBLIC_SITE_URL est mal écrite, vide, ou sans https://).
function resolveMetadataBase() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  for (const candidate of [raw, `https://${raw}`, "https://nivcreation.fr"]) {
    try {
      if (candidate) return new URL(candidate);
    } catch {
      // on essaie le candidat suivant
    }
  }
  return new URL("https://nivcreation.fr");
}

export const metadata = {
  metadataBase: resolveMetadataBase(),
  manifest: "/manifest.webmanifest",
  title: {
    default: "Niv Création — Bijoux, mariage & cadeaux personnalisés au laser",
    template: "%s | Niv Création",
  },
  description:
    "Atelier français de gravure et découpe laser. Bijoux personnalisés, décorations de mariage et cadeaux gravés sur mesure, personnalisés en France.",
  keywords: [
    "gravure laser",
    "cadeau personnalisé",
    "bijoux personnalisés",
    "décoration mariage",
    "numéro de table",
    "personnalisé en France",
  ],
  openGraph: {
    title: "Niv Création — Créations personnalisées au laser",
    description:
      "Bijoux, décorations de mariage et cadeaux gravés sur mesure, personnalisés en France.",
    type: "website",
    locale: "fr_FR",
    siteName: "Niv Création",
    images: [{ url: (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim() }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Niv Création — Créations personnalisées au laser",
    description: "Bijoux, mariage et cadeaux gravés sur mesure, personnalisés en France.",
    images: [(process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim()],
  },
  appleWebApp: {
    capable: true,
    title: "Niv Création",
    statusBarStyle: "default",
  },
};

// N'accepte qu'une couleur hexadécimale valide (sécurité : pas d'injection CSS).
function safeHex(c) {
  return typeof c === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.trim()) ? c.trim() : "";
}

// Polices disponibles -> variable CSS correspondante (déjà chargées plus haut).
const FONT_VARS = {
  playfair: "var(--font-display)",
  cinzel: "var(--font-cinzel)",
  "cinzel-deco": "var(--font-cinzel-deco)",
  montserrat: "var(--font-montserrat)",
  "great-vibes": "var(--font-great-vibes)",
  allura: "var(--font-allura)",
  pacifico: "var(--font-pacifico)",
  inter: "var(--font-body)",
};

export default async function RootLayout({ children }) {
  let settings = {
    color: "", fontHeading: "", fontBody: "",
    announce: { enabled: false, text: "", link: "" },
  };
  try {
    settings = await getSettings();
  } catch {
    // valeurs par défaut si indisponible
  }
  const color = safeHex(settings.color);
  const rootRules = [];
  if (color) rootRules.push(`--gold:${color}`, `--gold-dark:${color}`);
  if (FONT_VARS[settings.fontHeading]) rootRules.push(`--font-display:${FONT_VARS[settings.fontHeading]}`);
  if (FONT_VARS[settings.fontBody]) rootRules.push(`--font-body:${FONT_VARS[settings.fontBody]}`);
  const colorCss = rootRules.length ? `:root{${rootRules.join(";")};}` : "";
  const announce = settings.announce || {};

  // Catégories du menu : seulement celles qui ont au moins un produit visible
  // (les produits masqués sont déjà exclus par getCatalog).
  let menuCategories = CATEGORIES;
  try {
    const catalog = await getCatalog();
    const present = new Set(catalog.map((p) => p.category));
    menuCategories = CATEGORIES.filter((c) => present.has(c.slug));
  } catch {
    // en secours, on garde toutes les catégories
  }

  // Accès admin : un cookie correspondant au code d'accès débloque tout
  // (mode privé ET maintenance) — c'est ce qui te permet d'accéder à /gestion.
  // Verrou retiré : le site suit le réglage admin (en ligne / privé).
  const FORCE_PRIVATE = false;
  // L'admin (/gestion) n'est PAS soumis au code du site : il a déjà son propre
  // mot de passe. Le code du site ne protège que la boutique publique.
  const pathname = headers().get("x-pathname") || "";
  const isAdminPath = pathname.startsWith("/gestion") || pathname.startsWith("/suivi");
  const access = settings.access || { locked: false, code: "" };
  const maintenance = settings.maintenance || { enabled: false, message: "" };
  const provided = cookies().get("site-access-v3")?.value;
  const hasAccess = Boolean(access.code) && provided === access.code;
  const showMaintenance = maintenance.enabled && !hasAccess && !isAdminPath;
  const showGate = !showMaintenance && (FORCE_PRIVATE || access.locked) && !hasAccess && !isAdminPath;
  const gateOpen = !showMaintenance && !showGate;

  // Balises marketing (validées : chiffres pour le Pixel, alphanum pour Google).
  const pixelId = /^[0-9]{5,30}$/.test(settings.metaPixelId || "") ? settings.metaPixelId : "";
  const gaId = /^[A-Za-z0-9-]{5,30}$/.test(settings.gaId || "") ? settings.gaId : "";

  // Données structurées (SEO) : aide Google à identifier la boutique.
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").replace(/\/$/, "");
  const LOGO = (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim();
  const orgLd = {
    "@context": "https://schema.org", "@type": "Store",
    name: "Niv Création", url: SITE_URL, image: LOGO, logo: LOGO,
    description: "Atelier français de gravure et découpe laser. Bijoux, décorations de mariage et cadeaux personnalisés, personnalisés en France.",
    sameAs: ["https://instagram.com/nivcreation"],
    address: { "@type": "PostalAddress", addressCountry: "FR" },
    areaServed: "FR",
  };
  const siteLd = {
    "@context": "https://schema.org", "@type": "WebSite",
    name: "Niv Création", url: SITE_URL,
  };

  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${fontVars}`}>
      <body>
        {colorCss ? <style dangerouslySetInnerHTML={{ __html: colorCss }} /> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');` }} />
          </>
        )}
        {pixelId && (
          <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');` }} />
        )}
        {gateOpen ? (
          <>
            {announce.enabled && announce.text ? (
              <div className="announce-bar">
                {announce.link ? (
                  <a href={announce.link}>{announce.text}</a>
                ) : (
                  announce.text
                )}
              </div>
            ) : null}
            <CartProvider>
              <Header categories={menuCategories} />
              <main>{children}</main>
              <Footer />
              <CartDrawer />
              <ShopButton />
              <WelcomePopup enabled={settings.welcome?.enabled} code={settings.welcome?.code} text={settings.welcome?.text} />
              <SiteAnalytics />
            </CartProvider>
          </>
        ) : showMaintenance ? (
          <SiteGate maintenance message={maintenance.message} />
        ) : (
          <SiteGate />
        )}
      </body>
    </html>
  );
}
