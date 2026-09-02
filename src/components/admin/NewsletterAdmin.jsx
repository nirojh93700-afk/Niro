"use client";

import { useState, useEffect } from "react";

export default function NewsletterAdmin({ adminKey }) {
  const [count, setCount] = useState(null);
  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState("nouveautes"); // "nouveautes" | "simple"
  const [subject, setSubject] = useState("Nos nouveautés ✦");
  const [intro, setIntro] = useState("De nouvelles créations viennent d'arriver dans notre atelier. Découvrez-les !");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState([]); // slugs
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [campagnes, setCampagnes] = useState([]);
  const [relance, setRelance] = useState(null); // liste d'e-mails d'une relance ciblée

  useEffect(() => {
    fetch("/api/admin/newsletter", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d) => { setCount(d.count ?? 0); setProducts(d.products || []); })
      .catch(() => setCount(0));
    fetch("/api/admin/email-stats", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d) => setCampagnes(d.campagnes || []))
      .catch(() => setCampagnes([]));
  }, [adminKey]);

  function toggle(slug) {
    setSelected((s) => s.includes(slug) ? s.filter((x) => x !== slug) : (s.length >= 8 ? s : [...s, slug]));
  }

  async function send() {
    setMsg("");
    if (!subject.trim()) { setMsg("Le sujet est obligatoire."); return; }
    if (mode === "nouveautes" && selected.length === 0) { setMsg("Choisis au moins 1 produit à mettre en avant."); return; }
    if (mode === "simple" && !message.trim()) { setMsg("Écris un message."); return; }
    const nb = relance ? relance.length : count;
    if (!nb) { setMsg("Aucune destinataire."); return; }
    if (!window.confirm(relance
      ? `Relancer les ${nb} abonnée(s) qui n'ont pas ouvert ?`
      : `Envoyer cette newsletter à ${nb} abonnée(s) ?`)) return;
    setSending(true);
    try {
      const payload = mode === "nouveautes"
        ? { subject, intro, productSlugs: selected }
        : { subject, message };
      if (relance) payload.recipients = relance;
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Échec de l'envoi.");
      setMsg(`✓ Envoyée à ${d.sent}/${d.total} abonnée(s).`);
      setRelance(null);
    } catch (e) { setMsg(e.message); }
    finally { setSending(false); }
  }

  const shown = products.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Envoie une newsletter à tes abonnées, à ton image. C&apos;est <strong>toi</strong> qui choisis et qui envoies.
        {count !== null && <> Actuellement : <strong>{count} abonnée{count > 1 ? "s" : ""}</strong>.</>}
      </p>

      {relance && (
        <div className="notice" style={{ marginBottom: 14 }}>
          🎯 Relance ciblée armée : <strong>{relance.length} abonnée(s)</strong> qui n&apos;ont pas ouvert.
          Change l&apos;objet pour qu&apos;il soit différent du premier envoi.{" "}
          <button className="btn" style={{ marginLeft: 8 }} onClick={() => setRelance(null)}>Annuler la relance</button>
        </div>
      )}

      {/* Choix du type */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button className={mode === "nouveautes" ? "btn btn-gold" : "btn btn-outline"} style={{ padding: "6px 14px" }} onClick={() => setMode("nouveautes")}>🖼️ Nouveautés (avec photos)</button>
        <button className={mode === "simple" ? "btn btn-gold" : "btn btn-outline"} style={{ padding: "6px 14px" }} onClick={() => setMode("simple")}>✍️ Message simple</button>
      </div>

      <div className="admin-block" style={{ display: "grid", gap: 12 }}>
        <label className="admin-field">Sujet de l&apos;e-mail
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Nos nouveautés ✦" />
        </label>

        {mode === "nouveautes" ? (
          <>
            <label className="admin-field">Petite phrase d&apos;introduction
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} style={{ minHeight: 70 }} placeholder="Ex. De nouvelles créations viennent d'arriver…" />
            </label>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                <strong style={{ fontSize: "0.9rem" }}>Choisis les produits à mettre en avant ({selected.length}/8)</strong>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" style={{ padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", maxWidth: 180 }} />
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
                {shown.map((p) => {
                  const on = selected.includes(p.slug);
                  return (
                    <button key={p.slug} type="button" onClick={() => toggle(p.slug)}
                      style={{ textAlign: "left", border: on ? "2px solid #c9a24b" : "1px solid var(--line)", borderRadius: 10, background: on ? "#fbf3e0" : "#fff", padding: 6, cursor: "pointer", position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, display: "block" }} /> : <div style={{ height: 90, background: "#eee", borderRadius: 6 }} />}
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, marginTop: 4, lineHeight: 1.2 }}>{p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gold-dark)" }}>dès {p.price}</div>
                      {on && <span style={{ position: "absolute", top: 6, right: 6, background: "#c9a24b", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </button>
                  );
                })}
                {shown.length === 0 && <div style={{ color: "var(--ink-soft)", padding: 10 }}>Aucun produit.</div>}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 4 }}>Astuce : 2, 4 ou 6 produits rendent le mieux (cartes par 2). Photos, noms et prix sont ajoutés automatiquement.</div>
            </div>
          </>
        ) : (
          <label className="admin-field">Message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Écris ton message ici…" style={{ minHeight: 160 }} />
          </label>
        )}

        <button className="btn btn-gold" style={{ justifySelf: "start" }} onClick={send} disabled={sending || !count}>
          {sending ? "Envoi en cours…" : relance ? `Relancer ${relance.length} abonnée(s)` : `Envoyer à ${count ?? 0} abonnée(s)`}
        </button>
        {msg && <div className="notice" style={{ margin: 0 }}>{msg}</div>}
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>
          Rien ne part sans ton clic. Conseil : envoie d&apos;abord à ta propre adresse (inscris-toi) pour vérifier le rendu.
        </p>
      </div>

      {/* Résultats des campagnes : ouvertures, clics, produits les plus cliqués */}
      {campagnes.length > 0 && (
        <div className="admin-card" style={{ marginTop: 22 }}>
          <h3 style={{ marginTop: 0 }}>📊 Résultats des envois</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: 0 }}>
            Les <strong>clics</strong> sont fiables. Les <strong>ouvertures</strong> sont un ordre de grandeur :
            Mail sur iPhone charge les images tout seul (comptées à tort) et une cliente qui bloque les images
            n&apos;est pas comptée.
          </p>
          {campagnes.map((c) => (
            <div key={c.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: "bold" }}>{c.subject || "(sans objet)"}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: 10 }}>
                {c.at ? new Date(c.at).toLocaleString("fr-FR") : ""} · {c.envoyes} envoyé(s)
              </div>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 10 }}>
                <div><strong style={{ fontSize: "1.3rem" }}>{c.tauxOuverture} %</strong>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>ouvertures ({c.ouvertures})</div></div>
                <div><strong style={{ fontSize: "1.3rem", color: "var(--gold)" }}>{c.tauxClic} %</strong>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>clics ({c.clics})</div></div>
              </div>
              {c.parProduit.length > 0 && (
                <div style={{ fontSize: "0.82rem", marginBottom: 10 }}>
                  <strong>Produits les plus cliqués :</strong>{" "}
                  {c.parProduit.slice(0, 5).map(([slug, n]) => `${slug} (${n})`).join(" · ")}
                </div>
              )}
              {c.pasOuvert.length > 0 && (
                <button className="btn" onClick={() => { setRelance(c.pasOuvert); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  Préparer une relance pour les {c.pasOuvert.length} qui n&apos;ont pas ouvert
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
