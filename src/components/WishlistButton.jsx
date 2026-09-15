"use client";

import { useState, useEffect } from "react";

const KEY = "niv-wishlist";

// =============================================================================
// LE ♡ DES VIGNETTES ET DES FICHES
// -----------------------------------------------------------------------------
// Deux endroits, volontairement :
//  · le NAVIGATEUR (localStorage) — marche toujours, même sans compte, et
//    l'affichage reste instantané ;
//  · le COMPTE (POST /api/favoris) — en plus, si la cliente est connectée, pour
//    qu'elle retrouve ses favoris sur tous ses appareils.
// L'appel au serveur est « tiré et oublié » : s'il échoue ou si elle n'est pas
// connectée, le cœur fonctionne quand même. Rien ne bloque l'interface.
//
// TROIS FORMES, LE MÊME BOUTON (15/09/2026 — « faut que ça soit partout ») :
//  · variant="vignette" (défaut) : pastille posée sur la photo d'une vignette ;
//  · variant="titre"    : pastille à côté du titre d'une fiche produit ;
//  · variant="ligne"    : lien discret « ♡ Garder pour plus tard » sous le
//    bouton d'ajout au panier.
// Le cœur s'allume/s'éteint PARTOUT en même temps (événement
// « niv-wishlist-change » écouté par tous les boutons de la page).
// =============================================================================
export default function WishlistButton({ slug, name, image, price, variant = "vignette" }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    function relire() {
      try {
        const l = JSON.parse(localStorage.getItem(KEY) || "[]");
        setFav(l.some((x) => x.slug === slug));
      } catch { /* ignore */ }
    }
    relire();
    window.addEventListener("niv-wishlist-change", relire);
    return () => window.removeEventListener("niv-wishlist-change", relire);
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
    // Et dans son compte, si elle est connectée (sans bloquer le clic).
    try {
      fetch("/api/favoris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", slug }),
      }).catch(() => {});
    } catch { /* ignore */ }
  }

  const label = fav ? "Retirer des favoris" : "Ajouter aux favoris";

  // Lien discret sous le bouton « Ajouter au panier ».
  if (variant === "ligne") {
    return (
      <button type="button" onClick={toggle} className={fav ? "fav-ligne fav-ligne-on" : "fav-ligne"} aria-label={label}>
        <span aria-hidden="true">{fav ? "♥" : "♡"}</span>
        {fav ? "Gardé dans mes favoris" : "Garder pour plus tard"}
      </button>
    );
  }

  // Pastille : sur la photo d'une vignette, ou à côté du titre d'une fiche.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`fav-pastille fav-pastille-${variant}${fav ? " fav-pastille-on" : ""}`}
    >
      {fav ? "♥" : "♡"}
    </button>
  );
}
