"use client";

import { useRef, useState } from "react";
import { PHOTOS_MAX } from "@/lib/photosMessage";

// Bouton « Ajouter une photo (facultatif) » des messages du site (01/11/2026, maquette
// https://claude.ai/artifact/48MjaGPXc5RgmfVtqkGQYi). Page Contact, bulle « Une question ? »,
// « Faire une demande particulière » et page « Répondre ». Chaque photo est réduite dans le
// navigateur (1600 px, JPEG) puis envoyée par /api/upload dès qu'elle est choisie ;
// le formulaire n'envoie ensuite que les identifiants. Pour vider : changer la `key` du composant.

function reduire(file, maxDim = 1600, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL("image/jpeg", quality)); } catch { resolve(r.result); }
      };
      img.onerror = () => reject(new Error("Photo illisible"));
      img.src = r.result;
    };
    r.onerror = () => reject(new Error("Photo illisible"));
    r.readAsDataURL(file);
  });
}

export default function PhotosJointes({ onChange, onBusy, compact = false, productSlug = "" }) {
  const [items, setItems] = useState([]); // { k, preview, id, etat: "envoi" | "ok" }
  const [err, setErr] = useState("");
  const ref = useRef(null);
  const itemsRef = useRef([]);

  function publier(list) {
    itemsRef.current = list;
    setItems(list);
    onChange?.(list.filter((x) => x.etat === "ok").map((x) => x.id));
    onBusy?.(list.some((x) => x.etat === "envoi"));
  }
  function maj(k, patch) {
    publier(itemsRef.current.map((x) => (x.k === k ? { ...x, ...patch } : x)).filter((x) => x.etat !== "retire"));
  }

  async function choisir(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setErr("");
    let place = PHOTOS_MAX - itemsRef.current.length;
    for (const f of files) {
      if (place <= 0) { setErr(`${PHOTOS_MAX} photos au maximum.`); break; }
      if (!/^image\//.test(f.type || "") && !/\.(heic|heif|jpe?g|png|webp|gif)$/i.test(f.name || "")) { setErr("Seules les photos sont acceptées."); continue; }
      place--;
      const k = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      publier([...itemsRef.current, { k, preview: "", id: "", etat: "envoi" }]);
      try {
        const dataUrl = await reduire(f);
        maj(k, { preview: dataUrl });
        const res = await fetch("/api/upload", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, productSlug: productSlug ? `message:${productSlug}` : "message" }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d?.ref) throw new Error(d?.error || "L'envoi de la photo a échoué.");
        maj(k, { id: d.ref, etat: "ok" });
      } catch (x) {
        setErr(x?.message || "L'envoi de la photo a échoué. Réessayez.");
        maj(k, { etat: "retire" });
      }
    }
  }

  function retirer(k) { maj(k, { etat: "retire" }); }

  const plein = items.length >= PHOTOS_MAX;
  const t = compact ? 64 : 82;
  return (
    <div className="pjm">
      {!plein && (
        <button type="button" className={`pjm-add${compact ? " pjm-c" : ""}`} onClick={() => ref.current?.click()}>
          <span className="pjm-ic" aria-hidden="true">📷</span>
          <span>
            <b>Ajouter une photo</b> <i>(facultatif)</i>
            <small>Photo, logo, dessin ou capture d&apos;écran · jusqu&apos;à {PHOTOS_MAX}</small>
          </span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={choisir} />
      {items.length > 0 && (
        <div className="pjm-list">
          {items.map((x, i) => (
            <div key={x.k} className="pjm-th" style={{ width: t, height: t }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {x.preview ? <img src={x.preview} alt={`Photo ${i + 1}`} /> : null}
              {x.etat === "envoi" ? <span className="pjm-wait">Envoi…</span> : null}
              <button type="button" aria-label={`Retirer la photo ${i + 1}`} onClick={() => retirer(x.k)}>✕</button>
            </div>
          ))}
        </div>
      )}
      {err ? <div className="pjm-err">{err}</div> : null}
    </div>
  );
}
