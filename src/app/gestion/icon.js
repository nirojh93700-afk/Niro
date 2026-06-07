import { ImageResponse } from "next/og";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default function GestionIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#2b2620" }}>
        <div style={{ fontSize: 126, fontWeight: 800, color: "#dcc88f", lineHeight: 1 }}>NiV</div>
        <div style={{ fontSize: 28, letterSpacing: 7, color: "#dcc88f", marginTop: 10 }}>GESTION</div>
      </div>
    ),
    { ...size }
  );
}
