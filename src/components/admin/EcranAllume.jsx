"use client";
// Garde l'écran du téléphone allumé pendant la préparation et la gravure (15/11/2026, maquette Niv Admin) :
// fiche commande et page Atelier. Réglage sur l'appareil (Réglages › Notifications, « niv-ecran-allume »).
// Le navigateur relâche le verrou quand la page passe en arrière-plan : on le reprend au retour.
import { useEffect } from "react";

export const CLE_ECRAN = "niv-ecran-allume";
export function ecranAllumeActif() {
  try { return localStorage.getItem(CLE_ECRAN) !== "0"; } catch { return true; }
}

export default function EcranAllume() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.wakeLock || !ecranAllumeActif()) return undefined;
    let verrou = null, fini = false;
    const prendre = async () => {
      if (fini || document.visibilityState !== "visible") return;
      try { verrou = await navigator.wakeLock.request("screen"); } catch { /* refusé : rien à faire */ }
    };
    const vis = () => { if (document.visibilityState === "visible" && (!verrou || verrou.released)) prendre(); };
    prendre();
    document.addEventListener("visibilitychange", vis);
    return () => { fini = true; document.removeEventListener("visibilitychange", vis); try { verrou?.release(); } catch { /* ignore */ } };
  }, []);
  return null;
}
