"use client";

// =============================================================================
// CE QUE LA CLIENTE A ÉCRIT PAR E-MAIL — sur la fiche atelier.
// -----------------------------------------------------------------------------
// Une consigne de gravure arrive souvent PAR E-MAIL, après la commande ou
// pendant le devis (« sur la pièce de puzzle gauche comme sur la photo »,
// commande 09SZ9VYH). Ce bloc lit ces e-mails dans la boîte Gmail connectée au
// site (lecture seule) et les montre sur la fiche, sans rien à faire
// (gérant, 19/10/2026 : « il faut que ça soit automatique »).
// On garde les e-mails écrits depuis 30 jours avant la commande.
// =============================================================================

import { useEffect, useState } from "react";
import MailBody from "@/components/admin/MailBody";

const AVANT_COMMANDE = 30 * 24 * 3600 * 1000;

function adminKeyFrom(k) {
  if (k) return k;
  try { return sessionStorage.getItem("niv-admin-key") || ""; } catch { return ""; }
}

const dateFr = (t) => new Date(t).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function MessagesEmail({ email, depuis, adminKey, print = false }) {
  const [etat, setEtat] = useState("chargement"); // chargement | ok | vide | erreur
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const key = adminKeyFrom(adminKey);
    if (!email || !key) { setEtat("vide"); return; }
    let annule = false;
    (async () => {
      try {
        const r = await fetch(`/api/admin/gmail?action=messages&email=${encodeURIComponent(email)}`, { headers: { "x-admin-key": key } });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Lecture impossible");
        const limite = (Date.parse(depuis) || 0) - AVANT_COMMANDE;
        const liste = (d.messages || []).filter((m) => !limite || (m.at || 0) >= limite);
        if (annule) return;
        setMessages(liste);
        setEtat(liste.length ? "ok" : "vide");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => { annule = true; };
  }, [email, depuis, adminKey]);

  const titre = "✉️ Ce que la cliente a écrit par e-mail — à lire avant de graver";
  if (etat === "chargement") return <p data-photos-chargement="1" style={{ fontSize: "0.85rem", color: "#888", margin: "8px 0" }}>{titre} — recherche dans la boîte mail…</p>;
  if (etat === "vide") return null;
  if (etat === "erreur") return print ? null : <p style={{ fontSize: "0.85rem", color: "#b4452f", margin: "8px 0" }}>{titre} — boîte mail injoignable, ouvrez les e-mails de la cliente dans Gmail.</p>;

  const montres = print ? messages.slice(0, 3) : messages.slice(0, 8);
  return (
    <div className={print ? "fp-encadre" : undefined} style={print ? undefined : { margin: "8px 0", padding: "8px 10px", background: "#fff8e6", border: "1px solid #ecd9a6", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>{titre}</div>
      {montres.map((m) => (
        <div key={m.messageId} style={{ padding: "6px 0", borderTop: "1px dashed #e3d3a5" }}>
          <div style={{ fontSize: "0.78rem", color: "#7a6a3e", marginBottom: 2 }}>
            {dateFr(m.at)}{m.photos ? ` · ${m.photos} photo${m.photos > 1 ? "s" : ""} jointe${m.photos > 1 ? "s" : ""}` : ""}
          </div>
          {print
            ? <div style={{ fontSize: "0.85rem", whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{m.text.length > 400 ? `${m.text.slice(0, 400)}…` : m.text}</div>
            : <MailBody text={m.text} />}
        </div>
      ))}
      {messages.length > montres.length ? <div style={{ fontSize: "0.78rem", color: "#7a6a3e" }}>… et {messages.length - montres.length} autre(s) dans Gmail.</div> : null}
    </div>
  );
}
