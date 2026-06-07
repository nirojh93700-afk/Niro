"use client";

import { useState, useEffect } from "react";

export default function NewsletterAdmin({ adminKey }) {
  const [count, setCount] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/newsletter", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, [adminKey]);

  async function send() {
    setMsg("");
    if (!subject.trim() || !message.trim()) { setMsg("Sujet et message obligatoires."); return; }
    if (!window.confirm(`Envoyer cette newsletter à ${count} abonnée(s) ?`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ subject, message }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Échec de l'envoi.");
      setMsg(`✓ Envoyée à ${d.sent}/${d.total} abonnée(s).`);
      setSubject(""); setMessage("");
    } catch (e) { setMsg(e.message); }
    finally { setSending(false); }
  }

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Envoie une newsletter (nouveautés, promos…) à tes abonnées, avec ton e-mail du site (à ton image).
        {count !== null && <> Actuellement : <strong>{count} abonnée{count > 1 ? "s" : ""}</strong>.</>}
      </p>
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <label className="admin-field">Sujet
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Nouveautés de la saison ✦" />
        </label>
        <label className="admin-field">Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Écris ton message ici…" style={{ minHeight: 160 }} />
        </label>
        <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={send} disabled={sending || !count}>
          {sending ? "Envoi en cours…" : `Envoyer à ${count ?? 0} abonnée(s)`}
        </button>
        {msg && <div className="notice" style={{ margin: 0 }}>{msg}</div>}
      </div>
    </>
  );
}
