"use client";

// =============================================================================
// LIOR — Application de gestion (Phases 1 & 2, fonctionnelles sans clé)
// =============================================================================
// Vues : Tableau de bord · Clientes (CRUD) · Abonnements · Surveillance · Réglages
// Données réelles persistées via /api/plateforme (Netlify Blobs).
// Connexion par mot de passe (ADMIN_PASSWORD). Adapté téléphone + ordinateur.
// =============================================================================

import { useState, useCallback, useEffect, useRef } from "react";

const GOLD = "#d9b25a";
const GREEN = "#59d39a";

const ETAT_SITE = {
  "en-ligne": { label: "En ligne", green: true },
  maintenance: { label: "Maintenance", green: false },
  preparation: { label: "En préparation", green: false },
};

const NAV = [
  ["dashboard", "Tableau de bord", "◈"],
  ["clients", "Mes clientes", "❖"],
  ["abonnements", "Abonnements", "◎"],
  ["surveillance", "Surveillance", "◉"],
  ["reglages", "Réglages", "⚙"],
];

const KEY_FIELDS = [
  ["stripe", "Stripe — paiement", "sk_live_…"],
  ["resend", "Resend — e-mails", "re_…"],
  ["domaine", "Nom de domaine", "boutique-x.fr"],
  ["emailPro", "E-mail professionnel", "contact@…"],
  ["cloudinary", "Cloudinary — photos", "cloud name"],
];

const THEME = `
  .lior *{box-sizing:border-box;margin:0;padding:0}
  .lior{--gold:${GOLD};--green:${GREEN};color:#efe9dc;font-family:'Inter','Helvetica Neue',Arial,sans-serif;min-height:100vh}
  .lior-bg{position:fixed;inset:0;z-index:0;background:radial-gradient(120% 120% at 50% 0%,#131017 0%,#08070a 60%);overflow:hidden}
  .lior-blob{position:absolute;border-radius:50%;filter:blur(90px)}
  .lior-b1{width:620px;height:620px;background:var(--gold);top:-220px;left:-140px;opacity:.30}
  .lior-b2{width:520px;height:520px;background:#b9822f;top:-160px;right:-90px;opacity:.28}
  .lior-b3{width:520px;height:520px;background:#6a4a12;bottom:-260px;left:42%;opacity:.42}
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
  .top{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .top h1{font-size:28px;letter-spacing:-.01em}
  .top .sub{color:#9a9488;font-size:14px;margin-top:4px}
  .av{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#8b5cff,var(--gold));display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .lab{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#8e8a7e}
  .big{font-size:42px;font-weight:800;letter-spacing:-.02em;margin-top:8px;background:linear-gradient(120deg,#fff,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
  .big small{font-size:18px;font-weight:600;-webkit-text-fill-color:#b6b1a4}
  .up{color:var(--green);font-size:13px;margin-top:10px;display:inline-flex;align-items:center;gap:6px}
  .card{padding:22px}
  .row{display:flex;align-items:center;gap:14px;padding:12px 0;border-top:1px solid rgba(255,255,255,.06)}
  .row:first-child{border-top:none}
  .ava{width:38px;height:38px;border-radius:12px;background:rgba(217,178,90,.14);border:1px solid rgba(217,178,90,.3);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold);flex:0 0 auto}
  .pill{font-size:12px;padding:4px 11px;border-radius:20px;font-weight:600;display:inline-flex;align-items:center;gap:6px;background:rgba(217,178,90,.14);color:var(--gold);border:1px solid rgba(217,178,90,.3);white-space:nowrap}
  .pill.green{background:rgba(89,211,154,.14);color:var(--green);border:1px solid rgba(89,211,154,.3)}
  .pill.soon{background:rgba(255,255,255,.06);color:#9a9488;border:1px solid rgba(255,255,255,.12)}
  .pill.red{background:rgba(224,90,90,.14);color:#e87a6a;border:1px solid rgba(224,90,90,.3)}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .btn{background:linear-gradient(120deg,var(--gold),#b9822f);color:#1a1404;border:none;border-radius:12px;padding:11px 16px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(217,178,90,.4);text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
  .btn.ghost{background:transparent;color:var(--gold);border:1px solid rgba(217,178,90,.5);box-shadow:none}
  .btn.danger{background:transparent;color:#e87a6a;border:1px solid rgba(224,90,90,.4);box-shadow:none}
  .btn:disabled{opacity:.5}
  .inp{width:100%;padding:11px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#efe9dc;font-size:14px;outline:none}
  .flab{font-size:12px;color:#9a9488;margin:14px 0 5px;display:block}
  select.inp{appearance:none}
  /* Connexion */
  .lior-auth{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .auth-card{padding:42px 38px;width:400px;max-width:100%;text-align:center}
  .auth-card input{width:100%;padding:13px 15px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;font-size:15px;margin-bottom:12px;outline:none}
  /* Overlay + tiroir + modale */
  .ov{position:fixed;inset:0;z-index:20;background:rgba(5,4,8,.6);backdrop-filter:blur(4px);display:flex}
  .ov.right{justify-content:flex-end}
  .ov.center{align-items:center;justify-content:center;padding:20px}
  .lior-drawer{width:480px;max-width:94vw;height:100%;padding:30px;overflow-y:auto;border-radius:24px 0 0 24px;background:linear-gradient(180deg,#16130d,#0d0b08);border-left:1px solid rgba(217,178,90,.4);box-shadow:-30px 0 60px rgba(0,0,0,.6)}
  .modal{width:480px;max-width:94vw;max-height:90vh;overflow-y:auto;padding:28px;background:linear-gradient(180deg,#16130d,#0d0b08);border:1px solid rgba(217,178,90,.4);border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.6)}
  .keyrow{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07)}
  .close{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#cfc9b8;font-size:18px;cursor:pointer;flex:0 0 auto}
  .rowend{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex:0 0 auto}
  .botnav{display:none}
  /* Notifications (toast) + bannière stockage */
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:60;padding:12px 20px;border-radius:14px;font-size:14px;font-weight:600;box-shadow:0 14px 40px rgba(0,0,0,.5);animation:toastin .25s ease;max-width:92vw;text-align:center}
  .toast.ok{background:linear-gradient(120deg,#1d3527,#14251b);border:1px solid rgba(89,211,154,.5);color:var(--green)}
  .toast.err{background:linear-gradient(120deg,#3a1d1a,#251412);border:1px solid rgba(232,122,106,.5);color:#e87a6a}
  @keyframes toastin{from{transform:translateX(-50%) translateY(16px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
  .banner{padding:13px 18px;border-radius:14px;background:rgba(217,120,60,.12);border:1px solid rgba(217,150,60,.45);color:#e8b06a;font-size:13px;line-height:1.5}
  .confirm-txt{color:#cfc9b8;font-size:15px;line-height:1.6;margin:6px 0 20px}
  /* --- Téléphone --- */
  @media (max-width:860px){
    .lior-wrap{flex-direction:column;padding:12px;gap:12px;padding-bottom:86px}
    .side{display:none}
    .cards{grid-template-columns:1fr 1fr;gap:12px}
    .card{padding:16px}
    .top h1{font-size:22px}
    .big{font-size:32px}
    .row{flex-wrap:wrap;gap:8px 10px}
    .lior-drawer{width:100%;max-width:100%;height:auto;max-height:92vh;border-radius:24px 24px 0 0}
    .ov.right{align-items:flex-end}
    .botnav{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:15;justify-content:space-around;padding:8px 6px;border-radius:18px}
    .botnav a{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;color:#9a9488;cursor:pointer;flex:1;padding:4px 0}
    .botnav a.on{color:var(--gold)}
    .botnav .bic{font-size:18px}
    .btn{min-height:42px}
    .close{width:42px;height:42px}
    .toast{bottom:84px}
  }
`;

function Background() {
  return (
    <div className="lior-bg">
      <div className="lior-blob lior-b1" /><div className="lior-blob lior-b2" /><div className="lior-blob lior-b3" />
    </div>
  );
}

const CHART = (
  <svg viewBox="0 0 460 140" width="100%" height="120" style={{ marginTop: "auto" }}>
    <defs>
      <linearGradient id="liorg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity="0.5" /><stop offset="100%" stopColor={GOLD} stopOpacity="0" /></linearGradient>
      <filter id="liorglow"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <path d="M0,110 C60,100 90,60 150,72 C210,84 250,34 310,40 C370,46 410,18 460,14 L460,140 L0,140 Z" fill="url(#liorg)" />
    <path d="M0,110 C60,100 90,60 150,72 C210,84 250,34 310,40 C370,46 410,18 460,14" fill="none" stroke={GOLD} strokeWidth="3" filter="url(#liorglow)" />
  </svg>
);

export default function PlateformePage() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState({ clients: [], stats: {}, settings: { formules: [] } });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);   // cliente -> coffre à clés
  const [editing, setEditing] = useState(null);      // cliente en édition / création
  const [checks, setChecks] = useState(null);        // résultats surveillance
  const [busy, setBusy] = useState(false);
  const [rester, setRester] = useState(true);        // « Rester connectée »
  const [confirmAsk, setConfirmAsk] = useState(null); // { message, onYes } — modale intégrée
  const [toast, setToast] = useState(null);           // { msg, type } — notification
  const toastTimer = useRef(null);

  const notifier = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const connecter = useCallback(async (e, motDePasse) => {
    e?.preventDefault();
    const cle = motDePasse ?? code;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/plateforme", { headers: { "x-platform-key": cle } });
      if (!res.ok) {
        setError("Mot de passe incorrect.");
        try { localStorage.removeItem("lior-key"); } catch {}
        setLoading(false);
        return;
      }
      setData(await res.json());
      setCode(cle);
      setAuthed(true);
      // « Rester connectée » : mémorise le mot de passe sur CET appareil uniquement.
      try { if (rester) localStorage.setItem("lior-key", cle); } catch {}
    } catch { setError("Erreur de connexion."); }
    setLoading(false);
  }, [code, rester]);

  // Connexion automatique si « Rester connectée » a été cochée sur cet appareil.
  useEffect(() => {
    try {
      const sauvee = localStorage.getItem("lior-key");
      if (sauvee) connecter(null, sauvee);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deconnecter = useCallback(() => {
    try { localStorage.removeItem("lior-key"); } catch {}
    setAuthed(false); setCode(""); setView("dashboard");
  }, []);

  // Appel d'écriture générique.
  const api = useCallback(async (action, payload = {}) => {
    setBusy(true);
    try {
      const res = await fetch("/api/plateforme", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-platform-key": code },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.clients) setData(json);
      setBusy(false);
      return { ok: res.ok, json };
    } catch { setBusy(false); return { ok: false, json: {} }; }
  }, [code]);

  const { clients = [], stats = {}, settings = { formules: [] } } = data;

  // --------------------------------------------------------------- Connexion
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
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input type={showPwd ? "text" : "password"} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mot de passe" autoFocus style={{ marginBottom: 0, paddingRight: 74 }} />
              <button type="button" onClick={() => setShowPwd((v) => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: GOLD, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 8px" }}>
                {showPwd ? "🙈 Cacher" : "👁 Voir"}
              </button>
            </div>
            {error && <div style={{ color: "#e87a6a", fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#9a9488", fontSize: 13, marginBottom: 14, cursor: "pointer", justifyContent: "center" }}>
              <input type="checkbox" checked={rester} onChange={(e) => setRester(e.target.checked)} style={{ accentColor: GOLD, width: 16, height: 16 }} />
              Rester connectée sur cet appareil
            </label>
            <button type="submit" className="btn" disabled={loading} style={{ width: "100%", padding: 13, fontSize: 15, justifyContent: "center" }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const abosActifs = clients.filter((c) => c.abonnement?.etat === "actif");
  const abosRetard = clients.filter((c) => c.abonnement?.etat === "retard");
  const parFormule = abosActifs.reduce((a, c) => { const f = c.abonnement.formule; a[f] = (a[f] || 0) + Number(c.abonnement.prix || 0); return a; }, {});

  const titres = {
    dashboard: ["Bonjour Niro", "Votre constellation de boutiques, en temps réel."],
    clients: ["Mes clientes", "Ajoutez, modifiez et gérez chaque boutique."],
    abonnements: ["Abonnements", "Vos revenus récurrents et les relances."],
    surveillance: ["Surveillance", "Testez en direct si les sites répondent."],
    reglages: ["Réglages", "Vos formules d'abonnement."],
  };

  // --------------------------------------------------------------- Vues
  function ClientRow({ c, actions }) {
    const es = ETAT_SITE[c.etatSite] || ETAT_SITE.preparation;
    const enRetard = c.abonnement?.etat === "retard";
    const abo = c.vous ? "Votre boutique" : c.abonnement?.formule ? `${c.abonnement.formule} · ${c.abonnement.prix} €` : enRetard ? "Retard" : "À configurer";
    return (
      <div className="row">
        <span className="ava">{(c.nom || "?")[0]}</span>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{c.nom}</div>
          <div style={{ color: "#8e8a7e", fontSize: 12 }}>{c.domaine || "—"}</div>
        </div>
        {(c.exemple) && <span className="pill soon">exemple</span>}
        <span className={"pill" + (es.green ? " green" : "")}><span className="dot" style={{ background: es.green ? GREEN : GOLD, boxShadow: `0 0 10px ${es.green ? GREEN : GOLD}` }} />{es.label}</span>
        <span style={{ color: (enRetard || c.vous) ? GOLD : "#b6b1a4", fontSize: 13, whiteSpace: "nowrap" }}>{abo}</span>
        {actions}
      </div>
    );
  }

  return (
    <div className="lior">
      <style dangerouslySetInnerHTML={{ __html: THEME }} />
      <Background />
      <div className="lior-wrap">
        {/* Sidebar (ordinateur) */}
        <aside className="side glass">
          <div className="brand"><span className="orb">L</span> <span className="serif">Lior<span style={{ color: GOLD }}>.</span></span></div>
          <nav className="nav">
            {NAV.map(([v, t, ic]) => (
              <a key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}><span className="ic">{ic}</span>{t}</a>
            ))}
          </nav>
          <div className="foot">
            Niro — espace privé<br />Connectée · sécurisé<br />
            <a onClick={deconnecter} style={{ color: GOLD, cursor: "pointer" }}>Se déconnecter</a>
          </div>
        </aside>

        <main className="main">
          <div className="top">
            <div>
              <h1 className="serif">{titres[view][0]}</h1>
              <div className="sub">{titres[view][1]}</div>
            </div>
            <div className="av">N</div>
          </div>

          {data.storage === "ephemere" && (
            <div className="banner">
              ⚠ <b>Stockage non branché</b> — vos modifications ne seront pas conservées pour l'instant
              (les données d'exemple reviendront). C'est un réglage côté hébergement, pas une erreur de
              votre part : demandez à l'assistant d'activer le stockage persistant (Netlify Blobs).
            </div>
          )}

          {/* ----- TABLEAU DE BORD ----- */}
          {view === "dashboard" && (
            <>
              <div className="cards">
                <div className="card glass glow" style={{ display: "flex", flexDirection: "column", gridRow: "span 2" }}>
                  <div className="lab">Revenus récurrents · mois</div>
                  <div className="big">{stats.revenusMois} <small>€</small></div>
                  <div className="up">▲ {stats.abosActifs} abonnements actifs</div>
                  {CHART}
                </div>
                <div className="card glass"><div className="lab">Sites en ligne</div><div className="big">{stats.enLigne}</div><div className="up">sur {stats.total} boutiques</div></div>
                <div className="card glass"><div className="lab">Alertes</div><div className="big">{stats.alertes}</div><div className="up" style={{ color: stats.alertes ? GOLD : GREEN }}>● à vérifier</div></div>
                <div className="card glass"><div className="lab">Clientes</div><div className="big">{stats.total}</div><div className="up">boutiques gérées</div></div>
              </div>

              <div className="card glass">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div className="lab">Mes clientes</div>
                  <button className="btn" onClick={() => setView("clients")}>Voir tout</button>
                </div>
                {clients.slice(0, 5).map((c) => (
                  <ClientRow key={c.id} c={c} actions={
                    <button className="btn ghost" onClick={() => setSelected(c)}>⬡ Clés</button>
                  } />
                ))}
              </div>
            </>
          )}

          {/* ----- CLIENTES ----- */}
          {view === "clients" && (
            <div className="card glass">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div className="lab">{clients.length} boutiques</div>
                <button className="btn" onClick={() => setEditing({ isNew: true, nom: "", domaine: "", etatSite: "preparation", formule: "", etat: "aucun", adminUrl: "" })}>+ Nouveau site</button>
              </div>
              {clients.map((c) => (
                <ClientRow key={c.id} c={c} actions={
                  <div className="rowend">
                    {c.site?.on && <a className="btn ghost" href={c.site.url} target="_blank" rel="noopener" title="Voir le site en ligne">↗ Site</a>}
                    <button className="btn ghost" onClick={() => setSelected(c)}>⬡</button>
                    <button className="btn ghost" onClick={() => setEditing({ id: c.id, nom: c.nom, domaine: c.domaine, etatSite: c.etatSite, formule: c.abonnement?.formule || "", etat: c.abonnement?.etat || "aucun", adminUrl: c.adminUrl || "", siteOn: c.site?.on || false, siteUrl: c.site?.url || "" })}>Modifier</button>
                    {!c.vous && <button className="btn danger" disabled={busy} onClick={() => setConfirmAsk({
                      message: `Supprimer « ${c.nom} » ? Cette action retire aussi son site hébergé.`,
                      onYes: async () => {
                        const r = await api("deleteClient", { id: c.id });
                        notifier(r.ok ? `« ${c.nom} » supprimée.` : (r.json?.error || "La suppression a échoué."), r.ok ? "ok" : "err");
                      },
                    })}>× Supprimer</button>}
                  </div>
                } />
              ))}
            </div>
          )}

          {/* ----- ABONNEMENTS ----- */}
          {view === "abonnements" && (
            <div className="card glass glow">
              <div className="lab">Revenus récurrents</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-end", marginTop: 8 }}>
                <div><div className="big" style={{ marginTop: 0 }}>{stats.revenusMois} <small>€/mois</small></div><div className="up">{abosActifs.length} abonnements actifs</div></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
                  {Object.entries(parFormule).map(([f, m]) => (<span key={f} className="pill" style={{ background: "rgba(255,255,255,.05)", color: "#cfc9b8", border: "1px solid rgba(255,255,255,.12)" }}>{f} · {m} €</span>))}
                </div>
              </div>
              {abosRetard.length > 0 && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.07)" }}>
                  <div style={{ fontSize: 13, color: "#9a9488", marginBottom: 10 }}>À relancer :</div>
                  {abosRetard.map((c) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "6px 0" }}>
                      <span style={{ fontWeight: 600 }}>{c.nom} <span style={{ color: "#8e8a7e", fontWeight: 400, fontSize: 13 }}>— en retard</span></span>
                      <button className="btn ghost" disabled={busy} onClick={async () => { const r = await api("updateClient", { client: { id: c.id, abonnement: { ...c.abonnement, etat: "actif" } } }); notifier(r.ok ? "Abonnement marqué payé." : "Échec de la mise à jour.", r.ok ? "ok" : "err"); }}>Marquer payé</button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ color: "#6e6a5e", fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>Facturation automatique via Stripe — s'activera une fois votre compte Stripe connecté.</p>
            </div>
          )}

          {/* ----- SURVEILLANCE ----- */}
          {view === "surveillance" && (
            <div className="card glass">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div className="lab">État des sites</div>
                <button className="btn" disabled={busy} onClick={async () => { const r = await api("check"); if (r.ok) setChecks(r.json.results || {}); }}>{busy ? "Test en cours…" : "Tester maintenant"}</button>
              </div>
              {clients.filter((c) => c.domaine).map((c) => {
                const r = checks?.[c.id];
                return (
                  <div className="row" key={c.id}>
                    <span className="ava">{c.nom[0]}</span>
                    <div style={{ flex: 1, minWidth: 120 }}><div style={{ fontWeight: 600, fontSize: 15 }}>{c.nom}</div><div style={{ color: "#8e8a7e", fontSize: 12 }}>{c.domaine}</div></div>
                    {r === undefined ? <span className="pill soon">non testé</span>
                      : r.online ? <span className="pill green"><span className="dot" style={{ background: GREEN, boxShadow: `0 0 10px ${GREEN}` }} />En ligne ({r.status})</span>
                        : <span className="pill red">Hors ligne</span>}
                  </div>
                );
              })}
              <p style={{ color: "#6e6a5e", fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>Test réel : Lior interroge chaque site. La réparation automatique (agent IA) viendra ensuite.</p>
            </div>
          )}

          {/* ----- RÉGLAGES ----- */}
          {view === "reglages" && <Reglages settings={settings} api={api} busy={busy} clients={clients} notifier={notifier} setConfirmAsk={setConfirmAsk} deconnecter={deconnecter} />}

          <p style={{ color: "#6e6a5e", fontSize: 12 }}>Données enregistrées · Lior — Phases 1 &amp; 2.</p>
        </main>
      </div>

      {/* Navigation téléphone (bas d'écran) */}
      <nav className="botnav glass">
        {NAV.map(([v, t, ic]) => (
          <a key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}><span className="bic">{ic}</span>{t.split(" ")[0]}</a>
        ))}
      </nav>

      {/* Coffre à clés (tiroir) */}
      {selected && <Coffre client={selected} onClose={() => setSelected(null)} api={api} />}

      {/* Édition / création de cliente (modale) */}
      {editing && <EditModal editing={editing} settings={settings} api={api} busy={busy} onClose={() => setEditing(null)} notifier={notifier} />}

      {/* Confirmation intégrée (remplace confirm(), bloqué en app installée iPhone) */}
      {confirmAsk && (
        <div className="ov center" onClick={() => setConfirmAsk(null)}>
          <div className="modal" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="serif" style={{ fontSize: 21 }}>Confirmer</div>
            <p className="confirm-txt">{confirmAsk.message}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn danger" style={{ flex: 1, justifyContent: "center", padding: 13 }} disabled={busy}
                onClick={async () => { const fn = confirmAsk.onYes; setConfirmAsk(null); await fn(); }}>
                Oui, supprimer
              </button>
              <button className="btn ghost" style={{ flex: 1, justifyContent: "center", padding: 13 }} onClick={() => setConfirmAsk(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

// =============================================================================
// Sous-composants
// =============================================================================
function Coffre({ client, onClose, api }) {
  const [keys, setKeys] = useState({ ...(client.keys || {}) });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="ov right" onClick={onClose}>
      <div className="lior-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="ava" style={{ width: 44, height: 44 }}>{client.nom[0]}</span>
            <div>
              <div className="serif" style={{ fontSize: 22 }}>{client.nom}</div>
              <div style={{ color: "#8e8a7e", fontSize: 13 }}>
                {client.domaine || "—"}
                {client.site?.on && <> · <a href={client.site.url} target="_blank" rel="noopener" style={{ color: GOLD }}>voir le site ↗</a></>}
              </div>
            </div>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 6px" }}>
          <span style={{ fontSize: 22, color: GOLD, filter: "drop-shadow(0 0 12px rgba(217,178,90,.6))" }}>⬡</span>
          <div className="lab">Coffre à clés</div>
        </div>
        <p style={{ color: "#9a9488", fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>Vous remplissez une fois ; l'application s'en sert automatiquement.</p>
        {KEY_FIELDS.map(([k, label, ph]) => (
          <div className="keyrow" key={k}>
            <div style={{ minWidth: 130, fontWeight: 600, fontSize: 14 }}>{label}</div>
            <input className="inp" style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }} placeholder={ph} value={keys[k] || ""} onChange={(e) => { setKeys({ ...keys, [k]: e.target.value }); setSaved(false); }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
          <button className="btn" disabled={busy} onClick={async () => { setBusy(true); const r = await api("saveKeys", { id: client.id, keys }); setBusy(false); if (r.ok) setSaved(true); }}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
          {saved && <span style={{ color: GREEN, fontSize: 13 }}>✓ Enregistré</span>}
        </div>
        <p style={{ color: "#6e6a5e", fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>Enregistré en sécurité côté serveur. Le chiffrement renforcé sera activé avant la mise en production.</p>
      </div>
    </div>
  );
}

function EditModal({ editing, settings, api, busy, onClose, notifier }) {
  const [f, setF] = useState(editing);
  const [siteMsg, setSiteMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const formules = settings.formules || [];

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) { setSiteMsg("Choisissez un fichier .html"); return; }
    const text = await file.text();
    setF({ ...f, siteHtml: text, siteName: file.name });
    setSiteMsg("");
  }

  async function save() {
    const prix = formules.find((x) => x.nom === f.formule)?.prix || 0;
    const client = {
      nom: f.nom, domaine: f.domaine, etatSite: f.etatSite, adminUrl: f.adminUrl || null,
      abonnement: { formule: f.formule || null, prix: f.formule ? prix : 0, etat: f.formule ? f.etat : "aucun" },
    };
    const r = f.isNew ? await api("createClient", { client }) : await api("updateClient", { client: { id: f.id, ...client } });
    if (!r.ok) { setErrMsg(r.json?.error || "L'enregistrement a échoué. Réessayez."); return; }
    // Identifiant : renvoyé directement par le serveur pour une création.
    const id = f.id || r.json.createdId;
    if (f.siteHtml && id) {
      const rs = await api("saveSite", { id, html: f.siteHtml });
      if (!rs.ok) { setErrMsg(rs.json?.error || "Le site n'a pas pu être enregistré."); return; }
    }
    notifier?.(f.isNew ? "Cliente créée." : "Modifications enregistrées.");
    onClose();
  }
  return (
    <div className="ov center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="serif" style={{ fontSize: 22 }}>{f.isNew ? "Nouveau site" : "Modifier la cliente"}</div>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <label className="flab">Nom de la boutique</label>
        <input className="inp" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Boutique de…" />
        <label className="flab">Nom de domaine</label>
        <input className="inp" value={f.domaine} onChange={(e) => setF({ ...f, domaine: e.target.value })} placeholder="boutique.fr" />
        <label className="flab">État du site</label>
        <select className="inp" value={f.etatSite} onChange={(e) => setF({ ...f, etatSite: e.target.value })}>
          <option value="en-ligne">En ligne</option><option value="maintenance">Maintenance</option><option value="preparation">En préparation</option>
        </select>
        <label className="flab">Formule d'abonnement</label>
        <select className="inp" value={f.formule} onChange={(e) => setF({ ...f, formule: e.target.value, etat: e.target.value ? (f.etat === "aucun" ? "actif" : f.etat) : "aucun" })}>
          <option value="">Aucune</option>
          {formules.map((x) => (<option key={x.nom} value={x.nom}>{x.nom} · {x.prix} €</option>))}
        </select>
        {f.formule && (
          <>
            <label className="flab">État de l'abonnement</label>
            <select className="inp" value={f.etat} onChange={(e) => setF({ ...f, etat: e.target.value })}><option value="actif">Actif</option><option value="retard">En retard</option></select>
          </>
        )}
        <label className="flab">Lien vers l'admin (optionnel)</label>
        <input className="inp" value={f.adminUrl} onChange={(e) => setF({ ...f, adminUrl: e.target.value })} placeholder="https://…/gestion" />

        {/* Site hébergé dans Lior */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <label className="flab" style={{ marginTop: 0 }}>Site du client — fichier HTML hébergé dans Lior</label>
          {(f.siteOn || f.siteHtml) && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <span className="pill green"><span className="dot" style={{ background: GREEN, boxShadow: `0 0 10px ${GREEN}` }} />Hébergé</span>
              {f.siteUrl && !f.siteHtml && <a className="btn ghost" href={f.siteUrl} target="_blank" rel="noopener">Ouvrir le site ↗</a>}
              {f.siteHtml && <span style={{ color: GREEN, fontSize: 13 }}>✓ {f.siteName} — cliquez « Enregistrer »</span>}
            </div>
          )}
          <input type="file" accept=".html,text/html" onChange={onFile} style={{ fontSize: 13, color: "#cfc9b8" }} />
          <p style={{ color: "#6e6a5e", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>Déposez le fichier HTML complet du site. Lior l'héberge et crée un lien public <b style={{ color: "#b6b1a4" }}>/site/{f.id || "…"}</b> à donner à votre client.</p>
          {siteMsg && <div style={{ color: "#e87a6a", fontSize: 13, marginTop: 6 }}>{siteMsg}</div>}
        </div>

        {errMsg && <div style={{ color: "#e87a6a", fontSize: 13, marginTop: 12 }}>{errMsg}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          <button className="btn" style={{ flex: 1, justifyContent: "center", padding: 13 }} disabled={busy || !f.nom} onClick={save}>{busy ? "…" : "Enregistrer"}</button>
          <button className="btn ghost" style={{ padding: 13 }} onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function Reglages({ settings, api, busy, clients = [], notifier, setConfirmAsk, deconnecter }) {
  const [formules, setFormules] = useState(settings.formules || []);
  const [saved, setSaved] = useState(false);
  const nbExemples = clients.filter((c) => c.exemple && !c.vous).length;
  return (
    <>
      <div className="card glass" style={{ maxWidth: 560 }}>
        <div className="lab">Formules d'abonnement</div>
        <p style={{ color: "#9a9488", fontSize: 13, margin: "8px 0 16px" }}>Ces formules apparaissent au choix quand vous créez ou modifiez une cliente.</p>
        {formules.map((x, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <input className="inp" style={{ flex: 1 }} value={x.nom} onChange={(e) => { const n = [...formules]; n[i] = { ...n[i], nom: e.target.value }; setFormules(n); setSaved(false); }} />
            <input className="inp" type="number" style={{ width: 100 }} value={x.prix} onChange={(e) => { const n = [...formules]; n[i] = { ...n[i], prix: Number(e.target.value) }; setFormules(n); setSaved(false); }} />
            <span style={{ color: "#8e8a7e" }}>€</span>
            <button className="close" onClick={() => { setFormules(formules.filter((_, j) => j !== i)); setSaved(false); }}>×</button>
          </div>
        ))}
        <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => setFormules([...formules, { nom: "Nouvelle formule", prix: 0 }])}>+ Ajouter une formule</button>
        <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
          <button className="btn" disabled={busy} onClick={async () => { const r = await api("saveReglages", { settings: { formules } }); if (r.ok) { setSaved(true); notifier?.("Formules enregistrées."); } }}>{busy ? "…" : "Enregistrer"}</button>
          {saved && <span style={{ color: GREEN, fontSize: 13 }}>✓ Enregistré</span>}
        </div>
      </div>

      <div className="card glass" style={{ maxWidth: 560 }}>
        <div className="lab">Nettoyage</div>
        <p style={{ color: "#9a9488", fontSize: 13, margin: "8px 0 14px" }}>
          {nbExemples > 0
            ? `Il reste ${nbExemples} boutique${nbExemples > 1 ? "s" : ""} d'exemple (Boutique Marie, Atelier du Bois…). Supprimez-les toutes d'un coup quand vous n'en avez plus besoin.`
            : "Aucune boutique d'exemple restante — votre liste est propre."}
        </p>
        {nbExemples > 0 && (
          <button className="btn danger" disabled={busy} onClick={() => setConfirmAsk?.({
            message: `Supprimer les ${nbExemples} boutiques d'exemple ? Vos vraies clientes et votre boutique ne seront pas touchées.`,
            onYes: async () => {
              const r = await api("purgeExamples");
              notifier?.(r.ok ? "Boutiques d'exemple supprimées." : "La suppression a échoué.", r.ok ? "ok" : "err");
            },
          })}>× Supprimer les boutiques d'exemple</button>
        )}
      </div>

      <div className="card glass" style={{ maxWidth: 560 }}>
        <div className="lab">Session</div>
        <p style={{ color: "#9a9488", fontSize: 13, margin: "8px 0 14px" }}>Se déconnecter efface aussi la connexion automatique de cet appareil.</p>
        <button className="btn ghost" onClick={deconnecter}>Se déconnecter</button>
      </div>
    </>
  );
}
