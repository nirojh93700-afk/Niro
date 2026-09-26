"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import MailBody from "@/components/admin/MailBody";
import { PROSPECT_SUJET, messageProspect, TARIFS_PRO, TARIFS_PRO_NOTE } from "@/lib/prospects";

// =============================================================================
// GESTION → CLIENTS → RESTAURANTS & BARS (prospection B2B, 26/09/2026)
// Les établissements démarchés, SÉPARÉS des clientes. Leurs réponses (e-mail ou
// bouton « Répondre ») arrivent ici toutes seules, avec une pastille « non lu ».
// Rien ne part d'ici : « Écrire » ouvre Messages clients, message pré-rempli.
// =============================================================================

const FILTRES = [
  { id: "tous", label: "Tous" },
  { id: "nonlu", label: "Réponses non lues" },
  { id: "repondu", label: "Ont répondu" },
  { id: "a_contacter", label: "À contacter" },
  { id: "envoye", label: "Sans réponse" },
  { id: "invalide", label: "Adresses mortes" },
  { id: "stop", label: "STOP" },
];

const euro = (n) => n.toFixed(2).replace(".", ",") + " €";

function quand(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

export default function RestaurantsAdminPage() {
  const [key, setKey] = useState("");
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [q, setQ] = useState("");
  const [texte, setTexte] = useState("");
  const [fil, setFil] = useState({}); // email → messages du dossier (ouvert)
  const [busy, setBusy] = useState(false);
  const [envoi, setEnvoi] = useState(null); // { fait, echecs } pendant l'envoi groupé

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/prospects", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setD(j); setErr("");
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  async function post(payload, okMsg) {
    setBusy(true); setInfo("");
    try {
      const r = await fetch("/api/admin/prospects", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Échec.");
      if (okMsg) setInfo(typeof okMsg === "function" ? okMsg(j) : okMsg);
      await load(key);
      return j;
    } catch (e) { setInfo(e.message); return null; }
    finally { setBusy(false); }
  }

  async function ouvrirFil(email) {
    if (fil[email]) { setFil((f) => { const n = { ...f }; delete n[email]; return n; }); return; }
    try {
      const r = await fetch("/api/admin/prospects?email=" + encodeURIComponent(email), { headers: { "x-admin-key": key } });
      const j = await r.json();
      setFil((f) => ({ ...f, [email]: j.messages || [] }));
    } catch { setFil((f) => ({ ...f, [email]: [] })); }
    const row = d?.rows.find((x) => x.email === email);
    if (row?.nonLu) post({ action: "update", email, nonLu: false });
  }

  // Envoi groupé : n'envoie qu'aux établissements « à contacter » ET « vérifiée ».
  // Boucle l'action tant qu'il en reste (ENVOI_LOT par appel côté serveur),
  // avec un décompte affiché — c'est le SEUL geste qui envoie réellement.
  async function envoyerTous() {
    const prets = (d?.rows || []).filter((r) => r.statut === "a_contacter" && r.verifie);
    if (!prets.length) { setInfo("Aucun établissement prêt (vérifié et à contacter)."); return; }
    if (!confirm(`Envoyer le message à ${prets.length} établissement(s) vérifié(s) ? Impossible à annuler une fois parti.`)) return;
    setEnvoi({ fait: 0, echecs: 0 });
    let fait = 0, echecsTotal = 0, tours = 0;
    while (tours++ < 40) { // garde-fou : jamais une boucle infinie
      const j = await post({ action: "envoyer-tous" });
      if (!j) break; // erreur réseau déjà affichée par post()
      fait += (j.envoyes || []).length;
      echecsTotal += (j.echecs || []).length;
      setEnvoi({ fait, echecs: echecsTotal });
      if (!j.restantes || ((j.envoyes || []).length === 0 && (j.echecs || []).length === 0)) break;
    }
    setInfo(`Envoi terminé : ${fait} e-mail(s) parti(s)${echecsTotal ? `, ${echecsTotal} échec(s)` : ""}.`);
    setEnvoi(null);
  }

  const lignes = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (d?.rows || []).filter((r) => {
      if (filtre === "nonlu" && !r.nonLu) return false;
      if (["repondu", "a_contacter", "envoye", "invalide", "stop"].includes(filtre) && r.statut !== filtre) return false;
      if (t && !`${r.name} ${r.ville} ${r.email} ${r.type}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [d, filtre, q]);

  if (!key) {
    return <PageHead eyebrow="Clients" title="🍸 Restaurants & bars" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />;
  }

  const k = d?.kpis || {};
  const ecrire = (r) => `/gestion/messages?${new URLSearchParams({ to: r.email, name: r.name, subject: PROSPECT_SUJET, body: messageProspect(r.name, { type: r.type, ville: r.ville }) }).toString()}#envoyer`;

  return (
    <>
      <PageHead
        eyebrow="Clients"
        title="🍸 Restaurants & bars"
        subtitle="Les établissements démarchés, séparés des clientes. Leurs réponses arrivent ici toutes seules. Rien ne part de cet écran : « Écrire » ouvre Messages clients avec le message prêt, à relire avant d'envoyer."
        kpis={[
          { label: "Établissements", value: k.total ?? "—", sub: `${k.aVerifier ?? 0} adresse(s) à vérifier`, tone: k.aVerifier ? "warn" : undefined },
          { label: "E-mail envoyé", value: k.envoyes ?? "—", sub: "au moins une fois" },
          { label: "Ont répondu", value: k.repondu ?? "—", sub: `${k.nonLus ?? 0} non lue(s)`, tone: k.nonLus ? "alert" : (k.repondu ? "good" : undefined) },
          { label: "Adresses mortes", value: k.invalides ?? "—", sub: "e-mail rebondi", tone: k.invalides ? "warn" : undefined },
          { label: "STOP", value: k.stop ?? "—", sub: "ne plus jamais écrire", tone: k.stop ? "bad" : undefined },
        ]}
      />

      {err ? <p className="fv-err">{err}</p> : null}
      {info ? <p className="pr-info">{info}</p> : null}

      {d ? (() => {
        const prets = d.rows.filter((r) => r.statut === "a_contacter" && r.verifie).length;
        return (
          <div className="pr-box pr-envoi">
            <strong>{prets}</strong> établissement(s) vérifié(s), prêt(s) à recevoir le message.
            {envoi ? (
              <p className="pr-small" style={{ margin: "8px 0 0" }}>Envoi en cours… {envoi.fait} parti(s){envoi.echecs ? `, ${envoi.echecs} échec(s)` : ""}.</p>
            ) : (
              <button className="pr-btn" style={{ marginLeft: 14 }} disabled={busy || !prets} onClick={envoyerTous}>
                ✉ Envoyer à tous les établissements prêts ({prets})
              </button>
            )}
          </div>
        );
      })() : null}

      <details className="pr-box">
        <summary>💶 Tarifs professionnels — à envoyer seulement s'ils les demandent</summary>
        <table className="pr-tarifs">
          <thead><tr><th>Verre</th><th>Dès 12 verres</th><th>Dès 24 verres</th></tr></thead>
          <tbody>{TARIFS_PRO.map((t) => <tr key={t.verre}><td>{t.verre}</td><td>{euro(t.des12)}</td><td>{euro(t.des24)}</td></tr>)}</tbody>
        </table>
        <p className="pr-small">{TARIFS_PRO_NOTE} Une commande pro se fait par Devis &amp; factures.</p>
      </details>

      <details className="pr-box" open={d && d.rows.length === 0}>
        <summary>➕ Ajouter des établissements</summary>
        <p className="pr-small">
          Le lot 1 (30 bars et restaurants dans 10 villes) est prêt. Ces adresses viennent de résultats de recherche :
          ouvrez le lien « source » de chacune et cochez « vérifiée » avant d'écrire.
        </p>
        <button className="pr-btn" disabled={busy} onClick={() => post({ action: "lot1" }, (j) => `${j.ajoutes} établissement(s) ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`)}>Importer le lot 1 (30 adresses)</button>
        <button className="pr-btn" style={{ marginLeft: 10 }} disabled={busy} onClick={() => post({ action: "lot2" }, (j) => `${j.ajoutes} établissement(s) ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`)}>Importer le lot 2 (92 adresses)</button>
        <button className="pr-btn" style={{ marginLeft: 10 }} disabled={busy} onClick={() => post({ action: "lot3" }, (j) => `${j.ajoutes} établissement(s) ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`)}>Importer le lot 3 (85 adresses)</button>
        <button className="pr-btn" style={{ marginLeft: 10 }} disabled={busy} onClick={() => post({ action: "lot4" }, (j) => `${j.ajoutes} établissement(s) ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`)}>Importer le lot 4 (38 adresses)</button>
        <button className="pr-btn" style={{ marginLeft: 10 }} disabled={busy} onClick={() => post({ action: "lot5" }, (j) => `${j.ajoutes} établissement(s) ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`)}>Importer le lot 5 (52 adresses)</button>
        <button className="pr-btn" style={{ marginLeft: 10 }} disabled={busy} onClick={() => post({ action: "lot6" }, (j) => `${j.ajoutes} établissement(s) ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`)}>Importer le lot 6 — petites villes (39 adresses)</button>
        <p className="pr-small" style={{ marginTop: 14 }}>Ou collez une liste depuis un tableur (une ligne par établissement : ville ; établissement ; type ; e-mail ; source).</p>
        <textarea className="pr-ta" rows={4} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={"ville;etablissement;type;email;source\nLyon;Mon Bar;Bar à cocktails;contact@monbar.fr;https://monbar.fr/contact"} />
        <button className="pr-btn" disabled={busy || !texte.trim()} onClick={async () => { const j = await post({ action: "import", texte }, (j) => `${j.lus} ligne(s) lue(s) : ${j.ajoutes} ajouté(s)${j.deja ? `, ${j.deja} déjà présent(s)` : ""}.`); if (j) setTexte(""); }}>Ajouter la liste</button>
      </details>

      <div className="pr-bar">
        <div className="pr-chips">
          {FILTRES.map((f) => (
            <button key={f.id} className={`pr-chip ${filtre === f.id ? "on" : ""}`} onClick={() => setFiltre(f.id)}>
              {f.label}{f.id === "nonlu" && k.nonLus ? ` (${k.nonLus})` : ""}
            </button>
          ))}
        </div>
        <input className="pr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, une ville…" />
      </div>

      {!d && !err ? <p>Chargement…</p> : null}
      {d && lignes.length === 0 ? <p className="fv-vide">{d.rows.length ? "Aucun établissement dans ce filtre." : "Aucun établissement pour l'instant — importez le lot 1 ci-dessus."}</p> : null}

      <div className="pr-list">
        {lignes.map((r) => {
          const derniere = r.reponses[r.reponses.length - 1];
          return (
            <div key={r.email} className={`pr-card ${r.nonLu ? "pr-new" : ""} ${r.statut === "stop" ? "pr-stop" : ""}`}>
              <div className="pr-top">
                <div className="pr-name">
                  <strong>{r.name || r.email}</strong>
                  <small>{[r.ville, r.type].filter(Boolean).join(" · ")}</small>
                </div>
                <div className="pr-tags">
                  {r.nonLu ? <span className="pr-tag pr-t-new">Nouvelle réponse</span> : null}
                  <span className={`pr-tag pr-t-${r.statut}`}>{d.statuts[r.statut] || r.statut}</span>
                  {!r.verifie && r.statut === "a_contacter" ? <span className="pr-tag pr-t-verif">Adresse à vérifier</span> : null}
                </div>
              </div>
              <div className="pr-mail">
                {r.email}
                {r.source ? <> · <a href={r.source} target="_blank" rel="noopener noreferrer">source</a></> : null}
                {r.envoyeAt ? <> · écrit le {quand(r.envoyeAt)}{r.nbEnvois > 1 ? ` (${r.nbEnvois} fois)` : ""}</> : null}
                {r.reponduAt ? <> · réponse le {quand(r.reponduAt)}</> : null}
              </div>
              {derniere ? (
                <div className="pr-reply">
                  <span>{derniere.bounce ? "⚠️ E-mail rebondi — adresse invalide :" : `Dernière réponse${derniere.from && derniere.from !== r.email ? ` (de ${derniere.from})` : ""} :`}</span>
                  <MailBody text={derniere.extrait} />
                </div>
              ) : null}
              {fil[r.email] ? (
                <div className="pr-fil">
                  {fil[r.email].length === 0 ? <p className="pr-small">Aucun message rangé pour l'instant.</p> : fil[r.email].map((m) => (
                    <div key={m.id} className={`pr-msg ${m.from === "nous" ? "pr-nous" : ""}`}>
                      <small>{m.from === "nous" ? "Nous" : (r.name || "L'établissement")} · {quand(m.at)}{m.subject ? ` · ${m.subject}` : ""}</small>
                      <MailBody text={m.text} />
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="pr-actions">
                {r.statut === "stop"
                  ? <span className="pr-small">Désinscrit : le site refusera tout envoi à cette adresse.</span>
                  : <a className={`pr-btn ${!r.verifie ? "pr-btn-soft" : ""}`} href={ecrire(r)}>✉ Écrire</a>}
                <button className="pr-link" onClick={() => ouvrirFil(r.email)}>{fil[r.email] ? "Masquer les échanges" : "Voir les échanges"}</button>
                {r.statut !== "stop" ? (
                  <label className="pr-check"><input type="checkbox" checked={r.verifie} onChange={(e) => post({ action: "update", email: r.email, verifie: e.target.checked })} /> adresse vérifiée</label>
                ) : null}
                {r.nonLu ? <button className="pr-link" onClick={() => post({ action: "update", email: r.email, nonLu: false })}>Marquer comme lu</button> : null}
                <select className="pr-sel" value={r.statut} onChange={(e) => post({ action: "update", email: r.email, statut: e.target.value })}>
                  {Object.entries(d.statuts).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                </select>
                <button className="pr-link pr-del" onClick={() => { if (confirm(`Retirer ${r.name || r.email} de la liste ?`)) post({ action: "delete", email: r.email }); }}>Retirer</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="pr-small" style={{ marginTop: 14 }}>
        Une réponse est reconnue toute seule : même adresse, même fil d'e-mail (si le patron répond depuis une autre boîte)
        ou même nom de domaine professionnel. Si elle commence par « STOP » ou demande à être désinscrite, l'établissement
        passe en « Ne plus contacter » et plus aucun envoi n'est possible.
      </p>
    </>
  );
}
