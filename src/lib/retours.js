// DEMANDES DE RETOUR (24/11/2026, gérant : « mets-moi en place tout ce qui est demande de retour…
// je dois savoir combien de demandes de retour par rapport aux commandes »).
// Une demande de retour est rangée SUR la commande (champ `retour`), jamais ailleurs : Gestion → Commandes →
// Retours la lit, la fiche commande la modifie, la question sur les chiffres la compte. Calculs purs (testés).

export const RETOUR_ETATS = [
  { id: "demande", lib: "Demandé", tone: "warn", aide: "La cliente a demandé un retour, rien n'est encore décidé." },
  { id: "accepte", lib: "Accepté · en attente du colis", tone: "info", aide: "Le retour est accepté (étiquette envoyée ou à envoyer), le colis n'est pas encore arrivé." },
  { id: "recu", lib: "Colis reçu", tone: "info", aide: "Le colis est revenu à l'atelier : rembourser ou renvoyer." },
  { id: "rembourse", lib: "Remboursé", tone: "ok", aide: "Terminé : la cliente est remboursée." },
  { id: "echange", lib: "Échangé / renvoyé", tone: "ok", aide: "Terminé : une autre pièce lui a été envoyée." },
  { id: "refuse", lib: "Refusé", tone: "grey", aide: "Terminé : retour refusé (pièce personnalisée conforme, délai dépassé…)." },
];
export const RETOUR_ETAT = Object.fromEntries(RETOUR_ETATS.map((e) => [e.id, e]));
export const RETOUR_EN_COURS = new Set(["demande", "accepte", "recu"]);

export const RETOUR_MOTIFS = [
  { id: "gravure", lib: "Gravure fausse (erreur de l'atelier)", atelier: true },
  { id: "produit", lib: "Mauvais produit envoyé", atelier: true },
  { id: "abime", lib: "Arrivé abîmé / cassé", atelier: true },
  { id: "manque", lib: "Pièce manquante dans le colis", atelier: true },
  { id: "rendu", lib: "Rendu qui ne plaît pas", atelier: false },
  { id: "retractation", lib: "Rétractation (article non personnalisé)", atelier: false },
  { id: "taille", lib: "Taille qui ne va pas", atelier: false },
  { id: "autre", lib: "Autre", atelier: false },
];
export const RETOUR_MOTIF = Object.fromEntries(RETOUR_MOTIFS.map((m) => [m.id, m]));

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Nettoie une demande de retour envoyée par Gestion (jamais de confiance aveugle). `avant` = celle déjà rangée. */
export function normaliserRetour(entree, avant = null, maintenant = new Date().toISOString()) {
  const e = entree || {};
  const etat = RETOUR_ETAT[e.etat] ? e.etat : (avant?.etat || "demande");
  const motif = RETOUR_MOTIF[e.motif] ? e.motif : (avant?.motif || "autre");
  const note = typeof e.note === "string" ? e.note.trim().slice(0, 800) : (avant?.note || "");
  let montant = avant?.montant ?? null;
  if (e.montant !== undefined) {
    const v = e.montant === "" || e.montant === null ? null : r2(String(e.montant).replace(",", "."));
    montant = v === null || (Number.isFinite(v) && v >= 0 && v < 10000) ? v : montant;
  }
  const demandeLe = (typeof e.demandeLe === "string" && !Number.isNaN(Date.parse(e.demandeLe)) ? new Date(e.demandeLe).toISOString() : null) || avant?.demandeLe || maintenant;
  const hist = Array.isArray(avant?.hist) ? [...avant.hist] : [];
  if (!avant || avant.etat !== etat) hist.push({ etat, at: maintenant });
  return { etat, motif, note, montant, demandeLe, majLe: maintenant, hist: hist.slice(-12) };
}

/** Les commandes qui comptent pour le taux : ni test, ni complément rattaché. */
const compte = (o) => o && !o.test && !o.rattacheA;

/** Une commande a-t-elle une demande de retour ? */
export const aUnRetour = (o) => Boolean(o?.retour && RETOUR_ETAT[o.retour.etat]);

/** Pastille de la file / de la fiche : « ↩ Retour : demandé » (null s'il n'y en a pas). */
export function pastilleRetour(o) {
  if (!aUnRetour(o)) return null;
  const e = RETOUR_ETAT[o.retour.etat];
  return { k: "retour", tone: RETOUR_EN_COURS.has(o.retour.etat) ? "bad" : "grey", lib: `↩ Retour : ${e.lib.toLowerCase()} · ${RETOUR_MOTIF[o.retour.motif]?.lib || "motif ?"}` };
}

/**
 * Le tableau des retours : combien de demandes par rapport aux commandes, par étape, par motif,
 * par produit et par mois. `depuis` (facultatif, ISO) limite aux commandes passées depuis cette date.
 */
export function statsRetours(orders, { depuis = "" } = {}) {
  const t0 = depuis ? Date.parse(depuis) || 0 : 0;
  const cmd = (orders || []).filter((o) => compte(o) && (!t0 || (Date.parse(o.createdAt || "") || 0) >= t0));
  const ret = cmd.filter(aUnRetour);
  const parEtat = Object.fromEntries(RETOUR_ETATS.map((e) => [e.id, 0]));
  const parMotif = {};
  const parProduit = {};
  const parMois = {};
  let rembourse = 0, erreursAtelier = 0;
  for (const o of ret) {
    const r = o.retour;
    parEtat[r.etat] += 1;
    parMotif[r.motif] = (parMotif[r.motif] || 0) + 1;
    if (RETOUR_MOTIF[r.motif]?.atelier) erreursAtelier += 1;
    if (r.etat === "rembourse") rembourse += Number(r.montant) || 0;
    const mois = String(r.demandeLe || o.createdAt || "").slice(0, 7);
    if (mois) parMois[mois] = (parMois[mois] || 0) + 1;
    for (const it of o.items || []) {
      const nom = String(it.name || "").split(" — ")[0].trim();
      if (nom && !/^livraison/i.test(nom)) parProduit[nom] = (parProduit[nom] || 0) + 1;
    }
  }
  // Commandes vendues par produit (pour un taux par produit).
  const ventesProduit = {};
  for (const o of cmd) for (const it of o.items || []) {
    const nom = String(it.name || "").split(" — ")[0].trim();
    if (nom) ventesProduit[nom] = (ventesProduit[nom] || 0) + 1;
  }
  const taux = cmd.length ? ret.length / cmd.length : 0;
  return {
    commandes: cmd.length,
    retours: ret.length,
    taux,
    tauxTexte: `${(taux * 100).toFixed(1).replace(".", ",")} %`,
    enCours: ret.filter((o) => RETOUR_EN_COURS.has(o.retour.etat)).length,
    erreursAtelier,
    rembourse: r2(rembourse),
    parEtat,
    parMotif: Object.entries(parMotif).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, lib: RETOUR_MOTIF[id]?.lib || id, n })),
    parProduit: Object.entries(parProduit).sort((a, b) => b[1] - a[1]).map(([nom, n]) => ({ nom, n, vendus: ventesProduit[nom] || n, taux: (ventesProduit[nom] || n) ? n / (ventesProduit[nom] || n) : 0 })),
    parMois: Object.entries(parMois).sort((a, b) => a[0].localeCompare(b[0])).map(([mois, n]) => ({ mois, n })),
  };
}

/** Version compacte pour l'assistant « Posez une question sur vos chiffres ». */
export function retoursPourAgregats(orders) {
  const s = statsRetours(orders);
  return {
    note: "Demandes de retour déclarées dans Gestion (champ retour de la commande), comptées sur toutes les commandes hors tests.",
    commandes: s.commandes,
    demandesDeRetour: s.retours,
    tauxDeRetour: s.tauxTexte,
    enCours: s.enCours,
    duesAUneErreurDeLAtelier: s.erreursAtelier,
    montantRembourse: s.rembourse,
    parEtape: Object.fromEntries(RETOUR_ETATS.map((e) => [e.lib, s.parEtat[e.id]])),
    parMotif: s.parMotif.map((m) => ({ motif: m.lib, n: m.n })),
    parProduit: s.parProduit.slice(0, 15).map((p) => ({ produit: p.nom, retours: p.n, commandes: p.vendus })),
    parMois: s.parMois,
  };
}
