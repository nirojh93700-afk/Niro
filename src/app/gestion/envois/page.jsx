"use client";

// Gestion → Commandes → « Envois à faire » (20/11/2026, gérant : « tu crées un autre truc… comme les commandes,
// une nouvelle catégorie, produit manquant par exemple… il faut que je sache »).
// Ce qui doit partir chez une cliente SANS nouvelle commande : produit manquant, remplacement, renvoi gratuit.
// Le stock baisse à l'ajout (sauf « déjà retiré »), il est rendu si l'envoi est supprimé.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";
import { lienSuivi, numerosSuivi, joindreSuivis } from "@/lib/suiviColis";

const jour = (t) => (t ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");
const VIDE_ADR = { nom: "", societe: "", line1: "", line2: "", cp: "", ville: "", pays: "FR", tel: "" };
const sansAccent = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const COUL = { a_envoyer: ["#fff4e0", "#c98a1b"], expedie: ["#e8f1fb", "#3b6ea8"], termine: ["#eef6ee", "#4d8a57"] };

function texteAdresse(a) {
  return [a.nom, a.societe, a.line1, a.line2, `${a.cp || ""} ${String(a.ville || "").toUpperCase()}`.trim(), a.pays && a.pays !== "FR" ? a.pays : ""].filter(Boolean).join("\n");
}

function Formulaire({ d, key_, onFait, onAnnuler }) {
  const [q, setQ] = useState("");
  const [cmd, setCmd] = useState(null);
  const [motif, setMotif] = useState("manquant");
  const [articles, setArticles] = useState([{ nom: "", stockId: "", qty: 1 }]);
  const [adr, setAdr] = useState(VIDE_ADR);
  const [client, setClient] = useState({ client: "", email: "" });
  const [note, setNote] = useState("");
  const [deja, setDeja] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const trouvees = useMemo(() => {
    const s = sansAccent(q).trim();
    if (s.length < 2) return [];
    return (d.commandes || []).filter((o) => sansAccent(`${o.ref} ${o.client} ${o.email}`).includes(s)).slice(0, 6);
  }, [q, d.commandes]);

  const choisir = (o) => {
    setCmd(o); setQ("");
    setAdr({ ...VIDE_ADR, ...o.adresse });
    setClient({ client: o.client, email: o.email });
  };
  const setArt = (i, k, v) => setArticles((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const envoyer = async () => {
    setErr("");
    if (!articles.some((a) => a.nom.trim())) { setErr("Écrivez ce qu'il faut envoyer."); return; }
    if (!adr.line1 || !adr.cp || !adr.ville) { setErr("L'adresse est incomplète (rue, code postal, ville)."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/envois", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key_ },
        body: JSON.stringify({ action: "ajouter", motif, orderId: cmd?.id || "", ref: cmd?.ref || "", client: client.client || adr.nom, email: client.email, articles, adresse: adr, note, dejaRetire: deja }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Non enregistré.");
      onFait();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const champ = (k, label, w = "1 1 180px") => (
    <label style={{ flex: w, minWidth: 0, display: "grid", gap: 3, fontSize: "0.82rem", color: "var(--ink-soft)" }}>{label}
      <input value={adr[k] || ""} onChange={(e) => setAdr((a) => ({ ...a, [k]: e.target.value }))} style={{ boxSizing: "border-box", minWidth: 0, width: "100%" }} />
    </label>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #eadfc4", borderRadius: 14, padding: 16, display: "grid", gap: 14, marginBottom: 18 }}>
      <b style={{ fontSize: "1.05rem" }}>Nouvel envoi à faire</b>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: "0.88rem" }}>1. La commande concernée (facultatif) : n° de commande, nom ou e-mail</span>
        {cmd ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span>#{cmd.ref} · {cmd.client} · {jour(cmd.at)}</span>
            <button type="button" className="btn" style={{ padding: "4px 10px" }} onClick={() => { setCmd(null); }}>Changer</button>
          </div>
        ) : (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex. 0RPVCMNW ou Saint-Auret" style={{ boxSizing: "border-box", width: "100%" }} />
            {trouvees.map((o) => (
              <button key={o.id} type="button" className="btn" style={{ justifyContent: "flex-start", textAlign: "left", padding: "6px 10px" }} onClick={() => choisir(o)}>
                #{o.ref} · {o.client} · {jour(o.at)}
              </button>
            ))}
          </>
        )}
      </div>
      <label style={{ display: "grid", gap: 4, fontSize: "0.88rem" }}>2. Pourquoi
        <select value={motif} onChange={(e) => setMotif(e.target.value)}>
          {Object.entries(d.motifs || {}).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
      </label>
      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: "0.88rem" }}>3. Ce qu&apos;il faut envoyer</span>
        {articles.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input value={a.nom} onChange={(e) => setArt(i, "nom", e.target.value)} placeholder="ex. Grand socle noir" style={{ flex: "2 1 200px", minWidth: 0, boxSizing: "border-box" }} />
            <select value={a.stockId} onChange={(e) => setArt(i, "stockId", e.target.value)} style={{ flex: "2 1 200px", minWidth: 0 }}>
              <option value="">Ne pas toucher au stock</option>
              {(d.lignes || []).map((l) => <option key={l.id} value={l.id}>{l.nom}{l.stock !== null ? ` (stock ${l.stock})` : " (non suivi)"}</option>)}
            </select>
            <input type="number" min="1" max="99" value={a.qty} onChange={(e) => setArt(i, "qty", e.target.value)} style={{ width: 64, boxSizing: "border-box" }} aria-label="Quantité" />
            {articles.length > 1 ? <button type="button" className="btn" style={{ padding: "4px 10px" }} onClick={() => setArticles((x) => x.filter((_, j) => j !== i))}>✕</button> : null}
          </div>
        ))}
        <button type="button" className="btn" style={{ justifySelf: "start", padding: "6px 12px" }} onClick={() => setArticles((x) => [...x, { nom: "", stockId: "", qty: 1 }])}>+ Un autre article</button>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.86rem" }}>
          <input type="checkbox" checked={deja} onChange={(e) => setDeja(e.target.checked)} /> Le stock est déjà retiré à la main (ne pas le retirer une 2ᵉ fois)
        </label>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: "0.88rem" }}>4. Adresse d&apos;envoi{cmd ? " (reprise de la commande, modifiable)" : ""}</span>
        {cmd?.relais ? <div className="notice" style={{ margin: 0 }}>La commande était livrée en point relais : {cmd.relais}. Mettez l&apos;adresse où envoyer cette fois.</div> : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {champ("nom", "Nom")}{champ("societe", "Société / résidence")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {champ("line1", "Adresse", "2 1 260px")}{champ("line2", "Complément")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {champ("cp", "Code postal", "1 1 100px")}{champ("ville", "Ville")}{champ("pays", "Pays (FR, BE…)", "0 1 90px")}{champ("tel", "Téléphone")}
        </div>
      </div>
      <label style={{ display: "grid", gap: 4, fontSize: "0.88rem" }}>5. Note (pour vous)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ boxSizing: "border-box", width: "100%" }} />
      </label>
      {err ? <div className="notice" style={{ margin: 0 }}>{err}</div> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-gold" disabled={busy} onClick={envoyer}>{busy ? "…" : "Ajouter l'envoi"}</button>
        <button type="button" className="btn" onClick={onAnnuler}>Annuler</button>
      </div>
    </div>
  );
}

function Carte({ e, d, key_, onMaj }) {
  const [exp, setExp] = useState(false);
  const [nums, setNums] = useState(numerosSuivi(e.tracking).length ? numerosSuivi(e.tracking) : [""]);
  const [conf, setConf] = useState(false);
  const [copie, setCopie] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const a = e.adresse || {};
  const pseudo = { shippingAddress: { postal_code: a.cp }, shippingMethod: "" };
  const [fond, bord] = COUL[e.statut] || COUL.a_envoyer;

  const action = async (body) => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/envois", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key_ }, body: JSON.stringify({ id: e.id, ...body }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Non enregistré.");
      onMaj(); setExp(false); setConf(false);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const copier = async () => {
    try { await navigator.clipboard.writeText(texteAdresse(a)); setCopie(true); setTimeout(() => setCopie(false), 1500); } catch { /* sélection manuelle */ }
  };

  return (
    <div style={{ background: "#fff", border: `1px solid #eadfc4`, borderLeft: `4px solid ${bord}`, borderRadius: 12, padding: "12px 14px", display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ background: fond, color: bord, borderRadius: 999, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 600 }}>{d.statuts?.[e.statut] || e.statut}</span>
        <span style={{ background: "#f5efe1", borderRadius: 999, padding: "2px 10px", fontSize: "0.8rem" }}>{d.motifs?.[e.motif] || e.motif}</span>
        <b style={{ overflowWrap: "anywhere" }}>{e.client || a.nom}</b>
        {e.ref ? <Link href={`/gestion/commande/${e.ref}`} style={{ fontSize: "0.86rem" }}>commande #{e.ref}</Link> : null}
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--ink-soft)" }}>ajouté le {jour(e.at)}</span>
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {(e.articles || []).map((l, i) => (
          <div key={i}>📦 <b>{l.qty} × {l.nom}</b>
            <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>{l.stockId ? (l.retire > 0 ? ` · ${l.retire} retiré du stock` : e.dejaRetire ? " · stock déjà retiré à la main" : " · stock non suivi") : e.dejaRetire ? " · stock déjà retiré à la main" : ""}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
        <pre style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap", background: "#fbf7ee", borderRadius: 8, padding: "8px 10px", flex: "1 1 220px", minWidth: 0, overflowWrap: "anywhere" }}>{texteAdresse(a)}{a.tel ? `\n☎ ${a.tel}` : ""}</pre>
        <button type="button" className="btn" style={{ padding: "6px 12px" }} onClick={copier}>{copie ? "Copiée ✓" : "Copier l'adresse"}</button>
      </div>
      {e.note ? <div style={{ fontSize: "0.88rem", background: "#fff8e6", borderRadius: 8, padding: "6px 10px", overflowWrap: "anywhere" }}>📝 {e.note}</div> : null}
      {e.tracking ? (
        <div style={{ fontSize: "0.88rem" }}>Suivi : {numerosSuivi(e.tracking).map((n) => { const l = lienSuivi(n, pseudo); return <span key={n} style={{ marginRight: 10 }}>{l ? <a href={l.url} target="_blank" rel="noreferrer">{n} ({l.nom})</a> : n}</span>; })}{e.expedieLe ? ` · expédié le ${jour(e.expedieLe)}` : ""}</div>
      ) : null}
      {exp ? (
        <div style={{ display: "grid", gap: 6, background: "#f7f3ea", borderRadius: 10, padding: 10 }}>
          <span style={{ fontSize: "0.88rem" }}>Numéro(s) de suivi (facultatif)</span>
          {nums.map((n, i) => <input key={i} value={n} onChange={(x) => setNums((v) => v.map((y, j) => (j === i ? x.target.value : y)))} style={{ boxSizing: "border-box", width: "100%" }} placeholder="ex. 87001511362839S" />)}
          <button type="button" className="btn" style={{ justifySelf: "start", padding: "4px 10px" }} onClick={() => setNums((v) => [...v, ""])}>+ Un autre colis</button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-gold" disabled={busy} onClick={() => action({ action: "maj", statut: "expedie", tracking: joindreSuivis(nums) })}>Marquer expédié</button>
            <button type="button" className="btn" onClick={() => setExp(false)}>Annuler</button>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Aucun e-mail ne part à la cliente.</span>
        </div>
      ) : null}
      {conf ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#fdecea", borderRadius: 10, padding: 10 }}>
          <span>Supprimer cet envoi ? Le stock retiré sera rendu.</span>
          <button type="button" className="btn" disabled={busy} onClick={() => action({ action: "supprimer" })}>Oui, supprimer</button>
          <button type="button" className="btn" onClick={() => setConf(false)}>Non</button>
        </div>
      ) : null}
      {err ? <div className="notice" style={{ margin: 0 }}>{err}</div> : null}
      {!exp && !conf ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {e.statut === "a_envoyer" ? <button type="button" className="btn btn-gold" onClick={() => setExp(true)}>Expédier…</button> : null}
          {e.statut === "expedie" ? <button type="button" className="btn btn-gold" disabled={busy} onClick={() => action({ action: "maj", statut: "termine" })}>Terminé (reçu)</button> : null}
          {e.orderId ? <Link className="btn" href={`/gestion/etiquettes?id=${encodeURIComponent(e.orderId)}`} title="Imprime l'adresse de la commande d'origine">🏷️ Étiquette (adresse de la commande)</Link> : null}
          {e.statut !== "a_envoyer" ? <button type="button" className="btn" disabled={busy} onClick={() => action({ action: "maj", statut: "a_envoyer" })}>Remettre « à envoyer »</button> : null}
          <button type="button" className="btn" onClick={() => setConf(true)}>Supprimer</button>
        </div>
      ) : null}
    </div>
  );
}

export default function EnvoisPage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [vue, setVue] = useState("a_envoyer");
  const [form, setForm] = useState(false);

  const charger = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/envois", { headers: { "x-admin-key": k } });
      if (!r.ok) throw new Error(r.status === 401 ? "Mot de passe de Gestion demandé : ouvrez d'abord l'accueil de Gestion." : "Chargement impossible.");
      setD(await r.json()); setErr("");
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    setKey(k); charger(k);
  }, [charger]);

  const envois = d?.envois || [];
  const nb = (s) => envois.filter((e) => e.statut === s).length;
  const liste = vue === "tout" ? envois : envois.filter((e) => e.statut === vue);

  return (
    <div className="container" style={{ padding: "28px 16px 60px", maxWidth: 980 }}>
      <PageHead eyebrow="Commandes" title="Envois à faire"
        subtitle="Produit manquant, remplacement, renvoi gratuit : ce qui doit partir chez une cliente sans nouvelle commande. Le stock baisse quand vous ajoutez l'envoi ; aucun e-mail ne part à la cliente d'ici."
        actions={<button type="button" className="btn btn-gold" onClick={() => setForm(true)}>+ Ajouter un envoi</button>}
        kpis={d ? [
          { label: "À envoyer", value: String(nb("a_envoyer")), tone: nb("a_envoyer") ? "warn" : "good" },
          { label: "Expédiés, pas encore reçus", value: String(nb("expedie")) },
          { label: "Terminés", value: String(nb("termine")) },
        ] : []} />
      {err ? <div className="notice">{err}</div> : null}
      {!d && !err ? <p>Chargement…</p> : null}
      {d && form ? <Formulaire d={d} key_={key} onFait={() => { setForm(false); setVue("a_envoyer"); charger(key); }} onAnnuler={() => setForm(false)} /> : null}
      {d ? (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 14px" }}>
            {[["a_envoyer", `À envoyer (${nb("a_envoyer")})`], ["expedie", `Expédiés (${nb("expedie")})`], ["termine", `Terminés (${nb("termine")})`], ["tout", `Tout (${envois.length})`]].map(([k, t]) => (
              <button key={k} type="button" onClick={() => setVue(k)} className={vue === k ? "btn btn-gold" : "btn"} style={{ padding: "8px 14px" }}>{t}</button>
            ))}
          </div>
          {!liste.length ? <p style={{ color: "var(--ink-soft)" }}>{vue === "a_envoyer" ? "Rien à envoyer en ce moment." : "Rien dans cette liste."}</p> : null}
          <div style={{ display: "grid", gap: 10 }}>
            {liste.map((e) => <Carte key={e.id + (e.majLe || "")} e={e} d={d} key_={key} onMaj={() => charger(key)} />)}
          </div>
        </>
      ) : null}
    </div>
  );
}
