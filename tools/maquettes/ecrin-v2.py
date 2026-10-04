#!/usr/bin/env python3
"""Maquette « L'Écrin v2 » : reprend les photos de docs/maquettes/theme-ecrin.html (laissée intacte)
et refait le site + l'admin en appliquant Impeccable, UI UX Pro Max, Web Quality (a11y/CWV) et Taste.
Sortie : docs/maquettes/theme-ecrin-v2.html"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
src = (ROOT / "docs/maquettes/theme-ecrin.html").read_text(encoding="utf8")
IMG = re.findall(r'<img src="(data:image/jpeg;base64,[^"]+)"', src)
assert len(IMG) == 9, len(IMG)
hero, u1, u2, u3, u4, c1, c2, c3, c4 = IMG

ICONS = {
 "fr":'<path d="M12 21s-7-5.2-7-11a7 7 0 0114 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 "clock":'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "truck":'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
 "lock":'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
 "star":'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
 "bag":'<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 016 0"/>',
 "menu":'<path d="M4 7h16M4 12h16M4 17h16"/>',
 "arrow":'<path d="M5 12h14M13 6l6 6-6 6"/>',
 "box":'<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
 "pen":'<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
 "doc":'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',
 "users":'<circle cx="9" cy="9" r="3"/><path d="M3 20a6 6 0 0112 0M16 6a3 3 0 010 6M18 20a5 5 0 00-3-4.6"/>',
 "chart":'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 "tag":'<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
 "gear":'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 "palette":'<path d="M12 3a9 9 0 100 18c1.4 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 004-4c0-5-4-9.5-9-9.5z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="11" r="1"/>',
 "mail":'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 "home":'<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
 "dots":'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
 "print":'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
 "spark":'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
}
SPRITE = "".join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k,v in ICONS.items())
def ic(n, cls="ic"): return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{n}"/></svg>'

CSS = r"""
:root{
  /* Marque : or / crème / encre (inchangée). Le texte or passe à un or foncé lisible (AA). */
  --or:#c9a24b; --or-fort:#a98935; --or-clair:#e2c67e;
  --or-texte:#7a5c12;            /* texte or sur crème : 5,8:1 */
  --creme:#fbf7ee; --sable:#f3e8d3; --ligne:#e4d2a4; --papier:#fffdf8;
  --encre:#1a1206; --encre-2:#2b2112; --doux:#5f5546;  /* texte secondaire : 6,6:1 */
  --nuit:#140d05; --nuit-2:#241a0c; --sur-nuit:#d8ceb6;  /* texte sur fond sombre : 11:1 */
  --ok:#2f6b3d; --alerte:#9c3a26; --focus:#1a1206;
  --serif:"Playfair Display",Georgia,"Times New Roman",serif;
  --sans:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  --ombre:0 1px 2px rgba(26,18,6,.06),0 12px 32px -12px rgba(26,18,6,.18);
  --r:6px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--creme);color:var(--encre-2);font:400 1rem/1.65 var(--sans);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;height:auto}
a{color:inherit;text-decoration:none}
:focus-visible{outline:3px solid var(--focus);outline-offset:3px;border-radius:3px}
.sombre :focus-visible,.hero :focus-visible,.bande :focus-visible,footer.site :focus-visible,.adm-side :focus-visible{outline-color:var(--or-clair)}
.ic{width:1.15em;height:1.15em;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:absolute;left:12px;top:-60px;background:var(--encre);color:#fff;padding:10px 16px;border-radius:var(--r);z-index:100}
.skip:focus{top:12px}
.wrap{max-width:1160px;margin:0 auto;padding:0 clamp(18px,4vw,32px)}
h1,h2,h3{font-family:var(--serif);font-weight:600;letter-spacing:-.012em;text-wrap:balance;margin:0;line-height:1.12}
.eyebrow{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--or-texte);font-weight:600}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 26px;border-radius:999px;font:600 .98rem var(--sans);border:1px solid transparent;cursor:pointer;transition:transform .2s,background .2s,border-color .2s}
.btn-or{background:var(--or);color:var(--encre);box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 8px 20px -8px rgba(26,18,6,.45)}
.btn-or:hover{background:var(--or-clair);transform:translateY(-2px)}
.btn-ligne{color:var(--encre);border-color:var(--encre)}
.btn-ligne:hover{background:var(--encre);color:var(--creme)}
.lien{display:inline-flex;align-items:center;gap:8px;min-height:44px;color:var(--sur-nuit);border-bottom:1px solid rgba(216,206,182,.5);font-size:.95rem}
.lien:hover{color:#fff;border-color:var(--or-clair)}

/* Maquette */
.demo-note{background:var(--encre);color:var(--sur-nuit);text-align:center;font-size:.8rem;padding:9px 16px;letter-spacing:.03em}
.demo-note b{color:var(--or-clair);font-weight:600}
.switch{position:sticky;top:0;z-index:70;display:flex;gap:8px;justify-content:center;background:var(--encre);padding:10px 14px;border-top:1px solid rgba(226,198,126,.2)}
.switch button{font:600 .86rem var(--sans);min-height:44px;padding:0 22px;border-radius:999px;border:1px solid rgba(226,198,126,.55);background:transparent;color:var(--sur-nuit);cursor:pointer}
.switch button[aria-pressed=true]{background:var(--or);color:var(--encre);border-color:var(--or)}

/* En-tête */
header.site{position:sticky;top:64px;z-index:50;background:rgba(251,247,238,.94);backdrop-filter:saturate(1.2) blur(10px);border-bottom:1px solid var(--ligne)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:68px}
.logo{font:600 1.2rem var(--serif);letter-spacing:.3em;text-transform:uppercase}
.logo{white-space:nowrap}.logo b{color:var(--or-texte);font-weight:600}
@media(max-width:480px){.logo{font-size:.98rem;letter-spacing:.2em}.nav{gap:8px}.switch button{padding:0 14px}}
.links{display:flex;gap:6px;font-size:.9rem}
.links a{display:flex;align-items:center;min-height:44px;padding:0 12px;position:relative;color:var(--encre-2)}
.links a::after{content:"";position:absolute;left:12px;right:12px;bottom:8px;height:1px;background:var(--or-fort);transform:scaleX(0);transform-origin:left;transition:transform .25s}
.links a:hover::after,.links a[aria-current]::after{transform:scaleX(1)}
.outils{display:flex;align-items:center;gap:4px}
.icbtn{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:0;background:transparent;color:var(--encre);cursor:pointer;position:relative}
.icbtn:hover{background:var(--sable)}
.icbtn .ic{width:22px;height:22px}
.pastille{position:absolute;top:4px;right:2px;min-width:18px;height:18px;border-radius:99px;background:var(--encre);color:#fff;font:700 .66rem var(--sans);display:grid;place-items:center;padding:0 5px}
.burger{display:none}
@media(max-width:860px){.links{display:none}.burger{display:grid}
  .links.ouvert{display:flex;position:absolute;left:0;right:0;top:100%;flex-direction:column;background:var(--creme);border-bottom:1px solid var(--ligne);padding:8px 18px 16px;box-shadow:var(--ombre)}
  .links.ouvert a{min-height:52px;border-bottom:1px solid var(--sable)}}

/* Hero */
.hero.sombre{background:linear-gradient(165deg,var(--nuit-2),var(--nuit) 78%);color:#f5efe2}
.hero-in{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(32px,6vw,72px);align-items:center;padding-block:clamp(48px,8vw,96px)}
.hero .eyebrow{display:inline-flex;align-items:center;gap:10px;color:var(--or-clair);border:1px solid rgba(226,198,126,.45);border-radius:999px;padding:8px 16px}
.hero h1{font-size:clamp(2.4rem,5.6vw,4.1rem);color:#fff;margin:0;line-height:1.06}
.hero h1 em{font-style:normal;font-weight:600;color:var(--or-clair);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.14em;text-decoration-color:rgba(226,198,126,.55)}
.trait{height:2px;width:0;background:var(--or);margin:26px 0 22px;animation:grave 1.4s .4s cubic-bezier(.6,0,.2,1) forwards}
@keyframes grave{to{width:120px}}
.lede{color:var(--sur-nuit);font-size:1.08rem;max-width:46ch;margin:0}
.cta{display:flex;gap:22px;align-items:center;margin-top:32px;flex-wrap:wrap}
.preuves{display:flex;gap:10px 26px;margin:34px 0 0;padding:0;list-style:none;color:var(--sur-nuit);font-size:.86rem;flex-wrap:wrap}
.preuves li{display:flex;align-items:center;gap:8px}
.preuves .ic{color:var(--or-clair)}.preuves li:first-child .ic{fill:currentColor;stroke:none}
.preuves b{color:#fff;font-weight:600}
.cadre{position:relative;border:1px solid rgba(226,198,126,.55);padding:12px;background:rgba(255,255,255,.04);box-shadow:0 18px 32px -14px rgba(0,0,0,.55)}
.cadre::before{content:"";position:absolute;inset:5px;border:1px solid rgba(226,198,126,.25);pointer-events:none}
.cadre img{width:100%;aspect-ratio:4/5;object-fit:cover}
.legende{position:absolute;left:22px;bottom:22px;background:rgba(20,13,5,.86);border:1px solid rgba(226,198,126,.5);color:#f4ecd8;font-size:.82rem;padding:9px 14px}
.legende b{color:var(--or-clair);font-weight:600}
@media(max-width:860px){.hero-in{grid-template-columns:1fr}.cadre{max-width:460px}}

/* Réassurance (remplace le bandeau défilant : lisible, accessible, sans mouvement) */
.reassure{background:var(--papier);border-block:1px solid var(--ligne);padding:6px 0}
.reassure ul{display:grid;grid-template-columns:repeat(4,1fr);margin:0;padding:0;list-style:none}
.reassure li{display:flex;align-items:center;gap:14px;padding:22px clamp(14px,2.4vw,26px);border-left:1px solid var(--ligne)}
.reassure li:first-child{border-left:0}
.reassure .ic{width:26px;height:26px;color:var(--or-texte)}
.reassure strong{display:block;font-size:.92rem;color:var(--encre)}
.reassure span{display:block;font-size:.82rem;color:var(--doux);line-height:1.4}
@media(max-width:860px){.reassure ul{grid-template-columns:1fr 1fr}.reassure li:nth-child(odd){border-left:0}.reassure li{border-top:1px solid var(--ligne)}.reassure li:nth-child(-n+2){border-top:0}}
@media(max-width:480px){.reassure ul{grid-template-columns:1fr}.reassure li{border-left:0;border-top:1px solid var(--ligne)}.reassure li:first-child{border-top:0}}

/* Sections */
.sec{padding:clamp(56px,8vw,100px) 0}
.sec-tete{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:38px;flex-wrap:wrap}
.sec-tete h2{font-size:clamp(1.8rem,3.6vw,2.6rem);margin:10px 0 0;max-width:20ch}
.sec-tete p{color:var(--doux);margin:0;max-width:44ch}
.tout{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-weight:600;font-size:.92rem;color:var(--or-texte);border-bottom:1px solid currentColor}
.uni{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}
.u{position:relative;overflow:hidden;background:var(--sable);display:block;min-height:260px}
.u img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;transition:transform .8s cubic-bezier(.2,.6,.2,1)}
.u:hover img{transform:scale(1.04)}
.u .lab{position:absolute;inset:auto 0 0 0;padding:56px 22px 20px;background:linear-gradient(transparent,rgba(20,13,4,.82));color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}
.u .lab h3{font-size:1.35rem;color:#fff}
.u .lab .ic{width:22px;height:22px;color:var(--or-clair)}
.u1{grid-column:span 7;aspect-ratio:16/10}.u2{grid-column:span 5}.u3{grid-column:span 5;aspect-ratio:16/11}.u4{grid-column:span 7;aspect-ratio:16/11}
@media(max-width:760px){.u1,.u2,.u3,.u4{grid-column:span 12;aspect-ratio:16/10;min-height:0}}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:0;padding:0;list-style:none}
@media(max-width:980px){.grid4{grid-template-columns:repeat(2,1fr)}}
.card{display:block;background:var(--papier);border:1px solid var(--ligne);height:100%;transition:transform .3s,box-shadow .3s}
.card:hover{transform:translateY(-4px);box-shadow:var(--ombre)}
.card .im{position:relative;overflow:hidden;aspect-ratio:1;background:var(--sable)}
.card .im img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.card:hover .im img{transform:scale(1.05)}
.badge{position:absolute;top:12px;left:12px;z-index:2;background:var(--encre);color:#fff;font:600 .75rem var(--sans);letter-spacing:.08em;text-transform:uppercase;padding:6px 10px}
.card .bd{padding:16px 16px 20px}
.card h3{font-size:1.05rem;line-height:1.3}
.note{display:flex;align-items:center;gap:6px;color:var(--or-texte);font-size:.82rem;font-weight:600;margin:8px 0 4px}
.note .ic{width:15px;height:15px;fill:currentColor;stroke:none}
.note small{color:var(--doux);font-weight:400;font-size:.8rem}
.perso{font-size:.8rem;color:var(--doux);margin:0}
.prix{font:600 1.18rem var(--serif);margin-top:8px;color:var(--encre)}
.prix small{font:400 .78rem var(--sans);color:var(--doux)}
.papier{background:var(--papier);border-block:1px solid var(--ligne)}
.etapes{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:0;padding:0;list-style:none;counter-reset:e}
@media(max-width:760px){.etapes{grid-template-columns:1fr}}
.etape{counter-increment:e;background:var(--sable);padding:28px 26px 30px;border-top:3px solid var(--or)}
.etape::before{content:counter(e);display:block;font:600 2.2rem var(--serif);color:var(--or-texte);line-height:1}
.etape h3{font-size:1.15rem;margin:14px 0 8px}
.etape p{color:var(--doux);font-size:.95rem;margin:0}
.avis-liste{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:0;padding:0;list-style:none}
@media(max-width:900px){.avis-liste{grid-template-columns:1fr}}
.avis-liste figure{margin:0;background:var(--papier);border:1px solid var(--ligne);padding:26px;height:100%;display:flex;flex-direction:column;gap:14px}
.etoiles{display:flex;gap:3px;color:var(--or-fort)}
.etoiles .ic{width:18px;height:18px;fill:currentColor;stroke:none}
.avis-liste blockquote{margin:0;font:italic 500 1.12rem/1.55 var(--serif);color:var(--encre)}
.avis-liste figcaption{margin-top:auto;font-size:.86rem;color:var(--doux)}
.avis-liste figcaption b{color:var(--encre)}
.exemple{font-size:.78rem;color:var(--doux);margin:18px 0 0}
.bande.sombre{background:linear-gradient(165deg,var(--nuit-2),var(--nuit) 78%);color:#f0e8d6;text-align:center;padding:clamp(56px,8vw,92px) 22px}
.bande .eyebrow{color:var(--or-clair)}
.bande h2{font-size:clamp(1.9rem,3.8vw,2.7rem);color:#fff;margin:12px auto 0;max-width:20ch}
.bande p{color:var(--sur-nuit);max-width:54ch;margin:16px auto 30px}
footer.site{background:var(--nuit);color:var(--sur-nuit);font-size:.88rem;padding:40px 0 28px}
.pied{display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:28px}
@media(max-width:760px){.pied{grid-template-columns:1fr 1fr}.pied>div:first-child{grid-column:1/-1}}
footer.site .logo{color:#fff}footer.site .logo b{color:var(--or-clair)}
footer.site h3{margin:0 0 10px;font:600 .74rem var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--or-clair)}
footer.site ul{list-style:none;margin:0;padding:0}
footer.site li a{display:inline-flex;min-height:36px;align-items:center;color:var(--sur-nuit)}
footer.site li a:hover{color:#fff}
.copy{margin-top:28px;padding-top:18px;border-top:1px solid rgba(216,206,182,.2);color:#b9ae94;font-size:.8rem}
.rv{opacity:0;transform:translateY(16px)}
.rv.in{opacity:1;transform:none;transition:opacity .6s,transform .6s}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.rv{opacity:1;transform:none}.trait{width:120px}}

/* ---------------- Admin ---------------- */
.adm{display:grid;grid-template-columns:248px 1fr;min-height:90vh;background:#f6efdf}
.adm-side{background:var(--nuit);color:var(--sur-nuit);padding:22px 0 30px}
.adm-brand{padding:0 20px 18px;border-bottom:1px solid rgba(226,198,126,.2);margin-bottom:10px}
.adm-brand .eyebrow{color:var(--or-clair)}
.adm-brand h2{color:#fff;font-size:1.2rem;margin-top:6px}
.adm-glabel{display:block;font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;color:#b3a687;padding:16px 20px 6px}
.adm-item{display:flex;align-items:center;gap:11px;min-height:44px;padding:0 20px;font-size:.9rem;color:var(--sur-nuit);box-shadow:inset 0 0 0 transparent;cursor:pointer}
.adm-item:hover{color:#fff;background:rgba(226,198,126,.08)}
.adm-item[aria-current]{color:var(--or-clair);background:rgba(226,198,126,.14);font-weight:600}
.adm-item .n{margin-left:auto;background:var(--or);color:var(--encre);font:700 .68rem var(--sans);min-width:20px;height:20px;border-radius:99px;display:grid;place-items:center;padding:0 6px}
.adm-main{padding:26px clamp(16px,3vw,36px) 48px;min-width:0}
.adm-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:22px}
.adm-top h1{font-size:1.55rem}
.adm-top p{margin:4px 0 0;color:var(--doux);font-size:.88rem}
.adm-actions{display:flex;gap:10px;flex-wrap:wrap}
.abtn{display:inline-flex;align-items:center;gap:8px;min-height:44px;font:600 .86rem var(--sans);padding:0 18px;border-radius:999px;border:1px solid var(--ligne);background:var(--papier);color:var(--encre);cursor:pointer}
.abtn:hover{border-color:var(--or-fort)}
.abtn.or{background:var(--or);border-color:var(--or);color:var(--encre)}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
@media(max-width:980px){.tiles{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.tile b{display:block}.tile .up,.tile .bad{margin:2px 0 0;display:block}}
.tile{background:var(--papier);border:1px solid var(--ligne);border-top:2px solid var(--or);padding:16px 18px}
.tile small{display:block;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--doux);margin-bottom:6px}
.tile b{font-size:1.55rem;font-variant-numeric:tabular-nums;font-weight:700;color:var(--encre)}
.tile .up{font-size:.78rem;color:var(--ok);font-weight:600;margin-left:8px}
.tile .up,.tile .bad{white-space:nowrap}.tile .bad{font-size:.78rem;color:var(--alerte);font-weight:600;margin-left:8px}
.panel{background:var(--papier);border:1px solid var(--ligne);margin-bottom:20px}
.panel-h{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #efe3c8}
.panel-h .ph{font-size:1.05rem}
.panel-h a{font-size:.84rem;color:var(--or-texte);font-weight:600;min-height:44px;display:inline-flex;align-items:center}
.trow{display:grid;grid-template-columns:86px 1fr auto auto;gap:14px;align-items:center;padding:12px 18px;border-bottom:1px solid #f3e8cf;font-size:.9rem}
.trow:last-child{border-bottom:0}
.trow .id{font-variant-numeric:tabular-nums;color:var(--doux)}
.trow small{color:var(--doux)}
.trow .pr{font-variant-numeric:tabular-nums;font-weight:600}
@media(max-width:640px){.trow{grid-template-columns:56px 1fr auto;gap:8px;font-size:.84rem}.trow .chip{grid-column:2/4;justify-self:start}}
.chip{font-size:.72rem;font-weight:700;padding:5px 11px;border-radius:999px;white-space:nowrap;border:1px solid}
.chip.prep{background:#f7ead0;color:#6e4f0a;border-color:#dcc283}
.chip.grav{background:#efe4f2;color:#5c3b6c;border-color:#cdb4da}
.chip.exp{background:#e3efe4;color:#255a32;border-color:#b3d1b8}
.chip.liv{background:#eceae4;color:#524e43;border-color:#cdc9ba}
.two{display:grid;grid-template-columns:1.15fr .85fr;gap:20px}
@media(max-width:900px){.two{grid-template-columns:1fr}}
.stockrow{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #f3e8cf;font-size:.88rem}
.stockrow:last-child{border-bottom:0}
.bar{flex:1;height:8px;background:#ece0c2;border-radius:99px;overflow:hidden}
.bar i{display:block;height:100%;border-radius:99px;background:var(--or-fort)}
.bar i.bas{background:var(--alerte)}
.sq{font-variant-numeric:tabular-nums;font-weight:700;min-width:64px;text-align:right}
.sq.bas{color:var(--alerte)}
.rupt{background:var(--alerte);color:#fff;font:700 .75rem var(--sans);padding:4px 9px;border-radius:999px}
.todo{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #f3e8cf;font-size:.9rem}
.todo:last-child{border-bottom:0}
.todo .pic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--sable);color:var(--or-texte);flex:none}
.todo b{display:block}
.todo small{color:var(--doux)}
.todo .go{margin-left:auto;color:var(--or-texte)}
.admtabs{display:none}
@media(max-width:900px){
  .adm{grid-template-columns:1fr}
  .adm-side{display:none}
  .admtabs{display:grid;grid-template-columns:repeat(5,1fr);position:sticky;bottom:0;background:var(--nuit);border-top:1px solid rgba(226,198,126,.25);padding-bottom:env(safe-area-inset-bottom);z-index:40}
  .admtabs a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:60px;color:var(--sur-nuit);font:600 .75rem var(--sans);position:relative}
  .admtabs a[aria-current]{color:var(--or-clair)}
  .admtabs .pastille{background:var(--or);color:var(--encre);top:6px;right:calc(50% - 22px)}
  .adm-main{padding-bottom:24px}
}
"""

def li(href, label, extra=""): return f'<li><a href="{href}"{extra}>{label}</a></li>'

BODY = f"""
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>{SPRITE}</defs></svg>
<a class="skip" href="#contenu">Aller au contenu</a>
<div class="demo-note">MAQUETTE — <b>« L'Écrin v2 »</b> : même thème or / crème / encre, refait avec les nouveaux skills · rien n'est sur le site · avis et chiffres d'exemple</div>
<div class="switch" role="group" aria-label="Vue de la maquette"><button id="sw-site" type="button" aria-pressed="true">Le site</button><button id="sw-admin" type="button" aria-pressed="false">L'admin (Gestion)</button></div>

<div id="view-site">
<header class="site"><div class="wrap nav">
  <a class="logo" href="#contenu" aria-label="Niv Création, accueil">N<b>i</b>V CRÉATION</a>
  <nav aria-label="Menu principal"><div class="links" id="menu">
    <a href="#univers">Boutique</a><a href="#nouveautes">Nouveautés</a><a href="#univers">Cristal 3D</a><a href="#univers">Bijoux</a><a href="#univers">Mariage</a><a href="#avis">Avis</a><a href="#sur-mesure">Contact</a>
  </div></nav>
  <div class="outils">
    <button class="icbtn" type="button" aria-label="Mes favoris">{ic('star')}</button>
    <a class="icbtn" href="#panier" aria-label="Panier, 1 article">{ic('bag')}<span class="pastille" aria-hidden="true">1</span></a>
    <button class="icbtn burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Ouvrir le menu">{ic('menu')}</button>
  </div>
</div></header>

<main id="contenu">
<section class="hero sombre" aria-labelledby="h1"><div class="wrap hero-in">
  <div>
    <h1 id="h1">Votre photo, <em>sculptée dans le cristal.</em></h1>
    <div class="trait" aria-hidden="true"></div>
    <p class="lede">Gravé en France, à la commande. Une gravure photo 3D au cœur d'un cristal K9, réalisée au laser dans notre atelier. Un cadeau qui capte la lumière, et l'émotion.</p>
    <div class="cta">
      <a class="btn btn-or" href="#nouveautes">Créer mon cristal {ic('arrow')}</a>
      <a class="lien" href="#nouveautes">Voir les tailles et les prix</a>
    </div>
    <ul class="preuves">
      <li>{ic('star')}<span><b>4,9/5</b> · 312 avis</span></li>
      <li>{ic('fr')}<span><b>Gravé en France</b></span></li>
      <li>{ic('truck')}<span>Point relais dès <b>4,90 €</b></span></li>
    </ul>
  </div>
  <div>
    <div class="cadre">
      <img src="{hero}" width="640" height="800" alt="Bloc de cristal gravé d'une photo en 3D, éclairé de côté" fetchpriority="high" decoding="async">
      <div class="legende">Bloc vertical · <b>dès 39,90 €</b></div>
    </div>
  </div>
</div></section>

<section class="reassure" aria-label="Nos engagements"><div class="wrap"><ul>
  <li>{ic('fr')}<div><strong>Gravé en France</strong><span>Dans notre atelier, pièce par pièce</span></div></li>
  <li>{ic('clock')}<div><strong>Fabrication 3 à 5 jours ouvrés</strong><span>Puis envoi suivi</span></div></li>
  <li>{ic('truck')}<div><strong>Livraison domicile ou relais</strong><span>Offerte dès 45 € sur les bijoux</span></div></li>
  <li>{ic('lock')}<div><strong>Paiement sécurisé</strong><span>En 3 ou 4 fois sans frais</span></div></li>
</ul></div></section>

<section class="sec" id="univers" aria-labelledby="t-univers"><div class="wrap">
  <div class="sec-tete rv"><div><span class="eyebrow">Nos univers</span><h2 id="t-univers">Quatre façons de graver vos souvenirs</h2></div><p>Cristal, bijoux, mariage, décoration : chaque pièce est personnalisée pour vous.</p></div>
  <div class="uni">
    <a class="u u1 rv" href="#"><img src="{u1}" width="720" height="450" alt="" loading="lazy" decoding="async"><div class="lab"><h3>Cristal Photo 3D</h3>{ic('arrow')}</div></a>
    <a class="u u2 rv" href="#"><img src="{u2}" width="520" height="520" alt="" loading="lazy" decoding="async"><div class="lab"><h3>Bijoux gravés</h3>{ic('arrow')}</div></a>
    <a class="u u3 rv" href="#"><img src="{u3}" width="520" height="360" alt="" loading="lazy" decoding="async"><div class="lab"><h3>Mariage et réception</h3>{ic('arrow')}</div></a>
    <a class="u u4 rv" href="#"><img src="{u4}" width="720" height="500" alt="" loading="lazy" decoding="async"><div class="lab"><h3>Déco et maison</h3>{ic('arrow')}</div></a>
  </div>
</div></section>

<section class="sec papier" id="nouveautes" aria-labelledby="t-new"><div class="wrap">
  <div class="sec-tete rv"><div><span class="eyebrow">Vient d'arriver</span><h2 id="t-new">Nos nouveautés</h2></div><a class="tout" href="#">Toute la boutique {ic('arrow')}</a></div>
  <ul class="grid4">
    <li class="rv"><a class="card" href="#"><div class="im"><span class="badge">Nouveau</span><img src="{c1}" width="400" height="400" alt="Porte-clés en cristal LED en forme de cœur" loading="lazy" decoding="async"></div><div class="bd"><h3>Porte-clés Cristal LED Cœur</h3><div class="note">{ic('star')}<span>4,9 <small>· 24 avis</small></span></div><p class="perso">Photo à graver</p><div class="prix">24,90 €</div></div></a></li>
    <li class="rv"><a class="card" href="#"><div class="im"><img src="{c2}" width="400" height="400" alt="Bloc de cristal vertical gravé d'une photo" loading="lazy" decoding="async"></div><div class="bd"><h3>Cristal Photo 3D, vertical</h3><div class="note">{ic('star')}<span>5,0 <small>· 31 avis</small></span></div><p class="perso">Photo à graver</p><div class="prix"><small>dès </small>39,90 €</div></div></a></li>
    <li class="rv"><a class="card" href="#"><div class="im"><img src="{c3}" width="400" height="400" alt="Couverts pour enfant gravés d'un prénom" loading="lazy" decoding="async"></div><div class="bd"><h3>Couverts enfants personnalisés</h3><div class="note">{ic('star')}<span>4,8 <small>· 18 avis</small></span></div><p class="perso">Prénom gravé</p><div class="prix">34,90 €</div></div></a></li>
    <li class="rv"><a class="card" href="#"><div class="im"><img src="{c4}" width="400" height="400" alt="Bracelet en cuir tressé avec plaque gravée" loading="lazy" decoding="async"></div><div class="bd"><h3>Bracelet cuir tressé à graver</h3><div class="note">{ic('star')}<span>4,9 <small>· 27 avis</small></span></div><p class="perso">Texte au recto et au verso</p><div class="prix"><small>dès </small>22,90 €</div></div></a></li>
  </ul>
</div></section>

<section class="sec" aria-labelledby="t-etapes"><div class="wrap">
  <div class="sec-tete rv"><div><span class="eyebrow">Comment ça marche</span><h2 id="t-etapes">De votre idée à l'objet gravé</h2></div></div>
  <ol class="etapes">
    <li class="etape rv"><h3>Choisissez votre pièce</h3><p>Cristal, bijou, bois et sa taille. Le guide vous aide à choisir selon le nombre de personnes.</p></li>
    <li class="etape rv"><h3>Personnalisez en direct</h3><p>Votre photo, votre texte, votre écriture : l'aperçu s'affiche tout de suite sur la pièce.</p></li>
    <li class="etape rv"><h3>Gravé et expédié de France</h3><p>Fabrication dans notre atelier, puis envoi suivi à domicile ou en point relais.</p></li>
  </ol>
</div></section>

<section class="sec papier" id="avis" aria-labelledby="t-avis"><div class="wrap">
  <div class="sec-tete rv"><div><span class="eyebrow">Avis clients</span><h2 id="t-avis">Elles et ils en parlent</h2></div></div>
  <ul class="avis-liste">
    <li class="rv"><figure><div class="etoiles" role="img" aria-label="5 étoiles sur 5">{ic('star')}{ic('star')}{ic('star')}{ic('star')}{ic('star')}</div><blockquote>« On voit chaque détail du visage dans le cristal, c'est encore plus beau que sur les photos. Ma mère en a pleuré. »</blockquote><figcaption><b>Léa</b> · Cristal Photo 3D, vertical</figcaption></figure></li>
    <li class="rv"><figure><div class="etoiles" role="img" aria-label="5 étoiles sur 5">{ic('star')}{ic('star')}{ic('star')}{ic('star')}{ic('star')}</div><blockquote>« Gravure impeccable. Le socle lumineux le soir, c'est magique. »</blockquote><figcaption><b>Karim</b> · Cristal Photo 3D, horizontal</figcaption></figure></li>
    <li class="rv"><figure><div class="etoiles" role="img" aria-label="5 étoiles sur 5">{ic('star')}{ic('star')}{ic('star')}{ic('star')}{ic('star')}</div><blockquote>« Les couverts gravés au prénom de mon fils ont fait sensation au baptême. »</blockquote><figcaption><b>Sophie</b> · Couverts enfants personnalisés</figcaption></figure></li>
  </ul>
  <p class="exemple">Avis d'exemple pour la maquette : sur le site, seuls les vrais avis d'acheteuses vérifiées s'affichent.</p>
</div></section>

<section class="bande sombre" id="sur-mesure" aria-labelledby="t-sm">
  <span class="eyebrow">Sur mesure</span>
  <h2 id="t-sm">Une idée précise ? Créons-la ensemble.</h2>
  <p>Pièce unique, décoration d'événement, cadeau d'entreprise : parlez-nous de votre projet, l'atelier s'occupe du reste.</p>
  <a class="btn btn-or" href="#">Demander un projet sur mesure {ic('arrow')}</a>
</section>
</main>

<footer class="site"><div class="wrap">
  <div class="pied">
    <div><div class="logo">N<b>i</b>V CRÉATION</div><p style="margin:12px 0 0;max-width:34ch">Atelier de personnalisation. Cristal, bijoux, verres et bois gravés à la commande.</p></div>
    <div><h3>Boutique</h3><ul>{li('#','Cristal 3D')}{li('#','Bijoux')}{li('#','Verres et carafes')}{li('#','Carte cadeau')}</ul></div>
    <div><h3>Aide</h3><ul>{li('#','Livraison')}{li('#','Questions fréquentes')}{li('#','Idées et conseils')}{li('#','Contact')}</ul></div>
    <div><h3>Informations</h3><ul>{li('#','Conditions de vente')}{li('#','Mentions légales')}{li('#','Confidentialité')}</ul></div>
  </div>
  <div class="copy">nivcreation.fr · Paiement sécurisé</div>
</div></footer>
</div>

<div id="view-admin" hidden>
<div class="adm">
  <aside class="adm-side" aria-label="Navigation de la gestion">
    <div class="adm-brand"><span class="eyebrow">Espace gestion</span><h2>Mon site</h2></div>
    <span class="adm-glabel">Commandes</span>
    <a class="adm-item" aria-current="page" href="#">{ic('box')} Commandes <span class="n">3</span></a>
    <a class="adm-item" href="#">{ic('pen')} Atelier (à graver) <span class="n">2</span></a>
    <a class="adm-item" href="#">{ic('doc')} Devis et factures</a>
    <span class="adm-glabel">Clients</span>
    <a class="adm-item" href="#">{ic('users')} Clientes</a>
    <a class="adm-item" href="#">{ic('mail')} Messages</a>
    <span class="adm-glabel">Catalogue</span>
    <a class="adm-item" href="#">{ic('bag')} Produits et stock <span class="n">2</span></a>
    <span class="adm-glabel">Finances</span>
    <a class="adm-item" href="#">{ic('chart')} Statistiques</a>
    <span class="adm-glabel">Marketing</span>
    <a class="adm-item" href="#">{ic('star')} Avis <span class="n">2</span></a>
    <a class="adm-item" href="#">{ic('tag')} Promotions</a>
    <span class="adm-glabel">Réglages</span>
    <a class="adm-item" href="#">{ic('palette')} Apparence</a>
    <a class="adm-item" href="#">{ic('truck')} Livraison</a>
  </aside>
  <main class="adm-main">
    <div class="adm-top">
      <div><h1>Bonjour</h1><p>Lundi 6 juillet · voici ce qui se passe sur votre boutique.</p></div>
      <div class="adm-actions"><button class="abtn or" type="button">{ic('bag')} Ajouter un produit</button><button class="abtn" type="button">{ic('tag')} Remise rapide</button><button class="abtn" type="button">{ic('doc')} Exporter</button></div>
    </div>
    <div class="tiles">
      <div class="tile"><small>À préparer</small><b>3</b><span class="bad">dont 1 avec socle</span></div>
      <div class="tile"><small>Chiffre d'affaires, juillet</small><b>486,50 €</b><span class="up">+18 %</span></div>
      <div class="tile"><small>Visiteurs, 7 jours</small><b>1 240</b><span class="up">+9 %</span></div>
      <div class="tile"><small>Note boutique</small><b>4,9/5</b><span class="up">312 avis</span></div>
    </div>
    <div class="two">
      <div>
        <section class="panel" aria-labelledby="p1"><div class="panel-h"><h2 id="p1" class="ph">Dernières commandes</h2><a href="#">Tout voir</a></div>
          <div class="trow"><span class="id">#1067</span><span>Cristal V, Moyen + socle LED<br><small>Julie M. · point relais</small></span><span class="pr">79,80 €</span><span class="chip prep">À préparer</span></div>
          <div class="trow"><span class="id">#1066</span><span>Bloc XL, horizontal<br><small>Thomas R. · domicile</small></span><span class="pr">149,90 €</span><span class="chip grav">À graver</span></div>
          <div class="trow"><span class="id">#1065</span><span>Porte-clés Cristal Cœur<br><small>Nadia B. · point relais</small></span><span class="pr">24,90 €</span><span class="chip exp">Expédiée</span></div>
          <div class="trow"><span class="id">#1064</span><span>Bougeoir Fleur de Lotus<br><small>Marc D. · domicile</small></span><span class="pr">16,90 €</span><span class="chip liv">Livrée</span></div>
        </section>
        <section class="panel" aria-labelledby="p2"><div class="panel-h"><h2 id="p2" class="ph">Stock, blocs cristal</h2><a href="#">Gérer</a></div>
          <div class="stockrow"><span style="min-width:60px">Petit</span><div class="bar"><i class="bas" style="width:10%"></i></div><span class="sq bas">3 restants</span></div>
          <div class="stockrow"><span style="min-width:60px">Moyen</span><div class="bar"><i style="width:86%"></i></div><span class="sq">43 restants</span></div>
          <div class="stockrow"><span style="min-width:60px">Grand</span><div class="bar"><i style="width:70%"></i></div><span class="sq">7 restants</span></div>
          <div class="stockrow"><span style="min-width:60px">XL</span><div class="bar"><i style="width:0"></i></div><span class="rupt">RUPTURE</span></div>
        </section>
      </div>
      <div>
        <section class="panel" aria-labelledby="p3"><div class="panel-h"><h2 id="p3" class="ph">À faire aujourd'hui</h2></div>
          <a class="todo" href="#"><span class="pic">{ic('pen')}</span><span><b>2 gravures à lancer</b><small>Cristal V Moyen · Bloc XL</small></span><span class="go">{ic('arrow')}</span></a>
          <a class="todo" href="#"><span class="pic">{ic('star')}</span><span><b>2 avis à valider</b><small>Porte-clés cœur · Bracelet cuir</small></span><span class="go">{ic('arrow')}</span></a>
          <a class="todo" href="#"><span class="pic">{ic('box')}</span><span><b>Réapprovisionner le Petit</b><small>3 restants, seuil à 5</small></span><span class="go">{ic('arrow')}</span></a>
          <a class="todo" href="#"><span class="pic">{ic('print')}</span><span><b>1 étiquette à imprimer</b><small>#1067 · point relais</small></span><span class="go">{ic('arrow')}</span></a>
        </section>
        <section class="panel" aria-labelledby="p4"><div class="panel-h"><h2 id="p4" class="ph">Assistant</h2></div>
          <div style="padding:16px 18px;font-size:.92rem;color:var(--doux)">Le stock du <b style="color:var(--encre)">bloc Petit</b> est presque épuisé et le <b style="color:var(--encre)">XL est en rupture</b> : la vignette affiche le badge toute seule. Voulez-vous que je prépare un message au fournisseur ?<br><br><button class="abtn or" type="button">{ic('spark')} Oui, prépare-le</button></div>
        </section>
      </div>
    </div>
  </main>
</div>
<nav class="admtabs" aria-label="Navigation de la gestion (téléphone)">
  <a href="#" aria-current="page">{ic('home')}Accueil</a>
  <a href="#">{ic('box')}Commandes<span class="pastille">3</span></a>
  <a href="#">{ic('mail')}Messages<span class="pastille">2</span></a>
  <a href="#">{ic('bag')}Produits</a>
  <a href="#">{ic('dots')}Plus</a>
</nav>
</div>

<script>
(function(){{
  var io=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting){{e.target.classList.add('in');io.unobserve(e.target);}}}});}},{{threshold:.1}});
  document.querySelectorAll('.rv').forEach(function(el){{io.observe(el);}});
  var b=document.getElementById('burger'),m=document.getElementById('menu');
  b.addEventListener('click',function(){{var o=m.classList.toggle('ouvert');b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Fermer le menu':'Ouvrir le menu');}});
  var bs=document.getElementById('sw-site'),ba=document.getElementById('sw-admin'),vs=document.getElementById('view-site'),va=document.getElementById('view-admin');
  function go(admin){{vs.hidden=admin;va.hidden=!admin;bs.setAttribute('aria-pressed',!admin);ba.setAttribute('aria-pressed',admin);window.scrollTo(0,0);}}
  bs.addEventListener('click',function(){{go(false)}});ba.addEventListener('click',function(){{go(true)}});
}})();
</script>
"""

HTML = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Niv Création — Écrin v2</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = ROOT / "docs/maquettes/theme-ecrin-v2.html"
out.write_text(HTML, encoding="utf8")
print(out, len(HTML))
