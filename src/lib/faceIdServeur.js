// Face ID / clé d'accès (passkey) de Gestion — 15/11/2026, maquette « Niv Admin ».
// Le domaine (rpID) et l'origine sont lus dans la requête : une clé créée sur nivcreation.fr ne marche que là.
export function rpDe(req) {
  const hote = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "nivcreation.fr").split(",")[0].trim();
  const rpID = hote.replace(/:\d+$/, "");
  const local = rpID === "localhost" || rpID === "127.0.0.1";
  const proto = local ? (req.headers.get("x-forwarded-proto") || "http") : "https";
  return { rpID, origin: `${proto}://${hote}` };
}

export function nomAppareil(ua = "") {
  const u = String(ua);
  const quoi = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Téléphone Android"
    : /Macintosh/.test(u) ? "Mac" : /Windows/.test(u) ? "Ordinateur Windows" : "Appareil";
  const nav = /Edg\//.test(u) ? "Edge" : /CriOS|Chrome\//.test(u) ? "Chrome" : /FxiOS|Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "";
  return nav ? `${quoi} · ${nav}` : quoi;
}

// base64url <-> octets
export const versB64 = (u8) => Buffer.from(u8).toString("base64url");
export const depuisB64 = (s) => new Uint8Array(Buffer.from(String(s), "base64url"));

// Le défi est lu dans clientDataJSON (pour retrouver celui qu'on a donné).
export function defiDeReponse(response) {
  try {
    const cd = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf8"));
    return cd.challenge || "";
  } catch { return ""; }
}
