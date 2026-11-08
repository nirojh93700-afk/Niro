// Journal d'activité de Gestion (08/11/2026) : chaque changement fait depuis Gestion (prix, stock, statut d'une
// commande, réglage, code promo, cagnotte, fête, programmation) est noté avec sa valeur d'AVANT et d'APRÈS,
// et peut être RÉTABLI en un clic depuis Réglages › Journal d'activité.
// Protège contre l'incident des réglages effacés (26/09/2026) : on voit ce qui a bougé et on revient en arrière.
// Jamais bloquant : `journaliser` avale ses erreurs, l'action d'origine réussit quoi qu'il arrive.
import { ajouterJournal, getJournal, marquerJournalRetabli, setStock, setProductOverride, setSettings, getSettings, setPromoCode, deletePromoCode, getPromoCodes, creditCagnotte, debitCagnotte, setFetes, getStockMap } from "@/lib/stock";
import { updateSiteOrder, getSiteOrder } from "@/lib/firebase";

export const TYPES = {
  prix: "Prix",
  stock: "Stock",
  statut: "Statut",
  produit: "Produit",
  reglage: "Réglage",
  promo: "Code promo",
  cagnotte: "Cagnotte",
  fete: "Fête",
  programmation: "Programmation",
  livraison: "Livraison",
  autre: "Autre",
};

/** Note un changement. `retablir` = ce qu'il faut pour revenir en arrière (voir `retablirEntree`). */
export async function journaliser({ type, cible, label = "", avant, apres, par = "gérant", source = "", retablir = null }) {
  if (JSON.stringify(avant) === JSON.stringify(apres)) return null; // rien n'a changé : rien à noter
  return ajouterJournal({ type, cible, label, avant, apres, par, source, retablir });
}

/** Clés de réglages dont un changement se note (les autres, trop volumineuses ou techniques, passent en résumé). */
const REGLAGES_IGNORES = new Set(["crystalZones", "motifTextZones", "adminAuth"]);

/** Compare deux objets de réglages et note chaque clé qui change (une ligne par clé). */
export async function journaliserReglages(avant, patch, { par = "gérant", source = "settings" } = {}) {
  const lignes = [];
  for (const k of Object.keys(patch || {})) {
    if (REGLAGES_IGNORES.has(k)) continue;
    const a = avant?.[k], b = patch[k];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    lignes.push(journaliser({ type: "reglage", cible: k, label: `Réglage « ${k} »`, avant: a ?? null, apres: b ?? null, par, source,
      retablir: { kind: "reglage", key: k, valeur: a ?? null } }));
  }
  return Promise.all(lignes);
}

/**
 * Remet la valeur d'AVANT d'une entrée du journal. Renvoie { ok, message } ; une entrée sans `retablir`
 * ou déjà rétablie est refusée. Le rétablissement est lui-même journalisé (par = « rétabli »).
 */
export async function retablirEntree(id) {
  const liste = await getJournal(true);
  const e = liste.find((x) => x.id === id);
  if (!e) return { ok: false, message: "Ligne introuvable." };
  if (e.retabli) return { ok: false, message: "Déjà rétablie." };
  const r = e.retablir;
  if (!r || typeof r !== "object") return { ok: false, message: "Cette ligne ne se rétablit pas en un clic (elle n'a pas de valeur d'avant exploitable)." };
  let message = "";
  switch (r.kind) {
    case "stock": {
      const map = await getStockMap();
      const cur = map[r.variantId] ?? null;
      await setStock(r.variantId, r.valeur);
      await journaliser({ type: "stock", cible: r.variantId, label: e.label, avant: cur, apres: r.valeur, par: "rétabli", source: "journal" });
      message = `Stock de ${r.variantId} remis à ${r.valeur === null ? "non suivi" : r.valeur}.`;
      break;
    }
    case "statut": {
      const o = await getSiteOrder(r.orderId);
      if (!o) return { ok: false, message: "Commande introuvable." };
      await updateSiteOrder(r.orderId, { status: r.valeur });
      await journaliser({ type: "statut", cible: o.ref || r.orderId, label: e.label, avant: o.status, apres: r.valeur, par: "rétabli", source: "journal" });
      message = `Commande ${o.ref || ""} remise au statut « ${r.valeur} ».`;
      break;
    }
    case "override": {
      // Un champ d'un produit (prix d'une option, nom, masquage…) : on remet la valeur d'avant dans l'override.
      await setProductOverride(r.slug, { [r.champ]: r.valeur === undefined ? null : r.valeur });
      await journaliser({ type: e.type, cible: r.slug, label: e.label, avant: e.apres, apres: r.valeur ?? null, par: "rétabli", source: "journal" });
      message = `${e.label || r.slug} : valeur d'avant remise.`;
      break;
    }
    case "reglage": {
      const cur = (await getSettings(true))?.[r.key];
      await setSettings({ [r.key]: r.valeur });
      await journaliser({ type: "reglage", cible: r.key, label: e.label, avant: cur ?? null, apres: r.valeur, par: "rétabli", source: "journal" });
      message = `Réglage « ${r.key} » remis comme avant.`;
      break;
    }
    case "promo": {
      const codes = await getPromoCodes();
      const cur = codes?.[r.code] || null;
      if (r.valeur) await setPromoCode(r.code, r.valeur); else await deletePromoCode(r.code);
      await journaliser({ type: "promo", cible: r.code, label: e.label, avant: cur, apres: r.valeur || null, par: "rétabli", source: "journal" });
      message = r.valeur ? `Code ${r.code} remis comme avant.` : `Code ${r.code} supprimé (il n'existait pas avant).`;
      break;
    }
    case "cagnotte": {
      // Un crédit manuel se rétablit par le débit du même montant (jamais sous zéro : debitCagnotte s'en charge).
      if (r.montant > 0) await debitCagnotte(r.email, r.montant, ""); else await creditCagnotte(r.email, -r.montant, "Rétabli depuis le journal", "");
      await journaliser({ type: "cagnotte", cible: r.email, label: e.label, avant: e.apres, apres: e.avant, par: "rétabli", source: "journal" });
      message = `Cagnotte de ${r.email} : ${r.montant > 0 ? "crédit retiré" : "montant remis"}.`;
      break;
    }
    case "fete": {
      await setFetes((f) => ({ ...f, [r.fete]: { ...(f[r.fete] || {}), on: r.valeur === true, changeLe: Date.now() } }));
      await journaliser({ type: "fete", cible: r.fete, label: e.label, avant: e.apres, apres: r.valeur, par: "rétabli", source: "journal" });
      message = `Fête « ${r.fete} » ${r.valeur ? "rallumée" : "éteinte"} comme avant.`;
      break;
    }
    default:
      return { ok: false, message: "Type de rétablissement inconnu." };
  }
  await marquerJournalRetabli(id);
  return { ok: true, message };
}

/** Texte court d'une valeur pour l'écran (prix, booléen, objet résumé). */
export function texteValeur(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
  if (typeof v === "string") return v.length > 80 ? v.slice(0, 77) + "…" : v;
  if (v && typeof v === "object" && v.resume) return v.resume;
  const s = JSON.stringify(v);
  return s.length > 80 ? s.slice(0, 77) + "…" : s;
}
