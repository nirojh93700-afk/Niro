import { ImageResponse } from "next/og";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const LOGO = (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim();

// Icône générale (favicon / Android) : ton logo sur fond crème.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4efe2" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} width={244} height={244} style={{ objectFit: "contain" }} alt="" />
      </div>
    ),
    { ...size }
  );
}
