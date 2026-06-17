"use client";

// =============================================================================
// PAGE ÉTUDE DE MARCHÉ (réservée admin)
// Un agent (Claude + recherche web) compare TOUS les produits aux concurrents
// français : suis-je bien positionnée en prix ? Résultat affiché + téléchargeable.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const COLOR = (pos) => {
  const p = (pos || "").toLowerCase();
  if (p.includes("sous")) return "#d9ead3";   // opportunité (vert)
  if (p.includes("trop")) return "#f4cccc";    // trop cher (rouge)
  return "#efefef";                             // bien placé
};

export default function EtudeMarchePage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState("");
  const [source, setSource] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const auth = useCallback(async (adminKey) => {
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } });
      if (!res.ok) { setError("Mot de passe incorrect."); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      // recharge le dernier résultat enregistré localement
      try {
        const saved = JSON.parse(localStorage.getItem("niv-market-study") || "null");
        if (saved?.rows) { setRows(saved.rows); setDate(saved.date || ""); }
      } catch { /* ignore */ }
    } catch { setError("Erreur de connexion."); }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); auth(saved); }
  }, [auth]);

  async function run() {
    setRunning(true); setError("");
    try {
      const res = await fetch("/api/admin/market-study", {
        method: "POST",
        headers: { "x-admin-key": sessionStorage.getItem("niv-admin-key") || key },
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Échec de l'analyse."); setRunning(false); return; }
      if (!Array.isArray(data.rows) || !data.rows.length) { setError("Aucun résultat exploitable, réessaie."); setRunning(false); return; }
      setRows(data.rows); setDate(data.date || new Date().toISOString()); setSource(data.source || "");
      try { localStorage.setItem("niv-market-study", JSON.stringify({ rows: data.rows, date: data.date })); } catch { /* ignore */ }
    } catch (e) {
      setError("Erreur : " + (e?.message || e));
    }
    setRunning(false);
  }

  function downloadCSV() {
    const head = ["Catégorie", "Produit", "Prix Niv Création", "Marché bas", "Typique", "Marché haut", "Positionnement", "Recommandation"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [head.map(esc).join(";")];
    rows.forEach((r) => lines.push([r.categorie, r.produit, r.prix, r.bas, r.typique, r.haut, r.position, r.reco].map(esc).join(";")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `etude-marche-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Étude de marché</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Accès réservé.</p>
        <input type="password" placeholder="Mot de passe" value={key} onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && auth(key)}
          style={{ width: "100%", padding: 10, margin: "10px 0", border: "1px solid var(--line)", borderRadius: 8 }} />
        <button className="btn btn-gold" onClick={() => auth(key)} style={{ width: "100%" }}>Entrer</button>
        {error && <p style={{ color: "#b4452f", marginTop: 10 }}>{error}</p>}
        <p style={{ marginTop: 20 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link></p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "30px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: 0 }}>📊 Étude de marché</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", maxWidth: 720 }}>
        L'agent compare tous tes produits aux concurrents français (recherche web) et te dit si tu es bien positionnée en prix.
        L'analyse prend ~1 minute. <strong>Vert</strong> = tu peux monter le prix, <strong>rouge</strong> = tu es au-dessus du marché.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "14px 0" }}>
        <button className="btn btn-gold" onClick={run} disabled={running}>
          {running ? "Analyse en cours… (~1 min)" : "Lancer l'analyse du marché"}
        </button>
        {rows.length > 0 && <button className="btn btn-outline" onClick={downloadCSV}>⬇ Télécharger (CSV / Excel)</button>}
        {date && <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Dernière analyse : {new Date(date).toLocaleString("fr-FR")}</span>}
        {source && (
          <span style={{ fontSize: "0.8rem", fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: source === "tavily" ? "#d9ead3" : "#fff3cd", color: "#444" }}>
            Recherche : {source === "tavily" ? "Tavily (gratuit) ✓" : "Anthropic (payant)"}
          </span>
        )}
      </div>
      {error && <div className="notice">{error}</div>}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.85rem", minWidth: 760 }}>
            <thead>
              <tr style={{ background: "var(--gold-dark)", color: "#fff" }}>
                {["Catégorie", "Produit", "Ton prix", "Bas", "Typique", "Haut", "Position", "Reco"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "6px 10px", color: "var(--ink-soft)" }}>{r.categorie}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 600 }}>{r.produit}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 700 }}>{r.prix}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center" }}>{r.bas}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center" }}>{r.typique}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center" }}>{r.haut}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 600, background: COLOR(r.position) }}>{r.position}</td>
                  <td style={{ padding: "6px 10px" }}>{r.reco}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 16 }}>
        Note : l'analyse utilise la recherche web (petit coût par lancement). Lance-la quand tu veux — rien d'automatique.
        Pour une analyse automatique chaque semaine, dis-le-moi (il faut activer une tâche planifiée).
      </p>
    </div>
  );
}
