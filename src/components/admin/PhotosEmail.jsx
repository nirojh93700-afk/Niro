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
      try {
        const r = await fetch(`/api/admin/gmail?action=photos&email=${encodeURIComponent(email)}`, { headers: { "x-admin-key": key } });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Lecture impossible");
        const liste = d.photos || [];
        if (!liste.length) { if (!annule) setEtat("vide"); return; }
        const out = [];
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

  const titre = titreProp || "📎 Photo envoyée par la cliente (pièce jointe de son e-mail)";
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
              {p.filename}{fmt(p.date) ? ` · reçue le ${fmt(p.date)}` : ""}
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
