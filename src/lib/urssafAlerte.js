// Rappel URSSAF par e-mail au gérant (29/10/2026) : lancé par le battement du site.
// Pour chaque mois NON validé : un e-mail 7 jours avant l'échéance, un autre la veille, un dernier si la date
// est dépassée (chaque étape une seule fois par mois, verrou claimJob). Rien n'est envoyé aux clientes.
import { claimJob, getUrssafDeclared } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml as esc, BRAND } from "@/lib/email";
import { moisUrssaf, dateCourte, URSSAF_URL } from "@/lib/urssafRappel";

const QUARANTE_JOURS = 40 * 24 * 60 * 60000;

export async function runUrssafAlerte(now = new Date()) {
  const declared = await getUrssafDeclared(true).catch(() => null);
  if (!declared) return [];
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr";
  const out = [];
  for (const x of moisUrssaf(declared, now)) {
    if (x.etat !== "rappel" && x.etat !== "retard") continue;
    const etape = x.etat === "retard" ? "retard" : x.jours <= 1 ? "veille" : "j7";
    if (!(await claimJob(`urssaf-${x.mois}-${etape}`, QUARANTE_JOURS))) continue;
    const quand = etape === "retard" ? `la date du ${dateCourte(x.echeance)} est dépassée` : etape === "veille" ? `dernier jour : avant le ${dateCourte(x.echeance)}` : `avant le ${dateCourte(x.echeance)}, dans ${x.jours} jours`;
    const html = emailLayout({
      heading: `URSSAF : ${x.nom} à déclarer et payer`,
      bodyHtml: `<p>Le chiffre d'affaires de <b>${esc(x.nom)}</b> est à déclarer et payer à l'URSSAF : <b>${esc(quand)}</b>.</p>
        <p><a href="${URSSAF_URL}" style="color:#a98935;font-weight:700">Ouvrir l'URSSAF</a></p>
        <p>Une fois fait, cliquez « J'ai déclaré et payé » sur le tableau de bord de Gestion : le rappel passera au mois suivant.</p>
        <p><a href="${site}/gestion" style="color:#a98935;font-weight:700">Ouvrir Gestion</a></p>`,
    });
    const r = await sendEmail({ to: BRAND.contact, subject: `🔴 URSSAF : ${x.nom} — ${quand}`, html }).catch((e) => ({ ok: false, error: e.message }));
    out.push({ mois: x.mois, etape, ok: r?.ok !== false });
  }
  return out;
}
