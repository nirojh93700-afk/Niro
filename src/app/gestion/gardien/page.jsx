"use client";

// =============================================================================
// GESTION → RÉGLAGES → GARDIEN DU SITE (16/11/2026). Les 9 contrôles, l'historique et où il prévient.
// Lecture : /api/admin/gardien · « Vérifier maintenant » = POST {action:"lancer"} (lecture seule du site).
// Réglages : /api/admin/settings {gardien} (4 cases, rien d'autre).
// =============================================================================
import { useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";
import { Ico } from "@/components/admin/AdminShell";
import { useGardien, FenetreGardien } from "@/components/admin/AgentsAccueil";

const ICO = { photos: "img", connexion: "users", paiement: "euro", pages: "shop", emails: "mail", livraison: "truck", stock: "box", taches: "clock", deploiement: "bolt" };
const heure = (t) => new Date(t).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
const CASES = [["accueil", "Fenêtre sur l'accueil de Gestion"], ["telephone", "Notification sur le téléphone"], ["email", "E-mail à l'atelier"], ["nuit", "Me prévenir aussi pendant les heures calmes (la nuit)"]];

export default function GardienPage() {
  const { data, err, charger } = useGardien();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [regl, setRegl] = useState(null);
  const r = regl || data?.reglage || {};
  const key = () => (typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "");

  const verifier = async () => {
    setBusy(true); setMsg("");
    try {
      const x = await fetch("/api/admin/gardien", { method: "POST", headers: { "x-admin-key": key(), "content-type": "application/json" }, body: JSON.stringify({ action: "lancer" }) });
      const j = await x.json();
      if (!x.ok) throw new Error(j.error || "Vérification impossible.");
      await charger(); setMsg("Vérification faite.");
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  const changer = async (k, v) => {
    const n = { ...r, [k]: v };
    setRegl(n);
    try { await fetch("/api/admin/settings", { method: "POST", headers: { "x-admin-key": key(), "content-type": "application/json" }, body: JSON.stringify({ gardien: n }) }); } catch { /* toast d'erreur général */ }
  };

  const rap = data?.rapport;
  return (
    <div className="ag-page">
      <PageHead eyebrow="Réglages" title="Gardien du site" subtitle="Il vérifie tout le site toutes les 15 minutes. Il ne corrige rien tout seul : il te dit où est le problème et quoi faire."
        actions={<button type="button" className="ag-btn" onClick={verifier} disabled={busy}>{busy ? "Vérification… (jusqu'à 1 min)" : "Vérifier maintenant"}</button>} />
      {err && <p className="ag-err">{err}</p>}
      {msg && <p className="ag-msg">{msg}</p>}
      <FenetreGardien rapport={rap} compact />
      <div className="ag-sech"><h2 className="ag-st">Les {rap?.checks?.length || 9} contrôles</h2>{rap ? <span className="ag-sts">dernier passage le {heure(rap.at)} · {Math.round((rap.dureeMs || 0) / 1000)} s</span> : null}</div>
      <ul className="ag-clist">
        {(rap?.checks || []).map((x) => (
          <li key={x.id} className={`ag-c ${x.etat}`}>
            <span className="ag-cic"><Ico n={ICO[x.id] || "check"} /></span>
            <div className="ag-cbody"><div className="ag-cn">{x.nom}</div><div className="ag-ctxt">{x.detail}</div>{x.quoi && x.etat !== "ok" ? <div className="ag-ctxt"><b>Quoi faire :</b> {x.quoi}</div> : null}
              {x.action?.href && x.etat !== "ok" ? <Link className="ag-lien" href={x.action.href}>{x.action.label} ›</Link> : null}</div>
            <span className={`ag-pill ${x.etat}`}>{x.etat === "ok" ? "OK" : x.etat === "warn" ? "À regarder" : "Problème"}</span>
          </li>
        ))}
        {!rap && <li className="ag-c"><div className="ag-cbody"><div className="ag-ctxt">Pas encore de contrôle : touche « Vérifier maintenant ».</div></div></li>}
      </ul>
      <div className="ag-sech"><h2 className="ag-st">Historique</h2><span className="ag-sts">les dernières vérifications</span></div>
      <ul className="ag-hist">
        {(data?.historique || []).slice(0, 24).map((h) => (
          <li key={h.at}><span className="ag-ht">{heure(h.at)}</span>
            <span className={h.ok ? (h.pbs.length ? "ag-hr warn" : "ag-hr") : "ag-hr bad"}>{h.pbs.length ? h.pbs.map((p) => `${p.nom} : ${p.detail}`).join(" · ") : "Tous les contrôles OK"}</span></li>
        ))}
        {!(data?.historique || []).length && <li><span className="ag-hr">Rien encore.</span></li>}
      </ul>
      <div className="ag-sech"><h2 className="ag-st">Où il te prévient</h2><span className="ag-sts">quand un problème NOUVEAU apparaît (une seule fois par problème)</span></div>
      <div className="ag-set">
        {CASES.map(([k, l]) => <label key={k}><input type="checkbox" checked={k === "nuit" ? r.nuit === true : r[k] !== false} onChange={(e) => changer(k, e.target.checked)} /> {l}</label>)}
      </div>
    </div>
  );
}
