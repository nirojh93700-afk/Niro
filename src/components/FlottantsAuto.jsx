"use client";

import { useEffect } from "react";

// Boutons flottants du bas (« Une question ? », « La boutique ») sur TÉLÉPHONE seulement
// (gérant, 01/11/2026 : « que ça reste quelques secondes, ça disparaît, et quand le client
// touche l'écran ça réapparaît »). Affichés 4 secondes à l'ouverture de la page, puis ils
// glissent vers le bas ; chaque toucher de l'écran les remontre 4 secondes. La fenêtre
// « Une question ? » ouverte les garde visibles (classe flot-garde posée par QuestionWidget).
// Sur ordinateur (> 760 px) : rien ne change. Le CSS est dans globals.css (.flot-btn).
const DUREE = 4000;

export default function FlottantsAuto() {
  useEffect(() => {
    const html = document.documentElement;
    const mq = window.matchMedia("(max-width: 760px)");
    let t = null;
    function cacherPlusTard() {
      clearTimeout(t);
      html.classList.remove("flot-cache");
      if (!mq.matches) return;
      t = setTimeout(() => html.classList.add("flot-cache"), DUREE);
    }
    cacherPlusTard();
    const opts = { passive: true, capture: true };
    window.addEventListener("touchstart", cacherPlusTard, opts);
    window.addEventListener("pointerdown", cacherPlusTard, opts);
    mq.addEventListener?.("change", cacherPlusTard);
    return () => {
      clearTimeout(t);
      html.classList.remove("flot-cache");
      window.removeEventListener("touchstart", cacherPlusTard, opts);
      window.removeEventListener("pointerdown", cacherPlusTard, opts);
      mq.removeEventListener?.("change", cacherPlusTard);
    };
  }, []);
  return null;
}
