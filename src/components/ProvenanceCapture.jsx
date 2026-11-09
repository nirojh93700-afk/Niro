"use client";

// Note d'où vient la visiteuse (Google, Instagram, TikTok, lien marqué…) dans SON navigateur,
// 30 jours (src/lib/provenance.js). N'affiche rien, ne bloque jamais rien.
import { useEffect } from "react";
import { releverProvenance } from "@/lib/provenance";

export default function ProvenanceCapture() {
  useEffect(() => {
    try { releverProvenance(); } catch { /* jamais bloquant */ }
  }, []);
  return null;
}
