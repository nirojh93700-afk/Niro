// =============================================================================
// SURVEILLANCE AUTOMATIQUE DU CATALOGUE
// -----------------------------------------------------------------------------
// Détecte les produits mal configurés (incohérents par rapport aux autres) :
//   - bijou SANS emballage (sac / boîte / microfibre / pack) alors que les
//     autres bijoux en ont un,
//   - produit SANS fiche détaillée (Taille & Matériaux / Entretien / Retour),
//   - produit SANS photo,
//   - produit SANS prix (aucune variante valide).
// Read-only : ne modifie rien. Utilisé par l'API admin, le cron (alerte e-mail)
// et l'agent Technicien.
// =============================================================================

import { getCatalogAdmin } from "./catalog";
import { getSettings } from "./stock";
import { productInfo } from "./productInfo";
import { defaultPackagingFor } from "./packaging";

const RANK = { haute: 0, moyenne: 1, basse: 2 };

export async function auditCatalog() {
  const [products, settings] = await Promise.all([
    getCatalogAdmin().catch(() => []),
    getSettings().catch(() => ({})),
  ]);
  const pkgAssign = (settings && settings.productPackaging) || {};
  const packagingLive = settings?.packagingLive === true;
  const issues = [];
  const add = (p, type, severity, message) =>
    issues.push({ slug: p.slug, name: p.name || p.slug, category: p.category || "", hidden: !!p.hidden, type, severity, message });

  for (const p of Array.isArray(products) ? products : []) {
    if (!p || !p.slug) continue;

    // 1. Photos
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    if (imgs.length === 0) add(p, "photo", "haute", "Aucune photo");

    // 2. Prix / variantes
    const vars = Array.isArray(p.variants) ? p.variants : [];
    if (!vars.some((v) => Number(v?.price) > 0)) add(p, "prix", "haute", "Aucun prix / variante valide");

    // 3. Fiche détaillée (mineur : beaucoup de produits s'en passent → priorité basse)
    if (!productInfo[p.slug]) add(p, "fiche", "basse", "Pas de fiche détaillée (Taille & Matériaux / Entretien / Retour)");

    // 4. Emballage — bijoux uniquement. Un bijou est couvert soit par sa config
    // explicite, soit par la correction automatique (defaultPackagingFor). Il n'est
    // signalé que si, malgré tout, aucune option ne peut être construite (cas rare :
    // bibliothèque d'emballages vidée/renommée par la gérante).
    if (p.category === "bijoux") {
      const a = pkgAssign[p.slug] || defaultPackagingFor(p);
      const ok = a && a.on === true && Array.isArray(a.ids) && a.ids.length > 0;
      if (!ok) add(p, "emballage", "moyenne", "Bijou sans emballage configurable (vérifier la bibliothèque d'emballages)");
    }
  }

  issues.sort((a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9));
  return {
    checkedAt: new Date().toISOString(),
    productCount: Array.isArray(products) ? products.length : 0,
    issueCount: issues.length,
    packagingLive,
    issues,
  };
}

// Nombre de points « importants » (hors mineurs de priorité basse).
export function importantIssueCount(audit) {
  return (audit?.issues || []).filter((i) => i.severity !== "basse").length;
}

// Résumé texte lisible (e-mail d'alerte, contexte de l'agent Technicien).
// Regroupe par produit les points IMPORTANTS (haute + moyenne) ; les mineurs
// (« pas de fiche détaillée ») sont juste comptés en fin, pour ne pas noyer.
export function auditSummaryText(audit) {
  if (!audit || !audit.issueCount) {
    return `Catalogue OK : aucun problème détecté (${audit?.productCount || 0} produits vérifiés).`;
  }
  const important = (audit.issues || []).filter((i) => i.severity !== "basse");
  const lowCount = audit.issueCount - important.length;
  const parts = [];
  if (important.length) {
    const byProduct = {};
    for (const i of important) (byProduct[i.name] = byProduct[i.name] || []).push(i);
    const lines = Object.entries(byProduct).map(
      ([name, list]) => `• ${name} : ${list.map((i) => i.message).join(" ; ")}`
    );
    parts.push(`${important.length} point(s) important(s) à corriger sur ${audit.productCount} produits :\n${lines.join("\n")}`);
  } else {
    parts.push(`Aucun point important à corriger sur ${audit.productCount} produits.`);
  }
  if (lowCount) parts.push(`(+ ${lowCount} produit(s) sans fiche détaillée — mineur, facultatif.)`);
  return parts.join("\n\n");
}
