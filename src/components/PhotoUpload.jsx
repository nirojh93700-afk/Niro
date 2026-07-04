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

// Compresse / redimensionne la photo dans le navigateur avant l'envoi
// (la grande majorité des photos dépassent la limite de 1 Mo du stockage).
// Max 1280 px sur le grand côté, JPEG qualité 0.82 → ~150-500 Ko, qualité OK pour la gravure.
function compressImage(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // fond blanc (PNG transparents)
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL("image/jpeg", quality)); }
        catch { resolve(r.result); }
      };
      img.onerror = reject;
      img.src = r.result;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function PhotoUpload({ value, onChange, onUpload, multiple = false, productSlug }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  // Envoie un seul fichier et renvoie son URL (Cloudinary ou base de l'atelier).
  async function uploadOne(file) {
    // Compression AVANT l'envoi (photos de téléphone souvent >5 Mo → réduites à ~300 Ko).
    let dataUrl;
    try { dataUrl = await compressImage(file); } catch { dataUrl = await readAsDataUrl(file); }
    if (CLOUDINARY_READY) {
      const fd = new FormData();
      fd.append("file", dataUrl); // Cloudinary accepte les data URI (image déjà réduite)
      fd.append("upload_preset", PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.secure_url) throw new Error("L'envoi a échoué, réessayez.");
      return data.secure_url;
    }
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, productSlug }),
    });
    const data = await res.json();
    if (!res.ok || !data.ref) throw new Error(data.error || "L'envoi a échoué, réessayez.");
    // URL réelle et affichable (servie depuis la base) — utilisable comme photo produit.
    return "/api/img/" + data.ref;
  }

  async function handleFile(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setError("Merci de choisir des images (jpg, png…).");
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`Image trop lourde (25 Mo maximum)${files.length > 1 ? " : " + f.name : ""}.`);
        return;
      }
    }
    setError("");
    setStatus("uploading");
    try {
      // Mode multiple (admin) : on envoie chaque photo puis on ajoute toutes les URLs d'un coup.
      if (multiple || onUpload) {
        const urls = [];
        for (let i = 0; i < files.length; i++) {
          if (files.length > 1) setProgress(`Envoi ${i + 1}/${files.length}…`);
          urls.push(await uploadOne(files[i]));
        }
        setProgress("");
        if (onUpload) onUpload(urls);
        else if (onChange) urls.forEach((u) => onChange(u));
        setStatus("idle"); // on reste prêt pour en ajouter d'autres
        e.target.value = ""; // permet de re-sélectionner les mêmes fichiers
        return;
      }
      // Mode simple (un seul fichier) : aperçu + remplacement.
      const file = files[0];
      setPreview(await readAsDataUrl(file));
      onChange(await uploadOne(file));
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
      setProgress("");
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
          <input type="file" accept="image/*" multiple={multiple} onChange={handleFile} hidden />
          {status === "uploading"
            ? (progress || "Envoi en cours…")
            : (multiple ? "Choisir une ou plusieurs photos" : "Choisir une photo")}
        </label>
      )}
      {error && <span className="char-count" style={{ color: "#b4452f", textAlign: "left" }}>{error}</span>}
    </div>
  );
}
