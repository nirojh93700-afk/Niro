import { getJobNote, setJobNote } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Reçoit le message d'une page qui a planté dans le navigateur et garde les
// 30 derniers (jobNotes.erreursNavigateur), pour trouver la cause. Public,
// limité, aucune donnée personnelle. Répond toujours 200.
let dernier = 0;
export async function POST(req) {
  try {
    const now = Date.now();
    if (now - dernier < 2000) return Response.json({ ok: true });
    dernier = now;
    const b = JSON.parse(await req.text());
    const clip = (v, n) => String(v || "").slice(0, n);
    const ligne = {
      at: now, message: clip(b.message, 500), nom: clip(b.nom, 80), pile: clip(b.pile, 1500),
      digest: clip(b.digest, 80), page: clip(b.page, 300), navigateur: clip(b.navigateur, 300), origine: clip(b.origine, 40),
    };
    const avant = (await getJobNote("erreursNavigateur", true))?.liste || [];
    await setJobNote("erreursNavigateur", { at: now, liste: [ligne, ...avant].slice(0, 30) });
  } catch { /* jamais bloquant */ }
  return Response.json({ ok: true });
}
