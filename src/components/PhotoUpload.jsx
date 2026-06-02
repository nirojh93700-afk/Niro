"use client";

import { useState } from "react";

// Upload de photo via Cloudinary (envoi direct, non signé).
// Nécessite, côté hébergeur, les variables :
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET   (preset "unsigned")
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
export const CLOUDINARY_READY = Boolean(CLOUD && PRESET);

export default function PhotoUpload({ value, onChange }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Merci de choisir une image (jpg, png…).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image trop lourde (10 Mo maximum).");
      return;
    }
    setError("");
    setStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message || "L'envoi a échoué, réessayez.");
      }
      onChange(data.secure_url);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="photo-upload">
      {value ? (
        <div className="photo-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Photo à graver" />
          <button type="button" onClick={() => onChange("")} className="photo-remove">
            Changer de photo
          </button>
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
