"use client";

// =============================================================================
// PHOTOS ENVOYÉES PAR E-MAIL — pour les commandes sur devis.
// -----------------------------------------------------------------------------
// Une commande sur devis n'a pas de champ « photo » : la cliente envoie sa photo
// en pièce jointe d'un e-mail. Ce bloc va la chercher dans la boîte Gmail
// connectée au site (lecture seule) et l'affiche dans la fiche atelier, avec un
// lien pour la télécharger (demande du gérant, 23/09/2026 : « pourquoi dans la
// fiche de travail y a pas la photo qu'elle demande »).
// =============================================================================

import { useEffect, useState } from "react";

function adminKeyFrom(k) {
  if (k) return k;
  try { return sessionStorage.getItem("niv-admin-key") || ""; } catch { return ""; }
}

export default function PhotosEmail({ email, adminKey, print = false, titre: titreProp, masquerSiVide = false }) {
  const [etat, setEtat] = useState("chargement"); // chargement | ok | vide | erreur
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const key = adminKeyFrom(adminKey);
    if (!email || !key) { setEtat("vide"); return; }
    let annule = false;
    const urls = [];
    (async () => {
      // Photos jointes par la cliente sur le SITE (formulaire, « Une question ? », demande
      // particulière, page « Répondre » — 01/11/2026) : rangées dans son dossier, servies
      // par /api/img/<id>. Affichées même si la boîte mail est injoignable.
      const site = [];
      try {
        const rc = await fetch(`/api/admin/comms?email=${encodeURIComponent(email)}`, { headers: { "x-admin-key": key } });
        const dc = await rc.json();
        const vus = new Set();
        for (const m of dc.messages || []) {
          if (m.from === "nous") continue;
          for (const id of Array.isArray(m.photos) ? m.photos : []) {
            if (!/^[A-Za-z0-9_-]{8,64}$/.test(id) || vus.has(id)) continue;
            vus.add(id);
            site.push({ messageId: `site-${id}`, attachmentId: id, filename: `Photo envoyée par le site (${id.slice(0, 6)}).jpg`, date: m.at ? new Date(m.at).toISOString() : "", url: `/api/img/${id}`, site: true });
          }
        }
      } catch { /* sans dossier : on continue avec la boîte mail */ }
      try {
        const r = await fetch(`/api/admin/gmail?action=photos&email=${encodeURIComponent(email)}`, { headers: { "x-admin-key": key } });
        const d = await r.json();
        if (!r.ok) {
          if (site.length) { if (!annule) { setPhotos(site); setEtat("ok"); } return; }
          throw new Error(d.error || "Lecture impossible");
        }
        const liste = d.photos || [];
        if (!liste.length) { if (!annule) { setPhotos(site); setEtat(site.length ? "ok" : "vide"); } return; }
        const out = [...site];
        for (const p of liste) {
          const q = new URLSearchParams({ action: "attachment", msg: p.messageId, att: p.attachmentId, mime: p.mimeType || "" });
          const rb = await fetch(`/api/admin/gmail?${q}`, { headers: { "x-admin-key": key } });
          if (!rb.ok) continue;
          const url = URL.createObjectURL(await rb.blob());
          urls.push(url);
          out.push({ ...p, url });
        }
        if (annule) return;
        setPhotos(out);
        setEtat(out.length ? "ok" : "vide");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => { annule = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [email, adminKey]);

  const titre = titreProp || "📎 Photo envoyée par la cliente (par e-mail ou sur le site)";
  if (etat === "chargement") return <p data-photos-chargement="1" style={{ fontSize: "0.85rem", color: "#888", margin: "8px 0" }}>{titre} — recherche dans la boîte mail…</p>;
  // Sur PAPIER, « aucune photo » n'apprend rien à l'atelier : on ne l'imprime
  // pas (une ligne de moins à caser sur la feuille A4). À l'écran, en revanche,
  // le gérant doit savoir pourquoi il ne voit rien.
  if (etat === "erreur") return print ? null : <p style={{ fontSize: "0.85rem", color: "#b4452f", margin: "8px 0" }}>{titre} — boîte mail injoignable, ouvrez l&apos;e-mail de la cliente dans Gmail.</p>;
  if (etat === "vide") return print || masquerSiVide ? null : <p style={{ fontSize: "0.85rem", color: "#888", margin: "8px 0" }}>{titre} — aucune photo trouvée dans ses e-mails.</p>;

  const fmt = (d) => { const t = Date.parse(d); return Number.isFinite(t) ? new Date(t).toLocaleDateString("fr-FR") : ""; };
  return (
    <div style={{ margin: "10px 0" }}>
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 6 }}>{titre}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {photos.map((p) => (
          <figure key={`${p.messageId}-${p.attachmentId}`} style={{ margin: 0, width: print ? 320 : 240, maxWidth: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.filename} style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd", display: "block" }} />
            <figcaption style={{ fontSize: "0.75rem", color: "#666", marginTop: 4, overflowWrap: "anywhere" }}>
              {p.site ? "Envoyée sur le site" : p.filename}{fmt(p.date) ? ` · reçue le ${fmt(p.date)}` : ""}
              {!print && (
                <> · <a href={p.url} download={p.filename} style={{ color: "var(--gold-dark)" }}>Télécharger</a></>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
