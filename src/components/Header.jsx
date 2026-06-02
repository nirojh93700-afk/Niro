"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";
import { CATEGORIES } from "@/lib/products";

export default function Header() {
  const { count, setDrawerOpen, hydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-name">Niv Création</span>
          <span className="logo-sub">Gravure & découpe laser</span>
        </Link>

        <nav className={`nav ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
          <Link href="/boutique">Boutique</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/boutique?cat=${c.slug}`}>{c.short}</Link>
          ))}
          <Link href="/offres" style={{ color: "#b4452f", fontWeight: 600 }}>Offres</Link>
          <Link href="/a-propos">À propos</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="header-actions">
          <button
            className="cart-btn"
            aria-label="Ouvrir le panier"
            onClick={() => setDrawerOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {hydrated && count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          <button
            className="menu-toggle"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
