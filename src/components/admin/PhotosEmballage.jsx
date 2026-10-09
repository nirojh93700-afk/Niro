"use client";

// Photo(s) de l'emballage commandé, sur les fiches de travail (09/10/2026) : le gérant ne
// savait pas reconnaître « Boîte cadeau (+5.90 €) ». Les photos viennent de la bibliothèque
// de Gestion → Packaging (rien à ressaisir) ; liaison commande ↔ emballage dans
// `emballagesDuDetail` (src/lib/optionsVendues.js). Silencieux si la bibliothèque ou la photo manque.
import { useEffect, useState } from "react";
import { emballagesDuDetail } from "@/lib/optionsVendues";

let promesse = null;
function chargerBibliotheque() {
  if (!promesse) {
    let key = "";
    try { key = sessionStorage.getItem("niv-admin-key") || ""; } catch { /* sans clé : pas de photo */ }
    promesse = fetch("/api/admin/settings", { headers: { "x-admin-key": key } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const s = j?.settings || j; return Array.isArray(s?.packaging) ? s.packaging : []; })
      .catch(() => []);
    promesse.then((l) => { if (!l.length) promesse = null; }); // vide = on réessaiera au prochain affichage
  }
  return promesse;
}

export default function PhotosEmballage({ detail, petit = false }) {
  const [lib, setLib] = useState(null);
  useEffect(() => {
    let vivant = true;
    chargerBibliotheque().then((l) => { if (vivant) setLib(l); });
    return () => { vivant = false; };
  }, []);
  if (!lib || !lib.length) return null;
  const vus = new Set();
  const fiches = [];
  for (const t of emballagesDuDetail(detail, lib)) {
    for (const e of t.emballage ? [t.emballage] : t.candidats) {
      if (e?.photo && !vus.has(e.id)) { vus.add(e.id); fiches.push(e); }
    }
  }
  if (!fiches.length) return null;
  return (
    <span className={`ov-emb${petit ? " petit" : ""}`}>
      {fiches.map((e) => (
        <figure key={e.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.photo} alt={e.name} loading="eager" />
          <figcaption><b>{e.name}</b>{e.desc || ""}</figcaption>
        </figure>
      ))}
    </span>
  );
}
