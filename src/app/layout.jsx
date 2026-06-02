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
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

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
  for (const candidate of [raw, `https://${raw}`, "https://www.nivcreation.com"]) {
    try {
      if (candidate) return new URL(candidate);
    } catch {
      // on essaie le candidat suivant
    }
  }
  return new URL("https://www.nivcreation.com");
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

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${fontVars}`}>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
