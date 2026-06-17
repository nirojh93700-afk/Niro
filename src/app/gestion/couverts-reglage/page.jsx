"use client";

// =============================================================================
// RÉGLAGE COUVERTS (admin) — place toi-même le prénom et l'animal sur chaque
// couvert. Glisse les carrés, ajuste la taille, Enregistre. Le site garde tes
// positions (lues par l'éditeur côté cliente).
// =============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const BASE = "/produits/couverts_enfants_4_face.jpg";
const SAMPLE = "/animaux/savane/lion.png";
const PIECES = [
  { key: "couteau", label: "Couteau" },
  { key: "fourchette", label: "Fourchette" },
  { key: "grande", label: "Grande cuillère" },
  { key: "petite", label: "Petite cuillère" },
];
const DEFAULTS = {
  couteau: { cx: 0.205, nameCy: 0.66, animalCy: 0.80, animalH: 0.065, nameSize: 0.04 },
  fourchette: { cx: 0.394, nameCy: 0.66, animalCy: 0.80, animalH: 0.065, nameSize: 0.04 },
  grande: { cx: 0.623, nameCy: 0.66, animalCy: 0.80, animalH: 0.065, nameSize: 0.04 },
  petite: { cx: 0.823, nameCy: 0.68, animalCy: 0.81, animalH: 0.06, nameSize: 0.04 },
};

export default function CouvertsReglagePage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [zones, setZones] = useState(DEFAULTS);
  const [sel, setSel] = useState({ piece: "couteau", which: "name" });
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
      const saved = s.couvertsZones || {};
      setZones({
        couteau: { ...DEFAULTS.couteau, ...(saved.couteau || {}) },
        fourchette: { ...DEFAULTS.fourchette, ...(saved.fourchette || {}) },
        grande: { ...DEFAULTS.grande, ...(saved.grande || {}) },
        petite: { ...DEFAULTS.petite, ...(saved.petite || {}) },
      });
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); load(saved); }
  }, [load]);

  function onPointerDown(piece, which, e) {
    e.preventDefault();
    setSel({ piece, which });
    drag.current = { piece, which };
  }
  function onPointerMove(e) {
    if (!drag.current || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const cx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const cy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const { piece, which } = drag.current;
    setZones((z) => ({ ...z, [piece]: { ...z[piece], cx, [which === "name" ? "nameCy" : "animalCy"]: cy } }));
  }
  function onPointerUp() { drag.current = null; }

  async function save() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ couvertsZones: zones }),
      });
      setMsg(res.ok ? "Enregistré ✓ (recharge la fiche produit pour voir)" : "Échec de l'enregistrement.");
    } catch { setMsg("Erreur réseau."); }
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "40px 16px" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Réglage des couverts</h1>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Mot de passe admin"
          onKeyDown={(e) => e.key === "Enter" && load(key)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        {error ? <p style={{ color: "#b3261e" }}>{error}</p> : null}
        <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={() => load(key)} disabled={loading}>Entrer</button>
        <p style={{ marginTop: 16 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour</Link></p>
      </div>
    );
  }

  const cur = zones[sel.piece];

  return (
    <div className="container" style={{ padding: "24px 16px 60px", maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Réglage des couverts</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Gestion</Link>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
        Glisse le carré <strong>« Prénom »</strong> et le carré <strong>animal</strong> sur chaque couvert. Ajuste la taille avec les curseurs, puis <strong>Enregistre</strong>.
      </p>

      <div
        ref={boxRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "#fff", borderRadius: 12, border: "1px solid var(--line)", touchAction: "none", userSelect: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BASE} alt="Couverts" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
        {PIECES.map((p) => {
          const z = zones[p.key];
          const selName = sel.piece === p.key && sel.which === "name";
          const selAn = sel.piece === p.key && sel.which === "animal";
          return (
            <div key={p.key}>
              <span
                onPointerDown={(e) => onPointerDown(p.key, "name", e)}
                style={{
                  position: "absolute", left: `${z.cx * 100}%`, top: `${z.nameCy * 100}%`,
                  transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${z.nameW ?? 1})`, transformOrigin: "center",
                  fontSize: `${z.nameSize * (boxRef.current?.clientWidth || 440)}px`, fontWeight: 700, color: "#3a2f1d",
                  whiteSpace: "nowrap", cursor: "grab", padding: "3px 6px", borderRadius: 5,
                  background: selName ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)",
                  border: selName ? "2px solid #b0852f" : "1.5px solid #c9a24b",
                }}
              >Prénom</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div
                onPointerDown={(e) => onPointerDown(p.key, "animal", e)}
                style={{
                  position: "absolute", left: `${z.cx * 100}%`, top: `${z.animalCy * 100}%`,
                  height: `${z.animalH * 100}%`, width: z.animalW ? `${z.animalW * 100}%` : "auto",
                  transform: "translate(-50%,-50%)", cursor: "grab",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 3, borderRadius: 6,
                  background: selAn ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)",
                  border: selAn ? "2px solid #b0852f" : "1.5px solid #c9a24b",
                }}
              >
                <img src={SAMPLE} alt="animal" draggable={false} style={{ height: "100%", width: z.animalW ? "100%" : "auto", pointerEvents: "none" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sélection pièce + curseurs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0 8px" }}>
        {PIECES.map((p) => (
          <button key={p.key} className={`filter-chip ${sel.piece === p.key ? "active" : ""}`} style={{ padding: "4px 12px" }}
            onClick={() => setSel({ piece: p.key, which: sel.which })}>{p.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button className={`filter-chip ${sel.which === "name" ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setSel({ ...sel, which: "name" })}>Prénom</button>
        <button className={`filter-chip ${sel.which === "animal" ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setSel({ ...sel, which: "animal" })}>Animal</button>
      </div>

      <div className="admin-block">
        <strong>{PIECES.find((p) => p.key === sel.piece)?.label} — {sel.which === "name" ? "Prénom" : "Animal"}</strong>
        {sel.which === "name" ? (
          <>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: "0.85rem" }}>Hauteur (taille du texte)</label>
              <input type="range" min="0.02" max="0.10" step="0.002" value={cur.nameSize}
                onChange={(e) => setZones((z) => ({ ...z, [sel.piece]: { ...z[sel.piece], nameSize: Number(e.target.value) } }))}
                style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: "0.85rem" }}>Largeur</label>
              <input type="range" min="0.5" max="1.6" step="0.05" value={cur.nameW ?? 1}
                onChange={(e) => setZones((z) => ({ ...z, [sel.piece]: { ...z[sel.piece], nameW: Number(e.target.value) } }))}
                style={{ width: "100%" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: "0.85rem" }}>Hauteur</label>
              <input type="range" min="0.03" max="0.20" step="0.005" value={cur.animalH}
                onChange={(e) => setZones((z) => ({ ...z, [sel.piece]: { ...z[sel.piece], animalH: Number(e.target.value) } }))}
                style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: "0.85rem" }}>Largeur</label>
              <input type="range" min="0.03" max="0.22" step="0.005" value={cur.animalW ?? cur.animalH}
                onChange={(e) => setZones((z) => ({ ...z, [sel.piece]: { ...z[sel.piece], animalW: Number(e.target.value) } }))}
                style={{ width: "100%" }} />
              <button className="filter-chip" style={{ padding: "2px 10px", marginTop: 6 }}
                onClick={() => setZones((z) => { const c = { ...z[sel.piece] }; delete c.animalW; return { ...z, [sel.piece]: c }; })}>
                Largeur auto (garder les proportions)
              </button>
            </div>
          </>
        )}
        <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>Astuce : glisse-déplace directement le carré sur l'image pour le positionner.</p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
        <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        <button className="btn" onClick={() => setZones(DEFAULTS)} style={{ border: "1px solid var(--line)" }}>Réinitialiser</button>
        {msg ? <span style={{ fontSize: "0.85rem", color: msg.includes("✓") ? "#256b34" : "#b3261e" }}>{msg}</span> : null}
      </div>
    </div>
  );
}
