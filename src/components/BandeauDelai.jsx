"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Bandeau « délai allongé » (mode settings.vacation actif) + fenêtre de détail
// du cadeau d'attente, ouverte au clic (maquette validée par la gérante le
// 01/09/2026). Masqué sur la page PANIER (l'encadré cadeau du récapitulatif
// prend le relais — demande gérante). Tout disparaît quand le mode est éteint
// (le layout ne rend ce composant que si un message existe).
export default function BandeauDelai({ message, gift }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();
  if (!message || (pathname || "").startsWith("/panier")) return null;

  return (
    <>
      <div
        onClick={gift ? () => setOuvert(true) : undefined}
        style={{ background: "#fdf6e8", borderBottom: "1px solid #e7d3a1", color: "#6b5516", textAlign: "center", padding: "9px 16px", fontSize: "0.9rem", lineHeight: 1.45, cursor: gift ? "pointer" : "default" }}
      >
        {message}
        {gift ? (
          <span style={{ display: "block", fontSize: "0.84rem", color: "#8a6d1f" }}>
            🎁 {gift} <strong style={{ textDecoration: "underline" }}>En savoir plus</strong>
          </span>
        ) : null}
      </div>

      {ouvert && (
        <div
          onClick={() => setOuvert(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(26,18,6,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fffdf8", border: "1px solid #e7d3a1", borderRadius: 18, maxWidth: 360, width: "100%", padding: "22px 20px 20px", boxShadow: "0 24px 60px rgba(0,0,0,.28)", position: "relative" }}
          >
            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              style={{ position: "absolute", top: 8, right: 12, fontSize: 22, color: "#a98935", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
            <div style={{ fontSize: ".78rem", color: "#8a6d1f", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Merci de votre patience</div>
            <h3 style={{ margin: "0 0 10px", fontFamily: "Georgia,serif", fontWeight: 600, color: "#a98935", fontSize: "1.15rem" }}>🎁 Notre cadeau d&apos;attente</h3>
            <p style={{ margin: "0 0 12px", fontSize: ".9rem", lineHeight: 1.55, color: "#40382c" }}>
              En ce moment, la demande est forte et chaque pièce est gravée à la commande : comptez <strong>3 à 4 semaines de confection</strong>, dans l&apos;ordre d&apos;arrivée des commandes.
            </p>
            <div style={{ background: "#fdf6e8", border: "1px solid #efdfc0", borderRadius: 12, padding: "12px 14px", margin: "0 0 14px" }}>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: ".86rem", color: "#584a2c", lineHeight: 1.45 }}>
                <span>🎁</span><span>Un <strong>cadeau surprise</strong> est glissé dans chaque commande passée pendant cette période.</span>
              </div>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: ".86rem", color: "#584a2c", lineHeight: 1.45, marginTop: 8 }}>
                <span>🛍️</span><span>Dans votre panier, dites-nous votre préférence : <strong>plutôt femme, plutôt homme, ou surprise totale</strong>.</span>
              </div>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: ".86rem", color: "#584a2c", lineHeight: 1.45, marginTop: 8 }}>
                <span>✦</span><span>Nous choisissons votre cadeau avec soin, parmi nos créations de l&apos;atelier.</span>
              </div>
            </div>
            <Link
              href="/boutique"
              onClick={() => setOuvert(false)}
              style={{ display: "block", textAlign: "center", background: "#c9a24b", color: "#fff", fontWeight: 700, borderRadius: 999, padding: "12px 18px", textDecoration: "none", fontSize: ".95rem" }}
            >
              Découvrir la boutique
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
