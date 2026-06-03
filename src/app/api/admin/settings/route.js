import { isAdmin, getSettings, setSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  return Response.json({ settings: await getSettings() });
}

export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const patch = {};
  if (typeof body.color === "string") {
    // n'accepte qu'un hex valide, ou vide pour réinitialiser
    patch.color = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color.trim()) ? body.color.trim() : "";
  }
  if (body.announce && typeof body.announce === "object") {
    patch.announce = {
      enabled: Boolean(body.announce.enabled),
      text: String(body.announce.text || "").slice(0, 160),
      link: String(body.announce.link || "").slice(0, 200),
    };
  }
  if (body.hero && typeof body.hero === "object") {
    const h = body.hero;
    patch.hero = {
      eyebrow: String(h.eyebrow || "").slice(0, 80),
      title: String(h.title || "").slice(0, 120),
      text: String(h.text || "").slice(0, 400),
      cta1: String(h.cta1 || "").slice(0, 40),
      cta2: String(h.cta2 || "").slice(0, 40),
    };
  }
  const saved = await setSettings(patch);
  return Response.json({ ok: true, settings: saved });
}
