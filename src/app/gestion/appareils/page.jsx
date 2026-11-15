"use client";
// =============================================================================
// GESTION → RÉGLAGES → APPAREILS CONNECTÉS (15/11/2026, maquette « Niv Admin »)
// Activer Face ID sur ce téléphone, voir les appareils qui entrent avec Face ID, en retirer un, tout déconnecter.
// API : /api/admin/appareils. Le mot de passe reste valable en secours ; le changer déconnecte tous les appareils.
// =============================================================================
import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { toast } from "@/components/admin/AdminToast";
import { activerFaceId, faceIdPossible, faceIdActive, oublierFaceId, nomFaceId } from "@/lib/faceIdClient";

const quand = (ts) => (ts ? new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—");

export default function AppareilsPage() {
  const [key, setKey] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [possible, setPossible] = useState(null);
  const [busy, setBusy] = useState("");
  const [confirmer, setConfirmer] = useState("");
  const [nom, setNom] = useState("Face ID");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/appareils", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setData(j);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
    faceIdPossible().then(setPossible);
    setNom(nomFaceId());
  }, [load]);

  async function activer() {
    setBusy("act");
    try {
      const k = await activerFaceId(key);
      if (k) { sessionStorage.setItem("niv-admin-key", k); setKey(k); }
      toast(`${nom} activé sur cet appareil.`, "ok");
      load(k || key);
    } catch (e) { toast(e.message, "err"); }
    setBusy("");
  }
  async function action(body) {
    setBusy(body.action + (body.id || ""));
    try {
      const r = await fetch("/api/admin/appareils", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Refusé.");
      const cetAppareil = body.action === "tout" || (data?.devices || []).some((d) => d.id === body.id && d.cet);
      if (cetAppareil) oublierFaceId();
      if (cetAppareil && key.startsWith("nvs_")) { sessionStorage.removeItem("niv-admin-key"); window.location.href = "/gestion"; return; }
      setConfirmer("");
      load(key);
    } catch (e) { toast(e.message, "err"); }
    setBusy("");
  }

  if (!key) return <PageHead eyebrow="Réglages" title="Appareils connectés" subtitle="Ouvrez d'abord Gestion pour entrer." />;
  const devs = data?.devices || [];
  const ici = devs.find((d) => d.cet);
  const actifIci = ici || faceIdActive();

  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="Appareils connectés"
        subtitle={`Vous tapez le mot de passe une seule fois sur le téléphone, puis « Activer ${nom} ». Ensuite : vous ouvrez Niv Admin, vous touchez le bouton, et vous êtes dans Gestion. Le mot de passe reste en secours ; le changer déconnecte tous les appareils.`}
        kpis={[
          { label: "Appareils avec Face ID", value: data ? devs.length : "—" },
          { label: "Cet appareil", value: actifIci ? "Face ID activé" : possible === false ? "Pas de Face ID" : "Mot de passe", tone: actifIci ? "good" : undefined },
        ]} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}

      {!actifIci && (
        <div className="fq-card" style={{ marginTop: 12, gap: 10 }}>
          <strong>Entrer avec {nom} sur cet appareil</strong>
          {possible === false ? (
            <span style={{ fontSize: 13.5, color: "var(--ash-muted)" }}>Cet appareil ou ce navigateur ne propose pas Face ID / empreinte. Sur iPhone : ouvrez « Niv Admin » depuis l&apos;écran d&apos;accueil (ou Safari) puis revenez ici.</span>
          ) : (
            <>
              <span style={{ fontSize: 13.5, color: "var(--ash-muted)" }}>Le téléphone vous demande {nom} une fois pour créer la clé. Elle reste sur ce téléphone ; le site ne garde jamais votre visage ni votre empreinte.</span>
              <div><button type="button" className="fq-btn pri" onClick={activer} disabled={busy === "act" || possible === null}>{busy === "act" ? "Activation…" : `Activer ${nom}`}</button></div>
            </>
          )}
        </div>
      )}

      <div className="fq-card" style={{ marginTop: 12, overflowX: "auto" }}>
        <strong style={{ fontSize: 14 }}>Appareils qui entrent avec Face ID</strong>
        {devs.length === 0 ? <p className="fq-empty" style={{ margin: 0 }}>Aucun pour l&apos;instant.</p> : (
          <table className="ap-table"><thead><tr><th>Appareil</th><th>Dernière ouverture</th><th></th></tr></thead><tbody>
            {devs.map((d) => (
              <tr key={d.id}>
                <td><b>{d.nom}</b>{d.cet ? <span className="ap-moi">cet appareil</span> : null}<span className="ap-sub">Face ID activé le {quand(d.at)}</span></td>
                <td className="n">{quand(d.lastAt)}</td>
                <td className="n">{confirmer === d.id ? (
                  <span className="ap-conf">Retirer ? <button type="button" className="fq-btn sm" onClick={() => action({ action: "retirer", id: d.id })} disabled={Boolean(busy)}>Oui</button><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("")}>Non</button></span>
                ) : <button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer(d.id)}>Retirer</button>}</td>
              </tr>
            ))}
          </tbody></table>
        )}
        {devs.length > 0 && (confirmer === "tout" ? (
          <div className="ap-conf">Tous les appareils devront ressaisir le mot de passe. Confirmer ? <button type="button" className="fq-btn sm" onClick={() => action({ action: "tout" })} disabled={Boolean(busy)}>Oui, tout déconnecter</button><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("")}>Annuler</button></div>
        ) : <div><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("tout")}>Déconnecter tous les appareils</button></div>)}
        <p style={{ fontSize: 12.5, color: "var(--ash-muted)", margin: 0 }}>Un téléphone perdu : « Retirer », il ne peut plus entrer avec Face ID.</p>
      </div>

      <div className="fq-card" style={{ marginTop: 12, overflowX: "auto" }}>
        <strong style={{ fontSize: 14 }}>Entrées par mot de passe</strong>
        {(data?.vus || []).length === 0 ? <p className="fq-empty" style={{ margin: 0 }}>Aucune notée depuis le 15/11/2026.</p> : (
          <table className="ap-table"><tbody>{data.vus.map((v, i) => <tr key={i}><td><b>{v.nom}</b><span className="ap-sub">Mot de passe</span></td><td className="n">{quand(v.at)}</td></tr>)}</tbody></table>
        )}
        <p style={{ fontSize: 12.5, color: "var(--ash-muted)", margin: 0 }}>Pour déconnecter un appareil entré par mot de passe : changez le mot de passe (Réglages › Boutique).</p>
      </div>
    </div>
  );
}
