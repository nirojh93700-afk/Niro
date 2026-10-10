"use client";

import { useEffect, useState } from "react";

// Changer le mot de passe de Gestion (gérant, 10/10/2026 : « fais-le directement dans admin »).
// Le nouveau mot de passe est gardé chiffré côté serveur ; l'ancien cesse de marcher aussitôt.
export default function AdminPasswordForm({ adminKey }) {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [voir, setVoir] = useState(false);
  const [info, setInfo] = useState(null);
  const [msg, setMsg] = useState({ texte: "", ok: false });
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/password", { headers: { "x-admin-key": adminKey } });
        if (res.ok) setInfo(await res.json());
      } catch { /* ignore */ }
    })();
  }, [adminKey]);

  const date = info?.at ? new Date(info.at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  async function changer() {
    setMsg({ texte: "", ok: false });
    if (nouveau.length < 10) return setMsg({ texte: "Le nouveau mot de passe doit faire au moins 10 caractères.", ok: false });
    if (nouveau !== confirme) return setMsg({ texte: "Les deux nouveaux mots de passe ne sont pas identiques.", ok: false });
    setEnvoi(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ actuel, nouveau }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { setMsg({ texte: d.error || "Le mot de passe n'a pas été changé.", ok: false }); return; }
      try { sessionStorage.setItem("niv-admin-key", nouveau); } catch { /* ignore */ }
      setMsg({ texte: "Mot de passe changé ✓ Utilisez le nouveau dès maintenant, sur tous vos appareils.", ok: true });
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setMsg({ texte: "Connexion impossible : le mot de passe n'a pas été changé.", ok: false });
    } finally {
      setEnvoi(false);
    }
  }

  const type = voir ? "text" : "password";
  return (
    <div className="admin-block" style={{ marginTop: "1rem", display: "grid", gap: 10 }}>
      <div className="admin-row" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="admin-variant">🔒 Mot de passe de Gestion</span>
        <span style={{ fontWeight: 600, color: "var(--ink-soft)" }}>{info?.change && date ? `Changé le ${date}` : "Mot de passe d'origine"}</span>
      </div>
      <label className="admin-field">
        Mot de passe actuel
        <input type={type} value={actuel} onChange={(e) => setActuel(e.target.value)} autoComplete="current-password" />
      </label>
      <label className="admin-field">
        Nouveau mot de passe (10 caractères minimum)
        <input type={type} value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoComplete="new-password" />
      </label>
      <label className="admin-field">
        Nouveau mot de passe, une deuxième fois
        <input type={type} value={confirme} onChange={(e) => setConfirme(e.target.value)} autoComplete="new-password" />
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.9rem" }}>
        <input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} /> Afficher les mots de passe
      </label>
      <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.88rem" }}>
        Dès qu&apos;il est changé, l&apos;ancien mot de passe ne marche plus, sur aucun appareil. Notez le nouveau en lieu sûr.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-gold" onClick={changer} disabled={envoi || !actuel || !nouveau || !confirme}>
          {envoi ? "Changement…" : "Changer le mot de passe"}
        </button>
        {msg.texte ? <span style={{ fontWeight: 600, color: msg.ok ? "#256b34" : "#b4452f" }}>{msg.texte}</span> : null}
      </div>
    </div>
  );
}
