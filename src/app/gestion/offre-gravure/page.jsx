"use client";

import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { toast } from "@/components/admin/AdminToast";

// =============================================================================
// OFFRE « GRAVURE OFFERTE » — écran de pilotage
// Le gérant active quand il veut (comme le mode vacances), met une période,
// et l'offre part par e-mail UNIQUEMENT aux inscrites qui n'ont jamais
// commandé et qui sont inscrites depuis plus de X jours. Rien sur le site.
// Le texte de l'e-mail s'adapte à l'ancienneté de l'inscription.
// =============================================================================

const euro = (n) => (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const jour = (t) => (t ? new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "—");
const sansAccent = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Connexion à l'espace client depuis l'e-mail (18/10/2026, maquette validée « applique ») :
// lue dans le journal des connexions (90 jours) par l'API, jamais une donnée nouvelle.
const connectee = (x) => x.connexion?.etat === "on";
function Connexion({ c }) {
  if (c?.etat === "on") return <><span className="ogs-chip cx-on">🔑 Connectée le {jour(c.le)}</span><small>{c.n > 1 ? `${c.n} fois` : "1 fois"} depuis l&apos;e-mail</small></>;
  if (c?.etat === "lien") return <><span className="ogs-chip cx-lien">Lien demandé le {jour(c.le)}</span><small>jamais ouvert</small></>;
  return <span className="ogs-chip off">Jamais connectée</span>;
}

// Suivi des codes (18/10/2026, maquette validée) : une ligne par cliente servie.
function SuiviCodes({ suivi }) {
  const [filtre, setFiltre] = useState("tous");
  const [q, setQ] = useState("");
  const n = (e) => suivi.filter((x) => x.etat === e).length;
  const nCx = suivi.filter(connectee).length;
  const FILTRES = [["tous", "Tous", suivi.length], ["connectee", "Connectées", nCx], ["jamais", "Jamais connectées", suivi.length - nCx], ["utilise", "Utilisés", n("utilise")], ["attente", "Pas encore", n("attente")], ["expire", "Expirés", n("expire")]];
  const garde = (x) => filtre === "tous" || (filtre === "connectee" ? connectee(x) : filtre === "jamais" ? !connectee(x) : x.etat === filtre);
  const liste = suivi.filter((x) => garde(x) && (!q || sansAccent(`${x.email} ${x.code}`).includes(sansAccent(q))));
  return (
    <div className="card og-card ogs">
      <div className="ogs-top">
        <h2>Suivi des codes</h2>
        <input className="ogs-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une adresse ou un code…" />
      </div>
      <div className="ogs-filtres">
        {FILTRES.map(([id, label, c]) => (
          <button key={id} type="button" className={`ogs-f${filtre === id ? " sel" : ""}`} onClick={() => setFiltre(id)}>{label} <b>{c}</b></button>
        ))}
      </div>
      <div>
        <div className="ogs-head"><span>Cliente</span><span>Son code</span><span>Connectée ?</span><span>Utilisé ?</span></div>
        {liste.length ? liste.map((x) => (
          <div className="ogs-row" key={x.email}>
            <div className="ogs-c"><b>{x.email}</b><small>Envoyé le {jour(x.at)} · valable jusqu&apos;au {jour(x.fin)}</small></div>
            <div className="ogs-code">{x.code || "—"}</div>
            <div className="ogs-etat"><Connexion c={x.connexion} /></div>
            <div className="ogs-etat">
              {x.etat === "utilise" ? (
                <>
                  <span className="ogs-chip on">✓ Utilisé{x.commande?.date ? ` le ${jour(x.commande.date)}` : ""}</span>
                  {x.commande ? <a className="ogs-ref" href={`/gestion?q=${encodeURIComponent(x.commande.ref || x.commande.id)}#commandes`}>Commande #{x.commande.ref || x.commande.id} →</a> : null}
                  {x.commande ? <small>{x.commande.produit}{x.commande.remise ? ` · ${euro(x.commande.remise)} offerts` : ""}</small> : null}
                </>
              ) : x.etat === "expire" ? <span className="ogs-chip off">Expiré, non utilisé</span> : <span className="ogs-chip wait">Pas encore utilisé</span>}
            </div>
          </div>
        )) : <p className="ogs-note">Aucune cliente dans ce filtre.</p>}
      </div>
      <p className="ogs-note"><b>Connectée</b> = elle a ouvert son espace client après avoir reçu l&apos;e-mail (journal des connexions, gardé 90 jours). <b>Lien demandé, jamais ouvert</b> = elle a demandé son lien de connexion sans cliquer dessus. Une visite du site sans connexion reste invisible : « Jamais connectée » ne veut pas dire « jamais venue ».</p>
      <p className="ogs-note">Un code ne marche qu&apos;avec l&apos;adresse à laquelle il a été envoyé : un code « utilisé » l&apos;a forcément été par sa destinataire. La commande s&apos;ouvre d&apos;un clic. Après sa date limite, un code jamais utilisé passe en « Expiré, non utilisé ».</p>
    </div>
  );
}

const AUJ = () => new Date().toISOString().slice(0, 10);
const DANS_UN_MOIS = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

export default function OffreGravurePage() {
  const [key, setKey] = useState("");
  const [o, setO] = useState(null);
  const [etat, setEtat] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/offre-gravure", { headers: { "x-admin-key": k } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Chargement impossible.");
      setO({
        enabled: Boolean(d.offre?.enabled),
        start: d.offre?.start || "",
        end: d.offre?.end || "",
        code: d.offre?.code || "GRAVUREOFFERTE",
        montant: d.offre?.montant ?? 3,
        minJours: d.offre?.minJours ?? 3,
        cadeau: d.offre?.cadeau !== false,
      });
      setEtat(d);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  const set = (patch) => setO((prev) => ({ ...prev, ...patch }));

  // « Activer » coché puis Enregistrer = les envois REPRENNENT TOUT DE SUITE
  // (demande du gérant, 25/09/2026 : « quand j'active, ça reprend direct »).
  // Une date de fin déjà passée est effacée (sinon la case cochée ne ferait
  // rien), puis les inscrites en attente sont servies dans la foulée — chacune
  // avec 30 jours à compter de son e-mail.
  async function save() {
    setBusy("save"); setErr("");
    try {
      const etaitActive = Boolean(etat?.offre?.enabled);
      const payload = { ...o };
      if (payload.enabled && payload.end && payload.end < AUJ()) payload.end = "";
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ gravureOfferte: payload }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Enregistrement impossible.");
      if (payload.enabled && !etaitActive && (!payload.start || payload.start <= AUJ())) {
        const rs = await fetch("/api/admin/offre-gravure", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": key },
          body: JSON.stringify({ action: "send" }),
        });
        const d = await rs.json().catch(() => ({}));
        if (rs.ok) toast(d.envoyes ? `Offre relancée — ${d.envoyes} e-mail${d.envoyes > 1 ? "s" : ""} envoyé${d.envoyes > 1 ? "s" : ""} ✓` : "Offre relancée — personne à servir pour l'instant", d.envoyes ? "ok" : "info");
        else setErr(d.error || "Offre activée, mais l'envoi immédiat a échoué : il repartira tout seul.");
      }
      await load(key);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }

  async function envoyer() {
    if (!etat?.ouverte) { setErr("Activez l'offre et enregistrez avant d'envoyer."); return; }
    const n = etat?.eligibles || 0;
    if (!n) { setErr("Aucune destinataire pour le moment."); return; }
    if (!confirm(`Envoyer l'offre à ${n} inscrite${n > 1 ? "s" : ""} qui n'${n > 1 ? "ont" : "a"} jamais commandé ?\n\nL'e-mail part à l'image du site. Chacune ne le reçoit qu'une fois.`)) return;
    setBusy("send"); setErr("");
    try {
      const r = await fetch("/api/admin/offre-gravure", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ action: "send" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Envoi impossible.");
      toast(`${d.envoyes} e-mail${d.envoyes > 1 ? "s" : ""} envoyé${d.envoyes > 1 ? "s" : ""} ✓`, d.envoyes ? "ok" : "info");
      await load(key);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }

  async function nettoyer() {
    setBusy("purge"); setErr("");
    try {
      const r = await fetch("/api/admin/offre-gravure", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ action: "purge" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Nettoyage impossible.");
      toast(d.supprimes ? `${d.supprimes} code${d.supprimes > 1 ? "s" : ""} nettoyé${d.supprimes > 1 ? "s" : ""} ✓` : "Rien à nettoyer", d.supprimes ? "ok" : "info");
      await load(key);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }

  if (!key) {
    return (
      <>
        <PageHead eyebrow="Marketing" title="Offre gravure offerte" subtitle="Ouvrez d'abord Gestion pour saisir votre mot de passe." />
        <p className="muted">Session expirée : retournez sur Gestion, puis revenez sur cette page.</p>
      </>
    );
  }
  if (!o) {
    return (
      <>
        <PageHead eyebrow="Marketing" title="Offre gravure offerte" />
        <p className="muted">Chargement…</p>
      </>
    );
  }

  const suivi = Array.isArray(etat?.suivi) ? etat.suivi : [];
  const kpis = [
    { label: "État", value: etat?.ouverte ? "Offre ouverte" : "Éteinte", tone: etat?.ouverte ? "good" : undefined },
    { label: "À servir maintenant", value: etat?.eligibles ?? 0, sub: "inscrites sans commande", tone: (etat?.eligibles || 0) > 0 ? "warn" : undefined },
    { label: `En attente (moins de ${o.minJours} j)`, value: etat?.attente ?? 0, sub: "servies plus tard, automatiquement" },
    { label: "Déjà reçu l'offre", value: etat?.deja ?? 0 },
    { label: "Se sont connectées", value: suivi.filter(connectee).length, sub: `sur ${suivi.length} depuis l'e-mail` },
    { label: "Codes utilisés", value: suivi.filter((x) => x.etat === "utilise").length, sub: `sur ${suivi.length} envoyés`, tone: suivi.some((x) => x.etat === "utilise") ? "good" : undefined },
    { label: "Gravures offertes", value: euro(suivi.reduce((t, x) => t + (x.commande?.remise || 0), 0)), sub: "remises accordées" },
    { label: "Ventes avec un code", value: euro(suivi.reduce((t, x) => t + (x.commande?.total || 0), 0)), sub: "total des commandes" },
    { label: "Codes personnels actifs", value: etat?.codesNominatifs ?? 0, sub: (etat?.codesANettoyer || 0) > 0 ? `${etat.codesANettoyer} expiré${etat.codesANettoyer > 1 ? "s" : ""} à nettoyer` : "un code par cliente, une seule fois", tone: (etat?.codesANettoyer || 0) > 0 ? "warn" : undefined },
  ];

  return (
    <>
      <PageHead
        eyebrow="Marketing"
        title="Offre gravure offerte"
        subtitle="E-mail ciblé aux inscrites qui n'ont jamais commandé. Rien n'apparaît sur le site : ni bandeau, ni encart de fiche."
        kpis={kpis}
        actions={
          <button className="btn btn-gold" onClick={envoyer} disabled={busy === "send" || !etat?.ouverte}>
            {busy === "send" ? "Envoi…" : "Envoyer maintenant"}
          </button>
        }
      />

      {err ? <p className="err">{err}</p> : null}

      <SuiviCodes suivi={suivi} />

      <div className="card og-card">
        <label className="og-switch">
          <input type="checkbox" id="og-enabled" checked={o.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          <span><b>Activer l&apos;offre</b> — cochez puis Enregistrez : les envois reprennent tout de suite. Décochée, aucun e-mail ne part (les codes déjà donnés restent valables).</span>
        </label>

        <div className="og-grid">
          <label htmlFor="og-start">Début
            <input type="date" id="og-start" value={o.start} onChange={(e) => set({ start: e.target.value })} />
          </label>
          <label htmlFor="og-end">Arrêter les envois le (facultatif, vide = tant que c&apos;est coché)
            <input type="date" id="og-end" value={o.end} onChange={(e) => set({ end: e.target.value })} />
          </label>
          <label htmlFor="og-code">Préfixe des codes (chaque cliente reçoit le sien : PRÉFIXE-XXXXX)
            <input type="text" id="og-code" value={o.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
          </label>
          <label htmlFor="og-montant">Montant de secours (€) — la vraie remise = le prix de sa 1re gravure
            <input type="number" id="og-montant" min="0" max="50" step="0.5" value={o.montant} onChange={(e) => set({ montant: e.target.value })} />
          </label>
          <label htmlFor="og-minjours">Inscrites depuis au moins (jours)
            <input type="number" id="og-minjours" min="0" max="365" value={o.minJours} onChange={(e) => set({ minJours: e.target.value })} />
          </label>
        </div>

        <label className="og-switch">
          <input type="checkbox" id="og-cadeau" checked={o.cadeau} onChange={(e) => set({ cadeau: e.target.checked })} />
          <span>Rappeler le <b>cadeau surprise</b> du colis dans l&apos;e-mail</span>
        </label>

        <div className="og-actions">
          <button className="btn btn-gold" onClick={save} disabled={busy === "save"}>
            {busy === "save" ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            className="btn btn-outline"
            onClick={() => set({ enabled: true, start: AUJ(), end: DANS_UN_MOIS() })}
            type="button"
          >
            Envoyer pendant un mois
          </button>
          <button className="btn btn-outline" onClick={nettoyer} disabled={busy === "purge"} type="button">
            {busy === "purge" ? "Nettoyage…" : "Nettoyer les codes expirés"}
          </button>
        </div>

        <p className="og-note">
          <b>Un code par cliente.</b> Chacune reçoit son propre code (<b>{o.code || "GRAVURE"}-XXXXX</b>),
          réservé à son adresse e-mail, utilisable <b>une seule fois</b>, valable <b>30 jours à compter de son e-mail</b> (c&apos;est cette date qui est écrite dans l&apos;e-mail).
          Au paiement, la remise est <b>le prix réel de la première gravure</b> de son panier
          (3 € sur un bijou, 5 € sur un cristal…), sur n&apos;importe quel produit — pas un montant fixe.
          Les codes sont créés dans Promotions au moment de l&apos;envoi ; le bouton « Nettoyer » retire
          ceux qui sont expirés ou déjà utilisés.
        </p>

        <div className="og-note">
          <b>Comment ça marche.</b> Quand l&apos;offre est ouverte, le site envoie l&apos;e-mail aux inscrites
          qui n&apos;ont jamais commandé et qui sont inscrites depuis plus de {o.minJours} jours. Les
          inscriptions plus récentes viennent de recevoir leur code de bienvenue : elles sont servies
          plus tard, toutes seules, dès qu&apos;elles atteignent {o.minJours} jours — tant que l&apos;offre est
          ouverte. Chaque inscrite ne reçoit l&apos;offre qu&apos;une seule fois.
          <br /><br />
          <b>Le texte s&apos;adapte à l&apos;ancienneté</b> : « il y a quelques jours » pour une inscription
          récente, « quelques semaines », « depuis un moment » pour les plus anciennes.
        </div>
      </div>
    </>
  );
}
