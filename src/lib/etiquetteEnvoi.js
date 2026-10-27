// Prix d'une étiquette d'envoi payée au transporteur, et ce qu'une commande laisse sur la livraison.
// Source UNIQUE pour la fenêtre « Conditionnement », les ratés (renvoi d'un colis) et la page Bénéfices.
//
// Prix réels relevés sur Boxtal le 27/10/2026 (capture du gérant), affichés HORS TAXES :
//   Mondial Relay point relais 3,14 € HT · Colissimo point retrait 5,26 € HT.
// Le gérant paie la TVA (micro-entreprise) : on compte le prix TTC (HT × 1,2).
// Lettre suivie La Poste ≤ 100 g : 4,45 € (pas de TVA ajoutée sur un affranchissement).
// Colis à domicile et express : pas encore de prix relevé → estimation, à corriger à l'écran.

const TTC = (ht) => Math.round(ht * 1.2 * 100) / 100;

export const PRIX_ETIQUETTE = {
  mondialRelay: TTC(3.14), // 3,77 €
  colissimoRelais: TTC(5.26), // 6,31 €
  lettre: 4.45,
  domicile: 6.12, // Mondial Relay domicile ≈ 5,10 € HT (estimation)
  autreRelais: 6.12, // Relais Colis, Chrono Shop2Shop, UPS : estimation
};

// Libellé lisible du prix choisi, pour l'écran.
export function origineEtiquette(order, produitDe) {
  return choisir(order, produitDe).libelle;
}

export function etiquetteEstimee(order, produitDe) {
  return choisir(order, produitDe).prix;
}

function choisir(order, produitDe = () => null) {
  const methode = String(order?.shippingMethod || "");
  const relais = String(order?.relaisPoint || "");
  if (/main propre|retrait/i.test(methode) && !/point retrait|colissimo/i.test(methode)) return { prix: 0, libelle: "retrait en main propre" };
  const tout = `${methode} ${relais}`;
  if (relais || /point relais|relais|point retrait/i.test(methode)) {
    if (/mondial/i.test(tout)) return { prix: PRIX_ETIQUETTE.mondialRelay, libelle: "Mondial Relay point relais (3,14 € HT)" };
    if (/colissimo|la poste/i.test(tout)) return { prix: PRIX_ETIQUETTE.colissimoRelais, libelle: "Colissimo point retrait (5,26 € HT)" };
    return { prix: PRIX_ETIQUETTE.autreRelais, libelle: "point relais (estimation)" };
  }
  const lignes = (order?.items || []).filter((i) => !/livraison|point relais|retrait|exp[ée]dition/i.test(i.name || ""));
  const lettre = lignes.length && lignes.every((i) => produitDe(i.slug)?.letter) && !lignes.some((i) => /bo[iî]te|pack/i.test(i.details || ""));
  if (lettre) return { prix: PRIX_ETIQUETTE.lettre, libelle: "lettre suivie La Poste" };
  return { prix: PRIX_ETIQUETTE.domicile, libelle: "colis à domicile (estimation)" };
}

// Ce que coûte au total un raté (pièces + éventuel colis renvoyé).
export const perteRate = (r) => (Number(r?.cout) || 0) + (Number(r?.envoi) || 0);
