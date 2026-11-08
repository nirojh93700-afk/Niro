"use client";

import { useEffect, useRef, useState } from "react";

// =============================================================================
// GESTION → FINANCES → VENTES → « Posez une question sur vos chiffres » (08/11/2026)
// Le gérant tape sa question, Claude répond à partir d'agrégats calculés côté serveur sur les
// VRAIES commandes (jamais un chiffre inventé). Réponse courte + barres en CSS + source.
// Aucune fenêtre système ; les 3 dernières questions restent repliées sous la carte.
// =============================================================================

const SUGGESTIONS = [
  "Combien de colliers vendus en octobre ?",
  "Qu'est-ce qui me rapporte le plus ce mois-ci ?",
  "Panier moyen des verres sur 30 jours ?",
  "Combien de commandes hors France ?",
];

const euroOuNombre = (v) => {
  const n = Number(v) || 0;
  if (Number.isInteger(n) && Math.abs(n) < 1000) return String(n);
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function Barres({ barres }) {
  if (!barres?.length) return null;
  const max = Math.max(...barres.map((b) => Math.abs(Number(b.valeur) || 0)), 0) || 1;
  return (
    <div style={{ display: "grid", gap: 6, marginTop: 4 }} aria-label="Graphique en barres">
      {barres.map((b, i) => {
        const pct = Math.max(2, Math.round((Math.abs(Number(b.valeur) || 0) / max) * 100));
        return (
          <div key={`${b.label}-${i}`} style={{ display: "grid", gridTemplateColumns: "minmax(70px, 34%) 1fr auto", gap: 8, alignItems: "center", fontSize: 12.5 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.label}>{b.label}</span>
            <span style={{ height: 10, borderRadius: 999, background: "var(--ash-sunk, #f1ede4)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: 999, background: "var(--ash-gold-2, #a98935)" }} />
            </span>
            <span className="mono" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, whiteSpace: "nowrap" }}>{euroOuNombre(b.valeur)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Reponse({ r }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.5 }}>{r.texte}</p>
      <Barres barres={r.barres} />
      {r.source ? <p className="muted" style={{ margin: 0, fontSize: 11.5 }}>Source : {r.source}</p> : null}
    </div>
  );
}

export default function QuestionChiffres() {
  const [question, setQuestion] = useState("");
  const [cle, setCle] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [reponse, setReponse] = useState(null); // { question, texte, barres, source }
  const [erreur, setErreur] = useState("");
  const [historique, setHistorique] = useState([]); // 3 dernières, la plus récente en premier
  const champ = useRef(null);

  useEffect(() => {
    try { setCle(sessionStorage.getItem("niv-admin-key") || ""); } catch { /* navigation privée */ }
  }, []);

  async function demander(q) {
    const texte = String(q ?? question).trim();
    if (!texte || enCours) return;
    if (!cle) { setErreur("Ouvrez d'abord Gestion pour saisir votre mot de passe."); return; }
    setErreur(""); setEnCours(true);
    try {
      const r = await fetch("/api/admin/question-chiffres", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": cle },
        body: JSON.stringify({ question: texte }),
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "La réponse n'a pas pu être obtenue.");
      const nouvelle = { question: texte, texte: j.texte || "", barres: Array.isArray(j.barres) ? j.barres : [], source: j.source || "" };
      setReponse((prev) => {
        if (prev) setHistorique((h) => [prev, ...h].slice(0, 3));
        return nouvelle;
      });
    } catch (e) {
      setErreur(e?.message || "La réponse n'a pas pu être obtenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fq" style={{ marginBottom: 18 }}>
      <div className="fq-card" style={{ borderLeftColor: "var(--ash-gold-2, #a98935)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 700 }}>Posez une question sur vos chiffres</h3>
          <span className="muted" style={{ fontSize: 12 }}>Réponse lue dans vos vraies commandes</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            ref={champ}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); demander(); } }}
            placeholder="Combien de colliers vendus en octobre ?"
            maxLength={400}
            disabled={enCours}
            aria-label="Votre question sur vos chiffres"
            style={{ flex: "1 1 220px", minWidth: 0, minHeight: 38, padding: "8px 11px", borderRadius: 10, border: "1px solid var(--ash-line-2, #ddd)", font: "inherit", fontSize: 14 }}
          />
          <button type="button" className="fq-btn pri" onClick={() => demander()} disabled={enCours || !question.trim()} style={{ minHeight: 38 }}>
            {enCours ? "Je lis vos commandes…" : "Demander"}
          </button>
        </div>

        <div className="fq-chipbar" style={{ flexWrap: "wrap" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="fq-chip" disabled={enCours} onClick={() => { setQuestion(s); demander(s); }}>{s}</button>
          ))}
        </div>

        {enCours ? <p className="muted" style={{ margin: 0, fontSize: 13 }} aria-live="polite">Je lis vos commandes…</p> : null}
        {erreur ? <p role="alert" style={{ margin: 0, color: "var(--ash-bad, #b42318)", fontSize: 13, fontWeight: 600 }}>{erreur}</p> : null}

        {reponse && !enCours ? (
          <div style={{ borderTop: "1px solid var(--ash-line, #eee)", paddingTop: 10, display: "grid", gap: 6 }}>
            <p className="muted" style={{ margin: 0, fontSize: 12, fontStyle: "italic" }}>« {reponse.question} »</p>
            <Reponse r={reponse} />
          </div>
        ) : null}
      </div>

      {historique.length ? (
        <details style={{ marginTop: 8 }}>
          <summary className="muted" style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
            Questions précédentes ({historique.length})
          </summary>
          <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
            {historique.map((h, i) => (
              <div key={`${h.question}-${i}`} className="fq-card" style={{ padding: "10px 12px" }}>
                <p className="muted" style={{ margin: 0, fontSize: 12, fontStyle: "italic" }}>« {h.question} »</p>
                <Reponse r={h} />
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
