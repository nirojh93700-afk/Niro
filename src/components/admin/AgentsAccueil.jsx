"use client";

// =============================================================================
// ACCUEIL DE GESTION — fenêtre du Gardien + « Tes agents », une fenêtre par agent (16/11/2026, maquette
// https://claude.ai/artifact/NxPjJ5E2yt64asVpAsjBRD, « Une fenêtre par agent, applique »). Lecture seule :
// /api/admin/gardien. Tout ce qui s'affiche vient des vraies traces des agents (rapportAgents.js).
// =============================================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { Ico } from "@/components/admin/AdminShell";

const LIBELLE = { ok: "Tout va bien", warn: "À regarder", bad: "Problème", off: "Éteint" };

export function useGardien() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const charger = async () => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (!k) return;
    try {
      const r = await fetch("/api/admin/gardien", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Rapport indisponible.");
      setData(j); setErr("");
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { charger(); const t = setInterval(charger, 5 * 60000); return () => clearInterval(t); }, []);
  return { data, err, charger };
}

export function FenetreGardien({ rapport, compact = false }) {
  if (!rapport) {
    return (
      <section className="ag-win warn"><span className="ag-wic"><Ico n="shield" /></span>
        <div className="ag-wbody"><div className="ag-wt">Le Gardien du site n&apos;a pas encore fait son premier contrôle</div>
          <div className="ag-ws">Il vérifie tout le site toutes les 15 minutes : photos, connexion, paiement, pages, e-mails, livraison, stock, tâches, mise en ligne.</div></div>
        {!compact && <div className="ag-wact"><Link className="ag-btn ghost" href="/gestion/gardien">Ouvrir le Gardien</Link></div>}
      </section>
    );
  }
  const bad = rapport.checks.filter((x) => x.etat === "bad");
  const warn = rapport.checks.filter((x) => x.etat === "warn");
  const quand = new Date(rapport.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
  if (bad.length) {
    const p = bad[0];
    return (
      <section className="ag-win bad" role="alert"><span className="ag-wic"><Ico n="alert" /></span>
        <div className="ag-wbody">
          <div className="ag-wt">{bad.length === 1 ? `1 problème sur le site : ${p.nom}` : `${bad.length} problèmes sur le site`}</div>
          {bad.slice(0, 3).map((x) => <div key={x.id} className="ag-ws"><b>{x.nom} :</b> {x.detail}{x.quoi ? <div className="ag-wq"><b>Quoi faire :</b> {x.quoi}</div> : null}</div>)}
        </div>
        {!compact && <div className="ag-wact"><Link className="ag-btn" href="/gestion/gardien">Voir le rapport</Link>{p.action?.href ? <Link className="ag-btn ghost" href={p.action.href}>{p.action.label}</Link> : null}</div>}
      </section>
    );
  }
  return (
    <section className={`ag-win ${warn.length ? "warn" : "ok"}`}><span className="ag-wic"><Ico n="shield" /></span>
      <div className="ag-wbody">
        <div className="ag-wt">{warn.length ? `Le site marche, ${warn.length} point${warn.length > 1 ? "s" : ""} à regarder` : "Tout est OK sur le site"}</div>
        <div className="ag-ws">{warn.length ? warn.slice(0, 2).map((x) => `${x.nom} : ${x.detail}`).join(" · ") : `Le Gardien a fait ses ${rapport.checks.length} contrôles à ${quand} : photos, connexion, paiement, pages, e-mails, livraison, stock, tâches, mise en ligne.`}</div>
      </div>
      {!compact && <div className="ag-wact"><Link className="ag-btn ghost" href="/gestion/gardien">Voir le rapport</Link></div>}
    </section>
  );
}

export function CarteAgent({ a }) {
  return (
    <article className={`ag-card ${a.etat}`}>
      <header><span className="ag-cic"><Ico n={a.icone} /></span>
        <div className="ag-ct"><div className="ag-cn">{a.nom}{a.nouveau ? <span className="ag-new">Nouveau</span> : null}</div><div className="ag-cq">{a.quand}</div></div>
        <span className={`ag-dot ${a.etat}`} title={LIBELLE[a.etat]} /></header>
      <ul>{a.lignes.map((l, i) => <li key={i}>{l}</li>)}</ul>
      <footer><span className={`ag-lab ${a.etat}`}>{LIBELLE[a.etat]}</span>{a.href ? <Link href={a.href}>Voir le détail ›</Link> : null}</footer>
    </article>
  );
}

export default function AgentsAccueil() {
  const { data } = useGardien();
  if (!data) return null;
  const montrer = data.reglage?.accueil !== false;
  return (
    <div className="ag-zone">
      {montrer && <FenetreGardien rapport={data.rapport} />}
      <div className="ag-sech"><h2 className="ag-st">Tes agents</h2><span className="ag-sts">ce que chacun a fait</span></div>
      <div className="ag-grid">{(data.agents || []).map((a) => <CarteAgent key={a.id} a={a} />)}</div>
    </div>
  );
}
