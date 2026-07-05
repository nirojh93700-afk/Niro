"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { products } from "@/lib/products";

// Réglage des zones de gravure des cristaux (comme les couverts) :
// on place la photo du client sur la VRAIE photo du cristal, on enregistre,
// et la fiche produit l'utilise. Repli sur le cristal dessiné si non réglé.

const BLENDS = [
  { v: "screen", label: "Lumineux (LED)" },
  { v: "normal", label: "Net" },
  { v: "luminosity", label: "Gravé" },
];

function defZone(p) {
  return { img: p.images?.[0] || "", left: 20, top: 40, width: 30, height: 30, opacity: 0.72, blend: "screen", bw: 1 };
}

export default function CristalReglage() {
  const cristaux = useMemo(() => products.filter((p) => p.crystal3d), []);
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [sel, setSel] = useState(cristaux[0]?.slug || "");
  const [zones, setZones] = useState({});
  const [sample, setSample] = useState("");
  const boxRef = useRef(null);
  const mode = useRef(null);
  const start = useRef(null);

  const product = cristaux.find((p) => p.slug === sel) || cristaux[0];
  const z = zones[sel] || (product ? defZone(product) : null);

  async function load(k) {
    setMsg("Chargement…");
    try {
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": k } });
      if (!res.ok) throw new Error("Mot de passe incorrect.");
      const s = await res.json();
      const saved = s.crystalZones || {};
      const init = {};
      for (const p of cristaux) init[p.slug] = saved[p.slug] ? { ...defZone(p), ...saved[p.slug] } : defZone(p);
      setZones(init);
      setAuthed(true);
      setMsg("");
    } catch (e) { setMsg(e.message); }
  }

  function setZ(patch) { setZones((prev) => ({ ...prev, [sel]: { ...(prev[sel] || defZone(product)), ...patch } })); }

  function pct(e) {
    const r = boxRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, r };
  }
  function onDown(m, e) { e.preventDefault(); e.stopPropagation(); mode.current = m; const p = pct(e); start.current = { px: p.x, py: p.y, ...z }; e.currentTarget.setPointerCapture?.(e.pointerId); }
  function onMove(e) {
    if (!mode.current) return;
    e.preventDefault();
    const p = pct(e);
    if (mode.current === "move") {
      setZ({ left: Math.max(0, Math.min(100 - z.width, start.current.left + (p.x - start.current.px))), top: Math.max(0, Math.min(100 - z.height, start.current.top + (p.y - start.current.py))) });
    } else {
      setZ({ width: Math.max(6, Math.min(96, start.current.width + (p.x - start.current.px))), height: Math.max(6, Math.min(96, start.current.height + (p.y - start.current.py))) });
    }
  }
  function onUp() { mode.current = null; }

  async function save() {
    setMsg("Enregistrement…");
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ crystalZones: zones }) });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setMsg("Enregistré ✓ — la fiche produit utilise maintenant ces réglages.");
    } catch (e) { setMsg(e.message); }
  }

  function onSample(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setSample(r.result); r.readAsDataURL(f);
  }

  if (!authed) {
    return (
      <main className="container" style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontFamily: "Georgia, serif" }}>Réglage cristaux</h1>
        <p style={{ color: "var(--ink-soft)" }}>Placez la photo du client sur chaque cristal, puis enregistrez.</p>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Mot de passe admin" onKeyDown={(e) => e.key === "Enter" && load(key)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        <button className="btn btn-gold" style={{ marginTop: 12 }} onClick={() => load(key)}>Ouvrir</button>
        {msg && <p style={{ color: "#b4452f" }}>{msg}</p>}
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 720, margin: "20px auto", padding: 16 }}>
      <h1 style={{ fontFamily: "Georgia, serif" }}>Réglage cristaux — placer la photo</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: ".92rem" }}>Choisissez un cristal, puis glissez le cadre sur la zone gravée et redimensionnez-le avec la poignée dorée. La photo témoin sert d'exemple. Enregistrez : la fiche produit affichera la photo du client exactement à cet endroit.</p>

      {/* Sélecteur de produit */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
        {cristaux.map((p) => (
          <button key={p.slug} onClick={() => setSel(p.slug)} style={{ border: "1.5px solid " + (p.slug === sel ? "#b0852f" : "var(--line)"), background: p.slug === sel ? "rgba(201,162,75,.14)" : "var(--card)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", font: "inherit", fontSize: ".85rem", fontWeight: p.slug === sel ? 600 : 400 }}>{p.name}</button>
        ))}
      </div>

      {/* Choix de la photo produit (template) */}
      {product?.images?.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {product.images.filter((im) => !/guide/.test(im)).map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={im} src={im} alt="" onClick={() => setZ({ img: im })} style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "2px solid " + (z.img === im ? "#b0852f" : "transparent") }} />
          ))}
        </div>
      )}

      {/* Éditeur */}
      <div ref={boxRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", aspectRatio: "1 / 1", background: "#0d0b08", borderRadius: 14, overflow: "hidden", touchAction: "none", userSelect: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {z?.img && <img src={z.img} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />}
        {z && (
          <div onPointerDown={(e) => onDown("move", e)} style={{ position: "absolute", left: z.left + "%", top: z.top + "%", width: z.width + "%", height: z.height + "%", overflow: "hidden", borderRadius: 4, cursor: "grab", outline: "2px solid #c9a24b", outlineOffset: -1 }}>
            {sample ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sample} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: z.opacity, mixBlendMode: z.blend, filter: (z.bw ? "grayscale(1) " : "") + "contrast(1.12) brightness(1.08)", pointerEvents: "none" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,.25)", display: "grid", placeItems: "center", color: "#fff", fontSize: ".7rem", textAlign: "center", padding: 4 }}>zone photo</div>
            )}
            <span onPointerDown={(e) => onDown("resize", e)} style={{ position: "absolute", right: -11, bottom: -11, width: 24, height: 24, borderRadius: "50%", background: "#c9a24b", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, cursor: "nwse-resize", boxShadow: "0 1px 6px rgba(0,0,0,.4)" }}>⤡</span>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div style={{ display: "grid", gap: 12, maxWidth: 420, margin: "14px auto 0" }}>
        <label className="btn btn-outline" style={{ textAlign: "center", cursor: "pointer" }}>
          📷 Charger une photo témoin
          <input type="file" accept="image/*" onChange={onSample} hidden />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 90, fontSize: ".85rem", color: "var(--ink-soft)" }}>Luminosité</span>
          <input type="range" min="30" max="100" value={Math.round((z?.opacity ?? 0.72) * 100)} onChange={(e) => setZ({ opacity: Number(e.target.value) / 100 })} style={{ flex: 1 }} />
          <span style={{ width: 42, textAlign: "right", fontSize: ".85rem" }}>{Math.round((z?.opacity ?? 0.72) * 100)}%</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {BLENDS.map((b) => (
            <button key={b.v} onClick={() => setZ({ blend: b.v })} style={{ flex: 1, border: "1.5px solid " + (z?.blend === b.v ? "#b0852f" : "var(--line)"), background: z?.blend === b.v ? "rgba(201,162,75,.14)" : "var(--card)", borderRadius: 10, padding: 8, cursor: "pointer", font: "inherit", fontSize: ".82rem" }}>{b.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setZ({ bw: 1 })} style={{ flex: 1, border: "1.5px solid " + (z?.bw ? "#b0852f" : "var(--line)"), background: z?.bw ? "rgba(201,162,75,.14)" : "var(--card)", borderRadius: 10, padding: 8, cursor: "pointer", font: "inherit", fontSize: ".82rem" }}>Noir &amp; blanc (gravure)</button>
          <button onClick={() => setZ({ bw: 0 })} style={{ flex: 1, border: "1.5px solid " + (!z?.bw ? "#b0852f" : "var(--line)"), background: !z?.bw ? "rgba(201,162,75,.14)" : "var(--card)", borderRadius: 10, padding: 8, cursor: "pointer", font: "inherit", fontSize: ".82rem" }}>Couleur</button>
        </div>
        <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        {msg && <p style={{ textAlign: "center", color: msg.includes("✓") ? "#3f7d55" : "#b4452f", fontSize: ".9rem" }}>{msg}</p>}
      </div>
    </main>
  );
}
