// =============================================================================
// PROVENANCE DES CLIENTES (09/11/2026, maquette « D'où viennent les clientes »).
// D'où vient chaque commande : Google, Instagram, TikTok, Facebook, Pinterest,
// e-mail, lien direct…
//  · partie PURE (classerSource, nettoyerProvenance, compacterProvenance,
//    lireProvenanceCompacte, statsProvenance, lienMarque) : sert au navigateur,
//    au paiement, au webhook, à Gestion et au test `npm run test-provenance` ;
//  · partie NAVIGATEUR (releverProvenance, provenancePourPaiement) : note la
//    1re visite, la dernière visite venue d'ailleurs et le nombre de visites,
//    30 jours, dans le navigateur de la visiteuse (localStorage `niv-provenance`).
// TOUT est facultatif : une erreur ici ne doit jamais gêner la visite ni le paiement.
// =============================================================================

export const CLE_STOCKAGE = "niv-provenance";
export const CLE_SESSION = "niv-provenance-visite";
export const DUREE_JOURS = 30;
export const TAILLE_META = 480; // Stripe : 500 caractères par valeur de metadata

// clé → libellé + couleur de la pastille (celles de la maquette)
export const SOURCES = {
  google: { nom: "Google", couleur: "#2f6db5" },
  instagram: { nom: "Instagram", couleur: "#b4366b" },
  tiktok: { nom: "TikTok", couleur: "#1c160d" },
  facebook: { nom: "Facebook", couleur: "#3b5ba5" },
  pinterest: { nom: "Pinterest", couleur: "#b3262d" },
  email: { nom: "E-mail", couleur: "#7c6120" },
  direct: { nom: "Directe", couleur: "#6c6253" },
  autre: { nom: "Autre site", couleur: "#958a77" },
};
export const ORDRE_SOURCES = ["instagram", "tiktok", "google", "facebook", "pinterest", "email", "direct", "autre"];
export const nomSource = (cle) => (SOURCES[cle] || SOURCES.autre).nom;
export const couleurSource = (cle) => (SOURCES[cle] || { couleur: "#958a77" }).couleur;

// ----- petites aides pures ---------------------------------------------------
// Garde une chaîne courte et sans caractère dangereux (ni balise, ni guillemet, ni contrôle).
export function court(v, max = 120) {
  if (v == null) return "";
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>"'`\\{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// « https://l.instagram.com/?u=… » → « l.instagram.com » ; « android-app://com.instagram.android » gardé tel quel.
export function hoteDe(referrer) {
  if (typeof referrer !== "string") return "";
  const r = court(referrer, 300).toLowerCase();
  if (!r) return "";
  if (r.startsWith("android-app://") || r.startsWith("ios-app://")) return r.replace(/\/+$/, "").slice(0, 80);
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(r) ? r : `https://${r}`);
    return u.hostname.replace(/^www\./, "").slice(0, 80);
  } catch {
    return r.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "").slice(0, 80);
  }
}

// Notre propre site, la page de paiement et les banques : ce n'est pas « venir d'ailleurs ».
const INTERNES = [/(^|\.)nivcreation\.fr$/, /\.hosted\.app$/, /(^|\.)stripe\.com$/, /(^|\.)paypal\.com$/, /(^|\.)klarna\.com$/, /^localhost$/, /^127\.0\.0\.1$/];
export function estInterne(referrer) {
  const h = hoteDe(referrer);
  if (!h) return true;
  return INTERNES.some((re) => re.test(h));
}

const PAR_HOTE = [
  ["instagram", /instagram/],
  ["tiktok", /tiktok/],
  ["facebook", /(^|\.)(facebook|fb|messenger)\.(com|me)$|com\.facebook\./],
  ["pinterest", /pinterest|(^|\.)pin\.it$/],
  ["email", /(^|\.)mail\.|(^|\.)outlook\.|webmail|messagerie|(^|\.)gmail\.com$|com\.google\.android\.gm$/],
  ["google", /(^|\.)google\.[a-z.]+$|com\.google\.android\.googlequicksearchbox|googleadservices/],
];
const PAR_UTM = [
  ["instagram", /^(instagram|insta|ig)$/],
  ["tiktok", /^(tiktok|tik-tok|tt)$/],
  ["facebook", /^(facebook|fb|meta|messenger)$/],
  ["pinterest", /^(pinterest|pin)$/],
  ["google", /^(google|googleads|adwords|google-shopping|googleshopping|gmb)$/],
  ["email", /^(email|e-mail|mail|newsletter|brevo|resend|mailing)$/],
];

// LE classement. Ordre : lien marqué (utm) → site d'où elle vient → identifiant de clic → direct.
export function classerSource(v = {}) {
  const us = court(v.utm_source, 60).toLowerCase();
  const um = court(v.utm_medium, 60).toLowerCase();
  const fait = (cle, nom) => ({ cle, nom: nom || nomSource(cle) });
  if (us) {
    for (const [cle, re] of PAR_UTM) if (re.test(us)) return fait(cle);
    if (/^(email|e-mail|mail|newsletter)$/.test(um)) return fait("email");
    return fait("autre", us);
  }
  if (/^(email|e-mail|mail|newsletter)$/.test(um)) return fait("email");
  const h = hoteDe(v.referrer);
  if (h && !estInterne(h)) {
    for (const [cle, re] of PAR_HOTE) if (re.test(h)) return fait(cle);
  }
  if (v.gclid) return fait("google");
  if (v.ttclid) return fait("tiktok");
  if (v.fbclid) return fait("facebook");
  if (h && !estInterne(h)) return fait("autre", h);
  return fait("direct");
}

// ----- une visite, nettoyée --------------------------------------------------
const CLICS = { gclid: "g", fbclid: "f", ttclid: "t" };
const CLICS_INV = { g: "gclid", f: "fbclid", t: "ttclid" };

function dateIso(v) {
  const t = typeof v === "number" ? v : Date.parse(String(v || ""));
  if (!Number.isFinite(t) || t < Date.parse("2024-01-01") || t > Date.now() + 2 * 86400000) return "";
  return new Date(t).toISOString();
}
function pageCourte(v) {
  let p = court(v, 300);
  if (!p) return "";
  p = p.split(/[?#]/)[0];
  if (!p.startsWith("/")) p = "/" + p.replace(/^[a-z]+:\/\/[^/]+\/?/i, "");
  return p.replace(/[^A-Za-z0-9/_.%~-]/g, "").slice(0, 120);
}
export function nettoyerVisite(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const clic = ["gclid", "fbclid", "ttclid"].includes(v.clic) ? v.clic : v.gclid ? "gclid" : v.ttclid ? "ttclid" : v.fbclid ? "fbclid" : "";
  const out = {
    referrer: estInterne(v.referrer) ? "" : hoteDe(v.referrer),
    utm_source: court(v.utm_source, 60).toLowerCase(),
    utm_medium: court(v.utm_medium, 60).toLowerCase(),
    utm_campaign: court(v.utm_campaign, 120).toLowerCase(),
    clic, // seulement le NOM de l'identifiant (gclid…), jamais sa valeur
    page: pageCourte(v.page),
    date: dateIso(v.date),
  };
  return out;
}
function avecSource(v) {
  if (!v) return null;
  const s = classerSource({ referrer: v.referrer, utm_source: v.utm_source, utm_medium: v.utm_medium, [v.clic || "_"]: v.clic ? 1 : undefined });
  return { source: s.cle, nom: s.nom, ...v };
}

// Nettoyage SERVEUR de ce que le navigateur envoie. Rend la provenance prête à ranger sur la commande, ou null.
export function nettoyerProvenance(brut) {
  try {
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
    const premiere = avecSource(nettoyerVisite(brut.premiere));
    if (!premiere) return null;
    let derniere = avecSource(nettoyerVisite(brut.derniere));
    if (derniere && memeVisite(premiere, derniere)) derniere = null;
    const n = Math.floor(Number(brut.visites));
    const visites = Number.isFinite(n) ? Math.min(999, Math.max(1, n)) : 1;
    return { source: premiere.source, nom: premiere.nom, premiere, derniere, visites };
  } catch {
    return null;
  }
}
const signature = (v) => [v.referrer, v.utm_source, v.utm_medium, v.utm_campaign, v.clic].join("|");
function memeVisite(a, b) {
  return signature(a) === signature(b) && a.date === b.date;
}

// ----- metadata Stripe : JSON compact, toujours sous la limite -------------
function visiteCompacte(v, lim) {
  const o = {};
  if (v.referrer) o.r = v.referrer.slice(0, lim.r);
  if (v.utm_source) o.s = v.utm_source.slice(0, lim.s);
  if (v.utm_medium) o.m = v.utm_medium.slice(0, lim.m);
  if (v.utm_campaign) o.c = v.utm_campaign.slice(0, lim.c);
  if (v.clic) o.k = CLICS[v.clic];
  if (v.page && lim.l) o.l = v.page.slice(0, lim.l);
  const t = Date.parse(v.date || "");
  if (t) o.t = Math.round(t / 1000);
  return o;
}
// Du plus complet au plus court ; le dernier palier tient toujours.
const PALIERS = [
  { r: 60, s: 40, m: 30, c: 60, l: 80 },
  { r: 40, s: 30, m: 20, c: 40, l: 40 },
  { r: 30, s: 24, m: 16, c: 30, l: 0 },
  { r: 24, s: 16, m: 10, c: 16, l: 0 },
];
export function compacterProvenance(prov) {
  try {
    const p = prov && prov.premiere ? prov : nettoyerProvenance(prov);
    if (!p) return "";
    for (const lim of PALIERS) {
      const o = { v: p.visites || 1, p: visiteCompacte(p.premiere, lim) };
      if (p.derniere) o.d = visiteCompacte(p.derniere, lim);
      const s = JSON.stringify(o);
      if (s.length <= TAILLE_META) return s;
    }
    const s = JSON.stringify({ v: p.visites || 1, p: visiteCompacte(p.premiere, PALIERS[3]) });
    return s.length <= TAILLE_META ? s : "";
  } catch {
    return "";
  }
}
function visiteLongue(o) {
  if (!o || typeof o !== "object") return null;
  return { referrer: o.r, utm_source: o.s, utm_medium: o.m, utm_campaign: o.c, clic: CLICS_INV[o.k] || "", page: o.l, date: o.t ? Number(o.t) * 1000 : "" };
}
// Webhook : metadata.prov → order.provenance (ou null : la commande passe comme avant).
export function lireProvenanceCompacte(texte) {
  try {
    if (!texte || typeof texte !== "string" || texte.length > 600) return null;
    const o = JSON.parse(texte);
    if (!o || typeof o !== "object" || !o.p) return null;
    return nettoyerProvenance({ premiere: visiteLongue(o.p), derniere: visiteLongue(o.d), visites: o.v });
  } catch {
    return null;
  }
}

// ----- lecture dans Gestion --------------------------------------------------
// La provenance d'une commande, ou null (ancienne commande, suivi bloqué).
export function provenanceDe(order) {
  const p = order && order.provenance;
  if (!p || typeof p !== "object" || !p.premiere) return null;
  return p;
}
// « premiere » = qui l'a fait découvrir ; « derniere » = qui l'a décidée (à défaut, la première).
export function sourceDe(order, mode = "premiere") {
  const p = provenanceDe(order);
  if (!p) return null;
  const v = mode === "derniere" ? p.derniere || p.premiere : p.premiere;
  const cle = SOURCES[v.source] ? v.source : "autre";
  return { cle, nom: v.nom || nomSource(cle), visite: v };
}
// Précision à côté du nom : « lien de la bio », « publication reel-noel », « puis revenue par Instagram ».
export function detailVisite(v) {
  if (!v) return "";
  const m = v.utm_medium || "";
  if (m === "bio") return "lien de la bio";
  if (m === "publication") return v.utm_campaign ? `publication ${v.utm_campaign}` : "publication";
  if (v.utm_campaign) return `lien ${v.utm_campaign}`;
  if (m && !/^(email|e-mail|mail|newsletter)$/.test(m)) return m;
  return "";
}
export function lienMarqueTexte(v) {
  if (!v) return "";
  return [v.utm_source && `utm_source=${v.utm_source}`, v.utm_medium && `utm_medium=${v.utm_medium}`, v.utm_campaign && `utm_campaign=${v.utm_campaign}`, v.clic && `${v.clic} présent`].filter(Boolean).join(" · ");
}
export function nomPage(page) {
  const p = String(page || "");
  if (!p || p === "/") return "l'accueil";
  if (p.startsWith("/produit/")) return `la fiche ${p.slice(9)}`;
  return p;
}

// Tableau « D'où viennent les ventes » : une ligne par source.
export function statsProvenance(orders, mode = "premiere") {
  const lignes = {};
  let commandes = 0, ca = 0, connues = 0;
  for (const o of orders || []) {
    const s = sourceDe(o, mode);
    const cle = s ? s.cle : "inconnue";
    const nom = s ? (cle === "autre" ? "Autre site" : nomSource(cle)) : "Non relevée";
    const total = Number(o.total) || 0;
    if (!lignes[cle]) lignes[cle] = { cle, nom, couleur: s ? couleurSource(cle) : "#958a77", commandes: 0, ca: 0, liens: {} };
    lignes[cle].commandes += 1;
    lignes[cle].ca += total;
    const camp = s && s.visite.utm_campaign;
    if (camp) {
      const l = (lignes[cle].liens[camp] = lignes[cle].liens[camp] || { nom: camp, commandes: 0, ca: 0 });
      l.commandes += 1; l.ca += total;
    }
    commandes += 1; ca += total; if (s) connues += 1;
  }
  const liste = Object.values(lignes)
    .map((l) => ({ ...l, ca: Math.round(l.ca * 100) / 100, panier: l.commandes ? Math.round((l.ca / l.commandes) * 100) / 100 : 0, liens: Object.values(l.liens).sort((a, b) => b.ca - a.ca) }))
    .sort((a, b) => (a.cle === "inconnue") - (b.cle === "inconnue") || b.ca - a.ca || b.commandes - a.commandes);
  return { lignes: liste, commandes, ca: Math.round(ca * 100) / 100, connues };
}

// Lien marqué à mettre en bio ou sous une publication.
export function slugLien(nom) {
  return String(nom || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
export function lienMarque({ source, medium = "publication", campagne = "", page = "" } = {}) {
  const s = slugLien(source) || "instagram";
  const c = slugLien(campagne);
  const p = String(page || "").replace(/^\/+/, "");
  return `https://nivcreation.fr/${p}?utm_source=${s}&utm_medium=${slugLien(medium) || "publication"}${c ? `&utm_campaign=${c}` : ""}`;
}

// =============================================================================
// PARTIE NAVIGATEUR
// =============================================================================
// Calcul PUR du nouvel état à garder (testé) : `etat` = ce qui est déjà gardé, `arrivee` = cette page.
export function majProvenance(etat, arrivee, { nouvelleVisite = true, maintenant = Date.now() } = {}) {
  const a = nettoyerVisite({ ...arrivee, date: maintenant });
  let e = etat && typeof etat === "object" && etat.premiere ? etat : null;
  const t0 = e ? Date.parse(e.premiere.date || "") : 0;
  if (e && (!t0 || maintenant - t0 > DUREE_JOURS * 86400000)) e = null; // 30 jours : on repart de zéro
  if (!e) return { premiere: a, derniere: null, visites: 1 };
  const out = { premiere: e.premiere, derniere: e.derniere || null, visites: Math.max(1, Number(e.visites) || 1) };
  if (nouvelleVisite) out.visites = Math.min(999, out.visites + 1);
  const dAilleurs = Boolean(a.referrer || a.utm_source || a.utm_medium || a.clic);
  if (dAilleurs) {
    const ref = out.derniere || out.premiere;
    if (nouvelleVisite || signature(ref) !== signature(a)) out.derniere = a;
  }
  return out;
}

// À appeler une fois par chargement de page (composant ProvenanceCapture). Ne lève jamais.
export function releverProvenance() {
  try {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search || "");
    const arrivee = {
      referrer: document.referrer || "",
      utm_source: q.get("utm_source") || "",
      utm_medium: q.get("utm_medium") || "",
      utm_campaign: q.get("utm_campaign") || "",
      gclid: q.get("gclid") ? 1 : 0,
      fbclid: q.get("fbclid") ? 1 : 0,
      ttclid: q.get("ttclid") ? 1 : 0,
      page: window.location.pathname || "/",
    };
    if (String(arrivee.page).startsWith("/gestion")) return; // Gestion n'est pas une visite de cliente
    let etat = null;
    try { etat = JSON.parse(window.localStorage.getItem(CLE_STOCKAGE) || "null"); } catch { etat = null; }
    let nouvelleVisite = true;
    try {
      nouvelleVisite = !window.sessionStorage.getItem(CLE_SESSION);
      window.sessionStorage.setItem(CLE_SESSION, "1");
    } catch { /* stockage bloqué : chaque chargement compte comme une visite */ }
    const suite = majProvenance(etat, arrivee, { nouvelleVisite });
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(suite));
  } catch { /* jamais bloquant */ }
}

// Ce que le panier envoie au paiement (ou undefined : rien n'est envoyé, le paiement se fait comme avant).
export function provenancePourPaiement() {
  try {
    if (typeof window === "undefined") return undefined;
    const etat = JSON.parse(window.localStorage.getItem(CLE_STOCKAGE) || "null");
    if (!etat || !etat.premiere) return undefined;
    const t0 = Date.parse(etat.premiere.date || "");
    if (!t0 || Date.now() - t0 > DUREE_JOURS * 86400000) return undefined;
    return { premiere: etat.premiere, derniere: etat.derniere || null, visites: etat.visites || 1 };
  } catch {
    return undefined;
  }
}
