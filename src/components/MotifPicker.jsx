"use client";

import { MOTIFS, motifThumb } from "@/lib/motifs";

// Sélecteur de motif avec vignettes (le client voit le dessin de chaque motif).
export default function MotifPicker({ value, onChange }) {
  const opts = [{ value: "", label: "Aucun" }, ...MOTIFS];
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "6px 2px", WebkitOverflowScrolling: "touch" }}>
      {opts.map((m) => {
        const sel = value === m.value || (!value && m.value === "");
        return (
          <button
            type="button"
            key={m.value || "none"}
            onClick={() => onChange(m.value)}
            style={{
              flex: "0 0 auto", width: 66, padding: 6, cursor: "pointer", textAlign: "center",
              background: "#fff", borderRadius: 10,
              border: `2px solid ${sel ? "var(--gold, #c2a14e)" : "var(--line, #e4e0d8)"}`,
            }}
          >
            <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {m.value === "" ? (
                <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>Aucun</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={motifThumb(m)} alt={m.label} style={{ maxWidth: "100%", maxHeight: 46, objectFit: "contain" }} />
              )}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {m.value === "" ? "" : m.label.replace("Fleur — modèle ", "Fleur ")}
            </div>
          </button>
        );
      })}
    </div>
  );
}
