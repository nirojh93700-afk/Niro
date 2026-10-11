"use client";

// =============================================================================
// MATÉRIEL & EMBALLAGES — /gestion/materiel (11/10/2026, maquette validée)
// Tout ce que le gérant achète pour fabriquer et expédier, dans UNE page : stock, coût par
// utilisation, alerte « à racheter ». Le stock baisse quand il valide le conditionnement d'une
// commande (file de production). Deux affichages au choix : tout ensemble / par catégorie.
// =============================================================================

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function MaterielPage() {
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState("tout");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null); // article en cours de modification (copie)
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (k) => {
    setErr("");
    try {
      const r = await fetch("/api/admin/materiel", { headers: { "x-admin-key": k } });
      if (r.status === 401) { setErr("Mot de passe incorrect."); setAuthed(false); return; }
      if (!r.ok) { setErr("Erreur de chargement."); return; }
      setData(await r.json()); setKey(k); setAuthed(true);
      try { sessionStorage.setItem("niv-admin-key", k); } catch { /* ignore */ }
    } catch { setErr("Erreur de chargement."); }
  }, []);
  useEffect(() => { try { const k = sessionStorage.getItem("niv-admin-key"); if (k) load(k); } catch { /* ignore */ } }, [load]);

  async function post(body) {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/materiel", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Échec de l'enregistrement.");
      await load(key);
      return d;
    } catch (e) { setErr(e.message); return null; } finally { setBusy(false); }
  }

  const items = useMemo(() => (data?.items || []).filter((i) => !i.archive), [data]);
  const cats = data?.cats || [];
  const filtre = items.filter((i) => !q || norm(`${i.nom} ${i.mat} ${i.pour} ${i.lot} ${i.achat}`).includes(norm(q)));
  const valeur = items.reduce((s, i) => s + (typeof i.stock === "number" ? i.stock * (Number(i.cout) || 0) : 0), 0);
  const bas = items.filter((i) => typeof i.stock === "number" && i.stock <= (Number(i.seuil) || 0));
  const usages = Object.values(data?.usages || {});
  const moyenne = usages.length ? usages.reduce((s, u) => s + (Number(u.matCost) || 0), 0) / usages.length : null;

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Matériel &amp; emballages</h1>
        <p style={{ color: "var(--ink-soft)" }}>Espace réservé. Entrez le mot de passe de gestion.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(keyInput.trim()); }} style={{ display: "grid", gap: 10 }}>
          <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Mot de passe" style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          <button className="btn btn-gold" type="submit">Entrer</button>
          {err ? <div className="notice">{err}</div> : null}
        </form>
      </div>
    );
  }

  function ligne(i) {
    const a = typeof i.stock === "number", utilise = data?.utilise?.[i.id] || 0;
    const isLow = a && i.stock <= (Number(i.seuil) || 0);
    const base = Number(i.achete) || (a ? i.stock + utilise : 0);
    const pct = a && base ? Math.min(100, Math.round((i.stock / base) * 100)) : 0;
    return (
      <Fragment key={i.id}>
        <div className="mp-row">
          <div className="ph">{i.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.photo} alt="" loading="lazy" /> : <span className="ic" />}</div>
          <div>
            <b>{i.nom}</b>
            <small>{i.lot}{i.lot ? " · " : ""}{euro(i.cout)} / utilisation ({i.usage})</small>
            {i.dim ? <small className="dt"><u>Taille</u> {i.dim}</small> : null}
            {i.mat ? <small className="dt"><u>Matière</u> {i.mat}</small> : null}
            {i.pour ? <small className="dt"><u>Pour</u> {i.pour}</small> : null}
            {i.achat ? <small className="dt"><u>Acheté</u> {i.achat}</small> : null}
          </div>
          <div className={`mp-bar${isLow ? " low" : ""}`}>
            {a ? <><b>{i.stock}</b><small> restants{isLow ? " · à racheter" : ""}</small><i><u style={{ width: `${pct}%` }} /></i></> : <small>stock à saisir</small>}
            {a && base ? <small style={{ display: "block", marginTop: 3 }}>{Math.max(0, base - i.stock)} utilisé{base - i.stock > 1 ? "s" : ""} sur {base}</small> : null}
            <div className="mp-links">
              <button type="button" disabled={busy} onClick={() => { const n = window.prompt(`Quantité reçue pour « ${i.nom} » :`, ""); if (n) post({ action: "recevoir", id: i.id, qty: n }); }}>+ Reçu</button>
              <button type="button" onClick={() => setEdit({ ...i })}>Modifier</button>
            </div>
          </div>
        </div>
        {edit?.id === i.id ? formulaire() : null}
      </Fragment>
    );
  }

  function formulaire() {
    const set = (k) => (e) => setEdit((x) => ({ ...x, [k]: e.target.value }));
    return (
      <div className="mp-edit">
        <label>Nom<input value={edit.nom || ""} onChange={set("nom")} /></label>
        <div className="g2">
          <label>Catégorie<select value={edit.cat || "exp"} onChange={set("cat")}>{cats.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
          <label>Coût d&apos;une utilisation (€)<input inputMode="decimal" value={edit.cout ?? ""} onChange={set("cout")} /></label>
          <label>Unité d&apos;utilisation<input value={edit.usage || ""} onChange={set("usage")} placeholder="1 carton" /></label>
          <label>Stock restant<input inputMode="numeric" value={edit.stock ?? ""} onChange={set("stock")} /></label>
          <label>Alerte « à racheter » sous<input inputMode="numeric" value={edit.seuil ?? ""} onChange={set("seuil")} /></label>
          <label>Quantité achetée (barre)<input inputMode="numeric" value={edit.achete ?? ""} onChange={set("achete")} /></label>
        </div>
        <label>Achat (lot, prix)<input value={edit.lot || ""} onChange={set("lot")} /></label>
        <label>Taille<input value={edit.dim || ""} onChange={set("dim")} /></label>
        <label>Matière<input value={edit.mat || ""} onChange={set("mat")} /></label>
        <label>Pour quoi<input value={edit.pour || ""} onChange={set("pour")} /></label>
        <label>Où acheté<input value={edit.achat || ""} onChange={set("achat")} /></label>
        <label>Nom court (affiché sur la commande)<input value={edit.court || ""} onChange={set("court")} /></label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" disabled={busy} onClick={async () => { const { id, nouveau, ...champs } = edit; const d = await post({ action: "item", id, ...(nouveau ? { nouveau: true } : {}), ...champs }); if (d) setEdit(null); }}>Enregistrer</button>
          <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>Annuler</button>
          {edit.id && !edit.nouveau ? <button type="button" className="btn btn-outline" disabled={busy} onClick={async () => { if (window.confirm("Archiver cet article ? Il disparaît de la liste (l'historique des commandes reste).")) { const d = await post({ action: "item", id: edit.id, archive: true }); if (d) setEdit(null); } }}>Archiver</button> : null}
        </div>
      </div>
    );
  }

  const box = (titre, l) => (
    <div className="mp-list" key={titre}>
      <h3>{titre} · {l.length} article{l.length > 1 ? "s" : ""}</h3>
      {l.map(ligne)}
    </div>
  );

  return (
    <div className="container" style={{ padding: "28px 16px 60px", maxWidth: 980 }}>
      <PageHead eyebrow="Catalogue" title="Matériel & emballages"
        subtitle="Tout ce que vous achetez pour fabriquer et expédier, au même endroit : stock, coût par utilisation, alerte quand il faut racheter."
        kpis={[
          { label: "Valeur du stock", value: euro(valeur) },
          { label: "À racheter", value: String(bas.length), tone: bas.length ? "bad" : "" },
          { label: "Matériel moyen par commande", value: moyenne === null ? "—" : euro(moyenne), sub: `${usages.length} commande${usages.length > 1 ? "s" : ""} validée${usages.length > 1 ? "s" : ""}` },
        ]}
        actions={<button type="button" className="btn btn-gold" onClick={() => setEdit({ nouveau: true, id: "", nom: "", cat: "exp", cout: "", usage: "1 pièce", stock: 0, seuil: 0, achete: 0 })}>+ Ajouter un matériel</button>} />

      <div className="mp-note">📦 <b>Comment ça marche :</b> sur chaque commande de la <a href="/gestion/commandes">file de production</a>, le bloc « Conditionnement » vous laisse cocher le matériel utilisé. Au clic sur « Valider », le stock baisse ici et le coût du matériel est compté dans <a href="/gestion/benefices">Bénéfices</a>. Un achat arrive : « + Reçu » sur la ligne.</div>
      {err ? <div className="notice">{err}</div> : null}

      <div className="mp-filters mp-pagev" style={{ padding: "0 0 12px", flexWrap: "wrap" }}>
        {[["tout", "Tout ensemble"], ["cat", "Par catégorie"]].map(([k, n]) => <button key={k} type="button" className={view === k ? "on" : ""} onClick={() => setView(k)}>{n}</button>)}
        <input type="search" placeholder="Rechercher un matériel…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un matériel" autoComplete="off" />
      </div>

      {edit?.nouveau ? <div className="mp-list" style={{ marginBottom: 16 }}><h3>Nouveau matériel</h3>{formulaire()}</div> : null}

      {!filtre.length ? <p className="mp-st">Aucun matériel à ce nom.</p> : view === "cat"
        ? cats.map((c) => ({ c, l: filtre.filter((i) => i.cat === c.id) })).filter((g) => g.l.length).map((g) => box(g.c.nom, g.l))
        : box("Tout le matériel", filtre)}
    </div>
  );
}
