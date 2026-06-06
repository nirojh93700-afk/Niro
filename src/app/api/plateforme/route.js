// =============================================================================
// API Plateforme — renvoie la liste des clientes + les stats du tableau de bord
// =============================================================================
// Protégé par un mot de passe (en-tête x-platform-key). On accepte la variable
// PLATFORM_PASSWORD, ou à défaut ADMIN_PASSWORD (le mot de passe déjà utilisé
// pour /gestion), pour ne pas avoir à en configurer un nouveau au démarrage.
// =============================================================================

import { NextResponse } from "next/server";
import { clients, getStats } from "@/lib/plateforme";

export const dynamic = "force-dynamic";

function motDePasseAttendu() {
  return (process.env.PLATFORM_PASSWORD || process.env.ADMIN_PASSWORD || "").trim();
}

export async function GET(req) {
  const attendu = motDePasseAttendu();
  const fourni = (req.headers.get("x-platform-key") || "").trim();

  // Si aucun mot de passe n'est configuré, on autorise (mode démonstration locale).
  if (attendu && fourni !== attendu) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  return NextResponse.json({ clients, stats: getStats(clients) });
}
