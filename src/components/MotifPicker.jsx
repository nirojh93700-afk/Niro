"use client";

import { useState } from "react";
import { MOTIFS, motifThumb } from "@/lib/motifs";

// Sélecteur de motif avec vignettes. Au survol (ordinateur), aperçu agrandi près du curseur.
export default function MotifPicker({ value, onChange }) {
  const opts = [{ value: "", label: "Aucun" }, ...MOTIFS];
  const [hover, setHover] = useState(null); // { src, x, y }

  return (
    <>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "6px 2px", WebkitOverflowScrolling: "touch" }}>
        {opts.map((m) => {
          const sel = value === m.value || (!value && m.value === "");
          const src = m.value ? motifThumb(m) : null;
          return (
            <button
              type="button"
              key={m.value || "none"}
              onClick={() => onChange(m.value)}
              onMouseEnter={(e) => src && setHover({ src, x: e.clientX, y: e.clientY })}
              onMouseMove={(e) => src && setHover((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : { src, x: e.clientX, y: e.clientY }))}
              onMouseLeave={() => setHover(null)}
              style={{
                flex: "0 0 auto", width: 66, padding: 6, cursor: "pointer", textAlign: "center",
                background: "#fff", borderRadius: 10,
                border: `2px solid ${sel ? "var(--gold, #c2a14e)" : "var(--line, #e4e0d8)"}`,
              }}
            >
              <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={m.label} style={{ maxWidth: "100%", maxHeight: 46, objectFit: "contain" }} />
                ) : (
                  <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>Aucun</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.value === "" ? "" : m.label.replace("Fleur — modèle ", "Fleur ")}
              </div>
            </button>
          );
        })}
      </div>

      {hover && (
        <div
          style={{
            position: "fixed",
            left: Math.min(hover.x + 18, (typeof window !== "undefined" ? window.innerWidth : 9999) - 190),
            top: Math.max(12, hover.y - 90),
            width: 168, height: 168, background: "#fff",
            border: "1px solid #e7d3a1", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.18)",
            padding: 10, zIndex: 1000, pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hover.src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
    </>
  );
}
