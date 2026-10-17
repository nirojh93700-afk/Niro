import { ImageResponse } from "next/og";
import { LOGO_URL } from "@/lib/photosLocales";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-dynamic"; // évite de récupérer le logo au build

const LOGO = LOGO_URL;

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
