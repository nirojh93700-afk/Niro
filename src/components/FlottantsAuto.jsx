"use client";

import { useEffect } from "react";

// Boutons flottants du bas (« Une question ? », « La boutique ») sur TÉLÉPHONE seulement
// (gérant, 01/11/2026 : « que ça reste quelques secondes, ça disparaît, et quand le client
// touche l'écran ça réapparaît »). Sur ordinateur (> 760 px) : rien ne change.
// 05/11/2026 (gérant : « ça disparaît pas assez vite ») : avant, CHAQUE toucher les remontrait
// 4 s, donc en faisant défiler la page ils ne partaient jamais. Maintenant :
//  · affichés 3 s à l'ouverture de la page ;
//  · dès que la page défile, ils partent tout de suite ;
//  · un simple toucher (sans faire défiler) les remontre 3 s.
// La fenêtre « Une question ? » ouverte les garde visibles (classe flot-garde posée par QuestionWidget).
// Le CSS est dans globals.css (.flot-btn).
const DUREE = 3000;
const BOUGE = 10; // px : au-delà, le doigt fait défiler, ce n'est pas un toucher

export default function FlottantsAuto() {
  useEffect(() => {
    const html = document.documentElement;
    // Tous les écrans tactiles, quelle que soit leur largeur (11/11/2026 : sur un Samsung Fold ouvert,
    // plus large que 760 px, les boutons ne se cachaient jamais), + les petites fenêtres.
    const mq = window.matchMedia("(max-width: 1100px), (pointer: coarse)");
    let t = null;
    let depart = null;
    let yMontre = window.scrollY;
    function cacher() {
      // seulement un vrai défilement (pas les petits sauts du chargement de la page)
      if (Math.abs(window.scrollY - yMontre) < 40) return;
      clearTimeout(t);
      if (mq.matches) html.classList.add("flot-cache");
    }
    function montrer() {
      clearTimeout(t);
      yMontre = window.scrollY;
      html.classList.remove("flot-cache");
      if (!mq.matches) return;
      t = setTimeout(() => html.classList.add("flot-cache"), DUREE);
    }
    function debut(e) {
      const p = e.touches?.[0];
      depart = p ? { x: p.clientX, y: p.clientY } : null;
    }
    function fin(e) {
      const p = e.changedTouches?.[0];
      if (!depart || !p) return;
      const d = Math.hypot(p.clientX - depart.x, p.clientY - depart.y);
      depart = null;
      if (d < BOUGE) montrer();
    }
    montrer();
    const opts = { passive: true, capture: true };
    window.addEventListener("touchstart", debut, opts);
    window.addEventListener("touchend", fin, opts);
    window.addEventListener("scroll", cacher, opts);
    mq.addEventListener?.("change", montrer);
    return () => {
      clearTimeout(t);
      html.classList.remove("flot-cache");
      window.removeEventListener("touchstart", debut, opts);
      window.removeEventListener("touchend", fin, opts);
      window.removeEventListener("scroll", cacher, opts);
      mq.removeEventListener?.("change", montrer);
    };
  }, []);
  return null;
}
