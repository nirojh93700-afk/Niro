"use client";

// =============================================================================
// Petite fenêtre « Nouveautés » — toast moderne qui glisse en bas, reste
// quelques secondes puis se referme, et passe au produit suivant.
// Discret (bas de l'écran), bouton ✕, et ne réapparaît plus si on le ferme
// (mémorisé pour la session). Facile à retirer : enlever <NewArrivalsToast/>.
// =============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewArrivalsToast({ items = [] }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!items.length) return;
    try { if (sessionStorage.getItem("niv-newtoast-off")) return; } catch {}
    let idx = 0;
    let showTimer, hideTimer, nextTimer;
    const cycle = () => {
      setI(idx);
      setOpen(true);
      hideTimer = setTimeout(() => setOpen(false), 6000); // visible ~6 s
      nextTimer = setTimeout(() => { idx = (idx + 1) % items.length; if (idx !== 0) cycle(); }, 9000); // produit suivant
    };
    showTimer = setTimeout(cycle, 2500); // apparaît après 2,5 s
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); clearTimeout(nextTimer); };
  }, [items.length]);

  function dismiss() {
    setOpen(false); setClosed(true);
    try { sessionStorage.setItem("niv-newtoast-off", "1"); } catch {}
  }

  if (!items.length || closed) return null;
  const p = items[i] || items[0];

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed", left: 16, bottom: 16, zIndex: 60, width: 300, maxWidth: "calc(100vw - 32px)",
        background: "#fff", borderRadius: 14, boxShadow: "0 10px 34px rgba(0,0,0,.18)", border: "1px solid #ece3d2",
        display: "flex", alignItems: "center", gap: 12, padding: 10,
        transform: open ? "translateY(0)" : "translateY(140%)", opacity: open ? 1 : 0,
        transition: "transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s ease", pointerEvents: open ? "auto" : "none",
      }}
    >
      <Link href={`/produit/${p.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0, background: "#faf7f0" }} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "0.66rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold-dark)", fontWeight: 700 }}>Nouveauté ✦</span>
          <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
          <span style={{ display: "block", fontSize: "0.78rem", color: "var(--gold-dark)" }}>Découvrir →</span>
        </span>
      </Link>
      <button onClick={dismiss} aria-label="Fermer" style={{ flexShrink: 0, alignSelf: "flex-start", border: "none", background: "transparent", fontSize: 18, lineHeight: 1, color: "#9a8f7d", cursor: "pointer", padding: 4 }}>✕</button>
    </div>
  );
}
