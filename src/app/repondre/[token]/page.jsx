"use client";

import { useState, useEffect, useCallback } from "react";

// Page de validation d'une réponse préparée par l'agent. Le gérant relit,
// modifie s'il veut, puis clique « Envoyer » — ou « Ne pas répondre ».
// Rien ne part à la cliente avant ce clic.
export default function RepondrePage({ params }) {
  const token = params.token;
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reply/${token}`);
      if (!res.ok) throw new Error("Lien invalide ou expiré.");
      const d = await res.json();
      setR(d.reply);
      setSubject(d.reply.draftSubject || `Re : ${d.reply.subject || ""}`.trim());
      setText(d.reply.draft || "");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function act(action) {
    if (busy) return;
    if (action === "send" && !text.trim()) { setErr("Le texte de la réponse est vide."); return; }
    if (action === "send" && !window.confirm(`Envoyer cette réponse à ${r?.email} ?`)) return;
    if (action === "dismiss" && !window.confirm("Ne pas répondre à ce message ?")) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/reply/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text, subject }),
      });
      const d = await res.json();
      if (!res.ok) { if (d.reply) setR(d.reply); throw new Error(d.error || "Échec."); }
      setR(d.reply);
      setDone(action === "send" ? "✅ Réponse envoyée à la cliente (copie dans votre boîte)." : "Message classé sans réponse.");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const wrap = { maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "Arial, Helvetica, sans-serif", color: "#2b2620" };
  const card = { background: "#fff", border: "1px solid #ece3d2", borderRadius: 14, padding: 16, marginBottom: 12 };
  const label = { fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#a98935", marginBottom: 6 };
  const input = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #dcd2bf", borderRadius: 9, font: "inherit", fontSize: 15 };
  const btn = (gold) => ({ padding: "13px 22px", borderRadius: 9, border: gold ? "none" : "1px solid #dcd2bf", background: gold ? "#a98935" : "#fff", color: gold ? "#fff" : "#2b2620", fontWeight: "bold", cursor: "pointer", font: "inherit" });

  if (loading) return <div style={wrap}><p>Chargement…</p></div>;
  if (err && !r) return <div style={wrap}><h1 style={{ color: "#a98935", fontFamily: "Georgia, serif", fontWeight: "normal" }}>Niv Création</h1><p>{err}</p></div>;

  const traite = r.status !== "pending";
  return (
    <div style={wrap}>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: "normal", color: "#a98935", textAlign: "center", marginBottom: 0 }}>Niv Création</h1>
      <p style={{ textAlign: "center", color: "#7a7268", marginTop: 4 }}>Réponse à valider</p>

      <div style={card}>
        <div style={label}>Message de la cliente</div>
        <div style={{ fontWeight: "bold" }}>{r.name} <span style={{ fontWeight: "normal", color: "#7a7268" }}>&lt;{r.email}&gt;{r.phone ? ` · ${r.phone}` : ""}</span></div>
        <div style={{ color: "#7a7268", fontSize: 13, margin: "2px 0 10px" }}>{r.subject} · {r.at ? new Date(r.at).toLocaleString("fr-FR") : ""}</div>
        <div style={{ whiteSpace: "pre-line", background: "#faf6ee", border: "1px solid #ece3d2", borderRadius: 10, padding: 12 }}>{r.message}</div>
      </div>

      {traite ? (
        <div style={{ ...card, background: r.status === "sent" ? "#e7f4ea" : "#f3f1ec" }}>
          <strong>{r.status === "sent" ? "✅ Réponse envoyée" : "Classé sans réponse"}</strong>
          {r.resolvedAt ? <div style={{ color: "#7a7268", fontSize: 13 }}>{new Date(r.resolvedAt).toLocaleString("fr-FR")}</div> : null}
          {r.status === "sent" && r.finalText ? <div style={{ whiteSpace: "pre-line", marginTop: 10 }}>{r.finalText}</div> : null}
        </div>
      ) : (
        <div style={card}>
          <div style={label}>Réponse proposée — modifiez librement</div>
          {r.reason ? <div style={{ color: "#9a6b00", fontSize: 13, marginBottom: 8 }}>L&apos;agent précise : {r.reason}</div> : null}
          <input style={{ ...input, marginBottom: 8 }} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet de l'e-mail" />
          <textarea style={{ ...input, minHeight: 260, lineHeight: 1.5 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrivez votre réponse…" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button style={btn(true)} onClick={() => act("send")} disabled={busy}>{busy ? "…" : "Envoyer cette réponse"}</button>
            <button style={btn(false)} onClick={() => act("dismiss")} disabled={busy}>Ne pas répondre</button>
          </div>
          <p style={{ color: "#7a7268", fontSize: 13, marginBottom: 0 }}>La cliente recevra ce texte dans un e-mail à l&apos;image de la boutique. Vous en recevez une copie.</p>
        </div>
      )}
      {done ? <div style={{ ...card, background: "#e7f4ea" }}>{done}</div> : null}
      {err ? <div style={{ ...card, background: "#fdecea", color: "#8a2a1f" }}>{err}</div> : null}
    </div>
  );
}
