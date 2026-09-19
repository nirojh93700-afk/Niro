"use client";

import { useMemo, useState } from "react";
import { formatEuro } from "@/lib/format";
import { vacationActive } from "@/lib/vacation";
import { PERIODES, chiffresPeriode, devisEnAttente, depuis } from "@/lib/dashPeriodes";

// =============================================================================
// TABLEAU DE BORD v2 — les 3 blocs retenus par le gérant + le sélecteur de période
// (maquette `docs/maquettes/tableau-de-bord-v2.html`, validée le 19/09/2026).
//   ② <BandeauDelai>      — « Mode délai allongé ACTIF » avec Régler / Éteindre
//   ① <MessagesATraiter>  — qui attend, depuis combien de temps, bouton direct
//   ③④ <ChiffresPeriode>  — CA / commandes / panier / devis, période au choix
// Tout est calculé à partir des vraies données déjà chargées par la page Gestion.
// =============================================================================

// ② Le mode délai allongé est allumé → on le dit, avec le bouton pour l'éteindre.
export function BandeauDelai({ vacation, adminKey, onRegler, onEteint }) {
  const [busy, setBusy] = useState(false);
  const v = vacationActive(vacation);
  if (!v) return null;
  const depuisTxt = v.start ? new Date(v.start).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";
  async function eteindre() {
    if (!confirm("Éteindre le mode délai allongé ?\n\nLe bandeau du site, l'encart des fiches et le paragraphe des e-mails de confirmation disparaissent immédiatement.")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ vacation: { ...vacation, enabled: false } }),
      });
      if (r.ok) onEteint?.();
    } catch { /* le toast global signale l'échec */ }
    finally { setBusy(false); }
  }
  return (
    <div className="dq-vac">
      <span className="ic" aria-hidden>⏳</span>
      <span>
        <b>Mode délai allongé ACTIF{depuisTxt ? ` depuis le ${depuisTxt}` : ""}</b>
        <small>
          Le site et tous les e-mails annoncent le délai allongé
          {v.gift ? " · cadeau surprise dans chaque colis (deux dès 80 €)" : ""}.
        </small>
      </span>
      <span className="acts">
        <button type="button" onClick={onRegler}>Régler</button>
        <button type="button" className="off" onClick={eteindre} disabled={busy}>{busy ? "…" : "Éteindre"}</button>
      </span>
    </div>
  );
}

// ① Les messages qui attendent une action : réponses préparées par l'agent
// (à relire et envoyer) + réponses de clientes non lues dans leur commande.
export function MessagesATraiter({ pending = [], unread = [], onOpenOrder }) {
  const now = Date.now();
  const lignes = useMemo(() => {
    const l = [];
    for (const p of pending) {
      l.push({
        key: `p-${p.id || p.token}`,
        initiale: (p.name || p.email || "?").trim().charAt(0).toUpperCase(),
        nom: p.name || p.email || "Cliente",
        detail: p.productName
          ? `${p.productName} · demande depuis la fiche`
          : (p.orderRef ? `Commande #${p.orderRef} · ${p.subject || "message"}` : (p.subject || "message")),
        chip: ["réponse préparée", ""],
        at: Number(p.at) || 0,
        action: { label: "Relire et envoyer", href: `/repondre/${p.token}`, gold: true },
      });
    }
    for (const u of unread) {
      l.push({
        key: `u-${u.orderId}`,
        initiale: (u.customerName || u.customerEmail || "?").trim().charAt(0).toUpperCase(),
        nom: u.customerName || u.customerEmail || "Cliente",
        detail: `Commande #${u.ref || u.orderId?.slice(-6)} · a répondu dans sa commande, pas encore lu`,
        chip: ["réponse non lue", "rep"],
        at: Number(u.lastClientAt) || 0,
        action: { label: "Ouvrir la commande", onClick: () => onOpenOrder?.(u.orderId, u.ref) },
      });
    }
    // Les plus anciennes en premier : c'est elles qui pressent.
    return l.sort((a, b) => (a.at || 0) - (b.at || 0));
  }, [pending, unread, onOpenOrder]);

  return (
    <div className="dash-panel dq-msgs">
      <div className="dash-ph">
        <h3>📬 Messages à traiter {lignes.length > 0 ? <span className="dq-count">{lignes.length}</span> : null}</h3>
        <a href="/gestion/messages" style={{ background: "none", border: "none", font: "600 0.8rem system-ui", color: "var(--gold-dark)", textDecoration: "none" }}>Tous les messages →</a>
      </div>
      {lignes.length === 0 ? (
        <p className="dq-vide">Aucun message en attente — tout est traité.</p>
      ) : lignes.map((r) => {
        const tard = r.at && now - r.at > 24 * 3600000;
        return (
          <div className={`dq-row${tard ? " late" : ""}`} key={r.key}>
            <div className="dq-av" aria-hidden>{r.initiale}</div>
            <div className="who"><b>{r.nom}</b><small>{r.detail}</small></div>
            <span className={`dq-kind ${r.chip[1]}`}>{r.chip[0]}</span>
            <div className="dq-right">
              <span className="dq-age">{depuis(r.at, now)}</span>
              {r.action.href
                ? <a className={`dq-go${r.action.gold ? "" : " l"}`} href={r.action.href}>{r.action.label}</a>
                : <button type="button" className="dq-go l" onClick={r.action.onClick}>{r.action.label}</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ③ + ④ Les chiffres, sur une période au choix, comparés à la période d'avant.
export function ChiffresPeriode({ orders = [], quotes = [], salesGoal = 0, strip, onTab }) {
  const [periode, setPeriode] = useState("mois");
  const c = useMemo(() => chiffresPeriode(orders, periode), [orders, periode]);
  const devis = useMemo(() => devisEnAttente(quotes), [quotes]);
  const objectif = Number(salesGoal) || 0;
  const pct = objectif > 0 ? Math.min(100, Math.round((c.cur.ca / objectif) * 100)) : 0;
  const Tr = ({ t }) => <span className={`tr ${t.sens}`}>{t.texte}</span>;
  const vsTxt = (prevVal) => `${c.vs} (${prevVal})`;
  const nomsDevis = devis.liste.slice(0, 2).map((q) => `${(q.client?.name || "—").split(" ").slice(0, 2).join(" ")} ${formatEuro(q.total)}`).join(" · ");

  return (
    <>
      <div className="dq-kpihead">
        <h3>Les chiffres</h3>
        <div className="dq-seg" role="tablist" aria-label="Période">
          {PERIODES.map((p) => (
            <button type="button" key={p.id} role="tab" aria-selected={periode === p.id} className={periode === p.id ? "on" : ""} onClick={() => setPeriode(p.id)}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="dash-tiles">
        <div className="dash-tile">
          <small>Chiffre d&apos;affaires</small><b>{formatEuro(c.cur.ca)}</b>
          <div className="dq-vs"><Tr t={c.trCa} /><span>{vsTxt(formatEuro(c.prev.ca))}</span></div>
          {periode === "mois" && objectif > 0 ? (
            <div className="dq-goal">
              <div className="bar"><i style={{ width: `${pct}%` }} /></div>
              <small><span>Objectif du mois : {formatEuro(objectif)}</span><span><b>{pct} %</b></span></small>
            </div>
          ) : null}
        </div>
        <div className="dash-tile">
          <small>Commandes</small><b>{c.cur.n}</b>
          <div className="dq-vs"><Tr t={c.trN} /><span>{vsTxt(c.prev.n)}</span></div>
        </div>
        <div className="dash-tile">
          <small>Panier moyen</small><b>{formatEuro(c.cur.panier)}</b>
          <div className="dq-vs"><Tr t={c.trPanier} /><span>{c.prev.n ? vsTxt(formatEuro(c.prev.panier)) : c.vs}</span></div>
        </div>
        <div className="dash-tile" style={devis.n > 0 ? { cursor: "pointer" } : undefined} onClick={() => devis.n > 0 && onTab?.("devis")}>
          <small>Devis en attente</small><b>{devis.n > 0 ? `${devis.n} · ${formatEuro(devis.total)}` : "0"}</b>
          <div className="dq-vs"><span>{devis.n > 0 ? nomsDevis : "aucun devis à encaisser"}</span></div>
        </div>
      </div>
      {strip ? (
        <div className="dq-strip">
          <button type="button" className="dq-chip" onClick={() => onTab?.("file")}>À préparer <b>{strip.aPreparer}</b></button>
          <button type="button" className={`dq-chip${strip.enRetard > 0 ? " warn" : ""}`} onClick={() => onTab?.("file")}>
            En retard (+14 j) <b>{strip.enRetard}</b>{strip.retardRef ? ` · #${strip.retardRef}` : ""}
          </button>
          <button type="button" className="dq-chip" onClick={() => onTab?.("atelier")}>En gravure <b>{strip.enGravure}</b></button>
          <button type="button" className={`dq-chip${strip.avis > 0 ? " warn" : " ok"}`} onClick={() => onTab?.("avis")}>Avis à valider <b>{strip.avis}</b></button>
        </div>
      ) : null}
    </>
  );
}
