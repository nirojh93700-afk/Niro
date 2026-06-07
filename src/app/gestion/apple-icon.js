import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône du raccourci "Gestion" (admin) — fond foncé pour le distinguer de la boutique.
export default function GestionAppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#2b2620" }}>
        <div style={{ fontSize: 86, fontWeight: 800, color: "#dcc88f", lineHeight: 1 }}>NiV</div>
        <div style={{ fontSize: 20, letterSpacing: 5, color: "#dcc88f", marginTop: 8 }}>GESTION</div>
      </div>
    ),
    { ...size }
  );
}
