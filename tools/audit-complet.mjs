#!/usr/bin/env node
// =============================================================================
// AUDIT COMPLET — Niv Création (04/11/2026)
// -----------------------------------------------------------------------------
// Gérant, après l'audit externe du 04/11 : « pourquoi à chaque fois que je t'ai
// dit fais un audit, tu m'as jamais trouvé autant de problèmes… tu fais tout, tu
// enregistres tous ces paramètres ». L'ancien `audit-site` ne vérifiait QUE le
// fonctionnement (pages, photos, paiement). Celui-ci vérifie TOUT, en lecture seule :
//
//   1. Fonctionnement     → lance `audit-site --rapide` et `audit-photos`
//   2. Sécurité & domaine → https, www, certificat, en-têtes, contenu mixte
//   3. Légal              → mentions légales, CGV, retours, confidentialité, cookies
//   4. Prix & promotions  → « -0 % », promo > prix barré, prix barré permanent (Omnibus),
//                           prix de la page = prix donné à Google, « quantités limitées »
//   5. Allégations        → mots interdits ou risqués sur TOUTES les pages
//   6. Référencement      → titres, descriptions, H1, canonical, lang, noindex, alt,
//                           doublons, données structurées produit, liens cassés,
//                           robots.txt, sitemap, flux Google Shopping
//   7. Vitesse            → poids au chargement, images préchargées, LCP, CLS
//   8. Téléphone & accessibilité → débordement à 390 px, zones tactiles, axe-core
//   9. Google             → Analytics, Search Console, robots → sitemap
//
//   npm run audit-complet                 → tout (≈ 3 à 5 min)
//   npm run audit-complet -- --rapide     → sans les étapes navigateur (vitesse, téléphone, accessibilité)
//   npm run audit-complet -- --site https://…
//
// Rapport : à l'écran + `docs/audits/audit-AAAA-MM-JJ.md`.
// ⛔ Quand le gérant dit « fais un audit » / « vérifie mon site » : lancer CET outil,
// puis relire les ⚠️ à la main, et chercher sur Internet si une règle a changé
// (CNIL, DGCCRF, Google). Ne JAMAIS dire « tout va bien » sans dire ce qui a été vérifié.
// =============================================================================
import { spawn } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import tls from "node:tls";
import path from "node:path";

const args = process.argv.slice(2);
const RAPIDE = args.includes("--rapide");
const iSite = args.indexOf("--site");
const SITE = (iSite >= 0 && args[iSite + 1]?.startsWith("http") ? args[iSite + 1] : "https://nivcreation.fr").replace(/\/$/, "");
const HOTE = new URL(SITE).host;
const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const UA = "Mozilla/5.0 (audit Niv Creation)"; // ASCII seulement : un « É » dans un en-tête fait répondre 500 par Google

// ---------------------------------------------------------------------------
// Résultats
// ---------------------------------------------------------------------------
const sections = [];
let cur = null;
function section(titre) { cur = { titre, lignes: [] }; sections.push(cur); console.log(`\n━━ ${titre}`); }
function ok(t) { cur.lignes.push(["✅", t]); console.log(`  ✅ ${t}`); }
function warn(t) { cur.lignes.push(["⚠️", t]); console.log(`  ⚠️  ${t}`); }
function ko(t) { cur.lignes.push(["❌", t]); console.log(`  ❌ ${t}`); }
const liste = (arr, n = 6) => arr.slice(0, n).join(" · ") + (arr.length > n ? ` … (+${arr.length - n})` : "");

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------
// Une erreur 5xx ou une coupure est relue 2 fois (4 s puis 8 s) : le site peut
// avoir une seconde de faiblesse (instance qui redémarre). Ce qui revient bon
// après une relecture est noté à part (« instabilité passagère »), pas compté
// comme une page cassée.
const instables = new Set();
async function get(url, opts = {}) {
  let r = await get1(url, opts);
  for (let essai = 1; essai <= 2 && (r.status === 0 || r.status >= 500); essai++) {
    await new Promise((ok) => setTimeout(ok, 4000 * essai));
    const r2 = await get1(url, opts);
    if (r2.status !== 0 && r2.status < 500) instables.add(url.replace(SITE, "") || "/");
    r = r2;
  }
  return r;
}
async function get1(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 25000);
  try {
    const r = await fetch(url, { redirect: opts.redirect || "follow", headers: { "user-agent": UA }, signal: ctrl.signal });
    const body = opts.head ? "" : await r.text();
    return { status: r.status, headers: r.headers, body, url: r.url, location: r.headers.get("location") };
  } catch (e) {
    return { status: 0, headers: new Headers(), body: "", erreur: String(e.message || e) };
  } finally { clearTimeout(t); }
}
async function parLots(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
const texte = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ");
const attr = (tag, nom) => (tag.match(new RegExp(`\\s${nom}="([^"]*)"`, "i")) || [])[1];
const lancer = (cmd, a) => new Promise((res) => {
  const p = spawn(cmd, a, { cwd: RACINE, env: process.env });
  let out = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
  p.on("close", (code) => res({ code, out }));
});

// ---------------------------------------------------------------------------
// 0. Plan du site (toutes les pages publiques)
// ---------------------------------------------------------------------------
const sm = await get(`${SITE}/sitemap.xml`);
const urls = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, SITE));
const pagesFixes = ["/", "/boutique", "/offres", "/panier", "/faq", "/contact", "/mentions-legales", "/cgv", "/retours", "/confidentialite", "/a-propos", "/cristaux", "/offrir", "/carte-cadeau", "/idees"];
// « https://site » et « https://site/ » sont la même page : une seule clé (SITE + "/").
const norm = (u) => { const x = u.replace(/\/+$/, ""); return x === SITE ? SITE + "/" : x; };
const toutes = [...new Set([...pagesFixes.map((p) => SITE + p), ...urls].map(norm))];
console.log(`Audit complet de ${SITE} — ${toutes.length} pages à lire (${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })})`);
const pages = {};
await parLots(toutes, 4, async (u) => { pages[u] = await get(u); });

// ---------------------------------------------------------------------------
// 1. Fonctionnement (outils existants)
// ---------------------------------------------------------------------------
section("1. Fonctionnement (pages, photos, paiement, catalogue)");
{
  const a = await lancer("node", ["tools/audit-site.mjs", "--rapide", "--site", SITE]);
  const ligneFin = a.out.trim().split("\n").filter((l) => /✅|⚠️|❌/.test(l)).slice(-3).join(" ");
  const nbKo = (a.out.match(/❌/g) || []).length;
  if (a.code === 0 && nbKo === 0) ok(`audit-site : tout fonctionne (${(a.out.match(/✅/g) || []).length} contrôles)`);
  else ko(`audit-site : ${nbKo} problème(s) — ${ligneFin.slice(0, 300)}`);
  const ph = await lancer("node", ["--import", "./tools/alias-register.mjs", "tools/audit-photos.mjs", "--site", SITE]);
  const phKo = (ph.out.match(/❌/g) || []).length, phW = (ph.out.match(/⚠️/g) || []).length;
  if (phKo) ko(`audit-photos : ${phKo} photo(s) d'un produit qui n'est pas en vente`);
  else if (phW) warn(`audit-photos : ${phW} photo(s) de produit sans lien vers sa fiche`);
  else ok("audit-photos : toutes les photos de produits mènent à une fiche en vente");
  const enErreur = Object.entries(pages).filter(([, r]) => r.status !== 200).map(([u, r]) => `${u.replace(SITE, "")} (${r.status})`);
  enErreur.length ? ko(`${enErreur.length} page(s) du plan du site en erreur : ${liste(enErreur)}`) : ok(`${toutes.length} pages du plan du site répondent 200`);
  if (instables.size) warn(`instabilité passagère : ${instables.size} page(s) ont d'abord répondu en erreur (500 ou coupure) puis normalement à la relecture : ${liste([...instables])}`);
}

// ---------------------------------------------------------------------------
// 2. Sécurité & domaine
// ---------------------------------------------------------------------------
section("2. Sécurité & domaine");
{
  const http = await get(`http://${HOTE}/`, { redirect: "manual", head: true });
  [301, 302, 307, 308].includes(http.status) && /^https:/.test(http.location || "") ? ok("http:// redirige vers https://") : ko(`http:// ne redirige pas vers https:// (${http.status} → ${http.location || "—"})`);
  if (!HOTE.startsWith("www.")) {
    const www = await get(`https://www.${HOTE}/`, { redirect: "manual", head: true });
    if ([301, 302, 307, 308].includes(www.status) && (www.location || "").includes(HOTE)) ok(`www.${HOTE} redirige vers ${HOTE}`);
    else ko(`www.${HOTE} ne redirige pas vers le site (${www.status || www.erreur})`);
  }
  const jours = await new Promise((res) => {
    const s = tls.connect(443, HOTE, { servername: HOTE }, () => { const c = s.getPeerCertificate(); s.end(); res(Math.round((new Date(c.valid_to) - Date.now()) / 864e5)); });
    s.on("error", () => res(null)); s.setTimeout(15000, () => { s.destroy(); res(null); });
  });
  jours == null ? ko("certificat https illisible") : jours < 14 ? ko(`certificat https expire dans ${jours} jours`) : ok(`certificat https valide encore ${jours} jours (renouvelé automatiquement par Firebase)`);
  const h = pages[SITE + "/"]?.headers || new Headers();
  const attendus = { "strict-transport-security": "HSTS", "x-frame-options": "X-Frame-Options", "x-content-type-options": "X-Content-Type-Options", "referrer-policy": "Referrer-Policy", "permissions-policy": "Permissions-Policy" };
  const manquants = Object.entries(attendus).filter(([k]) => !h.get(k)).map(([, v]) => v);
  manquants.length ? ko(`en-têtes de sécurité absents : ${manquants.join(", ")}`) : ok("5 en-têtes de sécurité présents");
  h.get("content-security-policy") ? ok("Content-Security-Policy présente") : warn("pas de Content-Security-Policy (protection avancée, à préparer en mode « rapport » d'abord)");
  const mixte = Object.entries(pages).filter(([, r]) => /(src|href)="http:\/\/(?!www\.w3\.org)/i.test(r.body)).map(([u]) => u.replace(SITE, ""));
  mixte.length ? ko(`contenu non sécurisé (http://) sur ${mixte.length} page(s) : ${liste(mixte)}`) : ok("aucun contenu http:// non sécurisé");
  const g = await get(`${SITE}/gestion/commandes`);
  const api = await get(`${SITE}/api/admin/orders`);
  api.status === 401 || api.status === 403 ? ok("l'API de Gestion refuse sans mot de passe") : ko(`l'API de Gestion répond ${api.status} sans mot de passe`);
  /noindex/i.test(g.body) ? ok("Gestion n'est pas indexée par Google (noindex)") : warn("la page Gestion n'a pas de « noindex » (Google pourrait l'indexer)");
}

// ---------------------------------------------------------------------------
// 3. Légal
// ---------------------------------------------------------------------------
section("3. Légal (mentions, CGV, retours, confidentialité, cookies)");
{
  const T = (p) => texte(pages[SITE + p]?.body || "");
  const ml = T("/mentions-legales"), cgv = T("/cgv"), ret = T("/retours"), conf = T("/confidentialite"), acc = pages[SITE + "/"]?.body || "";
  const exiger = (txt, nom, tests) => { const manque = tests.filter(([, re]) => !re.test(txt)).map(([n]) => n); manque.length ? ko(`${nom} : il manque ${manque.join(", ")}`) : ok(`${nom} : ${tests.map(([n]) => n).join(", ")}`); };
  exiger(ml, "Mentions légales", [["SIRET", /SIRET\s*:?\s*\d{3}\s?\d{3}\s?\d{3}/i], ["adresse", /\d{5}\s+[A-Z][a-zé]+/], ["e-mail", /@/], ["téléphone", /0\d([ .]?\d{2}){4}/], ["hébergeur", /héberg/i], ["directeur de la publication", /directeur de la publication/i]]);
  /netlify/i.test(ml + conf + cgv) ? ko("une page légale cite encore Netlify (ancien hébergeur)") : ok("aucune page légale ne cite l'ancien hébergeur");
  exiger(cgv, "CGV", [["prix en euros", /euros|€/i], ["TVA (art. 293 B)", /293 ?B/i], ["moyens de paiement", /carte bancaire|paiement/i], ["frais de livraison", /frais de livraison/i], ["rétractation 14 jours", /14 jours/i], ["exception produits personnalisés (L221-28)", /L ?221-28/i], ["garantie légale de conformité", /garantie légale de conformité/i], ["vices cachés", /vices cachés/i], ["médiation", /médiat/i]]);
  /prochainement|en cours d'adhésion|adhésion à un service de médiation en cours/i.test(cgv) ? ko("CGV : aucun médiateur de la consommation nommé (obligatoire, art. L612-1) — adhésion à faire par le gérant") : ok("CGV : médiateur de la consommation nommé");
  /consumers\/odr/i.test(cgv + ret) ? ko("lien vers la plateforme européenne de litiges (fermée le 20/07/2025)") : ok("plus de lien vers l'ancienne plateforme européenne de litiges");
  /photo sous \d+ ?h|sous 24 ?h[^.]{0,40}défaut|défaut[^.]{0,60}sous \d+ (h|jours)/i.test(ret) ? ko("Retours : délai imposé pour signaler un défaut (limite la garantie légale)") : ok("Retours : aucun délai imposé pour signaler un défaut");
  /garantie légale de conformité/i.test(ret) ? ok("Retours : garantie légale de conformité rappelée") : warn("Retours : la garantie légale de conformité n'est pas rappelée");
  exiger(conf, "Confidentialité", [["droits RGPD", /RGPD|droit d'accès/i], ["réclamation CNIL", /CNIL/i], ["cookies", /cookies/i], ["durée de conservation", /conserv/i]]);
  const ga = /googletagmanager\.com\/gtag|gtag\(/.test(acc);
  if (ga && !/Google Analytics/i.test(conf)) ko("Google Analytics est sur le site mais la page Confidentialité ne le dit pas");
  else if (ga) ok("Google Analytics est déclaré dans la page Confidentialité");
  const bandeau = /consent|cookie-banner|tarteaucitron|axeptio|didomi|cookiebot/i.test(acc);
  if (ga && !bandeau) warn("Google Analytics se lance sans demander l'accord de la visiteuse (CNIL : consentement requis sauf configuration exemptée) — décision du gérant, voir docs/EN-ATTENTE.md");
  const pied = ["/mentions-legales", "/cgv", "/confidentialite", "/retours"].filter((p) => !acc.includes(`href="${p}"`));
  pied.length ? ko(`liens légaux absents du pied de page : ${pied.join(", ")}`) : ok("mentions légales, CGV, confidentialité et retours accessibles depuis toutes les pages (pied de page)");
}

// ---------------------------------------------------------------------------
// 4. Prix & promotions
// ---------------------------------------------------------------------------
section("4. Prix & promotions");
{
  const zeroPct = [], promoPlusChere = [], ecartGoogle = [], barresPermanents = [];
  for (const [u, r] of Object.entries(pages)) {
    if (r.status !== 200) continue;
    const p = u.replace(SITE, "");
    if (/promo-badge[^>]*>\s*-\s*0\s*%/.test(r.body) || /"promo-badge\\?",\\?"children\\?":\[\\?"-\\?",0,/.test(r.body)) zeroPct.push(p);
    for (const m of r.body.matchAll(/price-old[^>]*>([\d\s,.]+)\s?€<\/span>\s*(?:<!-- -->)?\s*<span class="price-sale[^>]*>([\d\s,.]+)\s?€/g)) {
      const old = parseFloat(m[1].replace(/\s/g, "").replace(",", ".")), sale = parseFloat(m[2].replace(/\s/g, "").replace(",", "."));
      if (sale >= old) promoPlusChere.push(`${p} (${m[1]} → ${m[2]} €)`);
    }
    // Une fiche qui renvoie vers une page dédiée (ex. cristal déjà gravé → /cristaux-graves) n'est pas une fiche.
    if (p.startsWith("/produit/") && norm(r.url || u) === u) {
      const ld = [...r.body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
      const prod = ld.flatMap((x) => (Array.isArray(x) ? x : x["@graph"] || [x])).find((x) => x["@type"] === "Product");
      const offre = prod && (Array.isArray(prod.offers) ? prod.offers[0] : prod.offers);
      const prixLd = offre && parseFloat(offre.price ?? offre.lowPrice);
      // Prix principal de la fiche = le premier montant après « price-lead » (les
      // cartes « Vous aimerez aussi » plus bas ont aussi des price-sale).
      const iLead = r.body.indexOf('class="price-lead');
      const vis = iLead >= 0 ? (r.body.slice(iLead, r.body.indexOf("</div>", iLead)).replace(/<[^>]+>/g, " ").match(/([\d\s]+,\d{2})\s?€/g) || []).map((x) => x.replace(/[^\d,]/g, "")).pop() : null;
      const prixVis = vis && parseFloat(vis.replace(/\s/g, "").replace(",", "."));
      if (prixLd && prixVis && Math.abs(prixLd - prixVis) > 0.011) ecartGoogle.push(`${p} (fiche ouverte à ${vis} € / Google ${String(prixLd).replace(".", ",")} €)`);
      if (/price-old/.test(r.body)) barresPermanents.push(p);
    }
  }
  zeroPct.length ? ko(`badge « -0 % » sur ${liste(zeroPct)}`) : ok("aucun badge « -0 % »");
  promoPlusChere.length ? ko(`prix promo ≥ prix barré : ${liste(promoPlusChere)}`) : ok("aucun prix promo supérieur ou égal au prix barré");
  ecartGoogle.length ? warn(`${ecartGoogle.length} fiche(s) s'ouvrent sur un prix différent de celui donné à Google (Google reçoit le prix de l'option la moins chère, la fiche s'ouvre sur la première option) — Merchant Center peut signaler « prix différent » : ${liste(ecartGoogle, 12)}`) : ok("le prix des fiches correspond au prix donné à Google");
  if (barresPermanents.length) warn(`${barresPermanents.length} fiche(s) affichent un prix barré EN PERMANENCE (remise bijoux −10 %). Règle Omnibus (art. L112-1-1) : le prix barré doit être le prix le plus bas réellement pratiqué dans les 30 jours avant la remise ; un prix barré jamais pratiqué est une réduction trompeuse. Décision du gérant.`);
  const qte = Object.entries(pages).filter(([, r]) => /quantités? (sont )?limitées|stock limité|plus que \d+ (en stock|exemplaires?)|dernières pièces/i.test(texte(r.body))).map(([u]) => u.replace(SITE, ""));
  qte.length ? warn(`« quantités limitées / stock limité » écrit sur ${liste(qte)} (à éviter sur des produits fabriqués à la commande)`) : ok("aucune fausse urgence (« quantités limitées », « plus que N »)");
  const ttc = Object.entries(pages).filter(([u, r]) => u.includes("/produit/") && /\bHT\b/.test(texte(r.body)) && !/TVA non applicable/i.test(texte(r.body))).map(([u]) => u.replace(SITE, ""));
  ttc.length ? warn(`prix « HT » affiché à des particuliers : ${liste(ttc)}`) : ok("aucun prix HT affiché aux particuliers");
}

// ---------------------------------------------------------------------------
// 5. Allégations et mots à risque (toutes les pages)
// ---------------------------------------------------------------------------
section("5. Allégations (ce qui est promis aux clientes)");
{
  const regles = [
    ["❌", /sans nickel/i, "« sans nickel » (l'acier inoxydable contient du nickel)"],
    ["❌", /plaqué or/i, "« plaqué or » (appellation réservée à 3 microns d'or minimum)"],
    ["❌", /cuir véritable(?! \)| ?\))(?<!pas du cuir véritable)/i, "« cuir véritable » (tes bracelets sont « aspect cuir »)"],
    ["❌", /fait main en France/i, "« fait main en France » (tu graves et découpes, tu ne fabriques pas les bijoux / verres)"],
    ["❌", /ne ternit (jamais|pas)/i, "« ne ternit pas » (faux pour un bijou doré)"],
    ["❌", /garanti(e)? à vie/i, "« garanti à vie »"],
    ["❌", /livraison (en )?24 ?h/i, "« livraison 24 h » (sauf Express, après confection)"],
    ["❌", /\b(lorem ipsum|undefined|NaN ?€|\[object Object\])/i, "texte technique visible (undefined, NaN, lorem…)"],
    ["❌", /\bnetlify\b/i, "« Netlify » visible"],
    ["⚠️", /\bétanche\b/i, "« étanche » (à éviter sur un bijou doré)"],
    ["⚠️", /hypoallergénique/i, "« hypoallergénique » (allégation santé, à garder seulement si le fournisseur le certifie ; le bandeau « Matériaux nobles » dit aussi « acier 316L » sur toutes les fiches alors que plusieurs bijoux sont en 304)"],
    ["⚠️", /qualité chirurgicale|acier chirurgical/i, "« acier chirurgical » (terme marketing, pas une norme)"],
    ["⚠️", /fait main/i, "« fait main » sur un bijou, un verre ou un cristal (juste sur le bois que tu découpes, pas sur ce que tu achètes et graves)", /<title>[^<]*(collier|bracelet|bijou|verre|carafe|flûte|cristal|gobelet|tumbler|pendentif)/i],
  ];
  for (const [niv, re, nom, seulementSi] of regles) {
    const ou = Object.entries(pages).filter(([, r]) => {
      if (seulementSi && !seulementSi.test(r.body)) return false;
      const t = texte(r.body).replace(/pas du cuir véritable|n'est pas en cuir véritable/gi, "");
      return re.test(t);
    }).map(([u]) => u.replace(SITE, "") || "/");
    if (!ou.length) { ok(`aucune mention ${nom}`); continue; }
    (niv === "❌" ? ko : warn)(`${nom} sur ${ou.length} page(s) : ${liste(ou)}`);
  }
}

// ---------------------------------------------------------------------------
// 6. Référencement
// ---------------------------------------------------------------------------
section("6. Référencement Google");
{
  const sansTitre = [], titreLong = [], titreCourt = [], sansDesc = [], descLongue = [], h1 = [], sansCanon = [], canonFaux = [], noindex = [], sansLang = [];
  const titres = {}, descs = {}; let imgs = 0, sansAlt = 0; const pagesSansAlt = new Set();
  const produitsSansLd = [];
  for (const [u, r] of Object.entries(pages)) {
    if (r.status !== 200) continue;
    const p = u.replace(SITE, "") || "/";
    if (["/panier"].includes(p)) continue;
    if (norm(r.url || u) !== u) continue; // page qui renvoie ailleurs : comptée à son adresse finale
    const titre = (r.body.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1]?.replace(/&amp;/g, "&").trim();
    if (!titre) sansTitre.push(p); else { (titres[titre] ||= []).push(p); if (titre.length > 70) titreLong.push(`${p} (${titre.length})`); if (titre.length < 15) titreCourt.push(p); }
    const desc = (r.body.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (!desc) sansDesc.push(p); else { (descs[desc] ||= []).push(p); if (desc.length > 170) descLongue.push(`${p} (${desc.length})`); }
    const nbH1 = (r.body.match(/<h1[\s>]/g) || []).length; if (nbH1 !== 1) h1.push(`${p} (${nbH1})`);
    const canon = (r.body.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (!canon) sansCanon.push(p); else if (!canon.startsWith("https://") || canon.includes("www.")) canonFaux.push(`${p} → ${canon}`);
    if (/<meta name="robots" content="[^"]*noindex/i.test(r.body)) noindex.push(p);
    if (!/<html[^>]+lang="fr/i.test(r.body)) sansLang.push(p);
    for (const tag of r.body.match(/<img\b[^>]*>/gi) || []) { imgs++; const a = attr(tag, "alt"); if (a === undefined) { sansAlt++; pagesSansAlt.add(p); } }
    if (p.startsWith("/produit/") && !/"@type":\s*"Product"/.test(r.body)) produitsSansLd.push(p);
  }
  sansTitre.length ? ko(`pages sans titre : ${liste(sansTitre)}`) : ok("toutes les pages ont un titre");
  titreLong.length ? warn(`${titreLong.length} titre(s) de plus de 70 caractères (coupés dans Google) : ${liste(titreLong, 4)}`) : ok("aucun titre trop long");
  titreCourt.length && warn(`titres trop courts : ${liste(titreCourt)}`);
  const dTitres = Object.entries(titres).filter(([, v]) => v.length > 1).map(([t, v]) => `« ${t.slice(0, 40)} » ×${v.length}`);
  dTitres.length ? warn(`titres en double : ${liste(dTitres, 4)}`) : ok("aucun titre en double");
  sansDesc.length ? warn(`${sansDesc.length} page(s) sans description Google : ${liste(sansDesc)}`) : ok("toutes les pages ont une description");
  descLongue.length && warn(`${descLongue.length} description(s) de plus de 170 caractères : ${liste(descLongue, 4)}`);
  const dDesc = Object.entries(descs).filter(([, v]) => v.length > 1).map(([, v]) => `${v[0]} = ${v.slice(1, 3).join(", ")}${v.length > 3 ? "…" : ""}`);
  dDesc.length ? warn(`descriptions en double : ${liste(dDesc, 4)}`) : ok("aucune description en double");
  h1.length ? warn(`pages sans exactement un H1 : ${liste(h1)}`) : ok("un seul H1 par page");
  sansCanon.length ? warn(`${sansCanon.length} page(s) sans adresse canonique : ${liste(sansCanon)}`) : ok("adresse canonique sur toutes les pages");
  canonFaux.length && ko(`adresse canonique incorrecte : ${liste(canonFaux)}`);
  const noindexPublics = noindex.filter((p) => !/^\/(panier|espace|repondre|reponse|document|suivi|merci)/.test(p));
  noindexPublics.length ? ko(`pages du plan du site en « noindex » (invisibles sur Google) : ${liste(noindexPublics)}`) : ok("aucune page publique en « noindex »");
  sansLang.length ? warn(`langue non déclarée : ${liste(sansLang)}`) : ok("langue fr déclarée partout");
  sansAlt ? warn(`${sansAlt} image(s) sur ${imgs} sans texte alternatif (accessibilité + Google Images) : ${liste([...pagesSansAlt], 4)}`) : ok(`${imgs} images, toutes avec un texte alternatif`);
  produitsSansLd.length ? ko(`fiches sans données structurées produit (prix et étoiles dans Google) : ${liste(produitsSansLd)}`) : ok("toutes les fiches produit ont leurs données structurées (prix, disponibilité)");

  // Liens internes cassés
  const liens = new Set();
  for (const r of Object.values(pages)) for (const m of r.body.matchAll(/href="(\/[^"#?]*)/g)) if (!/^\/(_next|api|gestion)/.test(m[1])) liens.add(m[1]);
  const deja = new Set(Object.keys(pages).map((u) => u.replace(SITE, "") || "/"));
  const aTester = [...liens].filter((l) => !deja.has(l));
  const casses = (await parLots(aTester, 8, async (l) => { const r = await get(SITE + l, { head: false, timeout: 20000 }); return r.status >= 400 || r.status === 0 ? `${l} (${r.status})` : null; })).filter(Boolean);
  casses.length ? ko(`${casses.length} lien(s) interne(s) cassé(s) : ${liste(casses)}`) : ok(`${liens.size} liens internes, aucun cassé`);

  const robots = await get(`${SITE}/robots.txt`);
  /Sitemap:\s*https?:\/\//i.test(robots.body) ? ok("robots.txt indique le plan du site") : warn("robots.txt n'indique pas le plan du site");
  /Disallow:\s*\/\s*$/m.test(robots.body) ? ko("robots.txt bloque tout le site !") : ok("robots.txt ne bloque pas le site");
  urls.length ? ok(`plan du site : ${urls.length} adresses`) : ko("plan du site vide ou illisible");
  const flux = await get(`${SITE}/flux-google.xml`);
  const items = (flux.body.match(/<item>/g) || []).length;
  if (!items) ko("flux Google Shopping vide ou illisible");
  else {
    const sansPrix = (flux.body.match(/<item>[\s\S]*?<\/item>/g) || []).filter((it) => !/<g:price>\s*\d/.test(it)).length;
    sansPrix ? ko(`flux Google Shopping : ${sansPrix} article(s) sans prix`) : ok(`flux Google Shopping : ${items} articles, tous avec un prix`);
  }
}

// ---------------------------------------------------------------------------
// 7 & 8. Navigateur : vitesse, téléphone, accessibilité
// ---------------------------------------------------------------------------
let chromium = null;
if (!RAPIDE) {
  for (const p of ["playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"]) { try { chromium = (await import(p)).chromium; break; } catch {} }
}
if (RAPIDE) { section("7-8. Vitesse, téléphone, accessibilité"); warn("non vérifiés (mode --rapide)"); }
else if (!chromium) { section("7-8. Vitesse, téléphone, accessibilité"); warn("navigateur Playwright introuvable : vitesse et accessibilité non vérifiées"); }
else {
  const b = await chromium.launch();
  section("7. Vitesse (mesurée dans un vrai navigateur)");
  const ouvrir = async (url, vp) => {
    const ctx = await b.newContext({ viewport: vp });
    const p = await ctx.newPage(); let octets = 0, imgs = 0;
    p.on("response", async (r) => { try { if (!r.url().startsWith(SITE)) return; const buf = await r.body().catch(() => null); if (!buf) return; octets += buf.length; if (/image\//.test(r.headers()["content-type"] || "")) imgs++; } catch {} });
    await p.addInitScript(() => { window.__lcp = 0; window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    await p.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(800);
    const m = await p.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Math.round(window.__cls * 1000) / 1000, pre: document.querySelectorAll('link[rel=preload][as=image]').length }));
    return { p, ctx, octets, imgs, ...m };
  };
  for (const [nom, chemin] of [["accueil", "/"], ["boutique bijoux", "/boutique/bijoux"], ["fiche verre à whisky", "/produit/verre-a-whisky-grave"], ["cristal", "/cristaux"]]) {
    const r = await ouvrir(SITE + chemin, { width: 390, height: 844 });
    const Mo = (r.octets / 1048576).toFixed(1);
    const msg = `${nom} (téléphone) : ${Mo} Mo au chargement, ${r.imgs} images, ${r.pre} préchargées, affichage principal ${(r.lcp / 1000).toFixed(1)} s, décalage ${r.cls}`;
    (r.octets > 8 * 1048576 || r.pre > 10 || r.cls > 0.25) ? ko(msg) : (r.octets > 4 * 1048576 || r.lcp > 4000 || r.cls > 0.1) ? warn(msg) : ok(msg);
    await r.ctx.close();
  }

  section("8. Téléphone & accessibilité");
  let axe = null;
  try { await access(path.join(RACINE, "node_modules/axe-core/axe.min.js")); axe = path.join(RACINE, "node_modules/axe-core/axe.min.js"); }
  catch { const i = await lancer("npm", ["i", "--no-save", "--no-audit", "--no-fund", "axe-core@4.10.2"]); if (i.code === 0) axe = path.join(RACINE, "node_modules/axe-core/axe.min.js"); }
  const aVerifier = ["/", "/boutique/bijoux", "/produit/verre-a-whisky-grave", "/produit/collier-coeur-grave", "/panier", "/contact", "/cristaux", "/offrir"];
  const debord = [], petits = [], axeGraves = {}, erreursJs = [];
  for (const chemin of aVerifier) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(); const e = [];
    p.on("pageerror", (x) => e.push(x.message));
    await p.goto(SITE + chemin, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(600);
    if (e.length) erreursJs.push(`${chemin} (${e[0].slice(0, 60)})`);
    const m = await p.evaluate(() => {
      const large = document.documentElement.scrollWidth > window.innerWidth + 1;
      const cibles = [...document.querySelectorAll("a, button, input, select, textarea, [role=button]")].filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && (r.width < 24 || r.height < 24) && !el.closest("p, li, .breadcrumb, nav.crumb, label"); });
      return { large, petits: cibles.length };
    });
    if (m.large) debord.push(chemin);
    if (m.petits > 3) petits.push(`${chemin} (${m.petits})`);
    if (axe) {
      await p.addScriptTag({ path: axe }).catch(() => {});
      const res = await p.evaluate(async () => { try { const r = await window.axe.run(document, { resultTypes: ["violations"] }); return r.violations.filter((v) => ["critical", "serious"].includes(v.impact)).map((v) => ({ id: v.id, n: v.nodes.length, aide: v.help })); } catch (err) { return null; } });
      for (const v of res || []) (axeGraves[v.id] ||= { aide: v.aide, pages: [], n: 0 }), axeGraves[v.id].pages.push(chemin), (axeGraves[v.id].n += v.n);
    }
    await ctx.close();
  }
  erreursJs.length ? ko(`erreurs JavaScript sur téléphone : ${liste(erreursJs)}`) : ok(`${aVerifier.length} pages clés sans erreur JavaScript sur téléphone`);
  debord.length ? ko(`la page déborde sur le côté à 390 px : ${liste(debord)}`) : ok("aucune page ne déborde sur le côté sur téléphone");
  petits.length ? warn(`zones à toucher plus petites que 24 px : ${liste(petits)}`) : ok("zones à toucher assez grandes");
  if (!axe) warn("axe-core introuvable : contrôle d'accessibilité automatique non fait");
  else {
    const graves = Object.entries(axeGraves);
    if (!graves.length) ok("accessibilité (axe-core) : aucun problème grave ou critique sur les pages clés");
    for (const [id, v] of graves) warn(`accessibilité « ${v.aide} » (${id}) : ${v.n} élément(s) sur ${liste([...new Set(v.pages)], 4)}`);
    warn("rappel : l'obligation d'accessibilité (juin 2025) ne vise pas les entreprises de moins de 10 salariés et 2 M€ de chiffre d'affaires, mais un site accessible vend mieux");
  }
  await b.close();
}

// ---------------------------------------------------------------------------
// 9. Google
// ---------------------------------------------------------------------------
section("9. Google (Analytics, Search Console)");
{
  const acc = pages[SITE + "/"]?.body || "";
  /G-[A-Z0-9]{6,}/.test(acc) ? ok(`Google Analytics présent (${acc.match(/G-[A-Z0-9]{6,}/)[0]})`) : ko("Google Analytics absent de l'accueil");
  /google-site-verification/.test(acc) ? ok("vérification Search Console présente") : warn("balise de vérification Search Console absente (peut être vérifiée par DNS)");
  const fiches = Object.entries(pages).filter(([u]) => u.includes("/produit/")).length;
  ok(`${fiches} fiches produit lues`);
}

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------
const tot = { "❌": 0, "⚠️": 0, "✅": 0 };
for (const s of sections) for (const [n] of s.lignes) tot[n]++;
const date = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const md = [`# Audit complet de ${SITE} — ${date}`, "", `**${tot["❌"]} problème(s) à corriger · ${tot["⚠️"]} point(s) à surveiller · ${tot["✅"]} contrôle(s) au vert**`, "",
  ...sections.flatMap((s) => [`## ${s.titre}`, "", ...s.lignes.map(([n, t]) => `- ${n} ${t}`), ""]),
  "_Outil : `npm run audit-complet` (lecture seule). Les points juridiques restent à faire valider par un professionnel._", ""].join("\n");
await mkdir(path.join(RACINE, "docs/audits"), { recursive: true });
const fichier = path.join(RACINE, `docs/audits/audit-${date}.md`);
await writeFile(fichier, md);
console.log(`\n══ BILAN : ${tot["❌"]} ❌ · ${tot["⚠️"]} ⚠️ · ${tot["✅"]} ✅ — rapport : ${path.relative(RACINE, fichier)}`);
process.exit(tot["❌"] ? 1 : 0);
