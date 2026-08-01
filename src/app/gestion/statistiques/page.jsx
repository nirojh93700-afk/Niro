"use client";

// =============================================================================
// TABLEAU DE BORD DES VISITES (réservé admin) — façon Shopify, intégré au site.
// Visiteurs · vues produit · ajouts panier · paiements · ventes · taux de
// conversion · entonnoir · top produits · paniers abandonnés · courbe par jour.
// Données stockées dans Firebase (compteur frugal : reste dans le quota gratuit).
// =============================================================================
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const fmtDay = (iso) => { const [, m, d] = (iso || "").split("-"); return d && m ? `${d}/${m}` : iso; };
const WEEKDAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const fmtWeekday = (iso) => { const [y, m, d] = (iso || "").split("-").map(Number); if (!y || !m || !d) return ""; return WEEKDAYS[new Date(y, m - 1, d).getDay()]; };

export default function StatsPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (adminKey, d) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${d}`, { headers: { "x-admin-key": adminKey } });
      if (!res.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      const j = await res.json();
      setData(j.data); setNames(j.names || {});
    } catch { setError("Erreur de chargement."); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); load(saved, days); }
  }, [load, days]);

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "40px 16px" }}>
        <h1 style={{ fontSize: "1.4rem" }}>Statistiques de visites</h1>
        <p style={{ color: "var(--ink-soft)" }}>Entre ton mot de passe administrateur.</p>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Mot de passe"
          onKeyDown={(e) => e.key === "Enter" && load(key, days)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
        {error ? <p style={{ color: "#b3261e" }}>{error}</p> : null}
        <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={() => load(key, days)} disabled={loading}>
          {loading ? "…" : "Entrer"}
        </button>
        <p style={{ marginTop: 16 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link></p>
      </div>
    );
  }

  const t = data?.totals || { sessions: 0, viewItem: 0, addToCart: 0, beginCheckout: 0, purchase: 0, revenue: 0 };
  const series = data?.series || [];
  const conv = t.sessions > 0 ? (t.purchase / t.sessions) * 100 : 0;
  const abandoned = Math.max(0, (t.addToCart || 0) - (t.purchase || 0));
  // Chiffres du JOUR (date de Paris, même format que le compteur serveur).
  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const today = series.find((d) => d.date === todayIso) || { sessions: 0, viewItem: 0, addToCart: 0, purchase: 0, revenue: 0 };
  const maxS = Math.max(1, ...series.map((d) => d.sessions));

  // Top produits (par vues), avec ajouts panier associés.
  const views = data?.views || {};
  const carts = data?.carts || {};
  const topProducts = Object.entries(views)
    .map(([slug, v]) => ({ slug, name: names[slug] || slug, views: v, carts: carts[slug] || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  // Entonnoir : étapes du parcours d'achat.
  const funnel = [
    { label: "Visiteurs", value: t.sessions, color: "#5b6b8a" },
    { label: "Produits vus", value: t.viewItem, color: "#7d8aa6" },
    { label: "Ajouts au panier", value: t.addToCart, color: "var(--gold)" },
    { label: "Paiements lancés", value: t.beginCheckout, color: "#b08d3a" },
    { label: "Achats", value: t.purchase, color: "#256b34" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  const Kpi = ({ label, value, sub }) => (
    <div className="admin-block" style={{ margin: 0 }}>
      <div style={{ fontSize: "1.7rem", fontWeight: 700, color: "var(--gold-dark)" }}>{value}</div>
      <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>{label}</div>
      {sub ? <div style={{ color: "var(--ink-soft)", fontSize: "0.72rem", marginTop: 2 }}>{sub}</div> : null}
    </div>
  );

  return (
    <div className="container" style={{ padding: "28px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>📈 Visiteurs & trafic</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Gestion</Link>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "14px 0", flexWrap: "wrap" }}>
        {[7, 30, 90].map((d) => (
          <button key={d} className={`filter-chip ${days === d ? "active" : ""}`} style={{ padding: "4px 14px" }}
            onClick={() => { setDays(d); load(key, d); }}>{d} jours</button>
        ))}
        {loading ? <span style={{ color: "var(--ink-soft)", alignSelf: "center" }}>chargement…</span> : null}
      </div>

      {!data ? (
        <div className="admin-block">
          <p style={{ margin: 0 }}>Pas encore de données. Les visites s'enregistreront dès que des personnes navigueront sur le site.
            {" "}(Le compteur ne fonctionne que sur le site en ligne, pas en aperçu local.)</p>
        </div>
      ) : (
        <>
          {/* Aujourd'hui */}
          <div className="admin-block" style={{ background: "#241a0c", marginBottom: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: "0.78rem", color: "#c9a24b", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 8 }}>Aujourd&apos;hui</div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div><b style={{ fontSize: "1.6rem", color: "#f3e8d3", fontVariantNumeric: "tabular-nums" }}>{today.sessions}</b><div style={{ fontSize: "0.8rem", color: "#b7a988" }}>visiteurs</div></div>
              <div><b style={{ fontSize: "1.6rem", color: "#f3e8d3", fontVariantNumeric: "tabular-nums" }}>{today.viewItem}</b><div style={{ fontSize: "0.8rem", color: "#b7a988" }}>produits vus</div></div>
              <div><b style={{ fontSize: "1.6rem", color: "#f3e8d3", fontVariantNumeric: "tabular-nums" }}>{today.addToCart}</b><div style={{ fontSize: "0.8rem", color: "#b7a988" }}>ajouts panier</div></div>
              <div><b style={{ fontSize: "1.6rem", color: today.purchase > 0 ? "#e2c67e" : "#f3e8d3", fontVariantNumeric: "tabular-nums" }}>{today.purchase}</b><div style={{ fontSize: "0.8rem", color: "#b7a988" }}>vente(s){today.revenue > 0 ? ` · ${euro(today.revenue)}` : ""}</div></div>
            </div>
          </div>

          {/* KPIs principaux */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <Kpi label="Visiteurs" value={t.sessions} sub={`sur ${days} jours`} />
            <Kpi label="Produits vus" value={t.viewItem} />
            <Kpi label="Ajouts au panier" value={t.addToCart} />
            <Kpi label="Ventes" value={t.purchase} sub={euro(t.revenue)} />
            <Kpi label="Taux de conversion" value={`${conv.toFixed(1)} %`} sub="visiteurs → achat" />
            <Kpi label="Paniers abandonnés" value={abandoned} sub="ajouté mais pas acheté" />
          </div>

          {/* Courbe des visites par jour */}
          <div className="admin-block" style={{ marginTop: 18 }}>
            <h3 style={{ marginTop: 0 }}>Visiteurs par jour</h3>
            {t.sessions === 0 ? (
              <p style={{ color: "var(--ink-soft)", margin: 0 }}>Aucune visite enregistrée sur la période.</p>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 150, marginTop: 10, overflowX: "auto" }}>
                {series.map((d) => (
                  <div key={d.date} title={`${fmtWeekday(d.date)} ${fmtDay(d.date)} : ${d.sessions} visiteur(s), ${d.purchase} vente(s)`}
                    style={{ flex: "1 0 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ width: "100%", height: `${Math.max(2, (d.sessions / maxS) * 120)}px`, background: d.purchase > 0 ? "var(--gold-dark)" : "var(--gold)", borderRadius: "3px 3px 0 0", minWidth: 6 }} />
                    <span style={{ fontSize: "0.55rem", color: "var(--ink-soft)", whiteSpace: "nowrap", textAlign: "center", lineHeight: 1.15 }}>
                      <b style={{ color: "var(--ink)", fontWeight: 700 }}>{fmtWeekday(d.date)}</b><br />{fmtDay(d.date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: "8px 0 0" }}>Barres dorées foncées = journées avec au moins une vente.</p>
          </div>

          {/* Entonnoir d'achat */}
          <div className="admin-block">
            <h3 style={{ marginTop: 0 }}>Parcours d'achat (entonnoir)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].value : f.value;
                const pct = prev > 0 ? Math.round((f.value / prev) * 100) : 0;
                return (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 130, fontSize: "0.85rem", flexShrink: 0 }}>{f.label}</span>
                    <div style={{ flex: 1, background: "#eee", borderRadius: 6, overflow: "hidden", height: 24 }}>
                      <div style={{ width: `${(f.value / funnelMax) * 100}%`, height: "100%", background: f.color, minWidth: f.value > 0 ? 24 : 0, transition: "width .3s" }} />
                    </div>
                    <span style={{ width: 90, textAlign: "right", fontSize: "0.85rem", flexShrink: 0 }}>
                      <strong>{f.value}</strong>{i > 0 ? <span style={{ color: "var(--ink-soft)" }}> ({pct}%)</span> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top produits */}
          <div className="admin-block">
            <h3 style={{ marginTop: 0 }}>Produits les plus regardés</h3>
            {topProducts.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", margin: 0 }}>Aucune vue produit pour l'instant.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--ink-soft)", borderBottom: "1px solid var(--line)" }}>
                    <th style={{ padding: "6px 4px" }}>Produit</th>
                    <th style={{ padding: "6px 4px", textAlign: "right" }}>Vues</th>
                    <th style={{ padding: "6px 4px", textAlign: "right" }}>Ajouts panier</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.slug} style={{ borderBottom: "1px solid #f0ece3" }}>
                      <td style={{ padding: "6px 4px" }}>{p.name}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>{p.views}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>{p.carts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-block" style={{ background: "#faf7f0" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Pour une analyse encore plus détaillée (origine des visiteurs, villes, durée…), tu as aussi <strong>Google Analytics</strong> branché en parallèle sur <em>analytics.google.com</em>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
