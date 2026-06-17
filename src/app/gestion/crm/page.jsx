"use client";

// =============================================================================
// PAGE CRM (réservée admin) — relation client, à partir des VRAIES commandes.
// Clients regroupés par e-mail · segments (VIP / Fidèle / Nouvelle / À relancer)
// · tableau de bord · recherche · historique commandes + suivi · notes privées
// · envoi d'e-mail à l'image de la marque · export CSV. Gratuit (données déjà là).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const DAY = 86400000;
const segColors = { VIP: "#8a6d3b", "Fidèle": "#256b34", Nouvelle: "#5b6b8a" };

export default function CrmPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [seg, setSeg] = useState("all");
  const [open, setOpen] = useState(-1);
  const [noteDraft, setNoteDraft] = useState({});
  const [savedNote, setSavedNote] = useState("");
  const [mailOpen, setMailOpen] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailMsg, setMailMsg] = useState("");
  const [mailSending, setMailSending] = useState(false);

  const load = useCallback(async (adminKey) => {
    setLoading(true); setError("");
    try {
      const [or, st] = await Promise.all([
        fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } }),
      ]);
      if (!or.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      const od = await or.json();
      setOrders(od.orders || []);
      if (st.ok) { const s = (await st.json()).settings || {}; setNotes(s.crmNotes || {}); }
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); load(saved); }
  }, [load]);

  // --- Construction des clients ---
  const valid = orders.filter((o) => o.status !== "annulee" && o.status !== "remboursee" && !o.test);
  const map = {};
  for (const o of valid) {
    const k = (o.customerEmail || o.customerName || "—").toLowerCase();
    if (!map[k]) map[k] = { key: k, name: o.customerName || "—", email: o.customerEmail || "", phone: o.customerPhone || "", nb: 0, total: 0, orders: [] };
    map[k].nb += 1;
    map[k].total += Number(o.total) || 0;
    if (o.customerPhone && !map[k].phone) map[k].phone = o.customerPhone;
    map[k].orders.push({ ref: o.ref || o.id?.slice(-6), status: o.status || "a_preparer", tracking: o.tracking || "", total: o.total, createdAt: o.createdAt });
  }
  const now = Date.now();
  const clients = Object.values(map).map((c) => {
    const dates = c.orders.map((o) => o.createdAt).filter(Boolean).sort();
    const first = dates[0] || null, last = dates[dates.length - 1] || null;
    let segment = "Nouvelle";
    if (c.total >= 100 || c.nb >= 4) segment = "VIP";
    else if (c.nb >= 2) segment = "Fidèle";
    const inactive = last ? (now - new Date(last).getTime()) > 90 * DAY : false;
    return { ...c, first, last, segment, inactive };
  }).sort((a, b) => b.total - a.total);

  const caTotal = clients.reduce((s, c) => s + c.total, 0);
  const nbOrders = clients.reduce((s, c) => s + c.nb, 0);
  const kpis = {
    clients: clients.length,
    ca: caTotal,
    panier: nbOrders ? caTotal / nbOrders : 0,
    vip: clients.filter((c) => c.segment === "VIP").length,
    relance: clients.filter((c) => c.inactive).length,
  };

  const filtered = clients.filter((c) => {
    if (seg === "relance" && !c.inactive) return false;
    if (seg !== "all" && seg !== "relance" && c.segment !== seg) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q)) return false;
    return true;
  });

  async function saveNote(k) {
    const next = { ...notes, [k]: (noteDraft[k] ?? "").slice(0, 1000) };
    setNotes(next);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": sessionStorage.getItem("niv-admin-key") || key },
        body: JSON.stringify({ crmNotes: next }),
      });
      setSavedNote(k); setTimeout(() => setSavedNote(""), 1500);
    } catch { setError("Échec de l'enregistrement de la note."); }
  }

  async function sendMail(to) {
    setMailSending(true); setMailMsg("");
    try {
      const res = await fetch("/api/admin/send-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": sessionStorage.getItem("niv-admin-key") || key },
        body: JSON.stringify({ to, subject: mailSubject, message: mailBody }),
      });
      const d = await res.json();
      if (res.ok && d.ok) { setMailMsg("✓ Envoyé !"); setMailSubject(""); setMailBody(""); setTimeout(() => setMailOpen(""), 1200); }
      else setMailMsg(d.error || "Échec de l'envoi.");
    } catch { setMailMsg("Erreur réseau."); }
    setMailSending(false);
  }

  function exportCSV() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Client", "Email", "Téléphone", "Segment", "Nb commandes", "Total (€)", "1ère commande", "Dernière", "À relancer"];
    const lines = [head.map(esc).join(";")];
    filtered.forEach((c) => lines.push([c.name, c.email, c.phone, c.segment, c.nb, c.total.toFixed(2), fmtDate(c.first), fmtDate(c.last), c.inactive ? "oui" : ""].map(esc).join(";")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "crm-clients.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>CRM — clients</h1>
        <input type="password" placeholder="Mot de passe" value={key} onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(key)}
          style={{ width: "100%", padding: 10, margin: "10px 0", border: "1px solid var(--line)", borderRadius: 8 }} />
        <button className="btn btn-gold" onClick={() => load(key)} style={{ width: "100%" }}>Entrer</button>
        {error && <p style={{ color: "#b4452f", marginTop: 10 }}>{error}</p>}
        <p style={{ marginTop: 20 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link></p>
      </div>
    );
  }

  const card = (label, val) => (
    <div style={{ flex: "1 1 130px", background: "#faf6ee", border: "1px solid #ece3d2", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--gold-dark)" }}>{val}</div>
      <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>{label}</div>
    </div>
  );
  const chip = (id, txt) => (
    <button onClick={() => setSeg(id)} className="filter-chip" style={{ padding: "5px 12px", fontSize: "0.85rem", borderRadius: 20, border: "1px solid var(--line)", background: seg === id ? "var(--gold-dark)" : "#fff", color: seg === id ? "#fff" : "var(--ink)", fontWeight: 600, cursor: "pointer" }}>{txt}</button>
  );

  return (
    <div className="container" style={{ padding: "30px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: 0 }}>👥 CRM — clients</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link>
      </div>
      {loading && <p>Chargement…</p>}
      {error && <div className="notice">{error}</div>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        {card("Clients", String(kpis.clients))}
        {card("CA total", euro(kpis.ca))}
        {card("Panier moyen", euro(kpis.panier))}
        {card("Clients VIP", String(kpis.vip))}
        {card("À relancer", String(kpis.relance))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {chip("all", "Tous")}
        {chip("VIP", "⭐ VIP")}
        {chip("Fidèle", "Fidèles")}
        {chip("Nouvelle", "Nouveaux")}
        {chip("relance", `À relancer (${kpis.relance})`)}
        <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem", marginLeft: "auto" }} onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom, e-mail, téléphone)…"
        style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 12 }} />

      {!filtered.length && <p style={{ color: "var(--ink-soft)" }}>Aucun client pour ce filtre.</p>}

      {filtered.map((c, i) => (
        <div key={c.key} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, marginBottom: 10, background: "#fff" }}>
          <div style={{ cursor: "pointer" }} onClick={() => setOpen(open === i ? -1 : i)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong>
                {c.name}{" "}
                <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 20, background: "#f3efe6", color: segColors[c.segment], fontWeight: 600 }}>
                  {c.segment === "VIP" ? "⭐ VIP" : c.segment}
                </span>
                {c.inactive && <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 20, background: "#fbeaea", color: "#b4452f", fontWeight: 600, marginLeft: 6 }}>à relancer</span>}
                {" "}<span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>{open === i ? "▾" : "▸"}</span>
              </strong>
              <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{euro(c.total)}</span>
            </div>
            <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
              {c.email ? <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()}>{c.email}</a> : "—"}
              {c.phone ? ` · ${c.phone}` : ""} · {c.nb} commande{c.nb > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 2 }}>
              {c.first ? `1ʳᵉ : ${fmtDate(c.first)}` : ""}{c.last && c.nb > 1 ? ` · dernière : ${fmtDate(c.last)}` : ""}
            </div>
          </div>

          {open === i && (
            <div style={{ marginTop: 10, borderTop: "1px dashed var(--line)", paddingTop: 10 }}>
              {c.orders.map((ord, j) => {
                const label = ord.status === "livree" ? "✓✓ Livrée" : ord.status === "expediee" ? "✓ Expédiée" : "● À préparer";
                const col = ord.status === "livree" || ord.status === "expediee" ? "#256b34" : "#b4452f";
                return (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.88rem", marginBottom: 6 }}>
                    <strong>#{ord.ref}</strong>
                    <span style={{ color: "var(--ink-soft)" }}>{fmtDate(ord.createdAt)}</span>
                    <span style={{ color: col, fontWeight: 600 }}>{label}</span>
                    <span style={{ color: "var(--ink-soft)" }}>{euro(ord.total)}</span>
                    {ord.tracking && (
                      <a href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(ord.tracking)}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem" }}>📍 Suivi</a>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 4 }}>📝 Note privée</label>
                <textarea value={noteDraft[c.key] ?? notes[c.key] ?? ""} onChange={(e) => setNoteDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                  placeholder="Ex. Préfère l'argenté · cliente mariage · à rappeler…"
                  style={{ width: "100%", minHeight: 54, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                <button className="btn btn-outline" style={{ marginTop: 6, padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => saveNote(c.key)}>
                  Enregistrer la note {savedNote === c.key ? "✓" : ""}
                </button>
              </div>

              {c.email && (
                <div style={{ marginTop: 12, borderTop: "1px dashed var(--line)", paddingTop: 10 }}>
                  {mailOpen !== c.email ? (
                    <button className="btn btn-gold" style={{ padding: "5px 14px", fontSize: "0.85rem" }} onClick={() => { setMailOpen(c.email); setMailSubject(""); setMailBody(""); setMailMsg(""); }}>✉️ Écrire à ce client</button>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      <strong style={{ fontSize: "0.85rem" }}>Écrire à {c.email}</strong>
                      <input value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} placeholder="Sujet" style={{ padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                      <textarea value={mailBody} onChange={(e) => setMailBody(e.target.value)} placeholder="Votre message…" style={{ minHeight: 90, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-gold" style={{ padding: "6px 14px", fontSize: "0.85rem" }} disabled={mailSending} onClick={() => sendMail(c.email)}>{mailSending ? "Envoi…" : "Envoyer"}</button>
                        <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={() => setMailOpen("")}>Annuler</button>
                      </div>
                      {mailMsg && <div style={{ fontSize: "0.85rem", color: mailMsg.startsWith("✓") ? "#256b34" : "#b4452f" }}>{mailMsg}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 14 }}>
        « À relancer » = clients sans commande depuis plus de 90 jours. Données issues des vraies commandes (hors tests, annulées, remboursées). Gratuit.
      </p>
    </div>
  );
}
