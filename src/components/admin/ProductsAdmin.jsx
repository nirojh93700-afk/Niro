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
          adminKey={adminKey}
          setMsg={setMsg}
          onDone={() => { setShowAdd(false); onReload(); }}
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
                  onDelete={async () => {
                    if (p.custom) {
                      if (!confirm("Supprimer définitivement ce produit ?")) return;
                      const ok = await post({ action: "delete", slug: p.slug });
                      setMsg(ok ? "Produit supprimé ✓" : "Échec.");
                      if (ok) onReload();
                    } else {
                      // Produit du catalogue (code) : on ne peut pas l'effacer, on le
                      // retire du site (masqué). Réversible via la case « Masquer ».
                      if (!confirm("Retirer ce produit du site ? Il n'apparaîtra plus dans la boutique. (Réversible)")) return;
                      const ok = await post({ action: "edit", slug: p.slug, patch: { hidden: true } });
                      setMsg(ok ? "Produit retiré du site ✓" : "Échec.");
                      if (ok) onReload();
                    }
                  }}
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
  // Variantes éditables : on peut changer le titre/prix, en ajouter et en retirer.
  const [vars, setVars] = useState((product.variants || []).map((v) => ({ id: v.id, title: v.title, price: v.price })));
  const setVarField = (i, k, val) => setVars((vs) => vs.map((x, j) => (j === i ? { ...x, [k]: val } : x)));
  const addVar = () => setVars((vs) => [...vs, { id: `${product.slug}-x${Math.random().toString(36).slice(2, 6)}`, title: "", price: "" }]);
  const removeVar = (i) => setVars((vs) => vs.filter((_, j) => j !== i));
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
        <span className="admin-field" style={{ display: "block", marginBottom: 4 }}>Options / variantes (titre · prix €)</span>
        {vars.map((v, i) => (
          <div key={v.id} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input value={v.title} onChange={(e) => setVarField(i, "title", e.target.value)} placeholder={`Option ${i + 1} (ex : Doré…)`} style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            <input type="number" min="0" step="0.01" value={v.price ?? ""} onChange={(e) => setVarField(i, "price", e.target.value === "" ? "" : Number(e.target.value))} placeholder="Prix €" style={{ width: 100, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            {vars.length > 1 && (
              <button type="button" className="btn btn-outline" style={{ padding: "4px 10px", color: "#b4452f" }} onClick={() => removeVar(i)}>×</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={addVar}>+ Ajouter une variante</button>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "4px 0 0" }}>Le stock des nouvelles variantes se règle dans <strong>Catalogue → Stock</strong>.</p>
      </div>

      {/* Options de gravure de ce produit (ce que le client remplit sur la fiche) */}
      {(() => {
        const fields = (product.personalizationFields || []).filter((f) => f.type !== "note");
        const ep = product.engravingPricing || {};
        const flat = Array.isArray(ep.flatExtras) ? ep.flatExtras : [];
        const TYPE = { text: "texte", textarea: "texte", font: "police", color: "couleur", photo: "photo", select: "choix", modele: "modèle de gravure", motifniv: "motif", badge: "badge" };
        const supForKey = (k) => {
          const e = flat.find((x) => x.key === k && x.value === undefined);
          return e ? ` · +${e.amount} €` : "";
        };
        const dualExtra = flat.find((x) => x.value === "deux");
        const modeleSub = ep.modeleSubExtra;
        return (
          <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: "10px 12px", background: "#faf6ee" }}>
            <span className="admin-field" style={{ display: "block", marginBottom: 6 }}>🖊️ Options de gravure (ce que le client remplit sur la fiche)</span>
            {fields.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.86rem", lineHeight: 1.6 }}>
                {fields.map((f) => (
                  <li key={f.key}>
                    {f.label || f.key}
                    <span style={{ color: "var(--ink-soft)" }}> — {TYPE[f.type] || (f.type ? f.type : "texte")}{f.optional ? " (facultatif)" : ""}{supForKey(f.key)}</span>
                  </li>
                ))}
                {modeleSub && <li>Texte ajouté au modèle <span style={{ color: "var(--ink-soft)" }}>· +{modeleSub.amount} €</span></li>}
                {dualExtra && <li>Graver les deux côtés (face + fond) <span style={{ color: "var(--ink-soft)" }}>· +{dualExtra.amount} €</span></li>}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>Aucune option de gravure sur ce produit.</p>
            )}
            <p style={{ margin: "8px 0 0", fontSize: "0.76rem", color: "var(--ink-soft)" }}>
              Ces options s'affichent sur la fiche client. Pour en modifier une (ajouter une face, changer un supplément…), dis-le-moi.
            </p>
          </div>
        );
      })()}
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
        <button className="btn btn-gold" onClick={() => {
          const cleanVars = vars.filter((v) => v.title.trim() && Number(v.price) > 0).map((v) => ({ id: v.id, title: v.title.trim(), price: Math.round(Number(v.price) * 100) / 100 }));
          onSave({
            name, tagline, category, hidden, badge: badge || "none",
            descriptionHtml: desc,
            variants: cleanVars,
            prices: Object.fromEntries(cleanVars.map((v) => [v.id, v.price])),
            discountPct: discountPct === "" ? 0 : discountPct,
          });
        }}>Enregistrer</button>
        {onDelete && <button className="btn btn-outline" onClick={onDelete} style={{ color: "#b4452f" }}>Supprimer</button>}
      </div>
    </div>
  );
}

function AddProduct({ adminKey, setMsg, onDone }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cadeaux");
  const [subcategory, setSubcategory] = useState("");
  const [tagline, setTagline] = useState("");
  const [type, setType] = useState("");
  const [badge, setBadge] = useState("");
  const [desc, setDesc] = useState("");
  const [imgs, setImgs] = useState([]);            // photos (URLs), illimitées + réordonnables
  const [letter, setLetter] = useState(true);
  const [pickup, setPickup] = useState(false);
  const [weight, setWeight] = useState("");
  const [dimL, setDimL] = useState(""); const [dimW, setDimW] = useState(""); const [dimH, setDimH] = useState("");
  // Variantes : titre + prix + stock (add/suppr).
  const [variants, setVariants] = useState([{ title: "Standard", price: "", stock: "" }]);
  const [creating, setCreating] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const setVar = (i, k, v) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const subs = SUBCATEGORIES[category] || null;

  function moveImg(from, to) {
    if (to < 0 || to >= imgs.length) return;
    const next = imgs.slice(); const [m] = next.splice(from, 1); next.splice(to, 0, m); setImgs(next);
  }

  async function create() {
    if (!name.trim()) { setMsg && setMsg("Le nom est obligatoire."); return; }
    const vs = variants.filter((v) => Number(v.price) > 0);
    if (!vs.length) { setMsg && setMsg("Indique au moins une option avec un prix."); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          action: "create",
          product: {
            name, category, subcategory: subcategory || undefined, type, tagline,
            badge: badge || undefined, letter, pickup,
            weight: weight === "" ? undefined : Number(weight),
            dimL: dimL || undefined, dimW: dimW || undefined, dimH: dimH || undefined,
            price: vs[0]?.price,
            variants: vs,
            descriptionHtml: desc,
            images: imgs,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.slug) {
        setMsg && setMsg("Produit créé ✓ — tu peux ajouter un modèle 3D ci-dessous, ou cliquer « Terminé ».");
        setCreatedSlug(data.slug);
      } else {
        setMsg && setMsg(data.error || "Échec de l'ajout.");
      }
    } catch { setMsg && setMsg("Erreur réseau."); }
    setCreating(false);
  }

  // Étape 2 (après création) : modèle 3D optionnel + Terminé.
  if (createdSlug) {
    return (
      <div className="admin-block" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ marginTop: 0 }}>✓ « {name} » créé</h3>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
          Dernière étape (facultative) : ajoute un <strong>modèle 3D (.glb)</strong> pour l'aperçu rotatif. Sinon, clique « Terminé ».
        </p>
        <Model3DUpload slug={createdSlug} current="" adminKey={adminKey} onSaved={() => { /* gardé en base */ }} />
        <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={onDone}>Terminé</button>
      </div>
    );
  }

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
      <label className="admin-field">Type (affiché sur la vignette)
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex : Collier personnalisé…" />
      </label>
      <label className="admin-field">Phrase d'accroche
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex : Le souvenir gravé qui fait fondre les cœurs." />
      </label>
      <label className="admin-field">Badge sur la vignette
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
        <span className="admin-field" style={{ display: "block", marginBottom: 4 }}>Options · prix (€) · stock *</span>
        {variants.map((v, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <input value={v.title} onChange={(e) => setVar(i, "title", e.target.value)} placeholder={`Option ${i + 1} (ex : Doré…)`} style={{ flex: "1 1 130px", padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            <input type="number" min="0" step="0.01" value={v.price} onChange={(e) => setVar(i, "price", e.target.value)} placeholder="Prix €" style={{ width: 90, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            <input type="number" min="0" step="1" value={v.stock} onChange={(e) => setVar(i, "stock", e.target.value)} placeholder="Stock" style={{ width: 80, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
            {variants.length > 1 && (
              <button type="button" className="btn btn-outline" style={{ padding: "4px 10px", color: "#b4452f" }} onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>×</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => setVariants((vs) => [...vs, { title: "", price: "", stock: "" }])}>+ Ajouter une option (couleur, lot…)</button>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "4px 0 0" }}>Stock vide = non suivi (vendable sans compteur).</p>
      </div>

      <label className="admin-field">Description
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 80 }} placeholder="Décris le produit…" />
      </label>

      <div>
        <span className="admin-field" style={{ display: "block", marginBottom: 4 }}>Photos (autant que tu veux)</span>
        {imgs.length > 0 && (
          <div className="photo-thumbs">
            {imgs.map((u, i) => (
              <span key={u + i} className="photo-thumb-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" />
                {i === 0 && <span className="photo-thumb-main">Principale</span>}
                <button type="button" className="photo-thumb-del" title="Retirer" onClick={() => setImgs(imgs.filter((x) => x !== u))}>×</button>
                <span className="photo-thumb-moves">
                  <button type="button" disabled={i === 0} onClick={() => moveImg(i, i - 1)}>‹</button>
                  <button type="button" disabled={i === imgs.length - 1} onClick={() => moveImg(i, i + 1)}>›</button>
                </span>
              </span>
            ))}
          </div>
        )}
        {UPLOAD_AVAILABLE && (
          <div style={{ marginTop: 8 }}>
            <PhotoUpload value="" multiple onUpload={(urls) => setImgs((cur) => [...cur, ...urls])} />
          </div>
        )}
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "var(--ink-soft)" }}>Ou coller des liens (URL)</summary>
          <textarea defaultValue={imgs.join("\n")} onBlur={(e) => setImgs(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} style={{ minHeight: 60, marginTop: 8 }} placeholder="https://… (une URL par ligne)" />
        </details>
      </div>

      {/* Livraison */}
      <details>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>📦 Livraison & dimensions (facultatif)</summary>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={letter} onChange={(e) => setLetter(e.target.checked)} style={{ width: "auto" }} />
            Petit objet (lettre suivie). Décoche si volumineux (colis).
          </label>
          <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} style={{ width: "auto" }} />
            Retrait en main propre possible
          </label>
          <label className="admin-field">Poids emballé (g)
            <input type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex : 150" />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="admin-field" style={{ flex: 1 }}>Long. (cm)<input type="number" min="0" value={dimL} onChange={(e) => setDimL(e.target.value)} /></label>
            <label className="admin-field" style={{ flex: 1 }}>Larg. (cm)<input type="number" min="0" value={dimW} onChange={(e) => setDimW(e.target.value)} /></label>
            <label className="admin-field" style={{ flex: 1 }}>Haut. (cm)<input type="number" min="0" value={dimH} onChange={(e) => setDimH(e.target.value)} /></label>
          </div>
        </div>
      </details>

      <button className="btn btn-gold" disabled={creating} onClick={create}>{creating ? "Création…" : "Créer le produit"}</button>
    </div>
  );
}
