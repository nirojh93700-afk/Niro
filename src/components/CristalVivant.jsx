"use client";
// Haut de /cristaux en MULTI-FENÊTRES (bento) — reproduction fidèle de la maquette
// validée docs/maquettes/cristal-multifenetres.html : tout est visible d'un coup,
// la grande fenêtre joue l'animation de gravure laser toute seule (puis socle
// multicolore en continu), chaque fenêtre clique vers sa fiche.
// Respecte prefers-reduced-motion (photo affichée directement, sans effets).
import { useEffect, useRef } from "react";
import Link from "next/link";

const CSS = `
.cvb-wrap{max-width:1020px;margin:0 auto;padding:18px 14px 34px}
@media(min-width:1240px){.cvb-wrap{max-width:min(88vw,1560px)}}
.cvb-head{text-align:center;padding:14px 8px 14px}
.cvb-head .cvb-k{font-size:10.5px;letter-spacing:3px;text-transform:uppercase;color:#a98935}
.cvb-head h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(24px,6vw,40px);margin:6px 0 4px;color:#2b2620}
.cvb-head h1 em{font-style:normal;color:#a98935}
.cvb-head p{color:#5a5247;font-size:clamp(13px,3.6vw,16px);margin:0}
.cvb{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto}
.cvb-tile{position:relative;min-width:0;border-radius:16px;overflow:hidden;background:#fffdf9;box-shadow:0 10px 26px rgba(43,38,32,.12),0 0 0 1px rgba(194,161,78,.28)}
.cvb-tile a.cvb-cover{position:absolute;inset:0;z-index:8}
.cvb-img{position:relative;aspect-ratio:1/1}
.cvb-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cvb-lab{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:22px 10px 9px;color:#fff;background:linear-gradient(transparent,rgba(23,15,6,.82));font-size:12.5px;text-align:center;line-height:1.35}
.cvb-lab b{display:block;font-size:14px;color:#e2c67e}
.cvb-price{position:absolute;top:8px;right:8px;z-index:3;background:rgba(255,253,249,.95);color:#2b2620;font-weight:700;font-size:11.5px;padding:4px 9px;border-radius:20px;border:1px solid #e7ddcd}
.cvb-note{position:absolute;top:8px;left:8px;z-index:3;background:rgba(43,38,32,.82);color:#e2c67e;font-weight:700;font-size:11px;padding:4px 8px;border-radius:20px}
#cvb-anim{grid-column:1 / -1}
#cvb-anim .cvb-stage{position:relative;aspect-ratio:16/10;background:radial-gradient(120% 90% at 50% 18%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
#cvb-anim .cvb-ph{position:absolute;left:50%;top:49%;transform:translate(-50%,-50%);width:58%;max-width:330px;aspect-ratio:760/481;border-radius:10px;overflow:hidden;box-shadow:0 18px 40px rgba(43,38,32,.30),0 0 0 1px rgba(194,161,78,.4)}
#cvb-anim .cvb-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;clip-path:inset(0 0 100% 0)}
#cvb-anim .cvb-ghost{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34%;aspect-ratio:2/3;border-radius:6px;border:1.5px solid rgba(194,161,78,.5);background:linear-gradient(115deg,rgba(255,255,255,.8),rgba(240,232,214,.3) 45%,rgba(255,255,255,.65))}
#cvb-anim .cvb-laser{position:absolute;left:-4%;width:108%;height:2.5px;border-radius:3px;opacity:0;z-index:4;background:linear-gradient(90deg,transparent,#fff 18%,#e2c67e 50%,#fff 82%,transparent);box-shadow:0 0 12px 3px rgba(226,198,126,.95),0 0 34px 9px rgba(226,198,126,.5)}
#cvb-anim .cvb-glow{position:absolute;left:22%;right:22%;bottom:2%;height:16%;border-radius:50%;filter:blur(16px);opacity:0;z-index:1}
#cvb-anim .cvb-cap{position:absolute;left:0;right:0;bottom:7px;z-index:5;text-align:center;font-size:clamp(12px,3.4vw,15px);color:#2b2620}
#cvb-anim .cvb-cap b{color:#a98935}
#cvb-anim .cvb-badge{position:absolute;top:9px;left:10px;z-index:5;background:rgba(43,38,32,.85);color:#e2c67e;font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;padding:5px 10px;border-radius:20px}
#cvb-socle .cvb-img{background:#17120c}
#cvb-socle img{opacity:.94}
#cvb-socle .cvb-lg{position:absolute;left:14%;right:14%;bottom:6%;height:26%;border-radius:50%;filter:blur(16px);z-index:2;opacity:.9}
.cvb-info{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;aspect-ratio:1/1;text-align:center;padding:12px;background:linear-gradient(160deg,#fffdf9,#f6efe1)}
.cvb-info .cvb-stars{color:#a98935;font-size:16px;letter-spacing:2px}
.cvb-info b{font-family:Georgia,'Times New Roman',serif;font-size:15.5px;color:#2b2620}
.cvb-info span{color:#5a5247;font-size:12px;line-height:1.4}
#cvb-go{background:linear-gradient(150deg,#332a1d,#2b2620)}
#cvb-go .cvb-info{background:none}
#cvb-go b{color:#e2c67e;font-size:16px}
#cvb-go span{color:#cfc6b2}
#cvb-go .cvb-btn{margin-top:6px;background:linear-gradient(135deg,#c2a14e,#a98935);color:#fff;font-weight:700;font-size:13px;padding:9px 20px;border-radius:30px;box-shadow:0 8px 20px rgba(194,161,78,.4)}
@media(min-width:760px){
 .cvb{grid-template-columns:repeat(4,minmax(0,1fr))}
 #cvb-anim{grid-column:1/3;grid-row:1/3}
 #cvb-anim .cvb-stage{height:100%;aspect-ratio:auto}
}
@media (prefers-reduced-motion:reduce){#cvb-anim .cvb-ph img{clip-path:none!important}#cvb-anim .cvb-laser{display:none}}
`;

const CAPS = [
  "Le laser <b>s'allume</b>…",
  "Chaque détail se grave, <b>point par point</b>.",
  "Votre souvenir <b>prend vie</b>.",
  "Posé sur son <b>socle multicolore</b>.",
];

const euro = (n) => (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(2).replace(".", ",")) + " €";
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
    const slg = R.querySelector("#cvb-socle .cvb-lg");

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
    <div ref={root}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cvb-wrap">
        <header className="cvb-head">
          <div className="cvb-k">Niv Création · Gravure laser 3D</div>
          <h1>Votre photo devient <em>cristal</em></h1>
          <p>Tout est là, d&apos;un coup d&apos;œil — choisissez votre fenêtre.</p>
        </header>

        <div className="cvb">
          <div className="cvb-tile" id="cvb-anim">
            <div className="cvb-stage">
              <div className="cvb-badge">En direct de l&apos;atelier</div>
              <div className="cvb-ghost" />
              <div className="cvb-ph"><img src="/produits/cristal-v-couple.jpg" alt="Gravure laser 3D dans le cristal" />
                <div className="cvb-laser" /></div>
              <div className="cvb-glow" />
              <div className="cvb-cap" dangerouslySetInnerHTML={{ __html: CAPS[0] }} />
            </div>
          </div>

          {products.map((p) => (
            <div className="cvb-tile" key={p.slug}>
              <Link className="cvb-cover" href={`/produit/${p.slug}`} aria-label={p.name} />
              <div className="cvb-img">
                {p.image ? <img src={p.image} alt={p.name} /> : null}
                {p.price ? <span className="cvb-price">dès {euro(p.price)}</span> : null}
                {p.rating ? <span className="cvb-note">★ {String(p.rating.avg).replace(".", ",")}</span> : null}
                <div className="cvb-lab"><b>{p.name.replace(/\s*—\s*gravure 3d\s*$/i, "")}</b>{SUBS[p.slug] || p.type || "gravure 3D personnalisée"}</div>
              </div>
            </div>
          ))}

          <div className="cvb-tile" id="cvb-socle">
            <Link className="cvb-cover" href="/produit/cristal-photo-3d-vertical" aria-label="Socle lumineux (option sur les blocs)" />
            <div className="cvb-img"><img src="/produits/socle-led-rectangle.jpg" alt="Socle lumineux LED" />
              <span className="cvb-price">dès 14,90 €</span>
              <div className="cvb-lg" />
              <div className="cvb-lab"><b>Socle lumineux</b>multicolore, en option</div></div>
          </div>

          <div className="cvb-tile"><div className="cvb-info">
            <div className="cvb-stars">★★★★★</div><b>4,9 / 5</b>
            <span>Gravé en France,<br />dans notre atelier</span>
          </div></div>
        </div>
      </div>
    </div>
  );
}
