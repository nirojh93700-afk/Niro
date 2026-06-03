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
    await admin.firestore().collection("siteOrders").add({
      ...order,
      status: "a_preparer",
      createdAt: new Date().toISOString(),
    });
    return true;
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
