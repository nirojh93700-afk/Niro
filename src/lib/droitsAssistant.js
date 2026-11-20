// =============================================================================
// DROITS DU MOT DE PASSE « ASSISTANT » (19/11/2026, gérant : « tu sépares en deux… toi tu as un mot de passe pour
// envoyer les mails, faire des réglages ; moi tout ce qui est important, rembourser et tout ça, il n'y a que moi »).
// Gestion a deux mots de passe :
//   · celui du GÉRANT (et Face ID) : tout est permis ;
//   · celui de l'ASSISTANT (Claude) : le travail courant, jamais ce qui touche à l'argent, aux suppressions,
//     aux mots de passe, aux clés des services ou à la liste complète des clientes.
// Ses choix du 19/11 : les PRIX, l'assistant peut les changer ; les ENVOIS À PLUSIEURS clientes et les CODES PROMO,
// l'assistant peut les préparer mais il faut le FEU VERT du gérant (Réglages › Accès de l'assistant).
// Fonction PURE : decisionAssistant(chemin, méthode, corps) → { verdict: "ok" | "gerant" | "valider", motif }.
// ⛔ Toute nouvelle route d'administration qui touche à l'argent ou envoie à plusieurs personnes : l'ajouter ici.
// =============================================================================

const ok = { verdict: "ok", motif: "" };
const gerant = (motif) => ({ verdict: "gerant", motif });
const valider = (motif) => ({ verdict: "valider", motif });

/** Clés de réglages que l'assistant ne touche pas (clés des services, accès au site). */
export const REGLAGES_GERANT = ["boxtal", "social", "access", "adminAuth", "gmail", "stripe", "paypal"];

export function decisionAssistant(chemin, methode, corps) {
  const p = String(chemin || "").replace(/\/+$/, "");
  const m = String(methode || "GET").toUpperCase();
  const b = corps && typeof corps === "object" ? corps : {};
  const action = typeof b.action === "string" ? b.action : "";
  const r = p.replace(/^\/api\/admin\/?/, "");
  const lecture = m === "GET" || m === "HEAD";

  // Réservé au gérant, même en lecture.
  if (r === "export") return gerant("exporter toutes les données");
  if (r === "acces-assistant") return gerant("régler l'accès de l'assistant");
  if (r === "password" && !lecture) return gerant("changer le mot de passe");
  if (r === "appareils" && !lecture) return gerant("gérer les appareils Face ID");

  if (lecture) return ok;

  // Argent.
  if (r === "refund") return gerant("rembourser");
  if (r === "cagnottes") return gerant(action === "deplacer" ? "déplacer une cagnotte" : "créditer une cagnotte");
  if (r === "promo-codes" && action === "markPaid") return gerant("marquer une commission payée");
  if (r === "orders" && (b.status === "annulee" || b.status === "remboursee")) return gerant("annuler une commande");

  // Suppressions.
  if (m === "DELETE" && r !== "scheduled" && r !== "hub") return gerant("supprimer");
  if (r === "catalog" && (action === "delete" || action === "resetProduct")) return gerant("supprimer ou remettre à zéro un produit");
  if (r === "quotes" && action === "delete") return gerant("supprimer un devis");
  if (r === "prospects" && action === "delete") return gerant("supprimer un établissement");
  if (r === "envois" && action === "supprimer") return gerant("supprimer un envoi à faire");
  if (r === "programmations" && action === "supprimer") return gerant("supprimer une programmation");
  if (r === "restock-alerts" && action === "clear") return gerant("vider une liste d'alertes");
  if (r === "offre-gravure" && action === "purge") return gerant("supprimer des codes");

  // Données en bloc, clés et connexions.
  if (r === "import") return gerant("importer des données");
  if (r === "gmail" && (action === "saveCreds" || action === "disconnect" || action === "authUrl")) return gerant("connecter ou déconnecter Gmail");
  if (r === "social/publish") return gerant("publier sur Instagram");
  if (r === "settings" && REGLAGES_GERANT.some((k) => k in b)) return gerant("changer les clés des services ou l'accès au site");

  // Feu vert du gérant : codes promo et envois à plusieurs clientes.
  if (r === "promo-codes") return valider("créer ou changer un code promo");
  if (r === "newsletter") return valider("envoyer la newsletter");
  if (r === "mail-cagnotte" && b.test !== true && b.recap !== true) return valider("envoyer le mail de la cagnotte");
  if (r === "offre-gravure" && (action === "send" || (action === "noel" && !b.dryRun && !b.test))) return valider("envoyer l'offre gravure");
  if (r === "prospects" && action === "envoyer-tous") return valider("écrire à tous les restaurants");
  if (r === "restock-alerts") return valider("prévenir les clientes d'un retour en stock");
  if (r === "settings" && b.gravureOfferte && b.gravureOfferte.enabled) return valider("ouvrir l'offre gravure (envois automatiques)");

  return ok;
}
