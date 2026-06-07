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
  const ALLOWED_FONTS = ["", "playfair", "cinzel", "cinzel-deco", "montserrat", "great-vibes", "allura", "pacifico", "inter"];
  const str = (v, n) => String(v || "").slice(0, n);
  const patch = {};
  if (typeof body.color === "string") {
    patch.color = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(body.color.trim()) ? body.color.trim() : "";
  }
  if (typeof body.fontHeading === "string") patch.fontHeading = ALLOWED_FONTS.includes(body.fontHeading) ? body.fontHeading : "";
  if (typeof body.fontBody === "string") patch.fontBody = ALLOWED_FONTS.includes(body.fontBody) ? body.fontBody : "";
  if (body.announce && typeof body.announce === "object") {
    patch.announce = {
      enabled: Boolean(body.announce.enabled),
      text: str(body.announce.text, 160),
      link: str(body.announce.link, 200),
    };
  }
  if (body.hero && typeof body.hero === "object") {
    const h = body.hero;
    patch.hero = {
      eyebrow: str(h.eyebrow, 80), title: str(h.title, 120), text: str(h.text, 400),
      cta1: str(h.cta1, 40), cta2: str(h.cta2, 40), image: str(h.image, 400),
    };
  }
  if (Array.isArray(body.categories)) {
    patch.categories = body.categories.slice(0, 3).map((c) => ({
      label: str(c?.label, 60), sub: str(c?.sub, 100), image: str(c?.image, 400),
    }));
  }
  if (body.atelier && typeof body.atelier === "object") {
    const a = body.atelier;
    patch.atelier = {
      eyebrow: str(a.eyebrow, 60), title: str(a.title, 120),
      text1: str(a.text1, 500), text2: str(a.text2, 500), image: str(a.image, 400),
    };
  }
  if (body.sections && typeof body.sections === "object") {
    patch.sections = {
      categories: body.sections.categories !== false,
      trust: body.sections.trust !== false,
      featured: body.sections.featured !== false,
      atelier: body.sections.atelier !== false,
    };
  }
  if (typeof body.apropos === "string") patch.apropos = body.apropos.slice(0, 4000);
  if (body.access && typeof body.access === "object") {
    patch.access = {
      locked: Boolean(body.access.locked),
      code: str(body.access.code, 60).trim(),
    };
  }
  if (body.refMarkup !== undefined) {
    const n = Number(body.refMarkup);
    patch.refMarkup = Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 90) : 0;
  }
  if (typeof body.pickupZones === "string") patch.pickupZones = body.pickupZones.slice(0, 200);
  if (body.salesGoal !== undefined) {
    const n = Number(body.salesGoal);
    patch.salesGoal = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  if (body.crmNotes && typeof body.crmNotes === "object") {
    const notes = {};
    let count = 0;
    for (const [k, v] of Object.entries(body.crmNotes)) {
      if (count >= 500) break;
      if (typeof v === "string" && v.trim()) { notes[String(k).slice(0, 120).toLowerCase()] = v.slice(0, 1000); count++; }
    }
    patch.crmNotes = notes;
  }
  if (body.maintenance && typeof body.maintenance === "object") {
    patch.maintenance = {
      enabled: Boolean(body.maintenance.enabled),
      message: str(body.maintenance.message, 300),
    };
  }
  const saved = await setSettings(patch);
  return Response.json({ ok: true, settings: saved });
}
