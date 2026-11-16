"use client";
import { useEffect } from "react";
import { estErreurDeVersion, rechargerUneFois, signalerErreur } from "@/lib/erreurPage";

export default function ErreurGlobale({ error }) {
  useEffect(() => {
    signalerErreur(error, "global");
    if (estErreurDeVersion(error)) rechargerUneFois();
  }, [error]);
  return (
    <html lang="fr">
      <body style={{ background: "#fbf7ee", color: "#1a1206", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>La page n'a pas pu s'afficher</h2>
          <p style={{ color: "#6b5e4a", marginBottom: 20 }}>Le problème a été signalé à l'atelier.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: "12px 20px", borderRadius: 999, border: 0, background: "#c9a24b", color: "#1a1206", fontWeight: 600 }}>Recharger la page</button>
          <p style={{ marginTop: 24, fontSize: 12, color: "#8a7d68", wordBreak: "break-word" }}>{String(error?.message || "").slice(0, 200)}</p>
        </div>
      </body>
    </html>
  );
}
