export const dynamic = "force-dynamic";

// Construit l'URL d'un APERÇU de dessin (gratuit, sans clé) à partir de la
// description du client. L'image est ensuite chargée DIRECTEMENT par le
// navigateur (le service la génère à la volée) — plus fiable que côté serveur.

const BANNED = ["porn", "porno", "nue", "sexe", "sexuel", "nazi", "haine", "drogue"];

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const desc = (body?.prompt || "").toString().trim().slice(0, 300);
  if (!desc) return Response.json({ error: "Décrivez d'abord votre dessin." }, { status: 400 });
  const low = desc.toLowerCase();
  if (BANNED.some((w) => low.includes(w))) {
    return Response.json({ error: "Cette demande ne peut pas être traitée. Décrivez un motif (prénoms, date, fleurs, anneaux…)." }, { status: 400 });
  }

  // Style guidé pour la gravure : trait noir net, fond blanc, sans couleur.
  const styled = `black ink line art for laser engraving, clean thin black outlines on white background, monochrome line drawing, minimalist, decorative, no shading, no grayscale, ${desc}`;
  const seed = body?.seed ? Number(body.seed) : Math.floor(Math.random() * 1_000_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}?width=640&height=640&nologo=true&seed=${seed}`;
  return Response.json({ url, seed });
}
