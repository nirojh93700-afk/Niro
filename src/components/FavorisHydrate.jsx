"use client";

import { useEffect } from "react";

const KEY = "niv-wishlist";

// =============================================================================
// ♡ FAVORIS SUR DU HTML ÉCRIT CÔTÉ SERVEUR (les guides « Idées & conseils »)
// -----------------------------------------------------------------------------
// Les grilles de produits des guides sont rendues en UN SEUL bloc HTML
// (`guideHtmlComplet`) — on ne peut donc pas y mettre un composant React
// (piège documenté : ça cassait l'hydratation des 9 pages).
// Ce composant n'affiche RIEN : il branche les boutons déjà présents dans le
// HTML (`<button data-fav-slug=…>`) sur exactement la même mécanique que
// WishlistButton : le navigateur (localStorage) + le compte (POST /api/favoris).
// =============================================================================
export default function FavorisHydrate() {
  useEffect(() => {
    const boutons = Array.from(document.querySelectorAll("button[data-fav-slug]"));
    if (!boutons.length) return;

    function lire() {
      try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
    }
    function peindre() {
      const l = lire();
      boutons.forEach((b) => {
        const on = l.some((x) => x.slug === b.dataset.favSlug);
        b.classList.toggle("fav-pastille-on", on);
        b.textContent = on ? "♥" : "♡";
        const t = on ? "Retirer des favoris" : "Ajouter aux favoris";
        b.setAttribute("aria-label", t);
        b.setAttribute("title", t);
      });
    }
    function clic(e) {
      e.preventDefault();
      e.stopPropagation();
      const b = e.currentTarget;
      const slug = b.dataset.favSlug;
      try {
        let l = lire();
        if (l.some((x) => x.slug === slug)) l = l.filter((x) => x.slug !== slug);
        else {
          const prix = Number(b.dataset.favPrice);
          l.push({
            slug,
            name: b.dataset.favName || slug,
            image: b.dataset.favImage || "",
            price: Number.isFinite(prix) && prix > 0 ? prix : undefined,
          });
        }
        localStorage.setItem(KEY, JSON.stringify(l));
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

    peindre();
    boutons.forEach((b) => b.addEventListener("click", clic));
    window.addEventListener("niv-wishlist-change", peindre);
    return () => {
      boutons.forEach((b) => b.removeEventListener("click", clic));
      window.removeEventListener("niv-wishlist-change", peindre);
    };
  }, []);

  return null;
}
