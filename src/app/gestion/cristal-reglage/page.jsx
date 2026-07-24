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

// Pré-placement de départ par produit (ajustable ensuite avec les curseurs).
const START = {
  "porte-cles-cristal-led-coeur": { left: 30, top: 51, width: 27, height: 24, rotation: 0 },
  "porte-cles-cristal-led-rectangle": { left: 45, top: 41, width: 31, height: 35, rotation: 0 },
  "cristal-photo-3d-vertical": { left: 30, top: 27, width: 42, height: 41, rotation: -3 },
  "cristal-photo-3d-horizontal": { left: 30, top: 30, width: 42, height: 32, rotation: -3 },
  // Verres & carafe : cadre sur la face avant (à ajuster : la carafe est un peu de biais).
  "carafe-a-whisky-gravee": { left: 37, top: 48, width: 26, height: 22, rotation: 0, ry: 0 },
  "verre-a-vin-grave": { left: 36, top: 17, width: 28, height: 24, rotation: 0, ry: 0 },
  "flute-a-champagne-gravee": { left: 40, top: 30, width: 20, height: 22, rotation: 0, ry: 0 },
};
function isGlass(p) { return Boolean(p.styleImages && p.engrave); }
function defZone(p) {
  const glass = isGlass(p);
  return {
    img: (glass ? p.engraveImage : p.images?.[0]) || p.images?.[0] || "",
    left: 20, top: 40, width: 30, height: 30, rotation: 0, ry: 0, rx: 0,
    opacity: glass ? 0.9 : 0.72, blend: glass ? "multiply" : "screen", bw: 1,
    on: glass ? 0 : 1, // verres/carafe : n'apparaît sur la fiche qu'une fois activé
    ...(START[p.slug] || {}),
  };
}
// Transformation appliquée à la zone : inclinaison (rotation à plat) + perspective 3D.
function zoneTransform(z) {
  return `perspective(900px) rotateX(${z?.rx || 0}deg) rotateY(${z?.ry || 0}deg) rotate(${z?.rotation || 0}deg)`;
}

export default function CristalReglage() {
  const cristaux = useMemo(() => products.filter((p) => p.crystal3d || (p.styleImages && p.engrave)), []);
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
      for (const p of cristaux) {
        const merged = saved[p.slug] ? { ...defZone(p), ...saved[p.slug] } : defZone(p);
        // Verres/carafe : le fond est TOUJOURS la photo du verre vide (celle de la
        // fiche). On ignore une éventuelle ancienne photo enregistrée par erreur.
        if (isGlass(p)) merged.img = p.engraveImage || merged.img;
        init[p.slug] = merged;
      }
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
      <h1 style={{ fontFamily: "Georgia, serif" }}>Réglage aperçu — cristaux, verres &amp; carafe</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: ".92rem" }}>Choisissez un produit, puis glissez le cadre sur la face à graver et redimensionnez-le avec la poignée dorée. Réglez l'<b>inclinaison</b> et la <b>perspective</b> pour suivre l'angle du verre/de la carafe. Pour les verres, cliquez un <b>logo témoin</b> pour viser juste. Enregistrez : la fiche posera le motif choisi exactement dans ce cadre.</p>

      {/* Sélecteur de produit */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
        {cristaux.map((p) => (
          <button key={p.slug} onClick={() => setSel(p.slug)} style={{ border: "1.5px solid " + (p.slug === sel ? "#b0852f" : "var(--line)"), background: p.slug === sel ? "rgba(201,162,75,.14)" : "var(--card)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", font: "inherit", fontSize: ".85rem", fontWeight: p.slug === sel ? 600 : 400 }}>{p.name}</button>
        ))}
      </div>

      {/* Choix de la photo produit (template) — cristaux uniquement */}
      {!isGlass(product) && product?.images?.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {product.images.filter((im) => !/guide/.test(im)).map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={im} src={im} alt="" onClick={() => setZ({ img: im })} style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "2px solid " + (z.img === im ? "#b0852f" : "transparent") }} />
          ))}
        </div>
      )}
      {isGlass(product) && (
        <p style={{ fontSize: ".82rem", color: "#8a6d1f", background: "#fff7e6", border: "1px solid var(--gold-l, #e2c67e)", borderRadius: 8, padding: "8px 10px", margin: "0 0 12px" }}>
          Placement sur le <b>verre vide</b> — c'est la seule photo où le client verra son motif. Les autres photos (ambiance, déjà gravées) restent des photos de présentation, on n'y touche pas.
        </p>
      )}

      {/* Motif témoin (verres/carafe) : poser un vrai logo dans le cadre pour viser juste */}
      {isGlass(product) && product.styleImages && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", margin: "0 0 6px" }}>Logo témoin (pour bien placer le cadre) :</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(product.styleImages).slice(0, 12).map(([n, url]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={n} src={url} alt={`n°${n}`} title={`n°${n}`} onClick={() => setSample(url)} style={{ width: 46, height: 46, objectFit: "contain", background: "#fff", borderRadius: 8, cursor: "pointer", padding: 3, border: "2px solid " + (sample === url ? "#b0852f" : "var(--line)") }} />
            ))}
          </div>
        </div>
      )}

      {/* Éditeur */}
      <div ref={boxRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", aspectRatio: "1 / 1", background: "#0d0b08", borderRadius: 14, overflow: "hidden", touchAction: "none", userSelect: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {z?.img && <img src={z.img} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />}
        {z && (
          <div onPointerDown={(e) => onDown("move", e)} style={{ position: "absolute", left: z.left + "%", top: z.top + "%", width: z.width + "%", height: z.height + "%", overflow: "hidden", borderRadius: 4, cursor: "grab", outline: "2px solid #c9a24b", outlineOffset: -1, transform: zoneTransform(z) }}>
            {sample ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sample} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", opacity: z.opacity, mixBlendMode: z.blend, filter: (z.bw ? "grayscale(1) " : "") + "contrast(1.12) brightness(1.08)", pointerEvents: "none" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,.25)", display: "grid", placeItems: "center", color: "#fff", fontSize: ".7rem", textAlign: "center", padding: 4 }}>zone photo</div>
            )}
            <span onPointerDown={(e) => onDown("resize", e)} style={{ position: "absolute", right: -11, bottom: -11, width: 24, height: 24, borderRadius: "50%", background: "#c9a24b", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, cursor: "nwse-resize", boxShadow: "0 1px 6px rgba(0,0,0,.4)" }}>⤡</span>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div style={{ display: "grid", gap: 12, maxWidth: 420, margin: "14px auto 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <label className="btn btn-outline" style={{ flex: 1, textAlign: "center", cursor: "pointer" }}>
            📷 Charger une photo témoin
            <input type="file" accept="image/*" onChange={onSample} hidden />
          </label>
          <button className="btn btn-outline" style={{ flex: "none" }} onClick={() => setZones((prev) => ({ ...prev, [sel]: defZone(product) }))} title="Replacer le cadre au centre de la face avant">↺ Replacer au centre</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 90, fontSize: ".85rem", color: "var(--ink-soft)" }}>Largeur</span>
          <input type="range" min="6" max="96" step="0.5" value={z?.width ?? 30} onChange={(e) => setZ({ width: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ width: 42, textAlign: "right", fontSize: ".85rem" }}>{Math.round(z?.width ?? 30)}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 90, fontSize: ".85rem", color: "var(--ink-soft)" }}>Hauteur</span>
          <input type="range" min="6" max="96" step="0.5" value={z?.height ?? 30} onChange={(e) => setZ({ height: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ width: 42, textAlign: "right", fontSize: ".85rem" }}>{Math.round(z?.height ?? 30)}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 90, fontSize: ".85rem", color: "var(--ink-soft)" }}>Inclinaison</span>
          <input type="range" min="-30" max="30" step="1" value={z?.rotation ?? 0} onChange={(e) => setZ({ rotation: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ width: 42, textAlign: "right", fontSize: ".85rem" }}>{Math.round(z?.rotation ?? 0)}°</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 90, fontSize: ".85rem", color: "var(--ink-soft)" }}>Perspective ↔</span>
          <input type="range" min="-50" max="50" step="1" value={z?.ry ?? 0} onChange={(e) => setZ({ ry: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ width: 42, textAlign: "right", fontSize: ".85rem" }}>{Math.round(z?.ry ?? 0)}°</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 90, fontSize: ".85rem", color: "var(--ink-soft)" }}>Perspective ↕</span>
          <input type="range" min="-50" max="50" step="1" value={z?.rx ?? 0} onChange={(e) => setZ({ rx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ width: 42, textAlign: "right", fontSize: ".85rem" }}>{Math.round(z?.rx ?? 0)}°</span>
        </div>
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
        {isGlass(product) && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1.5px solid " + (z?.on ? "#b0852f" : "var(--line)"), borderRadius: 10, background: z?.on ? "rgba(201,162,75,.12)" : "var(--card)", cursor: "pointer", fontSize: ".9rem" }}>
            <input type="checkbox" checked={Boolean(z?.on)} onChange={(e) => setZ({ on: e.target.checked ? 1 : 0 })} />
            <span>Afficher ce cadre sur la fiche produit (le motif choisi s'y posera). Décoché = placement libre par le client.</span>
          </label>
        )}
        <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        {msg && <p style={{ textAlign: "center", color: msg.includes("✓") ? "#3f7d55" : "#b4452f", fontSize: ".9rem" }}>{msg}</p>}
      </div>
    </main>
  );
}
