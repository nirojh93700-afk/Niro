import { isAdmin, getBoxtalCreds } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Outil de DIAGNOSTIC (admin) pour trouver la bonne config de l'API Boxtal.
// Utilise les vraies clés stockées, tente une cotation, et renvoie le résultat
// BRUT pour qu'on voie exactement ce que Boxtal répond. La base et l'auth sont
// réglables par query (?base=... &auth=basic|header) pour tester sans redéployer.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const { appId, appSecret } = await getBoxtalCreds();
  if (!appId || !appSecret) return Response.json({ error: "Clés Boxtal manquantes." }, { status: 400 });

  const url = new URL(req.url);
  const base = url.searchParams.get("base") || "https://api.boxtal.com/api/v1/cotation";
  const auth = url.searchParams.get("auth") || "basic";

  // Cotation minimale : colis 0,5 kg, 95350 → 75001.
  const params = {
    "colis_0.poids": "0.5",
    "colis_0.longueur": "20",
    "colis_0.largeur": "15",
    "colis_0.hauteur": "8",
    "code_contenu": "10120",
    "expediteur.pays": "FR",
    "expediteur.code_postal": "95350",
    "expediteur.ville": "Saint-Brice-sous-Foret",
    "expediteur.type": "particulier",
    "destinataire.pays": "FR",
    "destinataire.code_postal": "75001",
    "destinataire.ville": "Paris",
    "destinataire.type": "particulier",
  };
  const body = new URLSearchParams(params).toString();

  const headers = { "Content-Type": "application/x-www-form-urlencoded", Accept: "*/*" };
  if (auth === "basic") {
    headers.Authorization = "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64");
  } else {
    headers["access_key"] = appId;
    headers["secret_key"] = appSecret;
  }

  try {
    const r = await fetch(base, { method: "POST", headers, body });
    const text = await r.text();
    return Response.json({
      base, auth, httpStatus: r.status,
      contentType: r.headers.get("content-type") || "",
      bodyStart: text.slice(0, 1800),
    });
  } catch (e) {
    return Response.json({ base, auth, error: String(e).slice(0, 300) });
  }
}
