// Prix d'une étiquette d'envoi payée au transporteur, et ce qu'une commande laisse sur la livraison.
// Source UNIQUE pour la fenêtre « Conditionnement », les ratés (renvoi d'un colis) et la page Bénéfices.
//
// Prix réels relevés sur Boxtal le 27/10/2026 (capture du gérant), affichés HORS TAXES :
//   Mondial Relay point relais 3,14 € HT · Colissimo point retrait 5,26 € HT.
// Le gérant paie la TVA (micro-entreprise) : on compte le prix TTC (HT × 1,2).
// Lettre suivie La Poste ≤ 100 g : 4,45 € (pas de TVA ajoutée sur un affranchissement).
// Express Chrono 18 : 8,99 € HT (Boxtal, 16/11/2026). Colis à domicile : estimation, à corriger à l'écran.
// Relevé sur Boxtal le 27/11/2026 (capture du gérant, « pour les calculs ») :
//   Mondial Relay point relais, cristal Moyen + socle (1 à 2 kg) : 4,90 € HT · Chrono Shop2Shop, bijou en boîte : 2,99 € HT.
// Le prix Mondial Relay dépend donc du POIDS : 3,14 € HT jusqu'à 1 kg, 4,90 € HT au-delà (seuls paliers relevés).

const TTC = (ht) => Math.round(ht * 1.2 * 100) / 100;

export const PRIX_ETIQUETTE = {
  mondialRelay: TTC(3.14), // 3,77 €
  mondialRelayLourd: TTC(4.9), // 5,88 € : plus de 1 kg (commande 1HSS46YO, 27/11/2026)
  colissimoRelais: TTC(5.26), // 6,31 €
  chronoRelais: TTC(2.99), // 3,59 € : Chrono Shop2Shop, colis léger (commande 0CD0IBOZ, 27/11/2026)
  lettre: 4.45,
  express: TTC(8.99), // 10,79 € : Chrono 18, relevé sur Boxtal le 16/11/2026 (commande 06W69SNX)
  domicile: 6.12, // Mondial Relay domicile ≈ 5,10 € HT (estimation)
  autreRelais: 6.12, // Relais Colis, UPS, Chrono Shop2Shop de plus de 1 kg : estimation
};

// Libellé lisible du prix choisi, pour l'écran.
export function origineEtiquette(order, produitDe) {
  return choisir(order, produitDe).libelle;
}

export function etiquetteEstimee(order, produitDe) {
  return choisir(order, produitDe).prix;
}

// Poids estimé du colis (g), d'après les lignes de stock payées (variante exacte + socle) ; 0 = inconnu.
export function poidsCommande(order, produitDe = () => null) {
  const items = (order?.items || []).filter((i) => i.slug);
  const produits = items.map((i) => produitDe(i.slug)).filter(Boolean);
  let stock = order?.stock;
  if (typeof stock === "string") { try { stock = JSON.parse(stock); } catch { stock = null; } }
  let g = 0;
  if (Array.isArray(stock) && stock.length && produits.length) {
    for (const [id, q] of stock) {
      const n = Number(q) || 1;
      let poids = 0;
      for (const p of produits) {
        const v = (p.variants || []).find((x) => x.stockId === id || x.id === id);
        if (v) { poids = Number(v.weight) || Number(p.weight) || 0; break; }
        const ex = (p.engravingPricing?.flatExtras || []).find((x) => x.stockId === id || Object.values(x.stockIdByVariant || {}).includes(id));
        if (ex) { poids = Number(ex.stockId === id ? ex.weight : Object.entries(ex.stockIdByVariant || {}).map(([vid, sid]) => (sid === id ? ex.weightByVariant?.[vid] : 0)).find(Boolean) || ex.weight) || 0; break; }
      }
      g += poids * n;
    }
    if (g > 0) return g;
  }
  for (const i of items) g += (Number(produitDe(i.slug)?.weight) || 0) * (Number(i.quantity) || 1);
  return g;
}

function choisir(order, produitDe = () => null) {
  const methode = String(order?.shippingMethod || "");
  const relais = String(order?.relaisPoint || "");
  if (/main propre|retrait/i.test(methode) && !/point retrait|colissimo/i.test(methode)) return { prix: 0, libelle: "retrait en main propre" };
  if (/express/i.test(methode) && !/relais|shop2shop/i.test(methode)) return { prix: PRIX_ETIQUETTE.express, libelle: "Express Chrono 18 (8,99 € HT)" };
  const tout = `${methode} ${relais}`;
  if (relais || /point relais|relais|point retrait/i.test(methode)) {
    const g = poidsCommande(order, produitDe);
    // Poids inconnu : le port payé par la cliente dit le palier (Mondial Relay : 4,90 € jusqu'à 1 kg, 6,50 € au-delà).
    const lourd = g > 1000 || (!g && Number(order?.shippingPrice) >= 6.5);
    if (/mondial/i.test(tout)) {
      return lourd
        ? { prix: PRIX_ETIQUETTE.mondialRelayLourd, libelle: g > 2000 ? "Mondial Relay point relais, plus de 2 kg (au moins 4,90 € HT, à corriger)" : "Mondial Relay point relais, 1 à 2 kg (4,90 € HT)" }
        : { prix: PRIX_ETIQUETTE.mondialRelay, libelle: "Mondial Relay point relais (3,14 € HT)" };
    }
    if (/colissimo|la poste/i.test(tout)) return { prix: PRIX_ETIQUETTE.colissimoRelais, libelle: "Colissimo point retrait (5,26 € HT)" };
    if (/chrono|shop2shop/i.test(tout) && g <= 1000) return { prix: PRIX_ETIQUETTE.chronoRelais, libelle: "Chrono Shop2Shop (2,99 € HT)" };
    return { prix: PRIX_ETIQUETTE.autreRelais, libelle: "point relais (estimation)" };
  }
  const lignes = (order?.items || []).filter((i) => !/livraison|point relais|retrait|exp[ée]dition/i.test(i.name || ""));
  const lettre = lignes.length && lignes.every((i) => produitDe(i.slug)?.letter) && !lignes.some((i) => /bo[iî]te|pack/i.test(i.details || ""));
  if (lettre) return { prix: PRIX_ETIQUETTE.lettre, libelle: "lettre suivie La Poste" };
  return { prix: PRIX_ETIQUETTE.domicile, libelle: "colis à domicile (estimation)" };
}

// Ce que coûte au total un raté (pièces + éventuel colis renvoyé).
export const perteRate = (r) => (Number(r?.cout) || 0) + (Number(r?.envoi) || 0);
