"use client";

// =============================================================================
// PAGE ATELIER — VERRES GRAVÉS (réservée à l'admin)
// -----------------------------------------------------------------------------
// Page DÉDIÉE et isolée : regroupe UNIQUEMENT les commandes de verres gravés.
// Pour chaque commande, on voit le visuel EXACT préparé par le client
// (verre + gravure placée), tous ses réglages (taille en cm, position, textes,
// police, motif, emplacement) et on télécharge le fichier prêt à graver
// (PNG / SVG vectoriel / PDF à l'échelle réelle en mm).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";

// Un article est un « verre gravé » si son produit est dans la catégorie verres
// (ou, à défaut, si son identifiant commence par « verre »).
function isGlass(slug) {
  const p = getProductBySlug(slug);
  if (p) return p.category === "verres";
  return typeof slug === "string" && slug.startsWith("verre");
}

// Réglages de gravure (zone réelle en mm) pour un côté donné.
function sideConfig(item, side) {
  const p = getProductBySlug(item.slug);
  if (!p) return null;
  const cfg = side === "fond" ? p.engraveFond : p.engrave;
  if (!cfg || !cfg.box) return null;
  const src = side === "fond" ? item.artworkImageFond : item.artworkImage;
  const preview = side === "fond" ? item.previewImageFond : item.previewImage;
  return {
    box: cfg.box,
    widthMm: cfg.widthMm || 60,
    heightMm: cfg.heightMm || cfg.widthMm || 60,
    src: src || null,
    preview: preview || null,
  };
}

// Quels côtés montrer pour un article (face / fond).
function sidesOf(item) {
  const s = [];
  if (item.previewImage || item.artworkImage || item.emplacement !== "fond") s.push("face");
  if (item.previewImageFond || item.artworkImageFond || item.emplacement === "fond" || item.deuxEmplacement) {
    if (!s.includes("fond")) s.push("fond");
  }
  return s.length ? s : ["face"];
}

function loadImg(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

// Recadre la capture (gravure seule) sur la zone réellement gravable.
async function cropToBox(src, box) {
  const im = await loadImg(src);
  const nw = im.naturalWidth, nh = im.naturalHeight;
  const sw = Math.max(1, Math.round(box.width * nw));
  const sh = Math.max(1, Math.round(box.height * nh));
  const c = document.createElement("canvas");
  c.width = sw; c.height = sh;
  c.getContext("2d").drawImage(im, box.left * nw, box.top * nh, box.width * nw, box.height * nh, 0, 0, sw, sh);
  return c.toDataURL("image/png");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl; a.download = filename; a.click();
}

export default function AtelierPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (adminKey) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } });
      if (!res.ok) { setError("Mot de passe incorrect."); setAuthed(false); setLoading(false); return; }
      const data = await res.json();
      sessionStorage.setItem("niv-admin-key", adminKey);
      setAuthed(true);
      setOrders((data.orders || []).filter((o) => Array.isArray(o.spec) && o.spec.some((it) => it && isGlass(it.slug))));
    } catch {
      setError("Erreur de chargement.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("niv-admin-key");
    if (saved) { setKey(saved); load(saved); }
  }, [load]);

  async function makeFile(item, side, kind) {
    const cfg = sideConfig(item, side);
    if (!cfg || !cfg.src) { alert("Fichier à graver indisponible pour cette commande (gravure non capturée)."); return; }
    const tag = `gravure-${item.slug}-${side}`;
    setBusy(`${item.slug}-${side}-${kind}`);
    try {
      if (kind === "png") {
        downloadDataUrl(await cropToBox(cfg.src, cfg.box), `${tag}.png`);
      } else if (kind === "svg") {
        const cropped = await cropToBox(cfg.src, cfg.box);
        const W = cfg.widthMm, H = cfg.heightMm;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" href="${cropped}"/></svg>`;
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${tag}.svg`);
      } else if (kind === "pdf") {
        const cropped = await cropToBox(cfg.src, cfg.box);
        const { jsPDF } = await import("jspdf");
        const W = cfg.widthMm, H = cfg.heightMm;
        const doc = new jsPDF({ unit: "mm", format: [W, H] });
        doc.addImage(cropped, "PNG", 0, 0, W, H);
        // Page de détails (réglages exacts) pour l'atelier.
        doc.addPage("a4", "portrait");
        doc.setFontSize(13);
        doc.text(`Fiche de gravure — ${item.name || "Verre"} (${side === "fond" ? "fond" : "face"})`, 14, 18);
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(`Zone gravable : ${W} × ${H} mm`, 180), 14, 28);
        doc.text(doc.splitTextToSize((item.personalization || "").replace(/ · /g, "\n"), 180), 14, 38);
        doc.save(`${tag}.pdf`);
      }
    } catch (e) {
      alert("Génération impossible : " + (e?.message || e));
    }
    setBusy("");
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 420, padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)" }}>Atelier — verres gravés</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Accès réservé.</p>
        <input type="password" placeholder="Mot de passe" value={key} onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(key)}
          style={{ width: "100%", padding: 10, margin: "10px 0", border: "1px solid var(--line)", borderRadius: 8 }} />
        <button className="btn btn-gold" onClick={() => load(key)} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Connexion…" : "Entrer"}
        </button>
        {error && <p style={{ color: "#b4452f", marginTop: 10 }}>{error}</p>}
        <p style={{ marginTop: 20 }}><Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link></p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "30px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: 0 }}>🥃 Atelier — verres gravés</h1>
        <Link href="/gestion" style={{ color: "var(--gold-dark)" }}>← Retour à la gestion</Link>
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
        {orders.length} commande{orders.length > 1 ? "s" : ""} de verre gravé. Visuel exact préparé par le client, réglages précis et fichier prêt à graver (PNG / SVG / PDF à l'échelle réelle).
      </p>

      {loading && <p>Chargement…</p>}
      {!loading && !orders.length && <p style={{ color: "var(--ink-soft)" }}>Aucune commande de verre gravé pour l'instant.</p>}

      {orders.map((o) => {
        const date = o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR") : "";
        const glassItems = (o.spec || []).filter((it) => it && isGlass(it.slug));
        return (
          <div key={o.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16, margin: "16px 0", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 12 }}>
              <strong>Commande {o.ref || o.id?.slice(-8)?.toUpperCase()}</strong>
              <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>{o.customerName || "—"}{date ? ` · ${date}` : ""}{o.status ? ` · ${o.status}` : ""}</span>
            </div>

            {glassItems.map((item, idx) => (
              <div key={idx} style={{ padding: "10px 0", borderTop: idx ? "1px dashed #e3dccb" : "none" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.name}{item.variantTitle ? ` — ${item.variantTitle}` : ""}</div>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--ink-soft)", whiteSpace: "pre-line" }}>
                  Emplacement : {item.emplacement === "fond" ? "Au fond du verre" : item.deuxEmplacement ? "Face avant + fond" : "Face avant"}
                  {item.personalization ? `\n${item.personalization}` : ""}
                </p>

                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  {sidesOf(item).map((side) => {
                    const cfg = sideConfig(item, side);
                    const preview = cfg?.preview;
                    const canFile = Boolean(cfg?.src);
                    const k = (kind) => busy === `${item.slug}-${side}-${kind}`;
                    return (
                      <div key={side} style={{ width: 240, maxWidth: "100%" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 4 }}>
                          {side === "fond" ? "Fond du verre" : "Face avant"} {cfg ? `· zone ${cfg.widthMm}×${cfg.heightMm} mm` : ""}
                        </div>
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt={`Gravure ${side} placée par le client`} style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd", background: "#111" }} />
                        ) : (
                          <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, border: "1px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: "0.8rem", textAlign: "center", padding: 8 }}>
                            Visuel non capturé<br />(commande antérieure)
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }} disabled={!canFile || Boolean(busy)} onClick={() => makeFile(item, side, "png")}>{k("png") ? "…" : "PNG"}</button>
                          <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }} disabled={!canFile || Boolean(busy)} onClick={() => makeFile(item, side, "svg")}>{k("svg") ? "…" : "SVG"}</button>
                          <button className="btn btn-gold" style={{ padding: "4px 10px", fontSize: "0.8rem" }} disabled={!canFile || Boolean(busy)} onClick={() => makeFile(item, side, "pdf")}>{k("pdf") ? "…" : "PDF"}</button>
                        </div>
                        {!canFile && <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "4px 0 0" }}>Fichier à graver dispo dès la prochaine commande.</p>}
                      </div>
                    );
                  })}
                  {item.photoSrc && (
                    <div style={{ width: 160 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 4 }}>Photo envoyée</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.photoSrc} alt="Photo du client" style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd" }} />
                      <a href={item.photoSrc} download style={{ fontSize: "0.78rem", color: "var(--gold-dark)" }}>Télécharger</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
