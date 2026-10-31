// Mail « Votre cagnotte fidélité vous attend pour Noël » (31/10/2026, gérant : photos en fond avec le texte
// posé dessus, idées cadeaux bijoux / marque-pages / cristal, sans montant). Utilisé par
// /api/admin/send-client-email quand `modele: "cagnotte-noel"` : le TEXTE reste celui que l'atelier envoie
// (personnalisé par cliente), ce fichier ne fait que l'habillage. Chaque photo en fond a une couleur de
// secours (bgcolor) : si la boîte mail bloque les images (Outlook Windows…), le texte reste lisible.
import { escapeHtml as esc, BRAND } from "@/lib/email";

const site = BRAND.siteUrl;
const G = BRAND.gold;
const INK = "#241a0c";

const fond = (img, h, inner, pos = "center") => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td background="${site}${img}" bgcolor="${INK}" height="${h}" valign="bottom" style="background-image:url('${site}${img}');background-size:cover;background-position:${pos};background-color:${INK};height:${h}px;border-radius:14px;">
  ${inner}</td></tr></table>`;
const voile = (html) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td style="background-color:rgba(20,14,4,0.62);padding:10px 14px;border-radius:0 0 14px 14px;text-align:left;">${html}</td></tr></table>`;
const btn = (url, t) => `<a href="${site}${url}" style="display:inline-block;background:${G};color:${INK};text-decoration:none;padding:8px 18px;border-radius:999px;font-size:12px;font-weight:bold;">${t}</a>`;
const tuile = (img, nom, sous, url, h, pos = "center top") => fond(img, h, voile(`<div style="font-family:Georgia,serif;font-size:16px;color:#fff;line-height:1.25;">${esc(nom)}</div>
  <a href="${site}${url}" style="font-size:12px;color:#e2c67e;text-decoration:none;font-weight:bold;">${esc(sous)} →</a>`), pos);
const titre = (t) => `<div style="margin:26px 0 10px;text-align:center;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#a98935;">✦ ${esc(t)} ✦</div>`;
const deux = (a, b) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr>
  <td width="50%" valign="top" style="padding:0 5px 10px 0;">${a}</td><td width="50%" valign="top" style="padding:0 0 10px 5px;">${b}</td></tr></table>`;
const espace = `<div style="height:10px;line-height:10px;">&nbsp;</div>`;

function hero() {
  const img = "/emails/cagnotte-noel-fond.jpg";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td background="${site}${img}" bgcolor="${INK}" height="380" valign="middle" style="background-image:url('${site}${img}');background-size:cover;background-position:center;background-color:${INK};height:380px;text-align:center;padding:30px 24px;">
    <div style="font-size:12px;letter-spacing:4px;color:#e2c67e;text-transform:uppercase;">✦ Pour vos cadeaux de Noël ✦</div>
    <div style="font-family:Georgia,serif;font-size:34px;line-height:1.15;color:#ffffff;margin:14px 0 12px;">Votre cagnotte fidélité<br>vous attend</div>
    <div style="font-size:15px;color:#f3e7cc;line-height:1.5;">Elle est à utiliser sur toute la boutique</div>
    <div style="margin-top:20px;"><a href="${site}/espace" style="display:inline-block;background:${G};color:${INK};text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:bold;font-size:15px;">Voir ma cagnotte</a></div>
  </td></tr></table>`;
}

function idees() {
  return `<div style="text-align:center;font-family:Georgia,serif;font-size:22px;color:${G};margin:30px 0 4px;">Quelques idées pour vos cadeaux</div>`
    + titre("Les bijoux préférés")
    + fond("/produits/collier-coeur-grave-1.jpg", 420, voile(`<div style="font-family:Georgia,serif;font-size:19px;color:#fff;">Collier Cœur gravé</div>
      <div style="font-size:13px;color:#ead9b0;margin:2px 0 8px;">Des initiales, un prénom, une date</div>${btn("/produit/collier-coeur-grave", "Personnaliser")}`), "center 30%")
    + espace
    + deux(tuile("/produits/collier-double-coeur-3.jpg", "Collier Double Cœur", "Un mot doux au verso", "/produit/collier-double-coeur", 330),
      tuile("/produits/collier-coeur-plaques-1.jpg", "Collier Cœur & plaques", "Un prénom par plaque", "/produit/collier-coeur-plaques", 330))
    + tuile("/produits/bracelet-cordon-plaque-4.jpg", "Bracelet à plaque gravée", "Des initiales, un symbole", "/produit/bracelet-cordon-plaque", 300, "center 35%")
    + titre("Nos marque-pages")
    + deux(tuile("/marque-pages/m1/exemple-ex1.jpg", "Marque-page en bois", "Un prénom, un dessin gravés", "/produit/marque-page-bois-pompon", 330, "center 20%"),
      tuile("/marque-pages/metal/09-nympheas-monet-pompon.jpg", "Marque-page en métal", "Les tableaux de Monet et Van Gogh", "/produit/marque-page-metal-peinture", 330, "center 20%"))
    + titre("Le cristal")
    + fond("/produits/cristal-h-famille.jpg", 340, voile(`<div style="font-family:Georgia,serif;font-size:19px;color:#fff;">Cristal photo 3D</div>
      <div style="font-size:13px;color:#ead9b0;margin:2px 0 8px;">Votre photo gravée en 3D</div>${btn("/produit/cristal-photo-3d-horizontal", "Découvrir")}`))
    + espace
    + fond("/produits/cristaux-graves/colibri.jpg", 300, voile(`<div style="font-family:Georgia,serif;font-size:18px;color:#fff;">Cristaux déjà gravés</div>
      <div style="font-size:12px;color:#ead9b0;margin:4px 0 10px;">Modèles, dessins, signes du zodiaque</div>${btn("/cristaux-graves", "Découvrir")}`));
}

/** HTML complet du mail : bandeau photo + texte de l'atelier + idées cadeaux + bouton Répondre + signature. */
export function mailCagnotteNoel({ message, replyBtn = "" }) {
  const logo = BRAND.logoUrl
    ? `<img src="${BRAND.logoUrl}" alt="Niv Création — Atelier de personnalisation" style="display:block;width:100%;max-width:600px;height:auto;border:0;">`
    : `<div style="text-align:center;padding:30px 24px;font-family:Georgia,serif;font-size:38px;color:${G};font-weight:bold;">NiV</div>`;
  return `<div style="background:#f1e9da;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ece3d2;">
  <tr><td style="background:${BRAND.cream};border-bottom:3px solid #dcc88f;">${logo}</td></tr>
  <tr><td>${hero()}</td></tr>
  <tr><td style="padding:26px;font-size:15px;line-height:1.6;">
    <div style="white-space:pre-line;">${esc(message)}</div>
    ${idees()}
    ${replyBtn}
    <p style="margin-top:18px;color:#7a7268;">Cordialement,<br><strong>Niv Création</strong><br>${site.replace(/^https?:\/\//, "")}</p>
  </td></tr>
  <tr><td style="background:${BRAND.ink};padding:24px;text-align:center;color:#e9dfca;font-size:12px;line-height:1.7;">
    <div style="font-family:Georgia,serif;color:#dcc88f;font-size:16px;letter-spacing:3px;margin-bottom:10px;">NiV CRÉATION</div>
    <a href="${site}" style="color:#e9dfca;text-decoration:none;">${BRAND.siteLabel}</a> &nbsp;·&nbsp; <a href="mailto:${BRAND.contact}" style="color:#e9dfca;text-decoration:none;">${BRAND.contact}</a>
    <div style="margin-top:12px;color:#bdab86;letter-spacing:1px;">✦ Personnalisé en France · Gravure &amp; découpe laser ✦</div>
  </td></tr>
</table></td></tr></table></div>`;
}
