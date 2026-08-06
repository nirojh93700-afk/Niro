// =============================================================================
// LIOR — Stockage des données de la plateforme (Netlify Blobs, sans clé)
// -----------------------------------------------------------------------------
// Tout est rangé dans un seul "blob" JSON : { clients:[...], settings:{...} }.
// - En production (Netlify) : persistant, gratuit, aucune clé nécessaire.
// - En local : mémoire temporaire de secours.
// Les clés des comptes (Stripe, e-mail…) sont rangées DANS chaque cliente
// (client.keys). Le chiffrement au repos pourra être ajouté plus tard avec un
// secret, sans changer cette structure.
// =============================================================================

const STORE_NAME = "lior-plateforme";
const KEY = "data";

// Données de départ (exemples) — l'utilisatrice les modifie/supprime ensuite.
const DEFAULT_DATA = {
  clients: [
    { id: "niv-creation", nom: "Niv Création", domaine: "nivcreation.fr", etatSite: "en-ligne", abonnement: { formule: null, prix: 0, etat: "aucun" }, adminUrl: "/gestion", depuis: "2026-03", vous: true, keys: {} },
    { id: "boutique-marie", nom: "Boutique Marie", domaine: "boutique-marie.fr", etatSite: "en-ligne", abonnement: { formule: "Active", prix: 59, etat: "actif" }, adminUrl: "https://boutique-marie.fr/gestion", depuis: "2026-03", keys: {} },
    { id: "atelier-du-bois", nom: "Atelier du Bois", domaine: "atelierdubois.fr", etatSite: "en-ligne", abonnement: { formule: "Sérénité", prix: 29, etat: "actif" }, adminUrl: "https://atelierdubois.fr/gestion", depuis: "2026-04", keys: {} },
    { id: "savonnerie-lou", nom: "Savonnerie Lou", domaine: "savonnerie-lou.fr", etatSite: "en-ligne", abonnement: { formule: "Sérénité", prix: 29, etat: "retard" }, adminUrl: "https://savonnerie-lou.fr/gestion", depuis: "2026-04", keys: {} },
    { id: "ceramique-claire", nom: "Céramique Claire", domaine: "ceramique-claire.fr", etatSite: "maintenance", abonnement: { formule: "Premium", prix: 99, etat: "actif" }, adminUrl: "https://ceramique-claire.fr/gestion", depuis: "2026-05", keys: {} },
    { id: "fleurs-de-sel", nom: "Fleurs de Sel", domaine: "fleursdesel.fr", etatSite: "preparation", abonnement: { formule: null, prix: 0, etat: "aucun" }, adminUrl: null, depuis: "2026-06", keys: {} },
  ],
  settings: {
    formules: [
      { nom: "Sérénité", prix: 29 },
      { nom: "Active", prix: 59 },
      { nom: "Premium", prix: 99 },
    ],
  },
};

let memoryFallback = null;
// Repli mémoire pour le HTML des sites hébergés (local / si Blobs indisponible).
let memSites = {};

async function getStoreSafe() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

export async function getData() {
  const store = await getStoreSafe();
  if (store) {
    try {
      const data = await store.get(KEY, { type: "json" });
      if (data && Array.isArray(data.clients)) return normalize(data);
    } catch {
      // bascule mémoire
    }
  }
  if (memoryFallback) return normalize(memoryFallback);
  return normalize(structuredClone(DEFAULT_DATA));
}

export async function saveData(data) {
  const clean = normalize(data);
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.setJSON(KEY, clean);
      return clean;
    } catch {
      // bascule mémoire
    }
  }
  memoryFallback = clean;
  return clean;
}

// Garantit une structure cohérente.
function normalize(data) {
  const d = data || {};
  return {
    clients: Array.isArray(d.clients) ? d.clients.map((c) => ({ keys: {}, abonnement: { formule: null, prix: 0, etat: "aucun" }, ...c })) : [],
    settings: {
      formules: d.settings?.formules || DEFAULT_DATA.settings.formules,
      seededHb: d.settings?.seededHb || false,
      hbCleaned: d.settings?.hbCleaned || false,
    },
  };
}

// =============================================================================
// Sites hébergés DANS Lior : le HTML de chaque site est rangé dans un blob à
// part (clé `site-<id>`) pour ne pas alourdir le blob principal des clientes.
// Servis publiquement par la route /site/<id>.
// =============================================================================
export async function getSiteHtml(id) {
  const key = `site-${id}`;
  const store = await getStoreSafe();
  if (store) {
    try {
      const html = await store.get(key, { type: "text" });
      if (html) return html;
    } catch {
      // bascule mémoire
    }
  }
  return memSites[id] || null;
}

export async function saveSiteHtml(id, html) {
  const key = `site-${id}`;
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.set(key, html);
      return true;
    } catch {
      // bascule mémoire
    }
  }
  memSites[id] = html;
  return true;
}

export async function deleteSiteHtml(id) {
  const store = await getStoreSafe();
  if (store) {
    try {
      await store.delete(`site-${id}`);
    } catch {
      // ignore
    }
  }
  delete memSites[id];
}

// Calcule les chiffres du tableau de bord à partir des clientes.
export function computeStats(clients = []) {
  const enLigne = clients.filter((c) => c.etatSite === "en-ligne").length;
  const abosActifs = clients.filter((c) => c.abonnement?.etat === "actif").length;
  const revenusMois = clients
    .filter((c) => c.abonnement?.etat === "actif")
    .reduce((s, c) => s + (Number(c.abonnement?.prix) || 0), 0);
  const alertes = clients.filter((c) => c.abonnement?.etat === "retard" || c.etatSite === "maintenance").length;
  return { total: clients.length, enLigne, abosActifs, revenusMois, alertes };
}

// Identifiant URL simple à partir d'un nom.
export function slugify(nom) {
  return String(nom || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "client-" + Date.now();
}
