"use client";

// =============================================================================
// GESTION → RÉGLAGES → JOURNAL D'ACTIVITÉ (08/11/2026)
// Qui a changé quoi, avant → après, et « Rétablir » en un clic (toast « Annuler » 10 s avant d'appliquer).
// Lecture : /api/admin/journal · Rétablir : POST { action:"retablir", id }.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { Ico } from "@/components/admin/AdminShell";
import { toast } from "@/components/admin/AdminToast";

const TYPES = { prix: "Prix", stock: "Stock", statut: "Statut", produit: "Produit", reglage: "Réglage", promo: "Code promo", cagnotte: "Cagnotte", fete: "Fête", programmation: "Programmation", livraison: "Livraison", autre: "Autre" };
const FILTRES = ["Tout", "prix", "stock", "statut", "reglage", "promo", "cagnotte", "fete", "programmation"];

function quand(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Europe/Paris" }) + " · " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
}
function val(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",") + " €";
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 57) + "…" : v;
  if (v && typeof v === "object" && v.resume) return v.resume;
  const s = JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
}

export default function JournalPage() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [filtre, setFiltre] = useState("Tout");
  const [q, setQ] = useState("");
  const [enAttente, setEnAttente] = useState(null); // { id, label, timer, reste }
  const timerRef = useRef(null);

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/journal", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setRows(j.journal || []);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  // « Rétablir » = on prévient, on laisse 10 s pour annuler, puis on applique (jamais de fenêtre système).
  function demanderRetablir(e) {
    if (enAttente) { clearTimeout(timerRef.current); }
    const reste = 10;
    setEnAttente({ id: e.id, label: e.label || e.cible, reste });
    let n = reste;
    const tick = () => {
      n -= 1;
      if (n <= 0) { appliquer(e.id); return; }
      setEnAttente((cur) => (cur && cur.id === e.id ? { ...cur, reste: n } : cur));
      timerRef.current = setTimeout(tick, 1000);
    };
    timerRef.current = setTimeout(tick, 1000);
  }
  function annuler() { clearTimeout(timerRef.current); setEnAttente(null); }
  async function appliquer(id) {
    clearTimeout(timerRef.current); setEnAttente(null);
    try {
      const r = await fetch("/api/admin/journal", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ action: "retablir", id }) });
      const j = await r.json();
      toast(j.message || (j.ok ? "Rétabli" : "Impossible"), j.ok ? "ok" : "err");
      load(key);
    } catch (e) { toast("Échec : " + e.message, "err"); }
  }
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!key) return <PageHead eyebrow="Réglages" title="Journal d'activité" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;

  const f = (q || "").toLowerCase();
  const visibles = (rows || []).filter((e) => (filtre === "Tout" || e.type === filtre) && (!f || `${e.label} ${e.cible} ${e.par} ${e.source}`.toLowerCase().includes(f)));
  const aujourdHui = (rows || []).filter((e) => Date.now() - e.at < 86400000).length;
  const retablis = (rows || []).filter((e) => e.retabli).length;

  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="Journal d'activité"
        subtitle="Chaque changement fait dans Gestion : prix, stock, statut d'une commande, réglage, code promo, cagnotte, fête, programmation. Avant → après, et « Rétablir » en un clic. Gardé 12 mois."
        kpis={[
          { label: "Lignes", value: rows ? rows.length : "—", sub: "sur 12 mois" },
          { label: "Dernières 24 h", value: rows ? aujourdHui : "—", sub: "changements" },
          { label: "Rétablis", value: rows ? retablis : "—", sub: "retours en arrière", tone: retablis ? "warn" : undefined },
        ]} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "10px 0 12px" }}>
        {FILTRES.map((t) => <button key={t} type="button" className={`fq-chip${filtre === t ? " on" : ""}`} onClick={() => setFiltre(t)}>{t === "Tout" ? "Tout" : TYPES[t]}</button>)}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (produit, n° de commande, code…)" aria-label="Rechercher" style={{ flex: "1 1 220px", minWidth: 0, padding: "7px 10px", border: "1px solid var(--ash-line-2, #e6ddc9)", borderRadius: 9, font: "inherit", fontSize: 13 }} />
      </div>

      {rows && !rows.length ? <p className="fq-empty">Le journal démarre aujourd&apos;hui : il se remplit au prochain changement fait dans Gestion (prix, stock, statut, réglage…).</p> : null}
      {rows && rows.length && !visibles.length ? <p className="fq-empty">Rien ne correspond à ce filtre.</p> : null}

      {visibles.length ? (
        <div className="fq-card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
            <thead><tr style={{ textAlign: "left", background: "var(--ash-sand, #f6efe2)" }}>
              {["Quand", "Quoi", "Sur", "Avant → après", "Par", ""].map((h) => <th key={h} style={{ padding: "9px 10px", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ash-muted, #7a6d58)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {visibles.slice(0, 400).map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid var(--ash-line, #eee5d4)", opacity: e.retabli ? 0.6 : 1 }}>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{quand(e.at)}</td>
                  <td style={{ padding: "8px 10px" }}><span className="fq-pill grey">{TYPES[e.type] || e.type}</span></td>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{e.label || e.cible}</td>
                  <td style={{ padding: "8px 10px", fontVariantNumeric: "tabular-nums" }}><span style={{ color: "var(--ash-muted, #7a6d58)" }}>{val(e.avant)}</span> → <b>{val(e.apres)}</b></td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{e.par}{e.source ? <span style={{ color: "var(--ash-muted, #7a6d58)" }}> · {e.source}</span> : null}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {e.retabli ? <span className="fq-pill ok"><Ico n="check" /> rétabli</span>
                      : e.retablir ? <button type="button" className="fq-btn sm" onClick={() => demanderRetablir(e)} disabled={Boolean(enAttente)}><Ico n="undo" /> Rétablir</button>
                      : <span style={{ color: "var(--ash-muted, #7a6d58)", fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p style={{ color: "var(--ash-muted, #7a6d58)", fontSize: 12.5, marginTop: 12 }}>
        « Par : site » = fait tout seul par le site (une programmation, le battement). Un réglage enregistré « en bloc » fait une ligne par clé ; les cadres des aperçus (crystalZones) ne sont pas journalisés ligne à ligne. Rétablir remet la valeur d&apos;avant, puis se note lui-même dans le journal.
      </p>

      {enAttente ? (
        <div role="status" style={{ position: "fixed", left: "50%", bottom: "calc(90px + env(safe-area-inset-bottom, 0px))", transform: "translateX(-50%)", background: "var(--ash-ink, #1a1206)", color: "#fff", padding: "10px 16px", borderRadius: 12, fontSize: 13, zIndex: 99, display: "flex", gap: 10, alignItems: "center", maxWidth: "calc(100vw - 32px)", boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>
          <Ico n="undo" /> Rétablir « {enAttente.label} » dans {enAttente.reste} s…
          <button type="button" className="fq-btn sm" onClick={annuler}>Annuler</button>
          <button type="button" className="fq-btn sm pri" onClick={() => appliquer(enAttente.id)}>Tout de suite</button>
        </div>
      ) : null}
    </div>
  );
}
