"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { exportRows } from "@/lib/exportClients";

// =============================================================================
// ACHATS & FACTURES FOURNISSEURS
// Le gérant dépose une facture (PDF / photo / CSV) ou colle son texte → l'agent
// lit les lignes et propose « quel produit, combien » → il corrige, valide →
// le stock est mis à jour, le coût d'achat (port inclus) aussi, et la dépense
// est ajoutée dans Bénéfices. Historique en bas. Rien n'est écrit avant « Valider ».
// =============================================================================

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || "").replace(/^data:[^;]+;base64,/, ""));
    r.onerror = () => reject(new Error("Lecture du fichier impossible."));
    r.readAsDataURL(file);
  });
}

export default function AchatsPage() {
  const [key, setKey] = useState("");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [proposal, setProposal] = useState(null);
  const [rows, setRows] = useState([]);
  const [addExpense, setAddExpense] = useState(true);
  const [updateCost, setUpdateCost] = useState(true);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [openHist, setOpenHist] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Export de l'historique : une ligne par article acheté (fournisseur, date, produit, qté, prix…).
  async function exportHistory(format) {
    setExporting(true);
    try {
      const cols = [
        { key: "date", label: "Date", width: 12 }, { key: "supplier", label: "Fournisseur", width: 18 }, { key: "invoice", label: "N° facture", width: 16 },
        { key: "product", label: "Produit", width: 28 }, { key: "variant", label: "Variante", width: 16 }, { key: "qty", label: "Qté", width: 8 },
        { key: "unit", label: "Prix unit. (€)", width: 12 }, { key: "line", label: "Total ligne (€)", width: 13 },
        { key: "shipping", label: "Port facture (€)", width: 13 }, { key: "total", label: "Total facture (€)", width: 14 },
      ];
      const num = (n) => (format === "xlsx" || format === "json" ? Math.round((Number(n) || 0) * 100) / 100 : (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ","));
      const rows = [];
      for (const h of history) {
        for (const l of h.lines || []) {
          rows.push({ date: h.date || new Date(h.at).toISOString().slice(0, 10), supplier: h.supplier || "", invoice: h.invoiceNumber || "", product: l.product || "", variant: l.variant || "", qty: l.qty, unit: num(l.unitPrice), line: num((l.qty || 0) * (l.unitPrice || 0)), shipping: num(h.shipping), total: num(h.total) });
        }
      }
      await exportRows(format, rows, cols, { basename: "achats-niv-creation", title: "Achats fournisseurs", subtitle: `${history.length} facture${history.length > 1 ? "s" : ""}` });
    } catch (e) { setErr("Export impossible : " + (e?.message || e)); }
    finally { setExporting(false); }
  }
  const fileRef = useRef(null);

  const H = useMemo(() => ({ "x-admin-key": key }), [key]);

  const loadHistory = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/purchases", { headers: { "x-admin-key": k } });
      if (r.ok) setHistory((await r.json()).purchases || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); loadHistory(k); }
  }, [loadHistory]);

  async function analyze() {
    setErr(""); setResult(null);
    if (!file && !text.trim()) { setErr("Dépose une facture (PDF ou photo) ou colle son texte."); return; }
    setBusy("analyse");
    try {
      const payload = { action: "analyze", text };
      if (file) payload.file = { name: file.name, type: file.type || "", data: await readFileAsBase64(file) };
      const r = await fetch("/api/admin/purchases", { method: "POST", headers: { "Content-Type": "application/json", ...H }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Analyse impossible.");
      setRows(d.rows || []);
      setProposal(d.proposal);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }

  const setLine = (i, patch) => setProposal((p) => ({ ...p, lines: p.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const removeLine = (i) => setProposal((p) => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }));
  const addLine = () => setProposal((p) => ({ ...p, lines: [...p.lines, { label: "", qty: 1, unitPrice: 0, stockId: "", confidence: 1, note: "manuel" }] }));

  const subtotal = proposal ? proposal.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0) : 0;
  const nbOk = proposal ? proposal.lines.filter((l) => l.stockId && Number(l.qty) > 0).length : 0;
  const nbSans = proposal ? proposal.lines.filter((l) => !l.stockId).length : 0;

  async function apply() {
    if (!proposal || !nbOk) return;
    if (!confirm(`Mettre en stock ${nbOk} ligne${nbOk > 1 ? "s" : ""} ? Les quantités s'ajoutent au stock actuel.`)) return;
    setBusy("apply"); setErr("");
    try {
      const r = await fetch("/api/admin/purchases", {
        method: "POST", headers: { "Content-Type": "application/json", ...H },
        body: JSON.stringify({ action: "apply", ...proposal, fileName: file?.name || "", addExpense, updateCost }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Échec.");
      setResult(d); setProposal(null); setFile(null); setText("");
      if (fileRef.current) fileRef.current.value = "";
      loadHistory(key);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }

  const rowLabel = (r) => `${r.product}${r.variant ? " — " + r.variant : ""}`;
  const groups = useMemo(() => {
    const g = {};
    for (const r of rows) (g[r.product] = g[r.product] || []).push(r);
    return Object.entries(g);
  }, [rows]);

  const totalAchats = history.reduce((s, h) => s + (Number(h.total) || 0), 0);

  return (
    <section className="section">
      <div className="container">
        <PageHead
          eyebrow="Catalogue"
          title="Achats & factures fournisseurs"
          subtitle="Dépose une facture ou un devis : l'agent lit les lignes, retrouve tes produits et propose les quantités à mettre en stock. Tu corriges, tu valides — rien n'est écrit avant."
          kpis={[
            { label: "Achats enregistrés", value: history.length },
            { label: "Total acheté", value: euro(totalAchats) },
            { label: "Dernier achat", value: history[0] ? new Date(history[0].at).toLocaleDateString("fr-FR") : "—", sub: history[0]?.supplier || "" },
          ]}
        />

        {err && <div className="notice" style={{ borderColor: "#e7b7ad", background: "#fdeee8" }}>{err}</div>}

        {result && (
          <div className="admin-block" style={{ borderColor: "#9fd0a8", background: "#eef8f0" }}>
            <strong>✅ Achat enregistré — stock mis à jour</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: "0.9rem" }}>
              {(result.applied || []).map((a) => {
                const l = (result.purchase?.lines || []).find((x) => x.stockId === a.stockId);
                return <li key={a.stockId}>{l ? `${l.product}${l.variant ? " — " + l.variant : ""}` : a.stockId} : {a.before} → <strong>{a.after}</strong> (+{a.qty})</li>;
              })}
            </ul>
            {result.costs?.length ? <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Coût d&apos;achat mis à jour (port inclus) sur {result.costs.length} produit{result.costs.length > 1 ? "s" : ""}.</p> : null}
            {result.expense ? <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Dépense de {euro(result.expense.amount)} ajoutée dans Bénéfices.</p> : null}
          </div>
        )}

        {/* ---------- Étape 1 : la facture ---------- */}
        {!proposal && (
          <div className="admin-block ach-drop">
            <h3 style={{ margin: "0 0 6px" }}>1. La facture ou le devis</h3>
            <p style={{ margin: "0 0 10px", color: "var(--ink-soft)", fontSize: "0.9rem" }}>PDF, photo (JPG/PNG), CSV ou texte. Nihao, Metro, Alibaba, Amazon… peu importe le fournisseur.</p>
            <label className="ach-file">
              <input ref={fileRef} type="file" accept=".pdf,image/*,.csv,.txt,text/plain,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span>{file ? `📄 ${file.name} (${Math.round(file.size / 1024)} Ko)` : "📎 Choisir un fichier (ou prendre une photo de la facture)"}</span>
            </label>
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Ou coller le texte de la facture / du récapitulatif de commande</summary>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Collez ici les lignes de la commande (désignation, quantité, prix)…" style={{ width: "100%", minHeight: 120, marginTop: 8, padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
            </details>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-gold" disabled={busy === "analyse"} onClick={analyze}>{busy === "analyse" ? "Lecture en cours… (10-30 s)" : "Analyser la facture"}</button>
            </div>
          </div>
        )}

        {/* ---------- Étape 2 : la proposition à corriger ---------- */}
        {proposal && (
          <div className="admin-block">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>2. Vérifie et corrige la proposition</h3>
              <button type="button" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.84rem" }} onClick={() => { setProposal(null); }}>← Recommencer</button>
            </div>
            <div className="ach-meta">
              <label>Fournisseur<input value={proposal.supplier} onChange={(e) => setProposal({ ...proposal, supplier: e.target.value })} /></label>
              <label>N° facture<input value={proposal.invoiceNumber} onChange={(e) => setProposal({ ...proposal, invoiceNumber: e.target.value })} /></label>
              <label>Date<input type="date" value={proposal.date} onChange={(e) => setProposal({ ...proposal, date: e.target.value })} /></label>
              <label>Port / import (€)<input type="number" step="0.01" min="0" value={proposal.shipping} onChange={(e) => setProposal({ ...proposal, shipping: e.target.value === "" ? 0 : Number(e.target.value) })} /></label>
              <label>Total payé (€)<input type="number" step="0.01" min="0" value={proposal.total} onChange={(e) => setProposal({ ...proposal, total: e.target.value === "" ? 0 : Number(e.target.value) })} /></label>
            </div>
            {proposal.currency && proposal.currency !== "EUR" ? <p className="pt-muted">Facture en {proposal.currency} : montants convertis en euros par l&apos;agent, vérifie-les.</p> : null}

            <div className="ach-lines">
              <div className="ach-line ach-head"><span>Sur la facture</span><span>Produit du catalogue</span><span>Qté</span><span>Prix unit.</span><span /></div>
              {proposal.lines.map((l, i) => {
                const r = rows.find((x) => x.stockId === l.stockId);
                const conf = l.stockId ? (l.confidence >= 0.8 ? "ok" : l.confidence >= 0.5 ? "warn" : "low") : "none";
                return (
                  <div key={i} className={`ach-line ${conf}`}>
                    <span className="ach-label">
                      <input value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} placeholder="Désignation" />
                      {l.note ? <small>{l.note}</small> : null}
                    </span>
                    <span>
                      <select value={l.stockId} onChange={(e) => setLine(i, { stockId: e.target.value, confidence: 1 })}>
                        <option value="">— Aucun produit (ignoré) —</option>
                        {groups.map(([prod, list]) => (
                          <optgroup key={prod} label={prod}>
                            {list.map((x) => <option key={x.stockId} value={x.stockId}>{x.variant || prod}{typeof x.stock === "number" ? ` (stock ${x.stock})` : ""}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      {r ? <small className="ach-stocknow">Stock actuel : {typeof r.stock === "number" ? r.stock : "non suivi"} → <b>{(typeof r.stock === "number" ? r.stock : 0) + (Number(l.qty) || 0)}</b></small> : <small className="ach-stocknow">{l.stockId ? "" : "Choisis le produit, ou laisse ignoré"}</small>}
                    </span>
                    <span><input type="number" min="0" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value === "" ? 0 : Number(e.target.value) })} /></span>
                    <span><input type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value === "" ? 0 : Number(e.target.value) })} /></span>
                    <span><button type="button" className="ach-del" title="Retirer" onClick={() => removeLine(i)}>×</button></span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
              <button type="button" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.84rem" }} onClick={addLine}>+ Ajouter une ligne</button>
              <span className="pt-muted">Sous-total articles {euro(subtotal)}{proposal.shipping ? ` + port ${euro(proposal.shipping)}` : ""} · {nbOk} ligne{nbOk > 1 ? "s" : ""} prête{nbOk > 1 ? "s" : ""}{nbSans ? ` · ${nbSans} sans produit (ignorée${nbSans > 1 ? "s" : ""})` : ""}</span>
            </div>

            <div className="ach-opts">
              <label><input type="checkbox" checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)} /> Mettre à jour le coût d&apos;achat des produits (port réparti au prorata) — sert au calcul des bénéfices</label>
              <label><input type="checkbox" checked={addExpense} onChange={(e) => setAddExpense(e.target.checked)} /> Ajouter le total payé dans les dépenses (Bénéfices)</label>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-gold" disabled={busy === "apply" || !nbOk} onClick={apply}>{busy === "apply" ? "Enregistrement…" : `Valider : mettre ${nbOk} ligne${nbOk > 1 ? "s" : ""} en stock`}</button>
            </div>
          </div>
        )}

        {/* ---------- Historique ---------- */}
        <div className="admin-block">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Historique des achats</h3>
            {history.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span className="pt-muted">Exporter :</span>
                {[["xlsx", "Excel"], ["csv", "CSV"], ["pdf", "PDF"], ["json", "JSON"]].map(([f, lab]) => (
                  <button key={f} type="button" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.82rem" }} disabled={exporting} onClick={() => exportHistory(f)}>{exporting ? "…" : lab}</button>
                ))}
              </div>
            )}
          </div>
          {history.length === 0 ? <p className="pt-muted" style={{ margin: 0 }}>Aucun achat enregistré pour l&apos;instant.</p> : null}
          {history.map((h) => (
            <div key={h.id} className="ach-hist">
              <button type="button" className="ach-hist-head" onClick={() => setOpenHist(openHist === h.id ? null : h.id)}>
                <span><strong>{h.supplier || "Fournisseur"}</strong>{h.invoiceNumber ? <small> · {h.invoiceNumber}</small> : null}</span>
                <span className="pt-muted">{h.date || new Date(h.at).toLocaleDateString("fr-FR")}</span>
                <span>{(h.lines || []).length} ligne{(h.lines || []).length > 1 ? "s" : ""}</span>
                <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{euro(h.total)}</span>
                <span aria-hidden>{openHist === h.id ? "▾" : "▸"}</span>
              </button>
              {openHist === h.id && (
                <ul style={{ margin: "6px 0 10px", paddingLeft: 18, fontSize: "0.88rem" }}>
                  {(h.lines || []).map((l, i) => <li key={i}>{l.product}{l.variant ? " — " + l.variant : ""} : +{l.qty} ({l.before} → {l.after}) · {euro(l.unitPrice)} l&apos;unité</li>)}
                  {h.shipping ? <li>Port / import : {euro(h.shipping)}</li> : null}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
