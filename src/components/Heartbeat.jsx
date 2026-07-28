"use client";

import { useEffect } from "react";

// Ping discret au chargement : déclenche les tâches automatiques du site
// (messages programmés, règles auto, rappels de cagnotte, anniversaires) sans
// aucun planificateur externe. Throttlé côté serveur → n'exécute rien de plus
// s'il est appelé souvent. Fire-and-forget : n'affiche rien, ne bloque rien.
export default function Heartbeat() {
  useEffect(() => {
    const t = setTimeout(() => {
      try { fetch("/api/heartbeat", { cache: "no-store", keepalive: true }).catch(() => {}); } catch { /* ignore */ }
    }, 2500); // léger délai : ne gêne pas le chargement de la page
    return () => clearTimeout(t);
  }, []);
  return null;
}
