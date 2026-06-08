import Link from "next/link";
import Image from "next/image";
import { formatEuro } from "@/lib/format";
import WishlistButton from "@/components/WishlistButton";

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
  // Prix conseillé (comparaison « moins cher qu'ailleurs »), seulement s'il n'y a pas déjà une promo réelle.
  const refMarkup = Number(product.refMarkup) || 0;
  const refPrice = !hasPromo && refMarkup > 0 ? Math.round(basePrice * (1 + refMarkup / 100) * 100) / 100 : 0;
  // Prix barré "permanent" défini sur la 1re variante (barré + prix de vente, deux prix ronds).
  const compareAt = product.variants[0].compareAt;
  const hasCompare = !hasPromo && typeof compareAt === "number" && compareAt > basePrice;

  return (
    <Link href={`/produit/${product.slug}`} className="product-card">
      <div className="product-thumb" style={{ position: "relative" }}>
        <span className="product-chip">{product.type}</span>
        {hasPromo && <span className="promo-badge">Promo</span>}
        <WishlistButton slug={product.slug} name={product.name} image={image} price={hasPromo ? sale : basePrice} />
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
          ) : hasCompare ? (
            <>
              <span className="price-old">{formatEuro(compareAt)}</span>{" "}
              <span className="price-sale">{formatEuro(basePrice)}</span>
            </>
          ) : refPrice ? (
            <>
              <span className="price-ref-label">Prix conseillé</span>{" "}
              <span className="price-old">{formatEuro(refPrice)}</span>{" "}
              <span className="price-sale">{formatEuro(basePrice)}</span>
            </>
          ) : (
            formatEuro(basePrice)
          )}
        </div>
      </div>
    </Link>
  );
}
