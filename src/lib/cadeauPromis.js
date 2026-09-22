// =============================================================================
// 🎁 CADEAU PROMIS — reconnaître automatiquement une cliente à qui un cadeau
// a été annoncé par e-mail, pour le signaler au gérant quand elle commande.
// -----------------------------------------------------------------------------
// Demande du gérant (22/09/2026) : « tu dois identifier les gens à qui j'ai dit
// je donnerai un cadeau, il faut que tu me l'indiques quand il commande,
// automatiquement ». Le mode vacances est éteint depuis le 22/09 : le site ne
// propose plus de cadeau, mais les 49 e-mails de l'offre « gravure offerte »
// partis le 20/09 disaient « comme dans chaque colis, un cadeau vous attend ».
// Une promesse écrite se tient : quand une de ces personnes commande, la
// commande est marquée (cadeauChoix « surprise » + motif), l'alerte de commande
// et Gestion l'affichent en encadré doré. Rien n'est envoyé à la cliente.
// =============================================================================
import { getOffreGravureSent, getPromoCodes } from "@/lib/stock";

// Les e-mails de l'offre envoyés AVANT cet instant contenaient la ligne du
// cadeau (mode vacances allumé). Depuis, `cadeauColisActif()` est faux et la
// phrase n'est plus écrite : un e-mail plus récent ne promet rien.
export const OFFRE_CADEAU_JUSQUAU = Date.parse("2026-09-22T09:00:00+02:00");

// Date d'envoi d'une entrée de la section `offreGravure` (ancien format =
// horodatage nu, nouveau = { at, code }). 0 si inconnue.
export function dateEnvoiOffre(entry) {
  if (typeof entry === "number") return entry;
  if (entry && typeof entry === "object") return Number(entry.at) || 0;
  return 0;
}

// Vrai si cette entrée correspond à un e-mail qui annonçait un cadeau.
export function offrePromettaitCadeau(entry, jusquau = OFFRE_CADEAU_JUSQUAU) {
  const at = dateEnvoiOffre(entry);
  return at > 0 && at < jusquau;
}

function dateFr(ts) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

// Renvoie { motif } si un cadeau a été promis à cette adresse (ou à l'adresse
// du code nominatif utilisé), sinon null. Jamais bloquant : une erreur de
// lecture renvoie simplement null.
export async function cadeauPromisPour({ email = "", promoCode = "" } = {}) {
  const mail = String(email || "").trim().toLowerCase();
  const code = String(promoCode || "").trim().toUpperCase();
  let sent = null;
  const lire = async () => { if (!sent) sent = await getOffreGravureSent(); return sent; };
  try {
    if (mail) {
      const e = (await lire())[mail];
      if (offrePromettaitCadeau(e)) {
        return { motif: `Offre « gravure offerte » : notre e-mail du ${dateFr(dateEnvoiOffre(e))} lui annonçait un cadeau dans le colis.` };
      }
    }
  } catch { /* non bloquant */ }
  try {
    if (code) {
      const pc = (await getPromoCodes())[code];
      const mailCode = String(pc?.email || "").trim().toLowerCase();
      if (pc?.kind === "gravure" && mailCode && mailCode !== mail) {
        const e = (await lire())[mailCode];
        if (offrePromettaitCadeau(e)) {
          return { motif: `Offre « gravure offerte » (code ${code}) : notre e-mail du ${dateFr(dateEnvoiOffre(e))} à ${mailCode} lui annonçait un cadeau dans le colis.` };
        }
      }
    }
  } catch { /* non bloquant */ }
  return null;
}
