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

// Bloc « ses pièces » : les favoris de la cliente s'il y en a (nom, photo et
// prix lus dans le catalogue EN DIRECT au moment de l'envoi), sinon quelques
// idées gravables. `pieces` = [{ slug, name, image, prix }], `favoris` = true
// si ce sont les siennes. Rien si la liste est vide.
function blocPieces(pieces, favoris) {
  const liste = (pieces || []).filter((p) => p && p.slug && p.name).slice(0, 3);
  if (!liste.length) return "";
  const titre = favoris
    ? "Les pièces que vous avez mises de côté"
    : "Quelques idées, pour commencer";
  const sous = favoris
    ? "Elles vous attendent, et la gravure de la première est offerte."
    : "Chacune se grave d'un prénom, d'une date ou d'un mot.";
  const abs = (u) => (u && String(u).startsWith("/") ? `${BRAND.siteUrl}${u}` : u || "");
  const lignes = liste.map((p) => `
      <tr>
        <td style="width:64px;padding:8px 10px 8px 0;vertical-align:middle;">
          ${p.image ? `<img src="${esc(abs(p.image))}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #ece3d2;">` : ""}
        </td>
        <td style="padding:8px 0;vertical-align:middle;">
          <a href="${BRAND.siteUrl}/produit/${esc(p.slug)}" style="color:${BRAND.ink};text-decoration:none;font-weight:bold;">${esc(p.name)}</a>
          ${p.prix ? `<div style="color:${BRAND.gold};font-weight:bold;margin-top:2px;">${esc(p.prix)}</div>` : ""}
        </td>
        <td style="padding:8px 0 8px 10px;vertical-align:middle;text-align:right;white-space:nowrap;">
          <a href="${BRAND.siteUrl}/produit/${esc(p.slug)}" style="color:${BRAND.gold};text-decoration:none;font-weight:bold;">Voir ›</a>
        </td>
      </tr>`).join("");
  return `
    <div style="background:#fff;border:1px solid #ece3d2;border-radius:14px;padding:14px 16px;margin:0 0 18px;">
      <div style="font-family:Georgia,serif;font-size:17px;color:${BRAND.gold};">${titre}</div>
      <div style="color:#7a7268;font-size:13px;margin:2px 0 6px;">${sous}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${lignes}</table>
    </div>`;
}

function esc(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// L'e-mail de l'offre, à l'image de la marque. `date` = date d'inscription de
// la personne (pour adapter l'ouverture), `fin` = dernier jour de l'offre,
// `pieces`/`favoris` = ses pièces (voir blocPieces). ADAPTÉ À CHAQUE CLIENTE :
// son ancienneté, son code à elle, ses favoris.
export function offreGravureEmail({ date = "", code = "GRAVUREOFFERTE", fin = "", cadeau = true, pieces = [], favoris = false } = {}) {
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
      <div style="color:#7a7268;margin-top:6px;">sur votre première pièce gravée — quelle qu'elle soit</div>
      <div style="display:inline-block;margin-top:14px;font-size:20px;font-weight:bold;letter-spacing:3px;color:${gold};background:#fff;border:1px dashed #dcc88f;border-radius:10px;padding:12px 24px;">${code}</div>
      ${echeance}
    </div>
    ${ligneCadeau}
    <p style="margin:0 0 18px;">Un prénom sur un bracelet, une date au dos d'une plaque, un visage dans le cristal, une initiale sur un porte-clés, un mot sur un verre : dites-nous ce qui compte, nous le gravons. C'est souvent le cadeau le plus simple qui touche le plus.</p>
    ${blocPieces(pieces, favoris)}
    <p style="margin:0 0 6px;color:#7a7268;font-size:13px;">Votre code est personnel : il fonctionne avec l'adresse à laquelle nous vous écrivons, une seule fois. Entrez-le dans votre panier, la gravure est déduite au paiement.</p>
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
