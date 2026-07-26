"use client";

import { useState, useEffect, useCallback } from "react";
import PhotoUpload, { UPLOAD_AVAILABLE } from "@/components/PhotoUpload";

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
  }[thread?.status] || "Aucun échange pour l'instant";

  return (
    <div style={{ marginTop: 12, background: "#fbf7ef", border: "1px solid #e7d3a1", borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>💬 Aperçu à valider (BAT) — {statusLabel}</div>
      <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
        Envoie un aperçu (photo + message) à la cliente. Elle reçoit un e-mail avec un lien pour <strong>valider</strong> ou <strong>demander une modification</strong>. Tout reste ici.
      </p>

      {(thread?.messages || []).length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {thread.messages.map((m, i) => (
            <div key={i} style={{ background: m.from === "atelier" ? "#fff" : "#f3ece0", border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginLeft: m.from === "cliente" ? 24 : 0, marginRight: m.from === "atelier" ? 24 : 0 }}>
              <div style={{ fontSize: 11, color: "var(--gold-dark)", fontWeight: 700, marginBottom: 4 }}>
                {m.from === "atelier" ? "Toi" : "Cliente"}
                {m.viaEmail ? " · 📧 par e-mail" : ""}
                {m.decision === "valide" ? " · ✅ Validé" : m.decision === "modif" ? " · ✏️ Modif demandée" : ""}
                {" · "}{new Date(m.at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.image ? <img src={m.image} alt="" style={{ maxWidth: 200, borderRadius: 6, marginBottom: m.text ? 6 : 0, display: "block" }} /> : null}
              {m.text ? <div style={{ whiteSpace: "pre-line", fontSize: 14 }}>{m.text}</div> : null}
            </div>
          ))}
        </div>
      )}

      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--gold-dark)", marginBottom: 4 }}>
        E-mail de la cliente (le mail part à cette adresse)
      </label>
      <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="ex. cliente@email.com"
        style={{ width: "100%", padding: 10, border: `1px solid ${to && !emailValid ? "#d99" : "var(--line)"}`, borderRadius: 10, font: "inherit", marginBottom: to && !emailValid ? 4 : 10 }} />
      {to && !emailValid ? <div style={{ fontSize: "0.78rem", color: "#b4452f", marginBottom: 10 }}>Adresse e-mail incomplète.</div> : null}
      {!to ? <div style={{ fontSize: "0.78rem", color: "#b4452f", marginBottom: 10 }}>Cette commande n'a pas d'adresse enregistrée : saisis l'e-mail de la cliente pour pouvoir envoyer.</div> : null}

      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Message à la cliente (ex. « Voici l'aperçu de votre gravure, dites-moi si ça vous convient »)"
        style={{ width: "100%", minHeight: 70, padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 8 }} />

      {UPLOAD_AVAILABLE ? (
        <PhotoUpload value={image} onChange={(url) => setImage(url)} productSlug={`bat-${order.id}`} />
      ) : (
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL de l'image d'aperçu (https://…)"
          style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
      )}
      {image ? <div style={{ fontSize: "0.78rem", color: "#256b34", marginTop: 4 }}>Aperçu prêt à envoyer ✓</div> : null}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
        <button className="btn btn-gold" style={{ padding: "8px 16px", opacity: emailValid ? 1 : 0.55 }} disabled={sending || !emailValid} onClick={send}>
          {sending ? "Envoi…" : "Envoyer l'aperçu à la cliente"}
        </button>
        <button className="btn btn-outline" style={{ padding: "8px 12px" }} onClick={load}>Rafraîchir</button>
        {(thread?.messages || []).length > 0 && (
          <button className="btn btn-outline" style={{ padding: "8px 12px", marginLeft: "auto", color: "#b4452f", borderColor: "#e0b4a8" }} disabled={sending} onClick={resetThread}>
            🗑 Effacer la conversation
          </button>
        )}
      </div>
      {msg && <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: msg.startsWith("✓") ? "#256b34" : "#b4452f" }}>{msg}</p>}
    </div>
  );
}
