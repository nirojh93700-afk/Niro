"use client";

// =============================================================================
// RÉGLAGE COUVERTS (admin) — place le prénom et l'animal sur chaque couvert,
// pour DEUX vues : la photo normale et le gros plan des manches (vraies photos).
// Glisse les carrés, ajuste la taille, Enregistre. Le site garde tes positions.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const IMAGES = {
  base: { src: "/produits/couverts_enfants_4_face.jpg", aspect: "1 / 1" },
  zoom: { src: "/produits/couverts_enfants_zoom.jpg", aspect: "1076 / 565" },
};
const SAMPLE = "/animaux/savane/lion.png";
const PIECES = [
  { key: "couteau", label: "Couteau" },
  { key: "fourchette", label: "Fourchette" },
  { key: "grande", label: "Grande cuillère" },
  { key: "petite", label: "Petite cuillère" },
];
const DEFAULTS = {
  base: {
    couteau: { cx: 0.213, nameCy: 0.62, animalCy: 0.80, animalH: 0.055, nameSize: 0.035 },
    fourchette: { cx: 0.396, nameCy: 0.62, animalCy: 0.80, animalH: 0.055, nameSize: 0.035 },
    grande: { cx: 0.619, nameCy: 0.62, animalCy: 0.80, animalH: 0.055, nameSize: 0.035 },
    petite: { cx: 0.821, nameCy: 0.66, animalCy: 0.82, animalH: 0.05, nameSize: 0.035 },
  },
  zoom: {
    couteau: { cx: 0.145, nameCy: 0.42, animalCy: 0.80, animalH: 0.22, nameSize: 0.03 },
    fourchette: { cx: 0.365, nameCy: 0.42, animalCy: 0.80, animalH: 0.22, nameSize: 0.03 },
    grande: { cx: 0.63, nameCy: 0.42, animalCy: 0.80, animalH: 0.22, nameSize: 0.03 },
    petite: { cx: 0.871, nameCy: 0.42, animalCy: 0.80, animalH: 0.22, nameSize: 0.03 },
  },
};
const mergeSet = (def, saved) => {
  const out = {};
  for (const k of Object.keys(def)) out[k] = { ...def[k], ...((saved || {})[k] || {}) };
  return out;
};

export default function CouvertsReglagePage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [zones, setZones] = useState(DEFAULTS);
  const [view, setView] = useState("base"); // base | zoom
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
      const cz = s.couvertsZones || {};
      setZones({ base: mergeSet(DEFAULTS.base, cz.base), zoom: mergeSet(DEFAULTS.zoom, cz.zoom) });
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); load(saved); }
  }, [load]);

  function onPointerDown(piece, which, e) { e.preventDefault(); setSel({ piece, which }); drag.current = { piece, which }; }
  function onPointerMove(e) {
    if (!drag.current || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const cx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const cy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const { piece, which } = drag.current;
    setZones((z) => ({ ...z, [view]: { ...z[view], [piece]: { ...z[view][piece], cx, [which === "name" ? "nameCy" : "animalCy"]: cy } } }));
  }
  function onPointerUp() { drag.current = null; }
  function setField(field, val) {
    setZones((z) => ({ ...z, [view]: { ...z[view], [sel.piece]: { ...z[view][sel.piece], [field]: val } } }));
  }

  async function save() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ couvertsZones: zones }),
      });
      setMsg(res.ok ? "Enregistré ✓ (recharge la fiche pour voir)" : "Échec de l'enregistrement.");
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

  const set = zones[view];
  const cur = set[sel.piece];
  const img = IMAGES[view];
  const bw = boxRef.current?.clientWidth || 440;

  return (
    <div className="container" style={{ padding: "24px 16px 60px", maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>Réglage des couverts</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Gestion</Link>
      </div>

      {/* Choix de la vue */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button className={`filter-chip ${view === "base" ? "active" : ""}`} style={{ padding: "5px 16px" }} onClick={() => setView("base")}>Vue normale</button>
        <button className={`filter-chip ${view === "zoom" ? "active" : ""}`} style={{ padding: "5px 16px" }} onClick={() => setView("zoom")}>Gros plan (zoom)</button>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginTop: 0 }}>
        Glisse le carré <strong>« Prénom »</strong> et le carré <strong>animal</strong> sur chaque couvert, ajuste la taille, puis <strong>Enregistre</strong>. Règle les <strong>deux vues</strong>.
      </p>

      <div
        ref={boxRef}
        onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        style={{ position: "relative", width: "100%", aspectRatio: img.aspect, background: "#fff", borderRadius: 12, border: "1px solid var(--line)", touchAction: "none", userSelect: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="Couverts" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
        {PIECES.map((p) => {
          const z = set[p.key];
          const selName = sel.piece === p.key && sel.which === "name";
          const selAn = sel.piece === p.key && sel.which === "animal";
          return (
            <div key={p.key}>
              <span onPointerDown={(e) => onPointerDown(p.key, "name", e)} style={{
                position: "absolute", left: `${z.cx * 100}%`, top: `${z.nameCy * 100}%`,
                transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${z.nameW ?? 1})`, transformOrigin: "center",
                fontSize: `${z.nameSize * bw}px`, fontWeight: 700, color: "#3a2f1d", whiteSpace: "nowrap",
                cursor: "grab", padding: "3px 6px", borderRadius: 5,
                background: selName ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)", border: selName ? "2px solid #b0852f" : "1.5px solid #c9a24b",
              }}>Prénom</span>
              <div onPointerDown={(e) => onPointerDown(p.key, "animal", e)} style={{
                position: "absolute", left: `${z.cx * 100}%`, top: `${z.animalCy * 100}%`,
                height: `${z.animalH * 100}%`, width: z.animalW ? `${z.animalW * 100}%` : "auto",
                transform: "translate(-50%,-50%)", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", padding: 3, borderRadius: 6,
                background: selAn ? "rgba(201,162,75,.45)" : "rgba(201,162,75,.22)", border: selAn ? "2px solid #b0852f" : "1.5px solid #c9a24b",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SAMPLE} alt="" draggable={false} style={{ height: "100%", width: z.animalW ? "100%" : "auto", pointerEvents: "none" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sélection pièce + élément */}
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
        <strong>{view === "base" ? "Vue normale" : "Zoom"} — {PIECES.find((p) => p.key === sel.piece)?.label} — {sel.which === "name" ? "Prénom" : "Animal"}</strong>
        {sel.which === "name" ? (
          <>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: "0.85rem" }}>Hauteur (taille du texte)</label>
              <input type="range" min="0.02" max="0.12" step="0.002" value={cur.nameSize} onChange={(e) => setField("nameSize", Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: "0.85rem" }}>Largeur</label>
              <input type="range" min="0.5" max="1.6" step="0.05" value={cur.nameW ?? 1} onChange={(e) => setField("nameW", Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: "0.85rem" }}>Hauteur</label>
              <input type="range" min="0.03" max="0.40" step="0.005" value={cur.animalH} onChange={(e) => setField("animalH", Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: "0.85rem" }}>Largeur</label>
              <input type="range" min="0.03" max="0.40" step="0.005" value={cur.animalW ?? cur.animalH} onChange={(e) => setField("animalW", Number(e.target.value))} style={{ width: "100%" }} />
              <button className="filter-chip" style={{ padding: "2px 10px", marginTop: 6 }}
                onClick={() => setZones((z) => { const c = { ...z[view][sel.piece] }; delete c.animalW; return { ...z, [view]: { ...z[view], [sel.piece]: c } }; })}>
                Largeur auto (garder les proportions)
              </button>
            </div>
          </>
        )}
        <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: "10px 0 0" }}>Astuce : glisse directement le carré sur l'image pour le positionner.</p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
        <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        <button className="btn" onClick={() => setZones((z) => ({ ...z, [view]: DEFAULTS[view] }))} style={{ border: "1px solid var(--line)" }}>Réinitialiser cette vue</button>
        {msg ? <span style={{ fontSize: "0.85rem", color: msg.includes("✓") ? "#256b34" : "#b3261e" }}>{msg}</span> : null}
      </div>
    </div>
  );
}
