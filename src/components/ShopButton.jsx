"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Bouton flottant raccourci vers la boutique (tous les produits).
// Masqué dans l'espace de gestion (réservé aux clientes) ET sur les fiches
// produit (où il chevaucherait l'aperçu de gravure flottant en bas à droite).
export default function ShopButton() {
  const pathname = usePathname();
  if (pathname && (pathname.startsWith("/gestion") || pathname.startsWith("/produit"))) return null;

  return (
    <Link
      href="/boutique"
      aria-label="Voir tous les produits"
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 60,
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "12px 18px", borderRadius: 999,
        background: "var(--gold)", color: "#fff", textDecoration: "none",
        fontWeight: 600, fontSize: "0.95rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
      }}
    >
      🛍️ La boutique
    </Link>
  );
}
