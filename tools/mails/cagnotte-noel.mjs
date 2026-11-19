// Mail « votre cagnotte vous attend » (19/11/2026, gérant : « prépare aussi pour les gens qui n'ont pas utilisé les cagnottes »).
// Usage : node --import ./tools/alias-register.mjs tools/mails/cagnotte-noel.mjs <dossier> (lit <dossier>/cag-cible-ok.json, écrit l'aperçu).
// ⛔ Gérant (19/11) : jamais aux clientes qui peuvent encore demander un remboursement : commande en cours (à préparer, en gravure,
// expédiée), livrée depuis moins de 14 jours, annulée ou remboursée. Liste filtrée = cag-cible-ok.json (34 clientes, 64,41 € au 19/11).
import fs from "fs";
import { emailLayout, BRAND } from "@/lib/email";
const S = process.argv[2];
const cible = JSON.parse(fs.readFileSync(`${S}/cag-cible-ok.json`, "utf8"));
const gold = BRAND.gold;
const euro = (n) => n.toFixed(2).replace(".", ",") + " €";
// Pas de prénom dans le mail : le nom est parfois écrit nom puis prénom (« Cerisel Eric »), ou c'est une adresse.
const prenom = (n) => {
  const p = String(n || "").trim().split(/\s+/)[0] || "";
  if (!p || /\d/.test(p) || /^(résidence|residence|la|le|les)$/i.test(p)) return "";
  return p[0].toUpperCase() + p.slice(1).toLowerCase();
};
function rappel(items) {
  const t = (items || []).join(" ").toLowerCase();
  if (/cristal|socle/.test(t)) return "votre cristal photo 3D";
  if (/flûte/.test(t)) return "vos flûtes gravées";
  if (/tumbler|whisky/.test(t)) return "votre verre à whisky gravé";
  if (/carafe/.test(t)) return "votre carafe gravée";
  if (/vin|cocktail/.test(t)) return "votre verre gravé";
  if (/carnet/.test(t)) return "votre carnet gravé";
  if (/marque-page/.test(t)) return "votre marque-page";
  if (/support/.test(t)) return "votre support de téléphone";
  if (/collier|bracelet|médaillon|gourmette|pièce/.test(t)) return "votre bijou gravé";
  return "votre commande";
}
const IDEES = [
  ["/produits/collier-coeur-grave-1.jpg", "Bijoux gravés", "/boutique/bijoux"],
  ["/produits/cristal-v-couple.jpg", "Cristal photo 3D", "/cristaux"],
  ["/produits/verre_a_whisky_exemple_face.jpg", "Verres gravés", "/boutique/verres"],
  ["/marque-pages/m1/exemple-ex1.jpg", "Marque-pages", "/boutique/papeterie"],
];
const cellule = ([img, t, href]) => `<td width="50%" valign="top" style="padding:6px;text-align:center;"><a href="${BRAND.siteUrl}${href}" style="text-decoration:none;color:${BRAND.ink};">
    <img src="${BRAND.siteUrl}${img}" alt="${t}" width="250" style="width:100%;max-width:250px;border-radius:12px;display:block;margin:0 auto 6px;"/>
    <span style="font-size:14px;font-weight:bold;">${t}</span></a></td>`;
const cartes = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>${IDEES.slice(0, 2).map(cellule).join("")}</tr><tr>${IDEES.slice(2, 4).map(cellule).join("")}</tr></table>`;
export function mailCagnotte(c) {
  const quoi = rappel(c.items);
  const bodyHtml = `
    <p style="margin:0 0 12px;">Bonjour,</p>
    <p style="margin:0 0 12px;">Merci encore de nous avoir confié ${quoi}. À chaque commande, une partie de vos achats est mise de côté pour vous, dans votre cagnotte fidélité.</p>
    <div style="text-align:center;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:14px;padding:20px;margin:0 0 16px;">
      <div style="font-family:Georgia,serif;font-size:20px;color:${gold};">🎄 Votre cagnotte fidélité</div>
      <div style="font-size:30px;font-weight:bold;color:${gold};margin-top:10px;">${euro(c.solde)}</div>
      <div style="color:#7a7268;margin-top:6px;">à utiliser pour vos cadeaux de Noël</div>
    </div>
    <p style="margin:0 0 8px;"><b>Pour l'utiliser, c'est simple :</b></p>
    <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;">
      <li>Connectez-vous à votre espace client avec cette adresse e-mail.</li>
      <li>Dans votre panier, cochez « Utiliser ma cagnotte fidélité ».</li>
    </ol>
    <p style="margin:0 0 16px;">Le montant est déduit au paiement, jusqu'à la moitié de votre panier.</p>
    ${cartes}
    <p style="margin:0 0 16px;">Pour les bijoux, nos emballages de Noël sont là : sachet rouge, boîte à ruban « Merry Christmas », sac de Noël, et le Pack de Noël.</p>
    <p style="margin:0 0 22px;text-align:center;">
      <a href="${BRAND.siteUrl}/espace" style="display:inline-block;background:${gold};color:#fff;text-decoration:none;padding:13px 28px;border-radius:9px;font-weight:bold;">Utiliser ma cagnotte</a>
    </p>
    <p style="margin:0;color:#7a7268;"><strong>Niv Création</strong></p>`;
  return emailLayout({ heading: "Votre cagnotte vous attend", bodyHtml });
}
const tri = [...cible].sort((a, b) => b.solde - a.solde);
let page = `<!doctype html><meta charset="utf-8"><title>Mail cagnotte — aperçu</title><body style="margin:0;background:#ddd;font-family:Arial">
<div style="max-width:640px;margin:0 auto;padding:16px"><p><b>Objet :</b> 🎄 Votre cagnotte vous attend pour Noël</p>
<p>${tri.length} clientes. Le montant, le prénom et la phrase « vous nous avez confié… » changent pour chacune.</p>
${tri.map((c, i) => `<details${i ? "" : " open"} style="margin:0 0 10px;background:#fff;border-radius:8px;padding:8px"><summary><b>${c.nom || "(sans nom)"}</b> — ${euro(c.solde)}</summary>${i ? "" : mailCagnotte(c)}</details>`).join("")}</div>`;
for (const m of new Set([...page.matchAll(/https:\/\/nivcreation\.fr(\/[^"')\s]+\.(?:jpg|jpeg|png|webp))/g)].map((x) => x[1]))) {
  const f = "public" + m; if (fs.existsSync(f)) page = page.split(BRAND.siteUrl + m).join("data:image/jpeg;base64," + fs.readFileSync(f).toString("base64"));
}
fs.writeFileSync(`${S}/mail-cagnotte.html`, page);
