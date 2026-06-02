"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";

export default function ProductDetail({ product }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [personalization, setPersonalization] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants[variantIndex];
  const hasImages = product.images.length > 0;

  function handleAdd() {
    addItem({
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      variantTitle: variant.title,
      price: variant.price,
      image: product.images[0] || null,
      personalization: personalization.trim(),
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="container">
      <div className="product-layout">
        {/* Galerie */}
        <div>
          <div className="gallery-main">
            {hasImages ? (
              <Image
                src={product.images[activeImg]}
                alt={`${product.name} — visuel ${activeImg + 1}`}
                width={800}
                height={800}
                priority
              />
            ) : (
              <div
                className="placeholder"
                style={{ width: "100%", height: "100%", fontSize: "3rem" }}
              >
                Niv Création
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="gallery-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  className={i === activeImg ? "active" : ""}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Voir le visuel ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos & achat */}
        <div className="product-info">
          <div className="breadcrumb">
            <Link href="/boutique">Boutique</Link>
            {" / "}
            <Link href={`/boutique?cat=${product.category}`}>
              {getCategoryLabel(product.category)}
            </Link>
          </div>
          <h1>{product.title}</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{product.tagline}</p>
          <div className="price-lead">{formatEuro(variant.price)}</div>

          {product.variants.length > 1 && (
            <div className="field">
              <label htmlFor="variant">Option</label>
              <select
                id="variant"
                value={variantIndex}
                onChange={(e) => setVariantIndex(Number(e.target.value))}
              >
                {product.variants.map((v, i) => (
                  <option key={v.id} value={i}>
                    {v.title} — {formatEuro(v.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {product.personalizable && (
            <div className="field">
              <label htmlFor="perso">
                {product.personalizationLabel || "Votre personnalisation"}
                <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>
                  {" "}
                  (facultatif ici, à confirmer après commande)
                </span>
              </label>
              <textarea
                id="perso"
                placeholder="Ex : Prénom, date, message à graver…"
                value={personalization}
                onChange={(e) => setPersonalization(e.target.value)}
                maxLength={300}
              />
            </div>
          )}

          <div className="qty-row">
            <div className="qty-stepper">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Moins">
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} aria-label="Plus">
                +
              </button>
            </div>
            <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleAdd}>
              {added ? "✓ Ajouté au panier" : "Ajouter au panier"}
            </button>
          </div>

          <div className="hero-badges" style={{ marginTop: 8 }}>
            <div className="hero-badge"><span>🇫🇷</span> Fabriqué en France</div>
            <div className="hero-badge"><span>🔒</span> Paiement sécurisé</div>
            <div className="hero-badge"><span>✦</span> Pièce personnalisée</div>
          </div>

          <div
            className="product-desc"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>
      </div>
    </div>
  );
}
