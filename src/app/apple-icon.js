import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône affichée quand on ajoute le site à l'écran d'accueil (iPhone).
export default function AppleIcon() {
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
        <div style={{ fontSize: 96, fontWeight: 800, color: "#a98935", lineHeight: 1 }}>NiV</div>
        <div style={{ fontSize: 22, letterSpacing: 6, color: "#a98935", marginTop: 6 }}>CRÉATION</div>
      </div>
    ),
    { ...size }
  );
}
