"use client";

// =============================================================================
// LIOR — Tableau de bord (Phase 1) · thème « doré & nuit profonde »
// =============================================================================
// Espace privé pour gérer toutes les boutiques clientes. Verre dépoli, halos
// dorés, titres serif, accents lumineux. Données via /api/plateforme.
// =============================================================================

import { useState, useCallback } from "react";

const GOLD = "#d9b25a";
const GREEN = "#59d39a";

const ETAT_SITE = {
  "en-ligne": { label: "En ligne", green: true },
  maintenance: { label: "Maintenance", green: false },
  preparation: { label: "En préparation", green: false },
};

const THEME = `
  .lior *{box-sizing:border-box;margin:0;padding:0}
  .lior{--gold:${GOLD};--green:${GREEN};color:#efe9dc;font-family:'Inter','Helvetica Neue',Arial,sans-serif}
  .lior-bg{position:fixed;inset:0;z-index:0;background:radial-gradient(120% 120% at 50% 0%,#131017 0%,#08070a 60%);overflow:hidden}
  .lior-blob{position:absolute;border-radius:50%;filter:blur(90px)}
  .lior-b1{width:620px;height:620px;background:var(--gold);top:-220px;left:-140px;opacity:.30}
  .lior-b2{width:520px;height:520px;background:#b9822f;top:-160px;right:-90px;opacity:.28}
  .lior-b3{width:520px;height:520px;background:#6a4a12;bottom:-260px;left:42%;opacity:.42}
  .lior-grain{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.02) 1px,transparent 1px);background-size:3px 3px}
  .lior-wrap{position:relative;z-index:1;display:flex;min-height:100vh;padding:22px;gap:22px}
  .glass{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08)}
  .glow{border:1px solid rgba(217,178,90,.35);box-shadow:0 0 26px rgba(217,178,90,.14),inset 0 1px 0 rgba(255,255,255,.06)}
  .serif{font-family:var(--font-display),'Playfair Display',Georgia,serif}
  .side{width:248px;flex:0 0 248px;padding:26px 20px;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:700;margin-bottom:34px}
  .orb{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--gold),#a9772e);display:flex;align-items:center;justify-content:center;font-weight:800;color:#1a1404;box-shadow:0 0 22px rgba(217,178,90,.6)}
  .nav a{display:flex;align-items:center;gap:13px;padding:13px 14px;border-radius:14px;color:#9a9488;font-size:15px;text-decoration:none;margin-bottom:5px;cursor:pointer}
  .nav a.on{color:#fff;background:linear-gradient(100deg,rgba(217,178,90,.26),rgba(185,130,47,.10));border:1px solid rgba(255,255,255,.12)}
  .nav .ic{width:20px;text-align:center}
  .side .foot{margin-top:auto;font-size:12px;color:#6e6a5e;line-height:1.6}
  .main{flex:1;display:flex;flex-direction:column;gap:22px;min-width:0}
  .top{display:flex;align-items:center;justify-content:space-between}
  .top h1{font-size:30px;letter-spacing:-.01em}
  .top .sub{color:#9a9488;font-size:14px;margin-top:4px}
  .cmd{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:14px;color:#b6b1a4;font-size:14px}
  .kbd{font-size:11px;padding:2px 7px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}
  .av{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#8b5cff,var(--gold));display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 0 20px rgba(139,92,255,.45)}
  .bento{flex:1;display:grid;grid-template-columns:1.5fr 1fr 1fr;grid-template-rows:auto auto 1fr;gap:22px}
  .lab{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#8e8a7e}
  .big{font-size:46px;font-weight:800;letter-spacing:-.02em;margin-top:8px;background:linear-gradient(120deg,#fff,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
  .big small{font-size:20px;font-weight:600;-webkit-text-fill-color:#b6b1a4}
  .up{color:var(--green);font-size:13px;margin-top:10px;display:inline-flex;align-items:center;gap:6px}
  .card{padding:24px}
  .revenue{grid-column:1;grid-row:1 / span 2;display:flex;flex-direction:column}
  .agent{grid-column:3;grid-row:1 / span 2;display:flex;flex-direction:column}
  .clients{grid-column:1 / span 2;grid-row:3;padding:20px 24px}
  .vault{grid-column:3;grid-row:3;display:flex;flex-direction:column;justify-content:center}
  .row{display:flex;align-items:center;gap:14px;padding:12px 0;border-top:1px solid rgba(255,255,255,.06)}
  .ava{width:38px;height:38px;border-radius:12px;background:rgba(217,178,90,.14);border:1px solid rgba(217,178,90,.3);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold)}
  .pill{font-size:12px;padding:4px 11px;border-radius:20px;font-weight:600;display:inline-flex;align-items:center;gap:6px;background:rgba(217,178,90,.14);color:var(--gold);border:1px solid rgba(217,178,90,.3)}
  .pill.green{background:rgba(89,211,154,.14);color:var(--green);border:1px solid rgba(89,211,154,.3)}
  .pill.soon{background:rgba(255,255,255,.06);color:#9a9488;border:1px solid rgba(255,255,255,.12)}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .pulse{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green);display:inline-block}
  .btn{background:linear-gradient(120deg,var(--gold),#b9822f);color:#1a1404;border:none;border-radius:12px;padding:11px 16px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(217,178,90,.4);text-decoration:none;cursor:pointer}
  .btn.ghost{background:transparent;color:var(--gold);border:1px solid rgba(217,178,90,.5);box-shadow:none}
  .logline{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#b6b1a4;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  /* Connexion */
  .lior-auth{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .auth-card{padding:42px 38px;width:400px;max-width:100%;text-align:center}
  .auth-card input{width:100%;padding:13px 15px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;font-size:15px;margin-bottom:12px;outline:none}
  .auth-card input::placeholder{color:#8e8a7e}
`;

function Background() {
  return (
    <div className="lior-bg">
      <div className="lior-blob lior-b1" />
      <div className="lior-blob lior-b2" />
      <div className="lior-blob lior-b3" />
      <div className="lior-grain" />
    </div>
  );
}

const CHART = (
  <svg viewBox="0 0 460 150" width="100%" height="140" style={{ marginTop: "auto" }}>
    <defs>
      <linearGradient id="liorg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={GOLD} stopOpacity="0.5" />
        <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
      </linearGradient>
      <filter id="liorglow"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <path d="M0,120 C60,110 90,70 150,80 C210,90 250,40 310,46 C370,52 410,22 460,18 L460,150 L0,150 Z" fill="url(#liorg)" />
    <path d="M0,120 C60,110 90,70 150,80 C210,90 250,40 310,46 C370,52 410,22 460,18" fill="none" stroke={GOLD} strokeWidth="3" filter="url(#liorglow)" />
  </svg>
);

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
      if (!res.ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
      setData(await res.json());
      setAuthed(true);
    } catch { setError("Erreur de connexion. Réessayez."); }
    setLoading(false);
  }, [code]);

  // --- Connexion -------------------------------------------------------------
  if (!authed) {
    return (
      <div className="lior">
        <style dangerouslySetInnerHTML={{ __html: THEME }} />
        <Background />
        <div className="lior-auth">
          <form onSubmit={connecter} className="glass glow auth-card">
            <div className="orb" style={{ margin: "0 auto 16px", width: 50, height: 50, fontSize: 24 }}>L</div>
            <h1 className="serif" style={{ fontSize: 28, margin: "0 0 4px" }}>Lior<span style={{ color: GOLD }}>.</span></h1>
            <p style={{ color: "#9a9488", fontSize: 14, margin: "0 0 22px" }}>Votre espace privé de gestion</p>
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mot de passe" autoFocus />
            {error && <div style={{ color: "#e87a6a", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button type="submit" className="btn" disabled={loading} style={{ width: "100%", padding: 13, fontSize: 15 }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Tableau de bord -------------------------------------------------------
  const { clients = [], stats = {} } = data || {};
  const nav = [
    ["Tableau de bord", "◈", true], ["Mes clientes", "❖", false], ["Abonnements", "◎", false],
    ["Agent IA", "✦", false], ["Coffre à clés", "⬡", false], ["Réglages", "⚙", false],
  ];

  return (
    <div className="lior">
      <style dangerouslySetInnerHTML={{ __html: THEME }} />
      <Background />
      <div className="lior-wrap">
        {/* Sidebar */}
        <aside className="side glass">
          <div className="brand"><span className="orb">L</span> <span className="serif">Lior<span style={{ color: GOLD }}>.</span></span></div>
          <nav className="nav">
            {nav.map(([t, ic, on]) => (
              <a key={t} className={on ? "on" : ""}><span className="ic">{ic}</span>{t}</a>
            ))}
          </nav>
          <div className="foot">Niro — espace privé<br />Connectée · sécurisé</div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="top">
            <div>
              <h1 className="serif">Bonjour Niro</h1>
              <div className="sub">Votre constellation de boutiques, en temps réel.</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="cmd glass">⌘ Rechercher <span className="kbd">⌘K</span></div>
              <div className="av">N</div>
            </div>
          </div>

          <div className="bento">
            {/* Revenus (carte clé, contour lumineux) */}
            <div className="card glass glow revenue">
              <div className="lab">Revenus récurrents · mois</div>
              <div className="big">{stats.revenusMois} <small>€</small></div>
              <div className="up">▲ {stats.abosActifs} abonnements actifs</div>
              {CHART}
            </div>

            <div className="card glass" style={{ gridColumn: 2, gridRow: 1 }}>
              <div className="lab">Sites en ligne</div>
              <div className="big">{stats.enLigne}</div>
              <div className="up"><span className="pulse" /> sur {stats.total} boutiques</div>
            </div>

            <div className="card glass" style={{ gridColumn: 2, gridRow: 2 }}>
              <div className="lab">Alertes</div>
              <div className="big">{stats.alertes}</div>
              <div className="up" style={{ color: stats.alertes ? GOLD : GREEN }}>● à vérifier</div>
            </div>

            {/* Agent IA (à venir) */}
            <div className="card glass agent">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="lab">✦ Agent IA — surveillance</div>
                <span className="pill soon">Bientôt</span>
              </div>
              <p style={{ fontSize: 13, color: "#9a9488", lineHeight: 1.6 }}>
                Un gardien vérifiera vos sites en continu et réparera tout seul les soucis simples.
                Vous validerez le reste en un clic.
              </p>
              <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.06)", color: "#6e6a5e", fontSize: 12 }}>
                Phase à venir · construction par étapes
              </div>
            </div>

            {/* Clientes (données réelles) */}
            <div className="card glass clients">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div className="lab">Mes clientes</div>
                <button className="btn">+ Nouveau site</button>
              </div>
              {clients.map((c) => {
                const es = ETAT_SITE[c.etatSite] || ETAT_SITE.preparation;
                const enRetard = c.abonnement?.etat === "retard";
                const aboLabel = c.vous
                  ? "Votre boutique"
                  : c.abonnement?.formule
                    ? `${c.abonnement.formule} · ${c.abonnement.prix} €`
                    : enRetard ? "Retard" : "À configurer";
                return (
                  <div className="row" key={c.id}>
                    <span className="ava">{c.nom[0]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{c.nom}</div>
                      <div style={{ color: "#8e8a7e", fontSize: 12 }}>{c.domaine}</div>
                    </div>
                    <span className={"pill" + (es.green ? " green" : "")}>
                      <span className="dot" style={{ background: es.green ? GREEN : GOLD, boxShadow: `0 0 10px ${es.green ? GREEN : GOLD}` }} />{es.label}
                    </span>
                    <div style={{ width: 150, textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
                      <span className={"pill" + (enRetard ? "" : " green")} style={{ background: "transparent", border: "none", color: (enRetard || c.vous) ? GOLD : "#b6b1a4" }}>{aboLabel}</span>
                      {c.adminUrl
                        ? <a className="btn ghost" href={c.adminUrl} target="_blank" rel="noreferrer">Admin</a>
                        : <span style={{ color: "#6e6a5e" }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coffre à clés (à venir) */}
            <div className="card glass vault">
              <div style={{ fontSize: 30, marginBottom: 8, color: GOLD, filter: "drop-shadow(0 0 14px rgba(217,178,90,.6))" }}>⬡</div>
              <div className="lab">Coffre à clés</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6 }}>Chiffré de bout en bout</div>
              <div style={{ color: "#8e8a7e", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Stripe, e-mails, domaines — rangés en sécurité, utilisés automatiquement.
              </div>
              <div style={{ marginTop: 14 }}><span className="pill soon">Bientôt</span></div>
            </div>
          </div>

          <p style={{ color: "#6e6a5e", fontSize: 12 }}>
            Phase 1 — clientes d'exemple. Les prochaines étapes brancheront les vraies clientes, le coffre à clés et l'agent IA.
          </p>
        </main>
      </div>
    </div>
  );
}
