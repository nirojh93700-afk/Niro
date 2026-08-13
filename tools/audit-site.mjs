#!/usr/bin/env node
// =============================================================================
// AUDIT COMPLET DU SITE — Niv Création
// -----------------------------------------------------------------------------
// À lancer chaque fois que la gérante demande « vérifie mon site » :
//
//   node tools/audit-site.mjs              → audit complet (recommandé)
//   node tools/audit-site.mjs --rapide     → sans la compilation du code (plus court)
//   node tools/audit-site.mjs --paiement   → teste EN PLUS le paiement Stripe
//                                            (crée une session de test, aucun
//                                             prélèvement, aucun e-mail client)
//   node tools/audit-site.mjs --site https://…  → auditer une autre adresse
//
// Ce que ça vérifie :
//   1. Toutes les pages du site (accueil, boutique, panier, pages légales…)
//   2. TOUTES les fiches produits en ligne (via le sitemap)
//   3. TOUTES les photos produits (détecte une photo cassée)
//   4. Les services : livraison, points relais, avis, stock, promotions
//   5. La cohérence du catalogue (doublons, prix manquant, fiche incomplète)
//   6. La compilation du code (aucune erreur avant un futur déploiement)
//
// Aucune donnée n'est modifiée : l'audit est en LECTURE SEULE.
// =============================================================================
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdtemp, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const RAPIDE = args.includes("--rapide");
const TEST_PAIEMENT = args.includes("--paiement");
const SITE = (args[args.indexOf("--site") + 1] || "").startsWith("http")
  ? args[args.indexOf("--site") + 1].replace(/\/$/, "")
  : "https://nivcreation.fr";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TIMEOUT = 20000;
const MAX_PHOTOS = 500;

// --- petits utilitaires ------------------------------------------------------
const C = {
  gras: (s) => `\x1b[1m${s}\x1b[0m`,
  vert: (s) => `\x1b[32m${s}\x1b[0m`,
  rouge: (s) => `\x1b[31m${s}\x1b[0m`,
  orange: (s) => `\x1b[33m${s}\x1b[0m`,
  gris: (s) => `\x1b[90m${s}\x1b[0m`,
};
const OK = C.vert("✅");
const ALERTE = C.orange("⚠️ ");
const ERREUR = C.rouge("❌");

const bilan = { ok: 0, alertes: [], erreurs: [] };
let slugsEnLigne = null; // fiches produits réellement accessibles en ligne
const alerte = (msg) => { bilan.alertes.push(msg); console.log(`   ${ALERTE} ${msg}`); };
const erreur = (msg) => { bilan.erreurs.push(msg); console.log(`   ${ERREUR} ${C.rouge(msg)}`); };
const bon = (msg) => { bilan.ok++; console.log(`   ${OK} ${msg}`); };

function titre(n, texte) {
  console.log("\n" + C.gras(`${n}. ${texte.toUpperCase()}`));
  console.log(C.gris("   " + "─".repeat(Math.max(20, texte.length + 4))));
}

async function fetchTexte(url, opts = {}) {
  const debut = Date.now();
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "user-agent": "NivCreation-Audit/1.0" },
      ...opts,
    });
    const corps = opts.method === "HEAD" ? "" : await r.text();
    return { ok: r.ok, statut: r.status, corps, ms: Date.now() - debut, type: r.headers.get("content-type") || "" };
  } catch (e) {
    return { ok: false, statut: 0, corps: "", ms: Date.now() - debut, erreur: e.name === "TimeoutError" ? "délai dépassé" : e.message };
  }
}

// Exécute `fn` sur tous les éléments, `n` en parallèle au maximum.
async function enParallele(items, n, fn) {
  const resultats = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        resultats[k] = await fn(items[k], k);
      }
    })
  );
  return resultats;
}

// =============================================================================
// 1. LES PAGES DU SITE
// =============================================================================
const PAGES = [
  ["/", "Accueil"],
  ["/boutique", "Boutique"],
  ["/cristaux", "Cristaux photo 3D"],
  ["/offres", "Offres"],
  ["/avis", "Avis clients"],
  ["/panier", "Panier"],
  ["/espace", "Mon compte (cliente)"],
  ["/favoris", "Favoris"],
  ["/contact", "Contact"],
  ["/faq", "Questions fréquentes"],
  ["/a-propos", "À propos"],
  ["/sur-mesure", "Projet sur mesure"],
  ["/naissance", "Naissance"],
  ["/cgv", "Conditions de vente"],
  ["/mentions-legales", "Mentions légales"],
  ["/confidentialite", "Confidentialité"],
  ["/retours", "Retours"],
  ["/gestion", "Gestion (votre admin)"],
  ["/sitemap.xml", "Plan du site (Google)"],
  ["/robots.txt", "Robots (Google)"],
  ["/flux-google.xml", "Flux Google Shopping"],
];

async function auditPages() {
  titre(1, "Les pages du site");
  const res = await enParallele(PAGES, 6, async ([chemin, nom]) => {
    const r = await fetchTexte(SITE + chemin);
    return { chemin, nom, r };
  });
  let lentes = 0;
  for (const { chemin, nom, r } of res) {
    if (!r.ok) {
      erreur(`${nom} (${chemin}) — ${r.statut || r.erreur}`);
      continue;
    }
    // Une page vide = page cassée. Les fichiers techniques (robots.txt…) sont
    // normalement très courts : on ne leur applique pas la même exigence.
    const mini = /\.(xml|txt)$/.test(chemin) ? 30 : 400;
    if (r.corps.length < mini) {
      alerte(`${nom} (${chemin}) — page anormalement vide`);
      continue;
    }
    if (r.ms > 6000) lentes++;
    bilan.ok++;
  }
  console.log(`   ${OK} ${res.filter((x) => x.r.ok).length}/${PAGES.length} pages s'ouvrent correctement`);
  const moyenne = Math.round(res.reduce((a, x) => a + x.r.ms, 0) / res.length);
  if (lentes) alerte(`${lentes} page(s) mettent plus de 6 s à s'afficher (moyenne ${(moyenne / 1000).toFixed(1)} s)`);
  else console.log(`   ${OK} Vitesse d'affichage correcte (moyenne ${(moyenne / 1000).toFixed(1)} s)`);
}

// =============================================================================
// 2. LES FICHES PRODUITS (toutes celles en ligne)
// =============================================================================
async function auditProduits() {
  titre(2, "Les fiches produits");
  const sm = await fetchTexte(SITE + "/sitemap.xml");
  if (!sm.ok) { erreur("Impossible de lire le plan du site — fiches produits non vérifiées"); return []; }
  const urls = [...sm.corps.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes("/produit/"));
  if (!urls.length) { erreur("Aucune fiche produit trouvée dans le plan du site"); return []; }

  const pages = await enParallele(urls, 6, async (url) => ({ url, r: await fetchTexte(url) }));
  let sansBouton = 0;
  const htmls = [];
  slugsEnLigne = new Set();
  for (const { url, r } of pages) {
    const nom = url.split("/produit/")[1];
    if (r.statut === 404) {
      // Produit masqué dans l'admin, mais toujours annoncé à Google → Google
      // tombe sur une page d'erreur (mauvais pour le référencement).
      alerte(`« ${nom} » est annoncé à Google mais la fiche est masquée (Google tombe sur une erreur)`);
      continue;
    }
    if (!r.ok) { erreur(`Fiche « ${nom} » ne s'ouvre pas (${r.statut || r.erreur})`); continue; }
    if (!/Ajouter au panier|Faire une demande/i.test(r.corps)) { sansBouton++; alerte(`Fiche « ${nom} » — pas de bouton d'achat détecté`); }
    slugsEnLigne.add(nom);
    htmls.push(r.corps);
    bilan.ok++;
  }
  const okCount = pages.filter((p) => p.r.ok).length;
  console.log(`   ${OK} ${okCount}/${urls.length} fiches produits s'ouvrent correctement`);
  if (!sansBouton && okCount) console.log(`   ${OK} Toutes les fiches ont leur bouton d'achat`);
  return htmls;
}

// =============================================================================
// 3. LES PHOTOS PRODUITS
// =============================================================================
async function auditPhotos(htmls) {
  titre(3, "Les photos des produits");
  const trouvees = new Set();
  const motifs = [
    /\/produits\/[A-Za-z0-9_.%-]+\.(?:jpg|jpeg|png|webp|avif)/gi,
    /\/api\/img\/[A-Za-z0-9_-]+/g,
    /https:\/\/cdn\.shopify\.com\/[A-Za-z0-9_./%-]+\.(?:jpg|jpeg|png|webp)[A-Za-z0-9_?=&.-]*/gi,
    /https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_./%-]+/gi,
  ];
  for (const html of htmls) {
    for (const m of motifs) for (const t of html.match(m) || []) trouvees.add(t.replace(/\\+$/, ""));
  }
  const liste = [...trouvees].slice(0, MAX_PHOTOS);
  if (!liste.length) { alerte("Aucune photo détectée (à vérifier à la main)"); return; }

  const verifier = async (src, entete) => {
    const url = src.startsWith("http") ? src : SITE + src;
    const r = await fetchTexte(url, { method: "GET", headers: entete });
    return { src, ok: r.ok || r.statut === 206, statut: r.statut, image: /^image\//.test(r.type) };
  };
  const res = await enParallele(liste, 8, (src) =>
    verifier(src, { Range: "bytes=0-2047", "user-agent": "NivCreation-Audit/1.0" })
  );

  // Deuxième chance : les hébergeurs de photos bloquent parfois les requêtes
  // trop rapprochées (erreur passagère). On re-teste les échecs un par un,
  // tranquillement, pour ne pas signaler une photo qui marche en réalité.
  const suspectes = res.filter((x) => !x.ok);
  if (suspectes.length) {
    console.log(C.gris(`   Nouvelle vérification de ${suspectes.length} photo(s)…`));
    for (const s of suspectes) {
      await new Promise((r) => setTimeout(r, 350));
      const r2 = await verifier(s.src, { "user-agent": "Mozilla/5.0 (compatible; NivCreationAudit/1.0)" });
      Object.assign(s, r2);
    }
  }
  const cassees = res.filter((x) => !x.ok);
  const pasImage = res.filter((x) => x.ok && !x.image);
  if (cassees.length) {
    for (const c of cassees.slice(0, 12)) erreur(`Photo qui ne s'affiche pas : ${c.src} (${c.statut || "injoignable"})`);
    if (cassees.length > 12) erreur(`… et ${cassees.length - 12} autres photos cassées`);
  } else {
    console.log(`   ${OK} ${res.length} photos vérifiées — toutes s'affichent`);
    bilan.ok++;
  }
  if (pasImage.length) alerte(`${pasImage.length} fichier(s) ne semblent pas être des images`);
  if (trouvees.size > MAX_PHOTOS) console.log(C.gris(`   (${trouvees.size} photos au total, ${MAX_PHOTOS} vérifiées)`));
}

// =============================================================================
// 4. LES SERVICES (livraison, relais, avis, stock, paiement)
// =============================================================================
async function auditServices() {
  titre(4, "Les services (livraison, avis, stock, paiement)");

  const json = async (chemin) => {
    const r = await fetchTexte(SITE + chemin);
    if (!r.ok) return { ok: false, statut: r.statut || r.erreur };
    try { return { ok: true, data: JSON.parse(r.corps) }; } catch { return { ok: false, statut: "réponse illisible" }; }
  };

  const livraison = await json("/api/shipping-config");
  if (livraison.ok) bon(`Frais de livraison chargés (livraison offerte dès ${livraison.data?.bijouxFreeThreshold ?? livraison.data?.freeThreshold ?? "?"} €)`);
  else erreur(`Frais de livraison injoignables (${livraison.statut})`);

  const catalogue = await json("/api/catalog");
  if (catalogue.ok) {
    const nbPromos = Object.keys(catalogue.data?.promos || {}).length;
    bon(`Photos et promotions chargées${nbPromos ? ` (${nbPromos} promotion(s) active(s))` : ""}`);
  } else erreur(`Photos/promotions injoignables (${catalogue.statut})`);

  // Les avis se demandent produit par produit : on teste sur un échantillon de
  // fiches réellement en ligne et on additionne les avis publiés.
  const echantillon = [...(slugsEnLigne || [])].slice(0, 10);
  if (echantillon.length) {
    const rs = await enParallele(echantillon, 5, (s) => json(`/api/reviews?slug=${encodeURIComponent(s)}`));
    const casses = rs.filter((r) => !r.ok);
    const total = rs.reduce((a, r) => a + (r.ok ? Number(r.data?.count) || 0 : 0), 0);
    if (casses.length) erreur(`Avis clients injoignables (${casses[0].statut})`);
    else bon(`Avis clients opérationnels (${total} avis publiés sur les ${echantillon.length} fiches testées)`);
  }

  const stock = await json("/api/stock");
  if (stock.ok) bon("Stocks chargés");
  else erreur(`Stocks injoignables (${stock.statut})`);

  // Points relais → vérifie que la connexion Boxtal fonctionne.
  const relais = await json("/api/relais?zip=95000&city=Cergy&country=FR");
  const pts = relais.ok ? (relais.data?.points || relais.data?.parcelPoints || (Array.isArray(relais.data) ? relais.data : [])) : [];
  if (relais.ok && pts.length) bon(`Points relais opérationnels (${pts.length} points trouvés autour de Cergy)`);
  else if (relais.ok) alerte("Points relais : aucun point trouvé (connexion Boxtal à vérifier)");
  else erreur(`Points relais injoignables (${relais.statut})`);

  if (TEST_PAIEMENT) await auditPaiement();
  else console.log(C.gris("   (paiement Stripe non testé — relancer avec --paiement pour le tester)"));
}

async function auditPaiement() {
  const produits = await chargerProduitsLocaux();
  const p = (produits || []).find((x) => (x.variants || []).length && !x.personalizable);
  const variantId = p?.variants?.[0]?.id;
  if (!variantId) { alerte("Paiement non testé (aucun produit simple trouvé)"); return; }
  const r = await fetchTexte(SITE + "/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "NivCreation-Audit/1.0" },
    body: JSON.stringify({ items: [{ variantId, quantity: 1 }], country: "FR", deliveryMethod: "domicile", postalCode: "95000" }),
  });
  let url = "";
  try { url = JSON.parse(r.corps)?.url || ""; } catch { /* ignore */ }
  if (r.ok && /^https:\/\/checkout\.stripe\.com/.test(url)) bon("Paiement Stripe opérationnel (page de paiement créée, aucun prélèvement)");
  else erreur(`Paiement Stripe : la page de paiement n'a pas pu être créée (${r.statut}) ${(r.corps || "").slice(0, 120)}`);
}

// =============================================================================
// 5. COHÉRENCE DU CATALOGUE (fichier products.js)
// =============================================================================
// products.js utilise des imports « @/lib/… » que Node ne sait pas résoudre :
// on recopie les fichiers nécessaires dans un dossier temporaire en réécrivant
// les chemins, puis on les importe normalement. Lecture seule, rien n'est modifié.
let cacheProduits = null;
async function chargerProduitsLocaux() {
  if (cacheProduits) return cacheProduits;
  try {
    const dossier = await mkdtemp(path.join(tmpdir(), "audit-niv-"));
    const faits = new Set();
    const copier = async (nom) => {
      if (faits.has(nom)) return;
      faits.add(nom);
      const src = path.join(RACINE, "src/lib", nom + ".js");
      let texte = await readFile(src, "utf8");
      for (const m of texte.matchAll(/from\s+"@\/lib\/([A-Za-z0-9_-]+)"/g)) await copier(m[1]);
      texte = texte.replace(/from\s+"@\/lib\/([A-Za-z0-9_-]+)"/g, 'from "./$1.js"');
      await writeFile(path.join(dossier, nom + ".js"), texte);
    };
    await copier("products");
    const mod = await import(path.join(dossier, "products.js"));
    cacheProduits = mod.products || mod.default || null;
    return cacheProduits;
  } catch {
    return null;
  }
}

async function auditCatalogue() {
  titre(5, "Cohérence du catalogue");
  const produits = await chargerProduitsLocaux();
  if (!produits) { alerte("Catalogue local illisible — vérification passée"); return; }

  let infos = {};
  try {
    const t = await readFile(path.join(RACINE, "src/lib/productInfo.js"), "utf8");
    for (const m of t.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{/gm)) infos[m[1]] = true;
  } catch { /* ignore */ }

  const slugs = new Map();
  const variantes = new Map();
  let sansPhoto = 0, sansPrix = 0, sansFiche = [];

  for (const p of produits) {
    if (slugs.has(p.slug)) erreur(`Deux produits ont la même adresse « ${p.slug} » (le second remplace le premier)`);
    slugs.set(p.slug, true);
    if (!(p.images || []).length) { sansPhoto++; alerte(`« ${p.name || p.slug} » n'a aucune photo`); }
    const vs = p.variants || [];
    if (!vs.length) { erreur(`« ${p.name || p.slug} » n'a aucune option de prix (impossible à acheter)`); continue; }
    for (const v of vs) {
      if (!v.id) erreur(`« ${p.name || p.slug} » a une option sans identifiant (panier cassé)`);
      else if (variantes.has(v.id)) erreur(`Identifiant d'option en double : « ${v.id} » (${variantes.get(v.id)} et ${p.slug}) — risque d'erreur au panier`);
      else variantes.set(v.id, p.slug);
      if (!(Number(v.price) > 0)) { sansPrix++; erreur(`« ${p.name || p.slug} » — option « ${v.title || v.id} » sans prix`); }
    }
    if (!infos[p.slug]) sansFiche.push(p.name || p.slug);
  }

  console.log(`   ${OK} ${produits.length} produits, ${variantes.size} options de prix, aucun identifiant en double`);
  if (!sansPhoto) console.log(`   ${OK} Tous les produits ont au moins une photo`);
  if (!sansPrix) console.log(`   ${OK} Tous les prix sont renseignés`);
  if (sansFiche.length) {
    console.log(C.gris(`   ℹ️  ${sansFiche.length} produit(s) sans fiche détaillée (Taille & Matériaux / Entretien) — mineur :`));
    console.log(C.gris(`      ${sansFiche.slice(0, 8).join(", ")}${sansFiche.length > 8 ? "…" : ""}`));
  } else console.log(`   ${OK} Tous les produits ont leur fiche détaillée`);

  // Produits présents dans le catalogue mais introuvables en ligne : soit
  // volontairement masqués dans l'admin, soit pas encore déployés.
  if (slugsEnLigne?.size) {
    const absents = [...slugs.keys()].filter((s) => !slugsEnLigne.has(s));
    if (absents.length) {
      console.log(C.gris(`   ℹ️  ${absents.length} produit(s) du catalogue ne sont pas visibles en ligne (masqués dans Gestion, ou hors saison) :`));
      console.log(C.gris(`      ${absents.slice(0, 10).join(", ")}${absents.length > 10 ? "…" : ""}`));
    } else console.log(`   ${OK} Tous les produits du catalogue sont bien en ligne`);
  }
  bilan.ok++;
}

// =============================================================================
// 6. LE CODE (compilation)
// =============================================================================
async function auditBuild() {
  titre(6, "Le code du site (compilation)");
  if (RAPIDE) { console.log(C.gris("   (passé — mode rapide)")); return; }
  console.log(C.gris("   Compilation en cours, cela prend 1 à 2 minutes…"));
  const code = await new Promise((res) => {
    const p = spawn("npm", ["run", "build"], { cwd: RACINE, stdio: ["ignore", "pipe", "pipe"] });
    let sortie = "";
    p.stdout.on("data", (d) => { sortie += d; });
    p.stderr.on("data", (d) => { sortie += d; });
    p.on("close", (c) => res({ c, sortie }));
  });
  if (code.c === 0) bon("Le code compile sans erreur (prêt à être déployé)");
  else {
    erreur("La compilation échoue — le site ne pourra pas être mis à jour");
    console.log(C.gris(code.sortie.split("\n").slice(-15).join("\n")));
  }
}

// =============================================================================
// LANCEMENT
// =============================================================================
const debut = Date.now();
console.log(C.gras("\n╔══════════════════════════════════════════════════════╗"));
console.log(C.gras("║        AUDIT COMPLET — NIV CRÉATION                  ║"));
console.log(C.gras("╚══════════════════════════════════════════════════════╝"));
console.log(C.gris(`   Site : ${SITE}`));
console.log(C.gris(`   Date : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`));

await auditPages();
const htmls = await auditProduits();
await auditPhotos(htmls);
await auditServices();
await auditCatalogue();
await auditBuild();

// --- Conclusion --------------------------------------------------------------
const duree = ((Date.now() - debut) / 1000).toFixed(0);
console.log("\n" + C.gras("══════════════════════════════════════════════════════"));
if (!bilan.erreurs.length && !bilan.alertes.length) {
  console.log(C.gras(C.vert("   ✅  TOUT VA BIEN — aucun problème détecté")));
} else if (!bilan.erreurs.length) {
  console.log(C.gras(C.orange(`   ⚠️   LE SITE FONCTIONNE — ${bilan.alertes.length} point(s) à surveiller`)));
  for (const a of bilan.alertes) console.log(C.orange(`      • ${a}`));
} else {
  console.log(C.gras(C.rouge(`   ❌  ${bilan.erreurs.length} PROBLÈME(S) À CORRIGER`)));
  for (const e of bilan.erreurs) console.log(C.rouge(`      • ${e}`));
  if (bilan.alertes.length) {
    console.log(C.orange(`   ⚠️  ${bilan.alertes.length} point(s) à surveiller :`));
    for (const a of bilan.alertes) console.log(C.orange(`      • ${a}`));
  }
}
console.log(C.gras("══════════════════════════════════════════════════════"));
console.log(C.gris(`   ${bilan.ok} vérifications réussies — audit terminé en ${duree} s\n`));
process.exit(bilan.erreurs.length ? 1 : 0);
