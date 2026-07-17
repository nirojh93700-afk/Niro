import { isAdmin, getSettings, setSettings, updateBoxtal } from "@/lib/stock";

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
  if (body.salesBanner && typeof body.salesBanner === "object") {
    patch.salesBanner = {
      enabled: Boolean(body.salesBanner.enabled),
      text: str(body.salesBanner.text, 120),
      start: str(body.salesBanner.start, 30),
      end: str(body.salesBanner.end, 30),
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
  if (body.shipping && typeof body.shipping === "object") {
    // Frais de livraison : montants en euros (2 décimales max). Un champ absent
    // ou invalide n'est pas stocké → le tarif par défaut du code s'applique.
    const price = (v, max = 1000) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : undefined;
    };
    const tiers = (arr) => {
      if (!Array.isArray(arr)) return undefined;
      const list = arr.slice(0, 8).map((t) => {
        const p = price(t?.price);
        if (p === undefined) return null;
        const q = Number(t?.maxQty);
        // maxQty null = « et plus » (dernier palier)
        return { maxQty: Number.isFinite(q) && q > 0 ? Math.min(Math.round(q), 999) : null, price: p };
      }).filter(Boolean);
      return list.length ? list : undefined;
    };
    const sh = {};
    const bijouxHome = price(body.shipping.bijouxHome);
    if (bijouxHome !== undefined) sh.bijouxHome = bijouxHome;
    const bijouxFreeThreshold = price(body.shipping.bijouxFreeThreshold, 10000);
    if (bijouxFreeThreshold !== undefined) sh.bijouxFreeThreshold = bijouxFreeThreshold;
    const decoTiers = tiers(body.shipping.decoTiers);
    if (decoTiers) sh.decoTiers = decoTiers;
    const glassTiers = tiers(body.shipping.glassTiers);
    if (glassTiers) sh.glassTiers = glassTiers;
    const pickupFee = price(body.shipping.pickupFee);
    if (pickupFee !== undefined) sh.pickupFee = pickupFee;
    patch.shipping = sh; // objet vide = retour aux tarifs d'origine
  }
  if (body.boxtal && typeof body.boxtal === "object") {
    // La clé secrète est fusionnée à part (jamais écrasée si non renvoyée).
    await updateBoxtal({
      enabled: body.boxtal.enabled,
      pointRelaisPrice: body.boxtal.pointRelaisPrice,
      appId: body.boxtal.appId,
      appSecret: body.boxtal.appSecret, // uniquement si non vide
    });
  }
  if (typeof body.metaPixelId === "string") patch.metaPixelId = /^[0-9]{0,30}$/.test(body.metaPixelId.trim()) ? body.metaPixelId.trim() : "";
  if (typeof body.gaId === "string") patch.gaId = /^[A-Za-z0-9-]{0,30}$/.test(body.gaId.trim()) ? body.gaId.trim() : "";
  if (body.welcome && typeof body.welcome === "object") {
    patch.welcome = {
      enabled: Boolean(body.welcome.enabled),
      code: str(body.welcome.code, 40).trim(),
      text: str(body.welcome.text, 160).trim(),
    };
  }
  if (body.salesGoal !== undefined) {
    const n = Number(body.salesGoal);
    patch.salesGoal = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  // Ventes hors site (Etsy, main propre, virement…) à ajouter au CA déclaré URSSAF.
  if (Array.isArray(body.ventesExternes)) {
    patch.ventesExternes = body.ventesExternes.slice(0, 240).map((v) => {
      const mois = /^\d{4}-\d{2}$/.test(String(v?.mois || "")) ? String(v.mois) : "";
      const montant = Number(v?.montant);
      if (!mois || !Number.isFinite(montant) || montant < 0) return null;
      return { id: str(v?.id, 40) || String(Math.random()).slice(2, 10), mois, montant: Math.round(montant * 100) / 100, source: str(v?.source, 40) };
    }).filter(Boolean);
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
  if (body.crmTags && typeof body.crmTags === "object") {
    const tags = {};
    let count = 0;
    for (const [k, v] of Object.entries(body.crmTags)) {
      if (count >= 500) break;
      if (Array.isArray(v) && v.length) {
        tags[String(k).slice(0, 120).toLowerCase()] = v.slice(0, 12).map((t) => String(t).slice(0, 24)).filter(Boolean);
        count++;
      }
    }
    patch.crmTags = tags;
  }
  if (body.maintenance && typeof body.maintenance === "object") {
    patch.maintenance = {
      enabled: Boolean(body.maintenance.enabled),
      message: str(body.maintenance.message, 300),
    };
  }
  if (body.agents && typeof body.agents === "object") {
    patch.agents = { emailAutoReply: Boolean(body.agents.emailAutoReply) };
  }
  if (body.social && typeof body.social === "object") {
    patch.social = {
      igUserId: str(body.social.igUserId, 60).trim(),
      igToken: str(body.social.igToken, 600).trim(),
    };
  }
  if (body.couvertsZones && typeof body.couvertsZones === "object") {
    const clamp = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
    const parseSet = (set) => {
      const z = {};
      if (set && typeof set === "object") {
        for (const k of ["couteau", "fourchette", "grande", "petite"]) {
          const p = set[k];
          if (p && typeof p === "object") {
            z[k] = {
              cx: clamp(p.cx, 0, 1, 0.5),
              nameCy: clamp(p.nameCy, 0, 1, 0.6),
              animalCy: clamp(p.animalCy, 0, 1, 0.80),
              animalH: clamp(p.animalH, 0.02, 0.40, 0.06),
              nameSize: clamp(p.nameSize, 0.01, 0.12, 0.035),
            };
            const aw = Number(p.animalW); if (Number.isFinite(aw)) z[k].animalW = Math.min(0.40, Math.max(0.02, aw));
            const nw = Number(p.nameW); if (Number.isFinite(nw)) z[k].nameW = Math.min(2, Math.max(0.4, nw));
          }
        }
      }
      return z;
    };
    patch.couvertsZones = { base: parseSet(body.couvertsZones.base), zoom: parseSet(body.couvertsZones.zoom) };
    // Méthode gros plan : un réglage PAR couvert (chacun ajustable).
    const hb = body.couvertsZones.handles;
    if (hb && typeof hb === "object") {
      const h = {};
      for (const k of ["couteau", "fourchette", "grande", "petite"]) {
        const p = hb[k];
        if (p && typeof p === "object") {
          h[k] = {
            cx: clamp(p.cx, 0, 1, 0.5),
            nameY: clamp(p.nameY, 0, 1, 0.47),
            animalY: clamp(p.animalY, 0, 1, 0.71),
            nameSize: clamp(p.nameSize, 0.03, 0.45, 0.17),
            animalH: clamp(p.animalH, 0.03, 0.5, 0.11),
          };
          const aw = Number(p.animalW); if (Number.isFinite(aw)) h[k].animalW = Math.min(0.9, Math.max(0.05, aw));
          const nw = Number(p.nameW); if (Number.isFinite(nw)) h[k].nameW = Math.min(2, Math.max(0.4, nw));
        }
      }
      patch.couvertsZones.handles = h;
    }
  }
  // Zones de gravure des cristaux (réglées dans /gestion/cristal-reglage) :
  // pour chaque produit, où placer la photo du client sur la vraie photo du cristal.
  if (body.crystalZones && typeof body.crystalZones === "object") {
    const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
    const out = {};
    for (const [slug, z] of Object.entries(body.crystalZones)) {
      if (!z || typeof z !== "object") continue;
      out[String(slug).slice(0, 80)] = {
        img: typeof z.img === "string" ? z.img.slice(0, 300) : "",
        left: num(z.left, 20), top: num(z.top, 40),
        width: num(z.width, 30), height: num(z.height, 30),
        rotation: Math.max(-45, Math.min(45, num(z.rotation, 0))),
        ry: Math.max(-60, Math.min(60, num(z.ry, 0))),
        rx: Math.max(-60, Math.min(60, num(z.rx, 0))),
        opacity: Math.max(0.2, Math.min(1, num(z.opacity, 0.72))),
        blend: ["screen", "normal", "luminosity", "multiply"].includes(z.blend) ? z.blend : "screen",
        bw: z.bw ? 1 : 0,
      };
    }
    patch.crystalZones = out;
  }

  // Emballages — interrupteur maître « visible sur le site ».
  if (typeof body.packagingLive === "boolean") patch.packagingLive = body.packagingLive;
  // Emballages — bibliothèque (Gestion → Packaging).
  if (Array.isArray(body.packaging)) {
    const price = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0; };
    const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    const seen = new Set();
    patch.packaging = body.packaging
      .filter((it) => it && typeof it === "object")
      .slice(0, 40)
      .map((it, i) => {
        let id = slugify(it.id) || slugify(it.name) || `emb-${i + 1}`;
        while (seen.has(id)) id = id + "-" + (i + 1);
        seen.add(id);
        return {
          id,
          name: String(it.name || "Emballage").slice(0, 60),
          desc: String(it.desc || "").slice(0, 120),
          buy: price(it.buy),
          sell: price(it.sell),
          weight: Math.max(0, Math.min(5000, Math.round(Number(it.weight) || 0))),
          photo: typeof it.photo === "string" ? it.photo.slice(0, 400) : "",
        };
      });
  }
  // Emballages — attribution par produit : { [slug]: { on, ids, free } }.
  if (body.productPackaging && typeof body.productPackaging === "object") {
    const out = {};
    for (const [slug, a] of Object.entries(body.productPackaging)) {
      if (!a || typeof a !== "object") continue;
      const ids = Array.isArray(a.ids) ? [...new Set(a.ids.map((x) => String(x).slice(0, 40)))].slice(0, 20) : [];
      const free = Array.isArray(a.free) ? a.free.map((x) => String(x).slice(0, 40)).filter((x) => ids.includes(x)) : [];
      out[String(slug).slice(0, 80)] = { on: a.on === true, ids, free };
    }
    patch.productPackaging = out;
  }

  const saved = await setSettings(patch);
  return Response.json({ ok: true, settings: saved });
}
