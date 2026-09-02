"use client";

import { useEffect, useState, useCallback } from "react";
import PageHead from "@/components/admin/PageHead";

// =============================================================================
// Gestion → Fidélité & cashback
// Tout le programme de fidélité au même endroit :
//   • Réglage du % de cashback (crédité après chaque commande payée).
//   • Total des cagnottes en circulation.
//   • Liste des clientes avec leur solde + date d'expiration.
// Le cashback se calcule et se crédite AUTOMATIQUEMENT (rien à faire ici).
// =============================================================================

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; } };

const card = { background: "#fff", border: "1px solid #eadfc4", borderRadius: 14, padding: 18, marginBottom: 18, boxShadow: "0 1px 3px rgba(60,45,15,.05)" };
const label = { fontSize: "0.82rem", fontWeight: 700, color: "var(--gold-dark, #a98935)" };

export default function FideliteAdmin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [pct, setPct] = useState("5");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ cagnottes: [], total: 0, count: 0 });
  const [amb, setAmb] = useState({ codes: {}, stats: {} });

  const load = useCallback(async (k) => {
    try {
      const s = await fetch("/api/admin/settings", { headers: { "x-admin-key": k } });
      if (s.status === 401) { setAuthed(false); return; }
      const sd = (await s.json()).settings || {};
      setPct(String(sd.cashbackPercent != null ? sd.cashbackPercent : 5));
      setAuthed(true);
      const c = await fetch("/api/admin/cagnottes", { headers: { "x-admin-key": k } });
      if (c.ok) setData(await c.json());
      // Ambassadeurs (codes + commissions) — pour la section intégrée.
      const p = await fetch("/api/admin/promo-codes", { headers: { "x-admin-key": k } });
      if (p.ok) { const pd = await p.json(); setAmb({ codes: pd.codes || {}, stats: pd.stats || {} }); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  async function savePct() {
    setMsg(""); setSaving(true);
    const n = Math.max(0, Math.min(20, Number(String(pct).replace(",", ".")) || 0));
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ cashbackPercent: n }),
      });
      if (r.ok) { setPct(String(n)); setMsg("Enregistré ✓"); setTimeout(() => setMsg(""), 1500); }
      else setMsg("Échec de l'enregistrement.");
    } catch { setMsg("Échec de l'enregistrement."); }
    finally { setSaving(false); }
  }

  if (!authed) {
    return <div style={{ padding: 24 }}><p>Connecte-toi d&apos;abord sur la page Gestion, puis reviens ici.</p></div>;
  }

  // Ambassadeurs : codes avec une commission > 0, enrichis de leurs statistiques.
  const ambassadors = Object.entries(amb.codes || {})
    .filter(([, def]) => Number(def?.commission) > 0)
    .map(([code, def]) => {
      const s = (amb.stats || {})[code] || {};
      const commTotal = Number(s.commission) || 0;
      const paid = Number(s.paid) || 0;
      return {
        code, name: def.ambassador || code, pct: Number(def.commission) || 0,
        orders: Number(s.orders) || 0, sales: Number(s.sales) || 0,
        commTotal, paid, due: Math.max(0, commTotal - paid),
      };
    })
    .sort((a, b) => b.due - a.due);
  const totalDue = ambassadors.reduce((t, a) => t + a.due, 0);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "8px 14px 60px" }}>
      <PageHead eyebrow="Clients" title="Fidélité & cashback"
        kpis={[
          { label: "Ambassadrices", value: ambassadors.length },
          { label: "Commissions à verser", value: totalDue.toFixed(2).replace(".", ",") + " €", tone: totalDue > 0 ? "warn" : "" },
        ]} />
      <p style={{ color: "var(--ink-soft)", marginTop: -6 }}>
        À chaque commande payée, la cliente gagne un pourcentage en <strong>cagnotte</strong>, qu&apos;elle utilise ensuite au panier (jusqu&apos;à 50 %). Tout est <strong>automatique</strong> : crédit après paiement, rappels avant expiration (12 mois), et affichage dans son espace « Mon compte ».
      </p>

      {/* Réglage du % */}
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Pourcentage de cashback</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: -6 }}>
          Part du montant produits (hors livraison) créditée en cagnotte. Mettre <strong>0</strong> pour désactiver le cashback.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="number" min="0" max="20" step="0.5" value={pct} onChange={(e) => setPct(e.target.value)}
            style={{ width: 90, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
          <span>% par commande</span>
          <button className="btn btn-gold" style={{ padding: "8px 16px" }} onClick={savePct} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
          {msg && <span style={{ color: msg.includes("✓") ? "#256b34" : "#b4452f", fontSize: "0.85rem" }}>{msg}</span>}
        </div>
      </div>

      {/* Total en circulation */}
      <div style={{ ...card, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", background: "linear-gradient(150deg,#241a0c,#3a2c12)", border: "none", color: "#f3e8d3" }}>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: "0.78rem", letterSpacing: 2, textTransform: "uppercase", color: "#e2c67e" }}>Cagnottes en circulation</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: "bold", color: "#fff", marginTop: 2 }}>{euro(data.total)}</div>
          <div style={{ fontSize: "0.82rem", color: "#c9b78d" }}>{data.count} cliente{data.count > 1 ? "s" : ""} avec un solde</div>
        </div>
        <div style={{ background: "rgba(226,198,126,.12)", border: "1px solid rgba(226,198,126,.35)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#e2c67e" }}>+{String(pct).replace(".", ",")} %</div>
          <div style={{ fontSize: 11, color: "#c9b78d" }}>par commande</div>
        </div>
      </div>

      {/* Liste des soldes */}
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Soldes par cliente</h2>
        {data.cagnottes.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>Aucune cagnotte pour l&apos;instant. Les soldes apparaîtront ici dès les premières commandes.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  {["Cliente (e-mail)", "Solde", "Expire le"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", borderBottom: "2px solid #eadfc4", padding: "8px 6px", color: "var(--ink-soft)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cagnottes.map((c) => (
                  <tr key={c.email} style={{ borderBottom: "1px solid #f0eadd" }}>
                    <td style={{ padding: "8px 6px", wordBreak: "break-all" }}>{c.email}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{euro(c.balance)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{c.expiresAt ? fmtDate(c.expiresAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ambassadeurs & commissions (intégré) */}
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Ambassadeurs &amp; commissions</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: -6 }}>
          Combien chaque ambassadeur t&apos;a rapporté, et ce qu&apos;il te reste à lui verser. Tout se met à jour <strong>automatiquement</strong> à chaque commande passée avec son code. Pour créer/gérer un code : Marketing → Promotions &amp; ambassadeurs.
        </p>
        {ambassadors.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>Aucun ambassadeur pour l&apos;instant. Crée un code avec une commission dans Marketing → Promotions &amp; ambassadeurs.</p>
        ) : (
          <>
            <div style={{ ...card, background: "linear-gradient(150deg,#241a0c,#3a2c12)", border: "none", color: "#f3e8d3", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: "0.82rem", letterSpacing: 1, textTransform: "uppercase", color: "#e2c67e" }}>Total commissions à verser</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: "bold", color: "#fff" }}>{euro(totalDue)}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: 520 }}>
                <thead>
                  <tr>
                    {["Ambassadeur", "Code", "Cmd", "Ventes", "Commission", "Versé", "À verser"].map((h, i) => (
                      <th key={h} style={{ textAlign: i <= 1 ? "left" : "right", borderBottom: "2px solid #eadfc4", padding: "8px 6px", color: "var(--ink-soft)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.map((a) => (
                    <tr key={a.code} style={{ borderBottom: "1px solid #f0eadd" }}>
                      <td style={{ padding: "8px 6px" }}>{a.name}</td>
                      <td style={{ padding: "8px 6px", fontFamily: "monospace", color: "var(--gold-dark)" }}>{a.code} <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>({a.pct} %)</span></td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{a.orders}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{euro(a.sales)}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{euro(a.commTotal)}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>{euro(a.paid)}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: a.due > 0 ? "#b4452f" : "#256b34" }}>{euro(a.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 8 }}>
              Pour marquer une commission comme <strong>versée</strong> : Marketing → Promotions &amp; ambassadeurs (bouton « marquer payé »).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
