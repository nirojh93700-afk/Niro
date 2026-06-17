import { setStock } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ROUTE TEMPORAIRE (one-shot) — applique les stocks du fichier fourni par
// l'utilisatrice, mappés aux variantes RÉELLES du site (aucun nom changé).
// Protégée par un jeton à usage unique. À SUPPRIMER juste après exécution.
const TOKEN = "seed-niv-7f3a9c2e8b41d6a0";

// stockId du site -> quantité (depuis StockNivCreation.md).
// Doublons du fichier additionnés (cuir-tresse-dore 8+4=12 ; usb-cristal-4go 1+1=2).
// Ignorés (absents du site) : bracelet chaîne Noir, double anneau, rond rétro, socle LED, sous-verres ardoise.
const STOCK = {
  "empreinte-bebe-argente": 5,
  "empreinte-bebe-dore": 5,
  "bracelet-femme-acier-dore": 1,
  "bracelet-coeur-dore": 1,
  "papillon-argente": 4,
  "papillon-dore": 4,
  "papillon-noir": 5,
  "papillon-or-rose": 4,
  "chaine-acier-argente": 3,
  "cuir-tresse-argente": 7,
  "cuir-tresse-dore": 12,
  "cuir-tresse-noir": 8,
  "couple-coeur-or-rose": 1,
  "puzzle-argente": 11,
  "puzzle-or-rose": 12,
  "env-argent": 22,
  "env-dore": 13,
  "env-rose": 13,
  "geo-argente": 5,
  "geo-arc-en-ciel": 5,
  "geo-dore": 5,
  "geo-noir": 5,
  "geo-or-rose": 5,
  "med-bicolore-texte": 2,
  "med-argent-texte": 2,
  "medaillon-livre-argente": 12,
  "medaillon-livre-dore": 12,
  "medaillon-livre-bicolore": 12,
  "plaque-acier-noir": 5,
  "plaque-argente": 5,
  "plaque-argente-noir": 5,
  "plaque-dore": 5,
  "plaque-noir": 5,
  "usb-bois-4go": 3,
  "usb-cristal-4go": 2,
  "pyramide-cristal-50mm": 1,
  "trophee-cristal-14cm": 1,
  "piece-laiton": 9,
  "pc-cristal-coeur": 5,
  "pc-cristal-rectangle": 4,
  "porte-cles-cuir-marron": 10,
  "porte-cles-cuir-noir": 10,
};

export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== TOKEN) {
    return Response.json({ error: "Jeton invalide." }, { status: 401 });
  }
  const results = {};
  let ok = 0;
  for (const [id, qty] of Object.entries(STOCK)) {
    try {
      const map = await setStock(id, qty);
      results[id] = map[id] ?? qty;
      ok++;
    } catch (e) {
      results[id] = "ERREUR: " + (e?.message || e);
    }
  }
  return Response.json({ ok: true, applied: ok, total: Object.keys(STOCK).length, results });
}
