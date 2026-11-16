"use client";
import { useEffect } from "react";
import { estErreurDeVersion, rechargerUneFois, signalerErreur } from "@/lib/erreurPage";

export default function Erreur({ error, reset }) {
  useEffect(() => {
    signalerErreur(error, "page");
    if (estErreurDeVersion(error)) rechargerUneFois();
  }, [error]);
  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>La page n'a pas pu s'afficher</h2>
      <p style={{ color: "#6b5e4a", marginBottom: 20 }}>Le problème a été signalé à l'atelier.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: "12px 20px", borderRadius: 999, border: 0, background: "#c9a24b", color: "#1a1206", fontWeight: 600 }}>Recharger la page</button>
        <button type="button" onClick={() => reset()} style={{ padding: "12px 20px", borderRadius: 999, border: "1px solid #c9a24b", background: "transparent", color: "#1a1206" }}>Réessayer</button>
      </div>
      <p style={{ marginTop: 24, fontSize: 12, color: "#8a7d68", wordBreak: "break-word" }}>{String(error?.message || "").slice(0, 200)}</p>
    </div>
  );
}
