import { ImageResponse } from "next/og";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

// Icône générale (favicon / Android).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4efe2",
        }}
      >
        <div style={{ fontSize: 138, fontWeight: 800, color: "#a98935", lineHeight: 1 }}>NiV</div>
        <div style={{ fontSize: 30, letterSpacing: 8, color: "#a98935", marginTop: 8 }}>CRÉATION</div>
      </div>
    ),
    { ...size }
  );
}
