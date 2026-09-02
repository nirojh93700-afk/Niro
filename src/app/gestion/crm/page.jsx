"use client";

// =============================================================================
// PAGE CRM (réservée admin) — relation client, à partir des VRAIES commandes.
// Clients regroupés par e-mail · segments (VIP / Fidèle / Nouvelle / À relancer)
// · tableau de bord · recherche · historique commandes + suivi · notes privées
// · envoi d'e-mail à l'image de la marque · export CSV. Gratuit (données déjà là).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";

const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const DAY = 86400000;
const segColors = { VIP: "#8a6d3b", "Fidèle": "#256b34", Nouvelle: "#5b6b8a" };

// Onglet "hub" : mène vers un outil existant (rangé sous le CRM, rien n'est supprimé).
function HubTab({ emoji, title, desc, href, cta, secondaryHref, secondaryCta, extra }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eadfc4", borderRadius: 14, padding: "24px 20px", textAlign: "center", maxWidth: 520, margin: "6px auto 0", boxShadow: "0 1px 3px rgba(60,45,15,.05)" }}>
      <div style={{ fontSize: 40, marginBottom: 6 }}>{emoji}</div>
      <h2 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: "0 0 6px" }}>{title}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", margin: "0 auto 16px", maxWidth: 430, lineHeight: 1.55 }}>{desc}</p>
      {extra}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href={href} className="btn btn-gold" style={{ padding: "9px 20px" }}>{cta} →</Link>
        {secondaryHref && <Link href={secondaryHref} className="btn btn-outline" style={{ padding: "9px 20px" }}>{secondaryCta}</Link>}
      </div>
    </div>
  );
}

export default function CrmPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [seg, setSeg] = useState("all");
  const [crmTab, setCrmTab] = useState("clients");
  const [open, setOpen] = useState(-1);
  const [noteDraft, setNoteDraft] = useState({});
  const [savedNote, setSavedNote] = useState("");
  const [mailOpen, setMailOpen] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailMsg, setMailMsg] = useState("");
  const [mailSending, setMailSending] = useState(false);
  const [subs, setSubs] = useState([]); // abonnées newsletter : [{email,date}]
  const [selSubs, setSelSubs] = useState(() => new Set()); // e-mails sélectionnés pour l'envoi
  const [nlSubject, setNlSubject] = useState("Votre −10 % vous attend chez Niv Création 💛");
  const [nlBody, setNlBody] = useState("Bonjour,\n\nVous vous êtes inscrite récemment — merci ! Petit rappel : votre code BIENVENUE10 (−10 % sur votre première commande) est toujours valable.\n\nEn ce moment, nos clientes adorent nos cristaux photo 3D et nos bijoux gravés — gravés en France, livraison rapide et suivie.\n\nEt pour vous faire plaisir en toute sérénité, vous pouvez payer en plusieurs fois sans frais : 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €).\n\nDécouvrez tout sur nivcreation.fr et profitez de vos −10 % !\n\nÀ très vite,\nNiv Création");
  const [nlSending, setNlSending] = useState(false);
  const [nlMsg, setNlMsg] = useState("");
  function toggleSub(email) { setSelSubs((prev) => { const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n; }); }
  async function sendNewsletterTo() {
    const recipients = [...selSubs];
    if (!recipients.length) { setNlMsg("Sélectionne au moins une personne."); return; }
    if (!nlSubject.trim()) { setNlMsg("Ajoute un sujet."); return; }
    if (!window.confirm(`Envoyer ce mail à ${recipients.length} personne(s) ?`)) return;
    setNlSending(true); setNlMsg("");
    try {
      const r = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ subject: nlSubject, message: nlBody, recipients }),
      });
      const d = await r.json();
      if (r.ok && d.ok) { setNlMsg(`✓ Envoyé à ${d.sent}/${d.total} personne(s).`); setSelSubs(new Set()); }
      else setNlMsg(d.error || "Échec de l'envoi.");
    } catch { setNlMsg("Erreur réseau."); }
    setNlSending(false);
  }

  const load = useCallback(async (adminKey) => {
    setLoading(true); setError("");
    try {
      const [or, st, nl] = await Promise.all([
        fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/newsletter", { headers: { "x-admin-key": adminKey } }),
      ]);
      if (!or.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      const od = await or.json();
      setOrders(od.orders || []);
      if (st.ok) { const s = (await st.json()).settings || {}; setNotes(s.crmNotes || {}); setTags(s.crmTags || {}); }
      if (nl.ok) { const n = await nl.json(); setBirthdays(n.birthdays || {}); setSubs(Array.isArray(n.subscribers) ? n.subscribers : []); }
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

  // --- Étiquettes (tags) par cliente ---
  const [tags, setTags] = useState({});
  const [tagDraft, setTagDraft] = useState({});
  async function saveTags(next) {
    setTags(next);
    try {
      await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": sessionStorage.getItem("niv-admin-key") || key }, body: JSON.stringify({ crmTags: next }) });
    } catch { /* ignore */ }
  }
  function addTag(emailKey, value) {
    const t = String(value || "").trim(); if (!t) return;
    const cur = tags[emailKey] || [];
    if (cur.includes(t)) return;
    saveTags({ ...tags, [emailKey]: [...cur, t].slice(0, 12) });
  }
  function removeTag(emailKey, t) {
    const cur = (tags[emailKey] || []).filter((x) => x !== t);
    const next = { ...tags }; if (cur.length) next[emailKey] = cur; else delete next[emailKey];
    saveTags(next);
  }

  // --- CA par mois (12 derniers mois) ---
  const monthlyCA = (() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ m: 0, label: "" }));
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("fr-FR", { month: "short" }) }); }
    const idx = Object.fromEntries(months.map((mo, i) => [mo.key, i]));
    months.forEach((mo, i) => { arr[i].label = mo.label; });
    for (const o of valid) {
      if (!o.createdAt) continue;
      const d = new Date(o.createdAt); const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (k in idx) arr[idx[k]].m += Number(o.total) || 0;
    }
    return arr;
  })();
  const maxCA = Math.max(1, ...monthlyCA.map((x) => x.m));

  // --- Anniversaires (remise à venir, 3 jours avant) ---
  const [birthdays, setBirthdays] = useState({});
  const [bdaySending, setBdaySending] = useState(false);
  const [bdayMsg, setBdayMsg] = useState("");

  // Clientes dont l'anniversaire tombe dans les 3 prochains jours (J inclus).
  const upcomingBirthdays = (() => {
    const today = new Date();
    const out = [];
    for (const [email, date] of Object.entries(birthdays || {})) {
      const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date || "");
      if (!m) continue;
      const mm = +m[1], dd = +m[2];
      for (let add = 0; add <= 3; add++) {
        const d = new Date(today); d.setDate(today.getDate() + add);
        if (d.getMonth() + 1 === mm && d.getDate() === dd) { out.push({ email, date, inDays: add }); break; }
      }
    }
    return out.sort((a, b) => a.inDays - b.inDays);
  })();

  async function sendBirthdayDiscount() {
    if (!upcomingBirthdays.length) return;
    const code = "ANNIV15";
    if (!confirm(`Créer le code ${code} (-15 %) et l'envoyer à ${upcomingBirthdays.length} cliente(s) qui ont bientôt leur anniversaire ?`)) return;
    setBdaySending(true); setBdayMsg("");
    const ak = sessionStorage.getItem("niv-admin-key") || key;
    try {
      await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": ak }, body: JSON.stringify({ code, type: "percent", value: 15 }) });
      let ok = 0;
      for (const b of upcomingBirthdays) {
        const message = `Bonjour,\n\nToute l'équipe Niv Création vous souhaite un très joyeux anniversaire en avance.\nPour l'occasion, profitez de -15 % sur votre commande avec le code ${code}.\n\nBelle journée,\nL'atelier Niv Création`;
        try { const r = await fetch("/api/admin/send-client-email", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": ak }, body: JSON.stringify({ to: b.email, subject: "Joyeux anniversaire ✦ une surprise pour vous", message }) }); if (r.ok) ok++; } catch { /* ignore */ }
        await new Promise((res) => setTimeout(res, 350));
      }
      setBdayMsg(`✓ Envoyé à ${ok} cliente(s). Code ${code} actif.`);
    } catch { setBdayMsg("Erreur pendant l'envoi."); }
    setBdaySending(false);
  }

  // --- Campagne remise (envoyer un code promo à un groupe de clientes) ---
  const [campOpen, setCampOpen] = useState(false);
  const [campSeg, setCampSeg] = useState("all");
  const [campPct, setCampPct] = useState(10);
  const [campCode, setCampCode] = useState("MERCI10");
  const [campSubject, setCampSubject] = useState("Une remise rien que pour vous ✦ Niv Création");
  const [campMsg, setCampMsg] = useState("Bonjour {PRENOM},\n\nMerci pour votre confiance chez Niv Création.\nPour vous remercier, profitez de -{PCT}% sur votre prochaine commande avec le code {CODE}.\n\nÀ très vite,\nL'atelier Niv Création");
  const [campRunning, setCampRunning] = useState(false);
  const [campResult, setCampResult] = useState("");

  function campRecipients() {
    return clients.filter((c) => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)).filter((c) => {
      if (campSeg === "all") return true;
      if (campSeg === "relance") return c.inactive;
      return c.segment === campSeg;
    });
  }

  async function runCampaign() {
    const recip = campRecipients();
    if (!recip.length) { setCampResult("Aucune cliente dans ce groupe."); return; }
    const code = campCode.trim().toUpperCase();
    if (!code || !(campPct > 0)) { setCampResult("Code et pourcentage requis."); return; }
    if (!confirm(`Créer le code ${code} (-${campPct}%) et l'envoyer à ${recip.length} cliente(s) ?`)) return;
    setCampRunning(true); setCampResult("");
    const ak = sessionStorage.getItem("niv-admin-key") || key;
    try {
      // 1) créer/mettre à jour le code promo
      await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": ak }, body: JSON.stringify({ code, type: "percent", value: Number(campPct) }) });
      // 2) envoyer l'e-mail à chaque cliente
      let ok = 0, fail = 0;
      for (const c of recip) {
        const prenom = (c.name || "").split(" ")[0] || "";
        const message = campMsg.replaceAll("{PRENOM}", prenom).replaceAll("{CODE}", code).replaceAll("{PCT}", String(campPct));
        try {
          const r = await fetch("/api/admin/send-client-email", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": ak }, body: JSON.stringify({ to: c.email, subject: campSubject, message }) });
          if (r.ok) ok++; else fail++;
        } catch { fail++; }
        await new Promise((res) => setTimeout(res, 350)); // petite pause anti-limite
        setCampResult(`Envoi en cours… ${ok + fail}/${recip.length}`);
      }
      setCampResult(`✓ Terminé : ${ok} envoyé(s)${fail ? `, ${fail} échec(s)` : ""}. Code ${code} actif.`);
    } catch { setCampResult("Erreur pendant la campagne."); }
    setCampRunning(false);
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
      <PageHead eyebrow="Clients" title="Clients (CRM)" subtitle="Toutes tes clientes, leurs commandes, leurs notes et leurs segments." />
      <p style={{ color: "var(--ink-soft)", marginTop: 4 }}>Tous tes clients et tes échanges, au même endroit — bien rangés.</p>
      {loading && <p>Chargement…</p>}
      {error && <div className="notice">{error}</div>}

      {/* Onglets du CRM (chaque onglet = un outil existant, regroupé ici) */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "4px 0 10px", margin: "8px 0 16px", borderBottom: "1px solid var(--line)" }}>
        {[["clients", "👥 Clients"], ["messages", "💬 Messages & modèles"], ["mail", "📩 Boîte mail"], ["campagnes", "📣 Campagnes & relances"], ["fidelite", "🎁 Fidélité & parrainage"], ["avis", "⭐ Avis"]].map(([id, txt]) => (
          <button key={id} onClick={() => setCrmTab(id)} style={{ flex: "0 0 auto", padding: "8px 13px", borderRadius: 999, border: "1px solid var(--line)", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", background: crmTab === id ? "#241a0c" : "#fff", color: crmTab === id ? "#f3e8d3" : "var(--ink-soft)" }}>{txt}</button>
        ))}
      </div>

      {crmTab === "clients" && (<>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
        {card("Clients", String(kpis.clients))}
        {card("CA total", euro(kpis.ca))}
        {card("Panier moyen", euro(kpis.panier))}
        {card("Clients VIP", String(kpis.vip))}
        {card("À relancer", String(kpis.relance))}
      </div>

      {/* Graphique CA par mois */}
      <div className="admin-block" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 10px" }}>📈 Chiffre d'affaires — 12 derniers mois</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
          {monthlyCA.map((mo, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }} title={`${mo.label} : ${euro(mo.m)}`}>
              <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)" }}>{mo.m > 0 ? Math.round(mo.m) : ""}</span>
              <div style={{ width: "100%", height: `${Math.max(2, (mo.m / maxCA) * 100)}px`, background: "var(--gold)", borderRadius: "4px 4px 0 0", opacity: mo.m > 0 ? 1 : 0.25 }} />
              <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)" }}>{mo.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {chip("all", "Tous")}
        {chip("VIP", "⭐ VIP")}
        {chip("Fidèle", "Fidèles")}
        {chip("Nouvelle", "Nouveaux")}
        {chip("relance", `À relancer (${kpis.relance})`)}
        <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.85rem", marginLeft: "auto" }} onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {/* Anniversaires à venir (3 jours avant) */}
      {upcomingBirthdays.length > 0 && (
        <div className="admin-block" style={{ marginBottom: 14, background: "#fbf4e6", border: "1px solid #e7d3a1" }}>
          <h3 style={{ margin: "0 0 6px" }}>🎂 Anniversaires à venir ({upcomingBirthdays.length})</h3>
          <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: "0.88rem" }}>
            {upcomingBirthdays.map((b) => (
              <li key={b.email}>{b.email} — {b.inDays === 0 ? "aujourd'hui" : `dans ${b.inDays} j`}</li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-gold" onClick={sendBirthdayDiscount} disabled={bdaySending}>{bdaySending ? "Envoi…" : "Envoyer la remise d'anniversaire (−15 %)"}</button>
            {bdayMsg ? <span style={{ fontSize: "0.85rem", color: bdayMsg.startsWith("✓") ? "#256b34" : "var(--ink-soft)" }}>{bdayMsg}</span> : null}
          </div>
        </div>
      )}

      {/* Campagne remise */}
      <div className="admin-block" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-gold" style={{ padding: "8px 16px" }} onClick={() => setCampOpen(!campOpen)}>
            {campOpen ? "Fermer la campagne" : "🎁 Envoyer une remise à mes clientes"}
          </button>
          <button className="btn btn-outline" style={{ padding: "8px 16px" }} onClick={() => { setCampSeg("relance"); setCampSubject("Vous nous manquez ✦ Niv Création"); setCampMsg("Bonjour {PRENOM},\n\nCela fait un moment ! Pour vous revoir, profitez de -{PCT}% sur votre prochaine commande avec le code {CODE}.\n\nÀ très vite,\nL'atelier Niv Création"); setCampOpen(true); }}>
            🔔 Relancer les inactives
          </button>
        </div>
        {campOpen && (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Envoyer à</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["all", "Toutes"], ["VIP", "⭐ VIP"], ["Fidèle", "Fidèles"], ["Nouvelle", "Nouvelles"], ["relance", "À relancer"]].map(([v, l]) => (
                  <button key={v} className={`filter-chip ${campSeg === v ? "active" : ""}`} style={{ padding: "4px 12px" }} onClick={() => setCampSeg(v)}>{l}</button>
                ))}
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "6px 0 0" }}>{campRecipients().length} cliente(s) recevront l'e-mail.</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Remise (%)
                <input type="number" min="1" max="90" value={campPct} onChange={(e) => { const v = e.target.value; setCampPct(v); setCampCode("MERCI" + (v || "")); }} style={{ display: "block", width: 100, padding: 8, border: "1px solid var(--line)", borderRadius: 8, font: "inherit", marginTop: 4 }} />
              </label>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Code
                <input value={campCode} onChange={(e) => setCampCode(e.target.value.toUpperCase())} style={{ display: "block", width: 160, padding: 8, border: "1px solid var(--line)", borderRadius: 8, font: "inherit", marginTop: 4 }} />
              </label>
            </div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Objet
              <input value={campSubject} onChange={(e) => setCampSubject(e.target.value)} style={{ display: "block", width: "100%", padding: 8, border: "1px solid var(--line)", borderRadius: 8, font: "inherit", marginTop: 4 }} />
            </label>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Message
              <textarea value={campMsg} onChange={(e) => setCampMsg(e.target.value)} rows={6} style={{ display: "block", width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 8, font: "inherit", marginTop: 4 }} />
            </label>
            <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>Astuce : <code>{"{PRENOM}"}</code>, <code>{"{CODE}"}</code> et <code>{"{PCT}"}</code> sont remplacés automatiquement.</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-gold" onClick={runCampaign} disabled={campRunning}>{campRunning ? "Envoi…" : `Créer le code + envoyer (${campRecipients().length})`}</button>
              {campResult ? <span style={{ fontSize: "0.85rem", color: campResult.startsWith("✓") ? "#256b34" : "var(--ink-soft)" }}>{campResult}</span> : null}
            </div>
          </div>
        )}
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
                      <a href="https://shipping.boxtal.com/fr/fr/centrale-expeditions/suivi" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem" }} title="Ouvrir le suivi sur Boxtal">📍 Suivi Boxtal</a>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: 4 }}>🏷️ Étiquettes</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {(tags[c.key] || []).map((t) => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f3efe6", borderRadius: 16, padding: "2px 6px 2px 10px", fontSize: "0.8rem" }}>
                      {t}
                      <button onClick={() => removeTag(c.key, t)} aria-label="retirer" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9a8f7d", fontSize: 14, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                  <input value={tagDraft[c.key] || ""} onChange={(e) => setTagDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { addTag(c.key, tagDraft[c.key]); setTagDraft((d) => ({ ...d, [c.key]: "" })); } }}
                    placeholder="ajouter une étiquette + Entrée" style={{ padding: "5px 9px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", fontSize: "0.8rem", minWidth: 170 }} />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
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
      </>)}

      {crmTab === "messages" && (
        <HubTab emoji="💬" title="Messages & modèles"
          desc="Tes modèles de messages réutilisables (parrainage, remerciement, avis, cashback…), à réutiliser dans la fiche d'un client ou à copier pour WhatsApp — et les envois programmés / automatiques."
          href="/gestion/messages" cta="Ouvrir les messages" />
      )}
      {crmTab === "mail" && (
        <HubTab emoji="📩" title="Boîte mail"
          desc="Tes échanges e-mail avec les clients, depuis ta boîte Gmail connectée : lire, répondre, envoyer."
          href="/gestion/boite-mail" cta="Ouvrir la boîte mail" />
      )}
      {crmTab === "campagnes" && (() => {
        const buyers = new Set(orders.filter((o) => !o.test).map((o) => (o.customerEmail || "").toLowerCase()).filter(Boolean));
        const list = [...subs].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        const nonAcheteurs = list.filter((s) => !buyers.has((s.email || "").toLowerCase())).length;
        const fmtD = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }); } catch { return "—"; } };
        const exportSubs = () => {
          const rows = [["Email", "Date inscription", "A commandé"]].concat(list.map((s) => [s.email, s.date ? new Date(s.date).toLocaleDateString("fr-FR") : "", buyers.has((s.email || "").toLowerCase()) ? "oui" : "non"]));
          const csv = "﻿" + rows.map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
          const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "abonnees-newsletter.csv"; a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        };
        return (
          <div>
            <div style={{ background: "#fff", border: "1px solid #eadfc4", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ margin: 0, fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Abonnées newsletter ({list.length})</h2>
                <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={exportSubs} disabled={!list.length}>⬇ Exporter (CSV)</button>
              </div>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", margin: "6px 0 10px" }}>
                Elles ont reçu ton code <b>−10 %</b>. <b>Coche qui tu veux</b>, écris ton message en bas, et <b>envoie en une fois</b>. Les <b style={{ color: "#b4452f" }}>pas encore commandé</b> sont à relancer.
              </p>
              {list.length > 0 && (
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
                  <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.82rem" }} onClick={() => setSelSubs(new Set(list.map((s) => s.email)))}>Tout sélectionner</button>
                  <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.82rem" }} onClick={() => setSelSubs(new Set(list.filter((s) => !buyers.has((s.email || "").toLowerCase())).map((s) => s.email)))}>Les non-acheteurs ({nonAcheteurs})</button>
                  <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.82rem" }} onClick={() => setSelSubs(new Set())}>Aucun</button>
                  <span style={{ color: "var(--gold-dark)", fontWeight: 700, fontSize: "0.85rem" }}>{selSubs.size} sélectionné(s)</span>
                </div>
              )}
              {list.length === 0 ? (
                <p style={{ color: "var(--ink-soft)" }}>Aucune abonnée pour l&apos;instant.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                    <thead><tr>
                      <th style={{ width: 28, borderBottom: "2px solid #eadfc4", padding: "7px 6px" }}></th>
                      {["E-mail", "Inscrite le", "Statut"].map((h, i) => <th key={h} style={{ textAlign: i === 0 ? "left" : "right", borderBottom: "2px solid #eadfc4", padding: "7px 6px", color: "var(--ink-soft)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {list.map((s) => {
                        const bought = buyers.has((s.email || "").toLowerCase());
                        const sel = selSubs.has(s.email);
                        return (
                          <tr key={s.email} onClick={() => toggleSub(s.email)} style={{ borderBottom: "1px solid #f0eadd", background: sel ? "#fbf6ea" : "transparent", cursor: "pointer" }}>
                            <td style={{ padding: "7px 6px", textAlign: "center" }}><input type="checkbox" checked={sel} readOnly /></td>
                            <td style={{ padding: "7px 6px", wordBreak: "break-all" }}>{s.email}</td>
                            <td style={{ padding: "7px 6px", textAlign: "right", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{fmtD(s.date)}</td>
                            <td style={{ padding: "7px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 999, background: bought ? "#eaf3ec" : "#fbecea", color: bought ? "#2e6b3e" : "#b4452f", border: `1px solid ${bought ? "#cfe6d4" : "#f0cfc9"}` }}>{bought ? "cliente ✓" : "pas encore commandé"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {list.length > 0 && (
                <div style={{ marginTop: 14, borderTop: "1px solid #eadfc4", paddingTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Écris le message à envoyer <span style={{ color: "var(--gold-dark)" }}>({selSubs.size} destinataire{selSubs.size > 1 ? "s" : ""})</span></div>
                  <input value={nlSubject} onChange={(e) => setNlSubject(e.target.value)} placeholder="Sujet du mail" style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 8, font: "inherit" }} />
                  <textarea value={nlBody} onChange={(e) => setNlBody(e.target.value)} rows={7} placeholder="Votre message…" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", resize: "vertical" }} />
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                    <button className="btn btn-gold" style={{ padding: "9px 20px" }} disabled={nlSending || !selSubs.size} onClick={sendNewsletterTo}>{nlSending ? "Envoi…" : `Envoyer aux ${selSubs.size} sélectionné(s)`}</button>
                    {nlMsg && <span style={{ color: nlMsg.startsWith("✓") ? "#256b34" : "#b4452f", fontSize: "0.88rem" }}>{nlMsg}</span>}
                  </div>
                </div>
              )}
            </div>
            <HubTab emoji="📣" title="Campagnes & relances"
              desc="Envoie une remise à un groupe de clients (le bouton « Campagne » est dans l'onglet Clients), ou une newsletter à toutes tes abonnées."
              href="/gestion/messages" cta="Envois programmés"
              secondaryHref="/gestion#newsletter" secondaryCta="Newsletter"
              extra={<div style={{ marginBottom: 14 }}><button className="btn btn-outline" style={{ padding: "8px 18px" }} onClick={() => setCrmTab("clients")}>← Faire une campagne (onglet Clients)</button></div>} />
          </div>
        );
      })()}
      {crmTab === "fidelite" && (
        <HubTab emoji="🎁" title="Fidélité & parrainage"
          desc="Le cashback de chaque cliente et les commissions de tes parrains, mis à jour automatiquement à chaque commande."
          href="/gestion/fidelite" cta="Ouvrir Fidélité & parrainage" />
      )}
      {crmTab === "avis" && (
        <HubTab emoji="⭐" title="Avis"
          desc="Les avis clients à valider avant qu'ils s'affichent sur le site (tu gardes le contrôle : rien ne s'affiche sans ta validation)."
          href="/gestion#avis" cta="Gérer les avis" />
      )}
    </div>
  );
}
