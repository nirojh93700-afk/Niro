"use client";

// Rappel URSSAF mensuel (gérant, 29/10/2026) : le chiffre d'affaires d'un mois se déclare et se paie avant la fin
// du mois suivant. 7 jours avant cette date, le bandeau passe en rouge (et un e-mail part, voir urssafAlerte.js) ;
// « J'ai déclaré et payé » valide le mois, puis le rappel repart tout seul pour le mois suivant.
// Règle de calcul : src/lib/urssafRappel.js (la même pour le bandeau et l'e-mail).
import { useEffect, useState } from "react";
import { etatUrssaf, dateCourte, URSSAF_URL, URSSAF_JOURS_AVANT } from "@/lib/urssafRappel";

export default function DeclarationReminder({ adminKey }) {
  const [declared, setDeclared] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!adminKey) return;
    fetch("/api/admin/urssaf", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json()).then((d) => setDeclared(d.declared || {})).catch(() => setDeclared({}));
  }, [adminKey]);

  async function valider(mois, on = true) {
    setBusy(mois); setErr("");
    try {
      const r = await fetch("/api/admin/urssaf", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ month: mois, declared: on }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setDeclared(d.declared || {});
    } catch (e) { setErr(e.message || "Rien n'a été enregistré. Réessayez."); }
    setBusy("");
  }

  if (declared === null) return null;
  const { urgents, suivant, dernierFait } = etatUrssaf(declared, new Date());
  const rouge = urgents.length > 0;

  return (
    <div className="admin-block" style={{ background: rouge ? "#fbecea" : "#f1f7ef", border: `1px solid ${rouge ? "#e7b7ad" : "#bcd8b4"}`, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{rouge ? "🔴" : "✅"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ color: rouge ? "#a3301f" : "#2f6b2a" }}>URSSAF — déclaration et paiement du mois</strong>
          {urgents.map((x) => (
            <div key={x.mois} style={{ margin: "8px 0 0", padding: "10px 12px", background: "#fff", border: "1px solid #ecc3ba", borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.5 }}>
                Chiffre d&apos;affaires de <b>{x.nom}</b> : à déclarer et payer <b>avant le {dateCourte(x.echeance)}</b>
                {x.etat === "retard" ? <b style={{ color: "#a3301f" }}> · date dépassée</b> : x.jours <= 0 ? <b> · dernier jour</b> : ` · encore ${x.jours} jour${x.jours > 1 ? "s" : ""}`}.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <a className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.86rem" }} href={URSSAF_URL} target="_blank" rel="noopener noreferrer">Ouvrir l&apos;URSSAF →</a>
                <button type="button" className="btn btn-gold" style={{ padding: "6px 14px", fontSize: "0.86rem" }} disabled={busy === x.mois} onClick={() => valider(x.mois)}>
                  {busy === x.mois ? "…" : `✓ J'ai déclaré et payé ${x.nom}`}
                </button>
              </div>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: "0.88rem", lineHeight: 1.55, color: "var(--ink-soft)" }}>
            {dernierFait ? <>Dernier mois réglé : <b>{dernierFait.nom}</b>. </> : null}
            Prochain : <b>{suivant.nom}</b>, à déclarer et payer avant le <b>{dateCourte(suivant.echeance)}</b>
            {" "}— rappel ici et par e-mail à partir du {dateCourte(suivant.rappel)} ({URSSAF_JOURS_AVANT} jours avant).
          </p>
          {err ? <p style={{ margin: "6px 0 0", color: "#a3301f", fontSize: "0.85rem" }}>{err}</p> : null}
        </div>
      </div>
    </div>
  );
}
