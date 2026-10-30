#!/usr/bin/env python3
"""Maquette Gestion — AUTRE VERSION de l'écran « Aujourd'hui » (30/10/2026, gérant : « ça fait trop bizarre sur le portable,
garde cette version, montre-moi une autre version, juste la page d'accueil »).
Part de la page v3 générée (docs/maquettes/gestion-moderne.html, NON modifiée) et ajoute un bouton Version A / Version B :
A = l'accueil de la v3 tel quel, B = accueil pensé téléphone d'abord (bandeau fin, chiffres qui glissent, un groupe à la fois,
une seule action par ligne, commandes en cartes). Le reste de la maquette est identique.
Usage : python3 tools/maquettes/gestion-moderne.py && python3 tools/maquettes/gestion-accueil-b.py"""
import pathlib
R = pathlib.Path(__file__).resolve().parents[2]
src = R / "docs/maquettes/gestion-moderne.html"
dst = R / "docs/maquettes/gestion-accueil-b.html"
html = src.read_text(encoding="utf-8")

CSS = r"""
<style>
/* Version B de l'accueil : téléphone d'abord */
.hb{display:flex;flex-direction:column;gap:14px}
.hb-hero{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}
.hb-hero h1{font-family:var(--f-title);font-weight:600;font-size:26px;line-height:1.1;margin:0}
.hb-hero p{margin:3px 0 0;color:var(--muted);font-size:13px}
.hb-hero .grow{flex:1;min-width:200px}
.hb-nums{display:flex;gap:8px;flex-wrap:wrap}
.hb-nums span{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:12.5px;font-weight:600}
.hb-nums span i{font-style:normal;color:var(--gold-ink);font-size:14px}
.hb-nums span.bad{border-color:var(--bad);color:var(--bad)}
.hb-strip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 6px;margin:0 -2px;scrollbar-width:none}
.hb-strip::-webkit-scrollbar{display:none}
.hb-strip .kpi{flex:0 0 176px;scroll-snap-align:start;padding:12px 14px}
.hb-strip .kpi .v{font-size:20px;white-space:nowrap}
.hb-strip .spark{height:28px}
.hb-seg{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:12px 12px 4px}
.hb-seg::-webkit-scrollbar{display:none}
.hb-seg .vchip{flex:none}
.hb-seg .vchip.bad{border-color:var(--bad);color:var(--bad)} .hb-seg .vchip.bad.on{background:var(--bad);color:#fff}
.hb-list{display:flex;flex-direction:column;gap:10px;padding:10px 12px 12px}
.hb-it{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:12px 12px 10px 14px;display:flex;flex-direction:column;gap:8px;box-shadow:inset 3px 0 0 var(--line-2)}
.hb-it.t-bad{box-shadow:inset 3px 0 0 var(--bad)} .hb-it.t-warn{box-shadow:inset 3px 0 0 var(--warn)} .hb-it.t-gold{box-shadow:inset 3px 0 0 var(--gold)} .hb-it.t-info{box-shadow:inset 3px 0 0 var(--info)} .hb-it.auto{box-shadow:inset 3px 0 0 var(--line-2)}
.hb-it .row1{display:flex;gap:10px;align-items:flex-start}
.hb-it .ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--sunk);color:var(--muted)}
.hb-it.t-bad .ic{background:var(--bad-bg);color:var(--bad)} .hb-it.t-warn .ic{background:var(--warn-bg);color:var(--warn)} .hb-it.t-gold .ic{background:var(--gold-bg);color:var(--gold-ink)} .hb-it.t-info .ic{background:var(--info-bg);color:var(--info)}
.hb-it b{display:block;font-weight:600;line-height:1.3}
.hb-it .s{color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:2px}
.hb-it .row2{display:flex;gap:8px;align-items:center;padding-left:42px}
.hb-it .row2 .btn{flex:1;justify-content:center;max-width:260px}
.hb-it .more{width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;flex:none}
.hb-menu{margin-left:42px;display:flex;gap:6px;flex-wrap:wrap}
.hb-menu .btn{height:32px}
.hb-why{margin-left:42px;padding:8px 10px;background:var(--sunk);border-radius:8px;font-size:12.5px;color:var(--muted);line-height:1.5}
.hb-ign{margin-left:42px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12.5px}
.hb-ign select{height:32px;border:1px solid var(--line-2);border-radius:7px;background:var(--surface);padding:0 8px}
.hb-done{padding:26px 16px;text-align:center;color:var(--muted)} .hb-done b{display:block;color:var(--ok);margin-bottom:4px}
.hb-urg{display:flex;gap:10px;align-items:center;padding:9px 12px;border-radius:10px;background:var(--bad-bg);border:1px solid var(--bad);color:var(--bad);font-weight:600;font-size:13px}
.hb-urg .ico{color:var(--bad)} .hb-urg .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hb-urg .btn{height:30px;padding:0 10px}
.hb-cmd{display:flex;flex-direction:column}
.hb-c{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 14px;border-bottom:1px solid var(--line);cursor:pointer}
.hb-c:last-child{border-bottom:0} .hb-c:hover{background:color-mix(in srgb,var(--gold-bg) 45%,transparent)}
.hb-c .th{width:44px;height:44px;border-radius:9px}
.hb-c .l1{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}
.hb-c .l1 .ref{font-size:13px} .hb-c .l1 small{color:var(--muted)}
.hb-c .l2{color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hb-c .l3{display:flex;gap:6px;margin-top:5px;flex-wrap:wrap;align-items:center}
.hb-c .tot{font-weight:600;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.hb-res{border:1px solid var(--gold);background:var(--gold-bg);border-radius:12px;padding:12px 14px;line-height:1.5;font-size:13px}
.hb-res b{color:var(--gold-ink);display:flex;gap:6px;align-items:center;margin-bottom:4px;font-size:13px}
.hb details{border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.hb details summary{padding:12px 14px;font-weight:600;cursor:pointer;list-style:none;display:flex;gap:8px;align-items:center}
.hb details summary::after{content:"▾";margin-left:auto;color:var(--muted)} .hb details[open] summary::after{content:"▴"}
.hb details .todo{padding-top:0}
.hb-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:18px;align-items:start}
.hb-col{display:flex;flex-direction:column;gap:14px;min-width:0}
.hb-vers{display:inline-flex;border:1px solid var(--line-2);border-radius:9px;background:var(--surface);padding:2px;margin-left:auto}
.hb-vers button{border:0;background:none;padding:5px 10px;border-radius:7px;color:var(--muted);font-size:12.5px;font-weight:600}
.hb-vers button.on{background:var(--ink);color:var(--paper)}
@media (min-width:1101px){.hb-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:visible}.hb-strip .kpi{flex:auto}}
@media (max-width:1100px){.hb-grid{grid-template-columns:1fr}}
body.homeB .urg{display:none}
@media (max-width:900px){body.homeB .note{display:none} .hb-hero h1{font-size:23px}}
</style>
"""

JS = r"""
<script>
/* ---------- Version B de l'accueil ---------- */
const vAccueilA = vAccueil;
state.homeB = true; state.hg = "urgent"; state.hmenu = ""; state.hwhy = ""; state.hign = "";
function vAccueilB() {
  const list = ACTIONS.filter((a) => !state.ignored.has(a.id));
  const G = [["urgent", "Urgent", "bad"], ["jour", "Aujourd'hui", ""], ["semaine", "Cette semaine", ""], ["auto", "Surveillance", ""], ["tout", "Tout", ""]];
  const cur = state.hg === "tout" ? list : list.filter((a) => a.g === state.hg);
  const nUrg = list.filter((a) => a.g === "urgent").length;
  const item = (a) => `<div class="hb-it ${a.c}"><div class="row1"><span class="ic">${I(a.ic)}</span><div style="min-width:0;flex:1"><b>${a.b}</b><div class="s">${a.s}</div></div></div>
    <div class="row2"><button class="btn ${a.g === "urgent" ? "pri" : ""}" type="button" ${a.a === "Tournée du jour" ? "data-tournee" : `data-go="${a.go}"`}>${a.a}</button><button class="more" type="button" data-hmenu="${a.id}" aria-label="Plus">${I("more")}</button></div>
    ${state.hmenu === a.id ? `<div class="hb-menu">${btn("Pourquoi c'est là", "sm", `data-hwhy="${a.id}"`)}${btn("Ignorer…", "sm", `data-hign="${a.id}"`)}${btn("Plus tard", "sm ghost", `data-hlater="${a.id}"`)}</div>` : ""}
    ${state.hwhy === a.id ? `<div class="hb-why">${a.why}</div>` : ""}
    ${state.hign === a.id ? `<div class="hb-ign">Motif <select id="ignWhy"><option>déjà fait</option><option>pas utile</option><option>plus tard</option><option>faux signal</option></select>${btn("Ignorer", "sm pri", `data-ign-ok="${a.id}"`)}${btn("Garder", "sm ghost", "data-ign-no")}</div>` : ""}</div>`;
  const cmd = (o) => `<div class="hb-c" data-order="${o.ref}">${img(o.img)}<div style="min-width:0"><div class="l1"><span class="ref">${o.ref}</span><small>${esc(o.nom)} · ${o.age}</small></div><div class="l2">${esc(o.art)} · ${esc(o.det)}</div><div class="l3"><span class="pill ${ST[o.st][0]}">${ST[o.st][1]}</span>${o.exp ? `<span class="pill p-bad">Express</span>` : ""}${limPill(o)}</div></div><div class="tot">${eur(o.total)}</div></div>`;
  const kpi = ([l, v, d, c, p]) => `<div class="card kpi"><span class="l">${l}</span><span class="v num">${v}</span><span class="d ${c}">${c ? "▲ " : ""}${d}</span>${spark(p)}</div>`;
  return `<div class="hb">
    <div class="hb-hero"><div class="grow"><h1>Bonjour</h1><p>${dateFR()}</p></div><div class="hb-nums"><span class="bad"><i>1</i> Express</span><span><i>7</i> à traiter</span><span><i>4</i> à valider</span><span><i>2</i> à racheter</span></div><div class="hb-vers" role="group" aria-label="Version de l'accueil"><button type="button" data-homev="A">Version A</button><button type="button" class="on" data-homev="B">Version B</button></div></div>
    ${state.urgSeen ? "" : `<div class="hb-urg">${I("bolt")}<span class="t">Nouvelle commande 3K7QX2LM · Camille R. · Express · 69,80 €</span>${btn("Ouvrir", "sm pri", 'data-order="3K7QX2LM"')}<button class="ibtn" type="button" data-urgseen aria-label="Vu" style="height:30px;min-width:30px">${I("x")}</button></div>`}
    <div class="hb-strip">${[["Chiffre d'affaires", "1 842,60 €", "+18 % vs sept.", "up", [8, 9, 7, 11, 10, 13, 12, 15, 14, 17]], ["Commandes", "41", "+6 vs sept.", "up", [3, 4, 3, 5, 4, 6, 5, 6, 7, 8]], ["Panier moyen", "44,94 €", "+2,10 €", "up", [40, 42, 41, 43, 42, 44, 43, 45, 44, 45]], ["Fin de mois estimée", "2 310 €", "objectif 2 500 €", "", [5, 6, 5, 7, 6, 8, 7, 9, 8, 10]]].map(kpi).join("")}</div>
    <div class="hb-grid"><div class="hb-col">
      <div class="card"><div class="ch">À faire<span class="grow"></span><span class="sub2">${list.length} points</span></div>
        <div class="hb-seg">${G.map(([g, l, c]) => { const n = g === "tout" ? list.length : list.filter((a) => a.g === g).length; return `<button type="button" class="vchip ${c} ${state.hg === g ? "on" : ""}" data-hg="${g}">${l}<i>${n}</i></button>`; }).join("")}</div>
        <div class="hb-list">${cur.length ? cur.map(item).join("") : `<div class="hb-done"><b>Rien ici</b>${state.hg === "urgent" ? "Aucune urgence. Passez à « Aujourd'hui »." : "Tout est traité dans ce groupe."}</div>`}</div></div>
      <div class="card hb-cmd"><div class="ch">Dernières commandes<span class="grow"></span><button class="lnk" type="button" data-go="commandes:file">Toutes</button></div>${ORDERS.slice(0, 5).map(cmd).join("")}</div>
    </div><div class="hb-col">
      <div class="hb-res"><b>${I("spark")}Résumé du matin · 7 h 30</b>Hier : 2 commandes (52,41 €). Aujourd'hui : 3 à expédier dont 1 Express, 4 réponses à valider, 2 articles à racheter. Mois : 1 842 € sur 2 500 €. <button class="lnk" type="button" data-go="reglages:notifs">Régler</button></div>
      <details><summary>${I("clock")}Activité récente <span class="sub2" style="font-weight:400">· 5</span></summary><ul class="todo">${[["t-ok", "check", "Commande 3K7QX2LM payée", "Verre à whisky · Express · il y a 2 h"], ["t-gold", "mail", "Camille R. a répondu", "dans la commande 3K7QX2LM · 10 h 12"], ["t-ok", "truck", "3D4HS2KW livrée", "Point relais · Mondial Relay"], ["t-info", "users", "Nouvelle inscrite à la lettre", "fenêtre de bienvenue"], ["t-ok", "star", "Avis 5 étoiles reçu", "Collier 3 Cœurs"]].map(([c, ic, b2, s2]) => `<li class="${c}"><span class="ic">${I(ic)}</span><span class="tx"><b>${b2}</b><span>${s2}</span></span></li>`).join("")}</ul></details>
      <details><summary>${I("chart")}Ce mois en détail</summary><div class="tw"><table><tbody>${[["Ventes encaissées", "1 842,60 €"], ["Bénéfice estimé", "968,20 €"], ["Pièces vendues", "58"], ["Nouvelles clientes", "11"]].map(([l, v]) => `<tr><td>${l}</td><td class="r num">${v}</td></tr>`).join("")}</tbody></table></div></details>
    </div></div></div>`;
}
VIEWS.accueil = (s, t) => { document.body.classList.toggle("homeB", state.homeB); return state.homeB ? vAccueilB() : vAccueilA(); };
const _render = render;
render = function () { _render(); if (state.sec !== "accueil") document.body.classList.remove("homeB"); if (state.sec === "accueil" && !state.homeB) { const ph = document.querySelector("#page .ph .acts"); if (ph) ph.insertAdjacentHTML("afterbegin", `<div class="hb-vers" role="group" aria-label="Version de l'accueil" style="margin-left:0"><button type="button" class="on" data-homev="A">Version A</button><button type="button" data-homev="B">Version B</button></div>`); } };
document.addEventListener("click", (e) => {
  const el = (q) => e.target.closest(q); let x;
  if (el(".hb-urg [data-urgseen]")) { state.urgSeen = true; e.stopPropagation(); render(); return; }
  if ((x = el("[data-homev]"))) { state.homeB = x.dataset.homev === "B"; render(); return; }
  if ((x = el("[data-hg]"))) { state.hg = x.dataset.hg; state.hmenu = ""; render(); return; }
  if ((x = el("[data-hmenu]"))) { state.hmenu = state.hmenu === x.dataset.hmenu ? "" : x.dataset.hmenu; state.hwhy = ""; state.hign = ""; render(); return; }
  if ((x = el("[data-hwhy]"))) { state.hwhy = state.hwhy === x.dataset.hwhy ? "" : x.dataset.hwhy; state.hign = ""; render(); return; }
  if ((x = el("[data-hign]"))) { state.hign = x.dataset.hign; state.hwhy = ""; render(); return; }
  if ((x = el("[data-hlater]"))) { const id = x.dataset.hlater; state.ignored.add(id); state.hmenu = ""; render(); toast("Reporté à demain matin", () => { state.ignored.delete(id); render(); }); return; }
}, true);
render();
</script>
"""
assert "</script>" in html and "<script>" in html
out = html.replace("Maquette v3 : les commandes, clientes et chiffres sont des exemples.", "Maquette v3 + autre accueil (version B) : les commandes, clientes et chiffres sont des exemples.")
out = out + CSS + JS
dst.write_text(out, encoding="utf-8")
print(dst, len(out) // 1024, "Ko")
