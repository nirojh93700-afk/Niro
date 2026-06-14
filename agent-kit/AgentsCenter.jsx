"use client";

// Centre des agents — KIT PORTABLE (interface).
// Placement (Next.js App Router) : src/app/admin/agents/page.jsx (ou ta page admin).
//
// >>> À ADAPTER : la clé admin. Ici on lit sessionStorage["admin-key"] et on
//     l'envoie en en-tête x-admin-key (cohérent avec api-agents-route.js).
//     Adapte le nom de la clé / le mode d'auth à ton app.

import { useState, useEffect, useRef, useCallback } from "react";

export default function AgentsCenter() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async (k) => {
    try {
      const res = await fetch("/api/admin/agents", { headers: { "x-admin-key": k } });
      if (res.status === 401) { setErr("Mot de passe incorrect."); return false; }
      const d = await res.json();
      setAgents(Array.isArray(d.agents) ? d.agents : []);
      setAuthed(true); setKey(k); setErr("");
      sessionStorage.setItem("admin-key", k);
      return true;
    } catch { setErr("Erreur de connexion."); return false; }
  }, []);

  useEffect(() => {
    const k = sessionStorage.getItem("admin-key");
    (async () => { if (k) await load(k); setChecking(false); })();
  }, [load]);

  if (checking) return <p style={{ padding: 24 }}>Chargement…</p>;

  if (!authed) {
    return (
      <div style={{ maxWidth: 380, margin: "40px auto", padding: 24 }}>
        <h1>Centre des agents</h1>
        <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(keyInput.trim())} placeholder="Mot de passe admin"
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc" }} />
        {err && <p style={{ color: "#b00020" }}>{err}</p>}
        <button onClick={() => load(keyInput.trim())} style={{ marginTop: 12, padding: "10px 18px" }}>Entrer</button>
      </div>
    );
  }

  const open = selected ? agents.find((a) => a.id === selected) : null;

  if (open) {
    return (
      <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
        <button onClick={() => setSelected(null)} style={{ marginBottom: 16 }}>← Retour</button>
        <h2>{open.emoji} {open.name}</h2>
        <p style={{ color: "#666" }}>{open.blurb}</p>
        <Workspace agent={open} adminKey={key} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Mon équipe d'agents</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginTop: 16 }}>
        {agents.map((a) => (
          <button key={a.id} onClick={() => setSelected(a.id)}
            style={{ textAlign: "left", border: "1px solid #ddd", borderRadius: 12, padding: 16, cursor: "pointer", background: "#fff" }}>
            <div style={{ fontSize: 24 }}>{a.emoji}</div>
            <strong>{a.name}</strong>
            <div style={{ color: "#666", fontSize: 14, marginTop: 6 }}>{a.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Workspace({ agent, adminKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send() {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: t }];
    setMessages(next); setBusy(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ agent: agent.id, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const d = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: d.reply || d.error || "…" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erreur de connexion." }]);
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14, minHeight: 280, maxHeight: 460, overflowY: "auto" }}>
        {messages.length === 0 && <p style={{ color: "#888" }}>{agent.placeholder}</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "10px 0", textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{ display: "inline-block", maxWidth: "85%", padding: "9px 13px", borderRadius: 12,
              background: m.role === "user" ? "#a98935" : "#f3efe6", color: m.role === "user" ? "#fff" : "#222",
              whiteSpace: "pre-wrap", textAlign: "left" }}>{m.content}</span>
          </div>
        ))}
        {busy && <p style={{ color: "#888", fontStyle: "italic" }}>{agent.name} réfléchit…</p>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={agent.placeholder} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ccc" }} />
        <button onClick={send} disabled={busy} style={{ padding: "10px 18px" }}>Envoyer</button>
      </div>
    </div>
  );
}
