// =============================================================================
// Attributs produits pour Google (Merchant Center + données structurées).
// -----------------------------------------------------------------------------
// PARTAGÉ entre le flux Shopping (/flux-google.xml) et le balisage JSON-LD des
// fiches produits : Google exige que la couleur / le sexe soient IDENTIQUES
// dans le flux et sur la page de destination — une seule source de vérité ici.
// =============================================================================

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");

// Google exige des URL COMPLÈTES pour les images : les photos hébergées sur le
// site (« /produits/… », « /api/img/… ») doivent être préfixées par le domaine.
export function imageAbsolue(u) {
  const v = String(u || "").trim();
  return v.startsWith("http") ? v : v ? BASE + (v.startsWith("/") ? v : "/" + v) : v;
}

// La couleur = celle de la VARIANTE PAR DÉFAUT (la première, celle affichée),
// sinon celle trouvée dans le nom du produit. Repli : Argenté (acier inox).
function detecteCouleur(t) {
  t = (t || "").toLowerCase();
  if (/or rose|rose/.test(t)) return "Or rose";
  if (/noir/.test(t)) return "Noir";
  if (/argent/.test(t)) return "Argenté";
  if (/dor(é|e)|plaqu(é|e) or|\bor\b/.test(t)) return "Doré";
  if (/marron|brun|cuir/.test(t)) return "Marron";
  return "";
}

export function couleurProduit(p) {
  return (
    detecteCouleur(p.variants?.[0]?.title) ||
    detecteCouleur(p.name) ||
    detecteCouleur((p.variants || []).map((v) => v.title).join(" ")) ||
    "Argenté"
  );
}

// Sexe : sous-catégorie femme → female, homme → male, sinon unisex.
export function sexeProduit(p) {
  return p.subcategory === "homme" ? "male" : p.subcategory === "femme" ? "female" : "unisex";
}
