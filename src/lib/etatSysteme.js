// =============================================================================
// ÉTAT DU SYSTÈME (08/11/2026) — Réglages › État du système.
// Dix « feux » (vert / orange / rouge) qui disent si tout ce dont le site dépend répond :
// base de données, paiement, e-mails, Gmail, Claude, battement, boîte mail surveillée,
// programmations, résumé du matin, matériel. LECTURE SEULE : rien n'est modifié, rien n'est
// envoyé. Chaque contrôle est isolé (un échec ne cache pas les autres) et borné dans le temps.
// =============================================================================
import { getSettings, getGmailCreds, getCronState, getJobNote, getMateriel, listPendingReplies } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { gmailAccessToken } from "@/lib/gmail";
import { CLE_RESUME } from "@/lib/resumeMatin";

const MIN = 60000;
const feu = (id, nom, etat, detail, action = null) => ({ id, nom, etat, detail, ...(action ? { action } : {}) });
const il_y_a = (ts) => {
  const d = Date.now() - Number(ts || 0);
  if (!ts || d < 0) return "jamais";
  if (d < MIN) return "à l'instant";
  if (d < 60 * MIN) return `il y a ${Math.round(d / MIN)} min`;
  if (d < 48 * 60 * MIN) return `il y a ${Math.round(d / (60 * MIN))} h`;
  return `il y a ${Math.round(d / (24 * 60 * MIN))} j`;
};
const borne = (p, ms, repli) => Promise.race([p, new Promise((res) => setTimeout(() => res(repli), ms))]);

/** Les feux, dans l'ordre d'affichage. Ne lève jamais d'exception. */
export async function etatSysteme() {
  const at = Date.now();
  const feux = [];

  // 1. Base de données (Firestore) : on lit 3 commandes.
  try {
    const r = await borne(getSiteOrders(3).then((o) => ({ ok: true, n: Array.isArray(o) ? o.length : 0 })), 8000, { ok: false, err: "pas de réponse en 8 s" });
    feux.push(r.ok ? feu("db", "Base de données", "ok", "Firestore répond (commandes lisibles).") : feu("db", "Base de données", "bad", `Firestore ne répond pas : ${r.err || "erreur"}.`));
  } catch (e) { feux.push(feu("db", "Base de données", "bad", `Erreur de lecture : ${String(e?.message || e).slice(0, 120)}`)); }

  // 2. Paiement Stripe (clé secrète + webhook).
  {
    const k = String(process.env.STRIPE_SECRET_KEY || "");
    const w = String(process.env.STRIPE_WEBHOOK_SECRET || "");
    if (!k) feux.push(feu("stripe", "Paiement Stripe", "bad", "Aucune clé Stripe configurée : le paiement ne peut pas fonctionner."));
    else if (!k.startsWith("sk_live")) feux.push(feu("stripe", "Paiement Stripe", "warn", "Clé Stripe en mode TEST : aucun vrai paiement n'est encaissé."));
    else if (!w) feux.push(feu("stripe", "Paiement Stripe", "warn", "Clé réelle présente, mais pas de secret de webhook : les commandes payées ne seraient pas enregistrées."));
    else feux.push(feu("stripe", "Paiement Stripe", "ok", "Clé réelle et webhook configurés."));
  }

  // 3. E-mails du site (Resend) et 4. Gmail connecté.
  feux.push(process.env.RESEND_API_KEY ? feu("resend", "E-mails du site (Resend)", "ok", "Clé présente : secours des envois si Gmail est indisponible.")
    : feu("resend", "E-mails du site (Resend)", "warn", "Pas de clé Resend : les e-mails ne partent que par Gmail."));
  try {
    const g = await getGmailCreds();
    if (!g.refreshToken) feux.push(feu("gmail", "Gmail connecté", "warn", "Aucune boîte Gmail connectée : pas de boîte surveillée, envois par Resend seulement.", { href: "/gestion/boite-mail", label: "Connecter" }));
    else {
      const tok = await borne(gmailAccessToken(g).then((t) => (t ? "ok" : "vide")).catch((e) => `refus : ${String(e?.message || e).slice(0, 80)}`), 8000, "pas de réponse en 8 s");
      feux.push(tok === "ok" ? feu("gmail", "Gmail connecté", "ok", "Jeton Google accepté : lecture de la boîte et envois possibles.")
        : feu("gmail", "Gmail connecté", "bad", `Jeton Google ${tok}. Les envois passent par Resend, la boîte n'est plus lue.`, { href: "/gestion/boite-mail", label: "Reconnecter" }));
    }
  } catch (e) { feux.push(feu("gmail", "Gmail connecté", "bad", `Vérification impossible : ${String(e?.message || e).slice(0, 100)}`)); }

  // 5. Claude (agent e-mail, lecture des images, traduction, question sur les chiffres).
  feux.push(process.env.ANTHROPIC_API_KEY ? feu("claude", "Assistant Claude", "ok", `Clé présente (modèle ${process.env.ANTHROPIC_MODEL || "par défaut"}).`)
    : feu("claude", "Assistant Claude", "bad", "Pas de clé : agent e-mail, lecture des étiquettes et des images, traduction et question sur les chiffres sont arrêtés."));

  // 6. Battement du site et 7. boîte mail surveillée (dernier passage de chaque tâche).
  let cron = {};
  try { cron = await getCronState(true); } catch { cron = {}; }
  {
    const dernier = Math.max(0, ...Object.values(cron).map((v) => Number(v) || 0));
    const age = at - dernier;
    feux.push(!dernier ? feu("battement", "Battement du site", "warn", "Aucune tâche automatique n'a encore tourné.")
      : age > 6 * 60 * MIN ? feu("battement", "Battement du site", "bad", `Dernière tâche ${il_y_a(dernier)} : le site ne reçoit plus de visites ou le battement est arrêté.`)
      : age > 90 * MIN ? feu("battement", "Battement du site", "warn", `Dernière tâche ${il_y_a(dernier)}.`)
      : feu("battement", "Battement du site", "ok", `Dernière tâche ${il_y_a(dernier)}.`));
    const inbox = Number(cron.inbox) || 0;
    feux.push(!inbox ? feu("inbox", "Boîte mail surveillée", "warn", "Jamais passée (Gmail non connecté ?).")
      : at - inbox > 3 * 60 * MIN ? feu("inbox", "Boîte mail surveillée", "warn", `Dernier passage ${il_y_a(inbox)} (normalement toutes les 15 min).`)
      : feu("inbox", "Boîte mail surveillée", "ok", `Dernier passage ${il_y_a(inbox)}.`));
  }

  // 8. Programmations (à venir / en erreur) et 9. résumé du matin.
  let settings = {};
  try { settings = (await getSettings(true)) || {}; } catch { settings = {}; }
  {
    const liste = Array.isArray(settings.programmations) ? settings.programmations : [];
    const aVenir = liste.filter((p) => p && p.etat === "a_venir").length;
    const enErreur = liste.filter((p) => p && p.etat === "erreur").length;
    const enRetard = liste.filter((p) => p && p.etat === "a_venir" && Number(p.at) < at - 30 * MIN).length;
    feux.push(enErreur ? feu("prog", "Programmations", "bad", `${enErreur} en erreur (à regarder), ${aVenir} à venir.`, { href: "/gestion/programmations", label: "Ouvrir" })
      : enRetard ? feu("prog", "Programmations", "warn", `${enRetard} dont l'heure est passée depuis plus de 30 min sans s'être faite.`, { href: "/gestion/programmations", label: "Ouvrir" })
      : feu("prog", "Programmations", "ok", aVenir ? `${aVenir} à venir.` : "Aucune programmation à venir.", { href: "/gestion/programmations", label: "Ouvrir" }));
    const n = settings.notifications || {};
    let note = null;
    try { note = await getJobNote(CLE_RESUME, true); } catch { note = null; }
    feux.push(!n.resumeMatin ? feu("resume", "Résumé du matin", "ok", "Éteint (à activer dans Notifications & résumés).", { href: "/gestion/notifications", label: "Régler" })
      : note && note.ok === false ? feu("resume", "Résumé du matin", "bad", `Dernier envoi refusé ${il_y_a(note.at)} : ${note.erreur || "erreur"}.`, { href: "/gestion/notifications", label: "Ouvrir" })
      : note ? feu("resume", "Résumé du matin", "ok", `Allumé (${n.heure || "07:30"}) · dernier envoi ${il_y_a(note.at)}.`, { href: "/gestion/notifications", label: "Ouvrir" })
      : feu("resume", "Résumé du matin", "ok", `Allumé (${n.heure || "07:30"}) · premier envoi au prochain passage.`, { href: "/gestion/notifications", label: "Ouvrir" }));
  }

  // 10. Matériel sous le seuil et réponses à valider.
  try {
    const m = await getMateriel(true);
    const bas = (m.items || []).filter((it) => it && !it.archive && Number(it.seuil) > 0 && Number(it.stock) <= Number(it.seuil));
    feux.push(bas.length ? feu("materiel", "Matériel d'emballage", "warn", `${bas.length} article${bas.length > 1 ? "s" : ""} sous le seuil : ${bas.slice(0, 3).map((x) => x.nom).join(", ")}${bas.length > 3 ? "…" : ""}.`, { href: "/gestion/materiel", label: "Voir" })
      : feu("materiel", "Matériel d'emballage", "ok", "Rien sous le seuil de rachat."));
  } catch (e) { feux.push(feu("materiel", "Matériel d'emballage", "warn", `Lecture impossible : ${String(e?.message || e).slice(0, 80)}`)); }
  try {
    const p = await listPendingReplies();
    const n = (Array.isArray(p) ? p : []).filter((x) => x && (x.status === "pending" || !x.status)).length;
    feux.push(n ? feu("reponses", "Réponses à valider", "warn", `${n} réponse${n > 1 ? "s" : ""} préparée${n > 1 ? "s" : ""} par l'agent attend${n > 1 ? "ent" : ""} votre relecture.`, { href: "/gestion/assistant", label: "Relire" })
      : feu("reponses", "Réponses à valider", "ok", "Aucune réponse en attente."));
  } catch { feux.push(feu("reponses", "Réponses à valider", "ok", "Aucune réponse en attente.")); }

  return { at, feux };
}
