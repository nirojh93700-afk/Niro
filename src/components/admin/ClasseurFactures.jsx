"use client";
// 🧾 Classeur des factures (15/11/2026, maquette « Niv Admin ») — en tête de Stock & achats › Achats & factures.
// Chaque facture est gardée 10 ans dans son fichier d'origine (photo ou PDF) avec son empreinte, rangée par mois et
// par fournisseur. « Facture manquante » = un achat ou une dépense de Bénéfices sans pièce.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chercher } from "@/lib/classeurFactures";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const dateFr = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR") : "—");
const moisFr = (m) => new Date(m + "-15T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const ETATS = { rangee: ["Rangée", "ok"], verifier: ["À vérifier", "warn"], manquante: ["Facture manquante", "bad"] };

function base64(file) {
  return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result || "").replace(/^data:[^;]+;base64,/, "")); r.onerror = () => ko(new Error("Lecture impossible.")); r.readAsDataURL(file); });
}

export default function ClasseurFactures({ adminKey }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState("tout");
  const [form, setForm] = useState(null); // { file, fournisseur, date, montant, categorie, libelle, numero, cible }
  const [busy, setBusy] = useState("");
  const [voir, setVoir] = useState(null); // { url, type, nom }
  const [edit, setEdit] = useState(null);
  const photo = useRef(null);
  const pdf = useRef(null);
  const cibleRef = useRef(null);

  const load = useCallback(async () => {
    if (!adminKey) return;
    try {
      const r = await fetch("/api/admin/factures", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setData(j);
    } catch (e) { setErr(e.message); }
  }, [adminKey]);
  useEffect(() => { load(); }, [load]);

  const cats = data?.categories || {};
  const lignes = useMemo(() => {
    let l = data?.lignes || [];
    if (filtre.startsWith("m:")) l = l.filter((x) => String(x.date).startsWith(filtre.slice(2)));
    else if (filtre.startsWith("c:")) l = l.filter((x) => x.categorie === filtre.slice(2));
    else if (filtre === "manquantes") l = l.filter((x) => x.etat !== "rangee");
    return chercher(l, q);
  }, [data, filtre, q]);
  const parFournisseur = filtre === "fournisseur";

  function choisir(file, cible) {
    if (!file) return;
    setForm({ file, fournisseur: cible?.fournisseur || "", date: cible?.date || new Date().toISOString().slice(0, 10), montant: cible?.montant ? String(cible.montant).replace(".", ",") : "", categorie: cible?.categorie || "marchandises", libelle: cible?.libelle || "", numero: cible?.numero || "", cible: cible?.cible || null });
  }
  async function lireAssistant() {
    if (!form?.file) return;
    setBusy("lire"); setErr("");
    try {
      const r = await fetch("/api/admin/purchases", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "analyze", file: { name: form.file.name, type: form.file.type || "", data: await base64(form.file) } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Lecture impossible.");
      const p = j.proposal || {};
      setForm((f) => ({ ...f, fournisseur: f.fournisseur || p.supplier || "", numero: f.numero || p.invoiceNumber || "", date: /^\d{4}-\d{2}-\d{2}$/.test(p.date || "") ? p.date : f.date, montant: f.montant || (p.total ? String(p.total).replace(".", ",") : ""), libelle: f.libelle || (p.lines || []).map((l) => l.label).filter(Boolean).join(", ").slice(0, 160) }));
    } catch (e) { setErr(e.message); }
    setBusy("");
  }
  async function ranger() {
    if (!form?.file) return;
    setBusy("ranger"); setErr("");
    try {
      const fichier = { name: form.file.name || "facture", type: form.file.type || "application/octet-stream", data: await base64(form.file) };
      const r = await fetch("/api/admin/factures", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "ajouter", fichier, fournisseur: form.fournisseur, date: form.date, montant: form.montant, categorie: form.categorie, libelle: form.libelle, numero: form.numero, cible: form.cible }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Rangement impossible.");
      setForm(null); load();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }
  async function ouvrir(x) {
    if (!x.fichier?.id) return;
    setBusy("voir:" + x.id);
    try {
      const r = await fetch(`/api/admin/factures?fichier=${encodeURIComponent(x.fichier.id)}`, { headers: { "x-admin-key": adminKey } });
      if (!r.ok) throw new Error("Fichier introuvable.");
      const b = await r.blob();
      setVoir({ url: URL.createObjectURL(b), type: b.type, nom: x.fichier.nom || "facture", sha: x.fichier.sha, x });
    } catch (e) { setErr(e.message); }
    setBusy("");
  }
  async function enregistrerEdit() {
    setBusy("edit");
    try {
      const r = await fetch("/api/admin/factures", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ action: "modifier", ...edit }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Refusé.");
      setEdit(null); load();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const k = data?.kpis;
  const groupes = parFournisseur ? Object.entries(lignes.reduce((a, x) => { (a[x.fournisseur] = a[x.fournisseur] || []).push(x); return a; }, {})).sort((a, b) => a[0].localeCompare(b[0], "fr")) : [["", lignes]];

  return (
    <section className="cf">
      <input ref={photo} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { choisir(e.target.files?.[0], cibleRef.current); e.target.value = ""; }} />
      <input ref={pdf} type="file" accept="application/pdf,image/*" hidden onChange={(e) => { choisir(e.target.files?.[0], cibleRef.current); e.target.value = ""; }} />
      <div className="cf-h"><h2>🧾 Classeur des factures</h2><span>Chaque facture gardée 10 ans dans son fichier d&apos;origine, avec une empreinte qui prouve qu&apos;elle n&apos;a pas changé.</span></div>
      <div className="cf-bar">
        <button type="button" className="fq-btn pri" onClick={() => { cibleRef.current = null; setForm(null); photo.current?.click(); }}>📷 Photographier une facture</button>
        <button type="button" className="fq-btn" onClick={() => { cibleRef.current = null; setForm(null); pdf.current?.click(); }}>Importer un PDF ou une photo</button>
        <input className="cf-find" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher : fournisseur, produit, montant…" aria-label="Rechercher" />
      </div>
      {k ? (
        <div className="cf-kpis">
          <div><span>Achats du mois</span><b>{euro(k.mois.montant)}</b><em>{k.mois.n} pièce{k.mois.n > 1 ? "s" : ""}</em></div>
          <div><span>Achats de l&apos;année</span><b>{euro(k.annee.montant)}</b><em>{k.annee.n} pièce{k.annee.n > 1 ? "s" : ""}</em></div>
          <div><span>À vérifier</span><b>{k.verifier}</b><em>lecture incertaine</em></div>
          <div className={k.manquantes ? "bad" : ""}><span>Factures manquantes</span><b>{k.manquantes}</b><em>achat ou dépense sans pièce</em></div>
        </div>
      ) : null}
      {err ? <p className="cf-err">{err}</p> : null}

      {form?.file ? (
        <div className="cf-form">
          <b>{form.cible ? "Ajouter la facture de cette dépense" : "Ranger cette facture"} · {form.file.name}</b>
          <div className="cf-grid">
            <label>Fournisseur<input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} /></label>
            <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label>Montant TTC (€)<input inputMode="decimal" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></label>
            <label>Catégorie<select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>{Object.entries(cats).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label>N° de facture<input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></label>
            <label className="l2">Ce qui a été acheté<input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></label>
          </div>
          <div className="cf-acts">
            <button type="button" className="fq-btn pri" onClick={ranger} disabled={busy === "ranger"}>{busy === "ranger" ? "Rangement…" : "Ranger dans le classeur"}</button>
            <button type="button" className="fq-btn" onClick={lireAssistant} disabled={busy === "lire"}>{busy === "lire" ? "Lecture…" : "Remplir avec l'assistant"}</button>
            <button type="button" className="fq-btn ghost" onClick={() => setForm(null)}>Annuler</button>
          </div>
          <span className="cf-note">Pour mettre aussi le stock à jour, utilisez « Lire une facture » plus bas : la facture y est rangée en même temps.</span>
        </div>
      ) : null}

      <div className="fq-chipbar" style={{ flexWrap: "wrap", margin: "10px 0" }}>
        {[["tout", "Tout"], ...(data?.moisListe || []).slice(0, 3).map((m) => ["m:" + m, moisFr(m)]), ["fournisseur", "Par fournisseur"], ["manquantes", "Manquantes / à vérifier"], ...Object.entries(cats).slice(0, 3).map(([v, l]) => ["c:" + v, l])].map(([v, l]) => (
          <button key={v} type="button" className={`fq-chip${filtre === v ? " on" : ""}`} onClick={() => setFiltre(v)}>{l}</button>
        ))}
      </div>

      <div className="cf-tablewrap">
        {groupes.map(([g, l]) => (
          <table key={g || "tout"} className="cf-table">
            {g ? <caption>{g} · {l.length} · {euro(l.reduce((s, x) => s + (Number(x.montant) || 0), 0))}</caption> : null}
            <thead><tr><th>Fournisseur</th><th>Date</th><th>Catégorie</th><th className="n">Montant TTC</th><th>Fichier</th><th>État</th></tr></thead>
            <tbody>
              {l.length === 0 ? <tr><td colSpan={6} className="cf-vide">{data ? "Aucune facture ici pour l'instant." : "Chargement…"}</td></tr> : l.map((x) => (
                <tr key={x.id}>
                  <td><b>{x.fournisseur}</b>{x.numero ? <span className="cf-sub">n° {x.numero}</span> : null}<span className="cf-sub">{x.libelle}</span>{x.note ? <span className="cf-sub">{x.note}</span> : null}</td>
                  <td className="nw">{dateFr(x.date)}</td>
                  <td>{cats[x.categorie] || x.categorie}</td>
                  <td className="n">{euro(x.montant)}</td>
                  <td>{x.fichier ? <button type="button" className="fq-btn sm" onClick={() => ouvrir(x)} disabled={busy === "voir:" + x.id}>{x.fichier.type === "application/pdf" ? "PDF" : "Photo"} · voir</button> : (
                    <button type="button" className="fq-btn sm pri" onClick={() => { cibleRef.current = { fournisseur: x.fournisseur, date: x.date, montant: x.montant, categorie: x.categorie, libelle: x.libelle, numero: x.numero, cible: x.achatId ? { type: "achat", id: x.achatId } : { type: "depense", id: x.depenseId } }; pdf.current?.click(); }}>Ajouter la facture</button>
                  )}</td>
                  <td>
                    <span className={`fq-pill ${ETATS[x.etat]?.[1] || ""}`}>{ETATS[x.etat]?.[0] || x.etat}</span>
                    {x.fichier ? <button type="button" className="cf-lnk" onClick={() => setEdit({ id: x.id, fournisseur: x.fournisseur, date: x.date, montant: String(x.montant).replace(".", ","), categorie: x.categorie, libelle: x.libelle || "", numero: x.numero || "", aVerifier: x.etat === "verifier" })}>corriger</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
      <p className="cf-note">Les factures ne se suppriment pas (obligation de les garder 10 ans) ; « corriger » change seulement les informations, jamais le fichier.</p>

      {edit ? (
        <div className="pc-voir" role="dialog" aria-label="Corriger la facture" onClick={() => setEdit(null)}>
          <div className="cf-form" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", maxWidth: 560 }}>
            <b>Corriger la facture</b>
            <div className="cf-grid">
              <label>Fournisseur<input value={edit.fournisseur} onChange={(e) => setEdit({ ...edit, fournisseur: e.target.value })} /></label>
              <label>Date<input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></label>
              <label>Montant TTC (€)<input inputMode="decimal" value={edit.montant} onChange={(e) => setEdit({ ...edit, montant: e.target.value })} /></label>
              <label>Catégorie<select value={edit.categorie} onChange={(e) => setEdit({ ...edit, categorie: e.target.value })}>{Object.entries(cats).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label>N° de facture<input value={edit.numero} onChange={(e) => setEdit({ ...edit, numero: e.target.value })} /></label>
              <label className="l2">Ce qui a été acheté<input value={edit.libelle} onChange={(e) => setEdit({ ...edit, libelle: e.target.value })} /></label>
              <label className="l2" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" checked={edit.aVerifier} onChange={(e) => setEdit({ ...edit, aVerifier: e.target.checked })} style={{ width: "auto" }} /> À vérifier</label>
            </div>
            <div className="cf-acts"><button type="button" className="fq-btn pri" onClick={enregistrerEdit} disabled={busy === "edit"}>Enregistrer</button><button type="button" className="fq-btn ghost" onClick={() => setEdit(null)}>Annuler</button></div>
          </div>
        </div>
      ) : null}

      {voir ? (
        <div className="pc-voir" role="dialog" aria-label="Facture" onClick={() => { URL.revokeObjectURL(voir.url); setVoir(null); }}>
          <figure onClick={(e) => e.stopPropagation()}>
            {voir.type.startsWith("image/") ? <img src={voir.url} alt="" /> : <iframe src={voir.url} title="Facture" style={{ width: "min(80vw,520px)", height: "62vh", border: 0 }} />}
            <figcaption>{voir.x.fournisseur} · {dateFr(voir.x.date)} · {euro(voir.x.montant)}<br /><span className="mono">empreinte sha256 {voir.sha}</span></figcaption>
            <div className="pc-voir-a">
              <a className="fq-btn sm" href={voir.url} download={voir.nom}>Télécharger l&apos;original</a>
              <button type="button" className="fq-btn sm" onClick={() => { URL.revokeObjectURL(voir.url); setVoir(null); }}>✕ Fermer</button>
            </div>
          </figure>
        </div>
      ) : null}
    </section>
  );
}
