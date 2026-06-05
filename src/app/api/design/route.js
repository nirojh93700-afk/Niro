import { storeCustomerUpload } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Génère un APERÇU de dessin gravable à partir de la description du client.
// - Si une clé Cloudflare Workers AI est configurée → service FIABLE (gratuit).
// - Sinon → repli sur un service libre sans clé (gratuit mais parfois saturé).
// Dans tous les cas, l'atelier valide / refait le dessin final avant gravure.

const BANNED = ["porn", "porno", "nue", "sexe", "sexuel", "nazi", "haine", "drogue"];

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const desc = (body?.prompt || "").toString().trim().slice(0, 300);
  if (!desc) return Response.json({ error: "Décrivez d'abord votre dessin." }, { status: 400 });
  const low = desc.toLowerCase();
  if (BANNED.some((w) => low.includes(w))) {
    return Response.json({ error: "Cette demande ne peut pas être traitée. Décrivez un motif (prénoms, date, fleurs, anneaux…)." }, { status: 400 });
  }

  const styled = `black ink line art for laser engraving, clean thin black outlines on white background, monochrome line drawing, minimalist, decorative, no shading, no grayscale, ${desc}`;

  // 1) Service fiable (Cloudflare Workers AI) si configuré.
  if (CF_ACCOUNT && CF_TOKEN) {
    try {
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: styled, steps: 6 }),
        }
      );
      const j = await r.json();
      const b64 = j?.result?.image;
      if (r.ok && b64) {
        const dataUrl = `data:image/jpeg;base64,${b64}`;
        const id = await storeCustomerUpload(dataUrl, { kind: "design", prompt: desc });
        return Response.json({ url: id ? "/api/img/" + id : dataUrl, provider: "cloudflare" });
      }
    } catch {
      // on retombe sur le service libre ci-dessous
    }
  }

  // 2) Repli gratuit sans clé (chargé directement par le navigateur).
  const seed = body?.seed ? Number(body.seed) : Math.floor(Math.random() * 1_000_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}?width=640&height=640&nologo=true&seed=${seed}`;
  return Response.json({ url, seed, provider: "free" });
}
