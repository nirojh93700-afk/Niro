"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatEuro } from "@/lib/format";

const KEY = "niv-wishlist";

export default function FavorisPage() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setItems([]); }
  }, []);

  function remove(slug) {
    const next = (items || []).filter((x) => x.slug !== slug);
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("niv-wishlist-change"));
  }

  if (items === null) return <div className="container" style={{ padding: 40 }}><p>Chargement…</p></div>;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Mes favoris</span>
          <h2>Vos coups de cœur ♥</h2>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--ink-soft)" }}>Vous n'avez pas encore de favoris. Touchez le ♡ sur un produit pour l'ajouter ici.</p>
            <Link href="/boutique" className="btn btn-gold">Découvrir la boutique</Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((p) => (
              <div key={p.slug} className="product-card" style={{ position: "relative" }}>
                <Link href={`/produit/${p.slug}`} className="product-thumb" style={{ display: "block" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="placeholder">Niv</div>}
                </Link>
                <div className="product-body">
                  <h3><Link href={`/produit/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</Link></h3>
                  <div className="product-price">{typeof p.price === "number" ? formatEuro(p.price) : ""}</div>
                  <button className="btn btn-outline" style={{ marginTop: 8, padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => remove(p.slug)}>Retirer ♥</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
