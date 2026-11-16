// =============================================================================
// RAPPORT DES AGENTS (16/11/2026, accueil de Gestion, « une fenêtre par agent ») : pour chaque agent,
// son état (ok / à regarder / problème / éteint), quand il passe, et ce qu'il a fait — lu dans les VRAIES
// traces qu'il laisse (jobNotes, réponses à valider, envois programmés…). Aucun chiffre inventé : une trace
// absente s'écrit « pas encore de passage ». LECTURE SEULE.
// =============================================================================
import { getSettings, getJobNote, listPendingReplies, getInboxState, getScheduledEmails } from "@/lib/stock";
import { lireGardien } from "@/lib/gardien";
import { CLE_RESUME } from "@/lib/resumeMatin";

const MIN = 60000;
const jourParis = (t) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(t));
const s = (n, mot, pl = mot + "s") => `${n} ${n > 1 ? pl : mot}`;
export function ilYa(ts, now = Date.now()) {
  const d = now - Number(ts || 0);
  if (!ts) return "pas encore de passage";
  if (d < MIN) return "à l'instant";
  if (d < 60 * MIN) return `il y a ${Math.round(d / MIN)} min`;
  if (d < 36 * 60 * MIN) return `il y a ${Math.round(d / (60 * MIN))} h`;
  return `il y a ${Math.round(d / (24 * 60 * MIN))} j`;
}
const dateCourte = (t) => new Date(t).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
const sur = (p) => p.catch(() => null);

export async function rapportAgents(now = Date.now()) {
  const auj = jourParis(now);
  const [garde, settings, pending, inbox, rangement, sched, noteSched, noteOffre, noteResume] = await Promise.all([
    sur(lireGardien()), sur(getSettings(true)), sur(listPendingReplies()), sur(getInboxState()), sur(getJobNote("rangementMails", true)),
    sur(getScheduledEmails()), sur(getJobNote("scheduled", true)), sur(getJobNote("offreGravure", true)), sur(getJobNote(CLE_RESUME, true)),
  ]);
  const agents = [];

  // 1. Gardien du site.
  {
    const r = garde?.rapport;
    if (!r) agents.push({ id: "gardien", nom: "Gardien du site", icone: "shield", nouveau: true, etat: "warn", quand: "toutes les 15 min · pas encore de passage", lignes: ["Son premier contrôle part à la prochaine visite du site", "Ou touche « Vérifier maintenant »"], href: "/gestion/gardien" });
    else {
      const bad = r.checks.filter((x) => x.etat === "bad"), warn = r.checks.filter((x) => x.etat === "warn");
      const lignes = bad.length ? [...bad.slice(0, 2).map((x) => `${x.nom} : ${x.detail}`), `${s(r.checks.length - bad.length, "autre contrôle OK", "autres contrôles OK")}`]
        : [`${r.checks.length} contrôles, ${warn.length ? s(warn.length, "point à regarder", "points à regarder") : "aucun problème"}`, ...r.checks.filter((x) => ["photos", "paiement"].includes(x.id)).map((x) => x.detail)];
      if (r.alerte && bad.length) lignes.push(`Prévenu : ${[r.alerte.telephone && "téléphone", r.alerte.email && "e-mail"].filter(Boolean).join(" + ") || "écran d'accueil seulement"}`);
      agents.push({ id: "gardien", nom: "Gardien du site", icone: "shield", nouveau: true, etat: bad.length ? "bad" : warn.length ? "warn" : "ok", quand: `toutes les 15 min · ${ilYa(r.at, now)}`, lignes, href: "/gestion/gardien" });
    }
  }

  // 2. Agent e-mail : réponses préparées, en attente de relecture.
  {
    const p = (pending || []);
    const duJour = p.filter((x) => x.at && jourParis(x.at) === auj).length;
    const attente = p.filter((x) => x.status === "pending" || !x.status);
    const lignes = [`${s(duJour, "réponse préparée", "réponses préparées")} aujourd'hui`];
    if (attente.length) lignes.push(`${attente.length} à valider : ${attente.slice(0, 2).map((x) => x.name || x.email).join(", ")}${attente.length > 2 ? "…" : ""}`);
    else lignes.push("Aucune réponse en attente");
    lignes.push("Rien ne part sans ton accord");
    agents.push({ id: "email", nom: "Agent e-mail", icone: "mail", etat: attente.length ? "warn" : "ok", quand: "à chaque message reçu", lignes, href: "/gestion/assistant" });
  }

  // 3. Boîte mail surveillée.
  {
    const r = inbox?.lastResult;
    const age = now - (inbox?.lastRun || 0);
    const lignes = r ? [`${s(r.checked || 0, "e-mail lu", "e-mails lus")} au dernier passage`, `${s(r.imported || 0, "rangé", "rangés")} dans le dossier de leur commande`, (r.errors || []).length ? `Erreur : ${String(r.errors[0]).slice(0, 80)}` : "Etsy et publicités ignorés"]
      : ["Pas encore de passage"];
    const etat = !inbox?.lastRun || (r?.errors || []).length ? "warn" : age > 3 * 60 * MIN ? "warn" : "ok";
    agents.push({ id: "inbox", nom: "Boîte mail surveillée", icone: "search", etat, quand: `toutes les 15 min · ${ilYa(inbox?.lastRun, now)}`, lignes, href: "/gestion/boite-mail" });
  }

  // 4. Rangement du soir.
  {
    const r = rangement;
    const lignes = r?.at ? [`${s(r.total || 0, "commande repassée", "commandes repassées")}${r.fini ? "" : " (en cours)"}`, `${s(r.ajoutes || 0, "message ajouté", "messages ajoutés")} aux fils des commandes`, "Gmail en lecture seule"] : ["Pas encore de passage", "Il range chaque soir après 21 h"];
    agents.push({ id: "rangement", nom: "Rangement du soir", icone: "orders", etat: r?.at && now - r.at > 50 * 60 * 60 * 1000 ? "warn" : "ok", quand: `chaque soir à 21 h · ${ilYa(r?.at, now)}`, lignes, href: "/gestion/commandes" });
  }

  // 5. Envois programmés.
  {
    const l = (sched || []).filter((x) => x && !x.sent && !x.cancelled).sort((a, b) => a.sendAt - b.sendAt);
    const echec = l.filter((x) => x.error || Number(x.sendAt) < now - 45 * MIN);
    const lignes = [l.length ? `${s(l.length, "e-mail prévu", "e-mails prévus")}, prochain ${dateCourte(l[0].sendAt)}` : "Aucun e-mail prévu", echec.length ? `${s(echec.length, "envoi en échec", "envois en échec")} (ex. ${echec[0].to})` : "0 envoi en échec"];
    if (noteSched?.error && now - (noteSched.at || 0) < 48 * 60 * MIN) lignes.push(`Dernier refus : ${String(noteSched.error).slice(0, 70)}`);
    agents.push({ id: "scheduled", nom: "Envois programmés", icone: "clock", etat: echec.length ? "bad" : "ok", quand: "toutes les 15 min", lignes, href: "/gestion/messages" });
  }

  // 6. Offre gravure offerte.
  {
    const o = settings?.gravureOfferte || {};
    const lignes = o.enabled ? [`Dernier passage : ${s(noteOffre?.envoyes || 0, "e-mail envoyé", "e-mails envoyés")}`, noteOffre?.echecs ? `${s(noteOffre.echecs, "échec")}` : "0 échec"] : ["En pause : aucun e-mail n'est envoyé", "Se relance quand tu coches « Activer »"];
    agents.push({ id: "offre", nom: "Offre gravure offerte", icone: "gift", etat: o.enabled ? (noteOffre?.echecs ? "warn" : "ok") : "off", quand: o.enabled ? `chaque jour · ${ilYa(noteOffre?.at, now)}` : "en pause", lignes, href: "/gestion/offre-gravure" });
  }

  // 7. Résumé du matin.
  {
    const n = settings?.notifications || {};
    const lignes = n.resumeMatin ? [noteResume?.ok === false ? `Dernier envoi refusé : ${noteResume.erreur || "erreur"}` : `Dernier envoi ${ilYa(noteResume?.at, now)}`, `Chaque matin à ${n.heure || "07:30"}`] : ["Éteint : pas d'e-mail le matin", "S'allume dans Réglages › Notifications"];
    agents.push({ id: "resume", nom: "Résumé du matin", icone: "spark", etat: !n.resumeMatin ? "off" : noteResume?.ok === false ? "bad" : "ok", quand: n.resumeMatin ? `chaque matin · ${n.heure || "07:30"}` : "éteint", lignes, href: "/gestion/notifications" });
  }

  return { at: now, agents, gardien: garde?.rapport || null };
}
