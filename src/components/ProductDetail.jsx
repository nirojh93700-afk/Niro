"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import { getProductInfo } from "@/lib/productInfo";

export default function ProductDetail({ product }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [personalization, setPersonalization] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const variant = product.variants[variantIndex];
  const hasImages = product.images.length > 0;
  const info = getProductInfo(product.slug);

  // Champs de gravure visibles selon l'option (variante) sélectionnée.
  const visibleFields = (product.personalizationFields || []).filter(
    (f) => !f.variantContains || variant.title.includes(f.variantContains)
  );

  function setField(key, value) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // Construit le texte de personnalisation final (pour le panier / la commande).
  function buildPersonalization() {
    if (product.personalizationFields) {
      return visibleFields
        .filter((f) => f.type !== "note")
        .map((f) => {
          const val = (fieldValues[f.key] || "").trim();
          return val ? `${f.label} : ${val}` : null;
        })
        .filter(Boolean)
        .join(" · ");
    }
    return personalization.trim();
  }

  function handleAdd() {
    // Vérifie les champs de gravure obligatoires (selon l'option choisie).
    if (product.personalizationFields) {
      const missing = visibleFields.find(
        (f) => f.type !== "note" && !f.optional && !(fieldValues[f.key] || "").trim()
      );
      if (missing) {
        setError(`Merci d'indiquer : ${missing.label}.`);
        return;
      }
    }
    setError("");
    addItem({
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      variantTitle: variant.title,
      price: variant.price,
      image: product.images[0] || null,
      personalization: buildPersonalization(),
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

          {/* Champs de gravure dynamiques (selon l'option choisie) */}
          {product.personalizationFields ? (
            <div style={{ marginBottom: 6 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12 }}>
                Personnalisation — gravure
              </p>
              {visibleFields.map((f) =>
                f.type === "note" ? (
                  <p key={f.key} className="perso-hint">{f.text}</p>
                ) : (
                  <div className="field" key={f.key}>
                    <label htmlFor={`pf-${f.key}`}>
                      {f.label}
                      {f.optional && (
                        <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>
                      )}
                    </label>
                    <input
                      id={`pf-${f.key}`}
                      type="text"
                      placeholder={f.placeholder || ""}
                      value={fieldValues[f.key] || ""}
                      maxLength={f.maxLength || 80}
                      onChange={(e) => setField(f.key, e.target.value)}
                    />
                  </div>
                )
              )}
            </div>
          ) : (
            product.personalizable && (
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
            )
          )}

          {error && <div className="notice">{error}</div>}

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

          {info && (
            <div className="info-accordion">
              {info.material && (
                <details>
                  <summary>📏 Taille & Matériaux</summary>
                  <div className="info-body">{info.material}</div>
                </details>
              )}
              {info.usage && (
                <details>
                  <summary>✨ Personnalisation & Entretien</summary>
                  <div className="info-body">{info.usage}</div>
                </details>
              )}
              {info.returns && (
                <details>
                  <summary>🚚 Expédition & Retour</summary>
                  <div className="info-body">{info.returns}</div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
