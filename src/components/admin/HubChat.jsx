"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { applyCatalogAction } from "./applyCatalogActions";

// FIL UNIFIÉ — un seul endroit pour parler à l'assistant et aux agents.
// Le gérant écrit en français ; l'aiguilleur envoie au bon endroit ; tout ce
// qui revient (changement de catalogue, brouillon d'e-mail) attend SON clic.
const CHIPS = [
  { t: "📬 Réponses à valider", q: "Qu'est-ce que j'ai à valider ?" },
  { t: "📊 Bilan de la semaine", q: "Fais le bilan de la semaine." },
  { t: "✉️ Répondre à une cliente", q: "Réponds à cette cliente : " , fill: true },
  { t: "🏷️ Changer un prix", q: "Change le prix de ", fill: true },
  { t: "📣 Newsletter", q: "Prépare une newsletter pour mes abonnées." },
  { t: "🎨 Post Instagram", q: "Propose-moi un post Instagram pour cette semaine." },
  { t: "🛠️ Vérifie le catalogue", q: "Vérifie le catalogue et dis-moi s'il y a des problèmes." },
];

export default function HubChat({ adminKey, onReload }) {
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);
  const H = { "x-admin-key": adminKey };

  const load = useCallback(async () => {
    try {
      const [h, p] = await Promise.all([
        fetch("/api/admin/hub", { headers: H }).then((r) => r.json()),
        fetch("/api/admin/pending-replies", { headers: H }).then((r) => r.json()),
      ]);
      setHistory(h.history || []);
      setPending(p.pending || []);
    } catch { /* ignore */ }
    finally { setLoaded(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [history, busy]);

  function grow() {
    const el = taRef.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  async function send(text) {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setInput(""); setErr(""); setBusy(true);
    if (taRef.current) taRef.current.style.height = "auto";
    setHistory((h) => [...h, { role: "user", content: t, at: Date.now(), local: true }]);
    try {
      const res = await fetch("/api/admin/hub", { method: "POST", headers: { "Content-Type": "application/json", ...H }, body: JSON.stringify({ text: t }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Erreur.");
      setHistory(d.history || []);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function mark(at, done) {
    try {
      const res = await fetch("/api/admin/hub", { method: "POST", headers: { "Content-Type": "application/json", ...H }, body: JSON.stringify({ markAt: at, done }) });
      const d = await res.json(); if (res.ok) setHistory(d.history || []);
    } catch { /* ignore */ }
  }

  async function clearAll() {
    if (!window.confirm("Effacer toute la conversation ?")) return;
    await fetch("/api/admin/hub", { method: "DELETE", headers: H });
    setHistory([]);
  }

  function chip(c) {
    if (c.fill) { setInput(c.q); taRef.current?.focus(); return; }
    send(c.q);
  }

  return (
    <div className="hub">
      <div className="hub-head">
        <div>
          <h2 className="hub-title">🧭 Votre assistant</h2>
          <p className="hub-sub">Un seul endroit : catalogue, réponses aux clientes, newsletter, bilans. Écrivez comme vous parlez — rien n&apos;est appliqué ni envoyé sans votre clic.</p>
        </div>
        {history.length > 0 && <button className="btn btn-outline hub-clear" onClick={clearAll}>Effacer</button>}
      </div>

      {pending.length > 0 && (
        <div className="hub-pending">
          <div className="hub-pending-title">📬 {pending.length} réponse{pending.length > 1 ? "s" : ""} à valider</div>
          {pending.map((p) => (
            <div key={p.id} className="hub-pending-row">
              <div className="hub-pending-txt">
                <b>{p.name}</b> <span>· {p.subject}</span>
                <small>{p.message}</small>
              </div>
              <Link href={`/repondre/${p.token}`} className="btn btn-gold hub-pending-btn">Relire et envoyer</Link>
            </div>
          ))}
        </div>
      )}

      <div className="hub-chips">
        {CHIPS.map((c) => <button key={c.t} className="hub-chip" onClick={() => chip(c)} disabled={busy}>{c.t}</button>)}
      </div>

      <div className="hub-thread">
        {loaded && history.length === 0 && (
          <p className="hub-empty">Par exemple : « baisse le collier pastille à 25 € », « réponds à Sophie qui demande son délai », « fais le bilan du mois ».</p>
        )}
        {history.map((m) => (
          <div key={m.at} className={`hub-msg ${m.role}`}>
            {m.role === "assistant" && m.agent ? <div className="hub-agent">{m.agent}</div> : null}
            <div className="hub-bubble">{m.content}</div>
            {m.role === "assistant" && m.actions && !m.done && (
              <Proposal actions={m.actions} adminKey={adminKey} onDone={(label) => { mark(m.at, label); onReload?.(); }} />
            )}
            {m.role === "assistant" && m.action?.kind === "email_draft" && !m.done && (
              <Draft draft={m.action} adminKey={adminKey} onDone={(label) => mark(m.at, label)} />
            )}
            {m.role === "assistant" && !m.actions && !m.action && m.content?.length > 40 && !m.done && (
              <button className="hub-copy" onClick={() => navigator.clipboard?.writeText(m.content)}>Copier</button>
            )}
            {m.done ? <div className="hub-done">{m.done}</div> : null}
          </div>
        ))}
        {busy && <div className="hub-msg assistant"><div className="hub-bubble hub-thinking">Je réfléchis…</div></div>}
        <div ref={endRef} />
      </div>

      {err ? <div className="notice hub-err">{err}</div> : null}

      <div className="hub-composer">
        <textarea
          ref={taRef} value={input} rows={1}
          onChange={(e) => { setInput(e.target.value); grow(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Écrivez votre demande… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
        />
        <button className="btn btn-gold hub-send" onClick={() => send()} disabled={busy || !input.trim()}>Envoyer</button>
      </div>
    </div>
  );
}

// Changements de catalogue proposés : le gérant confirme ou annule.
function Proposal({ actions, adminKey, onDone }) {
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  async function confirm() {
    setBusy(true); let ok = 0;
    for (const a of actions) { try { if (await applyCatalogAction(a, adminKey)) ok++; } catch { /* ignore */ } }
    setBusy(false);
    onDone(`${ok}/${actions.length} changement(s) appliqué(s) ✓`);
  }
  return (
    <div className="hub-card">
      <div className="hub-card-title">À confirmer</div>
      <ul className="hub-list">{actions.map((a, i) => <li key={i}>{a.label || a.type}</li>)}</ul>
      <div className="hub-card-btns">
        <button className="btn btn-gold" onClick={confirm} disabled={busy}>{busy ? "…" : "Confirmer"}</button>
        <button className="btn btn-outline" onClick={() => setDismissed(true)} disabled={busy}>Annuler</button>
      </div>
    </div>
  );
}

// Brouillon d'e-mail : relire, modifier, envoyer (à l'image de la marque).
function Draft({ draft, adminKey, onDone }) {
  const [to, setTo] = useState(draft.to || "");
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
  async function sendMail() {
    if (!okMail || busy) return;
    if (!window.confirm(`Envoyer cet e-mail à ${to.trim()} ?`)) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/send-client-email", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ to: to.trim(), subject, message: body }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) onDone(`E-mail envoyé à ${to.trim()} ✓`); else setErr(d.error || "Échec de l'envoi.");
    } catch { setErr("Erreur de connexion."); }
    finally { setBusy(false); }
  }
  return (
    <div className="hub-card">
      <div className="hub-card-title">Brouillon d&apos;e-mail — relisez, modifiez, envoyez</div>
      {draft.reason ? <div className="hub-reason">{draft.reason}</div> : null}
      <input className="hub-in" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Adresse e-mail de la cliente" />
      <input className="hub-in" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet" />
      <textarea className="hub-in hub-ta" value={body} onChange={(e) => setBody(e.target.value)} />
      {err ? <div className="hub-err-inline">{err}</div> : null}
      <div className="hub-card-btns">
        <button className="btn btn-gold" onClick={sendMail} disabled={busy || !okMail || !body.trim()}>{busy ? "Envoi…" : "Envoyer à la cliente"}</button>
        <button className="btn btn-outline" onClick={() => navigator.clipboard?.writeText(body)}>Copier le texte</button>
      </div>
      {!okMail && to ? <div className="hub-err-inline">Adresse invalide.</div> : null}
    </div>
  );
}
