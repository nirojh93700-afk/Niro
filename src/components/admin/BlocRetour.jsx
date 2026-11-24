"use client";
// Bloc « Retour » de la fiche commande (24/11/2026) : déclarer une demande de retour, la faire avancer
// (accepté → colis reçu → remboursé / échangé / refusé), noter le motif et le montant remboursé.
// Interne à Gestion : aucun e-mail, aucun remboursement Stripe (celui-ci reste dans « Plus d'actions »).
import { useEffect, useState } from "react";
import { RETOUR_ETATS, RETOUR_ETAT, RETOUR_MOTIFS, RETOUR_MOTIF } from "@/lib/retours";

const jour = (iso) => { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" }); } catch { return ""; } };

export default function BlocRetour({ order, adminKey, onChange, montrer = () => {} }) {
  const r = order?.retour || null;
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState(r?.motif || "gravure");
  const [note, setNote] = useState(r?.note || "");
  const [montant, setMontant] = useState(r?.montant != null ? String(r.montant).replace(".", ",") : "");
  const [busy, setBusy] = useState(false);
  const [confirmRetirer, setConfirmRetirer] = useState(false);
  useEffect(() => { setMotif(r?.motif || "gravure"); setNote(r?.note || ""); setMontant(r?.montant != null ? String(r.montant).replace(".", ",") : ""); }, [order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function envoyer(body, texte) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ id: order.id, action: "retour", ...body }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Échec");
      onChange?.(d.retour || null);
      montrer(texte);
      setOuvert(false); setConfirmRetirer(false);
    } catch (e) { montrer("Échec : " + e.message); }
    finally { setBusy(false); }
  }
  const sauver = (etat, texte) => envoyer({ retour: { etat: etat || r?.etat || "demande", motif, note, montant } }, texte);

  if (!r && !ouvert) {
    return (
      <div className="cb">
        <div className="fc-sub">Aucune demande de retour.</div>
        <div className="fc-row"><button type="button" className="fc-btn sm" onClick={() => setOuvert(true)}>↩ Déclarer une demande de retour</button></div>
      </div>
    );
  }

  const e = r ? RETOUR_ETAT[r.etat] : null;
  return (
    <div className="cb rt-bloc">
      {r ? (
        <>
          <div className={`rt-etat rt-${e.tone}`}><b>↩ {e.lib}</b><span>{RETOUR_MOTIF[r.motif]?.lib || "Motif ?"} · demandé le {jour(r.demandeLe)}</span></div>
          <div className="fc-sub">{e.aide}</div>
          <div className="rt-etapes" role="group" aria-label="Étape du retour">
            {RETOUR_ETATS.map((x) => <button key={x.id} type="button" disabled={busy} className={x.id === r.etat ? "on" : ""} onClick={() => x.id !== r.etat && sauver(x.id, `Retour : ${x.lib.toLowerCase()}`)}>{x.lib}</button>)}
          </div>
        </>
      ) : <div className="fc-sub"><b>Nouvelle demande de retour</b> : choisissez le motif, puis enregistrez.</div>}
      <label className="rt-l">Motif
        <select value={motif} onChange={(ev) => setMotif(ev.target.value)}>{RETOUR_MOTIFS.map((m) => <option key={m.id} value={m.id}>{m.lib}</option>)}</select>
      </label>
      <label className="rt-l">Note (ce que la cliente dit, ce qui a été décidé)
        <textarea className="fc-note" value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Ex. : gravure à l'envers, étiquette de retour envoyée le 14/11" style={{ minHeight: 56 }} />
      </label>
      <label className="rt-l">Montant remboursé (€)
        <input inputMode="decimal" value={montant} onChange={(ev) => setMontant(ev.target.value)} placeholder="vide si rien de remboursé" />
      </label>
      <div className="fc-row">
        <button type="button" className="fc-btn sm" disabled={busy} onClick={() => sauver(r ? r.etat : "demande", r ? "Retour enregistré" : "Demande de retour enregistrée")}>{r ? "Enregistrer" : "Enregistrer la demande"}</button>
        {!r ? <button type="button" className="fc-btn sm" disabled={busy} onClick={() => setOuvert(false)}>Annuler</button> : null}
        {r && !confirmRetirer ? <button type="button" className="fc-lnk" onClick={() => setConfirmRetirer(true)}>Retirer (déclaré par erreur)</button> : null}
        {r && confirmRetirer ? <span className="rt-conf">Retirer cette demande ? <button type="button" className="fc-btn sm" disabled={busy} onClick={() => envoyer({ retirer: true }, "Demande de retour retirée")}>Oui, retirer</button> <button type="button" className="fc-lnk" onClick={() => setConfirmRetirer(false)}>non</button></span> : null}
      </div>
      <div className="fc-sub">Aucun e-mail ne part d&apos;ici. Pour rembourser la cliente : « Plus d&apos;actions » → Rembourser.</div>
    </div>
  );
}
