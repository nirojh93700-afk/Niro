import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-dynamic"; // évite de récupérer le logo au build

const LOGO = (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim();

// Icône d'écran d'accueil : ton logo centré sur fond crème.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4efe2" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} width={172} height={172} style={{ objectFit: "contain" }} alt="" />
      </div>
    ),
    { ...size }
  );
}
