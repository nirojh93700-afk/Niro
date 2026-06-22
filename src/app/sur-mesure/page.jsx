"use client";

// =============================================================================
// PAGE DÉMO (aperçu privé) — « Projet sur mesure » version pro.
// Animations Framer Motion + notifications Sonner (isolées à cette page).
// La cliente choisit une matière, décrit son idée, génère un aperçu gratuit
// (moteur public, 0 €), joint une photo et envoie sa demande à l'atelier.
// N'AFFECTE PAS le reste du site (aucun lien dans le menu/accueil).
// =============================================================================
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import PhotoUpload from "@/components/PhotoUpload";

const MATERIALS = [
  { key: "bois", label: "Bois", en: "natural wood", color: "#b88a4a" },
  { key: "verre", label: "Verre", en: "clear glass", color: "#bcd3da" },
  { key: "acier", label: "Acier inoxydable", en: "stainless steel", color: "#c7ccd1" },
  { key: "acrylique", label: "Acrylique", en: "transparent acrylic", color: "#d9c7ea" },
  { key: "ardoise", label: "Ardoise", en: "black slate", color: "#5b5f63" },
  { key: "cuir", label: "Cuir", en: "leather", color: "#9c6b43" },
  { key: "miroir", label: "Miroir", en: "mirror", color: "#9fb4bd" },
];

export default function SurMesurePage() {
  const [material, setMaterial] = useState("bois");
  const [idea, setIdea] = useState("");
  const [dims, setDims] = useState("");
  const [qty, setQty] = useState("");
  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const mat = MATERIALS.find((m) => m.key === material) || MATERIALS[0];

  function generate() {
    if (idea.trim().length < 8) { toast.error("Décris ton idée plus précisément (objet, texte à graver, style…)."); return; }
    setGenLoading(true);
    setPreviewUrl(""); // reset
    fetch("/api/sur-mesure/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ material: mat.en, idea }),
    })
      .then((r) => r.json())
      .then((j) => { if (j.url) setPreviewUrl(j.url); else { setGenLoading(false); toast.error(j.error || "Générateur indisponible."); } })
      .catch(() => { setGenLoading(false); toast.error("Erreur réseau."); });
  }

  async function submit() {
    if (!idea.trim() || !email.trim()) { toast.error("Merci d'indiquer ton idée et ton e-mail."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/sur-mesure", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, idea, material: mat.label, dims, qty, photo, preview: previewUrl }),
      });
      const j = await res.json();
      if (!res.ok) toast.error(j.error || "Envoi impossible.");
      else { toast.success("Demande envoyée ✓"); setSent(true); }
    } catch { toast.error("Erreur réseau."); }
    setSending(false);
  }

  if (sent) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: "60px 16px", textAlign: "center" }}>
        <Toaster richColors position="top-center" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ fontSize: 46, color: "var(--gold)" }}>✦</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "var(--font-display)" }}>Demande envoyée&nbsp;!</motion.h1>
        <p style={{ color: "var(--ink-soft)" }}>Merci. Nous étudions la faisabilité de ton projet et te répondons très vite par e-mail pour te dire si c'est réalisable et te proposer un devis.</p>
        <a href="/sur-mesure" className="btn btn-gold" style={{ marginTop: 10 }}>Faire une autre demande</a>
      </div>
    );
  }

  const fade = { initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

  return (
    <div className="container" style={{ maxWidth: 820, padding: "40px 16px 70px" }}>
      <Toaster richColors position="top-center" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: 30 }}>
        <span className="eyebrow">Atelier de gravure laser</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "6px 0 8px" }}>Votre projet sur mesure</h1>
        <p style={{ color: "var(--ink-soft)", maxWidth: 560, margin: "0 auto" }}>
          Choisissez une matière, décrivez votre idée, et obtenez un aperçu en un clic. Nous vous disons ensuite si c'est réalisable.
        </p>
      </motion.div>

      {/* 1. Matière */}
      <motion.h3 {...fade} style={{ fontFamily: "var(--font-display)" }}>1. La matière</motion.h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12, marginBottom: 28 }}>
        {MATERIALS.map((m, i) => (
          <motion.button key={m.key} type="button" onClick={() => setMaterial(m.key)}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }}
            style={{ cursor: "pointer", background: "#fff", borderRadius: 14, padding: "12px 8px", textAlign: "center",
              border: material === m.key ? "2px solid var(--gold)" : "1px solid var(--line)",
              boxShadow: material === m.key ? "0 6px 18px rgba(201,162,75,.22)" : "none" }}>
            <span style={{ display: "block", width: 42, height: 42, borderRadius: "50%", margin: "0 auto 8px", background: m.color, border: "1px solid rgba(0,0,0,.08)" }} />
            <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>{m.label}</span>
          </motion.button>
        ))}
      </div>

      {/* 2. Idée */}
      <motion.h3 {...fade} style={{ fontFamily: "var(--font-display)" }}>2. Votre idée</motion.h3>
      <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 6px" }}>
        Plus vous êtes précise (l'objet, le texte à graver, le style, l'occasion), plus l'aperçu sera fidèle.
      </p>
      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={4}
        placeholder="Ex : une planche en bois gravée « Joyeux anniversaire Lucas », avec une fusée et des étoiles, environ 30 cm, pour les 6 ans de mon fils."
        style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <input value={dims} onChange={(e) => setDims(e.target.value)} placeholder="Dimensions (ex. 30 × 20 cm)" style={{ flex: 1, minWidth: 160, padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
        <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantité (ex. 1)" style={{ width: 140, padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
      </div>

      {/* Générateur d'aperçu (gratuit) */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <motion.button type="button" className="btn btn-gold" onClick={generate} whileTap={{ scale: 0.96 }}>✨ Générer une inspiration</motion.button>
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Aperçu d'ambiance (inspiration) — pas le rendu exact. Faisabilité et rendu final validés par l'atelier.</span>
      </div>
      <AnimatePresence>
        {previewUrl ? (
          <motion.div key={previewUrl} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 24, textAlign: "center", position: "relative" }}>
            {genLoading ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>Génération…</div> : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Aperçu généré" onLoad={() => setGenLoading(false)} onError={() => { setGenLoading(false); toast.error("Générateur indisponible, réessaie."); }}
              style={{ maxWidth: 380, width: "100%", borderRadius: 14, border: "1px solid var(--line)", boxShadow: "0 8px 24px rgba(0,0,0,.10)" }} />
            <div style={{ marginTop: 8 }}>
              <button type="button" className="filter-chip" style={{ padding: "4px 12px" }} onClick={generate}>↻ Régénérer</button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 3. Photo + coordonnées */}
      <motion.h3 {...fade} style={{ fontFamily: "var(--font-display)" }}>3. Photo d'inspiration (facultatif)</motion.h3>
      <div style={{ marginBottom: 18 }}>
        <PhotoUpload value={photo} onChange={setPhoto} productSlug="sur-mesure" />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" style={{ flex: 1, minWidth: 160, padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Votre e-mail *" style={{ flex: 1, minWidth: 160, padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }} />
      </div>

      <motion.button type="button" className="btn btn-gold" whileTap={{ scale: 0.97 }} style={{ padding: "12px 28px", fontSize: "1rem" }} onClick={submit} disabled={sending}>
        {sending ? "Envoi…" : "Envoyer ma demande"}
      </motion.button>
    </div>
  );
}
