"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, birthday: birthday || undefined }),
      });
      if (!res.ok) throw new Error("Adresse invalide.");
      setDone(true);
    } catch (e2) { setErr(e2.message); }
  }

  return (
    <div style={{ textAlign: "center", padding: "8px 0 26px", borderBottom: "1px solid rgba(255,255,255,0.12)", marginBottom: 26 }}>
      <h4 style={{ margin: "0 0 6px" }}>Restez informé ✦</h4>
      <p style={{ margin: "0 0 12px", opacity: 0.85, fontSize: "0.9rem" }}>
        Nouveautés, offres et inspirations — directement par e-mail.
      </p>
      {done ? (
        <p style={{ margin: 0, color: "#dcc88f" }}>Merci, votre inscription est bien prise en compte ✦</p>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre e-mail"
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", color: "#fff", minWidth: 220 }}
          />
          <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", fontSize: "0.72rem", opacity: 0.8 }}>
            <span style={{ marginBottom: 2 }}>Anniversaire (facultatif) — pour une surprise</span>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", color: "#fff" }}
            />
          </label>
          <button type="submit" className="btn btn-gold" style={{ padding: "10px 20px" }}>S'inscrire</button>
        </form>
      )}
      {err && <p style={{ color: "#e7a", fontSize: "0.85rem", margin: "8px 0 0" }}>{err}</p>}
    </div>
  );
}
