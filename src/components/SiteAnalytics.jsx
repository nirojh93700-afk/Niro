"use client";

// Compteur de visites intégré : enregistre UNE visite (session) par visiteur,
// uniquement sur le site public (jamais l'admin ni le suivi). Frugal : 1 seule
// écriture par session.
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackOnce } from "@/lib/track";

export default function SiteAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/gestion") || pathname.startsWith("/suivi")) return;
    trackOnce("session", "session");
  }, [pathname]);
  return null;
}
