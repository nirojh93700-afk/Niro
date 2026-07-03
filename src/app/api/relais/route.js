import { getBoxtalCreds, getSettings, isAdmin } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Réseau point relais utilisé pour la carte du panier. Mondial Relay = le plus
// grand réseau en France (~11 000 points) et c'est la grille tarifaire sur
// laquelle est calculé le prix (donc jamais perdante). Code d'offre Boxtal.
const OFFER_CODE = "MONR-CpourToi";
const BASE = "https://api.boxtal.com/shipping/v3.2/parcel-point-by-shipping-offer";

// Récupère la première valeur non vide parmi plusieurs noms de champ possibles
// (l'API Boxtal peut nommer les champs différemment selon les versions).
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Transforme un point relais Boxtal (forme variable) en objet simple et stable
// pour l'affichage : code, nom, adresse, cp, ville, coordonnées, horaires.
function normalize(p) {
  const loc = p?.location || p?.address || p || {};
  const coord = p?.coordinates || p?.position || p?.geo || loc || {};
  const street = pick(loc, "street", "streetLine", "address", "line1");
  const streetStr = Array.isArray(street) ? street.filter(Boolean).join(" ") : street;
  const lat = Number(pick(coord, "latitude", "lat", "y"));
  const lng = Number(pick(coord, "longitude", "lng", "lon", "x"));
  return {
    code: String(pick(p, "code", "id", "parcelPointCode", "reference") || ""),
    name: String(pick(p, "name", "label", "networkName") || "Point relais"),
    street: String(streetStr || ""),
    zipCode: String(pick(loc, "zipCode", "postalCode", "zip", "cp") || ""),
    city: String(pick(loc, "city", "town", "ville") || ""),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

// Proxy PUBLIC : la cliente tape son code postal → on interroge Boxtal côté
// serveur (avec les clés stockées, JAMAIS exposées) et on renvoie la liste des
// points relais autour d'elle. En cas de souci, on renvoie une liste vide et un
// message : le panier bascule alors sur une saisie manuelle (rien ne casse).
export async function GET(req) {
  const url = new URL(req.url);
  const zip = String(url.searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
  const city = String(url.searchParams.get("city") || "").trim().slice(0, 60);
  const country = (String(url.searchParams.get("country") || "FR").toUpperCase().slice(0, 2)) || "FR";

  if (zip.length < 4) {
    return Response.json({ points: [], error: "Entrez un code postal valide." }, { status: 400 });
  }

  // L'option point relais doit être activée dans l'admin.
  const settings = await getSettings().catch(() => ({}));
  if (!settings?.boxtal?.enabled) {
    return Response.json({ points: [], error: "Le point relais n'est pas activé." }, { status: 400 });
  }

  const { appId, appSecret } = await getBoxtalCreds();
  if (!appId || !appSecret) {
    return Response.json({ points: [], error: "Point relais indisponible pour le moment." }, { status: 200 });
  }

  const qs = new URLSearchParams({
    shippingOfferCode: OFFER_CODE,
    type: "ARRIVAL",
    countryIsoCode: country,
    zipCode: zip,
  });
  if (city) qs.set("city", city);

  const auth = "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64");

  try {
    const r = await fetch(`${BASE}?${qs.toString()}`, {
      method: "GET",
      headers: { Authorization: auth, Accept: "application/json" },
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!r.ok) {
      const body = { points: [], error: "Aucun point relais trouvé pour ce code postal." };
      if (isAdmin(req)) body._debug = { status: r.status, body: text.slice(0, 800) };
      return Response.json(body, { status: 200 });
    }

    // La liste peut être renvoyée directement, ou sous une clé (parcelPoints…).
    const list = Array.isArray(data)
      ? data
      : (data?.parcelPoints || data?.points || data?.items || data?.content || data?.results || []);
    const points = (Array.isArray(list) ? list : []).map(normalize).filter((p) => p.code);

    const body = { points };
    if (isAdmin(req)) body._raw = Array.isArray(data) ? data.slice(0, 2) : data;
    return Response.json(body, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=120" },
    });
  } catch (e) {
    const body = { points: [], error: "Recherche momentanément indisponible." };
    if (isAdmin(req)) body._debug = { error: String(e).slice(0, 300) };
    return Response.json(body, { status: 200 });
  }
}
