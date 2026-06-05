"use client";

import { useState } from "react";

// Téléversement d'un fichier 3D (.glb/.gltf) pour un produit.
// S'il y a un fichier 3D, le site l'affiche ; sinon il garde l'aperçu 3D automatique.
export default function Model3DUpload({ slug, current, adminKey, onSaved }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [err, setErr] = useState("");
  const [has, setHas] = useState(Boolean(current));

  async function saveModel(url) {
    await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "edit", slug, patch: { model3d: url } }),
    });
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-model", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d.error || "Échec de l'envoi.");
      await saveModel(d.url);
      setHas(true);
      setStatus("done");
      onSaved?.();
    } catch (e2) {
      setErr(e2.message);
      setStatus("error");
    }
  }

  async function remove() {
    await saveModel("");
    setHas(false);
    setStatus("idle");
    onSaved?.();
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
        Modèle 3D (.glb) {has ? <span style={{ color: "#256b34" }}>· présent ✓</span> : <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>· aucun (aperçu automatique utilisé)</span>}
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: "0 0 8px" }}>
        Si tu mets un fichier 3D ici, c'est lui qui s'affiche sur la fiche. Sinon, le site garde l'aperçu 3D automatique (gravure).
      </p>
      <label className="btn btn-outline" style={{ cursor: "pointer", display: "inline-block", padding: "8px 14px" }}>
        <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" hidden onChange={handleFile} />
        {status === "uploading" ? "Envoi du modèle…" : has ? "Remplacer le modèle 3D" : "Choisir un fichier 3D (.glb)"}
      </label>
      {has && (
        <button type="button" className="btn btn-outline" style={{ marginLeft: 8, padding: "8px 14px", color: "#b4452f" }} onClick={remove}>
          Retirer le modèle
        </button>
      )}
      {status === "done" && <span style={{ marginLeft: 8, fontSize: "0.82rem", color: "#256b34" }}>Enregistré ✓</span>}
      {err && <p className="char-count" style={{ color: "#b4452f", textAlign: "left" }}>{err}</p>}
    </div>
  );
}
