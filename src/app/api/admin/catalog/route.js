import { isAdmin } from "@/lib/stock";
import {
  setProductOverride,
  saveCustomProduct,
  deleteCustomProduct,
  clearAllPriceOverrides,
  saveProductEditAtomic,
  getCustomProducts,
  setStock,
  resetProductToCode,
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

const FIELD_TYPES = ["text", "textarea", "select", "font", "color", "photo", "note"];
const DEFAULT_FIELDS = [
  { key: "texte", label: "Texte à graver", placeholder: "Votre texte…", maxLength: 40, optional: true },
  { key: "police", type: "font", label: "Police de gravure", optional: true },
];

// Nettoie/valide les champs de gravure réglés dans l'admin. Renvoie null si non fourni.
function sanitizePersonalizationFields(arr) {
  if (!Array.isArray(arr)) return null;
  const out = [];
  arr.forEach((f, i) => {
    if (!f || typeof f !== "object") return;
    const type = FIELD_TYPES.includes(f.type) ? f.type : "text";
    if (type === "note") {
      if (f.text) out.push({ key: f.key || `note${i}`, type: "note", text: String(f.text).slice(0, 300) });
      return;
    }
    const label = String(f.label || "").slice(0, 80);
    if (!label) return;
    const key = (f.key && /^[a-z0-9_]+$/i.test(f.key)) ? f.key : (slugify(label).replace(/-/g, "_") || "champ") + i;
    const field = { key, label };
    if (type !== "text") field.type = type;
    if (f.placeholder) field.placeholder = String(f.placeholder).slice(0, 80);
    if (f.maxLength && Number(f.maxLength) > 0) field.maxLength = Number(f.maxLength);
    if (f.optional) field.optional = true;
    if (f.variantContains) field.variantContains = String(f.variantContains).slice(0, 40);
    if ((type === "select" || type === "color") && Array.isArray(f.options)) {
      field.options = f.options
        .filter((o) => o && o.value)
        .map((o) => ({ value: String(o.value).slice(0, 40), label: String(o.label || o.value).slice(0, 40) }));
    }
    out.push(field);
  });
  return out;
}

// Édition saisonnière : valide { name, start, end, hideOutOfSeason }.
function sanitizeSeasonal(s) {
  if (!s || typeof s !== "object" || !s.hideOutOfSeason || !s.start || !s.end) return undefined;
  return {
    name: String(s.name || "").slice(0, 40),
    start: String(s.start).slice(0, 10),
    end: String(s.end).slice(0, 10),
    hideOutOfSeason: true,
  };
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
    // Champs riches : on nettoie/valide avant de stocker.
    if (overridePatch.personalizationFields !== undefined) {
      overridePatch.personalizationFields = sanitizePersonalizationFields(overridePatch.personalizationFields) || [];
    }
    if (overridePatch.seasonal !== undefined) {
      overridePatch.seasonal = sanitizeSeasonal(overridePatch.seasonal) || null; // null = retiré (cleanup)
    }
    let promoUpdates = null;
    if (discountPct !== undefined && discountPct !== "") {
      const pct = Math.max(0, Math.min(90, Number(discountPct) || 0));
      // Liste des variantes (produit du code, ou produit ajouté à la main),
      // avec les prix qui viennent d'être saisis (patch.prices) en priorité.
      const custom = (await getCustomProducts()).find((p) => p.slug === slug);
      const baseVariants = (Array.isArray(overridePatch.variants) && overridePatch.variants.length)
        ? overridePatch.variants
        : ((baseProducts.find((p) => p.slug === slug) || custom)?.variants || []);
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
    // Variantes (titre + prix) avec id stable ; on garde le stock saisi pour l'appliquer ensuite.
    const inVariants = (Array.isArray(p.variants) && p.variants.length ? p.variants : [{ title: "Standard", price }]);
    const variants = inVariants
      .map((v, i) => ({ id: `${slug}-v${i + 1}`, title: String(v.title || "Standard").slice(0, 60), price: Math.round((parseFloat(v.price) || 0) * 100) / 100, _stock: v.stock }))
      .filter((v) => v.price > 0);
    const dims = (p.dimL || p.dimW || p.dimH)
      ? { l: Number(p.dimL) || 0, w: Number(p.dimW) || 0, h: Number(p.dimH) || 0 }
      : undefined;
    const pFields = sanitizePersonalizationFields(p.personalizationFields) || DEFAULT_FIELDS;
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
      badge: (p.badge && p.badge !== "none") ? String(p.badge).slice(0, 30) : undefined,
      model3d: p.model3d ? String(p.model3d).trim() : undefined,
      dimensions: dims,
      cost: Number(p.cost) > 0 ? Math.round(Number(p.cost) * 100) / 100 : undefined,
      lowStockThreshold: p.lowStockThreshold !== "" && p.lowStockThreshold != null ? Number(p.lowStockThreshold) : undefined,
      seasonal: sanitizeSeasonal(p.seasonal),
      featured: p.featured ? true : undefined,
      personalizable: pFields.length > 0,
      personalizationLabel: p.personalizationLabel?.trim() || "Personnalisation",
      personalizationFields: pFields,
      images,
      variants: (variants.length ? variants.map(({ _stock, ...v }) => v) : [{ id: slug + "-std", title: "Standard", price: Math.round(price * 100) / 100 }]),
      descriptionHtml: descHtml.startsWith("<") ? descHtml : `<p>${descHtml || name}</p>`,
    };
    await saveCustomProduct(product);
    // Stock initial par variante (si renseigné).
    for (const v of variants) {
      if (v._stock !== "" && v._stock != null && Number.isFinite(Number(v._stock))) {
        try { await setStock(v.id, Math.max(0, Math.round(Number(v._stock)))); } catch { /* ignore */ }
      }
    }
    return Response.json({ ok: true, slug });
  }

  // --- Réinitialiser un produit (effacer les modifs admin → revenir au code) ---
  if (action === "resetProduct") {
    const { slug } = body;
    if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400 });
    await resetProductToCode(slug);
    return Response.json({ ok: true });
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
