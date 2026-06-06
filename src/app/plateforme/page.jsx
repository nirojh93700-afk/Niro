"use client";

// =============================================================================
// PLATEFORME — Tableau de bord (Phase 1)
// =============================================================================
// Page privée pour gérer toutes les boutiques clientes en un seul endroit.
// Accès par mot de passe (le même que /gestion par défaut). Les données viennent
// de /api/plateforme. C'est la première marche de la future plateforme.
// =============================================================================

import { useState, useCallback } from "react";

const OR = "#a98935";
const OR_FONCE = "#8a6f2b";
const CREME = "#faf6ee";
const ENCRE = "#26221c";
const SOMBRE = "#2b2620";

const ETAT_SITE = {
  "en-ligne": { label: "En ligne", bg: "#e7f5ea", color: "#2e7d32" },
  maintenance: { label: "Maintenance", bg: "#fdf2dd", color: "#b9770b" },
  preparation: { label: "En préparation", bg: "#eef0f2", color: "#6b6f76" },
};

const ETAT_ABO = {
  actif: { bg: "#e7f5ea", color: "#2e7d32" },
  retard: { bg: "#fdf2dd", color: "#b9770b" },
  aucun: { bg: "#eef0f2", color: "#6b6f76" },
};

function Badge({ bg, color, children }) {
  return (
    <span style={{ background: bg, color, fontSize: 12.5, padding: "5px 11px", borderRadius: 20, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
      {children}
    </span>
  );
}

export default function PlateformePage() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connecter = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/plateforme", { headers: { "x-platform-key": code } });
      if (!res.ok) {
        setError("Mot de passe incorrect.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    }
    setLoading(false);
  }, [code]);

  // --- Écran de connexion ----------------------------------------------------
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(165deg, ${CREME} 0%, #efe4cb 100%)`, padding: 20 }}>
        <form onSubmit={connecter} style={{ background: "#fff", borderRadius: 20, padding: "42px 40px", width: 380, maxWidth: "100%", boxShadow: "0 14px 40px rgba(0,0,0,.1)", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: OR, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, margin: "0 auto 18px" }}>M</div>
          <h1 style={{ fontSize: 22, color: OR_FONCE, margin: "0 0 6px" }}>Ma Plateforme</h1>
          <p style={{ color: "#7a7468", fontSize: 14, margin: "0 0 22px" }}>Votre espace privé de gestion</p>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Mot de passe"
            autoFocus
            style={{ width: "100%", padding: "13px 15px", borderRadius: 10, border: "1px solid #e0ddd4", fontSize: 15, marginBottom: 12 }}
          />
          {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", background: OR, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    );
  }

  // --- Tableau de bord -------------------------------------------------------
  const { clients = [], stats = {} } = data || {};
  const nav = [
    ["Tableau de bord", "▦", true],
    ["Mes clientes", "❖", false],
    ["Abonnements", "€", false],
    ["Surveillance", "◉", false],
    ["Réglages", "⚙", false],
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f5f7", fontFamily: '"Helvetica Neue", Arial, sans-serif', color: ENCRE }}>
      {/* Sidebar */}
      <aside style={{ width: 250, background: SOMBRE, color: "#e9e2d4", padding: "26px 18px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 34 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: OR, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>M</span>
          Ma Plateforme
        </div>
        <nav>
          {nav.map(([t, ic, on]) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 10, color: on ? "#fff" : "#cfc6b4", fontSize: 15, marginBottom: 4, background: on ? "rgba(169,137,53,.22)" : "transparent", fontWeight: on ? 600 : 400 }}>
              <span style={{ width: 18 }}>{ic}</span>{t}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", fontSize: 12, color: "#9a917f" }}>Connectée — Niro<br />Votre espace privé</div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "30px 38px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 25, margin: 0 }}>Bonjour Niro</h1>
            <div style={{ color: "#7a7468", fontSize: 14, marginTop: 3 }}>Voici l'état de toutes vos boutiques aujourd'hui.</div>
          </div>
          <span style={{ background: "#fff", border: "1px solid #e3e0d8", borderRadius: 30, padding: "8px 16px", fontSize: 14, color: "#5c5648" }}>◉ {stats.enLigne} sites en ligne</span>
        </div>

        {/* Cartes stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 26 }}>
          {[
            ["Sites en ligne", stats.enLigne, "tous actifs", "#2e7d32"],
            ["Abonnements actifs", stats.abosActifs, "revenus récurrents", "#2e7d32"],
            ["Revenus / mois", `${stats.revenusMois} €`, "abonnements", "#2e7d32"],
            ["Alertes", stats.alertes, "à vérifier", "#c77700"],
          ].map(([lab, val, tag, col]) => (
            <div key={lab} style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, padding: 20 }}>
              <div style={{ color: "#8a8475", fontSize: 13 }}>{lab}</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{val}</div>
              <div style={{ fontSize: 12, marginTop: 8, color: col }}>● {tag}</div>
            </div>
          ))}
        </div>

        {/* Table clientes */}
        <div style={{ background: "#fff", border: "1px solid #ebe9e3", borderRadius: 16, overflow: "hidden" }}>
          <h2 style={{ fontSize: 16, padding: "18px 22px 12px", margin: 0 }}>Mes clientes</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Boutique", "Site", "Abonnement", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em", color: "#9a917f", padding: "10px 22px", borderBottom: "1px solid #efede7" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const es = ETAT_SITE[c.etatSite] || ETAT_SITE.preparation;
                const ea = ETAT_ABO[c.abonnement?.etat] || ETAT_ABO.aucun;
                const aboLabel = c.abonnement?.formule
                  ? `${c.abonnement.formule} — ${c.abonnement.prix} €/mois`
                  : c.abonnement?.etat === "retard" ? "Paiement en retard" : "À configurer";
                return (
                  <tr key={c.id}>
                    <td style={{ padding: "15px 22px", borderBottom: "1px solid #f3f1ec", fontSize: 15 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 600 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 9, background: CREME, border: "1px solid #ece1c8", display: "flex", alignItems: "center", justifyContent: "center", color: OR_FONCE, fontWeight: 700 }}>{c.nom[0]}</span>
                        {c.nom}
                      </div>
                    </td>
                    <td style={{ padding: "15px 22px", borderBottom: "1px solid #f3f1ec" }}>
                      <Badge bg={es.bg} color={es.color}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }} />{es.label}</Badge>
                      <div style={{ color: "#7a7468", fontSize: 13, marginTop: 4 }}>{c.domaine}</div>
                    </td>
                    <td style={{ padding: "15px 22px", borderBottom: "1px solid #f3f1ec" }}>
                      <Badge bg={ea.bg} color={ea.color}>{aboLabel}</Badge>
                    </td>
                    <td style={{ padding: "15px 22px", borderBottom: "1px solid #f3f1ec" }}>
                      {c.adminUrl ? (
                        <a href={c.adminUrl} target="_blank" rel="noreferrer" style={{ background: "#fff", color: OR_FONCE, border: `1px solid ${OR}`, borderRadius: 9, padding: "9px 15px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Ouvrir l'admin</a>
                      ) : (
                        <span style={{ color: "#bdb6a6", fontSize: 14 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ color: "#a59c89", fontSize: 12, marginTop: 18 }}>Phase 1 — données d'exemple. Les prochaines étapes brancheront les vraies clientes, le coffre à clés et la surveillance.</p>
      </main>
    </div>
  );
}
