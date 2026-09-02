"use client";

import { useState, useEffect } from "react";
import { CATEGORIES as DEF_CATS, SUBCATEGORIES as DEF_SUBS } from "@/lib/products";
import { resolveCategories, resolveSubcategories } from "@/lib/taxonomy";
import PhotoUpload, { UPLOAD_AVAILABLE } from "@/components/PhotoUpload";
import Model3DUpload from "@/components/admin/Model3DUpload";
import { MarginBox, EngravingBuilder, SeasonalFields, makeTierVariant } from "@/components/admin/ProductFormParts";


// Regroupe les produits par catégorie, dans l'ordre des catégories (vivantes).
function groupByCategory(products, cats) {
  const order = cats.map((c) => c.slug);
  const groups = [];
  for (const cat of cats) {
    const items = products.filter((p) => p.category === cat.slug);
    if (items.length) groups.push({ slug: cat.slug, label: cat.label, items });
  }
  // Produits dont la catégorie n'existe plus / vide → groupe « Autres ».
  const others = products.filter((p) => !order.includes(p.category));
  if (others.length) groups.push({ slug: "_autres", label: "Autres", items: others });
  return groups;
}

const fmtEuro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

// État du stock d'un produit à partir de ses lignes de stock.
function stockState(list) {
  if (!list || !list.length) return "none";
  const nums = list.filter((s) => typeof s.value === "number");
  if (!nums.length) return "none";
  if (nums.some((s) => s.value === 0)) return "out";
  if (nums.some((s) => s.value > 0 && s.value <= 2)) return "low";
  return "ok";
}

// Pastilles de stock (un champ par variante suivie) — identiques dans le tableau
// et dans le panneau : même logique, même enregistrement (au blur).
function StockPills({ list, stockSaved, onStockChange, onStockSave }) {
  if (!list || !list.length) return <span className="pt-muted">non suivi</span>;
  return (
    <div className="admin-stock-line" style={{ marginTop: 0 }}>
      {list.map((s) => {
        const out = typeof s.value === "number" && s.value === 0;
        const low = typeof s.value === "number" && s.value > 0 && s.value <= 2;
        return (
          <span key={s.key} className={`admin-stock-pill ${out ? "out" : low ? "low" : s.value == null ? "none" : "ok"}`}>
            <span className="asp-dot" />
            <span className="asp-lab">{s.label || "Stock"}{out ? " · RUPTURE" : ""}</span>
            <input
              type="number" min="0" placeholder="—"
              value={s.value ?? ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onStockChange && onStockChange(s.key, e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={(e) => onStockSave && onStockSave(s.key, e.target.value)}
            />
            <span className="asp-ok">{stockSaved === s.key ? "✓" : ""}</span>
          </span>
        );
      })}
    </div>
  );
}

// Produits & stock : tableau (une ligne par produit, stock modifiable en ligne)
// + panneau latéral pour modifier une fiche ou en créer une.
export default function ProductsAdmin({ adminKey, products, onReload, stockBySlug = {}, onStockChange, onStockSave, stockSaved, optionRows = [] }) {
  const [openSlug, setOpenSlug] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [status, setStatus] = useState("all");
  // Catégories vivantes (réglées dans « Catégories & ordre »), repli sur le code.
  const [cats, setCats] = useState(DEF_CATS);
  const [subsMap, setSubsMap] = useState(DEF_SUBS);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/taxonomy", { headers: { "x-admin-key": adminKey } });
        const d = await res.json().catch(() => ({}));
        setCats(resolveCategories(d.taxonomy || {}));
        setSubsMap(resolveSubcategories(d.taxonomy || {}));
      } catch { /* repli défauts */ }
    })();
  }, [adminKey]);

  // Panneau ouvert : Échap pour fermer, page derrière figée.
  const drawerOpen = Boolean(openSlug) || showAdd;
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpenSlug(null); setShowAdd(false); } };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [drawerOpen]);

  // Message d'état effacé tout seul.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const stateOf = (p) => stockState(stockBySlug[p.slug]);
  const counts = {
    total: products.length,
    visibles: products.filter((p) => !p.hidden).length,
    masques: products.filter((p) => p.hidden).length,
    rupture: products.filter((p) => stateOf(p) === "out").length,
    bas: products.filter((p) => stateOf(p) === "low").length,
  };

  const q = search.trim().toLowerCase();
  const shown = products.filter((p) => {
    if (q && !`${p.name} ${p.slug} ${p.category} ${p.tagline || ""}`.toLowerCase().includes(q)) return false;
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (status === "masque" && !p.hidden) return false;
    if (status === "visible" && p.hidden) return false;
    if (status === "rupture" && stateOf(p) !== "out") return false;
    if (status === "bas" && stateOf(p) !== "low") return false;
    if (status === "nouveau" && p.badge !== "Nouveau") return false;
    return true;
  });
  const groups = groupByCategory(shown, cats);
  const openProduct = openSlug ? products.find((p) => p.slug === openSlug) : null;

  async function post(payload) {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(payload),
    });
    return res.ok;
  }

  const filterChip = (value, label, n) => (
    <button type="button" key={value} className={`pt-chip${catFilter === value ? " on" : ""}`} onClick={() => setCatFilter(value)}>
      {label}{typeof n === "number" ? <span>{n}</span> : null}
    </button>
  );

  return (
    <div className="pt">
      <div className="ph-kpis" style={{ marginTop: 0 }}>
        <div className="ph-kpi"><small>Produits</small><b>{counts.total}</b><span>{counts.visibles} visibles · {counts.masques} masqué{counts.masques > 1 ? "s" : ""}</span></div>
        <div className={`ph-kpi${counts.rupture ? " bad alert" : " good"}`}><small>En rupture</small><b>{counts.rupture}</b><span>{counts.rupture ? "à réassortir" : "aucune rupture"}</span></div>
        <div className={`ph-kpi${counts.bas ? " warn" : ""}`}><small>Stock bas (≤ 2)</small><b>{counts.bas}</b><span>à surveiller</span></div>
        <div className="ph-kpi"><small>Accessoires en option</small><b>{optionRows.length}</b><span>socles, options</span></div>
      </div>

      {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}

      <div className="pt-toolbar">
        <input
          className="pt-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un produit…"
        />
        <select className="pt-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par état">
          <option value="all">Tous les états</option>
          <option value="visible">Visibles sur le site</option>
          <option value="masque">Masqués</option>
          <option value="rupture">En rupture</option>
          <option value="bas">Stock bas</option>
          <option value="nouveau">Étiquette « Nouveau »</option>
        </select>
        <div className="pt-toolbar-actions">
          <button className="btn btn-gold" onClick={() => { setOpenSlug(null); setShowAdd(true); }}>+ Ajouter un produit</button>
          <button
            className="btn btn-outline"
            title="Efface les prix modifiés à la main et remet ceux du catalogue"
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
            Remettre les prix
          </button>
        </div>
      </div>
      <div className="pt-chips">
        {filterChip("all", "Tous", products.length)}
        {cats.map((c) => filterChip(c.slug, c.label, products.filter((p) => p.category === c.slug).length))}
      </div>

      <div className="pt-table">
        <div className="pt-row pt-head">
          <span />
          <span>Produit</span>
          <span>Catégorie</span>
          <span>Prix</span>
          <span>Stock</span>
          <span />
        </div>
        {groups.length === 0 && (
          <div className="pt-empty">Aucun produit ne correspond à cette recherche.</div>
        )}
        {groups.map((group) => (
          <div key={group.slug} className="pt-group">
            {(catFilter === "all" || groups.length > 1) && (
              <div className="pt-group-title">{group.label} <span>{group.items.length}</span></div>
            )}
            {group.items.map((p) => {
              const st = stateOf(p);
              const nVar = (p.variants || []).length;
              const price = p.variants?.[0]?.price;
              return (
                <div
                  key={p.slug}
                  className={`pt-row${openSlug === p.slug ? " open" : ""}${p.hidden ? " hidden" : ""}`}
                  onClick={() => { setShowAdd(false); setOpenSlug(p.slug); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") { setShowAdd(false); setOpenSlug(p.slug); } }}
                >
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="admin-thumb pt-thumb" src={p.image} alt="" />
                  ) : (
                    <span className="admin-thumb admin-thumb-empty pt-thumb">?</span>
                  )}
                  <span className="pt-name">
                    <strong>{p.name}</strong>
                    <span className="pt-tags">
                      {p.hidden ? <em className="pt-tag off">masqué</em> : null}
                      {p.badge ? <em className="pt-tag badge">{p.badge}</em> : null}
                      {p.custom ? <em className="pt-tag">ajouté</em> : null}
                      {st === "out" ? <em className="pt-tag out">rupture</em> : st === "low" ? <em className="pt-tag low">stock bas</em> : null}
                      <em className="pt-tag soft">{nVar} option{nVar > 1 ? "s" : ""}</em>
                    </span>
                  </span>
                  <span className="pt-cat">{(cats.find((c) => c.slug === p.category) || {}).label || p.category}</span>
                  <span className="pt-price">{typeof price === "number" ? fmtEuro(price) : "—"}{nVar > 1 ? <small>dès</small> : null}</span>
                  <span className="pt-stock" onClick={(e) => e.stopPropagation()}>
                    <StockPills list={stockBySlug[p.slug]} stockSaved={stockSaved} onStockChange={onStockChange} onStockSave={onStockSave} />
                  </span>
                  <span className="pt-go" aria-hidden>›</span>
                </div>
              );
            })}

            {/* Accessoires vendus en OPTION sur les fiches de cette catégorie
               (ex. socle lumineux LED des cristaux) : vrais articles en stock,
               rangés avec leur famille. */}
            {optionRows.filter((r) => r.category === group.slug).map((r) => (
              <div className="pt-row pt-option" key={r.stockId}>
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="admin-thumb pt-thumb" src={r.image} alt="" />
                ) : <span className="admin-thumb admin-thumb-empty pt-thumb">◌</span>}
                <span className="pt-name">
                  <strong>{r.variantTitle}</strong>
                  <span className="pt-tags"><em className="pt-tag soft">accessoire en option</em></span>
                </span>
                <span className="pt-cat">{group.label}</span>
                <span className="pt-price">—</span>
                <span className="pt-stock">
                  <span className={`admin-stock-pill ${r.stock === 0 ? "out" : r.stock == null ? "none" : r.stock <= 2 ? "low" : "ok"}`}>
                    <span className="asp-dot" />
                    <span className="asp-lab">Stock{r.stock === 0 ? " · RUPTURE" : ""}</span>
                    <input
                      type="number" min="0" placeholder="—" value={r.stock ?? ""}
                      onChange={(e) => onStockChange?.(r.stockId, e.target.value === "" ? "" : Number(e.target.value))}
                      onBlur={(e) => onStockSave?.(r.stockId, e.target.value)}
                    />
                    <span className="asp-ok">{stockSaved === r.stockId ? "✓" : ""}</span>
                  </span>
                </span>
                <span />
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="pt-muted" style={{ marginTop: 10 }}>
        Le stock se modifie directement dans le tableau (enregistré dès que tu quittes la case). Clique sur une ligne pour ouvrir la fiche complète.
      </p>

      {/* ---------- Panneau latéral : fiche produit / nouveau produit ---------- */}
      {drawerOpen && (
        <>
          <div className="pt-overlay" onClick={() => { setOpenSlug(null); setShowAdd(false); }} />
          <aside className="pt-drawer" role="dialog" aria-modal="true" aria-label={openProduct ? openProduct.name : "Nouveau produit"}>
            <div className="pt-drawer-head">
              {openProduct?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="admin-thumb" src={openProduct.image} alt="" />
              ) : null}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pt-drawer-eyebrow">{openProduct ? "Fiche produit" : "Nouveau produit"}</div>
                <h2 className="pt-drawer-title">{openProduct ? openProduct.name : "Ajouter un produit"}</h2>
                {openProduct ? (
                  <div className="pt-drawer-links">
                    <a href={`/produit/${openProduct.slug}${openProduct.hidden ? "?apercu=niv2026" : ""}`} target="_blank" rel="noreferrer">Voir la fiche sur le site ↗</a>
                    <span className="pt-muted">· /produit/{openProduct.slug}</span>
                  </div>
                ) : null}
              </div>
              <button type="button" className="pt-close" aria-label="Fermer" onClick={() => { setOpenSlug(null); setShowAdd(false); }}>×</button>
            </div>
            <div className="pt-drawer-body">
              {msg && <div className="notice">{msg}</div>}
              {openProduct && (
                <div className="pt-drawer-stock">
                  <div className="pt-drawer-label">Stock par option</div>
                  <StockPills list={stockBySlug[openProduct.slug]} stockSaved={stockSaved} onStockChange={onStockChange} onStockSave={onStockSave} />
                </div>
              )}
              {openProduct && (
                <EditProduct
                  key={openProduct.slug}
                  product={openProduct}
                  adminKey={adminKey}
                  cats={cats}
                  onReload={onReload}
                  onSave={async (patch) => {
                    const ok = await post({ action: "edit", slug: openProduct.slug, patch });
                    setMsg(ok ? "Modifications enregistrées ✓" : "Échec.");
                    if (ok) onReload();
                  }}
                  onDelete={async () => {
                    if (openProduct.custom) {
                      if (!confirm("Supprimer définitivement ce produit ?")) return;
                      const ok = await post({ action: "delete", slug: openProduct.slug });
                      setMsg(ok ? "Produit supprimé ✓" : "Échec.");
                      if (ok) { setOpenSlug(null); onReload(); }
                    } else {
                      // Produit du catalogue (code) : on ne peut pas l'effacer, on le
                      // retire du site (masqué). Réversible via la case « Masquer ».
                      if (!confirm("Retirer ce produit du site ? Il n'apparaîtra plus dans la boutique. (Réversible)")) return;
                      const ok = await post({ action: "edit", slug: openProduct.slug, patch: { hidden: true } });
                      setMsg(ok ? "Produit retiré du site ✓" : "Échec.");
                      if (ok) onReload();
                    }
                  }}
                />
              )}
              {showAdd && (
                <AddProduct
                  adminKey={adminKey}
                  cats={cats}
                  subsMap={subsMap}
                  setMsg={setMsg}
                  onDone={() => { setShowAdd(false); onReload(); }}
                />
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function EditProduct({ product, adminKey, cats = DEF_CATS, onReload, onSave, onDelete }) {
  const [name, setName] = useState(product.name || "");
  const [tagline, setTagline] = useState(product.tagline || "");
  const [category, setCategory] = useState(product.category || "cadeaux");
  const [badge, setBadge] = useState(product.badge || "");
  const [hidden, setHidden] = useState(Boolean(product.hidden));
  const [featured, setFeatured] = useState(Boolean(product.featured));
  const [pickup, setPickup] = useState(Boolean(product.pickup));
  const [cost, setCost] = useState(product.cost ?? "");
  const [lowStock, setLowStock] = useState(product.lowStockThreshold ?? "");
  const [seasonal, setSeasonal] = useState(product.seasonal || null);
  const [fields, setFields] = useState((product.personalizationFields || []).map((f) => ({ ...f })));
  const [fieldsEdited, setFieldsEdited] = useState(false);
  const setFieldsDirty = (next) => { setFields(next); setFieldsEdited(true); };
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
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={addVar}>+ Ajouter une variante</button>
          <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => {
            const qty = prompt("Tarif dégressif — quantité du lot (ex : 20) ?"); if (!qty) return;
            const u = prompt("Prix par pièce dans ce lot (ex : 3.50) ?"); if (!u) return;
            setVars((vs) => [...vs, makeTierVariant(product.slug, qty, u)]);
          }}>+ Tarif dégressif (lot)</button>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "4px 0 0" }}>Le stock d&apos;une nouvelle variante apparaît dans <strong>« Stock par option »</strong> (en haut de ce panneau) après enregistrement.</p>
      </div>

      {/* Gravure / personnalisation — éditable directement */}
      <EngravingBuilder fields={fields} setFields={setFieldsDirty} />
      {product.engravingPricing && (
        <p style={{ fontSize: "0.76rem", color: "#9a7d1a", margin: "-4px 0 0" }}>
          ⚠️ Ce produit a des suppléments de gravure spéciaux (prix par face/photo) gérés à part. Modifier les champs ici ne touche pas ces suppléments — dis-le-moi en cas de doute.
        </p>
      )}
      <MarginBox cost={cost} setCost={setCost} price={vars[0]?.price} />
      <SeasonalFields seasonal={seasonal} setSeasonal={setSeasonal} />
      <label className="admin-field">Alerte stock bas si stock ≤
        <input type="number" min="0" value={lowStock} onChange={(e) => setLowStock(e.target.value)} placeholder="Ex : 5 (laisser vide = non suivi)" />
      </label>
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
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} style={{ width: "auto" }} />
        ⭐ Mettre en avant sur la page d'accueil (« Nos créations phares »)
      </label>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} style={{ width: "auto", marginTop: 3 }} />
        <span>🤝 Retrait en main propre possible (mariage / gros articles)
          <br /><span style={{ fontSize: "0.82rem", color: "#7a6f5c" }}>Le retrait s'affiche aussi <strong>tout seul</strong> pour toute commande de plus de <strong>2 kg</strong> (colis lourd = envoi cher). Jamais pour les bijoux.</span>
        </span>
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-gold" onClick={() => {
          const cleanVars = vars.filter((v) => v.title.trim() && Number(v.price) > 0).map((v) => ({ id: v.id, title: v.title.trim(), price: Math.round(Number(v.price) * 100) / 100 }));
          onSave({
            name, tagline, category, hidden, featured, pickup, badge: badge || "none",
            descriptionHtml: desc,
            variants: cleanVars,
            prices: Object.fromEntries(cleanVars.map((v) => [v.id, v.price])),
            discountPct: discountPct === "" ? 0 : discountPct,
            cost: cost === "" ? "" : Number(cost),
            lowStockThreshold: lowStock === "" ? "" : Number(lowStock),
            seasonal: seasonal && seasonal.hideOutOfSeason ? seasonal : null,
            ...(fieldsEdited ? { personalizationFields: fields } : {}),
          });
        }}>Enregistrer</button>
        {onDelete && <button className="btn btn-outline" onClick={onDelete} style={{ color: "#b4452f" }}>Supprimer</button>}
        <button className="btn btn-outline" title="Efface tes anciennes modifs sur ce produit et revient à la version d'origine"
          onClick={async () => {
            if (!confirm("Réinitialiser ce produit ? Cela efface tes modifications enregistrées (variantes, prix, nom…) et revient à la version d'origine.")) return;
            try {
              const res = await fetch("/api/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ action: "resetProduct", slug: product.slug }) });
              if (res.ok) { alert("Réinitialisé ✓"); onReload && onReload(); } else alert("Échec.");
            } catch { alert("Erreur réseau."); }
          }}>↺ Réinitialiser</button>
      </div>
    </div>
  );
}

function AddProduct({ adminKey, cats = DEF_CATS, subsMap = DEF_SUBS, setMsg, onDone }) {
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
  const [cost, setCost] = useState("");
  const [lowStock, setLowStock] = useState("");
  const [featured, setFeatured] = useState(false);
  const [seasonal, setSeasonal] = useState(null);
  // Gravure : par défaut « texte à graver » + police (retire-les pour un produit sans gravure).
  const [fields, setFields] = useState([
    { key: "texte", label: "Texte à graver", placeholder: "Votre texte…", maxLength: 40, optional: true },
    { key: "police", type: "font", label: "Police de gravure", optional: true },
  ]);
  const [creating, setCreating] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const setVar = (i, k, v) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const subs = subsMap[category] || null;

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
            cost: cost === "" ? undefined : Number(cost),
            lowStockThreshold: lowStock === "" ? undefined : Number(lowStock),
            featured: featured || undefined,
            seasonal: seasonal && seasonal.hideOutOfSeason ? seasonal : undefined,
            personalizationFields: fields,
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
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => setVariants((vs) => [...vs, { title: "", price: "", stock: "" }])}>+ Ajouter une option (couleur, lot…)</button>
          <button type="button" className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => {
            const qty = prompt("Tarif dégressif — quantité du lot (ex : 20) ?"); if (!qty) return;
            const u = prompt("Prix par pièce dans ce lot (ex : 3.50) ?"); if (!u) return;
            const t = makeTierVariant(name, qty, u);
            setVariants((vs) => [...vs, { title: t.title, price: t.price, stock: "" }]);
          }}>+ Tarif dégressif (lot)</button>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "4px 0 0" }}>Stock vide = non suivi (vendable sans compteur).</p>
      </div>

      <MarginBox cost={cost} setCost={setCost} price={variants[0]?.price} />
      <EngravingBuilder fields={fields} setFields={setFields} />

      <label className="admin-field">Description
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 80 }} placeholder="Décris le produit…" />
      </label>

      <SeasonalFields seasonal={seasonal} setSeasonal={setSeasonal} />
      <label className="admin-field">Alerte stock bas si stock ≤
        <input type="number" min="0" value={lowStock} onChange={(e) => setLowStock(e.target.value)} placeholder="Ex : 5 (laisser vide = non suivi)" />
      </label>
      <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} style={{ width: "auto" }} />
        ⭐ Mettre en avant sur la page d'accueil
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
          <label className="admin-field" style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} style={{ width: "auto", marginTop: 3 }} />
            <span>Retrait en main propre possible (mariage / gros articles)
              <br /><span style={{ fontSize: "0.82rem", color: "#7a6f5c" }}>Le retrait s'affiche aussi <strong>tout seul</strong> pour toute commande de plus de <strong>2 kg</strong> (colis lourd = envoi cher). Jamais pour les bijoux.</span>
            </span>
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
