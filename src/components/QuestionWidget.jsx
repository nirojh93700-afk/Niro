"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

// Bouton flottant « Une question ? » : un formulaire court, envoyé par le même
// canal que la page Contact (/api/contact). La réponse est PRÉPARÉE par l'agent
// et VALIDÉE par le gérant avant d'être envoyée — jamais automatique.
// Masqué dans la gestion, le tunnel de commande et les pages privées.
export default function QuestionWidget() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [error, setError] = useState("");
  const hidden = ["/gestion", "/panier", "/paiement", "/merci", "/repondre", "/suivi", "/espace"].some((p) => pathname.startsWith(p));
  if (hidden) return null;

  async function submit(e) {
    e.preventDefault();
    const f = e.currentTarget;
    setStatus("sending"); setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.value.trim(), email: f.email.value.trim(), phone: "",
          subject: "Question depuis le site", message: f.message.value.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Envoi impossible.");
      setStatus("ok"); f.reset();
    } catch (err) { setError(err.message); setStatus("error"); }
  }

  const field = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--line, #dcd2bf)", borderRadius: 9, font: "inherit", fontSize: "0.95rem", background: "#fff" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Poser une question"
        style={{
          position: "fixed", bottom: 20, left: 20, zIndex: 60,
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 18px", borderRadius: 999, cursor: "pointer",
          background: "#fff", color: "var(--ink, #241a0c)", border: "1px solid var(--gold, #c9a24b)",
          fontWeight: 600, fontSize: "0.95rem", font: "inherit",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        }}
      >
        💬 Une question ?
      </button>

      {open && (
        <div
          role="dialog" aria-label="Poser une question"
          style={{
            position: "fixed", bottom: 74, left: 16, zIndex: 61, width: "min(360px, calc(100vw - 32px))",
            background: "#fff", border: "1px solid var(--line, #ece3d2)", borderRadius: 16,
            boxShadow: "0 12px 34px rgba(0,0,0,0.22)", padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong style={{ fontFamily: "Georgia, serif", fontWeight: "normal", fontSize: "1.15rem", color: "var(--gold, #a98935)" }}>Une question ?</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#7a7268" }}>×</button>
          </div>
          {status === "ok" ? (
            <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
              Merci ! Votre question est bien arrivée à l&apos;atelier. <strong>Nous vous répondons personnellement</strong>, par e-mail, dès que possible.
            </p>
          ) : (
            <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.85rem", color: "#7a7268" }}>Délai, gravure, taille, livraison… écrivez-nous, une vraie personne vous répond.</p>
              <input name="name" required placeholder="Votre prénom" style={field} autoComplete="given-name" />
              <input name="email" type="email" required placeholder="Votre e-mail" style={field} autoComplete="email" />
              <textarea name="message" required placeholder="Votre question" style={{ ...field, minHeight: 90 }} />
              {error ? <div style={{ color: "#8a2a1f", fontSize: "0.85rem" }}>{error}</div> : null}
              <button type="submit" disabled={status === "sending"} style={{ padding: "11px 16px", borderRadius: 9, border: "none", background: "var(--gold, #c9a24b)", color: "#fff", fontWeight: 700, cursor: "pointer", font: "inherit" }}>
                {status === "sending" ? "Envoi…" : "Envoyer ma question"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
