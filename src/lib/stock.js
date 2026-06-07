// =============================================================================
// Gestion du stock — stockage via Netlify Blobs (gratuit, sans compte)
// -----------------------------------------------------------------------------
// Le stock est une simple table { variantId: nombre }.
//   - variante absente de la table = stock "non suivi" (produit vendable, pas de badge)
//   - nombre > 0  = "X en stock"
//   - nombre = 0  = "épuisé" (achat bloqué)
// En local (hors Netlify), on retombe sur une mémoire temporaire.
// =============================================================================

const STORE_NAME = "niv-stock";
const KEY = "stock";

let memoryFallback = {}; // utilisé en local / si Blobs indisponible

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

export async function getStockMap() {
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

export function isAdmin(req) {
  const key = req.headers.get("x-admin-key");
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

// --- Photos personnalisées par produit (ajoutées depuis l'admin) -----------
const CATALOG_KEY = "catalog";
let catalogMemory = {};

async function getCatalogRaw() {
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

export async function setProductOverride(slug, patch) {
  const data = await getCatalogRaw();
  data.overrides = data.overrides || {};
  const cur = data.overrides[slug] || {};
  const next = { ...cur, ...patch };
  // nettoie les valeurs vides
  Object.keys(next).forEach((k) => {
    if (next[k] === "" || next[k] === null || next[k] === undefined) delete next[k];
  });
  if (Object.keys(next).length === 0) delete data.overrides[slug];
  else data.overrides[slug] = next;
  await persistCatalog(data);
  return data.overrides[slug] || {};
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
// Stockés dans Netlify Blobs (binaire, peut être lourd). Servis via /api/model3d/<id>.
const MODEL_STORE = "niv-models";
async function getModelStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(MODEL_STORE);
  } catch {
    return null;
  }
}

export async function saveModelFile(buffer, contentType) {
  const store = await getModelStore();
  if (!store) return null;
  const id = "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  try {
    await store.set(id, buffer, { metadata: { contentType: contentType || "model/gltf-binary" } });
    return id;
  } catch {
    return null;
  }
}

export async function getModelFile(id) {
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
  data.promoCodes[c] = {
    type: def?.type === "fixed" ? "fixed" : "percent",
    value: Math.max(0, Number(def?.value) || 0),
  };
  await persistCatalog(data);
  return true;
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
  if (data.promoCodes) {
    delete data.promoCodes[String(code || "").trim().toUpperCase()];
    await persistCatalog(data);
  }
  return true;
}

// --- Avis clients ----------------------------------------------------------
// { slug: [{ id, name, rating, text, date, approved }] }
export async function getReviews() {
  const data = await getCatalogRaw();
  return data.reviews || {};
}
export async function addReview(slug, review) {
  const data = await getCatalogRaw();
  data.reviews = data.reviews || {};
  const list = data.reviews[slug] || [];
  list.push({
    id: "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: String(review.name || "").slice(0, 60) || "Cliente",
    rating: Math.min(5, Math.max(1, parseInt(review.rating, 10) || 5)),
    text: String(review.text || "").slice(0, 1000),
    date: new Date().toISOString(),
    approved: false,
  });
  data.reviews[slug] = list.slice(-300);
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
      enabled: s.welcome?.enabled === true,
      code: (typeof s.welcome?.code === "string" && s.welcome.code.trim()) ? s.welcome.code.trim() : "BIENVENUE10",
      text: (typeof s.welcome?.text === "string" && s.welcome.text.trim()) ? s.welcome.text.trim() : "−10 % sur votre première commande",
    },
    // Balises marketing (vides tant que pas configurées dans l'admin).
    metaPixelId: typeof s.metaPixelId === "string" ? s.metaPixelId.trim() : "",
    gaId: typeof s.gaId === "string" ? s.gaId.trim() : "",
    // Objectif de chiffre d'affaires mensuel (€) — affiché en jauge dans les stats.
    salesGoal: Number(s.salesGoal) || 0,
    // Notes CRM par cliente : { "email_minuscule": "note libre" }.
    crmNotes: (s.crmNotes && typeof s.crmNotes === "object") ? s.crmNotes : {},
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
  };
}

export async function setSettings(patch) {
  const data = await getCatalogRaw();
  data.settings = { ...(data.settings || {}), ...patch };
  await persistCatalog(data);
  return data.settings;
}

async function persistCatalog(data) {
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
