"use client";

// =============================================================================
// BOÎTE MAIL (agent) — réservé admin. Connecte le vrai Gmail, lit les messages
// de clientes (pubs/spam exclus), prépare un brouillon de réponse avec l'agent,
// et n'envoie QU'APRÈS validation manuelle.
// =============================================================================
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";

const fmtDate = (d) => { try { return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return d; } };

export default function BoiteMailPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Connexion (flux « Connecter avec Google »)
  const [cid, setCid] = useState(""); const [csec, setCsec] = useState("");
  const REDIRECT_URI = (typeof window !== "undefined" ? window.location.origin : "https://nivcreation.fr") + "/api/admin/gmail/callback";

  // Boîte
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(null); // message ouvert
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");

  const hdr = (k) => ({ "x-admin-key": k });

  const load = useCallback(async (adminKey) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/gmail?action=status", { headers: hdr(adminKey) });
      if (!res.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      const j = await res.json();
      setConnected(j.connected);
      if (j.connected) loadInbox(adminKey);
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  async function loadInbox(adminKey = key) {
    setBusy("inbox"); setError("");
    try {
      const res = await fetch("/api/admin/gmail?action=inbox", { headers: hdr(adminKey) });
      const j = await res.json();
      if (!res.ok) setError(j.error || "Lecture impossible.");
      else setMessages(j.messages || []);
    } catch { setError("Erreur réseau."); }
    setBusy("");
  }

  useEffect(() => {
    const s = sessionStorage.getItem("niv-admin-key"); if (s) { setKey(s); load(s); }
    // Retour de Google après « Connecter avec Google »
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("connected")) setMsg("Gmail connecté ✓");
      if (p.get("error")) setError("Connexion Google : " + p.get("error"));
      if (p.get("connected") || p.get("error")) window.history.replaceState({}, "", "/gestion/boite-mail");
    } catch { /* ignore */ }
  }, [load]);

  async function connectGoogle() {
    setMsg(""); setError(""); setBusy("save");
    try {
      const res = await fetch("/api/admin/gmail", { method: "POST", headers: { "Content-Type": "application/json", ...hdr(key) }, body: JSON.stringify({ action: "authUrl", clientId: cid.trim(), clientSecret: csec.trim() }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Échec."); setBusy(""); return; }
      window.location.href = j.url; // redirection vers Google (affiche « Niv Mail »)
    } catch { setError("Erreur réseau."); setBusy(""); }
  }

  async function openMessage(m) {
    setOpen({ ...m, body: "" }); setDraft(""); setBusy("open");
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, unread: false } : x))); // marqué lu tout de suite
    try {
      const res = await fetch(`/api/admin/gmail?action=message&id=${m.id}`, { headers: hdr(key) });
      const j = await res.json();
      if (res.ok && j.message) setOpen(j.message);
    } catch { /* ignore */ }
    setBusy("");
  }

  async function prepareDraft() {
    if (!open) return;
    setBusy("draft"); setDraft("");
    try {
      const res = await fetch("/api/admin/gmail", { method: "POST", headers: { "Content-Type": "application/json", ...hdr(key) }, body: JSON.stringify({ action: "draft", fromName: open.fromName, subject: open.subject, body: open.body }) });
      const j = await res.json();
      if (res.ok) setDraft(j.draft || ""); else setError(j.error || "Brouillon impossible.");
    } catch { setError("Erreur réseau."); }
    setBusy("");
  }

  async function sendReply() {
    if (!open || !draft.trim()) return;
    if (!confirm("Envoyer cette réponse à " + open.fromEmail + " ?")) return;
    setBusy("send");
    try {
      const res = await fetch("/api/admin/gmail", { method: "POST", headers: { "Content-Type": "application/json", ...hdr(key) }, body: JSON.stringify({ action: "send", to: open.fromEmail, subject: open.subject, text: draft, threadId: open.threadId, messageId: open.messageId, references: open.references }) });
      const j = await res.json();
      if (res.ok) { setMsg("Réponse envoyée ✓"); setOpen(null); setDraft(""); }
      else setError(j.error || "Envoi impossible.");
    } catch { setError("Erreur réseau."); }
    setBusy("");
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "40px 16px" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Boîte mail (agent)</h1>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Mot de passe admin" onKeyDown={(e) => e.key === "Enter" && load(key)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        {error ? <p style={{ color: "#b3261e" }}>{error}</p> : null}
        <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={() => load(key)} disabled={loading}>Entrer</button>
        <p style={{ marginTop: 16 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour</Link></p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "24px 16px 60px", maxWidth: 760 }}>
      <PageHead eyebrow="Clients" title="Boîte mail" subtitle="L'agent lit tes e-mails et prépare un brouillon ; rien ne part sans ton clic." />
      {error ? <p style={{ color: "#b3261e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#256b34" }}>{msg}</p> : null}

      {!connected ? (
        <div className="admin-block">
          <h3 style={{ marginTop: 0 }}>Connecter ton Gmail (1 clic)</h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", margin: "0 0 6px" }}>
            <strong>Avant :</strong> dans Google Cloud → Identifiants → client « Niv Mail » → <strong>URI de redirection autorisés</strong>, ajoute exactement cette adresse :
          </p>
          <code style={{ display: "block", background: "#faf7f0", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: "0.78rem", wordBreak: "break-all", marginBottom: 14 }}>{REDIRECT_URI}</code>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", margin: "0 0 6px" }}>Puis colle juste tes 2 codes et clique le bouton (Google affichera « Niv Mail » et créera le token tout seul) :</p>
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Client ID</label>
          <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="619…apps.googleusercontent.com" style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, marginBottom: 10, font: "inherit" }} />
          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Client secret</label>
          <input value={csec} onChange={(e) => setCsec(e.target.value)} placeholder="GOCSPX-…" style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, marginBottom: 12, font: "inherit" }} />
          <button className="btn btn-gold" onClick={connectGoogle} disabled={busy === "save"}>{busy === "save" ? "Redirection…" : "Connecter avec Google"}</button>
        </div>
      ) : open ? (
        <div className="admin-block">
          <button className="filter-chip" style={{ padding: "4px 12px", marginBottom: 12 }} onClick={() => { setOpen(null); setDraft(""); }}>← Retour à la boîte</button>
          <p style={{ margin: "0 0 2px" }}><strong>{open.fromName}</strong> <span style={{ color: "var(--ink-soft)" }}>&lt;{open.fromEmail}&gt;</span></p>
          <p style={{ margin: "0 0 2px", fontWeight: 600 }}>{open.subject}</p>
          <p style={{ margin: "0 0 10px", color: "var(--ink-soft)", fontSize: "0.8rem" }}>{fmtDate(open.date)}</p>
          <div style={{ background: "#faf7f0", border: "1px solid var(--line)", borderRadius: 8, padding: 12, whiteSpace: "pre-wrap", fontSize: "0.9rem", maxHeight: 260, overflow: "auto" }}>
            {busy === "open" ? "Chargement…" : (open.body || open.snippet)}
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-gold" onClick={prepareDraft} disabled={busy === "draft"}>{busy === "draft" ? "L'agent rédige…" : "🤖 Préparer une réponse"}</button>
          </div>
          {draft ? (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Brouillon (modifie librement avant d'envoyer)</label>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 8, font: "inherit", marginTop: 6 }} />
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn btn-gold" onClick={sendReply} disabled={busy === "send"}>{busy === "send" ? "Envoi…" : "Envoyer la réponse"}</button>
                <button className="btn" style={{ border: "1px solid var(--line)" }} onClick={() => setDraft("")}>Effacer</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
            <button className="filter-chip" style={{ padding: "4px 14px" }} onClick={() => loadInbox()} disabled={busy === "inbox"}>{busy === "inbox" ? "Chargement…" : "↻ Actualiser"}</button>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Pubs, newsletters et spam exclus automatiquement.</span>
          </div>
          {messages.length === 0 ? (
            <div className="admin-block"><p style={{ margin: 0 }}>{busy === "inbox" ? "Chargement…" : "Aucun message de cliente récent."}</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map((m) => (
                <button key={m.id} onClick={() => openMessage(m)} style={{ textAlign: "left", background: m.unread ? "#fffdf6" : "#fff", border: m.unread ? "1px solid #e7d3a1" : "1px solid var(--line)", borderRadius: 10, padding: 12, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                      {m.unread ? <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} /> : null}
                      <strong style={{ fontSize: "0.92rem", fontWeight: m.unread ? 800 : 600 }}>{m.fromName}</strong>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                      {m.unread ? <span style={{ fontSize: "0.62rem", background: "var(--gold)", color: "#fff", borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>Nouveau</span> : <span style={{ fontSize: "0.66rem", color: "var(--ink-soft)" }}>lu</span>}
                      <span style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>{fmtDate(m.date)}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: m.unread ? 700 : 500 }}>{m.subject || "(sans objet)"}</div>
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.snippet}</div>
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <button className="filter-chip" style={{ padding: "4px 12px" }} onClick={async () => { if (confirm("Déconnecter Gmail ?")) { await fetch("/api/admin/gmail", { method: "POST", headers: { "Content-Type": "application/json", ...hdr(key) }, body: JSON.stringify({ action: "disconnect" }) }); setConnected(false); setMessages([]); } }}>Déconnecter Gmail</button>
          </div>
        </>
      )}
    </div>
  );
}
