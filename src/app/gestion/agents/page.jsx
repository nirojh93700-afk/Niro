"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// =============================================================================
// CENTRE DE COMMANDE — ÉQUIPE D'AGENTS (page dédiée, professionnelle)
// -----------------------------------------------------------------------------
// Vue d'ensemble : le Chef en vedette + une carte par agent, bien séparées.
// Clic sur un agent -> espace de travail dédié (conversation + actions).
// Authentification : même clé admin que /gestion (sessionStorage "niv-admin-key").
// =============================================================================

// Métadonnées d'affichage côté interface (exemples de demandes par agent).
const EXAMPLES = {
  chef: [
    "Réponds à cette cliente qui demande où en est sa commande…",
    "Quelqu'un veut un remboursement sur un collier gravé, gère ça.",
  ],
  email: [
    "Une cliente demande si le bracelet est livré avant Noël…",
    "Réponds à ce message : « Bonjour, puis-je changer la gravure ? »",
  ],
  avis: [
    "Réponds à cet avis 5 étoiles : « Magnifique, livraison rapide ! »",
    "Réponds à cet avis mitigé : « Joli mais reçu un peu tard. »",
  ],
  newsletter: [
    "Une campagne pour la Fête des mères.",
    "Mets en avant les bracelets prénom.",
  ],
  marketing: [
    "Un post Instagram pour le collier médaillon photo.",
    "Une idée de post pour les cadeaux de Noël.",
  ],
  technicien: [
    "Mes e-mails de confirmation partent en spam, que faire ?",
    "Je veux ajouter un champ « date de l'événement » sur les faire-part.",
  ],
  rapport: [
    "Fais le bilan de la semaine.",
    "Comment se vendent mes produits ce mois-ci ?",
  ],
};

// Agents prévus mais pas encore activés (feuille de route, affichés grisés).
const ROADMAP = [];

export default function AgentsCenterPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null); // id de l'agent ouvert, ou null
  const [authError, setAuthError] = useState("");
  const [autoReply, setAutoReply] = useState(false); // auto-réponse e-mail activée ?
  const [savingAuto, setSavingAuto] = useState(false);
  const [showRecap, setShowRecap] = useState(false); // page récap "comment ça marche"

  const loadAgents = useCallback(async (adminKey) => {
    try {
      const res = await fetch("/api/admin/agents", { headers: { "x-admin-key": adminKey } });
      if (res.status === 401) { setAuthed(false); setAuthError("Mot de passe incorrect."); return false; }
      const d = await res.json();
      setAgents(Array.isArray(d.agents) ? d.agents : []);
      setAuthed(true);
      setKey(adminKey);
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthError("");
      // Charge le réglage d'autonomie.
      try {
        const sr = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
        if (sr.ok) setAutoReply(Boolean((await sr.json())?.settings?.agents?.emailAutoReply));
      } catch { /* ignore */ }
      return true;
    } catch {
      setAuthError("Erreur de connexion.");
      return false;
    }
  }, []);

  async function toggleAutoReply() {
    if (savingAuto) return;
    const next = !autoReply;
    setSavingAuto(true);
    setAutoReply(next); // optimiste
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ agents: { emailAutoReply: next } }),
      });
      if (!res.ok) setAutoReply(!next); // rollback
    } catch {
      setAutoReply(!next);
    } finally {
      setSavingAuto(false);
    }
  }

  useEffect(() => {
    const k = sessionStorage.getItem("niv-admin-key");
    (async () => {
      if (k) await loadAgents(k);
      setChecking(false);
    })();
  }, [loadAgents]);

  // --- Écran de connexion (si pas de clé valide) ---------------------------
  if (!checking && !authed) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold)" }}>Centre des agents</h1>
          <p style={{ color: "var(--ink-soft)" }}>Entre ton mot de passe de gestion pour accéder à ton équipe d'agents.</p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadAgents(keyInput.trim()); }}
            placeholder="Mot de passe"
            style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
          />
          {authError && <div style={{ color: "#b00020", marginTop: 8, fontSize: "0.9rem" }}>{authError}</div>}
          <button className="btn btn-gold" style={{ marginTop: 12 }} onClick={() => loadAgents(keyInput.trim())}>Entrer</button>
          <p style={{ marginTop: 16 }}><Link href="/gestion" style={{ color: "var(--gold)" }}>← Retour à la gestion</Link></p>
        </div>
      </section>
    );
  }

  if (checking) {
    return <section className="section"><div className="container"><p style={{ color: "var(--ink-soft)" }}>Chargement…</p></div></section>;
  }

  const chef = agents.find((a) => a.id === "chef");
  const workers = agents.filter((a) => a.id !== "chef");
  const openAgent = selected ? agents.find((a) => a.id === selected) : null;

  // --- Page de récap (comment fonctionne l'équipe) -------------------------
  if (showRecap && !openAgent) {
    return <RecapView agents={agents} onBack={() => setShowRecap(false)} />;
  }

  // --- Espace de travail d'un agent ----------------------------------------
  if (openAgent) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <button className="btn btn-outline" style={{ marginBottom: 18 }} onClick={() => setSelected(null)}>← Retour à l'équipe</button>
          <AgentHeader agent={openAgent} big />
          <div style={{ marginTop: 18 }}>
            <Workspace agent={openAgent} adminKey={key} />
          </div>
        </div>
      </section>
    );
  }

  // --- Vue d'ensemble (le tableau de bord de l'équipe) ---------------------
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 980 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <div>
            <span className="eyebrow">Espace gestion</span>
            <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold)", margin: "4px 0 0" }}>Mon équipe d'agents</h1>
            <p style={{ color: "var(--ink-soft)", margin: "6px 0 0" }}>
              Tes assistants IA, chacun spécialisé. Le chef coordonne tout. Les cas simples peuvent être traités en autonomie, les cas spéciaux te sont toujours remontés.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={() => setShowRecap(true)}>Comment ça marche ?</button>
            <Link href="/gestion" className="btn btn-outline">← Gestion</Link>
          </div>
        </div>

        {/* AUTONOMIE — interrupteur de réponse automatique */}
        <div style={{
          marginTop: 20, border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px",
          background: autoReply ? "#e7f4ea" : "var(--paper)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <strong>Réponse automatique aux messages du site</strong>
            <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 4 }}>
              {autoReply
                ? "Activée : l'agent répond seul aux questions simples reçues par le formulaire de contact. Les cas spéciaux te sont toujours remontés « à valider » par e-mail."
                : "Désactivée : l'agent prépare les réponses mais rien ne part sans toi. Active pour qu'il réponde tout seul aux messages simples."}
            </div>
          </div>
          <button
            onClick={toggleAutoReply}
            disabled={savingAuto}
            className={`btn ${autoReply ? "btn-gold" : "btn-outline"}`}
            style={{ minWidth: 130 }}
          >
            {savingAuto ? "…" : autoReply ? "● Activée" : "Activer"}
          </button>
        </div>

        {/* LE CHEF — en vedette */}
        {chef && (
          <button
            onClick={() => setSelected(chef.id)}
            style={{
              width: "100%", textAlign: "left", marginTop: 22, cursor: "pointer",
              border: "1px solid var(--gold)", borderRadius: 18, padding: "22px 24px",
              background: "linear-gradient(135deg, #fffdf7 0%, var(--cream) 100%)",
              display: "flex", alignItems: "center", gap: 20, boxShadow: "0 6px 20px rgba(169,137,53,0.12)",
            }}
          >
            <Avatar emoji={chef.emoji} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ fontSize: "1.25rem", fontFamily: "Georgia, serif" }}>{chef.name}</strong>
                <StatusPill label="Chef d'équipe" featured />
              </div>
              <div style={{ color: "var(--ink-soft)", marginTop: 4 }}>{chef.blurb}</div>
            </div>
            <span className="btn btn-gold" style={{ pointerEvents: "none" }}>Ouvrir</span>
          </button>
        )}

        {/* LES AGENTS — une carte par agent */}
        <h3 style={{ marginTop: 30, marginBottom: 4, fontFamily: "Georgia, serif", color: "var(--ink)" }}>Les agents</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 12 }}>
          {workers.map((a) => (
            <AgentCard key={a.id} agent={a} onOpen={() => setSelected(a.id)} />
          ))}
          {ROADMAP.map((a) => (
            <div key={a.name} style={{
              border: "1px dashed var(--line)", borderRadius: 16, padding: 18, background: "var(--paper)", opacity: 0.7,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar emoji={a.emoji} size={44} muted />
                <strong>{a.name}</strong>
              </div>
              <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 8 }}>{a.blurb}</div>
              <div style={{ marginTop: 12 }}><StatusPill label="Bientôt" /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants d'affichage
// ---------------------------------------------------------------------------
function Avatar({ emoji, size = 48, muted }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: muted ? "var(--cream)" : "linear-gradient(135deg, var(--gold), #c9a24b)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, boxShadow: muted ? "none" : "0 2px 8px rgba(169,137,53,0.25)",
    }}>
      {emoji}
    </div>
  );
}

function StatusPill({ label, featured }) {
  const isSoon = label === "Bientôt";
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, letterSpacing: 0.3, padding: "3px 10px", borderRadius: 999,
      background: isSoon ? "#eee" : featured ? "var(--gold)" : "#e7f4ea",
      color: isSoon ? "#888" : featured ? "#fff" : "#256b34",
    }}>
      {isSoon ? label : featured ? label : "● Actif"}
    </span>
  );
}

function AgentHeader({ agent, big }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Avatar emoji={agent.emoji} size={big ? 56 : 44} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: big ? "1.4rem" : "1.1rem", fontFamily: "Georgia, serif" }}>{agent.name}</strong>
          <StatusPill label={agent.id === "chef" ? "Chef d'équipe" : "actif"} featured={agent.id === "chef"} />
        </div>
        <div style={{ color: "var(--ink-soft)", marginTop: 2 }}>{agent.blurb}</div>
      </div>
    </div>
  );
}

function AgentCard({ agent, onOpen }) {
  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 16, padding: 18, background: "var(--paper)",
      display: "flex", flexDirection: "column", boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar emoji={agent.emoji} size={44} />
        <div>
          <strong>{agent.name}</strong>
          <div style={{ marginTop: 2 }}><StatusPill label="actif" /></div>
        </div>
      </div>
      <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: 10, flex: 1 }}>{agent.blurb}</div>
      <button className="btn btn-gold" style={{ marginTop: 14 }} onClick={onOpen}>Ouvrir</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ESPACE DE TRAVAIL — conversation avec l'agent + actions (brouillon e-mail)
// ---------------------------------------------------------------------------
function Workspace({ agent, adminKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const examples = EXAMPLES[agent.id] || [];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(text) {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ agent: agent.id, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
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
      {messages.length === 0 && examples.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: 6 }}>Exemples — clique pour commencer :</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {examples.map((ex, i) => (
              <button key={i} className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "6px 12px" }} onClick={() => send(ex)}>
                {ex.length > 60 ? ex.slice(0, 57) + "…" : ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, minHeight: 320, maxHeight: 520, overflowY: "auto", background: "var(--paper)" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>{agent.placeholder || "Écris ta demande ci-dessous…"}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "12px 0", textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{
              display: "inline-block", maxWidth: "85%", padding: "10px 14px", borderRadius: 14,
              background: m.role === "user" ? "var(--gold)" : "var(--cream)",
              color: m.role === "user" ? "#fff" : "var(--ink)", whiteSpace: "pre-wrap", textAlign: "left",
            }}>
              {m.content}
            </div>
            {m.action?.kind === "email_draft" && !m.done && (
              <EmailDraft draft={m.action} adminKey={adminKey}
                onSent={(label) => setMessages((arr) => arr.map((msg, j) => (j === i ? { ...msg, done: label } : msg)))} />
            )}
            {/* Réponse texte (avis, newsletter, marketing…) : bouton pour copier. */}
            {m.role === "assistant" && !m.action && m.content && m.content.length > 20 && (
              <div><CopyButton text={m.content} /></div>
            )}
            {m.done && <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#256b34" }}>{m.done}</div>}
          </div>
        ))}
        {busy && <div style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>{agent.name} réfléchit…</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={agent.placeholder || "Ta demande…"}
          style={{ flex: 1, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
        />
        <button className="btn btn-gold" onClick={() => send()} disabled={busy}>Envoyer</button>
      </div>

      {agent.id === "marketing" && <SocialPublish adminKey={adminKey} />}
    </div>
  );
}

function EmailDraft({ draft, adminKey, onSent }) {
  const [to, setTo] = useState(draft.to || "");
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());

  async function sendEmail() {
    if (!validEmail || sending) return;
    setSending(true); setErr("");
    try {
      const res = await fetch("/api/admin/send-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ to: to.trim(), subject, message: body }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) onSent(`E-mail envoyé à ${to.trim()} ✓`);
      else setErr(d.error || "Échec de l'envoi.");
    } catch { setErr("Erreur de connexion."); }
    finally { setSending(false); }
  }

  function copyAll() {
    navigator.clipboard?.writeText(`Objet : ${subject}\n\n${body}`).then(
      () => onSent("Brouillon copié ✓"),
      () => setErr("Copie impossible."),
    );
  }

  return (
    <div style={{ marginTop: 10, border: "1px solid var(--gold)", borderRadius: 14, padding: 14, background: "#fffdf7" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: "0.92rem" }}>Brouillon de réponse</strong>
        {draft.needsValidation
          ? <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#fff5e0", color: "#9a6b00" }}>À valider — cas spécial</span>
          : <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#e7f4ea", color: "#256b34" }}>Autonome — cas simple</span>}
      </div>
      {draft.reason && <div style={{ fontSize: "0.82rem", color: "#9a6b00", margin: "6px 0" }}>{draft.reason}</div>}

      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Destinataire</label>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="adresse@email.fr"
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />

      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Objet</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />

      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Message</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", resize: "vertical" }} />

      {err && <div style={{ color: "#b00020", fontSize: "0.85rem", marginTop: 6 }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="btn btn-gold" disabled={!validEmail || sending} onClick={sendEmail}>{sending ? "Envoi…" : "Envoyer l'e-mail"}</button>
        <button className="btn btn-outline" onClick={copyAll}>Copier</button>
      </div>
      {!validEmail && <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 6 }}>Renseigne une adresse valide pour envoyer (ou « Copier »).</div>}
    </div>
  );
}

// Petit bouton « Copier » réutilisable (pour récupérer un texte d'agent).
function CopyButton({ text, label = "Copier" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn btn-outline"
      style={{ fontSize: "0.8rem", padding: "4px 12px", marginTop: 6 }}
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
    >
      {done ? "Copié ✓" : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// PUBLICATION INSTAGRAM — l'agent marketing peut publier lui-même (en option).
// Si non configuré : formulaire pour enregistrer l'identifiant + le jeton Meta.
// Si configuré : champ image (URL https) + légende -> publication directe.
// ---------------------------------------------------------------------------
function SocialPublish({ adminKey }) {
  const [configured, setConfigured] = useState(null); // null = inconnu
  const [showConfig, setShowConfig] = useState(false);
  const [igUserId, setIgUserId] = useState("");
  const [igToken, setIgToken] = useState("");
  const [savingCfg, setSavingCfg] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/social/publish", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, [adminKey]);

  async function saveConfig() {
    if (savingCfg) return;
    setSavingCfg(true); setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ social: { igUserId: igUserId.trim(), igToken: igToken.trim() } }),
      });
      if (res.ok) { setConfigured(Boolean(igUserId.trim() && igToken.trim())); setShowConfig(false); setIgToken(""); setMsg("Connexion enregistrée ✓"); }
      else setMsg("Échec de l'enregistrement.");
    } catch { setMsg("Erreur de connexion."); }
    finally { setSavingCfg(false); }
  }

  async function publish() {
    if (busy) return;
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ imageUrl: imageUrl.trim(), caption }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setMsg("Publié sur Instagram ✓"); setImageUrl(""); setCaption(""); }
      else setMsg(d.error || "Échec de la publication.");
    } catch { setMsg("Erreur de connexion."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 14, padding: 16, background: "var(--paper)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong>Publier sur Instagram</strong>
        {configured === true && !showConfig && (
          <span style={{ fontSize: "0.78rem", color: "#256b34" }}>Compte connecté ✓ · <button onClick={() => setShowConfig(true)} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", padding: 0, font: "inherit" }}>reconfigurer</button></span>
        )}
      </div>

      {(configured === false || showConfig) && (
        <div style={{ marginTop: 10 }}>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginTop: 0 }}>
            Pour publier directement, connecte ton compte Instagram Business (identifiant + jeton d'accès Meta). Sinon, copie simplement le texte préparé et publie toi-même.
          </p>
          <input value={igUserId} onChange={(e) => setIgUserId(e.target.value)} placeholder="Identifiant du compte Instagram (igUserId)"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", marginBottom: 8 }} />
          <input value={igToken} onChange={(e) => setIgToken(e.target.value)} placeholder="Jeton d'accès Meta (longue durée)" type="password"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
          <button className="btn btn-gold" style={{ marginTop: 10 }} disabled={savingCfg} onClick={saveConfig}>{savingCfg ? "…" : "Enregistrer la connexion"}</button>
        </div>
      )}

      {configured === true && !showConfig && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "4px 0 2px" }}>URL de l'image (https)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/visuel.jpg"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", margin: "8px 0 2px" }}>Légende</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", resize: "vertical" }} />
          <button className="btn btn-gold" style={{ marginTop: 10 }} disabled={busy || !imageUrl.trim()} onClick={publish}>{busy ? "Publication…" : "Publier maintenant"}</button>
        </div>
      )}

      {msg && <div style={{ marginTop: 8, fontSize: "0.85rem", color: msg.includes("✓") ? "#256b34" : "#b00020" }}>{msg}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE DE RÉCAP — tous les agents, ce qu'ils font, leur niveau d'autonomie.
// ---------------------------------------------------------------------------
const RECAP = [
  { id: "chef", emoji: "🧭", name: "Chef d'équipe", what: "Tu lui parles normalement, il comprend ta demande et la confie au bon agent, puis te ramène le résultat.", how: "Le point d'entrée idéal : en cas de doute sur quel agent utiliser, parle au Chef.", auto: "Routage automatique" },
  { id: "email", emoji: "✉️", name: "Agent e-mail", what: "Répond aux messages des clientes, dans le ton de la marque, en respectant tes règles (pas de remboursement sur le personnalisé, etc.).", how: "Colle le message d'une cliente : il rédige la réponse, tu relis, tu envoies (ou tu copies). Avec l'auto-réponse activée, il répond seul aux messages simples reçus via le formulaire de contact.", auto: "Autonome (cas simples) · te remonte les cas spéciaux à valider" },
  { id: "avis", emoji: "⭐", name: "Agent avis", what: "Rédige une réponse publique à un avis client.", how: "Colle l'avis : il te propose une réponse courte et juste, que tu copies sur ta fiche produit.", auto: "Brouillon à valider" },
  { id: "newsletter", emoji: "📣", name: "Agent newsletter", what: "Rédige tes campagnes e-mail (objet + message).", how: "Dis l'occasion ou le produit à mettre en avant : il propose des objets et le corps du message.", auto: "Brouillon à valider" },
  { id: "marketing", emoji: "🎨", name: "Agent marketing", what: "Prépare tes posts réseaux sociaux : légende + hashtags + idée de visuel.", how: "Dis le produit ou le thème : il prépare le post prêt à copier. Tu le publies toi-même, OU il publie sur Instagram à ta place si tu as connecté ton compte pro (panneau « Publier sur Instagram »).", auto: "Prépare tout · publie aussi (si compte connecté)" },
  { id: "technicien", emoji: "🛠️", name: "Technicien / Dev", what: "Diagnostique les soucis techniques du site et prépare une fiche claire.", how: "Décris ton problème : il t'explique la cause et, si besoin d'une modification du code, prépare la fiche pour le développeur (les corrections sont appliquées par Claude Code).", auto: "Diagnostic + fiche" },
  { id: "rapport", emoji: "📊", name: "Agent rapport", what: "Fait le bilan de tes ventes (CA, panier moyen, meilleures ventes) et te donne des conseils.", how: "Demande « fais le rapport de la semaine » : il analyse tes vraies commandes et te répond.", auto: "Sur tes vraies données" },
];

function RecapView({ agents, onBack }) {
  const has = (id) => agents.some((a) => a.id === id);
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <button className="btn btn-outline" style={{ marginBottom: 18 }} onClick={onBack}>← Retour à l'équipe</button>
        <span className="eyebrow">Espace gestion</span>
        <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold)", margin: "4px 0 0" }}>Comment fonctionne ton équipe d'agents</h1>
        <p style={{ color: "var(--ink-soft)" }}>
          Chaque agent est spécialisé. Le principe : les cas simples sont traités en autonomie, les cas spéciaux ou sensibles te sont toujours remontés pour validation.
        </p>

        {RECAP.filter((r) => has(r.id)).map((r) => (
          <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 16, padding: 18, marginTop: 14, background: "var(--paper)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar emoji={r.emoji} size={44} />
              <strong style={{ fontSize: "1.1rem", fontFamily: "Georgia, serif" }}>{r.name}</strong>
            </div>
            <p style={{ margin: "10px 0 6px" }}><strong>Ce qu'il fait :</strong> {r.what}</p>
            <p style={{ margin: "0 0 6px", color: "var(--ink-soft)" }}><strong>Comment l'utiliser :</strong> {r.how}</p>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#e7f4ea", color: "#256b34" }}>{r.auto}</span>
          </div>
        ))}

        {/* À venir / hors de l'app */}
        <h3 style={{ marginTop: 26, fontFamily: "Georgia, serif" }}>Au-delà des agents</h3>
        <div style={{ border: "1px dashed var(--line)", borderRadius: 16, padding: 18, marginTop: 10, background: "var(--paper)" }}>
          <p style={{ margin: "0 0 8px" }}>🧊 <strong>Fichiers 3D & visuels</strong> — générés à la demande par le développeur (Claude Code). Donne un produit, le fichier 3D est créé et ajouté.</p>
          <p style={{ margin: "0 0 8px" }}>🛠️ <strong>Développement du site</strong> — les vraies modifications de code sont faites par Claude Code (pour des raisons de sécurité, un développeur autonome ne peut pas vivre dans le site).</p>
          <p style={{ margin: 0 }}>📞 <strong>Agent téléphone</strong> — possible, mais nécessite un service de téléphonie (Twilio) avec un numéro dédié. À activer quand tu le souhaites.</p>
        </div>
      </div>
    </section>
  );
}
