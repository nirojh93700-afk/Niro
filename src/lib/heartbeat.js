// Déclencheur intégré : lance les tâches périodiques quand le site reçoit des
// visites, SANS aucun planificateur externe (Google Cloud Scheduler inutile).
// Throttle via claimJob() → chaque tâche ne part qu'à l'intervalle voulu, une
// seule fois (verrou). Tout est isolé : ne peut jamais casser une page.
import { claimJob } from "@/lib/stock";
import { runScheduledJobs, runCashbackJobs, runBirthdayJobs } from "@/lib/jobs";

const MIN = 60000;

export async function maybeRunJobs() {
  const out = {};
  // Messages programmés + règles auto : au plus une fois toutes les 15 min.
  try {
    if (await claimJob("scheduled", 15 * MIN)) out.scheduled = await runScheduledJobs();
  } catch (e) { out.scheduledError = e.message; }
  // Cagnotte (rappels/expiration) : au plus une fois par jour.
  try {
    if (await claimJob("cashback", 24 * 60 * MIN)) out.cashback = await runCashbackJobs();
  } catch (e) { out.cashbackError = e.message; }
  // Anniversaires : au plus une fois par jour.
  try {
    if (await claimJob("birthdays", 24 * 60 * MIN)) out.birthdays = await runBirthdayJobs();
  } catch (e) { out.birthdaysError = e.message; }
  return out;
}
