"use client";

import { useState } from "react";

// Connexion à l'espace client par « lien magique » (sans mot de passe).
export default function EspaceLogin({ error }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();
    setMsg("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMsg("Entrez une adresse e-mail valide."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/espace/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      if (res.ok) setSent(true); else setMsg("Une erreur est survenue, réessayez.");
    } catch { setMsg("Une erreur est survenue, réessayez."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 460, margin: "40px auto", padding: "0 16px", textAlign: "center" }}>
      <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold-dark, #a98935)", fontWeight: "normal" }}>Mon espace</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: -4 }}>Suivez vos commandes et votre cagnotte fidélité.</p>

      {error === "lien" && !sent && (
        <div className="notice" style={{ marginBottom: 14 }}>Ce lien a expiré ou a déjà été utilisé. Redemandez-en un ci-dessous.</div>
      )}

      {sent ? (
        <div style={{ background: "#e8f3ea", border: "1px solid #b9dcc0", borderRadius: 12, padding: 18, color: "#256b34" }}>
          <strong>C'est envoyé ! 💌</strong>
          <p style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>Ouvrez votre boîte mail et cliquez sur le lien pour accéder à votre espace (valable 20 min). Pensez à regarder les spams.</p>
        </div>
      ) : (
        <form onSubmit={send} style={{ background: "#fff", border: "1px solid var(--line, #e6d7b8)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginTop: 0 }}>Entrez votre e-mail : on vous envoie un lien de connexion, sans mot de passe.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com"
            style={{ width: "100%", padding: 12, border: "1px solid var(--line, #ddd)", borderRadius: 10, font: "inherit", marginBottom: 10 }} />
          <button type="submit" className="btn btn-gold" style={{ width: "100%", padding: 12 }} disabled={loading}>
            {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
          {msg && <div style={{ color: "#b4452f", fontSize: "0.85rem", marginTop: 8 }}>{msg}</div>}
        </form>
      )}
    </div>
  );
}
