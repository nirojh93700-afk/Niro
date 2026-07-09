"use client";
// Expérience « le cristal prend vie » en haut de /cristaux — reproduction fidèle
// de la maquette validée docs/maquettes/cristal-vivant.html (gravure laser au
// défilement, socle multicolore, parallax des formats). Tout est piloté par le
// scroll (rAF + getBoundingClientRect), respecte prefers-reduced-motion.
import { useEffect, useRef } from "react";

const IMG_COUPLE = "/produits/cristal-v-couple.jpg";
const IMG_HORIZ = "/produits/cristal-h-demo-couple.jpg";
const IMG_PCLES = "/produits/porte-cles-coeur-demo.jpg";

const CSS = `
.cv-scene{position:relative}
.cv-sticky{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center}
#cv-s1{height:420vh;background:linear-gradient(180deg,#fffdf9,#faf6ef 40%,#f3ece0)}
#cv-s1 .cv-kicker{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a98935;margin-bottom:10px}
#cv-s1 h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(26px,7vw,44px);color:#2b2620;text-align:center;line-height:1.15;padding:0 24px;margin:0}
#cv-s1 h1 em{font-style:normal;color:#a98935}
#cv-s1 .cv-head{position:absolute;top:max(9vh,124px);left:0;right:0;display:flex;flex-direction:column;align-items:center;z-index:6}
.cv-stage{position:relative;width:min(86vw,520px)}
.cv-frame{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 30px 60px rgba(43,38,32,.28),0 0 0 1px rgba(194,161,78,.35);aspect-ratio:760/481;background:#f3ece0}
.cv-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.cv-photo{clip-path:inset(0 0 100% 0)}
.cv-blank{display:flex;align-items:center;justify-content:center;position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 20%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.cv-blank .cv-ghost{width:38%;aspect-ratio:2/3;border-radius:8px;border:1.5px solid rgba(194,161,78,.55);background:linear-gradient(115deg,rgba(255,255,255,.85),rgba(240,232,214,.35) 45%,rgba(255,255,255,.7));box-shadow:inset 0 0 22px rgba(194,161,78,.18)}
.cv-laser{position:absolute;left:-4%;width:108%;height:3px;z-index:4;border-radius:3px;background:linear-gradient(90deg,transparent,#fff 18%,#e2c67e 50%,#fff 82%,transparent);box-shadow:0 0 14px 3px rgba(226,198,126,.95),0 0 40px 10px rgba(226,198,126,.5);opacity:0}
.cv-laser .cv-ldot{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 30%,#e2c67e 60%,transparent 70%);box-shadow:0 0 22px 8px rgba(255,246,220,.95)}
.cv-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(255,250,230,.9);opacity:0;z-index:3}
.cv-halo{position:absolute;inset:-30%;z-index:-1;pointer-events:none;background:radial-gradient(circle at 50% 55%,rgba(226,198,126,.55),rgba(226,198,126,0) 60%);opacity:0}
.cv-sweep{position:absolute;inset:0;z-index:5;pointer-events:none;opacity:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.5) 46%,rgba(255,255,255,.75) 50%,rgba(255,255,255,.5) 54%,transparent 70%);transform:translateX(-120%)}
.cv-caps{position:absolute;bottom:7vh;left:0;right:0;height:64px;z-index:6}
.cv-caps p{position:absolute;left:0;right:0;text-align:center;font-size:clamp(16px,4.6vw,22px);color:#2b2620;opacity:0;padding:0 30px;margin:0}
.cv-caps p b{color:#a98935}
.cv-dust{position:absolute;border-radius:50%;background:#e2c67e;opacity:.5;pointer-events:none;z-index:2}
#cv-s2{height:320vh;background:radial-gradient(140% 100% at 50% 0%,#3a3126,#2b2620 55%,#17120c)}
#cv-s2 h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(22px,6vw,36px);color:#e2c67e;text-align:center;padding:0 24px;margin:0 0 4vh}
#cv-s2 .cv-stage2{position:relative;width:min(74vw,420px)}
#cv-s2 .cv-frame2{position:relative;border-radius:12px;overflow:hidden;aspect-ratio:760/481;box-shadow:0 24px 70px rgba(0,0,0,.6)}
#cv-s2 .cv-frame2 img{width:100%;height:100%;object-fit:cover;display:block}
#cv-s2 .cv-ledglow{position:absolute;left:8%;right:8%;bottom:-14%;height:34%;border-radius:50%;filter:blur(22px);opacity:.9;z-index:-1}
#cv-s2 .cv-rim{position:absolute;inset:0;border-radius:12px;mix-blend-mode:screen;pointer-events:none}
#cv-s2 .cv-txt{margin-top:5vh;color:#e9e2d2;text-align:center;font-size:clamp(15px,4.2vw,19px);max-width:520px;padding:0 30px;line-height:1.55}
#cv-s2 .cv-txt b{color:#e2c67e}
.cv-orb{position:absolute;border-radius:50%;filter:blur(1px);opacity:0;pointer-events:none}
#cv-s3{height:240vh;background:linear-gradient(180deg,#f3ece0,#faf6ef)}
#cv-s3 h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(22px,6vw,34px);color:#2b2620;text-align:center;padding:0 22px;margin:0 0 6vh}
#cv-s3 h2 em{font-style:normal;color:#a98935}
.cv-cards{position:relative;width:min(92vw,560px);height:56vh}
.cv-card{position:absolute;border-radius:12px;overflow:hidden;box-shadow:0 18px 44px rgba(43,38,32,.25),0 0 0 1px rgba(194,161,78,.3);background:#fff}
.cv-card img{width:100%;height:100%;object-fit:cover;display:block}
.cv-card .cv-tag{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(23,15,6,.78));color:#fff;font-size:13px;padding:26px 12px 10px;text-align:center}
.cv-card .cv-tag b{color:#e2c67e}
#cv-c1{left:0;top:6%;width:62%;aspect-ratio:760/520}
#cv-c2{right:0;top:34%;width:46%;aspect-ratio:600/620}
#cv-cta{min-height:92vh;background:#2b2620;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 26px;position:relative;overflow:hidden}
#cv-cta:before{content:"";position:absolute;left:50%;top:-30%;width:130vw;height:80%;transform:translateX(-50%);background:radial-gradient(50% 60% at 50% 40%,rgba(226,198,126,.22),transparent 70%)}
#cv-cta .cv-k{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e2c67e;margin-bottom:14px}
#cv-cta h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(26px,7vw,42px);color:#fffdf9;max-width:600px;line-height:1.2;margin:0}
#cv-cta h2 em{font-style:normal;color:#e2c67e}
#cv-cta p{color:#cfc6b2;margin:18px 0 30px;max-width:480px;font-size:15px;line-height:1.6}
#cv-cta a{display:inline-block;background:linear-gradient(135deg,#c2a14e,#a98935);color:#fff;text-decoration:none;padding:15px 34px;border-radius:40px;font-weight:700;font-size:16px;letter-spacing:.4px;box-shadow:0 12px 30px rgba(194,161,78,.4);position:relative}
#cv-cta .cv-note{margin-top:16px;font-size:12px;color:#8f8674}
@media (prefers-reduced-motion:reduce){
 .cv-photo{clip-path:none!important}.cv-caps p{opacity:1!important;position:static}.cv-sweep,.cv-laser{display:none}
}
`;

export default function CristalVivant() {
  const root = useRef(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const $ = (sel) => R.querySelector(sel);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const vh = () => window.innerHeight;

    const s1 = $("#cv-s1"), s2 = $("#cv-s2"), s3 = $("#cv-s3");
    const photo = $(".cv-photo"), laser = $(".cv-laser"), ldot = $(".cv-ldot");
    const halo = $(".cv-halo"), sweep = $(".cv-sweep"), head = $(".cv-head");
    const caps = [...R.querySelectorAll(".cv-caps p")];
    const ledglow = $(".cv-ledglow"), rim = $(".cv-rim");
    const c1 = $("#cv-c1"), c2 = $("#cv-c2");

    // particules (créées après montage pour éviter tout mismatch SSR)
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const S = [];
    const sp = $("#cv-sparks");
    for (let i = 0; i < 42; i++) {
      const e = document.createElement("div"); e.className = "cv-spark";
      const x = 8 + rnd() * 84, y = 6 + rnd() * 88;
      e.style.left = x + "%"; e.style.top = y + "%";
      sp.appendChild(e); S.push({ e, y: y / 100 });
    }
    const dusts = []; const dc = $("#cv-dusts");
    for (let i = 0; i < 16; i++) {
      const e = document.createElement("div"); e.className = "cv-dust";
      const sz = 2 + rnd() * 4; e.style.width = sz + "px"; e.style.height = sz + "px";
      e.style.left = (4 + rnd() * 92) + "%"; dc.appendChild(e);
      dusts.push({ e, y0: rnd() * 100, sp: 0.35 + rnd() * 0.75, o: 0.25 + rnd() * 0.4 });
    }
    const orbs = []; const oc = $("#cv-orbs");
    for (let i = 0; i < 12; i++) {
      const e = document.createElement("div"); e.className = "cv-orb";
      const sz = 5 + rnd() * 9; e.style.width = sz + "px"; e.style.height = sz + "px";
      e.style.left = (6 + rnd() * 88) + "%"; oc.appendChild(e);
      orbs.push({ e, y0: 20 + rnd() * 80, sp: 0.5 + rnd() * 0.9, h: rnd() * 360 });
    }

    const prog = (sec) => { const r = sec.getBoundingClientRect(); return clamp(-r.top / (r.height - vh()), 0, 1); };

    let raf = 0;
    const render = (p, q, r) => {
      const reveal = clamp((p - 0.12) / 0.62, 0, 1);
      photo.style.clipPath = `inset(0 0 ${(1 - reveal) * 100}% 0)`;
      const lvis = p > 0.06 && p < 0.8 ? 1 : 0;
      laser.style.opacity = lvis * clamp((p - 0.06) / 0.06, 0, 1) * clamp((0.8 - p) / 0.06, 0, 1);
      laser.style.top = reveal * 100 + "%";
      ldot.style.left = 50 + 46 * Math.sin(p * 22) + "%";
      halo.style.opacity = 0.25 + 0.75 * reveal;
      head.style.opacity = clamp(1 - (p - 0.55) / 0.2, 0, 1);
      S.forEach((o) => {
        const d = reveal - o.y;
        o.e.style.opacity = d > 0 ? clamp(1 - d * 4, 0, 1) * 0.95 : 0;
        o.e.style.transform = `scale(${d > 0 ? lerp(1.6, 0.4, clamp(d * 4, 0, 1)) : 0})`;
      });
      const sw = clamp((p - 0.78) / 0.16, 0, 1);
      sweep.style.opacity = sw > 0 && sw < 1 ? 1 : 0;
      sweep.style.transform = `translateX(${lerp(-120, 120, sw)}%)`;
      const slots = [[0.10, 0.34], [0.38, 0.62], [0.66, 0.92]];
      caps.forEach((c, i) => {
        const [a, b] = slots[i];
        const o = clamp((p - a) / 0.05, 0, 1) * clamp((b - p) / 0.05, 0, 1);
        c.style.opacity = clamp(o, 0, 1);
        c.style.transform = `translateY(${(1 - clamp(o, 0, 1)) * 14}px)`;
      });
      dusts.forEach((d) => {
        const y = (d.y0 - p * 120 * d.sp) % 110;
        d.e.style.top = (y < 0 ? y + 110 : y) + "%";
        d.e.style.opacity = d.o * (p > 0.02 ? 1 : 0);
      });
      const hue = (q * 520) % 360;
      ledglow.style.background = `radial-gradient(closest-side,hsl(${hue} 95% 62%),hsl(${(hue + 40) % 360} 90% 50% / .45) 60%,transparent)`;
      rim.style.background = `radial-gradient(120% 120% at 50% 110%,hsl(${hue} 95% 60% / .34),transparent 55%)`;
      orbs.forEach((o) => {
        const y = (o.y0 - q * 160 * o.sp) % 120;
        o.e.style.top = (y < 0 ? y + 120 : y) + "%";
        o.e.style.opacity = q > 0.03 ? 0.5 : 0;
        o.e.style.background = `hsl(${(o.h + hue) % 360} 95% 65%)`;
        o.e.style.boxShadow = `0 0 10px 2px hsl(${(o.h + hue) % 360} 95% 65% / .8)`;
      });
      c1.style.transform = `translateY(${lerp(60, -40, r)}px)`;
      c2.style.transform = `translateY(${lerp(120, -90, r)}px)`;
    };
    const frame = () => { render(prog(s1), prog(s2), prog(s3)); raf = requestAnimationFrame(frame); };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // mode TEST (vérification du rendu) : ?cvt=<scène>&cvp=<progression>
    const T = window.location.search.match(/cvt=(\d+)&cvp=([\d.]+)/);
    if (T) {
      const scn = +T[1], pv = +T[2];
      [["cv-s1", 1], ["cv-s2", 2], ["cv-s3", 3]].forEach(([id, n]) => { if (n < scn) $("#" + id).style.display = "none"; });
      if (scn === 4) { s1.style.display = s2.style.display = s3.style.display = "none"; }
      const f2 = () => render(scn === 1 ? pv : (scn > 1 ? 1 : 0), scn === 2 ? pv : 0, scn === 3 ? pv : 0);
      window.addEventListener("load", f2); setTimeout(f2, 300);
    } else if (mq.matches) {
      photo.style.clipPath = "none";
      caps.forEach((c) => { c.style.opacity = 1; });
    } else {
      raf = requestAnimationFrame(frame);
    }
    return () => { cancelAnimationFrame(raf); [sp, dc, oc].forEach((n) => { if (n) n.innerHTML = ""; }); };
  }, []);

  return (
    <div ref={root}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section id="cv-s1" className="cv-scene"><div className="cv-sticky">
        <div className="cv-head">
          <div className="cv-kicker">Niv Création · Gravure laser 3D</div>
          <h1>Votre photo devient <em>cristal</em></h1>
        </div>
        <div className="cv-stage">
          <div className="cv-halo" />
          <div className="cv-frame">
            <div className="cv-blank"><div className="cv-ghost" /></div>
            <img className="cv-photo" src={IMG_COUPLE} alt="Cristal photo 3D gravé — couple" />
            <div className="cv-laser"><div className="cv-ldot" /></div>
            <div className="cv-sweep" />
            <div id="cv-sparks" />
          </div>
        </div>
        <div className="cv-caps">
          <p>Le laser <b>s&apos;allume</b>.</p>
          <p>Chaque détail se grave, <b>point par point</b>.</p>
          <p>Votre souvenir <b>prend vie</b>.</p>
        </div>
        <div id="cv-dusts" />
      </div></section>

      <section id="cv-s2" className="cv-scene"><div className="cv-sticky">
        <h2>Le socle lumineux <br />multicolore</h2>
        <div className="cv-stage2">
          <div className="cv-ledglow" />
          <div className="cv-frame2"><img src={IMG_COUPLE} alt="Cristal sur socle LED" /><div className="cv-rim" /></div>
        </div>
        <p className="cv-txt">La lumière <b>traverse le cristal</b> et révèle chaque détail de la gravure — surtout le soir.</p>
        <div id="cv-orbs" />
      </div></section>

      <section id="cv-s3" className="cv-scene"><div className="cv-sticky">
        <h2>Deux formats. <em>Tous vos souvenirs.</em></h2>
        <div className="cv-cards">
          <div className="cv-card" id="cv-c1"><img src={IMG_HORIZ} alt="Bloc cristal horizontal" /><div className="cv-tag"><b>Bloc horizontal</b> · famille &amp; couples</div></div>
          <div className="cv-card" id="cv-c2"><img src={IMG_PCLES} alt="Porte-clés cristal LED" /><div className="cv-tag"><b>Porte-clés LED</b> · à emporter partout</div></div>
        </div>
      </div></section>

      <section id="cv-cta">
        <div className="cv-k">Fait main · en France</div>
        <h2>Gravez ce que vous <em>voulez</em> dans le cristal</h2>
        <p>Envoyez votre plus belle photo, choisissez le format et la taille — nous gravons le reste, point par point, au cœur du verre.</p>
        <a href="#cristaux-collection">Créer le mien</a>
        <div className="cv-note">à partir de 39,90 €</div>
      </section>
    </div>
  );
}
