"use client";

// =============================================================================
// PAGE INVENTAIRE & COMPTA (réservée admin) — connectée aux VRAIES données du site.
//  - Inventaire : stock actuel par produit (modifiable, alertes stock bas/épuisé).
//  - Compta : chiffre d'affaires (jour/mois/année), ventes, panier moyen, export.
// Tout est gratuit : utilise les commandes et les stocks déjà enregistrés.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function InventaireComptaPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState([]);       // stock par variante
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [edits, setEdits] = useState({});     // stockId -> valeur en cours d'édition

  const load = useCallback(async (adminKey) => {
    setLoading(true); setError("");
    try {
      const [pr, or] = await Promise.all([
        fetch("/api/admin/products", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } }),
      ]);
      if (!pr.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      const pd = await pr.json();
      setRows(pd.rows || []);
      if (or.ok) { const od = await or.json(); setOrders(od.orders || []); }
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); load(saved); }
  }, [load]);

  // --- Inventaire : une ligne par stock (couleur partagée recto/recto-verso) ---
  const byStock = {};
  for (const r of rows) {
    const id = r.stockId || r.variantId;
    if (!byStock[id]) byStock[id] = { id, name: r.productName, category: r.category, stock: r.stock, titles: [] };
    if (r.variantTitle) byStock[id].titles.push(r.variantTitle);
  }
  const inv = Object.values(byStock).sort((a, b) => a.name.localeCompare(b.name));
  const lowCount = inv.filter((i) => typeof i.stock === "number" && i.stock > 0 && i.stock <= 3).length;
  const outCount = inv.filter((i) => i.stock === 0).length;

  async function saveStock(id) {
    const val = edits[id];
    const n = val === "" || val == null ? null : Math.max(0, parseInt(val, 10) || 0);
    setSaving(id);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": sessionStorage.getItem("niv-admin-key") || key },
        body: JSON.stringify({ variantId: id, stock: n }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => ((r.stockId || r.variantId) === id ? { ...r, stock: n } : r)));
        setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
      } else setError("Échec de l'enregistrement du stock.");
    } catch { setError("Erreur réseau."); }
    setSaving("");
  }

  // --- Compta : à partir des vraies commandes (hors annulées/remboursées/test) ---
  const valid = orders.filter((o) => o.status !== "annulee" && o.status !== "remboursee" && !o.test);
  const now = new Date();
  const sameDay = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const sums = { day: 0, month: 0, year: 0, dayN: 0, monthN: 0, yearN: 0, total: 0 };
  for (const o of valid) {
    const t = Number(o.total) || 0;
    sums.total += t;
    const d = o.createdAt ? new Date(o.createdAt) : null;
    if (!d || isNaN(d)) continue;
    if (d.getFullYear() === now.getFullYear()) { sums.year += t; sums.yearN++; }
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) { sums.month += t; sums.monthN++; }
    if (sameDay(d)) { sums.day += t; sums.dayN++; }
  }
  const avg = valid.length ? sums.total / valid.length : 0;

  function exportCompta() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Date", "N° commande", "Client", "Total", "Statut"].map(esc).join(";")];
    valid.forEach((o) => lines.push([o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR") : "", o.ref || o.id, o.customerName || "", (Number(o.total) || 0).toFixed(2) + " €", o.status || ""].map(esc).join(";")));
    lines.push("");
    lines.push([esc("CA cette année"), esc(sums.year.toFixed(2) + " €")].join(";"));
    lines.push([esc("CA ce mois"), esc(sums.month.toFixed(2) + " €")].join(";"));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `compta-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Inventaire & Compta</h1>
        <input type="password" placeholder="Mot de passe" value={key} onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(key)}
          style={{ width: "100%", padding: 10, margin: "10px 0", border: "1px solid var(--line)", borderRadius: 8 }} />
        <button className="btn btn-gold" onClick={() => load(key)} style={{ width: "100%" }}>Entrer</button>
        {error && <p style={{ color: "#b4452f", marginTop: 10 }}>{error}</p>}
        <p style={{ marginTop: 20 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link></p>
      </div>
    );
  }

  const card = (label, val, sub) => (
    <div style={{ flex: "1 1 150px", background: "#faf6ee", border: "1px solid #ece3d2", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gold-dark)" }}>{val}</div>
      <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{label}{sub ? ` · ${sub}` : ""}</div>
    </div>
  );

  return (
    <div className="container" style={{ padding: "30px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: 0 }}>📦 Inventaire & Compta</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link>
      </div>
      {loading && <p>Chargement…</p>}
      {error && <div className="notice">{error}</div>}

      {/* ---------------- COMPTA ---------------- */}
      <h2 style={{ fontFamily: "Georgia,serif", color: "var(--ink)", marginTop: 18 }}>Compta — chiffre d'affaires</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: 0 }}>Calculé sur les vraies commandes (hors annulées, remboursées et tests).</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        {card("Aujourd'hui", euro(sums.day), `${sums.dayN} vente${sums.dayN > 1 ? "s" : ""}`)}
        {card("Ce mois", euro(sums.month), `${sums.monthN} vente${sums.monthN > 1 ? "s" : ""}`)}
        {card("Cette année", euro(sums.year), `${sums.yearN} vente${sums.yearN > 1 ? "s" : ""}`)}
        {card("Panier moyen", euro(avg))}
      </div>
      <button className="btn btn-outline" onClick={exportCompta} disabled={!valid.length} style={{ marginBottom: 8 }}>⬇ Exporter la compta (CSV / Excel)</button>

      {/* ---------------- INVENTAIRE ---------------- */}
      <h2 style={{ fontFamily: "Georgia,serif", color: "var(--ink)", marginTop: 26 }}>Inventaire — stocks</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: 0 }}>
        Modifie une quantité puis « Enregistrer ». Vide = stock non suivi (vendable sans compteur).
        {outCount > 0 && <span style={{ color: "#b4452f", fontWeight: 600 }}> · {outCount} épuisé{outCount > 1 ? "s" : ""}</span>}
        {lowCount > 0 && <span style={{ color: "#b8860b", fontWeight: 600 }}> · {lowCount} stock bas</span>}
      </p>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.85rem", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "var(--gold-dark)", color: "#fff" }}>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Produit</th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>Variante</th>
              <th style={{ padding: "8px 10px", textAlign: "center" }}>Stock</th>
              <th style={{ padding: "8px 10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {inv.map((i) => {
              const cur = edits[i.id] != null ? edits[i.id] : (i.stock == null ? "" : i.stock);
              const bg = i.stock === 0 ? "#fbeaea" : (typeof i.stock === "number" && i.stock <= 3 ? "#fdf6e3" : "transparent");
              return (
                <tr key={i.id} style={{ borderTop: "1px solid #eee", background: bg }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600 }}>{i.name}</td>
                  <td style={{ padding: "6px 10px", color: "var(--ink-soft)" }}>{[...new Set(i.titles)].join(" / ")}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center" }}>
                    <input type="number" min="0" value={cur} placeholder="∞"
                      onChange={(e) => setEdits((ed) => ({ ...ed, [i.id]: e.target.value }))}
                      style={{ width: 70, padding: "4px 6px", border: "1px solid var(--line)", borderRadius: 6, textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <button className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem" }}
                      disabled={saving === i.id || edits[i.id] == null} onClick={() => saveStock(i.id)}>
                      {saving === i.id ? "…" : "Enregistrer"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 14 }}>
        Tout est synchronisé avec ton site : le stock se décompte tout seul à chaque vente, et le CA se met à jour à chaque commande.
      </p>
    </div>
  );
}
