import { storeCustomerUpload } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Génère un APERÇU de dessin (gratuit) à partir de la description du client,
// via un générateur d'images libre et sans clé. Le rendu est une inspiration :
// l'atelier réalise et valide le dessin final avant gravure.

// Petit garde-fou : refuse les demandes manifestement inappropriées.
const BANNED = ["porn", "porno", "nu ", "nue", "sexe", "sexuel", "nazi", "haine", "arme", "drogue", "sang"];

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const desc = (body?.prompt || "").toString().trim().slice(0, 300);
  if (!desc) return Response.json({ error: "Décrivez d'abord votre dessin." }, { status: 400 });
  const low = desc.toLowerCase();
  if (BANNED.some((w) => low.includes(w))) {
    return Response.json({ error: "Cette demande ne peut pas être traitée. Décrivez un motif (prénoms, date, fleurs, anneaux…)." }, { status: 400 });
  }

  // On guide le style vers un dessin GRAVABLE : trait noir net, fond blanc, sans couleur.
  const styled = `elegant black ink line art for laser engraving, clean thin black outlines, monochrome line drawing, white background, minimalist, no shading, no grayscale, decorative, ${desc}`;
  const seed = Math.floor(Math.random() * 1_000_000);
  const src = `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}?width=768&height=768&nologo=true&seed=${seed}`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25_000);
    const r = await fetch(src, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error("generation");
    const buf = Buffer.from(await r.arrayBuffer());
    const dataUrl = `data:${r.headers.get("content-type") || "image/jpeg"};base64,${buf.toString("base64")}`;
    // On stocke le dessin (persistant) pour le rattacher à la commande.
    const id = await storeCustomerUpload(dataUrl, { kind: "design", prompt: desc });
    if (id) return Response.json({ url: "/api/img/" + id });
    return Response.json({ url: src }); // pas de stockage : on renvoie le lien direct
  } catch {
    // Repli : le navigateur chargera l'image directement depuis le service.
    return Response.json({ url: src });
  }
}
