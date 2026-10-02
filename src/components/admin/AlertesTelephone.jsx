"use client";

// Carte « 🔔 Alertes sur ce téléphone » du tableau de bord (02/10/2026).
// Une fois activée sur un appareil, chaque nouvelle commande et chaque réponse de
// cliente y apparaît en notification, même l'appli fermée.
// iPhone : les notifications ne marchent QUE depuis l'appli posée sur l'écran d'accueil
// (Partager → « Sur l'écran d'accueil »), c'est une règle d'Apple — on l'explique.
import { useEffect, useState } from "react";

function versCle(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function nomAppareil() {
  const ua = navigator.userAgent || "";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "PC Windows";
  return "Appareil";
}

export default function AlertesTelephone({ adminKey, toujours = false }) {
  const [etat, setEtat] = useState("chargement"); // chargement | indispo | ios | off | on | refus
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [masque, setMasque] = useState(false);

  useEffect(() => {
    (async () => {
      try { if (localStorage.getItem("niv-alertes-masque") === "1") setMasque(true); } catch { /* ignore */ }
      const ios = /iPhone|iPad/.test(navigator.userAgent || "");
      const appli = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setEtat(ios && !appli ? "ios" : "indispo"); return;
      }
      if (Notification.permission === "denied") { setEtat("refus"); return; }
      try {
        const reg = await navigator.serviceWorker.register("/sw-admin.js", { scope: "/gestion" });
        const sub = await reg.pushManager.getSubscription();
        setEtat(sub ? "on" : "off");
      } catch { setEtat("indispo"); }
    })();
  }, []);

  async function activer() {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setEtat(perm === "denied" ? "refus" : "off"); return; }
      const r = await fetch("/api/admin/push", { headers: { "x-admin-key": adminKey } });
      const { publicKey } = await r.json();
      const reg = await navigator.serviceWorker.register("/sw-admin.js", { scope: "/gestion" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: versCle(publicKey) });
      const s = await fetch("/api/admin/push", {
        method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "subscribe", subscription: sub.toJSON(), appareil: nomAppareil() }),
      });
      if (!s.ok) throw new Error();
      setEtat("on");
      await tester();
    } catch { setMsg("L'activation n'a pas abouti. Réessayez dans un instant."); }
    finally { setBusy(false); }
  }

  async function tester() {
    setMsg("");
    try {
      const r = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ action: "test" }) });
      const d = await r.json();
      setMsg(d.envoyees ? "Alerte d'essai envoyée ✓ — elle doit apparaître dans quelques secondes." : "Aucun appareil n'a reçu l'alerte d'essai.");
    } catch { setMsg("Envoi de l'essai impossible."); }
  }

  async function desactiver() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/gestion");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ action: "unsubscribe", endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setEtat("off"); setMsg("");
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  if (etat === "chargement" || etat === "indispo") return null;
  if (masque && etat !== "on" && !toujours) return null;

  return (
    <div className={`al-carte${etat === "on" ? " on" : ""}`}>
      <span className="al-ico" aria-hidden>🔔</span>
      <div className="al-txt">
        {etat === "on" && <><b>Alertes activées sur cet appareil</b><small>Chaque nouvelle commande et chaque réponse de cliente arrive ici en notification.</small></>}
        {etat === "off" && <><b>Recevoir les alertes sur ce téléphone</b><small>Nouvelle commande, réponse d&apos;une cliente : une notification, même l&apos;appli fermée.</small></>}
        {etat === "ios" && <><b>Alertes sur iPhone : posez d&apos;abord l&apos;appli</b><small>Dans Safari : bouton Partager → « Sur l&apos;écran d&apos;accueil », puis ouvrez « Niv Admin » et revenez ici (règle d&apos;Apple).</small></>}
        {etat === "refus" && <><b>Notifications bloquées sur cet appareil</b><small>Autorisez-les dans les réglages du navigateur pour ce site, puis rechargez la page.</small></>}
        {msg ? <small className="al-msg">{msg}</small> : null}
      </div>
      <div className="al-acts">
        {etat === "off" && <button type="button" className="dq-go" onClick={activer} disabled={busy}>{busy ? "…" : "Activer"}</button>}
        {etat === "on" && <><button type="button" className="dq-mini" onClick={tester} disabled={busy}>Tester</button><button type="button" className="dq-mini" onClick={desactiver} disabled={busy}>Désactiver</button></>}
        {etat !== "on" && !toujours && <button type="button" className="dq-mini" onClick={() => { setMasque(true); try { localStorage.setItem("niv-alertes-masque", "1"); } catch { /* ignore */ } }} aria-label="Masquer">Plus tard</button>}
      </div>
    </div>
  );
}
