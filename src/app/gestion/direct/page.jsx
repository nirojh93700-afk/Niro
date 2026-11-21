"use client";

// =============================================================================
// GESTION → AUJOURD'HUI → TABLEAU EN DIRECT (21/11/2026, maquette
// https://claude.ai/artifact/NmsCXhyQMKq2ySSmRx4zQM validée par le gérant : « applique »)
// Les mêmes chiffres que le widget iPhone (/api/admin/widget), relus toutes les 30 secondes
// tant que la page est ouverte. Nouvelle commande = bandeau doré + son (si activé).
// Lecture seule : rien n'est modifié ici.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from "react";

const PERIODE = 30; // secondes
const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const euroRond = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR") + " €";
const cls = (s) => (s === "À préparer" ? "p" : s === "En fabrication" ? "f" : s === "Expédiée" || s === "Livrée" ? "e" : "");

function bip() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    const c = new C();
    [880, 1320].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = f; o.connect(g); g.connect(c.destination);
      const t = c.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t); o.stop(t + 0.32);
    });
  } catch { /* pas de son possible */ }
}

export default function TableauDirect() {
  const [key, setKey] = useState("");
  const [saisie, setSaisie] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [maj, setMaj] = useState(0);
  const [reste, setReste] = useState(PERIODE);
  const [neuves, setNeuves] = useState([]); // commandes arrivées depuis l'ouverture, pas encore « vues »
  const [surligne, setSurligne] = useState({});
  const [son, setSon] = useState(false);
  const [ecran, setEcran] = useState(false);
  const connues = useRef(null);
  const sonRef = useRef(false);
  const lockRef = useRef(null);

  useEffect(() => { sonRef.current = son; }, [son]);

  useEffect(() => {
    try {
      setKey(sessionStorage.getItem("niv-admin-key") || "");
      setSon(localStorage.getItem("niv-direct-son") === "1");
    } catch { /* stockage indisponible */ }
  }, []);

  const charger = useCallback(async (k) => {
    if (!k) return;
    try {
      const r = await fetch("/api/admin/widget", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        if (r.status === 401) { try { sessionStorage.removeItem("niv-admin-key"); } catch { /* */ } setKey(""); }
        throw new Error(j.error || "Lecture impossible.");
      }
      const refs = (j.recent || []).map((o) => o.ref);
      if (connues.current) {
        const arrivees = (j.recent || []).filter((o) => !connues.current.has(o.ref));
        if (arrivees.length) {
          setNeuves((v) => [...arrivees, ...v.filter((x) => !arrivees.some((a) => a.ref === x.ref))]);
          setSurligne((s) => ({ ...s, ...Object.fromEntries(arrivees.map((o) => [o.ref, true])) }));
          if (sonRef.current) bip();
        }
        refs.forEach((x) => connues.current.add(x));
      } else {
        connues.current = new Set(refs);
      }
      setD(j); setErr(""); setMaj(Date.now());
    } catch (e) { setErr(e.message || "Pas de connexion."); }
    setReste(PERIODE);
  }, []);

  // Premier chargement + toutes les 30 s ; à la reprise de la page, relecture tout de suite.
  useEffect(() => {
    if (!key) return undefined;
    charger(key);
    const t = setInterval(() => {
      if (document.hidden) return;
      setReste((r) => {
        if (r <= 1) { charger(key); return PERIODE; }
        return r - 1;
      });
    }, 1000);
    const vis = () => { if (!document.hidden) charger(key); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [key, charger]);

  // L'écran se rallume : la demande de « garder allumé » doit être refaite.
  useEffect(() => {
    const vis = async () => {
      if (!document.hidden && ecran && !lockRef.current) {
        try { lockRef.current = await navigator.wakeLock.request("screen"); } catch { /* */ }
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [ecran]);

  const basculerSon = () => {
    const v = !son; setSon(v);
    try { localStorage.setItem("niv-direct-son", v ? "1" : "0"); } catch { /* */ }
    if (v) bip();
  };
  const basculerEcran = async () => {
    if (lockRef.current) {
      try { await lockRef.current.release(); } catch { /* */ }
      lockRef.current = null; setEcran(false); return;
    }
    try { lockRef.current = await navigator.wakeLock.request("screen"); setEcran(true); } catch { setEcran(false); }
  };

  const entrer = (e) => {
    e.preventDefault();
    const k = saisie.trim();
    if (!k) return;
    try { sessionStorage.setItem("niv-admin-key", k); } catch { /* */ }
    setKey(k);
  };

  if (!key) {
    return (
      <div className="td">
        <div className="td-wrap">
          <div className="td-brand">◆ NiV CRÉATION</div>
          <form className="td-login" onSubmit={entrer}>
            <label htmlFor="td-k">Mot de passe de Gestion</label>
            <input id="td-k" type="password" value={saisie} onChange={(e) => setSaisie(e.target.value)} autoComplete="current-password" />
            <button type="submit" className="td-b on">Ouvrir le tableau</button>
            {err ? <p className="td-err">{err}</p> : null}
          </form>
        </div>
      </div>
    );
  }

  const heure = maj ? new Date(maj).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" }) : "--:--:--";
  const alerte = neuves[0];

  return (
    <div className="td">
      <div className="td-wrap">
        <div className="td-top">
          <div className="td-brand">◆ NiV CRÉATION</div>
          <div className={`td-live${err ? " off" : ""}`}><i />{err ? "Hors ligne" : "En direct"}</div>
          <div className="td-sp" />
          <div className="td-ref">
            <div className="td-ring" aria-label={`Prochaine mise à jour dans ${reste} secondes`}>
              <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                <circle cx="17" cy="17" r="14" fill="none" stroke="var(--td-line)" strokeWidth="3" />
                <circle cx="17" cy="17" r="14" fill="none" stroke="var(--td-gold2)" strokeWidth="3" strokeLinecap="round" strokeDasharray="88" strokeDashoffset={88 * (1 - reste / PERIODE)} />
              </svg>
              <span>{reste}</span>
            </div>
            <div>Mis à jour à <b>{heure}</b></div>
          </div>
        </div>

        <div className="td-btns">
          <button type="button" className={`td-b${son ? " on" : ""}`} onClick={basculerSon}>🔔 Son des nouvelles commandes : {son ? "activé" : "coupé"}</button>
          <button type="button" className={`td-b${ecran ? " on" : ""}`} onClick={basculerEcran}>☀︎ {ecran ? "Écran gardé allumé" : "Garder l'écran allumé"}</button>
          <button type="button" className="td-b" onClick={() => charger(key)}>↻ Mettre à jour</button>
        </div>

        {err ? <p className="td-err">{err} Nouvel essai dans {reste} s.</p> : null}

        {alerte ? (
          <div className="td-alerte" role="status" key={alerte.ref}>
            <div className="td-big" aria-hidden="true">🛎️</div>
            <div>
              <b>Nouvelle commande #{alerte.ref}{alerte.express ? " · EXPRESS" : ""}</b><br />
              <span>{alerte.name} · {alerte.resume ? `${alerte.resume} · ` : ""}{euro(alerte.total)}</span>
              {neuves.length > 1 ? <><br /><span>et {neuves.length - 1} autre{neuves.length > 2 ? "s" : ""}</span></> : null}
            </div>
            <div className="td-alerte-act">
              <a className="td-b on" href={`/gestion/commande/${encodeURIComponent(alerte.ref)}`}>Ouvrir</a>
              <button type="button" className="td-b" onClick={() => setNeuves((v) => v.slice(1))}>Vu</button>
            </div>
          </div>
        ) : null}

        {d ? (
          <>
            <div className="td-kpis">
              <div className="td-k today"><div className="v">{d.todayCount}</div><div className="l">commande{d.todayCount > 1 ? "s" : ""} aujourd&apos;hui · {euro(d.todaySales)}</div></div>
              <a className="td-k prep" href="/gestion/commandes"><div className="v">{d.aPreparer}</div><div className="l">à préparer</div></a>
              <div className="td-k"><div className="v">{d.enGravure}</div><div className="l">en fabrication</div></div>
              <a className="td-k msg" href="/gestion/fiches"><div className="v">{d.newMessages}</div><div className="l">message{d.newMessages > 1 ? "s" : ""} non lu{d.newMessages > 1 ? "s" : ""}</div></a>
              <a className="td-k" href="/gestion/devis"><div className="v">{euroRond(d.toCollect)}</div><div className="l">devis à encaisser</div></a>
            </div>
            <div className="td-mois">Ce mois : <b>{d.monthCount} commande{d.monthCount > 1 ? "s" : ""} · {euro(d.monthSales)}</b></div>

            <div className="td-cols">
              <div className="td-box">
                <h2>Dernières commandes</h2>
                {(d.recent || []).length ? (d.recent || []).map((o) => (
                  <a key={o.ref} className={`td-row${surligne[o.ref] ? " neuf" : ""}`} href={`/gestion/commande/${encodeURIComponent(o.ref)}`}>
                    <span className="ref">#{o.ref}</span>
                    <span className="nm">{o.name}</span>
                    <span className={`st ${cls(o.status)}`}>{o.status}</span>
                    <span className="pr">{euro(o.total)}</span>
                  </a>
                )) : <p className="td-vide">Aucune commande récente.</p>}
              </div>
              <div className="td-box">
                <h2>Messages à lire</h2>
                {(d.messages || []).length ? d.messages.map((m, i) => (
                  <a key={`${m.ref}-${i}`} className="td-m" href={m.ref ? `/gestion/commande/${encodeURIComponent(m.ref)}` : "/gestion/fiches"}>
                    <div className="who">{m.name} <span>{m.ref ? `#${m.ref} · ` : ""}{m.status}</span></div>
                    {m.text ? <div className="t">{m.text}</div> : null}
                  </a>
                )) : <p className="td-vide">Aucun message à lire.</p>}
              </div>
            </div>
            <p className="td-foot">Toucher une commande ouvre sa fiche. La page se met à jour seule tant qu&apos;elle reste ouverte à l&apos;écran.</p>
          </>
        ) : !err ? <p className="td-vide">Chargement…</p> : null}
      </div>
    </div>
  );
}
