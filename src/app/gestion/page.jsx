"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";

export default function GestionPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");

  const load = useCallback(async (adminKey) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-key": adminKey } });
      if (res.status === 401) throw new Error("Mot de passe incorrect.");
      if (!res.ok) throw new Error("Erreur de chargement.");
      const data = await res.json();
      setRows(data.rows);
      setAuthed(true);
      sessionStorage.setItem("niv-admin-key", adminKey);
    } catch (e) {
      setError(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) {
      setKey(saved);
      load(saved);
    }
  }, [load]);

  async function saveStock(variantId, value) {
    setSaved("");
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ variantId, stock: value === "" ? null : value }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setSaved(variantId);
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  function updateRow(variantId, value) {
    setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, stock: value } : r)));
  }

  if (!authed) {
    return (
      <div className="center-card">
        <h1>Espace gestion</h1>
        <p style={{ color: "var(--ink-soft)" }}>Réservé à Niv Création. Entrez votre mot de passe.</p>
        <div className="field" style={{ textAlign: "left", marginTop: 16 }}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(key)}
          />
        </div>
        {error && <div className="notice">{error}</div>}
        <button className="btn btn-gold" onClick={() => load(key)} disabled={loading}>
          {loading ? "Connexion…" : "Entrer"}
        </button>
      </div>
    );
  }

  // Regroupe par produit
  const grouped = rows.reduce((acc, r) => {
    (acc[r.productSlug] = acc[r.productSlug] || { name: r.productName, category: r.category, items: [] }).items.push(r);
    return acc;
  }, {});

  const lowOrOut = rows.filter((r) => typeof r.stock === "number" && r.stock <= 2).length;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="section-head" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Espace gestion</span>
          <h2>Mon stock</h2>
          <p>
            {rows.length} variantes · {lowOrOut} en stock bas ou épuisé. Laissez vide pour « non suivi ».
          </p>
        </div>

        {error && <div className="notice">{error}</div>}

        {Object.entries(grouped).map(([slug, g]) => (
          <div key={slug} className="admin-block">
            <h3>
              {g.name} <span className="admin-cat">{getCategoryLabel(g.category)}</span>
            </h3>
            {g.items.map((r) => (
              <div className="admin-row" key={r.variantId}>
                <span className="admin-variant">{r.variantTitle}</span>
                <span className="admin-price">{formatEuro(r.price)}</span>
                <input
                  className={`admin-stock ${typeof r.stock === "number" && r.stock === 0 ? "out" : ""}`}
                  type="number"
                  min="0"
                  placeholder="—"
                  value={r.stock ?? ""}
                  onChange={(e) => updateRow(r.variantId, e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={(e) => saveStock(r.variantId, e.target.value)}
                />
                <span className="admin-saved">{saved === r.variantId ? "✓ enregistré" : ""}</span>
              </div>
            ))}
          </div>
        ))}

        <p style={{ marginTop: 24, color: "var(--ink-soft)", fontSize: "0.85rem" }}>
          Le stock baisse automatiquement à chaque vente. Modifiez un nombre puis cliquez ailleurs pour enregistrer.
        </p>
      </div>
    </section>
  );
}
