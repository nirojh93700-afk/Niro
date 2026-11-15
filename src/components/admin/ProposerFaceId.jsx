"use client";
// Petite carte « Entrer avec Face ID la prochaine fois ? » sur l'accueil de Gestion (15/11/2026).
// Seulement sur un appareil qui sait faire Face ID / empreinte, entré par mot de passe, et pas refusée.
import { useEffect, useState } from "react";
import { activerFaceId, faceIdActive, faceIdPossible, nomFaceId } from "@/lib/faceIdClient";
import { toast } from "@/components/admin/AdminToast";

export default function ProposerFaceId({ adminKey, onCle }) {
  const [voir, setVoir] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nom, setNom] = useState("Face ID");
  useEffect(() => {
    if (!adminKey || adminKey.startsWith("nvs_") || faceIdActive()) return;
    try { if (localStorage.getItem("niv-faceid-plus-tard") === "1") return; } catch { return; }
    const tactile = typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)")?.matches);
    if (!tactile) return;
    faceIdPossible().then((ok) => { if (ok) { setNom(nomFaceId()); setVoir(true); } });
  }, [adminKey]);
  if (!voir) return null;
  async function go() {
    setBusy(true);
    try {
      const k = await activerFaceId(adminKey);
      if (k) { sessionStorage.setItem("niv-admin-key", k); onCle?.(k); }
      toast(`${nom} activé : la prochaine fois, un toucher suffit.`, "ok");
      setVoir(false);
    } catch (e) { toast(e.message, "err"); }
    setBusy(false);
  }
  return (
    <div className="al-carte">
      <span className="al-ico" aria-hidden>🔐</span>
      <div className="al-txt"><b>Entrer avec {nom} la prochaine fois ?</b><small>Plus de mot de passe à taper sur ce téléphone. Le mot de passe reste en secours.</small></div>
      <div className="al-acts">
        <button type="button" className="dq-go" onClick={go} disabled={busy}>{busy ? "…" : "Activer"}</button>
        <button type="button" className="dq-mini" onClick={() => { setVoir(false); try { localStorage.setItem("niv-faceid-plus-tard", "1"); } catch { /* */ } }}>Plus tard</button>
      </div>
    </div>
  );
}
