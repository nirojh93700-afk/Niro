// =============================================================================
// Gestion du stock et des données du site (catalogue, promos, réglages…)
// -----------------------------------------------------------------------------
// Deux stockages possibles, choisis par la variable d'environnement DATA_BACKEND :
//   - (défaut)            : Netlify Blobs — comportement historique, inchangé.
//   - DATA_BACKEND=firestore : Firestore (collection "siteConfig"), pour
//     l'hébergement Firebase App Hosting. Chaque section est un document
//     { json: "..." } — pas de souci de noms de champs, et écriture en lot
//     (atomique, cohérence immédiate).
// Le stock est une simple table { variantId: nombre }.
//   - variante absente de la table = stock "non suivi" (produit vendable, pas de badge)
//   - nombre > 0  = "X en stock"
//   - nombre = 0  = "épuisé" (achat bloqué)
// En local (sans aucun stockage), on retombe sur une mémoire temporaire.
// =============================================================================
import { getFirestoreDb, getStorageBucketSafe } from "./firebase";
import { DEFAULT_PACKAGING, DEFAULT_PRODUCT_PACKAGING } from "./packagingSeed";
import { MESSAGE_TEMPLATES_SEED, AUTO_RULES_SEED } from "./messageTemplatesSeed";
import { REVIEWS_SEED } from "./reviewsSeed";

const STORE_NAME = "niv-stock";
const KEY = "stock";
const FS_COLLECTION = "siteConfig"; // collection Firestore (mode firestore)

function useFirestore() {
  return process.env.DATA_BACKEND === "firestore";
}

let memoryFallback = {}; // utilisé en local / si stockage indisponible

// Cache mémoire (mode Firestore uniquement) : évite de relire la base à chaque
// visite — Firestore facture à la lecture. Durée courte (60 s) : les modifs
// admin restent visibles vite, et le quota gratuit est largement préservé.
const FS_CACHE_TTL = 60 * 1000;
const fsCache = { catalog: null, catalogAt: 0, stock: null, stockAt: 0 };
function cacheCopy(v) {
  try { return structuredClone(v); } catch { return JSON.parse(JSON.stringify(v)); }
}

async function getStoreSafe() {
  if (useFirestore()) return null; // mode Firestore : on n'utilise pas les Blobs
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

// --- Mode Firestore : lecture/écriture d'une section (document JSON) -------
async function fsReadDoc(name) {
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const doc = await db.collection(FS_COLLECTION).doc(name).get();
    if (!doc.exists) return null;
    return JSON.parse(doc.data()?.json || "null");
  } catch (e) {
    console.error("Firestore lecture " + name + ":", e.message);
    return null;
  }
}

async function fsWriteDoc(name, value) {
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    await db.collection(FS_COLLECTION).doc(name).set({ json: JSON.stringify(value), updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.error("Firestore écriture " + name + ":", e.message);
    return false;
  }
}

export async function getStockMap() {
  if (useFirestore()) {
    if (fsCache.stock && Date.now() - fsCache.stockAt < FS_CACHE_TTL) return cacheCopy(fsCache.stock);
    const data = await fsReadDoc(KEY);
    if (data) {
      fsCache.stock = cacheCopy(data);
      fsCache.stockAt = Date.now();
    }
    return data || memoryFallback;
  }
  const store = await getStoreSafe();
  if (store) {
    try {
      const data = await store.get(KEY, { type: "json" });
      return data || {};
    } catch {
      return memoryFallback;
    }
  }
  return memoryFallback;
}

async function persist(map) {
  if (useFirestore()) {
    if (await fsWriteDoc(KEY, map)) {
      fsCache.stock = cacheCopy(map); // cache à jour immédiatement
      fsCache.stockAt = Date.now();
      return;
    }
    memoryFallback = map;
    return;
  }
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.setJSON(KEY, map);
      return;
    } catch {
      // bascule en mémoire
    }
  }
  memoryFallback = map;
}

// =============================================================================
// ALERTES « RETOUR EN STOCK » (01/09/2026, demande gérante).
// Les clients s'inscrivent sur une fiche épuisée ; les inscriptions s'accumulent
// par produit. AUCUN e-mail automatique : la gérante clique « Prévenir » dans
// Gestion quand ELLE est prête (le stock peut être manipulé sans risque).
// Stockage : section `restockAlerts` du blob catalogue = { slug: [{email, at}] }.
// Écritures FRAÎCHES + par section (anti-écrasement, cf. correctif 26/08).
// =============================================================================
export async function addRestockAlert(slug, email) {
  const s = String(slug || "").trim();
  const e = normEmail(email);
  if (!s || !validEmail(e)) return { ok: false };
  const data = await getCatalogRaw(true);
  data.restockAlerts = data.restockAlerts || {};
  const liste = data.restockAlerts[s] || [];
  if (liste.some((x) => x.email === e)) return { ok: true, deja: true };
  if (liste.length >= 500) return { ok: false };
  data.restockAlerts[s] = [...liste, { email: e, at: Date.now() }];
  await persistCatalog(data, ["restockAlerts"]);
  return { ok: true };
}

// =============================================================================
// SUIVI DES E-MAILS DE CAMPAGNE : ouvertures (pixel) et clics (lien tracé).
// Stocké dans le blob catalogue : data.emailStats = {
//   [campaignId]: { subject, at, recipients:[email], opens:{email:{n,first,last}},
//                   clicks:{email:[{url,at}]} } }
// N'affecte rien d'existant : écriture ciblée sur la seule section emailStats.
// ⚠️ Une ouverture n'est PAS une preuve de lecture : Apple Mail précharge les
// images (faux positifs) et une cliente qui bloque les images n'est pas comptée
// (faux négatifs). Les CLICS, eux, sont fiables.
// =============================================================================
export async function startEmailCampaign(id, { subject = "", recipients = [] } = {}) {
  const cid = String(id || "").trim();
  if (!cid) return null;
  const data = await getCatalogRaw(true);
  data.emailStats = data.emailStats || {};
  data.emailStats[cid] = {
    subject: String(subject || "").slice(0, 200),
    at: Date.now(),
    recipients: [...new Set((recipients || []).map(normEmail).filter(validEmail))].slice(0, 2000),
    opens: {},
    clicks: {},
  };
  // On ne garde que les 40 dernières campagnes (le blob reste léger).
  const ids = Object.keys(data.emailStats).sort((a, b) => (data.emailStats[b].at || 0) - (data.emailStats[a].at || 0));
  for (const old of ids.slice(40)) delete data.emailStats[old];
  await persistCatalog(data, ["emailStats"]);
  return cid;
}

export async function recordEmailOpen(campaignId, email) {
  const cid = String(campaignId || "").trim();
  const e = normEmail(email);
  if (!cid || !validEmail(e)) return false;
  const data = await getCatalogRaw(true);
  const c = (data.emailStats || {})[cid];
  if (!c) return false;
  c.opens = c.opens || {};
  const now = Date.now();
  const prev = c.opens[e];
  c.opens[e] = { n: (prev?.n || 0) + 1, first: prev?.first || now, last: now };
  await persistCatalog(data, ["emailStats"]);
  return true;
}

export async function recordEmailClick(campaignId, email, url) {
  const cid = String(campaignId || "").trim();
  const e = normEmail(email);
  if (!cid || !validEmail(e)) return false;
  const data = await getCatalogRaw(true);
  const c = (data.emailStats || {})[cid];
  if (!c) return false;
  c.clicks = c.clicks || {};
  const liste = c.clicks[e] || [];
  if (liste.length < 50) liste.push({ url: String(url || "").slice(0, 300), at: Date.now() });
  c.clicks[e] = liste;
  await persistCatalog(data, ["emailStats"]);
  return true;
}

// Annulation / remboursement d'une commande : on remet la cagnotte à l'endroit.
// Deux mouvements, souvent oubliés, et qui vont dans les DEUX sens :
//   1. le cashback GAGNÉ sur cette commande est retiré (sinon la cliente garde
//      un avoir sur un achat qui n'a pas eu lieu) ;
//   2. la cagnotte qu'elle avait DÉPENSÉE lui est rendue (sinon elle perd son
//      argent alors que la commande est annulée — le plus grave des deux).
// Idempotent : rejouer l'annulation ne rejoue pas les mouvements.
export async function reverseCagnotteForOrder(order) {
  const e = normEmail(order?.customerEmail);
  if (!validEmail(e)) return { ok: false, raison: "commande sans e-mail" };
  const ref = String(order?.ref || order?.id || "");
  const gagne = Math.round((Number(order?.cashbackEarned) || 0) * 100) / 100;
  const utilise = Math.round((Number(order?.cagnotteUsed) || 0) * 100) / 100;
  if (gagne <= 0 && utilise <= 0) return { ok: true, retire: 0, rendu: 0 };

  const cle = `${ref}:annulation`;
  const data = await getCatalogRaw(true);
  data.cagnotte = data.cagnotte || {};
  const c = data.cagnotte[e] || { balance: 0, history: [] };
  if ((c.history || []).some((h) => h.orderId === cle)) {
    return { ok: true, deja: true, retire: 0, rendu: 0 };
  }

  const mouvements = [];
  let retire = 0, rendu = 0;
  if (gagne > 0) {
    // On ne descend jamais sous zéro : si elle a déjà dépensé ce cashback,
    // on ne lui crée pas une dette.
    retire = Math.min(c.balance, gagne);
    if (retire > 0) mouvements.push({ amount: -retire, reason: "Commande annulée : cashback retiré", orderId: cle, at: Date.now() });
  }
  if (utilise > 0) {
    rendu = utilise;
    mouvements.push({ amount: rendu, reason: "Commande annulée : cagnotte restituée", orderId: cle, at: Date.now() });
  }
  if (!mouvements.length) {
    // Rien à bouger, mais on pose la marque pour ne pas repasser ici.
    mouvements.push({ amount: 0, reason: "Commande annulée : rien à ajuster", orderId: cle, at: Date.now() });
  }
  c.balance = Math.round((c.balance - retire + rendu) * 100) / 100;
  if (c.balance < 0) c.balance = 0;
  c.history = [...mouvements, ...(c.history || [])].slice(0, 100);
  c.updatedAt = Date.now();
  c.remindedAt = 0;
  data.cagnotte[e] = c;
  await persistCatalog(data, ["cagnotte"]);
  return { ok: true, retire, rendu, balance: c.balance };
}

// =============================================================================
// RÉPONSES À VALIDER — l'agent e-mail en mode « il prépare, le gérant décide ».
// data.pendingReplies = { [id]: { id, token, name, email, phone, subject, message,
//   draft, draftSubject, reason, at, exp, status: "pending"|"sent"|"dismissed",
//   finalText, finalSubject, resolvedAt } }
// RIEN ne part d'ici : l'envoi réel se fait dans /api/reply/[token], sur le clic
// du gérant depuis la page /repondre/[token] (lien reçu dans son alerte).
// =============================================================================
const REPLY_TTL_MS = 30 * 24 * 3600 * 1000; // un lien de validation vit 30 jours
function makeReplyToken() {
  return (
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  ).slice(0, 40);
}

export async function addPendingReply({ name, email, phone = "", subject = "", message, draft = "", draftSubject = "", reason = "", orderId = "", orderRef = "", gmailId = "", gmailThreadId = "", messageId = "", references = "", source = "" }) {
  const e = normEmail(email);
  if (!validEmail(e) || !String(message || "").trim()) return null;
  const data = await getCatalogRaw(true);
  data.pendingReplies = data.pendingReplies || {};
  const now = Date.now();
  for (const k of Object.keys(data.pendingReplies)) {
    if ((data.pendingReplies[k]?.exp || 0) < now) delete data.pendingReplies[k];
  }
  const id = `r${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const item = {
    id, token: makeReplyToken(),
    name: String(name || "").slice(0, 120), email: e, phone: String(phone || "").slice(0, 40),
    subject: String(subject || "").slice(0, 200), message: String(message || "").slice(0, 4000),
    draft: String(draft || "").slice(0, 6000), draftSubject: String(draftSubject || "").slice(0, 200),
    reason: String(reason || "").slice(0, 300),
    // Lien avec la commande + le fil Gmail (réponse dans la même conversation).
    orderId: String(orderId || "").slice(0, 80), orderRef: String(orderRef || "").slice(0, 40),
    gmailId: String(gmailId || "").slice(0, 80), gmailThreadId: String(gmailThreadId || "").slice(0, 80),
    messageId: String(messageId || "").slice(0, 300), references: String(references || "").slice(0, 2000),
    source: String(source || "contact").slice(0, 20),
    at: now, exp: now + REPLY_TTL_MS, status: "pending",
  };
  data.pendingReplies[id] = item;
  await persistCatalog(data, ["pendingReplies"]);
  return item;
}

export async function getPendingReplyByToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const data = await getCatalogRaw(true);
  const it = Object.values(data.pendingReplies || {}).find((r) => r.token === t);
  if (!it || (it.exp || 0) < Date.now()) return null;
  return it;
}

export async function listPendingReplies() {
  const data = await getCatalogRaw(true);
  const now = Date.now();
  return Object.values(data.pendingReplies || {})
    .filter((r) => (r.exp || 0) >= now)
    .sort((a, b) => (b.at || 0) - (a.at || 0));
}

// Réserve la réponse (pending → sent/dismissed). `claimed` dit si C'EST CE
// clic qui a fait la transition : un double clic ne renvoie jamais deux fois.
export async function resolvePendingReply(token, { status, finalText = "", finalSubject = "" }) {
  const t = String(token || "").trim();
  const data = await getCatalogRaw(true);
  const it = Object.values(data.pendingReplies || {}).find((r) => r.token === t);
  if (!it) return null;
  if (it.status !== "pending") return { item: it, claimed: false };
  it.status = status === "sent" ? "sent" : "dismissed";
  it.finalText = String(finalText || "").slice(0, 6000);
  it.finalSubject = String(finalSubject || "").slice(0, 200);
  it.resolvedAt = Date.now();
  await persistCatalog(data, ["pendingReplies"]);
  return { item: it, claimed: true };
}

// Si l'envoi a échoué après la réservation, on rouvre pour que le gérant puisse réessayer.
export async function reopenPendingReply(token) {
  const t = String(token || "").trim();
  const data = await getCatalogRaw(true);
  const it = Object.values(data.pendingReplies || {}).find((r) => r.token === t);
  if (!it) return null;
  it.status = "pending"; it.resolvedAt = 0;
  await persistCatalog(data, ["pendingReplies"]);
  return it;
}

// =============================================================================
// FIL DE L'ASSISTANT UNIFIÉ (« hub ») : la conversation du gérant est mémorisée
// côté serveur pour reprendre là où il en était, du téléphone ou de l'ordinateur.
// data.hubHistory = [ { role, content, at, agent?, actions?, action?, done? } ]
// =============================================================================
const HUB_MAX = 80;
export async function getHubHistory() {
  const data = await getCatalogRaw(true);
  return Array.isArray(data.hubHistory) ? data.hubHistory : [];
}
export async function appendHubHistory(items) {
  const data = await getCatalogRaw(true);
  const cur = Array.isArray(data.hubHistory) ? data.hubHistory : [];
  const add = (items || []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 8000),
    at: Number(m.at) || Date.now(),
    ...(m.agent ? { agent: String(m.agent).slice(0, 30) } : {}),
    ...(m.actions ? { actions: m.actions } : {}),
    ...(m.action ? { action: m.action } : {}),
  }));
  data.hubHistory = [...cur, ...add].slice(-HUB_MAX);
  await persistCatalog(data, ["hubHistory"]);
  return data.hubHistory;
}
// Marque un message (ex. « appliqué ✓ » / « envoyé ✓ ») pour ne pas reproposer l'action.
export async function markHubMessage(at, done) {
  const data = await getCatalogRaw(true);
  const cur = Array.isArray(data.hubHistory) ? data.hubHistory : [];
  const it = cur.find((m) => m.at === Number(at));
  if (!it) return null;
  it.done = String(done || "").slice(0, 120);
  await persistCatalog(data, ["hubHistory"]);
  return it;
}
export async function clearHubHistory() {
  const data = await getCatalogRaw(true);
  data.hubHistory = [];
  await persistCatalog(data, ["hubHistory"]);
  return true;
}

export async function getEmailStats() {
  const data = await getCatalogRaw(true);
  return data.emailStats || {};
}

export async function getRestockAlerts() {
  const data = await getCatalogRaw(true);
  return data.restockAlerts || {};
}

export async function clearRestockAlerts(slug) {
  const s = String(slug || "").trim();
  if (!s) return false;
  const data = await getCatalogRaw(true);
  if (data.restockAlerts && data.restockAlerts[s]) {
    delete data.restockAlerts[s];
    await persistCatalog(data, ["restockAlerts"]);
  }
  return true;
}

export async function setStock(variantId, value) {
  const map = await getStockMap();
  if (value === null || value === "" || value === undefined) {
    delete map[variantId]; // repasse en "non suivi"
  } else {
    map[variantId] = Math.max(0, parseInt(value, 10) || 0);
  }
  await persist(map);
  return map;
}

// Ajoute des quantités (réception d'un achat fournisseur) en UNE écriture.
// items : [{ stockId, qty }]. Une variante « non suivie » devient suivie.
export async function adjustStockMany(items) {
  const map = await getStockMap();
  const applied = [];
  for (const it of items || []) {
    const id = String(it?.stockId || "").trim();
    const qty = parseInt(it?.qty, 10) || 0;
    if (!id || !qty) continue;
    const before = typeof map[id] === "number" ? map[id] : 0;
    map[id] = Math.max(0, before + qty);
    applied.push({ stockId: id, before, after: map[id], qty });
  }
  if (applied.length) await persist(map);
  return applied;
}

// =============================================================================
// ACHATS FOURNISSEURS (factures importées → stock) : historique, section `purchases`.
// =============================================================================
const PURCHASES_KEEP = 200;
export async function getPurchases() {
  const data = await getCatalogRaw(true);
  return Array.isArray(data.purchases) ? data.purchases : [];
}
export async function addPurchase(rec) {
  const data = await getCatalogRaw(true);
  const list = Array.isArray(data.purchases) ? data.purchases : [];
  const item = { id: "ach_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now(), ...rec };
  data.purchases = [item, ...list].slice(0, PURCHASES_KEEP);
  await persistCatalog(data, ["purchases"]);
  return item;
}

// items : [{ variantId, qty }]
export async function decrementMany(items) {
  const map = await getStockMap();
  let changed = false;
  for (const it of items || []) {
    if (typeof map[it.variantId] === "number") {
      map[it.variantId] = Math.max(0, map[it.variantId] - (parseInt(it.qty, 10) || 1));
      changed = true;
    }
  }
  if (changed) await persist(map);
  return map;
}

// Renvoie true si TOUTES les variantes suivies du produit sont à 0 (rupture).
// Un produit sans aucun stock suivi n'est jamais "en rupture" (stock illimité).
export function productSoldOut(product, stockMap) {
  if (!product || !Array.isArray(product.variants) || !stockMap) return false;
  const tracked = product.variants
    .map((v) => stockMap[v.stockId || v.id])
    .filter((s) => typeof s === "number");
  if (tracked.length === 0) return false; // aucune variante suivie → pas de rupture
  return tracked.every((s) => s <= 0);
}

export function isAdmin(req) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

// --- Photos personnalisées par produit (ajoutées depuis l'admin) -----------
const CATALOG_KEY = "catalog";
const FS_SECTION_PREFIX = "catalog__"; // mode Firestore : un document par section
let catalogMemory = {};

// fresh = true : ignore le cache (60 s) et relit la base — OBLIGATOIRE avant
// toute écriture « lecture-modification-écriture » sensible (anti-doublon…),
// sinon on repart d'une copie périmée et on écrase ce qu'un autre serveur a
// écrit entre-temps (bug du 25/08/2026 : e-mail d'avis envoyé 3 fois).
async function getCatalogRaw(fresh = false) {
  if (useFirestore()) {
    if (!fresh && fsCache.catalog && Date.now() - fsCache.catalogAt < FS_CACHE_TTL) return cacheCopy(fsCache.catalog);
    const db = getFirestoreDb();
    if (!db) return catalogMemory;
    try {
      const snap = await db.collection(FS_COLLECTION).get();
      const data = {};
      for (const doc of snap.docs) {
        if (!doc.id.startsWith(FS_SECTION_PREFIX)) continue;
        const section = doc.id.slice(FS_SECTION_PREFIX.length);
        try {
          const v = JSON.parse(doc.data()?.json || "null");
          if (v !== null && v !== undefined) data[section] = v;
        } catch {}
      }
      fsCache.catalog = cacheCopy(data);
      fsCache.catalogAt = Date.now();
      return data;
    } catch (e) {
      console.error("Firestore lecture catalogue:", e.message);
      return catalogMemory;
    }
  }
  const store = await getStoreSafe();
  if (store) {
    try {
      return (await store.get(CATALOG_KEY, { type: "json" })) || {};
    } catch {
      return catalogMemory;
    }
  }
  return catalogMemory;
}

// { slug: [url, url, ...] }
export async function getImageOverrides() {
  const data = await getCatalogRaw();
  return data.images || {};
}

export async function setProductImages(slug, images) {
  const data = await getCatalogRaw();
  data.images = data.images || {};
  const clean = (images || []).map((u) => String(u).trim()).filter(Boolean);
  if (clean.length) data.images[slug] = clean;
  else delete data.images[slug];
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.setJSON(CATALOG_KEY, data);
      return data.images;
    } catch {
      // bascule mémoire
    }
  }
  catalogMemory = data;
  return data.images;
}

// --- Promotions (prix barré) : { variantId: prixPromo } ---------------------
export async function getPromos() {
  const data = await getCatalogRaw();
  return data.promos || {};
}

export async function setPromo(variantId, salePrice) {
  const data = await getCatalogRaw();
  data.promos = data.promos || {};
  if (salePrice === null || salePrice === "" || salePrice === undefined) {
    delete data.promos[variantId];
  } else {
    data.promos[variantId] = Math.max(0, Math.round(parseFloat(salePrice) * 100) / 100);
  }
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.setJSON(CATALOG_KEY, data);
      return data.promos;
    } catch {
      // bascule mémoire
    }
  }
  catalogMemory = data;
  return data.promos;
}

// Applique plusieurs promos en une seule lecture/écriture (rapide, pas de délai dépassé).
export async function setPromosMany(updates) {
  const data = await getCatalogRaw();
  data.promos = data.promos || {};
  for (const u of updates || []) {
    const sp = u.salePrice;
    if (sp === null || sp === "" || sp === undefined) {
      delete data.promos[u.variantId];
    } else {
      data.promos[u.variantId] = Math.max(0, Math.round(parseFloat(sp) * 100) / 100);
    }
  }
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.setJSON(CATALOG_KEY, data);
      return data.promos;
    } catch {
      // bascule mémoire
    }
  }
  catalogMemory = data;
  return data.promos;
}

// --- Modifications de produits faites depuis l'admin -----------------------
// overrides : { slug: { name, tagline, title, descriptionHtml, category,
//                       subcategory, type, hidden, prices:{variantId:nb} } }
export async function getProductOverrides() {
  const data = await getCatalogRaw();
  return data.overrides || {};
}

// Taxonomie réglée depuis l'admin : { categories:[{slug,label,short}],
// subcategories:{cat:[{slug,label}]}, productOrder:{cat:[slug,...]} }.
// Vide = on utilise la taxonomie du code (products.js) en repli.
export async function getTaxonomy() {
  const data = await getCatalogRaw();
  return data.taxonomy || {};
}

export async function saveTaxonomy(next) {
  const data = await getCatalogRaw();
  data.taxonomy = next && typeof next === "object" ? next : {};
  await persistCatalog(data);
  return data.taxonomy;
}

export async function setProductOverride(slug, patch) {
  const data = await getCatalogRaw();
  data.overrides = data.overrides || {};
  const cur = data.overrides[slug] || {};
  const next = { ...cur, ...patch };
  Object.keys(next).forEach((k) => {
    if (next[k] === "" || next[k] === null || next[k] === undefined) delete next[k];
  });
  if (Object.keys(next).length === 0) delete data.overrides[slug];
  else data.overrides[slug] = next;
  await persistCatalog(data);
  return data.overrides[slug] || {};
}

// Efface TOUTES les modifications admin d'un produit (revient au code) +
// son prix promo. Sert quand une vieille modif bloque un changement du code.
export async function resetProductToCode(slug) {
  const data = await getCatalogRaw();
  if (data.overrides) delete data.overrides[slug];
  // on retire aussi les éventuels prix promo liés à ce produit (par variante)
  await persistCatalog(data);
  return true;
}

// Enregistre en UNE seule écriture : les modifications produit (override) ET
// les prix promo des variantes. Évite que deux écritures successives sur le
// même stockage (cohérence différée) ne s'écrasent l'une l'autre.
export async function saveProductEditAtomic(slug, overridePatch, promoUpdates) {
  const data = await getCatalogRaw();
  // 1) Override produit (nom, prix, etc.)
  data.overrides = data.overrides || {};
  const cur = data.overrides[slug] || {};
  const next = { ...cur, ...overridePatch };
  Object.keys(next).forEach((k) => {
    if (next[k] === "" || next[k] === null || next[k] === undefined) delete next[k];
  });
  if (Object.keys(next).length === 0) delete data.overrides[slug];
  else data.overrides[slug] = next;
  // 2) Prix promo des variantes (remise en %)
  if (Array.isArray(promoUpdates)) {
    data.promos = data.promos || {};
    for (const u of promoUpdates) {
      if (typeof u.salePrice === "number") data.promos[u.variantId] = u.salePrice;
      else delete data.promos[u.variantId];
    }
  }
  await persistCatalog(data);
  return data.overrides[slug] || {};
}

// Efface TOUS les prix enregistrés à la main (overrides) en une seule écriture,
// pour revenir aux prix du catalogue (code). Évite les écritures multiples qui
// se chevauchent sur le stockage Netlify (cohérence différée).
export async function clearAllPriceOverrides() {
  const data = await getCatalogRaw();
  const overrides = data.overrides || {};
  let count = 0;
  for (const slug of Object.keys(overrides)) {
    if (overrides[slug] && overrides[slug].prices) {
      delete overrides[slug].prices;
      count += 1;
      if (Object.keys(overrides[slug]).length === 0) delete overrides[slug];
    }
  }
  data.overrides = overrides;
  await persistCatalog(data);
  return count;
}

// --- BAT / Discussion par commande (validation avant gravure) --------------
// Blobs : data.bat = { [orderId]: { token, status, customerEmail, customerName,
// ref, messages: [{ from:"atelier"|"cliente", text, image, decision, at }] } }
function newBatToken() {
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 24);
}

export async function getBatThread(orderId) {
  const data = await getCatalogRaw();
  return (data.bat || {})[orderId] || null;
}

export async function getBatThreadByToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const data = await getCatalogRaw();
  const bat = data.bat || {};
  for (const id of Object.keys(bat)) {
    if (bat[id]?.token === t) return { orderId: id, ...bat[id] };
  }
  return null;
}

// Message de l'atelier (aperçu/texte). Crée le fil si besoin. Écriture unique.
export async function batAtelierMessage(orderId, info = {}) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  const data = await getCatalogRaw(true);
  data.bat = data.bat || {};
  const th = data.bat[id] || { token: newBatToken(), status: "en_attente", ref: info.ref || "", messages: [] };
  if (info.customerEmail) th.customerEmail = info.customerEmail;
  if (info.customerName) th.customerName = info.customerName;
  if (info.ref) th.ref = info.ref;
  th.messages.push({ from: "atelier", text: (info.text || "").toString(), image: (info.image || "").toString(), at: Number(info.at) || Date.now() });
  // Un simple message de suivi (réponse validée par le gérant) ne remet pas le
  // fil « en attente de validation » : seul un aperçu/BAT le fait.
  if (!info.keepStatus) th.status = "en_attente";
  th.clientUnread = false; // on répond → plus de « non lu »
  th.updatedAt = Date.now();
  data.bat[id] = th;
  await persistCatalog(data, ["bat"]);
  return th;
}

// Importe des réponses reçues par e-mail (Gmail) dans le fil d'aperçu d'une
// commande. Dédoublonnage par identifiant Gmail (jamais deux fois le même mail).
// msgs = [{ gmailId, text, at }]. Écriture unique si au moins un ajout.
export async function batImportEmails(orderId, msgs = []) {
  const id = String(orderId || "").trim();
  if (!id || !Array.isArray(msgs) || !msgs.length) return 0;
  const data = await getCatalogRaw(true);
  const th = (data.bat || {})[id];
  if (!th) return 0;
  th.importedGmailIds = th.importedGmailIds || [];
  let added = 0;
  for (const m of msgs) {
    const gid = String(m?.gmailId || "").trim();
    if (!gid || th.importedGmailIds.includes(gid)) continue;
    const msg = { from: "cliente", text: String(m?.text || "").trim(), at: Number(m?.at) || Date.now(), viaEmail: true, gmailId: gid };
    if (m?.decision === "valide" || m?.decision === "modif") msg.decision = m.decision;
    th.messages.push(msg);
    th.importedGmailIds.push(gid);
    if (msg.decision === "valide") th.status = "valide";
    added++;
  }
  if (added) {
    th.status = th.status === "valide" ? "valide" : "modif_demandee";
    th.clientUnread = true; // pastille « nouvelle réponse » sur la commande
    th.updatedAt = Date.now();
    data.bat[id] = th;
    await persistCatalog(data, ["bat"]);
  }
  return added;
}

// Crée le fil de communication d'une commande s'il n'existe pas encore (sans
// message) : sert quand une cliente écrit AVANT qu'on lui ait envoyé quoi que ce
// soit — son e-mail doit quand même être tracé dans sa commande.
export async function ensureCommThread(orderId, info = {}) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  const data = await getCatalogRaw(true);
  data.bat = data.bat || {};
  if (data.bat[id]) return data.bat[id];
  const th = { token: newBatToken(), status: "discussion", ref: info.ref || "", messages: [], importedGmailIds: [], updatedAt: Date.now() };
  if (info.customerEmail) th.customerEmail = info.customerEmail;
  if (info.customerName) th.customerName = info.customerName;
  data.bat[id] = th;
  await persistCatalog(data, ["bat"]);
  return th;
}

// -----------------------------------------------------------------------------
// BOÎTE MAIL SURVEILLÉE : mémoire des e-mails déjà traités par l'assistant
// (section `inboxSeen`), pour ne jamais préparer deux fois la même réponse.
// -----------------------------------------------------------------------------
const INBOX_KEEP = 600;
export async function getInboxState() {
  const data = await getCatalogRaw(true);
  const st = data.inboxSeen || {};
  return { ids: st.ids || {}, lastRun: Number(st.lastRun) || 0, lastResult: st.lastResult || null };
}
export async function saveInboxState({ ids, lastRun, lastResult }) {
  const data = await getCatalogRaw(true);
  const cur = data.inboxSeen || {};
  const merged = { ...(cur.ids || {}), ...(ids || {}) };
  // On garde les plus récents seulement.
  const keys = Object.keys(merged).sort((a, b) => (merged[b] || 0) - (merged[a] || 0)).slice(0, INBOX_KEEP);
  const kept = {}; for (const k of keys) kept[k] = merged[k];
  data.inboxSeen = { ids: kept, lastRun: Number(lastRun) || cur.lastRun || 0, lastResult: lastResult || cur.lastResult || null };
  await persistCatalog(data, ["inboxSeen"]);
  return data.inboxSeen;
}

// Importe dans le fil d'une commande des messages ENVOYÉS par nous par e-mail
// (Gmail « envoyés », réponses faites à la main). Dédoublonnage par id Gmail.
export async function batImportOutgoing(orderId, msgs = []) {
  const id = String(orderId || "").trim();
  if (!id || !Array.isArray(msgs) || !msgs.length) return 0;
  const data = await getCatalogRaw(true);
  const th = (data.bat || {})[id];
  if (!th) return 0;
  th.importedGmailIds = th.importedGmailIds || [];
  let added = 0;
  for (const m of msgs) {
    const gid = String(m?.gmailId || "").trim();
    if (!gid || th.importedGmailIds.includes(gid)) continue;
    th.messages.push({ from: "atelier", text: String(m?.text || "").trim(), at: Number(m?.at) || Date.now(), viaEmail: true, gmailId: gid });
    th.importedGmailIds.push(gid);
    added++;
  }
  if (added) {
    th.messages.sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
    th.updatedAt = Date.now();
    data.bat[id] = th;
    await persistCatalog(data, ["bat"]);
  }
  return added;
}

// =============================================================================
// DOSSIER DE COMMUNICATION PAR CLIENTE (section `comms`, clé = e-mail) :
// TOUT ce qui est échangé (e-mails reçus, e-mails envoyés — par le site OU à la
// main depuis Gmail —, formulaire de contact) est rangé ici, avec ou sans
// commande. Le fil de la commande garde en plus ce qui la concerne.
// message = { id, from: "cliente"|"nous", at, text, subject, via, orderId, orderRef, gmailId }
// =============================================================================
const COMMS_PER_CLIENT = 300;
const COMMS_CLIENTS_MAX = 3000;
export async function logComm({ email, name = "", from, text, subject = "", at = 0, via = "", orderId = "", orderRef = "", gmailId = "" }) {
  const e = normEmail(email);
  if (!validEmail(e) || !String(text || "").trim()) return null;
  const data = await getCatalogRaw(true);
  data.comms = data.comms || {};
  const dossier = data.comms[e] || { name: "", messages: [] };
  if (name && !dossier.name) dossier.name = String(name).slice(0, 120);
  const gid = String(gmailId || "").trim();
  if (gid && dossier.messages.some((m) => m.gmailId === gid)) return null; // déjà rangé
  const msg = {
    id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    from: from === "nous" ? "nous" : "cliente",
    at: Number(at) || Date.now(),
    text: String(text).slice(0, 6000),
    subject: String(subject || "").slice(0, 200),
    via: String(via || "").slice(0, 30),
    orderId: String(orderId || "").slice(0, 80), orderRef: String(orderRef || "").slice(0, 40),
    gmailId: gid.slice(0, 80),
  };
  dossier.messages.push(msg);
  dossier.messages.sort((a, b) => (a.at || 0) - (b.at || 0));
  if (dossier.messages.length > COMMS_PER_CLIENT) dossier.messages = dossier.messages.slice(-COMMS_PER_CLIENT);
  dossier.updatedAt = Date.now();
  data.comms[e] = dossier;
  const keys = Object.keys(data.comms);
  if (keys.length > COMMS_CLIENTS_MAX) {
    keys.sort((a, b) => (data.comms[a].updatedAt || 0) - (data.comms[b].updatedAt || 0));
    for (const k of keys.slice(0, keys.length - COMMS_CLIENTS_MAX)) delete data.comms[k];
  }
  await persistCatalog(data, ["comms"]);
  return msg;
}
export async function getCommsFor(email) {
  const e = normEmail(email);
  const data = await getCatalogRaw(true);
  const d = (data.comms || {})[e];
  return d ? { name: d.name || "", messages: d.messages || [], updatedAt: d.updatedAt || 0 } : { name: "", messages: [], updatedAt: 0 };
}
// Aperçu léger pour le CRM : nombre de messages + date du dernier, par e-mail.
export async function getCommsMeta() {
  const data = await getCatalogRaw();
  const out = {};
  for (const [e, d] of Object.entries(data.comms || {})) {
    const last = (d.messages || [])[d.messages.length - 1];
    out[e] = { count: (d.messages || []).length, lastAt: last?.at || 0, lastFrom: last?.from || "" };
  }
  return out;
}

// Métadonnées légères de tous les fils d'aperçu (pour la vérification globale
// des nouvelles réponses + les pastilles côté Commandes).
export async function getBatThreadsMeta() {
  const data = await getCatalogRaw();
  const bat = data.bat || {};
  return Object.keys(bat).map((orderId) => {
    const th = bat[orderId] || {};
    const msgs = th.messages || [];
    const lastAtelierAt = msgs
      .filter((m) => m.from === "atelier")
      .reduce((mx, m) => Math.max(mx, Number(m.at) || 0), 0);
    // Dernier message de la cliente (pour l'aperçu dans le widget).
    const lastClient = [...msgs].reverse().find((m) => m.from === "cliente") || null;
    return {
      orderId,
      customerEmail: th.customerEmail || "",
      customerName: th.customerName || "",
      ref: th.ref || "",
      status: th.status || "",
      lastAtelierAt,
      lastClientText: lastClient ? String(lastClient.text || "").trim() : "",
      lastClientAt: lastClient ? (Number(lastClient.at) || 0) : 0,
      importedGmailIds: th.importedGmailIds || [],
      clientUnread: Boolean(th.clientUnread),
    };
  });
}

// Marque le fil d'une commande comme lu (retire la pastille). Écriture unique.
export async function markBatRead(orderId) {
  const id = String(orderId || "").trim();
  if (!id) return false;
  const data = await getCatalogRaw(true);
  const th = (data.bat || {})[id];
  if (th && th.clientUnread) {
    th.clientUnread = false;
    data.bat[id] = th;
    await persistCatalog(data, ["bat"]);
  }
  return true;
}

// Journalise un e-mail ENVOYÉ à la cliente dans le fil de sa commande (suivi de
// tous les messages). Léger : n'ajoute qu'une entrée « atelier » et NE TOUCHE PAS
// au statut du BAT ni à la pastille « non lu » (ce n'est qu'un journal d'envoi).
// Crée le fil s'il n'existe pas (statut vide → pas de faux « en attente »).
export async function logOrderEmail(orderId, { subject = "", text = "", customerEmail = "", customerName = "", ref = "" } = {}) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  const data = await getCatalogRaw();
  data.bat = data.bat || {};
  const th = data.bat[id] || { token: newBatToken(), status: "", ref: ref || "", messages: [] };
  if (customerEmail && !th.customerEmail) th.customerEmail = customerEmail;
  if (customerName && !th.customerName) th.customerName = customerName;
  if (ref && !th.ref) th.ref = ref;
  const body = [subject ? `« ${subject} »` : "", (text || "").toString()].filter(Boolean).join("\n");
  th.messages.push({ from: "atelier", text: `📧 E-mail envoyé ${body}`.trim(), at: Date.now(), viaEmail: true, kind: "log" });
  th.updatedAt = Date.now();
  data.bat[id] = th;
  await persistCatalog(data);
  return th;
}

// =============================================================================
// MESSAGES PROGRAMMÉS (file d'attente) + REGISTRE anti-doublon des règles auto.
// Stockés dans le blob catalogue : data.scheduled = [ {id,to,name,subject,body,
// sendAt,createdAt,sent,sentAt,error,source,orderId} ], data.autoSent = {ruleId:{orderId:true}}.
// =============================================================================
function newId(p) { return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export async function getScheduledEmails() {
  const data = await getCatalogRaw();
  return data.scheduled || [];
}

export async function addScheduledEmail({ to, name, subject, body, sendAt, source, orderId }) {
  const data = await getCatalogRaw();
  data.scheduled = data.scheduled || [];
  const item = {
    id: newId("sch_"),
    to: String(to || "").trim(),
    name: String(name || "").trim(),
    subject: String(subject || "").slice(0, 200),
    body: String(body || "").slice(0, 6000),
    sendAt: Number(sendAt) || Date.now(),
    createdAt: Date.now(),
    sent: false, sentAt: 0, error: "",
    source: source || "manuel",
    orderId: orderId || "",
  };
  data.scheduled.push(item);
  // On garde la file raisonnable (200 derniers).
  if (data.scheduled.length > 200) data.scheduled = data.scheduled.slice(-200);
  await persistCatalog(data);
  return item;
}

export async function cancelScheduledEmail(id) {
  const data = await getCatalogRaw();
  const before = (data.scheduled || []).length;
  data.scheduled = (data.scheduled || []).filter((s) => s.id !== id);
  if (data.scheduled.length !== before) await persistCatalog(data);
  return true;
}

export async function markScheduledSent(id, { ok, error } = {}) {
  const data = await getCatalogRaw();
  const s = (data.scheduled || []).find((x) => x.id === id);
  if (s) {
    s.sent = Boolean(ok);
    s.sentAt = Date.now();
    s.error = ok ? "" : String(error || "").slice(0, 200);
    await persistCatalog(data);
  }
  return s || null;
}

// Registre anti-doublon des règles automatiques (une règle ne s'envoie qu'une
// fois par commande).
export async function hasAutoSent(ruleId, orderId) {
  const data = await getCatalogRaw(true); // lecture FRAÎCHE : un cache périmé = e-mail en double
  return Boolean(data.autoSent?.[ruleId]?.[orderId]);
}

export async function markAutoSent(ruleId, orderId) {
  const data = await getCatalogRaw(true);
  data.autoSent = data.autoSent || {};
  data.autoSent[ruleId] = data.autoSent[ruleId] || {};
  data.autoSent[ruleId][orderId] = true;
  await persistCatalog(data, ["autoSent"]);
  return true;
}

// Efface complètement le fil / la conversation d'aperçu d'une commande
// (permet de « recommencer à zéro »). Écriture unique.
export async function resetBatThread(orderId) {
  const id = String(orderId || "").trim();
  if (!id) return false;
  const data = await getCatalogRaw(true);
  if (data.bat && data.bat[id]) {
    delete data.bat[id];
    await persistCatalog(data, ["bat"]);
  }
  return true;
}

// Réponse de la cliente (via le lien sécurisé). Écriture unique.
export async function batCustomerMessage(token, { text, decision } = {}) {
  const t = String(token || "").trim();
  if (!t) return null;
  const data = await getCatalogRaw();
  const bat = data.bat || {};
  const id = Object.keys(bat).find((k) => bat[k]?.token === t);
  if (!id) return null;
  const th = bat[id];
  const dec = decision === "valide" ? "valide" : decision === "modif" ? "modif" : "";
  th.messages.push({ from: "cliente", text: (text || "").toString(), decision: dec, at: Date.now() });
  if (dec === "valide") th.status = "valide";
  else if (dec === "modif") th.status = "modif_demandee";
  th.clientUnread = true; // pastille « nouvelle réponse » sur la commande
  th.updatedAt = Date.now();
  data.bat[id] = th;
  await persistCatalog(data);
  return { orderId: id, ...th };
}

// --- Produits créés depuis l'admin (nouveaux produits) ---------------------
export async function getCustomProducts() {
  const data = await getCatalogRaw();
  return data.custom || [];
}

export async function saveCustomProduct(product) {
  const data = await getCatalogRaw();
  data.custom = data.custom || [];
  const i = data.custom.findIndex((p) => p.slug === product.slug);
  if (i >= 0) data.custom[i] = product;
  else data.custom.push(product);
  await persistCatalog(data);
  return product;
}

export async function deleteCustomProduct(slug) {
  const data = await getCatalogRaw();
  data.custom = (data.custom || []).filter((p) => p.slug !== slug);
  await persistCatalog(data);
  return true;
}

// --- Fichiers 3D (.glb / .gltf) --------------------------------------------
// Binaire, peut être lourd. Servis via /api/model3d/<id>.
//   - Mode Netlify : Netlify Blobs (store "niv-models").
//   - Mode Firestore : Firebase Storage (dossier models3d/).
const MODEL_STORE = "niv-models";
async function getModelStore() {
  if (useFirestore()) return null;
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(MODEL_STORE);
  } catch {
    return null;
  }
}

export async function saveModelFile(buffer, contentType) {
  const id = "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  if (useFirestore()) {
    const bucket = getStorageBucketSafe();
    if (!bucket) return null;
    try {
      await bucket.file("models3d/" + id).save(Buffer.from(buffer), {
        contentType: contentType || "model/gltf-binary",
        resumable: false,
      });
      return id;
    } catch (e) {
      console.error("Storage 3D écriture:", e.message);
      return null;
    }
  }
  const store = await getModelStore();
  if (!store) return null;
  try {
    await store.set(id, buffer, { metadata: { contentType: contentType || "model/gltf-binary" } });
    return id;
  } catch {
    return null;
  }
}

export async function getModelFile(id) {
  if (useFirestore()) {
    const bucket = getStorageBucketSafe();
    if (!bucket) return null;
    try {
      const file = bucket.file("models3d/" + String(id || ""));
      const [meta] = await file.getMetadata().catch(() => [null]);
      if (!meta) return null;
      const [data] = await file.download();
      return { data, contentType: meta.contentType || "model/gltf-binary" };
    } catch {
      return null;
    }
  }
  const store = await getModelStore();
  if (!store) return null;
  try {
    const res = await store.getWithMetadata(id, { type: "arrayBuffer" });
    if (!res) return null;
    return { data: res.data, contentType: res.metadata?.contentType || "model/gltf-binary" };
  } catch {
    return null;
  }
}

// --- Codes promo (gérés dans l'admin, appliqués au paiement) ---------------
// { CODE: { type: "percent"|"fixed", value } }
// --- Suivi des déclarations URSSAF ------------------------------------------
// La gérante coche « Déclarée » sur un mois dans Gestion → Bénéfices : on
// mémorise la date du clic. Sert à afficher automatiquement ce qu'il RESTE à
// déclarer. data.urssafDeclared = { "2026-07": "2026-08-18T…" }.
export async function getUrssafDeclared() {
  const data = await getCatalogRaw();
  return data.urssafDeclared || {};
}
export async function setUrssafDeclared(month, on) {
  if (!/^\d{4}-\d{2}$/.test(month || "")) return null;
  const data = await getCatalogRaw();
  data.urssafDeclared = data.urssafDeclared || {};
  if (on) data.urssafDeclared[month] = new Date().toISOString();
  else delete data.urssafDeclared[month];
  await persistCatalog(data);
  return data.urssafDeclared;
}

export async function getPromoCodes() {
  const data = await getCatalogRaw();
  return data.promoCodes || {};
}
export async function setPromoCode(code, def) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return false;
  const data = await getCatalogRaw();
  data.promoCodes = data.promoCodes || {};
  const prev = data.promoCodes[c] || {};
  // Durée de validité (jours) : 0 / vide = illimité. Si fournie, on (re)calcule
  // la date d'expiration à partir de maintenant.
  const daysGiven = def?.days != null && def?.days !== "";
  const days = daysGiven ? Math.max(0, Math.floor(Number(def.days) || 0)) : (prev.days || 0);
  const expiresAt = daysGiven ? (days > 0 ? Date.now() + days * 86400000 : 0) : (prev.expiresAt || 0);
  data.promoCodes[c] = {
    type: def?.type === "fixed" ? "fixed" : "percent",
    value: Math.max(0, Number(def?.value) || 0),
    // Affiliation / ambassadeur (optionnel) :
    ambassador: def?.ambassador != null ? String(def.ambassador).slice(0, 60) : (prev.ambassador || ""),
    commission: def?.commission != null ? Math.max(0, Math.min(100, Number(def.commission) || 0)) : (prev.commission || 0),
    reusable: def?.reusable != null ? Boolean(def.reusable) : Boolean(prev.reusable),
    days, expiresAt,
  };
  await persistCatalog(data);
  return data.promoCodes; // version à jour (évite une relecture parfois en retard)
}
// --- Code de BIENVENUE : création automatique ------------------------------
// Le code de bienvenue (pop-up d'inscription + e-mail « −10 % ») n'était qu'un
// TEXTE d'affichage : il fallait le recréer À LA MAIN dans Promotions, sinon il
// était refusé au paiement (« code non valide ») alors qu'on l'avait promis par
// e-mail. On l'enregistre donc automatiquement comme VRAI code promo.
// Sûr : si le code existe déjà, on n'y touche pas (les réglages faits à la main
// dans Promotions — valeur, durée, réutilisable — sont toujours prioritaires).
function remiseDepuisTexte(texte) {
  const t = String(texte || "");
  const pourcent = /(\d+(?:[.,]\d+)?)\s*%/.exec(t);
  if (pourcent) return { type: "percent", value: Number(pourcent[1].replace(",", ".")) };
  const euros = /(\d+(?:[.,]\d+)?)\s*€/.exec(t);
  if (euros) return { type: "fixed", value: Number(euros[1].replace(",", ".")) };
  return { type: "percent", value: 10 }; // valeur par défaut = celle annoncée partout
}

export async function ensureWelcomeCode() {
  try {
    const s = await getSettings();
    const w = s?.welcome || {};
    if (w.enabled === false) return null; // fenêtre de bienvenue désactivée
    const code = String(w.code || "").trim().toUpperCase();
    if (!code) return null;
    const codes = await getPromoCodes();
    if (codes[code]) return code; // déjà créé → on ne modifie rien
    const { type, value } = remiseDepuisTexte(w.text);
    if (!(value > 0)) return null;
    await setPromoCode(code, { type, value });
    return code;
  } catch {
    return null; // ne doit jamais bloquer une inscription ou un paiement
  }
}

// Même problème pour le code de PARRAINAGE (« partagez ce code avec une amie »,
// glissé dans l'e-mail de confirmation quand il est activé) : il n'était jamais
// créé non plus. Il est réutilisable, puisqu'il est fait pour être partagé.
export async function ensureReferralCode() {
  try {
    const s = await getSettings();
    const r = s?.referral || {};
    if (!r.enabled) return null; // parrainage désactivé → aucun code promis
    const code = String(r.code || "").trim().toUpperCase();
    if (!code) return null;
    const codes = await getPromoCodes();
    if (codes[code]) return code; // déjà créé → on ne modifie rien
    const { type, value } = remiseDepuisTexte(r.text);
    if (!(value > 0)) return null;
    await setPromoCode(code, { type, value, reusable: true });
    return code;
  } catch {
    return null;
  }
}

// --- Suivi des commissions ambassadeurs -----------------------------------
// data.codeStats[CODE] = { orders, sales (€), commission (€), paid (€) }
export async function getCodeStats() {
  const data = await getCatalogRaw();
  return data.codeStats || {};
}
// Enregistre une vente réalisée avec un code : incrémente commandes, ventes et
// commission due (au taux du code au moment de la commande).
export async function recordCommission(code, salesEuro) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return;
  const sales = Math.max(0, Number(salesEuro) || 0);
  const data = await getCatalogRaw();
  const pc = (data.promoCodes || {})[c];
  if (!pc || !(Number(pc.commission) > 0)) return; // pas un code ambassadeur → rien
  data.codeStats = data.codeStats || {};
  const s = data.codeStats[c] || { orders: 0, sales: 0, commission: 0, paid: 0 };
  s.orders += 1;
  s.sales = Math.round((s.sales + sales) * 100) / 100;
  s.commission = Math.round((s.commission + sales * pc.commission / 100) * 100) / 100;
  data.codeStats[c] = s;
  await persistCatalog(data);
}
// Marque une commission comme versée (ajoute au total payé).
export async function setCommissionPaid(code, amountEuro) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return {};
  const data = await getCatalogRaw();
  data.codeStats = data.codeStats || {};
  const s = data.codeStats[c] || { orders: 0, sales: 0, commission: 0, paid: 0 };
  s.paid = Math.max(0, Math.round((Number(amountEuro) || 0) * 100) / 100);
  data.codeStats[c] = s;
  await persistCatalog(data);
  return data.codeStats;
}
// Suivi des utilisations d'un code (une seule fois par visiteuse : IP + e-mail).
export async function getCodeUsage() {
  const data = await getCatalogRaw();
  return data.codeUsage || {};
}
export async function hasUsedCode(code, { ip, email } = {}) {
  const u = (await getCodeUsage())[String(code || "").trim().toUpperCase()];
  if (!u) return false;
  if (ip && (u.ips || []).includes(ip)) return true;
  if (email && (u.emails || []).includes(String(email).toLowerCase())) return true;
  return false;
}
export async function recordCodeUsage(code, { ip, email } = {}) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return;
  const data = await getCatalogRaw();
  data.codeUsage = data.codeUsage || {};
  const u = data.codeUsage[c] || { ips: [], emails: [] };
  if (ip && !u.ips.includes(ip)) u.ips.push(ip);
  if (email) { const e = String(email).toLowerCase(); if (!u.emails.includes(e)) u.emails.push(e); }
  data.codeUsage[c] = u;
  await persistCatalog(data);
}

export async function deletePromoCode(code) {
  const data = await getCatalogRaw();
  data.promoCodes = data.promoCodes || {};
  delete data.promoCodes[String(code || "").trim().toUpperCase()];
  await persistCatalog(data);
  return data.promoCodes; // version à jour
}

// --- Avis clients ----------------------------------------------------------
// { slug: [{ id, name, rating, text, date, approved }] }
export async function getReviews() {
  await ensureSeedReviews();
  const data = await getCatalogRaw();
  return data.reviews || {};
}

// Importe UNE SEULE FOIS dans la base les avis semés dans le code (reviewsSeed.js).
// Chaque avis semé porte un `id` stable : on retient les id déjà importés dans
// data.importedReviewSeeds, donc un avis n'est jamais réimporté — même après avoir
// été modifié ou supprimé dans l'admin (il ne « repousse » pas). Une fois importés,
// ce sont de vrais avis en base, modifiables et supprimables depuis Gestion → Avis.
// Sécurité doublon : un avis semé dont le « prénom + texte » existe déjà en base
// (ex. ajouté à la main) n'est pas réinséré, mais son id est quand même marqué importé.
async function ensureSeedReviews() {
  const data = await getCatalogRaw();
  const imported = new Set(data.importedReviewSeeds || []);
  let changed = false;
  data.reviews = data.reviews || {};
  for (const [slug, seeds] of Object.entries(REVIEWS_SEED || {})) {
    for (const s of seeds || []) {
      if (!s || !s.id || imported.has(s.id)) continue;
      const text = String(s.text || "").slice(0, 1000);
      if (text.length < 2) { imported.add(s.id); changed = true; continue; }
      const entry = {
        id: "r_" + s.id,
        name: String(s.name || "").slice(0, 60) || "Cliente",
        rating: Math.min(5, Math.max(1, parseInt(s.rating, 10) || 5)),
        text,
        photo: String(s.photo || "").slice(0, 600),
        date: /^\d{4}-\d{2}-\d{2}/.test(String(s.date || "")) ? new Date(s.date).toISOString() : new Date().toISOString(),
        approved: true,
      };
      const list = data.reviews[slug] || (data.reviews[slug] = []);
      if (!list.some((r) => reviewKey(r) === reviewKey(entry))) list.push(entry);
      imported.add(s.id);
      changed = true;
    }
  }
  if (changed) {
    data.importedReviewSeeds = [...imported];
    await persistCatalog(data);
  }
}

// Résumé des avis approuvés par produit : { slug: { avg, count } }.
export async function getRatingSummaries() {
  const all = await getReviews();
  const out = {};
  for (const slug of Object.keys(all)) {
    const ok = (all[slug] || []).filter((r) => r.approved);
    if (ok.length) {
      out[slug] = { avg: Math.round((ok.reduce((s, r) => s + (r.rating || 0), 0) / ok.length) * 10) / 10, count: ok.length };
    }
  }
  return out;
}
// Signature d'un avis pour repérer les doublons (même nom + même texte).
function reviewKey(r) {
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  return norm(r.name) + "|" + norm(r.text);
}

export async function addReview(slug, review, { approved = false } = {}) {
  const data = await getCatalogRaw();
  data.reviews = data.reviews || {};
  const list = data.reviews[slug] || [];
  // Date personnalisée (avis recopié depuis Instagram/WhatsApp…) sinon aujourd'hui.
  const customDate = /^\d{4}-\d{2}-\d{2}/.test(String(review.date || "")) ? new Date(review.date).toISOString() : "";
  const entry = {
    id: "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: String(review.name || "").slice(0, 60) || "Cliente",
    rating: Math.min(5, Math.max(1, parseInt(review.rating, 10) || 5)),
    text: String(review.text || "").slice(0, 1000),
    photo: String(review.photo || "").slice(0, 600),
    date: customDate || new Date().toISOString(),
    approved: approved === true,
  };
  // Anti-doublon : un avis identique déjà présent (double clic, double envoi) est ignoré.
  if (list.some((r) => reviewKey(r) === reviewKey(entry))) return false;
  list.push(entry);
  data.reviews[slug] = list.slice(-300);
  await persistCatalog(data);
  return true;
}

// Modifie un avis existant (prénom, note, texte, date) — pour retoucher un
// doublon ou corriger une coquille sans le supprimer.
export async function updateReview(slug, id, patch) {
  const data = await getCatalogRaw();
  data.reviews = data.reviews || {};
  const list = data.reviews[slug] || [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  const next = { ...list[idx] };
  if (typeof patch.name === "string" && patch.name.trim()) next.name = patch.name.trim().slice(0, 60);
  if (patch.rating !== undefined) next.rating = Math.min(5, Math.max(1, parseInt(patch.rating, 10) || next.rating));
  if (typeof patch.text === "string" && patch.text.trim().length >= 2) next.text = patch.text.slice(0, 1000);
  if (/^\d{4}-\d{2}-\d{2}/.test(String(patch.date || ""))) next.date = new Date(patch.date).toISOString();
  list[idx] = next;
  data.reviews[slug] = list;
  await persistCatalog(data);
  return true;
}
export async function moderateReview(slug, id, action) {
  const data = await getCatalogRaw();
  data.reviews = data.reviews || {};
  let list = data.reviews[slug] || [];
  if (action === "delete") list = list.filter((r) => r.id !== id);
  else if (action === "approve") list = list.map((r) => (r.id === id ? { ...r, approved: true } : r));
  data.reviews[slug] = list;
  await persistCatalog(data);
  return true;
}

// --- Newsletter (abonnées) -------------------------------------------------
// Renvoie la liste des e-mails abonnés (normalisée) — compatible ancien format
// (tableau de chaînes) ET nouveau format (tableau d'objets {email,date}).
export async function getSubscribers() {
  const data = await getCatalogRaw();
  return (data.subscribers || [])
    .map((s) => (typeof s === "string" ? s : (s && s.email) || ""))
    .filter(Boolean);
}

// Liste détaillée : [{ email, date }] (date "" pour les anciens abonnés).
export async function getSubscribersDetailed() {
  const data = await getCatalogRaw();
  return (data.subscribers || [])
    .map((s) => (typeof s === "string" ? { email: s, date: "" } : { email: (s && s.email) || "", date: (s && s.date) || "" }))
    .filter((x) => x.email);
}

// =============================================================================
// ESPACE CLIENT : cagnotte fidélité (avoir) + jetons de connexion « lien magique ».
// Stocké dans le blob catalogue : data.cagnotte = { email: { balance, history } },
// data.magic = { token: { email, exp } }. N'affecte rien d'existant.
// =============================================================================
const normEmail = (e) => String(e || "").trim().toLowerCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function getCagnotte(email) {
  const e = normEmail(email);
  const data = await getCatalogRaw();
  const c = (data.cagnotte || {})[e];
  const balance = Math.round(((c?.balance) || 0) * 100) / 100;
  const updatedAt = c?.updatedAt || (c?.history?.[0]?.at) || 0;
  // Date d'expiration = dernière activité + 12 mois (uniquement si solde > 0).
  const expiresAt = balance > 0 && updatedAt ? updatedAt + CAGNOTTE_EXPIRY_DAYS * 86400000 : 0;
  return { balance, history: c?.history || [], updatedAt, expiresAt };
}

// Ajoute (crédite) un montant à la cagnotte d'une cliente. Écriture unique.
export async function creditCagnotte(email, amount, reason = "", orderId = "") {
  const e = normEmail(email);
  const amt = Math.round((Number(amount) || 0) * 100) / 100;
  if (!validEmail(e) || amt <= 0) return null;
  const data = await getCatalogRaw(true); // frais : jamais depuis un cache périmé
  data.cagnotte = data.cagnotte || {};
  const c = data.cagnotte[e] || { balance: 0, history: [] };
  // Anti-doublon : ne crédite pas deux fois la même commande pour la même raison.
  if (orderId && (c.history || []).some((h) => h.orderId === orderId && h.reason === reason && h.amount > 0)) {
    return { balance: c.balance };
  }
  c.balance = Math.round((c.balance + amt) * 100) / 100;
  c.history = [{ amount: amt, reason: String(reason).slice(0, 80), orderId: String(orderId), at: Date.now() }, ...(c.history || [])].slice(0, 100);
  c.updatedAt = Date.now(); // toute activité repousse l'expiration (12 mois d'inactivité)
  c.remindedAt = 0;         // nouvelle activité → on pourra re-rappeler plus tard
  data.cagnotte[e] = c;
  await persistCatalog(data, ["cagnotte"]);
  return { balance: c.balance };
}

// Débite (utilise) un montant. Renvoie le montant réellement débité (jamais > solde).
export async function debitCagnotte(email, amount, orderId = "") {
  const e = normEmail(email);
  const want = Math.round((Number(amount) || 0) * 100) / 100;
  if (!validEmail(e) || want <= 0) return 0;
  const data = await getCatalogRaw(true);
  data.cagnotte = data.cagnotte || {};
  const c = data.cagnotte[e] || { balance: 0, history: [] };
  // Anti-double débit : si cette commande a déjà débité la cagnotte (événement
  // Stripe rejoué), on ne débite pas une seconde fois.
  if (orderId && (c.history || []).some((h) => h.orderId === orderId && h.amount < 0)) {
    return 0;
  }
  const used = Math.min(c.balance, want);
  if (used <= 0) return 0;
  c.balance = Math.round((c.balance - used) * 100) / 100;
  c.history = [{ amount: -used, reason: "Utilisé sur une commande", orderId: String(orderId), at: Date.now() }, ...(c.history || [])].slice(0, 100);
  c.updatedAt = Date.now();
  c.remindedAt = 0;
  data.cagnotte[e] = c;
  await persistCatalog(data, ["cagnotte"]);
  return used;
}

// --- Expiration de la cagnotte (12 mois d'inactivité) ----------------------
// Un rappel e-mail est envoyé ~30 jours avant l'expiration (voir /api/cron/cashback).
export const CAGNOTTE_EXPIRY_DAYS = 365;      // expire après 12 mois sans activité
export const CAGNOTTE_REMIND_BEFORE = 30;     // rappel 30 jours avant

// Liste toutes les cagnottes avec un solde > 0 (pour le cron de rappel/expiration).
export async function listCagnottes() {
  const data = await getCatalogRaw();
  const out = [];
  for (const [email, c] of Object.entries(data.cagnotte || {})) {
    const balance = Math.round(((c?.balance) || 0) * 100) / 100;
    if (balance <= 0) continue;
    const lastAt = c?.updatedAt || (c?.history?.[0]?.at) || 0;
    out.push({ email, balance, updatedAt: lastAt, remindedAt: c?.remindedAt || 0 });
  }
  return out;
}

// Note qu'un rappel d'expiration a été envoyé (évite les doublons).
export async function markCagnotteReminded(email) {
  const e = normEmail(email);
  const data = await getCatalogRaw();
  const c = (data.cagnotte || {})[e];
  if (!c) return;
  c.remindedAt = Date.now();
  data.cagnotte[e] = c;
  await persistCatalog(data);
}

// Expire (remet à zéro) la cagnotte d'une cliente inactive depuis trop longtemps.
export async function expireCagnotte(email) {
  const e = normEmail(email);
  const data = await getCatalogRaw();
  const c = (data.cagnotte || {})[e];
  if (!c || !(c.balance > 0)) return null;
  const lost = c.balance;
  c.history = [{ amount: -lost, reason: "Cashback expiré (12 mois)", orderId: "", at: Date.now() }, ...(c.history || [])].slice(0, 100);
  c.balance = 0;
  c.updatedAt = Date.now();
  c.remindedAt = 0;
  data.cagnotte[e] = c;
  await persistCatalog(data);
  return lost;
}

// Jeton de connexion « lien magique » (expire en 20 min). Écriture unique.
export async function createMagicToken(email) {
  const e = normEmail(email);
  if (!validEmail(e)) return null;
  const token = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 28);
  const data = await getCatalogRaw();
  data.magic = data.magic || {};
  // Nettoyage des jetons expirés.
  const now = Date.now();
  for (const t of Object.keys(data.magic)) { if ((data.magic[t]?.exp || 0) < now) delete data.magic[t]; }
  data.magic[token] = { email: e, exp: now + 20 * 60 * 1000 };
  await persistCatalog(data);
  return token;
}

// Valide et consomme un jeton → renvoie l'e-mail (ou null). Usage unique.
export async function consumeMagicToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const data = await getCatalogRaw();
  const rec = (data.magic || {})[t];
  if (!rec || (rec.exp || 0) < Date.now()) return null;
  delete data.magic[t];
  await persistCatalog(data);
  return rec.email;
}
// Anniversaires (opt-in) : { "email": "AAAA-MM-JJ" }. Stockés à part pour ne
// rien casser de la liste d'abonnées existante.
export async function getBirthdays() {
  const data = await getCatalogRaw();
  return data.birthdays || {};
}
export async function setBirthday(email, date) {
  const e = String(email || "").trim().toLowerCase();
  const d = String(date || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const data = await getCatalogRaw();
  data.birthdays = data.birthdays || {};
  data.birthdays[e] = d;
  await persistCatalog(data);
  return true;
}

export async function addSubscriber(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  const data = await getCatalogRaw();
  data.subscribers = data.subscribers || [];
  // Compatible ancien format (chaînes) : on vérifie l'existence sur l'e-mail,
  // et on enregistre le NOUVEL abonné avec sa date d'inscription.
  const exists = data.subscribers.some((s) => (typeof s === "string" ? s : s?.email) === e);
  if (!exists) {
    data.subscribers.push({ email: e, date: new Date().toISOString() });
    await persistCatalog(data);
  }
  return true;
}

// --- Réglages d'apparence (thème) ------------------------------------------
// Tout est optionnel : un champ vide = on garde la valeur par défaut du site.
export async function getSettings() {
  const data = await getCatalogRaw();
  const s = data.settings || {};
  const acc = s.access || {};
  return {
    color: s.color || "",
    fontHeading: s.fontHeading || "",   // police des titres
    fontBody: s.fontBody || "",         // police du texte
    // Accès privé : si "locked", le site demande un code avant d'être visible.
    // Par défaut : site EN LIGNE (public). Il n'est privé que si l'admin l'active explicitement.
    access: {
      locked: acc.locked === true,
      code: (typeof acc.code === "string" && acc.code.trim()) ? acc.code.trim() : "Niro2026",
    },
    announce: { enabled: false, text: "", link: "", ...(s.announce || {}) },
    // Bandeau Soldes animé (dates de début/fin réglables ; s'arrête tout seul).
    salesBanner: { enabled: false, text: "", start: "", end: "", ...(s.salesBanner || {}) },
    // 🏖️ Mode vacances : ÉTEINT par défaut. Quand activé (+ dates), le site
    // annonce le délai partout (bandeau, fiche, panier, e-mail de confirmation)
    // et s'éteint tout seul à la date de fin. `gift` = cadeau offert pendant
    // les congés (message en plus). Voir src/lib/vacation.js.
    vacation: { enabled: false, start: "", end: "", resume: "", text: "", gift: false, giftText: "", ...(s.vacation || {}) },
    hero: { eyebrow: "", title: "", text: "", cta1: "", cta2: "", image: "", ...(s.hero || {}) },
    categories: Array.isArray(s.categories) ? s.categories : [], // 3 cartes [{label,sub,image}]
    atelier: { eyebrow: "", title: "", text1: "", text2: "", image: "", ...(s.atelier || {}) },
    sections: { categories: true, trust: true, featured: true, atelier: true, ...(s.sections || {}) },
    apropos: s.apropos || "", // contenu HTML de la page À propos (vide = défaut)
    // Gestes promis par client [{email, note}] : détectés automatiquement à
    // chaque commande (alerte rouge e-mail + Gestion). Réglés via l'API admin.
    clientNotes: Array.isArray(s.clientNotes) ? s.clientNotes : [],
    // Prix conseillé : % ajouté au-dessus du prix, affiché barré avec un libellé
    // (comparaison honnête « moins cher qu'ailleurs », pas une fausse promo).
    refMarkup: Number(s.refMarkup) || 0,
    // Fenêtre de bienvenue (pop-up inscription + code promo).
    welcome: {
      enabled: s.welcome?.enabled !== false, // active par défaut (sauf si explicitement décochée)
      code: (typeof s.welcome?.code === "string" && s.welcome.code.trim()) ? s.welcome.code.trim() : "BIENVENUE10",
      text: (typeof s.welcome?.text === "string" && s.welcome.text.trim()) ? s.welcome.text.trim() : "−10 % sur votre première commande",
    },
    // Parrainage : DÉSACTIVÉ par défaut (aucune remise tant que tu ne l'actives pas).
    // Si activé, un code à partager est ajouté à l'e-mail de confirmation de commande.
    referral: {
      enabled: s.referral?.enabled === true,
      code: typeof s.referral?.code === "string" ? s.referral.code.trim() : "",
      text: (typeof s.referral?.text === "string" && s.referral.text.trim()) ? s.referral.text.trim() : "−10 % à offrir à une amie",
    },
    // Balises marketing (vides tant que pas configurées dans l'admin).
    metaPixelId: typeof s.metaPixelId === "string" ? s.metaPixelId.trim() : "",
    gaId: typeof s.gaId === "string" ? s.gaId.trim() : "",
    // Code de vérification Google Search Console (balise meta). Se colle dans
    // Gestion → Réglages : Google demande de prouver qu'on possède le site.
    googleVerification: typeof s.googleVerification === "string" ? s.googleVerification.trim() : "",
    // Objectif de chiffre d'affaires mensuel (€) — affiché en jauge dans les stats.
    salesGoal: Number(s.salesGoal) || 0,
    // Cashback fidélité (cagnotte) : % du montant produits crédité après paiement.
    // Défaut 5 %. Bornes 0–20 % (0 = désactivé). Réglable dans l'admin.
    cashbackPercent: (s.cashbackPercent != null && Number.isFinite(Number(s.cashbackPercent)))
      ? Math.max(0, Math.min(20, Number(s.cashbackPercent)))
      : 5,
    // Modèles de message prêts à l'emploi. Par défaut = modèles fournis (la gérante
    // peut les modifier / en ajouter dans Gestion → Messages ; sauvegarde persistante).
    messageTemplates: Array.isArray(s.messageTemplates) ? s.messageTemplates : MESSAGE_TEMPLATES_SEED,
    // Règles d'envoi automatique. Par défaut = règle « avis + cagnotte 2 j après
    // livraison » ACTIVE (le site envoie tout seul). La gérante garde le contrôle
    // total (modifier / désactiver / supprimer dans Gestion → Messages).
    // Fusion : on garde les règles enregistrées ET on ajoute les règles du code
    // absentes (par id) — ainsi une nouvelle règle seed (ex. relance inscription)
    // s'active même si la gérante a déjà enregistré des règles.
    autoRules: Array.isArray(s.autoRules)
      ? [...s.autoRules, ...AUTO_RULES_SEED.filter((r) => r && !s.autoRules.some((x) => x && x.id === r.id))]
      : AUTO_RULES_SEED,
    // Notes CRM par cliente : { "email_minuscule": "note libre" }.
    crmNotes: (s.crmNotes && typeof s.crmNotes === "object") ? s.crmNotes : {},
    crmTags: (s.crmTags && typeof s.crmTags === "object") ? s.crmTags : {},
    // Positions de gravure des couverts enfants (réglées dans /gestion/couverts-reglage).
    couvertsZones: (s.couvertsZones && typeof s.couvertsZones === "object") ? s.couvertsZones : {},
    // Zones de gravure des cristaux (réglées dans /gestion/cristal-reglage).
    crystalZones: (s.crystalZones && typeof s.crystalZones === "object") ? s.crystalZones : {},
    // Gmail connecté ? (vrai/faux seulement — les identifiants ne sont JAMAIS exposés ici).
    gmailConnected: Boolean(s.gmail?.refreshToken),
    // Mode maintenance : si activé, les visiteurs voient une page "en maintenance"
    // (l'administratrice garde l'accès via le code d'accès).
    maintenance: {
      enabled: Boolean(s.maintenance?.enabled),
      message: typeof s.maintenance?.message === "string" ? s.maintenance.message : "",
    },
    // Codes postaux où le retrait en main propre est autorisé (atelier en Val-d'Oise 95).
    // Par défaut : 95 + départements voisins. Modifiable dans l'admin.
    pickupZones: (typeof s.pickupZones === "string" && s.pickupZones.trim())
      ? s.pickupZones
      : "95, 78, 92, 93, 75, 60",
    // Jeton du planificateur « boîte mail surveillée » (/api/cron/inbox?token=…).
    // Généré par Gestion → Équipe d'agents ; ne donne accès à AUCUNE donnée.
    inboxToken: typeof s.inboxToken === "string" ? s.inboxToken : "",
    // Frais de livraison personnalisés (Gestion → Réglages → 🚚 Livraison).
    // Objet vide = tarifs par défaut du code (src/lib/shipping.js).
    shipping: (s.shipping && typeof s.shipping === "object") ? s.shipping : {},
    // Équipe d'agents IA. emailAutoReply : DÉSACTIVÉ par défaut. Quand activé,
    // l'agent e-mail répond seul aux messages simples du formulaire de contact
    // (les cas spéciaux sont toujours remontés à la gérante « à valider »).
    agents: {
      emailAutoReply: s.agents?.emailAutoReply === true,
      // Mode « il prépare, je décide » (demande du gérant, 02/09/2026) : l'agent
      // rédige la réponse, le gérant reçoit une alerte et valide avant envoi.
      // ACTIVÉ par défaut ; il prime sur emailAutoReply. Rien ne part sans clic.
      emailDraft: s.agents?.emailDraft !== false,
      // Bouton flottant « Une question ? » sur le site (formulaire rapide).
      widget: s.agents?.widget !== false,
    },
    // Réseaux sociaux : identifiants pour la publication Instagram (API Meta).
    // Vides tant que la gérante ne les a pas renseignés dans le centre des agents.
    social: {
      igUserId: typeof s.social?.igUserId === "string" ? s.social.igUserId.trim() : "",
      igToken: typeof s.social?.igToken === "string" ? s.social.igToken.trim() : "",
    },
    // Emballages (page Gestion → Packaging).
    // packaging = bibliothèque : [ { id, name, desc, buy, sell, weight, photo } ].
    // productPackaging = attribution par produit : { [slug]: { on, ids, free } }.
    // packagingLive = INTERRUPTEUR MAÎTRE : tant qu'il est false, RIEN ne s'affiche
    //   sur le site (même si des produits sont configurés). Défaut : false.
    // Tant que la gérante n'a rien enregistré, on pré-remplit avec la config de
    // départ (ses prix/règles) pour qu'elle n'ait qu'à ajouter les photos.
    // Emballages VISIBLES sur le site par défaut (demande de la gérante). Elle
    // peut toujours les masquer en enregistrant packagingLive:false dans l'admin.
    packagingLive: s.packagingLive !== false,
    packaging: Array.isArray(s.packaging) ? s.packaging : DEFAULT_PACKAGING,
    // FUSION config de départ + réglages enregistrés : la config du code sert de
    // BASE (donc tout nouveau bijou ajouté à DEFAULT_PRODUCT_PACKAGING reçoit
    // automatiquement son packaging), et les réglages de la gérante l'emportent
    // par produit (ses choix perso sont gardés). Sans cette fusion, un produit
    // ajouté dans le code n'apparaîtrait jamais si elle a déjà enregistré une fois.
    productPackaging: (s.productPackaging && typeof s.productPackaging === "object")
      ? { ...DEFAULT_PRODUCT_PACKAGING, ...s.productPackaging }
      : DEFAULT_PRODUCT_PACKAGING,
    // Dépenses / charges (fournitures d'expédition, cartons, scotch…) pour le
    // bénéfice net (Gestion → Bénéfices).
    expenses: Array.isArray(s.expenses) ? s.expenses : [],
    // Point relais (Boxtal). La CLÉ SECRÈTE n'est JAMAIS renvoyée (seulement
    // hasSecret = true/false). Lecture serveur via getBoxtalCreds().
    boxtal: {
      enabled: s.boxtal?.enabled === true,
      appId: typeof s.boxtal?.appId === "string" ? s.boxtal.appId : "",
      hasSecret: Boolean(s.boxtal?.appSecret),
      pointRelaisPrice: Number.isFinite(Number(s.boxtal?.pointRelaisPrice)) ? Number(s.boxtal.pointRelaisPrice) : 4.9,
    },
  };
}

export async function setSettings(patch) {
  const data = await getCatalogRaw();
  data.settings = { ...(data.settings || {}), ...patch };
  await persistCatalog(data);
  return data.settings;
}

// --- Déclencheur intégré (heartbeat) ---------------------------------------
// Mémorise la dernière exécution de chaque tâche (data.cronState) pour ne les
// relancer qu'à intervalle voulu, même si le site reçoit beaucoup de visites.
// claimJob() pose le nouveau timestamp AVANT d'exécuter (verrou optimiste) :
// deux visites simultanées ne lancent pas la tâche deux fois.
export async function claimJob(key, minIntervalMs) {
  const k = String(key || "");
  if (!k) return false;
  const data = await getCatalogRaw();
  data.cronState = data.cronState || {};
  const last = Number(data.cronState[k]) || 0;
  const now = Date.now();
  if (now - last < minIntervalMs) return false; // trop tôt → on ne relance pas
  data.cronState[k] = now;
  await persistCatalog(data);
  return true;
}

// Identifiants Gmail (agent e-mail) — lecture côté serveur uniquement,
// jamais renvoyés par getSettings() (donc jamais exposés au public).
export async function getGmailCreds() {
  const data = await getCatalogRaw();
  const g = (data.settings || {}).gmail || {};
  return { clientId: g.clientId || "", clientSecret: g.clientSecret || "", refreshToken: g.refreshToken || "", oauthState: g.oauthState || "" };
}

// Met à jour partiellement les infos Gmail (sans écraser le reste).
export async function updateGmail(patch) {
  const data = await getCatalogRaw();
  const cur = (data.settings || {}).gmail || {};
  data.settings = { ...(data.settings || {}), gmail: { ...cur, ...patch } };
  await persistCatalog(data);
  return true;
}

// Clés API Boxtal (point relais) — lecture SERVEUR uniquement (jamais exposées
// par getSettings, qui ne renvoie que hasSecret).
export async function getBoxtalCreds() {
  const data = await getCatalogRaw();
  const b = (data.settings || {}).boxtal || {};
  return { appId: b.appId || "", appSecret: b.appSecret || "" };
}

// Met à jour partiellement les infos Boxtal (sans écraser la clé si non fournie).
export async function updateBoxtal(patch) {
  const data = await getCatalogRaw();
  const cur = (data.settings || {}).boxtal || {};
  const next = { ...cur };
  if (patch.appId !== undefined) next.appId = String(patch.appId || "").trim().slice(0, 200);
  if (patch.appSecret) next.appSecret = String(patch.appSecret).trim().slice(0, 300); // uniquement si fournie
  if (patch.enabled !== undefined) next.enabled = Boolean(patch.enabled);
  if (patch.pointRelaisPrice !== undefined) {
    const p = Number(patch.pointRelaisPrice);
    next.pointRelaisPrice = Number.isFinite(p) && p >= 0 && p <= 100 ? Math.round(p * 100) / 100 : 4.9;
  }
  data.settings = { ...(data.settings || {}), boxtal: next };
  await persistCatalog(data);
  return true;
}

export async function setGmailCreds({ clientId, clientSecret, refreshToken }) {
  return updateGmail({
    clientId: String(clientId || "").trim(),
    clientSecret: String(clientSecret || "").trim(),
    refreshToken: String(refreshToken || "").trim(),
  });
}

// sections (optionnel) : n'écrire QUE ces sections en base (ex. ["bat"]).
// Sans ça, chaque écriture réécrit TOUTES les sections depuis la copie en
// mémoire — si elle est périmée, elle écrase le travail des autres (doublons
// d'e-mails du 25/08/2026). Toute nouvelle écriture ciblée doit passer la liste.
async function persistCatalog(data, sections) {
  if (useFirestore()) {
    const db = getFirestoreDb();
    if (db) {
      try {
        // Écriture en lot (atomique) : un document par section du catalogue.
        const batch = db.batch();
        const at = new Date().toISOString();
        const cles = Array.isArray(sections) && sections.length
          ? sections.filter((s) => s in (data || {}))
          : Object.keys(data || {});
        for (const section of cles) {
          const ref = db.collection(FS_COLLECTION).doc(FS_SECTION_PREFIX + section);
          batch.set(ref, { json: JSON.stringify(data[section]), updatedAt: at });
        }
        await batch.commit();
        fsCache.catalog = cacheCopy(data); // cache à jour immédiatement
        fsCache.catalogAt = Date.now();
        return;
      } catch (e) {
        console.error("Firestore écriture catalogue:", e.message);
      }
    }
    catalogMemory = data;
    return;
  }
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.setJSON(CATALOG_KEY, data);
      return;
    } catch {
      // bascule mémoire
    }
  }
  catalogMemory = data;
}

// --- Export / import complet (migration Netlify → Firebase) ----------------
export async function exportAllData() {
  const [catalog, stockMap] = await Promise.all([getCatalogRaw(), getStockMap()]);
  return { catalog, stock: stockMap, exportedAt: new Date().toISOString() };
}

export async function importAllData({ catalog, stock: stockMap } = {}) {
  let sections = 0;
  if (catalog && typeof catalog === "object") {
    await persistCatalog(catalog);
    sections = Object.keys(catalog).length;
  }
  if (stockMap && typeof stockMap === "object") await persist(stockMap);
  return { sections, stockEntries: stockMap ? Object.keys(stockMap).length : 0 };
}

// Indique quelles intégrations sont configurées (sans révéler les valeurs).
export function getConfigStatus() {
  return {
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    email: Boolean(process.env.RESEND_API_KEY),
    contactEmail: Boolean(process.env.CONTACT_EMAIL),
    photoUpload: Boolean(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    ),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };
}
