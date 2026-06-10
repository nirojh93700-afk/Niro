"use client";

import { useState, useEffect, useCallback } from "react";

export default function SuiviPage({ params }) {
  const token = params.token;
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bat/${token}`);
      if (!res.ok) throw new Error("Lien invalide ou expiré.");
      const d = await res.json();
      setThread(d.thread);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function send(decision) {
    setSending(true); setErr(""); setDone("");
    try {
      const res = await fetch(`/api/bat/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), decision: decision || "" }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi.");
      const d = await res.json();
      setThread(d.thread);
      setText("");
      setDone(decision === "valide" ? "Merci ! Votre validation a bien été envoyée." : decision === "modif" ? "Votre demande de modification a bien été envoyée." : "Message envoyé.");
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  }

  const wrap = { maxWidth: 620, margin: "0 auto", padding: "24px 16px", fontFamily: "Arial, Helvetica, sans-serif", color: "#2b2620" };
  const card = { background: "#fff", border: "1px solid #ece3d2", borderRadius: 14, padding: 16, marginBottom: 12 };

  if (loading) return <div style={wrap}><p>Chargement…</p></div>;
  if (err && !thread) return <div style={wrap}><h1 style={{ color: "#a98935" }}>Niv Création</h1><p>{err}</p></div>;

  const statusLabel = {
    en_attente: "En attente de votre réponse",
    valide: "✅ Validé — merci !",
    modif_demandee: "✏️ Modification demandée",
  }[thread?.status] || "";

  return (
    <div style={wrap}>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: "normal", color: "#a98935", textAlign: "center" }}>Niv Création</h1>
      <p style={{ textAlign: "center", color: "#7a7268", marginTop: -6 }}>
        Aperçu avant gravure{thread?.ref ? ` — commande #${thread.ref}` : ""}
      </p>
      {statusLabel && <p style={{ textAlign: "center", fontWeight: 700, color: "#a98935" }}>{statusLabel}</p>}

      {(thread?.messages || []).map((m, i) => (
        <div key={i} style={{ ...card, background: m.from === "atelier" ? "#faf6ee" : "#fff", marginLeft: m.from === "cliente" ? 30 : 0, marginRight: m.from === "atelier" ? 30 : 0 }}>
          <div style={{ fontSize: 12, color: "#a98935", fontWeight: 700, marginBottom: 6 }}>
            {m.from === "atelier" ? "Niv Création" : "Vous"}
            {m.decision === "valide" ? " · ✅ Validé" : m.decision === "modif" ? " · ✏️ Modification demandée" : ""}
          </div>
          {m.image ? <img src={m.image} alt="Aperçu" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: m.text ? 8 : 0 }} /> : null}
          {m.text ? <div style={{ whiteSpace: "pre-line", fontSize: 15, lineHeight: 1.5 }}>{m.text}</div> : null}
        </div>
      ))}

      {done && <p style={{ background: "#e8f3ea", border: "1px solid #b9dcc0", borderRadius: 10, padding: 12, color: "#256b34" }}>{done}</p>}
      {err && <p style={{ color: "#b4452f" }}>{err}</p>}

      <div style={{ ...card }}>
        <label style={{ fontSize: 13, color: "#7a7268" }}>Votre message (facultatif)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Une précision, une correction à apporter…"
          style={{ width: "100%", minHeight: 80, padding: 10, border: "1px solid #e4e0d8", borderRadius: 10, font: "inherit", marginTop: 6 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <button onClick={() => send("valide")} disabled={sending}
            style={{ background: "#2e8b57", color: "#fff", border: 0, borderRadius: 8, padding: "11px 18px", fontWeight: 700, cursor: "pointer" }}>
            ✅ Je valide
          </button>
          <button onClick={() => send("modif")} disabled={sending}
            style={{ background: "#a98935", color: "#fff", border: 0, borderRadius: 8, padding: "11px 18px", fontWeight: 700, cursor: "pointer" }}>
            ✏️ Je demande une modification
          </button>
          <button onClick={() => send("")} disabled={sending || !text.trim()}
            style={{ background: "#fff", color: "#2b2620", border: "1px solid #e4e0d8", borderRadius: 8, padding: "11px 18px", cursor: "pointer" }}>
            Envoyer le message
          </button>
        </div>
      </div>
      <p style={{ textAlign: "center", color: "#bdab86", fontSize: 12 }}>Une fois validé, nous lançons la gravure de votre commande.</p>
    </div>
  );
}
