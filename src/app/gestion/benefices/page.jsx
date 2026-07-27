"use client";

import { useEffect, useState, useCallback } from "react";

// =============================================================================
// Gestion → Bénéfices (lecture seule)
// CA encaissé − coût d'achat des produits vendus = bénéfice.
// Le coût vient du champ « coût » renseigné sur chaque produit.
// =============================================================================

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const mLabel = (k) => { const [y, m] = k.split("-").map(Number); return MONTHS[m - 1] + " " + String(y).slice(2); };

const card = { background: "#fff", border: "1px solid #eadfc4", borderRadius: 14, padding: 18, marginBottom: 18, boxShadow: "0 1px 3px rgba(60,45,15,.05)" };

function Tile({ label, value, sub, accent, big }) {
  return (
    <div style={{ background: big ? "#241a0c" : "#fff", border: "1px solid #eadfc4", borderRadius: 14, padding: "16px 18px", flex: "1 1 160px", minWidth: 150 }}>
      <div style={{ fontSize: "0.78rem", color: big ? "#c9a24b" : "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>{label}</div>
      <div style={{ fontSize: big ? "1.9rem" : "1.4rem", fontWeight: 800, color: accent || (big ? "#f3e8d3" : "var(--ink)"), marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub ? <div style={{ fontSize: "0.78rem", color: big ? "#b7a988" : "var(--ink-soft)", marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

// Graphique en barres (SVG) — bénéfice par mois.
function Chart({ series }) {
  const W = 720, H = 220, padB = 26, padT = 14, padL = 4;
  const n = series.length;
  const max = Math.max(1, ...series.map((s) => Math.max(s.revenue, s.profit)));
  const bw = (W - padL * 2) / n;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 560, height: "auto", display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={padL} x2={W - padL} y1={padT + (H - padT - padB) * (1 - g)} y2={padT + (H - padT - padB) * (1 - g)} stroke="#eee6d5" strokeWidth="1" />
        ))}
        {series.map((s, i) => {
          const x = padL + i * bw;
          const zone = H - padT - padB;
          const rev = (s.revenue / max) * zone;
          const prof = (Math.max(0, s.profit) / max) * zone;
          return (
            <g key={i}>
              {/* CA (fond clair) */}
              <rect x={x + bw * 0.2} y={padT + zone - rev} width={bw * 0.6} height={rev} rx="3" fill="#f0e4c6" />
              {/* Bénéfice (or) */}
              <rect x={x + bw * 0.2} y={padT + zone - prof} width={bw * 0.6} height={prof} rx="3" fill="#c9a24b" />
              <text x={x + bw / 2} y={H - 9} textAnchor="middle" fontSize="10" fill="#9a8c6d">{mLabel(s.month).split(" ")[0]}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 4 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#c9a24b", borderRadius: 2, marginRight: 5 }} />Bénéfice</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#f0e4c6", borderRadius: 2, marginRight: 5 }} />Chiffre d&apos;affaires</span>
      </div>
    </div>
  );
}

export default function BeneficesPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("month");
  const [err, setErr] = useState("");

  const load = useCallback(async (k) => {
    try {
      const res = await fetch("/api/admin/benefices", { headers: { "x-admin-key": k } });
      if (res.status === 401) { setAuthed(false); setErr("Connecte-toi d'abord sur la page Gestion."); return; }
      if (!res.ok) { setErr("Erreur de chargement."); return; }
      setData(await res.json());
      setAuthed(true);
    } catch { setErr("Erreur de chargement."); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  if (!authed) return <div style={{ padding: 24 }}><p>{err || "Connecte-toi sur la page Gestion, puis reviens ici."}</p></div>;
  if (!data) return <div style={{ padding: 24 }}><p>Chargement…</p></div>;

  const p = data[period] || data.month;
  const periodLabel = { month: "Ce mois", year: "Cette année", all: "Depuis le début" }[period];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 14px 60px" }}>
      <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold-dark)", marginBottom: 2 }}>Bénéfices</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>Ce que tu gagnes réellement : ventes encaissées moins le coût d&apos;achat des produits vendus.</p>

      {/* Sélecteur période */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["month", "Ce mois"], ["year", "Cette année"], ["all", "Tout"]].map(([k, lab]) => (
          <button key={k} onClick={() => setPeriod(k)} className={period === k ? "btn btn-gold" : "btn btn-outline"} style={{ padding: "6px 16px", fontSize: "0.9rem" }}>{lab}</button>
        ))}
      </div>

      {/* Tuiles */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <Tile big label={`Bénéfice — ${periodLabel}`} value={euro(p.profit)} sub={`Marge ${p.margin} %`} accent={p.profit >= 0 ? "#e2c67e" : "#e78d7a"} />
        <Tile label="Chiffre d'affaires" value={euro(p.revenue)} sub={`${p.units} article(s) vendu(s)`} />
        <Tile label="Coût d'achat" value={euro(p.cost)} sub="Produits vendus" />
        <Tile label="Marge" value={p.margin + " %"} sub="Bénéfice / CA" accent="#a98935" />
      </div>

      {/* Livraison — info seulement (couverte par les clientes, neutre sur le bénéfice) */}
      <div style={{ ...card, background: "#faf6ee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "12px 16px" }}>
        <span style={{ fontSize: "0.9rem" }}>🚚 <strong>Livraison encaissée</strong> (payée par les clientes) — {periodLabel.toLowerCase()}</span>
        <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{euro(p.shipping || 0)}</span>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "-8px 0 14px" }}>
        La livraison est <strong>neutre</strong> : les clientes couvrent ce que tu paies au transporteur → elle n&apos;est pas comptée dans le bénéfice, juste affichée pour info.
      </p>

      {/* Alerte coûts manquants */}
      {data.missingCost?.count > 0 && (
        <div style={{ ...card, background: "#fbf3e6", borderColor: "#e7d3a1" }}>
          <strong>⚠️ {data.missingCost.count} article(s) vendu(s) sans coût d&apos;achat renseigné.</strong>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: 4 }}>
            Le bénéfice est donc <strong>sous-estimé en coût</strong> (ces articles comptent comme coût 0). Renseigne le « coût » sur ces produits dans <a href="/gestion#produits">Produits &amp; Stock</a> pour un calcul exact.
            {data.missingCost.names.length ? <div style={{ marginTop: 4 }}>Concernés : {data.missingCost.names.join(", ")}.</div> : null}
          </div>
        </div>
      )}

      {/* Graphique */}
      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Bénéfice par mois (12 derniers mois)</h2>
        <Chart series={data.series} />
      </div>

      {/* Détail par produit */}
      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Détail par produit (depuis le début)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ink-soft)", borderBottom: "2px solid #eadfc4" }}>
                <th style={{ padding: "8px 6px" }}>Produit</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Vendus</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>CA</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Coût</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Bénéfice</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Marge</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0eadd" }}>
                  <td style={{ padding: "8px 6px" }}>{r.name}{!r.hasCost && <span title="Coût non renseigné" style={{ color: "#b4452f", marginLeft: 4 }}>⚠️</span>}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.units}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{euro(r.revenue)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>{r.hasCost ? euro(r.cost) : "—"}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: r.profit >= 0 ? "#256b34" : "#b4452f" }}>{euro(r.profit)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.margin} %</td>
                </tr>
              ))}
              {data.products.length === 0 && <tr><td colSpan={6} style={{ padding: 14, color: "var(--ink-soft)" }}>Aucune vente pour l&apos;instant.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>
        Calculé sur les commandes payées (hors tests, annulées et remboursées). Le coût est le prix d&apos;achat que tu renseignes sur chaque produit. Les frais de port et d&apos;emballage ne sont pas comptés ici (revenus et dépenses séparés).
      </p>
    </div>
  );
}
