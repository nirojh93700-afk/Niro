// 📒 Finances › Comptabilité (15/11/2026, maquette « Niv Admin ») : calculs purs (testables), pour un
// micro-entrepreneur qui vend des marchandises. Tout se remplit tout seul avec les commandes du site (devis payés
// compris), les ventes hors site et le classeur des factures. Rien n'est ressaisi.
// Chiffres officiels vérifiés le 15/11/2026 (economie.gouv.fr, service-public.fr, impots.gouv.fr) :
//  · cotisations sociales, vente de marchandises (BIC) : 12,3 % ; prestations de services BIC : 21,2 % ;
//  · contribution à la formation professionnelle : 0,1 % (commerçant), 0,3 % (artisan) ;
//  · versement libératoire de l'impôt (si choisi) : 1 % des ventes ;
//  · plafond micro-entreprise : 203 100 € (ventes), 83 600 € (services) — 2026 à 2028 ;
//  · franchise de TVA : 85 000 € (ventes), seuil majoré 93 500 € ; services 37 500 € / 41 250 €.
export const COMPTA_DEFAUT = { taux: 12.3, cfp: 0.1, vl: 0 };
export const SEUILS_2026 = {
  tva: { seuil: 85000, majore: 93500, libelle: "Franchise de TVA (ventes)" },
  micro: { seuil: 203100, libelle: "Régime micro-entreprise (ventes)" },
  tvaServices: { seuil: 37500, majore: 41250 },
  microServices: { seuil: 83600 },
};
export const DEBUT_ACTIVITE = "2026-06";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const cleMois = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`; };
const isoJour = (d) => new Date(d).toISOString().slice(0, 10);

export function reglageCompta(settings) {
  const c = (settings && settings.compta) || {};
  const nb = (v, d) => (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) < 40 ? Number(v) : d);
  return { taux: nb(c.taux, COMPTA_DEFAUT.taux), cfp: nb(c.cfp, COMPTA_DEFAUT.cfp), vl: nb(c.vl, COMPTA_DEFAUT.vl) };
}

const LIGNES_SERVICE = /^(livraison|point relais|retrait|express)/i;
function nature(o) {
  const it = (o.items || []).filter((x) => !LIGNES_SERVICE.test(x.name || ""));
  const t = it.map((x) => `${x.quantity > 1 ? x.quantity + " × " : ""}${x.name}`).join(", ");
  return (t || "Commande").slice(0, 140);
}

/** Livre des recettes : une ligne par encaissement (commandes, ventes hors site) et par remboursement. */
export function livreRecettes({ orders = [], ventesExternes = [] }) {
  const out = [];
  for (const o of Array.isArray(orders) ? orders : []) {
    if (!o || o.test || o.status === "annulee" || !o.createdAt) continue;
    const date = isoJour(o.createdAt);
    if (o.status === "remboursee") continue; // remboursée en entier : pas de recette (comme le reste de Gestion)
    out.push({ date, mois: cleMois(o.createdAt), piece: o.ref || o.id, facture: o.quoteNumber || "", client: o.customerName || o.shippingName || o.customerEmail || "Client", nature: nature(o), reglement: "En ligne (Stripe : carte, PayPal…)", montant: r2(o.total), type: "vente", orderId: o.id });
    for (const rb of Array.isArray(o.remboursements) ? o.remboursements : []) {
      if (!rb || !(Number(rb.montant) > 0)) continue;
      const at = rb.at || o.createdAt;
      out.push({ date: isoJour(at), mois: cleMois(at), piece: o.ref || o.id, facture: o.quoteNumber || "", client: o.customerName || "Client", nature: "Remboursement partiel", reglement: "Remboursé par Stripe", montant: -r2(rb.montant), type: "remboursement", orderId: o.id });
    }
  }
  for (const v of Array.isArray(ventesExternes) ? ventesExternes : []) {
    if (!v || !/^\d{4}-\d{2}$/.test(String(v.mois || ""))) continue;
    out.push({ date: `${v.mois}-01`, mois: v.mois, piece: "hors site", facture: "", client: v.source || "Vente hors site", nature: `Vente hors site${v.source ? ` (${v.source})` : ""} · total du mois`, reglement: v.source || "Autre", montant: r2(v.montant), type: "hors-site", id: v.id });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function caParMois(recettes) {
  const m = {};
  for (const r of recettes) m[r.mois] = r2((m[r.mois] || 0) + r.montant);
  return m;
}

export function cotisations(ca, regl) {
  const t = (regl.taux + regl.cfp + regl.vl) / 100;
  return r2(ca * t);
}

/** Déclarations URSSAF mensuelles depuis le début d'activité (mois terminés). */
export function declarationsUrssaf({ recettes, declared = {}, regl, maintenant = new Date() }) {
  const parMois = caParMois(recettes);
  const detail = {};
  for (const r of recettes) {
    const d = (detail[r.mois] = detail[r.mois] || { site: 0, devis: 0, horsSite: 0, remb: 0 });
    if (r.type === "hors-site") d.horsSite = r2(d.horsSite + r.montant);
    else if (r.type === "remboursement") d.remb = r2(d.remb + r.montant);
    else if (r.facture) d.devis = r2(d.devis + r.montant);
    else d.site = r2(d.site + r.montant);
  }
  const out = [];
  const [a0, m0] = DEBUT_ACTIVITE.split("-").map(Number);
  for (let a = a0, m = m0 - 1; a < maintenant.getFullYear() || (a === maintenant.getFullYear() && m < maintenant.getMonth()); m === 11 ? (a++, m = 0) : m++) {
    const k = `${a}-${String(m + 1).padStart(2, "0")}`;
    const ca = r2(parMois[k] || 0);
    const echeance = new Date(a, m + 2, 0);
    out.push({ mois: k, ca, cotisations: cotisations(ca, regl), detail: detail[k] || { site: 0, devis: 0, horsSite: 0, remb: 0 }, echeance: isoJour(new Date(echeance.getFullYear(), echeance.getMonth(), echeance.getDate(), 12)), declareLe: declared[k] || "" });
  }
  return out.reverse();
}

export function tableauDeBord({ recettes, achats = [], regl, declarations = [], maintenant = new Date() }) {
  const annee = String(maintenant.getFullYear());
  const ceMois = cleMois(maintenant);
  const prec = cleMois(new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 15));
  const parMois = caParMois(recettes);
  const caAnnee = r2(recettes.filter((r) => r.date.startsWith(annee)).reduce((s, r) => s + r.montant, 0));
  const aDeclarer = declarations.filter((d) => !d.declareLe).sort((a, b) => a.mois.localeCompare(b.mois))[0] || null;
  const mois6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 15);
    const k = cleMois(d);
    mois6.push({ mois: k, recettes: r2(parMois[k] || 0), achats: r2(achats.filter((x) => String(x.date).startsWith(k)).reduce((s, x) => s + (Number(x.montant) || 0), 0)) });
  }
  const jauge = (s) => ({ ...s, valeur: caAnnee, part: s.seuil ? Math.min(1, caAnnee / s.seuil) : 0, alerte: caAnnee >= 0.8 * s.seuil });
  return {
    caAnnee, caMois: r2(parMois[ceMois] || 0), caMoisPrec: r2(parMois[prec] || 0),
    aDeclarer, cotisationsEstimees: aDeclarer ? aDeclarer.cotisations : 0,
    jauges: [jauge(SEUILS_2026.tva), jauge(SEUILS_2026.micro)],
    mois6, tauxTotal: r2(regl.taux + regl.cfp + regl.vl),
  };
}

/** Rapprochement d'un versement Stripe : les paiements qu'il contient comparés aux commandes connues. */
export function rapprocherVersement(versement, ordersParPI) {
  const lignes = versement.transactions || [];
  const ventes = lignes.filter((t) => t.type === "charge" || t.type === "payment");
  const trouvees = ventes.map((t) => ({ ...t, order: t.paymentIntent ? ordersParPI[t.paymentIntent] || null : null }));
  const brut = r2(ventes.reduce((s, t) => s + t.montant, 0));
  const frais = r2(lignes.reduce((s, t) => s + (t.frais || 0), 0));
  const autres = r2(lignes.filter((t) => !(t.type === "charge" || t.type === "payment")).reduce((s, t) => s + t.montant, 0));
  const sansCommande = trouvees.filter((t) => !t.order);
  const net = r2(brut - frais + autres);
  const ecart = r2(versement.montant - net);
  return { ...versement, ventes: trouvees, brut, frais, autres, sansCommande: sansCommande.length, ecart, etat: Math.abs(ecart) < 0.02 && !sansCommande.length ? "ok" : "ecart" };
}
