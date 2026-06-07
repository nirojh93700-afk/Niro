"use client";

import { useState, useEffect } from "react";

const KEY = "niv-wishlist";

export default function WishlistButton({ slug, name, image, price }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem(KEY) || "[]");
      setFav(l.some((x) => x.slug === slug));
    } catch { /* ignore */ }
  }, [slug]);

  function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      let l = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (l.some((x) => x.slug === slug)) l = l.filter((x) => x.slug !== slug);
      else l.push({ slug, name, image, price });
      localStorage.setItem(KEY, JSON.stringify(l));
      setFav(l.some((x) => x.slug === slug));
      window.dispatchEvent(new Event("niv-wishlist-change"));
    } catch { /* ignore */ }
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        position: "absolute", bottom: 10, right: 10, zIndex: 2,
        background: "rgba(255,255,255,0.92)", border: 0, borderRadius: "50%",
        width: 36, height: 36, cursor: "pointer", fontSize: "1.2rem", lineHeight: 1,
        color: fav ? "#d4506a" : "#b6b0a6", boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
      }}
    >
      {fav ? "♥" : "♡"}
    </button>
  );
}
