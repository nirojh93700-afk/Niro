"use client";

import { useState, useRef, useEffect } from "react";

// =============================================================================
// ÉQUIPE D'AGENTS — interface unique pour piloter les agents IA de la boutique.
// Le chef est sélectionné par défaut : il comprend et délègue au bon agent.
// Pour un brouillon d'e-mail, la gérante relit, modifie, puis envoie ou copie.
// =============================================================================
export default function AgentsAdmin({ adminKey }) {
  const [agents, setAgents] = useState([]);
  const [current, setCurrent] = useState("chef");
  const [messages, setMessages] = useState([]); // {role, content, action?, done?}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    fetch("/api/admin/agents", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.agents)) setAgents(d.agents); })
      .catch(() => {});
  }, [adminKey]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const active = agents.find((a) => a.id === current);

  function switchAgent(id) {
    setCurrent(id);
    setMessages([]);
    setInput("");
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ agent: current, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const d = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: d.reply || d.error || "…", action: d.action || null }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erreur de connexion, réessaie." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Ton équipe d'agents IA. Parle au <strong>Chef</strong> : il comprend ta demande et la confie au bon agent.
        Tu peux aussi choisir un agent directement. Rien n'est envoyé sans ta validation.
      </p>

      {/* Sélecteur d'agents */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => switchAgent(a.id)}
            className={`btn ${current === a.id ? "btn-gold" : "btn-outline"}`}
            style={{ padding: "8px 14px" }}
            title={a.blurb}
          >
            {a.emoji ? a.emoji + " " : ""}{a.name}
          </button>
        ))}
      </div>

      {active?.blurb && (
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 0 }}>{active.blurb}</p>
      )}

      <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14, minHeight: 280, maxHeight: 480, overflowY: "auto", background: "var(--paper)" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>
            {active?.placeholder || "Écris ta première demande ci-dessous…"}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "10px 0", textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{
              display: "inline-block", maxWidth: "85%", padding: "9px 13px", borderRadius: 12,
              background: m.role === "user" ? "var(--gold)" : "var(--cream)",
              color: m.role === "user" ? "#fff" : "var(--ink)", whiteSpace: "pre-wrap", textAlign: "left",
            }}>
              {m.content}
            </div>

            {m.action?.kind === "email_draft" && !m.done && (
              <EmailDraft
                draft={m.action}
                adminKey={adminKey}
                onSent={(label) => setMessages((arr) => arr.map((msg, j) => (j === i ? { ...msg, done: label } : msg)))}
              />
            )}
            {m.done && <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#256b34" }}>{m.done}</div>}
          </div>
        ))}
        {busy && <div style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>L'agent réfléchit…</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={active?.placeholder || "Ta demande…"}
          style={{ flex: 1, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
        />
        <button className="btn btn-gold" onClick={send} disabled={busy}>Envoyer</button>
      </div>
    </div>
  );
}

// Brouillon d'e-mail éditable : la gérante relit, ajuste, puis envoie ou copie.
function EmailDraft({ draft, adminKey, onSent }) {
  const [to, setTo] = useState(draft.to || "");
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());

  async function sendEmail() {
    if (!validEmail || sending) return;
    setSending(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/send-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ to: to.trim(), subject, message: body }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) onSent(`E-mail envoyé à ${to.trim()} ✓`);
      else setErr(d.error || "Échec de l'envoi.");
    } catch {
      setErr("Erreur de connexion.");
    } finally {
      setSending(false);
    }
  }

  function copyAll() {
    navigator.clipboard?.writeText(`Objet : ${subject}\n\n${body}`).then(
      () => onSent("Brouillon copié ✓"),
      () => setErr("Copie impossible."),
    );
  }

  return (
    <div style={{ marginTop: 8, border: "1px solid var(--gold)", borderRadius: 12, padding: 12, background: "#fffdf7", maxWidth: "100%" }}>
      <strong style={{ fontSize: "0.9rem" }}>Brouillon de réponse</strong>
      {draft.note && <div style={{ fontSize: "0.82rem", color: "#9a6b00", margin: "6px 0" }}>Note : {draft.note}</div>}

      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Destinataire</label>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="adresse@email.fr"
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />

      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Objet</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />

      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Message</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", resize: "vertical" }} />

      {err && <div style={{ color: "#b00020", fontSize: "0.85rem", marginTop: 6 }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="btn btn-gold" disabled={!validEmail || sending} onClick={sendEmail}>
          {sending ? "Envoi…" : "Envoyer l'e-mail"}
        </button>
        <button className="btn btn-outline" onClick={copyAll}>Copier</button>
      </div>
      {!validEmail && <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 6 }}>Renseigne une adresse valide pour pouvoir envoyer (ou utilise « Copier »).</div>}
    </div>
  );
}
