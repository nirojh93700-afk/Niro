import fs from "fs";
import { emailLayout, BRAND } from "@/lib/email";
import { ouverturePhrase } from "@/lib/offreGravure";
const S = process.argv[2];
const gold = BRAND.gold;
const IDEES = [
  ["/produits/collier-coeur-grave-1.jpg", "Bijoux gravés", "/boutique/bijoux"],
  ["/produits/cristal-v-couple.jpg", "Cristal photo 3D", "/cristaux"],
  ["/produits/verre_a_whisky_exemple_face.jpg", "Verres gravés", "/boutique/verres"],
  ["/marque-pages/m1/exemple-ex1.jpg", "Marque-pages", "/boutique/papeterie"],
];
const cellule = ([img, t, href]) => `<td width="50%" valign="top" style="padding:6px;text-align:center;"><a href="${BRAND.siteUrl}${href}" style="text-decoration:none;color:${BRAND.ink};">
    <img src="${BRAND.siteUrl}${img}" alt="${t}" width="250" style="width:100%;max-width:250px;border-radius:12px;display:block;margin:0 auto 6px;"/>
    <span style="font-size:14px;font-weight:bold;">${t}</span></a></td>`;
const cartes = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>${IDEES.slice(0,2).map(cellule).join("")}</tr><tr>${IDEES.slice(2,4).map(cellule).join("")}</tr></table>`;
function mail(date) {
  const bodyHtml = `
    <p style="margin:0 0 12px;">Bonjour,</p>
    <p style="margin:0 0 12px;">${ouverturePhrase(date)}</p>
    <p style="margin:0 0 16px;">Noël approche, et nous aimerions vous aider à préparer vos cadeaux : voici votre code pour une gravure offerte.</p>
    <div style="text-align:center;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:14px;padding:20px;margin:0 0 16px;">
      <div style="font-family:Georgia,serif;font-size:21px;color:${gold};">🎄 Une gravure offerte pour Noël</div>
      <div style="color:#7a7268;margin-top:6px;">sur nos bijoux, le cristal et nos autres créations à graver*</div>
      <div style="display:inline-block;margin-top:14px;font-size:20px;font-weight:bold;letter-spacing:3px;color:${gold};background:#fff;border:1px dashed #dcc88f;border-radius:10px;padding:12px 24px;">GRAVURE-XXXXX</div>
      <div style="color:#9a9087;font-size:11px;margin-top:10px;">*Une gravure offerte par commande, sur une création qui se grave. Le code ne s'ajoute pas à une gravure déjà offerte. Les gravures supplémentaires restent au tarif habituel.</div>
    </div>
    <p style="margin:0 0 8px;">Un prénom sur un bracelet, une date au dos d'un collier, un petit mot dans le cristal : avec votre code, cette gravure est pour nous.</p>
    <p style="margin:0 0 16px;">Et sur certaines créations, la première gravure est <b>déjà offerte</b>, même sans code : sur les verres et flûtes gravés (le premier verre), sur les marque-pages en bois et sur le support de téléphone.</p>
    ${cartes}
    <p style="margin:0 0 16px;">Pour les bijoux, nos emballages de Noël sont là : sachet rouge, boîte à ruban « Merry Christmas », sac de Noël, et le Pack de Noël.</p>
    <p style="margin:0 0 6px;color:#7a7268;font-size:13px;">Votre code est personnel : il fonctionne avec l'adresse à laquelle nous vous écrivons, une seule fois. Entrez-le dans votre panier, la gravure est déduite au paiement.</p>
    <p style="margin:0 0 22px;text-align:center;">
      <a href="${BRAND.siteUrl}/offrir/noel" style="display:inline-block;background:${gold};color:#fff;text-decoration:none;padding:13px 28px;border-radius:9px;font-weight:bold;">Préparer mes cadeaux</a>
    </p>
    <p style="margin:0;color:#7a7268;"><strong>Niv Création</strong></p>`;
  return emailLayout({ heading: "Pour Noël, une gravure offerte", bodyHtml });
}
const now = Date.now(), j = (n) => new Date(now - n * 86400000).toISOString();
const variantes = [["Inscrite il y a moins de 2 semaines", j(5)], ["Inscrite il y a 2 à 4 semaines", j(20)], ["Inscrite il y a 1 à 3 mois", j(50)], ["Inscrite il y a plus de 3 mois", j(100)]];
const page = `<!doctype html><meta charset="utf-8"><title>Mail Noël inscrites — aperçu</title><body style="margin:0;background:#ddd;font-family:Arial">
<div style="max-width:640px;margin:0 auto;padding:16px"><p><b>Objet :</b> 🎄 Pour Noël, une gravure offerte</p>
<p>Seule la 2e phrase change selon la date d'inscription. Le code est un exemple : le vrai code de chaque personne sera créé juste avant l'envoi.</p>
${variantes.map(([t, d], i) => `<details${i ? "" : " open"} style="margin:0 0 10px;background:#fff;border-radius:8px;padding:8px"><summary><b>${t}</b> — « ${ouverturePhrase(d)} »</summary>${mail(d)}</details>`).join("")}</div>`;
let html = page;
for (const m of new Set([...page.matchAll(/https:\/\/nivcreation\.fr(\/[^"')\s]+\.(?:jpg|jpeg|png|webp))/g)].map((x) => x[1]))) {
  const f = "public" + m; if (fs.existsSync(f)) html = html.split(BRAND.siteUrl + m).join("data:image/" + (m.endsWith("png") ? "png" : m.endsWith("webp") ? "webp" : "jpeg") + ";base64," + fs.readFileSync(f).toString("base64"));
}
fs.writeFileSync(`${S}/mail-noel-inscrites.html`, html);
