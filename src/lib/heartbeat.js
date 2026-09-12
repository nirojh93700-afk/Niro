// Déclencheur intégré : lance les tâches périodiques quand le site reçoit des
// visites, SANS aucun planificateur externe (Google Cloud Scheduler inutile).
// Throttle via claimJob() → chaque tâche ne part qu'à l'intervalle voulu, une
// seule fois (verrou). Tout est isolé : ne peut jamais casser une page.
import { claimJob } from "@/lib/stock";
import { runScheduledJobs, runCashbackJobs, runBirthdayJobs, runOffreGravureJob } from "@/lib/jobs";
import { syncInbox } from "@/lib/inbox";

const MIN = 60000;

export async function maybeRunJobs() {
  const out = {};
  // Messages programmés + règles auto : au plus une fois toutes les 15 min.
  try {
    if (await claimJob("scheduled", 15 * MIN)) out.scheduled = await runScheduledJobs();
  } catch (e) { out.scheduledError = e.message; }
  // Boîte mail surveillée : au plus une fois toutes les 15 min. Range les e-mails
  // des clientes dans leur dossier + leur commande, et prépare une réponse à
  // valider. AUCUN e-mail ne part à une cliente ici : seule une alerte part au
  // gérant. Branché ici pour ne dépendre d'AUCUN outil extérieur (incident
  // 07/09/2026 : la routine Claude horaire s'est arrêtée sans prévenir).
  try {
    if (await claimJob("inbox", 15 * MIN)) out.inbox = await syncInbox({ force: true });
  } catch (e) { out.inboxError = e.message; }
  // Cagnotte (rappels/expiration) : au plus une fois par jour.
  try {
    if (await claimJob("cashback", 24 * 60 * MIN)) out.cashback = await runCashbackJobs();
  } catch (e) { out.cashbackError = e.message; }
  // Anniversaires : au plus une fois par jour.
  try {
    if (await claimJob("birthdays", 24 * 60 * MIN)) out.birthdays = await runBirthdayJobs();
  } catch (e) { out.birthdaysError = e.message; }
  // Offre « gravure offerte » : au plus une fois par jour. Ne fait RIEN tant
  // que le gérant n'a pas activé l'offre ; sert aussi à servir au fil de l'eau
  // les inscrites qui atteignent les 3 jours pendant la période.
  try {
    if (await claimJob("offreGravure", 24 * 60 * MIN)) out.offreGravure = await runOffreGravureJob();
  } catch (e) { out.offreGravureError = e.message; }
  return out;
}
