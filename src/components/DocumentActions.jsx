"use client";

import { useState } from "react";

export default function DocumentActions({ id, type, status }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/quote-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setErr(data.error || "Erreur.");
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="doc-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
      {type === "devis" && status !== "paye" && (
        <button className="btn btn-gold" onClick={pay} disabled={loading}>
          {loading ? "Redirection…" : "Accepter et payer en ligne"}
        </button>
      )}
      {status === "paye" && (
        <span className="btn btn-outline" style={{ color: "#256b34", cursor: "default" }}>✓ Payé</span>
      )}
      <button className="btn btn-outline" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button>
      {err && <div className="notice" style={{ width: "100%" }}>{err}</div>}
    </div>
  );
}
