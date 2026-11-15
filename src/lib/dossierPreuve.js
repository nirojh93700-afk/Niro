// Dossier de preuve d'expédition (15/11/2026, maquette « Niv Admin ») : UN PDF pour un litige PayPal / Stripe
// ou une réclamation « colis vide / pas reçu ». Fabriqué dans le navigateur avec jsPDF ; pensé pour les limites
// de Stripe (PDF, 2 Mo par fichier) : les photos sont réduites jusqu'à ce que le fichier passe.
// Rien ne part tout seul : le gérant joint lui-même le fichier au litige.
import { PHOTOS_COLIS } from "@/lib/photosColis";
import { numerosSuivi, lienSuivi } from "@/lib/suiviColis";

export const LIMITE_STRIPE = 2 * 1024 * 1024;
const OR = [169, 137, 53];

// Helvetica de jsPDF = alphabet latin d'Europe de l'Ouest : on remplace le reste.
export function textePdf(s) {
  return String(s ?? "")
    .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .replace(/…/g, "...").replace(/[  ]/g, " ").replace(/Œ/g, "OE").replace(/œ/g, "oe")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€]/g, "");
}

const dt = (ts) => (ts ? new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "");
const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";

/** Construit le PDF. photos = [{ k, at, sha, data (dataURL JPEG), w, h }], messages = fil de la commande. */
export function fabriquerPreuve(jsPDF, { o, photos = [], messages = [], fabriqueLe = new Date() }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 16, L = W - 2 * M;
  let y = M;
  const T = (s) => textePdf(s);
  const saut = (h) => { if (y + h > 297 - M) { doc.addPage(); y = M; } };
  const titre = (s) => { saut(12); y += 3; doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...OR); doc.text(T(s.toUpperCase()), M, y); y += 5; doc.setTextColor(30, 30, 30); };
  const ligne = (s, opt = {}) => {
    const t = opt.taille || 10;
    doc.setFont("helvetica", opt.gras ? "bold" : "normal"); doc.setFontSize(t);
    for (const m of doc.splitTextToSize(T(s), L)) { saut(5); doc.text(m, M, y); y += t * 0.45; }
  };

  // En-tête
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(26, 18, 6);
  doc.text(T("Dossier de preuve d'expédition"), M, y + 2);
  doc.setFontSize(11); doc.text(T(`Commande ${o.ref || o.id}`), W - M, y + 2, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(110, 110, 110);
  doc.text(T("Niv Création · SIRET 105 914 774 00010 · 6 rue d'Armaillé, 75017 Paris · nivcreation.fr"), M, y);
  y += 3; doc.setDrawColor(...OR); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 4; doc.setTextColor(30, 30, 30);

  titre("Commande");
  ligne(`Payée le ${dt(o.createdAt)} · total ${eur(o.total)}`);
  for (const it of (o.items || [])) {
    if (/^livraison|point relais|retrait/i.test(it.name || "")) continue;
    ligne(`${it.quantity || 1} × ${it.name}${it.variantDetail ? ` (${it.variantDetail})` : ""} · ${eur(it.total)}`);
    if (it.personalization) ligne(`   Gravure : ${it.personalization}`, { taille: 8.5 });
  }
  if (o.shippingMethod) ligne(`Livraison choisie : ${o.shippingMethod}${Number(o.shippingPrice) > 0 ? ` (${eur(o.shippingPrice)})` : ""}`);

  titre("Livraison");
  const a = o.shippingAddress || {};
  ligne(o.shippingName || o.customerName || "");
  if (o.shippingCompany) ligne(o.shippingCompany);
  if (o.relaisPoint) ligne(`Point relais : ${o.relaisPoint}`);
  ligne([a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country].filter(Boolean).join(", "));
  const nums = numerosSuivi(o.tracking);
  if (nums.length) for (const n of nums) { const s = lienSuivi(n, o); ligne(`N° de suivi : ${n}${s ? ` (${s.nom}) · ${s.url}` : ""}`); }
  else ligne("N° de suivi : non renseigné");

  titre("Étapes");
  ligne(`Payée : ${dt(o.createdAt)}`);
  if (o.shippedAt) ligne(`Expédiée (remise au transporteur notée dans la gestion) : ${dt(o.shippedAt)}`);
  if (o.deliveredAt) ligne(`Marquée livrée : ${dt(o.deliveredAt)}`);
  if (o.remisAt) ligne(`Remise en main propre : ${dt(o.remisAt)}`);
  ligne("Le suivi détaillé du transporteur se consulte par le lien ci-dessus (à joindre en capture si le litige le demande).", { taille: 8.5 });

  if (photos.length) {
    titre("Photos du colis (prises à l'atelier)");
    const g = 4, larg = (L - g * 2) / 3;
    for (let i = 0; i < photos.length; i += 3) {
      const rang = photos.slice(i, i + 3);
      const hs = rang.map((p) => Math.min(80, p.h && p.w ? (larg * p.h) / p.w : larg));
      const h = Math.max(...hs);
      saut(h + 14);
      rang.forEach((p, j) => {
        const x = M + j * (larg + g);
        const ph = hs[j];
        const pw = p.h && p.w ? Math.min(larg, (ph * p.w) / p.h) : larg;
        try { doc.addImage(p.data, "JPEG", x + (larg - pw) / 2, y, pw, ph); } catch { /* photo illisible */ }
        doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 90);
        const nom = PHOTOS_COLIS.find((q) => q.k === p.k)?.t.replace(/^\d · /, "") || "Autre photo";
        doc.text(T(`${nom} · ${dt(p.at)}`), x, y + h + 4, { maxWidth: larg });
        doc.text(T(`empreinte ${String(p.sha || "").slice(0, 16)}`), x, y + h + 7.5, { maxWidth: larg });
      });
      doc.setTextColor(30, 30, 30);
      y += h + 11;
    }
  }

  const msgs = (messages || []).filter((m) => m && (m.text || m.subject));
  if (msgs.length) {
    titre("Échanges avec le client");
    for (const m of msgs.slice(-14)) {
      const qui = m.from === "atelier" ? "Atelier" : "Client";
      const txt = String(m.text || m.subject || "").replace(/\s+/g, " ").trim();
      ligne(`${dt(m.at)} · ${qui} : ${txt.slice(0, 260)}${txt.length > 260 ? "..." : ""}`, { taille: 8.5 });
      y += 0.8;
    }
  }

  saut(16); y += 4;
  doc.setFontSize(7.5); doc.setTextColor(120, 120, 120);
  const emp = photos.map((p) => `${p.k} ${p.sha}`).join(" · ");
  const fin = doc.splitTextToSize(T(`Dossier fabriqué le ${dt(fabriqueLe)} depuis l'espace de gestion de Niv Création. Les empreintes (sha256) prouvent que les photos n'ont pas été modifiées depuis leur enregistrement${emp ? ` : ${emp}` : "."}`), L);
  for (const f of fin) { saut(4); doc.text(f, M, y); y += 3.4; }
  return doc;
}
