"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import { formatEuro } from "@/lib/format";

const KEY = "niv-recent";

// Mémorise les produits consultés (sur l'appareil) et affiche les derniers vus.
export default function RecentlyViewed({ currentSlug }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { recent = []; }
    if (!Array.isArray(recent)) recent = [];
    // Produits à afficher = récents (hors le produit actuel), avant d'ajouter le courant.
    const others = recent.filter((s) => s && s !== currentSlug);
    const products = others.map(getProductBySlug).filter(Boolean).slice(0, 4);
    setList(products);
    // Enregistre le produit courant en tête.
    const next = [currentSlug, ...recent.filter((s) => s !== currentSlug)].slice(0, 8);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, [currentSlug]);

  if (list.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Vous y revenez ?</span>
          <h2>Vous avez consulté</h2>
        </div>
        <div className="product-grid">
          {list.map((p) => (
            <Link key={p.slug} href={`/produit/${p.slug}`} className="product-card">
              <div className="product-thumb">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} loading="lazy" />
                ) : null}
              </div>
              <div className="product-body">
                <h3>{p.name}</h3>
                <p className="tagline">{p.tagline}</p>
                <div className="product-price">{formatEuro(p.variants?.[0]?.price || 0)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
