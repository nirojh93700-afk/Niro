// =============================================================================
// MODE VACANCES — logique partagée (bandeau, fiche produit, panier, e-mails)
// -----------------------------------------------------------------------------
// Réglé dans Gestion → Apparence → 🏖️ Mode vacances (`settings.vacation`).
// ÉTEINT par défaut : tant que la gérante n'a pas coché « Activer », RIEN ne
// s'affiche nulle part. Avec des dates, il s'allume et s'éteint TOUT SEUL.
// =============================================================================

// Renvoie la config si le mode vacances est actif AUJOURD'HUI, sinon null.
export function vacationActive(v, now = Date.now()) {
  if (!v || v.enabled !== true) return null;
  const startOk = !v.start || now >= new Date(v.start).getTime();
  const endOk = !v.end || now <= new Date(v.end).getTime() + 86400000; // jour de fin inclus
  return startOk && endOk ? v : null;
}

// Petite date française lisible ("2026-09-01" → "1er septembre").
function dateFr(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const jour = d.getDate();
  const mois = d.toLocaleDateString("fr-FR", { month: "long" });
  return `${jour === 1 ? "1er" : jour} ${mois}`;
}

// Message principal : texte personnalisé de la gérante, sinon message par
// défaut construit avec les dates (commander reste possible, on annonce le délai).
export function vacationMessage(v) {
  if (!v) return "";
  if (v.text && v.text.trim()) return v.text.trim();
  const reprise = v.resume || v.end || "";
  const repriseTxt = reprise ? ` Les expéditions reprennent le ${dateFr(reprise)}.` : "";
  const periode = v.start && v.end ? ` du ${dateFr(v.start)} au ${dateFr(v.end)}` : "";
  return `Notre atelier est en congés${periode} — vous pouvez commander normalement, chaque création sera préparée avec soin dès notre retour.${repriseTxt}`;
}

// Message cadeau (optionnel) : remercie la patience des clientes qui commandent
// pendant les congés. Vide si l'option cadeau n'est pas cochée.
export function vacationGiftMessage(v) {
  if (!v || v.gift !== true) return "";
  if (v.giftText && v.giftText.trim()) return v.giftText.trim();
  return "Pour vous remercier de votre patience, un petit cadeau sera glissé dans chaque commande passée pendant nos congés.";
}

// =============================================================================
// 🎁 CADEAU DANS CHAQUE COLIS — indépendant du mode vacances (maquette validée
// le 20/09/2026, `docs/maquettes/cadeau-colis.html`). Réglé dans Gestion →
// Apparence → « 🎁 Cadeau dans chaque colis » (`settings.cadeauColis` : case,
// phrase, date de fin facultative). ÉTEINT par défaut.
// Le cadeau est offert aujourd'hui si le mode vacances est allumé (comme avant :
// choix du cadeau au panier pendant le délai allongé) OU si cet interrupteur
// l'est. Renvoie { text, viaVacances } — ou null : alors plus rien nulle part
// (panier, commande, e-mails).
// =============================================================================
export const CADEAU_COLIS_TEXTE = "Un cadeau surprise est glissé dans chaque commande.";

export function cadeauColisActif(settings, now = Date.now()) {
  const v = vacationActive(settings?.vacation, now);
  if (v) return { text: vacationGiftMessage(v) || CADEAU_COLIS_TEXTE, viaVacances: true };
  const c = settings?.cadeauColis;
  if (!c || c.enabled !== true) return null;
  if (c.until) {
    const fin = new Date(c.until).getTime();
    if (!Number.isNaN(fin) && now > fin + 86400000) return null; // jour de fin inclus
  }
  return { text: (c.text && c.text.trim()) || CADEAU_COLIS_TEXTE, viaVacances: false };
}
