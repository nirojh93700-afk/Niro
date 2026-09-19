"use client";

import { useState, useEffect, useCallback } from "react";
import PhotoUpload, { UPLOAD_AVAILABLE } from "@/components/PhotoUpload";
import MailBody from "@/components/admin/MailBody";

// Discussion / BAT (bon à tirer) d'une commande, côté admin.
export default function BatThread({ order, adminKey }) {
  const [thread, setThread] = useState(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [to, setTo] = useState(order.customerEmail || "");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  // Reprend l'adresse de la commande (ou celle déjà enregistrée dans le fil).
  useEffect(() => {
    setTo((prev) => prev || order.customerEmail || thread?.customerEmail || "");
  }, [order.customerEmail, thread?.customerEmail]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bat?orderId=${encodeURIComponent(order.id)}`, { headers: { "x-admin-key": adminKey } });
      if (res.ok) setThread((await res.json()).thread);
    } catch { /* ignore */ }
  }, [order.id, adminKey]);

  useEffect(() => { load(); }, [load]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());

  // Efface toute la conversation d'aperçu (pour recommencer à zéro).
  async function resetThread() {
    if (!window.confirm("Effacer toute la conversation d'aperçu de cette commande ? (à faire seulement si la cliente n'a rien reçu — cela permet de recommencer à zéro)")) return;
    setSending(true); setMsg("");
    try {
      const res = await fetch(`/api/admin/bat?orderId=${encodeURIComponent(order.id)}`, {
        method: "DELETE", headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) { setMsg("Échec de la suppression."); return; }
      setThread(null); setText(""); setImage("");
      setMsg("✓ Conversation effacée. Vous pouvez recommencer.");
    } catch { setMsg("Échec de la suppression."); }
    finally { setSending(false); }
  }

  async function send() {
    if (!text.trim() && !image.trim()) { setMsg("Ajoute un message ou un aperçu."); return; }
    if (!emailValid) { setMsg("Renseigne d'abord l'adresse e-mail de la cliente (ci-dessus)."); return; }
    setSending(true); setMsg("");
    try {
      const res = await fetch("/api/admin/bat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          orderId: order.id, ref: order.ref || order.id?.slice(-6),
          customerEmail: to.trim(), customerName: order.customerName || "",
          text: text.trim(), image: image.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(d.error || "Échec."); return; }
      setThread(d.thread);
      setText(""); setImage("");
      setMsg(d.emailed
        ? `✓ Aperçu envoyé par e-mail à ${d.to || "la cliente"} (vous recevez une copie).`
        : `⚠ Enregistré, mais l'e-mail n'est PAS parti. Raison : ${d.emailError || "inconnue"}`);
    } catch { setMsg("Échec de l'envoi."); }
    finally { setSending(false); }
  }

  const statusLabel = {
    en_attente: "⏳ En attente de réponse",
    valide: "✅ Validé par la cliente",
    modif_demandee: "✏️ Modification demandée",
  }[thread?.status] || ((thread?.messages || []).length ? "📧 Historique des messages" : "Aucun échange pour l'instant");

  // Un séparateur de jour entre les messages : on se repère sans lire les dates.
  const messages = thread?.messages || [];
  const jour = (ts) => { try { return new Date(ts).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); } catch { return ""; } };
  const heure = (ts) => { try { return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  return (
    <div className="bt">
      <div className="bt-title">💬 Aperçu à valider (BAT) — {statusLabel}</div>
      <p className="bt-intro">
        Envoie un aperçu (photo + message) à la cliente. Elle reçoit un e-mail avec un lien pour <strong>valider</strong> ou <strong>demander une modification</strong>. Tout reste ici.
      </p>

      {messages.length > 0 && (
        <div className="bt-thread">
          {messages.map((m, i) => {
            const nouveauJour = i === 0 || jour(m.at) !== jour(messages[i - 1].at);
            return (
              <div key={i}>
                {nouveauJour ? <div className="bt-daysep">{jour(m.at)}</div> : null}
                <div className={`bt-msg ${m.from === "atelier" ? "nous" : "elle"}`}>
                  <div className="bt-meta">
                    {m.from === "atelier" ? "Nous" : (order.customerName || "Cliente")}
                    <em>
                      {m.viaEmail ? " · 📧 par e-mail" : ""}
                      {m.decision === "valide" ? " · ✅ Validé" : m.decision === "modif" ? " · ✏️ Modif demandée" : ""}
                      {" · "}{heure(m.at)}
                    </em>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.image ? <img className="bt-img" src={m.image} alt="Aperçu envoyé" /> : null}
                  {m.text ? <MailBody text={m.text} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <label className="bt-label" htmlFor={`bt-to-${order.id}`}>E-mail de la cliente (le mail part à cette adresse)</label>
      <input id={`bt-to-${order.id}`} type="email" inputMode="email" autoComplete="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="ex. cliente@email.com"
        className="bt-input" style={{ borderColor: to && !emailValid ? "#d99" : undefined, marginBottom: to && !emailValid ? 0 : 10 }} />
      {to && !emailValid ? <p className="bt-err" style={{ marginBottom: 10 }}>Adresse e-mail incomplète.</p> : null}
      {!to ? <p className="bt-err" style={{ marginBottom: 10 }}>Cette commande n'a pas d'adresse enregistrée : saisis l'e-mail de la cliente pour pouvoir envoyer.</p> : null}

      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Message à la cliente (ex. « Voici l'aperçu de votre gravure, dites-moi si ça vous convient »)"
        className="bt-area" style={{ marginBottom: 8 }} />

      {UPLOAD_AVAILABLE ? (
        <PhotoUpload value={image} onChange={(url) => setImage(url)} productSlug={`bat-${order.id}`} />
      ) : (
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL de l'image d'aperçu (https://…)" className="bt-input" />
      )}
      {image ? <p className="bt-ok">Aperçu prêt à envoyer ✓</p> : null}

      <div className="bt-actions">
        <button className="btn btn-gold" style={{ opacity: emailValid ? 1 : 0.55 }} disabled={sending || !emailValid} onClick={send}>
          {sending ? "Envoi…" : "Envoyer l'aperçu à la cliente"}
        </button>
        <button className="btn btn-outline" onClick={load}>Rafraîchir</button>
        {messages.length > 0 && (
          <button className="btn btn-outline bt-reset" disabled={sending} onClick={resetThread}>🗑 Effacer la conversation</button>
        )}
      </div>
      {msg && <p style={{ margin: "10px 0 0", fontSize: "0.85rem", color: msg.startsWith("✓") ? "#256b34" : "#b4452f" }}>{msg}</p>}
    </div>
  );
}
