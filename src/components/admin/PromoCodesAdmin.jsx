"use client";

import { useState, useEffect, useCallback } from "react";

export default function PromoCodesAdmin({ adminKey }) {
  const [codes, setCodes] = useState({});
  const [stats, setStats] = useState({});
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [ambassador, setAmbassador] = useState("");
  const [commission, setCommission] = useState("");
  const [reusable, setReusable] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo-codes", { headers: { "x-admin-key": adminKey } });
      if (res.ok) { const d = await res.json(); setCodes(d.codes || {}); setStats(d.stats || {}); }
    } catch { /* ignore */ }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    setMsg("");
    if (!code.trim() || !(Number(value) > 0)) { setMsg("Code et réduction obligatoires."); return; }
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        code: code.trim(), type, value: Number(value),
        ambassador: ambassador.trim(), commission: Number(commission) || 0,
        reusable: reusable || Number(commission) > 0, // un code ambassadeur est réutilisable
      }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error || "Erreur."); return; }
    setCodes(d.codes || {}); setStats(d.stats || {});
    setCode(""); setValue(""); setAmbassador(""); setCommission(""); setReusable(false);
    setMsg("✓ Code enregistré.");
  }

  async function del(c) {
    if (!window.confirm(`Supprimer le code ${c} ?`)) return;
    const res = await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ code: c }),
    });
    if (res.ok) { const d = await res.json(); setCodes(d.codes || {}); }
  }

  async function markPaid(c, amount) {
    if (!window.confirm(`Marquer ${amount.toFixed(2)} € comme VERSÉ à ${c} ? (remet « à verser » à 0)`)) return;
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "markPaid", code: c, paid: amount }),
    });
    if (res.ok) { const d = await res.json(); setStats(d.stats || {}); }
  }

  const list = Object.entries(codes);
  const ambassadeurs = list.filter(([, d]) => Number(d.commission) > 0);
  const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
  function refLink(c) {
    const base = (typeof window !== "undefined" && window.location?.origin) || "https://nivcreation.fr";
    return `${base}/?ref=${encodeURIComponent(c)}`;
  }
  function copyLink(c) {
    const url = refLink(c);
    try { navigator.clipboard.writeText(url); } catch { /* ignore */ }
    window.prompt("Lien de l'ambassadeur (copié) — partage-le :", url);
  }

  return (
    <div className="admin-block" style={{ display: "grid", gap: 12, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
      <h3 style={{ margin: 0 }}>🎟️ Codes promo & ambassadeurs</h3>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
        Crée un code classique (réduction) OU un code <strong>ambassadeur</strong> : mets un nom + une commission (%). Le code ambassadeur est <strong>réutilisable</strong> par plusieurs clients, et sa commission se calcule toute seule à chaque vente.
      </p>

      {/* Formulaire */}
      <div style={{ display: "grid", gap: 8, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE (ex. MARIE10)" style={{ padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", textTransform: "uppercase", width: 170 }} />
          <label style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>Réduction client :</label>
          <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="ex. 10" style={{ width: 80, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8 }}>
            <option value="percent">%</option>
            <option value="fixed">€</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={ambassador} onChange={(e) => setAmbassador(e.target.value)} placeholder="Ambassadeur (nom) — facultatif" style={{ padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", width: 240 }} />
          <label style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>Commission :</label>
          <input type="number" min="0" max="100" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="ex. 10" style={{ width: 80, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
          <span style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>%</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".82rem" }}>
            <input type="checkbox" checked={reusable} onChange={(e) => setReusable(e.target.checked)} style={{ width: "auto" }} />
            Réutilisable (plusieurs clients)
          </label>
          <button className="btn btn-gold" style={{ padding: "8px 16px", marginLeft: "auto" }} onClick={add}>Ajouter / Modifier</button>
        </div>
        <p style={{ margin: 0, fontSize: ".78rem", color: "var(--ink-soft)" }}>Astuce : dès qu'une commission &gt; 0 est mise, le code devient automatiquement réutilisable (code ambassadeur).</p>
      </div>
      {msg && <p style={{ margin: 0, fontSize: "0.85rem", color: msg.startsWith("✓") ? "#256b34" : "#b4452f" }}>{msg}</p>}

      {/* TABLEAU AMBASSADEURS */}
      {ambassadeurs.length > 0 && (
        <div>
          <h4 style={{ margin: "4px 0 6px", color: "var(--gold-dark, #a98935)" }}>Ambassadeurs — commissions</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem", background: "#fff" }}>
              <thead>
                <tr style={{ background: "#faf6ef", color: "var(--gold-dark, #a98935)" }}>
                  {["Code", "Ambassadeur", "Réduc. client", "Commission", "Commandes", "Ventes", "Commission due", "Versé", "À verser", ""].map((h) => (
                    <th key={h} style={{ border: "1px solid var(--line)", padding: "6px 8px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ambassadeurs.map(([c, def]) => {
                  const s = stats[c] || { orders: 0, sales: 0, commission: 0, paid: 0 };
                  const due = Math.max(0, Math.round((s.commission - (s.paid || 0)) * 100) / 100);
                  return (
                    <tr key={c}>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px", fontWeight: 700 }}>{c}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px" }}>{def.ambassador || "—"}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px" }}>{def.type === "fixed" ? `−${def.value} €` : `−${def.value} %`}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px" }}>{def.commission} %</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px", textAlign: "center" }}>{s.orders || 0}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px" }}>{eur(s.sales)}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px" }}>{eur(s.commission)}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px" }}>{eur(s.paid)}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px", fontWeight: 700, color: due > 0 ? "#b4452f" : "#256b34" }}>{eur(due)}</td>
                      <td style={{ border: "1px solid var(--line)", padding: "6px 8px", whiteSpace: "nowrap" }}>
                        <button className="btn btn-outline" style={{ padding: "3px 8px", fontSize: ".75rem" }} onClick={() => copyLink(c)}>Copier le lien</button>
                        {due > 0 && <button className="btn btn-outline" style={{ padding: "3px 8px", fontSize: ".75rem", marginLeft: 6 }} onClick={() => markPaid(c, s.commission)}>Marquer versé</button>}
                        <button className="btn btn-outline" style={{ padding: "3px 8px", fontSize: ".75rem", color: "#b4452f", borderColor: "#e7b7ad", marginLeft: 6 }} onClick={() => del(c)}>Suppr.</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Liens d'affiliation à partager (comme Amazon) */}
          <div style={{ marginTop: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--gold-dark, #a98935)", marginBottom: 6 }}>🔗 Liens à partager — chaque ambassadeur envoie SON lien</div>
            <p style={{ fontSize: ".78rem", color: "var(--ink-soft)", margin: "0 0 8px" }}>Le client clique sur le lien → le code s'applique tout seul au paiement, et la commission de l'ambassadeur est comptée (valable 30 jours).</p>
            {ambassadeurs.map(([c, def]) => (
              <div key={c} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "5px 0", borderTop: "1px solid var(--line)" }}>
                <b style={{ minWidth: 100, fontSize: ".85rem" }}>{def.ambassador || c}</b>
                <code style={{ background: "#faf6ef", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px", flex: 1, minWidth: 180, fontSize: ".8rem", wordBreak: "break-all" }}>{refLink(c)}</code>
                <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: ".8rem" }} onClick={() => copyLink(c)}>Copier</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CODES CLASSIQUES (sans commission) */}
      {list.filter(([, d]) => !(Number(d.commission) > 0)).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <h4 style={{ margin: "4px 0 6px", color: "var(--gold-dark, #a98935)" }}>Codes promo classiques</h4>
          {list.filter(([, d]) => !(Number(d.commission) > 0)).map(([c, def]) => (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
              <span><strong>{c}</strong> — {def.type === "fixed" ? `−${def.value} €` : `−${def.value} %`}{def.reusable ? " · réutilisable" : ""}</span>
              <button className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => del(c)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
