"use client";

import { useState, useEffect } from "react";
import { formatEuro } from "@/lib/format";

// Configurateur de gravure du gobelet : le client choisit un CÔTÉ, un motif
// PRINCIPAL, puis d'autres motifs par ZONE (choisis par numéro dans le catalogue
// des planches). Compteur + supplément au-delà de `included` motifs.
// Le résultat (côté + motifs + nombre) remonte via onChange pour être enregistré
// sur la commande et facturé au paiement (recalcul serveur via motifCount).
const SIDES = [
  { key: "face", label: "Face" },
  { key: "gauche", label: "Côté gauche" },
  { key: "droite", label: "Côté droit" },
  { key: "tour", label: "Tout autour" },
];
const ZONES = [
  { key: "principal", label: "Principal (centre)" },
  { key: "haut", label: "Haut" },
  { key: "bas", label: "Bas" },
  { key: "gauche", label: "Gauche" },
  { key: "droite", label: "Droite" },
];

export default function GobeletComposer({ included = 4, extra = 2.9, maxNum = 79, onChange }) {
  const [side, setSide] = useState("face");
  const [motifs, setMotifs] = useState([]); // [{ zone, num }]
  const [zone, setZone] = useState("principal");
  const [num, setNum] = useState("");
  const [msg, setMsg] = useState("");

  const zoneLabel = (k) => ZONES.find((z) => z.key === k)?.label || k;
  const sideLabel = (k) => SIDES.find((s) => s.key === k)?.label || k;

  function addMotif() {
    setMsg("");
    const n = parseInt(num, 10);
    if (!(n >= 1 && n <= maxNum)) { setMsg(`Choisissez un numéro entre 1 et ${maxNum}.`); return; }
    if (motifs.some((m) => m.zone === zone)) { setMsg(`La zone « ${zoneLabel(zone)} » est déjà prise.`); return; }
    setMotifs((list) => [...list, { zone, num: n }]);
    setNum("");
    // zone suivante libre
    const next = ZONES.find((z) => !motifs.some((m) => m.zone === z.key) && z.key !== zone);
    if (next) setZone(next.key);
  }
  function remove(i) { setMotifs((list) => list.filter((_, k) => k !== i)); }

  const count = motifs.length;
  const extraCount = Math.max(0, count - included);
  const extraAmount = Math.round(extraCount * extra * 100) / 100;

  useEffect(() => {
    const ordered = ["principal", "haut", "bas", "gauche", "droite"]
      .map((z) => motifs.find((m) => m.zone === z)).filter(Boolean);
    const summary = ordered.length
      ? `${sideLabel(side)} — ` + ordered.map((m) => `${zoneLabel(m.zone)} n°${m.num}`).join(" · ")
      : "";
    onChange && onChange({ side, motifs, count, extraAmount, summary });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, motifs]);

  const zonesLibres = ZONES.filter((z) => !motifs.some((m) => m.zone === z.key));

  return (
    <div className="gc">
      <div className="gc-lbl">Emplacement de la gravure</div>
      <div className="gc-sides">
        {SIDES.map((s) => (
          <button type="button" key={s.key} className={`gc-side${side === s.key ? " on" : ""}`} onClick={() => setSide(s.key)}>{s.label}</button>
        ))}
      </div>

      <div className="gc-lbl">Vos motifs <span className="gc-c">{count} {count > included ? `(${included} inclus + ${extraCount})` : `/ ${included} inclus`}</span></div>

      {motifs.length === 0 && <p className="gc-empty">Ajoutez au moins un motif (le principal). Choisissez son numéro dans les planches.</p>}
      {motifs.map((m, i) => (
        <div key={i} className={`gc-mot${m.zone === "principal" ? " main" : ""}`}>
          <span className="gc-num">{m.num}</span>
          <span className="gc-mz">{zoneLabel(m.zone)}</span>
          <button type="button" className="gc-rm" onClick={() => remove(i)} aria-label="Retirer">×</button>
        </div>
      ))}

      {zonesLibres.length > 0 && (
        <div className="gc-add">
          <select value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zone">
            {zonesLibres.map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
          </select>
          <input type="number" min="1" max={maxNum} value={num} onChange={(e) => setNum(e.target.value)} placeholder={`N° (1–${maxNum})`} aria-label="Numéro du motif" />
          <button type="button" className="gc-addbtn" onClick={addMotif}>＋ Ajouter</button>
        </div>
      )}
      {msg && <p className="gc-msg">{msg}</p>}

      <div className="gc-price">
        {extraCount > 0
          ? <span><b>{extraCount} motif(s) en plus</b> : +{formatEuro(extraAmount)}</span>
          : <span className="gc-ok">✓ Jusqu'à {included} motifs inclus dans le prix</span>}
        <span className="gc-note">Au-delà de {included} : +{formatEuro(extra)} / motif</span>
      </div>
    </div>
  );
}
