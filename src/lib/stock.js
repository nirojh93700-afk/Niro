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

// --- Réglages d'apparence (thème) ------------------------------------------
// Tout est optionnel : un champ vide = on garde la valeur par défaut du site.
export async function getSettings() {
  const data = await getCatalogRaw();
  const s = data.settings || {};
  return {
    color: s.color || "",
    fontHeading: s.fontHeading || "",   // police des titres
    fontBody: s.fontBody || "",         // police du texte
    announce: { enabled: false, text: "", link: "", ...(s.announce || {}) },
    hero: { eyebrow: "", title: "", text: "", cta1: "", cta2: "", image: "", ...(s.hero || {}) },
    categories: Array.isArray(s.categories) ? s.categories : [], // 3 cartes [{label,sub,image}]
    atelier: { eyebrow: "", title: "", text1: "", text2: "", image: "", ...(s.atelier || {}) },
    sections: { categories: true, trust: true, featured: true, atelier: true, ...(s.sections || {}) },
    apropos: s.apropos || "", // contenu HTML de la page À propos (vide = défaut)
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
