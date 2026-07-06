import { getBoxtalCreds, getSettings, isAdmin } from "@/lib/stock";
import { RELAIS_CARRIERS } from "@/lib/shipping";

export const dynamic = "force-dynamic";

// Carte des points relais du panier. On interroge TOUS les transporteurs activés
// (Mondial Relay, Relais Colis, Colissimo point retrait, Chrono Shop2Shop, UPS…)
// via Boxtal et on fusionne les points : la cliente voit tout ce qui existe
// autour d'elle, tous transporteurs confondus, et choisit le plus proche.
const BASE = "https://api.boxtal.com/shipping/v3.2/parcel-point-by-shipping-offer";
const MAX_PER_CARRIER = 15; // pour ne pas alourdir la carte

// Récupère la première valeur non vide parmi plusieurs noms de champ possibles.
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Transforme un point relais Boxtal en objet simple et stable, en y ajoutant le
// transporteur (code + nom) pour l'affichage et le calcul du prix.
function normalize(raw, carrier) {
  const p = raw?.parcelPoint || raw || {};
  const loc = p.location || p.address || {};
  const pos = loc.position || p.coordinates || p.position || p.geo || {};
  const street = pick(loc, "street", "streetLine", "address", "line1");
  const streetStr = Array.isArray(street) ? street.filter(Boolean).join(" ") : street;
  const lat = Number(pick(pos, "latitude", "lat", "y"));
  const lng = Number(pick(pos, "longitude", "lng", "lon", "x"));
  return {
    code: String(pick(p, "code", "id", "parcelPointCode", "reference") || ""),
    name: String(pick(p, "name", "label", "networkName") || "Point relais"),
    street: String(streetStr || ""),
    zipCode: String(pick(loc, "postalCode", "zipCode", "zip", "cp") || ""),
    city: String(pick(loc, "city", "town", "ville") || ""),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    carrier: carrier.code,       // ex. "MONR"
    carrierName: carrier.name,   // ex. "Mondial Relay"
    offer: carrier.offer,        // code d'offre Boxtal (étiquette)
  };
}

// Interroge Boxtal pour UN transporteur. Essaie les valeurs plausibles de
// `operationType` jusqu'à obtenir une réponse (repli sûr : liste vide).
async function fetchCarrierPoints(carrier, { zip, city, country, auth, opCandidates, admin }) {
  const attempts = [];
  for (const op of opCandidates) {
    const qs = new URLSearchParams({
      shippingOfferCode: carrier.offer,
      operationType: op,
      countryIsoCode: country,
      zipCode: zip,
    });
    if (city) qs.set("city", city);

    let r, text, data;
    try {
      r = await fetch(`${BASE}?${qs.toString()}`, {
        method: "GET",
        headers: { Authorization: auth, Accept: "application/json" },
      });
      text = await r.text();
      try { data = JSON.parse(text); } catch { data = null; }
    } catch (e) {
      attempts.push({ carrier: carrier.code, op, error: String(e).slice(0, 160) });
      continue;
    }
    if (admin) attempts.push({ carrier: carrier.code, op, status: r.status, bodyStart: text.slice(0, 200) });
    if (!r.ok) continue;

    const list = Array.isArray(data)
      ? data
      : (data?.content || data?.parcelPoints || data?.points || data?.items || data?.results || data?.parcelPointList || []);
    const points = (Array.isArray(list) ? list : [])
      .map((raw) => normalize(raw, carrier))
      .filter((p) => p.code)
      .slice(0, MAX_PER_CARRIER);
    return { points, op, attempts };
  }
  return { points: [], op: null, attempts };
}

// Proxy PUBLIC : la cliente tape son code postal → on interroge Boxtal côté
// serveur (clés jamais exposées) pour TOUS les transporteurs, et on renvoie la
// liste fusionnée. En cas de souci : liste vide + message → saisie manuelle.
export async function GET(req) {
  const url = new URL(req.url);
  const zip = String(url.searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
  const city = String(url.searchParams.get("city") || "").trim().slice(0, 60);
  const country = (String(url.searchParams.get("country") || "FR").toUpperCase().slice(0, 2)) || "FR";

  if (zip.length < 4) {
    return Response.json({ points: [], error: "Entrez un code postal valide." }, { status: 400 });
  }

  const settings = await getSettings().catch(() => ({}));
  if (!settings?.boxtal?.enabled) {
    return Response.json({ points: [], error: "Le point relais n'est pas activé." }, { status: 400 });
  }

  const { appId, appSecret } = await getBoxtalCreds();
  if (!appId || !appSecret) {
    return Response.json({ points: [], error: "Point relais indisponible pour le moment." }, { status: 200 });
  }

  const auth = "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const admin = isAdmin(req);
  const opOverride = url.searchParams.get("op");
  const opCandidates = opOverride ? [opOverride] : ["ARRIVAL", "DELIVERY", "COLLECTION", "PICKUP"];

  // Transporteurs à interroger. L'admin peut restreindre à un seul (?carrier=MONR)
  // pour diagnostiquer. Sinon on interroge tous ceux de la liste, en parallèle.
  const only = String(url.searchParams.get("carrier") || "").toUpperCase();
  const carriers = only ? RELAIS_CARRIERS.filter((c) => c.code === only) : RELAIS_CARRIERS;

  const results = await Promise.all(
    carriers.map((c) => fetchCarrierPoints(c, { zip, city, country, auth, opCandidates, admin }))
  );

  // Fusion : on trie par distance si dispo (sinon on garde l'ordre par transporteur).
  const points = results.flatMap((r) => r.points);

  const body = { points };
  if (admin) body._debug = results.map((r, i) => ({ carrier: carriers[i]?.code, count: r.points.length, op: r.op, attempts: r.attempts }));
  if (!points.length && !admin) body.error = "Aucun point relais trouvé pour ce code postal.";
  return Response.json(body, { status: 200, headers: { "Cache-Control": "public, max-age=120" } });
}
