// Applique une action proposée par l'assistant catalogue (après confirmation
// du gérant) en appelant les API admin existantes. Partagé par l'ancien
// assistant et le fil unifié : une seule logique, pas deux.
export async function applyCatalogAction(a, adminKey) {
  const post = (url, payload) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(payload),
    }).then((r) => r.ok);
  const cat = (payload) => post("/api/admin/catalog", payload);

  if (a.type === "hide") return cat({ action: "edit", slug: a.slug, patch: { hidden: true } });
  if (a.type === "show") return cat({ action: "edit", slug: a.slug, patch: { hidden: false } });
  if (a.type === "price") return cat({ action: "edit", slug: a.slug, patch: { prices: { [a.variantId]: Number(a.price) } } });
  if (a.type === "promo") return post("/api/admin/promo", { variantId: a.variantId, salePrice: a.salePrice == null ? null : Number(a.salePrice) });
  if (a.type === "stock") return post("/api/admin/stock", { variantId: a.variantId, stock: Number(a.stock) });
  if (a.type === "text") {
    const patch = {};
    for (const k of ["name", "tagline", "descriptionHtml", "category"]) if (a[k] != null) patch[k] = a[k];
    return cat({ action: "edit", slug: a.slug, patch });
  }
  if (a.type === "add") {
    return cat({ action: "create", product: { name: a.name, category: a.category, price: a.price, tagline: a.tagline, descriptionHtml: a.descriptionHtml } });
  }
  if (a.type === "delete") return cat({ action: "delete", slug: a.slug });
  return false;
}
