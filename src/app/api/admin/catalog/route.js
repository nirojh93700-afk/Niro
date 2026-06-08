import { isAdmin } from "@/lib/stock";
import {
  setProductOverride,
  saveCustomProduct,
  deleteCustomProduct,
  clearAllPriceOverrides,
  saveProductEditAtomic,
  getCustomProducts,
} from "@/lib/stock";
import { products as baseProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

function slugify(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const action = body?.action;

  // --- Réinitialiser les prix : efface tous les prix enregistrés dans l'admin
  // pour revenir aux prix du catalogue (code). ---
  if (action === "resetPrices") {
    const count = await clearAllPriceOverrides();
    return Response.json({ ok: true, count });
  }

  // --- Modifier un produit existant (override) ---
  if (action === "edit") {
    const { slug, patch } = body;
    if (!slug || !patch) return Response.json({ error: "Paramètres manquants." }, { status: 400 });
    // La remise en % est gérée à part (prix promo des variantes), pas stockée
    // dans l'override.
    const { discountPct, ...overridePatch } = patch;
    let promoUpdates = null;
    if (discountPct !== undefined && discountPct !== "") {
      const pct = Math.max(0, Math.min(90, Number(discountPct) || 0));
      // Liste des variantes (produit du code, ou produit ajouté à la main),
      // avec les prix qui viennent d'être saisis (patch.prices) en priorité.
      const custom = (await getCustomProducts()).find((p) => p.slug === slug);
      const baseVariants = (baseProducts.find((p) => p.slug === slug) || custom)?.variants || [];
      const prices = overridePatch.prices || {};
      promoUpdates = baseVariants.map((v) => {
        const price = typeof prices[v.id] === "number" ? prices[v.id] : v.price;
        return {
          variantId: v.id,
          salePrice: pct > 0 ? Math.round(price * (1 - pct / 100) * 100) / 100 : null,
        };
      });
    }
    const saved = await saveProductEditAtomic(slug, overridePatch, promoUpdates);
    return Response.json({ ok: true, override: saved });
  }

  // --- Créer un nouveau produit ---
  if (action === "create") {
    const p = body.product || {};
    const name = (p.name || "").trim();
    const price = parseFloat(p.price);
    if (!name || !(price > 0)) {
      return Response.json({ error: "Nom et prix obligatoires." }, { status: 400 });
    }
    const slug = (slugify(name) || "produit") + "-" + Math.random().toString(36).slice(2, 6);
    const images = (p.images || []).map((u) => String(u).trim()).filter(Boolean);
    const descHtml = (p.descriptionHtml || "").trim();
    const product = {
      slug,
      name,
      title: p.title?.trim() || name,
      weight: Number(p.weight) || 200,
      pickup: Boolean(p.pickup),
      letter: p.letter !== false, // par défaut expédiable en lettre
      subcategory: p.subcategory || undefined,
      category: p.category || "cadeaux",
      type: p.type?.trim() || "Création personnalisée",
      tagline: p.tagline?.trim() || "",
      personalizable: true,
      personalizationLabel: p.personalizationLabel?.trim() || "Personnalisation",
      personalizationFields: [
        { key: "texte", label: "Texte à graver", placeholder: "Votre texte…", maxLength: 40, optional: true },
        { key: "police", type: "font", label: "Police de gravure", optional: true },
      ],
      images,
      variants: [{ id: slug + "-std", title: "Standard", price: Math.round(price * 100) / 100 }],
      descriptionHtml: descHtml.startsWith("<") ? descHtml : `<p>${descHtml || name}</p>`,
    };
    await saveCustomProduct(product);
    return Response.json({ ok: true, slug });
  }

  // --- Supprimer un produit créé dans l'admin ---
  if (action === "delete") {
    const { slug } = body;
    if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400 });
    await deleteCustomProduct(slug);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
