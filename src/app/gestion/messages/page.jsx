"use client";

import { useEffect, useState, useCallback } from "react";
import { MESSAGE_TEMPLATES_SEED, AUTO_RULES_SEED } from "@/lib/messageTemplatesSeed";

// =============================================================================
// Gestion → Messages clients (programmés + règles automatiques)
// 1) Modèles de message réutilisables.
// 2) Programmer un message à une cliente pour une date/heure précise.
// 3) Règles automatiques appliquées à toutes les commandes (ex. J+3 : merci).
// L'envoi réel se fait par le cron /api/cron/scheduled (planificateur).
// =============================================================================

const box = { background: "#fff", border: "1px solid #e7d3a1", borderRadius: 12, padding: 16, marginBottom: 18 };
const input = { width: "100%", padding: 9, border: "1px solid var(--line)", borderRadius: 9, font: "inherit", marginTop: 4 };
const label = { fontSize: "0.82rem", fontWeight: 700, color: "var(--gold-dark)" };

function fmtWhen(ts) {
  try { return new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export default function MessagesAdmin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [orders, setOrders] = useState([]);
  // Formulaire « programmer / envoyer »
  const [f, setF] = useState({ to: "", name: "", ref: "", subject: "", body: "", date: "", time: "" });
  const [sending, setSending] = useState(false);

  const load = useCallback(async (k) => {
    try {
      const s = await fetch("/api/admin/settings", { headers: { "x-admin-key": k } });
      if (s.status === 401) { setAuthed(false); return; }
      const sd = (await s.json()).settings || {};
      setTemplates(Array.isArray(sd.messageTemplates) ? sd.messageTemplates : []);
      setRules(Array.isArray(sd.autoRules) ? sd.autoRules : []);
      setAuthed(true);
      const sc = await fetch("/api/admin/scheduled", { headers: { "x-admin-key": k } });
      if (sc.ok) setScheduled((await sc.json()).scheduled || []);
      const o = await fetch("/api/admin/orders", { headers: { "x-admin-key": k } });
      if (o.ok) setOrders((await o.json()).orders || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  async function saveSettings(patch, okMsg) {
    setMsg("");
    const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(patch) });
    if (r.ok) { setMsg(okMsg || "Enregistré ✓"); load(key); } else { setMsg("Échec de l'enregistrement."); }
  }

  // ---- Modèles ----
  function addTemplate() { setTemplates((t) => [...t, { id: "tpl_" + Math.random().toString(36).slice(2, 8), name: "", subject: "", body: "" }]); }
  function updTemplate(i, patch) { setTemplates((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x))); }
  function delTemplate(i) { setTemplates((t) => t.filter((_, j) => j !== i)); }
  function useTemplate(t) { setF((f) => ({ ...f, subject: t.subject, body: t.body })); setMsg("Modèle chargé dans le formulaire ci-dessus."); window.scrollTo({ top: 0, behavior: "smooth" }); }

  // ---- Règles ----
  function addRule() { setRules((r) => [...r, { id: "rule_" + Math.random().toString(36).slice(2, 8), name: "", subject: "", body: "", delayDays: 3, trigger: "commande", active: false }]); }
  function loadSeedRules() {
    const names = new Set(rules.map((r) => (r.name || "").trim().toLowerCase()));
    const toAdd = AUTO_RULES_SEED.filter((s) => !names.has(s.name.toLowerCase()))
      .map((s) => ({ ...s, id: "rule_" + Math.random().toString(36).slice(2, 8) }));
    if (!toAdd.length) { setMsg("La règle prête est déjà présente."); return; }
    const next = [...rules, ...toAdd];
    setRules(next);
    saveSettings({ autoRules: next }, "Règle prête ajoutée et activée ✓");
  }
  function updRule(i, patch) { setRules((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x))); }
  function delRule(i) { setRules((r) => r.filter((_, j) => j !== i)); }

  // ---- Modèles prêts (chargés d'un clic) ----
  function loadSeedTemplates() {
    // Ajoute les modèles prêts qui ne sont pas déjà présents (par nom).
    const names = new Set(templates.map((t) => (t.name || "").trim().toLowerCase()));
    const toAdd = MESSAGE_TEMPLATES_SEED.filter((s) => !names.has(s.name.toLowerCase()))
      .map((s) => ({ ...s, id: "tpl_" + Math.random().toString(36).slice(2, 8) }));
    if (!toAdd.length) { setMsg("Les modèles prêts sont déjà présents."); return; }
    const next = [...templates, ...toAdd];
    setTemplates(next);
    saveSettings({ messageTemplates: next }, `${toAdd.length} modèle(s) prêt(s) ajouté(s) et enregistré(s) ✓`);
  }

  // ---- Programmer / Envoyer ----
  function pickClient(e) {
    const o = orders.find((x) => x.id === e.target.value);
    if (o) setF((f) => ({ ...f, to: o.customerEmail || "", name: o.customerName || "", ref: o.ref || (o.id || "").slice(-6) }));
  }
  // Charge un modèle (par id) dans le formulaire d'envoi.
  function pickTemplate(e) {
    const t = templates.find((x) => x.id === e.target.value);
    if (t) setF((f) => ({ ...f, subject: t.subject || "", body: t.body || "" }));
  }
  // Envoi IMMÉDIAT au client sélectionné (s'adapte : prénom, réf, solde cagnotte).
  async function sendNow() {
    setMsg("");
    if (!f.to || !f.subject.trim() || !f.body.trim()) { setMsg("E-mail, sujet et message obligatoires."); return; }
    setSending(true);
    try {
      const r = await fetch("/api/admin/send-now", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ to: f.to, name: f.name, ref: f.ref, subject: f.subject, body: f.body }),
      });
      const d = await r.json();
      if (r.ok) { setMsg(`Message envoyé à ${f.to} ✓`); setF({ to: "", name: "", ref: "", subject: "", body: "", date: "", time: "" }); }
      else setMsg(d.error || "Échec de l'envoi.");
    } catch { setMsg("Échec de l'envoi."); }
    finally { setSending(false); }
  }
  async function schedule() {
    setMsg("");
    if (!f.to || !f.subject.trim() || !f.body.trim()) { setMsg("E-mail, sujet et message obligatoires."); return; }
    if (!f.date || !f.time) { setMsg("Choisis une date et une heure d'envoi."); return; }
    const sendAt = new Date(`${f.date}T${f.time}`).getTime();
    if (!sendAt || sendAt < Date.now()) { setMsg("La date/heure doit être dans le futur."); return; }
    const r = await fetch("/api/admin/scheduled", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ to: f.to, name: f.name, subject: f.subject, body: f.body, sendAt }) });
    const d = await r.json();
    if (r.ok) { setMsg("Message programmé pour le " + fmtWhen(sendAt) + " ✓"); setF({ to: "", name: "", ref: "", subject: "", body: "", date: "", time: "" }); load(key); }
    else setMsg(d.error || "Échec.");
  }
  async function cancelScheduled(id) {
    if (!window.confirm("Annuler ce message programmé ?")) return;
    await fetch("/api/admin/scheduled?id=" + encodeURIComponent(id), { method: "DELETE", headers: { "x-admin-key": key } });
    load(key);
  }

  if (!authed) return <div style={{ padding: 24 }}><p>Connecte-toi d&apos;abord sur la page Gestion, puis reviens ici.</p></div>;

  const pending = scheduled.filter((s) => !s.sent);
  const done = scheduled.filter((s) => s.sent).slice(-8).reverse();

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "8px 14px 60px" }}>
      <h1 style={{ fontFamily: "Georgia, serif", color: "var(--gold-dark)" }}>Messages clients</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: -6 }}>Écris des modèles, programme un envoi à l&apos;heure que tu veux, ou crée des règles automatiques. Les envois partent par ta boîte Gmail (copie cachée à toi).</p>
      {msg && <p style={{ background: "#f6efdd", border: "1px solid #e7d3a1", borderRadius: 8, padding: "8px 12px", color: "#7a5c17" }}>{msg}</p>}

      {/* 1. ENVOYER / PROGRAMMER UN MESSAGE */}
      <div style={box}>
        <h2 style={{ marginTop: 0 }}>✉️ Envoyer un message</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: -6 }}>Choisissez une cliente, un modèle prêt, puis <strong>Envoyer maintenant</strong> — ou programmez-le pour plus tard. Le message s&apos;adapte à la cliente ({"{prenom}"}, {"{ref}"}, {"{solde}"} de cagnotte).</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <span style={label}>Choisir une cliente (commande)</span>
            <select style={input} onChange={pickClient} defaultValue="">
              <option value="">— saisir à la main —</option>
              {orders.filter((o) => o.customerEmail).slice(0, 60).map((o) => (
                <option key={o.id} value={o.id}>{o.customerName || o.customerEmail} · #{o.ref || o.id?.slice(-6)}</option>
              ))}
            </select>
          </div>
          <div>
            <span style={label}>E-mail de la cliente</span>
            <input style={input} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} placeholder="cliente@email.com" />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={label}>Modèle prêt</span>
          <select style={input} onChange={pickTemplate} defaultValue="">
            <option value="">— choisir un modèle (remplit le sujet + le message) —</option>
            {templates.map((t) => (<option key={t.id} value={t.id}>{t.name || "(sans nom)"}</option>))}
          </select>
          {templates.length === 0 && (
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 4 }}>
              Aucun modèle. <button type="button" onClick={loadSeedTemplates} style={{ background: "none", border: "none", color: "var(--gold-dark)", textDecoration: "underline", cursor: "pointer", font: "inherit", padding: 0 }}>Charger les modèles prêts</button>.
            </div>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={label}>Sujet</span>
          <input style={input} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Ex. Des nouvelles de votre commande" />
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={label}>Message</span>
          <textarea style={{ ...input, minHeight: 120 }} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Bonjour {prenom}, ..." />
          <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>Astuce : {"{prenom}"}, {"{nom}"} et {"{ref}"} sont remplacés automatiquement (surtout utile pour les règles auto).</div>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-gold" style={{ padding: "11px 22px", fontWeight: 700 }} onClick={sendNow} disabled={sending}>
            {sending ? "Envoi…" : "✉️ Envoyer maintenant"}
          </button>
          <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>ou programmer pour plus tard :</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 10, alignItems: "end" }}>
          <div><span style={label}>Date d&apos;envoi</span><input type="date" style={input} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div><span style={label}>Heure</span><input type="time" style={input} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
          <button className="btn btn-outline" style={{ padding: "10px 16px" }} onClick={schedule}>Programmer</button>
        </div>
      </div>

      {/* File d'attente */}
      {(pending.length > 0 || done.length > 0) && (
        <div style={box}>
          <h2 style={{ marginTop: 0 }}>⏳ Messages programmés</h2>
          {pending.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Aucun message en attente.</p>}
          {pending.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: "0.9rem" }}>
                <strong>{s.name || s.to}</strong> — {s.subject}<br />
                <span style={{ color: "var(--ink-soft)", fontSize: "0.82rem" }}>Envoi le {fmtWhen(s.sendAt)}</span>
              </div>
              <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => cancelScheduled(s.id)}>Annuler</button>
            </div>
          ))}
          {done.length > 0 && (
            <div style={{ marginTop: 10, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              <strong>Derniers envoyés :</strong>
              {done.map((s) => <div key={s.id}>✓ {s.name || s.to} — {s.subject} ({fmtWhen(s.sentAt)}){s.error ? " ⚠ " + s.error : ""}</div>)}
            </div>
          )}
        </div>
      )}

      {/* 2. MODÈLES */}
      <div style={box}>
        <h2 style={{ marginTop: 0 }}>💬 Modèles de message</h2>
        {templates.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Aucun modèle. Ajoute-en un pour le réutiliser d&apos;un clic.</p>}
        {templates.map((t, i) => (
          <div key={t.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <input style={input} value={t.name} onChange={(e) => updTemplate(i, { name: e.target.value })} placeholder="Nom du modèle (ex. Remerciement)" />
            <input style={{ ...input, marginTop: 6 }} value={t.subject} onChange={(e) => updTemplate(i, { subject: e.target.value })} placeholder="Sujet" />
            <textarea style={{ ...input, minHeight: 80, marginTop: 6 }} value={t.body} onChange={(e) => updTemplate(i, { body: e.target.value })} placeholder="Message…" />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => useTemplate(t)}>Utiliser</button>
              <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => delTemplate(i)}>Supprimer</button>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-outline" style={{ padding: "6px 12px" }} onClick={addTemplate}>+ Ajouter un modèle</button>
          <button className="btn btn-outline" style={{ padding: "6px 12px" }} onClick={loadSeedTemplates}>✨ Charger les modèles prêts</button>
          <button className="btn btn-gold" style={{ padding: "6px 12px" }} onClick={() => saveSettings({ messageTemplates: templates }, "Modèles enregistrés ✓")}>Enregistrer les modèles</button>
        </div>
      </div>

      {/* 3. RÈGLES AUTOMATIQUES */}
      <div style={box}>
        <h2 style={{ marginTop: 0 }}>🤖 Règles automatiques (tous les clients)</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: -4 }}>Ex. « 3 jours après chaque commande, envoyer un remerciement ». S&apos;applique tout seul aux nouvelles commandes.</p>
        {rules.map((r, i) => (
          <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <input style={input} value={r.name} onChange={(e) => updRule(i, { name: e.target.value })} placeholder="Nom de la règle" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              <div><span style={label}>Déclencheur</span>
                <select style={input} value={r.trigger} onChange={(e) => updRule(i, { trigger: e.target.value })}>
                  <option value="commande">Après la commande</option>
                  <option value="livree">Après la livraison</option>
                </select>
              </div>
              <div><span style={label}>Délai (jours)</span>
                <input type="number" min="0" max="365" style={input} value={r.delayDays} onChange={(e) => updRule(i, { delayDays: Number(e.target.value) })} />
              </div>
            </div>
            <input style={{ ...input, marginTop: 6 }} value={r.subject} onChange={(e) => updRule(i, { subject: e.target.value })} placeholder="Sujet" />
            <textarea style={{ ...input, minHeight: 80, marginTop: 6 }} value={r.body} onChange={(e) => updRule(i, { body: e.target.value })} placeholder="Bonjour {prenom}, merci pour votre commande…" />
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.85rem" }}>
                <input type="checkbox" checked={Boolean(r.active)} onChange={(e) => updRule(i, { active: e.target.checked })} /> Active
              </label>
              <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#b4452f", borderColor: "#e7b7ad", marginLeft: "auto" }} onClick={() => delRule(i)}>Supprimer</button>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-outline" style={{ padding: "6px 12px" }} onClick={addRule}>+ Ajouter une règle</button>
          <button className="btn btn-outline" style={{ padding: "6px 12px" }} onClick={loadSeedRules}>✨ Charger la règle prête (avis 2 j après livraison)</button>
          <button className="btn btn-gold" style={{ padding: "6px 12px" }} onClick={() => saveSettings({ autoRules: rules }, "Règles enregistrées ✓")}>Enregistrer les règles</button>
        </div>
      </div>

      <p style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>
        Pour que les envois partent automatiquement, un planificateur doit appeler <code>/api/cron/scheduled</code> régulièrement (voir avec Claude Code pour l&apos;activer une fois).
      </p>
    </div>
  );
}
