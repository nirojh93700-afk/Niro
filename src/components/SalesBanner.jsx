"use client";

// =============================================================================
// Bandeau SOLDES animé et original (Framer Motion). S'affiche entre les dates
// réglées dans l'admin et s'arrête tout seul à la fin (double sécurité ici :
// si la date de fin est passée, le bandeau ne s'affiche pas).
// =============================================================================
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function diff(end) {
  const ms = new Date(end).getTime() - Date.now();
  if (!end || isNaN(ms) || ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export default function SalesBanner({ text, end, link }) {
  const [t, setT] = useState(() => (end ? diff(end) : "no-end"));
  useEffect(() => {
    if (!end) return; // pas de date de fin : pas de compte à rebours
    const id = setInterval(() => setT(diff(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (end && !t) return null; // fini → on n'affiche rien

  const pad = (n) => String(n).padStart(2, "0");
  const cd = end && t && t !== "no-end" ? t : null;

  const inner = (
    <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(100deg,#1b140a,#3a2c12 35%,#c9a24b 50%,#3a2c12 65%,#1b140a)", backgroundSize: "200% 100%" }}>
      {/* éclat qui balaie le bandeau */}
      <motion.div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)", filter: "blur(2px)" }}
        animate={{ x: ["-60%", "260%"] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} />
      {/* petites étincelles */}
      {[18, 50, 82].map((leftPct, i) => (
        <motion.span key={i} aria-hidden style={{ position: "absolute", top: "50%", left: `${leftPct}%`, color: "#ffe9b0", fontSize: 12, pointerEvents: "none" }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6], y: [-6, -12, -6] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}>✦</motion.span>
      ))}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", padding: "9px 14px", color: "#fff" }}>
        <motion.span style={{ fontWeight: 800, letterSpacing: ".14em", fontSize: "0.95rem", color: "#fff" }}
          animate={{ textShadow: ["0 0 0 rgba(255,233,176,0)", "0 0 10px rgba(255,233,176,.9)", "0 0 0 rgba(255,233,176,0)"] }} transition={{ duration: 2.2, repeat: Infinity }}>
          ✦ SOLDES
        </motion.span>
        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{text}</span>
        {cd ? (
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            {[["J", cd.d], ["H", cd.h], ["M", cd.m], ["S", cd.s]].map(([lbl, val]) => (
              <span key={lbl} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,233,176,.4)", borderRadius: 7, padding: "2px 7px", minWidth: 30 }}>
                <strong style={{ fontSize: "0.9rem", lineHeight: 1 }}>{pad(val)}</strong>
                <span style={{ fontSize: "0.55rem", opacity: 0.8 }}>{lbl}</span>
              </span>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
      {link ? <a href={link} style={{ textDecoration: "none", display: "block" }}>{inner}</a> : inner}
    </motion.div>
  );
}
