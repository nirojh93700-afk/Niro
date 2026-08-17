"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/format";
import { getCategoryLabel } from "@/lib/products";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import TaxonomyAdmin from "@/components/admin/TaxonomyAdmin";
import AssistantAdmin from "@/components/admin/AssistantAdmin";
import EngravingAdmin from "@/components/admin/EngravingAdmin";
import QuotesAdmin from "@/components/admin/QuotesAdmin";
import AppearanceAdmin from "@/components/admin/AppearanceAdmin";
import ShippingAdmin from "@/components/admin/ShippingAdmin";
import BoxtalKeys from "@/components/admin/BoxtalKeys";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
import PromoCodesAdmin from "@/components/admin/PromoCodesAdmin";
import NewsletterAdmin from "@/components/admin/NewsletterAdmin";
import DeclarationReminder from "@/components/admin/DeclarationReminder";
import BatThread from "@/components/admin/BatThread";
import FicheAtelier from "@/components/admin/FicheAtelier";
import FichePapier from "@/components/admin/FichePapier";

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
  const [editable, setEditable] = useState([]);
  const [config, setConfig] = useState(null);
  const [firebase, setFirebase] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [tab, setTab] = useState("accueil");
  const [menuOpen, setMenuOpen] = useState(false); // menu déroulant mobile
  // Ouvre le bon onglet quand on arrive depuis la barre latérale d'une sous-page
  // (lien /gestion#produits, #commandes…). Se met à jour aussi si le hash change.
  useEffect(() => {
    const applyHash = () => {
      const h = (typeof window !== "undefined" ? window.location.hash : "").replace("#", "").trim();
      if (h) setTab(h);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
  const [batOpen, setBatOpen] = useState(null); // id de commande dont la discussion/BAT est ouverte
  const [batUnread, setBatUnread] = useState([]); // ids de commandes avec une réponse cliente non lue
  const [pendingReviews, setPendingReviews] = useState(0); // nouveaux avis clients à valider
  const [ficheOpen, setFicheOpen] = useState(null); // id de commande dont la fiche atelier est ouverte
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");
  const [refunding, setRefunding] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [openClient, setOpenClient] = useState(-1);
  const [bulkPct, setBulkPct] = useState(20);
  const [statYear, setStatYear] = useState(new Date().getFullYear());
  const [crmSearch, setCrmSearch] = useState("");
  const [siteSettings, setSiteSettings] = useState({ salesGoal: 0, crmNotes: {}, ventesExternes: [] });
  const [goalInput, setGoalInput] = useState("");
  const [veMontant, setVeMontant] = useState("");
  const [veSource, setVeSource] = useState("Etsy");
  const [noteDraft, setNoteDraft] = useState({});
  const [mailOpen, setMailOpen] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailMsg, setMailMsg] = useState("");
  const [mailSending, setMailSending] = useState(false);
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
      const stg = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
      if (stg.ok) {
        const s = (await stg.json()).settings || {};
        setSiteSettings({ salesGoal: s.salesGoal || 0, crmNotes: s.crmNotes || {}, ventesExternes: Array.isArray(s.ventesExternes) ? s.ventesExternes : [] });
        setGoalInput(String(s.salesGoal || ""));
      }
      // Compteur d'avis à valider (nouveaux avis clients en attente).
      const rev = await fetch("/api/admin/reviews", { headers: { "x-admin-key": adminKey } });
      if (rev.ok) {
        const rd = await rev.json();
        setPendingReviews((rd.reviews || []).filter((r) => !r.approved).length);
      }
    } catch (e) {
      setError(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérifie les nouvelles réponses des clientes (lien + e-mail Gmail) et
  // récupère la liste des commandes « non lues » pour les pastilles.
  const loadBatUnread = useCallback(async (adminKey) => {
    try {
      const res = await fetch("/api/admin/bat?action=unread", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setBatUnread((await res.json()).unread || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const k = sessionStorage.getItem("niv-admin-key");
    if (k) {
      setKey(k);
      load(k);
    }
  }, [load]);

  // Au chargement (une fois connectée) : vérifie les réponses non lues.
  useEffect(() => {
    if (authed && key) loadBatUnread(key);
  }, [authed, key, loadBatUnread]);

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

  async function applyCategoryPromo(category, percent) {
    const label = getCategoryLabel(category);
    if (percent > 0) {
      if (!window.confirm(`Appliquer une remise de ${percent}% sur tous les « ${label} » ?\nLes clientes paieront réellement ${percent}% de moins que le prix affiché.`)) return;
    } else {
      if (!window.confirm(`Retirer toutes les promos sur les « ${label} » ?`)) return;
    }
    setError("");
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ action: "bulk", category, percent }),
      });
      if (!res.ok) throw new Error("Échec de l'application de la remise.");
      await load(key);
      setSaved("bulk-" + category);
      setTimeout(() => setSaved(""), 2000);
    } catch (e) {
      setError(e.message);
    }
  }

  async function setOrderStatus(id, status, extra = {}) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status, ...(extra.tracking != null ? { tracking: extra.tracking } : {}) } : o)));
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id, status, ...extra }),
      });
      const d = await res.json().catch(() => ({}));
      if (extra.notifyCustomer && !d.emailed) {
        setError("Statut mis à jour, mais l'e-mail au client n'a pas pu être envoyé (vérifie l'e-mail Resend dans Réglages).");
      }
    } catch (e) {
      setError("Échec de la mise à jour du statut.");
    }
  }

  // Envoyer MAINTENANT la demande d'avis au client (bouton, à la demande).
  async function askReview(o) {
    if (!o.customerEmail) { setError("Cette commande n'a pas d'e-mail client."); return; }
    if (!window.confirm(`Envoyer la demande d'avis à ${o.customerName || o.customerEmail} maintenant ?`)) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id, action: "review" }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) setError(`✓ Demande d'avis envoyée à ${o.customerEmail}.`);
      else setError(d.error || "L'e-mail n'a pas pu être envoyé (Gmail/Resend).");
    } catch { setError("Échec de l'envoi de la demande d'avis."); }
  }

  // Marquer expédiée : demande le n° de suivi (optionnel) et propose de prévenir la cliente.
  async function shipOrder(o) {
    const input = window.prompt("Numéro de suivi du colis (laisse vide si tu n'en as pas encore) :", o.tracking || "");
    if (input === null) return; // annulé
    const tracking = input.trim();
    let notifyCustomer = false;
    if (tracking && o.customerEmail) {
      notifyCustomer = window.confirm(`Envoyer un e-mail à ${o.customerEmail} avec le numéro de suivi ?`);
    }
    await setOrderStatus(o.id, "expediee", { tracking, notifyCustomer });
  }

  // Une commande est "verrouillée" (non remboursable / non annulable) dès qu'elle
  // est en gravure / expédiée / livrée, OU passé 24 h après la commande.
  function isLocked(o) {
    if (o.immediateStart) return true; // la cliente a demandé la fabrication immédiate
    if (["en_gravure", "expediee", "livree", "remise_main_propre"].includes(o.status)) return true;
    const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    return t > 0 && Date.now() - t > 24 * 3600 * 1000;
  }

  // Statut de remboursement AUTOMATIQUE selon le délai + l'état de fabrication.
  // Règle : 0-24 h = remboursement intégral · au-delà de 24 h (avant fabrication)
  // = remboursement partiel (retenue de 10 €) · dès la fabrication = plus de remboursement.
  function refundStatus(o) {
    const st = o.status || "a_preparer";
    if (st === "remboursee") return { txt: "Déjà remboursée", bg: "#eee", color: "#555" };
    if (st === "annulee") return { txt: "Commande annulée", bg: "#eee", color: "#555" };
    const started = o.immediateStart || ["en_gravure", "expediee", "livree"].includes(st);
    if (started) return { txt: "Remboursement : NON — fabrication lancée (produit personnalisé)", bg: "#fdecea", color: "#b3261e" };
    const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    const ageH = t ? (Date.now() - t) / 3600000 : 999;
    if (ageH <= 24) {
      const remMin = Math.max(0, Math.round(24 * 60 - ageH * 60));
      const h = Math.floor(remMin / 60), m = remMin % 60;
      const left = h > 0 ? `${h} h ${m} min` : `${m} min`;
      return { txt: `Remboursement : INTÉGRAL possible (encore ${left} sur les 24 h)`, bg: "#e7f5ea", color: "#256b34" };
    }
    return { txt: "Remboursement : PARTIEL (retenue de 10 €) — délai 24 h dépassé, tant que la fabrication n'est pas lancée", bg: "#fbf4e6", color: "#8a6d3b" };
  }

  async function refundOrder(o) {
    if (o.status === "remboursee") return;
    const label = o.ref || o.id?.slice(-6);
    const warn = isLocked(o)
      ? "⚠️ Cette commande est en fabrication ou dépasse 24 h : un produit personnalisé n'est normalement PAS remboursable.\n\n"
      : "";
    if (!window.confirm(`${warn}Rembourser entièrement la commande #${label} (${formatEuro(o.total)}) ?\nLe client sera remboursé sur sa carte. Cette action est irréversible.`)) return;
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

  async function cancelOrder(o) {
    const label = o.ref || o.id?.slice(-6);
    const warn = isLocked(o)
      ? "⚠️ Cette commande est en fabrication ou dépasse 24 h : normalement elle n'est plus annulable côté cliente.\n\n"
      : "";
    if (!window.confirm(`${warn}Annuler la commande #${label} ?\nElle ne comptera plus dans le chiffre d'affaires. (Aucun remboursement n'est effectué — utilise « Rembourser » pour ça.)`)) return;
    let notifyCustomer = false;
    if (o.customerEmail) {
      notifyCustomer = window.confirm(`Envoyer un e-mail à ${o.customerEmail} pour la prévenir de l'annulation ?`);
    }
    await setOrderStatus(o.id, "annulee", { notifyCustomer });
  }

  async function deleteOrder(o) {
    const label = o.ref || o.id?.slice(-6);
    if (!window.confirm(`Supprimer définitivement la commande #${label} ?\nÀ utiliser surtout pour les commandes de test. Cette action est irréversible.`)) return;
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    try {
      await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id }),
      });
    } catch (e) {
      setError("Échec de la suppression.");
    }
  }

  async function toggleTestOrder(o) {
    const test = !o.test;
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, test } : x)));
    try {
      await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: o.id, test }),
      });
    } catch (e) {
      setError("Échec de la mise à jour (test).");
    }
  }

  async function deleteAllTests() {
    const tests = orders.filter((o) => o.test);
    if (tests.length === 0) { setError("Aucune commande marquée « test » à supprimer."); return; }
    if (!window.confirm(`Supprimer définitivement les ${tests.length} commande(s) marquée(s) « test » ?`)) return;
    setOrders((prev) => prev.filter((o) => !o.test));
    for (const o of tests) {
      try {
        await fetch("/api/admin/orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-admin-key": key },
          body: JSON.stringify({ id: o.id }),
        });
      } catch { /* ignore */ }
    }
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map((r) => r.map((cell) => {
      const s = String(cell ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSettingsPatch(patch, label) {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      const s = (await res.json()).settings || {};
      setSiteSettings({ salesGoal: s.salesGoal || 0, crmNotes: s.crmNotes || {}, ventesExternes: Array.isArray(s.ventesExternes) ? s.ventesExternes : [] });
      setSaved(label || "settings");
      setTimeout(() => setSaved(""), 1500);
    } catch (e) {
      setError(e.message);
    }
  }

  function saveGoal() {
    saveSettingsPatch({ salesGoal: Number(goalInput) || 0 }, "goal");
  }
  // Ventes hors site (Etsy, main propre…) : ajout / suppression pour le mois à déclarer.
  function addVenteExterne(moisKey) {
    const montant = Number(String(veMontant).replace(",", "."));
    if (!Number.isFinite(montant) || montant <= 0) { setError("Entrez un montant valide."); return; }
    const list = [...(siteSettings.ventesExternes || []), { id: String(Date.now()), mois: moisKey, montant: Math.round(montant * 100) / 100, source: veSource || "Autre" }];
    setVeMontant("");
    saveSettingsPatch({ ventesExternes: list }, "vente-ext");
  }
  function removeVenteExterne(id) {
    const list = (siteSettings.ventesExternes || []).filter((v) => v.id !== id);
    saveSettingsPatch({ ventesExternes: list }, "vente-ext");
  }

  function saveNote(emailKey) {
    const notes = { ...(siteSettings.crmNotes || {}) };
    const val = (noteDraft[emailKey] ?? notes[emailKey] ?? "").trim();
    if (val) notes[emailKey] = val; else delete notes[emailKey];
    saveSettingsPatch({ crmNotes: notes }, "note-" + emailKey);
  }

  async function sendClientEmail(to) {
    setMailMsg("");
    if (!mailSubject.trim() || !mailBody.trim()) { setMailMsg("Sujet et message obligatoires."); return; }
    setMailSending(true);
    try {
      const res = await fetch("/api/admin/send-client-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ to, subject: mailSubject, message: mailBody }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Échec.");
      setMailMsg("✓ E-mail envoyé à " + to);
      setMailSubject(""); setMailBody("");
      setTimeout(() => { setMailOpen(""); setMailMsg(""); }, 1500);
    } catch (e) { setMailMsg(e.message); }
    finally { setMailSending(false); }
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

  function updateRow(stockId, value) {
    // le stock est partagé par couleur : on met à jour toutes les variantes du même stockId
    setRows((prev) => prev.map((r) => ((r.stockId || r.variantId) === stockId ? { ...r, stock: value } : r)));
  }
  function updateRowPromo(variantId, value) {
    setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, salePrice: value } : r)));
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
  // Catégories réellement présentes (pour les boutons de remise rapide, mis à jour tout seuls).
  const promoCats = [...new Set(Object.values(grouped).map((g) => g.category).filter(Boolean))];
  const lowOrOut = rows.filter((r) => typeof r.stock === "number" && r.stock <= 2).length;
  // Photo par produit (pour l'onglet Stock).
  const imgBySlug = {};
  editable.forEach((e) => { imgBySlug[e.slug] = (e.overrideImages && e.overrideImages[0]) || e.image || (e.images && e.images[0]) || ""; });
  // Les options suivies en stock (socles LED) ne sont pas des produits du
  // catalogue : leur photo est portée par la ligne elle-même.
  rows.forEach((r) => { if (r.image && !imgBySlug[r.productSlug]) imgBySlug[r.productSlug] = r.image; });

  // Photo d'un produit commandé. Les commandes récentes enregistrent la photo
  // avec la ligne ; pour les ANCIENNES, on la retrouve dans le catalogue grâce à
  // l'identifiant du produit (aucune donnée à reprendre).
  const photoProduit = (slug) => (slug ? imgBySlug[slug] || "" : "");

  // Aperçu de ce que la cliente a demandé (photo qu'elle a envoyée ou rendu de
  // la gravure), quand il existe — cristaux, gobelet, gravure photo…
  const apercuAtelier = (spec, slug, index) => {
    if (!Array.isArray(spec) || !spec.length) return "";
    const s = spec.find((x) => x && x.slug === slug) || spec[index] || null;
    if (!s) return "";
    return s.previewImage || s.artworkImage || s.photoSrc || s.previewImageFond || "";
  };

  // Couleur / modèle commandé (Argent, Doré, Moyen…). Il était noyé au début de
  // la ligne de détails : on le sort en évidence pour ne pas graver la mauvaise
  // version. Repli sur le 1er élément des détails (toujours le nom de l'option).
  const couleurArticle = (spec, it, index) => {
    const s = Array.isArray(spec) ? (spec.find((x) => x && x.slug === it.slug) || spec[index]) : null;
    if (s?.variantTitle) return s.variantTitle;
    const premier = String(it.details || "").split(" — ")[0].trim();
    return premier && !premier.startsWith("Personnalisation") && !premier.startsWith("Emballage") ? premier : "";
  };

  // Détails SANS la couleur (déjà affichée à part) pour éviter de la répéter.
  const detailsSansCouleur = (it, couleur) => {
    const d = String(it.details || "");
    return couleur && d.startsWith(couleur) ? d.slice(couleur.length).replace(/^\s*—\s*/, "") : d;
  };

  // Stock prêt à afficher PAR PRODUIT (pour la page fusionnée Produits & Stock).
  // Reprend EXACTEMENT la logique de l'onglet Stock (un champ par stockId, libellé
  // commun pour les variantes partagées) → aucun changement de comportement.
  const stockBySlug = {};
  for (const [slug, g] of Object.entries(grouped)) {
    const counts = {};
    g.items.forEach((r) => { const k = r.stockId || r.variantId; counts[k] = (counts[k] || 0) + 1; });
    const seen = new Set();
    stockBySlug[slug] = g.items
      .filter((r) => { const k = r.stockId || r.variantId; if (seen.has(k)) return false; seen.add(k); return true; })
      .map((r) => {
        const k = r.stockId || r.variantId;
        const isGrouped = counts[k] > 1;
        let label = r.variantTitle;
        if (isGrouped) {
          const segs = g.items
            .filter((x) => (x.stockId || x.variantId) === k)
            .map((x) => (x.variantTitle || "").split("/").map((s) => s.trim()).filter(Boolean));
          const common = (segs[0] || []).filter((s) => segs.every((arr) => arr.includes(s)));
          label = common.length ? common.join(" / ") : r.variantTitle;
        }
        return { key: k, label, value: r.stock };
      });
  }

  // ---- Calculs commandes / clientes / statistiques ----
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso || "—"; }
  };
  // Les commandes remboursées, annulées ou marquées « test » ne comptent pas dans les stats.
  const validOrders = orders.filter((o) => o.status !== "remboursee" && o.status !== "annulee" && !o.test);
  const ca = validOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const nbCmd = validOrders.length;
  const nbRembourse = orders.length - validOrders.length;
  const nbTest = orders.filter((o) => o.test).length;
  const panierMoyen = nbCmd ? ca / nbCmd : 0;
  const aPreparer = orders.filter((o) => !o.test && o.status !== "expediee" && o.status !== "livree" && o.status !== "remise_main_propre" && o.status !== "remboursee" && o.status !== "annulee").length;

  // Filtre + recherche des commandes (comme sur les grandes plateformes).
  const orderQuery = orderSearch.trim().toLowerCase();
  // Repérage des doublons possibles : même cliente (e-mail) + même(s) article(s)
  // à moins de 30 jours d'intervalle. On ALERTE seulement (on ne supprime rien) :
  // un 2e paiement peut être une vraie nouvelle commande, à vérifier avant de fabriquer.
  const dupIds = (() => {
    const groups = {};
    for (const o of orders) {
      if (o.test || o.status === "annulee" || o.status === "remboursee") continue;
      const email = (o.customerEmail || "").toLowerCase().trim();
      const sig = (o.items || []).map((i) => `${(i.name || "").toLowerCase()}|${i.quantity}`).sort().join(";");
      if (!email || !sig) continue;
      (groups[email + "::" + sig] ||= []).push(o);
    }
    const ids = new Set();
    for (const arr of Object.values(groups)) {
      if (arr.length < 2) continue;
      const times = arr.map((o) => +new Date(o.createdAt || 0));
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (Math.abs(times[i] - times[j]) <= 30 * 86400000) { ids.add(arr[i].id); ids.add(arr[j].id); }
        }
      }
    }
    return ids;
  })();

  const filteredOrders = orders.filter((o) => {
    const st = o.status || "a_preparer";
    if (orderFilter === "a_preparer" && !(st === "a_preparer" || st === "en_gravure")) return false;
    if (orderFilter === "expediee" && st !== "expediee") return false;
    if (orderFilter === "livree" && st !== "livree" && st !== "remise_main_propre") return false;
    if (orderFilter === "annulee" && st !== "annulee" && st !== "remboursee") return false;
    if (orderQuery) {
      const hay = `${o.ref || ""} ${o.id || ""} ${o.customerName || ""} ${o.customerEmail || ""} ${(o.items || []).map((i) => i.name).join(" ")}`.toLowerCase();
      if (!hay.includes(orderQuery)) return false;
    }
    return true;
  });

  // Clientes (regroupées par e-mail) — hors remboursées
  const clientsMap = {};
  for (const o of validOrders) {
    const k = (o.customerEmail || o.customerName || "—").toLowerCase();
    if (!clientsMap[k]) clientsMap[k] = { name: o.customerName || "—", email: o.customerEmail || "", phone: o.customerPhone || "", nb: 0, total: 0, last: o.createdAt, orders: [] };
    clientsMap[k].nb += 1;
    clientsMap[k].total += Number(o.total) || 0;
    clientsMap[k].orders.push({ id: o.id, ref: o.ref || o.id?.slice(-6), status: o.status || "a_preparer", tracking: o.tracking || "", total: o.total, createdAt: o.createdAt });
    if (o.customerPhone && !clientsMap[k].phone) clientsMap[k].phone = o.customerPhone;
  }
  const clients = Object.values(clientsMap).sort((a, b) => b.total - a.total);

  // Best-sellers (par article) — hors remboursées
  const sellMap = {};
  for (const o of validOrders) {
    for (const it of o.items || []) {
      const n = it.name || "Article";
      if (!sellMap[n]) sellMap[n] = { name: n, qty: 0, total: 0 };
      sellMap[n].qty += Number(it.quantity) || 0;
      sellMap[n].total += Number(it.total) || 0;
    }
  }
  const bestSellers = Object.values(sellMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // ---- Tableau de bord annuel ----
  const orderYears = [...new Set(validOrders.map((o) => o.createdAt ? new Date(o.createdAt).getFullYear() : null).filter(Boolean))];
  if (!orderYears.includes(statYear)) orderYears.push(statYear);
  orderYears.sort((a, b) => b - a);
  const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const monthlyCA = Array(12).fill(0);
  const monthlyNb = Array(12).fill(0);
  let caYear = 0, nbYear = 0;
  for (const o of validOrders) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    if (d.getFullYear() !== statYear) continue;
    const m = d.getMonth();
    monthlyCA[m] += Number(o.total) || 0;
    monthlyNb[m] += 1;
    caYear += Number(o.total) || 0;
    nbYear += 1;
  }
  const maxMonthly = Math.max(1, ...monthlyCA);
  const panierYear = nbYear ? caYear / nbYear : 0;
  const bestMonthIdx = monthlyCA.indexOf(Math.max(...monthlyCA));
  // Mois en cours (année réelle)
  const now = new Date();
  const caThisMonth = validOrders.reduce((s, o) => {
    if (!o.createdAt) return s;
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? s + (Number(o.total) || 0) : s;
  }, 0);
  // CA du mois PRÉCÉDENT = montant exact à déclarer à l'URSSAF ce mois-ci
  // (chiffre d'affaires encaissé des commandes payées ; 0 s'il n'y a pas eu de vente).
  const _prevMois = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const _prevKey = `${_prevMois.getFullYear()}-${String(_prevMois.getMonth() + 1).padStart(2, "0")}`;
  const caSitePrev = validOrders.reduce((s, o) => {
    if (!o.createdAt) return s;
    const d = new Date(o.createdAt);
    return d.getFullYear() === _prevMois.getFullYear() && d.getMonth() === _prevMois.getMonth() ? s + (Number(o.total) || 0) : s;
  }, 0);
  // Ventes hors site (Etsy, main propre…) saisies pour ce mois → ajoutées au total.
  const ventesExt = Array.isArray(siteSettings.ventesExternes) ? siteSettings.ventesExternes : [];
  const caExtPrev = ventesExt.filter((v) => v.mois === _prevKey).reduce((s, v) => s + (Number(v.montant) || 0), 0);
  const caToDeclare = caSitePrev + caExtPrev;
  // Clientes : nouvelles vs récurrentes (≥ 2 commandes)
  const recurrentes = clients.filter((c) => c.nb >= 2).length;
  const nouvelles = clients.length - recurrentes;

  // ---- CRM : segments + 1ère/dernière commande ----
  const vipThreshold = 100; // total dépensé pour être "VIP"
  const crmClients = clients.map((c) => {
    const dates = (c.orders || []).map((o) => o.createdAt).filter(Boolean).sort();
    const first = dates[0] || null;
    const last = dates[dates.length - 1] || null;
    let segment = "Nouvelle";
    if (c.total >= vipThreshold || c.nb >= 4) segment = "VIP";
    else if (c.nb >= 2) segment = "Fidèle";
    return { ...c, first, last, segment };
  });
  const crmFiltered = crmClients.filter((c) => {
    const q = crmSearch.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q);
  });
  const segColors = { VIP: "#8a6d3b", "Fidèle": "#256b34", Nouvelle: "#5b6b8a" };

  // ---- Tableau de bord (accueil) : données réelles ----
  const enGravure = orders.filter((o) => !o.test && (o.status || "a_preparer") === "en_gravure").length;
  const recentOrders = [...orders]
    .filter((o) => !o.test)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
  const DASH_CHIPS = {
    a_preparer: ["prep", "À préparer"], en_gravure: ["grav", "En gravure"],
    expediee: ["exp", "Expédiée"], livree: ["liv", "Livrée"],
    remise_main_propre: ["liv", "Remise en main propre"],
    annulee: ["ann", "Annulée"], remboursee: ["ann", "Remboursée"],
  };
  const dashDate = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  // Stock des blocs cristal (partagé vertical + horizontal) pour le tableau de bord.
  const blocStockRows = [
    { key: "bloc-cristal-petit", label: "Petit" },
    { key: "bloc-cristal-moyen", label: "Moyen" },
    { key: "bloc-cristal-grand", label: "Grand" },
    { key: "bloc-cristal-xl", label: "XL" },
  ].map((b) => {
    const r = rows.find((x) => (x.stockId || x.variantId) === b.key);
    return { ...b, stock: r && typeof r.stock === "number" ? r.stock : null };
  });
  const hasBlocStock = blocStockRows.some((b) => b.stock !== null);
  const blocMax = Math.max(1, ...blocStockRows.map((b) => b.stock || 0));
  const ruptures = rows.filter((r) => typeof r.stock === "number" && r.stock === 0);
  const lowStock = rows.filter((r) => typeof r.stock === "number" && r.stock > 0 && r.stock <= 5);

  return (
    <section className="section admin-section">
      <div className="container admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="eyebrow">Espace gestion</span>
            <h2>Mon site</h2>
          </div>
          <button type="button" className="admin-side-toggle" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            <span>☰ Menu gestion</span>
            <span aria-hidden>{menuOpen ? "▲" : "▼"}</span>
          </button>
          <nav className={`admin-sidebar-nav${menuOpen ? " open" : ""}`}>
          <div className="admin-side-group">
            <button className={`admin-side-item ${tab === "accueil" ? "active" : ""}`} onClick={() => { setTab("accueil"); setMenuOpen(false); }}>🏠 Accueil</button>
          </div>
          {[
            {
              label: "Commandes",
              tabs: [
                { id: "commandes", text: `🧾 Commandes${aPreparer > 0 ? ` (${aPreparer})` : ""}` },
                { id: "atelier", text: "🥃 Atelier (à graver)", href: "/gestion/atelier" },
                { id: "devis", text: "📄 Devis / Factures" },
              ],
            },
            {
              label: "Clients & fidélité",
              tabs: [
                { id: "crm", text: "👥 CRM — clients", href: "/gestion/crm" },
                { id: "fidelite", text: "🎁 Fidélité & cashback", href: "/gestion/fidelite" },
                { id: "messages", text: "✉️ Messages (programmés + auto)", href: "/gestion/messages" },
              ],
            },
            {
              label: "Catalogue",
              tabs: [
                { id: "produits", text: "🏷️ Produits & Stock" },
                { id: "categories", text: "🗂️ Catégories & ordre" },
                { id: "packaging", text: "📦 Packaging & emballages", href: "/gestion/emballages" },
                { id: "sante", text: "🛡️ Santé du catalogue", href: "/gestion/sante" },
                { id: "tailles", text: "📐 Tailles & coûts conseillés", href: "/gestion/tailles-conseillees" },
                { id: "gravure", text: "✍️ Gravure" },
                { id: "reglages-produits", text: "⚙️ Réglages produits (cristaux, couverts)", href: "/gestion/reglages" },
              ],
            },
            {
              label: "Marketing",
              tabs: [
                { id: "promos", text: "🎟️ Promotions & ambassadeurs" },
                { id: "avis", text: "⭐ Avis" },
                { id: "newsletter", text: "📣 Newsletter" },
                { id: "etude-marche", text: "📊 Étude de marché", href: "/gestion/etude-marche" },
              ],
            },
            {
              label: "Finances & statistiques",
              tabs: [
                { id: "benefices", text: "💰 Bénéfices", href: "/gestion/benefices" },
                { id: "inventaire-compta", text: "📦 Inventaire & Compta", href: "/gestion/inventaire-compta" },
                { id: "stats", text: "📊 Statistiques (ventes)" },
                { id: "visiteurs", text: "📈 Visiteurs & trafic", href: "/gestion/statistiques" },
              ],
            },
            {
              label: "Assistant & IA",
              tabs: [
                { id: "assistant", text: "🧭 Assistant" },
                { id: "agents", text: "🤖 Équipe d'agents" },
                { id: "boite-mail", text: "📬 Boîte mail (agent)", href: "/gestion/boite-mail" },
              ],
            },
            {
              label: "Réglages",
              tabs: [
                { id: "apparence", text: "🎨 Apparence" },
                { id: "livraison", text: "🚚 Livraison (tarifs)" },
                { id: "reglages", text: "⚙️ Réglages" },
              ],
            },
          ].map((group) => (
            <div className="admin-side-group" key={group.label}>
              <span className="admin-side-label">{group.label}</span>
              {group.tabs.map((t) => (
                t.href ? (
                  <a key={t.id} href={t.href} onClick={() => setMenuOpen(false)} className="admin-side-item" style={{ textDecoration: "none" }}>
                    {t.text}
                  </a>
                ) : (
                  <button
                    key={t.id}
                    className={`admin-side-item ${tab === t.id ? "active" : ""}`}
                    onClick={() => { setTab(t.id); setMenuOpen(false); }}
                  >
                    {t.text}
                  </button>
                )
              ))}
            </div>
          ))}
          </nav>
        </aside>

        <div className="admin-content">
        <DeclarationReminder />

        {error && <div className="notice">{error}</div>}

        {/* ---------------- ACCUEIL (tableau de bord) ---------------- */}
        {tab === "accueil" && (
          <>
            {pendingReviews > 0 && (
              <div className="notice" style={{ background: "#fbf3e6", borderColor: "#e2c67e", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <span>⭐ <b>{pendingReviews} nouvel{pendingReviews > 1 ? "s" : ""} avis à valider</b> — un client a laissé un avis. Validez-le pour qu&apos;il s&apos;affiche sur le site.</span>
                <button className="btn btn-gold" style={{ padding: "6px 16px" }} onClick={() => setTab("avis")}>Voir les avis →</button>
              </div>
            )}
            <div className="dash-top">
              <div className="dash-hi">
                <h1>Bonjour 👋</h1>
                <p style={{ textTransform: "capitalize" }}>{dashDate} · voici ce qui se passe sur votre boutique.</p>
              </div>
              <div className="dash-actions">
                <button type="button" className="dash-abtn gold" onClick={() => setTab("produits")}>+ Ajouter un produit</button>
                <button type="button" className="dash-abtn" onClick={() => setTab("promos")}>🏷️ Remise rapide</button>
                <button type="button" className="dash-abtn" onClick={() => setTab("stats")}>📊 Statistiques</button>
              </div>
            </div>

            <div className="dash-tiles">
              <div className="dash-tile"><small>À préparer</small><b>{aPreparer}</b></div>
              <div className="dash-tile" style={pendingReviews > 0 ? { cursor: "pointer", outline: "2px solid #e2c67e" } : undefined} onClick={() => pendingReviews > 0 && setTab("avis")}><small>Avis à valider</small><b>{pendingReviews}</b></div>
              <div className="dash-tile"><small>CA — ce mois</small><b>{formatEuro(caThisMonth)}</b></div>
              <div className="dash-tile"><small>Commandes</small><b>{validOrders.length}</b></div>
              <div className="dash-tile"><small>Clientes</small><b>{clients.length}</b></div>
            </div>

            <div className="dash-two">
              <div className="dash-col">
                <div className="dash-panel">
                  <div className="dash-ph"><h3>Dernières commandes</h3><button type="button" onClick={() => setTab("commandes")}>Tout voir →</button></div>
                  {recentOrders.length === 0 ? (
                    <p style={{ padding: "16px 18px", color: "var(--ink-soft)", margin: 0 }}>Aucune commande pour le moment.</p>
                  ) : recentOrders.map((o) => {
                    const [cls, label] = DASH_CHIPS[o.status || "a_preparer"] || ["prep", "À préparer"];
                    const summary = (o.items || []).map((i) => i.name).filter(Boolean).slice(0, 2).join(", ") || "Commande";
                    return (
                      <div className="dash-orow" key={o.id}>
                        <span className="id">#{o.ref || o.id?.slice(-6)}</span>
                        <span>{summary}<br /><span className="who">{o.customerName || o.customerEmail || "—"}</span></span>
                        <span className="pr">{formatEuro(o.total)}</span>
                        <span className={`dash-chip ${cls}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>

                {hasBlocStock && (
                  <div className="dash-panel">
                    <div className="dash-ph"><h3>Stock — blocs cristal (partagé V + H)</h3><button type="button" onClick={() => setTab("produits")}>Gérer →</button></div>
                    {blocStockRows.map((b) => {
                      const s = b.stock;
                      const out = s === 0;
                      const low = s !== null && s > 0 && s <= 5;
                      const pct = s === null ? 0 : Math.round((s / blocMax) * 100);
                      const color = out ? "#b4452f" : low ? "#d08a2a" : "linear-gradient(90deg,#e2c67e,#a98935)";
                      return (
                        <div className="dash-stockrow" key={b.key}>
                          <span className="sl">{b.label}</span>
                          <span className="dash-bar"><i style={{ width: `${pct}%`, background: color }} /></span>
                          {s === null ? (
                            <span className="dash-sq" style={{ color: "var(--ink-soft)" }}>non suivi</span>
                          ) : out ? (
                            <span className="dash-rupt">RUPTURE</span>
                          ) : (
                            <span className={`dash-sq ${low ? "low" : ""}`}>{s} rest.</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="dash-col">
                <div className="dash-panel">
                  <div className="dash-ph"><h3>À faire</h3></div>
                  {(() => {
                    // Rappel automatique : déclaration URSSAF (mensuelle). On déclare
                    // le CA du mois PRÉCÉDENT, à faire avant la fin du mois EN COURS.
                    const now = new Date();
                    const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
                    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const periode = `${MOIS[prev.getMonth()]} ${prev.getFullYear()}`;
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const deadline = `${lastDay.getDate()} ${MOIS[lastDay.getMonth()]}`;
                    const daysLeft = Math.max(0, Math.ceil((lastDay - now) / 86400000));
                    const urgent = daysLeft <= 10;
                    const montant = formatEuro(caToDeclare);
                    return (
                      <a
                        href="https://www.autoentrepreneur.urssaf.fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dash-todo"
                        style={{ textDecoration: "none", color: "inherit", ...(urgent ? { background: "#fdeee8", boxShadow: "inset 3px 0 0 #b4452f" } : {}) }}
                      >
                        <span className="ic">🧾</span>
                        <span>
                          <b>URSSAF — à déclarer : {caToDeclare > 0 ? montant : "0 € (rien à déclarer)"}</b>
                          <small>
                            {caToDeclare > 0
                              ? `Chiffre d'affaires de ${periode} (montant encaissé). À déclarer avant le ${deadline}${daysLeft > 0 ? ` · ${daysLeft} j restants` : " · aujourd'hui !"}`
                              : `Aucune vente en ${periode} → déclarez « 0 » avant le ${deadline}${daysLeft > 0 ? ` · ${daysLeft} j restants` : ""}`}
                          </small>
                        </span>
                        <span className="go">→</span>
                      </a>
                    );
                  })()}
                  <button type="button" className="dash-todo" onClick={() => setTab("commandes")}>
                    <span className="ic">📦</span>
                    <span><b>{aPreparer} commande{aPreparer > 1 ? "s" : ""} à préparer</b><small>{aPreparer > 0 ? "Ouvrir les commandes" : "Rien en attente 🎉"}</small></span>
                    <span className="go">→</span>
                  </button>
                  <a href="/gestion/atelier" className="dash-todo" style={{ textDecoration: "none", color: "inherit" }}>
                    <span className="ic">🥃</span>
                    <span><b>Atelier — pièces à graver</b><small>Visuels &amp; fichiers à graver{enGravure > 0 ? ` · ${enGravure} en gravure` : ""}</small></span>
                    <span className="go">→</span>
                  </a>
                  <button type="button" className="dash-todo" onClick={() => setTab("avis")}>
                    <span className="ic">⭐</span>
                    <span><b>Avis clients</b><small>Valider ou masquer les avis</small></span>
                    <span className="go">→</span>
                  </button>
                  <button type="button" className="dash-todo" onClick={() => setTab("produits")}>
                    <span className="ic">📊</span>
                    <span><b>Stock</b><small>Vérifier les ruptures et réapprovisionner</small></span>
                    <span className="go">→</span>
                  </button>
                </div>

                <div className="dash-panel">
                  <div className="dash-ph"><h3>Ventes hors site (URSSAF)</h3></div>
                  <div style={{ padding: "12px 16px" }}>
                    {(() => {
                      const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
                      const label = `${MOIS[_prevMois.getMonth()]} ${_prevMois.getFullYear()}`;
                      const list = ventesExt.filter((v) => v.mois === _prevKey);
                      return (
                        <>
                          <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 10px" }}>
                            Ajoutez ici vos ventes faites <b>ailleurs que sur le site</b> (Etsy, main propre, virement…) pour le mois à déclarer (<b>{label}</b>). Elles s'ajoutent automatiquement au total URSSAF.
                          </p>
                          {list.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              {list.map((v) => (
                                <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                                  <span style={{ fontSize: "0.85rem" }}>{v.source || "Autre"}</span>
                                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <b>{formatEuro(v.montant)}</b>
                                    <button type="button" onClick={() => removeVenteExterne(v.id)} title="Supprimer" style={{ border: "none", background: "none", color: "#b4452f", cursor: "pointer", fontSize: "1rem" }}>×</button>
                                  </span>
                                </div>
                              ))}
                              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, fontWeight: 700 }}>
                                <span>Sous-total hors site</span><span>{formatEuro(caExtPrev)}</span>
                              </div>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <input value={veSource} onChange={(e) => setVeSource(e.target.value)} placeholder="Etsy, main propre…"
                              style={{ flex: "1 1 120px", minWidth: 0, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                            <input value={veMontant} onChange={(e) => setVeMontant(e.target.value)} inputMode="decimal" placeholder="Montant €"
                              style={{ width: 100, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                            <button type="button" className="dash-abtn gold" onClick={() => addVenteExterne(_prevKey)} style={{ whiteSpace: "nowrap" }}>+ Ajouter</button>
                          </div>
                          {saved === "vente-ext" && <p style={{ color: "#4d7a3a", fontSize: "0.8rem", marginTop: 8 }}>Enregistré ✓</p>}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-ph"><h3>Assistant</h3></div>
                  <div className="dash-assist">
                    {ruptures.length > 0 ? (
                      <>« <b>{ruptures.length} produit{ruptures.length > 1 ? "s" : ""} en rupture</b> — la vignette affiche automatiquement le badge « Rupture de stock ». Voulez-vous que je prépare un e-mail au fournisseur ? »</>
                    ) : lowStock.length > 0 ? (
                      <>« Le stock de <b>{lowStock.length} produit{lowStock.length > 1 ? "s" : ""}</b> est bientôt épuisé. Pensez à réapprovisionner avant la rupture. »</>
                    ) : (
                      <>« Tout est sous contrôle 🎉 Je peux préparer un post pour vos réseaux, répondre aux e-mails, ou analyser vos ventes — dites-moi. »</>
                    )}
                    <div style={{ marginTop: 14 }}>
                      <button type="button" className="dash-abtn gold" onClick={() => setTab("assistant")}>Ouvrir l&apos;assistant</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---------------- COMMANDES ---------------- */}
        {tab === "commandes" && (
          <>
            <a href="/gestion/atelier" className="btn btn-gold" style={{ display: "inline-block", marginBottom: 14, textDecoration: "none" }}>
              🛠️ Atelier — tout à graver (tableaux + visuels + fichiers)
            </a>
            {!firebase?.connected && (
              <div className="notice">Connexion à ton application non active : les commandes ne peuvent pas être affichées. (Voir l'onglet Réglages.)</div>
            )}
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              {nbCmd} commande{nbCmd > 1 ? "s" : ""} · {aPreparer} à préparer. Marque « Expédiée » une fois envoyée.
              {nbTest > 0 ? ` · ${nbTest} test${nbTest > 1 ? "s" : ""} (non compté${nbTest > 1 ? "s" : ""}).` : ""}
            </p>
            {nbTest > 0 && (
              <button className="btn btn-outline" style={{ marginBottom: 14, color: "#b4452f", borderColor: "#e7b7ad" }} onClick={deleteAllTests}>
                🗑 Supprimer les {nbTest} commande{nbTest > 1 ? "s" : ""} test
              </button>
            )}
            {ordersReady && nbCmd === 0 && (
              <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucune commande pour le moment. Elles apparaîtront ici automatiquement après chaque vente.</p></div>
            )}

            {orders.length > 0 && (
              <>
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Rechercher (nom, e-mail, n° de commande, produit)…"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit", marginBottom: 10 }}
                />
                <div className="filters" style={{ justifyContent: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  {[
                    ["all", "Toutes"],
                    ["a_preparer", "À préparer"],
                    ["expediee", "Expédiées"],
                    ["livree", "Livrées"],
                    ["annulee", "Annulées / remboursées"],
                  ].map(([val, label]) => (
                    <button key={val} className={`filter-chip ${orderFilter === val ? "active" : ""}`} style={{ padding: "5px 12px", fontSize: "0.85rem" }} onClick={() => setOrderFilter(val)}>
                      {label}
                    </button>
                  ))}
                </div>
                {filteredOrders.length === 0 && (
                  <div className="admin-block"><p style={{ margin: 0, color: "var(--ink-soft)" }}>Aucune commande ne correspond à ce filtre.</p></div>
                )}
              </>
            )}

            {filteredOrders.map((o) => (
              <div key={o.id} className="admin-block">
                <div className="admin-row" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>
                    #{o.ref || o.id?.slice(-6)}{" "}
                    <span className="admin-cat">{fmtDate(o.createdAt)}</span>
                  </h3>
                  <span style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 700, color: "var(--gold-dark)" }}>{formatEuro(o.total)}</span>
                    {o.shippingPrice != null && (
                      <span style={{ display: "block", fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 400 }}>
                        dont livraison {formatEuro(o.shippingPrice)}
                      </span>
                    )}
                  </span>
                </div>
                {dupIds.has(o.id) && (
                  <div style={{ margin: "6px 0 0", padding: "7px 10px", background: "#fdecea", border: "1px solid #f1b0a8", borderRadius: 8, color: "#b3261e", fontSize: "0.82rem", fontWeight: 600 }}>
                    ⚠️ Possible doublon — même cliente et même(s) article(s) qu'une autre commande récente. Vérifie avant de fabriquer (ne fabrique qu'une fois si c'est le même paiement).
                  </div>
                )}
                {(() => { const r = refundStatus(o); return (
                  <div style={{ margin: "6px 0 0", padding: "6px 10px", background: r.bg, borderRadius: 8, color: r.color, fontSize: "0.8rem", fontWeight: 600 }}>{r.txt}</div>
                ); })()}
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
                {(o.surMesure || o.demande) ? (
                  <div style={{ margin: "0 0 10px", padding: "8px 12px", background: "#eef6ff", border: "1px solid #cfe0f0", borderRadius: 8, fontSize: "0.85rem", whiteSpace: "pre-line", color: "#2b5d8a" }}>
                    <strong>📋 Sur mesure{o.quoteNumber ? ` — devis ${o.quoteNumber}` : ""} · ce que le client a demandé :</strong>
                    {o.demande ? `\n${o.demande}` : "\nVoir le détail des articles ci-dessous."}
                  </div>
                ) : null}
                {/* Articles avec vignette : photo du produit (enregistrée sur la
                    commande, sinon retrouvée dans le catalogue par son identifiant)
                    et, si la cliente a envoyé une photo/un aperçu, la vignette atelier. */}
                <ul style={{ margin: "0 0 8px", padding: 0, listStyle: "none", fontSize: "0.9rem" }}>
                  {(o.items || []).map((it, i) => {
                    const photo = it.image || photoProduit(it.slug);
                    const apercu = apercuAtelier(o.spec, it.slug, i);
                    const couleur = couleurArticle(o.spec, it, i);
                    const reste = detailsSansCouleur(it, couleur);
                    return (
                      <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: i < (o.items.length - 1) ? "1px solid #f2ece0" : "none" }}>
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo} alt="" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, border: "1px solid #e7d3a1", flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 54, height: 54, borderRadius: 8, background: "#f3ece0", border: "1px solid #e7d3a1", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎁</span>
                        )}
                        {apercu && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={apercu} alt="Aperçu de la gravure" title="Ce que la cliente a demandé" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8, border: "2px solid var(--gold-dark, #a98935)", flexShrink: 0, background: "#fff" }} />
                        )}
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <strong>{it.quantity}× {it.name}</strong>
                          {couleur && (
                            <span style={{ display: "inline-block", marginLeft: 8, padding: "1px 9px", borderRadius: 999, background: "#f7ecd4", border: "1px solid #e0c88a", color: "#8a6d1f", fontSize: "0.8rem", fontWeight: 700, verticalAlign: "middle" }}>
                              {couleur}
                            </span>
                          )}
                          {reste ? <span style={{ display: "block", color: "var(--ink-soft)", fontSize: "0.85rem" }}>{reste}</span> : null}
                        </span>
                        <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{formatEuro(it.total)}</span>
                      </li>
                    );
                  })}
                </ul>
                {(() => {
                  const total = Number(o.total) || 0;
                  const remise = Number(o.discount) || 0;
                  const cagnotte = Number(o.cagnotteUsed) || 0;
                  // Sous-total AVANT remise : enregistré sur les commandes récentes,
                  // sinon reconstitué depuis les lignes (anciennes commandes).
                  const lignes = (o.items || []).reduce((s, it) => s + (Number(it.subtotal ?? it.total) || 0), 0);
                  const sousTotal = Number(o.subtotal) || lignes;
                  const shipping = o.shippingPrice != null ? Number(o.shippingPrice) : Math.max(0, total - lignes);
                  const ligne = (libelle, valeur, style = {}) => (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", gap: 12, ...style }}>
                      <span>{libelle}</span><span style={{ whiteSpace: "nowrap" }}>{valeur}</span>
                    </div>
                  );
                  return (
                    <div style={{ margin: "0 0 10px", padding: "8px 12px", background: "#faf6ee", border: "1px solid #ece0c4", borderRadius: 8, fontSize: "0.88rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--gold-dark)", marginBottom: 4 }}>Détail du prix</div>
                      {/* « avant remise » seulement quand la remise est connue :
                          les commandes passées avant cette amélioration n'ont pas
                          l'information, on n'affiche donc pas une mention trompeuse. */}
                      {ligne(`Sous-total produits${remise > 0 || cagnotte > 0 ? " (avant remise)" : ""}`, formatEuro(sousTotal))}
                      {remise > 0 && ligne(
                        `Remise${o.promoCode ? ` — code ${o.promoCode}` : ""}`,
                        `− ${formatEuro(remise)}`,
                        { color: "#b4452f" }
                      )}
                      {cagnotte > 0 && ligne("Cagnotte fidélité utilisée", `− ${formatEuro(cagnotte)}`, { color: "#b4452f" })}
                      {ligne(
                        `Livraison${o.shippingMethod ? ` — ${o.shippingMethod}` : ""}`,
                        shipping > 0 ? formatEuro(shipping) : "Offerte"
                      )}
                      {ligne("Total payé", formatEuro(total), {
                        padding: "4px 0 0", marginTop: 4, borderTop: "1px solid #ece0c4", fontWeight: 700, color: "var(--gold-dark)",
                      })}
                      {remise > 0 && (
                        <div style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                          Cette remise vous a coûté {formatEuro(remise)}.
                        </div>
                      )}
                    </div>
                  );
                })()}
                {(o.demandeGravure || o.messageGraver) && (
                  <div style={{ background: "#fbf3e6", border: "1px solid #e7d3a1", borderRadius: 8, padding: "10px 12px", margin: "0 0 10px", fontSize: "0.9rem", whiteSpace: "pre-line" }}>
                    <strong>✍️ Texte demandé par la cliente (à graver) :</strong>
                    {o.demandeGravure ? `\nPrécisions gravure : ${o.demandeGravure}` : ""}
                    {o.messageGraver ? `\nMessage / date à graver : ${o.messageGraver}` : ""}
                  </div>
                )}
                <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", position: "relative", borderColor: batUnread.includes(o.id) ? "#c9a24b" : undefined }}
                    onClick={() => { const opening = batOpen !== o.id; setBatOpen(opening ? o.id : null); if (opening) setBatUnread((u) => u.filter((x) => x !== o.id)); }}>
                    {batOpen === o.id ? "Fermer la discussion" : "💬 Aperçu à valider / discussion"}
                    {batUnread.includes(o.id) && batOpen !== o.id && (
                      <span style={{ marginLeft: 6, background: "#d64545", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                        Nouvelle réponse
                      </span>
                    )}
                  </button>
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                    onClick={() => setFicheOpen(ficheOpen === o.id ? null : o.id)}>
                    {ficheOpen === o.id ? "Fermer la fiche" : "🛠️ Fiche atelier (à graver)"}
                  </button>
                  {/* Fiche papier à emporter à la machine : ouvre la fiche puis
                     lance l'impression (seule la fiche s'imprime, voir globals.css). */}
                  <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                    onClick={() => {
                      setFicheOpen(o.id);
                      setTimeout(() => {
                        document.body.classList.add("impression-fiche");
                        window.print();
                        setTimeout(() => document.body.classList.remove("impression-fiche"), 300);
                      }, 250);
                    }}>
                    🖨️ Imprimer la fiche
                  </button>
                </div>
                {batOpen === o.id && <BatThread order={o} adminKey={key} />}
                {ficheOpen === o.id && (
                  <>
                    <FicheAtelier spec={o.spec} />
                    {/* Copie destinée UNIQUEMENT au papier, placée à la racine de
                       la page (portail) : ainsi l'impression ne sort que cette
                       feuille, sans les pages blanches du reste de l'écran. */}
                    <FichePapier order={o} fmtDate={fmtDate} />
                  </>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {o.test && (
                    <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 20, background: "#e7e0f0", color: "#5b4b8a", fontWeight: 600 }}>🧪 Commande test (non comptée)</span>
                  )}
                  <button className="btn btn-outline" style={{ padding: "3px 10px", fontSize: "0.8rem" }} onClick={() => toggleTestOrder(o)}>
                    {o.test ? "Ce n'est pas un test" : "🧪 Marquer comme test"}
                  </button>
                </div>
                {o.status === "remboursee" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "#8a6d3b" }}>↩ Remboursée</span>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => deleteOrder(o)}>
                      🗑 Supprimer
                    </button>
                  </div>
                ) : o.status === "annulee" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "#8a6d3b" }}>✕ Annulée</span>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                      Rétablir
                    </button>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => deleteOrder(o)}>
                      🗑 Supprimer
                    </button>
                  </div>
                ) : (
                  <>
                    {o.tracking && (
                      <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                        📦 Suivi : <strong>{o.tracking}</strong>{" "}
                        <a href="https://shipping.boxtal.com/fr/fr/centrale-expeditions/suivi" target="_blank" rel="noreferrer" title="Ouvrir le suivi sur Boxtal">suivre sur Boxtal</a>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: o.status === "livree" || o.status === "expediee" || o.status === "remise_main_propre" ? "#256b34" : o.status === "en_gravure" ? "#8a6d3b" : "#b4452f" }}>
                        {o.status === "livree" ? "✓✓ Livrée" : o.status === "remise_main_propre" ? "🤝 Remise en main propre" : o.status === "expediee" ? "✓ Expédiée" : o.status === "en_gravure" ? "✏️ En fabrication" : "● À préparer"}
                      </span>
                      <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 20, background: isLocked(o) ? "#f3e2dd" : "#e3f0e3", color: isLocked(o) ? "#b4452f" : "#256b34" }}>
                        {isLocked(o) ? "🔒 Verrouillée" : "🕒 Annulable (24 h)"}
                      </span>
                      {o.immediateStart && (
                        <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: 20, background: "#fbf3e6", color: "#8a6d3b" }}>
                          ⚡ Fabrication immédiate
                        </span>
                      )}

                      {(!o.status || o.status === "a_preparer") && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "en_gravure")}>
                          ✏️ Commencer la fabrication
                        </button>
                      )}
                      {o.status === "en_gravure" && (
                        <>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => shipOrder(o)}>
                            Marquer expédiée
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "remise_main_propre")}>
                            🤝 Remise en main propre
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                            Retour à préparer
                          </button>
                        </>
                      )}
                      {(!o.status || o.status === "a_preparer") && (
                        <>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => shipOrder(o)}>
                            Marquer expédiée
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "remise_main_propre")}>
                            🤝 Remise en main propre
                          </button>
                        </>
                      )}
                      {o.status === "expediee" && (
                        <>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => {
                            // Demande d'avis envoyée automatiquement à la cliente (si e-mail connu).
                            setOrderStatus(o.id, "livree", { notifyCustomer: Boolean(o.customerEmail) });
                          }}>
                            Marquer livrée
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "remise_main_propre")}>
                            🤝 Remise en main propre
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => shipOrder(o)}>
                            {o.tracking ? "Modifier le suivi" : "Ajouter un suivi"}
                          </button>
                          <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                            Remettre à préparer
                          </button>
                        </>
                      )}
                      {o.status === "livree" && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "expediee")}>
                          Remettre expédiée
                        </button>
                      )}
                      {o.status === "remise_main_propre" && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => setOrderStatus(o.id, "a_preparer")}>
                          Remettre à préparer
                        </button>
                      )}
                      {["expediee", "livree", "remise_main_propre"].includes(o.status) && o.customerEmail && (
                        <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#8a6d3b", borderColor: "#e2c67e" }} onClick={() => askReview(o)}>
                          ✉️ Demander un avis
                        </button>
                      )}

                      <button
                        className="btn btn-outline"
                        style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }}
                        onClick={() => refundOrder(o)}
                        disabled={refunding === o.id}
                      >
                        {refunding === o.id ? "Remboursement…" : "↩ Rembourser"}
                      </button>
                      <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={() => cancelOrder(o)}>
                        ✕ Annuler
                      </button>
                      <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem", color: "#b4452f", borderColor: "#e7b7ad" }} onClick={() => deleteOrder(o)}>
                        🗑 Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ---------------- STATISTIQUES ---------------- */}
        {tab === "stats" && (
          <>
            {/* Sélecteur d'année */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <strong>Année :</strong>
              {orderYears.map((y) => (
                <button key={y} className={`filter-chip ${statYear === y ? "active" : ""}`} style={{ padding: "4px 14px" }} onClick={() => setStatYear(y)}>{y}</button>
              ))}
            </div>

            {/* KPIs de l'année */}
            <div className="admin-block" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold-dark)" }}>{formatEuro(caYear)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>CA {statYear}</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{nbYear}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Commandes {statYear}</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatEuro(panierYear)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Panier moyen</div></div>
              <div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatEuro(caThisMonth)}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>CA ce mois-ci</div></div>
            </div>

            {/* Objectif du mois */}
            <div className="admin-block">
              <h3 style={{ marginTop: 0 }}>🎯 Objectif de CA du mois</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <input type="number" min="0" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="Ex. 1000" style={{ width: 120, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} />
                <span>€ / mois</span>
                <button className="btn btn-gold" style={{ padding: "6px 14px" }} onClick={saveGoal}>Enregistrer</button>
              </div>
              {siteSettings.salesGoal > 0 ? (
                (() => {
                  const pct = Math.min(100, Math.round((caThisMonth / siteSettings.salesGoal) * 100));
                  return (
                    <>
                      <div style={{ background: "#eee", borderRadius: 20, height: 22, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#256b34" : "var(--gold)", transition: "width .3s" }} />
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>
                        <strong>{formatEuro(caThisMonth)}</strong> / {formatEuro(siteSettings.salesGoal)} — <strong>{pct}%</strong>
                        {pct >= 100 ? " 🎉 Objectif atteint !" : ` · reste ${formatEuro(siteSettings.salesGoal - caThisMonth)}`}
                      </p>
                    </>
                  );
                })()
              ) : (
                <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "0.85rem" }}>Définis un objectif pour suivre ta progression du mois.</p>
              )}
            </div>

            {/* Graphique CA par mois */}
            <div className="admin-block">
              <h3 style={{ marginTop: 0 }}>Chiffre d'affaires par mois — {statYear}</h3>
              {caYear === 0 ? (
                <p style={{ color: "var(--ink-soft)", margin: 0 }}>Aucune vente sur cette année.</p>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, marginTop: 10 }}>
                    {monthlyCA.map((v, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }} title={`${MONTHS[i]} : ${formatEuro(v)} (${monthlyNb[i]} cmd)`}>
                        <span style={{ fontSize: "0.62rem", color: "var(--ink-soft)" }}>{v > 0 ? Math.round(v) : ""}</span>
                        <div style={{ width: "100%", height: `${Math.max(2, (v / maxMonthly) * 120)}px`, background: i === bestMonthIdx && v > 0 ? "var(--gold-dark)" : "var(--gold)", borderRadius: "4px 4px 0 0", opacity: v > 0 ? 1 : 0.25 }} />
                        <span style={{ fontSize: "0.62rem", color: "var(--ink-soft)" }}>{MONTHS[i]}</span>
                      </div>
                    ))}
                  </div>
                  {bestMonthIdx >= 0 && monthlyCA[bestMonthIdx] > 0 && (
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.82rem", marginBottom: 0 }}>Meilleur mois : <strong>{MONTHS[bestMonthIdx]}</strong> ({formatEuro(monthlyCA[bestMonthIdx])}).</p>
                  )}
                </>
              )}
            </div>

            {/* Clientes */}
            <div className="admin-block" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div><div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{clients.length}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Clientes</div></div>
              <div><div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{nouvelles}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Nouvelles</div></div>
              <div><div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#256b34" }}>{recurrentes}</div><div style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>Fidèles (≥2)</div></div>
            </div>

            {/* Best-sellers */}
            <div className="admin-block">
              <h3>Produits les plus vendus (toutes périodes)</h3>
              {bestSellers.length === 0 && <p style={{ color: "var(--ink-soft)", margin: 0 }}>Pas encore de ventes.</p>}
              {bestSellers.map((b) => (
                <div className="admin-row" key={b.name} style={{ gridTemplateColumns: "1fr auto auto", gap: 10 }}>
                  <span className="admin-variant">{b.name}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{b.qty} vendu{b.qty > 1 ? "s" : ""}</span>
                  <span className="admin-price">{formatEuro(b.total)}</span>
                </div>
              ))}
            </div>
            <div className="admin-block" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={() => {
                const rows = [["Réf", "Date", "Cliente", "Email", "Téléphone", "Statut", "Total (€)", "Articles"]];
                for (const o of orders) rows.push([o.ref || o.id?.slice(-6), fmtDate(o.createdAt), o.customerName || "", o.customerEmail || "", o.customerPhone || "", o.test ? "test" : (o.status || "a_preparer"), (Number(o.total) || 0).toFixed(2), (o.items || []).map((i) => `${i.quantity}x ${i.name}`).join(" | ")]);
                downloadCSV("ventes-nivcreation.csv", rows);
              }}>⬇️ Exporter les ventes (Excel/CSV)</button>
              <button className="btn btn-outline" onClick={() => {
                const rows = [["Cliente", "Email", "Téléphone", "Segment", "Nb commandes", "Total (€)", "1ère commande", "Dernière commande"]];
                for (const c of crmClients) rows.push([c.name, c.email, c.phone, c.segment, c.nb, Number(c.total).toFixed(2), c.first ? fmtDate(c.first) : "", c.last ? fmtDate(c.last) : ""]);
                downloadCSV("clientes-nivcreation.csv", rows);
              }}>⬇️ Exporter les clientes (Excel/CSV)</button>
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
              Calculé sur les commandes valides (hors tests, annulées et remboursées
              {nbRembourse > 0 || nbTest > 0 ? ` : ${nbRembourse} remboursée(s), ${nbTest} test(s) exclus` : ""}).
            </p>
          </>
        )}


        {/* ---------------- AVIS ---------------- */}
        {tab === "avis" && <ReviewsAdmin adminKey={key} products={editable} />}

        {/* ---------------- NEWSLETTER ---------------- */}
        {tab === "newsletter" && <NewsletterAdmin adminKey={key} />}

        {/* ---------------- DEVIS / FACTURES ---------------- */}
        {tab === "devis" && <QuotesAdmin adminKey={key} />}

        {/* ---------------- PRODUITS ---------------- */}
        {tab === "produits" && (
          <ProductsAdmin
            adminKey={key}
            products={editable}
            onReload={() => load(key)}
            stockBySlug={stockBySlug}
            onStockChange={updateRow}
            onStockSave={saveStock}
            stockSaved={saved}
            // Accessoires vendus en option (socles LED) : rangés avec leur
            // famille de produits, à la fin de la catégorie concernée.
            optionRows={rows.filter((r) => r.isOption)}
          />
        )}

        {/* ---------------- CATÉGORIES & ORDRE ---------------- */}
        {tab === "categories" && (
          <TaxonomyAdmin adminKey={key} products={editable} />
        )}

        {/* ---------------- ASSISTANT ---------------- */}
        {tab === "assistant" && (
          <AssistantAdmin adminKey={key} onReload={() => load(key)} />
        )}

        {tab === "agents" && (
          <div style={{ border: "1px solid var(--gold)", borderRadius: 16, padding: 24, background: "linear-gradient(135deg, #fffdf7, var(--cream))" }}>
            <h3 style={{ marginTop: 0, fontFamily: "Georgia, serif", color: "var(--gold)" }}>Centre de commande — Ton équipe d'agents</h3>
            <p style={{ color: "var(--ink-soft)" }}>
              Une page dédiée et professionnelle pour piloter tes agents IA : le Chef qui coordonne tout, l'agent e-mail, et les prochains à venir.
              Chaque agent a son espace de travail. Rien n'est envoyé sans ta validation.
            </p>
            <a href="/gestion/agents" className="btn btn-gold">Ouvrir le centre des agents →</a>
          </div>
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
            {(() => {
              const ORD = ["bijoux", "verres", "mariage", "deco", "cadeaux"];
              const rk = (c) => { const i = ORD.indexOf(c); return i < 0 ? 99 : i; };
              let lastCat = null;
              return Object.entries(grouped)
                .sort((a, b) => (rk(a[1].category) - rk(b[1].category)) || a[1].name.localeCompare(b[1].name))
                .map(([slug, g]) => {
                  const head = g.category !== lastCat; lastCat = g.category;
                  return (
              <div key={slug}>
                {head && <h2 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: "24px 0 8px", borderBottom: "2px solid #e7d9bd", paddingBottom: 4 }}>{getCategoryLabel(g.category)}</h2>}
                <div className="admin-block">
                <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {imgBySlug[slug] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgBySlug[slug]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee", flexShrink: 0 }} />
                  )}
                  <span>{g.name} <span className="admin-cat">{getCategoryLabel(g.category)}</span></span>
                </h3>
                {(() => {
                  // Stock groupé par couleur : un seul champ par stockId (recto + recto-verso partagés)
                  const counts = {};
                  g.items.forEach((r) => { const k = r.stockId || r.variantId; counts[k] = (counts[k] || 0) + 1; });
                  const seen = new Set();
                  return g.items.filter((r) => { const k = r.stockId || r.variantId; if (seen.has(k)) return false; seen.add(k); return true; }).map((r) => {
                    const k = r.stockId || r.variantId;
                    const grouped = counts[k] > 1;
                    // Stock partagé par plusieurs variantes : on affiche la partie
                    // COMMUNE à toutes (= la vraie couleur/option distinctive), pas
                    // seulement le dernier mot (qui donnait des doublons « Sans texte »).
                    let label = r.variantTitle;
                    if (grouped) {
                      const segs = g.items
                        .filter((x) => (x.stockId || x.variantId) === k)
                        .map((x) => (x.variantTitle || "").split("/").map((s) => s.trim()).filter(Boolean));
                      const common = (segs[0] || []).filter((s) => segs.every((arr) => arr.includes(s)));
                      // option seule (avec/sans gravure) sans couleur commune → pas de sous-étiquette
                      label = common.length ? common.join(" / ") : "";
                    }
                    return (
                      <div className="admin-row" key={k}>
                        {r.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6, border: "1px solid #eee", flexShrink: 0, marginRight: 8 }} />
                        )}
                        <span className="admin-variant">{label}</span>
                        <input className={`admin-stock ${typeof r.stock === "number" && r.stock === 0 ? "out" : ""}`}
                          type="number" min="0" placeholder="—" value={r.stock ?? ""}
                          onChange={(e) => updateRow(k, e.target.value === "" ? "" : Number(e.target.value))}
                          onBlur={(e) => saveStock(k, e.target.value)} />
                        <span className="admin-saved">{saved === k ? "✓" : ""}</span>
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
                  );
                });
            })()}
          </>
        )}

        {/* ---------------- PROMOTIONS ---------------- */}
        {tab === "promos" && (
          <>
            <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
              Toutes tes promotions au même endroit : <strong>codes promo</strong>, <strong>remise rapide par catégorie</strong>, et <strong>prix promo par produit</strong>.
            </p>

            <PromoCodesAdmin adminKey={key} />


            {/* Remise en lot par catégorie */}
            <div className="admin-block" style={{ display: "grid", gap: 10, border: "1px solid #e7d3a1", background: "#fbf4e6" }}>
              <h3 style={{ margin: 0 }}>🏷️ Remise rapide sur une catégorie</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Applique une vraie remise sur tous les produits d'une catégorie d'un coup (prix barré + réduction, et la cliente paie vraiment moins). {saved.startsWith("bulk-") ? "✓ Appliqué" : ""}
              </p>
              <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                Remise de
                <input type="number" min="0" max="90" value={bulkPct} style={{ width: 80 }} onChange={(e) => setBulkPct(Number(e.target.value))} />
                %
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {promoCats.map((c) => (
                  <button key={c} className="btn btn-gold" style={{ padding: "6px 14px", fontSize: "0.9rem" }} onClick={() => applyCategoryPromo(c, bulkPct)}>
                    Appliquer sur {getCategoryLabel(c)}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {promoCats.map((c) => (
                  <button key={c} className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={() => applyCategoryPromo(c, 0)}>
                    Retirer sur {getCategoryLabel(c)}
                  </button>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                ⚠️ Rappel : comme tu viens de monter les prix des bijoux, l'affichage « −20 % » se réfère à ce prix récent. Pour être pleinement en règle (loi Omnibus), l'idéal est d'avoir laissé ce prix en place ~30 jours avant d'annoncer la réduction. À toi de voir.
              </p>
            </div>

            <h2 style={{ fontFamily: "Georgia,serif", color: "var(--ink)", marginTop: 24 }}>💸 Prix promo par produit</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: 0 }}>
              Mets un prix promo (inférieur au prix normal) : le client verra le prix barré + la réduction. Vide = pas de promo.
            </p>
            {(() => {
              const ORD = ["bijoux", "verres", "mariage", "deco", "cadeaux"];
              const rk = (c) => { const i = ORD.indexOf(c); return i < 0 ? 99 : i; };
              let lastCat = null;
              return Object.entries(grouped)
                .sort((a, b) => (rk(a[1].category) - rk(b[1].category)) || a[1].name.localeCompare(b[1].name))
                .map(([slug, g]) => {
                  const head = g.category !== lastCat; lastCat = g.category;
                  return (
              <div key={slug}>
                {head && <h3 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: "20px 0 6px", borderBottom: "2px solid #e7d9bd", paddingBottom: 4 }}>{getCategoryLabel(g.category)}</h3>}
                <div className="admin-block">
                <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {imgBySlug[slug] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgBySlug[slug]} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #eee", flexShrink: 0 }} />
                  )}
                  <span>{g.name}</span>
                </h3>
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
              </div>
                  );
                });
            })()}
          </>
        )}

        {/* ---------------- APPARENCE ---------------- */}
        {tab === "apparence" && <AppearanceAdmin adminKey={key} />}

        {/* ---------------- LIVRAISON (tarifs) ---------------- */}
        {tab === "livraison" && <ShippingAdmin adminKey={key} />}

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

            {/* Clés API Boxtal (point relais) — rangées ici avec les autres. */}
            <BoxtalKeys adminKey={key} />

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
      </div>
    </section>
  );
}
