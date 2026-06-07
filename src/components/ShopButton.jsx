import Link from "next/link";

// Bouton flottant raccourci vers la boutique (tous les produits).
export default function ShopButton() {
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
