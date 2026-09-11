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

  async function save() {
    setBusy("save"); setErr("");
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ gravureOfferte: o }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Enregistrement impossible.");
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

  const kpis = [
    { label: "État", value: etat?.ouverte ? "Offre ouverte" : "Éteinte", tone: etat?.ouverte ? "good" : undefined },
    { label: "À servir maintenant", value: etat?.eligibles ?? 0, sub: "inscrites sans commande", tone: (etat?.eligibles || 0) > 0 ? "warn" : undefined },
    { label: `En attente (moins de ${o.minJours} j)`, value: etat?.attente ?? 0, sub: "servies plus tard, automatiquement" },
    { label: "Déjà reçu l'offre", value: etat?.deja ?? 0 },
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

      <div className="card og-card">
        <label className="og-switch">
          <input type="checkbox" id="og-enabled" checked={o.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          <span><b>Activer l&apos;offre</b> — éteinte, aucun e-mail ne part jamais.</span>
        </label>

        <div className="og-grid">
          <label htmlFor="og-start">Début
            <input type="date" id="og-start" value={o.start} onChange={(e) => set({ start: e.target.value })} />
          </label>
          <label htmlFor="og-end">Fin (annoncée dans l&apos;e-mail)
            <input type="date" id="og-end" value={o.end} onChange={(e) => set({ end: e.target.value })} />
          </label>
          <label htmlFor="og-code">Code promo
            <input type="text" id="og-code" value={o.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
          </label>
          <label htmlFor="og-montant">Remise du code (€)
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
            Ouvrir pour un mois
          </button>
        </div>

        {o.code && etat && !etat.codeExiste ? (
          <p className="og-note warn">
            Le code <b>{o.code}</b> n&apos;existe pas encore dans Promotions. Il sera créé automatiquement
            au premier envoi, en remise de <b>{o.montant} €</b>. Si vous voulez le limiter à certaines
            pièces, créez-le vous-même dans Promotions avant d&apos;envoyer.
          </p>
        ) : null}

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
