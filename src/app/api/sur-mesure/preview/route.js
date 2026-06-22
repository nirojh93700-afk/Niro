export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Construit un prompt riche à partir de la matière + l'idée de la cliente.
function buildPrompt(material, idea) {
  return `Custom laser-engraved object made of ${material}. Design described by the customer: ${idea}. `
    + `Show the engraving clearly on the ${material} surface, elegant handcrafted personalized gift, `
    + `realistic product photography, soft studio lighting, clean neutral background, high detail.`;
}

function freeUrl(prompt) {
  const seed = Math.floor(Math.random() * 100000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const material = String(b.material || "objet").slice(0, 40);
  const idea = String(b.idea || "").trim().slice(0, 600);
  if (!idea) return Response.json({ error: "Décris ton idée." }, { status: 400 });

  const prompt = buildPrompt(material, idea);

  // Moteur payant si une clé est configurée (OpenAI). Sinon, moteur gratuit.
  const key = process.env.OPENAI_API_KEY || process.env.IMAGE_API_KEY || "";
  if (!key) {
    return Response.json({ engine: "free", url: freeUrl(prompt) });
  }
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", quality: "low", n: 1 }),
    });
    const data = await res.json();
    if (!res.ok) {
      // en cas de souci côté payant, on retombe sur le gratuit (jamais bloquée)
      return Response.json({ engine: "free", url: freeUrl(prompt), note: data.error?.message || "" });
    }
    const b64 = data.data?.[0]?.b64_json;
    if (b64) return Response.json({ engine: "paid", url: `data:image/png;base64,${b64}` });
    if (data.data?.[0]?.url) return Response.json({ engine: "paid", url: data.data[0].url });
    return Response.json({ engine: "free", url: freeUrl(prompt) });
  } catch (e) {
    return Response.json({ engine: "free", url: freeUrl(prompt), note: e.message });
  }
}
