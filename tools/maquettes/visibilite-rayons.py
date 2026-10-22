# -*- coding: utf-8 -*-
# MAQUETTE « Visibilité sur le site » (22/10/2026) — le gérant veut pouvoir masquer d'un geste une catégorie
# entière (Maison & Déco…) ou un rayon (Lampes & veilleuses, Bougeoirs…), pas seulement un produit à la fois.
# Usage : python3 visibilite-rayons.py <dossier css du site> <groupes.json> <sortie.html>
#   · dossier css = les feuilles de nivcreation.fr (curl /_next/static/css/*.css) : vraies classes .ash-* / .ph-*
#   · groupes.json = univers → rayons → produits (nom, photo, prix, en ligne ou non), exporté depuis
#     src/lib/univers.js + src/lib/products.js + le plan du site en ligne.
# Seul le bloc .vz-* est neuf. Rien n'est envoyé nulle part : tout se joue dans la page.
import base64, glob, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "..", "public")
css_dir, groupes_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
CSS = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(css_dir, "*.css"))))
G = json.load(open(groupes_path, encoding="utf-8"))

_cache = {}
def thumb(src, size=150):
    if not src or src in _cache: return _cache.get(src, "")
    path = os.path.join(PUBLIC, src.lstrip("/"))
    if not os.path.exists(path): _cache[src] = ""; return ""
    im = Image.open(path).convert("RGB"); im.thumbnail((size, size))
    b = io.BytesIO(); im.save(b, "WEBP", quality=70)
    _cache[src] = "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()
    return _cache[src]

for u in G:
    u["thumb"] = thumb(u["img"], 260)
    for r in u["rayons"]:
        for p in r["produits"]: p["thumb"] = thumb(p["img"])

PAGE_CSS = r"""
body{margin:0;background:var(--ash-bg,#f4f1ea)}
.vz-banner{background:#1d1811;color:#f3e8d3;font:500 13px/1.45 Inter,system-ui,sans-serif;padding:9px 16px;text-align:center}
.vz-banner b{color:#d6b25a}
.vz-h1{margin:0;font-family:Georgia,serif;font-weight:normal;font-size:1.55rem;color:#1d1811}
.vz-sub{margin:4px 0 0;color:#6b6152;font-size:.92rem;max-width:62ch}
.vz-rule{margin:14px 0 4px;display:flex;gap:10px;align-items:flex-start;background:#fff8e6;border:1px solid #e2c98d;border-radius:12px;padding:10px 14px;font-size:.86rem;color:#5c4a1f}
.vz-rule i{font-style:normal;font-size:1.05rem;line-height:1.2}
.vz-list{display:grid;gap:14px;margin-top:16px}
.vz-u{background:#fff;border:1px solid #e7dfcf;border-radius:16px;overflow:hidden}
.vz-u.off{background:#faf8f3}
.vz-uh{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;cursor:pointer}
.vz-uh img{width:64px;height:64px;border-radius:12px;object-fit:cover;display:block}
.vz-u.off .vz-uh img{filter:grayscale(1);opacity:.55}
.vz-un{font-weight:700;font-size:1.02rem;color:#1d1811;line-height:1.35}
.vz-un .vz-chip{margin-left:4px;vertical-align:2px}
.vz-rn .vz-chip{margin-left:4px;vertical-align:1px}
.vz-um{color:#6b6152;font-size:.82rem;margin-top:2px}
.vz-chev{display:inline-block;margin-right:6px;transition:transform .2s;color:#9a8b6e;font-size:.8rem}
.vz-u.open .vz-chev{transform:rotate(90deg)}
.vz-rays{display:none;border-top:1px solid #efe8da}
.vz-u.open .vz-rays{display:block}
.vz-r{border-top:1px solid #f3eee3}
.vz-r:first-child{border-top:0}
.vz-rh{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px 12px 24px}
.vz-rn{font-weight:600;color:#1d1811;line-height:1.35}
.vz-rm{color:#6b6152;font-size:.8rem;margin-top:2px}
.vz-thumbs{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.vz-thumbs img{width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid #eee5d3}
.vz-thumbs img.gone{filter:grayscale(1);opacity:.4}
.vz-more{background:none;border:0;color:#8a6414;font:600 .8rem Inter,system-ui,sans-serif;padding:6px 0 0;cursor:pointer}
.vz-prods{display:none;padding:0 16px 12px 24px}
.vz-r.show .vz-prods{display:grid;gap:6px}
.vz-p{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;background:#faf7f0;border-radius:10px;padding:6px 10px}
.vz-p img{width:40px;height:40px;border-radius:8px;object-fit:cover}
.vz-p .vz-pn{font-size:.86rem;color:#1d1811;min-width:0;overflow-wrap:anywhere}
.vz-p .pr{font-size:.76rem;color:#6b6152}
.vz-chip{display:inline-block;border-radius:999px;padding:2px 9px;font:600 .72rem Inter,system-ui,sans-serif;white-space:nowrap}
.vz-chip.on{background:#e7f3ea;color:#2f6b3d}
.vz-chip.off{background:#f6e3df;color:#a24336}
.vz-chip.solo{background:#efe9dc;color:#6b6152}
.vz-chip.ray{background:#fbefd5;color:#8a6414}
.vz-sw{display:inline-flex;align-items:center;gap:8px;border:0;background:none;cursor:pointer;font:600 .8rem Inter,system-ui,sans-serif;color:#1d1811;padding:6px 0;min-height:44px}
.vz-sw .t{width:44px;height:26px;border-radius:999px;background:#2f6b3d;position:relative;transition:background .2s;flex:none}
.vz-sw .t::after{content:"";position:absolute;top:3px;left:21px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.vz-sw.off .t{background:#c9bfae}
.vz-sw.off .t::after{left:3px}
.vz-sw .l{min-width:5.5em;text-align:left}
@media (max-width:520px){.vz-uh{grid-template-columns:52px minmax(0,1fr) auto;gap:10px;padding:12px}.vz-uh img{width:52px;height:52px}.vz-sw .l{min-width:0}.vz-rh{padding-left:16px}.vz-prods{padding-left:16px}}
.vz-dis{opacity:.45;pointer-events:none}
.vz-dim{color:#9a8b6e;font-size:.76rem;font-weight:500}
/* fenêtre de confirmation */
.vz-veil{position:fixed;inset:0;background:rgba(29,24,17,.45);display:none;align-items:flex-end;justify-content:center;z-index:60}
.vz-veil.show{display:flex}
.vz-sheet{background:#fff;width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));box-sizing:border-box;max-height:88vh;overflow:auto}
@media (min-width:700px){.vz-veil{align-items:center}.vz-sheet{border-radius:18px}}
.vz-sheet h2{margin:0 0 6px;font-family:Georgia,serif;font-weight:normal;font-size:1.25rem;color:#1d1811}
.vz-sheet p{margin:6px 0;color:#4b4235;font-size:.9rem;line-height:1.5}
.vz-sheet .vz-thumbs img{width:52px;height:52px}
.vz-warn{background:#fff8e6;border:1px solid #e2c98d;border-radius:10px;padding:8px 12px;font-size:.84rem;color:#5c4a1f;margin-top:10px}
.vz-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
.vz-btn{border-radius:999px;padding:11px 18px;font:600 .9rem Inter,system-ui,sans-serif;cursor:pointer;min-height:44px;border:1px solid #d8cdb7;background:#fff;color:#1d1811}
.vz-btn.go{background:linear-gradient(180deg,#d6b25a,#b8923a);border-color:#b8923a;color:#1d1811}
.vz-btn.red{background:#a24336;border-color:#a24336;color:#fff}
.vz-toast{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#2f6b3d;color:#fff;border-radius:999px;padding:10px 18px;font:600 .88rem Inter,system-ui,sans-serif;display:none;z-index:70;max-width:calc(100% - 32px);text-align:center}
.vz-toast.show{display:block}
.vz-sec{margin-top:26px}
.vz-sec h3{margin:0 0 4px;font-family:Georgia,serif;font-weight:normal;font-size:1.15rem;color:#1d1811}
.vz-demo{background:#fff;border:1px solid #e7dfcf;border-radius:14px;padding:4px 0}
.vz-drow{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 14px;border-top:1px solid #f3eee3}
.vz-drow:first-child{border-top:0}
.vz-drow img{width:44px;height:44px;border-radius:8px;object-fit:cover}
.vz-drow .vz-dn{font-size:.88rem;min-width:0;overflow-wrap:anywhere}
.vz-drow .vz-dn small{display:block;color:#6b6152;font-size:.76rem}
.vz-drow.gone img{filter:grayscale(1);opacity:.5}
"""

HTML = r"""<title>Visibilité des rayons</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>__CSS__</style>
<style>__PAGE_CSS__</style>
<main id="vz-app">
<div class="vz-banner"><b>MAQUETTE</b> · rien n'est en ligne · produits et photos réels, état « en ligne » relevé sur le site le 22/10</div>
<div class="ash">
 <aside class="ash-side">
  <div class="ash-brand"><div class="ash-logo">NiV</div><div class="ash-brand-txt"><div class="ash-brand-t">Niv Création</div><div class="ash-brand-s">Espace gestion</div></div></div>
  <nav class="ash-nav">
   <div class="ash-group"><div class="ash-glabel">Commandes</div>
    <a class="ash-item" href="#"><span class="ash-ico">▤</span><span class="ash-txt">File de production</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Catalogue</div>
    <a class="ash-item" href="#"><span class="ash-ico">◧</span><span class="ash-txt">Produits &amp; stock</span></a>
    <a class="ash-item active" href="#"><span class="ash-ico">◎</span><span class="ash-txt">Visibilité sur le site</span></a>
    <a class="ash-item" href="#"><span class="ash-ico">▢</span><span class="ash-txt">Matériel &amp; emballages</span></a></div>
  </nav>
 </aside>
 <div class="ash-main">
  <header class="ash-top">
   <div class="ash-crumb"><span class="ash-crumb-g">Catalogue</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t">Visibilité sur le site</span></div>
   <div class="ash-top-actions"><a class="ash-assist" href="#">✦ Assistant</a></div>
  </header>
  <main class="ash-content">
   <h1 class="vz-h1">Visibilité sur le site</h1>
   <p class="vz-sub">Masquez une catégorie entière ou un seul rayon d'un geste : tous ses produits disparaissent du site. Réaffichez-le et tout revient.</p>
   <div class="ph-kpis">
    <div class="ph-kpi"><small>Catégories en ligne</small><b id="kU"></b></div>
    <div class="ph-kpi"><small>Rayons masqués</small><b id="kR"></b></div>
    <div class="ph-kpi good"><small>Produits en ligne</small><b id="kP"></b></div>
    <div class="ph-kpi"><small>Produits masqués</small><b id="kM"></b></div>
   </div>
   <div class="vz-rule"><i>ⓘ</i><div>Un produit que vous avez masqué <b>seul</b> (dans Produits &amp; stock) reste masqué quand vous réaffichez son rayon. Rien n'est supprimé : tout reste dans Gestion.</div></div>
   <div class="vz-list" id="list"></div>

   <section class="vz-sec">
    <h3>Et dans Produits &amp; stock</h3>
    <p class="vz-sub">Chaque produit dit pourquoi il n'est pas en ligne.</p>
    <div class="vz-demo" id="demo"></div>
   </section>
  </main>
  <nav class="ash-tabs" aria-label="Navigation principale">
   <a class="ash-tab" href="#"><i>⌂</i><span>Accueil</span></a><a class="ash-tab" href="#"><i>▤</i><span>Commandes</span></a><a class="ash-tab" href="#"><i>✉</i><span>Messages</span></a><a class="ash-tab on" href="#"><i>◧</i><span>Produits</span></a><a class="ash-tab" href="#"><i>☰</i><span>Plus</span></a>
  </nav>
 </div>
</div>
<div class="vz-veil" id="veil"><div class="vz-sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
 <h2 id="sh-t"></h2><div id="sh-b"></div>
 <div class="vz-btns"><button class="vz-btn" id="sh-no">Annuler</button><button class="vz-btn" id="sh-ok"></button></div>
</div></div>
<div class="vz-toast" id="toast"></div>
</main>
<script>
const G = __DATA__;
const TODAY = "22/10";
// état : catégories / rayons masqués, produits masqués seuls (ceux qui ne sont pas en ligne aujourd'hui)
const st = { u:{}, r:{}, solo:{} };
for (const u of G) for (const r of u.rayons) for (const p of r.produits) if (!p.visible) st.solo[p.slug] = true;
const rid = (u,i) => u.id + "-" + i;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";
// où se trouve chaque produit (un produit peut être dans plusieurs rayons)
const where = {};
G.forEach((u) => u.rayons.forEach((r, i) => r.produits.forEach((p) => { (where[p.slug] = where[p.slug] || []).push({ u, i, r }); })));
function cause(slug) {
  if (st.solo[slug]) return { k:"solo", t:"masqué seul" };
  for (const w of where[slug]) {
    if (st.u[w.u.id]) return { k:"ray", t:"masqué · catégorie " + w.u.nom };
    if (st.r[rid(w.u, w.i)]) return { k:"ray", t:"masqué · rayon " + w.r.nom };
  }
  return null;
}
const online = (slug) => !cause(slug);
function render() {
  const L = document.getElementById("list"); L.innerHTML = "";
  G.forEach((u) => {
    const uOff = !!st.u[u.id];
    const all = [...new Set(u.rayons.flatMap((r) => r.produits.map((p) => p.slug)))];
    const on = all.filter(online).length;
    const el = document.createElement("div");
    el.className = "vz-u" + (uOff ? " off" : "") + (openU[u.id] ? " open" : "");
    el.innerHTML = `<div class="vz-uh"><img src="${u.thumb}" alt=""><div><div class="vz-un"><span class="vz-chev">▶</span>${esc(u.nom)} ${uOff ? `<span class="vz-chip off">Masquée depuis le ${TODAY}</span>` : ""}</div>
      <div class="vz-um">${on} produit${on>1?"s":""} en ligne sur ${all.length} · ${u.rayons.length} rayon${u.rayons.length>1?"s":""}</div></div>
      ${sw(!uOff, "u", u.id, "Catégorie")}</div><div class="vz-rays"></div>`;
    const R = el.querySelector(".vz-rays");
    u.rayons.forEach((r, i) => {
      const id = rid(u, i), rOff = !!st.r[id];
      const ron = r.produits.filter((p) => online(p.slug)).length;
      const d = document.createElement("div");
      d.className = "vz-r" + (showR[id] ? " show" : "");
      d.innerHTML = `<div class="vz-rh"><div><div class="vz-rn">${esc(r.nom)} ${rOff ? `<span class="vz-chip off">Masqué depuis le ${TODAY}</span>` : ""}</div>
        <div class="vz-rm">${ron} en ligne sur ${r.produits.length}${uOff ? " · <span class='vz-dim'>la catégorie entière est masquée</span>" : ""}</div>
        <div class="vz-thumbs">${r.produits.map((p) => `<img src="${p.thumb}" alt="${esc(p.nom)}" title="${esc(p.nom)}" class="${online(p.slug)?"":"gone"}">`).join("")}</div>
        <button class="vz-more" data-show="${id}">${showR[id] ? "Masquer le détail" : "Voir les produits"}</button></div>
        <div class="${uOff ? "vz-dis" : ""}">${sw(!rOff, "r", id, "Rayon")}</div></div>
        <div class="vz-prods">${r.produits.map((p) => { const c = cause(p.slug); return `<div class="vz-p"><img src="${p.thumb}" alt=""><div class="vz-pn">${esc(p.nom)}<div class="pr">dès ${eur(p.prix)}</div></div>${c ? `<span class="vz-chip ${c.k}">${esc(c.t)}</span>` : `<span class="vz-chip on">en ligne</span>`}</div>`; }).join("")}</div>`;
      R.appendChild(d);
    });
    el.querySelector(".vz-uh").addEventListener("click", (e) => { if (e.target.closest(".vz-sw")) return; openU[u.id] = !openU[u.id]; render(); });
    L.appendChild(el);
  });
  L.querySelectorAll(".vz-sw").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); ask(b.dataset.kind, b.dataset.id); }));
  L.querySelectorAll("[data-show]").forEach((b) => b.addEventListener("click", () => { showR[b.dataset.show] = !showR[b.dataset.show]; render(); }));
  kpis(); demo();
}
const openU = { maison: true }, showR = {};
function sw(on, kind, id, label) {
  return `<button class="vz-sw${on ? "" : " off"}" data-kind="${kind}" data-id="${id}" aria-pressed="${on}" aria-label="${label} ${on ? "visible" : "masqué"}"><span class="t"></span><span class="l">${on ? "Visible" : "Masqué"}</span></button>`;
}
function targetOf(kind, id) {
  if (kind === "u") { const u = G.find((x) => x.id === id); return { nom: "la catégorie « " + u.nom + " »", court: u.nom, prods: [...new Map(u.rayons.flatMap((r) => r.produits).map((p) => [p.slug, p])).values()], u }; }
  const [uid, i] = [id.slice(0, id.lastIndexOf("-")), +id.slice(id.lastIndexOf("-") + 1)];
  const u = G.find((x) => x.id === uid), r = u.rayons[i];
  return { nom: "le rayon « " + r.nom + " »", court: r.nom, prods: r.produits, u, i };
}
let pending = null;
function ask(kind, id) {
  const off = kind === "u" ? !!st.u[id] : !!st.r[id];
  const T = targetOf(kind, id);
  const sh = document.getElementById("sh-b"), ok = document.getElementById("sh-ok");
  if (!off) {
    const leaving = T.prods.filter((p) => online(p.slug));
    const ailleurs = leaving.filter((p) => where[p.slug].some((w) => w.u.id !== T.u.id || (kind === "r" && w.i !== T.i)))
      .map((p) => { const o = where[p.slug].filter((w) => w.u.id !== T.u.id || (kind === "r" && w.i !== T.i)); return `<b>${esc(p.nom)}</b> est aussi dans ${o.map((w) => esc(w.u.nom + " › " + w.r.nom)).join(", ")} : le produit disparaîtra là aussi.`; });
    document.getElementById("sh-t").textContent = "Masquer " + T.nom + " ?";
    sh.innerHTML = `<p>${leaving.length ? `<b>${leaving.length} produit${leaving.length>1?"s":""}</b> disparaîtr${leaving.length>1?"ont":"a"} du site (boutique, accueil, recherche, plan envoyé à Google). Les fiches répondront « page introuvable ».` : "Aucun produit de ce groupe n'est en ligne en ce moment."}</p>
      <div class="vz-thumbs">${leaving.map((p) => `<img src="${p.thumb}" alt="${esc(p.nom)}" title="${esc(p.nom)}">`).join("")}</div>
      ${kind === "u" ? `<div class="vz-warn">L'onglet « ${esc(T.court)} » disparaît aussi du menu du site.</div>` : ""}
      ${ailleurs.length ? `<div class="vz-warn">${ailleurs.join("<br>")}</div>` : ""}
      <p class="vz-dim">Ils restent dans Gestion. Vous les réaffichez quand vous voulez.</p>`;
    ok.textContent = "Masquer"; ok.className = "vz-btn red";
  } else {
    const back = T.prods.filter((p) => !online(p.slug));
    const restent = back.filter((p) => st.solo[p.slug]);
    document.getElementById("sh-t").textContent = "Réafficher " + T.nom + " ?";
    sh.innerHTML = `<p>Les produits de ce groupe reviennent sur le site.</p>
      ${restent.length ? `<div class="vz-warn">Restent masqués, car vous les aviez masqués seuls : ${restent.map((p) => "<b>" + esc(p.nom) + "</b>").join(", ")}.</div>` : ""}`;
    ok.textContent = "Réafficher"; ok.className = "vz-btn go";
  }
  pending = { kind, id, off, T };
  document.getElementById("veil").classList.add("show");
  ok.focus();
}
document.getElementById("sh-no").onclick = () => document.getElementById("veil").classList.remove("show");
document.getElementById("veil").addEventListener("click", (e) => { if (e.target.id === "veil") e.currentTarget.classList.remove("show"); });
document.getElementById("sh-ok").onclick = () => {
  const { kind, id, off, T } = pending;
  const before = T.prods.filter((p) => online(p.slug)).length;
  (kind === "u" ? st.u : st.r)[id] = !off;
  const after = T.prods.filter((p) => online(p.slug)).length;
  document.getElementById("veil").classList.remove("show");
  render();
  toast(off ? `Enregistré ✓ · ${after - before} produit${after-before>1?"s":""} de retour sur le site` : `Enregistré ✓ · ${before - after} produit${before-after>1?"s":""} retiré${before-after>1?"s":""} du site`);
};
function toast(t) { const el = document.getElementById("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2600); }
function kpis() {
  const slugs = Object.keys(where);
  document.getElementById("kU").textContent = G.filter((u) => !st.u[u.id]).length + " / " + G.length;
  document.getElementById("kR").textContent = Object.values(st.r).filter(Boolean).length;
  document.getElementById("kP").textContent = slugs.filter(online).length;
  document.getElementById("kM").textContent = slugs.filter((s) => !online(s)).length;
}
function demo() {
  const m = G.find((u) => u.id === "maison");
  const ps = [...new Map(m.rayons.flatMap((r) => r.produits).map((p) => [p.slug, p])).values()];
  document.getElementById("demo").innerHTML = ps.map((p) => { const c = cause(p.slug); return `<div class="vz-drow${c ? " gone" : ""}"><img src="${p.thumb}" alt=""><div class="vz-dn">${esc(p.nom)}<small>dès ${eur(p.prix)}</small></div>${c ? `<span class="vz-chip ${c.k}">${esc(c.t)}</span>` : `<span class="vz-chip on">en ligne</span>`}</div>`; }).join("");
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.getElementById("veil").classList.remove("show"); });
render();
</script>
"""

html = (HTML.replace("__CSS__", CSS).replace("__PAGE_CSS__", PAGE_CSS)
        .replace("__DATA__", json.dumps(G, ensure_ascii=False)))
open(out, "w", encoding="utf-8").write(html)
print("écrit", out, round(len(html) / 1024), "Ko")
