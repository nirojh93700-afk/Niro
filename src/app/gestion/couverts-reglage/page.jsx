"use client";

// =============================================================================
// RÉGLAGE COUVERTS (admin) — méthode gros plan, réglage PAR couvert.
// Choisis un couvert, glisse le prénom + l'animal, ajuste la taille. Bouton
// « Appliquer à tous » pour copier le même réglage partout. Enregistre.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const SAMPLE = "/animaux/savane/lion.png";
const HANDLES = [
  { key: "couteau", label: "Couteau", img: "/produits/couverts_manche_couteau.jpg" },
  { key: "fourchette", label: "Fourchette", img: "/produits/couverts_manche_fourchette.jpg" },
  { key: "grande", label: "Grande cuillère", img: "/produits/couverts_manche_grande.jpg" },
  { key: "petite", label: "Petite cuillère", img: "/produits/couverts_manche_petite.jpg" },
];
const DEF = { cx: 0.5, nameY: 0.47, animalY: 0.71, nameSize: 0.17, animalH: 0.11 };
const allDef = () => ({ couteau: { ...DEF }, fourchette: { ...DEF }, grande: { ...DEF }, petite: { ...DEF } });

function Preview({ img, pos }) {
  const ref = useRef(null); const [w, setW] = useState(0);
  useEffect(() => { const el = ref.current; if (!el) return; const u = () => setW(el.clientWidth); u(); const ro = new ResizeObserver(u); ro.observe(el); return () => ro.disconnect(); }, []);
  const z = { ...DEF, ...(pos || {}) };
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", aspectRatio: "174 / 615", background: "#fff", borderRadius: 10, border: "1px solid var(--line)", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <span style={{ position: "absolute", left: `${z.cx * 100}%`, top: `${z.nameY * 100}%`, transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${z.nameW ?? 1})`, transformOrigin: "center", fontSize: w ? `${z.nameSize * w}px` : "18px", fontWeight: 700, color: "#3a2f1d", whiteSpace: "nowrap" }}>Ishaan</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SAMPLE} alt="" style={{ position: "absolute", left: `${z.cx * 100}%`, top: `${z.animalY * 100}%`, transform: "translate(-50%,-50%)", height: `${z.animalH * 100}%`, width: z.animalW ? `${z.animalW * 100}%` : "auto" }} />
    </div>
  );
}

export default function CouvertsReglagePage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [zones, setZones] = useState(allDef());
  const [selPiece, setSelPiece] = useState("couteau");
  const [which, setWhich] = useState("name");
  const boxRef = useRef(null);
  const drag = useRef(null);

  const load = useCallback(async (adminKey) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
      if (!res.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      const s = (await res.json()).settings || {};
      const h = s.couvertsZones?.handles || {};
      setZones({
        couteau: { ...DEF, ...(h.couteau || {}) },
        fourchette: { ...DEF, ...(h.fourchette || {}) },
        grande: { ...DEF, ...(h.grande || {}) },
        petite: { ...DEF, ...(h.petite || {}) },
      });
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => { const s = sessionStorage.getItem("niv-admin-key"); if (s) { setKey(s); load(s); } }, [load]);

  const cur = zones[selPiece];
  const setCur = (patch) => setZones((z) => ({ ...z, [selPiece]: { ...z[selPiece], ...patch } }));

  function onPointerDown(w, e) { e.preventDefault(); setWhich(w); drag.current = w; }
  function onPointerMove(e) {
    if (!drag.current || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const cx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const cy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setCur({ cx, [drag.current === "name" ? "nameY" : "animalY"]: cy });
  }
  function onPointerUp() { drag.current = null; }
  function applyToAll() { setZones({ couteau: { ...cur }, fourchette: { ...cur }, grande: { ...cur }, petite: { ...cur } }); setMsg("Copié sur les 4 — pense à Enregistrer."); }

  async function save() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ couvertsZones: { handles: zones } }) });
      setMsg(res.ok ? "Enregistré ✓ (recharge la fiche)" : "Échec.");
    } catch { setMsg("Erreur réseau."); }
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "40px 16px" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Réglage des couverts</h1>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Mot de passe admin" onKeyDown={(e) => e.key === "Enter" && load(key)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        {error ? <p style={{ color: "#b3261e" }}>{error}</p> : null}
        <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={() => load(key)} disabled={loading}>Entrer</button>
        <p style={{ marginTop: 16 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour</Link></p>
      </div>
    );
  }

  const editImg = HANDLES.find((h) => h.key === selPiece).img;

  return (
    <div className="container" style={{ padding: "24px 16px 60px", maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Réglage des couverts</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Gestion</Link>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>Choisis un couvert, glisse le <strong>« Prénom »</strong> et l'<strong>animal</strong>, ajuste la taille. Tu peux régler <strong>chaque couvert</strong>, ou cliquer <strong>« Appliquer à tous »</strong>.</p>

      {/* Choix du couvert à régler */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {HANDLES.map((h) => (
          <button key={h.key} className={`filter-chip ${selPiece === h.key ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setSelPiece(h.key)}>{h.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: 180 }}>
          <div ref={boxRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            style={{ position: "relative", width: "100%", aspectRatio: "174 / 615", background: "#fff", borderRadius: 10, border: "1px solid var(--line)", overflow: "hidden", touchAction: "none", userSelect: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={editImg} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
            <span onPointerDown={(e) => onPointerDown("name", e)} style={{ position: "absolute", left: `${cur.cx * 100}%`, top: `${cur.nameY * 100}%`, transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${cur.nameW ?? 1})`, transformOrigin: "center", fontSize: `${cur.nameSize * (boxRef.current?.clientWidth || 180)}px`, fontWeight: 700, color: "#3a2f1d", whiteSpace: "nowrap", cursor: "grab", padding: "2px 5px", borderRadius: 5, background: which === "name" ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)", border: which === "name" ? "2px solid #b0852f" : "1.5px solid #c9a24b" }}>Prénom</span>
            <div onPointerDown={(e) => onPointerDown("animal", e)} style={{ position: "absolute", left: `${cur.cx * 100}%`, top: `${cur.animalY * 100}%`, transform: "translate(-50%,-50%)", height: `${cur.animalH * 100}%`, width: cur.animalW ? `${cur.animalW * 100}%` : "auto", cursor: "grab", display: "flex", padding: 2, borderRadius: 6, background: which === "animal" ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)", border: which === "animal" ? "2px solid #b0852f" : "1.5px solid #c9a24b" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SAMPLE} alt="" draggable={false} style={{ height: "100%", width: cur.animalW ? "100%" : "auto", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        <div className="admin-block" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button className={`filter-chip ${which === "name" ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setWhich("name")}>Prénom</button>
            <button className={`filter-chip ${which === "animal" ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setWhich("animal")}>Animal</button>
          </div>
          {which === "name" ? (
            <>
              <label style={{ fontSize: "0.85rem" }}>Taille du prénom</label>
              <input type="range" min="0.06" max="0.40" step="0.005" value={cur.nameSize} onChange={(e) => setCur({ nameSize: Number(e.target.value) })} style={{ width: "100%" }} />
              <label style={{ fontSize: "0.85rem" }}>Largeur du prénom</label>
              <input type="range" min="0.5" max="1.6" step="0.05" value={cur.nameW ?? 1} onChange={(e) => setCur({ nameW: Number(e.target.value) })} style={{ width: "100%" }} />
            </>
          ) : (
            <>
              <label style={{ fontSize: "0.85rem" }}>Taille de l'animal (hauteur)</label>
              <input type="range" min="0.05" max="0.40" step="0.005" value={cur.animalH} onChange={(e) => setCur({ animalH: Number(e.target.value) })} style={{ width: "100%" }} />
              <label style={{ fontSize: "0.85rem" }}>Largeur de l'animal</label>
              <input type="range" min="0.1" max="0.8" step="0.01" value={cur.animalW ?? 0.35} onChange={(e) => setCur({ animalW: Number(e.target.value) })} style={{ width: "100%" }} />
              <button className="filter-chip" style={{ padding: "2px 10px", marginTop: 6 }} onClick={() => setCur({ animalW: undefined })}>Largeur auto (proportions)</button>
            </>
          )}
          <button className="btn" style={{ border: "1px solid var(--gold)", marginTop: 12, width: "100%" }} onClick={applyToAll}>Appliquer ce réglage à tous les couverts</button>
        </div>
      </div>

      <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: "18px 0 6px" }}>Aperçu des 4 couverts</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        {HANDLES.map((h) => (
          <div key={h.key} style={{ flex: 1, opacity: selPiece === h.key ? 1 : 0.95 }}>
            <Preview img={h.img} pos={zones[h.key]} />
            <p style={{ textAlign: "center", fontSize: "0.7rem", color: selPiece === h.key ? "var(--gold-dark)" : "var(--ink-soft)", margin: "3px 0 0", fontWeight: selPiece === h.key ? 700 : 400 }}>{h.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        <button className="btn" onClick={() => setZones(allDef())} style={{ border: "1px solid var(--line)" }}>Tout réinitialiser</button>
        {msg ? <span style={{ fontSize: "0.85rem", color: msg.includes("✓") || msg.includes("Copié") ? "#256b34" : "#b3261e" }}>{msg}</span> : null}
      </div>
    </div>
  );
}
