"use client";

import { useState, useEffect, useCallback } from "react";

// Formulaire de modification d'un avis (retoucher un doublon, corriger une coquille).
function EditReviewForm({ adminKey, review, onDone, onCancel }) {
  const [name, setName] = useState(review.name || "");
  const [rating, setRating] = useState(review.rating || 5);
  const [text, setText] = useState(review.text || "");
  const [date, setDate] = useState((review.date || "").slice(0, 10));
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setMsg("");
    if (text.trim().length < 2) { setMsg("Le texte ne peut pas être vide."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "edit", slug: review.slug, id: review.id, name, rating, text, date }),
      });
      if (res.ok) onDone();
      else setMsg("Échec de la modification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 8, background: "#faf8f3", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label className="admin-field" style={{ flex: "1 1 150px", minWidth: 0 }}>
          Prénom
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="admin-field" style={{ flex: "0 1 150px", minWidth: 0 }}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}
            style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.4rem", color: n <= rating ? "#d8a93a" : "#ccc" }}
            aria-label={`${n} étoiles`}>★</button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", minHeight: 70, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
      {msg && <p style={{ margin: 0, fontSize: "0.85rem", color: "#b4452f" }}>{msg}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn btn-gold" style={{ padding: "5px 14px", fontSize: "0.85rem" }} disabled={sending}>
          {sending ? "Enregistrement…" : "💾 Enregistrer"}
        </button>
        <button type="button" className="btn btn-outline" style={{ padding: "5px 14px", fontSize: "0.85rem" }} onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

export default function ReviewsAdmin({ adminKey, products = [] }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState("");
  const [filterSlug, setFilterSlug] = useState(""); // "" = tous les produits
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

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;

  // Liste des produits qui ont des avis (avec compteur), pour le filtre.
  const countBySlug = {};
  reviews.forEach((r) => { countBySlug[r.slug] = (countBySlug[r.slug] || 0) + 1; });
  const slugsWithReviews = Object.keys(countBySlug)
    .sort((a, b) => (nameBySlug[a] || a).localeCompare(nameBySlug[b] || b, "fr"));

  const shown = filterSlug ? reviews.filter((r) => r.slug === filterSlug) : reviews;
  const pending = shown.filter((r) => !r.approved);
  const approved = shown.filter((r) => r.approved);

  const ReviewCard = ({ r, isPending }) => (
    <div className="admin-block" style={isPending ? undefined : { opacity: 0.9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong>{r.name} <span style={{ color: "#d8a93a" }}>{"★".repeat(r.rating)}</span></strong>
        <ProductTag slug={r.slug} />
      </div>
      {editId === r.id ? (
        <EditReviewForm adminKey={adminKey} review={r}
          onDone={() => { setEditId(""); load(); }} onCancel={() => setEditId("")} />
      ) : (
        <>
          <p style={{ whiteSpace: "pre-line", margin: "6px 0 10px" }}>{r.text}</p>
          {r.photo ? <img src={r.photo} alt="" style={{ maxWidth: 140, borderRadius: 8, marginBottom: 10, display: "block" }} /> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isPending && (
              <button className="btn btn-gold" style={{ padding: "5px 14px", fontSize: "0.85rem" }} onClick={() => act(r, "approve")}>✓ Publier</button>
            )}
            <button className="btn btn-outline" style={{ padding: "5px 14px", fontSize: "0.85rem" }} onClick={() => setEditId(r.id)}>✏️ Modifier</button>
            <button className="btn btn-outline" style={{ padding: "5px 14px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => act(r, "delete")}>
              {isPending ? "🗑 Supprimer" : "🗑 Retirer"}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Les avis déposés par les clientes apparaissent ici. Ils ne sont visibles sur le site qu'après ta validation.
        Le bouton ✏️ Modifier permet de retoucher un avis (par exemple reformuler un doublon).
      </p>

      {/* Filtre par produit */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <label className="admin-field" style={{ flex: "0 1 340px", minWidth: 0 }}>
          Trier par produit
          <select value={filterSlug} onChange={(e) => setFilterSlug(e.target.value)}>
            <option value="">Tous les produits ({reviews.length} avis)</option>
            {slugsWithReviews.map((s) => (
              <option key={s} value={s}>{nameBySlug[s] || s} ({countBySlug[s]})</option>
            ))}
          </select>
        </label>
        {filterSlug && (
          <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={() => setFilterSlug("")}>
            ✕ Tout afficher
          </button>
        )}
      </div>

      <h3>À valider ({pending.length})</h3>
      {pending.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Aucun avis en attente.</p>}
      {pending.map((r) => <ReviewCard key={r.id} r={r} isPending />)}

      <h3 style={{ marginTop: 24 }}>Publiés ({approved.length})</h3>
      {approved.map((r) => <ReviewCard key={r.id} r={r} isPending={false} />)}
    </>
  );
}
