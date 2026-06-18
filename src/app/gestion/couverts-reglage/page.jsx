"use client";

// =============================================================================
// RÉGLAGE COUVERTS (admin) — méthode gros plan. UN seul réglage (taille +
// position du prénom et de l'animal) appliqué à TOUS les couverts (même taille).
// Glisse les carrés sur le manche, ajuste la taille, Enregistre.
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

function Preview({ img, pos, prenom = "Ishaan" }) {
  const ref = useRef(null); const [w, setW] = useState(0);
  useEffect(() => { const el = ref.current; if (!el) return; const u = () => setW(el.clientWidth); u(); const ro = new ResizeObserver(u); ro.observe(el); return () => ro.disconnect(); }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", aspectRatio: "174 / 615", background: "#fff", borderRadius: 10, border: "1px solid var(--line)", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <span style={{ position: "absolute", left: `${pos.cx * 100}%`, top: `${pos.nameY * 100}%`, transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${pos.nameW ?? 1})`, transformOrigin: "center", fontSize: w ? `${pos.nameSize * w}px` : "20px", fontWeight: 700, color: "#3a2f1d", whiteSpace: "nowrap" }}>{prenom}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SAMPLE} alt="" style={{ position: "absolute", left: `${pos.cx * 100}%`, top: `${pos.animalY * 100}%`, transform: "translate(-50%,-50%)", height: `${pos.animalH * 100}%`, width: pos.animalW ? `${pos.animalW * 100}%` : "auto" }} />
    </div>
  );
}

export default function CouvertsReglagePage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [pos, setPos] = useState(DEF);
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
      if (s.couvertsZones?.handle) setPos({ ...DEF, ...s.couvertsZones.handle });
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => { const s = sessionStorage.getItem("niv-admin-key"); if (s) { setKey(s); load(s); } }, [load]);

  function onPointerDown(w, e) { e.preventDefault(); setWhich(w); drag.current = w; }
  function onPointerMove(e) {
    if (!drag.current || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const cx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const cy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setPos((p) => ({ ...p, cx, [drag.current === "name" ? "nameY" : "animalY"]: cy }));
  }
  function onPointerUp() { drag.current = null; }

  async function save() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ couvertsZones: { handle: pos } }) });
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

  return (
    <div className="container" style={{ padding: "24px 16px 60px", maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Réglage des couverts</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Gestion</Link>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>Glisse le carré <strong>« Prénom »</strong> et le carré <strong>animal</strong>, ajuste la taille. Ce réglage s'applique <strong>à tous les couverts</strong> (même taille partout).</p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Manche d'édition */}
        <div style={{ width: 180 }}>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textAlign: "center", margin: "0 0 4px" }}>Place ici</p>
          <div ref={boxRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            style={{ position: "relative", width: "100%", aspectRatio: "174 / 615", background: "#fff", borderRadius: 10, border: "1px solid var(--line)", overflow: "hidden", touchAction: "none", userSelect: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HANDLES[0].img} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
            <span onPointerDown={(e) => onPointerDown("name", e)} style={{ position: "absolute", left: `${pos.cx * 100}%`, top: `${pos.nameY * 100}%`, transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${pos.nameW ?? 1})`, transformOrigin: "center", fontSize: `${pos.nameSize * (boxRef.current?.clientWidth || 180)}px`, fontWeight: 700, color: "#3a2f1d", whiteSpace: "nowrap", cursor: "grab", padding: "2px 5px", borderRadius: 5, background: which === "name" ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)", border: which === "name" ? "2px solid #b0852f" : "1.5px solid #c9a24b" }}>Prénom</span>
            <div onPointerDown={(e) => onPointerDown("animal", e)} style={{ position: "absolute", left: `${pos.cx * 100}%`, top: `${pos.animalY * 100}%`, transform: "translate(-50%,-50%)", height: `${pos.animalH * 100}%`, width: pos.animalW ? `${pos.animalW * 100}%` : "auto", cursor: "grab", display: "flex", padding: 2, borderRadius: 6, background: which === "animal" ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)", border: which === "animal" ? "2px solid #b0852f" : "1.5px solid #c9a24b" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SAMPLE} alt="" draggable={false} style={{ height: "100%", width: pos.animalW ? "100%" : "auto", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {/* Curseurs */}
        <div className="admin-block" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button className={`filter-chip ${which === "name" ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setWhich("name")}>Prénom</button>
            <button className={`filter-chip ${which === "animal" ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setWhich("animal")}>Animal</button>
          </div>
          {which === "name" ? (
            <>
              <label style={{ fontSize: "0.85rem" }}>Taille du prénom</label>
              <input type="range" min="0.06" max="0.40" step="0.005" value={pos.nameSize} onChange={(e) => setPos((p) => ({ ...p, nameSize: Number(e.target.value) }))} style={{ width: "100%" }} />
              <label style={{ fontSize: "0.85rem" }}>Largeur du prénom</label>
              <input type="range" min="0.5" max="1.6" step="0.05" value={pos.nameW ?? 1} onChange={(e) => setPos((p) => ({ ...p, nameW: Number(e.target.value) }))} style={{ width: "100%" }} />
            </>
          ) : (
            <>
              <label style={{ fontSize: "0.85rem" }}>Taille de l'animal (hauteur)</label>
              <input type="range" min="0.05" max="0.40" step="0.005" value={pos.animalH} onChange={(e) => setPos((p) => ({ ...p, animalH: Number(e.target.value) }))} style={{ width: "100%" }} />
              <label style={{ fontSize: "0.85rem" }}>Largeur de l'animal</label>
              <input type="range" min="0.1" max="0.8" step="0.01" value={pos.animalW ?? 0.35} onChange={(e) => setPos((p) => ({ ...p, animalW: Number(e.target.value) }))} style={{ width: "100%" }} />
              <button className="filter-chip" style={{ padding: "2px 10px", marginTop: 6 }} onClick={() => setPos((p) => { const c = { ...p }; delete c.animalW; return c; })}>Largeur auto (proportions)</button>
            </>
          )}
          <p style={{ fontSize: "0.74rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>Astuce : glisse les carrés sur le manche pour la position.</p>
        </div>
      </div>

      {/* Aperçu sur les 4 couverts (même réglage partout) */}
      <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: "18px 0 6px" }}>Aperçu sur les 4 couverts</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        {HANDLES.map((h) => (
          <div key={h.key} style={{ flex: 1 }}>
            <Preview img={h.img} pos={pos} />
            <p style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--ink-soft)", margin: "3px 0 0" }}>{h.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        <button className="btn" onClick={() => setPos(DEF)} style={{ border: "1px solid var(--line)" }}>Réinitialiser</button>
        {msg ? <span style={{ fontSize: "0.85rem", color: msg.includes("✓") ? "#256b34" : "#b3261e" }}>{msg}</span> : null}
      </div>
    </div>
  );
}
