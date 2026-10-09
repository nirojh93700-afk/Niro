"use client";

import { useEffect } from "react";

// Mécanique commune des pages refaites : apparition douce au défilement
// (IntersectionObserver, jamais d'écouteur scroll) et hauteur de l'en-tête du
// site mesurée pour les barres collantes (--hdr). Ne rend rien.
export default function Reveal() {
  useEffect(() => {
    const root = document.querySelector(".mx");
    if (!root) return;
    const header = document.querySelector(".header");
    const hdr = () => root.style.setProperty("--hdr", `${header ? header.offsetHeight : 0}px`);
    hdr();
    window.addEventListener("resize", hdr);
    const els = root.querySelectorAll(".rv:not(.in)");
    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      els.forEach((el) => io.observe(el));
    } else {
      els.forEach((el) => el.classList.add("in"));
    }
    // Ce qui est déjà à l'écran (ou au-dessus) apparaît tout de suite.
    const t = setTimeout(() => els.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); }), 400);
    return () => { window.removeEventListener("resize", hdr); if (io) io.disconnect(); clearTimeout(t); };
  }, []);
  return null;
}
