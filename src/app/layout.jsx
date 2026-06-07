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
import { cookies } from "next/headers";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SiteGate from "@/components/SiteGate";
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
  title: {
    default: "Niv Création — Bijoux, mariage & cadeaux personnalisés au laser",
    template: "%s | Niv Création",
  },
  description:
    "Atelier français de gravure et découpe laser. Bijoux personnalisés, décorations de mariage et cadeaux gravés sur mesure, fabriqués à la main.",
  keywords: [
    "gravure laser",
    "cadeau personnalisé",
    "bijoux personnalisés",
    "décoration mariage",
    "numéro de table",
    "fait main France",
  ],
  openGraph: {
    title: "Niv Création — Créations personnalisées au laser",
    description:
      "Bijoux, décorations de mariage et cadeaux gravés sur mesure, fabriqués à la main en France.",
    type: "website",
    locale: "fr_FR",
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
  const access = settings.access || { locked: false, code: "" };
  const maintenance = settings.maintenance || { enabled: false, message: "" };
  const provided = cookies().get("site-access")?.value;
  const hasAccess = Boolean(access.code) && provided === access.code;
  const showMaintenance = maintenance.enabled && !hasAccess;
  const showGate = !showMaintenance && access.locked && !hasAccess;
  const gateOpen = !showMaintenance && !showGate;

  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${fontVars}`}>
      <body>
        {colorCss ? <style dangerouslySetInnerHTML={{ __html: colorCss }} /> : null}
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
