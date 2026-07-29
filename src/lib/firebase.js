// =============================================================================
// Connexion à Firebase (application de gestion Niv Création)
// -----------------------------------------------------------------------------
// Utilise la clé de service (variable d'environnement FIREBASE_SERVICE_ACCOUNT).
// Lecture du stock depuis le doc backup/master (champ niv_catalogue, JSON).
// Écriture des ventes du site dans une collection dédiée "siteOrders"
// (sans toucher aux données de l'appli, pour ne rien casser).
// =============================================================================
import admin from "firebase-admin";

let app = null;
function getApp() {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = typeof raw === "string" ? JSON.parse(raw) : raw;
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
    return app;
  } catch (e) {
    console.error("Firebase init impossible:", e.message);
    return null;
  }
}

export function firebaseReady() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

// Accès direct à Firestore (ou null si la clé n'est pas configurée).
// Utilisé par le stockage du site (stock.js) quand DATA_BACKEND=firestore.
export function getFirestoreDb() {
  const a = getApp();
  return a ? admin.firestore() : null;
}

// Bucket Firebase Storage (fichiers 3D .glb) — nom via FIREBASE_STORAGE_BUCKET,
// sinon déduit du projet (<project_id>.firebasestorage.app).
export function getStorageBucketSafe() {
  const a = getApp();
  if (!a) return null;
  try {
    let pid = null;
    try { pid = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id; } catch {}
    const name = process.env.FIREBASE_STORAGE_BUCKET || (pid ? `${pid}.firebasestorage.app` : null);
    return name ? admin.storage().bucket(name) : null;
  } catch {
    return null;
  }
}

// Diagnostic complet : la clé est-elle présente, lisible, et connectée à la base ?
// Renvoie un objet clair pour la page Réglages (sans révéler la clé).
export async function firebaseDiagnostic() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    return { present: false, parsed: false, connected: false, error: "Variable FIREBASE_SERVICE_ACCOUNT absente." };
  }
  let projectId = null;
  try {
    const sa = typeof raw === "string" ? JSON.parse(raw) : raw;
    projectId = sa.project_id || null;
  } catch (e) {
    return { present: true, parsed: false, connected: false, error: "Clé illisible (JSON invalide) : " + e.message };
  }
  const a = getApp();
  if (!a) {
    return { present: true, parsed: true, connected: false, projectId, error: "Initialisation Firebase impossible (clé refusée)." };
  }
  try {
    // Lecture triviale pour confirmer l'accès réel à la base.
    await admin.firestore().collection("backup").doc("master").get();
    return { present: true, parsed: true, connected: true, projectId, error: null };
  } catch (e) {
    return { present: true, parsed: true, connected: false, projectId, error: "Connexion à la base échouée : " + e.message };
  }
}

// =============================================================================
// STATISTIQUES DE VISITES (compteur intégré, façon Shopify)
// -----------------------------------------------------------------------------
// Collection "siteAnalytics" : un document par jour (id = AAAA-MM-JJ, heure de
// Paris). Compteurs incrémentés à chaque événement (visites, vues produit,
// ajouts panier, paiements, ventes). Aucune donnée personnelle n'est stockée.
// =============================================================================
function parisDate(d = new Date()) {
  // Format AAAA-MM-JJ dans le fuseau de Paris (en-CA produit cet ordre).
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

export async function recordAnalyticsEvent(event, data = {}) {
  const a = getApp();
  if (!a) return false;
  const inc = admin.firestore.FieldValue.increment;
  const date = parisDate();
  const slug = (data.slug || "").toString().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
  const value = Math.max(0, Number(data.value) || 0);
  const update = { date };
  switch (event) {
    case "session": update.sessions = inc(1); break;
    case "pageview": update.pageviews = inc(1); break;
    case "view_item":
      update.viewItem = inc(1);
      if (slug) update.viewsByProduct = { [slug]: inc(1) };
      break;
    case "add_to_cart":
      update.addToCart = inc(1);
      if (slug) update.cartByProduct = { [slug]: inc(1) };
      break;
    case "begin_checkout": update.beginCheckout = inc(1); break;
    case "purchase":
      update.purchase = inc(1);
      update.revenue = inc(value);
      break;
    default: return false;
  }
  try {
    await admin.firestore().collection("siteAnalytics").doc(date).set(update, { merge: true });
    return true;
  } catch (e) {
    console.error("Analytics enregistrement:", e.message);
    return false;
  }
}

// Agrège les N derniers jours pour le tableau de bord admin.
export async function getAnalyticsSummary(days = 30) {
  const a = getApp();
  if (!a) return null;
  const n = Math.min(120, Math.max(1, Number(days) || 30));
  const ids = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    ids.push(parisDate(new Date(now.getTime() - i * 86400000)));
  }
  try {
    const refs = ids.map((id) => admin.firestore().collection("siteAnalytics").doc(id));
    const snaps = await admin.firestore().getAll(...refs);
    const byDate = {};
    for (const s of snaps) if (s.exists) byDate[s.id] = s.data();
    const num = (v) => (typeof v === "number" ? v : 0);
    const series = ids.slice().reverse().map((id) => {
      const d = byDate[id] || {};
      return {
        date: id,
        sessions: num(d.sessions), pageviews: num(d.pageviews),
        viewItem: num(d.viewItem), addToCart: num(d.addToCart),
        beginCheckout: num(d.beginCheckout), purchase: num(d.purchase),
        revenue: num(d.revenue),
      };
    });
    const totals = series.reduce((t, d) => ({
      sessions: t.sessions + d.sessions, pageviews: t.pageviews + d.pageviews,
      viewItem: t.viewItem + d.viewItem, addToCart: t.addToCart + d.addToCart,
      beginCheckout: t.beginCheckout + d.beginCheckout, purchase: t.purchase + d.purchase,
      revenue: t.revenue + d.revenue,
    }), { sessions: 0, pageviews: 0, viewItem: 0, addToCart: 0, beginCheckout: 0, purchase: 0, revenue: 0 });
    const views = {}, carts = {};
    for (const id of ids) {
      const d = byDate[id]; if (!d) continue;
      for (const [k, v] of Object.entries(d.viewsByProduct || {})) views[k] = (views[k] || 0) + num(v);
      for (const [k, v] of Object.entries(d.cartByProduct || {})) carts[k] = (carts[k] || 0) + num(v);
    }
    return { days: n, series, totals, views, carts };
  } catch (e) {
    console.error("Analytics lecture:", e.message);
    return null;
  }
}

// Slug identique à celui de l'appli (pour retrouver la clé produit).
export function productKeySlug(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Renvoie { productKey: qty } depuis l'appli (ou null si indisponible).
export async function getFirebaseStockByKey() {
  const a = getApp();
  if (!a) return null;
  try {
    const doc = await admin.firestore().collection("backup").doc("master").get();
    if (!doc.exists) return null;
    const cat = JSON.parse(doc.data().niv_catalogue || "[]");
    const map = {};
    for (const it of cat) {
      const key = productKeySlug(`${it.name} ${it.var || ""}`);
      map[key] = typeof it.qty === "number" ? it.qty : null;
    }
    return map;
  } catch (e) {
    console.error("Lecture stock Firebase:", e.message);
    return null;
  }
}

// Renvoie { variantId: qty } en reliant chaque variante du site à sa clé
// produit de l'appli (via le nom de fichier photo /produits/<clé>.jpg).
export async function getFirebaseVariantStock(products) {
  const byKey = await getFirebaseStockByKey();
  if (!byKey) return null;
  const out = {};
  for (const p of products) {
    p.variants.forEach((v, i) => {
      const img = p.images?.[i];
      if (!img) return;
      const m = img.match(/\/produits\/(.+)\.[a-zA-Z]+$/);
      if (!m) return;
      const key = m[1];
      if (key in byKey && typeof byKey[key] === "number") out[v.id] = byKey[key];
    });
  }
  return out;
}

// Enregistre une vente du site (collection dédiée, sans risque pour l'appli).
export async function recordSiteOrder(order) {
  const a = getApp();
  if (!a) return false;
  try {
    const ref = await admin.firestore().collection("siteOrders").add({
      ...order,
      status: "a_preparer",
      createdAt: new Date().toISOString(),
    });
    return ref.id; // identifiant de la commande créée (chaîne = toujours "truthy")
  } catch (e) {
    console.error("Enregistrement vente Firebase:", e.message);
    return false;
  }
}

// Renvoie les dernières commandes du site (pour l'admin).
export async function getSiteOrders(max = 300) {
  const a = getApp();
  if (!a) return null;
  try {
    const snap = await admin
      .firestore()
      .collection("siteOrders")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Lecture commandes Firebase:", e.message);
    return null;
  }
}

// Cherche une commande déjà enregistrée pour une session Stripe (anti-doublon).
export async function findSiteOrderBySession(sessionId) {
  const a = getApp();
  if (!a || !sessionId) return null;
  try {
    const snap = await admin.firestore().collection("siteOrders").where("sessionId", "==", sessionId).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) {
    console.error("findSiteOrderBySession:", e.message);
    return null;
  }
}

// Cherche une commande par identifiant de paiement Stripe (couvre aussi les
// anciennes commandes qui n'ont pas de sessionId enregistré).
export async function findSiteOrderByPaymentIntent(paymentIntentId) {
  const a = getApp();
  if (!a || !paymentIntentId) return null;
  try {
    const snap = await admin.firestore().collection("siteOrders").where("paymentIntentId", "==", paymentIntentId).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) {
    console.error("findSiteOrderByPaymentIntent:", e.message);
    return null;
  }
}

// Renvoie une commande précise par son id (pour le remboursement).
export async function getSiteOrder(id) {
  const a = getApp();
  if (!a) return null;
  try {
    const doc = await admin.firestore().collection("siteOrders").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (e) {
    console.error("Lecture commande Firebase:", e.message);
    return null;
  }
}

// Met à jour le statut d'une commande (a_preparer | expediee).
export async function updateSiteOrderStatus(id, status) {
  const a = getApp();
  if (!a) return false;
  try {
    await admin.firestore().collection("siteOrders").doc(id).update({ status });
    return true;
  } catch (e) {
    console.error("MAJ statut commande Firebase:", e.message);
    return false;
  }
}

export async function updateSiteOrder(id, patch) {
  const a = getApp();
  if (!a) return false;
  try {
    await admin.firestore().collection("siteOrders").doc(id).update(patch);
    return true;
  } catch (e) {
    console.error("MAJ commande Firebase:", e.message);
    return false;
  }
}

export async function deleteSiteOrder(id) {
  const a = getApp();
  if (!a) return false;
  try {
    await admin.firestore().collection("siteOrders").doc(id).delete();
    return true;
  } catch (e) {
    console.error("Suppression commande Firebase:", e.message);
    return false;
  }
}

// Réglages détaillés de personnalisation (fiche atelier), liés à une session Stripe.
// Enregistrés à la création du paiement, relus par le webhook pour les joindre à la commande.
export async function saveOrderSpec(sessionId, spec) {
  const a = getApp();
  if (!a || !sessionId) return false;
  try {
    await admin.firestore().collection("orderSpecs").doc(sessionId).set({
      spec,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.error("Enregistrement fiche atelier Firebase:", e.message);
    return false;
  }
}

export async function getOrderSpec(sessionId) {
  const a = getApp();
  if (!a || !sessionId) return null;
  try {
    const doc = await admin.firestore().collection("orderSpecs").doc(sessionId).get();
    return doc.exists ? (doc.data().spec || null) : null;
  } catch (e) {
    console.error("Lecture fiche atelier Firebase:", e.message);
    return null;
  }
}

// La fiche est recopiée dans la commande : on supprime la copie temporaire.
export async function deleteOrderSpec(sessionId) {
  const a = getApp();
  if (!a || !sessionId) return false;
  try {
    await admin.firestore().collection("orderSpecs").doc(sessionId).delete();
    return true;
  } catch { return false; }
}

// --- Devis & Factures ------------------------------------------------------
// Crée un devis ou une facture avec numérotation séquentielle (obligation légale
// pour les factures). Renvoie { id, number }.
export async function createQuote(data) {
  const a = getApp();
  if (!a) return null;
  const db = admin.firestore();
  try {
    const field = data.type === "facture" ? "facture" : "devis";
    const number = await db.runTransaction(async (t) => {
      const ref = db.collection("counters").doc("quotes");
      const snap = await t.get(ref);
      const cur = (snap.exists && snap.data()[field]) || 0;
      const next = cur + 1;
      t.set(ref, { [field]: next }, { merge: true });
      return next;
    });
    const prefix = data.type === "facture" ? "FAC" : "DEV";
    const num = `${prefix}-${String(number).padStart(4, "0")}`;
    const ref = await db.collection("siteQuotes").add({
      ...data,
      number: num,
      status: data.type === "facture" ? "facture" : "envoye",
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, number: num };
  } catch (e) {
    console.error("createQuote:", e.message);
    return null;
  }
}

export async function getQuote(id) {
  const a = getApp();
  if (!a) return null;
  try {
    const doc = await admin.firestore().collection("siteQuotes").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (e) {
    console.error("getQuote:", e.message);
    return null;
  }
}

export async function listQuotes(max = 100) {
  const a = getApp();
  if (!a) return null;
  try {
    const snap = await admin.firestore().collection("siteQuotes").orderBy("createdAt", "desc").limit(max).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("listQuotes:", e.message);
    return null;
  }
}

export async function deleteQuote(id) {
  const a = getApp();
  if (!a) return false;
  try {
    await admin.firestore().collection("siteQuotes").doc(id).delete();
    return true;
  } catch (e) {
    console.error("deleteQuote:", e.message);
    return false;
  }
}

export async function updateQuoteStatus(id, status) {
  const a = getApp();
  if (!a) return false;
  try {
    await admin.firestore().collection("siteQuotes").doc(id).update({ status });
    return true;
  } catch (e) {
    console.error("updateQuoteStatus:", e.message);
    return false;
  }
}

// Stocke une photo envoyée par le client (gravure) dans la base.
// Renvoie l'identifiant du document (réf à transmettre à l'atelier).
export async function storeCustomerUpload(dataUrl, meta = {}) {
  const a = getApp();
  if (!a) return null;
  try {
    const ref = await admin.firestore().collection("siteUploads").add({
      dataUrl,
      ...meta,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (e) {
    console.error("Upload photo Firebase:", e.message);
    return null;
  }
}

// Récupère une photo stockée (data URL) par son identifiant.
export async function getCustomerUpload(id) {
  const a = getApp();
  if (!a) return null;
  try {
    const doc = await admin.firestore().collection("siteUploads").doc(id).get();
    if (!doc.exists) return null;
    return doc.data()?.dataUrl || null;
  } catch (e) {
    console.error("Lecture photo Firebase:", e.message);
    return null;
  }
}
