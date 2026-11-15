"use client";
// Bouton « Dossier de preuve (litige) » de la fiche commande (15/11/2026, maquette « Niv Admin »).
// Le PDF est fabriqué ici ; le gérant l'enregistre ou le partage, puis le joint lui-même au litige.
import { useState } from "react";
import { fabriquerPreuve, LIMITE_STRIPE } from "@/lib/dossierPreuve";

async function photoReduite(ref, dim, q) {
  const r = await fetch(`/api/img/${ref}`);
  if (!r.ok) throw new Error("photo");
  const url = URL.createObjectURL(await r.blob());
  try {
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const s = Math.min(1, dim / Math.max(img.width, img.height));
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    return { data: c.toDataURL("image/jpeg", q), w, h };
  } finally { URL.revokeObjectURL(url); }
}

export default function DossierPreuve({ o, adminKey, onClose }) {
  const [etat, setEtat] = useState("");
  const [fichier, setFichier] = useState(null);
  const [err, setErr] = useState("");
  const nom = `preuve-${o.ref || o.id}.pdf`;

  async function fabriquer() {
    setErr(""); setEtat("fabrication"); setFichier(null);
    try {
      const { jsPDF } = await import("jspdf");
      let messages = [];
      try {
        const r = await fetch(`/api/admin/bat?orderId=${encodeURIComponent(o.id)}`, { headers: { "x-admin-key": adminKey } });
        if (r.ok) messages = (await r.json())?.thread?.messages || [];
      } catch { /* sans échanges */ }
      const liste = (o.photosColis || []).slice(0, 9);
      let blob = null;
      for (const [dim, q] of [[1000, 0.72], [800, 0.62], [600, 0.55], [450, 0.5]]) {
        const photos = [];
        for (const p of liste) { try { photos.push({ ...p, ...(await photoReduite(p.ref, dim, q)) }); } catch { /* photo absente */ } }
        blob = fabriquerPreuve(jsPDF, { o, photos, messages }).output("blob");
        if (blob.size <= LIMITE_STRIPE * 0.95) break;
      }
      setFichier(new File([blob], nom, { type: "application/pdf" }));
      setEtat("pret");
    } catch (e) { setErr("Fabrication impossible : " + (e.message || "erreur")); setEtat(""); }
  }
  function enregistrer() {
    if (!fichier) return;
    const url = URL.createObjectURL(fichier);
    const a = document.createElement("a"); a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function partager() {
    try { await navigator.share({ files: [fichier], title: "Dossier de preuve" }); } catch (e) { if (e?.name !== "AbortError") setErr("Le partage n'a pas pu s'ouvrir : utilisez « Enregistrer le PDF »."); }
  }
  const nPhotos = (o.photosColis || []).length;
  const peutPartager = typeof navigator !== "undefined" && fichier && navigator.canShare?.({ files: [fichier] });
  return (
    <div className="fc-confirm" style={{ display: "grid", gap: 8 }}>
      <b>Dossier de preuve d&apos;expédition · #{o.ref || o.id}</b>
      <span style={{ fontSize: 13 }}>Un seul PDF avec la commande, l&apos;adresse, le suivi, {nPhotos ? `les ${nPhotos} photo${nPhotos > 1 ? "s" : ""} du colis` : "les photos du colis (aucune prise pour cette commande)"}, les échanges avec la cliente et les empreintes. Fait pour entrer dans les limites de Stripe (2 Mo). Rien ne part tout seul : vous le joignez vous-même au litige.</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="fc-btn sm pri" onClick={fabriquer} disabled={etat === "fabrication"}>{etat === "fabrication" ? "Fabrication…" : fichier ? "Refaire le dossier" : "Fabriquer le dossier de preuve"}</button>
        {fichier ? <button type="button" className="fc-btn sm" onClick={enregistrer}>Enregistrer le PDF</button> : null}
        {peutPartager ? <button type="button" className="fc-btn sm" onClick={partager}>Partager…</button> : null}
        <button type="button" className="fc-btn sm ghost" onClick={onClose}>Fermer</button>
      </div>
      {fichier ? <span style={{ fontSize: 12.5, color: "var(--ash-ok)" }}>Prêt : {nom} · {(fichier.size / 1024 / 1024).toFixed(2).replace(".", ",")} Mo{fichier.size > LIMITE_STRIPE ? " · ⚠️ plus de 2 Mo : Stripe le refusera" : ""}</span> : null}
      {err ? <span style={{ fontSize: 12.5, color: "var(--ash-bad)" }}>{err}</span> : null}
    </div>
  );
}
