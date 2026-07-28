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

async function getCatalogRaw() {
  if (useFirestore()) {
    if (fsCache.catalog && Date.now() - fsCache.catalogAt < FS_CACHE_TTL) return cacheCopy(fsCache.catalog);
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
  const data = await getCatalogRaw();
  data.bat = data.bat || {};
  const th = data.bat[id] || { token: newBatToken(), status: "en_attente", ref: info.ref || "", messages: [] };
  if (info.customerEmail) th.customerEmail = info.customerEmail;
  if (info.customerName) th.customerName = info.customerName;
  if (info.ref) th.ref = info.ref;
  th.messages.push({ from: "atelier", text: (info.text || "").toString(), image: (info.image || "").toString(), at: Date.now() });
  th.status = "en_attente";
  th.clientUnread = false; // on répond → plus de « non lu »
  th.updatedAt = Date.now();
  data.bat[id] = th;
  await persistCatalog(data);
  return th;
}

// Importe des réponses reçues par e-mail (Gmail) dans le fil d'aperçu d'une
// commande. Dédoublonnage par identifiant Gmail (jamais deux fois le même mail).
// msgs = [{ gmailId, text, at }]. Écriture unique si au moins un ajout.
export async function batImportEmails(orderId, msgs = []) {
  const id = String(orderId || "").trim();
  if (!id || !Array.isArray(msgs) || !msgs.length) return 0;
  const data = await getCatalogRaw();
  const th = (data.bat || {})[id];
  if (!th) return 0;
  th.importedGmailIds = th.importedGmailIds || [];
  let added = 0;
  for (const m of msgs) {
    const gid = String(m?.gmailId || "").trim();
    if (!gid || th.importedGmailIds.includes(gid)) continue;
    th.messages.push({ from: "cliente", text: String(m?.text || "").trim(), at: Number(m?.at) || Date.now(), viaEmail: true, gmailId: gid });
    th.importedGmailIds.push(gid);
    added++;
  }
  if (added) {
    th.status = th.status === "valide" ? "valide" : "modif_demandee";
    th.clientUnread = true; // pastille « nouvelle réponse » sur la commande
    th.updatedAt = Date.now();
    data.bat[id] = th;
    await persistCatalog(data);
  }
  return added;
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
  const data = await getCatalogRaw();
  const th = (data.bat || {})[id];
  if (th && th.clientUnread) {
    th.clientUnread = false;
    data.bat[id] = th;
    await persistCatalog(data);
  }
  return true;
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
  const data = await getCatalogRaw();
  return Boolean(data.autoSent?.[ruleId]?.[orderId]);
}

export async function markAutoSent(ruleId, orderId) {
  const data = await getCatalogRaw();
  data.autoSent = data.autoSent || {};
  data.autoSent[ruleId] = data.autoSent[ruleId] || {};
  data.autoSent[ruleId][orderId] = true;
  await persistCatalog(data);
  return true;
}

// Efface complètement le fil / la conversation d'aperçu d'une commande
// (permet de « recommencer à zéro »). Écriture unique.
export async function resetBatThread(orderId) {
  const id = String(orderId || "").trim();
  if (!id) return false;
  const data = await getCatalogRaw();
  if (data.bat && data.bat[id]) {
    delete data.bat[id];
    await persistCatalog(data);
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
  const data = await getCatalogRaw();
  return data.reviews || {};
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
export async function getSubscribers() {
  const data = await getCatalogRaw();
  return data.subscribers || [];
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
  const data = await getCatalogRaw();
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
  await persistCatalog(data);
  return { balance: c.balance };
}

// Débite (utilise) un montant. Renvoie le montant réellement débité (jamais > solde).
export async function debitCagnotte(email, amount, orderId = "") {
  const e = normEmail(email);
  const want = Math.round((Number(amount) || 0) * 100) / 100;
  if (!validEmail(e) || want <= 0) return 0;
  const data = await getCatalogRaw();
  data.cagnotte = data.cagnotte || {};
  const c = data.cagnotte[e] || { balance: 0, history: [] };
  const used = Math.min(c.balance, want);
  if (used <= 0) return 0;
  c.balance = Math.round((c.balance - used) * 100) / 100;
  c.history = [{ amount: -used, reason: "Utilisé sur une commande", orderId: String(orderId), at: Date.now() }, ...(c.history || [])].slice(0, 100);
  c.updatedAt = Date.now();
  c.remindedAt = 0;
  data.cagnotte[e] = c;
  await persistCatalog(data);
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
  if (!data.subscribers.includes(e)) {
    data.subscribers.push(e);
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
    hero: { eyebrow: "", title: "", text: "", cta1: "", cta2: "", image: "", ...(s.hero || {}) },
    categories: Array.isArray(s.categories) ? s.categories : [], // 3 cartes [{label,sub,image}]
    atelier: { eyebrow: "", title: "", text1: "", text2: "", image: "", ...(s.atelier || {}) },
    sections: { categories: true, trust: true, featured: true, atelier: true, ...(s.sections || {}) },
    apropos: s.apropos || "", // contenu HTML de la page À propos (vide = défaut)
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
    // Objectif de chiffre d'affaires mensuel (€) — affiché en jauge dans les stats.
    salesGoal: Number(s.salesGoal) || 0,
    // Cashback fidélité (cagnotte) : % du montant produits crédité après paiement.
    // Défaut 5 %. Bornes 0–20 % (0 = désactivé). Réglable dans l'admin.
    cashbackPercent: (s.cashbackPercent != null && Number.isFinite(Number(s.cashbackPercent)))
      ? Math.max(0, Math.min(20, Number(s.cashbackPercent)))
      : 5,
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
    // Frais de livraison personnalisés (Gestion → Réglages → 🚚 Livraison).
    // Objet vide = tarifs par défaut du code (src/lib/shipping.js).
    shipping: (s.shipping && typeof s.shipping === "object") ? s.shipping : {},
    // Équipe d'agents IA. emailAutoReply : DÉSACTIVÉ par défaut. Quand activé,
    // l'agent e-mail répond seul aux messages simples du formulaire de contact
    // (les cas spéciaux sont toujours remontés à la gérante « à valider »).
    agents: {
      emailAutoReply: s.agents?.emailAutoReply === true,
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
    packagingLive: s.packagingLive === true,
    packaging: Array.isArray(s.packaging) ? s.packaging : DEFAULT_PACKAGING,
    productPackaging: (s.productPackaging && typeof s.productPackaging === "object") ? s.productPackaging : DEFAULT_PRODUCT_PACKAGING,
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

async function persistCatalog(data) {
  if (useFirestore()) {
    const db = getFirestoreDb();
    if (db) {
      try {
        // Écriture en lot (atomique) : un document par section du catalogue.
        const batch = db.batch();
        const at = new Date().toISOString();
        for (const section of Object.keys(data || {})) {
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
