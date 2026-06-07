"use client";

import { useState } from "react";

// Page d'accès. Deux usages :
//  • mode privé (défaut) : la boutique ouvre bientôt, entrez le code.
//  • mode maintenance : site momentanément hors-ligne ; l'administratrice
//    peut entrer en cliquant « Accès gestion » et en tapant le code.
export default function SiteGate({ maintenance = false, message = "" }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(!maintenance);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Code incorrect.");
      }
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #f7efe0, #fbf7ee)",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e7d3a1",
          borderRadius: 18,
          padding: "36px 28px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>{maintenance ? "🛠️" : "🔒"}</div>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px", color: "var(--gold-dark)" }}>
          Niv Création
        </h1>
        <p style={{ color: "var(--ink-soft)", marginTop: 0, marginBottom: 22, fontSize: "0.95rem" }}>
          {maintenance
            ? (message || "Notre site est momentanément en maintenance. Nous revenons très vite, merci de votre patience.")
            : "Notre boutique ouvre bientôt. Entrez votre code d'accès pour découvrir le site en avant-première."}
        </p>

        {maintenance && !showAdmin ? (
          <button type="button" className="link-underline" style={{ background: "none", border: 0, color: "var(--ink-soft)", cursor: "pointer", fontSize: "0.85rem" }} onClick={() => setShowAdmin(true)}>
            Accès gestion
          </button>
        ) : (
          <form onSubmit={submit}>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code d'accès"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid var(--line, #e4e0d8)",
                borderRadius: 10,
                fontSize: "1rem",
                textAlign: "center",
                marginBottom: 12,
              }}
            />
            {error && (
              <div style={{ color: "#b4452f", fontSize: "0.9rem", marginBottom: 12 }}>{error}</div>
            )}
            <button
              type="submit"
              className="btn btn-gold btn-block"
              disabled={loading || !code.trim()}
            >
              {loading ? "Vérification…" : "Entrer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
