"use client";

// =============================================================================
// VISIBILITÉ SUR LE SITE — /gestion/visibilite (22/10/2026, maquette validée « applique »)
// Masquer d'un geste une catégorie entière (Maison & Déco…) ou un rayon (Lampes & veilleuses,
// Bougeoirs…) : tous ses produits disparaissent du site ; le réafficher les fait revenir.
// Un produit masqué SEUL (Produits & stock) reste masqué quand on réaffiche son groupe.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const jour = (iso) => { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Europe/Paris" }); } catch { return ""; } };

export default function VisibilitePage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [groupes, setGroupes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openU, setOpenU] = useState({});
  const [showR, setShowR] = useState({});
  const [ask, setAsk] = useState(null); // { type, cle, nom, court, masquer, u }
  const [toast, setToast] = useState("");

  const load = useCallback(async (k) => {
    setErr("");
    try {
      const r = await fetch("/api/admin/visibilite", { headers: { "x-admin-key": k } });
      if (r.status === 401) { setErr("Mot de passe incorrect."); setAuthed(false); return; }
      if (!r.ok) { setErr("Erreur de chargement."); return; }
      setGroupes((await r.json()).groupes || []); setKey(k); setAuthed(true);
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
    } catch { setErr("Erreur de chargement."); }
  }, []);
  useEffect(() => { try { const k = sessionStorage.getItem("niv-admin-key"); if (k) load(k); } catch { /* ignore */ } }, [load]);

  // Où se trouve chaque produit (un produit peut être rangé dans plusieurs rayons).
  const ou = useMemo(() => {
    const m = {};
    for (const u of groupes || []) for (const r of u.rayons) for (const p of r.produits) (m[p.slug] = m[p.slug] || []).push({ u, r });
    return m;
  }, [groupes]);
  const enLigne = (p) => !p.seul && !p.groupe;
  const tous = useMemo(() => {
    const m = new Map();
    for (const u of groupes || []) for (const r of u.rayons) for (const p of r.produits) m.set(p.slug, p);
    return [...m.values()];
  }, [groupes]);

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Visibilité sur le site</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {err ? <div className="notice">{err}</div> : null}
        </form>
      </div>
    );
  }

  const produitsDe = (a) => (a.type === "univers"
    ? [...new Map(a.u.rayons.flatMap((r) => r.produits).map((p) => [p.slug, p])).values()]
    : a.u.rayons.find((r) => r.cle === a.cle)?.produits || []);

  function demander(type, u, r) {
    const masque = type === "univers" ? u.masque : r.masque;
    setAsk({ type, u, cle: type === "univers" ? u.id : r.cle, nom: type === "univers" ? `la catégorie « ${u.nom} »` : `le rayon « ${r.nom} »`, court: type === "univers" ? u.nom : r.nom, masquer: !masque });
  }

  async function confirmer() {
    const a = ask;
    const avant = produitsDe(a).filter(enLigne).length;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/visibilite", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ type: a.type, cle: a.cle, masque: a.masquer }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Échec : rien n'a été enregistré.");
      const g = d.groupes || [];
      setGroupes(g);
      const u2 = g.find((x) => x.id === a.u.id);
      const apres = (a.type === "univers" ? [...new Map(u2.rayons.flatMap((r) => r.produits).map((p) => [p.slug, p])).values()] : u2.rayons.find((r) => r.cle === a.cle)?.produits || []).filter(enLigne).length;
      const n = Math.abs(apres - avant);
      setToast(a.masquer ? `Enregistré ✓ · ${n} produit${n > 1 ? "s" : ""} retiré${n > 1 ? "s" : ""} du site` : `Enregistré ✓ · ${n} produit${n > 1 ? "s" : ""} de retour sur le site`);
      setTimeout(() => setToast(""), 3200);
      setAsk(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const sw = (on, onClick, label, off) => (
    <button type="button" className={`vz-sw${on ? "" : " off"}${off ? " vz-dis" : ""}`} aria-pressed={on} aria-label={`${label} ${on ? "visible" : "masqué"}`} disabled={off || busy} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <span className="t" /><span className="l">{on ? "Visible" : "Masqué"}</span>
    </button>
  );
  const chip = (p) => (p.seul ? <span className="vz-chip solo">masqué seul</span>
    : p.groupe ? <span className="vz-chip ray">masqué · {p.groupe}</span>
    : <span className="vz-chip on">en ligne</span>);

  const nbU = (groupes || []).filter((u) => !u.masque).length;
  const nbR = (groupes || []).reduce((s, u) => s + u.rayons.filter((r) => r.masque).length, 0);
  const nbOn = tous.filter(enLigne).length;

  // Contenu de la fenêtre de confirmation.
  let fenetre = null;
  if (ask) {
    const prods = produitsDe(ask);
    if (ask.masquer) {
      const partent = prods.filter(enLigne);
      const ailleurs = partent.map((p) => {
        // Ailleurs = un autre rayon (masquer une catégorie couvre déjà tous ses rayons).
        const autres = (ou[p.slug] || []).filter((w) => (ask.type === "univers" ? w.u.id !== ask.u.id : w.r.cle !== ask.cle));
        return autres.length ? { p, o: [...new Set(autres.map((w) => `${w.u.nom} › ${w.r.nom}`))] } : null;
      }).filter(Boolean);
      fenetre = (
        <>
          <h2 id="vz-t">Masquer {ask.nom} ?</h2>
          <p>{partent.length ? <><b>{partent.length} produit{partent.length > 1 ? "s" : ""}</b> disparaîtr{partent.length > 1 ? "ont" : "a"} du site (boutique, accueil, recherche, plan envoyé à Google). Les fiches répondront « page introuvable ».</> : "Aucun produit de ce groupe n'est en ligne en ce moment."}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="vz-thumbs">{partent.map((p) => <img key={p.slug} src={p.image} alt={p.nom} title={p.nom} />)}</div>
          {ask.type === "univers" ? <div className="vz-warn">L&apos;onglet « {ask.court} » disparaît aussi du menu du site.</div> : null}
          {ailleurs.length ? <div className="vz-warn">{ailleurs.map((x) => <div key={x.p.slug}><b>{x.p.nom}</b> est aussi dans {x.o.join(", ")} : le produit disparaîtra là aussi.</div>)}</div> : null}
          <p className="vz-dim">Ils restent dans Gestion. Vous les réaffichez quand vous voulez. Le site se met à jour en une minute environ.</p>
        </>
      );
    } else {
      const restent = prods.filter((p) => p.seul);
      fenetre = (
        <>
          <h2 id="vz-t">Réafficher {ask.nom} ?</h2>
          <p>Les produits de ce groupe reviennent sur le site (en une minute environ).</p>
          {restent.length ? <div className="vz-warn">Restent masqués, car vous les aviez masqués seuls : {restent.map((p, i) => <span key={p.slug}>{i ? ", " : ""}<b>{p.nom}</b></span>)}.</div> : null}
        </>
      );
    }
  }

  return (
    <div className="vz">
      <PageHead
        eyebrow="Catalogue"
        title="Visibilité sur le site"
        subtitle="Masquez une catégorie entière ou un seul rayon d'un geste : tous ses produits disparaissent du site. Réaffichez-le et tout revient."
        kpis={[
          { label: "Catégories en ligne", value: `${nbU} / ${(groupes || []).length}` },
          { label: "Rayons masqués", value: nbR },
          { label: "Produits en ligne", value: nbOn, tone: "good" },
          { label: "Produits masqués", value: tous.length - nbOn },
        ]}
      />
      <div className="vz-rule"><i>ⓘ</i><div>Un produit que vous avez masqué <b>seul</b> (dans Produits &amp; stock) reste masqué quand vous réaffichez son rayon. Rien n&apos;est supprimé : tout reste dans Gestion.</div></div>
      {err ? <div className="notice" style={{ marginTop: 12 }}>{err}</div> : null}
      <div className="vz-list">
        {(groupes || []).map((u) => {
          const all = [...new Map(u.rayons.flatMap((r) => r.produits).map((p) => [p.slug, p])).values()];
          const on = all.filter(enLigne).length;
          return (
            <div key={u.id} className={`vz-u${u.masque ? " off" : ""}${openU[u.id] ? " open" : ""}`}>
              <div className="vz-uh" role="button" tabIndex={0} onClick={() => setOpenU((o) => ({ ...o, [u.id]: !o[u.id] }))} onKeyDown={(e) => { if (e.key === "Enter") setOpenU((o) => ({ ...o, [u.id]: !o[u.id] })); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.img} alt="" />
                <div>
                  <div className="vz-un"><span className="vz-chev">▶</span>{u.nom}{u.masque ? <span className="vz-chip off">Masquée depuis le {jour(u.at)}</span> : null}</div>
                  <div className="vz-um">{on} produit{on > 1 ? "s" : ""} en ligne sur {all.length} · {u.rayons.length} rayon{u.rayons.length > 1 ? "s" : ""}</div>
                </div>
                {sw(!u.masque, () => demander("univers", u), "Catégorie")}
              </div>
              <div className="vz-rays">
                {u.rayons.map((r) => {
                  const ron = r.produits.filter(enLigne).length;
                  return (
                    <div key={r.cle} className={`vz-r${showR[r.cle] ? " show" : ""}`}>
                      <div className="vz-rh">
                        <div>
                          <div className="vz-rn">{r.nom}{r.masque ? <span className="vz-chip off">Masqué depuis le {jour(r.at)}</span> : null}</div>
                          <div className="vz-rm">{ron} en ligne sur {r.produits.length}{u.masque ? <> · <span className="vz-dim">la catégorie entière est masquée</span></> : null}</div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <div className="vz-thumbs">{r.produits.map((p) => <img key={p.slug} src={p.image} alt={p.nom} title={p.nom} className={enLigne(p) ? "" : "gone"} loading="lazy" />)}</div>
                          <button type="button" className="vz-more" onClick={() => setShowR((s) => ({ ...s, [r.cle]: !s[r.cle] }))}>{showR[r.cle] ? "Masquer le détail" : "Voir les produits"}</button>
                        </div>
                        {sw(!r.masque, () => demander("rayon", u, r), "Rayon", u.masque)}
                      </div>
                      <div className="vz-prods">
                        {r.produits.map((p) => (
                          <div key={p.slug} className="vz-p">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt="" loading="lazy" />
                            <div className="vz-pn">{p.nom}{p.prix != null ? <div className="pr">dès {euro(p.prix)}</div> : null}</div>
                            {chip(p)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {ask ? (
        <div className="vz-veil" onClick={(e) => { if (e.target === e.currentTarget && !busy) setAsk(null); }}>
          <div className="vz-sheet" role="dialog" aria-modal="true" aria-labelledby="vz-t">
            {fenetre}
            <div className="vz-btns">
              <button type="button" className="vz-btn" onClick={() => setAsk(null)} disabled={busy}>Annuler</button>
              <button type="button" className={`vz-btn ${ask.masquer ? "red" : "go"}`} onClick={confirmer} disabled={busy}>{busy ? "Enregistrement…" : ask.masquer ? "Masquer" : "Réafficher"}</button>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? <div className="vz-toast" role="status">{toast}</div> : null}
    </div>
  );
}
