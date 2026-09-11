// =============================================================================
// OFFRE « GRAVURE OFFERTE » — e-mail ciblé, jamais visible sur le site
// -----------------------------------------------------------------------------
// Réglée dans Gestion → Marketing → ✦ Offre gravure offerte
// (`settings.gravureOfferte`). ÉTEINTE par défaut : tant que le gérant n'a pas
// coché « Activer », RIEN ne part. Avec des dates, elle s'ouvre et se ferme
// toute seule.
//
// Qui la reçoit (demande du gérant, 11/09/2026) :
//   · les INSCRITES à la newsletter qui n'ont JAMAIS commandé ;
//   · inscrites depuis PLUS DE 3 JOURS (les toutes nouvelles viennent de
//     recevoir leur code de bienvenue, on ne les submerge pas) ;
//   · une seule fois chacune (mémoire des envois) ;
//   · celles qui atteignent les 3 jours pendant l'offre sont servies au fil de
//     l'eau, tant que l'offre est ouverte.
// Le texte s'ADAPTE à la date d'inscription (« il y a quelques jours » /
// « quelques semaines » / « depuis un moment »).
// RIEN sur le site : ni bandeau, ni encart de fiche. Uniquement l'e-mail.
// =============================================================================
import { emailLayout, BRAND } from "@/lib/email";

// Renvoie la config si l'offre est ouverte AUJOURD'HUI, sinon null.
// Même logique de dates que le mode vacances (jour de fin inclus).
export function offreActive(o, now = Date.now()) {
  if (!o || o.enabled !== true) return null;
  const startOk = !o.start || now >= new Date(o.start).getTime();
  const endOk = !o.end || now <= new Date(o.end).getTime() + 86400000;
  return startOk && endOk ? o : null;
}

// Date française lisible : "2026-10-11" → "dimanche 11 octobre".
export function dateLongueFr(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// Ancienneté de l'inscription → phrase d'ouverture. Une inscrite de la semaine
// ne doit pas lire la même chose qu'une inscrite de l'an dernier.
export function ouverturePhrase(dateISO, now = Date.now()) {
  const t = dateISO ? new Date(dateISO).getTime() : 0;
  const jours = t ? Math.floor((now - t) / 86400000) : null;
  if (jours == null || Number.isNaN(jours)) {
    return "Vous faites partie de nos abonnées, et nous n'avons pas encore eu le plaisir de graver quelque chose pour vous.";
  }
  if (jours < 14) {
    return "Vous nous avez rejoints il y a quelques jours, et nous n'avons pas encore eu le plaisir de graver quelque chose pour vous.";
  }
  if (jours < 30) {
    return "Vous nous avez rejoints il y a quelques semaines, et nous n'avons pas encore eu le plaisir de graver quelque chose pour vous.";
  }
  if (jours < 90) {
    return "Vous nous suivez depuis un moment maintenant, et nous n'avons toujours pas eu le plaisir de graver quelque chose pour vous.";
  }
  return "Cela fait un moment que vous nous suivez de loin, sans que nous ayons eu le plaisir de graver quelque chose pour vous.";
}

// Nombre de jours depuis l'inscription (null si date inconnue → considérée
// comme ancienne, donc éligible).
export function joursDepuis(dateISO, now = Date.now()) {
  if (!dateISO) return null;
  const t = new Date(dateISO).getTime();
  if (!t || Number.isNaN(t)) return null;
  return Math.floor((now - t) / 86400000);
}

// L'e-mail de l'offre, à l'image de la marque. `date` = date d'inscription de
// la personne (pour adapter l'ouverture), `fin` = dernier jour de l'offre.
export function offreGravureEmail({ date = "", code = "GRAVUREOFFERTE", fin = "", cadeau = true } = {}) {
  const gold = BRAND.gold;
  const finTxt = fin ? dateLongueFr(fin) : "";
  const echeance = finTxt
    ? `<div style="color:#a24336;font-weight:bold;margin-top:12px;">Jusqu'au ${finTxt}.</div>`
    : "";
  const ligneCadeau = cadeau
    ? `<p style="margin:0 0 16px;text-align:center;color:${gold};font-weight:bold;">Et comme dans chaque colis, un cadeau vous attend — à choisir au moment du paiement.</p>`
    : "";
  const bodyHtml = `
    <p style="margin:0 0 12px;">Bonjour,</p>
    <p style="margin:0 0 16px;">${ouverturePhrase(date)} Alors voici une attention, pour franchir le pas :</p>
    <div style="text-align:center;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:14px;padding:20px;margin:0 0 16px;">
      <div style="font-family:Georgia,serif;font-size:21px;color:${gold};">La gravure offerte</div>
      <div style="color:#7a7268;margin-top:6px;">sur votre première pièce — bijou, cristal ou cadeau gravé</div>
      <div style="display:inline-block;margin-top:14px;font-size:20px;font-weight:bold;letter-spacing:3px;color:${gold};background:#fff;border:1px dashed #dcc88f;border-radius:10px;padding:12px 24px;">${code}</div>
      ${echeance}
    </div>
    ${ligneCadeau}
    <p style="margin:0 0 18px;">Un prénom sur un bracelet, une date au dos d'une plaque, un visage dans le cristal, une initiale sur un porte-clés : dites-nous ce qui compte, nous le gravons. C'est souvent le cadeau le plus simple qui touche le plus.</p>
    <p style="margin:0 0 22px;text-align:center;">
      <a href="${BRAND.siteUrl}/boutique" style="display:inline-block;background:${gold};color:#fff;text-decoration:none;padding:13px 28px;border-radius:9px;font-weight:bold;">J'en profite</a>
    </p>
    <p style="margin:0 0 10px;color:#7a7268;">Et si ce n'est pas le moment, gardez-nous simplement en tête : nous serons là au prochain anniversaire, au prochain Noël, à la prochaine naissance.</p>
    <p style="margin:0;color:#7a7268;"><strong>Niv Création</strong></p>`;
  return {
    subject: finTxt ? `Votre gravure offerte, jusqu'au ${finTxt}` : "Votre gravure offerte",
    html: emailLayout({ heading: "Votre gravure offerte", bodyHtml }),
  };
}
