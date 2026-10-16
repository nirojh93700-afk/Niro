// Partie SERVEUR de la détection d'adresse mal tapée (voir emailTypo.js) : interroge le DNS,
// donc jamais importée par une page (le navigateur n'a pas de module « dns »).
import { suggestionEmail } from "@/lib/emailTypo";

/**
 * Le domaine peut-il recevoir des e-mails ? true / false, ou null si on ne sait pas
 * (DNS injoignable, délai dépassé) : dans le doute, on ne corrige rien.
 */
export async function domaineRecoitMail(domaine, delaiMs = 3000) {
  const d = String(domaine || "").trim().toLowerCase();
  if (!d) return false;
  try {
    const dns = await import("dns");
    const p = dns.promises;
    const essai = async () => {
      try { const mx = await p.resolveMx(d); if (mx && mx.length) return true; } catch (e) {
        if (!["ENOTFOUND", "ENODATA", "ESERVFAIL"].includes(e?.code)) return null;
      }
      // Sans MX, une adresse A suffit en théorie pour recevoir du courrier.
      try { const a = await p.resolve4(d); return Boolean(a && a.length); } catch (e) {
        return ["ENOTFOUND", "ENODATA"].includes(e?.code) ? false : null;
      }
    };
    return await Promise.race([essai(), new Promise((r) => setTimeout(() => r(null), delaiMs))]);
  } catch {
    return null;
  }
}

/**
 * Au paiement (webhook) : décide quoi faire de l'adresse donnée à Stripe.
 * { email, corrigeeDe, alerte } — `email` = adresse à utiliser pour la commande et les e-mails.
 *  · domaine qui ne reçoit AUCUN mail + domaine courant très proche → correction automatique ;
 *  · ressemble à une faute mais le domaine existe → on garde, alerte au gérant ;
 *  · sinon rien.
 */
export async function verifierEmailCommande(email, recoit = domaineRecoitMail) {
  const e = String(email || "").trim();
  if (!e) return { email: e, corrigeeDe: "", alerte: "" };
  const sugg = suggestionEmail(e);
  if (!sugg) return { email: e, corrigeeDe: "", alerte: "" };
  const ok = await recoit(e.slice(e.lastIndexOf("@") + 1));
  // Garde : le domaine proposé DOIT répondre. Sinon le DNS n'est pas fiable à cet instant → on ne corrige rien.
  const okSugg = ok === false ? await recoit(sugg.slice(sugg.lastIndexOf("@") + 1)) : null;
  if (ok === false && okSugg === true) {
    return { email: sugg.toLowerCase(), corrigeeDe: e, alerte: `Adresse tapée au paiement : « ${e} » — ce domaine ne reçoit pas d'e-mails. Corrigée automatiquement en « ${sugg.toLowerCase()} » (à vérifier).` };
  }
  return { email: e, corrigeeDe: "", alerte: `Adresse tapée au paiement : « ${e} » — ressemble à une faute de frappe pour « ${sugg.toLowerCase()} ». Rien n'a été changé : vérifier avec la cliente.` };
}
