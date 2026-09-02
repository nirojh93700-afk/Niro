"use client";

import { useEffect, useState, useCallback } from "react";
import PageHead from "@/components/admin/PageHead";

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

// Graphique en barres (SVG) — bénéfice par mois. On montre les 6 derniers mois
// et le graphique tient sur la largeur de l'écran (lisible sur mobile).
function Chart({ series }) {
  const data = series.slice(-6);
  const W = 380, H = 200, padB = 24, padT = 12, padL = 4;
  const n = data.length;
  const max = Math.max(1, ...data.map((s) => Math.max(s.revenue, s.profit)));
  const bw = (W - padL * 2) / n;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={padL} x2={W - padL} y1={padT + (H - padT - padB) * (1 - g)} y2={padT + (H - padT - padB) * (1 - g)} stroke="#eee6d5" strokeWidth="1" />
        ))}
        {data.map((s, i) => {
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
  const [copied, setCopied] = useState("");        // mois dont le CA vient d'être copié
  const [dlRecettes, setDlRecettes] = useState(false); // téléchargement du livre des recettes
  const [decl, setDecl] = useState({});            // mois cochés « Déclarée » ({"2026-07": date})

  // Coche / décoche « Déclarée » sur un mois (enregistré en base → le tableau
  // recalcule tout seul ce qu'il reste à déclarer, à chaque visite).
  const toggleDecl = async (month, on) => {
    setDecl((d) => { const n = { ...d }; if (on) n[month] = new Date().toISOString(); else delete n[month]; return n; });
    try {
      await fetch("/api/admin/benefices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ month, declared: on }),
      });
    } catch { /* re-synchronisé au prochain chargement */ }
  };
  const [expenses, setExpenses] = useState([]);
  const [expLabel, setExpLabel] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState("");
  const [expMsg, setExpMsg] = useState("");

  const load = useCallback(async (k) => {
    try {
      const res = await fetch("/api/admin/benefices", { headers: { "x-admin-key": k } });
      if (res.status === 401) { setAuthed(false); setErr("Connecte-toi d'abord sur la page Gestion."); return; }
      if (!res.ok) { setErr("Erreur de chargement."); return; }
      const j = await res.json();
      setData(j);
      setDecl(j.declared || {});
      setAuthed(true);
    } catch { setErr("Erreur de chargement."); }
  }, []);

  const loadExpenses = useCallback(async (k) => {
    try {
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": k } });
      if (res.ok) { const { settings } = await res.json(); setExpenses(Array.isArray(settings?.expenses) ? settings.expenses : []); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (k) { setKey(k); load(k); loadExpenses(k); }
  }, [load, loadExpenses]);

  async function persistExpenses(next, k = key) {
    setExpenses(next);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": k },
        body: JSON.stringify({ expenses: next }),
      });
    } catch { setExpMsg("Enregistrement impossible."); }
  }
  function addExpense() {
    const amount = Math.max(0, Math.round((parseFloat(String(expAmount).replace(",", ".")) || 0) * 100) / 100);
    if (!expLabel.trim() && !amount) { setExpMsg("Indique un libellé et un montant."); return; }
    const e = {
      id: "dep_" + Math.random().toString(36).slice(2, 8),
      label: expLabel.trim().slice(0, 80),
      amount,
      date: /^\d{4}-\d{2}-\d{2}/.test(expDate) ? expDate : new Date().toISOString().slice(0, 10),
      category: "",
    };
    persistExpenses([e, ...expenses]);
    setExpLabel(""); setExpAmount(""); setExpDate(""); setExpMsg("Ajouté ✓");
  }
  function removeExpense(id) { persistExpenses(expenses.filter((e) => e.id !== id)); }

  if (!authed) return <div style={{ padding: 24 }}><p>{err || "Connecte-toi sur la page Gestion, puis reviens ici."}</p></div>;
  if (!data) return <div style={{ padding: 24 }}><p>Chargement…</p></div>;

  const p = data[period] || data.month;
  const periodLabel = { month: "Ce mois", year: "Cette année", all: "Depuis le début" }[period];

  // Dépenses de la période sélectionnée (par date), puis bénéfice net.
  const now = new Date();
  const ymNow = now.toISOString().slice(0, 7);
  const yNow = String(now.getFullYear());
  const inPeriod = (d) => period === "all" ? true : period === "year" ? String(d || "").slice(0, 4) === yNow : String(d || "").slice(0, 7) === ymNow;
  const periodExpenses = expenses.filter((e) => inPeriod(e.date)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netProfit = (p.profit || 0) - periodExpenses;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 14px 60px" }}>
      <PageHead eyebrow="Finances" title="Bénéfices" subtitle="Ce que tu gagnes réellement : ventes encaissées moins le coût d'achat des produits vendus, moins tes dépenses."
        kpis={[
          { label: `Bénéfice net — ${periodLabel}`, value: euro(netProfit), tone: netProfit >= 0 ? "good" : "bad" },
          { label: "Bénéfice brut (avant dépenses)", value: euro(p.profit || 0) },
          { label: "Dépenses de la période", value: euro(periodExpenses), tone: periodExpenses > 0 ? "warn" : "" },
        ]} />

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

      {/* Dépenses & charges */}
      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Dépenses &amp; charges</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: 0 }}>
          Tout ce que tu achètes pour fonctionner : <strong>fournitures d&apos;expédition</strong> (cartons, scotch fragile, papier bulle, étiquettes), matériel, petites charges. C&apos;est déduit pour obtenir ton <strong>bénéfice net</strong>.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
          <label style={{ flex: "2 1 160px" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Libellé</div>
            <input value={expLabel} onChange={(e) => setExpLabel(e.target.value)} placeholder="Ex. Scotch fragile (Amazon)" style={{ width: "100%", padding: "8px 10px", border: "1px solid #eadfc4", borderRadius: 8, font: "inherit" }} />
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Montant €</div>
            <input value={expAmount} onChange={(e) => setExpAmount(e.target.value)} inputMode="decimal" placeholder="7,99" style={{ width: "100%", padding: "8px 10px", border: "1px solid #eadfc4", borderRadius: 8, font: "inherit" }} />
          </label>
          <label style={{ flex: "1 1 120px" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Date</div>
            <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #eadfc4", borderRadius: 8, font: "inherit" }} />
          </label>
          <button className="btn btn-gold" onClick={addExpense} style={{ padding: "8px 16px" }}>Ajouter</button>
        </div>
        {expMsg && <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: -4 }}>{expMsg}</p>}
        {expenses.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f0eadd" }}>
                    <td style={{ padding: "6px 4px", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{e.date}</td>
                    <td style={{ padding: "6px 8px" }}>{e.label}</td>
                    <td style={{ padding: "6px 4px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{euro(e.amount)}</td>
                    <td style={{ padding: "6px 4px", textAlign: "right" }}><button onClick={() => removeExpense(e.id)} title="Supprimer" style={{ background: "none", border: 0, cursor: "pointer", color: "#b4452f", fontSize: "1rem" }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Aucune dépense enregistrée pour l&apos;instant.</p>}
      </div>

      {/* Bénéfice net après dépenses */}
      <div style={{ ...card, background: "#241a0c", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: "0.78rem", color: "#c9a24b", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>Bénéfice net — {periodLabel}</div>
          <div style={{ fontSize: "0.78rem", color: "#b7a988", marginTop: 2 }}>Bénéfice {euro(p.profit)} − dépenses {euro(periodExpenses)}</div>
        </div>
        <div style={{ fontSize: "1.9rem", fontWeight: 800, color: netProfit >= 0 ? "#e2c67e" : "#e78d7a", fontVariantNumeric: "tabular-nums" }}>{euro(netProfit)}</div>
      </div>

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
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Bénéfice par mois (6 derniers mois)</h2>
        <Chart series={data.series} />
      </div>

      {/* ---- DÉCLARATION URSSAF : CA encaissé par mois --------------------- */}
      {/* Règles (vérifiées) : on déclare le CA ENCAISSÉ du mois, FRAIS DE PORT
         facturés INCLUS, sans déduire aucune charge. Catégorie « vente de
         marchandises (BIC) ». Les commandes test/annulées/remboursées sont
         exclues. Le chiffre à recopier est la colonne dorée. */}
      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>📋 Déclaration URSSAF — CA encaissé par mois</h2>
        <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          Le chiffre à déclarer chaque mois est dans la <strong>colonne dorée</strong> : ventes encaissées
          <strong> + livraison facturée aux clientes</strong> (règle URSSAF), remises déjà déduites,
          commandes test / annulées / remboursées exclues. Catégorie : <strong>vente de marchandises (BIC)</strong>.
          Aucune charge ne se déduit en micro-entreprise. Coche <strong>« Déclarée »</strong> après chaque
          déclaration : le tableau te dit tout seul ce qu&apos;il te reste à faire.
        </p>

        {/* Calcul AUTOMATIQUE de ce qu'il reste à déclarer : mois TERMINÉS, avec
           des ventes, pas encore cochés « Déclarée ». */}
        {(() => {
          const aFaire = data.series
            .slice(0, -1) // on exclut le mois en cours (il se déclare le mois suivant)
            .filter((s) => ((s.ca != null ? s.ca : s.revenue) > 0) && !decl[s.month]);
          if (!aFaire.length) {
            return (
              <div style={{ background: "#e9f4ec", border: "1px solid #bcd9c4", borderRadius: 10, padding: "10px 14px", margin: "0 0 12px", fontSize: "0.9rem", color: "#256b34" }}>
                ✅ <strong>Tout est déclaré.</strong> Prochaine déclaration : le mois en cours, une fois terminé
                (le chiffre s&apos;affichera ici automatiquement).
              </div>
            );
          }
          return (
            <div style={{ background: "#fdf0e0", border: "1px solid #e8c48a", borderRadius: 10, padding: "10px 14px", margin: "0 0 12px", fontSize: "0.92rem", color: "#7a5a12" }}>
              ⏰ <strong>À déclarer sur autoentrepreneur.urssaf.fr :</strong>
              {aFaire.map((s) => {
                const ca = s.ca != null ? s.ca : s.revenue;
                return (
                  <div key={s.month} style={{ marginTop: 4 }}>
                    → <strong>{mLabel(s.month)}</strong> : <strong>{Math.round(ca)} €</strong> dans la case
                    « BIC ventes » <span style={{ color: "#a98935" }}>(pas « BIC prestations » !)</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 6, fontSize: "0.8rem" }}>Une fois fait, coche « Déclarée » sur la ligne du mois ci-dessous.</div>
            </div>
          );
        })()}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 430 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ink-soft)", borderBottom: "2px solid #eadfc4" }}>
                <th style={{ padding: "8px 6px" }}>Mois</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Commandes</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Produits</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Livraison</th>
                <th style={{ padding: "8px 6px", textAlign: "right", color: "var(--gold-dark)" }}>CA à déclarer</th>
                <th style={{ padding: "8px 6px" }} />
                <th style={{ padding: "8px 6px", textAlign: "center" }}>Déclarée</th>
              </tr>
            </thead>
            <tbody>
              {data.series.slice().reverse().map((s, i) => {
                const ca = s.ca != null ? s.ca : s.revenue; // anciennes réponses sans livraison
                const vide = !s.orders && !ca;
                return (
                  <tr key={s.month} style={{ borderBottom: "1px solid #f0eadd", background: i === 0 ? "#fdf6e8" : "transparent", opacity: vide ? 0.5 : 1 }}>
                    <td style={{ padding: "8px 6px", fontWeight: i === 0 ? 700 : 400 }}>{mLabel(s.month)}{i === 0 ? " (en cours)" : ""}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.orders ?? "—"}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{euro(s.revenue)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>{euro(s.shipping || 0)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 800, color: "var(--gold-dark)" }}>{euro(ca)}</td>
                    <td style={{ padding: "4px 6px", textAlign: "right" }}>
                      {ca > 0 && (
                        <button type="button" className="btn btn-outline" style={{ padding: "2px 10px", fontSize: "0.75rem" }}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(String(ca.toFixed(2)).replace(".", ","));
                              setCopied(s.month); setTimeout(() => setCopied(""), 1500);
                            } catch { /* ignore */ }
                          }}>
                          {copied === s.month ? "✓ Copié" : "Copier"}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "center" }}>
                      {/* Le mois en cours ne se déclare pas encore ; les mois vides n'ont rien à cocher. */}
                      {i === 0 ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>en cours</span>
                      ) : ca > 0 ? (
                        <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <input type="checkbox" checked={Boolean(decl[s.month])}
                            onChange={(e) => toggleDecl(s.month, e.target.checked)}
                            style={{ width: 17, height: 17, accentColor: "#256b34" }} />
                          {decl[s.month] ? <span style={{ fontSize: "0.75rem", color: "#256b34", fontWeight: 700 }}>✓</span> : null}
                        </label>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
          💡 Déclare le mois <strong>terminé</strong> (pas le mois en cours) sur autoentrepreneur.urssaf.fr,
          dans « Chiffre d&apos;affaires — ventes de marchandises ». Un oubli = pénalité (~58 €), même à 0 € il faut déclarer.
        </p>

        {/* Livre des recettes : registre chronologique OBLIGATOIRE (date,
           référence, client, nature, montant, mode d'encaissement). */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f0eadd", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" style={{ padding: "7px 16px", fontSize: "0.85rem" }} disabled={dlRecettes}
            onClick={async () => {
              setDlRecettes(true);
              try {
                const res = await fetch("/api/admin/benefices?recettes=1", { headers: { "x-admin-key": key } });
                const j = await res.json();
                const rows = j.rows || [];
                const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
                const dateFr = (iso) => { try { return new Date(iso).toLocaleDateString("fr-FR"); } catch { return iso; } };
                const csv = "﻿" + [
                  ["Date d'encaissement", "Référence", "Client", "Nature", "Montant (EUR)", "Mode d'encaissement"].map(esc).join(";"),
                  ...rows.map((r) => [dateFr(r.date), r.reference, r.client, r.nature, String(r.montant.toFixed(2)).replace(".", ","), r.mode].map(esc).join(";")),
                ].join("\r\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                const a = document.createElement("a");
                a.href = url; a.download = "livre-des-recettes-niv-creation.csv"; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
              } catch { alert("Téléchargement impossible."); }
              setDlRecettes(false);
            }}>
            {dlRecettes ? "…" : "⬇️ Télécharger le livre des recettes (CSV)"}
          </button>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", maxWidth: 420 }}>
            Registre chronologique <strong>obligatoire</strong> (date, référence, client, nature, montant, mode d&apos;encaissement).
            S&apos;ouvre dans Excel / Numbers — garde une copie chaque mois.
          </span>
        </div>
      </div>

      {/* Détail par produit */}
      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Détail par produit (depuis le début)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", minWidth: 430 }}>
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
        Calculé sur les commandes payées (hors tests, annulées et remboursées). Le coût est le prix d&apos;achat que tu renseignes sur chaque produit. Le <strong>bénéfice</strong> ne compte que produits vendus − coût d&apos;achat ; le <strong>bénéfice net</strong> déduit en plus tes <strong>dépenses &amp; charges</strong> saisies ci-dessus (fournitures, expédition…). La livraison encaissée reste à part (neutre).
      </p>
    </div>
  );
}
