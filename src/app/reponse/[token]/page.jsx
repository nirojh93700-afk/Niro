"use client";

import { useState, useEffect, useCallback } from "react";

// Page « Répondre à l'atelier » — ouverte par le bouton doré des e-mails
// clients (maquette validée le 15/09/2026). La cliente écrit sa réponse ici :
// elle est rangée dans son dossier + le fil de sa commande, sans repasser par
// sa messagerie. Aucun compte, aucun mot de passe : le jeton du lien suffit.
const S = {
  wrap: { minHeight: "70vh", background: "#fbf7ee", padding: "28px 12px 42px", fontFamily: "Arial, Helvetica, sans-serif", color: "#1a1206" },
  card: { maxWidth: 560, width: "100%", boxSizing: "border-box", margin: "0 auto", background: "#fff", border: "1px solid #ece3d2", borderRadius: 16, padding: "26px 26px 30px" },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: "#a98935", textTransform: "uppercase" },
  h1: { fontFamily: "Georgia, serif", fontWeight: "normal", fontSize: 22, margin: "6px 0 4px" },
  who: { fontSize: 13, color: "#8a7a56", marginBottom: 16 },
  quote: { background: "#fbf7ee", border: "1px solid #ece3d2", borderLeft: "3px solid #dcc88f", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.55, color: "#5c5140", marginBottom: 16, whiteSpace: "pre-line" },
  qtitle: { fontSize: 11, letterSpacing: 1.5, color: "#a98935", textTransform: "uppercase", marginBottom: 6 },
  ta: { width: "100%", boxSizing: "border-box", minHeight: 120, border: "1px solid #dcc88f", borderRadius: 10, padding: 12, font: "inherit", fontSize: 15, background: "#fffdf8" },
  send: { marginTop: 14, width: "100%", background: "#c9a24b", border: "none", color: "#fff", fontSize: 16, fontWeight: "bold", padding: 14, borderRadius: 999, cursor: "pointer" },
  safe: { marginTop: 12, fontSize: 12, color: "#8a7a56", textAlign: "center", lineHeight: 1.6 },
  err: { background: "#fdecea", border: "1px solid #f5c6c0", color: "#8a2a20", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginTop: 12 },
  ok: { textAlign: "center", padding: "26px 6px" },
};

export default function ReponsePage({ params }) {
  const token = params.token;
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reponse/${token}`);
      if (!res.ok) throw new Error("Lien invalide ou expiré.");
      const d = await res.json();
      setLink(d.link);
    } catch (e) { setErr(e.message || "Lien invalide ou expiré."); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function envoyer() {
    if (busy || !text.trim()) { if (!text.trim()) setErr("Écrivez votre message avant d'envoyer."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/reponse/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "L'envoi a échoué. Réessayez.");
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const prenom = (link?.name || "").split(" ")[0];
  return (
    <main style={S.wrap}>
      <div style={S.card}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#8a7a56" }}>Un instant…</p>
        ) : !link ? (
          <div style={S.ok}>
            <div style={S.eyebrow}>Niv Création</div>
            <h1 style={S.h1}>Ce lien n&apos;est plus valable</h1>
            <p style={{ fontSize: 14, color: "#5c5140", lineHeight: 1.6 }}>
              Pas d&apos;inquiétude : répondez simplement à notre e-mail, votre message nous parviendra aussi.
            </p>
          </div>
        ) : done ? (
          <div style={S.ok}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>✦</div>
            <h1 style={S.h1}>Merci{prenom ? ` ${prenom}` : ""}, c&apos;est bien envoyé</h1>
            <p style={{ fontSize: 14, color: "#5c5140", lineHeight: 1.6 }}>
              Votre message est transmis à l&apos;atelier et rangé dans votre dossier.
              Nous vous répondons par e-mail.
            </p>
          </div>
        ) : (
          <>
            <div style={S.eyebrow}>Niv Création — votre réponse</div>
            <h1 style={S.h1}>Répondre à l&apos;atelier</h1>
            <div style={S.who}>
              {link.orderRef ? `Commande #${link.orderRef}` : "Votre échange avec l'atelier"}
              {prenom ? ` · ${prenom}` : ""}
            </div>
            {link.excerpt ? (
              <div style={S.quote}>
                <div style={S.qtitle}>Notre message{link.at ? ` du ${new Date(link.at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}` : ""}</div>
                {link.excerpt}{link.excerpt.length >= 240 ? "…" : ""}
              </div>
            ) : null}
            <textarea
              style={S.ta} maxLength={4000} value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrivez votre réponse ici…"
            />
            <button style={{ ...S.send, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={envoyer}>
              {busy ? "Envoi…" : "Envoyer ma réponse"}
            </button>
            {err ? <div style={S.err}>{err}</div> : null}
            <div style={S.safe}>
              Votre message est transmis directement à l&apos;atelier et rangé dans votre dossier.<br />
              Nous vous répondons par e-mail.
            </div>
          </>
        )}
      </div>
    </main>
  );
}
