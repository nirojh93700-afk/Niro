"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// Sélecteur d'étoiles réutilisable (ajout + édition).
function StarPicker({ value, onChange }) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)}
          style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.5rem", lineHeight: 1, color: n <= value ? "#d8a93a" : "#ccc" }}
          aria-label={`${n} étoiles`}>★</button>
      ))}
    </div>
  );
}

// Formulaire d'AJOUT d'un avis (par produit) — publié directement.
function AddReviewForm({ adminKey, products, defaultSlug = "", onDone }) {
  const today = new Date().toISOString().slice(0, 10);
  const [slug, setSlug] = useState(defaultSlug);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [date, setDate] = useState(today);
  const [photo, setPhoto] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { setSlug(defaultSlug); }, [defaultSlug]);

  const sorted = useMemo(
    () => [...(products || [])].sort((a, b) => (a.name || a.slug || "").localeCompare(b.name || b.slug || "", "fr")),
    [products]
  );

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setMsg("");
    if (!slug) { setMsg("Choisissez un produit."); return; }
    if (text.trim().length < 2) { setMsg("Le texte de l'avis est vide."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "add", slug, name, rating, text, date, photo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setName(""); setText(""); setRating(5); setPhoto("");
        setMsg("✓ Avis ajouté et publié.");
        onDone();
      } else {
        setMsg(data.error || "Échec de l'ajout.");
      }
    } finally { setSending(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, background: "#fffdf9", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label className="admin-field" style={{ flex: "1 1 260px", minWidth: 0 }}>
          Produit *
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            <option value="">— Choisir un produit —</option>
            {sorted.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name || p.slug}</option>
            ))}
          </select>
        </label>
        <label className="admin-field" style={{ flex: "1 1 140px", minWidth: 0 }}>
          Prénom
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Sophie L." />
        </label>
        <label className="admin-field" style={{ flex: "0 1 150px", minWidth: 0 }}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Note</span>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Texte de l'avis…"
        style={{ width: "100%", minHeight: 80, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
      <label className="admin-field">
        Photo (URL, facultatif)
        <input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" />
      </label>
      {msg && <p style={{ margin: 0, fontSize: "0.85rem", color: msg.startsWith("✓") ? "#256b34" : "#b4452f" }}>{msg}</p>}
      <div>
        <button type="submit" className="btn btn-gold" style={{ padding: "7px 18px", fontSize: "0.9rem" }} disabled={sending}>
          {sending ? "Ajout…" : "➕ Ajouter l'avis"}
        </button>
      </div>
    </form>
  );
}

// Formulaire de modification d'un avis existant.
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
    } finally { setSending(false); }
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
      <StarPicker value={rating} onChange={setRating} />
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
  const [filterSlug, setFilterSlug] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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

  const countBySlug = {};
  reviews.forEach((r) => { countBySlug[r.slug] = (countBySlug[r.slug] || 0) + 1; });
  const slugsWithReviews = Object.keys(countBySlug)
    .sort((a, b) => (nameBySlug[a] || a).localeCompare(nameBySlug[b] || b, "fr"));

  const shown = filterSlug ? reviews.filter((r) => r.slug === filterSlug) : reviews;
  const pending = shown.filter((r) => !r.approved);
  const approved = shown.filter((r) => r.approved);

  // Stats d'en-tête
  const total = reviews.length;
  const avg = total ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : "—";
  const productsRated = slugsWithReviews.length;

  const Stat = ({ n, l }) => (
    <div style={{ background: "#fffdf9", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px", textAlign: "center", flex: "1 1 120px" }}>
      <div style={{ fontFamily: "var(--font-display),Georgia,serif", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
    </div>
  );

  const ReviewCard = ({ r, isPending }) => (
    <div className="admin-block" style={isPending ? undefined : { opacity: 0.92 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <strong>{r.name} <span style={{ color: "#d8a93a" }}>{"★".repeat(r.rating)}</span>
          {r.date ? <span style={{ color: "var(--ink-soft)", fontWeight: 400, fontSize: "0.8rem", marginLeft: 6 }}>{r.date.slice(0, 10)}</span> : null}
        </strong>
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
      {/* Stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat n={total} l="Avis au total" />
        <Stat n={`${avg}★`} l="Note moyenne" />
        <Stat n={approved.length} l="Publiés" />
        <Stat n={pending.length} l="À valider" />
        <Stat n={productsRated} l="Produits notés" />
      </div>

      {/* Ajouter un avis */}
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-gold" style={{ padding: "8px 18px" }} onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "✕ Fermer" : "➕ Ajouter un avis"}
        </button>
        {showAdd && (
          <div style={{ marginTop: 12 }}>
            <AddReviewForm adminKey={adminKey} products={products} defaultSlug={filterSlug} onDone={load} />
          </div>
        )}
      </div>

      <p style={{ color: "var(--ink-soft)", marginTop: 0, fontSize: "0.88rem" }}>
        Les avis déposés par les clientes apparaissent en « À valider ». Ceux que tu ajoutes toi-même sont publiés directement.
        Le bouton ✏️ Modifier permet de corriger un avis.
      </p>

      {/* Filtre par produit */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <label className="admin-field" style={{ flex: "0 1 340px", minWidth: 0 }}>
          Filtrer par produit
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
      {approved.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Aucun avis publié{filterSlug ? " pour ce produit" : ""}.</p>}
      {approved.map((r) => <ReviewCard key={r.id} r={r} isPending={false} />)}
    </>
  );
}
