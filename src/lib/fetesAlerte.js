// 🎄 Alerte 2 mois avant chaque fête (gérant, 28/10/2026 : « une alerte deux mois avant »).
// Lancée par le battement du site : UN e-mail au gérant par fête et par an (verrou claimJob d'un an).
// Rien n'est envoyé aux clientes.
import { claimJob, getSettings } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml as esc, BRAND } from "@/lib/email";
import { FETES, prochaineFete, dateFr } from "@/lib/fetes";

const AN = 330 * 24 * 60 * 60000;

export async function runFetesAlerte() {
  const s = await getSettings().catch(() => ({}));
  const out = [];
  for (const f of FETES) {
    const p = prochaineFete(f.k);
    if (!p.enAlerte || p.jours < 0) continue;
    if (!(await claimJob(`feteAlerte-${f.k}-${p.date.getUTCFullYear()}`, AN))) continue;
    const on = s?.fetes?.[f.k]?.on === true;
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr";
    const html = emailLayout({
      heading: `${f.ico} ${f.nom} dans ${p.jours} jours`,
      bodyHtml: `<p>${esc(f.nom)} tombe le <b>${esc(dateFr(p.date))}</b>. C'est le moment de préparer : images de gravure, emballages, newsletter et vidéos.</p>
        <p>Sur le site, ${esc(f.nom)} est actuellement <b>${on ? "allumée" : "éteinte"}</b>.</p>
        <p><a href="${site}/gestion/fetes" style="color:#a98935;font-weight:700">Ouvrir Gestion → Fêtes de l'année</a></p>`,
    });
    const r = await sendEmail({ to: BRAND.contact, subject: `${f.ico} ${f.nom} dans ${p.jours} jours : à préparer`, html }).catch((e) => ({ ok: false, error: e.message }));
    out.push({ fete: f.k, ok: r?.ok !== false });
  }
  return out;
}
