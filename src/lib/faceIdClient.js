// Face ID côté navigateur (15/11/2026). Le drapeau « niv-faceid » dit seulement que CET appareil a une clé ;
// la vraie vérification est faite par le serveur.
import { startAuthentication, startRegistration, browserSupportsWebAuthn, platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";

const DRAPEAU = "niv-faceid";
const lire = () => { try { return localStorage.getItem(DRAPEAU) === "1"; } catch { return false; } };
const ecrire = (v) => { try { v ? localStorage.setItem(DRAPEAU, "1") : localStorage.removeItem(DRAPEAU); } catch { /* stockage indisponible */ } };

export const faceIdActive = lire;
export const oublierFaceId = () => ecrire(false);

export function enApplication() {
  try { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; } catch { return false; }
}

export async function faceIdPossible() {
  try { return browserSupportsWebAuthn() && (await platformAuthenticatorIsAvailable()); } catch { return false; }
}

export const nomFaceId = () => {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /iPhone|iPad|Macintosh/.test(ua) ? "Face ID" : "l'empreinte ou le visage";
};

// Ouvre Gestion : renvoie la clé de session à mettre dans sessionStorage.
export async function entrerAvecFaceId() {
  const r = await fetch("/api/gestion-faceid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "options" }) });
  const d = await r.json().catch(() => ({}));
  if (d.aucun) { ecrire(false); throw new Error(d.error); }
  if (!r.ok) throw new Error(d.error || "Face ID indisponible pour le moment.");
  let response;
  try { response = await startAuthentication({ optionsJSON: d.options }); } catch (e) {
    throw new Error(e?.name === "NotAllowedError" ? "Face ID annulé. Touchez de nouveau le bouton, ou entrez avec le mot de passe." : (e?.message || "Face ID impossible."));
  }
  const v = await fetch("/api/gestion-faceid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verifier", response }) });
  const dv = await v.json().catch(() => ({}));
  if (!v.ok || !dv.key) { if (v.status === 401 && /retiré/.test(dv.error || "")) ecrire(false); throw new Error(dv.error || "Face ID refusé."); }
  return dv.key;
}

// Enregistre Face ID sur cet appareil (il faut être déjà entré). Renvoie la nouvelle clé de session.
export async function activerFaceId(cle) {
  const H = { "Content-Type": "application/json", "x-admin-key": cle };
  const r = await fetch("/api/admin/appareils", { method: "POST", headers: H, body: JSON.stringify({ action: "options" }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Impossible de préparer Face ID.");
  let response;
  try { response = await startRegistration({ optionsJSON: d.options }); } catch (e) {
    if (e?.name === "InvalidStateError") { ecrire(true); throw new Error("Face ID est déjà activé sur cet appareil."); }
    throw new Error(e?.name === "NotAllowedError" ? "Activation annulée." : (e?.message || "Activation impossible."));
  }
  const v = await fetch("/api/admin/appareils", { method: "POST", headers: H, body: JSON.stringify({ action: "inscrire", response, app: enApplication() }) });
  const dv = await v.json().catch(() => ({}));
  if (!v.ok) throw new Error(dv.error || "Activation impossible.");
  ecrire(true);
  return dv.key;
}
