"use client";

import { useState, useEffect, useCallback } from "react";

// Formulaire d'ajout manuel : pour recopier un avis reçu ailleurs
// (Instagram, WhatsApp, e-mail…) — publié directement.
function AddReviewForm({ adminKey, products, onAdded }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setMsg("");
    if (!slug) { setMsg("Choisis le produit concerné."); return; }
    if (text.trim().length < 2) { setMsg("Écris le texte de l'avis."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "add", slug, name, rating, text, date }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("Avis publié ✓");
        setName(""); setText(""); setDate(""); setRating(5);
        onAdded();
      } else {
        setMsg(data.error || "Échec de l'ajout.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="admin-block" style={{ display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>➕ Ajouter un avis reçu ailleurs</h3>
      <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem" }}>
        Pour recopier un vrai retour cliente reçu par Instagram, WhatsApp ou e-mail
        (par exemple sur la livraison). Il est publié immédiatement.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label className="admin-field" style={{ flex: "1 1 220px", minWidth: 0 }}>
          Produit concerné
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            <option value="">— Choisir —</option>
            {(products || []).map((p) => <option key={p.slug} value={p.slug}>{p.name || p.slug}</option>)}
          </select>
        </label>
        <label className="admin-field" style={{ flex: "1 1 160px", minWidth: 0 }}>
          Prénom de la cliente
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marie" />
        </label>
        <label className="admin-field" style={{ flex: "0 1 160px", minWidth: 0 }}>
          Date (facultatif)
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}
            style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.5rem", color: n <= rating ? "#d8a93a" : "#ccc" }}
            aria-label={`${n} étoiles`}>★</button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Le texte de l'avis, tel que la cliente l'a écrit…"
        style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
      {msg && <p style={{ margin: 0, fontSize: "0.88rem", color: msg.endsWith("✓") ? "#256b34" : "#b4452f" }}>{msg}</p>}
      <button type="submit" className="btn btn-gold" style={{ justifySelf: "start" }} disabled={sending}>
        {sending ? "Ajout…" : "Publier cet avis"}
      </button>
    </form>
  );
}

export default function ReviewsAdmin({ adminKey, products = [] }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");
  const [cleaning, setCleaning] = useState(false);
  // Nom lisible du produit à partir de son identifiant (repli : l'identifiant).
  const nameBySlug = {};
  (products || []).forEach((p) => { if (p && p.slug) nameBySlug[p.slug] = p.name || p.slug; });
  const ProductTag = ({ slug }) => (
    <a href={`/produit/${slug}#avis`} target="_blank" rel="noreferrer" className="admin-cat" style={{ textDecoration: "none" }} title="Voir la fiche produit">
      {nameBySlug[slug] || slug}
    </a>
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setReviews((await res.json()).reviews || []);
    } finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  async function act(r, action) {
    if (action === "delete" && !window.confirm("Supprimer cet avis ?")) return;
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ slug: r.slug, id: r.id, action }),
    });
    load();
  }

  async function cleanDuplicates() {
    setCleaning(true);
    setInfo("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "dedupe" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInfo(data.removed > 0
          ? `🧹 ${data.removed} avis en double supprimé${data.removed > 1 ? "s" : ""} ✓`
          : "Aucun doublon trouvé — tout est propre ✓");
        load();
      } else {
        setInfo("Échec du nettoyage.");
      }
    } finally {
      setCleaning(false);
    }
  }

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Les avis déposés par les clientes apparaissent ici. Ils ne sont visibles sur le site qu'après ta validation.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button className="btn btn-outline" onClick={cleanDuplicates} disabled={cleaning}>
          {cleaning ? "Nettoyage…" : "🧹 Supprimer les doublons"}
        </button>
        {info && <span style={{ fontSize: "0.88rem", color: info.includes("Échec") ? "#b4452f" : "#256b34" }}>{info}</span>}
      </div>

      <AddReviewForm adminKey={adminKey} products={products} onAdded={load} />

      <h3>À valider ({pending.length})</h3>
      {pending.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Aucun avis en attente.</p>}
      {pending.map((r) => (
        <div key={r.id} className="admin-block">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{r.name} <span style={{ color: "#d8a93a" }}>{"★".repeat(r.rating)}</span></strong>
            <ProductTag slug={r.slug} />
          </div>
          <p style={{ whiteSpace: "pre-line", margin: "6px 0 10px" }}>{r.text}</p>
          {r.photo ? <img src={r.photo} alt="" style={{ maxWidth: 140, borderRadius: 8, marginBottom: 10, display: "block" }} /> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-gold" style={{ padding: "5px 14px", fontSize: "0.85rem" }} onClick={() => act(r, "approve")}>✓ Publier</button>
            <button className="btn btn-outline" style={{ padding: "5px 14px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => act(r, "delete")}>🗑 Supprimer</button>
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 24 }}>Publiés ({approved.length})</h3>
      {approved.map((r) => (
        <div key={r.id} className="admin-block" style={{ opacity: 0.85 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{r.name} <span style={{ color: "#d8a93a" }}>{"★".repeat(r.rating)}</span></strong>
            <ProductTag slug={r.slug} />
          </div>
          <p style={{ whiteSpace: "pre-line", margin: "6px 0 10px" }}>{r.text}</p>
          {r.photo ? <img src={r.photo} alt="" style={{ maxWidth: 140, borderRadius: 8, marginBottom: 10, display: "block" }} /> : null}
          <button className="btn btn-outline" style={{ padding: "5px 14px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => act(r, "delete")}>🗑 Retirer</button>
        </div>
      ))}
    </>
  );
}
