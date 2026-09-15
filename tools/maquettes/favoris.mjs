// =============================================================================
// MAQUETTE « FAVORIS DANS LE COMPTE CLIENT » — docs/maquettes/favoris-compte.html
//
//   npm run maquette-favoris
//
// Page AUTONOME (photos intégrées en base64) : elle s'ouvre sur un téléphone
// sans connexion. Deux vues à basculer en haut :
//   · 💗 Côté cliente  — la page /favoris quand elle est connectée, l'état
//     déconnecté, et le message de fusion des favoris du navigateur ;
//   · ⚙️ Côté Gestion  — l'écran « Favoris » : ce que les clientes mettent de
//     côté, par produit et par cliente.
//
// ⛔ MAQUETTE : rien de tout ça n'est appliqué au site. Les noms, les prix et
// les photos sont LUS dans src/lib/products.js pour que ça montre le vrai
// catalogue. Les clientes et les compteurs sont des exemples inventés.
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../../src/lib/products.js";
import { roundTo90 } from "../../src/lib/format.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const photo = (url) => {
  const f = join(ROOT, "public", url || "");
  return url && existsSync(f) ? `data:image/jpeg;base64,${readFileSync(f).toString("base64")}` : "";
};
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";
const prix = (p) => {
  const v = p.variants[0];
  if (p.category !== "bijoux") return { paye: v.price, barre: null };
  const barre = roundTo90(v.price * 0.9);
  return { paye: Math.round(barre * 0.9 * 100) / 100, barre };
};
const fiche = (slug) => {
  const p = products.find((x) => x.slug === slug);
  const { paye, barre } = prix(p);
  return { slug, nom: p.name, type: p.type, paye, barre, img: photo((p.images || [])[0]) };
};

// Les 4 favoris de la cliente connectée (exemple) + 4 autres pour l'écran Gestion.
const FAV = ["collier-double-coeur", "bracelet-coeur-a-graver-ot", "collier-medaillon-livre", "cristal-photo-3d-vertical"].map(fiche);
const TOP = [
  { ...fiche("collier-double-coeur"), n: 14, clientes: ["marie.l@…", "sophie.b@…", "+ 12 autres"] },
  { ...fiche("cristal-photo-3d-vertical"), n: 11, clientes: ["aurore.c@…", "nina.b@…", "+ 9 autres"] },
  { ...fiche("bracelet-coeur-a-graver-ot"), n: 9, clientes: ["lea.m@…", "camille.d@…", "+ 7 autres"] },
  { ...fiche("collier-pastille"), n: 6, clientes: ["julie.r@…", "+ 5 autres"] },
  { ...fiche("verre-a-vin-grave"), n: 5, clientes: ["ophelie.t@…", "+ 4 autres"] },
  { ...fiche("bracelet-femme-papillon"), n: 3, clientes: ["maelys.g@…", "+ 2 autres"] },
];

const carte = (p, bouton) => `
  <article class="fav-card">
    <div class="fav-img">${p.img ? `<img src="${p.img}" alt="">` : ""}
      <button class="fav-heart" title="Retirer des favoris">♥</button>
    </div>
    <div class="fav-body">
      <span class="fav-type">${p.type}</span>
      <h3>${p.nom}</h3>
      <div class="fav-prix">${p.barre ? `<s>${eur(p.barre)}</s> ` : ""}<b>${eur(p.paye)}</b></div>
      ${bouton}
    </div>
  </article>`;

const ligneAdmin = (p) => `
  <tr>
    <td class="ad-prod">
      <span class="ad-vign">${p.img ? `<img src="${p.img}" alt="">` : ""}</span>
      <span><b>${p.nom}</b><small>${p.type}</small></span>
    </td>
    <td class="num"><span class="ad-pill">${p.n}</span></td>
    <td class="ad-cli">${p.clientes.join(" · ")}</td>
    <td class="num">${eur(p.paye)}</td>
  </tr>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Maquette — Favoris dans le compte client</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{ --or:#c9a24b; --or-f:#a98935; --or-c:#e2c67e; --creme:#fbf7ee; --creme2:#f3e8d3;
         --encre:#1a1206; --encre2:#241a0c; --gris:#6f675c; --ligne:#ece3d2;
         --rose:#d4506a; --vert:#2f6b45; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--creme); color:var(--encre2); line-height:1.55;
        font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; }
  .bandeau{ background:var(--encre); color:var(--creme2); font-size:.82rem; text-align:center; padding:9px 16px; }
  .bandeau b{ color:var(--or-c); }
  .bascule{ display:flex; gap:8px; justify-content:center; padding:14px 16px; flex-wrap:wrap; }
  .bascule button{ font:inherit; font-size:.92rem; padding:9px 18px; border-radius:999px; cursor:pointer;
                   border:1px solid var(--ligne); background:#fff; color:var(--encre2); }
  .bascule button.on{ background:var(--encre); color:var(--creme2); border-color:var(--encre); font-weight:600; }
  .wrap{ max-width:1080px; margin:0 auto; padding:0 16px 56px; }
  .vue{ display:none; } .vue.on{ display:block; }
  .fil{ font-size:.82rem; color:var(--gris); padding:10px 0; }
  .surtitre{ font-size:.74rem; letter-spacing:.14em; text-transform:uppercase; color:var(--or-f); }
  h1{ font-family:'Playfair Display',Georgia,serif; font-weight:600; font-size:1.7rem; margin:6px 0 6px; }
  h2{ font-family:'Playfair Display',Georgia,serif; font-weight:600; font-size:1.15rem; margin:30px 0 12px; }
  .sub{ color:var(--gris); margin:0 0 18px; }

  .sync{ display:flex; gap:10px; align-items:flex-start; background:#eaf3ec; border:1px solid #cfe3d4;
         border-radius:12px; padding:12px 14px; font-size:.92rem; color:#25563a; margin:0 0 20px; }
  .sync b{ color:#1d4530; }
  .fusion{ background:var(--creme2); border:1px solid var(--or-c); border-radius:12px; padding:14px 16px;
           font-size:.93rem; margin:0 0 20px; }
  .fusion b{ color:var(--or-f); }

  .grille{ display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); }
  .fav-card{ background:#fff; border:1px solid var(--ligne); border-radius:14px; overflow:hidden;
             display:flex; flex-direction:column; min-width:0; }
  .fav-img{ position:relative; aspect-ratio:1/1; background:#f7f3ea; }
  .fav-img img{ width:100%; height:100%; object-fit:cover; display:block; }
  .fav-heart{ position:absolute; bottom:9px; right:9px; width:34px; height:34px; border:0; border-radius:50%;
              background:rgba(255,255,255,.94); color:var(--rose); font-size:1.1rem; cursor:pointer;
              box-shadow:0 1px 5px rgba(0,0,0,.12); }
  .fav-body{ padding:12px 13px 14px; display:flex; flex-direction:column; gap:6px; }
  .fav-type{ font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; color:var(--or-f); }
  .fav-card h3{ font-family:'Playfair Display',Georgia,serif; font-weight:600; font-size:1rem; margin:0; line-height:1.3; }
  .fav-prix{ font-variant-numeric:tabular-nums; }
  .fav-prix s{ color:var(--gris); font-size:.86rem; }
  .fav-prix b{ color:#a2352a; font-size:1.05rem; }
  .btn{ font:inherit; font-size:.88rem; font-weight:600; padding:9px 12px; border-radius:10px; border:0;
        cursor:pointer; margin-top:4px; text-align:center; }
  .btn-or{ background:linear-gradient(180deg,var(--or-c),var(--or)); color:#2a1f0a; }
  .btn-l{ background:#fff; border:1px solid var(--ligne); color:var(--encre2); }

  .vide{ text-align:center; background:#fff; border:1px dashed var(--ligne); border-radius:14px; padding:30px 18px; }
  .vide p{ color:var(--gris); }

  /* --- côté Gestion --- */
  .ash{ background:var(--encre); color:var(--creme2); border-radius:14px; padding:14px 16px; margin:0 0 18px; }
  .ash small{ color:var(--or-c); letter-spacing:.1em; text-transform:uppercase; font-size:.7rem; }
  .ash h1{ color:#fff; font-size:1.35rem; margin:4px 0 0; }
  .kpis{ display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); margin:0 0 20px; }
  .kpi{ background:#fff; border:1px solid var(--ligne); border-left:3px solid var(--or); border-radius:12px; padding:12px 14px; min-width:0; }
  .kpi b{ display:block; font-size:1.5rem; font-variant-numeric:tabular-nums; }
  .kpi span{ font-size:.8rem; color:var(--gris); }
  .tablebox{ overflow-x:auto; background:#fff; border:1px solid var(--ligne); border-radius:14px; min-width:0; }
  table{ border-collapse:collapse; width:100%; min-width:640px; font-size:.92rem; }
  th,td{ text-align:left; padding:11px 13px; border-bottom:1px solid var(--ligne); vertical-align:middle; }
  th{ font-size:.74rem; letter-spacing:.07em; text-transform:uppercase; color:var(--gris); font-weight:600; }
  tr:last-child td{ border-bottom:0; }
  td.num, th.num{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .ad-prod{ display:flex; gap:10px; align-items:center; }
  .ad-vign{ width:42px; height:42px; border-radius:8px; overflow:hidden; background:#f7f3ea; flex:0 0 auto; }
  .ad-vign img{ width:100%; height:100%; object-fit:cover; display:block; }
  .ad-prod small{ display:block; font-size:.76rem; color:var(--gris); }
  .ad-pill{ display:inline-block; background:var(--creme2); border:1px solid var(--or-c); border-radius:999px;
            padding:2px 10px; font-weight:700; }
  .ad-cli{ font-size:.84rem; color:var(--gris); }
  .actions{ display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 0; }
  .note{ background:#fff8e6; border:1px solid #f0d28a; border-radius:12px; padding:13px 15px; font-size:.9rem;
         color:#6b5312; margin:20px 0 0; }
  .note b{ color:#8a6d1f; }
</style></head>
<body>
<div class="bandeau">✦ <b>Maquette</b> — rien n'est en ligne, le site n'a pas été modifié. Favoris enregistrés dans le compte cliente.</div>

<div class="bascule">
  <button id="b1" class="on" onclick="vue(1)">💗 Côté cliente</button>
  <button id="b2" onclick="vue(2)">⚙️ Côté Gestion</button>
</div>

<div class="wrap">

  <!-- ================= CÔTÉ CLIENTE ================= -->
  <section id="v1" class="vue on">
    <div class="fil">Accueil / Mon espace / Mes favoris</div>
    <div class="surtitre">Mon espace</div>
    <h1>Vos coups de cœur ♥</h1>
    <p class="sub">Retrouvez ici les créations que vous avez mises de côté.</p>

    <div class="sync">
      <span style="font-size:1.1rem;line-height:1.2">☁️</span>
      <span><b>Vos favoris sont enregistrés dans votre compte.</b> Vous les retrouverez sur votre
      téléphone comme sur votre ordinateur, même après avoir changé d'appareil.</span>
    </div>

    <div class="grille">
      ${FAV.map((p) => carte(p, `<button class="btn btn-or">Voir la création</button>`)).join("")}
    </div>

    <h2>Si elle n'est pas connectée</h2>
    <p class="sub">Les favoris fonctionnent quand même — ils sont gardés dans son navigateur, comme aujourd'hui.</p>
    <div class="fusion">
      <b>Vos favoris ne sont enregistrés que sur cet appareil.</b><br>
      Connectez-vous et nous les rangeons dans votre compte : vous les retrouverez partout.
      <div class="actions"><button class="btn btn-or">Me connecter</button><button class="btn btn-l">Plus tard</button></div>
    </div>

    <h2>Au moment où elle se connecte</h2>
    <p class="sub">C'est le point important : ses favoris du navigateur remontent dans son compte au lieu d'être perdus.</p>
    <div class="sync">
      <span style="font-size:1.1rem;line-height:1.2">✓</span>
      <span><b>3 favoris ont été ajoutés à votre compte.</b> Ils étaient enregistrés sur cet appareil.</span>
    </div>

    <h2>Et si elle n'a encore rien mis de côté</h2>
    <div class="vide">
      <p>Vous n'avez pas encore de favoris. Touchez le ♡ sur une création pour la garder ici.</p>
      <button class="btn btn-or">Découvrir la boutique</button>
    </div>
  </section>

  <!-- ================= CÔTÉ GESTION ================= -->
  <section id="v2" class="vue">
    <div class="ash"><small>Clients</small><h1>💗 Favoris des clientes</h1></div>

    <div class="kpis">
      <div class="kpi"><b>48</b><span>favoris enregistrés</span></div>
      <div class="kpi"><b>23</b><span>clientes concernées</span></div>
      <div class="kpi"><b>17</b><span>produits mis de côté</span></div>
      <div class="kpi"><b>9</b><span>favoris ajoutés cette semaine</span></div>
    </div>

    <div class="tablebox">
      <table>
        <thead><tr><th>Création</th><th class="num">Favoris</th><th>Clientes</th><th class="num">Prix</th></tr></thead>
        <tbody>${TOP.map(ligneAdmin).join("")}</tbody>
      </table>
    </div>

    <div class="actions">
      <button class="btn btn-l">Exporter (Excel · CSV · PDF)</button>
      <button class="btn btn-l">Voir les favoris d'une cliente</button>
    </div>

    <div class="note">
      <b>À quoi ça vous sert.</b> C'est le même principe que vos alertes « retour en stock » :
      vous voyez ce que les clientes veulent <i>avant</i> qu'elles achètent. Un produit très mis en
      favori mais peu vendu = un prix ou une photo à revoir. Et la liste des clientes par produit,
      c'est une liste de relance toute prête le jour où vous faites une promotion.
      <br><br>
      <b>Rien ne part tout seul</b> : aucun e-mail automatique aux clientes, comme pour les alertes
      de retour en stock. Vous restez maître des envois.
    </div>
  </section>

</div>

<script>
  function vue(n){
    document.getElementById("v1").classList.toggle("on", n===1);
    document.getElementById("v2").classList.toggle("on", n===2);
    document.getElementById("b1").classList.toggle("on", n===1);
    document.getElementById("b2").classList.toggle("on", n===2);
    window.scrollTo(0,0);
  }
</script>
</body></html>`;

const out = join(ROOT, "docs", "maquettes", "favoris-compte.html");
writeFileSync(out, html, "utf8");
console.log(`✓ ${out.replace(ROOT + "/", "")} (${(html.length / 1024 / 1024).toFixed(2)} Mo)`);
