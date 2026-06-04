"use client";

import { useState } from "react";

// Upload de photo : via Cloudinary si configuré, sinon via /api/upload
// (stockage dans la base Firebase de l'atelier). Aperçu local immédiat.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
export const CLOUDINARY_READY = Boolean(CLOUD && PRESET);
// L'upload est possible si Cloudinary OU le stockage Firebase est dispo.
// (On tente toujours : /api/upload répond proprement si non configuré.)
export const UPLOAD_AVAILABLE = true;

function readAsDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function PhotoUpload({ value, onChange, productSlug }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Merci de choisir une image (jpg, png…).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (5 Mo maximum).");
      return;
    }
    setError("");
    setStatus("uploading");
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);
      if (CLOUDINARY_READY) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.secure_url) throw new Error("L'envoi a échoué, réessayez.");
        onChange(data.secure_url);
      } else {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, productSlug }),
        });
        const data = await res.json();
        if (!res.ok || !data.ref) throw new Error(data.error || "L'envoi a échoué, réessayez.");
        // URL réelle et affichable (servie depuis la base) — utilisable comme photo produit.
        onChange("/api/img/" + data.ref);
      }
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="photo-upload">
      {preview || value ? (
        <div className="photo-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview || value} alt="Photo à graver" />
          <div>
            <div style={{ fontSize: "0.8rem", color: status === "done" ? "#256b34" : "var(--ink-soft)" }}>
              {status === "uploading" ? "Envoi en cours…" : "✓ Photo reçue"}
            </div>
            <button type="button" onClick={() => { setPreview(""); onChange(""); setStatus("idle"); }} className="photo-remove">
              Changer de photo
            </button>
          </div>
        </div>
      ) : (
        <label className="photo-dropzone">
          <input type="file" accept="image/*" onChange={handleFile} hidden />
          {status === "uploading" ? "Envoi en cours…" : "Choisir une photo"}
        </label>
      )}
      {error && <span className="char-count" style={{ color: "#b4452f", textAlign: "left" }}>{error}</span>}
    </div>
  );
}
