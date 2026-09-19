"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatEuro } from "@/lib/format";

const KEY = "niv-wishlist";

// =============================================================================
// MES FAVORIS
// -----------------------------------------------------------------------------
// Connectée : la liste vient de son COMPTE (GET /api/favoris) → elle la retrouve
// sur tous ses appareils, et les prix sont relus dans le catalogue en direct.
// Pas connectée : la liste vient du NAVIGATEUR, exactement comme avant.
//
// LE POINT IMPORTANT — la fusion. Une visiteuse met des ♡ sans être connectée
// (personne ne se connecte AVANT de mettre un cœur). Le jour où elle se
// connecte, ses favoris du navigateur remontent dans son compte au lieu d'être
// perdus : c'est le POST { action:"merge" } ci-dessous. Rien n'est supprimé, on
// n'ajoute que ce qui manque.
// =============================================================================
export default function FavorisPage() {
  const [items, setItems] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [ajoutes, setAjoutes] = useState(0);
  const [watch, setWatch] = useState({}); // { slug: true } — « prévenez-moi si le prix baisse »

  useEffect(() => {
    let annule = false;

    function lireLocal() {
      try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
    }
    function ecrireLocal(liste) {
      try {
        localStorage.setItem(KEY, JSON.stringify(liste));
        window.dispatchEvent(new Event("niv-wishlist-change"));
      } catch { /* ignore */ }
    }

    (async () => {
      const local = lireLocal();
      if (!annule) setItems(local); // affichage immédiat, sans attendre le serveur

      let rep = null;
      try {
        rep = await (await fetch("/api/favoris", { cache: "no-store" })).json();
      } catch { /* hors ligne : on garde le navigateur */ }
      if (annule || !rep) return;

      if (!rep.loggedIn) { setLoggedIn(false); return; }
      setLoggedIn(true);
      setWatch(rep.watch || {});

      // Des favoris du navigateur manquent dans le compte ? On les y range.
      const manquants = local.map((x) => x.slug).filter((s) => !(rep.slugs || []).includes(s));
      if (manquants.length) {
        try {
          const f = await (await fetch("/api/favoris", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "merge", slugs: local.map((x) => x.slug) }),
          })).json();
          if (!annule && f?.items) { rep = f; setAjoutes(f.ajoutes || 0); }
        } catch { /* on garde ce que le serveur avait déjà renvoyé */ }
      }

      if (annule) return;
      setItems(rep.items || []);
      // Le navigateur reflète le compte → le ♡ reste allumé partout sur le site.
      ecrireLocal((rep.items || []).map((p) => ({ slug: p.slug, name: p.name, image: p.image, price: p.price })));
    })();

    return () => { annule = true; };
  }, []);

  function remove(slug) {
    const next = (items || []).filter((x) => x.slug !== slug);
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.map((p) => ({ slug: p.slug, name: p.name, image: p.image, price: p.price }))));
      window.dispatchEvent(new Event("niv-wishlist-change"));
    } catch { /* ignore */ }
    if (loggedIn) {
      fetch("/api/favoris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", slug }),
      }).catch(() => {});
    }
  }

  // La cloche « prévenez-moi si le prix baisse » — compte connecté uniquement
  // (l'e-mail vient de la session signée, le prix de référence est relevé côté
  // serveur). L'affichage bascule tout de suite, l'appel part derrière.
  function toggleWatch(slug) {
    const on = !watch[slug];
    setWatch((w) => ({ ...w, [slug]: on }));
    fetch("/api/favoris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "watch", slug, on }),
    }).then((r) => { if (!r.ok) setWatch((w) => ({ ...w, [slug]: !on })); })
      .catch(() => setWatch((w) => ({ ...w, [slug]: !on })));
  }

  if (items === null) return <div className="container" style={{ padding: 40 }}><p>Chargement…</p></div>;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Mes favoris</span>
          <h2>Vos coups de cœur ♥</h2>
        </div>

        {ajoutes > 0 && (
          <p className="fav-note fav-note-ok">
            ✓ <strong>{ajoutes === 1 ? "1 favori a été ajouté" : `${ajoutes} favoris ont été ajoutés`} à votre compte.</strong>{" "}
            {ajoutes === 1 ? "Il était enregistré" : "Ils étaient enregistrés"} sur cet appareil.
          </p>
        )}

        {loggedIn ? (
          <p className="fav-note fav-note-ok">
            ☁️ <strong>Vos favoris sont enregistrés dans votre compte.</strong> Vous les retrouverez sur
            votre téléphone comme sur votre ordinateur, même après avoir changé d'appareil.
          </p>
        ) : items.length > 0 ? (
          <div className="fav-note">
            <strong>Vos favoris ne sont enregistrés que sur cet appareil.</strong><br />
            Connectez-vous et nous les rangeons dans votre compte : vous les retrouverez partout.
            <div className="fav-actions">
              <Link href="/espace" className="btn btn-gold">Me connecter</Link>
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--ink-soft)" }}>Vous n'avez pas encore de favoris. Touchez le ♡ sur un produit pour l'ajouter ici.</p>
            <Link href="/boutique" className="btn btn-gold">Découvrir la boutique</Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((p) => (
              <div key={p.slug} className="product-card" style={{ position: "relative" }}>
                <Link href={`/produit/${p.slug}`} className="product-thumb" style={{ display: "block" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="placeholder">Niv</div>}
                </Link>
                <div className="product-body">
                  <h3><Link href={`/produit/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</Link></h3>
                  <div className="product-price">{typeof p.price === "number" ? formatEuro(p.price) : ""}</div>
                  {loggedIn ? (
                    <label className="fav-cloche">
                      <input type="checkbox" checked={!!watch[p.slug]} onChange={() => toggleWatch(p.slug)} />
                      <span>Prévenez-moi si le prix baisse</span>
                    </label>
                  ) : null}
                  <button className="btn btn-outline" style={{ marginTop: 8, padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => remove(p.slug)}>Retirer ♥</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
