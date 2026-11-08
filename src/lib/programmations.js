// =============================================================================
// PROGRAMMATIONS (08/11/2026) — Réglages › Programmations.
// Un changement qui s'applique TOUT SEUL à une date et une heure (heure de Paris), annulable avant.
// Quoi : prix d'une option · visibilité d'un produit · fête allumée / éteinte · code promo créé / supprimé · bandeau.
// Exécuté par le battement du site (`runProgrammations`, toutes les 15 min) : le changement se fait dans le
// quart d'heure qui suit l'heure choisie. Chaque exécution est notée dans le journal d'activité (par « site »).
// Règle du dépôt : la liste se relit FRAÎCHE juste avant chaque écriture (jamais d'écrasement depuis le cache).
// Jamais d'exception qui remonte : le battement ne doit jamais casser une page.
// =============================================================================
import {
  getSettings, setSettings, setProductOverride, getProductOverrides, setFetes,
  setPromoCode, deletePromoCode, getPromoCodes,
} from "@/lib/stock";
import { journaliser } from "@/lib/journal";
import { FETES } from "@/lib/fetes";
import { products } from "@/lib/products";

/** Les cinq sortes de changement programmable, avec leur nom lisible. */
export const QUOI = {
  prix: "Prix d'une option",
  visibilite: "Visibilité d'un produit",
  fete: "Fête (allumer / éteindre)",
  promo: "Code promo",
  bandeau: "Bandeau du site",
};

const ETATS = ["a_venir", "fait", "annule", "erreur"];

/** Produits connus du code, réduits à ce que la page et les libellés utilisent. */
export function produitsPourProgrammation() {
  return (products || [])
    .filter((p) => p && p.slug && !p.retire)
    .map((p) => ({
      slug: p.slug,
      name: p.name || p.slug,
      variants: (p.variants || []).map((v) => ({ id: v.id, title: v.title || v.id, price: v.price })),
    }));
}

const prixFr = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Nettoie et vérifie une programmation. Renvoie `{ ok:true, programmation }` ou `{ ok:false, erreur }` (en français).
 * `at` doit être dans le futur ; `quoi` doit être connu ; la valeur doit avoir la forme attendue.
 */
export function valider(p, now = Date.now()) {
  if (!p || typeof p !== "object") return { ok: false, erreur: "Programmation vide." };
  const quoi = String(p.quoi || "");
  if (!QUOI[quoi]) return { ok: false, erreur: "Type de changement inconnu." };
  const at = Number(p.at);
  if (!Number.isFinite(at)) return { ok: false, erreur: "La date et l'heure sont incomplètes." };
  if (at <= now) return { ok: false, erreur: "La date doit être dans le futur." };

  const out = {
    id: typeof p.id === "string" && p.id ? p.id : undefined,
    quoi,
    cible: str(p.cible, 120),
    at,
    note: str(p.note, 300),
    creeLe: Number.isFinite(Number(p.creeLe)) ? Number(p.creeLe) : now,
    etat: ETATS.includes(p.etat) ? p.etat : "a_venir",
  };
  if (p.faitLe) out.faitLe = Number(p.faitLe);
  if (p.erreur) out.erreur = str(p.erreur, 300);

  switch (quoi) {
    case "prix": {
      if (!out.cible) return { ok: false, erreur: "Choisissez un produit." };
      out.variantId = str(p.variantId, 120);
      if (!out.variantId) return { ok: false, erreur: "Choisissez l'option du produit." };
      const v = typeof p.valeur === "string" ? Number(p.valeur.replace(/\s/g, "").replace(",", ".")) : Number(p.valeur);
      if (!Number.isFinite(v) || v <= 0) return { ok: false, erreur: "Le nouveau prix doit être un nombre positif (ex. 24,90)." };
      out.valeur = Math.round(v * 100) / 100;
      break;
    }
    case "visibilite": {
      if (!out.cible) return { ok: false, erreur: "Choisissez un produit." };
      if (typeof p.valeur !== "boolean") return { ok: false, erreur: "Indiquez Visible ou Masqué." };
      out.valeur = p.valeur;
      break;
    }
    case "fete": {
      if (!FETES.some((f) => f.k === out.cible)) return { ok: false, erreur: "Choisissez une fête." };
      if (typeof p.valeur !== "boolean") return { ok: false, erreur: "Indiquez Allumer ou Éteindre." };
      out.valeur = p.valeur;
      break;
    }
    case "promo": {
      out.cible = out.cible.toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9_-]{2,30}$/.test(out.cible)) return { ok: false, erreur: "Le code doit faire 2 à 30 caractères (lettres, chiffres, tiret)." };
      if (p.valeur === null) { out.valeur = null; break; }
      const v = p.valeur && typeof p.valeur === "object" ? p.valeur : {};
      const value = typeof v.value === "string" ? Number(v.value.replace(",", ".")) : Number(v.value);
      if (!Number.isFinite(value) || value <= 0) return { ok: false, erreur: "La remise du code doit être un nombre positif." };
      const type = v.type === "fixed" ? "fixed" : "percent";
      if (type === "percent" && value > 100) return { ok: false, erreur: "Une remise en % ne dépasse pas 100." };
      const days = Math.max(0, Math.floor(Number(v.days) || 0));
      out.valeur = { type, value: Math.round(value * 100) / 100, days, reusable: v.reusable !== false };
      break;
    }
    case "bandeau": {
      const v = p.valeur && typeof p.valeur === "object" ? p.valeur : {};
      out.cible = "";
      out.valeur = { enabled: Boolean(v.enabled), text: str(v.text, 160), link: str(v.link, 200) };
      if (out.valeur.enabled && !out.valeur.text) return { ok: false, erreur: "Un bandeau activé doit avoir un texte." };
      break;
    }
    default:
      return { ok: false, erreur: "Type de changement inconnu." };
  }
  return { ok: true, programmation: out };
}

/** Texte lisible d'une programmation (« Collier Cœur gravé · Argenté : 24,90 € », « Noël : allumer »…). */
export function libelle(p, produits = null) {
  if (!p) return "";
  const liste = produits || produitsPourProgrammation();
  const prod = liste.find((x) => x.slug === p.cible);
  const nomProduit = prod ? prod.name : (p.cible || "produit");
  switch (p.quoi) {
    case "prix": {
      const v = prod && (prod.variants || []).find((x) => x.id === p.variantId);
      const option = v ? v.title : (p.variantId || "");
      const plusieurs = prod && (prod.variants || []).length > 1;
      return `${nomProduit}${plusieurs && option ? " · " + option : ""} : ${Number.isFinite(Number(p.valeur)) ? prixFr(p.valeur) : "—"}`;
    }
    case "visibilite":
      return `${p.valeur ? "Afficher" : "Masquer"} ${nomProduit}`;
    case "fete": {
      const f = FETES.find((x) => x.k === p.cible);
      return `${f ? f.nom : p.cible} : ${p.valeur ? "allumer" : "éteindre"}`;
    }
    case "promo": {
      if (p.valeur === null || p.valeur === undefined) return `Code ${p.cible} : supprimer`;
      const v = p.valeur || {};
      const remise = v.type === "fixed" ? `−${prixFr(v.value)}` : `−${Number(v.value)} %`;
      return `Code ${p.cible} : créer (${remise}${v.days ? `, ${v.days} j` : ""})`;
    }
    case "bandeau": {
      const v = p.valeur || {};
      if (!v.enabled) return "Bandeau : désactiver";
      const t = String(v.text || "");
      return `Bandeau : « ${t.length > 60 ? t.slice(0, 57) + "…" : t} »`;
    }
    default:
      return p.cible || "";
  }
}

/** Date + heure d'une programmation, heure de Paris (« mer. 20 nov. · 08 h 00 »). */
export function quandParis(ts) {
  const d = new Date(Number(ts));
  if (Number.isNaN(d.getTime())) return "—";
  const jour = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
  return `${jour} · ${heure}`;
}

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

/** Applique UNE programmation (lève une erreur si elle échoue). Renvoie { avant, apres }. */
async function executer(p) {
  const label = libelle(p);
  const note = async (avant, apres) => {
    try {
      await journaliser({ type: "programmation", cible: p.cible || p.quoi, label, avant, apres, par: "site", source: "programmations" });
    } catch { /* le journal ne bloque jamais */ }
  };

  switch (p.quoi) {
    case "prix": {
      const ov = (await getProductOverrides())?.[p.cible] || {};
      const prod = (products || []).find((x) => x.slug === p.cible);
      const v = prod && (prod.variants || []).find((x) => x.id === p.variantId);
      if (!prod) throw new Error(`Produit introuvable : ${p.cible}`);
      if (!v) throw new Error(`Option introuvable : ${p.variantId}`);
      const avant = typeof ov.prices?.[p.variantId] === "number" ? ov.prices[p.variantId] : (v.price ?? null);
      await setProductOverride(p.cible, { prices: { ...(ov.prices || {}), [p.variantId]: p.valeur } });
      await note(avant, p.valeur);
      return { avant, apres: p.valeur };
    }
    case "visibilite": {
      const ov = (await getProductOverrides())?.[p.cible] || {};
      const prod = (products || []).find((x) => x.slug === p.cible);
      if (!prod) throw new Error(`Produit introuvable : ${p.cible}`);
      const avant = ov.hidden !== undefined ? !ov.hidden : !prod.hidden; // visible ?
      // hidden:true = masqué ; valeur=true (visible) → hidden:null retire la clé (setProductOverride efface les null).
      await setProductOverride(p.cible, { hidden: p.valeur === true ? null : true });
      await note(avant, p.valeur === true);
      return { avant, apres: p.valeur === true };
    }
    case "fete": {
      const k = p.cible;
      if (!FETES.some((f) => f.k === k)) throw new Error(`Fête inconnue : ${k}`);
      const fetes = (await getSettings(true))?.fetes || {};
      const avant = fetes[k]?.on === true;
      await setFetes((f) => ({ ...f, [k]: { ...(f[k] || {}), on: p.valeur === true, changeLe: Date.now() } }));
      await note(avant, p.valeur === true);
      return { avant, apres: p.valeur === true };
    }
    case "promo": {
      const codes = await getPromoCodes();
      const avant = codes?.[p.cible] || null;
      if (p.valeur === null || p.valeur === undefined) {
        await deletePromoCode(p.cible);
        await note(avant, null);
        return { avant, apres: null };
      }
      await setPromoCode(p.cible, p.valeur);
      await note(avant, p.valeur);
      return { avant, apres: p.valeur };
    }
    case "bandeau": {
      const s = await getSettings(true);
      const avant = s?.announce || null;
      const apres = { enabled: Boolean(p.valeur?.enabled), text: String(p.valeur?.text || ""), link: String(p.valeur?.link || "") };
      await setSettings({ announce: apres });
      await note(avant, apres);
      return { avant, apres };
    }
    default:
      throw new Error("Type de changement inconnu.");
  }
}

/**
 * Exécute toutes les programmations « à venir » dont l'heure est passée. Appelée par le battement du site.
 * Renvoie `{ faites, erreurs }`. N'envoie jamais d'exception.
 */
export async function runProgrammations(now = Date.now()) {
  const out = { faites: 0, erreurs: 0 };
  try {
    const liste = (await getSettings(true))?.programmations || [];
    const dues = liste.filter((p) => p && p.id && p.etat === "a_venir" && Number(p.at) <= now);
    if (!dues.length) return out;

    const resultats = {}; // id → ce qui change sur la ligne
    for (const p of dues) {
      try {
        await executer(p);
        resultats[p.id] = { etat: "fait", faitLe: Date.now(), erreur: undefined };
        out.faites += 1;
      } catch (e) {
        resultats[p.id] = { etat: "erreur", faitLe: Date.now(), erreur: String(e?.message || e).slice(0, 300) };
        out.erreurs += 1;
        console.error("[programmations] échec", p.id, e?.message || e);
      }
    }

    // Relecture FRAÎCHE juste avant d'écrire : une annulation ou un ajout fait pendant ce temps n'est pas perdu.
    const fraiche = (await getSettings(true))?.programmations || [];
    const next = fraiche.map((p) => {
      const r = p && resultats[p.id];
      if (!r) return p;
      const ligne = { ...p, etat: r.etat, faitLe: r.faitLe };
      if (r.erreur) ligne.erreur = r.erreur; else delete ligne.erreur;
      return ligne;
    });
    await setSettings({ programmations: next });
  } catch (e) {
    console.error("[programmations] erreur générale", e?.message || e);
  }
  return out;
}
