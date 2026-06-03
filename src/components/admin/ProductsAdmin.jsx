"use client";

import { useState } from "react";
import { CATEGORIES, SUBCATEGORIES, getCategoryLabel } from "@/lib/products";

// Édition / création / suppression des produits depuis l'admin.
export default function ProductsAdmin({ adminKey, products, onReload }) {
  const [openSlug, setOpenSlug] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState("");

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

      <button className="btn btn-gold" style={{ marginBottom: 18 }} onClick={() => setShowAdd((s) => !s)}>
        {showAdd ? "Fermer" : "+ Ajouter un produit"}
      </button>

      {showAdd && (
        <AddProduct
          onCreate={async (prod) => {
            const ok = await post({ action: "create", product: prod });
            setMsg(ok ? "Produit ajouté ✓" : "Échec de l'ajout.");
            if (ok) { setShowAdd(false); onReload(); }
          }}
        />
      )}

      {products.map((p) => (
        <div key={p.slug} className="admin-block">
          <div className="admin-row" style={{ gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 8 }}>
            <span className="admin-variant">
              <strong>{p.name}</strong>{" "}
              <span className="admin-cat">{getCategoryLabel(p.category)}</span>
              {p.hidden ? <span style={{ color: "#b4452f", marginLeft: 6 }}>· masqué</span> : null}
              {p.custom ? <span style={{ color: "#256b34", marginLeft: 6 }}>· ajouté</span> : null}
            </span>
            <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
              onClick={() => setOpenSlug(openSlug === p.slug ? null : p.slug)}>
              {openSlug === p.slug ? "Fermer" : "Modifier"}
            </button>
          </div>

          {openSlug === p.slug && (
            <EditProduct
              product={p}
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
    </>
  );
}

function EditProduct({ product, onSave, onDelete }) {
  const [name, setName] = useState(product.name || "");
  const [tagline, setTagline] = useState(product.tagline || "");
  const [category, setCategory] = useState(product.category || "cadeaux");
  const [hidden, setHidden] = useState(Boolean(product.hidden));
  const [desc, setDesc] = useState(product.descriptionHtml || "");
  const [prices, setPrices] = useState(
    Object.fromEntries((product.variants || []).map((v) => [v.id, v.price]))
  );

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
      <label className="admin-field">Description (texte ou HTML)
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 90 }} />
      </label>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} style={{ width: "auto" }} />
        Masquer ce produit (invisible sur le site)
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-gold" onClick={() => onSave({
          name, tagline, category, hidden,
          descriptionHtml: desc,
          prices: Object.fromEntries(Object.entries(prices).filter(([, v]) => typeof v === "number")),
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
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState("");
  const [letter, setLetter] = useState(true);
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
      <label className="admin-field">Prix (€) *
        <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="24.90" />
      </label>
      <label className="admin-field">Description
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 80 }} placeholder="Décris le produit…" />
      </label>
      <label className="admin-field">Photos (une URL par ligne)
        <textarea value={images} onChange={(e) => setImages(e.target.value)} style={{ minHeight: 60 }} placeholder="https://…" />
      </label>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={letter} onChange={(e) => setLetter(e.target.checked)} style={{ width: "auto" }} />
        Petit objet (expédiable en lettre suivie). Décoche si c'est un objet volumineux (colis).
      </label>
      <button className="btn btn-gold" onClick={() => onCreate({
        name, category, subcategory: subcategory || undefined, price, letter,
        descriptionHtml: desc,
        images: images.split("\n").map((s) => s.trim()).filter(Boolean),
      })}>Créer le produit</button>
    </div>
  );
}
