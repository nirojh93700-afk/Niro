"use client";

// =============================================================================
// FILE DE PRODUCTION — /gestion/commandes (refaite le 04/11/2026 d'après la maquette
// validée https://claude.ai/artifact/3B7UPQuyWCkAXxSQ6Sf2rE, gérant : « c'est trop
// mélangé… range par étape, prends le meilleur des grands logiciels »).
// Chiffres du haut cliquables (filtres) · vues en onglets (Tout · À préparer · En
// fabrication · Expédiées · Par date limite · Terminées) · recherche, tri, filtres ·
// tableau à 3 colonnes sur ordinateur, une liste sur téléphone · cartes compactes
// (CarteCommande) · cases à cocher → actions groupées · « Tournée du jour ».
// Mêmes API qu'avant (/api/admin/orders statut + annotate, /api/admin/materiel,
// /api/admin/bat?action=unread). Rien de la file d'avant n'est retiré.
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Ic from "@/components/admin/IconesGestion";
import CarteCommande from "@/components/admin/CarteCommande";
import { chargerAvecCache } from "@/components/admin/adminCache";
import FenetreConditionnement from "@/components/admin/Conditionnement";
import { imprimerFiche } from "@/lib/impression";
import { ACTIFS, FILTRES, TRIS, estActive, estPartie, estFinie, etatDelai, positions, passeFiltre, rechercheTexte, trier, statutInfo, estExpress, euro, dateFr, refDe, hrefFiche } from "@/lib/fileCommandes";

const FichePapier = dynamic(() => import("@/components/admin/FichePapier"), { ssr: false });

const VUES = [["tout", "Tout"], ["prep", "À préparer"], ["fab", "En fabrication"], ["exp", "Expédiées"], ["dead", "Par date limite"], ["fin", "Terminées"]];
const STORE = "niv-file";
const lireStore = () => { try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch { return {}; } };

export default function FileProductionPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [unread, setUnread] = useState([]);
  const [error, setError] = useState("");
  const [mat, setMat] = useState(null);
  const [condOrder, setCondOrder] = useState(null);
  const [busy, setBusy] = useState("");
  const [view, setView] = useState("tout");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("ordre");
  const [filters, setFilters] = useState(() => new Set());
  const [sel, setSel] = useState(() => new Set());
  const [focus, setFocus] = useState("");
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState(null); // { texte, undo? }
  const [printQueue, setPrintQueue] = useState([]); // commandes à imprimer l'une après l'autre
  const toastT = useRef(null);

  const loadMat = useCallback(async (adminKey) => {
    try { const r = await fetch("/api/admin/materiel", { headers: { "x-admin-key": adminKey } }); if (r.ok) setMat(await r.json()); } catch { /* le bloc reste « à faire » */ }
  }, []);
  const load = useCallback(async (adminKey) => {
    setError("");
    try {
      const r = await chargerAvecCache("/api/admin/orders", adminKey, (d) => { setKey(adminKey); setAuthed(true); setOrders((d.orders || []).filter((o) => !o.test)); });
      if (r.status === 401) { setError("Mot de passe incorrect."); setAuthed(false); return; }
      if (!r.ok) { if (!r.data) setError("Erreur de chargement."); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      loadMat(adminKey);
      try { const u = await fetch("/api/admin/bat?action=unread", { headers: { "x-admin-key": adminKey } }); if (u.ok) setUnread((await u.json()).unread || []); } catch { /* ignore */ }
    } catch { setError("Erreur de chargement."); }
  }, [loadMat]);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) load(saved);
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("q")) setQ(p.get("q"));
      if (p.get("vue") && VUES.some(([v]) => v === p.get("vue"))) setView(p.get("vue"));
      const s = lireStore(); if (s.sort && TRIS.some(([t]) => t === s.sort)) setSort(s.sort);
    } catch { /* ignore */ }
  }, [load]);
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify({ ...lireStore(), sort })); } catch { /* ignore */ } }, [sort]);

  function montrer(texte, undo) {
    clearTimeout(toastT.current);
    setToast({ texte, undo });
    toastT.current = setTimeout(() => setToast(null), undo ? 10000 : 2600);
  }

  // Changement de statut : optimiste, puis l'API ; « Annuler » 10 s remet le statut d'avant
  // (sauf si un e-mail est parti : on le dit, un e-mail ne se rappelle pas).
  const setStatus = useCallback(async (o, status, extra = {}, opts = {}) => {
    const avant = o.status || "a_preparer";
    setBusy(o.id);
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status, ...(extra.tracking != null ? { tracking: extra.tracking } : {}), ...(status === "expediee" ? { shippedAt: new Date().toISOString() } : {}) } : x)));
    try {
      const r = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ id: o.id, status, ...extra }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Échec");
      const lib = statutInfo({ status }).lib.toLowerCase();
      const texte = `#${refDe(o)} ${opts.texte || lib}${extra.notifyCustomer ? (d.emailed ? " · e-mail envoyé" : " · l'e-mail n'a pas pu partir") : ""}`;
      const peutAnnuler = opts.undo && !extra.notifyCustomer;
      montrer(texte, peutAnnuler ? async () => {
        setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: avant } : x)));
        await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ id: o.id, status: avant }) });
        montrer(`#${refDe(o)} revenue en « ${statutInfo({ status: avant }).lib} »`);
      } : null);
    } catch (e) {
      setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: avant } : x)));
      montrer(`Échec : ${e.message}`);
    } finally { setBusy(""); }
  }, [key]);

  const annotate = useCallback(async (o, patch) => {
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, ...patch } : x)));
    try {
      await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ id: o.id, action: "annotate", ...patch }) });
      montrer(patch.adminNote != null ? "Note enregistrée" : "Étiquettes enregistrées");
    } catch { montrer("Échec de l'enregistrement"); }
  }, [key]);

  // ---- listes ----
  const unreadSet = useMemo(() => new Set(unread), [unread]);
  const pos = useMemo(() => positions(orders), [orders]);
  const matches = useCallback((o) => {
    const s = q.trim().toLowerCase();
    if (s && !rechercheTexte(o).includes(s)) return false;
    for (const f of filters) if (!passeFiltre(o, f, unreadSet.has(o.id))) return false;
    return true;
  }, [q, filters, unreadSet]);
  const actives = useMemo(() => orders.filter(estActive), [orders]);
  const vis = useMemo(() => orders.filter(matches), [orders, matches]);
  const prep = useMemo(() => trier(vis.filter((o) => !o.status || o.status === "a_preparer"), sort), [vis, sort]);
  const fab = useMemo(() => trier(vis.filter((o) => o.status === "en_gravure"), sort), [vis, sort]);
  const exp = useMemo(() => vis.filter(estPartie).sort((a, b) => Date.parse(b.shippedAt || b.remisAt || b.createdAt || 0) - Date.parse(a.shippedAt || a.remisAt || a.createdAt || 0)), [vis]);
  const expRecent = useMemo(() => exp.slice(0, 12), [exp]);
  const fin = useMemo(() => vis.filter(estFinie).sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)), [vis]);
  const nPrep = orders.filter((o) => !o.status || o.status === "a_preparer").length;
  const nFab = orders.filter((o) => o.status === "en_gravure").length;
  const nExp = orders.filter(estPartie).length;
  const nFin = orders.filter(estFinie).length;
  const nRep = actives.filter((o) => unreadSet.has(o.id)).length;
  const nLate = actives.filter((o) => etatDelai(o).k === "late").length;
  const nExpress = actives.filter(estExpress).length;

  // Toutes les cartes affichées, dans l'ordre de l'écran (J / K).
  const visibles = useMemo(() => {
    if (view === "tout") return [...prep, ...fab, ...expRecent];
    if (view === "prep") return prep; if (view === "fab") return fab; if (view === "exp") return exp; if (view === "fin") return fin;
    const act = [...prep, ...fab].sort((a, b) => ["late", "today", "week", "later"].indexOf(etatDelai(a).k) - ["late", "today", "week", "later"].indexOf(etatDelai(b).k) || Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0));
    return [...act, ...exp];
  }, [view, prep, fab, exp, expRecent, fin]);

  function toggleFilter(f) { setFilters((s) => { const n = new Set(s); n.has(f) ? n.delete(f) : n.add(f); return n; }); }
  function kpi(k) {
    if (k === "prep" || k === "fab" || k === "exp") { setView((v) => (v === k ? "tout" : k)); setFilters((s) => { const n = new Set(s); n.delete("late"); return n; }); }
    else { toggleFilter(k); if (k === "late" || k === "express" || k === "reponse") setView("tout"); }
  }
  function toggleSel(o) { setSel((s) => { const n = new Set(s); n.has(o.id) ? n.delete(o.id) : n.add(o.id); return n; }); }
  const selList = orders.filter((o) => sel.has(o.id));

  async function bulkFab() {
    const cibles = selList.filter((o) => !o.status || o.status === "a_preparer");
    for (const o of cibles) {
      setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: "en_gravure" } : x)));
      try { await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ id: o.id, status: "en_gravure" }) }); } catch { /* la prochaine actualisation remettra le vrai statut */ }
    }
    setSel(new Set());
    montrer(`${cibles.length} commande${cibles.length > 1 ? "s" : ""} passée${cibles.length > 1 ? "s" : ""} en fabrication`);
  }
  // Impression groupée : les fiches atelier l'une après l'autre (une feuille A4 chacune, comme « Imprimer la fiche »).
  function imprimerToutes(liste) {
    if (!liste.length) { montrer("Aucune commande à imprimer"); return; }
    setPrintQueue(liste.map((o) => o.id));
    montrer(`${liste.length} fiche${liste.length > 1 ? "s" : ""} atelier : une impression après l'autre`);
  }
  useEffect(() => {
    if (!printQueue.length) return undefined;
    const suivant = () => setPrintQueue((qq) => qq.slice(1));
    window.addEventListener("afterprint", suivant, { once: true });
    const t = setTimeout(() => imprimerFiche(), 400);
    return () => { clearTimeout(t); window.removeEventListener("afterprint", suivant); };
  }, [printQueue]);
  const etiquettesHref = (liste) => `/gestion/etiquettes?ids=${liste.map((o) => encodeURIComponent(o.id)).join(",")}`;

  // Clavier : J / K cartes, Entrée = fiche, X = cocher, / = recherche, ? = aide, Échap.
  useEffect(() => {
    const h = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if (e.key === "Escape") { if (help) setHelp(false); if (typing) e.target.blur(); return; }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("fq-q")?.focus(); return; }
      if (e.key === "?") { setHelp((v) => !v); return; }
      if (e.key === "j" || e.key === "k") {
        if (!visibles.length) return;
        let i = visibles.findIndex((o) => o.id === focus);
        i = e.key === "j" ? Math.min(visibles.length - 1, i + 1) : Math.max(0, i - 1);
        const o = visibles[i]; setFocus(o.id);
        const el = document.querySelector(`[data-card="${o.id}"]`); el?.scrollIntoView({ block: "nearest" }); el?.focus();
        return;
      }
      if (e.key === "Enter" && focus) { const o = orders.find((x) => x.id === focus); if (o) window.location.href = hrefFiche(o); return; }
      if (e.key === "x" && focus) { const o = orders.find((x) => x.id === focus); if (o) toggleSel(o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [visibles, focus, orders, help]);

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

  const carte = (o, inBoard = false) => (
    <CarteCommande key={o.id} o={o} pos={pos[o.id]} inBoard={inBoard} unread={unreadSet.has(o.id)} selected={sel.has(o.id)} onSelect={toggleSel}
      onStatus={setStatus} onAnnotate={annotate} mat={mat} onCond={setCondOrder} adminKey={key} onMat={() => loadMat(key)} busy={busy === o.id} onToast={montrer} focus={focus === o.id} />
  );
  const liste = (l, inBoard = false) => (l.length ? l.map((o) => carte(o, inBoard)) : <div className="fq-empty">Rien ici : tout est traité ✓</div>);
  const Kpi = ({ k, n, l, s, tone, on }) => <button type="button" className={`fq-kpi ${n ? tone : ""}${on ? " on" : ""}`} onClick={() => kpi(k)}><b>{n}</b><span>{l}</span>{s ? <small>{s}</small> : null}</button>;
  const groupe = (k, t, l) => (l.length ? <section className="fq-group" key={k}><h2><i className={k} />{t}<b>· {l.length}</b></h2><div className="fq-grid" style={{ marginTop: 0 }}>{liste(l)}</div></section> : null);
  const tableFin = (l) => (l.length ? (
    <div className="fq-done-body"><table>
      <thead><tr><th>Commande</th><th>Cliente</th><th>Articles</th><th>État</th><th>Total</th></tr></thead>
      <tbody>{l.map((o) => <tr key={o.id}><td className="mono"><Link className="fq-ref" href={hrefFiche(o)}>#{refDe(o)}</Link></td><td>{o.customerName || "—"}</td><td>{(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td><td><span className={`fq-pill ${statutInfo(o).tone}`}>{statutInfo(o).lib}</span> <span className="muted">{dateFr(o.deliveredAt || o.createdAt, false)}</span></td><td className="mono">{euro(o.total)}</td></tr>)}</tbody>
    </table></div>
  ) : <div className="fq-empty" style={{ margin: 10 }}>Aucune commande terminée pour cette recherche.</div>);

  return (
    <div className="fq">
      <div className="fq-head">
        <div><h1>File de production</h1><div className="sub">Dans l&apos;ordre de traitement : Express et urgentes d&apos;abord, puis les premières arrivées. Une carte = une commande ; toucher la référence ouvre la fiche.</div></div>
        <div className="acts">
          <button type="button" className="fq-btn" onClick={() => imprimerToutes(orders.filter((o) => !o.status || o.status === "a_preparer").sort((a, b) => (pos[a.id] || 0) - (pos[b.id] || 0)))} title="Fiches atelier de toutes les commandes à préparer"><Ic n="print" /> Tournée du jour</button>
          <Link className="fq-btn" href={etiquettesHref(orders.filter((o) => !o.status || o.status === "a_preparer"))}><Ic n="tag" /> Étiquettes du jour</Link>
          <Link className="fq-btn ghost" href="/gestion/atelier"><Ic n="pen" /> Atelier</Link>
          <button type="button" className="fq-btn ghost" onClick={() => { load(key); montrer("Liste actualisée"); }}><Ic n="undo" /> Actualiser</button>
          <button type="button" className="fq-ibtn" onClick={() => setHelp(true)} aria-label="Aide clavier">?</button>
        </div>
      </div>
      {error ? <div className="notice" style={{ marginTop: 10 }}>{error}</div> : null}

      <div className="fq-kpis">
        <Kpi k="prep" n={nPrep} l="À préparer" s="ordre de traitement" tone="gold" on={view === "prep"} />
        <Kpi k="fab" n={nFab} l="En fabrication" tone="info" on={view === "fab"} />
        <Kpi k="late" n={nLate} l="En retard" s="date limite dépassée" tone="bad" on={filters.has("late")} />
        <Kpi k="express" n={nExpress} l="Express" s="à graver en priorité" tone="bad" on={filters.has("express")} />
        <Kpi k="reponse" n={nRep} l="Réponses clientes" s="non lues" tone="info" on={filters.has("reponse")} />
        <Kpi k="exp" n={nExp} l="Expédiées" s="à suivre" tone="" on={view === "exp"} />
      </div>

      <div className="fq-tools">
        <div className="fq-views">
          {VUES.map(([v, l]) => <button key={v} type="button" className={`fq-view${view === v ? " on" : ""}`} onClick={() => { setView(v); setFilters((s) => { const n = new Set(s); n.delete("late"); return n; }); }}>{l}<b>{{ tout: actives.length + nExp, prep: nPrep, fab: nFab, exp: nExp, dead: actives.length, fin: nFin }[v]}</b></button>)}
        </div>
        <div className="fq-row2">
          <label className="fq-search"><Ic n="search" /><input id="fq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Réf., cliente, produit, gravure…" /><kbd>/</kbd></label>
          <select className="fq-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">{TRIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <div className="fq-chipbar">
            {FILTRES.map((f) => <button key={f.id} type="button" className={`fq-chip${filters.has(f.id) ? " on" : ""}`} onClick={() => toggleFilter(f.id)}><Ic n={f.ic} />{f.lib}</button>)}
            {filters.size || q ? <button type="button" className="fq-chip" onClick={() => { setFilters(new Set()); setQ(""); }}><Ic n="x" />Effacer</button> : null}
          </div>
          <span className="fq-count">{vis.length} commande{vis.length > 1 ? "s" : ""} affichée{vis.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {view === "tout" ? (
        <div className="fq-board">
          <section className="fq-col"><h2 className="fq-col-h"><i className="prep" />À préparer<b>{prep.length}</b></h2><div className="fq-list">{liste(prep, true)}</div></section>
          <section className="fq-col"><h2 className="fq-col-h"><i className="fab" />En fabrication<b>{fab.length}</b></h2><div className="fq-list">{liste(fab, true)}</div></section>
          <section className="fq-col"><h2 className="fq-col-h"><i className="exp" />Expédiées récentes<b>{expRecent.length}</b></h2><div className="fq-list">{liste(expRecent, true)}</div>{exp.length > expRecent.length ? <button type="button" className="fq-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setView("exp")}>Voir les {exp.length} expédiées</button> : null}</section>
        </div>
      ) : view === "dead" ? (
        <>
          {(() => { const act = visibles.filter(estActive); return [groupe("late", "En retard", act.filter((o) => etatDelai(o).k === "late")), groupe("today", "À expédier demain au plus tard", act.filter((o) => etatDelai(o).k === "today")), groupe("week", "Cette semaine", act.filter((o) => etatDelai(o).k === "week")), groupe("later", "Plus tard", act.filter((o) => etatDelai(o).k === "later")), groupe("done", "Parties", exp)]; })()}
          {!visibles.length ? <div className="fq-empty" style={{ marginTop: 14 }}>Rien ici : tout est traité ✓</div> : null}
        </>
      ) : view === "fin" ? (
        <div className="fq-done" style={{ marginTop: 14 }}>{tableFin(fin)}</div>
      ) : (
        <div className="fq-grid">{liste({ prep, fab, exp }[view])}</div>
      )}

      {view !== "fin" ? (
        <details className="fq-done">
          <summary><Ic n="check" /> Terminées, annulées et remboursées <b>{nFin} · repliées pour ne pas se mélanger</b></summary>
          {tableFin(fin)}
        </details>
      ) : null}

      {condOrder ? <FenetreConditionnement o={condOrder} adminKey={key} mat={mat} onClose={() => setCondOrder(null)} onSaved={() => loadMat(key)} /> : null}
      {printQueue.length ? (() => { const o = orders.find((x) => x.id === printQueue[0]); return o ? <FichePapier key={o.id} order={o} fmtDate={(iso) => dateFr(iso)} adminKey={key} /> : null; })() : null}

      <div className="fq-bulk" hidden={!sel.size}>
        <span>{sel.size} sélectionnée{sel.size > 1 ? "s" : ""}</span>
        <button type="button" className="fq-btn sm" onClick={() => imprimerToutes(selList)}><Ic n="print" /> Imprimer les fiches</button>
        <Link className="fq-btn sm" href={etiquettesHref(selList)}><Ic n="tag" /> Étiquettes</Link>
        {selList.some((o) => !o.status || o.status === "a_preparer") ? <button type="button" className="fq-btn sm" onClick={bulkFab}><Ic n="pen" /> Passer en fabrication</button> : null}
        <button type="button" className="fq-btn sm" onClick={() => setSel(new Set())} aria-label="Tout désélectionner"><Ic n="x" /></button>
      </div>
      <div className={`fq-toast${toast ? " on" : ""}`} role="status">{toast?.texte}{toast?.undo ? <button type="button" onClick={() => { const u = toast.undo; setToast(null); u(); }}>Annuler</button> : null}</div>
      {help ? (
        <div className="fq-help" onClick={() => setHelp(false)}>
          <div className="box fq" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 16 }}>Raccourcis clavier</h2>
            <dl><dt><kbd>J</kbd> / <kbd>K</kbd></dt><dd>commande suivante / précédente</dd><dt><kbd>Entrée</kbd></dt><dd>ouvrir la fiche de la commande</dd><dt><kbd>X</kbd></dt><dd>cocher / décocher la commande</dd><dt><kbd>/</kbd></dt><dd>chercher</dd><dt><kbd>Échap</kbd></dt><dd>fermer</dd><dt><kbd>?</kbd></dt><dd>cette aide</dd></dl>
            <div style={{ marginTop: 14, textAlign: "right" }}><button type="button" className="fq-btn pri" onClick={() => setHelp(false)}>Fermer</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
