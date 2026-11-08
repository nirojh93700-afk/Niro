"use client";

// =============================================================================
// GESTION → RÉGLAGES → ÉTAT DU SYSTÈME (08/11/2026)
// Dix feux (vert / orange / rouge) : base de données, Stripe, e-mails, Gmail, Claude, battement, boîte mail
// surveillée, programmations, résumé du matin, matériel, réponses à valider. Lecture : /api/admin/etat (lecture seule).
// =============================================================================
import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { Ico } from "@/components/admin/AdminShell";

const COULEUR = { ok: "var(--ash-ok, #256b34)", warn: "var(--ash-warn, #b07b12)", bad: "var(--ash-bad, #b4452f)" };
const LIBELLE = { ok: "Tout va bien", warn: "À surveiller", bad: "Problème" };

function heure(ts) {
  return ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ") : "—";
}

export default function EtatPage() {
  const [key, setKey] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (k) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/etat", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Vérification impossible.");
      setData(j);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  if (!key) return <PageHead eyebrow="Réglages" title="État du système" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;

  const feux = data?.feux || [];
  const n = (e) => feux.filter((f) => f.etat === e).length;
  const global = n("bad") ? "bad" : n("warn") ? "warn" : feux.length ? "ok" : undefined;

  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="État du système"
        subtitle="Est-ce que tout ce dont le site dépend répond ? Base de données, paiement, e-mails, Gmail, assistant, battement, programmations, résumé du matin, matériel. Rien n'est modifié ici : on regarde seulement."
        actions={<button type="button" className="fq-btn" onClick={() => load(key)} disabled={busy}><Ico n="refresh" /> {busy ? "Vérification…" : "Revérifier"}</button>}
        kpis={[
          { label: "Vérifié à", value: data ? heure(data.at) : "—", sub: "heure de Paris" },
          { label: "Au vert", value: data ? n("ok") : "—", sub: `sur ${feux.length || "—"}`, tone: global === "ok" ? "good" : undefined },
          { label: "À surveiller", value: data ? n("warn") : "—", sub: "orange", tone: n("warn") ? "warn" : undefined },
          { label: "Problèmes", value: data ? n("bad") : "—", sub: "rouge", tone: n("bad") ? "bad" : undefined },
        ]} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}
      {!data && !err ? <p className="fq-empty">Vérification en cours (quelques secondes : on interroge la base, Google et les services)…</p> : null}

      {data ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", marginTop: 12 }}>
          {feux.map((f) => (
            <div key={f.id} className="fq-card" style={{ borderLeftColor: COULEUR[f.etat] || "var(--ash-line-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: "50%", background: COULEUR[f.etat] || "#999", flex: "none", boxShadow: f.etat === "bad" ? "0 0 0 4px rgba(180,69,47,.15)" : "none" }} />
                <strong style={{ fontSize: 14, flex: 1, minWidth: 0 }}>{f.nom}</strong>
                <span className={`fq-pill ${f.etat === "ok" ? "ok" : f.etat === "warn" ? "warn" : "bad"}`}>{LIBELLE[f.etat] || f.etat}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ash-muted, #7a6d58)", lineHeight: 1.45 }}>{f.detail}</p>
              {f.action?.href ? <a className="fq-btn sm" href={f.action.href} style={{ alignSelf: "flex-start" }}>{f.action.label || "Ouvrir"}</a> : null}
            </div>
          ))}
        </div>
      ) : null}

      <p style={{ color: "var(--ash-muted, #7a6d58)", fontSize: 12.5, marginTop: 14 }}>
        Vert = répond · orange = à surveiller (rien de cassé, mais quelque chose attend) · rouge = un service ne répond pas ou une clé manque.
        Les clés (Stripe, Resend, Claude) se règlent dans Firebase, pas ici ; Gmail se reconnecte depuis la Boîte mail.
      </p>
    </div>
  );
}
