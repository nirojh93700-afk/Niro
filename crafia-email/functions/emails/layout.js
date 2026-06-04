// =============================================================================
// Gabarit commun des emails Crafia (white-label)
// -----------------------------------------------------------------------------
// HTML compatible clients mail (tables + styles inline, pas de flexbox/CSS externe).
// Palette Crafia : fond violet sombre #1A0F2E, accent or #FFD89E, glassmorphism.
// Aucune mention "Firebase" : white-label complet.
// =============================================================================

const BRAND = {
  name: "Crafia",
  // Palette
  bg: "#1A0F2E", // violet sombre (fond principal)
  bgDeep: "#120A20", // fond extérieur (un cran plus sombre)
  card: "#241634", // carte glassmorphism
  cardSoft: "#2C1B40",
  border: "#3A2A52",
  gold: "#FFD89E", // or (accent / CTA)
  goldDeep: "#E9B873",
  text: "#EDE7F5", // texte clair
  textMuted: "#B9AECF", // texte secondaire
  // Liens / contacts
  appUrl: "https://app.crafia.fr",
  siteUrl: "https://crafia.fr",
  supportEmail: "support@crafia.fr",
};

// Échappe le texte injecté (titres, prénoms) pour éviter toute casse du HTML.
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Bouton CTA "bulletproof" (or), compatible Outlook via VML.
function ctaButton(label, url) {
  const safeUrl = esc(url);
  const safeLabel = esc(label);
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto;">
    <tr>
      <td align="center" bgcolor="${BRAND.gold}" style="border-radius: 12px;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="25%" stroke="f" fillcolor="${BRAND.gold}">
          <w:anchorlock/>
          <center style="color:#1A0F2E;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:bold;">${safeLabel}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${safeUrl}" target="_blank"
           style="display:inline-block; padding:15px 36px; font-family:Georgia,'Times New Roman',serif; font-size:16px; font-weight:bold; color:#1A0F2E; text-decoration:none; border-radius:12px; background:${BRAND.gold};">
          ${safeLabel}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

// Construit l'email complet à partir d'un contenu.
// opts: { title, preheader, greeting, paragraphs:[], ctaLabel, ctaUrl, afterCta:[], footerNote }
function renderEmail(opts) {
  const {
    title = "",
    preheader = "",
    greeting = "",
    paragraphs = [],
    ctaLabel = "",
    ctaUrl = "",
    afterCta = [],
    footerNote = "",
  } = opts;

  const paras = (arr) =>
    arr
      .map(
        (p) =>
          `<p style="margin:0 0 16px; font-family:'Helvetica Neue',Arial,sans-serif; font-size:15px; line-height:1.7; color:${BRAND.text};">${p}</p>`
      )
      .join("\n");

  const ctaBlock = ctaLabel && ctaUrl ? ctaButton(ctaLabel, ctaUrl) : "";

  // Lien brut de secours (certains clients bloquent les boutons).
  const fallbackLink =
    ctaUrl
      ? `<p style="margin:8px 0 0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:12px; line-height:1.6; color:${BRAND.textMuted};">
           Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur&nbsp;:<br/>
           <a href="${esc(ctaUrl)}" style="color:${BRAND.gold}; word-break:break-all;">${esc(ctaUrl)}</a>
         </p>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="supported-color-schemes" content="dark"/>
  <title>${esc(title)}</title>
  <!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0; padding:0; background:${BRAND.bgDeep}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!-- Pré-en-tête masqué (aperçu boîte de réception) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:${BRAND.bgDeep};">${esc(preheader)}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bgDeep};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- En-tête / logo -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px;">
          <tr>
            <td align="center" style="padding:8px 0 24px;">
              <span style="font-family:Georgia,'Times New Roman',serif; font-size:30px; font-weight:bold; letter-spacing:0.5px; color:${BRAND.gold};">Crafia<span style="color:${BRAND.text};">.</span></span>
            </td>
          </tr>
        </table>

        <!-- Carte principale (glassmorphism) -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background:${BRAND.card}; border:1px solid ${BRAND.border}; border-radius:20px;">
          <tr>
            <td style="height:4px; background:${BRAND.gold}; border-radius:20px 20px 0 0; line-height:4px; font-size:4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 40px 8px;">
              <h1 style="margin:0 0 20px; font-family:Georgia,'Times New Roman',serif; font-size:24px; line-height:1.3; font-weight:bold; color:${BRAND.text};">${esc(title)}</h1>
              ${greeting ? `<p style="margin:0 0 16px; font-family:'Helvetica Neue',Arial,sans-serif; font-size:15px; line-height:1.7; color:${BRAND.text};">${greeting}</p>` : ""}
              ${paras(paragraphs)}
              ${ctaBlock}
              ${fallbackLink}
              ${afterCta.length ? `<div style="margin-top:24px;">${paras(afterCta)}</div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px;">
              <hr style="border:none; border-top:1px solid ${BRAND.border}; margin:24px 0;"/>
              ${
                footerNote
                  ? `<p style="margin:0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:13px; line-height:1.6; color:${BRAND.textMuted};">${footerNote}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>

        <!-- Pied de page -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px;">
          <tr>
            <td align="center" style="padding:28px 24px 8px;">
              <p style="margin:0 0 6px; font-family:'Helvetica Neue',Arial,sans-serif; font-size:13px; line-height:1.6; color:${BRAND.textMuted};">
                Une question&nbsp;? Écrivez-nous à
                <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.gold}; text-decoration:none;">${BRAND.supportEmail}</a>
              </p>
              <p style="margin:0 0 6px; font-family:'Helvetica Neue',Arial,sans-serif; font-size:12px; line-height:1.6; color:${BRAND.textMuted};">
                <a href="${BRAND.siteUrl}" style="color:${BRAND.textMuted}; text-decoration:underline;">crafia.fr</a>
                &nbsp;·&nbsp;
                <a href="${BRAND.appUrl}" style="color:${BRAND.textMuted}; text-decoration:underline;">app.crafia.fr</a>
              </p>
              <p style="margin:12px 0 0; font-family:'Helvetica Neue',Arial,sans-serif; font-size:11px; line-height:1.6; color:#6F6488;">
                © ${new Date().getFullYear()} Crafia. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { BRAND, renderEmail, esc };
