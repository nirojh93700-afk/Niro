"use client";
// 📷 Photos du colis (15/11/2026, maquette « Niv Admin ») : au moment d'emballer, trois photos guidées
// (contenu · boîte fermée · étiquette collée) + d'autres si besoin, prises avec l'appareil photo du téléphone
// ou choisies dans la galerie. Chaque photo garde la date, l'heure et une empreinte (sha256) posées par le serveur.
// Rangées avec la commande (order.photosColis), jamais envoyées à la cliente.
import { useRef, useState } from "react";
import { PHOTOS_COLIS, empreinteCourte } from "@/lib/photosColis";

const heure = (ts) => new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

// Réduit la photo pour qu'elle tienne sous ~900 Ko (limite d'un document de la base).
export function reduireColis(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        let dim = 1600, q = 0.82, out = "";
        for (let essai = 0; essai < 6; essai++) {
          const s = Math.min(1, dim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
          out = c.toDataURL("image/jpeg", q);
          if (out.length < 900_000) break;
          dim = Math.round(dim * 0.8); q = Math.max(0.6, q - 0.06);
        }
        resolve(out);
      };
      img.onerror = () => reject(new Error("Photo illisible"));
      img.src = r.result;
    };
    r.onerror = () => reject(new Error("Photo illisible"));
    r.readAsDataURL(file);
  });
}

export function PastillePhotosColis({ photos }) {
  const n = PHOTOS_COLIS.filter((p) => (photos || []).some((x) => x.k === p.k)).length;
  return <span className={`fq-pill${n >= 3 ? " ok" : n ? " warn" : " line"}`}>📷 {n} / 3 photos du colis{n >= 3 ? " ✓" : ""}</span>;
}

export default function PhotosColis({ order, photos, onChange, adminKey }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [voir, setVoir] = useState(null);
  const appareil = useRef(null);
  const galerie = useRef(null);
  const cible = useRef("contenu");
  const liste = photos || [];
  const cle = () => adminKey || (typeof sessionStorage !== "undefined" && sessionStorage.getItem("niv-admin-key")) || "";

  async function envoyer(file, source) {
    if (!file) return;
    const k = cible.current;
    setBusy(k); setErr("");
    try {
      const dataUrl = await reduireColis(file);
      const r = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": cle() },
        body: JSON.stringify({ id: order.id, action: "photoColis", k, dataUrl, source }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Enregistrement impossible.");
      onChange?.(j.photosColis || []);
    } catch (e) { setErr(e.message || "Envoi impossible."); }
    setBusy("");
  }
  async function retirer(ref) {
    setBusy("x"); setErr("");
    try {
      const r = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": cle() },
        body: JSON.stringify({ id: order.id, action: "photoColis", retirer: ref }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Refusé.");
      onChange?.(j.photosColis || []);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }
  const prendre = (k, source) => { cible.current = k; (source === "galerie" ? galerie : appareil).current?.click(); };

  const faites = PHOTOS_COLIS.filter((p) => liste.some((x) => x.k === p.k));
  const manquent = PHOTOS_COLIS.filter((p) => !liste.some((x) => x.k === p.k));
  const autres = liste.filter((x) => x.k === "autre");

  return (
    <div className="pc-bloc">
      <input ref={appareil} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { envoyer(e.target.files?.[0], "appareil"); e.target.value = ""; }} />
      <input ref={galerie} type="file" accept="image/*" hidden onChange={(e) => { envoyer(e.target.files?.[0], "galerie"); e.target.value = ""; }} />
      <div className="pc-grid">
        {PHOTOS_COLIS.map((p) => {
          const ph = liste.find((x) => x.k === p.k);
          return (
            <div key={p.k} className={`pc-slot${ph ? " pris" : ""}`}>
              <button type="button" className="pc-img" onClick={() => (ph ? setVoir(ph) : prendre(p.k, "appareil"))} aria-label={ph ? `Voir ${p.t}` : `Prendre ${p.t}`}>
                {ph ? <img src={`/api/img/${ph.ref}`} alt="" loading="lazy" /> : <span aria-hidden>📷</span>}
              </button>
              <b>{p.t}</b>
              <span className="pc-h">{ph ? `${heure(ph.at)} · empreinte ${empreinteCourte(ph.sha)}` : "pas encore prise"}</span>
              <button type="button" className={`fq-btn sm${ph ? "" : " pri"}`} disabled={Boolean(busy)} onClick={() => prendre(p.k, "appareil")}>{busy === p.k ? "Envoi…" : ph ? "Reprendre" : "Prendre la photo"}</button>
            </div>
          );
        })}
      </div>
      {autres.length ? <div className="pc-autres">{autres.map((a) => <button key={a.ref} type="button" className="pc-mini" onClick={() => setVoir(a)}><img src={`/api/img/${a.ref}`} alt="" loading="lazy" /></button>)}</div> : null}
      <div className="pc-more">
        <button type="button" className="fq-btn sm ghost" disabled={Boolean(busy)} onClick={() => prendre("autre", "appareil")}>{busy === "autre" ? "Envoi…" : "📷 + Autre photo"}</button>
        <button type="button" className="fq-btn sm ghost" disabled={Boolean(busy)} onClick={() => prendre(manquent[0]?.k || "autre", "galerie")}>Choisir dans la galerie</button>
      </div>
      <div className={`pc-etat${manquent.length ? "" : " ok"}`}>
        {manquent.length ? `${faites.length} photo${faites.length > 1 ? "s" : ""} sur 3 · il manque : ${manquent.map((m) => m.t.replace(/^\d · /, "").toLowerCase()).join(", ")}.` : "3 photos sur 3 · colis prouvé, prêt à expédier."}
      </div>
      {err ? <div className="pc-err">{err}</div> : null}
      {voir ? (
        <div className="pc-voir" role="dialog" aria-label="Photo du colis" onClick={() => setVoir(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={`/api/img/${voir.ref}`} alt="" />
            <figcaption>{(PHOTOS_COLIS.find((p) => p.k === voir.k)?.t || "Autre photo")} · {heure(voir.at)} · {voir.source === "galerie" ? "choisie dans la galerie" : "prise avec l'appareil photo"}<br /><span className="mono">empreinte sha256 {voir.sha}</span></figcaption>
            <div className="pc-voir-a">
              <a className="fq-btn sm" href={`/api/img/${voir.ref}`} download={`colis-${order.ref || order.id}-${voir.k}.jpg`}>Télécharger</a>
              <button type="button" className="fq-btn sm ghost" onClick={() => { retirer(voir.ref); setVoir(null); }}>Retirer cette photo</button>
              <button type="button" className="fq-btn sm" onClick={() => setVoir(null)}>✕ Fermer</button>
            </div>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
