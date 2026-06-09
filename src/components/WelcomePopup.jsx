"use client";

import { useState, useEffect } from "react";

const KEY = "niv-welcome-subscribed"; // posé seulement quand la cliente s'inscrit

export default function WelcomePopup({ enabled, code, text }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!enabled) return;
    try {
      if (localStorage.getItem(KEY)) return;          // déjà inscrite → jamais
      if (sessionStorage.getItem("niv-welcome-session")) return; // déjà vue cette visite
    } catch { /* ignore */ }
    const t = setTimeout(() => {
      setShow(true);
      try { sessionStorage.setItem("niv-welcome-session", "1"); } catch { /* ignore */ }
    }, 500); // dès l'arrivée, une fois par connexion
    return () => clearTimeout(t);
  }, [enabled]);

  function close() {
    // On ferme, mais on NE marque PAS comme inscrite → ça réapparaîtra.
    setShow(false);
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Adresse e-mail invalide.");
      setDone(true);
      try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } // inscrite → ne réapparaît plus
    } catch (e2) { setErr(e2.message); }
  }

  if (!enabled || !show) return null;

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, maxWidth: 420, width: "100%", padding: "32px 26px", textAlign: "center", position: "relative", boxShadow: "0 12px 44px rgba(0,0,0,0.22)" }}>
        <button onClick={close} aria-label="Fermer" style={{ position: "absolute", top: 8, right: 14, border: 0, background: "none", fontSize: "1.5rem", cursor: "pointer", color: "#aaa" }}>×</button>

        {done ? (
          <>
            <div style={{ fontSize: "2.2rem" }}>🎁</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontWeight: "normal", color: "var(--gold-dark)", margin: "8px 0" }}>Merci !</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>Voici votre code (on vient aussi de vous l'envoyer par e-mail), à entrer au paiement :</p>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: 2, color: "var(--gold-dark)", background: "#fbf4e6", border: "1px dashed #e7d3a1", borderRadius: 10, padding: "12px", margin: "0 0 16px" }}>{code}</div>
            <button className="btn btn-gold btn-block" onClick={close}>J'en profite</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2.2rem" }}>✦</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontWeight: "normal", color: "var(--gold-dark)", margin: "8px 0" }}>Bienvenue chez Niv Création</h2>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{text}, en vous inscrivant à nos nouveautés 💌</p>
            <form onSubmit={submit}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre e-mail" style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 10, font: "inherit", textAlign: "center" }} />
              {err && <p style={{ color: "#b4452f", fontSize: "0.9rem", margin: "0 0 8px" }}>{err}</p>}
              <button type="submit" className="btn btn-gold btn-block">Recevoir mon code</button>
            </form>
            <button onClick={close} style={{ background: "none", border: 0, color: "var(--ink-soft)", cursor: "pointer", marginTop: 12, fontSize: "0.85rem", textDecoration: "underline" }}>Non merci</button>
          </>
        )}
      </div>
    </div>
  );
}
