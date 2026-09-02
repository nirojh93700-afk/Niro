"use client";

// =============================================================================
// FILE DE PRODUCTION — /gestion/commandes
// -----------------------------------------------------------------------------
// « Un truc propre, dans l'ordre, pour ne pas mélanger les commandes. »
// Une carte compacte par commande, numérotée dans l'ordre de traitement
// (urgentes d'abord, puis par date), rangée en 3 colonnes : À préparer ·
// En fabrication · Expédiées récentes. Note interne + étiquettes par commande.
// La fiche complète (adresse, prix détaillé, aperçu, fichiers) reste dans
// Gestion → Commandes : bouton « Fiche complète → ».
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";

const FLAGS = [
  { id: "urgent", label: "🚨 Urgent" },
  { id: "attend", label: "⏳ Accepte d'attendre" },
  { id: "cadeau", label: "🎁 Cadeau promis" },
  { id: "gravure_offerte", label: "🎨 Gravure offerte" },
  { id: "attente_client", label: "❓ En attente du client" },
  { id: "appel", label: "📞 À rappeler" },
];
const ACTIFS = new Set(["", "a_preparer", "en_gravure"]);
const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

function age(iso) {
  const t = Date.parse(iso || ""); if (!t) return "";
  const j = Math.floor((Date.now() - t) / 86400000);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  return `il y a ${j} j`;
}
function dateFr(iso) {
  const d = new Date(iso || ""); if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function livraison(o) {
  const m = String(o.shippingMethod || "").toLowerCase();
  if (o.relaisPoint || m.includes("relais")) return "🏪 Point relais";
  if (m.includes("main propre") || o.status === "remise_main_propre") return "🤝 Retrait";
  return "🏠 Domicile";
}
function estUrgent(o) { return o.immediateStart || (o.flags || []).includes("urgent"); }

export default function FileProductionPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [unread, setUnread] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async (adminKey) => {
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } });
      if (!res.ok) { setError("Mot de passe incorrect."); setAuthed(false); return; }
      const d = await res.json();
      sessionStorage.setItem("niv-admin-key", adminKey);
      setKey(adminKey); setAuthed(true);
      setOrders((d.orders || []).filter((o) => !o.test));
      try {
        const u = await fetch("/api/admin/bat?action=unread", { headers: { "x-admin-key": adminKey } });
        if (u.ok) setUnread((await u.json()).unread || []);
      } catch { /* ignore */ }
    } catch { setError("Erreur de chargement."); }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) load(saved);
  }, [load]);

  // Ordre de traitement : urgentes d'abord, puis les plus anciennes en premier (FIFO).
  const actives = useMemo(() => {
    const list = orders.filter((o) => ACTIFS.has(o.status || ""));
    list.sort((a, b) => (estUrgent(b) - estUrgent(a)) || (Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0)));
    return list.map((o, i) => ({ ...o, pos: i + 1 }));
  }, [orders]);
  const match = (o) => {
    const s = q.trim().toLowerCase(); if (!s) return true;
    return [o.ref, o.customerName, o.customerEmail, ...(o.items || []).map((i) => i.name)].join(" ").toLowerCase().includes(s);
  };
  const aPreparer = actives.filter((o) => !o.status || o.status === "a_preparer").filter(match);
  const enFab = actives.filter((o) => o.status === "en_gravure").filter(match);
  const expediees = orders.filter((o) => ["expediee", "remise_main_propre"].includes(o.status)).filter(match)
    .sort((a, b) => Date.parse(b.shippedAt || b.createdAt || 0) - Date.parse(a.shippedAt || a.createdAt || 0)).slice(0, 12);
  const terminees = orders.filter((o) => ["livree", "annulee", "remboursee"].includes(o.status)).filter(match)
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
  const nbUnread = actives.filter((o) => unread.includes(o.id)).length;
  const nbUrgent = actives.filter(estUrgent).length;

  async function setStatus(o, status) {
    let tracking = "";
    if (status === "expediee") {
      tracking = window.prompt(`Numéro de suivi pour #${o.ref} (laisser vide si aucun) :`, o.tracking || "") ?? null;
      if (tracking === null) return;
    }
    if (status === "livree" && !window.confirm(`Marquer #${o.ref} comme livrée ?`)) return;
    setBusy(o.id);
    try {
      await fetch("/api/admin/orders", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id, status, tracking: tracking || undefined, notifyCustomer: status === "expediee" && Boolean(tracking) }),
      });
      await load(key);
    } finally { setBusy(""); }
  }

  async function annotate(o, patch) {
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, ...patch } : x))); // optimiste
    await fetch("/api/admin/orders", {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id: o.id, action: "annotate", ...patch }),
    });
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>File de production</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {error ? <div className="notice">{error}</div> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="container file" style={{ padding: "28px 16px 60px" }}>
      <PageHead eyebrow="Commandes" title="File de production" subtitle="Dans l'ordre de traitement : les urgentes d'abord, puis les plus anciennes. Une carte par commande, rien ne se mélange."
        actions={<><Link href="/gestion/atelier" className="btn btn-outline">🛠️ Atelier</Link><Link href="/gestion#commandes" className="btn btn-outline">Fiches complètes</Link></>} />

      <div className="file-kpis">
        <div className="file-kpi"><small>À préparer</small><b>{actives.filter((o) => !o.status || o.status === "a_preparer").length}</b></div>
        <div className="file-kpi"><small>En fabrication</small><b>{actives.filter((o) => o.status === "en_gravure").length}</b></div>
        <div className={`file-kpi${nbUnread ? " alert" : ""}`}><small>Réponses clientes</small><b>{nbUnread}</b></div>
        <div className={`file-kpi${nbUrgent ? " alert" : ""}`}><small>Urgentes</small><b>{nbUrgent}</b></div>
      </div>

      <div className="file-tools">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (n° de commande, nom, e-mail, produit)…" />
        <button className="btn btn-outline" onClick={() => load(key)}>↻ Actualiser</button>
      </div>

      {error ? <div className="notice">{error}</div> : null}

      <div className="file-cols">
        <Colonne titre="● À préparer" n={aPreparer.length} vide="Rien à préparer 🎉">
          {aPreparer.map((o) => <Carte key={o.id} o={o} unread={unread.includes(o.id)} busy={busy === o.id} onStatus={setStatus} onAnnotate={annotate} />)}
        </Colonne>
        <Colonne titre="✏️ En fabrication" n={enFab.length} vide="Aucune pièce en cours.">
          {enFab.map((o) => <Carte key={o.id} o={o} unread={unread.includes(o.id)} busy={busy === o.id} onStatus={setStatus} onAnnotate={annotate} />)}
        </Colonne>
        <Colonne titre="📦 Expédiées récemment" n={expediees.length} vide="Aucune expédition récente.">
          {expediees.map((o) => <Carte key={o.id} o={o} unread={unread.includes(o.id)} busy={busy === o.id} onStatus={setStatus} onAnnotate={annotate} compact />)}
        </Colonne>
      </div>

      <details className="file-done" open={showDone} onToggle={(e) => setShowDone(e.currentTarget.open)}>
        <summary>Terminées, annulées, remboursées ({terminees.length})</summary>
        <div className="file-cols" style={{ marginTop: 10 }}>
          <div className="file-col" style={{ gridColumn: "1 / -1", background: "transparent", border: "none", padding: 0 }}>
            {terminees.map((o) => <Carte key={o.id} o={o} unread={false} busy={false} onStatus={setStatus} onAnnotate={annotate} compact />)}
          </div>
        </div>
      </details>
    </div>
  );
}

function Colonne({ titre, n, vide, children }) {
  return (
    <div className="file-col">
      <div className="file-col-h"><span>{titre}</span><span className="n">{n}</span></div>
      {n === 0 ? <div className="file-empty">{vide}</div> : children}
    </div>
  );
}

function Carte({ o, unread, busy, onStatus, onAnnotate, compact }) {
  const [note, setNote] = useState(o.adminNote || "");
  const [editing, setEditing] = useState(false);
  const flags = o.flags || [];
  const statut = o.status || "a_preparer";
  const chipStatut = { a_preparer: ["prep", "À préparer"], en_gravure: ["grav", "En fabrication"], expediee: ["exp", "Expédiée"], remise_main_propre: ["exp", "Remise en main propre"], livree: ["liv", "Livrée"], annulee: ["ann", "Annulée"], remboursee: ["ann", "Remboursée"] }[statut] || ["prep", statut];
  const ref = o.ref || (o.id || "").slice(-6);
  const cadeau = o.cadeauChoix ? (() => { const lib = (v) => ({ surprise: "surprise", femme: "plutôt femme", homme: "plutôt homme" })[v] || v; const p = String(o.cadeauChoix).split("+").filter(Boolean); return p.length === 2 ? `🎁🎁 ${lib(p[0])} + ${lib(p[1])}` : `🎁 ${lib(o.cadeauChoix)}`; })() : "";

  return (
    <div className={`file-card${estUrgent(o) ? " urgent" : flags.includes("attend") || flags.includes("attente_client") ? " attente" : ""}`}>
      <div className="file-card-top">
        <div>
          {o.pos ? <span className="file-pos">{o.pos}</span> : null}
          <span className="file-ref">#{ref}</span>
          <span className={`dash-chip ${chipStatut[0]}`} style={{ marginLeft: 8 }}>{chipStatut[1]}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800 }}>{euro(o.total)}</div>
          <div className="file-age" title={dateFr(o.createdAt)}>{age(o.createdAt)} · {dateFr(o.createdAt)}</div>
        </div>
      </div>

      <div className="file-who"><strong>{o.customerName || "—"}</strong> <span>· {livraison(o)}{o.relaisPoint?.name ? ` — ${o.relaisPoint.name}` : ""}</span></div>

      <ul className="file-items">
        {(o.items || []).filter((it) => !/livraison|point relais|retrait/i.test(it.name || "")).map((it, i) => (
          <li key={i}>
            <span className="q">{it.quantity}×</span>
            <span>
              {it.name}
              {!compact && it.details ? <span className="d">{it.details}</span> : null}
              {!compact && it.personalization ? <span className="d">✍️ {it.personalization}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {!compact && (o.demande || o.messageGraver || o.demandeGravure) ? (
        <div className="file-note-box">
          {o.demande ? <div>📋 <strong>Sur mesure :</strong> {o.demande}</div> : null}
          {o.messageGraver ? <div>✍️ <strong>À graver :</strong> {o.messageGraver}</div> : null}
          {o.demandeGravure ? <div>✍️ <strong>Précisions :</strong> {o.demandeGravure}</div> : null}
        </div>
      ) : null}
      {o.alerteInterne ? <div className="file-note-box red">🚨 {o.alerteInterne}</div> : null}

      <div className="file-chips">
        {o.immediateStart ? <span className="file-chip red">⚡ Fabrication immédiate</span> : null}
        {unread ? <span className="file-chip red">📬 Nouvelle réponse</span> : null}
        {cadeau ? <span className="file-chip on">{cadeau}</span> : null}
        {o.tracking ? <span className="file-chip green">📦 {o.tracking}</span> : null}
        {FLAGS.map((f) => (
          <button key={f.id} type="button" className={`file-chip btn${flags.includes(f.id) ? " on" : ""}`} title="Cliquer pour activer/retirer"
            onClick={() => onAnnotate(o, { flags: flags.includes(f.id) ? flags.filter((x) => x !== f.id) : [...flags, f.id] })}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="file-note">
        {editing ? (
          <>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne (visible seulement ici)…" autoFocus />
            <div className="file-actions">
              <button className="btn btn-gold" onClick={() => { onAnnotate(o, { adminNote: note }); setEditing(false); }}>Enregistrer la note</button>
              <button className="btn btn-outline" onClick={() => { setNote(o.adminNote || ""); setEditing(false); }}>Annuler</button>
            </div>
          </>
        ) : (
          <div onClick={() => setEditing(true)} style={{ cursor: "text", fontSize: "0.86rem", color: o.adminNote ? "var(--ink)" : "var(--ink-soft)", whiteSpace: "pre-line", padding: "6px 8px", border: "1px dashed var(--line)", borderRadius: 8 }}>
            {o.adminNote || "📝 Ajouter une note interne…"}
          </div>
        )}
      </div>

      <div className="file-actions">
        {statut === "a_preparer" ? <button className="btn btn-gold" disabled={busy} onClick={() => onStatus(o, "en_gravure")}>✏️ Commencer la fabrication</button> : null}
        {(statut === "a_preparer" || statut === "en_gravure") ? <button className="btn btn-outline" disabled={busy} onClick={() => onStatus(o, "expediee")}>📦 Expédiée (n° de suivi)</button> : null}
        {statut === "expediee" ? <button className="btn btn-outline" disabled={busy} onClick={() => onStatus(o, "livree")}>✓✓ Livrée</button> : null}
        <Link href={`/gestion?q=${encodeURIComponent(ref)}#commandes`} className="btn btn-outline">Fiche complète →</Link>
      </div>
    </div>
  );
}
