"use client";

import { useEffect, useState, useCallback } from "react";

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

  const load = useCallback(async (k) => {
    try {
      const s = await fetch("/api/admin/settings", { headers: { "x-admin-key": k } });
      if (s.status === 401) { setAuthed(false); return; }
      const sd = (await s.json()).settings || {};
      setPct(String(sd.cashbackPercent != null ? sd.cashbackPercent : 5));
      setAuthed(true);
      const c = await fetch("/api/admin/cagnottes", { headers: { "x-admin-key": k } });
      if (c.ok) setData(await c.json());
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

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "8px 14px 60px" }}>
      <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold-dark)" }}>🎁 Fidélité &amp; cashback</h1>
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
    </div>
  );
}
