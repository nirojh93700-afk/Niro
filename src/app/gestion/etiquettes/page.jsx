"use client";

// =============================================================================
// ÉTIQUETTES D'ADRESSE — /gestion/etiquettes (13/10/2026, maquette validée par le gérant)
// Imprime l'adresse des envois La Poste sur les planches de 20 étiquettes 45 × 45 mm. Le gérant
// coche les commandes, choisit où mettre l'expéditeur, grise les cases déjà décollées de sa feuille ;
// les étiquettes vont sur les cases libres suivantes. La feuille et l'expéditeur sont retenus sur
// cet ordinateur (localStorage). L'impression ouvre une page A4 aux mesures exactes (lib/etiquettes).
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { chargerAvecCache } from "@/components/admin/adminCache";
import { FEUILLE, NB_CASES, positions, modeEnvoi, travaux, placer, contenuEtiquette, feuilleHtml, EXPEDITEUR_DEFAUT } from "@/lib/etiquettes";

const CLE = "niv-etiquettes";
const A_EXPEDIER = ["a_preparer", "en_gravure"];
function lire() { try { return JSON.parse(localStorage.getItem(CLE) || "{}") || {}; } catch { return {}; } }
function ecrire(v) { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch { /* navigateur sans stockage : rien de grave */ } }
const dateFr = (iso) => { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); } catch { return ""; } };

export default function EtiquettesPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [orders, setOrders] = useState([]);
  const [coches, setCoches] = useState([]);
  const [toutes, setToutes] = useState(false);
  const [used, setUsed] = useState(() => new Array(NB_CASES).fill(false));
  const [mode, setMode] = useState("meme");
  const [expTxt, setExpTxt] = useState(EXPEDITEUR_DEFAUT);
  const [attente, setAttente] = useState(null); // cases imprimées, en attente du « oui, c'est sorti »
  const [pret, setPret] = useState(false);

  // Feuille, mode et expéditeur retenus sur cet ordinateur ; commande pré-cochée par ?id= ou ?ref=.
  useEffect(() => {
    const s = lire();
    if (Array.isArray(s.used) && s.used.length === NB_CASES) setUsed(s.used.map(Boolean));
    if (["meme", "apart", "non"].includes(s.mode)) setMode(s.mode);
    if (typeof s.exp === "string" && s.exp.trim()) setExpTxt(s.exp);
    setPret(true);
  }, []);
  useEffect(() => { if (pret) ecrire({ used, mode, exp: expTxt }); }, [pret, used, mode, expTxt]);

  const load = useCallback(async (k) => {
    setErr("");
    try {
      const r = await chargerAvecCache("/api/admin/orders", k, (d) => { setOrders(d.orders || []); setKey(k); setAuthed(true); });
      if (r.status === 401) { setAuthed(false); setErr("Mot de passe incorrect."); return; }
      if (!r.ok && !r.data) { setErr("Les commandes n'ont pas pu être chargées. Réessayez."); return; }
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
      try {
        const p = new URLSearchParams(window.location.search), id = p.get("id"), ref = p.get("ref");
        const liste = r.data?.orders || [];
        const o = liste.find((x) => (id && x.id === id) || (ref && String(x.ref).toUpperCase() === ref.toUpperCase()));
        if (o) { setCoches([o.id]); if (!A_EXPEDIER.includes(o.status || "a_preparer")) setToutes(true); }
      } catch { /* ignore */ }
    } catch { setErr("Les commandes n'ont pas pu être chargées. Réessayez."); }
  }, []);
  useEffect(() => { try { const k = sessionStorage.getItem("niv-admin-key"); if (k) load(k); } catch { /* ignore */ } }, [load]);

  const liste = useMemo(() => {
    const limite = Date.now() - 30 * 86400000;
    return (orders || [])
      .filter((o) => !o.test && !["annulee", "remboursee"].includes(o.status))
      .filter((o) => toutes ? +new Date(o.createdAt || 0) >= limite || coches.includes(o.id) : A_EXPEDIER.includes(o.status || "a_preparer") || coches.includes(o.id))
      .sort((a, b) => +new Date(a.createdAt || 0) - +new Date(b.createdAt || 0));
  }, [orders, toutes, coches]);

  const choisies = liste.filter((o) => coches.includes(o.id));
  const jobs = useMemo(() => travaux(choisies, mode), [choisies, mode]);
  const { places, manque, libresApres } = useMemo(() => placer(jobs, used), [jobs, used]);
  const parCase = useMemo(() => Object.fromEntries(places.map((p) => [p.case, p])), [places]);
  const pos = useMemo(() => positions(), []);

  function basculer(id) { setCoches((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]); }
  function caseUtilisee(i) { setAttente(null); setUsed((u) => u.map((v, k) => k === i ? !v : v)); }

  function imprimer() {
    if (!places.length) return;
    const w = window.open("", "_blank");
    if (!w) { setErr("La fenêtre d'impression a été bloquée par le navigateur. Autorisez les fenêtres pour ce site, puis réessayez."); return; }
    w.document.open(); w.document.write(feuilleHtml(places, expTxt)); w.document.close();
    const go = () => { try { w.focus(); w.print(); } catch { /* l'utilisateur imprime depuis la fenêtre */ } };
    if (w.document.readyState === "complete") setTimeout(go, 250); else w.addEventListener("load", () => setTimeout(go, 250));
    setAttente(places.map((p) => p.case));
  }
  function confirmerSortie() { const cs = attente || []; setUsed((u) => u.map((v, k) => v || cs.includes(k))); setAttente(null); }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Étiquettes d&apos;adresse</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {err ? <div className="notice">{err}</div> : null}
        </form>
      </div>
    );
  }

  const libresAvant = used.filter((u) => !u).length;
  return (
    <div className="etq-page">
      <PageHead eyebrow="Commandes" title="Étiquettes d'adresse"
        subtitle="Pour les envois par La Poste : l'adresse s'imprime sur vos planches de 20 étiquettes carrées (45 × 45 mm, 4 colonnes × 5 lignes). Touchez les cases déjà décollées sur votre feuille : l'impression ira sur les cases libres."
        kpis={[
          { label: "Cochées", value: String(choisies.length) },
          { label: "Étiquettes à imprimer", value: String(jobs.length) },
          { label: "Cases libres sur la feuille", value: String(libresAvant), tone: libresAvant < jobs.length ? "warn" : undefined },
        ]} />
      {err ? <div className="notice" style={{ marginBottom: 12 }}>{err}</div> : null}

      <div className="etq-grid">
        <div>
          <section className="etq-card" aria-labelledby="etq-t1">
            <h2 id="etq-t1"><span className="n">1</span>Les commandes à étiqueter</h2>
            <p className="sub">Celles qui partent par La Poste. Les points relais et l&apos;express ont leur étiquette Boxtal.</p>
            <label className="etq-toggle"><input type="checkbox" checked={toutes} onChange={(e) => setToutes(e.target.checked)} /> Montrer aussi les commandes déjà expédiées (30 derniers jours)</label>
            {liste.length ? liste.map((o) => {
              const m = modeEnvoi(o), on = coches.includes(o.id) && m.ok, a = o.shippingAddress || {};
              return (
                <label key={o.id} className={`etq-ord${on ? " on" : ""}${m.ok ? "" : " off"}`}>
                  <input type="checkbox" checked={on} disabled={!m.ok} onChange={() => basculer(o.id)} />
                  <span><span className="nm">#{o.ref} · {o.shippingName || o.customerName || "—"}</span><br />
                    <span className="ad">{[a.line1, [a.postal_code, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "Adresse non renseignée"} · {dateFr(o.createdAt)}</span></span>
                  <span className={`chip ${m.ok ? "poste" : "relais"}`}>{m.chip}</span>
                </label>
              );
            }) : <p className="sub">Aucune commande à expédier pour le moment.</p>}
          </section>

          <section className="etq-card" aria-labelledby="etq-t2">
            <h2 id="etq-t2"><span className="n">2</span>L&apos;expéditeur</h2>
            <p className="sub">Votre adresse de retour, si La Poste doit renvoyer le colis.</p>
            <div className="etq-opts">
              {[["meme", "En bas de chaque étiquette", "En petit, sous l'adresse : une seule case par envoi."],
                ["apart", "Sur une étiquette à part", "Une case pour le destinataire, une case pour vous, à coller au dos."],
                ["non", "Pas d'expéditeur", "Seulement l'adresse de la cliente."]].map(([v, t, s]) => (
                <label key={v} className={`etq-opt${mode === v ? " on" : ""}`}>
                  <input type="radio" name="etq-exp" value={v} checked={mode === v} onChange={() => setMode(v)} />
                  <span><b>{t}</b><small>{s}</small></span>
                </label>
              ))}
            </div>
            <label className="etq-f" htmlFor="etq-exp-txt">Adresse de l&apos;expéditeur (gardée pour la prochaine fois)</label>
            <textarea id="etq-exp-txt" value={expTxt} onChange={(e) => setExpTxt(e.target.value)} rows={4} />
          </section>
        </div>

        <section className="etq-card etq-sheetbox" aria-labelledby="etq-t3">
          <h2 id="etq-t3"><span className="n">3</span>Où imprimer sur la feuille</h2>
          <div className="etq-tools">
            <button type="button" className="btn btn-outline" onClick={() => { setAttente(null); setUsed(new Array(NB_CASES).fill(false)); }}>Feuille neuve</button>
            <button type="button" className="btn btn-outline" onClick={() => { const k = used.indexOf(false); if (k >= 0) caseUtilisee(k); }}>Décaler d&apos;une case</button>
            <button type="button" className="btn btn-gold" disabled={!places.length} onClick={imprimer}>Imprimer</button>
          </div>
          <div className="etq-legend"><span><i className="l-free" />Libre</span><span><i className="l-used" />Déjà utilisée (touchez pour changer)</span><span><i className="l-print" />Sera imprimée</span></div>
          {attente ? (
            <div className="etq-status ok" role="status">
              Les étiquettes sont bien sorties ? <button type="button" className="btn btn-gold" onClick={confirmerSortie}>Oui, griser ces cases</button>{" "}
              <button type="button" className="btn btn-outline" onClick={() => setAttente(null)}>Non</button>
            </div>
          ) : (
            <div className={`etq-status${manque ? " warn" : ""}`} role="status">
              {!jobs.length ? "Cochez au moins une commande à gauche."
                : manque ? `Il manque ${manque} case${manque > 1 ? "s" : ""} libre${manque > 1 ? "s" : ""} sur cette feuille : imprimez ces étiquettes, puis les suivantes sur une feuille neuve.`
                : <><b>{jobs.length} étiquette{jobs.length > 1 ? "s" : ""}</b> à imprimer, à partir de la case <b>{places[0].case + 1}</b>. Il restera {libresApres} case{libresApres > 1 ? "s" : ""} libre{libresApres > 1 ? "s" : ""} après.</>}
            </div>
          )}
          <div className="etq-paper" aria-label="Feuille A4, 20 étiquettes">
            {pos.map((p, i) => {
              const pl = parCase[i];
              return (
                <button key={i} type="button" className={`etq-cell${used[i] ? " used" : ""}${pl ? " print" : ""}`}
                  style={{ left: `calc(${p.x} * var(--mm))`, top: `calc(${p.y} * var(--mm))` }}
                  aria-label={`Case ${i + 1}${used[i] ? ", déjà utilisée" : pl ? ", sera imprimée" : ", libre"}`}
                  onClick={() => caseUtilisee(i)}>
                  {pl ? <span className="lab" dangerouslySetInnerHTML={{ __html: contenuEtiquette(pl, expTxt) }} /> : null}
                  <span className="pos">{i + 1}</span>
                </button>
              );
            })}
          </div>
          <p className="sub" style={{ textAlign: "center", margin: 0 }}>A4 210 × 297 mm · marges haut {FEUILLE.mt}, bas {FEUILLE.mb}, gauche {FEUILLE.ml}, droite {FEUILLE.mr} mm · étiquettes {FEUILLE.w} × {FEUILLE.h} mm · {FEUILLE.gx} mm entre les cases</p>
          <p className="sub" style={{ margin: 0 }}>À l&apos;impression : <b>taille réelle (100 %)</b>, pas « ajuster à la page », sans marges. Faites un premier essai sur une feuille blanche posée contre la planche pour vérifier l&apos;alignement.</p>
        </section>
      </div>
    </div>
  );
}
