"use client";

import { useEffect, useState } from "react";
import { CATEGORIES as DEF_CATS, SUBCATEGORIES as DEF_SUBS } from "@/lib/products";
import { resolveCategories, resolveSubcategories, resolveProductOrder, makeProductSorter } from "@/lib/taxonomy";

function slugify(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function move(arr, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const arrowBtn = { padding: "2px 9px", fontSize: "0.95rem", lineHeight: 1.1 };

export default function TaxonomyAdmin({ adminKey, products = [] }) {
  const [cats, setCats] = useState(DEF_CATS);
  const [subs, setSubs] = useState(DEF_SUBS);
  const [order, setOrder] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/taxonomy", { headers: { "x-admin-key": adminKey } });
        const data = await res.json().catch(() => ({}));
        const t = data.taxonomy || {};
        setCats(resolveCategories(t));
        setSubs(resolveSubcategories(t));
        setOrder(resolveProductOrder(t));
      } catch { /* repli défauts */ }
      setLoaded(true);
    })();
  }, [adminKey]);

  // --- Catégories ---
  const moveCat = (i, dir) => setCats((c) => move(c, i, dir));
  const renameCat = (i, label) => setCats((c) => c.map((x, j) => (j === i ? { ...x, label, short: label } : x)));
  const deleteCat = (slug) => {
    const n = products.filter((p) => p.category === slug).length;
    if (!confirm(`Supprimer la catégorie « ${slug} » ?${n ? ` Attention : ${n} produit(s) sont dedans — ils disparaîtront du menu tant que tu ne les ranges pas dans une autre catégorie (onglet Produits).` : ""}`)) return;
    setCats((c) => c.filter((x) => x.slug !== slug));
  };
  const addCat = () => {
    const name = prompt("Nom de la nouvelle catégorie ? (ex : Lampes, Bougies…)");
    if (!name) return;
    const slug = slugify(name);
    if (!slug) return;
    if (cats.some((c) => c.slug === slug)) { alert("Cette catégorie existe déjà."); return; }
    setCats((c) => [...c, { slug, label: name.trim(), short: name.trim() }]);
    setSubs((s) => ({ ...s, [slug]: s[slug] || [] }));
  };

  // --- Sous-catégories ---
  const subList = (cat) => subs[cat] || [];
  const moveSub = (cat, i, dir) => setSubs((s) => ({ ...s, [cat]: move(subList(cat), i, dir) }));
  const renameSub = (cat, i, label) => setSubs((s) => ({ ...s, [cat]: subList(cat).map((x, j) => (j === i ? { ...x, label } : x)) }));
  const deleteSub = (cat, slug) => setSubs((s) => ({ ...s, [cat]: subList(cat).filter((x) => x.slug !== slug) }));
  const addSub = (cat) => {
    const name = prompt("Nom de la sous-catégorie ?");
    if (!name) return;
    const slug = slugify(name);
    if (!slug) return;
    if (subList(cat).some((x) => x.slug === slug)) { alert("Cette sous-catégorie existe déjà."); return; }
    setSubs((s) => ({ ...s, [cat]: [...subList(cat), { slug, label: name.trim() }] }));
  };

  // --- Produits (ordre dans la catégorie) ---
  const productsOf = (cat) => products.filter((p) => p.category === cat).slice().sort(makeProductSorter(cat, subs, order));
  const moveProduct = (cat, i, dir) => {
    const list = productsOf(cat).map((p) => p.slug);
    const next = move(list, i, dir);
    if (next === list) return;
    setOrder((o) => ({ ...o, [cat]: next }));
  };

  async function save() {
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "save", taxonomy: { categories: cats, subcategories: subs, productOrder: order } }),
      });
      setMsg(res.ok ? "Enregistré ✓ — visible sur le site d'ici ~1 minute (recharge en navigation privée)." : "Échec de l'enregistrement.");
    } catch { setMsg("Erreur réseau."); }
    setSaving(false);
  }
  async function resetAll() {
    if (!confirm("Revenir à l'organisation d'origine ? Cela efface tes réglages de catégories, sous-catégories et ordre des produits.")) return;
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) { setCats(DEF_CATS); setSubs(DEF_SUBS); setOrder({}); setMsg("Réinitialisé ✓"); }
      else setMsg("Échec.");
    } catch { setMsg("Erreur réseau."); }
    setSaving(false);
  }

  if (!loaded) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Range ta boutique comme tu veux : <strong>ajoute, renomme, supprime et réordonne</strong> les familles (catégories),
        leurs sous-catégories, et l'<strong>ordre des produits</strong> dans chacune. Utilise les flèches ▲▼.
        N'oublie pas de cliquer <strong>« Enregistrer »</strong> en bas.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "10px 0 18px" }}>
        <button className="btn btn-gold" disabled={saving} onClick={save}>{saving ? "Enregistrement…" : "💾 Enregistrer"}</button>
        <button className="btn btn-outline" onClick={addCat}>+ Ajouter une catégorie</button>
        <button className="btn btn-outline" style={{ color: "#b4452f" }} onClick={resetAll}>↺ Réinitialiser</button>
        {msg && <span className="notice" style={{ margin: 0 }}>{msg}</span>}
      </div>

      {cats.map((c, ci) => {
        const prods = productsOf(c.slug);
        const sl = subList(c.slug);
        return (
          <div key={c.slug} className="admin-block" style={{ marginBottom: 20 }}>
            {/* En-tête catégorie */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", gap: 4 }}>
                <button className="btn btn-outline" style={arrowBtn} disabled={ci === 0} onClick={() => moveCat(ci, -1)} title="Monter">▲</button>
                <button className="btn btn-outline" style={arrowBtn} disabled={ci === cats.length - 1} onClick={() => moveCat(ci, 1)} title="Descendre">▼</button>
              </span>
              <input
                value={c.label}
                onChange={(e) => renameCat(ci, e.target.value)}
                style={{ flex: "1 1 200px", padding: "8px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", fontWeight: 600 }}
              />
              <span className="admin-group-count">{prods.length} produit{prods.length > 1 ? "s" : ""}</span>
              <button className="btn btn-outline" style={{ padding: "4px 10px", color: "#b4452f" }} onClick={() => deleteCat(c.slug)}>Supprimer</button>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.74rem", color: "var(--ink-soft)" }}>Identifiant : {c.slug}</p>

            {/* Sous-catégories */}
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#faf6ee", borderRadius: 8 }}>
              <span className="admin-field" style={{ display: "block", marginBottom: 6 }}>Sous-catégories</span>
              {sl.length === 0 && <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Aucune sous-catégorie.</p>}
              {sl.map((s, si) => (
                <div key={s.slug} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <button className="btn btn-outline" style={arrowBtn} disabled={si === 0} onClick={() => moveSub(c.slug, si, -1)}>▲</button>
                  <button className="btn btn-outline" style={arrowBtn} disabled={si === sl.length - 1} onClick={() => moveSub(c.slug, si, 1)}>▼</button>
                  <input
                    value={s.label}
                    onChange={(e) => renameSub(c.slug, si, e.target.value)}
                    style={{ flex: "1 1 160px", padding: "6px 9px", border: "1px solid var(--line)", borderRadius: 7, font: "inherit" }}
                  />
                  <button className="btn btn-outline" style={{ padding: "3px 9px", color: "#b4452f" }} onClick={() => deleteSub(c.slug, s.slug)}>×</button>
                </div>
              ))}
              <button className="btn btn-outline" style={{ padding: "4px 11px", fontSize: "0.85rem" }} onClick={() => addSub(c.slug)}>+ Ajouter une sous-catégorie</button>
            </div>

            {/* Ordre des produits */}
            <div style={{ marginTop: 12 }}>
              <span className="admin-field" style={{ display: "block", marginBottom: 6 }}>Ordre des produits (tel qu'affiché dans la boutique)</span>
              {prods.length === 0 && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>Aucun produit dans cette catégorie.</p>}
              {prods.map((p, pi) => (
                <div key={p.slug} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 22, textAlign: "right", color: "var(--ink-soft)", fontSize: "0.8rem" }}>{pi + 1}.</span>
                  <button className="btn btn-outline" style={arrowBtn} disabled={pi === 0} onClick={() => moveProduct(c.slug, pi, -1)}>▲</button>
                  <button className="btn btn-outline" style={arrowBtn} disabled={pi === prods.length - 1} onClick={() => moveProduct(c.slug, pi, 1)}>▼</button>
                  {p.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img className="admin-thumb" src={p.image} alt="" style={{ width: 34, height: 34 }} />
                    : <span className="admin-thumb admin-thumb-empty" style={{ width: 34, height: 34 }}>?</span>}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {p.name}
                    {p.subcategory ? <span style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}> · {(sl.find((s) => s.slug === p.subcategory)?.label) || p.subcategory}</span> : null}
                    {p.hidden ? <span style={{ color: "#b4452f", fontSize: "0.8rem" }}> · masqué</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "8px 0 30px" }}>
        <button className="btn btn-gold" disabled={saving} onClick={save}>{saving ? "Enregistrement…" : "💾 Enregistrer"}</button>
        {msg && <span className="notice" style={{ margin: 0 }}>{msg}</span>}
      </div>
    </>
  );
}
