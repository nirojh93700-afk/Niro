import { Playfair_Display, Inter } from "next/font/google";
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

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.nivcreation.com"),
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
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
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
