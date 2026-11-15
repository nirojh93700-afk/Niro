"use client";
// Bouton « Entrer avec Face ID » de l'écran de connexion de Gestion (15/11/2026, maquette Niv Admin).
// Ne s'affiche que sur un appareil où Face ID a été activé (Réglages › Appareils connectés).
import { useEffect, useState } from "react";
import { faceIdActive, faceIdPossible, entrerAvecFaceId, nomFaceId } from "@/lib/faceIdClient";

export default function EntreeFaceId({ onCle, onMotDePasse }) {
  const [pret, setPret] = useState(false);
  const [att, setAtt] = useState(false);
  const [err, setErr] = useState("");
  const [nom, setNom] = useState("Face ID");
  useEffect(() => {
    let vivant = true;
    if (!faceIdActive()) return undefined;
    faceIdPossible().then((ok) => { if (vivant && ok) { setPret(true); setNom(nomFaceId()); onMotDePasse?.(false); } });
    return () => { vivant = false; };
  }, [onMotDePasse]);
  if (!pret) return null;
  async function go() {
    setErr(""); setAtt(true);
    try { const cle = await entrerAvecFaceId(); onCle(cle); } catch (e) { setErr(e.message); setAtt(false); if (!faceIdActive()) setPret(false); }
  }
  return (
    <div className="fid-entree">
      <button type="button" className="btn btn-gold fid-big" onClick={go} disabled={att}>
        {att ? "Vérification…" : `Entrer avec ${nom}`}
      </button>
      {err && <div className="notice">{err}</div>}
      <button type="button" className="fid-lien" onClick={() => onMotDePasse?.(true)}>Utiliser le mot de passe</button>
    </div>
  );
}
