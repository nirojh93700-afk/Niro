import Link from "next/link";
import Image from "next/image";
import { getPriceFrom } from "@/lib/products";
import { formatEuro } from "@/lib/format";

export default function ProductCard({ product }) {
  const priceFrom = getPriceFrom(product);
  const multiPrice = new Set(product.variants.map((v) => v.price)).size > 1;
  const image = product.images[0];

  return (
    <Link href={`/produit/${product.slug}`} className="product-card">
      <div className="product-thumb">
        <span className="product-chip">{product.type}</span>
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
          {multiPrice && <small>dès </small>}
          {formatEuro(priceFrom)}
        </div>
      </div>
    </Link>
  );
}
