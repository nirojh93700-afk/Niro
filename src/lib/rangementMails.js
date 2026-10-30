// =============================================================================
// RANGEMENT DES MAILS, CHAQUE SOIR (30/10/2026)
// -----------------------------------------------------------------------------
// Gérant : « un agent qui fait tout le temps ça, tous les soirs : il met en place
// tout ce qui s'est passé dans la journée, il met en ordre, il range dans les
// dossiers tous les mails » — y compris les mails reçus AVANT la commande.
//
// Chaque soir à partir de 21 h (heure de Paris), le battement du site repasse sur
// TOUTES les commandes et range dans le fil de chacune (et dans le dossier de la
// cliente) chaque e-mail échangé avec elle : avant comme après la commande,
// archivés compris (syncHistoriqueCommande, 12 mois, sans doublon, sans toucher
// au statut ni à la pastille « non lu »). Par lots de ~40 s : si toutes les
// commandes ne passent pas d'un coup, le lot suivant reprend 10 min plus tard.
// Gmail en LECTURE SEULE. Rien n'est jamais envoyé à une cliente.
// =============================================================================

import { getJobNote, setJobNote } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { syncHistoriqueCommande } from "@/lib/historiqueMails";

const CLE = "rangementMails";
const jourParis = (t) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(t));
// « 21 h » en français : on ne garde que les chiffres.
const heureParis = (t) => parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(new Date(t)), 10);

/** Vrai le soir (21 h – minuit, heure de Paris) : c'est là que le rangement du jour se fait. */
export function heureDuRangement(now = Date.now()) {
  return heureParis(now) >= 21;
}

/**
 * Un lot de rangement. `force` ignore l'heure (bouton « Ranger maintenant »).
 * Renvoie l'état du jour : { jour, faits, total, ajoutes, lus, fini, at }.
 */
export async function runRangementMails({ force = false, budgetMs = 40000, now = Date.now() } = {}) {
  const jour = jourParis(now);
  let etat = (await getJobNote(CLE, true)) || {};
  if (etat.jour !== jour || (force && etat.fini)) etat = { jour, faits: [], ajoutes: 0, lus: 0, fini: false, debut: now };
  if (etat.fini) return etat;
  if (!force && !heureDuRangement(now)) return { ...etat, attente: "après 21 h" };

  const orders = (await getSiteOrders(500)).filter((o) => o && !o.test && o.customerEmail);
  const faits = new Set(etat.faits || []);
  const t0 = Date.now();
  for (const o of orders) {
    if (faits.has(o.id)) continue;
    if (Date.now() - t0 > budgetMs) break;
    try {
      const r = await syncHistoriqueCommande(o);
      etat.ajoutes = (etat.ajoutes || 0) + (r.ajoutes || 0);
      etat.lus = (etat.lus || 0) + (r.lus || 0);
      if (r.ajoutes) (etat.commandes = etat.commandes || []).push({ ref: o.ref || o.id, ajoutes: r.ajoutes });
    } catch { /* une commande qui échoue ne bloque pas les autres ; reprise au prochain soir */ }
    faits.add(o.id);
  }
  etat.faits = [...faits];
  etat.total = orders.length;
  etat.fini = orders.every((o) => faits.has(o.id));
  etat.at = Date.now();
  if (etat.commandes) etat.commandes = etat.commandes.slice(-60);
  await setJobNote(CLE, etat);
  return etat;
}

export async function lireRangementMails() {
  return (await getJobNote(CLE, true)) || null;
}
