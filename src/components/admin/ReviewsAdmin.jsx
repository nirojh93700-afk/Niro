"use client";

import { useState, useEffect, useCallback } from "react";

export default function ReviewsAdmin({ adminKey, products = [] }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Les avis déposés par les clientes apparaissent ici. Ils ne sont visibles sur le site qu'après ta validation.
      </p>

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
