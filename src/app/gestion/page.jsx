"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import PhotoUpload, { CLOUDINARY_READY } from "@/components/PhotoUpload";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import EngravingAdmin from "@/components/admin/EngravingAdmin";
import QuotesAdmin from "@/components/admin/QuotesAdmin";
import AppearanceAdmin from "@/components/admin/AppearanceAdmin";
import DeclarationReminder from "@/components/admin/DeclarationReminder";

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
  const [editable, setEditable] = useState([]);
  const [config, setConfig] = useState(null);
  const [firebase, setFirebase] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [tab, setTab] = useState("commandes");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");
  const [refunding, setRefunding] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testSending, setTestSending] = useState(false);

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
      setEditable(data.editable || []);
      setAuthed(true);
      sessionStorage.setItem("niv-admin-key", adminKey);
      const cfg = await fetch("/api/admin/config", { headers: { "x-admin-key": adminKey } });
      if (cfg.ok) {
        const cfgData = await cfg.json();
        setConfig(cfgData.config);
        setFirebase(cfgData.firebase || null);
      }
      const ord = await fetch("/api/admin/orders", { headers: { "x-admin-key": adminKey } });
      if (ord.ok) {
        const ordData = await ord.json();
        setOrders(ordData.orders || []);
        setOrdersReady(true);
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

  async function setOrderStatus(id, status) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      setError("Échec de la mise à jour du statut.");
    }
  }

  async function refundOrder(o) {
    if (o.status === "remboursee") return;
    const label = o.ref || o.id?.slice(-6);
    if (!window.confirm(`Rembourser entièrement la commande #${label} (${formatEuro(o.total)}) ?\nLe client sera remboursé sur sa carte. Cette action est irréversible.`)) return;
    setRefunding(o.id);
    setError("");
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du remboursement.");
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: "remboursee" } : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setRefunding("");
    }
  }

  async function sendTestEmail() {
    setTestMsg("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setTestMsg("Entre une adresse e-mail valide.");
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      setTestMsg("✓ E-mail de test envoyé ! Vérifie la boîte de réception (et les spams).");
    } catch (e) {
      setTestMsg(e.message);
    } finally {
      setTestSending(false);
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

  // ---- Calculs commandes / clientes / statistiques ----
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso || "—"; }
  };
  const ca = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const nbCmd = orders.length;
  const panierMoyen = nbCmd ? ca / nbCmd : 0;
  const aPreparer = orders.filter((o) => o.status !== "expediee").length;

  // Clientes (regroupées par e-mail)
  const clientsMap = {};
  for (const o of orders) {
    const k = (o.customerEmail || o.customerName || "—").toLowerCase();
    if (!clientsMap[k]) clientsMap[k] = { name: o.customerName || "—", email: o.customerEmail || "", phone: o.customerPhone || "", nb: 0, total: 0, last: o.createdAt };
    clientsMap[k].nb += 1;
    clientsMap[k].total += Number(o.total) || 0;
    if (o.customerPhone && !clientsMap[k].phone) clientsMap[k].phone = o.customerPhone;
  }
  const clients = Object.values(clientsMap).sort((a, b) => b.total - a.total);

  // Best-sellers (par article)
  const sellMap = {};
  for (const o of orders) {
    for (const it of o.items || []) {
      const n = it.name || "Article";
      if (!sellMap[n]) sellMap[n] = { name: n, qty: 0, total: 0 };
      sellMap[n].qty += Number(it.quantity) || 0;
      sellMap[n].total += Number(it.total) || 0;
    }
  }
  const bestSellers = Object.values(sellMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <div className="section-head" style={{ marginBottom: 20 }}>
          <span className="eyebrow">Espace gestion</span>
          <h2>Mon site</h2>
        </div>

        <DeclarationReminder />

        <div className="filters" style={{ justifyContent: "flex-start", marginBottom: 26, flexWrap: "wrap" }}>
          <button className={`filter-chip ${tab === "commandes" ? "active" : ""}`} onClick={() => setTab("commandes")}>
            Commandes{aPreparer > 0 ? ` (${aPreparer})` : ""}
          </button>
          <button className={`filter-chip ${tab === "stats" ? "active" : ""}`} onClick={() => setTab("stats")}>Statistiques</button>
          <button className={`filter-chip ${tab === "clients" ? "active" : ""}`} onClick={() => setTab("clients")}>Clientes</button>
          <button className={`filter-chip ${tab === "devis" ? "active" : ""}`} onClick={() => setTab("devis")}>Devis / Factures</button>
          <button className={`filter-chip ${tab === "produits" ? "active" : ""}`} onClick={() => setTab("produits")}>Produits</button>
          <button className={`filter-chip ${tab === "gravure" ? "active" : ""}`} onClick={() => setTab("gravure")}>Gravure</button>
          <button className={`filter-chip ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>Stock</button>
          <button className={`filter-chip ${tab === "promos" ? "active" : ""}`} onClick={() => setTab("promos")}>Promotions</button>
          <button className={`filter-chip ${tab === "photos" ? "active" : ""}`} onClick={() => setTab("photos")}>Photos</button>
          <button className={`filter-chip ${tab === "apparence" ? "active" : ""}`} onClick={() => setTab("apparence")}>Apparence</button>
          <button className={`filter-chip ${tab === "reglages" ? "active" : ""}`} onClick={() => setTab("reglages")}>Réglages</button>
        </div>

        {error && <div className="notice">{error}</div>}

        {/* ---------------- COMMANDES ---------------- */}
        {tab === "commandes" && (
          <>
            {!firebase?.connected && (
              <div className="notice">Connexion à ton application non active : les commandes ne peuvent pas être affichées. (Voir l'onglet Réglages.)</div>
            )}
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              {nbCmd} commande{nbCmd > 1 ? "s" : ""} · {aPreparer} à préparer. Marque « Expédiée » une fois envoyée.
            </p>
            {ordersReady && nbCmd === 0 && (
              <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucune commande pour le moment. Elles apparaîtront ici automatiquement après chaque vente.</p></div>
            )}
            {orders.map((o) => (
              <div key={o.id} className="admin-block">
                <div className="admin-row" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>
                    #{o.ref || o.id?.slice(-6)}{" "}
                    <span className="admin-cat">{fmtDate(o.createdAt)}</span>
                  </h3>
                  <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{formatEuro(o.total)}</span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--ink-soft)", margin: "4px 0 8px" }}>
                  <strong>{o.customerName || "—"}</strong>
                  {o.customerEmail ? <> · <a href={`mailto:${o.customerEmail}`}>{o.customerEmail}</a></> : null}
                  {o.customerPhone ? <> · {o.customerPhone}</> : null}
                  {o.shippingAddress ? (
                    <div style={{ whiteSpace: "pre-line", marginTop: 4 }}>
                      📦 {[o.shippingName, o.shippingAddress.line1, o.shippingAddress.line2, `${o.shippingAddress.postal_code || ""} ${o.shippingAddress.city || ""}`.trim(), o.shippingAddress.country].filter(Boolean).join(", ")}
                      {o.shippingMethod ? ` — ${o.shippingMethod}` : ""}
                    </div>
                  ) : null}
                </div>
                <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: "0.9rem" }}>
                  {(o.items || []).map((it, i) => (
                    <li key={i}>{it.quantity}× {it.name}{it.details ? ` — ${it.details}` : ""} ({formatEuro(it.total)})</li>
                  ))}
                </ul>
                {o.status === "remboursee" ? (
                  <div className="admin-row" style={{ gridTemplateColumns: "1fr", justifyContent: "flex-start" }}>
                    <span style={{ fontWeight: 600, color: "#8a6d3b" }}>↩ Remboursée</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: o.status === "expediee" ? "#256b34" : "#b4452f" }}>
                      {o.status === "expediee" ? "✓ Expédiée" : "● À préparer"}
                    </span>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                      onClick={() => setOrderStatus(o.id, o.status === "expediee" ? "a_preparer" : "expediee")}
                    >
                      {o.status === "expediee" ? "Remettre à préparer" : "Marquer expédiée"}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }}
                      onClick={() => refundOrder(o)}
                      disabled={refunding === o.id}
                    >
                      {refunding === o.id ? "Remboursement…" : "↩ Rembourser"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ---------------- STATISTIQUES ---------------- */}
        {tab === "stats" && (
          <>
            <div className="admin-block" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold-dark)" }}>{formatEuro(ca)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Chiffre d'affaires</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{nbCmd}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Commandes</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatEuro(panierMoyen)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Panier moyen</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{clients.length}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Clientes</div></div>
            </div>
            <div className="admin-block">
              <h3>Produits les plus vendus</h3>
              {bestSellers.length === 0 && <p style={{ color: "var(--ink-soft)", margin: 0 }}>Pas encore de ventes.</p>}
              {bestSellers.map((b) => (
                <div className="admin-row" key={b.name} style={{ gridTemplateColumns: "1fr auto auto", gap: 10 }}>
                  <span className="admin-variant">{b.name}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{b.qty} vendu{b.qty > 1 ? "s" : ""}</span>
                  <span className="admin-price">{formatEuro(b.total)}</span>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Basé sur les {nbCmd} dernières commandes enregistrées.</p>
          </>
        )}

        {/* ---------------- CLIENTES ---------------- */}
        {tab === "clients" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>{clients.length} cliente{clients.length > 1 ? "s" : ""} (classées par total dépensé).</p>
            {clients.length === 0 && (
              <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucune cliente pour le moment.</p></div>
            )}
            {clients.map((c, i) => (
              <div key={i} className="admin-block">
                <div className="admin-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <span className="admin-variant"><strong>{c.name}</strong></span>
                  <span className="admin-price">{formatEuro(c.total)}</span>
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                  {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}
                  {c.phone ? ` · ${c.phone}` : ""} · {c.nb} commande{c.nb > 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ---------------- DEVIS / FACTURES ---------------- */}
        {tab === "devis" && <QuotesAdmin adminKey={key} />}

        {/* ---------------- PRODUITS ---------------- */}
        {tab === "produits" && (
          <ProductsAdmin adminKey={key} products={editable} onReload={() => load(key)} />
        )}

        {/* ---------------- GRAVURE ---------------- */}
        {tab === "gravure" && (
          <EngravingAdmin adminKey={key} products={editable} onReload={() => load(key)} />
        )}

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

        {/* ---------------- APPARENCE ---------------- */}
        {tab === "apparence" && <AppearanceAdmin adminKey={key} />}

        {/* ---------------- RÉGLAGES ---------------- */}
        {tab === "reglages" && config && (
          <>
            <div className="admin-block" style={{ display: "grid", gap: 10, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
              <h3 style={{ margin: 0 }}>📧 Tester l'e-mail de confirmation client</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Envoie-toi (ou à un proche) le modèle d'e-mail que reçoivent les clients, pour vérifier le rendu.
              </p>
              <input
                type="email"
                placeholder="adresse@exemple.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8 }}
              />
              <button className="btn btn-gold" onClick={sendTestEmail} disabled={testSending}>
                {testSending ? "Envoi…" : "Envoyer l'e-mail de test"}
              </button>
              {testMsg && <div className="notice" style={{ margin: 0 }}>{testMsg}</div>}
            </div>

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
