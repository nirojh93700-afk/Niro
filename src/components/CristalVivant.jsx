"use client";
// Bannière animée AUTOMATIQUE de /cristaux (version compacte demandée par la gérante) :
// l'animation se joue toute seule, sur UN seul écran — le laser grave la photo dans le
// cristal (étincelles + reflet), puis le socle multicolore s'allume en continu.
// Les produits arrivent juste en dessous : pas de long défilement.
// Respecte prefers-reduced-motion (photo affichée directement, sans effets).
import { useEffect, useRef } from "react";

const IMG_COUPLE = "/produits/cristal-v-couple.jpg";

const CSS = `
#cv-hero{position:relative;min-height:92svh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.6vh;overflow:hidden;padding:26px 0 30px;background:linear-gradient(180deg,#fffdf9,#faf6ef 40%,#f3ece0)}
#cv-hero .cv-kicker{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a98935}
#cv-hero h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(24px,6.4vw,42px);color:#2b2620;text-align:center;line-height:1.12;padding:0 24px;margin:6px 0 0}
#cv-hero h1 em{font-style:normal;color:#a98935}
.cv-stage{position:relative;width:min(84vw,480px)}
.cv-frame{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 26px 54px rgba(43,38,32,.26),0 0 0 1px rgba(194,161,78,.35);aspect-ratio:760/481;background:#f3ece0}
.cv-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.cv-photo{clip-path:inset(0 0 100% 0)}
.cv-blank{display:flex;align-items:center;justify-content:center;position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 20%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.cv-blank .cv-ghost{width:36%;aspect-ratio:2/3;border-radius:8px;border:1.5px solid rgba(194,161,78,.55);background:linear-gradient(115deg,rgba(255,255,255,.85),rgba(240,232,214,.35) 45%,rgba(255,255,255,.7));box-shadow:inset 0 0 22px rgba(194,161,78,.18)}
.cv-laser{position:absolute;left:-4%;width:108%;height:3px;z-index:4;border-radius:3px;background:linear-gradient(90deg,transparent,#fff 18%,#e2c67e 50%,#fff 82%,transparent);box-shadow:0 0 14px 3px rgba(226,198,126,.95),0 0 40px 10px rgba(226,198,126,.5);opacity:0}
.cv-laser .cv-ldot{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 30%,#e2c67e 60%,transparent 70%);box-shadow:0 0 22px 8px rgba(255,246,220,.95)}
.cv-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(255,250,230,.9);opacity:0;z-index:3}
.cv-halo{position:absolute;inset:-26%;z-index:-1;pointer-events:none;background:radial-gradient(circle at 50% 55%,rgba(226,198,126,.5),rgba(226,198,126,0) 60%);opacity:.25}
.cv-sweep{position:absolute;inset:0;z-index:5;pointer-events:none;opacity:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.5) 46%,rgba(255,255,255,.75) 50%,rgba(255,255,255,.5) 54%,transparent 70%);transform:translateX(-120%)}
.cv-ledglow{position:absolute;left:10%;right:10%;bottom:-11%;height:30%;border-radius:50%;filter:blur(20px);opacity:0;z-index:-1}
.cv-rim{position:absolute;inset:0;border-radius:14px;mix-blend-mode:screen;pointer-events:none;z-index:2}
.cv-cap{min-height:30px;text-align:center;font-size:clamp(15px,4.2vw,20px);color:#2b2620;padding:0 26px;position:relative;width:100%}
.cv-cap p{position:absolute;left:0;right:0;top:0;opacity:0;margin:0;transition:opacity .35s}
.cv-cap p b{color:#a98935}
.cv-down{display:inline-flex;align-items:center;gap:8px;color:#a98935;font-weight:700;font-size:14px;text-decoration:none;border:1px solid rgba(194,161,78,.55);padding:9px 20px;border-radius:40px;background:rgba(255,253,249,.7)}
.cv-down span{display:inline-block;animation:cvb 1.6s ease-in-out infinite}
@keyframes cvb{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){
 .cv-photo{clip-path:none!important}.cv-laser,.cv-sweep{display:none!important}
 .cv-cap p:last-child{opacity:1!important}.cv-down span{animation:none}
}
`;

// petites étincelles déterministes
function seededSparks(n) {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  return Array.from({ length: n }, () => ({ x: 8 + rnd() * 84, y: 6 + rnd() * 88 }));
}

export default function CristalVivant() {
  const root = useRef(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const $ = (s) => R.querySelector(s);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => t * t * (3 - 2 * t);

    const photo = $(".cv-photo"), laser = $(".cv-laser"), ldot = $(".cv-ldot");
    const halo = $(".cv-halo"), sweep = $(".cv-sweep");
    const ledglow = $(".cv-ledglow"), rim = $(".cv-rim");
    const caps = [...R.querySelectorAll(".cv-cap p")];
    const sparks = [...R.querySelectorAll(".cv-spark")].map((e) => ({ e, y: parseFloat(e.dataset.y) }));

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { photo.style.clipPath = "none"; return; }

    const T_GRAVE = 4.6;    // durée de la gravure
    const T_SWEEP = 0.9;    // reflet après gravure
    let raf = 0; const t0 = performance.now();

    const frame = (now) => {
      const t = (now - t0) / 1000;
      // --- gravure automatique (une fois) ---
      const reveal = ease(clamp(t / T_GRAVE, 0, 1));
      photo.style.clipPath = `inset(0 0 ${(1 - reveal) * 100}% 0)`;
      const lv = t < T_GRAVE ? 1 : 0;
      laser.style.opacity = lv * clamp(t / 0.4, 0, 1);
      laser.style.top = reveal * 100 + "%";
      ldot.style.left = 50 + 46 * Math.sin(t * 3.1) + "%";
      halo.style.opacity = 0.25 + 0.55 * reveal;
      sparks.forEach((o) => {
        const d = reveal - o.y;
        o.e.style.opacity = d > 0 ? clamp(1 - d * 4, 0, 1) * 0.95 : 0;
        o.e.style.transform = `scale(${d > 0 ? lerp(1.6, 0.4, clamp(d * 4, 0, 1)) : 0})`;
      });
      // --- reflet : juste après la gravure, puis toutes les ~7 s ---
      let sw = -1;
      if (t > T_GRAVE && t < T_GRAVE + T_SWEEP) sw = (t - T_GRAVE) / T_SWEEP;
      else if (t > T_GRAVE + T_SWEEP) { const c = (t - T_GRAVE - T_SWEEP) % 7; if (c < T_SWEEP) sw = c / T_SWEEP; }
      sweep.style.opacity = sw >= 0 && sw <= 1 ? 1 : 0;
      sweep.style.transform = `translateX(${lerp(-120, 120, clamp(sw, 0, 1))}%)`;
      // --- socle multicolore : s'allume après la gravure et tourne en continu ---
      const led = clamp((t - T_GRAVE + 0.6) / 1.2, 0, 1);
      const hue = (t * 42) % 360;
      ledglow.style.opacity = 0.9 * led;
      ledglow.style.background = `radial-gradient(closest-side,hsl(${hue} 95% 62%),hsl(${(hue + 40) % 360} 90% 50% / .45) 60%,transparent)`;
      rim.style.background = `radial-gradient(120% 120% at 50% 110%,hsl(${hue} 95% 60% / ${0.26 * led}),transparent 55%)`;
      // --- légendes ---
      const slots = [[0.2, 1.7], [1.7, 3.2], [3.2, 4.8]];
      caps.forEach((c, i) => {
        if (i < 3) { const [a, b] = slots[i]; c.style.opacity = t >= a && t < b ? 1 : 0; }
        else c.style.opacity = t >= 4.8 ? 1 : 0; // ligne finale (socle) reste affichée
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sparks = seededSparks(40);
  return (
    <div ref={root}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section id="cv-hero">
        <div className="cv-kicker">Niv Création · Gravure laser 3D</div>
        <h1>Votre photo devient <em>cristal</em></h1>
        <div className="cv-stage">
          <div className="cv-halo" />
          <div className="cv-ledglow" />
          <div className="cv-frame">
            <div className="cv-blank"><div className="cv-ghost" /></div>
            <img className="cv-photo" src={IMG_COUPLE} alt="Cristal photo 3D gravé — couple" />
            {sparks.map((s, i) => (
              <div key={i} className="cv-spark" data-y={s.y / 100} style={{ left: s.x + "%", top: s.y + "%" }} />
            ))}
            <div className="cv-laser"><div className="cv-ldot" /></div>
            <div className="cv-sweep" />
            <div className="cv-rim" />
          </div>
        </div>
        <div className="cv-cap">
          <p>Le laser <b>s&apos;allume</b>.</p>
          <p>Chaque détail se grave, <b>point par point</b>.</p>
          <p>Votre souvenir <b>prend vie</b>.</p>
          <p>Posé sur son <b>socle lumineux multicolore</b>.</p>
        </div>
        <a className="cv-down" href="#cristaux-collection">Choisir mon cristal <span>▾</span></a>
      </section>
    </div>
  );
}
