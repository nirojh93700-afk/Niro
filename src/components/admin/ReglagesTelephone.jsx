"use client";
// Réglages › Notifications : bloc « Sur le téléphone » (15/11/2026, maquette Niv Admin).
// Ce qui sonne, heures calmes (sauf litige), chiffre sur l'icône, écran allumé (cet appareil).
import { useEffect, useState } from "react";
import AlertesTelephone from "@/components/admin/AlertesTelephone";
import { TELEPHONE_DEFAUT } from "@/lib/notifTelephone";
import { CLE_ECRAN, ecranAllumeActif } from "@/components/admin/EcranAllume";
import { toast } from "@/components/admin/AdminToast";

const CASES = [
  ["commande", "Nouvelle commande (Express en premier)"],
  ["message", "Réponse d'une cliente · réponse à valider"],
  ["litige", "Litige, contestation de paiement (carte, PayPal)"],
];

export default function ReglagesTelephone({ adminKey, telephone, onSaved }) {
  const [t, setT] = useState({ ...TELEPHONE_DEFAUT, ...(telephone || {}) });
  const [saved, setSaved] = useState(JSON.stringify({ ...TELEPHONE_DEFAUT, ...(telephone || {}) }));
  const [ecran, setEcran] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const v = { ...TELEPHONE_DEFAUT, ...(telephone || {}) }; setT(v); setSaved(JSON.stringify(v)); }, [telephone]);
  useEffect(() => { setEcran(ecranAllumeActif()); }, []);
  const modifie = JSON.stringify(t) !== saved;

  async function enregistrer() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ notifications: { telephone: t } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Enregistrement refusé.");
      setSaved(JSON.stringify(t));
      onSaved?.();
    } catch (e) { toast("Échec : " + e.message, "err"); }
    setBusy(false);
  }

  return (
    <div className="fq-card" style={{ marginTop: 12, gap: 12 }}>
      <strong style={{ fontSize: 14 }}>📱 Sur le téléphone</strong>
      <span style={{ fontSize: 13, color: "var(--ash-muted)" }}>Les notifications arrivent même quand « Niv Admin » est fermée (iPhone avec iOS 16.4 ou plus, application posée sur l&apos;écran d&apos;accueil). Les e-mails d&apos;alerte continuent comme avant.</span>
      <AlertesTelephone adminKey={adminKey} toujours />
      <div style={{ display: "grid", gap: 8 }}>
        {CASES.map(([k, l]) => (
          <label key={k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" checked={t[k] !== false} onChange={(e) => setT({ ...t, [k]: e.target.checked })} /> {l}
          </label>
        ))}
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, flexWrap: "wrap" }}>
          <input type="checkbox" checked={t.calme} onChange={(e) => setT({ ...t, calme: e.target.checked })} /> Heures calmes de
          <input type="time" value={t.calmeDe} onChange={(e) => setT({ ...t, calmeDe: e.target.value || "22:00" })} className="tel-h" /> à
          <input type="time" value={t.calmeA} onChange={(e) => setT({ ...t, calmeA: e.target.value || "07:30" })} className="tel-h" />
          <span style={{ fontSize: 12.5, color: "var(--ash-muted)" }}>(un litige sonne toujours)</span>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, flexWrap: "wrap" }}>
          Chiffre sur l&apos;icône
          <select value={t.badge} onChange={(e) => setT({ ...t, badge: e.target.value })} className="tel-h">
            <option value="prep">Commandes à préparer</option>
            <option value="messages">Messages à traiter</option>
            <option value="rien">Rien</option>
          </select>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={ecran} onChange={(e) => { setEcran(e.target.checked); try { localStorage.setItem(CLE_ECRAN, e.target.checked ? "1" : "0"); } catch { /* */ } }} />
          Garder l&apos;écran allumé quand une fiche commande ou l&apos;Atelier est ouvert <span style={{ fontSize: 12.5, color: "var(--ash-muted)" }}>(cet appareil)</span>
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="fq-btn pri" onClick={enregistrer} disabled={!modifie || busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        {modifie ? <span style={{ fontSize: 12.5, color: "var(--ash-warn)" }}>Réglage modifié, pas encore enregistré.</span> : null}
      </div>
    </div>
  );
}
