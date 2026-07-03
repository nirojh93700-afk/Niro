"use client";

import { useEffect, useState } from "react";

// Saisie des clés API Boxtal (point relais), rangée avec les autres intégrations
// dans Gestion → Réglages. Les clés sont stockées côté serveur, masquées,
// jamais réaffichées ni exposées au public.
export default function BoxtalKeys({ adminKey }) {
  const [appId, setAppId] = useState("");
  const [secret, setSecret] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
        if (res.ok) {
          const b = (await res.json()).settings?.boxtal;
          if (b) { setAppId(b.appId || ""); setHasSecret(!!b.hasSecret); }
        }
      } catch { /* ignore */ }
    })();
  }, [adminKey]);

  async function save() {
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ boxtal: { appId, ...(secret ? { appSecret: secret } : {}) } }),
      });
      if (res.ok) {
        const b = (await res.json()).settings?.boxtal;
        if (b) { setHasSecret(!!b.hasSecret); setAppId(b.appId || ""); }
        setSecret("");
        setMsg("Clés Boxtal enregistrées ✓");
      } else setMsg("Échec de l'enregistrement.");
    } catch { setMsg("Échec de l'enregistrement."); }
    finally { setSaving(false); }
  }

  return (
    <div className="admin-block" style={{ marginTop: "1rem", display: "grid", gap: 10 }}>
      <div className="admin-row" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="admin-variant">📍 Point relais Boxtal (clés API)</span>
        <span style={{ fontWeight: 600, color: (appId && hasSecret) ? "#256b34" : "#b4452f" }}>
          {(appId && hasSecret) ? "Configuré" : "À configurer"}
        </span>
      </div>
      <label className="admin-field">
        Identifiant (App ID)
        <input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Colle ton App ID Boxtal" autoComplete="off" />
      </label>
      <label className="admin-field">
        Clé secrète {hasSecret && <span style={{ color: "#256b34", fontWeight: 600 }}>· déjà enregistrée ✓</span>}
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
          placeholder={hasSecret ? "•••••••• (laisse vide pour ne pas changer)" : "Colle ta clé secrète Boxtal"} autoComplete="new-password" />
      </label>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-gold" onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "💾 Enregistrer les clés Boxtal"}
        </button>
        {msg && <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{msg}</span>}
      </div>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
        🔒 Stockées en sécurité, jamais réaffichées. L'activation et le prix du point relais se règlent dans <strong>Gestion → Livraison</strong>.
      </p>
    </div>
  );
}
