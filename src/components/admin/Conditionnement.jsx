"use client";

// =============================================================================
// CONDITIONNEMENT D'UNE COMMANDE (11/10/2026) — maquette validée « Matériel & conditionnement ».
// Bloc dans chaque carte de la file de production + fenêtre « cartes à photo » : le gérant coche
// le matériel utilisé, le stock baisse à « Valider », le coût et le gain de la commande se calculent.
// Une seule validation par commande : re-valider CORRIGE (l'ancien matériel est rendu au stock).
// =============================================================================

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Matériel conseillé selon ce que la commande contient : l'emballage bijou choisi par la cliente,
// sinon un colis de verre (carton + calage + étiquette fragile).
export function materielConseille(o, items) {
  const txt = (o.items || []).map((i) => `${i.name || ""} ${i.details || ""}`).join(" ");
  const ids = new Set();
  if (/Pack Collier/i.test(txt)) { ids.add("sac"); ids.add("boitec"); ids.add("micro"); }
  if (/Pack Bracelet/i.test(txt)) { ids.add("sac"); ids.add("boitea"); ids.add("micro"); }
  if (/Emballage\s*:\s*Sac/i.test(txt)) ids.add("sac");
  if (/Emballage\s*:\s*Pochette microfibre/i.test(txt)) ids.add("micro");
  if (/Emballage\s*:\s*Bo[iî]te/i.test(txt)) ids.add(/bracelet\s*homme|allong/i.test(txt) ? "boitea" : "boitec");
  if (!ids.size) for (const it of items) if (it.sug) ids.add(it.id);
  return ids;
}

function Photo({ it }) {
  // eslint-disable-next-line @next/next/no-img-element
  return it.photo ? <img src={it.photo} alt="" loading="lazy" /> : <span className="ic" style={{ fontSize: "1.4rem" }}>▢</span>;
}

export function BlocConditionnement({ o, mat, onOpen }) {
  const u = mat?.usages?.[o.id];
  const items = mat?.items || [];
  return (
    <div className="mp-pack">
      <div className="mp-pack-h"><b>📦 Conditionnement</b><span className={`mp-pill${u ? " ok" : ""}`}>{u ? "✓ Conditionné" : "À faire"}</span></div>
      {u ? (
        <>
          <div className="mp-used">
            {Object.entries(u.lines || {}).map(([id, q]) => {
              const it = items.find((x) => x.id === id); if (!it) return null;
              return <span key={id}>{it.photo ? <img src={it.photo} alt="" /> : <span className="ic" />}{it.court || it.nom} ×{q}</span>;
            })}
          </div>
          <p className="mp-cost">Matériel <b>{euro(u.matCost)}</b> · Gain de la commande <span className={u.gain >= 0 ? "g" : "r"}>{euro(u.gain)}</span></p>
        </>
      ) : (
        <p className="mp-cost" style={{ color: "var(--ink-soft)" }}>Matériel non renseigné. Le gain de cette commande n&apos;est pas encore calculé.</p>
      )}
      <button type="button" className="btn btn-gold" onClick={onOpen}>{u ? "Corriger" : "Choisir le matériel utilisé"}</button>
    </div>
  );
}

export default function FenetreConditionnement({ o, adminKey, mat, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState({});
  const [filt, setFilt] = useState("tous");
  const [view, setView] = useState("tout");
  const [q, setQ] = useState("");
  const [etiq, setEtiq] = useState("");
  const [calc, setCalc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/materiel?orderId=${encodeURIComponent(o.id)}`, { headers: { "x-admin-key": adminKey } });
      if (!r.ok) throw new Error("Chargement impossible.");
      const d = await r.json();
      setData(d);
      setSel({ ...(d.usage?.lines || {}) });
      setEtiq(String(d.usage ? d.usage.etiquette : d.estimation?.etiquette ?? ""));
    } catch (e) { setErr(e.message); }
  }, [o.id, adminKey]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);

  const items = useMemo(() => (data?.items || mat?.items || []).filter((i) => !i.archive), [data, mat]);
  const cats = data?.cats || mat?.cats || [];
  const kits = data?.kits || mat?.kits || [];
  const conseil = useMemo(() => materielConseille(o, items), [o, items]);
  const deja = data?.usage?.lines || {}; // déjà décompté au stock par la validation précédente

  const liste = items.filter((i) => (filt === "tous" || conseil.has(i.id)) && (!q || norm(`${i.nom} ${i.mat} ${i.pour} ${i.lot}`).includes(norm(q))));
  const mCost = items.reduce((s, i) => s + (sel[i.id] || 0) * (Number(i.cout) || 0), 0);
  const est = data?.estimation || { encaisse: Number(o.total) || 0, produit: 0, etiquette: 0, stripe: 0 };
  const et = Number(String(etiq).replace(",", ".")) || 0;
  const gain = est.encaisse - est.produit - mCost - et - est.stripe;
  const nbSel = Object.keys(sel).length;

  const resteApres = (i) => (typeof i.stock === "number" ? i.stock + (deja[i.id] || 0) - (sel[i.id] || 0) : null);
  const plus = (i) => setSel((s) => { const r = resteApres(i); if (r !== null && r <= 0) return s; return { ...s, [i.id]: (s[i.id] || 0) + 1 }; });
  const moins = (i) => setSel((s) => { const n = Math.max(0, (s[i.id] || 0) - 1); const c = { ...s }; if (n) c[i.id] = n; else delete c[i.id]; return c; });
  const bascule = (i) => setSel((s) => { const c = { ...s }; if (c[i.id]) delete c[i.id]; else c[i.id] = 1; return c; });
  const kit = (k) => setSel({ ...k.items });

  async function appeler(body) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/materiel", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Échec de l'enregistrement.");
      return d;
    } catch (e) { setErr(e.message); return null; } finally { setBusy(false); }
  }
  async function valider() {
    if (!nbSel) { setErr("Cochez au moins un matériel, ou annulez."); return; }
    const d = await appeler({ action: "valider", orderId: o.id, lines: sel, etiquette: et });
    if (d) { onSaved(); onClose(); }
  }
  async function retirer() {
    if (!window.confirm("Retirer la validation ? Le matériel est rendu au stock.")) return;
    const d = await appeler({ action: "annuler", orderId: o.id });
    if (d) { onSaved(); onClose(); }
  }

  const carte = (i) => {
    const n = sel[i.id] || 0, r = resteApres(i), bas = r !== null && r <= (Number(i.seuil) || 0);
    return (
      <div key={i.id} className={`mp-it${n ? " on" : ""}`} tabIndex={0} role="button" aria-pressed={n ? "true" : "false"}
        onClick={() => bascule(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bascule(i); } }}>
        {conseil.has(i.id) ? <span className="mp-sug">Suggéré</span> : null}
        <span className="mp-chk">✓</span>
        <div className="mp-ph"><Photo it={i} /></div>
        <div className="mp-tx">
          <b>{i.nom}</b>{i.lot ? <small>{i.lot}</small> : null}
          <small><span className="c">{euro(i.cout)}</span> · {i.usage}</small>
          {i.dim ? <small className="dt"><u>Taille</u> {i.dim}</small> : null}
          {i.mat ? <small className="dt"><u>Matière</u> {i.mat}</small> : null}
          {i.pour ? <small className="dt"><u>Pour</u> {i.pour}</small> : null}
          {i.achat ? <small className="dt"><u>Acheté</u> {i.achat}</small> : null}
          <div className={`mp-st${bas ? " low" : ""}`}>{r === null ? "stock : à saisir" : `stock ${typeof i.stock === "number" ? i.stock + (deja[i.id] || 0) : i.stock}${n ? ` → ${r}` : ""}${bas ? " · à racheter" : ""}`}</div>
        </div>
        <div className="mp-qty" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => moins(i)} aria-label="Moins">−</button><span>{n}</span><button type="button" onClick={() => plus(i)} aria-label="Plus">+</button>
        </div>
      </div>
    );
  };

  const groupes = view === "cat" ? cats.map((c) => ({ nom: c.nom, l: liste.filter((i) => i.cat === c.id) })).filter((g) => g.l.length) : [{ nom: "", l: liste }];
  const ref = o.ref || (o.id || "").slice(-6);
  const lignes = (o.items || []).filter((i) => !/livraison|point relais|retrait/i.test(i.name || ""));

  return (
    <>
      <div className="mp-scrim open" onClick={onClose} />
      <div className="mp-sheet open" role="dialog" aria-modal="true" aria-label="Conditionnement de la commande">
        <div className="mp-sh">
          <h2>Conditionnement · #{ref}</h2>
          <p>{lignes.map((i) => `${i.name} × ${i.quantity}`).join(" · ")} · {euro(est.encaisse)} encaissés</p>
          <button type="button" className="mp-x" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="mp-kits">
          {kits.map((k) => <button key={k.id} type="button" className="mp-kit" onClick={() => kit(k)}><b>{k.nom}</b><small>{k.detail}</small></button>)}
        </div>
        <div className="mp-filters">
          {[["tout", "Tout ensemble"], ["cat", "Par catégorie"]].map(([k, n]) => <button key={k} type="button" className={view === k ? "on" : ""} onClick={() => setView(k)}>{n}</button>)}
          {[["tous", "Tout le matériel"], ["sug", "Suggérés pour cette commande"]].map(([k, n]) => <button key={k} type="button" className={filt === k ? "on" : ""} onClick={() => setFilt(k)}>{n}</button>)}
          <input type="search" placeholder="Rechercher un matériel…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un matériel" autoComplete="off" />
        </div>
        <div className="mp-body">
          {!data && !err ? <p className="mp-st" style={{ padding: "18px 0" }}>Chargement…</p> : null}
          <div className="mp-grid">
            {!liste.length && data ? <p className="mp-st" style={{ gridColumn: "1/-1", padding: "18px 0" }}>Aucun matériel à ce nom.</p> : null}
            {groupes.map((g) => (
              <Fragment key={g.nom || "tous"}>{g.nom ? <h4 className="mp-gh">{g.nom} · {g.l.length}</h4> : null}{g.l.map(carte)}</Fragment>
            ))}
          </div>
        </div>
        <div className="mp-ft">
          {err ? <div className="notice" style={{ marginBottom: 8 }}>{err}</div> : null}
          <div className={`mp-calc${calc ? " open" : ""}`}>
            <div><span>Encaissé (avec le port)</span><span>{euro(est.encaisse)}</span></div>
            <div><span>− Le produit (coût d&apos;achat){est.produitIncomplet ? " ⚠️ incomplet" : ""}</span><span>{euro(est.produit)}</span></div>
            <div><span>− Matériel coché</span><span>{euro(mCost)}</span></div>
            <div><span>− Étiquette d&apos;envoi</span><span>{euro(et)}</span></div>
            <div><span>− Frais Stripe (1,5 % + 0,25 €)</span><span>{euro(est.stripe)}</span></div>
            <div className="t"><span>Votre gain</span><span>{euro(gain)}</span></div>
          </div>
          <label className="mp-etiq">Étiquette d&apos;envoi (€) <input inputMode="decimal" value={etiq} onChange={(e) => setEtiq(e.target.value)} /> <small style={{ color: "var(--ink-soft)" }}>estimée, à corriger avec le vrai tarif</small></label>
          <div className="mp-sum">
            <div className="l">Matériel <b>{euro(mCost)}</b> · Gain estimé <b>{euro(gain)}</b><br /><button type="button" onClick={() => setCalc((v) => !v)}>{calc ? "Masquer le calcul" : "Voir le calcul"}</button>{data?.usage ? <button type="button" onClick={retirer} style={{ marginLeft: 12 }}>Retirer la validation</button> : null}</div>
            <div className="r"><button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button><button type="button" className="btn btn-gold" disabled={busy} onClick={valider}>{data?.usage ? "Corriger" : "Valider"}</button></div>
          </div>
        </div>
      </div>
    </>
  );
}
