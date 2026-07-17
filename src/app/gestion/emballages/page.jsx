"use client";

import { useEffect, useMemo, useState } from "react";
import { products, getCategoryLabel } from "@/lib/products";
import PhotoUpload, { UPLOAD_AVAILABLE } from "@/components/PhotoUpload";

// =============================================================================
// Gestion → Packaging & emballages
// 1) Bibliothèque d'emballages (nom, photo, prix d'achat, prix de vente, marge).
// 2) Attribution par produit : on active, on coche les emballages, on marque
//    ceux offerts. Ça s'affiche tout seul sur la fiche produit (voir maquette).
// =============================================================================

function slugify(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

export default function EmballagesAdmin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [lib, setLib] = useState([]);              // bibliothèque d'emballages
  const [assign, setAssign] = useState({});        // { slug: { on, ids, free } }
  const [live, setLive] = useState(false);         // interrupteur maître (visible sur le site)
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("bijoux");

  const visibleProducts = useMemo(() => {
    return products
      .filter((p) => !p.hidden)
      .filter((p) => (cat === "tous" ? true : p.category === cat))
      .filter((p) => !q.trim() || (p.name + " " + p.title).toLowerCase().includes(q.trim().toLowerCase()));
  }, [q, cat]);

  const cats = useMemo(() => [...new Set(products.filter((p) => !p.hidden).map((p) => p.category))], []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (k) { setKey(k); load(k); }
  }, []);

  async function load(k) {
    setMsg("Chargement…");
    try {
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": k } });
      if (!res.ok) throw new Error("Mot de passe incorrect.");
      const { settings } = await res.json();
      setLib(Array.isArray(settings.packaging) ? settings.packaging : []);
      setAssign(settings.productPackaging && typeof settings.productPackaging === "object" ? settings.productPackaging : {});
      setLive(settings.packagingLive === true);
      setAuthed(true);
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
      setMsg("");
    } catch (e) { setMsg(e.message); }
  }

  async function save() {
    setMsg("Enregistrement…");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ packaging: lib, productPackaging: assign, packagingLive: live }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      const { settings } = await res.json();
      setLib(Array.isArray(settings.packaging) ? settings.packaging : lib);
      setAssign(settings.productPackaging || assign);
      setMsg("Enregistré ✓ — les fiches produit utilisent maintenant ces emballages.");
    } catch (e) { setMsg(e.message); }
  }

  // ---- Bibliothèque ----
  function addLib() {
    setLib((l) => [...l, { id: "emb-" + (l.length + 1) + "-" + slugify(Math.random().toString().slice(2, 7)), name: "", desc: "", buy: 0, sell: 0, weight: 0, photo: "" }]);
  }
  function setLibItem(i, patch) {
    setLib((l) => l.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  }
  function removeLib(i) {
    const it = lib[i];
    setLib((l) => l.filter((_, j) => j !== i));
    // retire l'emballage de toutes les attributions
    setAssign((a) => {
      const out = {};
      for (const [slug, v] of Object.entries(a)) {
        out[slug] = { ...v, ids: (v.ids || []).filter((x) => x !== it.id), free: (v.free || []).filter((x) => x !== it.id) };
      }
      return out;
    });
  }

  // ---- Attribution ----
  const getA = (slug) => assign[slug] || { on: false, ids: [], free: [] };
  function setA(slug, patch) { setAssign((a) => ({ ...a, [slug]: { ...getA(slug), ...patch } })); }
  function toggleOn(slug) { const a = getA(slug); setA(slug, { on: !a.on }); }
  function toggleId(slug, id) {
    const a = getA(slug);
    const has = a.ids.includes(id);
    const ids = has ? a.ids.filter((x) => x !== id) : [...a.ids, id];
    const free = has ? a.free.filter((x) => x !== id) : a.free;
    // Cocher un emballage active automatiquement le packaging du produit.
    setA(slug, { ids, free, on: ids.length > 0 ? true : a.on });
  }
  function toggleFree(slug, id) {
    const a = getA(slug);
    if (!a.ids.includes(id)) return;
    const free = a.free.includes(id) ? a.free.filter((x) => x !== id) : [...a.free, id];
    setA(slug, { free });
  }

  if (!authed) {
    return (
      <main className="container" style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontFamily: "Georgia, serif" }}>Packaging &amp; emballages</h1>
        <p style={{ color: "var(--ink-soft)" }}>Gérez vos emballages et attribuez-les aux produits.</p>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Mot de passe admin" onKeyDown={(e) => e.key === "Enter" && load(key)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        <button className="btn btn-gold" style={{ marginTop: 12 }} onClick={() => load(key)}>Ouvrir</button>
        {msg && <p style={{ color: "#b4452f" }}>{msg}</p>}
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 940, margin: "20px auto", padding: 16 }}>
      <h1 style={{ fontFamily: "Georgia, serif", marginBottom: 2 }}>Packaging &amp; emballages</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: ".92rem", marginTop: 0 }}>
        Créez vos emballages (photo + prix d'achat + prix de vente), puis cochez ceux qui vont avec chaque produit. Ils s'afficheront tout seuls sur la fiche.
      </p>

      {/* Interrupteur maître : tant qu'il est OFF, rien n'est visible sur le site. */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: live ? "#f2faf3" : "#fbf4e6", border: "1.5px solid " + (live ? "#cfe6d3" : "#e7d3a1"), borderRadius: 14, padding: "13px 16px", margin: "4px 0 8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block" }}>{live ? "✅ Packaging VISIBLE sur le site" : "🔒 Packaging masqué (invisible sur le site)"}</strong>
          <span style={{ color: "var(--ink-soft)", fontSize: ".82rem" }}>
            {live ? "Les clientes voient le choix d'emballage sur les fiches." : "Réglez vos emballages et photos tranquillement. Activez quand vous êtes prête."}
          </span>
        </div>
        <button onClick={() => setLive((v) => !v)} aria-label="Afficher sur le site"
          style={{ position: "relative", width: 52, height: 30, flex: "0 0 52px", borderRadius: 20, background: live ? "var(--gold)" : "#d6ccb8", border: 0, cursor: "pointer" }}>
          <span style={{ position: "absolute", top: 3, left: live ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: ".15s" }} />
        </button>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: ".8rem", margin: "0 0 6px" }}>
        Pensez à cliquer <b>💾 Enregistrer</b> en bas après vos changements (l'interrupteur aussi s'enregistre).
      </p>

      {/* ══ 1. BIBLIOTHÈQUE ══ */}
      <h2 style={{ color: "var(--gold-dark)", fontSize: "1.05rem", marginTop: 24 }}>📦 Mes emballages</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {lib.map((it, i) => {
          const marge = (Number(it.sell) || 0) - (Number(it.buy) || 0);
          return (
            <div key={it.id} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {it.photo
                  ? <img src={it.photo} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", flex: "0 0 54px" }} />
                  : <div style={{ width: 54, height: 54, borderRadius: 10, background: "var(--cream)", display: "grid", placeItems: "center", flex: "0 0 54px" }}>📦</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input value={it.name} onChange={(e) => setLibItem(i, { name: e.target.value })} placeholder="Nom (ex. Écrin beige)" style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 7, font: "inherit", fontWeight: 600, minWidth: 0 }} />
                  <input value={it.desc} onChange={(e) => setLibItem(i, { desc: e.target.value })} placeholder="Petite description" style={{ width: "100%", padding: "5px 8px", border: "1px solid var(--line)", borderRadius: 7, font: "inherit", fontSize: ".82rem", marginTop: 5, minWidth: 0 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>
                <label style={{ fontSize: ".68rem", color: "var(--ink-soft)" }}>Achat €
                  <input type="number" step="0.01" min="0" value={it.buy} onChange={(e) => setLibItem(i, { buy: e.target.value })} style={{ width: "100%", padding: "5px 6px", border: "1px solid var(--line)", borderRadius: 6, font: "inherit" }} /></label>
                <label style={{ fontSize: ".68rem", color: "var(--ink-soft)" }}>Vente €
                  <input type="number" step="0.01" min="0" value={it.sell} onChange={(e) => setLibItem(i, { sell: e.target.value })} style={{ width: "100%", padding: "5px 6px", border: "1px solid var(--line)", borderRadius: 6, font: "inherit" }} /></label>
                <label style={{ fontSize: ".68rem", color: "var(--ink-soft)" }}>Poids g
                  <input type="number" step="1" min="0" value={it.weight} onChange={(e) => setLibItem(i, { weight: e.target.value })} style={{ width: "100%", padding: "5px 6px", border: "1px solid var(--line)", borderRadius: 6, font: "inherit" }} /></label>
              </div>
              <div style={{ marginTop: 7, fontSize: ".8rem", fontWeight: 700, color: marge > 0 ? "#256b34" : "var(--ink-soft)" }}>
                {Number(it.sell) > 0 ? `Marge : ${marge >= 0 ? "+" : ""}${euro(marge)}` : `Offert — coût ${euro(it.buy)}`}
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {UPLOAD_AVAILABLE
                  ? <PhotoUpload value="" onUpload={(urls) => urls?.[0] && setLibItem(i, { photo: urls[0] })} />
                  : <input value={it.photo} onChange={(e) => setLibItem(i, { photo: e.target.value })} placeholder="URL photo" style={{ flex: 1, padding: "5px 7px", border: "1px solid var(--line)", borderRadius: 6, font: "inherit", fontSize: ".78rem", minWidth: 0 }} />}
                <button onClick={() => removeLib(i)} style={{ border: "1px solid #e6c9c0", background: "#fbf1ee", color: "#b4452f", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: ".8rem" }}>Retirer</button>
              </div>
            </div>
          );
        })}
        <button onClick={addLib} style={{ border: "1.5px dashed var(--gold)", borderRadius: 14, background: "#fffdf7", color: "var(--gold-dark)", fontWeight: 700, cursor: "pointer", minHeight: 150, font: "inherit" }}>＋ Ajouter un emballage</button>
      </div>

      {/* ══ 2. ATTRIBUTION ══ */}
      <h2 style={{ color: "var(--gold-dark)", fontSize: "1.05rem", marginTop: 30 }}>🏷️ Attribuer aux produits</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: ".85rem", marginTop: 0 }}>
        Activez le packaging du produit, cochez les emballages qui vont avec, et marquez « offert » ceux qui sont inclus (les autres seront payants au prix de vente).
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 14px", alignItems: "center" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" style={{ flex: 1, minWidth: 160, padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 9, font: "inherit" }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 9, font: "inherit" }}>
          <option value="tous">Toutes catégories</option>
          {cats.map((c) => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
        </select>
      </div>

      {lib.length === 0 && <p style={{ color: "#b4452f" }}>Ajoutez d'abord au moins un emballage ci-dessus.</p>}

      {visibleProducts.map((p) => {
        const a = getA(p.slug);
        return (
          <div key={p.slug} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", marginBottom: 11, opacity: a.on ? 1 : 0.62 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", flex: "0 0 44px" }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: ".95rem" }}>{p.name}</strong>
                <span style={{ color: "var(--ink-soft)", fontSize: ".78rem" }}>{a.on ? "Packaging activé" : "Packaging désactivé"} · {getCategoryLabel(p.category)}</span>
              </div>
              <button onClick={() => toggleOn(p.slug)} aria-label="Activer" style={{ position: "relative", width: 46, height: 26, flex: "0 0 46px", borderRadius: 20, background: a.on ? "var(--gold)" : "#d6ccb8", border: 0, cursor: "pointer" }}>
                <span style={{ position: "absolute", top: 3, left: a.on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: ".15s" }} />
              </button>
            </div>
            {lib.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {lib.map((it) => {
                  const on = a.ids.includes(it.id);
                  const free = a.free.includes(it.id);
                  return (
                    <span key={it.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1.5px solid " + (on ? "var(--gold)" : "var(--line)"), background: on ? "#fffaf0" : "#fff", borderRadius: 22, padding: "6px 10px", fontSize: ".82rem" }}>
                      <span onClick={() => toggleId(p.slug, it.id)} style={{ cursor: "pointer", userSelect: "none", color: on ? "var(--ink)" : "var(--ink-soft)" }}>
                        {on ? "✓ " : ""}{it.name || "(sans nom)"} <b>{free ? "offert" : (Number(it.sell) > 0 ? "+" + euro(it.sell) : "offert")}</b>
                      </span>
                      {on && (
                        <button onClick={() => toggleFree(p.slug, it.id)} title="Marquer offert / payant"
                          style={{ border: 0, cursor: "pointer", borderRadius: 12, padding: "1px 7px", fontSize: ".7rem", fontWeight: 700, background: free ? "#eaf5ec" : "#f0e6d0", color: free ? "#256b34" : "#8a6d1f" }}>
                          {free ? "offert" : "payant"}
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button className="btn btn-gold" onClick={save} style={{ boxShadow: "0 8px 22px rgba(194,161,78,.35)" }}>💾 Enregistrer</button>
      </div>
      {msg && <p style={{ textAlign: "right", color: msg.includes("✓") ? "#256b34" : "#b4452f", fontSize: ".88rem" }}>{msg}</p>}
    </main>
  );
}
