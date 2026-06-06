"use client";

import { useState, useRef, useEffect } from "react";

// Assistant d'administration : la gérante parle en français, l'assistant PROPOSE
// des changements, et rien ne s'applique tant qu'elle n'a pas cliqué « Confirmer ».
export default function AssistantAdmin({ adminKey, onReload }) {
  const [messages, setMessages] = useState([]); // {role, content, actions?}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const d = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: d.reply || d.error || "…", actions: d.actions || null }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erreur de connexion, réessayez." }]);
    } finally {
      setBusy(false);
    }
  }

  // Traduit une action proposée en appel à l'API catalogue existante.
  async function applyAction(a) {
    const post = (payload) =>
      fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      }).then((r) => r.ok);

    const postTo = (url, payload) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      }).then((r) => r.ok);

    if (a.type === "hide") return post({ action: "edit", slug: a.slug, patch: { hidden: true } });
    if (a.type === "show") return post({ action: "edit", slug: a.slug, patch: { hidden: false } });
    if (a.type === "price") return post({ action: "edit", slug: a.slug, patch: { prices: { [a.variantId]: Number(a.price) } } });
    if (a.type === "promo") return postTo("/api/admin/promo", { variantId: a.variantId, salePrice: a.salePrice == null ? null : Number(a.salePrice) });
    if (a.type === "stock") return postTo("/api/admin/stock", { variantId: a.variantId, stock: Number(a.stock) });
    if (a.type === "text") {
      const patch = {};
      for (const k of ["name", "tagline", "descriptionHtml", "category"]) if (a[k] != null) patch[k] = a[k];
      return post({ action: "edit", slug: a.slug, patch });
    }
    if (a.type === "add") {
      return post({ action: "create", product: { name: a.name, category: a.category, price: a.price, tagline: a.tagline, descriptionHtml: a.descriptionHtml } });
    }
    if (a.type === "delete") return post({ action: "delete", slug: a.slug });
    return false;
  }

  async function confirmActions(idx, actions) {
    if (applying) return;
    setApplying(true);
    let ok = 0;
    for (const a of actions) {
      try { if (await applyAction(a)) ok++; } catch { /* ignore */ }
    }
    setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, done: `${ok}/${actions.length} changement(s) appliqué(s) ✓` } : msg)));
    setApplying(false);
    onReload?.();
  }

  function cancelActions(idx) {
    setMessages((m) => m.map((msg, i) => (i === idx ? { ...msg, done: "Proposition annulée." } : msg)));
  }

  return (
    <div>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Parlez à l'assistant en français (ex : « masque la clé USB bois », « passe le bracelet cœur à 19,90 € »,
        « ajoute un porte-clés cœur à 12 € »). Il <strong>propose</strong> les changements ; rien n'est appliqué sans votre confirmation.
      </p>

      <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14, minHeight: 280, maxHeight: 460, overflowY: "auto", background: "var(--paper)" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Posez votre première demande ci-dessous…</p>
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

            {m.actions && m.actions.length > 0 && !m.done && (
              <div style={{ marginTop: 8, border: "1px solid var(--gold)", borderRadius: 12, padding: 12, background: "#fffdf7" }}>
                <strong style={{ fontSize: "0.9rem" }}>Changements proposés :</strong>
                <ul style={{ margin: "8px 0 12px", paddingLeft: 18 }}>
                  {m.actions.map((a, j) => (
                    <li key={j} style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                      {a.label}{a.type === "delete" ? " — ⚠ définitif" : ""}
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-gold" disabled={applying} onClick={() => confirmActions(i, m.actions)}>
                    {applying ? "Application…" : "✓ Confirmer"}
                  </button>
                  <button className="btn btn-outline" disabled={applying} onClick={() => cancelActions(i)}>Annuler</button>
                </div>
              </div>
            )}
            {m.done && <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#256b34" }}>{m.done}</div>}
          </div>
        ))}
        {busy && <div style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>L'assistant réfléchit…</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Votre demande…"
          style={{ flex: 1, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
        />
        <button className="btn btn-gold" onClick={send} disabled={busy}>Envoyer</button>
      </div>
    </div>
  );
}
