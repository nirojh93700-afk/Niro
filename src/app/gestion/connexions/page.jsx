"use client";

import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";

// =============================================================================
// GESTION → CLIENTS → CONNEXIONS
// Qui s'est connecté à son espace client, et quand (maquette validée 19/09/2026).
// LECTURE SEULE : aucun e-mail ne part d'ici, même règle que les Favoris.
// =============================================================================

function quand(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = new Date();
  const j0 = new Date(now); j0.setHours(0, 0, 0, 0);
  const heure = d.toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
  if (ts >= j0.getTime()) return `Aujourd'hui, ${heure}`;
  if (ts >= j0.getTime() - 86400000) return `Hier, ${heure}`;
  if (ts >= j0.getTime() - 6 * 86400000) {
    const jour = d.toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Europe/Paris" });
    return `${jour.charAt(0).toUpperCase()}${jour.slice(1)}, ${heure}`;
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }) + `, ${heure}`;
}

export default function ConnexionsAdminPage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/logins", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setD(j);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  if (!key) {
    return <PageHead eyebrow="Clients" title="🔑 Connexions clientes" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;
  }

  return (
    <>
      <PageHead
        eyebrow="Clients"
        title="🔑 Connexions clientes"
        subtitle="Qui s'est connecté à son espace client, et quand. Lecture seule — aucun e-mail ne part d'ici, comme pour les favoris."
        kpis={[
          { label: "Aujourd'hui", value: d?.kpis?.aujourdHui ?? "—", sub: "connexions" },
          { label: "7 derniers jours", value: d?.kpis?.sept ?? "—", sub: "connexions" },
          { label: "Clientes distinctes", value: d?.kpis?.distinct30 ?? "—", sub: "sur 30 jours", tone: (d?.kpis?.distinct30 || 0) > 0 ? "good" : undefined },
          { label: "Lien demandé, sans suite", value: d?.kpis?.sansSuite ?? "—", sub: "lien jamais utilisé", tone: (d?.kpis?.sansSuite || 0) > 0 ? "warn" : undefined },
        ]}
      />

      {err ? <p className="fv-err">{err}</p> : null}
      {!d && !err ? <p>Chargement…</p> : null}

      {d && d.rows.length === 0 ? (
        <p className="fv-vide">
          Aucune connexion enregistrée pour l'instant. Le journal démarre à partir d'aujourd'hui :
          il se remplit dès qu'une cliente demande son lien de connexion ou ouvre son espace.
        </p>
      ) : null}

      {d && d.rows.length > 0 ? (
        <div className="cx-card">
          <div className="cx-row cx-head"><div>Cliente</div><div>Adresse</div><div>Quand</div><div>État</div><div></div></div>
          {d.rows.map((r) => (
            <div className="cx-row" key={r.email}>
              <div className="cx-name">
                <strong>{r.name || "—"}</strong>
                <small>{r.orders ? `${r.orders} commande${r.orders > 1 ? "s" : ""}${r.ref ? ` · #${r.ref}` : ""}` : "aucune commande"}</small>
              </div>
              <div className="cx-mail">{r.email}</div>
              <div className="cx-when">
                {quand(r.dernier)}
                <small>{r.etat === "lien" ? "lien envoyé" : `${r.mois} connexion${r.mois > 1 ? "s" : ""} ce mois`}</small>
              </div>
              <div><span className={`cx-badge ${r.etat === "lien" ? "cx-wait" : "cx-ok"}`}>{r.etat === "lien" ? "Lien demandé" : "Espace ouvert"}</span></div>
              <a className="cx-go" href={`/gestion/crm?q=${encodeURIComponent(r.email)}`}>Dossier →</a>
            </div>
          ))}
          <div className="cx-note">
            « Espace ouvert » = la cliente a bien ouvert son espace. « Lien demandé » = elle a demandé
            son lien de connexion mais ne l'a pas (encore) utilisé — souvent une cliente qui hésite ou
            qui n'a pas vu l'e-mail. Données minimales (adresse + horaires), conservées 90 jours.
          </div>
        </div>
      ) : null}
    </>
  );
}
