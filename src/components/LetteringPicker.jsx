"use client";

// Sélecteur visuel de "style d'écriture" (lettres découpées) — la cliente
// choisit parmi des photos de styles. options = [{ value, label, image }].
export default function LetteringPicker({ value, onChange, options = [] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
      {options.map((o) => {
        const sel = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: 6, cursor: "pointer", textAlign: "center", background: "#fff",
              borderRadius: 10, border: `2px solid ${sel ? "var(--gold, #c2a14e)" : "var(--line, #e4e0d8)"}`,
            }}
          >
            <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image} alt={o.label} loading="lazy" style={{ maxWidth: "100%", maxHeight: 56, objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</div>
          </button>
        );
      })}
    </div>
  );
}
