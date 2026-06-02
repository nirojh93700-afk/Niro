"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartContext";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import { getProductInfo } from "@/lib/productInfo";
import { FONTS, getFontClass, getFontLabel } from "@/lib/fonts";
import PhotoUpload, { CLOUDINARY_READY } from "./PhotoUpload";

export default function ProductDetail({ product }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [personalization, setPersonalization] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const [stockMap, setStockMap] = useState({});
  const [images, setImages] = useState(product.images);
  const [promos, setPromos] = useState({});
  useEffect(() => {
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d) => setStockMap(d.stock || {}))
      .catch(() => {});
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        const ov = d.images?.[product.slug];
        if (ov && ov.length) setImages(ov);
        setPromos(d.promos || {});
      })
      .catch(() => {});
  }, [product.slug]);

  const variant = product.variants[variantIndex];
  const hasImages = images.length > 0;
  const info = getProductInfo(product.slug);
  const variantStock = stockMap[variant.id];
  const soldOut = typeof variantStock === "number" && variantStock <= 0;
  const salePrice = promos[variant.id];
  const hasPromo = typeof salePrice === "number" && salePrice < variant.price;
  // "Fabriqué" pour ce qu'elle fabrique (bois/mariage), "Gravé" pour les pièces
  // sourcées qu'elle personnalise par gravure (bijoux, cristaux, etc.).
  const madeHere = product.category === "mariage" || product.slug === "plaque-de-porte-enfant";
  const originLabel = madeHere ? "Fabriqué en France" : "Gravé en France";

  // Champs de gravure visibles selon l'option (variante) sélectionnée.
  const visibleFields = (product.personalizationFields || []).filter(
    (f) => !f.variantContains || variant.title.includes(f.variantContains)
  );

  function setField(key, value) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // Libellé lisible d'une valeur (police, couleur, liste déroulante).
  function valueLabel(field, value) {
    if (!value) return "";
    if (field.type === "font") return getFontLabel(value);
    if (field.options) return field.options.find((o) => o.value === value)?.label || value;
    return value;
  }

  // Construit le texte de personnalisation final (pour le panier / la commande).
  function buildPersonalization() {
    if (product.personalizationFields) {
      return visibleFields
        .filter((f) => f.type !== "note")
        .map((f) => {
          const raw = (fieldValues[f.key] || "").toString().trim();
          if (!raw) return null;
          return `${f.label} : ${valueLabel(f, raw)}`;
        })
        .filter(Boolean)
        .join(" · ");
    }
    return personalization.trim();
  }

  // Police et couleur sélectionnées (pour l'aperçu en direct).
  const fontField = visibleFields.find((f) => f.type === "font");
  const colorField = visibleFields.find((f) => f.type === "color");
  const photoField = visibleFields.find((f) => f.type === "photo");
  const photoUrl = photoField ? fieldValues[photoField.key] : "";
  // Affichable seulement si c'est une vraie image (URL/data), pas une réf.
  const photoSrc = photoUrl && (photoUrl.startsWith("http") || photoUrl.startsWith("data:")) ? photoUrl : "";
  // Matière de l'échantillon témoin (aperçu) selon le type de produit.
  const material =
    product.category === "cristaux" ? "crystal" : product.category === "mariage" ? "wood" : "metal";
  const previewFontClass = getFontClass(fieldValues[fontField?.key] || "playfair");
  const previewColor = (colorField && fieldValues[colorField.key]) || "#3a2f1d";

  // Lignes de texte à montrer dans l'aperçu (champs texte non vides).
  const previewLines = visibleFields
    .filter((f) => f.type === "text" || f.type === "textarea" || (!f.type && true))
    .flatMap((f) => (fieldValues[f.key] || "").split("\n"))
    .map((l) => l.trim())
    .filter(Boolean);
  const hasTextFields = visibleFields.some(
    (f) => f.type === "text" || f.type === "textarea" || !f.type
  );

  function handleAdd() {
    if (soldOut) return;
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
      price: hasPromo ? salePrice : variant.price,
      image: images[0] || null,
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
                src={images[activeImg]}
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
            {/* Sur une VRAIE photo produit : la gravure se superpose directement */}
            {hasImages && product.category === "cristaux" && photoSrc && (
              <div className="crystal-photo-overlay">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoSrc} alt="Aperçu de la gravure photo" />
              </div>
            )}
            {/* Gravure écrite directement sur la photo du produit (position
                réglable par produit via product.preview ; sinon centrée). */}
            {hasImages && previewLines.length > 0 && (
              <div className="engrave-overlay" style={product.preview || undefined}>
                {previewLines.map((line, i) => (
                  <span key={i} className={`eo-line ${previewFontClass}`} style={{ color: previewColor }}>
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
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
          <div className="price-lead">
            {hasPromo ? (
              <>
                <span className="price-old">{formatEuro(variant.price)}</span>{" "}
                <span className="price-sale">{formatEuro(salePrice)}</span>{" "}
                <span className="promo-badge" style={{ position: "static" }}>
                  -{Math.round((1 - salePrice / variant.price) * 100)}%
                </span>
              </>
            ) : (
              formatEuro(variant.price)
            )}
          </div>

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
              {visibleFields.map((f) => {
                if (f.type === "note") {
                  return <p key={f.key} className="perso-hint">{f.text}</p>;
                }
                if (f.type === "photo") {
                  return (
                    <div className="field" key={f.key}>
                      <label>{f.label}{f.optional && <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>}</label>
                      <PhotoUpload value={fieldValues[f.key] || ""} onChange={(url) => setField(f.key, url)} productSlug={product.slug} />
                      {f.text && <p className="perso-hint" style={{ marginTop: 8 }}>{f.text}</p>}
                    </div>
                  );
                }
                const labelEl = (
                  <label htmlFor={`pf-${f.key}`}>
                    {f.label}
                    {f.optional && (
                      <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> (facultatif)</span>
                    )}
                  </label>
                );
                if (f.type === "font" || f.type === "select" || f.type === "color") {
                  const opts = f.type === "font" ? FONTS.map((x) => ({ value: x.key, label: x.label })) : f.options || [];
                  return (
                    <div className="field" key={f.key}>
                      {labelEl}
                      <select
                        id={`pf-${f.key}`}
                        value={fieldValues[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                      >
                        <option value="">— Choisir —</option>
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                const max = f.maxLength || 80;
                const val = fieldValues[f.key] || "";
                return (
                  <div className="field" key={f.key}>
                    {labelEl}
                    {f.type === "textarea" ? (
                      <textarea
                        id={`pf-${f.key}`}
                        placeholder={f.placeholder || ""}
                        value={val}
                        maxLength={max}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        id={`pf-${f.key}`}
                        type="text"
                        placeholder={f.placeholder || ""}
                        value={val}
                        maxLength={max}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                    <span className="char-count">{val.length}/{max}</span>
                  </div>
                );
              })}

              {(hasTextFields || photoField) && (
                <div className="engrave-preview">
                  <span className="ep-label">
                    Aperçu témoin de la gravure
                    {fontField && fieldValues[fontField.key] ? ` — ${getFontLabel(fieldValues[fontField.key])}` : ""}
                  </span>
                  <div className={`ep-plate ${material}`}>
                    {material === "crystal" && photoSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="ep-crystal-photo" src={photoSrc} alt="" />
                    )}
                    {previewLines.length ? (
                      previewLines.map((line, i) => (
                        <span key={i} className={`ep-line ${previewFontClass}`} style={{ color: previewColor }}>
                          {line}
                        </span>
                      ))
                    ) : (
                      <span className="ep-empty">
                        {material === "crystal"
                          ? "Votre photo / texte apparaîtra ici, dans le cristal…"
                          : "Votre texte gravé apparaîtra ici…"}
                      </span>
                    )}
                  </div>
                </div>
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
            <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleAdd} disabled={soldOut}>
              {soldOut ? "Épuisé" : added ? "Ajouté au panier" : "Ajouter au panier"}
            </button>
          </div>
          {typeof variantStock === "number" && (
            <p style={{ margintop: 0, fontSize: "0.85rem", color: soldOut ? "#b4452f" : "var(--ink-soft)" }}>
              {soldOut ? "Cette option est momentanément épuisée." : `En stock : ${variantStock}`}
            </p>
          )}

          <div className="hero-badges" style={{ marginTop: 8 }}>
            <div className="hero-badge">{originLabel}</div>
            <div className="hero-badge">Paiement sécurisé</div>
            <div className="hero-badge">Pièce personnalisée</div>
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
