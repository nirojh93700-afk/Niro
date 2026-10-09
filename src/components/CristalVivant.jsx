"use client";
// Page /cristaux « Cristal photo 3D » — habillage de la maquette validée docs/maquettes/cristaux-blocs.html
// (mise en ligne le 10/10/2026, « les trois » du gérant). MÊME CONTENU qu'avant (titre, phrase, animation
// du laser, les créations cristal du catalogue + le socle, la note, le retour boutique) ; nouvel habillage :
// écrin encre & or avec l'animation dans un cadre doré, cartes claires avec étiquette, nom et prix SOUS la
// photo. Styles : src/app/cristaux-blocs.css (généré par tools/maquettes/css-cristaux.py, racine .cgb).
// Respecte prefers-reduced-motion (photo affichée directement, sans effets).
import { useEffect, useRef } from "react";
import Link from "next/link";
import IcCg from "@/components/cristal/IcCg";

const CAPS = [
  "Le laser <b>s'allume</b>…",
  "Chaque détail se grave, <b>point par point</b>.",
  "Votre souvenir <b>prend vie</b>.",
  "Posé sur son <b>socle multicolore</b>.",
];

const euro = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
// sous-titre court par produit (repli : le type)
const SUBS = {
  "cristal-photo-3d-vertical": "portraits & duos",
  "cristal-photo-3d-horizontal": "familles & groupes",
  "porte-cles-cristal-led-coeur": "cœur lumineux",
  "porte-cles-cristal-led-rectangle": "rectangle lumineux",
  "cle-usb-cristal-3d": "souvenir + mémoire",
  "trophee-cristal-vierge-3d": "récompenses gravées",
  "pyramide-cristal-gravure-3d": "photo en pyramide",
};

export default function CristalVivant({ products = [] }) {
  const root = useRef(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const ease = (t) => t * t * (3 - 2 * t);
    const ph = R.querySelector("#cvb-anim .cvb-ph img");
    const la = R.querySelector("#cvb-anim .cvb-laser");
    const gl = R.querySelector("#cvb-anim .cvb-glow");
    const cap = R.querySelector("#cvb-anim .cvb-cap");
    const slg = R.querySelector(".cb-lg");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { ph.style.clipPath = "none"; cap.innerHTML = CAPS[3]; return; }

    let raf = 0;
    const t0 = performance.now();
    const fr = (now) => {
      const t = (now - t0) / 1000, G = 4.4;
      const r = ease(clamp(t / G, 0, 1));
      ph.style.clipPath = `inset(0 0 ${(1 - r) * 100}% 0)`;
      la.style.opacity = t < G ? clamp(t / 0.4, 0, 1) : 0;
      la.style.top = r * 100 + "%";
      const led = clamp((t - G + 0.5) / 1.2, 0, 1), hue = (t * 42) % 360;
      gl.style.opacity = 0.85 * led;
      gl.style.background = `radial-gradient(closest-side,hsl(${hue} 95% 62%),transparent)`;
      if (slg) slg.style.background = `radial-gradient(closest-side,hsl(${(hue + 120) % 360} 95% 60%),transparent)`;
      const idx = t < 1.6 ? 0 : t < 3.1 ? 1 : t < 4.9 ? 2 : 3;
      if (cap.dataset.i !== String(idx)) { cap.dataset.i = String(idx); cap.innerHTML = CAPS[idx]; }
      raf = requestAnimationFrame(fr);
    };
    raf = requestAnimationFrame(fr);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="cgb" ref={root}>
      <section className="cg-intro cg-ecrin">
        <div className="container cg-ecrin-grid">
          <div className="cg-ecrin-txt">
            <h1>Votre photo devient <em>cristal</em></h1>
            <p className="cg-lede">Tout est là, d&apos;un coup d&apos;œil — choisissez votre fenêtre.</p>
            <ul className="cg-trust">
              <li><IcCg n="gem" /><span><b>Cristal optique K9</b>pureté et éclat</span></li>
              <li><IcCg n="pin" /><span><b>Gravé en France</b>dans notre atelier</span></li>
              <li><IcCg n="truck" /><span><b>Livraison suivie</b>colis &amp; point relais</span></li>
            </ul>
          </div>
          <div className="cb-anim" id="cvb-anim" aria-hidden="true">
            <div className="cvb-stage">
              <div className="cvb-badge">En direct de l&apos;atelier</div>
              <div className="cvb-ghost" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="cvb-ph"><img src="/produits/cristal-v-couple.jpg" alt="" /><div className="cvb-laser" /></div>
              <div className="cvb-glow" />
              <div className="cvb-cap" dangerouslySetInnerHTML={{ __html: CAPS[0] }} />
            </div>
          </div>
        </div>
      </section>

      <section className="cg-shop" aria-labelledby="t-cb">
        <div className="container">
          <div className="cg-head">
            <h2 id="t-cb">Choisissez votre cristal</h2>
          </div>
          <div className="cg-grid">
            {products.map((p) => {
              const nom = p.name.replace(/\s*—\s*gravure 3d\s*$/i, "");
              return (
                <Link className="cg-tile" key={p.slug} href={`/produit/${p.slug}`} aria-label={nom}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="cg-img">{p.image ? <img src={p.image} alt={nom} loading="lazy" /> : null}</span>
                  <span className="cg-meta">
                    <span className="cg-tag">{SUBS[p.slug] || p.type || "gravure 3D personnalisée"}</span>
                    <b className="cg-nom">{nom}</b>
                    {p.price ? <span className="cg-price">dès {euro(p.price)}</span> : null}
                  </span>
                </Link>
              );
            })}
            <Link className="cg-tile cb-socle" href="/produit/cristal-photo-3d-vertical" aria-label="Socle lumineux">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="cg-img"><img src="/produits/socle-led-rectangle.jpg" alt="Socle lumineux" loading="lazy" /><span className="cb-lg" aria-hidden="true" /></span>
              <span className="cg-meta"><span className="cg-tag">multicolore, en option</span><b className="cg-nom">Socle lumineux</b><span className="cg-price">dès 14,90 €</span></span>
            </Link>
            <div className="cg-tile cb-info" role="note">
              <span className="cb-stars">★★★★★</span><b>4,9 / 5</b><span>Gravé en France,<br />dans notre atelier</span>
            </div>
          </div>
          <p className="cb-retour"><Link href="/boutique"><IcCg n="back" /> Retour à toute la boutique</Link></p>
        </div>
      </section>
    </div>
  );
}
