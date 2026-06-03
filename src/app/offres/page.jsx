import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getPromos } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offres spéciales — promotions Niv Création",
  description: "Profitez de nos promotions du moment sur une sélection de créations personnalisées Niv Création.",
};

export default async function OffresPage() {
  const [catalog, promos] = await Promise.all([getCatalog(), getPromos()]);

  const onSale = catalog
    .map((p) => {
      // promo applicable à la variante par défaut (sinon n'importe quelle variante)
      const promoVariant = p.variants.find((v) => typeof promos[v.id] === "number" && promos[v.id] < v.price);
      if (!promoVariant) return null;
      const baseSale = promos[p.variants[0].id];
      return {
        ...p,
        variants: [promoVariant, ...p.variants.filter((v) => v.id !== promoVariant.id)],
        salePrice: typeof baseSale === "number" ? baseSale : promos[promoVariant.id],
      };
    })
    .filter(Boolean);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Bons plans</span>
          <h2>Offres spéciales</h2>
          <p>Nos promotions du moment — profitez-en, les quantités sont limitées.</p>
        </div>

        {onSale.length === 0 ? (
          <div className="center-card" style={{ margin: "20px auto" }}>
            <h3>Aucune promotion en cours</h3>
            <p style={{ color: "var(--ink-soft)" }}>
              Revenez bientôt ! En attendant, découvrez toutes nos créations.
            </p>
            <Link href="/boutique" className="btn btn-gold">Voir la boutique</Link>
          </div>
        ) : (
          <div className="product-grid">
            {onSale.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
