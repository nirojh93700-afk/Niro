"use client";

import { useState } from "react";
import { CATEGORIES, SUBCATEGORIES, getCategoryLabel } from "@/lib/products";
import PhotoUpload, { UPLOAD_AVAILABLE } from "@/components/PhotoUpload";
import Model3DUpload from "@/components/admin/Model3DUpload";

// Regroupe les produits par catégorie, dans l'ordre des CATEGORIES.
function groupByCategory(products) {
  const order = CATEGORIES.map((c) => c.slug);
  const groups = [];
  for (const cat of CATEGORIES) {
    const items = products.filter((p) => p.category === cat.slug);
    if (items.length) groups.push({ slug: cat.slug, label: cat.label, items });
  }
  // Produits dont la catégorie n'existe plus / vide → groupe « Autres ».
  const others = products.filter((p) => !order.includes(p.category));
  if (others.length) groups.push({ slug: "_autres", label: "Autres", items: others });
  return groups;
}

// Édition / création / suppression des produits depuis l'admin.
export default function ProductsAdmin({ adminKey, products, onReload }) {
  const [openSlug, setOpenSlug] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const shown = search.trim()
    ? products.filter((p) => `${p.name} ${p.slug} ${p.category}`.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  async function post(payload) {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(payload),
    });
    return res.ok;
  }

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        {products.length} produits. Modifie le nom, le prix, la description, masque un produit, ou ajoute-en un nouveau.
      </p>
      {msg && <div className="notice">{msg}</div>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <button className="btn btn-gold" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Fermer" : "+ Ajouter un produit"}
        </button>
        <button
          className="btn btn-outline"
          onClick={async () => {
            if (!confirm("Remettre les prix du catalogue ? Cela efface tous les prix modifiés à la main dans l'admin et applique les prix du site.")) return;
            const res = await fetch("/api/admin/catalog", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
              body: JSON.stringify({ action: "resetPrices" }),
            });
            const data = await res.json().catch(() => ({}));
            setMsg(res.ok ? `Prix du catalogue rétablis ✓ (${data.count || 0} produit${(data.count || 0) > 1 ? "s" : ""})` : "Échec.");
            if (res.ok) onReload();
          }}
        >
          Remettre les prix du catalogue
        </button>
      </div>

      {showAdd && (
        <AddProduct
          onCreate={async (prod) => {
            const ok = await post({ action: "create", product: prod });
            setMsg(ok ? "Produit ajouté ✓" : "Échec de l'ajout.");
            if (ok) { setShowAdd(false); onReload(); }
          }}
        />
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Rechercher un produit (nom, catégorie)…"
        style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 16 }}
      />
      {groupByCategory(shown).map((group) => (
        <div key={group.slug} style={{ marginBottom: 26 }}>
          <h3 className="admin-group-title">
            {group.label} <span className="admin-group-count">{group.items.length}</span>
          </h3>

          {group.items.map((p) => (
            <div key={p.slug} className="admin-block">
              <div className="admin-product-row">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="admin-thumb" src={p.image} alt={p.name} />
                ) : (
                  <span className="admin-thumb admin-thumb-empty">?</span>
                )}
                <span className="admin-variant" style={{ minWidth: 0 }}>
                  <strong>{p.name}</strong>
                  {p.hidden ? <span style={{ color: "#b4452f", marginLeft: 6 }}>· masqué</span> : null}
                  {p.custom ? <span style={{ color: "#256b34", marginLeft: 6 }}>· ajouté</span> : null}
                  <span className="admin-row-sub">{(p.variants || []).length} variante{(p.variants || []).length > 1 ? "s" : ""}</span>
                </span>
                <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                  onClick={() => setOpenSlug(openSlug === p.slug ? null : p.slug)}>
                  {openSlug === p.slug ? "Fermer" : "Modifier"}
                </button>
              </div>

              {openSlug === p.slug && (
                <EditProduct
                  product={p}
                  adminKey={adminKey}
                  onReload={onReload}
                  onSave={async (patch) => {
                    const ok = await post({ action: "edit", slug: p.slug, patch });
                    setMsg(ok ? "Modifications enregistrées ✓" : "Échec.");
                    if (ok) onReload();
                  }}
                  onDelete={p.custom ? async () => {
                    if (!confirm("Supprimer définitivement ce produit ?")) return;
                    const ok = await post({ action: "delete", slug: p.slug });
                    setMsg(ok ? "Produit supprimé ✓" : "Échec.");
                    if (ok) onReload();
                  } : null}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function EditProduct({ product, adminKey, onReload, onSave, onDelete }) {
  const [name, setName] = useState(product.name || "");
  const [tagline, setTagline] = useState(product.tagline || "");
  const [category, setCategory] = useState(product.category || "cadeaux");
  const [badge, setBadge] = useState(product.badge || "");
  const [hidden, setHidden] = useState(Boolean(product.hidden));
  const [desc, setDesc] = useState(product.descriptionHtml || "");
  const [prices, setPrices] = useState(
    Object.fromEntries((product.variants || []).map((v) => [v.id, v.price]))
  );
  // Remise en % (calculée depuis le prix promo actuel de la 1re variante).
  const firstPrice = product.variants?.[0]?.price || 0;
  const initialPct =
    product.salePrice && firstPrice && product.salePrice < firstPrice
      ? Math.round((1 - product.salePrice / firstPrice) * 100)
      : 0;
  const [discountPct, setDiscountPct] = useState(initialPct);
  // Photos du produit : on part des photos personnalisées si elles existent, sinon des photos d'origine.
  const [imgs, setImgs] = useState(
    product.overrideImages?.length ? product.overrideImages : (product.images || [])
  );
  const [imgSaved, setImgSaved] = useState(false);
  const [imgErr, setImgErr] = useState("");

  async function saveImages(next) {
    setImgErr("");
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ slug: product.slug, images: next }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement des photos.");
      setImgSaved(true);
      setTimeout(() => setImgSaved(false), 1500);
      onReload && onReload();
    } catch (e) {
      setImgErr(e.message);
    }
  }

  // Déplace une photo (réordonner) ; la 1re photo est la photo principale.
  function moveImg(from, to) {
    if (to < 0 || to >= imgs.length) return;
    const next = imgs.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setImgs(next);
    saveImages(next);
  }

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
      <label className="admin-field">Nom
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="admin-field">Phrase d'accroche
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </label>
      <label className="admin-field">Catégorie
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
      </label>
      <label className="admin-field">Badge sur la vignette (boutique)
        <select value={badge} onChange={(e) => setBadge(e.target.value)}>
          <option value="">Aucun</option>
          <option value="Nouveau">Nouveau</option>
          <option value="Coup de cœur">Coup de cœur</option>
          <option value="Populaire">Populaire</option>
          <option value="Naissance">Naissance</option>
          <option value="Bientôt épuisé">Bientôt épuisé</option>
        </select>
      </label>
      <div>
        <span className="admin-field" style={{ display: "block", marginBottom: 4 }}>Prix par variante (€)</span>
        {(product.variants || []).map((v) => (
          <div className="admin-row" key={v.id} style={{ gridTemplateColumns: "1fr 110px" }}>
            <span className="admin-variant">{v.title}</span>
            <input type="number" min="0" step="0.01" value={prices[v.id] ?? ""}
              onChange={(e) => setPrices({ ...prices, [v.id]: e.target.value === "" ? "" : Number(e.target.value) })} />
          </div>
        ))}
      </div>
      <label className="admin-field">Remise (%) sur ce produit
        <input type="number" min="0" max="90" step="1" value={discountPct}
          onChange={(e) => setDiscountPct(e.target.value === "" ? "" : Number(e.target.value))} />
        <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 400 }}>
          0 = aucune remise. La remise s'applique à toutes les variantes et se recalcule
          automatiquement si tu changes le prix. Le prix barré reste le prix ci-dessus.
        </span>
      </label>
      <div>
        <span className="admin-field" style={{ display: "block", marginBottom: 6 }}>Photos {imgSaved ? "✓" : ""}</span>
        <div className="photo-thumbs">
          {imgs.map((u, i) => (
            <span key={u} className="photo-thumb-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" />
              {i === 0 && <span className="photo-thumb-main">Principale</span>}
              <button type="button" className="photo-thumb-del" title="Retirer cette photo"
                onClick={() => { const next = imgs.filter((x) => x !== u); setImgs(next); saveImages(next); }}>×</button>
              <span className="photo-thumb-moves">
                <button type="button" title="Déplacer vers la gauche" disabled={i === 0}
                  onClick={() => moveImg(i, i - 1)}>‹</button>
                <button type="button" title="Déplacer vers la droite" disabled={i === imgs.length - 1}
                  onClick={() => moveImg(i, i + 1)}>›</button>
              </span>
            </span>
          ))}
          {imgs.length === 0 && <span className="ep-empty">Aucune photo</span>}
        </div>
        {imgs.length > 1 && (
          <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "6px 0 0" }}>
            Utilise les flèches ‹ › pour changer l'ordre. La 1ʳᵉ photo (« Principale ») est celle qui s'affiche sur la vignette.
          </p>
        )}
        {UPLOAD_AVAILABLE && (
          <div style={{ marginTop: 10 }}>
            <PhotoUpload value="" multiple productSlug={product.slug} onUpload={(urls) => {
              const next = [...imgs, ...urls];
              setImgs(next);
              saveImages(next);
            }} />
          </div>
        )}
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            Ou coller des liens (URL) — avancé
          </summary>
          <textarea
            placeholder="https://… (une URL par ligne)"
            defaultValue={imgs.join("\n")}
            onBlur={(e) => { const next = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean); setImgs(next); saveImages(next); }}
            style={{ minHeight: 70, marginTop: 8 }}
          />
        </details>
        {imgErr && <span className="char-count" style={{ color: "#b4452f", textAlign: "left" }}>{imgErr}</span>}
        <Model3DUpload slug={product.slug} current={product.model3d} adminKey={adminKey} onSaved={() => onReload && onReload()} />
      </div>
      <label className="admin-field">Description (texte ou HTML)
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 90 }} />
      </label>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} style={{ width: "auto" }} />
        Masquer ce produit (invisible sur le site)
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-gold" onClick={() => onSave({
          name, tagline, category, hidden, badge: badge || "none",
          descriptionHtml: desc,
          prices: Object.fromEntries(Object.entries(prices).filter(([, v]) => typeof v === "number")),
          discountPct: discountPct === "" ? 0 : discountPct,
        })}>Enregistrer</button>
        {onDelete && <button className="btn btn-outline" onClick={onDelete} style={{ color: "#b4452f" }}>Supprimer</button>}
      </div>
    </div>
  );
}

function AddProduct({ onCreate }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cadeaux");
  const [subcategory, setSubcategory] = useState("");
  const [tagline, setTagline] = useState("");
  const [type, setType] = useState("");
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState("");
  const [letter, setLetter] = useState(true);
  // Variantes (au moins une) : titre + prix, comme sur Shopify.
  const [variants, setVariants] = useState([{ title: "Standard", price: "" }]);
  const setVar = (i, k, v) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const subs = SUBCATEGORIES[category] || null;

  return (
    <div className="admin-block" style={{ display: "grid", gap: 10 }}>
      <h3 style={{ marginTop: 0 }}>Nouveau produit</h3>
      <label className="admin-field">Nom *
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Médaillon photo gravé" />
      </label>
      <label className="admin-field">Catégorie
        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }}>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
      </label>
      {subs && (
        <label className="admin-field">Sous-catégorie
          <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
            <option value="">—</option>
            {subs.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
          </select>
        </label>
      )}
      <label className="admin-field">Phrase d'accroche
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex : Le souvenir gravé qui fait fondre les cœurs." />
      </label>
      <label className="admin-field">Type (affiché sur la vignette)
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex : Collier personnalisé, Décoration de mariage…" />
      </label>
      <div>
        <span className="admin-field" style={{ display: "block", marginBottom: 4 }}>Options & prix (€) *</span>
        {variants.map((v, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input value={v.title} onChange={(e) => setVar(i, "title", e.target.value)} placeholder={`Option ${i + 1} (ex : Doré, À l'unité…)`} style={{ flex: 1, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            <input type="number" min="0" step="0.01" value={v.price} onChange={(e) => setVar(i, "price", e.target.value)} placeholder="24.90" style={{ width: 110, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            {variants.length > 1 && (
              <button type="button" className="btn btn-outline" style={{ padding: "4px 10px", color: "#b4452f" }} onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>×</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => setVariants((vs) => [...vs, { title: "", price: "" }])}>+ Ajouter une option (couleur, lot…)</button>
      </div>
      <label className="admin-field">Description
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 80 }} placeholder="Décris le produit…" />
      </label>
      <div>
        <span className="admin-field" style={{ display: "block", marginBottom: 4 }}>Photos</span>
        {UPLOAD_AVAILABLE && (
          <PhotoUpload value="" multiple onUpload={(urls) => setImages((cur) => [cur, ...urls].filter(Boolean).join("\n"))} />
        )}
        <textarea value={images} onChange={(e) => setImages(e.target.value)} style={{ minHeight: 60, marginTop: 8 }} placeholder="Ou colle des liens (une URL par ligne)" />
      </div>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={letter} onChange={(e) => setLetter(e.target.checked)} style={{ width: "auto" }} />
        Petit objet (expédiable en lettre suivie). Décoche si c'est un objet volumineux (colis).
      </label>
      <button className="btn btn-gold" onClick={() => onCreate({
        name, category, subcategory: subcategory || undefined, letter,
        tagline, type,
        price: variants[0]?.price,
        variants: variants.filter((v) => Number(v.price) > 0),
        descriptionHtml: desc,
        images: images.split("\n").map((s) => s.trim()).filter(Boolean),
      })}>Créer le produit</button>
    </div>
  );
}
