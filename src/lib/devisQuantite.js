// =============================================================================
// DEVIS DONT LA CLIENTE CHOISIT LE NOMBRE DE PIÈCES — maquette validée le 01/11/2026
// (https://claude.ai/artifact/UajL1z3fV5Fu5GF36voVcf, « Applique la maquette »).
// -----------------------------------------------------------------------------
// Le gérant coche « La cliente peut changer le nombre » (q.qte = { modifiable, min, max }) et marque
// les lignes qui suivent ce nombre (items[].suit). Le devis reste écrit comme d'habitude
// (ex. DEV-1528 : verre 19,90 € × 1 + prénom 3 € × 1) ; la cliente ne change QUE le nombre.
// Le prix se calcule COMME SUR LE SITE :
//  · ligne rattachée à un produit vendu par lots (« À l'unité / Lot de 2 / Lot de 4 ») → prix des
//    lots de la fiche : autant de plus grands lots que possible, puis un lot si le reste en est un,
//    sinon le reste à l'unité (3 verres = 3 à l'unité, 6 = lot de 4 + lot de 2). La remise
//    (prix à l'unité × N − prix payé) est MONTRÉE à la cliente ;
//  · autre ligne qui suit le nombre (gravure) → son prix pour la 1re pièce, puis `prixSuivant`
//    pour chaque pièce en plus (règle des verres : prénom 3 € sur le verre 1, 5 € sur les suivants).
// Pur : utilisé par la page du devis (navigateur), le port, le code promo et le paiement (serveur).
// =============================================================================

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Lots disponibles d'un produit pour la taille de la variante choisie : { 1: {price, id, stockId, weight}, 2: …, 4: … }. */
export function lotsDuProduit(product, baseVariant) {
  const lots = {};
  const taille = baseVariant?.taille || "";
  for (const v of product?.variants || []) {
    if ((v.taille || "") !== taille) continue;
    const m = /lot de\s*(\d+)/i.exec(String(v.title || ""));
    const k = m ? parseInt(m[1], 10) : 1;
    if (!lots[k]) lots[k] = { price: Number(v.price) || 0, id: v.id, stockId: v.stockId || v.id, weight: Number(v.weight) || 0 };
  }
  return lots[1] && Object.keys(lots).length > 1 ? lots : null;
}

/**
 * Configuration publique (sans index) d'un devis à quantité modifiable, ou null.
 * `index` = Map variantId → { product, variant } (catalogue EN DIRECT).
 */
export function configQuantite(q, index) {
  const qte = q?.qte;
  const items = Array.isArray(q?.items) ? q.items : [];
  if (!qte?.modifiable || q?.type === "facture" || !items.some((it) => it?.suit)) return null;
  const depart = Math.max(1, parseInt(items.find((it) => it.suit)?.qty, 10) || 1);
  const min = Math.max(1, parseInt(qte.min, 10) || 1);
  const max = Math.max(min, Math.min(50, parseInt(qte.max, 10) || 12));
  const lignes = items.map((it) => {
    if (!it?.suit) return { suit: false };
    const m = it.variantId && index ? index.get(it.variantId) : null;
    const lots = m ? lotsDuProduit(m.product, m.variant) : null;
    if (lots) {
      const poidsUnite = Number(it.weight) || lots[1].weight || Number(m.product.weight) || 200;
      return { suit: true, lots: Object.fromEntries(Object.entries(lots).map(([k, l]) => [k, { price: l.price, stockId: l.stockId }])), poidsUnite };
    }
    const prix = Number(it.price) || 0;
    return { suit: true, prixSuivant: Number(it.prixSuivant) >= 0 && it.prixSuivant !== "" && it.prixSuivant != null ? Number(it.prixSuivant) : prix };
  });
  const verres = lignes.some((l, i) => l.lots && index?.get(items[i].variantId)?.product?.regleVerres);
  const mot = String(qte.mot || (verres ? "verre" : "pièce")).slice(0, 20);
  return { min, max: Math.max(max, depart), depart: Math.min(Math.max(depart, min), Math.max(max, depart)), lignes, mot };
}

/** Découpe N pièces en lots (règle du site). Renvoie [[taille, nombre], …] du plus grand au plus petit. */
export function decouperLots(n, lots) {
  const tailles = Object.keys(lots).map(Number).filter((k) => k > 1).sort((a, b) => b - a);
  const out = [];
  let reste = n;
  const grand = tailles[0];
  if (grand && reste >= grand) { out.push([grand, Math.floor(reste / grand)]); reste %= grand; }
  if (reste > 1 && tailles.includes(reste)) { out.push([reste, 1]); reste = 0; }
  if (reste > 0) out.push([1, reste]);
  return out;
}

const nomLot = (k, c) => (k === 1 ? `${c} à l'unité` : c > 1 ? `${c} lots de ${k}` : `lot de ${k}`);

/**
 * Applique N au devis. Renvoie :
 *  · items     : lignes à payer (Stripe, port, promo, stock) — mêmes champs que les lignes du devis ;
 *  · affichage : [{ desc, montant, remise? }] pour la page du devis ;
 *  · total, remise, n, stock : [[stockId, quantité]].
 * Sans configuration : le devis tel quel.
 */
export function appliquerQuantite(q, cfg, nVoulu) {
  const items = Array.isArray(q?.items) ? q.items : [];
  if (!cfg) {
    const total = r2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0));
    return {
      n: null, total, remise: 0, items,
      affichage: items.map((it) => ({ desc: it.desc, qty: it.qty, price: it.price, montant: r2(it.qty * it.price) })),
      stock: items.filter((it) => it.stockId).map((it) => [it.stockId, it.qty]),
    };
  }
  const n = Math.min(cfg.max, Math.max(cfg.min, parseInt(nVoulu, 10) || cfg.depart));
  const out = [], aff = [], stock = [];
  let remise = 0;
  items.forEach((it, i) => {
    const c = cfg.lignes[i] || { suit: false };
    if (!c.suit) {
      out.push(it);
      aff.push({ desc: it.desc, qty: it.qty, price: it.price, montant: r2(it.qty * it.price) });
      if (it.stockId) stock.push([it.stockId, it.qty]);
      return;
    }
    if (c.lots) {
      const unite = c.lots[1].price;
      const parts = decouperLots(n, c.lots);
      let paye = 0;
      for (const [k, cnt] of parts) {
        const l = c.lots[k];
        paye += cnt * l.price;
        out.push({ ...it, desc: n === 1 ? it.desc : `${it.desc} — ${nomLot(k, cnt)}`, qty: cnt, price: l.price, weight: c.poidsUnite * k, stockId: l.stockId });
        stock.push([l.stockId, cnt]);
      }
      paye = r2(paye);
      const base = r2(unite * n);
      aff.push({ desc: it.desc, qty: n, price: unite, montant: base });
      if (base - paye > 0.004) {
        const r = r2(base - paye);
        remise = r2(remise + r);
        aff.push({ desc: `Remise ${parts.filter(([k]) => k > 1).map(([k, cnt]) => nomLot(k, cnt)).join(" + ")}`, montant: -r, remise: true });
      }
      return;
    }
    // Ligne de gravure : 1re pièce au prix de la ligne, les suivantes au prix « suivant ».
    const p1 = Number(it.price) || 0;
    const mot = cfg.mot || "pièce";
    const d1 = n > 1 ? `${it.desc} — ${mot} 1` : it.desc;
    out.push({ ...it, desc: d1, qty: 1, price: p1 });
    aff.push({ desc: d1, qty: 1, price: p1, montant: r2(p1) });
    if (n > 1) {
      const desc = `${it.desc} — ${mot}s ${2 === n ? "2" : `2 à ${n}`}`;
      out.push({ ...it, desc, qty: n - 1, price: c.prixSuivant });
      aff.push({ desc, qty: n - 1, price: c.prixSuivant, montant: r2(c.prixSuivant * (n - 1)) });
    }
    if (it.stockId) stock.push([it.stockId, n]);
  });
  const total = r2(out.reduce((s, it) => s + it.qty * it.price, 0));
  return { n, total, remise, items: out, affichage: aff, stock };
}

/** Paliers à montrer à la cliente (1re ligne vendue par lots) : [{ k, prix, base, remise }]. */
export function paliersRemise(cfg) {
  const c = cfg?.lignes?.find((l) => l.lots);
  if (!c) return [];
  return Object.keys(c.lots).map(Number).sort((a, b) => a - b).map((k) => {
    const prix = r2(c.lots[k].price), base = r2(c.lots[1].price * k);
    return { k, prix, base, remise: r2(base - prix) };
  });
}
