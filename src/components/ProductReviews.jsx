"use client";

import { useState, useEffect } from "react";
import PhotoUpload, { UPLOAD_AVAILABLE } from "@/components/PhotoUpload";

function Stars({ value }) {
  return (
    <span style={{ color: "#d8a93a", letterSpacing: 1 }} aria-label={`${value}/5`}>
      {"★".repeat(Math.round(value))}{"☆".repeat(5 - Math.round(value))}
    </span>
  );
}

export default function ProductReviews({ slug }) {
  const [data, setData] = useState({ reviews: [], average: 0, count: 0 });
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [slug]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (text.trim().length < 2) { setErr("Écris quelques mots."); return; }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, rating, text, photo }),
      });
      if (!res.ok) throw new Error("Envoi impossible.");
      setSent(true);
    } catch (e2) { setErr(e2.message); }
  }

  return (
    <section className="container" style={{ maxWidth: 760, margin: "0 auto", padding: "10px 16px 40px" }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontWeight: "normal" }}>Avis clients</h2>

      {data.count > 0 ? (
        <p style={{ margin: "0 0 16px" }}>
          <Stars value={data.average} /> <strong>{data.average}/5</strong>{" "}
          <span style={{ color: "var(--ink-soft)" }}>({data.count} avis)</span>
        </p>
      ) : (
        <p style={{ color: "var(--ink-soft)" }}>Aucun avis pour le moment — soyez le premier !</p>
      )}

      {data.reviews.map((r, i) => (
        <div key={i} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{r.name}</strong>
            <Stars value={r.rating} />
          </div>
          <p style={{ margin: "6px 0 0", whiteSpace: "pre-line" }}>{r.text}</p>
          {r.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.photo} alt="Photo de la cliente" loading="lazy" style={{ marginTop: 8, maxWidth: 160, borderRadius: 10, border: "1px solid var(--line)" }} />
          ) : null}
        </div>
      ))}

      {sent ? (
        <div className="notice" style={{ marginTop: 18 }}>Merci pour votre avis ! Il sera publié après validation. 🌸</div>
      ) : !open ? (
        <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={() => setOpen(true)}>Laisser un avis</button>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 18, border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Votre avis</h3>
          <div style={{ marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.6rem", color: n <= rating ? "#d8a93a" : "#ccc" }} aria-label={`${n} étoiles`}>★</button>
            ))}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 10, font: "inherit" }} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre expérience, la qualité, la gravure…" style={{ width: "100%", minHeight: 90, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
          {UPLOAD_AVAILABLE && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: "0.85rem", color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>Ajouter une photo de votre bijou (facultatif)</label>
              <PhotoUpload value={photo} onChange={(url) => setPhoto(url)} productSlug={`avis-${slug}`} />
            </div>
          )}
          {err && <p style={{ color: "#b4452f", fontSize: "0.9rem" }}>{err}</p>}
          <button type="submit" className="btn btn-gold" style={{ marginTop: 8 }}>Publier mon avis</button>
        </form>
      )}
    </section>
  );
}
