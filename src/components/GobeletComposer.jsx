"use client";

import { useState, useEffect } from "react";
import { formatEuro } from "@/lib/format";

// Configurateur de gravure du gobelet : le client choisit un CÔTÉ, puis place
// des éléments par ZONE — soit un MOTIF (choisi par numéro dans les planches),
// soit un TEXTE (qu'il tape lui-même). Compteur + supplément au-delà de
// `included` éléments. Le résultat (côté + éléments + nombre) remonte via
// onChange pour l'aperçu (gobelet en bas à droite), l'enregistrement sur la
// commande et la facturation au paiement (recalcul serveur via motifCount).
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

export default function GobeletComposer({ included = 4, extra = 2.9, maxNum = 79, planches = [], onChange }) {
  const [side, setSide] = useState("face");
  const [motifs, setMotifs] = useState([]); // [{ zone, num }] ou [{ zone, text }]
  const [zone, setZone] = useState("principal");
  const [num, setNum] = useState("");
  const [txt, setTxt] = useState("");
  const [mode, setMode] = useState("motif"); // "motif" | "texte"
  const [msg, setMsg] = useState("");
  const [zoom, setZoom] = useState(null); // planche agrandie (aperçu)

  const zoneLabel = (k) => ZONES.find((z) => z.key === k)?.label || k;
  const sideLabel = (k) => SIDES.find((s) => s.key === k)?.label || k;

  function add() {
    setMsg("");
    if (motifs.some((m) => m.zone === zone)) { setMsg(`La zone « ${zoneLabel(zone)} » est déjà prise.`); return; }
    if (mode === "texte") {
      const t = txt.trim();
      if (!t) { setMsg("Écrivez le texte à graver."); return; }
      setMotifs((list) => [...list, { zone, text: t }]);
      setTxt("");
    } else {
      const n = parseInt(num, 10);
      if (!(n >= 1 && n <= maxNum)) { setMsg(`Choisissez un numéro entre 1 et ${maxNum}.`); return; }
      setMotifs((list) => [...list, { zone, num: n }]);
      setNum("");
    }
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
      ? `${sideLabel(side)} — ` + ordered.map((m) =>
          m.text != null ? `${zoneLabel(m.zone)} texte « ${m.text} »` : `${zoneLabel(m.zone)} n°${m.num}`
        ).join(" · ")
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

      <div className="gc-lbl">Votre gravure <span className="gc-c">{count} {count > included ? `(${included} inclus + ${extraCount})` : `/ ${included} inclus`}</span></div>

      {motifs.length === 0 && <p className="gc-empty">Ajoutez au moins un élément (motif ou texte). Choisissez le numéro d'un motif dans les planches, ou écrivez votre texte.</p>}
      {motifs.map((m, i) => (
        <div key={i} className={`gc-mot${m.zone === "principal" ? " main" : ""}`}>
          <span className={`gc-num${m.text != null ? " t" : ""}`}>{m.text != null ? "T" : m.num}</span>
          <span className="gc-mz">{zoneLabel(m.zone)}{m.text != null ? ` — « ${m.text} »` : ""}</span>
          <button type="button" className="gc-rm" onClick={() => remove(i)} aria-label="Retirer">×</button>
        </div>
      ))}

      {planches.length > 0 && (
        <div className="gc-cat">
          <div className="gc-cat-h">✦ Choisissez un motif — {maxNum} modèles <span>(touchez pour agrandir et lire les numéros)</span></div>
          <div className="gc-strip">
            {planches.map((src, i) => (
              <button type="button" key={i} className="gc-thumb" onClick={() => setZoom(src)} aria-label={`Agrandir la planche ${i + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Planche de motifs ${i + 1}`} loading="lazy" />
                <span className="gc-thumb-n">Planche {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {zonesLibres.length > 0 && (
        <div className="gc-addwrap">
          <div className="gc-modes">
            <button type="button" className={`gc-mode${mode === "motif" ? " on" : ""}`} onClick={() => { setMode("motif"); setMsg(""); }}>Un motif</button>
            <button type="button" className={`gc-mode${mode === "texte" ? " on" : ""}`} onClick={() => { setMode("texte"); setMsg(""); }}>Un texte</button>
          </div>
          <div className="gc-add">
            <select value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zone">
              {zonesLibres.map((z) => <option key={z.key} value={z.key}>{z.label}</option>)}
            </select>
            {mode === "texte" ? (
              <input type="text" maxLength={40} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Votre texte (prénom, date…)" aria-label="Texte à graver" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
            ) : (
              <input type="number" min="1" max={maxNum} value={num} onChange={(e) => setNum(e.target.value)} placeholder={`N° (1–${maxNum})`} aria-label="Numéro du motif" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
            )}
            <button type="button" className="gc-addbtn" onClick={add}>＋ Ajouter</button>
          </div>
        </div>
      )}
      {msg && <p className="gc-msg">{msg}</p>}

      <div className="gc-price">
        {extraCount > 0
          ? <span><b>{extraCount} élément(s) en plus</b> : +{formatEuro(extraAmount)}</span>
          : <span className="gc-ok">✓ Jusqu'à {included} éléments inclus dans le prix</span>}
        <span className="gc-note">Au-delà de {included} : +{formatEuro(extra)} / élément</span>
      </div>

      {zoom && (
        <div className="gc-zoom" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <div className="gc-zoom-in" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="gc-zoom-x" onClick={() => setZoom(null)} aria-label="Fermer">×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom} alt="Planche de motifs" />
          </div>
        </div>
      )}
    </div>
  );
}
