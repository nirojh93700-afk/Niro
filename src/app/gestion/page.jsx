"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import PhotoUpload, { CLOUDINARY_READY } from "@/components/PhotoUpload";

const CONFIG_LABELS = {
  stripe: "Paiement Stripe (clé secrète)",
  stripeWebhook: "Webhook Stripe (e-mail commande + stock)",
  email: "E-mails Resend (contact + commandes)",
  contactEmail: "Adresse e-mail de réception",
  photoUpload: "Téléversement de photos (Cloudinary)",
  siteUrl: "Adresse du site",
};

export default function GestionPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [config, setConfig] = useState(null);
  const [firebase, setFirebase] = useState(null);
  const [tab, setTab] = useState("stock");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");

  const load = useCallback(async (adminKey) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-key": adminKey } });
      if (res.status === 401) throw new Error("Mot de passe incorrect.");
      if (!res.ok) throw new Error("Erreur de chargement.");
      const data = await res.json();
      setRows(data.rows);
      setCatalog(data.catalog || []);
      setAuthed(true);
      sessionStorage.setItem("niv-admin-key", adminKey);
      const cfg = await fetch("/api/admin/config", { headers: { "x-admin-key": adminKey } });
      if (cfg.ok) {
        const cfgData = await cfg.json();
        setConfig(cfgData.config);
        setFirebase(cfgData.firebase || null);
      }
    } catch (e) {
      setError(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const k = sessionStorage.getItem("niv-admin-key");
    if (k) {
      setKey(k);
      load(k);
    }
  }, [load]);

  async function saveStock(variantId, value) {
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ variantId, stock: value === "" ? null : value }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setSaved(variantId);
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveImages(slug, images) {
    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ slug, images }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement des photos.");
      setSaved(slug);
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  async function savePromo(variantId, value) {
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ variantId, salePrice: value === "" ? null : value }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement de la promo.");
      setSaved(variantId);
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  function updateRow(variantId, value) {
    setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, stock: value } : r)));
  }
  function updateRowPromo(variantId, value) {
    setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, salePrice: value } : r)));
  }
  function updateCatalog(slug, images) {
    setCatalog((prev) => prev.map((c) => (c.slug === slug ? { ...c, overrideImages: images } : c)));
  }

  if (!authed) {
    return (
      <div className="center-card">
        <h1>Espace gestion</h1>
        <p style={{ color: "var(--ink-soft)" }}>Réservé à Niv Création. Entrez votre mot de passe.</p>
        <div className="field" style={{ textAlign: "left", marginTop: 16 }}>
          <input type="password" placeholder="Mot de passe" value={key}
            onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(key)} />
        </div>
        {error && <div className="notice">{error}</div>}
        <button className="btn btn-gold" onClick={() => load(key)} disabled={loading}>
          {loading ? "Connexion…" : "Entrer"}
        </button>
      </div>
    );
  }

  const grouped = rows.reduce((acc, r) => {
    (acc[r.productSlug] = acc[r.productSlug] || { name: r.productName, category: r.category, items: [] }).items.push(r);
    return acc;
  }, {});
  const lowOrOut = rows.filter((r) => typeof r.stock === "number" && r.stock <= 2).length;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <div className="section-head" style={{ marginBottom: 20 }}>
          <span className="eyebrow">Espace gestion</span>
          <h2>Mon site</h2>
        </div>

        <div className="filters" style={{ justifyContent: "flex-start", marginBottom: 26 }}>
          <button className={`filter-chip ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>Stock</button>
          <button className={`filter-chip ${tab === "promos" ? "active" : ""}`} onClick={() => setTab("promos")}>Promotions</button>
          <button className={`filter-chip ${tab === "photos" ? "active" : ""}`} onClick={() => setTab("photos")}>Photos</button>
          <button className={`filter-chip ${tab === "reglages" ? "active" : ""}`} onClick={() => setTab("reglages")}>Réglages</button>
        </div>

        {error && <div className="notice">{error}</div>}

        {/* ---------------- STOCK ---------------- */}
        {tab === "stock" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              {rows.length} variantes · {lowOrOut} en stock bas ou épuisé. Vide = « non suivi ». Le stock baisse à chaque vente.
            </p>
            {Object.entries(grouped).map(([slug, g]) => (
              <div key={slug} className="admin-block">
                <h3>{g.name} <span className="admin-cat">{getCategoryLabel(g.category)}</span></h3>
                {g.items.map((r) => (
                  <div className="admin-row" key={r.variantId}>
                    <span className="admin-variant">{r.variantTitle}</span>
                    <span className="admin-price">{formatEuro(r.price)}</span>
                    <input className={`admin-stock ${typeof r.stock === "number" && r.stock === 0 ? "out" : ""}`}
                      type="number" min="0" placeholder="—" value={r.stock ?? ""}
                      onChange={(e) => updateRow(r.variantId, e.target.value === "" ? "" : Number(e.target.value))}
                      onBlur={(e) => saveStock(r.variantId, e.target.value)} />
                    <span className="admin-saved">{saved === r.variantId ? "✓" : ""}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ---------------- PROMOTIONS ---------------- */}
        {tab === "promos" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              Mets un prix promo (inférieur au prix normal) : le client verra le prix barré + la réduction. Vide = pas de promo.
            </p>
            {Object.entries(grouped).map(([slug, g]) => (
              <div key={slug} className="admin-block">
                <h3>{g.name} <span className="admin-cat">{getCategoryLabel(g.category)}</span></h3>
                {g.items.map((r) => (
                  <div className="admin-row" key={r.variantId} style={{ gridTemplateColumns: "1fr auto 100px 70px" }}>
                    <span className="admin-variant">{r.variantTitle}</span>
                    <span className="admin-price">{formatEuro(r.price)}</span>
                    <input className="admin-stock" type="number" min="0" step="0.01"
                      placeholder="Promo €" value={r.salePrice ?? ""}
                      onChange={(e) => updateRowPromo(r.variantId, e.target.value === "" ? "" : Number(e.target.value))}
                      onBlur={(e) => savePromo(r.variantId, e.target.value)} />
                    <span className="admin-saved">{saved === r.variantId ? "✓" : ""}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ---------------- PHOTOS ---------------- */}
        {tab === "photos" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              Ajoutez les photos de chaque produit : un lien (URL) par ligne{CLOUDINARY_READY ? ", ou téléversez une image." : "."}
            </p>
            {catalog.map((c) => {
              const current = c.overrideImages?.length ? c.overrideImages : c.baseImages;
              return (
                <div key={c.slug} className="admin-block">
                  <h3>{c.name} <span className="admin-cat">{getCategoryLabel(c.category)}</span></h3>
                  <div className="photo-thumbs">
                    {current.map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} src={u} alt="" />
                    ))}
                    {current.length === 0 && <span className="ep-empty">Aucune photo</span>}
                  </div>
                  <textarea
                    placeholder="https://… (une URL par ligne)"
                    defaultValue={(c.overrideImages || []).join("\n")}
                    onChange={(e) => updateCatalog(c.slug, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                    style={{ minHeight: 70, marginTop: 8 }}
                  />
                  {CLOUDINARY_READY && (
                    <div style={{ marginTop: 8 }}>
                      <PhotoUpload value="" onChange={(url) => {
                        const next = [...(c.overrideImages || []), url];
                        updateCatalog(c.slug, next);
                        saveImages(c.slug, next);
                      }} />
                    </div>
                  )}
                  <button className="btn btn-outline" style={{ marginTop: 10 }}
                    onClick={() => saveImages(c.slug, c.overrideImages || [])}>
                    Enregistrer les photos {saved === c.slug ? "✓" : ""}
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ---------------- RÉGLAGES ---------------- */}
        {tab === "reglages" && config && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              État de tes intégrations. Les clés secrètes se règlent dans Netlify (sécurité), elles ne sont jamais stockées ici.
            </p>
            <div className="admin-block">
              {Object.entries(CONFIG_LABELS).map(([k, label]) => (
                <div className="admin-row" key={k} style={{ gridTemplateColumns: "1fr auto" }}>
                  <span className="admin-variant">{label}</span>
                  <span style={{ fontWeight: 600, color: config[k] ? "#256b34" : "#b4452f" }}>
                    {config[k] ? "Configuré" : "À configurer"}
                  </span>
                </div>
              ))}
            </div>

            {/* Diagnostic Firebase (connexion réelle à l'appli de gestion) */}
            {firebase && (
              <div className="admin-block" style={{ marginTop: "1rem" }}>
                <div className="admin-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <span className="admin-variant">Connexion à ton application (Firebase)</span>
                  <span style={{ fontWeight: 600, color: firebase.connected ? "#256b34" : "#b4452f" }}>
                    {firebase.connected ? "Connecté ✓" : "Non connecté"}
                  </span>
                </div>
                {!firebase.connected && (
                  <div className="admin-row" style={{ gridTemplateColumns: "1fr" }}>
                    <span style={{ color: "#b4452f", fontSize: "0.85rem" }}>
                      {firebase.error}
                      {firebase.present && !firebase.parsed && " (Recolle la clé : tout le contenu du fichier .json, d'un seul bloc.)"}
                    </span>
                  </div>
                )}
                {firebase.connected && firebase.projectId && (
                  <div className="admin-row" style={{ gridTemplateColumns: "1fr" }}>
                    <span style={{ color: "#256b34", fontSize: "0.85rem" }}>Projet : {firebase.projectId}</span>
                  </div>
                )}
              </div>
            )}

            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
              Pour configurer une clé manquante : Netlify → Site configuration → Environment variables (voir le guide DEPLOIEMENT.md).
            </p>
          </>
        )}
      </div>
    </section>
  );
}
