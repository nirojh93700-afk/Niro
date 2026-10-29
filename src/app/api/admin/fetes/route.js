import { isAdmin, getSettings, setFetes, getStockMap, setStock } from "@/lib/stock";
import { FETES, prochaineFete, dateFr, configNoel, NOEL_STOCK_DEPART, NOEL_ETIQUETTE, FITS } from "@/lib/fetes";

export const dynamic = "force-dynamic";

// Gestion → Fêtes de l'année (29/10/2026, maquette 215micVgntigmyRFXsG49e).
// GET  → { fetes:[…], noel:{ on, images, produits, emballages, etiquette }, stock:{ id: n } }
// POST { action, … } → même réponse, relue FRAÎCHE. Chaque action ne touche QU'UNE clé (setFetes).
//   on        { fete, on }            allume / éteint une fête (Noël : pose le stock de départ s'il manque)
//   image     { n, masquee }          masque / remet une image de Noël
//   produit   { slug, on }            coche / décoche un produit gravé
//   emballage { id, prix?, poids?, fit?:{cat:bool}, masque? }
//   stock     { stockId, value }      quantité en stock d'un emballage de Noël (carte de stock du site)
async function etat(fresh = true) {
  const [s, stock] = await Promise.all([getSettings(fresh), getStockMap().catch(() => ({}))]);
  const fetes = FETES.map((f) => {
    const p = prochaineFete(f.k);
    return { ...f, on: s?.fetes?.[f.k]?.on === true, date: dateFr(p.date), alerte: dateFr(p.alerte), jours: p.jours, enAlerte: p.enAlerte };
  });
  const noel = configNoel(s);
  const ids = [...Object.keys(NOEL_STOCK_DEPART)];
  const st = {}; for (const id of ids) st[id] = typeof stock[id] === "number" ? stock[id] : null;
  return { fetes, noel: { ...noel, etiquette: NOEL_ETIQUETTE }, stock: st, fits: FITS };
}

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Non autorisé" }, { status: 401 });
  return Response.json(await etat(false));
}

const num = (x) => (Number.isFinite(Number(x)) ? Math.max(0, Math.round(Number(x) * 100) / 100) : null);

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Non autorisé" }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch {}
  const a = String(b.action || "");
  if (a === "on") {
    const k = String(b.fete || "");
    if (!FETES.some((f) => f.k === k)) return Response.json({ error: "Fête inconnue" }, { status: 400 });
    await setFetes((f) => ({ ...f, [k]: { ...(f[k] || {}), on: b.on === true, changeLe: Date.now() } }));
    // Première fois que Noël s'allume : le stock des emballages de Noël = les quantités reçues le 28/10.
    if (k === "noel" && b.on === true) {
      const map = await getStockMap().catch(() => ({}));
      for (const [id, n] of Object.entries(NOEL_STOCK_DEPART)) if (typeof map[id] !== "number") await setStock(id, n);
    }
  } else if (a === "image") {
    const n = parseInt(b.n, 10);
    if (!n) return Response.json({ error: "Image inconnue" }, { status: 400 });
    await setFetes((f) => { const no = f.noel || {}; return { ...f, noel: { ...no, images: { ...(no.images || {}), [n]: { masquee: b.masquee === true } } } }; });
  } else if (a === "produit") {
    const slug = String(b.slug || "");
    if (!slug) return Response.json({ error: "Produit inconnu" }, { status: 400 });
    await setFetes((f) => { const no = f.noel || {}; return { ...f, noel: { ...no, produits: { ...(no.produits || {}), [slug]: b.on === true } } }; });
  } else if (a === "emballage") {
    const id = String(b.id || "");
    if (!configNoel({}).emballages.some((e) => e.id === id)) return Response.json({ error: "Emballage inconnu" }, { status: 400 });
    await setFetes((f) => {
      const no = f.noel || {}; const cur = (no.emballages || {})[id] || {};
      const next = { ...cur };
      if (b.prix !== undefined && num(b.prix) !== null) next.prix = num(b.prix);
      if (b.poids !== undefined && num(b.poids) !== null) next.poids = Math.round(num(b.poids));
      if (b.masque !== undefined) next.masque = b.masque === true;
      if (b.fit && typeof b.fit === "object") {
        next.fit = { ...(cur.fit || {}) };
        for (const [k] of FITS) if (k in b.fit) next.fit[k] = b.fit[k] === true;
      }
      return { ...f, noel: { ...no, emballages: { ...(no.emballages || {}), [id]: next } } };
    });
  } else if (a === "stock") {
    const sid = String(b.stockId || "");
    if (!(sid in NOEL_STOCK_DEPART)) return Response.json({ error: "Stock inconnu" }, { status: 400 });
    await setStock(sid, Math.max(0, parseInt(b.value, 10) || 0));
  } else {
    return Response.json({ error: "Action inconnue" }, { status: 400 });
  }
  return Response.json(await etat(true));
}
