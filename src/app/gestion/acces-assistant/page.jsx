"use client";
// =============================================================================
// GESTION → RÉGLAGES → ACCÈS DE L'ASSISTANT (19/11/2026, gérant : « tu sépares en deux… moi tout ce qui est
// important, rembourser et tout ça, il n'y a que moi »). Réservé au gérant.
// · Le mot de passe de l'assistant (Claude) : le créer, le changer, le couper d'un clic.
// · Ce qu'il peut faire / ce qui reste au gérant (droitsAssistant.js).
// · Les demandes qui attendent son feu vert (codes promo, envois à plusieurs clientes) : Accepter / Refuser.
// · Ce que l'assistant a fait, et ce qui lui a été refusé.
// API : /api/admin/acces-assistant.
// =============================================================================
import { useCallback, useEffect, useState } from "react";
import PageHead from "@/components/admin/PageHead";
import { toast } from "@/components/admin/AdminToast";

const quand = (ts) => (ts ? new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—");
const court = (ts) => (ts ? new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "—");
const ligne = { display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid var(--ash-line)" };
const gauche = { flex: "1 1 220px", minWidth: 0, display: "flex", flexDirection: "column", gap: 2, overflowWrap: "anywhere" };
const sous = { fontSize: 12.5, color: "var(--ash-muted)" };
const STATUTS = { attente: "En attente", en_cours: "En cours…", acceptee: "Acceptée", refusee: "Refusée", echec: "Échec" };

function motDePasseAuHasard() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const t = new Uint32Array(28);
  crypto.getRandomValues(t);
  return "assist-" + Array.from(t, (n) => abc[n % abc.length]).join("");
}

function apercuCorps(c) {
  if (!c || typeof c !== "object") return "";
  const morceaux = [];
  for (const [k, v] of Object.entries(c)) {
    if (k === "html") continue;
    const s = typeof v === "string" ? v : JSON.stringify(v);
    morceaux.push(`${k} : ${String(s).slice(0, 90)}`);
    if (morceaux.length >= 5) break;
  }
  return morceaux.join(" · ");
}

export default function AccesAssistantPage() {
  const [key, setKey] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmer, setConfirmer] = useState("");

  const load = useCallback(async (k) => {
    try {
      const r = await fetch("/api/admin/acces-assistant", { headers: { "x-admin-key": k }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Chargement impossible.");
      setErr(""); setData(j);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    const k = typeof window !== "undefined" ? sessionStorage.getItem("niv-admin-key") || "" : "";
    if (k) { setKey(k); load(k); }
  }, [load]);

  async function action(body, message) {
    setBusy(body.action + (body.id || body.motif || ""));
    try {
      const r = await fetch("/api/admin/acces-assistant", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || j.resultat || "Refusé.");
      if (message) toast(message, "ok");
      setConfirmer("");
      load(key);
      return j;
    } catch (e) { toast(e.message, "err"); }
    finally { setBusy(""); }
  }

  if (!key) return <PageHead eyebrow="Réglages" title="Accès de l'assistant" subtitle="Ouvrez d'abord Gestion pour entrer." />;
  const attente = (data?.demandes || []).filter((d) => d.statut === "attente");
  const motifs = [...new Set(attente.map((d) => d.motif))];

  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="Accès de l'assistant"
        subtitle="L'assistant (Claude) entre dans Gestion avec son propre mot de passe. Il fait le travail courant ; tout ce qui touche à l'argent, aux suppressions et aux mots de passe reste à vous. Les codes promo et les envois à plusieurs clientes attendent votre feu vert ici."
        kpis={[
          { label: "Accès de l'assistant", value: !data ? "—" : data.actif ? "Ouvert" : "Coupé", tone: data?.actif ? "good" : undefined },
          { label: "En attente de votre feu vert", value: data ? attente.length : "—", tone: attente.length ? "warn" : undefined },
        ]} />
      {err ? <p className="fq-empty" style={{ color: "var(--ash-bad)" }}>{err}</p> : null}

      {attente.length > 0 && (
        <div className="fq-card" style={{ marginTop: 12, gap: 10, overflowX: "auto" }}>
          <strong style={{ fontSize: 14 }}>À valider ({attente.length})</strong>
          {motifs.map((m) => {
            const n = attente.filter((d) => d.motif === m).length;
            return n > 1 ? (
              <div key={m} className="ap-conf">{n} demandes « {m} ».
                {confirmer === "tout:" + m ? (<> Tout accepter ? <button type="button" className="fq-btn sm" disabled={Boolean(busy)} onClick={() => action({ action: "accepterTout", motif: m }, "Demandes acceptées.")}>Oui, tout accepter</button><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("")}>Annuler</button></>)
                  : <button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("tout:" + m)}>Tout accepter</button>}
              </div>
            ) : null;
          })}
          <div>
            {attente.map((d) => (
              <div key={d.id} style={ligne}>
                <div style={gauche}><b>{d.motif}</b><span style={sous}>{court(d.at)} · {apercuCorps(d.corps) || d.chemin}</span>{d.tropGros ? <span style={{ ...sous, color: "var(--ash-bad)" }}>Trop gros pour être rejoué : faites-le vous-même dans Gestion.</span> : null}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {confirmer === d.id ? (
                    <><span style={{ alignSelf: "center", fontSize: 13 }}>Accepter ?</span><button type="button" className="fq-btn sm" disabled={Boolean(busy) || d.tropGros} onClick={() => action({ action: "accepter", id: d.id }, "Fait.")}>Oui</button><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("")}>Non</button></>
                  ) : (<>
                    <button type="button" className="fq-btn sm" disabled={Boolean(busy) || d.tropGros} onClick={() => setConfirmer(d.id)}>Accepter</button>
                    <button type="button" className="fq-btn sm ghost" disabled={Boolean(busy)} onClick={() => action({ action: "refuser", id: d.id }, "Refusé.")}>Refuser</button>
                  </>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fq-card" style={{ marginTop: 12, gap: 10 }}>
        <strong style={{ fontSize: 14 }}>Mot de passe de l&apos;assistant</strong>
        <span style={{ fontSize: 13.5, color: "var(--ash-muted)" }}>
          {data?.actif ? `Ouvert depuis le ${quand(data.at)}.` : data?.coupeAt ? `Coupé le ${quand(data.coupeAt)}.` : "Pas encore créé."}
          {" "}Il ne remplace pas le vôtre : votre mot de passe et Face ID gardent tous les droits. Ne le tapez jamais dans la conversation avec l&apos;assistant : collez-le dans le formulaire sécurisé qu&apos;il vous ouvre.
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" value={nouveau} onChange={(e) => setNouveau(e.target.value)} placeholder="Nouveau mot de passe (16 caractères au moins)" style={{ flex: "1 1 260px", minWidth: 0, boxSizing: "border-box", padding: "9px 11px", border: "1px solid var(--ash-line)", borderRadius: 10, fontFamily: "ui-monospace, monospace" }} />
          <button type="button" className="fq-btn sm ghost" onClick={() => setNouveau(motDePasseAuHasard())}>En créer un au hasard</button>
          <button type="button" className="fq-btn sm ghost" disabled={!nouveau} onClick={() => { navigator.clipboard?.writeText(nouveau).then(() => toast("Copié.", "ok")).catch(() => toast("Sélectionnez-le et copiez-le à la main.", "info")); }}>Copier</button>
          <button type="button" className="fq-btn pri" disabled={nouveau.length < 16 || Boolean(busy)} onClick={async () => { const j = await action({ action: "definir", motDePasse: nouveau }, "Mot de passe de l'assistant enregistré."); if (j) setNouveau(""); }}>Enregistrer</button>
        </div>
        {data?.actif && (confirmer === "couper" ? (
          <div className="ap-conf">L&apos;assistant ne pourra plus entrer dans Gestion. Confirmer ? <button type="button" className="fq-btn sm" disabled={Boolean(busy)} onClick={() => action({ action: "couper" }, "Accès de l'assistant coupé.")}>Oui, couper</button><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("")}>Annuler</button></div>
        ) : <div><button type="button" className="fq-btn sm ghost" onClick={() => setConfirmer("couper")}>Couper l&apos;accès de l&apos;assistant</button></div>)}
      </div>

      <div className="fq-card" style={{ marginTop: 12, gap: 8 }}>
        <strong style={{ fontSize: 14 }}>Ce que l&apos;assistant peut faire</strong>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
          <li>✅ Lire les commandes, les messages, les clientes, les chiffres.</li>
          <li>✅ Écrire à une cliente, programmer un mail, faire un devis.</li>
          <li>✅ Changer les fiches, les prix, les stocks, l&apos;apparence et les réglages courants.</li>
          <li>⏳ Avec votre feu vert : créer ou changer un code promo, envoyer à plusieurs clientes (newsletter, Noël, cagnotte, offre gravure, retour en stock, restaurants).</li>
          <li>⛔ Réservé à vous : rembourser, annuler une commande, créditer une cagnotte, supprimer quoi que ce soit, exporter les données, changer un mot de passe ou un appareil Face ID, les clés Stripe / PayPal / Boxtal / Gmail / Instagram, régler cet accès.</li>
        </ul>
      </div>

      <div className="fq-card" style={{ marginTop: 12, overflowX: "auto" }}>
        <strong style={{ fontSize: 14 }}>Ce que l&apos;assistant a fait</strong>
        {(data?.faits || []).length === 0 ? <p className="fq-empty" style={{ margin: 0 }}>Rien pour l&apos;instant.</p> : (
          <div>{data.faits.slice(0, 40).map((f, i) => <div key={i} style={ligne}><div style={gauche}><b>{f.chemin.replace("/api/admin/", "")}</b>{f.action ? <span style={sous}>{f.action}</span> : null}</div><span style={sous}>{court(f.at)}</span></div>)}</div>
        )}
        <p style={{ fontSize: 12.5, color: "var(--ash-muted)", margin: 0 }}>Le détail (avant → après) est dans Réglages › Journal d&apos;activité, marqué « assistant ».</p>
      </div>

      <div className="fq-card" style={{ marginTop: 12, overflowX: "auto" }}>
        <strong style={{ fontSize: 14 }}>Refusé à l&apos;assistant</strong>
        {(data?.refus || []).length === 0 ? <p className="fq-empty" style={{ margin: 0 }}>Aucun refus.</p> : (
          <div>{data.refus.slice(0, 30).map((f, i) => <div key={i} style={ligne}><div style={gauche}><b>{f.motif}</b><span style={sous}>{f.chemin.replace("/api/admin/", "")}</span></div><span style={sous}>{court(f.at)}</span></div>)}</div>
        )}
      </div>

      {(data?.demandes || []).some((d) => d.statut !== "attente") && (
        <div className="fq-card" style={{ marginTop: 12, overflowX: "auto" }}>
          <strong style={{ fontSize: 14 }}>Demandes déjà traitées</strong>
          <div>{data.demandes.filter((d) => d.statut !== "attente").slice(0, 30).map((d) => <div key={d.id} style={ligne}><div style={gauche}><b>{d.motif}</b><span style={sous}>{apercuCorps(d.corps)}</span></div><span style={sous}>{STATUTS[d.statut] || d.statut} · {court(d.decideAt)}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
