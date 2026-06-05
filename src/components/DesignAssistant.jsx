"use client";

import { useState } from "react";

// Assistant de création de dessin (gratuit) : le client décrit son idée,
// l'IA propose un aperçu gravable, chargé directement par le navigateur.
// L'atelier valide/refait le dessin final avant gravure.
export default function DesignAssistant({ prompt, value, onChange }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [err, setErr] = useState("");
  const [url, setUrl] = useState(value || "");

  async function generate() {
    if (!prompt || !prompt.trim()) {
      setErr("Décrivez d'abord votre idée dans la case au-dessus.");
      return;
    }
    setErr("");
    setStatus("loading");
    setUrl("");
    try {
      const res = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error || "La génération a échoué, réessayez.");
      setUrl(d.url); // l'image se charge via <img> ci-dessous (peut prendre 10-20 s)
    } catch (e) {
      setErr(e.message);
      setStatus("error");
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-outline" onClick={generate}
        disabled={status === "loading"} style={{ padding: "8px 16px" }}>
        {status === "loading" ? "Création de l'aperçu…" : url ? "↻ Régénérer un aperçu" : "✨ Générer un aperçu du dessin"}
      </button>

      {status === "loading" && (
        <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: 8 }}>
          Création du dessin en cours… (cela peut prendre 10 à 20 secondes)
        </p>
      )}

      {url && (
        <div style={{ marginTop: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Aperçu du dessin proposé"
            style={{ width: 200, height: 200, objectFit: "contain", border: "1px solid var(--line)", borderRadius: 10, background: "#fff", display: status === "done" ? "block" : "none" }}
            onLoad={() => { setStatus("done"); onChange(url); }}
            onError={() => { setStatus("error"); setErr("Le service gratuit est occupé en ce moment. Réessayez dans un instant."); }}
          />
          {status === "done" && (
            <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 4 }}>
              Aperçu retenu ✓ — l'atelier finalisera ce dessin avant gravure.
            </p>
          )}
        </div>
      )}

      {err && <p className="char-count" style={{ color: "#b4452f", textAlign: "left" }}>{err}</p>}
    </div>
  );
}
