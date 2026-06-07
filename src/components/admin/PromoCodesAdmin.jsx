"use client";

import { useState, useEffect, useCallback } from "react";

export default function PromoCodesAdmin({ adminKey }) {
  const [codes, setCodes] = useState({});
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo-codes", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setCodes((await res.json()).codes || {});
    } catch { /* ignore */ }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    setMsg("");
    if (!code.trim() || !(Number(value) > 0)) { setMsg("Code et valeur obligatoires."); return; }
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ code: code.trim(), type, value: Number(value) }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error || "Erreur."); return; }
    setCodes(d.codes || {});
    setCode(""); setValue("");
    setMsg("✓ Code enregistré.");
  }

  async function del(c) {
    if (!window.confirm(`Supprimer le code ${c} ?`)) return;
    const res = await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ code: c }),
    });
    if (res.ok) setCodes((await res.json()).codes || {});
  }

  const list = Object.entries(codes);

  return (
    <div className="admin-block" style={{ display: "grid", gap: 10, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
      <h3 style={{ margin: 0 }}>🎟️ Codes promo (gérés ici, sans Stripe)</h3>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
        Crée tes codes ici → ils réduisent automatiquement au paiement. Chaque code n'est utilisable qu'<strong>une seule fois par cliente</strong> (IP + e-mail).
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE (ex. BIENVENUE10)" style={{ padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", textTransform: "uppercase" }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8 }}>
          <option value="percent">%</option>
          <option value="fixed">€</option>
        </select>
        <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valeur" style={{ width: 90, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        <button className="btn btn-gold" style={{ padding: "8px 16px" }} onClick={add}>Ajouter</button>
      </div>
      {msg && <p style={{ margin: 0, fontSize: "0.85rem", color: msg.startsWith("✓") ? "#256b34" : "#b4452f" }}>{msg}</p>}

      {list.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {list.map(([c, def]) => (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
              <span><strong>{c}</strong> — {def.type === "fixed" ? `−${def.value} €` : `−${def.value} %`}</span>
              <button className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => del(c)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
