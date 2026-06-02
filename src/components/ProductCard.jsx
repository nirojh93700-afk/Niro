import Link from "next/link";
import Image from "next/image";
import { formatEuro } from "@/lib/format";

export default function ProductCard({ product }) {
  // Prix affiché = celui de la variante par défaut (la fiche s'ouvre dessus),
  // pour rester cohérent. On ajoute "dès" seulement si cette variante est aussi
  // la moins chère et qu'il existe d'autres prix plus élevés.
  const prices = product.variants.map((v) => v.price);
  const basePrice = product.variants[0].price;
  const distinct = new Set(prices).size > 1;
  const showDes = distinct && basePrice === Math.min(...prices);
  const image = product.images[0];
  const sale = product.salePrice; // promo sur la variante par défaut
  const hasPromo = typeof sale === "number" && sale < basePrice;

  return (
    <Link href={`/produit/${product.slug}`} className="product-card">
      <div className="product-thumb">
        <span className="product-chip">{product.type}</span>
        {hasPromo && <span className="promo-badge">Promo</span>}
        {image ? (
          <Image
            src={image}
            alt={product.name}
            width={500}
            height={500}
            sizes="(max-width: 540px) 100vw, (max-width: 900px) 50vw, 33vw"
          />
        ) : (
          <div className="placeholder">Niv</div>
        )}
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="tagline">{product.tagline}</p>
        <div className="product-price">
          {showDes && <small>dès </small>}
          {hasPromo ? (
            <>
              <span className="price-old">{formatEuro(basePrice)}</span>{" "}
              <span className="price-sale">{formatEuro(sale)}</span>
            </>
          ) : (
            formatEuro(basePrice)
          )}
        </div>
      </div>
    </Link>
  );
}
